# Comorbidity Analysis: Architectural Boundary Violations

**Date**: January 24, 2026  
**Applied**: APEX Bug-Comorbidity Protocol v1.0  
**Status**: CRITICAL CLUSTER IDENTIFIED

---

## Original Bug (Primary)

**Location**: `lifeos-shared/src/storage/syncService.ts:2`

```typescript
import { SCHEMA } from '../../../innerscape-soma/lib/sync/schema';
```

**Symptom**: Shared library build fails with:
```
File '/Volumes/.../innerscape-soma/lib/sync/schema.ts' is not under 'rootDir'
```

**Root Cause**: Circular dependency — shared library imports from specific app (Soma)

---

## Bug Category

**Classification**: State Management + Architecture Boundary Violation

This is NOT just a single bug. It's a **pattern violation** that indicates systemic architectural issues.

---

## Comorbidity Reasoning

When you find one architectural boundary violation, these patterns statistically accompany it:

| Pattern | Why It Clusters | Risk |
|---------|-----------------|------|
| **Multiple schema definitions** | If one shared schema is in wrong place, others likely are too | HIGH |
| **Monorepo boundary confusion** | Same root cause: unclear what belongs where | HIGH |
| **Duplicate type definitions** | Types should be in shared, but live in specific apps | MEDIUM |
| **Unexecuted exports** | Public re-exports of broken modules | MEDIUM |
| **Version mismatches** | Different apps using different Schema/PowerSync versions | MEDIUM |
| **Undocumented dependencies** | Dependencies on non-published app internals | HIGH |

---

## Comorbidity Search Results

### ✅ Comorbidity #1: PUBLIC RE-EXPORT OF BROKEN MODULE

**Found**: YES  
**Location**: `lifeos-shared/src/index.ts`

```typescript
export * from './storage/syncService';  // Line 7 — exports the broken module!
```

**Why This Is Critical**:
- Any code that imports `@lifeos/shared` gets `syncService`
- `syncService` imports from `innerscape-soma/lib/sync/schema`
- This **propagates the circular dependency** to all consumers
- Creates implicit coupling between all apps

**Severity**: 🔴 **CRITICAL** — The broken module is publicly exposed

---

### ✅ Comorbidity #2: MULTIPLE SCHEMA DEFINITIONS

**Found**: YES  
**Locations**:
1. `innerscape-soma/lib/sync/schema.ts` — PowerSync schema (CLIENT)
2. `lifeos-backend/src/db/schema.ts` — Drizzle ORM schema (SERVER)
3. `Second Brain Project/src/lib/db/schema.ts` — Drizzle ORM schema (WEB)

**Why This Is Problematic**:
- PowerSync and Drizzle schemas should be defined ONCE in shared
- Currently tripled/duplicated across different apps
- Single source of truth principle violated
- Schema changes require updates in 3 places

**Related Risk**: Schemas can drift and cause sync failures

**Severity**: 🔴 **CRITICAL** — Multiple sources of truth

---

### ✅ Comorbidity #3: UNCLEAR MONOREPO BOUNDARIES

**Found**: YES  
**Pattern**: Code organization doesn't reflect dependency relationships

**Evidence**:
- `lifeos-shared` contains components AND business logic
- App-specific code (Soma screens) exported from shared
- Utilities mixed with app logic
- No clear "api → shared" vs "shared → app" boundaries

**Severity**: 🟡 **HIGH** — Will cause similar issues in future

---

### ✅ Comorbidity #4: UNVERSIONED/UNDECLARED CROSS-APP DEPENDENCIES

**Found**: YES  
**Pattern**: `lifeos-shared` uses relative paths to reach Soma, but Soma isn't listed as dependency

```typescript
import { SCHEMA } from '../../../innerscape-soma/lib/sync/schema';
// ☝️ No guarantee innerscape-soma/lib exists or exports SCHEMA
// No type checking, no version tracking, brittle path
```

**Why It Breaks**:
- If Soma restructures, shared breaks silently
- No way to track version compatibility
- Different from how other packages work

**Severity**: 🟡 **HIGH** — Brittle coupling

---

## Search Scope & Method

| What | How | Found |
|-----|-----|-------|
| Cross-folder imports | `grep ../../../` | 1 instance |
| Public re-exports | `grep export.*syncService` | 1 instance |
| Schema definitions | `find *schema*` | 3 instances |
| PowerSync schemas | `grep new Schema` | 1 instance |
| Drizzle schemas | `grep defineTable` | 2 instances |

---

## Triage & Severity Assessment

| Issue | Type | Severity | Action |
|-------|------|----------|--------|
| **Circular dependency** | Architecture | 🔴 CRITICAL | Fix immediately |
| **Public re-export of broken module** | Architecture | 🔴 CRITICAL | Fix immediately |
| **Multiple schema sources** | Architecture | 🔴 CRITICAL | Fix immediately |
| **Monorepo boundary confusion** | Architecture | 🟡 HIGH | Fix immediately |
| **Undeclared cross-app deps** | Code organization | 🟡 HIGH | Fix immediately |

**All items are CRITICAL/HIGH and block launch.**

---

## Fixes Required (IN PRIORITY ORDER)

### STEP 1: Move Schema to Shared (CRITICAL)

```
FROM:  innerscape-soma/lib/sync/schema.ts
TO:    lifeos-shared/src/schemas/powerSyncSchema.ts

Reason: Schema is data contract, belongs in shared library
```

### STEP 2: Update Imports (CRITICAL)

- Update `lifeos-shared/src/storage/syncService.ts`:
  ```diff
  - import { SCHEMA } from '../../../innerscape-soma/lib/sync/schema';
  + import { SCHEMA } from '../schemas/powerSyncSchema';
  ```

- Update `innerscape-soma` to import from shared:
  ```typescript
  import { SCHEMA } from '@lifeos/shared/schemas';
  ```

### STEP 3: Add Backend Schema to Shared (HIGH)

Move or duplicate schema definitions to shared:
- `lifeos-backend/src/db/schema.ts` should re-export from shared if possible
- OR create separate shared schemas for different tech stacks

### STEP 4: Update Exports (CRITICAL)

Ensure `lifeos-shared/src/index.ts` only exports components, not modules with unresolved dependencies:

```typescript
// Keep these (they're safe):
export * from './components/UniversalHeader';
export * from './hooks/useEmotionalContext';
export * from './onboarding/OnboardingProvider';

// Conditional exports for syncService (only if schema is available):
// export * from './storage/syncService'; // ← Conditionally export when fixed
```

### STEP 5: Rebuild and Verify (CRITICAL)

```bash
cd lifeos-shared && npm run build
npm run verify:all
npm run build:ds && npm run build:shared && npm run build:backend && npm run build:web && npm run build:soma && npm run build:mobile
```

---

## New Patterns Discovered

> **Recommend adding to APEX bug-comorbidities.md**:
> 
> **Pattern**: Architectural Boundary Violations in Monorepos
>
> When you find one cross-folder import in a shared library, statistically these accompany it:
> 1. Multiple schema/type definitions across apps
> 2. Lack of clear "inbound" vs "outbound" dependencies
> 3. Public re-exports of broken modules
> 4. Version mismatches on shared libraries
> 5. Missing or brittle peer dependency declarations
>
> **Fix cluster**: Enforce strict monorepo boundaries via linting, tsconfig `rootDir`, and documentation.

---

## Impact Assessment

| Component | Current Status | After Fix | Unblocked Time |
|-----------|-----------------|-----------|----------------|
| `lifeos-shared` build | ❌ BLOCKED | ✅ WORKS | 30 min |
| `innerscape-soma` build | ⏸️ WAITING | ✅ WORKS | +15 min |
| `innerscape-mobile` build | ⏸️ WAITING | ✅ WORKS | +15 min |
| Web app deployment | ✅ OK (independent) | ✅ READY | 0 min |
| **Full suite launch** | 🔴 BLOCKED | ✅ READY | ~1 hour |

---

## Verification Checklist

After applying fixes, verify:

- [ ] `cd lifeos-shared && npm run build` passes without errors
- [ ] `npm run typecheck` passes for all projects
- [ ] `npm run verify:all` passes
- [ ] Full `npm run build:*` sequence works
- [ ] No `../../../` relative imports remain in shared library
- [ ] `lifeos-shared/src/index.ts` exports only safe modules
- [ ] Schema lives in single location (shared)
- [ ] All app-specific imports of schema use `@lifeos/shared` path
- [ ] No circular dependencies detected
- [ ] Tests pass (regression test)

---

## Conclusion

**This is NOT a simple bug.** It's a **cluster of 5 interconnected architectural issues** that all stem from unclear monorepo boundaries.

**Single fix location**: Move the schema file and update imports.

**Estimated time**: 30 minutes  
**Blocker status**: Launch-critical  
**Regression risk**: Low (isolated to monorepo structure)

Once fixed, the project will build cleanly and be ready for launch.

