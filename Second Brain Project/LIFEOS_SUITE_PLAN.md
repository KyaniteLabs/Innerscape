# LifeOS Suite — Master Implementation Plan

> **Version**: 2.1.0 | **Date**: January 2026
> 
> This document defines the unified plan for transforming Feelings APP and Second Brain into a comprehensive LifeOS suite — a complete personal operating system for self-awareness, productivity, and wellbeing.

---

## Executive Summary

Transform two standalone applications into a cohesive, cloud-synced personal operating system with full data sharing across all apps for maximum insight generation. This plan covers architecture, technology decisions, implementation phases, and deliverables.

**Scope**: 2 mobile apps, 1 web app, 1 shared backend, 1 design system

### Consolidated App Architecture (Option B)

**User installs only 2 mobile apps:**

```
┌────────────────────┐    ┌─────────────────────────────────────────────────────┐
│   Innerscape Soma  │    │              Innerscape (Main App)                  │
│     (Flutter)      │    │  ┌─────────┬─────────┬─────────┬─────────┐         │
│                    │    │  │  Mind   │  Flow   │ Journal │  Pulse  │  Hub    │
│   Body-focused     │    │  │  (tab)  │  (tab)  │ (mode)  │  (tab)  │  (tab)  │
│   check-ins        │    │  └─────────┴─────────┴─────────┴─────────┘         │
│   3D wheel         │    │              (React Native + Expo)                  │
└────────────────────┘    └─────────────────────────────────────────────────────┘
          │                                       │
          └───────────────────────────────────────┘
                              │
                    ┌─────────────────┐
                    │  Innerscape Hub │
                    │    (Next.js)    │
                    │  Full dashboard │
                    │  Goals/Analytics│
                    └─────────────────┘
```

### Complete App Suite

| App | Purpose | Platform | Status |
|-----|---------|----------|--------|
| **Innerscape Soma** | Body awareness, emotional check-ins, 3D wheel | Flutter (existing) | Enhance |
| **Innerscape** | Unified mobile app with 4 tabs | React Native + Expo | New |
| ↳ Mind tab | Thought capture, AI organization, inbox | (tab) | New |
| ↳ Flow tab | Habit tracking, daily routines, streaks | (tab) | New |
| ↳ Journal mode | Voice journaling, prompted reflection | (in Mind) | New |
| ↳ Pulse tab | Sleep/energy dashboard, health data | (tab) | New |
| ↳ Hub tab | Daily summary, quick insights | (tab) | New |
| **Innerscape Hub** | Full dashboard, goals, analytics | Next.js (web) | Enhance |
| **Widgets** | Quick capture, habits, mood | iOS + Android | New |

### Why This Architecture

1. **Only 2 mobile apps** — Less friction, less confusion
2. **Soma stays Flutter** — Preserves 3D wheel investment, body-focused UX
3. **Journal merged into Mind** — AI classifies if capture is journal vs actionable
4. **Single emotional context** — Soma is the source, others read it
5. **Shared RN codebase** — All tabs share components, sync, auth

---

## Final Architecture Decisions (Locked)

### Technology Stack — No Ambiguity

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Soma** | Flutter (Dart) — KEEP + ENHANCE | Body-focused, 3D wheel, touch-optimized |
| **Innerscape Mobile** | React Native + Expo (TypeScript) — NEW | Single app with tabs, code sharing |
| **Hub Web** | Next.js 16 (TypeScript) — KEEP + ENHANCE | AI integration, full dashboard |
| **Widgets** | iOS WidgetKit + Android Glance — NEW | Native widgets for quick actions |
| **Cloud Backend** | Hono on Cloudflare Workers (TypeScript) | Edge-first, fast, APEX-compliant |
| **Database** | Turso (libSQL/SQLite) | SQLite-compatible, edge-distributed |
| **Sync Engine** | PowerSync | SQLite sync, works with Flutter AND React Native |
| **Authentication** | Clerk | Multi-platform SDKs, easy setup |
| **Health Data** | Apple HealthKit + Google Health Connect | Native health APIs (in Pulse tab) |
| **Speech-to-Text** | Whisper (on-device) + Deepgram (cloud) | Voice journaling, capture |
| **Design Tokens** | Style Dictionary (JSON to all platforms) | Single source, multi-platform output |

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          EMOTIONAL CONTEXT                               │
│  Soma (Flutter) is the PRIMARY source of energy/mood                    │
│  All other apps READ from emotional_context table                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│  Mind Tab     │         │  Flow Tab     │         │  Pulse Tab    │
│  Shows mood   │         │  Energy-aware │         │  Visualizes   │
│  in header    │         │  suggestions  │         │  energy over  │
│               │         │               │         │  time         │
└───────────────┘         └───────────────┘         └───────────────┘
```

### Critical Decision: Second Brain Mobile

**IMPORTANT**: The existing `FLUTTER_MOBILE_PLAN.md` in this repository is SUPERSEDED by this plan. We are building Second Brain Mobile in **React Native**, not Flutter, for these reasons:

1. TypeScript code sharing with Next.js web app
2. Shared validation (Zod), types, utilities
3. Better AI SDK support
4. Aligns with APEX TypeScript standards
5. Reduces context-switching between Dart and TypeScript

The Flutter mobile plan document should be archived with a note pointing to this plan.

---

## Repository Structure

### Current Structure
```
/LifeOS/
├── Feelings APP/           # Flutter - KEEP
└── Second Brain Project/   # Next.js - KEEP
```

### Target Structure (Consolidated)
```
/LifeOS/
├── Feelings APP/                    # Flutter app → Innerscape Soma
│   ├── LIFEOS_SUITE_PLAN.md
│   └── lib/
│       ├── domain/services/
│       │   ├── ai_pattern_service.dart    # AI pattern detection
│       │   └── voice_checkin_service.dart # Voice-guided check-ins
│       └── data/
│           └── health_correlation_repository.dart  # READ health correlations
│
├── Second Brain Project/            # Next.js web → Innerscape Hub
│   ├── LIFEOS_SUITE_PLAN.md
│   └── src/app/
│       ├── hub/                    # Unified dashboard
│       ├── goals/                  # Goals/OKR tracking
│       ├── analytics/              # Cross-app analytics
│       └── (existing routes)       # Projects, people, ideas, etc.
│
├── innerscape-mobile/               # NEW: Single React Native app
│   ├── app/                        # Expo Router file-based routing
│   │   ├── (tabs)/                 # Tab navigator
│   │   │   ├── mind/               # Mind tab screens
│   │   │   │   ├── index.tsx       # Capture + inbox
│   │   │   │   ├── projects.tsx
│   │   │   │   ├── people.tsx
│   │   │   │   ├── ideas.tsx
│   │   │   │   └── journal.tsx     # Journal mode (within Mind)
│   │   │   ├── flow/               # Flow tab screens
│   │   │   │   ├── index.tsx       # Today's habits
│   │   │   │   ├── routines.tsx    # Morning/evening
│   │   │   │   └── streaks.tsx
│   │   │   ├── pulse/              # Pulse tab screens
│   │   │   │   ├── index.tsx       # Energy dashboard
│   │   │   │   ├── sleep.tsx       # Sleep details
│   │   │   │   └── trends.tsx      # Weekly/monthly
│   │   │   ├── hub/                # Hub tab screens
│   │   │   │   ├── index.tsx       # Today summary
│   │   │   │   └── insights.tsx    # Cross-app insights
│   │   │   └── _layout.tsx         # Tab bar configuration
│   │   ├── chat.tsx                # AI chat (modal)
│   │   ├── capture.tsx             # Quick capture (modal)
│   │   └── _layout.tsx             # Root layout
│   ├── components/                 # Shared components
│   │   ├── EmotionalContextBanner.tsx  # Shows current mood from Soma
│   │   ├── VoiceRecorder.tsx
│   │   ├── HabitCard.tsx
│   │   └── ...
│   ├── lib/
│   │   ├── api/                    # API client
│   │   ├── sync/                   # PowerSync
│   │   ├── health/                 # HealthKit/Google Fit
│   │   └── voice/                  # Whisper/Deepgram
│   ├── widgets/                    # iOS/Android widget code
│   │   ├── ios/                    # WidgetKit Swift code
│   │   └── android/                # Glance Kotlin code
│   └── package.json
│
├── lifeos-backend/                  # Cloud backend (Hono)
│   ├── src/
│   │   ├── routes/
│   │   │   ├── feelings.ts         # Emotional context API
│   │   │   ├── brain.ts            # Projects/people/ideas API
│   │   │   ├── habits.ts           # Habits API
│   │   │   ├── journal.ts          # Journal entries API
│   │   │   ├── health.ts           # Health data API
│   │   │   ├── goals.ts            # Goals/OKR API
│   │   │   └── insights.ts         # Cross-app insights API
│   │   ├── sync/                   # PowerSync server
│   │   ├── ai/                     # AI services
│   │   └── auth/                   # Clerk integration
│   ├── drizzle/
│   └── package.json
│
├── lifeos-design-system/            # Shared design tokens
│   ├── tokens/
│   ├── build/
│   └── package.json
│
└── lifeos-shared/                   # Shared TypeScript types
    ├── src/
    │   ├── types/
    │   ├── schemas/
    │   └── utils/
    └── package.json
```

### Mobile App Tab Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                     Innerscape Mobile App                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Emotional Context Banner (reads from Soma)              │    │
│  │  "Currently: High energy, Pleasant 😊"                   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Tab Content Area                      │    │
│  │                                                          │    │
│  │  (Mind / Flow / Pulse / Hub content here)               │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────┬─────────┬─────────┬─────────┬─────────┐           │
│  │  Mind   │  Flow   │    +    │  Pulse  │   Hub   │           │
│  │   🧠    │   ⚡    │  (FAB)  │   💜    │   📊    │           │
│  └─────────┴─────────┴─────────┴─────────┴─────────┘           │
│                         │                                        │
│                    Quick Capture                                 │
│                    (opens modal)                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema (Unified)

All apps share one logical schema, synced via PowerSync. This enables comprehensive cross-app analytics and insights.

### Core Tables

```sql
-- ============================================
-- EXISTING TABLES (with sync columns added)
-- ============================================

-- Feelings APP tables (existing, add sync columns)
ALTER TABLE check_ins ADD COLUMN user_id TEXT NOT NULL DEFAULT 'personal';
ALTER TABLE check_ins ADD COLUMN updated_at TEXT;
ALTER TABLE check_ins ADD COLUMN synced_at TEXT;

ALTER TABLE reflections ADD COLUMN user_id TEXT NOT NULL DEFAULT 'personal';
ALTER TABLE reflections ADD COLUMN updated_at TEXT;

ALTER TABLE personal_mappings ADD COLUMN user_id TEXT NOT NULL DEFAULT 'personal';
ALTER TABLE personal_mappings ADD COLUMN updated_at TEXT;

-- Second Brain tables (existing, add sync columns)
ALTER TABLE projects ADD COLUMN updated_at TEXT;
ALTER TABLE projects ADD COLUMN synced_at TEXT;
-- (same for people, ideas, admin_tasks, inbox_log)

-- ============================================
-- CROSS-APP CONTEXT
-- ============================================

-- Current emotional state (shared across all apps)
CREATE TABLE emotional_context (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  check_in_id TEXT REFERENCES check_ins(id),
  energy TEXT NOT NULL,           -- 'high' | 'low'
  valence TEXT NOT NULL,          -- 'pleasant' | 'unpleasant' | 'neutral'
  intensity INTEGER NOT NULL,     -- 1-5
  captured_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,       -- Context valid for 4 hours
  updated_at TEXT
);

-- Cross-app insights (generated by AI)
CREATE TABLE cross_insights (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  insight_type TEXT NOT NULL,     -- 'correlation' | 'pattern' | 'suggestion' | 'warning'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_apps TEXT NOT NULL,      -- JSON array: ['feelings', 'brain', 'habits', 'journal', 'health']
  confidence REAL,
  data_points INTEGER,            -- Number of data points used
  timeframe_days INTEGER,         -- Analysis window
  action_taken INTEGER DEFAULT 0,
  dismissed INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT
);

-- ============================================
-- HABITS (Innerscape Flow)
-- ============================================

CREATE TABLE habits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL,        -- 'daily' | 'weekly' | 'custom'
  frequency_config TEXT,          -- JSON for custom schedules
  category TEXT,                  -- 'morning' | 'evening' | 'anytime'
  energy_cost TEXT,               -- 'low' | 'medium' | 'high'
  ideal_time TEXT,                -- Suggested time based on energy patterns
  linked_goal_id TEXT,            -- FK to goals table
  streak_current INTEGER DEFAULT 0,
  streak_best INTEGER DEFAULT 0,
  archived INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE TABLE habit_completions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  habit_id TEXT NOT NULL REFERENCES habits(id),
  completed_at TEXT NOT NULL,
  energy_before TEXT,             -- From emotional_context
  energy_after TEXT,              -- Post-completion check (optional)
  duration_minutes INTEGER,       -- How long it took
  notes TEXT,
  updated_at TEXT
);

-- ============================================
-- JOURNAL (Innerscape Journal)
-- ============================================

CREATE TABLE journal_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  entry_type TEXT NOT NULL,       -- 'voice' | 'text' | 'prompted'
  title TEXT,                     -- Auto-generated or user-provided
  content TEXT NOT NULL,          -- Full text content
  audio_url TEXT,                 -- S3/R2 URL for voice recordings
  audio_duration_seconds INTEGER,
  transcription_status TEXT,      -- 'pending' | 'completed' | 'failed'
  prompt_id TEXT,                 -- If prompted entry, FK to prompts
  mood_before TEXT,               -- Energy + valence snapshot
  mood_after TEXT,
  tags TEXT,                      -- JSON array of tags
  linked_check_in_id TEXT,        -- FK to check_ins (if created from check-in)
  linked_project_id TEXT,         -- FK to projects (if about a project)
  ai_summary TEXT,                -- AI-generated summary
  ai_themes TEXT,                 -- JSON array of detected themes
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE TABLE journal_prompts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  category TEXT,                  -- 'morning' | 'evening' | 'weekly' | 'emotional' | 'gratitude'
  frequency TEXT,                 -- 'daily' | 'weekly' | 'situational'
  trigger_condition TEXT,         -- JSON: when to show this prompt
  active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT
);

-- ============================================
-- HEALTH DATA (Innerscape Pulse)
-- ============================================

CREATE TABLE health_metrics (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  metric_type TEXT NOT NULL,      -- 'sleep' | 'hrv' | 'steps' | 'exercise' | 'heart_rate'
  value REAL NOT NULL,
  unit TEXT NOT NULL,             -- 'hours' | 'ms' | 'count' | 'bpm'
  source TEXT NOT NULL,           -- 'apple_health' | 'google_fit' | 'manual'
  recorded_at TEXT NOT NULL,      -- When the metric was recorded
  period_start TEXT,              -- For sleep: sleep start time
  period_end TEXT,                -- For sleep: wake time
  metadata TEXT,                  -- JSON for additional data (sleep stages, etc.)
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE TABLE sleep_records (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  sleep_start TEXT NOT NULL,
  sleep_end TEXT NOT NULL,
  duration_hours REAL NOT NULL,
  quality_score REAL,             -- 0-100 based on stages/HRV
  deep_sleep_minutes INTEGER,
  rem_sleep_minutes INTEGER,
  light_sleep_minutes INTEGER,
  awake_minutes INTEGER,
  hrv_average REAL,
  source TEXT NOT NULL,
  notes TEXT,
  morning_energy TEXT,            -- Link to first check-in of day
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE TABLE energy_predictions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  prediction_date TEXT NOT NULL,
  hour_of_day INTEGER NOT NULL,   -- 0-23
  predicted_energy TEXT NOT NULL, -- 'high' | 'medium' | 'low'
  confidence REAL,
  factors TEXT,                   -- JSON: what influenced this prediction
  actual_energy TEXT,             -- Filled in after check-in
  created_at TEXT NOT NULL,
  updated_at TEXT
);

-- ============================================
-- GOALS (Innerscape Goals - in Mind)
-- ============================================

CREATE TABLE goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  goal_type TEXT NOT NULL,        -- 'outcome' | 'habit' | 'project' | 'learning'
  timeframe TEXT NOT NULL,        -- 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  target_value REAL,              -- For measurable goals
  target_unit TEXT,               -- 'count' | 'hours' | 'percent' | 'boolean'
  current_value REAL DEFAULT 0,
  status TEXT DEFAULT 'active',   -- 'active' | 'completed' | 'abandoned' | 'paused'
  parent_goal_id TEXT,            -- For hierarchical goals (OKR style)
  start_date TEXT,
  due_date TEXT,
  completed_at TEXT,
  reflection TEXT,                -- End-of-goal reflection
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE TABLE goal_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  goal_id TEXT NOT NULL REFERENCES goals(id),
  value REAL NOT NULL,
  notes TEXT,
  source TEXT,                    -- 'manual' | 'habit' | 'project' | 'auto'
  source_id TEXT,                 -- ID of linked habit/project completion
  recorded_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE goal_check_ins (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  goal_id TEXT NOT NULL REFERENCES goals(id),
  confidence_score INTEGER,       -- 1-10: How confident in achieving?
  blockers TEXT,                  -- What's in the way?
  next_actions TEXT,              -- What will you do next?
  emotional_state TEXT,           -- How do you feel about this goal?
  created_at TEXT NOT NULL
);

-- ============================================
-- TIME TRACKING (Optional - for future)
-- ============================================

CREATE TABLE time_blocks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  activity_type TEXT NOT NULL,    -- 'project' | 'admin' | 'meeting' | 'break' | 'other'
  activity_id TEXT,               -- FK to project/task if applicable
  activity_name TEXT,             -- Display name
  start_time TEXT NOT NULL,
  end_time TEXT,
  duration_minutes INTEGER,
  energy_at_start TEXT,
  energy_at_end TEXT,
  focus_rating INTEGER,           -- 1-5 self-reported focus
  notes TEXT,
  source TEXT,                    -- 'manual' | 'calendar' | 'auto'
  created_at TEXT NOT NULL,
  updated_at TEXT
);

-- ============================================
-- AUTOMATION (Cross-app triggers)
-- ============================================

CREATE TABLE automation_rules (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,     -- 'time' | 'event' | 'condition'
  trigger_config TEXT NOT NULL,   -- JSON: trigger details
  action_type TEXT NOT NULL,      -- 'notification' | 'suggestion' | 'create_entry'
  action_config TEXT NOT NULL,    -- JSON: action details
  enabled INTEGER DEFAULT 1,
  last_triggered_at TEXT,
  trigger_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT
);

-- ============================================
-- SYNC METADATA
-- ============================================

CREATE TABLE sync_metadata (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  table_name TEXT NOT NULL,
  last_synced_at TEXT,
  sync_token TEXT
);
```

### Data Relationships Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  check_ins  │────▶│  emotional  │◀────│   habits    │
│   (Soma)    │     │   context   │     │   (Flow)    │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │                   ▼                   │
       │           ┌─────────────┐             │
       └──────────▶│   cross_    │◀────────────┘
                   │  insights   │
       ┌──────────▶│             │◀────────────┐
       │           └─────────────┘             │
       │                   ▲                   │
┌─────────────┐            │           ┌─────────────┐
│   journal   │────────────┘           │   health    │
│  entries    │                        │  metrics    │
└─────────────┘                        └─────────────┘
       │                                       │
       │           ┌─────────────┐             │
       └──────────▶│    goals    │◀────────────┘
                   │             │
                   └─────────────┘
                          ▲
                          │
                   ┌─────────────┐
                   │  projects   │
                   │   (Mind)    │
                   └─────────────┘
```

---

## Implementation Phases

### Phase 0: Foundation (Week 1-2)

**Goal**: Set up infrastructure for all future work.

**Deliverables**:
1. Create `lifeos-design-system/` with initial tokens
2. Create `lifeos-shared/` with TypeScript types for ALL apps
3. Create `lifeos-backend/` skeleton with Hono
4. Set up Turso database with complete unified schema
5. Configure Clerk authentication
6. Archive old `FLUTTER_MOBILE_PLAN.md` with redirect note

**Files to Create**: See Repository Structure section.

**No Changes to Existing Apps in Phase 0**

---

### Phase 1: Cloud Backend + Sync (Week 2-5)

**Goal**: Build the shared backend with full API coverage for all planned apps.

**Deliverables**:
1. Hono API server with all routes
2. Turso database connection
3. Clerk authentication middleware
4. PowerSync server setup
5. Deepgram integration for voice transcription
6. API documentation

**API Routes**:
```
# Auth & Sync
POST   /auth/webhook              # Clerk webhook
GET    /sync/checkpoint           # PowerSync checkpoint
POST   /sync/changes              # PowerSync changes

# Feelings (Soma)
GET    /api/feelings/context      # Current emotional context
POST   /api/feelings/context      # Write emotional context
GET    /api/feelings/patterns     # AI-detected patterns

# Brain (Mind)
GET    /api/brain/projects        # CRUD for projects
POST   /api/brain/projects
PATCH  /api/brain/projects/:id
DELETE /api/brain/projects/:id
# (same pattern for people, ideas, tasks, inbox)

# Habits (Flow)
GET    /api/habits                # Habit CRUD
POST   /api/habits
PATCH  /api/habits/:id
DELETE /api/habits/:id
POST   /api/habits/:id/complete
GET    /api/habits/suggestions    # Energy-based suggestions

# Journal
GET    /api/journal               # List entries
POST   /api/journal               # Create entry
PATCH  /api/journal/:id           # Update entry
DELETE /api/journal/:id           # Delete entry
POST   /api/journal/transcribe    # Voice transcription
GET    /api/journal/prompts       # Get prompts
POST   /api/journal/prompts       # Create custom prompt

# Health (Pulse)
POST   /api/health/sync           # Sync from HealthKit/Google Fit
GET    /api/health/metrics        # Get health metrics
GET    /api/health/sleep          # Sleep records
GET    /api/health/predictions    # Energy predictions

# Goals
GET    /api/goals                 # List goals
POST   /api/goals                 # Create goal
PATCH  /api/goals/:id             # Update goal
DELETE /api/goals/:id             # Delete goal
POST   /api/goals/:id/progress    # Log progress
POST   /api/goals/:id/checkin     # Goal check-in

# Insights (Cross-app)
GET    /api/insights              # Get insights
POST   /api/insights/generate     # Trigger generation
POST   /api/insights/:id/dismiss  # Dismiss insight
POST   /api/insights/:id/action   # Mark action taken

# AI Services
POST   /api/ai/classify           # Capture classification
POST   /api/ai/chat               # AI chat
POST   /api/ai/summarize          # Summarize journal/notes
POST   /api/ai/analyze            # Pattern analysis

# Hub (Dashboard)
GET    /api/hub/summary           # Daily/weekly summary
GET    /api/hub/analytics         # Cross-app analytics
GET    /api/hub/timeline          # Unified activity timeline
```

---

### Phase 2: Existing App Integration (Week 5-8)

**Goal**: Connect existing apps to cloud backend and add new features.

#### Feelings APP (Soma) Enhancements:
1. Add PowerSync Flutter SDK for sync
2. Add Clerk Flutter SDK for auth
3. **NEW: AI Pattern Detection** — Analyze historical check-ins for patterns
4. **NEW: Voice-Guided Check-ins** — Audio prompts, eyes-closed mode
5. **NEW: Apple Health / Google Fit Integration** — Import sleep, HRV
6. Write emotional context to shared table after each check-in

**New Files** (Feelings APP):
- `lib/domain/services/ai_pattern_service.dart` — Pattern detection
- `lib/domain/services/voice_checkin_service.dart` — Voice guidance
- `lib/data/repositories/health_repository.dart` — HealthKit/Google Fit
- `lib/presentation/screens/voice_checkin_screen.dart` — Voice mode UI
- `lib/presentation/screens/patterns_screen.dart` — View detected patterns

#### Second Brain (Mind) Web Enhancements:
1. Add Clerk Next.js SDK for auth
2. Add PowerSync web SDK for offline
3. **NEW: Hub Dashboard** — Unified view of all apps
4. **NEW: Goals Feature** — OKR tracking integrated with projects
5. **NEW: Enhanced Analytics** — Cross-app visualizations
6. Display emotional context in UI
7. Factor emotional context into AI classification

**New Routes** (Second Brain):
- `src/app/hub/page.tsx` — Unified dashboard
- `src/app/hub/timeline/page.tsx` — Activity timeline
- `src/app/goals/page.tsx` — Goals list
- `src/app/goals/[id]/page.tsx` — Goal detail
- `src/app/analytics/correlations/page.tsx` — Cross-app correlations

---

### Phase 3: Innerscape Mobile App (Week 8-14)

**Goal**: Build the single consolidated React Native app with 4 tabs.

**Deliverables**:
1. Expo app setup (`innerscape-mobile/`)
2. Tab navigation (Mind, Flow, Pulse, Hub)
3. Shared components library
4. Integration packages (API, sync, health, voice)
5. Emotional Context Banner (reads from Soma)

#### App Structure

```
Innerscape Mobile
├── Mind Tab (default)
│   ├── Quick Capture (text + voice)
│   ├── Inbox with swipe actions
│   ├── Projects / People / Ideas lists
│   ├── Journal Mode (voice journaling within Mind)
│   └── AI Chat (modal)
├── Flow Tab
│   ├── Today's Habits with check-off
│   ├── Morning / Evening routines
│   ├── Streak tracking
│   └── Energy-aware suggestions
├── Pulse Tab
│   ├── Energy Dashboard
│   ├── Sleep visualization
│   ├── Health metrics (HRV, steps)
│   └── Weekly/monthly trends
├── Hub Tab
│   ├── Today summary
│   ├── Cross-app insights
│   ├── Goals progress
│   └── Activity timeline
└── Floating Action Button
    └── Quick Capture modal
```

#### Mind Tab Features:
- Quick capture (text + voice via Whisper)
- AI classification: "Is this a journal entry or actionable item?"
- Inbox review with swipe actions
- Projects/People/Ideas list views
- **Journal Mode**: Toggle to voice journaling with prompts
- AI chat assistant
- Offline support via PowerSync

#### Journal Mode (within Mind Tab):
- **Voice-first recording** — Press and speak
- On-device transcription (Whisper) with cloud fallback (Deepgram)
- Prompted entries (morning pages, gratitude, reflection)
- AI-generated summaries and themes
- Link entries to check-ins, projects, goals
- Search across all entries
- **No separate mood capture** — Uses Soma's emotional context

#### Flow Tab Features:
- Habit list with streak display
- Daily check-off with haptic feedback
- Morning/evening routine views
- **Energy-aware suggestions** — Reads emotional context from Soma
- "Low energy? Try these easy habits instead"
- Streak notifications
- Link habits to goals

#### Pulse Tab Features:
- Sleep tracking visualization (from HealthKit/Google Fit)
- Energy prediction curve (when will I have energy?)
- HRV trends
- Steps/exercise correlation
- **Insights**: "You sleep better after evening journaling"
- **No manual energy logging** — Soma is the source
- Weekly/monthly trend views

#### Hub Tab Features:
- Today at a glance
- Recent insights from all sources
- Goals progress summary
- Activity timeline (check-ins, captures, habits)
- Quick navigation to detailed views

#### Shared Components:
- `EmotionalContextBanner` — Shows current Soma state at top of all tabs
- `VoiceRecorder` — Reusable voice input component
- `HabitCard` — Habit display with check-off
- `InsightCard` — Cross-app insight display
- `CaptureModal` — Quick capture overlay

---

### Phase 4: Widgets (Week 14-16)

**Goal**: Native iOS and Android widgets for quick actions.

#### iOS Widgets (WidgetKit):
- **Mood Widget** — Quick check-in, shows current state
- **Habits Widget** — Today's habits with checkboxes
- **Capture Widget** — One-tap to capture thought
- **Energy Widget** — Current energy level + prediction
- **Quote Widget** — Daily journal prompt

#### Android Widgets (Glance/Jetpack):
- Same functionality as iOS
- Home screen shortcuts for voice capture

**Implementation**:
- iOS: Swift WidgetKit extension in `lifeos-mobile/`
- Android: Kotlin Glance widgets
- Shared data via app groups / shared preferences

---

### Phase 5: Cross-App Intelligence (Week 16-20)

**Goal**: Enable comprehensive insights across ALL apps with shared data.

**Deliverables**:
1. Advanced insight generation engine
2. Pattern detection across 6+ data sources
3. Energy prediction model
4. Personalized recommendations
5. Push notifications for insights

#### Insight Categories:

**Correlations** (data-driven discoveries):
- "7+ hours sleep → 73% chance of high morning energy"
- "Journaling before bed → 25% better sleep quality"
- "Project deadlines → increased anxiety check-ins"
- "Morning habits completed → 2.3x more productive day"

**Patterns** (behavioral observations):
- "You feel drained after 3+ hours on admin tasks"
- "Tuesdays are your lowest energy day"
- "You journal more when working on creative projects"
- "Skipping morning routine → 40% lower mood at lunch"

**Suggestions** (actionable recommendations):
- "Schedule deep work for 9-11am (your peak energy)"
- "Consider a walk — you haven't moved in 3 hours"
- "Time for a check-in? Last one was 6 hours ago"
- "Your energy dips at 2pm — schedule easy tasks then"

**Warnings** (proactive alerts):
- "Habit streak at risk — 2 hours until day ends"
- "Sleep deficit accumulating — consider earlier bedtime"
- "Stress indicators rising — journal prompt available"
- "Goal deadline in 3 days, 40% progress"

**Implementation**:
- Daily analysis cron job at midnight (user timezone)
- Real-time triggers for warnings
- 30/60/90 day analysis windows
- Confidence scoring with data point counts
- User feedback loop (helpful/not helpful)

---

### Phase 6: Automation Engine (Week 20-22)

**Goal**: User-configurable cross-app triggers and actions.

**Example Automations**:
- "When I complete a check-in showing low energy → suggest only low-energy habits"
- "When I finish a project → prompt goal progress update"
- "Every morning at 7am → show journal prompt"
- "When sleep < 6 hours → adjust today's energy predictions"
- "When habit streak reaches 7 days → celebration notification"
- "When I capture a thought about a project → auto-link it"

**Implementation**:
- Rule builder UI in Mind web
- `automation_rules` table for persistence
- Event system in backend
- Push notification integration

---

### Phase 7: Design System Rollout (Ongoing)

**Goal**: Visual consistency across ALL apps.

**Design Tokens**:
```json
{
  "color": {
    "primary": { "value": "#6366F1" },
    "secondary": { "value": "#8B5CF6" },
    "success": { "value": "#22C55E" },
    "warning": { "value": "#F59E0B" },
    "error": { "value": "#EF4444" },
    "surface": {
      "light": { "value": "#FFFFFF" },
      "dark": { "value": "#1F2937" }
    },
    "text": {
      "primary": {
        "light": { "value": "#111827" },
        "dark": { "value": "#F9FAFB" }
      }
    },
    "feelings": {
      "pleasant": { "value": "#34D399" },
      "unpleasant": { "value": "#F87171" },
      "neutral": { "value": "#9CA3AF" },
      "highEnergy": { "value": "#FBBF24" },
      "lowEnergy": { "value": "#60A5FA" }
    }
  }
}
```

**Build Pipeline**:
```bash
# In lifeos-design-system/
npm run build
# Outputs:
# - build/flutter/colors.dart
# - build/react/colors.ts
# - build/tailwind/colors.js
# - build/css/variables.css
```

**Integration**:
- Feelings APP: Import generated Dart file
- Second Brain Web: Import CSS variables
- Mobile Apps: Import React Native tokens

---

## Migration Path

### Data Migration Steps

1. **Export existing data** from both apps (already have PDF/CSV in Feelings)
2. **Run schema migrations** to add sync columns
3. **First sync** uploads all existing data to Turso
4. **Verify** data integrity with checksums
5. **Enable real-time sync** for new data

### User Migration

1. Users continue using apps normally (local-first)
2. Prompt to create account (Clerk) when ready
3. On account creation, one-time upload of local data
4. Sync enabled automatically after account creation
5. Local data preserved as fallback

---

## Security Considerations

### Authentication
- Clerk handles all auth (OAuth, magic link, passkey)
- JWTs stored securely (Keychain/Keystore on mobile)
- Short-lived access tokens (15 min), long refresh tokens

### Data Encryption
- Feelings APP: Keep existing SQLCipher encryption for local DB
- In transit: TLS 1.3 required
- At rest: Turso encrypts at rest by default
- E2E encryption: Future consideration (would prevent AI features)

### API Security
- Rate limiting per user
- Request signing for sensitive operations
- Webhook signature verification (Clerk)

---

## Testing Strategy

### Unit Tests
- `lifeos-shared/`: Jest for types/schemas
- `lifeos-backend/`: Vitest for API routes
- `lifeos-mobile/`: Jest + React Native Testing Library

### Integration Tests
- API integration tests against test Turso DB
- Sync integration tests (mock PowerSync server)
- Cross-app data flow tests

### E2E Tests
- Second Brain Web: Playwright
- Mobile Apps: Detox
- Feelings APP: Flutter integration_test (existing)

---

## Monitoring and Observability

### Logging
- Structured JSON logs in all apps
- Log levels: debug, info, warn, error
- User ID attached to all logs (after auth)

### Metrics
- API latency (p50, p95, p99)
- Sync success rate
- AI classification accuracy
- Error rates by endpoint

### Alerting
- Error rate > 1% for 5 minutes
- API latency p95 > 2s
- Sync failures > 10 in 1 hour

---

## Rollback Plan

### If Sync Breaks
1. Apps continue working locally (offline-first)
2. Disable sync flag server-side
3. Fix issue, re-enable sync
4. Conflict resolution on reconnect

### If Backend Breaks
1. Apps fall back to local-only mode
2. Cached data remains accessible
3. Queue writes for later sync

### If Migration Fails
1. Keep local databases untouched
2. Drop cloud data, start fresh
3. Re-run migration

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Sync latency | < 500ms | PowerSync metrics |
| Offline capability | 100% core features | Manual testing |
| Cross-app insights | 5+ per week | Database count |
| Voice transcription accuracy | > 95% | Spot checks |
| Energy prediction accuracy | > 70% | Predicted vs actual |
| Health data sync reliability | > 99% | Sync success rate |
| Journal entries per week | 3+ | Database count |
| Habit completion rate | Track trend | Analytics |
| Goal progress updates | Weekly | Check-in frequency |
| Data integrity | 0 conflicts unresolved | Sync logs |
| Test coverage | > 80% | CI reports |
| App launch time | < 2s cold start | Performance testing |
| Widget update latency | < 30s | Manual testing |

---

## Open Questions (To Decide During Implementation)

1. **Insight notification timing**: Morning digest vs. real-time?
2. **Habit energy cost**: Auto-detect from completion patterns or manual?
3. **AI model for insights**: GLM-4 (current) vs. Claude for better reasoning?
4. **Voice transcription**: On-device Whisper only, or cloud Deepgram for accuracy?
5. **Health data frequency**: Real-time sync or daily batch?
6. **Journal privacy**: E2E encrypt voice recordings? (would limit AI features)
7. **Energy predictions**: ML model complexity vs. simple heuristics?
8. **Goal hierarchy**: How deep should OKR nesting go?
9. **Automation limits**: How many rules per user? Rate limiting?
10. **Widget refresh rate**: How often to update widget data?
11. **Offline journal recordings**: Store locally until sync, or require connection?
12. **Cross-app deep links**: Custom URL scheme or universal links?

---

## Appendix: Key File Locations

### Existing Apps
- Feelings APP: `/LifeOS/Feelings APP/`
  - Main entry: `lib/main.dart`
  - Database: `lib/data/database/`
  - Services: `lib/domain/services/`
- Second Brain: `/LifeOS/Second Brain Project/`
  - Main entry: `src/app/page.tsx`
  - Database: `src/lib/db/`
  - AI: `src/lib/ai/`

### New Packages
- Backend: `/LifeOS/lifeos-backend/`
- Mobile: `/LifeOS/lifeos-mobile/`
- Design System: `/LifeOS/lifeos-design-system/`
- Shared Types: `/LifeOS/lifeos-shared/`

---

## Branding and Naming

### Suite Naming Options

Five viable directions for the overall suite brand:

#### Option A: **Innerscape** (Recommended)

| Component | Name | Tagline | Notes |
|-----------|------|---------|-------|
| **Suite** | Innerscape | "Map your inner world" | Overall brand |
| **Body App** | Innerscape Soma | Body awareness | Flutter app |
| **Main App** | Innerscape | Your life, organized | RN app with tabs |
| ↳ Mind tab | (within app) | Thoughts & ideas | Tab in main app |
| ↳ Flow tab | (within app) | Daily rhythm | Tab in main app |
| ↳ Pulse tab | (within app) | Energy intelligence | Tab in main app |
| ↳ Hub tab | (within app) | Command center | Tab in main app |
| **Web** | Innerscape Hub | Full dashboard | Next.js web app |
| **Backend** | Innerscape Cloud | Sync service | Internal only |

**App Store Naming (Consolidated)**:
- **Innerscape Soma** — Body Check-in (Flutter)
- **Innerscape** — Life OS (React Native main app)
- Web app doesn't need App Store presence

**Rationale**: 
- "Inner" captures the self-awareness focus
- "Scape" suggests landscape/mapping (exploration metaphor)
- Only 2 app names to remember (Soma for body, Innerscape for everything else)
- Domain likely available: innerscape.app, innerscape.io
- Distinctive, memorable, not generic

**Visual Identity**:
- Primary color: Deep indigo (#4F46E5) — introspection, depth
- Accent: Warm amber (#F59E0B) — energy, warmth
- Icon style: Organic, flowing shapes suggesting inner landscapes
- Typography: Outfit (headings), Inter (body) — modern, readable

**App Icons**:
- **Soma**: Abstract body silhouette with inner glow (distinct, body-focused)
- **Innerscape**: Layered landscape/terrain forming an "I" shape (main brand)

---

#### Option B: **Pulse**

| Component | Name | Tagline |
|-----------|------|---------|
| **Suite** | Pulse | "Feel. Think. Do." |
| **Feelings App** | Pulse Body | Somatic awareness |
| **Second Brain** | Pulse Mind | Thought capture |
| **Habit Tracker** | Pulse Rhythm | Daily habits |

**Rationale**:
- Short, energetic, memorable
- "Pulse" = life force, vitality
- Works well as app icon (pulsing circle)
- May have trademark conflicts (common word)

**Visual Identity**:
- Primary: Coral red (#F43F5E) — vitality, life
- Accent: Teal (#14B8A6) — calm, balance
- Icon: Radiating circles (pulse waves)
- Typography: Space Grotesk (headings), System UI (body)

---

#### Option C: **Nous** (Greek for "mind/intellect")

| Component | Name | Tagline |
|-----------|------|---------|
| **Suite** | Nous | "Know yourself" |
| **Feelings App** | Nous Soma | Body intelligence |
| **Second Brain** | Nous Cortex | Mind extension |
| **Habit Tracker** | Nous Ethos | Character building |

**Rationale**:
- Classical Greek terminology (philosophy-inspired)
- "Know thyself" (γνῶθι σεαυτόν) is ancient wisdom
- Appeals to intellectual/philosophical users
- Unique, not overused
- May be harder to pronounce for some

**Visual Identity**:
- Primary: Deep purple (#7C3AED) — wisdom, contemplation
- Accent: Gold (#EAB308) — classical, valuable
- Icon: Abstract Greek-inspired geometric forms
- Typography: Playfair Display (headings), Lora (body) — classical feel

---

#### Option D: **Meridian**

| Component | Name | Tagline |
|-----------|------|---------|
| **Suite** | Meridian | "Navigate your life" |
| **Feelings App** | Meridian Sense | Body navigation |
| **Second Brain** | Meridian Think | Mind mapping |
| **Habit Tracker** | Meridian Path | Daily journey |

**Rationale**:
- Meridian = line connecting points (navigation metaphor)
- Also references body meridians (Eastern medicine)
- Strong navigation/direction connotations
- Professional, mature tone

**Visual Identity**:
- Primary: Navy blue (#1E3A5F) — trust, navigation
- Accent: Bright cyan (#06B6D4) — clarity, direction
- Icon: Compass or meridian line motif
- Typography: IBM Plex Sans (headings), IBM Plex Mono (data)

---

#### Option E: **Aware** (Simple/Direct)

| Component | Name | Tagline |
|-----------|------|---------|
| **Suite** | Aware | "Self-awareness, simplified" |
| **Feelings App** | Aware Body | Feel more |
| **Second Brain** | Aware Mind | Think clearer |
| **Habit Tracker** | Aware Daily | Do consistently |

**Rationale**:
- Simple, direct, accessible
- Exactly describes the product purpose
- Easy to remember and spell
- May be too generic, trademark issues likely

**Visual Identity**:
- Primary: Sage green (#84CC16) — growth, awareness
- Accent: Soft blue (#3B82F6) — calm, trust
- Icon: Open eye or awareness symbol
- Typography: DM Sans throughout — clean, modern

---

### Naming Recommendation

**Primary Recommendation: Innerscape**

Reasons:
1. **Unique** — Not a common word, defensible trademark
2. **Evocative** — Suggests exploration, mapping, discovery
3. **Scalable** — Works for suite and individual apps
4. **Domain friendly** — innerscape.app likely available
5. **ADHD-friendly** — Visual, imaginative, not clinical

**Backup: Meridian** — More professional tone if Innerscape feels too abstract.

---

### Visual Identity Specification (for Innerscape)

#### Color Palette

```json
{
  "brand": {
    "primary": "#4F46E5",
    "primaryLight": "#818CF8",
    "primaryDark": "#3730A3",
    "secondary": "#F59E0B",
    "secondaryLight": "#FCD34D",
    "secondaryDark": "#D97706"
  },
  "semantic": {
    "success": "#22C55E",
    "warning": "#F59E0B",
    "error": "#EF4444",
    "info": "#3B82F6"
  },
  "feelings": {
    "pleasant": "#34D399",
    "unpleasant": "#F87171",
    "neutral": "#9CA3AF",
    "highEnergy": "#FBBF24",
    "lowEnergy": "#60A5FA"
  },
  "surface": {
    "light": {
      "background": "#FAFAFA",
      "card": "#FFFFFF",
      "elevated": "#FFFFFF"
    },
    "dark": {
      "background": "#0F172A",
      "card": "#1E293B",
      "elevated": "#334155"
    }
  }
}
```

#### Typography

| Use | Font | Weight | Size (base) |
|-----|------|--------|-------------|
| **Display** | Outfit | 700 | 32-48px |
| **Heading** | Outfit | 600 | 20-28px |
| **Body** | Inter | 400 | 16px |
| **Body Bold** | Inter | 600 | 16px |
| **Mono/Data** | JetBrains Mono | 400 | 14px |
| **Caption** | Inter | 400 | 12px |

#### App Icons

Each app icon should:
- Use the brand primary (#4F46E5) as base
- Have a unique inner symbol representing its function
- Work at small sizes (iOS/Android app icons)
- Be recognizable in monochrome

**Icon Concepts**:
- **Innerscape Soma**: Abstract body/torso silhouette with inner glow
- **Innerscape Mind**: Brain-like neural network pattern
- **Innerscape Flow**: Flowing water/wave pattern (rhythm)
- **Innerscape Suite**: Combined symbol or wordmark

#### Logo Variations

1. **Full lockup**: Icon + "Innerscape" wordmark
2. **App lockup**: Icon + "Innerscape [AppName]"
3. **Icon only**: For app icons, favicons
4. **Wordmark only**: For text-heavy contexts

---

### App Store Presence (2 Apps Only)

#### Innerscape Soma (Body Check-in App)

**App Store Name**: Innerscape Soma — Body Check-in
**Subtitle**: "Understand what your body is telling you"
**Keywords**: feelings, emotions, body scan, somatic, interoception, check-in, mood tracker, ADHD

**Description**:
> Innerscape Soma helps you understand your body's signals. Through guided check-ins, discover what sensations mean and how they connect to your emotions.
> 
> **Features**:
> - Interactive body scan with 8 regions
> - 3D feelings wheel for emotion exploration
> - Voice-guided check-in mode (eyes-closed)
> - AI-detected patterns in your emotional data
> - Syncs with Innerscape for cross-app insights
> 
> Your data stays encrypted on your device. Optional cloud sync available.

**Screenshots focus**: Body scan, feelings wheel, pattern insights

---

#### Innerscape (Main Life OS App)

**App Store Name**: Innerscape — Life OS
**Subtitle**: "Capture. Organize. Thrive."
**Keywords**: second brain, habits, journal, productivity, GTD, ADHD, voice notes, energy tracker, health

**Description**:
> Your complete personal operating system. Innerscape combines thought capture, habit tracking, voice journaling, and energy awareness in one seamless app.
>
> **Mind** — Capture ideas by voice or text. AI organizes them into projects, people, and ideas automatically.
>
> **Flow** — Build habits that stick with energy-aware suggestions. Know when you have energy for hard tasks vs. easy wins.
>
> **Pulse** — Track your energy with Apple Health integration. See sleep patterns, predict your energy curve, and schedule your day accordingly.
>
> **Hub** — See everything at a glance. Daily insights, activity timeline, and goal progress.
>
> Works beautifully with Innerscape Soma for complete self-awareness.
>
> Built for ADHD brains. Quick capture, smart organization, zero friction.

**Screenshots focus**: Tab overview, capture flow, habits with energy, energy dashboard

---

### Domain and Social Strategy

**Domains to Register**:
- innerscape.app (primary)
- innerscape.io (redirect)
- getinnerscape.com (marketing)

**Social Handles**:
- @innerscape (Twitter/X)
- @innerscape.app (Instagram)
- /innerscape (GitHub organization)

**Legal**:
- Trademark search before finalizing
- Register trademark in relevant classes (software, mobile apps)

---

### Brand Voice

**Tone**: Warm, supportive, non-clinical, neurodiversity-affirming

**Do**:
- Use "you" and "your" (personal)
- Acknowledge struggles without judgment
- Celebrate small wins
- Be direct (BLUF — Bottom Line Up Front)
- Use metaphors (landscape, navigation, flow)

**Don't**:
- Use clinical/medical language
- Be preachy or prescriptive
- Assume neurotypical patterns
- Use toxic positivity
- Overwhelm with features

**Example Copy**:
- Good: "Notice what's happening in your body right now."
- Bad: "Track your interoceptive signals for better outcomes."
- Good: "Your morning routine is 80% complete. Nice momentum!"
- Bad: "You must complete all habits to maintain optimal productivity."

---

### Implementation Priority

1. **Phase 0**: Finalize name choice (user decision)
2. **Phase 0**: Register domains
3. **Phase 1**: Create brand assets (logo, icons)
4. **Phase 2**: Update existing apps with new branding
5. **Phase 3**: Launch new apps with consistent brand

---

## Changelog

- **v2.1.0** (January 2026): Consolidated architecture (Option B)
  - **MAJOR**: Consolidated 4 React Native apps into 1 app with tabs
  - **MAJOR**: Journal merged into Mind as a "mode" (AI classifies entries)
  - **MAJOR**: Soma stays Flutter, Innerscape is single RN app
  - User now installs only 2 mobile apps (was planned for 5)
  - Emotional context: Soma is PRIMARY source, others READ
  - Updated folder structure for `innerscape-mobile/` single app
  - Updated App Store presence for 2 apps
  - Updated tab structure and navigation
  - Simplified branding (Soma + Innerscape + Hub web)
- **v2.0.0** (January 2026): Major expansion — Complete LifeOS Suite
  - Added 4 new apps: Journal (Voice), Pulse (Energy), Goals (North), Hub
  - Added iOS/Android widgets
  - Added health data integration (Apple Health, Google Fit)
  - Added AI pattern detection for Feelings APP
  - Added voice-guided check-ins
  - Added automation engine for cross-app triggers
  - Expanded database schema for all new features
  - Updated phases to 7 total (was 5)
  - Updated branding for 8 apps (was 4)
  - Added comprehensive data relationship diagram
- **v1.1.0** (January 2026): Added branding section
  - Proposed 5 naming directions
  - Recommended: Innerscape
  - Defined visual identity, typography, colors
  - Added App Store copy suggestions
- **v1.0.0** (January 2026): Initial plan
  - Decided: React Native for Second Brain mobile (not Flutter)
  - Decided: Turso + PowerSync for sync
  - Decided: Clerk for auth
  - Decided: Keep both existing apps, add shared layer
