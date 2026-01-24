#!/bin/bash
#
# APEX Skills Symlink Setup
#
# Creates symbolic links to enable skill discovery across multiple platforms.
# Run from the project root directory.
#
# Usage:
#   ./apex/skills/setup-symlinks.sh
#
# Supported Platforms:
#   - Claude Code (.claude/skills/)
#   - Cursor (.cursor/skills/)
#   - VS Code / GitHub Copilot (.github/skills/)
#   - OpenAI Codex (.codex/skills/)
#   - Gemini CLI (.gemini/skills/)
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SKILLS_SOURCE="$SCRIPT_DIR"

echo "APEX Skills Symlink Setup"
echo "========================="
echo ""
echo "Skills source: $SKILLS_SOURCE"
echo "Project root:  $PROJECT_ROOT"
echo ""

# Function to create symlink
create_symlink() {
    local target_dir="$1"
    local link_name="$2"
    local full_path="$PROJECT_ROOT/$target_dir"
    
    # Create parent directory if needed
    mkdir -p "$(dirname "$full_path")"
    
    # Check if already exists
    if [ -L "$full_path" ]; then
        echo "  ✓ $link_name already linked"
        return 0
    elif [ -d "$full_path" ]; then
        echo "  ⚠ $link_name exists as directory (skipping)"
        return 0
    fi
    
    # Create symlink
    ln -s "$SKILLS_SOURCE" "$full_path"
    echo "  ✓ Created $link_name"
}

echo "Creating symlinks..."
echo ""

# Claude Code
create_symlink ".claude/skills" ".claude/skills"

# Cursor
create_symlink ".cursor/skills" ".cursor/skills"

# VS Code / GitHub Copilot
create_symlink ".github/skills" ".github/skills"

# OpenAI Codex
create_symlink ".codex/skills" ".codex/skills"

# Gemini CLI
create_symlink ".gemini/skills" ".gemini/skills"

echo ""
echo "Setup complete!"
echo ""
echo "Skills are now available at:"
echo "  - .claude/skills/"
echo "  - .cursor/skills/"
echo "  - .github/skills/"
echo "  - .codex/skills/"
echo "  - .gemini/skills/"
echo ""
echo "All platforms will share the same skills from:"
echo "  apex/skills/"
