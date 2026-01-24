---
name: git-commit
description: >
  Analyzes git diffs and generates semantic, meaningful commit messages.
  Use when committing changes, reviewing diffs, or preparing commits.
  Follows conventional commits format and project conventions.
license: Apache-2.0
compatibility: Claude Code, Cursor, VS Code
metadata:
  author: apex
  version: "1.0"
  updated: "2026-01"
allowed-tools: Read Grep Bash Glob
---

# Git Commit Helper

## Purpose

Generate high-quality commit messages by analyzing:

- Files changed
- Nature of changes (feature, fix, refactor, docs, etc.)
- Impact and scope
- Conventional commit patterns

---

## Quick Usage

```bash
# Analyze staged changes
python scripts/analyze-diff.py

# Generate commit message
python scripts/suggest-message.py

# Commit with suggested message
python scripts/suggest-message.py --commit
```

---

## Commit Message Format

### Conventional Commits

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type | When |
|------|------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code change that neither fixes nor adds |
| `docs` | Documentation only |
| `style` | Formatting, whitespace |
| `test` | Adding/fixing tests |
| `chore` | Build, deps, config |
| `perf` | Performance improvement |
| `ci` | CI/CD changes |

### Examples

```
feat(auth): add OAuth2 login with Google

fix(api): handle null response in user endpoint

refactor(utils): extract validation into separate module

docs(readme): add installation instructions

test(auth): add unit tests for token refresh

chore(deps): update React to v19.2
```

---

## Analysis Output

When analyzing a diff, the script outputs:

```
Files Changed: 5
Insertions: 142
Deletions: 38

Changes by Category:
  Features:     2 files (src/auth/*, src/api/login.ts)
  Tests:        2 files (tests/auth.test.ts, tests/login.test.ts)
  Config:       1 file (package.json)

Primary Change Type: feat
Suggested Scope: auth
Confidence: high

Suggested Message:
  feat(auth): add OAuth2 authentication flow

  - Add Google OAuth provider
  - Implement token refresh logic
  - Add login API endpoint
```

---

## Integration

The agent automatically invokes this skill when:

- User asks to "commit" or "create commit"
- User asks for "commit message"
- After completing a coding task, before committing

---

## Best Practices

### DO

- Focus on the "why", not the "what"
- Keep subject line under 72 characters
- Use imperative mood ("add" not "added")
- Reference issue numbers when applicable

### DON'T

- Use vague messages ("fix stuff", "updates")
- Mix unrelated changes in one commit
- Include generated file contents
- Commit secrets or credentials

---

*APEX Git Commit Helper v1.0*
