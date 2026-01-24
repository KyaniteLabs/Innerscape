#
# APEX Skills Symlink Setup (Windows PowerShell)
#
# Creates symbolic links to enable skill discovery across multiple platforms.
# Run from the project root directory with Administrator privileges.
#
# Usage:
#   .\rules\skills\setup-symlinks.ps1
#
# Note: Creating symlinks on Windows requires Administrator privileges
# or Developer Mode enabled in Windows 10/11.
#

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$SkillsSource = $ScriptDir

Write-Host "APEX Skills Symlink Setup"
Write-Host "========================="
Write-Host ""
Write-Host "Skills source: $SkillsSource"
Write-Host "Project root:  $ProjectRoot"
Write-Host ""

function Create-SymLink {
    param(
        [string]$TargetDir,
        [string]$LinkName
    )
    
    $FullPath = Join-Path $ProjectRoot $TargetDir
    $ParentDir = Split-Path -Parent $FullPath
    
    # Create parent directory if needed
    if (-not (Test-Path $ParentDir)) {
        New-Item -ItemType Directory -Path $ParentDir -Force | Out-Null
    }
    
    # Check if already exists
    if (Test-Path $FullPath) {
        $item = Get-Item $FullPath
        if ($item.LinkType -eq "SymbolicLink") {
            Write-Host "  ✓ $LinkName already linked"
            return
        } else {
            Write-Host "  ⚠ $LinkName exists (skipping)"
            return
        }
    }
    
    # Create symlink
    try {
        New-Item -ItemType SymbolicLink -Path $FullPath -Target $SkillsSource -Force | Out-Null
        Write-Host "  ✓ Created $LinkName"
    } catch {
        Write-Host "  ✗ Failed to create $LinkName - Run as Administrator or enable Developer Mode"
    }
}

Write-Host "Creating symlinks..."
Write-Host ""

# Claude Code
Create-SymLink ".claude\skills" ".claude\skills"

# Cursor
Create-SymLink ".cursor\skills" ".cursor\skills"

# VS Code / GitHub Copilot
Create-SymLink ".github\skills" ".github\skills"

# OpenAI Codex
Create-SymLink ".codex\skills" ".codex\skills"

# Gemini CLI
Create-SymLink ".gemini\skills" ".gemini\skills"

Write-Host ""
Write-Host "Setup complete!"
Write-Host ""
Write-Host "Skills are now available at:"
Write-Host "  - .claude\skills\"
Write-Host "  - .cursor\skills\"
Write-Host "  - .github\skills\"
Write-Host "  - .codex\skills\"
Write-Host "  - .gemini\skills\"
Write-Host ""
Write-Host "All platforms will share the same skills from:"
Write-Host "  rules\skills\"
