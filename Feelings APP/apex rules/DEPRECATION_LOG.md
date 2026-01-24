# APEX Deprecation Log

> **Last Updated**: 2026-01-24
> 
> **Purpose**: Track deprecated items, resolved conflicts, and archived files during the 2026 State of the Art update.

---

## Summary

| Category | Count | Status |
|----------|-------|--------|
| Deprecated Items | 3 | Documented |
| Resolved Conflicts | 1 | Updated |
| Archived Files | 0 | N/A |
| Updated References | 6 | Complete |

---

## Deprecated Items

### DEP-001: ReAct Pattern as Default

| Field | Value |
|-------|-------|
| **Location** | Multiple SKILL.md files |
| **Original** | ReAct (Reasoning + Acting) as primary agent pattern |
| **Reason** | Plan-then-Execute (P-t-E) now recommended for production (2026) |
| **Replacement** | Use P-t-E for complex tasks; ReAct acceptable for simple exploration |
| **Date** | 2026-01-24 |

**Files affected:**
- `apex/skills/building-agents/SKILL.md` — Added P-t-E context
- `apex/skills/autonomous-loop/SKILL.md` — References ReAct, needs P-t-E addition
- `apex/skills/self-improvement/SKILL.md` — References ReAct
- `apex/skills/apex-design/SKILL.md` — References ReAct
- `apex/skills/git-commit/SKILL.md` — References ReAct

**Resolution**: Updated `orchestration-patterns.md` with P-t-E as Pattern 0 (Recommended). SKILL.md files reference updated patterns doc.

---

### DEP-002: OpenAI SDK v1.x

| Field | Value |
|-------|-------|
| **Location** | Various reference files |
| **Original** | References to OpenAI SDK v1.x |
| **Reason** | OpenAI Agents SDK 0.4.0+ requires v2.x |
| **Replacement** | Use OpenAI SDK v2.x, Agents SDK 0.6.x |
| **Date** | 2026-01-24 |

**Resolution**: Updated `agent-sdk-api.md` with 2026 SDK versions and changelog.

---

### DEP-003: Single-Agent Assumptions

| Field | Value |
|-------|-------|
| **Location** | Legacy documentation patterns |
| **Original** | Documentation assuming single-agent workflows |
| **Reason** | Multi-agent orchestration is now standard (2026) |
| **Replacement** | Hub-and-Spoke or P-t-E patterns for most use cases |
| **Date** | 2026-01-24 |

**Resolution**: Updated `orchestration-patterns.md` with multi-agent failure modes and performance benchmarks.

---

## Resolved Conflicts

### CONF-001: Accuracy Claims

| Field | Value |
|-------|-------|
| **Files** | `orchestration-patterns.md`, `evaluation-evals.md` |
| **Conflict** | "100% accuracy" claim without benchmark citation |
| **Resolution** | Added caveat: benchmark-specific (AIMultiple analytics), cite source |
| **Authoritative** | `evaluation-evals.md` — now contains 2026 benchmark standards |
| **Date** | 2026-01-24 |

---

## Updated Reference Files (Phase 1)

| File | Update Summary | Date |
|------|----------------|------|
| `orchestration-patterns.md` | Added P-t-E, Failure Modes, Observability, Evaluation Notes | 2026-01-24 |
| `agent-sdk-api.md` | Added 2026 SDKs, A2A Protocol, Protocol Comparison | 2026-01-24 |
| `memory-management.md` | Added Cost Optimization, Memory Poisoning Defense | 2026-01-24 |
| `security-guardrails.md` | Added Agent Gateway, MCP Security, Command Injection | 2026-01-24 |
| `evaluation-evals.md` | Added SWE-Bench-Pro, Evaluation Hygiene, Known Pitfalls | 2026-01-24 |
| `practical-agent-templates.md` | Added Cost Checklist, CLAUDE.md Template, Reasoning Models | 2026-01-24 |

---

## Archived Files

*No files archived during this update. All existing content updated in place.*

---

## Phase 4 Audit Notes (Pending)

The following will be audited in Phase 4:

**APEX Core Documents:**
- [ ] `APEX_CORE.md` — Appears current (Jan 2026), verify MCP version
- [ ] `APEX_DESIGN.md` — Check for stale UI patterns
- [ ] `APEX_SDLC.md` — Check for outdated workflow instructions
- [ ] `APEX_SETUP.md` — Check for stale installation steps

**SKILL.md Files (10 total):**
- [ ] `apex-design/SKILL.md`
- [ ] `apex-sdlc/SKILL.md`
- [ ] `autonomous-loop/SKILL.md`
- [ ] `browser-verification/SKILL.md`
- [ ] `building-agents/SKILL.md`
- [ ] `code-review/SKILL.md`
- [ ] `codebase-visualizer/SKILL.md`
- [ ] `git-commit/SKILL.md`
- [ ] `prd-generator/SKILL.md`
- [ ] `self-improvement/SKILL.md`

---

## Maintenance Notes

**When to update this log:**
1. When deprecating a pattern, SDK, or practice
2. When resolving conflicting information between files
3. When archiving outdated files
4. During periodic APEX audits

**Update process:**
1. Add entry to appropriate section
2. Include all fields (Location, Original, Reason, Replacement, Date)
3. Update Summary counts
4. Cross-reference in affected files if needed
