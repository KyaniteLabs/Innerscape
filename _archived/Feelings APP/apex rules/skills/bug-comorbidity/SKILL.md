---
name: bug-comorbidity
description: >
  Comorbid Bug Pattern Detection Protocol. When a bug is found, pause and
  analyze what other error patterns statistically accompany it — like medical
  comorbidities. Search for those patterns proactively, fix critical issues
  automatically, and report others for approval. Continue until codebase is clean.
license: Apache-2.0
compatibility: Claude Code, Cursor, VS Code, any AI coding tool
metadata:
  author: apex
  version: "1.0"
  updated: "2026-01"
triggers: bug, fix, error, debug, issue, broken, failing, crash, exception
allowed-tools: Read Grep Glob Bash WebSearch
---

# Comorbid Bug Pattern Detection Protocol

## TL;DR

When you find a bug, **don't just fix it**. Pause, think like an expert engineer, identify what OTHER bugs tend to accompany this type, search for them, and fix the cluster — not just the symptom.

---

## THE PROTOCOL (MANDATORY)

When a bug is identified, execute this sequence:

```
BUG FOUND
    ↓
[1] PAUSE — Do NOT immediately fix. Stop and analyze.
    ↓
[2] CLASSIFY — What category is this bug?
    ↓
[3] IDENTIFY COMORBIDITIES — What patterns statistically accompany this bug type?
    ↓
[4] SEARCH — Look for those patterns in similar code
    ↓
[5] TRIAGE — Critical/security → fix immediately. Others → report and ask.
    ↓
[6] ITERATE — Repeat for each new finding until codebase is clean
    ↓
[7] DOCUMENT — Show full reasoning chain
```

---

## STEP 1: PAUSE

**Rule**: Never fix a bug the moment you see it.

Instead:
- Read the surrounding code (at least 50 lines of context)
- Understand WHY this bug exists
- Consider: Is this a one-off mistake or a pattern?

---

## STEP 2: CLASSIFY

Categorize the bug into one of these classes:

| Category | Examples |
|----------|----------|
| **Null/Undefined** | Null pointer, undefined access, missing optional chain |
| **Validation** | Missing input validation, unchecked user input |
| **Security** | Injection, XSS, CSRF, exposed secrets, auth bypass |
| **Concurrency** | Race condition, deadlock, data corruption |
| **Resource** | Memory leak, unclosed handles, connection exhaustion |
| **Boundary** | Off-by-one, array bounds, loop termination |
| **Type** | Coercion bug, wrong type, comparison error |
| **State** | Inconsistent state, stale data, uninitialized variable |
| **Error Handling** | Silent failure, empty catch, unhandled promise |
| **Logic** | Wrong algorithm, incorrect condition, inverted boolean |

---

## STEP 3: IDENTIFY COMORBIDITIES

Use these knowledge sources (in priority order):

### 1. Built-in Knowledge (Industry Standards)

See [references/bug-comorbidities.md](references/bug-comorbidities.md) for the full cluster map.

Quick reference:

| If You Find... | Also Check For... |
|----------------|-------------------|
| Null/undefined access | Missing validation, async timing, uninitialized state |
| SQL injection | XSS, CSRF, path traversal, command injection |
| Race condition | Deadlocks, data corruption, missing locks |
| Memory leak | Unclosed resources, circular refs, event listener buildup |
| Off-by-one | Empty array handling, loop bounds, boundary conditions |
| Hardcoded secrets | Debug endpoints, verbose errors, other credentials |
| Missing error handling | Silent failures, unhandled promises, empty catches |

### 2. Reference Documents

Check `references/bug-comorbidities.md` for codebase-specific patterns.

### 3. Online Research

For novel patterns not in knowledge base, use WebSearch:
- "[bug type] common accompanying bugs"
- "[bug type] code review checklist"
- "what to check when you find [bug type]"

---

## STEP 4: SEARCH

**Scope**: Similar code patterns (same function types, related modules, same data flows)

**Search Strategy**:

```python
# 1. Find similar code patterns
Grep for: same function signatures, similar variable names, same API calls

# 2. Check related files
Files that: import this module, share types, handle same data

# 3. Look for antipattern signatures
Each comorbidity has telltale patterns — search for those specifically
```

**Example**: If you found a null access bug in a data fetching function:

```bash
# Search for similar fetch functions
Grep: "async.*fetch|await.*get|\.then\("

# Check for missing null checks
Grep: "\.data\." without preceding "if.*data" or "data\?"

# Look for unhandled promise rejections
Grep: "\.catch\(\s*\)" or missing .catch entirely
```

---

## STEP 5: TRIAGE

| Severity | Action | Examples |
|----------|--------|----------|
| **Critical** | Fix immediately, no approval needed | Security vulnerabilities, data corruption, crash bugs |
| **High** | Fix immediately, report what you did | Auth issues, data loss risks, major functionality broken |
| **Medium** | Report and ask before fixing | Logic bugs, edge cases, performance issues |
| **Low** | Create task/todo, don't fix now | Style issues, minor edge cases, optimization opportunities |

**Security always wins**: Any security-related comorbidity is automatically Critical.

---

## STEP 6: ITERATE

After fixing each bug, the fix itself might reveal or create new patterns.

**Rule**: Continue the comorbidity analysis until:
- No new patterns found, OR
- 3 iterations without finding Critical/High issues

**Warning**: Each fix must pass regression tests before moving to next iteration.

---

## STEP 7: DOCUMENT

**Required output format**:

```markdown
## Comorbidity Analysis

### Original Bug
[What was the bug? Where was it? What was the symptom?]

### Bug Category
[Classification from Step 2]

### Comorbidity Reasoning
This bug type statistically accompanies:
1. **[Pattern A]** — because [reasoning based on how these bugs form together]
2. **[Pattern B]** — because [technical explanation of the relationship]
3. **[Pattern C]** — because [why this pattern tends to cluster]

### Search Performed
- Searched: [what patterns/files you searched]
- Scope: [how wide you searched]
- Method: [grep patterns, semantic search, etc.]

### Findings

| Pattern | Found? | Location | Severity | Action Taken |
|---------|--------|----------|----------|--------------|
| Pattern A | Yes | `src/api.ts:42` | Critical | Fixed automatically |
| Pattern B | No | — | — | — |
| Pattern C | Yes | `src/utils.ts:18` | Medium | Awaiting approval |

### Fixes Applied
[For each fix: what changed, why, verification that tests pass]

### New Pattern Discovered (if any)
> **Suggest adding to `bug-comorbidities.md`**:
> In this codebase, [Pattern X] often accompanies [Pattern Y] because [reason].
```

---

## INTEGRATION WITH APEX RULES

| Existing Rule | How Comorbidity Protocol Interacts |
|---------------|-----------------------------------|
| **Bug Prevention** | This protocol IS bug prevention — finding bugs before users do |
| **Regression First** | Run tests after EACH fix, not just at end of analysis |
| **Max 3 Attempts** | Applies per individual bug, not per analysis session |
| **Read First** | Extended: Read 50+ lines of context, not just the bug |
| **Pushback** | If comorbidity search would take hours, report and ask |

---

## EXAMPLES

### Example 1: Null Access Bug

**Found**: `user.profile.email` crashes when profile is undefined

**Classification**: Null/Undefined

**Comorbidity Reasoning**:
1. **Missing input validation** — If profile wasn't checked here, other inputs probably aren't checked either
2. **Async timing issues** — Profile might be undefined because data hasn't loaded yet
3. **Uninitialized state** — Component might render before state is populated

**Search**: All components using `user.profile`, all data fetching functions

**Findings**: Found 3 more null access bugs, 1 race condition in data loading

---

### Example 2: SQL Injection

**Found**: `query("SELECT * FROM users WHERE id = " + userId)`

**Classification**: Security (Injection)

**Comorbidity Reasoning**:
1. **XSS** — If SQL isn't sanitized, HTML output probably isn't either
2. **CSRF** — Security hygiene is likely low across the board
3. **Path traversal** — File operations might have same pattern
4. **Command injection** — Shell operations might concatenate too

**Search**: All database queries, all HTML rendering, all file operations, all shell commands

**Findings**: Found XSS in 2 templates, path traversal in file upload handler

**Action**: All Critical — fixed immediately

---

## QUICK REFERENCE CARD

```
┌─────────────────────────────────────────────────────────────┐
│                 COMORBIDITY PROTOCOL                        │
├─────────────────────────────────────────────────────────────┤
│ 1. PAUSE      — Don't fix immediately                       │
│ 2. CLASSIFY   — What type of bug?                           │
│ 3. IDENTIFY   — What bugs travel with this one?             │
│ 4. SEARCH     — Look for those patterns                     │
│ 5. TRIAGE     — Critical=fix, Medium=ask, Low=todo          │
│ 6. ITERATE    — Repeat until clean                          │
│ 7. DOCUMENT   — Show your reasoning                         │
├─────────────────────────────────────────────────────────────┤
│ REMEMBER: Bugs cluster. Fix the cluster, not the symptom.   │
└─────────────────────────────────────────────────────────────┘
```

---

## Further Reading

- [Bug Comorbidity Clusters](references/bug-comorbidities.md) — Full reference of which bugs travel together
- [Code Review Skill](../code-review/SKILL.md) — Systematic review checklist
- [Security Guardrails](../building-agents/references/security-guardrails.md) — Security-specific patterns
