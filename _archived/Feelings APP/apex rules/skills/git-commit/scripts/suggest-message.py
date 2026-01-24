#!/usr/bin/env python3
"""
Commit Message Generator

Generates semantic commit messages based on staged changes.

Usage:
    python suggest-message.py [--commit]
"""

import argparse
import subprocess
import sys
from pathlib import Path

# Import the analyzer
script_dir = Path(__file__).parent
sys.path.insert(0, str(script_dir))

try:
    from analyze_diff import analyze, get_diff_content
except ImportError:
    # Fallback if running standalone
    def analyze():
        return {"error": "Could not import analyzer"}
    def get_diff_content():
        return ""


def generate_description(analysis: dict, diff_content: str) -> str:
    """Generate a concise description from the changes."""
    files = analysis.get("files", [])
    change_type = analysis.get("change_type", "chore")
    
    # Build description based on change type
    if change_type == "feat":
        if len(files) == 1:
            filename = Path(files[0]).stem
            return f"add {filename.replace('_', ' ').replace('-', ' ')}"
        else:
            return "add new functionality"
    
    elif change_type == "fix":
        if len(files) == 1:
            filename = Path(files[0]).stem
            return f"fix issue in {filename}"
        else:
            return "fix issues"
    
    elif change_type == "refactor":
        if len(files) == 1:
            filename = Path(files[0]).stem
            return f"refactor {filename}"
        else:
            return "refactor code structure"
    
    elif change_type == "docs":
        return "update documentation"
    
    elif change_type == "test":
        return "add/update tests"
    
    elif change_type == "style":
        return "update styles"
    
    elif change_type == "ci":
        return "update CI/CD configuration"
    
    elif change_type == "perf":
        return "improve performance"
    
    else:
        return "update codebase"


def generate_body(analysis: dict) -> str:
    """Generate commit body with bullet points."""
    categories = analysis.get("categories", {})
    lines = []
    
    for category, files in categories.items():
        if category == "source":
            for f in files[:5]:
                action = "Update" if analysis.get("deletions", 0) > 0 else "Add"
                lines.append(f"- {action} {Path(f).name}")
        elif category == "test":
            lines.append(f"- Add/update {len(files)} test file(s)")
        elif category == "docs":
            lines.append(f"- Update documentation")
        elif category == "config":
            lines.append(f"- Update configuration")
    
    return "\n".join(lines[:5])  # Max 5 bullet points


def generate_commit_message(analysis: dict) -> str:
    """Generate the full commit message."""
    if "error" in analysis:
        return f"# Error: {analysis['error']}"
    
    change_type = analysis.get("change_type", "chore")
    scope = analysis.get("scope", "")
    
    # Get diff content for better description
    diff_content = get_diff_content()
    description = generate_description(analysis, diff_content)
    
    # Build subject line
    if scope:
        subject = f"{change_type}({scope}): {description}"
    else:
        subject = f"{change_type}: {description}"
    
    # Ensure subject is not too long
    if len(subject) > 72:
        subject = subject[:69] + "..."
    
    # Generate body
    body = generate_body(analysis)
    
    if body:
        return f"{subject}\n\n{body}"
    else:
        return subject


def run_commit(message: str) -> bool:
    """Run git commit with the message."""
    try:
        result = subprocess.run(
            ["git", "commit", "-m", message],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            print(f"✓ Committed: {message.split(chr(10))[0]}")
            return True
        else:
            print(f"✗ Commit failed: {result.stderr}")
            return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="Generate commit message")
    parser.add_argument("--commit", action="store_true",
                        help="Actually create the commit")
    parser.add_argument("--json", action="store_true",
                        help="Output as JSON")
    args = parser.parse_args()
    
    # Analyze changes
    analysis = analyze()
    
    if "error" in analysis:
        print(f"Error: {analysis['error']}")
        return 1
    
    # Generate message
    message = generate_commit_message(analysis)
    
    if args.json:
        import json
        print(json.dumps({
            "message": message,
            "analysis": analysis
        }, indent=2))
    elif args.commit:
        # Show message and confirm
        print("Suggested commit message:")
        print("-" * 40)
        print(message)
        print("-" * 40)
        
        confirm = input("Commit with this message? (y/n): ")
        if confirm.lower() == "y":
            return 0 if run_commit(message) else 1
        else:
            print("Commit cancelled.")
            return 0
    else:
        print("Suggested commit message:")
        print("=" * 40)
        print(message)
        print("=" * 40)
        print("\nUse --commit to create the commit.")
    
    return 0


if __name__ == "__main__":
    exit(main())
