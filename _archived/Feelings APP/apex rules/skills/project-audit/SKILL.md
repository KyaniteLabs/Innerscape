---
name: project-audit
description: >
  APEX Project Audit — Analyze an entire codebase against current APEX standards.
  Produces a detailed report with severity scores (A/B/C/D/F) per category,
  followed by a prioritized action plan. Does NOT auto-execute changes.
  Use when opening an old project or checking standards compliance.
license: Apache-2.0
compatibility: Claude Code, Cursor, VS Code, any AI coding tool
metadata:
  author: apex
  version: "1.0"
  updated: "2026-01"
triggers: APEX audit, audit APEX, project audit, health check, standards check, modernize project
allowed-tools: Read Grep Glob Bash WebSearch
---

# APEX Project Audit

## TL;DR

Run `"APEX audit"` on any project to get a comprehensive report of how it measures up against current APEX standards, with severity scores and a prioritized action plan.

---

## WHEN TO USE

- Opening an old/inherited project for the first time
- Before major refactoring work
- Periodic health checks (quarterly recommended)
- Onboarding to understand codebase quality
- Pre-release quality gates

---

## THE AUDIT PROTOCOL

```
APEX AUDIT TRIGGERED
    ↓
[1] DISCOVERY — Identify project type, tech stack, structure
    ↓
[2] SCAN — Analyze each category against APEX standards
    ↓
[3] SCORE — Grade each category (A/B/C/D/F)
    ↓
[4] REPORT — Generate detailed findings report
    ↓
[5] PLAN — Create prioritized action items
    ↓
[6] PRESENT — Show report + plan (DO NOT auto-execute)
```

---

## STEP 1: DISCOVERY

Before auditing, understand the project:

```bash
# Identify project type
ls -la                           # Root structure
cat package.json 2>/dev/null     # Node project
cat requirements.txt 2>/dev/null # Python project
cat Cargo.toml 2>/dev/null       # Rust project
cat go.mod 2>/dev/null           # Go project

# Identify frameworks
grep -r "react\|vue\|angular\|next\|nuxt" package.json 2>/dev/null
grep -r "fastapi\|flask\|django" requirements.txt 2>/dev/null

# Check for existing APEX adoption
ls apex/ .cursorrules CLAUDE.md .cursor/rules/ 2>/dev/null
```

**Output**: Project profile (language, framework, size, existing standards)

---

## STEP 2: SCAN BY CATEGORY

Analyze each category using the checklist in [references/audit-checklist.md](references/audit-checklist.md).

### Categories to Scan

| Category | APEX Source | Key Checks |
|----------|-------------|------------|
| Code Patterns | APEX_CORE.md | Error handling, null safety, async patterns |
| Security | security-guardrails.md | OWASP, secrets, input validation |
| Dependencies | APEX_SDLC.md | Outdated packages, vulnerabilities |
| Architecture | APEX_SDLC.md | Structure, separation, conventions |
| Testing | APEX_SDLC.md | Coverage, quality, types |
| Documentation | APEX_SDLC.md | README, API docs, comments |
| APEX Adoption | All skills | Which APEX skills are being followed |

---

## STEP 3: SCORING

### Scoring Rubric

| Grade | Meaning | Criteria |
|-------|---------|----------|
| **A** | Excellent | 0 critical, ≤2 high, follows APEX patterns |
| **B** | Good | 0 critical, ≤5 high, minor gaps |
| **C** | Needs Work | ≤2 critical, multiple high priority issues |
| **D** | Poor | 3+ critical issues, significant gaps |
| **F** | Failing | Security vulnerabilities, broken functionality |

### Per-Category Scoring

Each category gets its own grade based on:
- Number of critical findings
- Number of high-priority findings
- Adherence to APEX conventions
- Industry best practices

### Overall Score

Calculated as weighted average:

| Category | Weight |
|----------|--------|
| Security | 25% |
| Code Patterns | 20% |
| Testing | 20% |
| Architecture | 15% |
| Dependencies | 10% |
| Documentation | 5% |
| APEX Adoption | 5% |

---

## STEP 4: REPORT FORMAT

```markdown
# APEX Audit Report: [Project Name]

**Generated**: [Date]
**APEX Version**: 4.3.0
**Project Type**: [e.g., Next.js TypeScript application]

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Overall Score** | [A/B/C/D/F] |
| **Critical Issues** | [count] |
| **High Priority** | [count] |
| **Medium Priority** | [count] |
| **Low Priority** | [count] |

### Score Breakdown

| Category | Score | Critical | High | Medium | Low |
|----------|-------|----------|------|--------|-----|
| Security | C | 1 | 3 | 5 | 2 |
| Code Patterns | B | 0 | 2 | 8 | 4 |
| Testing | D | 2 | 5 | 3 | 1 |
| Architecture | B | 0 | 1 | 4 | 6 |
| Dependencies | C | 1 | 2 | 3 | 0 |
| Documentation | D | 0 | 4 | 2 | 1 |
| APEX Adoption | C | 0 | 3 | 5 | 2 |

---

## Detailed Findings

### 1. Security [Grade: C]

#### Critical Issues
| Issue | Location | APEX Rule | Recommendation |
|-------|----------|-----------|----------------|
| SQL injection vulnerability | `src/db/queries.ts:42` | security-guardrails.md § Input Validation | Use parameterized queries |

#### High Priority
| Issue | Location | APEX Rule | Recommendation |
|-------|----------|-----------|----------------|
| Hardcoded API key | `src/config.ts:15` | APEX_CORE.md § Secrets | Move to environment variable |
| Missing CSRF protection | `src/api/routes.ts` | security-guardrails.md § CSRF | Add CSRF tokens |

#### Medium Priority
...

#### Low Priority
...

### 2. Code Patterns [Grade: B]
...

### 3. Testing [Grade: D]
...

### 4. Architecture [Grade: B]
...

### 5. Dependencies [Grade: C]
...

### 6. Documentation [Grade: D]
...

### 7. APEX Adoption [Grade: C]

| APEX Skill | Adopted? | Notes |
|------------|----------|-------|
| git-commit conventions | Partial | Commits exist but don't follow format |
| code-review checklist | No | No evidence of structured reviews |
| bug-comorbidity protocol | No | Not yet adopted |
| autonomous-loop | N/A | No autonomous agents in project |
| browser-verification | No | UI exists but no visual testing |

---

## Prioritized Action Plan

### Critical (Fix Immediately)
- [ ] **[SEC-001]** Fix SQL injection in `src/db/queries.ts:42` — Est: 1hr
- [ ] **[TEST-001]** Add auth tests (0% coverage on auth module) — Est: 4hr
- [ ] **[DEP-001]** Update `lodash` (CVE-2021-23337) — Est: 30min

### High Priority (This Sprint)
- [ ] **[SEC-002]** Move hardcoded secrets to env vars — Est: 2hr
- [ ] **[SEC-003]** Add CSRF protection — Est: 3hr
- [ ] **[CODE-001]** Add null checks to API handlers — Est: 2hr
- [ ] **[TEST-002]** Increase test coverage to 60% — Est: 8hr
- [ ] **[DOC-001]** Create README with setup instructions — Est: 1hr

### Medium Priority (Backlog)
- [ ] **[ARCH-001]** Extract shared utilities to `lib/` — Est: 4hr
- [ ] **[CODE-002]** Standardize error handling pattern — Est: 3hr
- [ ] **[APEX-001]** Adopt git-commit skill conventions — Est: 1hr
- [ ] ...

### Low Priority (Nice to Have)
- [ ] **[DOC-002]** Add JSDoc to public functions — Est: 4hr
- [ ] **[CODE-003]** Replace `var` with `const/let` — Est: 1hr
- [ ] ...

---

## Recommended APEX Skills to Adopt

Based on this project, prioritize adopting these APEX skills:

1. **bug-comorbidity** — Project has clustered bugs that would benefit from comorbidity analysis
2. **code-review** — No structured review process evident
3. **git-commit** — Commit messages are inconsistent

---

## Next Steps

1. Address all **Critical** items before any new development
2. Create tickets for **High Priority** items
3. Schedule **Medium Priority** items for future sprints
4. **Low Priority** items can be addressed opportunistically

**To execute this plan**: Review each item and approve individually. This audit does NOT auto-execute changes.
```

---

## STEP 5: PRESENT

**Rules for presenting the audit**:

1. **Show report first** — Full findings with context
2. **Then show action plan** — Prioritized, actionable items
3. **DO NOT auto-execute** — This is read-only analysis
4. **Offer to help** — "Would you like me to start with [specific item]?"

---

## QUICK SCANS

For faster partial audits, support these variants:

| Command | Scope |
|---------|-------|
| `APEX audit` | Full audit (all categories) |
| `APEX audit security` | Security category only |
| `APEX audit tests` | Testing category only |
| `APEX audit deps` | Dependencies only |
| `APEX audit quick` | Critical issues only (fastest) |

---

## INTEGRATION WITH OTHER SKILLS

| After Audit | Suggested Follow-up |
|-------------|---------------------|
| Security issues found | Load `security-guardrails.md` for fixes |
| Bug patterns found | Use `bug-comorbidity` skill when fixing |
| Test gaps found | Reference `APEX_SDLC.md § Testing` |
| Architecture issues | Reference `APEX_SDLC.md § Architecture` |
| Missing docs | Reference `APEX_SDLC.md § Documentation` |

---

## EXAMPLES

### Example 1: Quick Command

**User**: `APEX audit`

**Agent**: 
1. Scans project structure
2. Analyzes all categories
3. Generates full report with scores
4. Presents prioritized action plan
5. Asks: "Would you like me to start with any of the critical items?"

### Example 2: Focused Audit

**User**: `APEX audit security`

**Agent**:
1. Scans security-related patterns only
2. Generates security-focused report
3. Lists security action items
4. Skips other categories

---

## AUTOMATION HOOKS

For CI/CD integration, the audit can output machine-readable format:

```bash
# Request JSON output
"APEX audit --format json"
```

```json
{
  "project": "my-app",
  "date": "2026-01-24",
  "apex_version": "4.3.0",
  "overall_score": "C",
  "categories": {
    "security": {"score": "C", "critical": 1, "high": 3},
    "code_patterns": {"score": "B", "critical": 0, "high": 2}
  },
  "action_items": [
    {"id": "SEC-001", "priority": "critical", "title": "Fix SQL injection", "location": "src/db/queries.ts:42"}
  ]
}
```

---

## Further Reading

- [Audit Checklist](references/audit-checklist.md) — Detailed checklist for each category
- [APEX_CORE.md](../../APEX_CORE.md) — Core rules reference
- [APEX_SDLC.md](../../APEX_SDLC.md) — SDLC standards
- [Security Guardrails](../building-agents/references/security-guardrails.md) — Security standards
