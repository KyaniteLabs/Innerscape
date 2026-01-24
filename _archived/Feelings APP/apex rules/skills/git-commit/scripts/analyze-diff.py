#!/usr/bin/env python3
"""
Git Diff Analyzer

Analyzes staged git changes to understand the nature of modifications.

Usage:
    python analyze-diff.py [--staged] [--all]
"""

import argparse
import re
import subprocess
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Tuple

# File patterns for categorization
FILE_PATTERNS = {
    "test": [
        r".*\.test\.[jt]sx?$",
        r".*\.spec\.[jt]sx?$",
        r".*_test\.py$",
        r".*_test\.go$",
        r"tests?/.*",
        r"__tests__/.*",
    ],
    "docs": [
        r".*\.md$",
        r"docs?/.*",
        r".*README.*",
        r".*CHANGELOG.*",
    ],
    "config": [
        r".*\.config\.[jt]s$",
        r".*\.json$",
        r".*\.ya?ml$",
        r".*\.toml$",
        r"\..*rc$",
        r"Dockerfile.*",
        r"docker-compose.*",
    ],
    "ci": [
        r"\.github/.*",
        r"\.gitlab-ci.*",
        r"\.circleci/.*",
        r"Jenkinsfile",
    ],
    "style": [
        r".*\.css$",
        r".*\.scss$",
        r".*\.less$",
    ],
}

# Commit type detection patterns
CHANGE_INDICATORS = {
    "feat": [
        r"add(ed|ing)?\s",
        r"implement(ed|ing)?\s",
        r"creat(e|ed|ing)\s",
        r"new\s+(feature|component|endpoint)",
    ],
    "fix": [
        r"fix(ed|ing|es)?\s",
        r"bug\s*fix",
        r"resolv(e|ed|ing)\s",
        r"patch(ed|ing)?\s",
        r"correct(ed|ing)?\s",
    ],
    "refactor": [
        r"refactor(ed|ing)?\s",
        r"restructur(e|ed|ing)\s",
        r"reorganiz(e|ed|ing)\s",
        r"clean(ed|ing)?\s*up",
        r"extract(ed|ing)?\s",
    ],
    "perf": [
        r"optimi[zs](e|ed|ing)\s",
        r"improv(e|ed|ing)\s*performance",
        r"speed\s*up",
        r"faster\s",
    ],
}


def run_git_command(args: List[str]) -> Tuple[str, int]:
    """Run a git command and return output."""
    try:
        result = subprocess.run(
            ["git"] + args,
            capture_output=True,
            text=True
        )
        return result.stdout, result.returncode
    except FileNotFoundError:
        return "", 1


def get_staged_files() -> List[str]:
    """Get list of staged files."""
    output, code = run_git_command(["diff", "--cached", "--name-only"])
    if code != 0:
        return []
    return [f for f in output.strip().split("\n") if f]


def get_diff_stats() -> Dict[str, int]:
    """Get diff statistics."""
    output, code = run_git_command(["diff", "--cached", "--numstat"])
    if code != 0:
        return {"insertions": 0, "deletions": 0}
    
    insertions = 0
    deletions = 0
    
    for line in output.strip().split("\n"):
        if not line:
            continue
        parts = line.split("\t")
        if len(parts) >= 2:
            try:
                insertions += int(parts[0]) if parts[0] != "-" else 0
                deletions += int(parts[1]) if parts[1] != "-" else 0
            except ValueError:
                pass
    
    return {"insertions": insertions, "deletions": deletions}


def categorize_file(filepath: str) -> str:
    """Categorize a file based on its path."""
    for category, patterns in FILE_PATTERNS.items():
        for pattern in patterns:
            if re.match(pattern, filepath, re.IGNORECASE):
                return category
    return "source"


def get_diff_content() -> str:
    """Get the actual diff content."""
    output, code = run_git_command(["diff", "--cached"])
    return output if code == 0 else ""


def detect_change_type(diff_content: str, file_categories: Dict[str, List[str]]) -> str:
    """Detect the primary type of change."""
    # Check file-based indicators first
    if file_categories.get("test") and not file_categories.get("source"):
        return "test"
    if file_categories.get("docs") and not file_categories.get("source"):
        return "docs"
    if file_categories.get("ci") and not file_categories.get("source"):
        return "ci"
    if file_categories.get("config") and not file_categories.get("source"):
        return "chore"
    if file_categories.get("style") and not file_categories.get("source"):
        return "style"
    
    # Check diff content for indicators
    diff_lower = diff_content.lower()
    
    for change_type, patterns in CHANGE_INDICATORS.items():
        for pattern in patterns:
            if re.search(pattern, diff_lower):
                return change_type
    
    # Default based on ratio
    stats = get_diff_stats()
    if stats["insertions"] > stats["deletions"] * 2:
        return "feat"
    elif stats["deletions"] > stats["insertions"] * 2:
        return "refactor"
    
    return "chore"


def detect_scope(files: List[str]) -> str:
    """Detect the scope from file paths."""
    if not files:
        return ""
    
    # Find common path components
    paths = [Path(f).parts for f in files]
    
    if len(paths) == 1:
        # Single file - use parent directory
        if len(paths[0]) > 1:
            return paths[0][-2]  # Parent directory
        return paths[0][0].replace(".", "")
    
    # Multiple files - find common prefix
    common = []
    for parts in zip(*paths):
        if len(set(parts)) == 1:
            common.append(parts[0])
        else:
            break
    
    if common:
        # Filter out generic directories
        generic = {"src", "lib", "app", "packages"}
        filtered = [c for c in common if c not in generic]
        if filtered:
            return filtered[-1]
        if common[-1] not in generic:
            return common[-1]
    
    # Group by top-level directory
    top_dirs = defaultdict(int)
    for parts in paths:
        if parts:
            top_dirs[parts[0]] += 1
    
    if top_dirs:
        return max(top_dirs, key=top_dirs.get)
    
    return ""


def analyze() -> Dict:
    """Analyze staged changes."""
    files = get_staged_files()
    
    if not files:
        return {
            "error": "No staged changes found. Use 'git add' first.",
            "files": [],
        }
    
    stats = get_diff_stats()
    diff_content = get_diff_content()
    
    # Categorize files
    file_categories = defaultdict(list)
    for f in files:
        category = categorize_file(f)
        file_categories[category].append(f)
    
    # Detect change type and scope
    change_type = detect_change_type(diff_content, dict(file_categories))
    scope = detect_scope(files)
    
    return {
        "files": files,
        "file_count": len(files),
        "insertions": stats["insertions"],
        "deletions": stats["deletions"],
        "categories": dict(file_categories),
        "change_type": change_type,
        "scope": scope,
        "confidence": "high" if len(files) <= 5 else "medium",
    }


def format_output(analysis: Dict) -> str:
    """Format analysis output."""
    if "error" in analysis:
        return f"Error: {analysis['error']}"
    
    lines = [
        f"Files Changed: {analysis['file_count']}",
        f"Insertions: {analysis['insertions']}",
        f"Deletions: {analysis['deletions']}",
        "",
        "Changes by Category:",
    ]
    
    for category, files in analysis["categories"].items():
        file_list = ", ".join(files[:3])
        if len(files) > 3:
            file_list += f", +{len(files) - 3} more"
        lines.append(f"  {category.capitalize():12} {len(files)} file(s) ({file_list})")
    
    lines.extend([
        "",
        f"Primary Change Type: {analysis['change_type']}",
        f"Suggested Scope: {analysis['scope'] or '(none)'}",
        f"Confidence: {analysis['confidence']}",
    ])
    
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Analyze git diff")
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    args = parser.parse_args()
    
    analysis = analyze()
    
    if args.json:
        import json
        print(json.dumps(analysis, indent=2))
    else:
        print(format_output(analysis))
    
    return 0 if "error" not in analysis else 1


if __name__ == "__main__":
    exit(main())
