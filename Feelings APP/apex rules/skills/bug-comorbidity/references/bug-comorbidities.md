# Bug Comorbidity Clusters

> **Last Updated**: 2026-01-24
> 
> **Purpose**: Reference document mapping which bug patterns statistically accompany each other. Use during comorbidity analysis to know what to search for.

---

## How to Use This Document

When you find a bug:
1. Find its category in the table below
2. Check ALL listed comorbidities
3. Search for the specific patterns provided
4. Add new discoveries to the "Codebase-Specific" section

---

## Master Comorbidity Table

### Null/Undefined Handling

| If You Find | Also Check For | Why They Travel Together |
|-------------|----------------|--------------------------|
| Null pointer access | Missing optional chaining (`?.`) elsewhere | Same defensive coding gap |
| Undefined property access | Missing default values | Incomplete initialization patterns |
| Null access in async code | Race conditions | Data might not be ready |
| Missing null check | Unvalidated function parameters | Input validation discipline |
| TypeError: cannot read property | Unhandled promise rejections | Async error handling gap |

**Search Patterns**:
```bash
# Find potential null access
rg "\.\w+\." --type ts | grep -v "\?\." | grep -v "if.*\."

# Find missing optional chains
rg "(\w+)\.(\w+)\.(\w+)" --type ts  # Triple-deep access without ?.

# Find uninitialized state usage
rg "useState\(\)" --type tsx  # No initial value
```

---

### Security Vulnerabilities

| If You Find | Also Check For | Why They Travel Together |
|-------------|----------------|--------------------------|
| SQL injection | XSS, command injection, path traversal | Same "concatenate untrusted input" antipattern |
| XSS | CSRF, open redirect | Frontend security hygiene |
| Hardcoded credentials | Debug endpoints, verbose errors | Security awareness gap |
| Missing auth check | Broken access control elsewhere | Auth pattern inconsistency |
| Weak password hashing | Insecure session management | Crypto knowledge gap |
| CORS misconfiguration | Other header misconfigurations | HTTP security awareness |

**Search Patterns**:
```bash
# SQL injection
rg "query\(.*\+|execute\(.*\+" --type py
rg "\$\{.*\}.*SELECT|SELECT.*\+\s*\w+" --type ts

# XSS
rg "innerHTML|dangerouslySetInnerHTML|v-html" --type-add 'web:*.{ts,tsx,vue,html}'
rg "document\.write" --type js

# Hardcoded secrets
rg "(password|secret|key|token)\s*[:=]\s*['\"][^'\"]+['\"]" -i

# Missing auth
rg "@(Public|NoAuth|Anonymous)" --type ts  # Then verify intentional
```

---

### Concurrency & Race Conditions

| If You Find | Also Check For | Why They Travel Together |
|-------------|----------------|--------------------------|
| Race condition | Deadlocks | Lock ordering issues |
| Data race | Inconsistent state reads | Shared mutable state |
| Check-then-act bug | Other TOCTOU vulnerabilities | Same timing assumption error |
| Missing mutex | Other unprotected critical sections | Incomplete locking discipline |
| Stale closure | Other closure capture bugs | JavaScript async mental model |

**Search Patterns**:
```bash
# Stale closures in React
rg "useEffect.*\[\]" --type tsx  # Empty deps with state reference inside

# Check-then-act
rg "if.*exists.*\n.*create|if.*null.*\n.*=\s" --multiline

# Unprotected shared state
rg "let \w+ =" --type ts  # Module-level mutable state
```

---

### Resource Management

| If You Find | Also Check For | Why They Travel Together |
|-------------|----------------|--------------------------|
| Memory leak | Unclosed file handles | Resource cleanup discipline |
| Connection leak | Other pool exhaustion | Connection management pattern |
| Event listener leak | Timer leaks (setInterval) | Cleanup in unmount/destroy |
| Circular reference | Other GC-preventing patterns | Object lifecycle awareness |
| Missing finally block | Other cleanup omissions | Error path resource handling |

**Search Patterns**:
```bash
# Event listener without cleanup
rg "addEventListener" --type ts
rg "removeEventListener" --type ts  # Compare counts

# setInterval without clear
rg "setInterval" --type ts
rg "clearInterval" --type ts  # Compare counts

# Open without close
rg "\.open\(|createConnection|new.*Client\(" --type ts
rg "\.close\(|\.end\(|\.destroy\(" --type ts  # Compare
```

---

### Boundary & Off-by-One

| If You Find | Also Check For | Why They Travel Together |
|-------------|----------------|--------------------------|
| Off-by-one in loop | Other loop termination bugs | Loop boundary mental model |
| Array index out of bounds | Empty array not handled | Array edge case handling |
| String index error | Other string boundary bugs | String manipulation patterns |
| Pagination bug | Other offset calculations | Counting from 0 vs 1 |
| Fence post error | Other counting bugs | Discrete math errors |

**Search Patterns**:
```bash
# Potential off-by-one
rg "\.length\s*-\s*1|< \w+\.length|<= \w+\.length" --type ts

# Empty array not checked
rg "\[0\]" --type ts | grep -v "if.*length"

# Pagination
rg "offset|skip|limit|page" --type ts
```

---

### Type & Coercion

| If You Find | Also Check For | Why They Travel Together |
|-------------|----------------|--------------------------|
| Type coercion bug | Other `==` vs `===` issues | Equality operator discipline |
| parseInt without radix | Other parsing edge cases | Parsing function knowledge |
| NaN propagation | Other numeric edge cases | Number handling patterns |
| Truthy/falsy confusion | Other boolean coercion bugs | JavaScript truthiness model |
| JSON.parse without try | Other parsing without validation | Input parsing discipline |

**Search Patterns**:
```bash
# Loose equality
rg "==(?!=)" --type ts  # == but not ===

# parseInt without radix
rg "parseInt\(\w+\)" --type ts  # Missing second arg

# JSON.parse without try
rg "JSON\.parse" --type ts | grep -v "try"
```

---

### Error Handling

| If You Find | Also Check For | Why They Travel Together |
|-------------|----------------|--------------------------|
| Empty catch block | Other silent failures | Error handling philosophy |
| Swallowed exception | Missing error logging | Observability gaps |
| Generic catch | Other broad exception handling | Error specificity discipline |
| Missing error boundary | Other unhandled errors | React error handling pattern |
| Unhandled promise rejection | Other async error gaps | Promise error discipline |

**Search Patterns**:
```bash
# Empty catch
rg "catch\s*\(\w*\)\s*\{\s*\}" --type ts

# Catch without logging
rg "catch.*\{[^}]*\}" --type ts | grep -v "console\|log\|throw"

# Missing .catch()
rg "\.then\(" --type ts | grep -v "\.catch"
```

---

### State Management

| If You Find | Also Check For | Why They Travel Together |
|-------------|----------------|--------------------------|
| Stale state read | Other closure capture bugs | React state mental model |
| State mutation | Other direct state modifications | Immutability discipline |
| Missing state sync | Other derived state bugs | State derivation patterns |
| Redux action without reducer | Other state flow gaps | State management completeness |
| Context not updating | Other React context bugs | Context API understanding |

**Search Patterns**:
```bash
# Direct state mutation
rg "state\.\w+\s*=" --type tsx
rg "\.push\(|\.pop\(|\.splice\(" --type tsx  # Array mutations

# Stale closure in useCallback/useMemo
rg "use(Callback|Memo).*\[\]" --type tsx
```

---

## Codebase-Specific Patterns

> Add patterns discovered in YOUR codebase here.

| Pattern A | Often Accompanies | Discovered | Context |
|-----------|-------------------|------------|---------|
| *Example: Missing API error handling* | *Missing loading states* | *2026-01-15* | *Our fetch utils* |

---

## Cross-Category Clusters

Some bugs span multiple categories. These are especially important:

### The "Untrusted Input" Cluster
If you find ANY input handling bug, check ALL of:
- SQL injection
- XSS
- Command injection
- Path traversal
- SSRF
- Deserialization

### The "Async Discipline" Cluster
If you find ANY async bug, check ALL of:
- Unhandled promise rejection
- Race condition
- Stale closure
- Missing loading state
- Missing error state
- Zombie subscriptions

### The "Resource Lifecycle" Cluster
If you find ANY resource leak, check ALL of:
- File handle leaks
- Connection leaks
- Event listener leaks
- Timer leaks
- Subscription leaks
- Memory leaks

---

## Probability Guide

Based on industry data, when you find bug type A, the probability of also finding bug type B:

| Bug A | Bug B | Probability |
|-------|-------|-------------|
| SQL injection | XSS | ~70% |
| Null access | Missing validation | ~60% |
| Memory leak | Event listener leak | ~55% |
| Race condition | Inconsistent state | ~65% |
| Empty catch | Other silent failures | ~80% |
| Off-by-one | Other boundary bugs | ~50% |

*Probabilities are estimates based on code review patterns. Actual rates vary by codebase.*

---

## Maintenance

**When to update this document**:
- When you discover a new comorbidity pattern in a codebase
- When industry research identifies new bug clusters
- During quarterly APEX audits

**How to add a pattern**:
1. Add to the appropriate category table
2. Include the "Why They Travel Together" reasoning
3. Add search patterns if known
4. If codebase-specific, add to that section instead
