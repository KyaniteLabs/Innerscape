---
name: autonomous-loop
description: >
  Autonomous agent loop for completing multi-task features without manual
  intervention. Based on the Ralph pattern: fresh context per iteration,
  memory via git + progress.txt, binary completion criteria. Use when
  implementing features with multiple tasks, running automated development
  loops, or when asked to "run until done". Triggers on: autonomous, loop,
  ralph, run until done, implement all tasks, handoff.
license: Apache-2.0
compatibility: Claude Code, Cursor, VS Code, Amp
metadata:
  author: apex
  version: "1.1"
  updated: "2026-01"
  source: "Adapted from snarktank/ralph"
allowed-tools: Read Write Edit Bash Glob Grep Task
---

# Autonomous Loop — Complete Guide

## TL;DR

Run AI agents in a loop until all tasks complete. Each iteration = fresh context.
Memory persists via **git history** + **progress.txt** + **task tracking**.

**Key insight**: Agents "quit early" because they run out of context or lose focus.
The autonomous loop solves this by spawning fresh instances that inherit state through files.

---

## 1. CORE CONCEPTS

### The Problem: Lazy Agents

Agents often:
- Quit before finishing ("looks good!")
- Hallucinate completion without verification
- Run out of context window on large tasks
- Lose track of multi-step requirements

### The Solution: Autonomous Loop

```
┌─────────────────────────────────────────────────────────┐
│                    SETUP PHASE                          │
│  • Generate/load PRD with tasks                         │
│  • Break into right-sized subtasks                      │
│  • Set dependencies (dependsOn)                         │
│  • Initialize progress.txt                              │
└─────────────────────┬───────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────┐
│                   EXECUTION LOOP                        │
│  ┌───────────────────────────────────────────────────┐  │
│  │ 1. Read progress.txt for context                  │  │
│  │ 2. Find next ready task (dependencies satisfied)  │  │
│  │ 3. Implement the task                             │  │
│  │ 4. Run quality checks (typecheck, tests)          │  │
│  │ 5. Update progress.txt (SHORT-TERM memory)        │  │
│  │ 6. Update AGENTS.md if permanent learning         │  │
│  │ 7. Commit changes                                 │  │
│  │ 8. Mark task complete                             │  │
│  │ 9. Handoff to next iteration                      │  │
│  └───────────────────────────────────────────────────┘  │
│                         ↺                               │
│              (repeat until all done)                    │
└─────────────────────┬───────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────┐
│                   COMPLETION                            │
│  • All tasks done → Archive progress.txt                │
│  • Mark parent task complete                            │
│  • Report summary                                       │
└─────────────────────────────────────────────────────────┘
```

### Why Fresh Context Per Iteration?

| Approach | Problem |
|----------|---------|
| Single long session | Context fills up, quality degrades |
| Manual handoffs | User bottleneck, breaks flow |
| **Fresh iteration** | Clean context, consistent quality |

Each iteration spawns a **new agent instance** with:
- Clean 200K context window
- Only essential state from files
- No accumulated confusion

---

## 2. MEMORY ARCHITECTURE

### Two-Layer Memory System

| Layer | File | Scope | Persistence | Content |
|-------|------|-------|-------------|---------|
| **Short-term** | `progress.txt` | Current feature | Until feature done | Patterns, task log, context |
| **Long-term** | `AGENTS.md` | Codebase area | Permanent | Conventions, gotchas, patterns |

### progress.txt (Short-Term)

Location: `scripts/ralph/progress.txt` or project root

```markdown
# Build Progress Log
Started: 2026-01-23
Feature: User Authentication System
Parent Task: task-abc123

## Codebase Patterns
(Patterns discovered during THIS feature - copy important ones to AGENTS.md)

- Auth middleware uses `withAuth()` HOC pattern
- All API routes return `{ success: boolean, data?: T, error?: string }`
- Tests use `vitest` with `@testing-library/react`

---

## 2026-01-23 - Add user table migration
Task ID: task-001
- Created `migrations/001_users.sql`
- Added columns: id, email, password_hash, created_at
- **Learnings**: Use `TIMESTAMPTZ` not `TIMESTAMP` for timezone safety

---

## 2026-01-23 - Create auth middleware
Task ID: task-002
- Implemented `src/middleware/auth.ts`
- Uses JWT verification with `jose` library
- **Learnings**: Project uses edge runtime, can't use `jsonwebtoken`
```

**Rules for progress.txt:**
- APPEND only, never replace (except on new feature)
- Include task ID and date for each entry
- Note learnings that help future iterations
- Archive when feature completes

### AGENTS.md (Long-Term)

Location: In directories where the knowledge applies

```markdown
# AGENTS.md — src/middleware/

## Patterns
- All middleware follows `(req, res, next) => {}` signature
- Use `withAuth()` HOC for protected routes
- Error responses: `{ success: false, error: "message" }`

## Gotchas
- Edge runtime: Cannot use Node.js-only packages
- JWT: Use `jose` library, not `jsonwebtoken`

## Dependencies
- `jose` for JWT operations
- `zod` for request validation
```

**Rules for AGENTS.md:**
- Only PERMANENT knowledge (anyone editing this code should know)
- No task-specific or temporary notes
- Update when you discover something important
- AI tools auto-read these files

---

## 3. SETUP PHASE

### Step 1: Understand the Feature

Before creating tasks, gather requirements:

```
What feature are you building?
```

Ask clarifying questions with lettered options for quick responses:

```
1. What's the primary goal?
   A. New user-facing feature
   B. Backend/API improvement
   C. Bug fix
   D. Refactoring

2. What areas of the codebase will this touch?
   A. Database/migrations
   B. API/backend
   C. UI/frontend
   D. All of the above

3. What's the scope?
   A. Minimal viable version
   B. Full implementation
   C. Just the foundation for later work
```

Users can respond: "1A, 2D, 3B" for fast iteration.

### Step 2: Break Into Right-Sized Tasks

**Critical Rule**: Each task must complete in ONE context window (~one agent session).

#### Right-Sized Tasks (Good)

- Add a database column + migration
- Create a single UI component
- Implement one API endpoint
- Add validation to existing form
- Write tests for one module

#### Too Large (Split These)

| Too Big | Split Into |
|---------|------------|
| "Build authentication" | Schema → Middleware → Login UI → Session handling |
| "Create dashboard" | Layout → Data fetching → Charts → Filters |
| "Add user management" | List view → Create form → Edit form → Delete action |

**Rule of Thumb**: If you can't describe the change in 2-3 sentences, split it.

### Step 3: Order by Dependencies

Tasks execute based on `dependsOn`. Set up the chain:

```
Task 1: Schema/migrations (no dependencies)
    ↓
Task 2: Server actions (dependsOn: Task 1)
    ↓
Task 3: UI components (dependsOn: Task 2)
    ↓
Task 4: Tests (dependsOn: Task 3)
```

Parallel tasks that don't depend on each other can share the same dependency:

```
Task 1: Schema
    ├── Task 2a: API endpoint A (dependsOn: Task 1)
    └── Task 2b: API endpoint B (dependsOn: Task 1)
            ↓
        Task 3: UI (dependsOn: Task 2a, Task 2b)
```

### Step 4: Create Task Structure

#### Option A: JSON Format (prd.json)

```json
{
  "featureName": "User Authentication",
  "branchName": "feat/user-auth",
  "userStories": [
    {
      "id": "US-001",
      "title": "Add users table",
      "description": "Create database schema for user accounts",
      "acceptanceCriteria": [
        "Migration creates users table with id, email, password_hash, created_at",
        "Migration is reversible",
        "npm run typecheck passes"
      ],
      "dependsOn": [],
      "passes": false
    },
    {
      "id": "US-002",
      "title": "Create auth middleware",
      "description": "JWT verification middleware for protected routes",
      "acceptanceCriteria": [
        "Middleware verifies JWT from Authorization header",
        "Returns 401 for invalid/missing token",
        "Attaches user to request context",
        "npm run typecheck passes",
        "npm test passes"
      ],
      "dependsOn": ["US-001"],
      "passes": false
    }
  ]
}
```

#### Option B: Task List Tool

If using a task management tool:

```
task_list create
  title: "User Authentication"
  description: "Complete auth system with login/logout"
  repoURL: "https://github.com/user/project"
```

Then create subtasks with `parentID` and `dependsOn`.

### Step 5: Initialize Progress File

```bash
# Create directory if needed
mkdir -p scripts/ralph

# Initialize progress.txt
cat > scripts/ralph/progress.txt << 'EOF'
# Build Progress Log
Started: $(date +%Y-%m-%d)
Feature: [Feature Name]
Parent Task: [parent-task-id]

## Codebase Patterns
(Patterns discovered during this feature build)

---
EOF

# Save parent task ID
echo "[parent-task-id]" > scripts/ralph/parent-task-id.txt
```

---

## 4. EXECUTION LOOP

### Loop Entry Point

When starting or continuing the loop:

```
1. Read parent task ID from scripts/ralph/parent-task-id.txt
2. Read progress.txt for context from previous iterations
3. Query for ready tasks (dependencies satisfied, not completed)
4. If no ready tasks → check completion status
5. If ready task found → execute it
```

### Task Execution Protocol

For each task, follow this exact sequence:

#### 0. BASELINE CHECK (Critical — Do This FIRST)

**Before making ANY changes**, verify the codebase is healthy:

```bash
npm run typecheck   # Must pass
npm test            # Must pass
```

| Baseline Result | Action |
|-----------------|--------|
| All pass | Proceed with task |
| Some fail | **STOP** — Report existing failures, do NOT mask them |

**Why**: If tests fail before you start, you can't know if YOU broke something.

#### 1. Read Context

```bash
cat scripts/ralph/progress.txt
```

Check the "Codebase Patterns" section for important context.

#### 2. Implement the Task

- Follow acceptance criteria exactly
- Use patterns from progress.txt
- Match existing code conventions
- **Make minimal changes** — don't refactor unrelated code

#### 3. Run Quality Checks (Regression Test)

**MANDATORY** — Do not proceed until these pass:

```bash
npm run typecheck   # Must pass
npm test            # ALL tests must pass, not just new ones
```

**Regression check**: Compare to baseline. If ANY test that passed before now fails:
- **YOU BROKE SOMETHING** — this is a regression
- Fix the regression IMMEDIATELY
- Do NOT continue with other work
- Do NOT commit broken code

If checks fail after 3 fix attempts:
1. **ROLLBACK** your changes: `git checkout -- .`
2. Document the blocker in progress.txt
3. Report blocker — do NOT continue breaking things

#### 4. Update Progress.txt (Append)

```markdown
---

## [Date] - [Task Title]
Task ID: [id]
- What was implemented
- Files changed: [list]
- **Learnings for future iterations:**
  - [Pattern discovered]
  - [Gotcha encountered]
```

#### 5. Update AGENTS.md (If Permanent Learning)

Only add to AGENTS.md if:
- It's a pattern ANYONE editing this code should know
- It's NOT task-specific or temporary
- It helps future developers/agents

#### 6. Commit Changes

```bash
git add .
git commit -m "feat: [Task Title]

- [Brief description of changes]
- Closes task [task-id]"
```

#### 7. Mark Task Complete

Update task status to `completed` / `passes: true`.

#### 8. Handoff to Next Iteration

Invoke the loop skill again to continue with the next task.

### Handoff Instructions Template

When handing off, include:

```markdown
Continue the autonomous loop for feature: [Feature Name]

FIRST: Read scripts/ralph/progress.txt for context from previous iterations.

Current state:
- Parent task: [id]
- Just completed: [task title]
- Tasks remaining: [count]

Next steps:
1. Find next ready task (dependencies satisfied)
2. Implement it following acceptance criteria
3. Run quality checks: `npm run typecheck && npm test`
4. Update progress.txt (APPEND, never replace)
5. Update AGENTS.md if permanent learning discovered
6. Commit with message: "feat: [Task Title]"
7. Mark task complete
8. Re-invoke this skill to continue loop
```

---

## 5. STOP CONDITIONS

### Completion Check

When no ready tasks remain, check if feature is done:

```
Query all tasks for this feature
├── All completed? → FEATURE COMPLETE
├── Some blocked? → Report blockers, wait
└── Some pending? → Dependencies not met, check order
```

### Feature Complete Protocol

When all tasks pass:

1. **Archive progress.txt**:
```bash
DATE=$(date +%Y-%m-%d)
FEATURE="feature-name-kebab-case"
mkdir -p scripts/ralph/archive/$DATE-$FEATURE
mv scripts/ralph/progress.txt scripts/ralph/archive/$DATE-$FEATURE/
```

2. **Clear parent task ID**:
```bash
echo "" > scripts/ralph/parent-task-id.txt
```

3. **Create fresh progress.txt**:
```bash
cat > scripts/ralph/progress.txt << 'EOF'
# Build Progress Log
(No active feature)

## Codebase Patterns

---
EOF
```

4. **Final commit**:
```bash
git add scripts/ralph
git commit -m "chore: archive progress for [feature-name]"
```

5. **Mark parent task complete**

6. **Report completion**:
```
✅ Feature Complete: [Feature Name]

Summary:
- [X] tasks completed
- [Y] commits made
- Key files: [list main files created/modified]

The feature is ready for review.
```

### Blocked State

If tasks remain but none are ready:

```
⏸️ Loop Paused — Tasks Blocked

Ready: 0 tasks
Blocked: [X] tasks
Completed: [Y] tasks

Blockers:
- Task "[title]" waiting on: [dependency list]
- Task "[title]" waiting on: [dependency list]

Action needed: [Describe what needs to happen]
```

---

## 6. VERIFICATION REQUIREMENTS

### Quality Gates (Mandatory)

Every task must pass before marking complete:

| Check | Command | Must Pass |
|-------|---------|-----------|
| Type check | `npm run typecheck` | Yes |
| Tests | `npm test` | Yes (if tests exist) |
| Lint | `npm run lint` | Yes (if configured) |
| Build | `npm run build` | For production changes |

### UI Task Verification

For tasks involving UI changes, add browser verification:

**Functional Testing** (behavior):
```
Use take_snapshot to read page content and verify:
- [ ] Element exists
- [ ] Text appears correctly
- [ ] Interaction works
```

**Visual Testing** (appearance):
```
Use take_screenshot to capture and verify:
- [ ] Layout correct
- [ ] Styling applied
- [ ] Responsive behavior
```

### Acceptance Criteria Format

Good criteria (verifiable):
- ✅ "Button shows confirmation dialog before deleting"
- ✅ "API returns 401 for missing auth header"
- ✅ "Form validates email format before submit"
- ✅ "npm run typecheck passes"
- ✅ "All existing tests still pass (no regressions)"

Bad criteria (vague):
- ❌ "Works correctly"
- ❌ "Good UX"
- ❌ "Handles errors properly"

### MANDATORY Criteria for ALL Tasks

Every acceptance criteria list MUST include:
```markdown
- [ ] npm run typecheck passes
- [ ] All existing tests still pass (no regressions)
- [ ] npm test passes (including new tests if applicable)
```

**The regression check is non-negotiable.** A task that breaks other functionality is NOT complete.

---

## 7. TASK DISCOVERY

While implementing, **create new tasks** when you discover:

| Discovery | Action |
|-----------|--------|
| Failing tests | Create task to fix |
| Missing error handling | Create task |
| Tech debt / TODO comments | Create task |
| Documentation gaps | Create task |
| Performance issues | Create task |

Set appropriate `dependsOn` relationships for discovered tasks.

---

## 8. EXAMPLE: COMPLETE FLOW

### User Request
"Add user profile editing to the app"

### Setup Phase

**Clarifying Questions:**
```
1. What can users edit?
   A. Basic info (name, email)
   B. Full profile (name, email, avatar, bio)
   C. Just avatar

2. Where does the edit UI appear?
   A. Dedicated settings page
   B. Modal from profile
   C. Inline editing

User: "1B, 2A"
```

**Task Breakdown:**
```
1. Add profile fields to schema (no deps)
2. Create update profile API (depends: 1)
3. Create settings page layout (depends: 1)
4. Add avatar upload component (depends: 2, 3)
5. Add profile form (depends: 2, 3)
6. Add tests (depends: 4, 5)
```

### Execution Loop

**Iteration 1:**
- **BASELINE**: Run `npm test` → all pass ✅
- Read progress.txt (empty for new feature)
- Find ready task: "Add profile fields to schema"
- Implement migration
- **REGRESSION CHECK**: Run `npm run typecheck && npm test` ✅ (no regressions)
- Update progress.txt
- Commit: "feat: Add profile fields to users table"
- Mark complete
- Handoff

**Iteration 2:**
- Read progress.txt (has schema learnings)
- Find ready tasks: "Create update profile API" AND "Create settings page layout"
- Pick: "Create update profile API"
- Implement endpoint
- Run checks ✅
- Update progress.txt, note API patterns
- Commit
- Handoff

**...continues until all tasks complete...**

**Completion:**
- All 6 tasks pass
- Archive progress.txt
- Report: "✅ Feature Complete: User Profile Editing"

---

## 9. TROUBLESHOOTING

### Loop Exits Early

**Symptom**: Agent stops before all tasks done

**Causes & Fixes**:
| Cause | Fix |
|-------|-----|
| No stop hook | Ensure loop re-invokes itself |
| Context full | Tasks too large, split them |
| Missing handoff | Add explicit re-invoke instruction |

### Quality Checks Fail Repeatedly

**Symptom**: Same error keeps appearing

**Fix**:
1. Read the FULL error message
2. Check progress.txt for related patterns
3. Search codebase for similar code
4. If stuck after 3 attempts, report blocker

### Tasks Out of Order

**Symptom**: Task fails because dependency not done

**Fix**:
1. Verify `dependsOn` is set correctly
2. Check dependency task status
3. Re-order if needed

---

## 10. QUICK REFERENCE

### Commands

| Action | Command |
|--------|---------|
| Start loop | "Run autonomous loop for [feature]" |
| Continue loop | "Continue the loop" |
| Check status | "What's the loop status?" |
| Stop loop | "Pause the loop" |

### File Locations

| File | Purpose |
|------|---------|
| `scripts/ralph/progress.txt` | Short-term memory |
| `scripts/ralph/parent-task-id.txt` | Current feature ID |
| `scripts/ralph/archive/` | Completed feature logs |
| `AGENTS.md` | Long-term codebase knowledge |
| `prd.json` or task tool | Task definitions |

### Checklist Before Each Iteration

```
□ Read progress.txt for context
□ Find ready task (dependencies satisfied)
□ Implement following acceptance criteria
□ Run typecheck and tests
□ Update progress.txt (append)
□ Update AGENTS.md if permanent learning
□ Commit changes
□ Mark task complete
□ Re-invoke loop
```

---

*APEX Autonomous Loop v1.0 — Based on the Ralph pattern by snarktank/ralph*
