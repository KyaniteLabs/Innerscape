# APEX Rules Manifest

> **Last Updated**: 2026-01-24
> 
> **Purpose**: Central index of all active rules, their locations, and verification status.

---

## Rule Hierarchy

```
APEX_CORE.md (highest authority)
    ↓
APEX_DESIGN.md / APEX_SDLC.md / APEX_SETUP.md
    ↓
SKILL.md files (must not contradict above)
    ↓
references/*.md (supporting documentation)
```

**Conflict Resolution**: When rules conflict, higher-level documents take precedence.

---

## Core Documents

| Document | Version | Last Verified | Status | Notes |
|----------|---------|---------------|--------|-------|
| `APEX_CORE.md` | 4.3.0 | 2026-01-24 | Current | Primary rules |
| `APEX_DESIGN.md` | 4.3.0 | 2026-01-24 | Current | UI/UX standards |
| `APEX_SDLC.md` | 4.3.0 | 2026-01-24 | Current | Development lifecycle |
| `APEX_SETUP.md` | 4.0 | 2026-01-24 | Current | Minor version mismatch noted |
| `CHANGELOG.md` | - | 2026-01-24 | Current | Version history |
| `DEPRECATION_LOG.md` | - | 2026-01-24 | New | Tracks deprecated items |

---

## Skills Index

| Skill | Path | Last Verified | Status | Key Rules |
|-------|------|---------------|--------|-----------|
| **building-agents** | `apex/skills/building-agents/SKILL.md` | 2026-01-24 | Updated | Agent SDK, orchestration, security |
| **autonomous-loop** | `apex/skills/autonomous-loop/SKILL.md` | 2026-01-24 | Verified | Loop protocol, handoffs |
| **apex-design** | `apex/skills/apex-design/SKILL.md` | 2026-01-24 | Verified | UI patterns, typography |
| **apex-sdlc** | `apex/skills/apex-sdlc/SKILL.md` | 2026-01-24 | Verified | Testing, deployment |
| **browser-verification** | `apex/skills/browser-verification/SKILL.md` | 2026-01-24 | Verified | Browser testing |
| **bug-comorbidity** | `apex/skills/bug-comorbidity/SKILL.md` | 2026-01-24 | **New** | Comorbid bug detection, pattern clusters |
| **code-review** | `apex/skills/code-review/SKILL.md` | 2026-01-24 | Verified | Review checklist |
| **project-audit** | `apex/skills/project-audit/SKILL.md` | 2026-01-24 | **New** | APEX standards audit, A-F scoring |
| **codebase-visualizer** | `apex/skills/codebase-visualizer/SKILL.md` | 2026-01-24 | Verified | Visualization tools |
| **git-commit** | `apex/skills/git-commit/SKILL.md` | 2026-01-24 | Verified | Commit conventions |
| **prd-generator** | `apex/skills/prd-generator/SKILL.md` | 2026-01-24 | Verified | PRD templates |
| **self-improvement** | `apex/skills/self-improvement/SKILL.md` | 2026-01-24 | Verified | Meta-learning |

---

## Reference Documents (Updated 2026-01-24)

| Document | Path | Status | 2026 Updates |
|----------|------|--------|--------------|
| `orchestration-patterns.md` | `building-agents/references/` | Updated | P-t-E, Failure Modes, Observability |
| `agent-sdk-api.md` | `building-agents/references/` | Updated | 2026 SDKs, A2A Protocol |
| `memory-management.md` | `building-agents/references/` | Updated | Cost optimization, Memory poisoning |
| `security-guardrails.md` | `building-agents/references/` | Updated | Agent Gateway, MCP Security |
| `evaluation-evals.md` | `building-agents/references/` | Updated | SWE-Bench-Pro, Eval hygiene |
| `practical-agent-templates.md` | `building-agents/references/` | Updated | Cost checklist, CLAUDE.md |
| `example-agents.md` | `building-agents/references/` | Verified | Template agents |

---

## Core Rules Summary (from APEX_CORE.md)

### Bug Prevention Laws

| Law | Rule Summary |
|-----|--------------|
| **Bug Prevention** | NEVER reintroduce fixed bugs. NEVER break working code. |
| **Regression First** | Run tests BEFORE and AFTER changes. |
| **Observe** | Every failure visible to user. No empty catch blocks. |
| **Single Source** | One variable per state. No shadow copies. |
| **No Magic** | Extract constants. No unexplained values. |
| **Non-Destructive** | User data needs undo path. |
| **Safe Defaults** | Fallback on bad data. Never crash. |
| **Read First** | MUST read file before editing. |
| **Pushback** | Reject requests that break UX/security. |

### Quality Gates

| Gate | Requirement |
|------|-------------|
| Baseline | Tests passed BEFORE changes |
| Build | Compiles without errors |
| Lint | Passes project linter |
| Types | No type errors |
| Test | ALL tests pass |
| Regression | No previously passing tests fail |
| Security | No exposed secrets, validated inputs |

---

## 2026 Research Integration

### New Patterns Added

| Pattern | Location | Source |
|---------|----------|--------|
| Plan-then-Execute (P-t-E) | `orchestration-patterns.md` | OpenAI Guide |
| Multi-Agent Failure Modes | `orchestration-patterns.md` | Galileo AI |
| Agent Gateway | `security-guardrails.md` | Linux Foundation |
| MCP Security | `security-guardrails.md` | OWASP GenAI |
| Cost Optimization | `memory-management.md`, `practical-agent-templates.md` | AgentsArcade |
| Reasoning Model Prompting | `orchestration-patterns.md`, `practical-agent-templates.md` | Microsoft Azure |

### New Protocols Documented

| Protocol | Purpose | Documentation |
|----------|---------|---------------|
| MCP v2025.11.25 | Agent-to-tool | `agent-sdk-api.md` |
| A2A Protocol | Agent-to-agent | `agent-sdk-api.md` |
| Open Agent Spec | Cross-framework portability | `agent-sdk-api.md` |

### New SDKs Documented

| SDK | Version | Documentation |
|-----|---------|---------------|
| OpenAI Agents SDK | 0.6.x | `agent-sdk-api.md` |
| Google ADK | 0.5.0 | `agent-sdk-api.md` |
| Microsoft Agent Framework | 1.x | `agent-sdk-api.md` |

---

## Cross-Reference Validation

| Source | References | Consistency |
|--------|------------|-------------|
| `APEX_CORE.md` → `building-agents/SKILL.md` | Auto-routing table | Verified |
| `APEX_CORE.md` → `APEX_DESIGN.md` | UI triggers | Verified |
| `APEX_CORE.md` → `APEX_SDLC.md` | Architecture triggers | Verified |
| `building-agents/SKILL.md` → `references/*.md` | Further reading links | Verified |
| `orchestration-patterns.md` → `evaluation-evals.md` | Benchmark citations | Updated |
| `security-guardrails.md` → `orchestration-patterns.md` | Failure mode links | Added |

---

## Deprecated Rules

See `DEPRECATION_LOG.md` for full list. Summary:

| Rule ID | Original | Replacement | Date |
|---------|----------|-------------|------|
| DEP-001 | ReAct as default | P-t-E for production | 2026-01-24 |
| DEP-002 | OpenAI SDK v1.x | SDK v2.x, Agents SDK 0.6.x | 2026-01-24 |
| DEP-003 | Single-agent assumptions | Multi-agent orchestration | 2026-01-24 |

---

## Version Compatibility

| Component | Minimum | Recommended | Notes |
|-----------|---------|-------------|-------|
| Claude Agent SDK | 1.5+ | Latest | Per APEX_CORE.md |
| MCP Specification | 2025-11-25 | Latest | Current stable |
| Python | 3.10+ | 3.12 | |
| Node.js | 18+ | 20 LTS | |
| TypeScript | 5.0+ | 5.3+ | |
| OpenAI Agents SDK | 0.4+ | 0.6.x | Requires OpenAI v2.x |
| Google ADK | 0.5.0 | 0.5.0 | Multi-language support |

---

## Audit Schedule

| Audit Type | Frequency | Last Completed | Next Due |
|------------|-----------|----------------|----------|
| Reference files update | Quarterly | 2026-01-24 | 2026-04-24 |
| Skills verification | Quarterly | 2026-01-24 | 2026-04-24 |
| Core docs review | Semi-annually | 2026-01-24 | 2026-07-24 |
| Full consistency audit | Annually | 2026-01-24 | 2027-01-24 |

---

## Maintenance Instructions

**When adding new rules:**
1. Add to appropriate document (APEX_CORE.md for fundamental, SKILL.md for domain-specific)
2. Update this manifest with new rule summary
3. Check for conflicts with existing rules
4. Update DEPRECATION_LOG.md if replacing existing rule

**When updating existing rules:**
1. Update the source document
2. Update "Last Verified" date in this manifest
3. Check cross-references for consistency
4. Document significant changes in CHANGELOG.md

**When deprecating rules:**
1. Add entry to DEPRECATION_LOG.md
2. Update this manifest's Deprecated Rules section
3. Add deprecation notice to source document (if keeping for reference)
4. Update any cross-references
