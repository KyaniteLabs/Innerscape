---
name: prd-generator
description: >
  Generate structured Product Requirements Documents (PRDs) for features.
  Creates clear, actionable specs with user stories, acceptance criteria,
  and right-sized tasks for autonomous implementation. Use when planning
  features, starting projects, or converting ideas into implementable specs.
  Triggers on: create prd, write prd, plan feature, requirements for,
  spec out, feature spec, product requirements.
license: Apache-2.0
compatibility: Claude Code, Cursor, VS Code, Amp
metadata:
  author: apex
  version: "1.1"
  updated: "2026-01"
  source: "Adapted from snarktank/ralph"
allowed-tools: Read Write Glob Grep
---

# PRD Generator — Complete Guide

## TL;DR

Create detailed Product Requirements Documents that are:
- **Clear**: Unambiguous specifications
- **Actionable**: Ready for implementation
- **Right-sized**: Each task fits one context window

**Output**: `tasks/prd-[feature-name].md`

**Important**: This skill creates the PRD only. Do NOT start implementing.

---

## 1. THE PROCESS

```
┌─────────────────────────────────────────────────────────┐
│              1. RECEIVE FEATURE DESCRIPTION             │
│  User describes what they want to build                 │
└─────────────────────┬───────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────┐
│              2. ASK CLARIFYING QUESTIONS                │
│  3-5 essential questions with lettered options          │
│  Focus: Goal, Scope, Users, Success criteria            │
└─────────────────────┬───────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────┐
│              3. GENERATE STRUCTURED PRD                 │
│  Goals, User Stories, Requirements, Non-Goals           │
└─────────────────────┬───────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────┐
│              4. SAVE TO tasks/prd-[name].md             │
│  Ready for autonomous-loop skill                        │
└─────────────────────────────────────────────────────────┘
```

---

## 2. CLARIFYING QUESTIONS

### When to Ask

Ask only when the initial prompt is ambiguous about:
- **Problem/Goal**: What problem does this solve?
- **Core Functionality**: What are the key actions?
- **Scope/Boundaries**: What should it NOT do?
- **Success Criteria**: How do we know it's done?
- **Target Users**: Who will use this?

### Question Format

Use lettered options for quick responses:

```markdown
1. What is the primary goal of this feature?
   A. Improve user onboarding experience
   B. Increase user retention
   C. Reduce support burden
   D. Other: [please specify]

2. Who is the target user?
   A. New users only
   B. Existing users only
   C. All users
   D. Admin users only

3. What is the scope?
   A. Minimal viable version
   B. Full-featured implementation
   C. Just the backend/API
   D. Just the UI
```

**User can respond**: "1A, 2C, 3B" for fast iteration.

### Example Questions by Feature Type

**For UI Features:**
```
1. Where does this UI appear?
   A. New dedicated page
   B. Modal/dialog
   C. Sidebar/panel
   D. Inline in existing page

2. What's the interaction model?
   A. View only (read)
   B. Simple form (create/update)
   C. Complex workflow (multi-step)
   D. Real-time (live updates)
```

**For API Features:**
```
1. What clients will use this API?
   A. Web frontend only
   B. Mobile app
   C. Third-party integrations
   D. Internal services

2. Authentication requirements?
   A. Public (no auth)
   B. User authentication required
   C. Admin authentication required
   D. API key authentication
```

**For Data/Schema Features:**
```
1. Data volume expectations?
   A. Small (< 10K records)
   B. Medium (10K - 1M records)
   C. Large (> 1M records)
   D. Unknown

2. Query patterns?
   A. Mostly reads
   B. Mostly writes
   C. Balanced read/write
   D. Complex aggregations
```

---

## 3. PRD STRUCTURE

### Required Sections

```markdown
# PRD: [Feature Name]

## Introduction
[Brief description of the feature and the problem it solves]

## Goals
[Specific, measurable objectives as bullet list]

## User Stories
[Each story with title, description, acceptance criteria]

## Functional Requirements
[Numbered list of specific functionalities]

## Non-Goals (Out of Scope)
[What this feature will NOT include]

## Technical Considerations (Optional)
[Constraints, dependencies, integration points]

## Success Metrics
[How success will be measured]

## Open Questions
[Remaining questions or areas needing clarification]
```

---

## 4. USER STORIES

### Format

```markdown
### US-001: [Short Descriptive Title]

**Description**: As a [user role], I want [feature/action] so that [benefit/reason].

**Acceptance Criteria**:
- [ ] Specific verifiable criterion
- [ ] Another specific criterion
- [ ] npm run typecheck passes
- [ ] **[For UI stories]** Verify in browser using browser-verification skill
```

### Right-Sizing Rules

**Critical**: Each user story must be completable in ONE agent context window.

#### Good Size (One Session)

| Story | Why It's Right-Sized |
|-------|---------------------|
| Add a database column + migration | Single schema change |
| Create one API endpoint | One file, clear scope |
| Build one UI component | Isolated, testable |
| Add validation to a form | Clear input/output |
| Write tests for one module | Focused coverage |

#### Too Large (Split These)

| Too Big | Split Into |
|---------|------------|
| "Build authentication" | 1. Schema 2. Middleware 3. Login UI 4. Session handling |
| "Create dashboard" | 1. Layout 2. Data queries 3. Charts 4. Filters |
| "Add user management" | 1. List view 2. Create 3. Edit 4. Delete |
| "Implement search" | 1. Index 2. Query API 3. UI 4. Filters 5. Pagination |

**Rule of Thumb**: If you can't describe the change in 2-3 sentences, split it.

### Acceptance Criteria Rules

#### Good Criteria (Verifiable)

- ✅ "Button shows confirmation dialog before deleting"
- ✅ "API returns 401 for invalid/missing token"
- ✅ "Form displays error message under invalid field"
- ✅ "Page loads in under 2 seconds"
- ✅ "Data persists after page refresh"

#### Bad Criteria (Vague)

- ❌ "Works correctly"
- ❌ "Good UX"
- ❌ "Handles errors properly"
- ❌ "Is performant"
- ❌ "Looks good"

#### Always Include (MANDATORY)

```markdown
- [ ] npm run typecheck passes
- [ ] All existing tests still pass (no regressions)
```

#### For Testable Logic

```markdown
- [ ] npm test passes (including new tests)
```

#### For UI Stories

```markdown
- [ ] Verify in browser using browser-verification skill
```

#### Regression Prevention

**Every story must include the regression check.** A task that breaks other functionality is NOT complete. The acceptance criteria template:

```markdown
- [ ] [Specific functional criteria...]
- [ ] npm run typecheck passes
- [ ] All existing tests still pass (no regressions)
- [ ] [For UI] Verify in browser
```

---

## 5. FUNCTIONAL REQUIREMENTS

### Format

Numbered list with specific, unambiguous requirements:

```markdown
## Functional Requirements

- **FR-1**: The system must allow users to create a new account with email and password
- **FR-2**: When a user submits invalid data, the system must display specific error messages
- **FR-3**: The system must send a verification email within 30 seconds of registration
- **FR-4**: Users must be able to reset their password via email link
- **FR-5**: The system must lock accounts after 5 failed login attempts
```

### Writing for Clarity

Write as if the reader is:
- A junior developer
- An AI agent with no prior context

Therefore:
- Be explicit and unambiguous
- Avoid jargon or explain it
- Provide enough detail for implementation
- Use concrete examples where helpful

---

## 6. NON-GOALS

### Why Non-Goals Matter

Prevent scope creep by explicitly stating what's OUT of scope:

```markdown
## Non-Goals (Out of Scope)

- No social login (Google, GitHub) in this version
- No password strength requirements beyond minimum length
- No two-factor authentication
- No admin dashboard for user management
- No internationalization/localization
```

### Format

- Start each with "No" or "Not"
- Be specific about what's excluded
- Reference if it's planned for future

---

## 7. TECHNICAL CONSIDERATIONS

### When to Include

Include when there are:
- Known technical constraints
- Required integrations
- Performance requirements
- Security considerations
- Existing patterns to follow

### Format

```markdown
## Technical Considerations

### Constraints
- Must use existing PostgreSQL database
- Must work with edge runtime (no Node.js-only packages)
- Must support mobile viewport

### Integrations
- Integrate with existing auth middleware (`src/middleware/auth.ts`)
- Use existing form component library (`src/components/ui/form`)

### Performance
- Page must load in < 2 seconds on 3G
- API responses must be < 200ms

### Security
- All user input must be validated with Zod
- Passwords must be hashed with bcrypt (min 10 rounds)
```

---

## 8. COMPLETE EXAMPLE

```markdown
# PRD: Task Priority System

## Introduction

Add priority levels to tasks so users can focus on what matters most. Tasks 
can be marked as high, medium, or low priority, with visual indicators and 
filtering to help users manage their workload effectively.

## Goals

- Allow assigning priority (high/medium/low) to any task
- Provide clear visual differentiation between priority levels
- Enable filtering and sorting by priority
- Default new tasks to medium priority

## User Stories

### US-001: Add priority field to database

**Description**: As a developer, I need to store task priority so it persists 
across sessions.

**Acceptance Criteria**:
- [ ] Add priority column to tasks table: 'high' | 'medium' | 'low' (default 'medium')
- [ ] Generate and run migration successfully
- [ ] npm run typecheck passes
- [ ] All existing tests still pass (no regressions)

---

### US-002: Display priority indicator on task cards

**Description**: As a user, I want to see task priority at a glance so I know 
what needs attention first.

**Acceptance Criteria**:
- [ ] Each task card shows colored priority badge (red=high, yellow=medium, gray=low)
- [ ] Priority visible without hovering or clicking
- [ ] npm run typecheck passes
- [ ] All existing tests still pass (no regressions)
- [ ] Verify in browser using browser-verification skill

---

### US-003: Add priority selector to task edit

**Description**: As a user, I want to change a task's priority when editing it.

**Acceptance Criteria**:
- [ ] Priority dropdown in task edit modal
- [ ] Shows current priority as selected
- [ ] Saves immediately on selection change
- [ ] npm run typecheck passes
- [ ] All existing tests still pass (no regressions)
- [ ] Verify in browser using browser-verification skill

---

### US-004: Filter tasks by priority

**Description**: As a user, I want to filter the task list to see only 
high-priority items when I'm focused.

**Acceptance Criteria**:
- [ ] Filter dropdown with options: All | High | Medium | Low
- [ ] Filter persists in URL params
- [ ] Empty state message when no tasks match filter
- [ ] npm run typecheck passes
- [ ] All existing tests still pass (no regressions)
- [ ] Verify in browser using browser-verification skill

## Functional Requirements

- **FR-1**: Add `priority` field to tasks table ('high' | 'medium' | 'low', default 'medium')
- **FR-2**: Display colored priority badge on each task card
- **FR-3**: Include priority selector in task edit modal
- **FR-4**: Add priority filter dropdown to task list header
- **FR-5**: Sort by priority within each status column (high → medium → low)

## Non-Goals (Out of Scope)

- No priority-based notifications or reminders
- No automatic priority assignment based on due date
- No priority inheritance for subtasks
- No bulk priority editing

## Technical Considerations

### Existing Patterns
- Reuse existing badge component (`src/components/ui/badge`)
- Follow existing filter pattern in task list

### Data
- Priority stored in database, not computed
- Filter state managed via URL search params

## Success Metrics

- Users can change priority in under 2 clicks
- High-priority tasks immediately visible at top of lists
- No regression in task list performance (< 100ms render)

## Open Questions

- Should priority affect task ordering within a column?
- Should we add keyboard shortcuts for priority changes?
```

---

## 9. OUTPUT

### File Location

Save PRDs to: `tasks/prd-[feature-name].md`

Use kebab-case for the filename:
- `tasks/prd-user-authentication.md`
- `tasks/prd-task-priority-system.md`
- `tasks/prd-dashboard-redesign.md`

### Create Directory if Needed

```bash
mkdir -p tasks
```

---

## 10. CHECKLIST

Before saving the PRD:

```
□ Asked clarifying questions with lettered options
□ Incorporated user's answers
□ Each user story is small (one context window)
□ Acceptance criteria are specific and verifiable
□ All stories include "npm run typecheck passes"
□ All stories include "All existing tests still pass (no regressions)"
□ UI stories include browser verification
□ Functional requirements are numbered and unambiguous
□ Non-goals section defines clear boundaries
□ Technical considerations documented (if applicable)
□ Saved to tasks/prd-[feature-name].md
```

---

## 11. CONVERTING TO AUTONOMOUS LOOP

After PRD is created, it can be converted to task format for the autonomous-loop skill:

### Option A: JSON Format (prd.json)

```json
{
  "featureName": "Task Priority System",
  "branchName": "feat/task-priority",
  "userStories": [
    {
      "id": "US-001",
      "title": "Add priority field to database",
      "description": "...",
      "acceptanceCriteria": ["..."],
      "dependsOn": [],
      "passes": false
    }
  ]
}
```

### Option B: Task Management Tool

Create parent task, then subtasks with `dependsOn` relationships.

### Dependency Ordering

Typical order:
1. Schema/database changes (no dependencies)
2. Backend/API logic (depends on schema)
3. UI components (depends on backend)
4. Integration tests (depends on UI)

---

*APEX PRD Generator v1.0 — Structured requirements for autonomous implementation*
