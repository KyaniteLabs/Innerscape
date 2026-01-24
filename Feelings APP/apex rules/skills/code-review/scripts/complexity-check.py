#!/usr/bin/env python3
"""
Code Complexity Analyzer

Analyzes code complexity metrics.

Usage:
    python complexity-check.py <path> [--threshold N]
"""

import argparse
import json
import re
from pathlib import Path
from typing import Dict, List, Tuple

# Thresholds
DEFAULT_THRESHOLDS = {
    "cyclomatic_complexity": {"warning": 10, "critical": 20},
    "function_length": {"warning": 50, "critical": 100},
    "nesting_depth": {"warning": 4, "critical": 6},
    "parameters": {"warning": 5, "critical": 7},
}


def count_complexity_js_ts(content: str) -> List[Dict]:
    """Analyze JavaScript/TypeScript complexity."""
    results = []
    lines = content.split("\n")
    
    # Find functions
    function_pattern = re.compile(
        r'(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(|(\w+)\s*\([^)]*\)\s*(?::\s*\w+)?\s*\{)'
    )
    
    current_function = None
    brace_depth = 0
    function_start = 0
    complexity = 0
    max_depth = 0
    current_depth = 0
    
    for i, line in enumerate(lines):
        # Track braces
        opens = line.count("{")
        closes = line.count("}")
        
        # Check for function start
        match = function_pattern.search(line)
        if match and current_function is None:
            current_function = match.group(1) or match.group(2) or match.group(3)
            function_start = i
            complexity = 1
            max_depth = 0
            current_depth = 0
        
        if current_function:
            brace_depth += opens - closes
            current_depth += opens
            current_depth = max(0, current_depth - closes)
            max_depth = max(max_depth, current_depth)
            
            # Count complexity increments
            complexity_patterns = [
                r'\bif\s*\(',
                r'\belse\s+if\s*\(',
                r'\bfor\s*\(',
                r'\bwhile\s*\(',
                r'\bcase\s+',
                r'\bcatch\s*\(',
                r'\&\&',
                r'\|\|',
                r'\?\s*[^:]+\s*:',  # Ternary
            ]
            for pattern in complexity_patterns:
                complexity += len(re.findall(pattern, line))
            
            # Check for function end
            if brace_depth <= 0 and opens < closes:
                length = i - function_start + 1
                
                # Count parameters
                param_match = re.search(r'\(([^)]*)\)', lines[function_start])
                param_count = 0
                if param_match:
                    params = param_match.group(1).strip()
                    if params:
                        param_count = len([p for p in params.split(",") if p.strip()])
                
                results.append({
                    "name": current_function,
                    "line": function_start + 1,
                    "length": length,
                    "complexity": complexity,
                    "max_nesting": max_depth,
                    "parameters": param_count,
                })
                
                current_function = None
                brace_depth = 0
    
    return results


def count_complexity_python(content: str) -> List[Dict]:
    """Analyze Python complexity."""
    results = []
    lines = content.split("\n")
    
    # Find functions
    function_pattern = re.compile(r'^(\s*)(?:async\s+)?def\s+(\w+)\s*\(([^)]*)\)')
    
    current_function = None
    function_indent = 0
    function_start = 0
    complexity = 0
    max_depth = 0
    base_indent = 0
    param_count = 0
    
    for i, line in enumerate(lines):
        if not line.strip():
            continue
        
        # Get current indentation
        current_indent = len(line) - len(line.lstrip())
        
        # Check for function start
        match = function_pattern.match(line)
        if match:
            # Save previous function if exists
            if current_function:
                length = i - function_start
                results.append({
                    "name": current_function,
                    "line": function_start + 1,
                    "length": length,
                    "complexity": complexity,
                    "max_nesting": max_depth,
                    "parameters": param_count,
                })
            
            function_indent = len(match.group(1))
            current_function = match.group(2)
            function_start = i
            complexity = 1
            max_depth = 0
            base_indent = function_indent
            
            # Count parameters
            params = match.group(3).strip()
            param_count = 0
            if params:
                param_count = len([p for p in params.split(",") if p.strip() and p.strip() != "self"])
            
            continue
        
        if current_function:
            # Check if we've exited the function
            if current_indent <= function_indent and line.strip() and not line.strip().startswith("#"):
                # Function ended
                length = i - function_start
                results.append({
                    "name": current_function,
                    "line": function_start + 1,
                    "length": length,
                    "complexity": complexity,
                    "max_nesting": max_depth,
                    "parameters": param_count,
                })
                
                # Check if this line starts a new function
                match = function_pattern.match(line)
                if match:
                    function_indent = len(match.group(1))
                    current_function = match.group(2)
                    function_start = i
                    complexity = 1
                    max_depth = 0
                    base_indent = function_indent
                    params = match.group(3).strip()
                    param_count = 0
                    if params:
                        param_count = len([p for p in params.split(",") if p.strip() and p.strip() != "self"])
                else:
                    current_function = None
                continue
            
            # Track nesting depth
            depth = (current_indent - base_indent) // 4
            max_depth = max(max_depth, depth)
            
            # Count complexity
            complexity_patterns = [
                r'\bif\s+',
                r'\belif\s+',
                r'\bfor\s+',
                r'\bwhile\s+',
                r'\bexcept\s*:?',
                r'\band\b',
                r'\bor\b',
            ]
            for pattern in complexity_patterns:
                complexity += len(re.findall(pattern, line))
    
    # Don't forget the last function
    if current_function:
        length = len(lines) - function_start
        results.append({
            "name": current_function,
            "line": function_start + 1,
            "length": length,
            "complexity": complexity,
            "max_nesting": max_depth,
            "parameters": param_count,
        })
    
    return results


def analyze_file(filepath: Path, thresholds: Dict) -> Dict:
    """Analyze a single file."""
    try:
        content = filepath.read_text(encoding="utf-8", errors="ignore")
    except Exception as e:
        return {"error": str(e), "file": str(filepath)}
    
    ext = filepath.suffix.lower()
    
    if ext in [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"]:
        functions = count_complexity_js_ts(content)
    elif ext in [".py", ".pyw"]:
        functions = count_complexity_python(content)
    else:
        return {"file": str(filepath), "functions": [], "issues": []}
    
    # Check against thresholds
    issues = []
    for func in functions:
        if func["complexity"] >= thresholds["cyclomatic_complexity"]["critical"]:
            issues.append({
                "severity": "critical",
                "function": func["name"],
                "line": func["line"],
                "metric": "complexity",
                "value": func["complexity"],
                "threshold": thresholds["cyclomatic_complexity"]["critical"],
            })
        elif func["complexity"] >= thresholds["cyclomatic_complexity"]["warning"]:
            issues.append({
                "severity": "warning",
                "function": func["name"],
                "line": func["line"],
                "metric": "complexity",
                "value": func["complexity"],
                "threshold": thresholds["cyclomatic_complexity"]["warning"],
            })
        
        if func["length"] >= thresholds["function_length"]["critical"]:
            issues.append({
                "severity": "critical",
                "function": func["name"],
                "line": func["line"],
                "metric": "length",
                "value": func["length"],
                "threshold": thresholds["function_length"]["critical"],
            })
        elif func["length"] >= thresholds["function_length"]["warning"]:
            issues.append({
                "severity": "warning",
                "function": func["name"],
                "line": func["line"],
                "metric": "length",
                "value": func["length"],
                "threshold": thresholds["function_length"]["warning"],
            })
        
        if func["max_nesting"] >= thresholds["nesting_depth"]["critical"]:
            issues.append({
                "severity": "critical",
                "function": func["name"],
                "line": func["line"],
                "metric": "nesting",
                "value": func["max_nesting"],
                "threshold": thresholds["nesting_depth"]["critical"],
            })
        elif func["max_nesting"] >= thresholds["nesting_depth"]["warning"]:
            issues.append({
                "severity": "warning",
                "function": func["name"],
                "line": func["line"],
                "metric": "nesting",
                "value": func["max_nesting"],
                "threshold": thresholds["nesting_depth"]["warning"],
            })
    
    return {
        "file": str(filepath),
        "functions": functions,
        "issues": issues,
    }


def format_text_output(results: List[Dict]) -> str:
    """Format results as text."""
    lines = ["Complexity Analysis", "=" * 50, ""]
    
    all_issues = []
    for result in results:
        if "error" in result:
            lines.append(f"Error scanning {result['file']}: {result['error']}")
            continue
        
        if result["issues"]:
            all_issues.extend(result["issues"])
    
    if not all_issues:
        return "✓ No complexity issues found."
    
    # Group by severity
    critical = [i for i in all_issues if i["severity"] == "critical"]
    warnings = [i for i in all_issues if i["severity"] == "warning"]
    
    if critical:
        lines.append("🔴 CRITICAL")
        lines.append("-" * 40)
        for issue in critical:
            lines.append(f"  {issue['function']} (line {issue['line']})")
            lines.append(f"    {issue['metric']}: {issue['value']} (threshold: {issue['threshold']})")
        lines.append("")
    
    if warnings:
        lines.append("🟡 WARNING")
        lines.append("-" * 40)
        for issue in warnings:
            lines.append(f"  {issue['function']} (line {issue['line']})")
            lines.append(f"    {issue['metric']}: {issue['value']} (threshold: {issue['threshold']})")
        lines.append("")
    
    lines.extend([
        "=" * 50,
        f"Critical: {len(critical)}",
        f"Warnings: {len(warnings)}",
    ])
    
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Analyze code complexity")
    parser.add_argument("path", help="File or directory to analyze")
    parser.add_argument("--format", choices=["text", "json"], default="text")
    parser.add_argument("--threshold", type=int, help="Custom complexity threshold")
    args = parser.parse_args()
    
    path = Path(args.path)
    if not path.exists():
        print(f"Error: Path '{args.path}' does not exist")
        return 1
    
    thresholds = DEFAULT_THRESHOLDS.copy()
    if args.threshold:
        thresholds["cyclomatic_complexity"]["warning"] = args.threshold
        thresholds["cyclomatic_complexity"]["critical"] = args.threshold * 2
    
    results = []
    if path.is_file():
        results.append(analyze_file(path, thresholds))
    else:
        for filepath in path.rglob("*"):
            if filepath.is_file() and filepath.suffix.lower() in [".js", ".jsx", ".ts", ".tsx", ".py"]:
                # Skip common directories
                if any(skip in str(filepath) for skip in ["node_modules", ".git", "__pycache__", "dist"]):
                    continue
                results.append(analyze_file(filepath, thresholds))
    
    if args.format == "json":
        print(json.dumps({"results": results}, indent=2))
    else:
        print(format_text_output(results))
    
    # Exit code based on critical issues
    has_critical = any(
        any(i["severity"] == "critical" for i in r.get("issues", []))
        for r in results
    )
    return 1 if has_critical else 0


if __name__ == "__main__":
    exit(main())
