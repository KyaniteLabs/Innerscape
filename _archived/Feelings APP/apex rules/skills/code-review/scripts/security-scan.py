#!/usr/bin/env python3
"""
Security Scanner

Scans code for common security vulnerabilities.

Usage:
    python security-scan.py <path> [--format json|text]
"""

import argparse
import json
import re
from pathlib import Path
from typing import Dict, List, Tuple

# Security patterns to detect
SECURITY_PATTERNS = {
    "hardcoded_secret": {
        "patterns": [
            r'(?i)(api[_-]?key|apikey|secret[_-]?key|secretkey|password|passwd|pwd)\s*[:=]\s*["\'][^"\']{8,}["\']',
            r'(?i)(auth[_-]?token|access[_-]?token|bearer)\s*[:=]\s*["\'][^"\']{20,}["\']',
            r'(?i)(?:^|[^a-z])sk[_-][a-zA-Z0-9]{20,}',  # OpenAI-style keys
            r'(?i)(?:^|[^a-z])pk[_-][a-zA-Z0-9]{20,}',  # Stripe-style keys
            r'-----BEGIN (?:RSA |EC )?PRIVATE KEY-----',
        ],
        "severity": "critical",
        "description": "Potential hardcoded secret or credential",
    },
    "sql_injection": {
        "patterns": [
            r'(?i)(?:execute|query|raw)\s*\(\s*["\'].*?\+.*?["\']',
            r'(?i)(?:execute|query|raw)\s*\(\s*f["\']',
            r'(?i)(?:execute|query|raw)\s*\(\s*`.*?\$\{',
            r'(?i)\.query\s*\(\s*[`"\'].*?(?:\$\{|\+).*?[`"\']',
        ],
        "severity": "critical",
        "description": "Potential SQL injection vulnerability",
    },
    "xss": {
        "patterns": [
            r'(?i)innerHTML\s*=',
            r'(?i)outerHTML\s*=',
            r'(?i)document\.write\s*\(',
            r'(?i)dangerouslySetInnerHTML',
            r'(?i)v-html\s*=',
        ],
        "severity": "high",
        "description": "Potential XSS vulnerability - unsafe HTML injection",
    },
    "command_injection": {
        "patterns": [
            r'(?i)(?:exec|spawn|system|popen)\s*\(\s*.*?\+',
            r'(?i)(?:exec|spawn|system|popen)\s*\(\s*f["\']',
            r'(?i)(?:exec|spawn|system|popen)\s*\(\s*`.*?\$\{',
            r'(?i)subprocess\.(?:call|run|Popen)\s*\(\s*(?:f["\']|["\'].*?\+)',
            r'(?i)os\.system\s*\(\s*(?:f["\']|["\'].*?\+)',
        ],
        "severity": "critical",
        "description": "Potential command injection vulnerability",
    },
    "path_traversal": {
        "patterns": [
            r'(?i)(?:readFile|writeFile|open)\s*\(\s*.*?\+.*?(?:req|request|params|query)',
            r'(?i)path\.join\s*\(.*?(?:req|request|params|query)',
            r'\.\./',
        ],
        "severity": "high",
        "description": "Potential path traversal vulnerability",
    },
    "insecure_crypto": {
        "patterns": [
            r'(?i)(?:md5|sha1)\s*\(',
            r'(?i)DES(?:ede)?',
            r'(?i)RC4',
            r'(?i)Math\.random\s*\(\s*\)',  # For crypto purposes
        ],
        "severity": "high",
        "description": "Use of weak or insecure cryptographic algorithm",
    },
    "sensitive_data_exposure": {
        "patterns": [
            r'(?i)console\.log\s*\(.*?(?:password|secret|token|key|credential)',
            r'(?i)print\s*\(.*?(?:password|secret|token|key|credential)',
            r'(?i)logger\.(?:info|debug|log)\s*\(.*?(?:password|secret|token)',
        ],
        "severity": "medium",
        "description": "Potential sensitive data exposure in logs",
    },
    "insecure_random": {
        "patterns": [
            r'(?i)Math\.random\s*\(',
            r'(?i)random\.random\s*\(',
        ],
        "severity": "medium",
        "description": "Use of cryptographically insecure random number generator",
    },
    "eval_usage": {
        "patterns": [
            r'(?i)\beval\s*\(',
            r'(?i)new\s+Function\s*\(',
            r'(?i)setTimeout\s*\(\s*["\']',
            r'(?i)setInterval\s*\(\s*["\']',
        ],
        "severity": "high",
        "description": "Use of eval() or similar dynamic code execution",
    },
    "hardcoded_ip": {
        "patterns": [
            r'\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b',
        ],
        "severity": "low",
        "description": "Hardcoded IP address detected",
    },
}

# File extensions to scan
SCANNABLE_EXTENSIONS = {
    ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs",
    ".py", ".pyw",
    ".rb",
    ".go",
    ".java",
    ".php",
    ".cs",
    ".rs",
}

# Paths to skip
SKIP_PATTERNS = [
    "node_modules",
    ".git",
    "__pycache__",
    ".venv",
    "venv",
    "dist",
    "build",
    ".next",
    "vendor",
    "*.min.js",
    "*.bundle.js",
]


def should_scan_file(path: Path) -> bool:
    """Check if file should be scanned."""
    # Check extension
    if path.suffix.lower() not in SCANNABLE_EXTENSIONS:
        return False
    
    # Check skip patterns
    path_str = str(path)
    for pattern in SKIP_PATTERNS:
        if pattern.startswith("*"):
            if path_str.endswith(pattern[1:]):
                return False
        elif pattern in path_str:
            return False
    
    return True


def scan_file(filepath: Path) -> List[Dict]:
    """Scan a single file for security issues."""
    issues = []
    
    try:
        content = filepath.read_text(encoding="utf-8", errors="ignore")
        lines = content.split("\n")
    except Exception as e:
        return [{"error": str(e), "file": str(filepath)}]
    
    for issue_type, config in SECURITY_PATTERNS.items():
        for pattern in config["patterns"]:
            try:
                regex = re.compile(pattern)
                for line_num, line in enumerate(lines, 1):
                    matches = regex.findall(line)
                    if matches:
                        # Filter false positives
                        if is_false_positive(line, issue_type):
                            continue
                        
                        issues.append({
                            "type": issue_type,
                            "severity": config["severity"],
                            "description": config["description"],
                            "file": str(filepath),
                            "line": line_num,
                            "content": line.strip()[:100],
                        })
            except re.error:
                continue
    
    return issues


def is_false_positive(line: str, issue_type: str) -> bool:
    """Check if the match is likely a false positive."""
    line_lower = line.lower()
    
    # Skip comments
    if line.strip().startswith("//") or line.strip().startswith("#"):
        return True
    if line.strip().startswith("*") or line.strip().startswith("/*"):
        return True
    
    # Skip test files/mock data indicators
    test_indicators = ["mock", "fake", "test", "example", "sample", "dummy"]
    if any(ind in line_lower for ind in test_indicators):
        return True
    
    # Skip environment variable references
    if issue_type == "hardcoded_secret":
        env_patterns = ["process.env", "os.environ", "env.", "getenv"]
        if any(p in line for p in env_patterns):
            return True
    
    # Skip localhost IPs
    if issue_type == "hardcoded_ip":
        if "127.0.0.1" in line or "0.0.0.0" in line:
            return True
    
    return False


def scan_directory(path: Path) -> List[Dict]:
    """Scan a directory for security issues."""
    issues = []
    
    if path.is_file():
        if should_scan_file(path):
            return scan_file(path)
        return []
    
    for filepath in path.rglob("*"):
        if filepath.is_file() and should_scan_file(filepath):
            issues.extend(scan_file(filepath))
    
    return issues


def format_text_output(issues: List[Dict]) -> str:
    """Format issues as text output."""
    if not issues:
        return "✓ No security issues found."
    
    lines = ["Security Scan Results", "=" * 50, ""]
    
    # Group by severity
    by_severity = {"critical": [], "high": [], "medium": [], "low": []}
    for issue in issues:
        sev = issue.get("severity", "low")
        by_severity[sev].append(issue)
    
    severity_icons = {
        "critical": "🔴",
        "high": "🟠",
        "medium": "🟡",
        "low": "🔵",
    }
    
    for severity in ["critical", "high", "medium", "low"]:
        sev_issues = by_severity[severity]
        if not sev_issues:
            continue
        
        icon = severity_icons[severity]
        lines.append(f"\n{icon} {severity.upper()} ({len(sev_issues)})")
        lines.append("-" * 40)
        
        for issue in sev_issues:
            lines.append(f"  {issue['file']}:{issue['line']}")
            lines.append(f"    {issue['description']}")
            lines.append(f"    > {issue['content'][:60]}...")
            lines.append("")
    
    # Summary
    lines.extend([
        "",
        "=" * 50,
        "Summary:",
        f"  Critical: {len(by_severity['critical'])}",
        f"  High:     {len(by_severity['high'])}",
        f"  Medium:   {len(by_severity['medium'])}",
        f"  Low:      {len(by_severity['low'])}",
        f"  Total:    {len(issues)}",
    ])
    
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Scan code for security issues")
    parser.add_argument("path", help="File or directory to scan")
    parser.add_argument("--format", choices=["text", "json"], default="text",
                        help="Output format")
    parser.add_argument("--min-severity", choices=["critical", "high", "medium", "low"],
                        default="low", help="Minimum severity to report")
    args = parser.parse_args()
    
    path = Path(args.path)
    if not path.exists():
        print(f"Error: Path '{args.path}' does not exist")
        return 1
    
    issues = scan_directory(path)
    
    # Filter by minimum severity
    severity_order = ["critical", "high", "medium", "low"]
    min_index = severity_order.index(args.min_severity)
    issues = [i for i in issues if severity_order.index(i.get("severity", "low")) <= min_index]
    
    if args.format == "json":
        print(json.dumps({"issues": issues}, indent=2))
    else:
        print(format_text_output(issues))
    
    # Exit code based on critical/high issues
    critical_high = sum(1 for i in issues if i.get("severity") in ["critical", "high"])
    return 1 if critical_high > 0 else 0


if __name__ == "__main__":
    exit(main())
