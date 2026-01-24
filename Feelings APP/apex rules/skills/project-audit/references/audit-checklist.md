# APEX Audit Checklist

> **Last Updated**: 2026-01-24
> 
> **Purpose**: Detailed checklist for each audit category. Use during APEX audits to ensure comprehensive coverage.

---

## How to Use

For each category:
1. Run the listed checks
2. Record findings with severity
3. Map to APEX rule violations
4. Calculate category score

---

## 1. Security Checklist

**APEX Source**: `security-guardrails.md`, `APEX_SDLC.md § Security`

### Critical Checks

| Check | How to Find | Severity if Found |
|-------|-------------|-------------------|
| SQL Injection | `rg "query\(.*\+\|execute\(.*\+" --type py` | Critical |
| Command Injection | `rg "exec\(.*\+\|system\(.*\+" ` | Critical |
| Hardcoded Secrets | `rg "(password\|secret\|key\|token)\s*[:=]\s*['\"][^'\"]+['\"]" -i` | Critical |
| Exposed .env file | `ls -la .env` (should be gitignored) | Critical |
| No HTTPS | Check API URLs for `http://` in production | Critical |

### High Priority Checks

| Check | How to Find | Severity if Found |
|-------|-------------|-------------------|
| XSS Vulnerabilities | `rg "innerHTML\|dangerouslySetInnerHTML\|v-html"` | High |
| Missing CSRF Protection | Check form handlers for CSRF tokens | High |
| Weak Password Hashing | `rg "md5\|sha1" --type py` (for passwords) | High |
| Missing Auth Checks | API routes without auth middleware | High |
| Verbose Error Messages | `rg "stack\|trace" ` in error responses | High |

### Medium Priority Checks

| Check | How to Find | Severity if Found |
|-------|-------------|-------------------|
| Missing Rate Limiting | Check API routes for rate limit middleware | Medium |
| Insecure Cookie Settings | `rg "httpOnly.*false\|secure.*false"` | Medium |
| Missing Input Validation | Form handlers without validation | Medium |
| CORS Misconfiguration | `rg "Access-Control-Allow-Origin.*\*"` | Medium |
| Missing Security Headers | Check for CSP, X-Frame-Options, etc. | Medium |

### Low Priority Checks

| Check | How to Find | Severity if Found |
|-------|-------------|-------------------|
| Console.log with sensitive data | `rg "console\.log.*password\|token\|secret" -i` | Low |
| TODO/FIXME security items | `rg "TODO.*security\|FIXME.*auth" -i` | Low |
| Outdated security comments | Comments referencing old vulnerabilities | Low |

---

## 2. Code Patterns Checklist

**APEX Source**: `APEX_CORE.md § Core Laws`

### Critical Checks

| Check | How to Find | APEX Rule |
|-------|-------------|-----------|
| Empty catch blocks | `rg "catch\s*\(\w*\)\s*\{\s*\}"` | Observe |
| Division without guard | `rg "/ \w+" ` then check for zero guards | Safe Defaults |
| Infinite loop risk | While loops without clear termination | Bug Prevention |

### High Priority Checks

| Check | How to Find | APEX Rule |
|-------|-------------|-----------|
| Missing null checks | `rg "\.\w+\.\w+" ` without optional chaining | Safe Defaults |
| Unhandled promises | `rg "\.then\(" ` without `.catch` | Observe |
| Magic numbers | `rg "setTimeout\(\w+,\s*\d{4,}\)"` | No Magic |
| Shadow variables | Same variable name in nested scopes | Single Source |
| console.log in production | `rg "console\.(log\|debug)"` | Clean code |

### Medium Priority Checks

| Check | How to Find | APEX Rule |
|-------|-------------|-----------|
| Long functions (>50 lines) | Line count per function | Maintainability |
| Deep nesting (>3 levels) | Indentation analysis | Readability |
| Inconsistent naming | camelCase vs snake_case mixing | Conventions |
| Dead code | Unused imports, unreachable code | Clean code |
| TODO/FIXME items | `rg "TODO\|FIXME\|HACK\|XXX"` | Completion |

### Low Priority Checks

| Check | How to Find | APEX Rule |
|-------|-------------|-----------|
| var instead of const/let | `rg "var \w+"` | Modern JS |
| == instead of === | `rg "==(?!=)"` | Type safety |
| Commented-out code | Large comment blocks with code | Clean code |

---

## 3. Testing Checklist

**APEX Source**: `APEX_SDLC.md § Testing`

### Critical Checks

| Check | How to Find | Severity if Found |
|-------|-------------|-------------------|
| No tests at all | `ls **/*.test.* **/*.spec.*` returns empty | Critical |
| Auth code untested | Check test coverage on auth modules | Critical |
| Payment code untested | Check test coverage on payment modules | Critical |

### High Priority Checks

| Check | How to Find | Severity if Found |
|-------|-------------|-------------------|
| Coverage < 50% | Run coverage report | High |
| No integration tests | Only unit tests, no API/E2E | High |
| Flaky tests | Tests that sometimes fail | High |
| Missing edge case tests | Only happy path tested | High |
| No CI test runner | Check `.github/workflows/` or similar | High |

### Medium Priority Checks

| Check | How to Find | Severity if Found |
|-------|-------------|-------------------|
| Coverage 50-70% | Run coverage report | Medium |
| Slow tests (>30s) | Test timing report | Medium |
| Test code duplication | Similar test setup repeated | Medium |
| Missing mocks for externals | Tests hit real APIs | Medium |

### Low Priority Checks

| Check | How to Find | Severity if Found |
|-------|-------------|-------------------|
| No snapshot tests for UI | Check UI component tests | Low |
| Test naming inconsistent | Naming pattern analysis | Low |
| Old test data | Dates from years ago in fixtures | Low |

---

## 4. Architecture Checklist

**APEX Source**: `APEX_SDLC.md § Architecture`

### Critical Checks

| Check | How to Find | Severity if Found |
|-------|-------------|-------------------|
| Circular dependencies | `npx madge --circular` | Critical |
| Database in UI layer | DB calls from components | Critical |
| Secrets in frontend | API keys in client code | Critical |

### High Priority Checks

| Check | How to Find | Severity if Found |
|-------|-------------|-------------------|
| No clear layer separation | Business logic in routes | High |
| God objects/files | Files > 500 lines | High |
| Tight coupling | Hard-coded dependencies | High |
| Missing error boundaries | React apps without ErrorBoundary | High |

### Medium Priority Checks

| Check | How to Find | Severity if Found |
|-------|-------------|-------------------|
| Inconsistent folder structure | Mixed conventions | Medium |
| Missing shared utilities | Duplicated helper code | Medium |
| No environment separation | Same config for dev/prod | Medium |
| Missing types | `any` usage in TypeScript | Medium |

### Low Priority Checks

| Check | How to Find | Severity if Found |
|-------|-------------|-------------------|
| No barrel files | Missing index.ts exports | Low |
| Inconsistent imports | Relative vs absolute mixed | Low |
| Missing path aliases | Deep relative imports | Low |

---

## 5. Dependencies Checklist

**APEX Source**: `APEX_SDLC.md § Maintenance`

### Critical Checks

| Check | How to Find | Severity if Found |
|-------|-------------|-------------------|
| Known vulnerabilities | `npm audit` / `pip-audit` | Critical |
| Abandoned packages | Last update > 2 years | Critical (if security-related) |
| License violations | Check licenses for copyleft | Critical |

### High Priority Checks

| Check | How to Find | Severity if Found |
|-------|-------------|-------------------|
| Major version behind | Compare to latest | High |
| Deprecated packages | Check package status | High |
| Duplicate packages | Different versions of same pkg | High |
| Missing lockfile | No package-lock.json / yarn.lock | High |

### Medium Priority Checks

| Check | How to Find | Severity if Found |
|-------|-------------|-------------------|
| Minor versions behind | `npm outdated` | Medium |
| Unused dependencies | `npx depcheck` | Medium |
| Heavy dependencies | Large bundle impact | Medium |

### Low Priority Checks

| Check | How to Find | Severity if Found |
|-------|-------------|-------------------|
| Patch versions behind | Minor updates available | Low |
| Dev dependencies in prod | Check dependency types | Low |

---

## 6. Documentation Checklist

**APEX Source**: `APEX_SDLC.md § Documentation`

### Critical Checks

| Check | How to Find | Severity if Found |
|-------|-------------|-------------------|
| No README | `ls README*` | Critical |
| No setup instructions | README without "Getting Started" | Critical |
| Wrong/outdated setup | Instructions don't work | Critical |

### High Priority Checks

| Check | How to Find | Severity if Found |
|-------|-------------|-------------------|
| No API documentation | Missing endpoint docs | High |
| No environment variables list | Undocumented required env vars | High |
| No architecture overview | No system diagram or description | High |
| Outdated README | References removed features | High |

### Medium Priority Checks

| Check | How to Find | Severity if Found |
|-------|-------------|-------------------|
| Missing inline comments | Complex functions uncommented | Medium |
| No CONTRIBUTING.md | For open source projects | Medium |
| No CHANGELOG | No version history | Medium |
| Missing type definitions | Untyped public APIs | Medium |

### Low Priority Checks

| Check | How to Find | Severity if Found |
|-------|-------------|-------------------|
| No code examples | API without usage examples | Low |
| Typos in docs | Spelling/grammar issues | Low |
| Stale screenshots | Old UI in docs | Low |

---

## 7. APEX Adoption Checklist

**APEX Source**: All skills

### Skill Adoption Checks

| APEX Skill | How to Check | Applicable When |
|------------|--------------|-----------------|
| **git-commit** | Review commit messages for format | Always |
| **code-review** | Check for PR templates, review evidence | Team projects |
| **bug-comorbidity** | Check for clustered bug fixes | After finding bugs |
| **autonomous-loop** | Check for loop patterns, AGENTS.md | Agent projects |
| **browser-verification** | Check for visual tests | Projects with UI |
| **apex-design** | Check UI against design standards | Frontend projects |
| **apex-sdlc** | Check for testing, CI/CD | Always |
| **building-agents** | Check agent code patterns | Agent projects |
| **prd-generator** | Check for PRDs, specs | Feature work |
| **codebase-visualizer** | Check for arch diagrams | Large projects |
| **self-improvement** | Check for AGENTS.md updates | Always |
| **project-audit** | This audit! | Periodically |

### Convention Adherence

| Convention | How to Check | APEX Source |
|------------|--------------|-------------|
| Commit message format | `git log --oneline` | git-commit/SKILL.md |
| Error handling pattern | Code review | APEX_CORE.md |
| Test naming convention | Test file review | APEX_SDLC.md |
| File organization | Directory structure | APEX_SDLC.md |
| Documentation style | README review | APEX_SDLC.md |

---

## Scoring Calculator

### Per-Category Score

```
Score = 100 - (Critical × 25) - (High × 10) - (Medium × 3) - (Low × 1)

A: 90-100
B: 80-89
C: 70-79
D: 60-69
F: <60
```

### Overall Score

```
Overall = (Security × 0.25) + (Code × 0.20) + (Testing × 0.20) + 
          (Architecture × 0.15) + (Dependencies × 0.10) + 
          (Documentation × 0.05) + (APEX Adoption × 0.05)
```

---

## Quick Reference Commands

```bash
# Security
rg "(password|secret|key|token)\s*[:=]\s*['\"]" -i
npm audit

# Code patterns
rg "catch\s*\(\w*\)\s*\{\s*\}"
rg "console\.(log|debug)"

# Testing
npm test -- --coverage
ls **/*.test.* **/*.spec.* | wc -l

# Dependencies
npm outdated
npx depcheck

# Documentation
ls README* CONTRIBUTING* CHANGELOG*
```
