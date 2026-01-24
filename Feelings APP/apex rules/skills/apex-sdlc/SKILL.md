---
name: apex-sdlc
description: >
  Full software development lifecycle guidance: requirements extraction,
  architecture decisions, API design, testing strategies, CI/CD pipelines,
  monitoring, security, and maintenance. Use when working on architecture,
  database selection, API design, schema, microservices, testing strategy,
  deployment, infrastructure, migrations, or system design tasks.
license: Apache-2.0
compatibility: Claude Code, Cursor, VS Code, GitHub Copilot
metadata:
  author: apex
  version: "4.1"
  updated: "2026-01"
---

# Software Development Lifecycle

## TL;DR

**Ambition vs Precision**: New project = creative choices. Existing codebase = surgical precision.

---

## 1. REQUIREMENTS

### Extraction Protocol

On complex requests, extract into checklist:

```
□ Requirement 1: [specific, measurable]
□ Requirement 2: [specific, measurable]
□ Acceptance: [how to verify complete]
```

### User Story Format

```
As a [role], I want [feature] so that [benefit].
Acceptance: [testable criteria]
```

### Clarification Rules

- Ask ONLY when blocked (missing critical info)
- Batch questions (max 2-3 at once)
- Provide options, not open-ended questions
- Prefer finding answers via codebase search first

---

## 2. ARCHITECTURE & SYSTEM DESIGN

### Decision Framework

| Question | Consider |
|----------|----------|
| Scale? | Users, requests/sec, data volume |
| Consistency? | Strong vs eventual |
| Availability? | Uptime requirements |
| Latency? | Acceptable response times |

### Database Selection

| Use Case | Choose | Avoid |
|----------|--------|-------|
| Relational data, ACID | PostgreSQL | MongoDB |
| Document store, flexible schema | MongoDB | MySQL |
| Cache, sessions, queues | Redis | PostgreSQL |
| Time series, metrics | TimescaleDB, InfluxDB | Generic SQL |
| Search | Elasticsearch, Meilisearch | SQL LIKE |
| Graph relationships | Neo4j | Relational JOINs |

### API Design

**REST Conventions**:

| Operation | Method | Path | Response |
|-----------|--------|------|----------|
| List | GET | /resources | 200 + array |
| Create | POST | /resources | 201 + object |
| Read | GET | /resources/:id | 200 + object |
| Update | PUT | /resources/:id | 200 + object |
| Partial | PATCH | /resources/:id | 200 + object |
| Delete | DELETE | /resources/:id | 204 |

**Error Format**:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable",
    "details": {}
  }
}
```

**Versioning**: URL prefix (`/v1/`) or header (`Accept-Version: 1`)

### Caching Strategy

| Layer | What | TTL |
|-------|------|-----|
| Browser | Static assets | 1 year (versioned) |
| CDN | Public pages, images | Hours to days |
| Application | Computed results | Minutes to hours |
| Database | Query results | Seconds to minutes |

**Cache Invalidation**: Time-based expiry + event-based purge.

### Microservices vs Monolith

| Choose Monolith | Choose Microservices |
|-----------------|----------------------|
| Small team (<5) | Large org, multiple teams |
| Unclear boundaries | Clear bounded contexts |
| Rapid iteration | Independent scaling |
| Simple deployment | Different tech stacks |

---

## 3. IMPLEMENTATION

### Ambition vs Precision

| Context | Approach |
|---------|----------|
| **New project** | Be creative, make opinionated choices |
| **Existing codebase** | Surgical precision, respect conventions |
| **Refactoring** | Minimal changes, preserve behavior |
| **Bug fix** | Root cause only, no scope creep |

### Code Conventions

- **Mimic existing style** — formatting, naming, patterns
- **Check imports** — understand framework choices before adding
- **Verify dependencies** — never assume library availability
- **Comments** — only "why", never "what"

### Edge Case Enumeration

Before implementing, list 3-5 edge cases:

1. **Empty/null** — no data, missing fields
2. **Boundaries** — max length, zero, negative
3. **Auth/permissions** — unauthorized, expired
4. **Concurrency** — race conditions, duplicates
5. **Network** — timeout, retry, offline

---

## 4. TESTING

### Test Pyramid

| Level | Coverage | Speed | Focus |
|-------|----------|-------|-------|
| Unit | 70% | <10ms | Single function/component |
| Integration | 20% | <1s | Module interactions |
| E2E | 10% | <30s | Critical user paths |

### Testing Philosophy

- **Test behavior, not implementation**
- **Critical paths first** — auth, payments, data integrity
- **Edge cases** — from enumeration above
- **No arbitrary coverage %** — focus on risk

### TDD When

- Complex business logic
- Bug reproduction (write failing test first)
- API contracts

### AI-Assisted Testing Risks

AI testing tools introduce specific risks:

| Risk | Description | Mitigation |
|------|-------------|------------|
| **Hallucinated tests** | Tests that don't actually test anything | Always run tests, verify they fail appropriately |
| **Non-deterministic** | Same prompt produces different tests | Seed random generators, log all inputs |
| **Bias in coverage** | AI focuses on obvious paths | Cross-check with mutation testing |
| **Over-confidence** | "100% coverage" claims are misleading | Manual review of critical paths |
| **Outdated patterns** | AI trained on old testing approaches | Verify against current framework docs |

```python
def validate_ai_generated_test(test_code: str, target_function: str):
    """Verify AI-generated test actually tests something."""
    # Step 1: Run the test - it should pass
    result = run_test(test_code)
    if not result.passed:
        raise TestGenerationError("Generated test doesn't pass")
    
    # Step 2: Mutation testing - introduce bug, test should fail
    mutated_function = introduce_bug(target_function)
    mutation_result = run_test(test_code, with_module=mutated_function)
    
    if mutation_result.passed:
        raise TestQualityError(
            "Test passes even with bug - likely hallucinated or weak assertions"
        )
    
    # Step 3: Check for meaningful assertions
    if "assert" not in test_code.lower():
        raise TestQualityError("No assertions found in test")
    
    return True
```

### Test Naming

```
[unit]_[method]_[scenario]_[expected]
test_calculateTotal_emptyCart_returnsZero
```

---

## 5. CODE REVIEW

### PR Guidelines

| Rule | Guideline |
|------|-----------|
| Size | <400 lines (ideal), <800 (max) |
| Focus | Single concern per PR |
| Title | Imperative mood: "Add user auth" |
| Description | What, why, how to test |

### Review Checklist

1. **Correctness** — Does it work? Edge cases handled?
2. **Security** — Inputs validated? Auth checked? Secrets exposed?
3. **Performance** — N+1 queries? Unnecessary loops?
4. **Readability** — Clear naming? Reasonable complexity?
5. **Tests** — Coverage adequate? Tests meaningful?

### Feedback Convention

| Type | Format |
|------|--------|
| Must fix | `[blocking] reason` |
| Suggestion | `[nit] suggestion` |
| Question | `[question] why X?` |
| Praise | `[nice] good approach` |

---

## 6. CI/CD

### Pipeline Stages

```
lint → typecheck → test:unit → test:integration → build → deploy
```

### Environment Tiers

| Env | Purpose | Deploy |
|-----|---------|--------|
| dev | Development testing | On commit |
| staging | Pre-production | On PR merge |
| production | Live users | Manual or scheduled |

### Deployment Strategies

| Strategy | Use When |
|----------|----------|
| **Rolling** | Default, gradual replacement |
| **Blue-Green** | Zero-downtime, instant rollback |
| **Canary** | High-risk, % traffic |
| **Feature flags** | Gradual rollout, A/B |

### Rollback Protocol

1. Detect failure (monitoring alert)
2. Trigger rollback (previous version)
3. Investigate root cause
4. Fix forward (don't patch prod)

---

## 7. MONITORING & OBSERVABILITY

### Logging Format (JSON)

```json
{
  "timestamp": "ISO8601",
  "level": "info|warn|error",
  "message": "Human readable",
  "correlation_id": "uuid",
  "context": {}
}
```

### Log Levels

| Level | Use |
|-------|-----|
| debug | Development only |
| info | Normal operations |
| warn | Recoverable issues |
| error | Failures requiring attention |

### Key Metrics

**RED** (services): Rate, Errors, Duration (p50, p95, p99)

**USE** (resources): Utilization, Saturation, Errors

### Alerting

| Severity | Response | Example |
|----------|----------|---------|
| Critical | Immediate | Service down |
| Warning | Business hours | High error rate |
| Info | Review daily | Unusual patterns |

---

## 8. DOCUMENTATION

### Priority

Self-documenting code > Inline comments > External docs

### Comment Only

- Complex algorithms (the "why")
- Non-obvious business rules
- Workarounds with ticket references
- Public API contracts

### ADR Format

```markdown
# ADR-001: [Title]

## Status
Accepted | Deprecated | Superseded

## Context
[Problem and constraints]

## Decision
[What we decided]

## Consequences
[Trade-offs]
```

---

## 9. DATA MANAGEMENT

### Migration Rules

| Rule | Guideline |
|------|-----------|
| Reversible | Every migration has rollback |
| Incremental | Small changes, frequent deploys |
| Backward compatible | Old code works with new schema |
| Tested | Run against production copy first |

### Validation

**Validate at boundaries**:
- API inputs
- External service responses
- User uploads
- Environment variables

**Trust internally**: Once validated, trust within system.

### Backup Protocol

| Data | Frequency | Retention |
|------|-----------|-----------|
| Database | Daily full, hourly incremental | 30 days |
| User uploads | Real-time replication | Forever |
| Logs | Streaming | 90 days |
| Config | On change (git) | Forever |

---

## 10. SECURITY

### Input Validation

```
Validate → Sanitize → Use
```

- Whitelist over blacklist
- Validate type, length, format, range
- Parameterized queries always
- Escape output contextually

### Authentication Patterns

| Pattern | Use Case |
|---------|----------|
| JWT | Stateless APIs, microservices |
| Session | Traditional web apps |
| OAuth2 | Third-party integration |
| API keys | Server-to-server |

### Secrets Management

| Environment | Storage |
|-------------|---------|
| Development | `.env.local` (gitignored) |
| CI/CD | Pipeline secrets |
| Production | Vault, Secrets Manager |

**NEVER**: Hardcode, commit, log, or expose in errors.

### OWASP Quick Reference

| Risk | Mitigation |
|------|------------|
| Injection | Parameterized queries, input validation |
| Broken Auth | MFA, session timeout, secure passwords |
| Sensitive Data | HTTPS, encrypt at rest, minimize |
| XSS | Output encoding, CSP headers |
| Access Control | Verify permissions every request |

---

## 11. MAINTENANCE

### Refactoring Rules

- **Behavior preservation** — no functional changes
- **Test coverage first** — safety net
- **Small commits** — one refactor per commit
- **No feature mixing** — refactor OR feature

### Tech Debt Management

- **Track**: Create tickets for known debt
- **Prioritize**: Risk × Impact × Effort
- **Budget**: 20% of sprint for debt
- **Never**: Let debt block features

### Dependency Updates

| Type | Frequency | Approach |
|------|-----------|----------|
| Security patches | Immediate | Automated PRs |
| Minor versions | Weekly | Batch updates |
| Major versions | Quarterly | Planned migration |

---

## VERIFICATION CHECKLIST

Before completing any significant task:

```
□ Requirements met (all checklist items)
□ Quality gates passed (build, lint, types, tests)
□ Security reviewed (no secrets, inputs validated)
□ Documentation updated (if public API)
□ Edge cases handled (from enumeration)
□ Monitoring in place (for production)
```

---

*APEX v4.1 SDLC — Full lifecycle coverage.*
