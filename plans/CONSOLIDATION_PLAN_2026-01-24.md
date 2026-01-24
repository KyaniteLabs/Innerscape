# Mobile App Consolidation + Full Feature Parity

> **Status:** ACTIVE | **Created:** January 24, 2026 | **APEX v4.3.0 Compliant**
>
> This is the canonical implementation plan for consolidating innerscape-soma into innerscape-mobile
> and achieving full feature parity between mobile and web apps.

---

## Overview

1. Consolidate `innerscape-soma` into `innerscape-mobile` with 4 tabs (Mind, Flow, Body, Hub)
2. Achieve full feature parity between mobile (primary) and web apps
3. Health data input is mobile-only; web displays synced data

**Final Architecture:**

```
MOBILE: [Mind] [Flow] [Body] [Hub]
WEB:    Mind | Flow | Body | Hub (navigation sections)
```

---

## Pre-Implementation Protocol (MANDATORY)

Before ANY code change, the coding agent MUST:

```
1. READ all files to be modified (never edit blind)
2. SEARCH for existing patterns (naming, imports, styles)
3. RUN baseline tests: npm run typecheck && npm test
4. CREATE git checkpoint: git add -A && git stash
5. VERIFY conventions match existing codebase
```

### Quality Gates (Run After Every Phase)

```bash
# Mobile App
cd innerscape-mobile
npm run typecheck   # Must pass
npm run lint        # Must pass (or only pre-existing errors)
npm test            # Must pass (no regressions)
npx expo start      # Must launch without errors

# Web App
cd "Second Brain Project"
npm run build       # Must pass
npm run lint        # Must pass
npm run typecheck   # Must pass

# Backend
cd lifeos-backend
npm run typecheck   # Must pass
npm test            # Must pass
```

### Rollback Protocol

If ANY quality gate fails after 3 fix attempts:

```bash
git stash pop       # Restore checkpoint
git checkout -- .   # Discard changes
```

Report blocker to user. Do NOT commit broken code.

---

## Workspace Paths (Canonical)

All paths are relative to workspace root:

```
/Volumes/External Drive/02_DEVELOPMENT/Active Projects/LifeOS/
├── innerscape-mobile/          # React Native mobile app
├── innerscape-soma/            # Source for migration (archive after)
├── Second Brain Project/       # Next.js web app (note: has space)
├── lifeos-backend/             # Hono API
├── lifeos-shared/              # Shared types
└── lifeos-design-system/       # Design tokens
```

**Important:** When using shell commands, quote paths with spaces:

```bash
cd "/Volumes/External Drive/02_DEVELOPMENT/Active Projects/LifeOS/Second Brain Project"
```

---

## Design System Compliance

### Typography (From lifeos-design-system)

| Usage | Font | Weight |
|-------|------|--------|
| Body | Satoshi | 400, 500 |
| Headings | Outfit | 600, 700 |
| Mono | JetBrains Mono | 400 |

### Color Tokens (Semantic)

Use tokens from `lifeos-design-system/tokens/colors.json`:

| Token | Value | Usage |
|-------|-------|-------|
| `--color-app-soma` | `#8B5CF6` | Purple (body/somatic) |
| `--color-app-mind` | `#4F46E5` | Indigo (thought/capture) |
| `--color-app-flow` | `#F59E0B` | Amber (energy/habits) |
| `--color-app-pulse` | `#22C55E` | Green (health/vitality) |
| `--color-app-hub` | `#3B82F6` | Blue (dashboard/overview) |

**Rule:** Never use raw hex values. Always reference tokens via NativeWind/Tailwind.

### Motion Budget

| Type | Duration | Easing |
|------|----------|--------|
| Micro (hover, toggle) | 150ms | ease-out |
| Standard (reveal, transition) | 300ms | ease-in-out |
| Dramatic (page, celebration) | 500ms | spring |

### Required Component States

Every interactive component MUST implement:

- Default
- Loading (ActivityIndicator)
- Error (error message + retry)
- Empty (friendly message + CTA)
- Disabled (if applicable)

---

## Implementation Phases

### Phase 1: SDK Alignment (1-2 days)

#### 1.0: Baseline Capture

**Goal:** Establish baseline before any changes.

**Commands:**

```bash
cd innerscape-mobile
git status                    # Ensure clean working directory
npm run typecheck 2>&1 | tee baseline-typecheck.log
npm test 2>&1 | tee baseline-test.log
npm run lint 2>&1 | tee baseline-lint.log
```

**Acceptance Criteria:**

- [ ] All logs saved
- [ ] Note any pre-existing failures (do not fix unrelated issues)
- [ ] Git stash created: `git stash push -m "pre-consolidation-baseline"`

#### 1.1: SDK Upgrade

**Goal:** Upgrade Expo SDK 52 to 54.

**Files to Read First:**

- `innerscape-mobile/package.json`
- `innerscape-mobile/app.json`
- `innerscape-soma/package.json` (reference for target versions)

**Commands:**

```bash
cd innerscape-mobile
npx expo upgrade 54
```

**Expected Dependency Changes:**

| Package | From | To |
|---------|------|-----|
| expo | ~52.0.0 | ~54.0.0 |
| react-native | 0.76.x | 0.81.x |
| react | 18.3.x | 19.1.x |
| expo-router | ~3.5.0 | ~6.0.0 |
| react-native-reanimated | ~3.16.0 | ~4.1.0 |

**Acceptance Criteria:**

- [ ] `npx expo doctor` reports no critical issues
- [ ] `npm run typecheck` passes
- [ ] App launches: `npx expo start --clear`

#### 1.2: Install Skia

**Goal:** Add React Native Skia for EmotionWheel component.

**Commands:**

```bash
cd innerscape-mobile
npm install @shopify/react-native-skia
```

**File to Modify:** `innerscape-mobile/metro.config.js`

```javascript
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('sksl');
module.exports = config;
```

**Acceptance Criteria:**

- [ ] Build completes: `npx expo start`
- [ ] No Skia-related errors in console

#### 1.3: Post-Upgrade Verification

**Acceptance Criteria:**

- [ ] Typecheck passes (same or fewer errors than baseline)
- [ ] Lint passes (same or fewer errors than baseline)
- [ ] Tests pass (same or better than baseline)
- [ ] App launches and all 4 tabs navigate correctly

**Checkpoint:** `git add -A && git commit -m "chore: upgrade Expo SDK 52 to 54, add Skia"`

---

### Phase 2: Tab Restructure (2-3 days)

#### 2.1: Rename Pulse to Body

**File Operations:**

```bash
cd innerscape-mobile
mv app/\(tabs\)/pulse app/\(tabs\)/body
```

**Update Tab Layout:** `app/(tabs)/_layout.tsx` - Change to 4 tabs: Mind, Flow, Body, Hub

**Acceptance Criteria:**

- [ ] 4 tabs display: Mind, Flow, Body, Hub
- [ ] Navigation between tabs works

#### 2.2: Migrate Soma Components

**Files to Copy and Adapt:**

- `innerscape-soma/components/BodyScan.tsx` → `innerscape-mobile/components/body/BodyScan.tsx`
- `innerscape-soma/components/EmotionWheel.tsx` → `innerscape-mobile/components/body/EmotionWheel.tsx`
- `innerscape-soma/lib/store/useCheckInStore.ts` → `innerscape-mobile/lib/store/useCheckInStore.ts`

**Acceptance Criteria:**

- [ ] BodyScan renders without errors
- [ ] EmotionWheel renders and responds to gestures
- [ ] Store actions update state correctly

#### 2.3: Create Body Tab Home

**File to Create:** `innerscape-mobile/app/(tabs)/body/index.tsx`

**Required States:** Loading, Error, Empty, Loaded

**Acceptance Criteria:**

- [ ] Check-in card navigates to check-in flow
- [ ] Health cards display data (or N/A if none)
- [ ] Pull-to-refresh works

#### 2.4: Create Check-in Flow Screens

**Files to Create:**

```
innerscape-mobile/app/(tabs)/body/check-in/
├── _layout.tsx
├── index.tsx
├── body-scan.tsx
├── wheel.tsx
├── sensations.tsx
├── reflection.tsx
└── result.tsx
```

**Acceptance Criteria:**

- [ ] Flow navigates: Start → Body Scan → Wheel → Sensations → Reflection → Result
- [ ] State persists across screens via Zustand store
- [ ] Save creates record in backend

#### 2.5: Integration Testing

**Acceptance Criteria:**

- [ ] All manual tests pass
- [ ] No console errors during flow

**Checkpoint:** `git add -A && git commit -m "feat: add Body tab with check-in flow"`

---

### Phase 3: Journal Connection (1 day)

**Goal:** Add "Go Deeper" flow from Body reflection to Mind Voice Journal.

**Files to Modify:**

1. `innerscape-mobile/app/(tabs)/body/check-in/reflection.tsx` - Add "Go Deeper" button
2. `innerscape-mobile/app/(tabs)/mind/journal.tsx` - Accept check-in context params

**Acceptance Criteria:**

- [ ] "Go Deeper" button visible on reflection screen
- [ ] Journal shows contextual prompt based on check-in

**Checkpoint:** `git add -A && git commit -m "feat: connect Body reflection to Mind Voice Journal"`

---

### Phase 4: Web-to-Mobile Features (5-7 days)

#### 4.1: Dopamine Menu

**Source:** `"Second Brain Project/src/components/DopamineMenu.tsx"`
**Target:** `innerscape-mobile/components/DopamineMenu.tsx`

**Acceptance Criteria:**

- [ ] Menu displays 4 categories
- [ ] Time-of-day recommendations work
- [ ] Works offline with cached data

#### 4.2: Shutdown Ritual

**Source:** `"Second Brain Project/src/components/ShutdownRitual.tsx"`
**Target:** `innerscape-mobile/components/ShutdownRitual.tsx`

**Acceptance Criteria:**

- [ ] Ritual appears after 5 PM
- [ ] Progress bar updates as steps complete

#### 4.3: Goals

**Target:** `innerscape-mobile/app/(tabs)/hub/goals.tsx`

**Acceptance Criteria:**

- [ ] Can create, update, and archive goals
- [ ] Progress tracking works

#### 4.4: Analytics

**Target:** `innerscape-mobile/app/(tabs)/hub/analytics.tsx`

**Acceptance Criteria:**

- [ ] At least one chart renders correctly
- [ ] Correlations display as cards

#### 4.5: Celebrations

**Acceptance Criteria:**

- [ ] Confetti triggers on streak milestones
- [ ] Animation respects `prefers-reduced-motion`

**Checkpoint:** `git add -A && git commit -m "feat: add Dopamine Menu, Shutdown Ritual, Goals, Analytics, Celebrations"`

---

### Phase 5: Mobile-to-Web Features (5-7 days)

#### 5.1: Flow Section (Web)

**Target:** `"Second Brain Project/src/app/(shell)/flow/page.tsx"`

**Acceptance Criteria:**

- [ ] Habits display with completion toggles
- [ ] Streak calendar shows history

#### 5.2: Body Section (Web)

**Target:** `"Second Brain Project/src/app/(shell)/body/page.tsx"`

**Acceptance Criteria:**

- [ ] Check-in flow works (SVG/CSS version, not Skia)
- [ ] Health data displays (read-only)

#### 5.3: Voice Journal (Web)

**Target:** `"Second Brain Project/src/app/(shell)/mind/journal/page.tsx"`

**Acceptance Criteria:**

- [ ] Voice recording works via Web Audio API
- [ ] Transcription appears after recording

**Checkpoint:** `git add -A && git commit -m "feat: add Flow, Body, Voice Journal to web app"`

---

### Phase 6: Backend Fixes (2-3 days)

**File to Modify:** `lifeos-backend/src/routes/habits.ts`

**Changes:**

1. Add `completedToday` field to GET `/flow/habits` response
2. Add DELETE `/flow/habits/:id/complete` endpoint for undo
3. Add search query param to GET `/brain/inbox`

**Acceptance Criteria:**

- [ ] `GET /flow/habits` returns `completedToday` field
- [ ] `DELETE /flow/habits/:id/complete` undoes completion
- [ ] Search works on inbox endpoint

**Checkpoint:** `git add -A && git commit -m "fix: add completedToday, habit undo, search to backend"`

---

### Phase 7: Cleanup (1 day)

#### 7.1: Archive innerscape-soma

```bash
mv innerscape-soma _archived/innerscape-soma-$(date +%Y%m%d)
```

#### 7.2: Update Documentation

- Update `README.md`
- Mark this plan complete

#### 7.3: Final Verification

**Acceptance Criteria:**

- [ ] All quality gates pass
- [ ] Mobile app has 4 tabs working
- [ ] Web app has all 4 sections working
- [ ] innerscape-soma archived

**Final Checkpoint:** `git add -A && git commit -m "chore: complete consolidation, archive innerscape-soma"`

---

## Feature Parity Matrix

| Feature | Mobile | Web | Notes |
|---------|--------|-----|-------|
| **Mind** | | | |
| Inbox | Yes | Yes | Full parity |
| Quick Capture | Yes | Yes | Full parity |
| Voice Capture | Yes | Yes | Port to web |
| Projects | Yes | Yes | Full parity |
| Voice Journal | Yes | Yes | Port to web |
| **Flow** | | | |
| Habits Display | Yes | Yes | Port to web |
| Habit Completion | Yes | Yes | Port to web |
| Routines | Yes | Yes | Implement on both |
| Streaks Calendar | Yes | Yes | Implement on both |
| **Body** | | | |
| Check-in Flow | Yes | Yes | Port to web |
| Body Scan | Yes | Yes | Port to web (SVG) |
| Emotion Wheel | Yes | Yes | Port to web (CSS) |
| Health Input | Yes | No | Mobile only (HealthKit) |
| Health Display | Yes | Yes | Web read-only |
| **Hub** | | | |
| Today Summary | Yes | Yes | Full parity |
| Dopamine Menu | Yes | Yes | Port to mobile |
| Shutdown Ritual | Yes | Yes | Port to mobile |
| Goals/OKRs | Yes | Yes | Port to mobile |
| Analytics | Yes | Yes | Port to mobile |
| Celebrations | Yes | Yes | Port to mobile |
| **Platform-Specific** | | | |
| Push Notifications | Yes | No | Mobile only |
| Widgets | Yes | No | Mobile only |
| HealthKit/Health Connect | Yes | No | Mobile only |

---

## Performance Budgets

| Metric | Target | Limit |
|--------|--------|-------|
| App launch (cold) | < 2s | < 3s |
| Tab switch | < 100ms | < 200ms |
| List scroll FPS | 60 | 45 |
| API response | < 200ms | < 500ms |
| Bundle size (JS) | < 5MB | < 8MB |

---

## Summary

**Total Phases:** 7
**Estimated Duration:** 17-24 days

**Key Deliverables:**

1. Single mobile app with 4 tabs (Mind, Flow, Body, Hub)
2. Web app with matching sections
3. Connected journaling flow
4. Feature parity (Dopamine Menu, Goals, Analytics, etc.)
5. Backend improvements

---

*This plan supersedes all previous plans including REMEDIATION_PLAN.md and tasks/IMPLEMENTATION_PLAN.md*
