# APEX ENGINEERING RULES v4.3.0 — SDLC
**Full Software Development Lifecycle | January 2026**

---

## 1. REQUIREMENTS

### Extraction Protocol
On complex requests, extract into checklist:
```
□ Requirement 1: [specific, measurable]
□ Requirement 2: [specific, measurable]
□ Acceptance: [how to verify complete]
```

### User Story Format (when applicable)
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

### API Design Principles

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

**Cache Invalidation**: Prefer time-based expiry + event-based purge.

### Microservices vs Monolith

| Choose Monolith When | Choose Microservices When |
|----------------------|---------------------------|
| Small team (<5 devs) | Large org, multiple teams |
| Unclear domain boundaries | Clear bounded contexts |
| Rapid iteration needed | Independent scaling required |
| Simple deployment | Different tech stacks needed |

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
- **Regression prevention is mandatory** — never break working code

### Regression Testing (MANDATORY)

| When | Action |
|------|--------|
| **Before any change** | Run full test suite to establish baseline |
| **After any change** | Run full test suite — ALL must pass |
| **If tests fail** | Fix regression IMMEDIATELY — do not continue |
| **If unable to fix** | ROLLBACK changes, report blocker |

**The Rule**: A "fix" that breaks something else is NOT a fix. A task that introduces regressions is NOT complete.

### TDD When

- Complex business logic
- Bug reproduction (write failing test first)
- API contracts

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
3. **Performance** — N+1 queries? Unnecessary loops? Memory leaks?
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
| staging | Pre-production validation | On PR merge |
| production | Live users | Manual or scheduled |

### Deployment Strategies

| Strategy | Use When |
|----------|----------|
| **Rolling** | Default, gradual replacement |
| **Blue-Green** | Zero-downtime, instant rollback |
| **Canary** | High-risk changes, % traffic |
| **Feature flags** | Gradual rollout, A/B testing |

### Rollback Protocol

1. Detect failure (monitoring alert or manual)
2. Trigger rollback (previous known-good version)
3. Investigate root cause
4. Fix forward (don't patch in production)

---

## 7. MONITORING & OBSERVABILITY

### Logging Standards

**Format**: Structured JSON
```json
{
  "timestamp": "ISO8601",
  "level": "info|warn|error",
  "message": "Human readable",
  "correlation_id": "uuid",
  "context": {}
}
```

**Levels**:
| Level | Use |
|-------|-----|
| debug | Development only |
| info | Normal operations |
| warn | Recoverable issues |
| error | Failures requiring attention |

### Key Metrics (RED/USE)

**RED** (services):
- **R**ate — requests/second
- **E**rrors — error rate %
- **D**uration — latency percentiles (p50, p95, p99)

**USE** (resources):
- **U**tilization — % capacity used
- **S**aturation — queue depth
- **E**rrors — error count

### Alerting Rules

| Severity | Response | Example |
|----------|----------|---------|
| Critical | Immediate (page) | Service down, data loss |
| Warning | Business hours | High error rate, slow response |
| Info | Review daily | Unusual patterns |

---

## 8. DOCUMENTATION

### Code Documentation

**Priority**: Self-documenting code > Inline comments > External docs

**Comment only**:
- Complex algorithms (the "why")
- Non-obvious business rules
- Workarounds with ticket references
- Public API contracts

### API Documentation

**Standard**: OpenAPI/Swagger for REST, GraphQL schema for GraphQL

**Include**:
- All endpoints with examples
- Authentication requirements
- Error responses
- Rate limits

### Architecture Decision Records (ADRs)

**When**: Major technical decisions (database choice, framework, patterns)

**Format**:
```markdown
# ADR-001: [Title]

## Status
Accepted | Deprecated | Superseded by ADR-XXX

## Context
[Problem and constraints]

## Decision
[What we decided]

## Consequences
[Trade-offs, implications]
```

### README Standards

Every project root:
```markdown
# Project Name
One-line description.

## Quick Start
[3-5 commands to run locally]

## Architecture
[High-level overview or link to docs]

## Contributing
[How to contribute]
```

---

## 9. DATA MANAGEMENT

### Migration Strategy

| Rule | Guideline |
|------|-----------|
| Reversible | Every migration has rollback |
| Incremental | Small changes, frequent deploys |
| Backward compatible | Old code works with new schema |
| Tested | Run against production copy first |

### Data Validation

**Validate at boundaries**:
- API inputs (request body, params)
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
- Escape output contextually (HTML, SQL, URL)

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
| Production | Vault, AWS Secrets Manager, platform secrets |

**NEVER**: Hardcode, commit, log, or expose in errors.

### OWASP Top 10 Quick Reference

| Risk | Mitigation |
|------|------------|
| Injection | Parameterized queries, input validation |
| Broken Auth | MFA, session timeout, secure password storage |
| Sensitive Data | HTTPS, encrypt at rest, minimize collection |
| XXE | Disable external entities in XML parsers |
| Access Control | Verify permissions every request |
| Misconfiguration | Automated security scanning, least privilege |
| XSS | Output encoding, CSP headers |
| Deserialization | Avoid deserializing untrusted data |
| Vulnerable Components | Dependency scanning, regular updates |
| Logging | Log security events, protect logs |

---

## 11. MAINTENANCE

### Refactoring Rules

- **Behavior preservation** — no functional changes
- **Test coverage first** — safety net before refactoring
- **Small commits** — one refactor per commit
- **No feature mixing** — refactor OR feature, not both

### Tech Debt Management

**Track**: Create tickets for known debt
**Prioritize**: Risk × Impact × Effort
**Budget**: 20% of sprint capacity for debt reduction
**Never**: Let debt block features

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
□ Baseline verified (tests passed BEFORE changes)
□ Requirements met (all checklist items)
□ Quality gates passed (build, lint, types, tests)
□ No regressions (all previously passing tests still pass)
□ Security reviewed (no secrets, inputs validated)
□ Documentation updated (if public API or architecture)
□ Edge cases handled (from enumeration)
□ Monitoring in place (for production changes)
```

**Critical**: If you cannot check "No regressions", the task is NOT complete. Fix the regression or rollback.

---

*APEX v4.3.0 SDLC — Full lifecycle coverage. See APEX_CORE.md for fundamentals.*
