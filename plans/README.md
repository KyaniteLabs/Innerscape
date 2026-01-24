# LifeOS Plans

This folder contains active implementation plans for the LifeOS project.

## Active Plans

| Plan | Status | Description |
|------|--------|-------------|
| [CONSOLIDATION_PLAN_2026-01-24.md](./CONSOLIDATION_PLAN_2026-01-24.md) | **ACTIVE** | Mobile app consolidation + feature parity |

## Archived Plans

Previous plans have been moved to `_archived/old-plans/` to avoid confusion:

- `REMEDIATION_PLAN.md` - Original remediation plan (referenced Flutter, now outdated)
- `IMPLEMENTATION_PLAN.md` - Previous implementation plan
- `LIFEOS_SUITE_PLAN.md` - Original suite architecture plan
- `FLUTTER_MOBILE_PLAN.md` - Flutter mobile plan (deprecated)

## Usage

When starting implementation, always reference the **active** plan in this folder.
The active plan includes:

- APEX v4.3.0 compliance
- Quality gates and rollback procedures
- Acceptance criteria for each task
- Full technical specifications

## Creating New Plans

When a major feature or refactoring is needed:

1. Create a new plan file with date: `FEATURE_NAME_YYYY-MM-DD.md`
2. Mark previous related plans as archived
3. Update this README
