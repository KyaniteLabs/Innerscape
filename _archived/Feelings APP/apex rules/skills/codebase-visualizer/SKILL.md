---
name: codebase-visualizer
description: >
  Creates visual representations of codebase structure including file trees,
  size distributions, type breakdowns, and dependency graphs. Use when asked
  to visualize, map, explore, or understand codebase structure.
license: Apache-2.0
compatibility: Claude Code, Cursor, VS Code
metadata:
  author: apex
  version: "1.0"
  updated: "2026-01"
allowed-tools: Read Glob Grep Bash
---

# Codebase Visualizer

## Purpose

Generate visual and textual representations of codebase structure to help understand:

- File organization
- Size distribution
- Technology breakdown
- Module dependencies

---

## Quick Usage

```bash
# From skill scripts directory
python visualize.py /path/to/project
python visualize.py /path/to/project --format html
python visualize.py /path/to/project --format json
```

---

## Visualization Types

### 1. File Tree

```
project/
├── src/
│   ├── components/     [42 files, 156KB]
│   ├── utils/          [12 files, 34KB]
│   └── pages/          [8 files, 89KB]
├── tests/              [28 files, 67KB]
└── docs/               [5 files, 23KB]
```

### 2. Size Distribution

```
File Sizes:
██████████████████████████████ src/components  (156KB, 45%)
███████████████               src/pages       (89KB, 26%)
██████████                    tests/          (67KB, 19%)
████                          src/utils       (34KB, 10%)
```

### 3. Type Breakdown

```
Language Distribution:
TypeScript  ████████████████████  65%  (142 files)
JavaScript  ██████               20%  (44 files)
CSS/SCSS    ████                 12%  (26 files)
Other       █                     3%  (7 files)
```

### 4. Complexity Heatmap

```
High Complexity Files (>20 cyclomatic):
🔴 src/auth/oauth.ts          (32)
🔴 src/api/handlers.ts        (28)
🟠 src/utils/parser.ts        (22)
🟡 src/components/Form.tsx    (18)
```

---

## Output Formats

| Format | Use Case |
|--------|----------|
| **text** | Terminal output, quick view |
| **html** | Interactive browser view |
| **json** | Integration with other tools |
| **markdown** | Documentation |

---

## Run Script

Execute the visualizer:

```bash
# Basic tree view
python scripts/visualize.py .

# HTML report
python scripts/visualize.py . --format html --output report.html

# Include hidden files
python scripts/visualize.py . --include-hidden

# Filter by extension
python scripts/visualize.py . --extensions ts,tsx,js

# Exclude patterns
python scripts/visualize.py . --exclude "node_modules,dist,*.test.*"
```

---

## Integration

The visualizer can be invoked by the agent automatically when users ask:

- "Show me the codebase structure"
- "Visualize this project"
- "What's the file distribution?"
- "Map out the codebase"
- "How is this project organized?"

---

*APEX Codebase Visualizer v1.0*
