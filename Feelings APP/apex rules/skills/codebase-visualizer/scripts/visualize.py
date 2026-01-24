#!/usr/bin/env python3
"""
Codebase Visualizer

Generates visual representations of codebase structure.

Usage:
    python visualize.py <path> [options]

Options:
    --format        Output format: text, html, json, markdown (default: text)
    --output        Output file path (default: stdout)
    --exclude       Comma-separated patterns to exclude
    --extensions    Comma-separated extensions to include
    --include-hidden Include hidden files/directories
    --max-depth     Maximum directory depth (default: unlimited)
"""

import argparse
import json
import os
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# File extension categories
EXTENSION_CATEGORIES = {
    "TypeScript": [".ts", ".tsx"],
    "JavaScript": [".js", ".jsx", ".mjs", ".cjs"],
    "Python": [".py", ".pyw"],
    "CSS/SCSS": [".css", ".scss", ".sass", ".less"],
    "HTML": [".html", ".htm"],
    "Markdown": [".md", ".mdx"],
    "JSON": [".json"],
    "YAML": [".yml", ".yaml"],
    "Rust": [".rs"],
    "Go": [".go"],
    "Ruby": [".rb"],
    "Java": [".java"],
    "C/C++": [".c", ".cpp", ".h", ".hpp"],
    "Shell": [".sh", ".bash", ".zsh"],
}

# Default exclusions
DEFAULT_EXCLUSIONS = [
    "node_modules",
    ".git",
    "__pycache__",
    ".venv",
    "venv",
    "dist",
    "build",
    ".next",
    ".cache",
    "coverage",
    ".DS_Store",
]


def get_category(extension: str) -> str:
    """Get category for a file extension."""
    ext = extension.lower()
    for category, extensions in EXTENSION_CATEGORIES.items():
        if ext in extensions:
            return category
    return "Other"


def should_exclude(path: Path, exclusions: List[str], include_hidden: bool) -> bool:
    """Check if path should be excluded."""
    name = path.name
    
    # Check hidden
    if not include_hidden and name.startswith("."):
        return True
    
    # Check exclusion patterns
    for pattern in exclusions:
        if pattern.startswith("*"):
            if name.endswith(pattern[1:]):
                return True
        elif pattern in str(path):
            return True
    
    return False


def scan_directory(
    root: Path,
    exclusions: List[str],
    extensions: Optional[List[str]],
    include_hidden: bool,
    max_depth: Optional[int],
    current_depth: int = 0
) -> Dict:
    """Scan directory and collect file information."""
    result = {
        "name": root.name or str(root),
        "path": str(root),
        "type": "directory",
        "children": [],
        "total_size": 0,
        "file_count": 0,
    }
    
    if max_depth is not None and current_depth >= max_depth:
        return result
    
    try:
        items = sorted(root.iterdir(), key=lambda x: (not x.is_dir(), x.name.lower()))
    except PermissionError:
        return result
    
    for item in items:
        if should_exclude(item, exclusions, include_hidden):
            continue
        
        if item.is_dir():
            child = scan_directory(
                item, exclusions, extensions, include_hidden,
                max_depth, current_depth + 1
            )
            if child["file_count"] > 0:  # Only include non-empty directories
                result["children"].append(child)
                result["total_size"] += child["total_size"]
                result["file_count"] += child["file_count"]
        
        elif item.is_file():
            ext = item.suffix.lower()
            if extensions and ext not in extensions:
                continue
            
            try:
                size = item.stat().st_size
            except (OSError, PermissionError):
                size = 0
            
            result["children"].append({
                "name": item.name,
                "path": str(item),
                "type": "file",
                "size": size,
                "extension": ext,
                "category": get_category(ext),
            })
            result["total_size"] += size
            result["file_count"] += 1
    
    return result


def format_size(size: int) -> str:
    """Format size in human-readable format."""
    for unit in ["B", "KB", "MB", "GB"]:
        if size < 1024:
            return f"{size:.1f}{unit}" if size >= 10 else f"{size:.2f}{unit}"
        size /= 1024
    return f"{size:.2f}TB"


def generate_tree(data: Dict, prefix: str = "", is_last: bool = True) -> str:
    """Generate ASCII tree representation."""
    lines = []
    connector = "└── " if is_last else "├── "
    
    if data["type"] == "directory":
        size_info = f" [{data['file_count']} files, {format_size(data['total_size'])}]"
        lines.append(f"{prefix}{connector}{data['name']}/{size_info}")
        
        new_prefix = prefix + ("    " if is_last else "│   ")
        children = data.get("children", [])
        
        for i, child in enumerate(children):
            is_child_last = i == len(children) - 1
            lines.append(generate_tree(child, new_prefix, is_child_last))
    else:
        size_info = f" ({format_size(data['size'])})"
        lines.append(f"{prefix}{connector}{data['name']}{size_info}")
    
    return "\n".join(lines)


def generate_size_distribution(data: Dict) -> str:
    """Generate size distribution bar chart."""
    lines = ["", "Size Distribution:", ""]
    
    # Collect directory sizes
    dirs = []
    for child in data.get("children", []):
        if child["type"] == "directory":
            dirs.append((child["name"], child["total_size"]))
    
    if not dirs:
        return "No subdirectories found."
    
    # Sort by size
    dirs.sort(key=lambda x: x[1], reverse=True)
    max_size = dirs[0][1] if dirs else 1
    total_size = sum(d[1] for d in dirs)
    
    for name, size in dirs[:10]:  # Top 10
        bar_width = int((size / max_size) * 30) if max_size > 0 else 0
        bar = "█" * bar_width
        percentage = (size / total_size * 100) if total_size > 0 else 0
        lines.append(f"{bar:<30} {name:<20} ({format_size(size)}, {percentage:.1f}%)")
    
    return "\n".join(lines)


def generate_type_breakdown(data: Dict) -> str:
    """Generate file type breakdown."""
    lines = ["", "Language Distribution:", ""]
    
    # Collect file types
    categories = defaultdict(lambda: {"count": 0, "size": 0})
    
    def collect_files(node):
        if node["type"] == "file":
            cat = node.get("category", "Other")
            categories[cat]["count"] += 1
            categories[cat]["size"] += node.get("size", 0)
        else:
            for child in node.get("children", []):
                collect_files(child)
    
    collect_files(data)
    
    if not categories:
        return "No files found."
    
    # Sort by count
    sorted_cats = sorted(categories.items(), key=lambda x: x[1]["count"], reverse=True)
    total_files = sum(c["count"] for _, c in sorted_cats)
    max_count = sorted_cats[0][1]["count"] if sorted_cats else 1
    
    for cat, info in sorted_cats:
        bar_width = int((info["count"] / max_count) * 20) if max_count > 0 else 0
        bar = "█" * bar_width
        percentage = (info["count"] / total_files * 100) if total_files > 0 else 0
        lines.append(f"{cat:<12} {bar:<20} {percentage:>5.1f}%  ({info['count']} files)")
    
    return "\n".join(lines)


def generate_text_output(data: Dict) -> str:
    """Generate complete text output."""
    sections = [
        f"Codebase: {data['name']}",
        f"Total: {data['file_count']} files, {format_size(data['total_size'])}",
        "",
        "=" * 60,
        "",
        generate_tree(data),
        "",
        "=" * 60,
        generate_size_distribution(data),
        "",
        "=" * 60,
        generate_type_breakdown(data),
    ]
    return "\n".join(sections)


def generate_html_output(data: Dict) -> str:
    """Generate interactive HTML output."""
    tree_json = json.dumps(data, indent=2)
    
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Codebase Visualization - {data['name']}</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #1a1a2e; color: #eee; padding: 2rem;
        }}
        h1 {{ margin-bottom: 1rem; }}
        .stats {{ 
            display: flex; gap: 2rem; margin-bottom: 2rem;
            background: #252540; padding: 1rem; border-radius: 8px;
        }}
        .stat {{ text-align: center; }}
        .stat-value {{ font-size: 2rem; font-weight: bold; color: #6c63ff; }}
        .tree {{ 
            background: #252540; padding: 1rem; border-radius: 8px;
            font-family: 'JetBrains Mono', monospace; font-size: 14px;
            overflow-x: auto;
        }}
        .dir {{ cursor: pointer; }}
        .dir:hover {{ background: #333355; }}
        .file {{ color: #888; }}
        .size {{ color: #6c63ff; margin-left: 1rem; }}
        details {{ margin-left: 1.5rem; }}
        summary {{ cursor: pointer; padding: 2px 0; }}
        summary:hover {{ background: #333355; }}
    </style>
</head>
<body>
    <h1>📁 {data['name']}</h1>
    
    <div class="stats">
        <div class="stat">
            <div class="stat-value">{data['file_count']}</div>
            <div>Files</div>
        </div>
        <div class="stat">
            <div class="stat-value">{format_size(data['total_size'])}</div>
            <div>Total Size</div>
        </div>
    </div>
    
    <div class="tree" id="tree"></div>
    
    <script>
        const data = {tree_json};
        
        function formatSize(bytes) {{
            const units = ['B', 'KB', 'MB', 'GB'];
            let i = 0;
            while (bytes >= 1024 && i < units.length - 1) {{
                bytes /= 1024;
                i++;
            }}
            return bytes.toFixed(1) + units[i];
        }}
        
        function renderNode(node) {{
            if (node.type === 'file') {{
                return `<div class="file">📄 ${{node.name}}<span class="size">${{formatSize(node.size)}}</span></div>`;
            }}
            
            const children = node.children.map(renderNode).join('');
            return `<details open>
                <summary class="dir">📁 ${{node.name}} <span class="size">${{node.file_count}} files, ${{formatSize(node.total_size)}}</span></summary>
                ${{children}}
            </details>`;
        }}
        
        document.getElementById('tree').innerHTML = 
            data.children.map(renderNode).join('');
    </script>
</body>
</html>"""


def generate_markdown_output(data: Dict) -> str:
    """Generate markdown output."""
    lines = [
        f"# Codebase: {data['name']}",
        "",
        f"**Total:** {data['file_count']} files, {format_size(data['total_size'])}",
        "",
        "## Structure",
        "",
        "```",
        generate_tree(data),
        "```",
        "",
        "## Size Distribution",
        "",
        generate_size_distribution(data),
        "",
        "## Language Distribution",
        "",
        generate_type_breakdown(data),
    ]
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Visualize codebase structure")
    parser.add_argument("path", help="Path to codebase root")
    parser.add_argument("--format", choices=["text", "html", "json", "markdown"],
                        default="text", help="Output format")
    parser.add_argument("--output", "-o", help="Output file path")
    parser.add_argument("--exclude", help="Comma-separated exclusion patterns")
    parser.add_argument("--extensions", help="Comma-separated extensions to include")
    parser.add_argument("--include-hidden", action="store_true",
                        help="Include hidden files")
    parser.add_argument("--max-depth", type=int, help="Maximum directory depth")
    
    args = parser.parse_args()
    
    # Process arguments
    root = Path(args.path).resolve()
    if not root.exists():
        print(f"Error: Path '{args.path}' does not exist")
        return 1
    
    exclusions = DEFAULT_EXCLUSIONS.copy()
    if args.exclude:
        exclusions.extend(args.exclude.split(","))
    
    extensions = None
    if args.extensions:
        extensions = [f".{e.strip('.')}" for e in args.extensions.split(",")]
    
    # Scan directory
    data = scan_directory(
        root, exclusions, extensions,
        args.include_hidden, args.max_depth
    )
    
    # Generate output
    if args.format == "text":
        output = generate_text_output(data)
    elif args.format == "html":
        output = generate_html_output(data)
    elif args.format == "json":
        output = json.dumps(data, indent=2)
    elif args.format == "markdown":
        output = generate_markdown_output(data)
    
    # Write output
    if args.output:
        with open(args.output, "w") as f:
            f.write(output)
        print(f"Output written to {args.output}")
    else:
        print(output)
    
    return 0


if __name__ == "__main__":
    exit(main())
