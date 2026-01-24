---
name: code-review
description: >
  Automated code review with security scanning, complexity analysis, and
  best practice validation. Use when reviewing code, scanning for vulnerabilities,
  checking code quality, or auditing changes.
license: Apache-2.0
compatibility: Claude Code, Cursor, VS Code
metadata:
  author: apex
  version: "1.0"
  updated: "2026-01"
allowed-tools: Read Grep Glob Bash
---

# Code Review Validator

## Purpose

Automated code review covering:

- Security vulnerabilities
- Code complexity
- Type coverage
- Best practice violations

---

## Quick Usage

```bash
# Full review
python scripts/review.py /path/to/file.ts

# Security scan only
python scripts/security-scan.py /path/to/directory

# Complexity analysis
python scripts/complexity-check.py /path/to/file.py

# Type coverage report
python scripts/validate-types.py /path/to/directory
```

---

## Review Categories

### 1. Security Scan

Checks for:

| Issue | Severity |
|-------|----------|
| Hardcoded secrets | Critical |
| SQL injection patterns | Critical |
| XSS vulnerabilities | High |
| Insecure crypto | High |
| Command injection | High |
| Path traversal | Medium |
| Sensitive data exposure | Medium |

### 2. Complexity Analysis

Metrics:

| Metric | Good | Warning | Critical |
|--------|------|---------|----------|
| Cyclomatic complexity | <10 | 10-20 | >20 |
| Function length | <50 lines | 50-100 | >100 |
| Nesting depth | <4 | 4-6 | >6 |
| Parameters | <5 | 5-7 | >7 |

### 3. Type Coverage

For TypeScript/Python:

| Coverage | Rating |
|----------|--------|
| >90% | Excellent |
| 70-90% | Good |
| 50-70% | Needs work |
| <50% | Poor |

### 4. Best Practices

Checks:

- Consistent naming conventions
- Proper error handling
- Code duplication (DRY)
- Unused imports/variables
- Magic numbers
- Missing documentation

---

## Output Format

```markdown
## Code Review: src/auth/oauth.ts

### Security Issues
- **[CRITICAL]** Line 45: Potential hardcoded API key
- **[HIGH]** Line 78: User input passed to eval()

### Complexity
- **[WARNING]** Function `handleAuth` has complexity 18 (threshold: 15)
- **[INFO]** File has 3 functions with complexity > 10

### Best Practices
- **[WARNING]** 12 unused imports detected
- **[INFO]** Consider extracting lines 100-150 to separate function

### Summary
- Critical: 1
- High: 1
- Warning: 2
- Info: 2

Overall: NEEDS ATTENTION
```

---

## Integration

The agent automatically invokes this skill when:

- User asks to "review" code
- User asks for "security scan" or "audit"
- After completing a coding task (optional verification)
- When working on PRs

---

## Severity Levels

| Level | Meaning | Action |
|-------|---------|--------|
| **CRITICAL** | Security vulnerability | Must fix before merge |
| **HIGH** | Significant issue | Should fix |
| **WARNING** | Quality concern | Consider fixing |
| **INFO** | Suggestion | Optional improvement |

---

*APEX Code Review v1.0*
