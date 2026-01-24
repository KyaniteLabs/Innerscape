# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records for the NeuroSecond project.

## What is an ADR?

An Architecture Decision Record (ADR) captures an important architectural decision along with its context and consequences.

## ADR Index

| ADR | Title | Status |
|-----|-------|--------|
| [0000](0000-adr-template.md) | ADR Template | Template |
| [0001](0001-nextjs-app-router.md) | Use Next.js 16 App Router | Accepted |
| [0002](0002-sqlite-libsql-database.md) | Use SQLite via libSQL with Drizzle ORM | Accepted |
| [0003](0003-glm-agent-architecture.md) | Use GLM-4.7 Agent Architecture | Accepted |
| [0004](0004-deferred-authentication.md) | Defer Authentication for Local Deployment | Accepted |
| [0005](0005-error-handling-strategy.md) | Centralized Error Handling Strategy | Accepted |

## Creating a New ADR

1. Copy `0000-adr-template.md` to a new file
2. Name it `NNNN-brief-title.md` (use next available number)
3. Fill in all sections
4. Add to the index above
5. Commit with message: `docs(adr): Add ADR-NNNN brief-title`

## ADR Statuses

- **Proposed** - Under discussion, not yet decided
- **Accepted** - Decision made, currently in effect
- **Deprecated** - No longer relevant
- **Superseded** - Replaced by a newer ADR (link to replacement)

## References

- [ADR GitHub Organization](https://adr.github.io/)
- [Michael Nygard's Article on ADRs](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
