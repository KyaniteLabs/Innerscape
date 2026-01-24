# APEX ENGINEERING RULES v4.0 — SETUP GUIDE
**Integration Instructions for AI Coding Tools | January 2026**

---

## OVERVIEW

APEX v4.0 consists of three files:

| File | Purpose | When Loaded |
|------|---------|-------------|
| `APEX_CORE.md` | Fundamentals, auto-routing | Always |
| `APEX_SDLC.md` | Full SDLC lifecycle | Architecture, testing, deployment tasks |
| `APEX_DESIGN.md` | Frontend aesthetics | UI/design tasks |

**Recommended Setup**: Load `APEX_CORE.md` as primary rules. Place `APEX_SDLC.md` and `APEX_DESIGN.md` in project for auto-routing.

---

## CURSOR

### Method 1: Project Rules (Recommended)

```
your-project/
├── .cursorrules          ← Paste APEX_CORE.md content here
├── rules/
│   ├── APEX_SDLC.md      ← Copy file here
│   └── APEX_DESIGN.md    ← Copy file here
└── src/
```

**Steps**:
1. Create `.cursorrules` in project root
2. Copy entire content of `APEX_CORE.md` into `.cursorrules`
3. Create `rules/` folder in project root
4. Copy `APEX_SDLC.md` and `APEX_DESIGN.md` to `rules/`
5. The auto-routing in APEX_CORE will load additional rules when needed

### Method 2: Global Rules

1. Open Cursor Settings (`Cmd/Ctrl + ,`)
2. Search for "Rules for AI"
3. Paste `APEX_CORE.md` content
4. For project-specific SDLC/Design rules, use Method 1

### Method 3: .cursor Folder

```
your-project/
├── .cursor/
│   └── rules/
│       ├── core.md       ← APEX_CORE.md content
│       ├── sdlc.md       ← APEX_SDLC.md content
│       └── design.md     ← APEX_DESIGN.md content
└── src/
```

Update auto-routing paths in APEX_CORE.md:
```markdown
| Triggers | File | Action |
|----------|------|--------|
| UI, frontend... | `.cursor/rules/design.md` | `read_file` |
| architecture... | `.cursor/rules/sdlc.md` | `read_file` |
```

---

## KILO CODE (VS Code Extension)

### Setup

```
your-project/
├── .kilocode/
│   ├── rules.md          ← APEX_CORE.md content
│   └── context/
│       ├── sdlc.md       ← APEX_SDLC.md
│       └── design.md     ← APEX_DESIGN.md
└── src/
```

**Steps**:
1. Create `.kilocode/` folder in project root
2. Create `rules.md` with APEX_CORE.md content
3. Create `context/` subfolder for additional rules
4. Update auto-routing paths accordingly

### Global Rules

1. Open VS Code Settings
2. Search for "Kilo Code"
3. Find "Custom Instructions" or "System Prompt"
4. Paste APEX_CORE.md content

---

## CLAUDE CODE CLI

### Method 1: Settings File

```bash
# Create or edit Claude Code settings
claude config set customInstructions "$(cat APEX_CORE.md)"
```

### Method 2: Project File

```
your-project/
├── .claude/
│   └── instructions.md   ← APEX_CORE.md content
├── rules/
│   ├── APEX_SDLC.md
│   └── APEX_DESIGN.md
└── src/
```

### Method 3: CLAUDE.md Convention

```
your-project/
├── CLAUDE.md             ← APEX_CORE.md content
├── rules/
│   ├── APEX_SDLC.md
│   └── APEX_DESIGN.md
└── src/
```

Claude Code automatically reads `CLAUDE.md` from project root.

---

## WINDSURF / CASCADE

### Memory-Based Setup

Windsurf uses a memory system. Create memories for core rules:

1. Open Windsurf
2. Tell it: "Remember these as my coding standards" + paste APEX_CORE.md
3. For project-specific, create steering files:

```
your-project/
├── .windsurf/
│   └── rules.md          ← APEX_CORE.md content
├── rules/
│   ├── APEX_SDLC.md
│   └── APEX_DESIGN.md
└── src/
```

### Cascade Settings

1. Open Cascade settings
2. Find "Custom Instructions" or "System Prompt"
3. Paste APEX_CORE.md content

---

## CLINE / ROO-CLINE (VS Code)

### Setup

1. Open VS Code
2. Open Cline extension settings
3. Find "Custom Instructions" field
4. Paste APEX_CORE.md content

### Project-Level Rules

```
your-project/
├── .cline/
│   └── instructions.md   ← APEX_CORE.md content
├── rules/
│   ├── APEX_SDLC.md
│   └── APEX_DESIGN.md
└── src/
```

---

## AIDER

### Setup

```bash
# Create aider config
echo "$(cat APEX_CORE.md)" > ~/.aider.conf.yml

# Or per-project
your-project/
├── .aider.conf.yml       ← Add system_prompt: |
│                            [APEX_CORE.md content]
├── rules/
│   ├── APEX_SDLC.md
│   └── APEX_DESIGN.md
└── src/
```

### .aider.conf.yml Format

```yaml
system_prompt: |
  # APEX ENGINEERING RULES v4.0 — CORE
  [... rest of APEX_CORE.md content ...]
```

---

## CODEX CLI (OpenAI)

### Setup

```bash
# Set custom instructions via environment
export CODEX_SYSTEM_PROMPT="$(cat APEX_CORE.md)"

# Or create config file
your-project/
├── .codex/
│   └── config.json
└── src/
```

### config.json Format

```json
{
  "systemPrompt": "# APEX ENGINEERING RULES v4.0...",
  "additionalContext": [
    "rules/APEX_SDLC.md",
    "rules/APEX_DESIGN.md"
  ]
}
```

---

## CONTINUE (VS Code/JetBrains)

### Setup

```
~/.continue/
├── config.json
└── instructions/
    └── apex.md           ← APEX_CORE.md content
```

### config.json

```json
{
  "customInstructions": "See ~/.continue/instructions/apex.md",
  "contextProviders": [
    {
      "name": "file",
      "params": {
        "path": "rules/APEX_SDLC.md"
      }
    }
  ]
}
```

---

## GITHUB COPILOT

### Method 1: .github/copilot-instructions.md

```
your-project/
├── .github/
│   └── copilot-instructions.md   ← APEX_CORE.md content
├── rules/
│   ├── APEX_SDLC.md
│   └── APEX_DESIGN.md
└── src/
```

GitHub Copilot automatically reads this file.

### Method 2: VS Code Settings

1. Open VS Code Settings
2. Search for "GitHub Copilot"
3. Find "Instructions" or "Custom Prompt"
4. Paste APEX_CORE.md content

---

## ZENCODER / TABNINE

### Zencoder

```
your-project/
├── .zencoder/
│   └── instructions.md   ← APEX_CORE.md content
└── src/
```

### Tabnine

1. Open Tabnine settings in IDE
2. Navigate to "Custom Instructions"
3. Paste APEX_CORE.md content

---

## GENERIC CLI TOOLS

For any CLI tool that accepts a system prompt:

### Environment Variable Method

```bash
# Add to ~/.bashrc or ~/.zshrc
export AI_SYSTEM_PROMPT="$(cat /path/to/APEX_CORE.md)"

# Use in tool
your-cli-tool --system-prompt "$AI_SYSTEM_PROMPT"
```

### File Reference Method

```bash
# Most tools support file input
your-cli-tool --system-prompt-file /path/to/APEX_CORE.md
```

### Stdin Method

```bash
cat APEX_CORE.md | your-cli-tool --system-prompt -
```

---

## UPDATING AUTO-ROUTING PATHS

When you change the location of SDLC/Design files, update APEX_CORE.md:

```markdown
## AUTO-ROUTING (MANDATORY)

| Triggers | File | Action |
|----------|------|--------|
| UI, frontend... | `YOUR_PATH/APEX_DESIGN.md` | `read_file` |
| architecture... | `YOUR_PATH/APEX_SDLC.md` | `read_file` |
```

Common path patterns:
- `rules/APEX_SDLC.md` — Project root rules folder
- `.cursor/rules/sdlc.md` — Cursor-specific folder
- `.config/apex/APEX_SDLC.md` — Config folder convention

---

## VERIFICATION

After setup, test by asking the AI:

1. "What are your core laws?" — Should list Observe, Single Source, etc.
2. "Design a login form" — Should trigger APEX_DESIGN.md auto-load
3. "Create database schema" — Should trigger APEX_SDLC.md auto-load

If auto-routing doesn't work:
- Verify file paths are correct
- Ensure AI has file read permissions
- Check that trigger keywords match your request

---

## QUICK REFERENCE

| Tool | Primary Location | Global Location |
|------|------------------|-----------------|
| Cursor | `.cursorrules` | Settings > Rules for AI |
| Kilo Code | `.kilocode/rules.md` | VS Code Settings |
| Claude Code | `CLAUDE.md` or `.claude/` | `claude config` |
| Windsurf | `.windsurf/rules.md` | Memory system |
| Cline | `.cline/instructions.md` | Extension settings |
| Aider | `.aider.conf.yml` | `~/.aider.conf.yml` |
| Continue | `.continue/` | `~/.continue/config.json` |
| Copilot | `.github/copilot-instructions.md` | VS Code Settings |

---

*APEX v4.0 Setup — For updates, see the main repository.*
