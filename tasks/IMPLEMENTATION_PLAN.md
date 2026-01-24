# Innerscape Suite — Complete Implementation Plan

> **Version**: 1.0.0 | **Generated**: January 2026
> 
> This document provides **specific, non-ambiguous instructions** for completing the Innerscape Suite.
> Every task includes exact file paths, code requirements, and acceptance criteria.

---

## Current State Summary

### What EXISTS (Scaffolding Complete)

| Component | Status | Files |
|-----------|--------|-------|
| `lifeos-shared` | ✅ Types defined | 6 type files, package.json, tsconfig |
| `lifeos-design-system` | ✅ Tokens defined | colors, typography, spacing JSON |
| `lifeos-backend` | ⚠️ Skeleton only | 4 routes (feelings, brain, habits, insights), schema stub |
| `innerscape-mobile` | ⚠️ Scaffold only | 9 screens (mostly placeholder UI), 1 component |
| `Feelings APP (Soma)` | ⚠️ Service stubs | 3 empty service files |
| `Second Brain Project` | ⚠️ Pages added | hub, goals, analytics pages (no backend integration) |

### What's MISSING (Must Build)

1. **Backend**: Real database logic, Clerk auth, PowerSync, AI classification
2. **Mobile**: Functional screens, API integration, health data, voice
3. **Soma**: PowerSync integration, AI patterns, voice check-ins
4. **Web**: API integration, real data display
5. **Widgets**: Actual native widget implementations

---

## Phase 1: Backend Completion

### 1.1 Database Setup with Turso

**Goal**: Connect to Turso and run migrations.

**Files to modify**:
- `/lifeos-backend/wrangler.toml` — Add secrets
- `/lifeos-backend/drizzle.config.ts` — Create config
- `/lifeos-backend/src/db/index.ts` — Update connection

**Steps**:

```bash
# Step 1: Create Turso database
turso db create innerscape-prod

# Step 2: Get connection URL
turso db show innerscape-prod --url

# Step 3: Create auth token
turso db tokens create innerscape-prod

# Step 4: Add to wrangler.toml (DO NOT COMMIT)
# TURSO_CONNECTION_URL = "libsql://innerscape-prod-xxx.turso.io"
# TURSO_AUTH_TOKEN = "eyJ..."
```

**File**: `/lifeos-backend/drizzle.config.ts`
```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'turso',
  dbCredentials: {
    url: process.env.TURSO_CONNECTION_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
} satisfies Config;
```

**Acceptance Criteria**:
- [ ] `npx drizzle-kit push:sqlite` runs without error
- [ ] Tables visible in Turso dashboard

---

### 1.2 Clerk Authentication Middleware

**Goal**: Protect all API routes with Clerk JWT verification.

**File to create**: `/lifeos-backend/src/middleware/clerk-auth.ts`

```typescript
import { Context, Next } from 'hono';
import { verifyToken } from '@clerk/backend';

export const clerkAuth = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing token' } }, 401);
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const payload = await verifyToken(token, {
      secretKey: c.env.CLERK_SECRET_KEY,
    });
    c.set('userId', payload.sub);
    await next();
  } catch (err) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, 401);
  }
};
```

**File to modify**: `/lifeos-backend/src/index.ts`
- Replace the placeholder auth middleware with `clerkAuth`

**Acceptance Criteria**:
- [ ] Requests without `Authorization` header return 401
- [ ] Requests with valid Clerk JWT proceed to route handler
- [ ] `c.get('userId')` returns the Clerk user ID

---

### 1.3 Complete API Routes

**Goal**: Implement full CRUD for each domain.

#### 1.3.1 Feelings Route (Complete)

**File**: `/lifeos-backend/src/routes/feelings.ts`

**Endpoints to implement**:

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|--------------|----------|
| GET | `/feelings/recent` | Get latest emotional context | — | `{ data: EmotionalContext }` |
| GET | `/feelings/history?days=7` | Get history | — | `{ data: EmotionalContext[] }` |
| POST | `/feelings/check-in` | Create new check-in | `{ energy, valence, dominantFeeling, bodySensation }` | `{ data: EmotionalContext }` |

**Acceptance Criteria**:
- [ ] POST creates record in `emotional_context` table
- [ ] GET `/recent` returns most recent check-in for user
- [ ] GET `/history` returns array sorted by timestamp DESC

#### 1.3.2 Brain Route (Complete)

**File**: `/lifeos-backend/src/routes/brain.ts`

**Endpoints to implement**:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/brain/inbox` | Get all inbox items |
| GET | `/brain/projects` | Get all projects |
| GET | `/brain/people` | Get all people |
| GET | `/brain/ideas` | Get all ideas |
| POST | `/brain/capture` | Create new capture |
| PATCH | `/brain/captures/:id` | Update capture (move out of inbox) |
| DELETE | `/brain/captures/:id` | Delete capture |

**Acceptance Criteria**:
- [ ] POST `/capture` with `{ content, type }` creates record
- [ ] PATCH updates `status` field (e.g., `inbox` → `project`)
- [ ] All endpoints filter by `userId`

#### 1.3.3 Habits Route (Complete)

**File**: `/lifeos-backend/src/routes/habits.ts`

**Endpoints to implement**:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/flow/habits` | Get all habits for user |
| GET | `/flow/habits/today` | Get today's habits with completion status |
| POST | `/flow/habits` | Create new habit |
| POST | `/flow/habits/:id/complete` | Mark habit complete |
| DELETE | `/flow/habits/:id/complete` | Unmark completion |
| GET | `/flow/streaks` | Get streak data |

**Acceptance Criteria**:
- [ ] `/habits/today` returns `{ completedToday: boolean }` for each habit
- [ ] Completing a habit updates streak count
- [ ] Breaking a streak resets to 0

#### 1.3.4 Journal Route (NEW)

**File to create**: `/lifeos-backend/src/routes/journal.ts`

**Schema addition** (add to `/lifeos-backend/src/db/schema.ts`):
```typescript
export const journalEntries = sqliteTable('journal_entries', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  content: text('content').notNull(),
  transcriptionSource: text('transcription_source'), // 'whisper' | 'deepgram' | 'typed'
  mood: text('mood'), // Linked to emotional_context
  tags: text('tags'), // JSON array
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
```

**Endpoints**:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/journal/entries` | Get all journal entries |
| GET | `/journal/entries/:id` | Get single entry |
| POST | `/journal/entries` | Create entry |
| POST | `/journal/transcribe` | Transcribe audio via Deepgram |

**Acceptance Criteria**:
- [ ] POST `/entries` saves to `journal_entries` table
- [ ] POST `/transcribe` accepts audio blob, returns text

#### 1.3.5 Health Route (NEW)

**File to create**: `/lifeos-backend/src/routes/health.ts`

**Schema addition**:
```typescript
export const sleepRecords = sqliteTable('sleep_records', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  startTime: integer('start_time', { mode: 'timestamp' }).notNull(),
  endTime: integer('end_time', { mode: 'timestamp' }).notNull(),
  quality: integer('quality'), // 1-100
  source: text('source'), // 'apple_health' | 'google_fit' | 'manual'
});
```

**Endpoints**:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health/sleep?days=7` | Get sleep records |
| POST | `/health/sleep` | Sync sleep data from device |
| GET | `/health/metrics?type=hrv` | Get health metrics |
| POST | `/health/metrics` | Sync metrics from device |

#### 1.3.6 Goals Route (NEW)

**File to create**: `/lifeos-backend/src/routes/goals.ts`

**Schema addition**:
```typescript
export const goals = sqliteTable('goals', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  targetDate: integer('target_date', { mode: 'timestamp' }),
  progress: integer('progress').default(0), // 0-100
  status: text('status').default('active'), // 'active' | 'completed' | 'archived'
  category: text('category'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
```

**Endpoints**:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/goals` | Get all goals |
| POST | `/goals` | Create goal |
| PATCH | `/goals/:id` | Update goal progress/status |
| DELETE | `/goals/:id` | Archive goal |

---

### 1.4 AI Classification Service

**Goal**: Classify captures into types (task, idea, journal, person).

**File to create**: `/lifeos-backend/src/ai/classifier.ts`

```typescript
import { generateText } from 'ai'; // Vercel AI SDK or similar

const CLASSIFICATION_PROMPT = `
You are a capture classifier. Given user input, determine the type:
- "task": An actionable item (buy groceries, call mom, fix bug)
- "idea": A thought to explore later (what if we..., I wonder...)
- "journal": A reflection or feeling (today was hard, I feel grateful)
- "person": Information about a contact (met John, Sarah's birthday)

Respond with JSON: { "type": "task|idea|journal|person", "confidence": 0.0-1.0 }

User input: "{input}"
`;

export async function classifyCapture(input: string): Promise<{ type: string; confidence: number }> {
  const { text } = await generateText({
    model: 'glm-4', // or gpt-4o-mini
    prompt: CLASSIFICATION_PROMPT.replace('{input}', input),
  });
  
  return JSON.parse(text);
}
```

**Integration**: Call from POST `/brain/capture` to auto-set `type` field.

**Acceptance Criteria**:
- [ ] "Buy milk" → `{ type: "task", confidence: 0.9+ }`
- [ ] "Today was exhausting" → `{ type: "journal", confidence: 0.8+ }`
- [ ] Classification runs in <500ms

---

### 1.5 PowerSync Server Setup

**Goal**: Enable real-time sync between devices.

**File to create**: `/lifeos-backend/src/sync/powersync-config.ts`

```typescript
export const syncRules = {
  emotional_context: {
    // Sync all user's emotional context
    query: 'SELECT * FROM emotional_context WHERE user_id = ?',
    parameters: ['user_id'],
  },
  captures: {
    query: 'SELECT * FROM captures WHERE user_id = ?',
    parameters: ['user_id'],
  },
  habits: {
    query: 'SELECT * FROM habits WHERE user_id = ?',
    parameters: ['user_id'],
  },
  habit_completions: {
    query: `SELECT hc.* FROM habit_completions hc 
            JOIN habits h ON hc.habit_id = h.id 
            WHERE h.user_id = ?`,
    parameters: ['user_id'],
  },
};
```

**Steps**:
1. Sign up at https://powersync.com
2. Create a new instance
3. Configure sync rules in their dashboard
4. Get connection credentials
5. Add to client apps

**Acceptance Criteria**:
- [ ] Data created on mobile appears on web within 2 seconds
- [ ] Offline edits sync when connection restored

---

## Phase 2: Mobile App Completion

### 2.1 API Client Setup

**File to create**: `/innerscape-mobile/lib/api/client.ts`

```typescript
import { useAuth } from '@clerk/clerk-expo';

const API_BASE = 'https://api.innerscape.app'; // or localhost for dev

export const useApiClient = () => {
  const { getToken } = useAuth();

  const fetchWithAuth = async (path: string, options: RequestInit = {}) => {
    const token = await getToken();
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || 'API Error');
    }
    
    return res.json();
  };

  return {
    get: (path: string) => fetchWithAuth(path),
    post: (path: string, body: any) => fetchWithAuth(path, { method: 'POST', body: JSON.stringify(body) }),
    patch: (path: string, body: any) => fetchWithAuth(path, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (path: string) => fetchWithAuth(path, { method: 'DELETE' }),
  };
};
```

**Acceptance Criteria**:
- [ ] All API calls include Clerk JWT
- [ ] Errors are thrown with readable messages

---

### 2.2 Mind Tab — Full Implementation

**Files to create/modify**:

| File | Purpose |
|------|---------|
| `/app/(tabs)/mind/index.tsx` | Inbox view with capture input |
| `/app/(tabs)/mind/projects.tsx` | Projects list |
| `/app/(tabs)/mind/people.tsx` | People/contacts list |
| `/app/(tabs)/mind/ideas.tsx` | Ideas board |
| `/components/CaptureInput.tsx` | Text + voice input component |
| `/components/InboxItem.tsx` | Swipeable inbox card |

**`/app/(tabs)/mind/index.tsx` Requirements**:
1. Show `CaptureInput` at top (text field + mic button)
2. List all inbox items below
3. Swipe left to archive, swipe right to process
4. Tap item to edit
5. Pull-to-refresh

**`/components/CaptureInput.tsx` Requirements**:
1. Text input with placeholder "What's on your mind?"
2. Mic button that toggles recording
3. Send button (disabled when empty)
4. On submit: POST to `/brain/capture`, refresh list

**Acceptance Criteria**:
- [ ] Can type and capture a thought
- [ ] Can voice capture (recording indicator shows)
- [ ] Inbox items load from API
- [ ] Swipe gestures work

---

### 2.3 Flow Tab — Full Implementation

**Files to create/modify**:

| File | Purpose |
|------|---------|
| `/app/(tabs)/flow/index.tsx` | Today's habits with checkboxes |
| `/app/(tabs)/flow/routines.tsx` | Morning/evening routine views |
| `/app/(tabs)/flow/streaks.tsx` | Streak visualization |
| `/components/HabitCard.tsx` | Checkable habit with streak indicator |
| `/components/StreakCalendar.tsx` | GitHub-style contribution calendar |

**`/app/(tabs)/flow/index.tsx` Requirements**:
1. Header: "Today" with date
2. Section: "Morning Routine" (if has morning habits)
3. Section: "Anytime" (default habits)
4. Section: "Evening Routine" (if has evening habits)
5. Each habit: checkbox, name, current streak
6. Tapping checkbox: POST to `/flow/habits/:id/complete`
7. Show energy-aware suggestions based on emotional context

**`/components/HabitCard.tsx` Requirements**:
1. Checkbox (animated on complete)
2. Habit name
3. Streak count with fire emoji if >7 days
4. Subtle glow if energy level matches habit's `preferredEnergy`

**Acceptance Criteria**:
- [ ] Habits load from API grouped by category
- [ ] Checking habit updates backend and shows animation
- [ ] Streak count updates in real-time
- [ ] Energy suggestions show when emotional context available

---

### 2.4 Pulse Tab — Full Implementation

**Files to create/modify**:

| File | Purpose |
|------|---------|
| `/app/(tabs)/pulse/index.tsx` | Energy dashboard |
| `/app/(tabs)/pulse/sleep.tsx` | Sleep details |
| `/app/(tabs)/pulse/trends.tsx` | Weekly/monthly trends |
| `/components/EnergyChart.tsx` | Line chart of energy over time |
| `/components/SleepCard.tsx` | Last night's sleep summary |
| `/lib/health/apple-health.ts` | HealthKit integration |
| `/lib/health/google-fit.ts` | Health Connect integration |

**`/app/(tabs)/pulse/index.tsx` Requirements**:
1. "Today's Energy" card with current level
2. "Energy Prediction" curve (when will energy peak/dip)
3. "Last Night's Sleep" summary
4. "This Week" mini chart
5. Button: "Sync Health Data"

**`/lib/health/apple-health.ts` Requirements**:
```typescript
import AppleHealthKit from 'react-native-health';

export async function requestHealthPermissions() {
  const permissions = {
    permissions: {
      read: ['SleepAnalysis', 'HeartRateVariabilitySDNN', 'StepCount'],
    },
  };
  return new Promise((resolve, reject) => {
    AppleHealthKit.initHealthKit(permissions, (err) => {
      if (err) reject(err);
      else resolve(true);
    });
  });
}

export async function getSleepData(startDate: Date, endDate: Date) {
  // Implementation
}
```

**Acceptance Criteria**:
- [ ] Health permissions requested on first open
- [ ] Sleep data syncs from Apple Health / Google Fit
- [ ] Energy chart displays with real data
- [ ] Predictions based on historical patterns

---

### 2.5 Hub Tab — Full Implementation

**Files to create/modify**:

| File | Purpose |
|------|---------|
| `/app/(tabs)/hub/index.tsx` | Today at a glance |
| `/app/(tabs)/hub/insights.tsx` | AI-generated insights |
| `/components/TodaySummary.tsx` | Quick stats row |
| `/components/InsightCard.tsx` | Single insight display |
| `/components/ActivityTimeline.tsx` | Recent activity feed |

**`/app/(tabs)/hub/index.tsx` Requirements**:
1. Greeting: "Good morning, {name}" (time-aware)
2. `TodaySummary`: Energy, Habits done, Captures, Goals progress
3. `InsightCard`s: Top 3 insights from backend
4. `ActivityTimeline`: Last 10 activities across all apps
5. Quick actions: "Check in" (deep link to Soma), "Capture thought"

**Acceptance Criteria**:
- [ ] Summary stats load from API
- [ ] Insights refresh on pull-to-refresh
- [ ] Activity timeline shows cross-app data
- [ ] Deep link to Soma works (if installed)

---

### 2.6 Voice Recording & Transcription

**Files to create**:

| File | Purpose |
|------|---------|
| `/lib/voice/recorder.ts` | Audio recording logic |
| `/lib/voice/whisper.ts` | On-device transcription |
| `/lib/voice/deepgram.ts` | Cloud transcription fallback |
| `/components/VoiceRecorder.tsx` | Reusable recording UI |

**`/lib/voice/recorder.ts` Requirements**:
```typescript
import { Audio } from 'expo-av';

export class VoiceRecorder {
  private recording: Audio.Recording | null = null;

  async start(): Promise<void> {
    await Audio.requestPermissionsAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true });
    this.recording = new Audio.Recording();
    await this.recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await this.recording.startAsync();
  }

  async stop(): Promise<string> {
    if (!this.recording) throw new Error('No recording in progress');
    await this.recording.stopAndUnloadAsync();
    return this.recording.getURI()!;
  }
}
```

**`/lib/voice/whisper.ts` Requirements**:
- Use `whisper.rn` or similar on-device model
- Transcribe audio file to text
- Return `{ text: string, confidence: number }`

**Acceptance Criteria**:
- [ ] Recording starts/stops smoothly
- [ ] Transcription completes in <3 seconds for 10-second audio
- [ ] Falls back to Deepgram if on-device fails

---

## Phase 3: Soma (Flutter) Enhancement

### 3.1 PowerSync Integration

**Files to modify**:
- `/lib/domain/services/sync_service.dart`
- `/pubspec.yaml` (add `powersync: ^1.0.0`)

**Implementation**:
```dart
import 'package:powersync/powersync.dart';

class SyncService {
  late PowerSyncDatabase db;

  Future<void> initialize(String userId) async {
    db = PowerSyncDatabase(
      schema: Schema([
        Table('emotional_context', [
          Column.text('id'),
          Column.text('user_id'),
          Column.integer('energy'),
          Column.integer('valence'),
          Column.text('dominant_feeling'),
          Column.text('body_sensation'),
          Column.integer('timestamp'),
        ]),
      ]),
    );

    await db.initialize();
    
    // Connect to PowerSync service
    await db.connect(
      connector: PowerSyncConnector(
        endpoint: 'https://your-instance.powersync.com',
        userId: userId,
      ),
    );
  }

  Future<void> saveCheckIn(Map<String, dynamic> checkIn) async {
    await db.execute(
      'INSERT INTO emotional_context (id, user_id, energy, valence, dominant_feeling, body_sensation, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [checkIn['id'], checkIn['userId'], checkIn['energy'], checkIn['valence'], checkIn['dominantFeeling'], checkIn['bodySensation'], checkIn['timestamp']],
    );
  }
}
```

**Acceptance Criteria**:
- [ ] Check-ins sync to cloud within 2 seconds
- [ ] Works offline, syncs when online
- [ ] Data appears in React Native app

---

### 3.2 AI Pattern Detection

**File**: `/lib/domain/services/ai_pattern_service.dart`

**Implementation**:
```dart
import 'package:dio/dio.dart';

class AIPatternService {
  final Dio _dio = Dio();
  final String _baseUrl = 'https://api.innerscape.app';

  Future<List<Pattern>> detectPatterns(String userId, String token) async {
    final response = await _dio.get(
      '$_baseUrl/insights/patterns',
      options: Options(headers: {'Authorization': 'Bearer $token'}),
    );
    
    return (response.data['data'] as List)
        .map((p) => Pattern.fromJson(p))
        .toList();
  }
}

class Pattern {
  final String title;
  final String description;
  final double confidence;
  
  Pattern({required this.title, required this.description, required this.confidence});
  
  factory Pattern.fromJson(Map<String, dynamic> json) => Pattern(
    title: json['title'],
    description: json['description'],
    confidence: json['confidence'],
  );
}
```

**Acceptance Criteria**:
- [ ] Patterns fetch from backend
- [ ] Display in new "Insights" screen in Soma
- [ ] Updates after each check-in

---

### 3.3 Voice-Guided Check-In Mode

**File**: `/lib/domain/services/voice_checkin_service.dart`

**Implementation**:
```dart
import 'package:flutter_tts/flutter_tts.dart';
import 'package:speech_to_text/speech_to_text.dart';

class VoiceCheckInService {
  final FlutterTts _tts = FlutterTts();
  final SpeechToText _stt = SpeechToText();

  Future<void> startGuidedCheckIn() async {
    await _tts.speak("Let's do a body scan. Close your eyes and take a deep breath.");
    await Future.delayed(Duration(seconds: 5));
    
    await _tts.speak("Notice your head and face. Any tension or sensation?");
    await Future.delayed(Duration(seconds: 3));
    
    // Listen for response
    await _stt.listen(onResult: (result) {
      // Process spoken response
    });
    
    // Continue through body regions...
  }
}
```

**Acceptance Criteria**:
- [ ] TTS speaks prompts clearly
- [ ] STT captures user responses
- [ ] Full body scan takes ~3 minutes
- [ ] Results create a check-in record

---

## Phase 4: Web App Completion

### 4.1 API Integration

**Files to modify**:
- `/Second Brain Project/src/lib/api.ts` — Create API client
- `/Second Brain Project/src/app/hub/page.tsx` — Fetch real data
- `/Second Brain Project/src/app/goals/page.tsx` — Fetch real data
- `/Second Brain Project/src/app/analytics/page.tsx` — Fetch real data

**`/src/lib/api.ts`**:
```typescript
import { auth } from '@clerk/nextjs';

export const api = {
  async get(path: string) {
    const { getToken } = auth();
    const token = await getToken();
    
    const res = await fetch(`${process.env.API_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    return res.json();
  },
  // post, patch, delete...
};
```

**Acceptance Criteria**:
- [ ] Hub page shows real data from all sources
- [ ] Goals page shows/creates real goals
- [ ] Analytics page shows real charts

---

### 4.2 Real-Time Updates with PowerSync

**File to create**: `/Second Brain Project/src/lib/powersync.ts`

```typescript
import { PowerSyncDatabase } from '@powersync/web';

export const db = new PowerSyncDatabase({
  schema: { /* same as backend */ },
  database: { dbFilename: 'innerscape.db' },
});

export async function initSync(userId: string) {
  await db.init();
  await db.connect({ /* credentials */ });
}
```

**Acceptance Criteria**:
- [ ] Changes in mobile appear on web in <2 seconds
- [ ] Web changes appear on mobile in <2 seconds

---

## Phase 5: Native Widgets

### 5.1 iOS Widget (WidgetKit)

**File**: `/innerscape-mobile/widgets/ios/InnerscapeWidget.swift`

**Requirements**:
1. Small widget: Current mood emoji + energy level
2. Medium widget: Today's habits with checkboxes
3. Large widget: Hub summary

**Implementation approach**:
- Use App Groups to share data between main app and widget
- Update widget timeline on each app foreground
- Deep link taps to relevant app screens

### 5.2 Android Widget (Glance)

**File**: `/innerscape-mobile/widgets/android/InnerscapeWidget.kt`

**Requirements**:
- Same functionality as iOS
- Use Glance for Jetpack Compose widgets

---

## Phase 6: Testing & Polish

### 6.1 Test Coverage Requirements

| Package | Minimum Coverage | Focus Areas |
|---------|------------------|-------------|
| `lifeos-backend` | 80% | Route handlers, AI classification |
| `innerscape-mobile` | 60% | Core flows (capture, habits, sync) |
| `Feelings APP` | 70% | Check-in flow, sync |

### 6.2 E2E Test Scenarios

1. **Capture Flow**: Open app → Capture thought → Verify in inbox → Classify → Move to project
2. **Habit Flow**: View habits → Complete habit → Verify streak increment → Check widget updates
3. **Sync Flow**: Create on mobile → Verify on web → Edit on web → Verify on mobile
4. **Cross-App**: Soma check-in → Verify emotional context banner on mobile → Verify Hub summary

---

## Deployment Checklist

### Backend
- [ ] Turso database provisioned
- [ ] Clerk application created with all redirect URLs
- [ ] Wrangler secrets configured (not in repo)
- [ ] PowerSync instance configured
- [ ] `wrangler deploy` successful
- [ ] Custom domain configured (api.innerscape.app)

### Mobile
- [ ] Clerk Expo SDK configured
- [ ] App signing configured (iOS + Android)
- [ ] Expo EAS Build configured
- [ ] TestFlight / Play Console apps created
- [ ] Deep linking configured

### Web
- [ ] Vercel project created
- [ ] Environment variables set
- [ ] Custom domain configured (app.innerscape.app)

### Soma (Flutter)
- [ ] PowerSync SDK integrated
- [ ] Clerk Flutter SDK integrated
- [ ] App Store Connect / Play Console updated

---

## Appendix: File Checklist

### Must Create (Not Yet Exists)

**Backend**:
- [ ] `/lifeos-backend/drizzle.config.ts`
- [ ] `/lifeos-backend/src/middleware/clerk-auth.ts`
- [ ] `/lifeos-backend/src/routes/journal.ts`
- [ ] `/lifeos-backend/src/routes/health.ts`
- [ ] `/lifeos-backend/src/routes/goals.ts`
- [ ] `/lifeos-backend/src/ai/classifier.ts`
- [ ] `/lifeos-backend/src/sync/powersync-config.ts`

**Mobile**:
- [ ] `/innerscape-mobile/lib/api/client.ts`
- [ ] `/innerscape-mobile/lib/health/apple-health.ts`
- [ ] `/innerscape-mobile/lib/health/google-fit.ts`
- [ ] `/innerscape-mobile/lib/voice/recorder.ts`
- [ ] `/innerscape-mobile/lib/voice/whisper.ts`
- [ ] `/innerscape-mobile/lib/voice/deepgram.ts`
- [ ] `/innerscape-mobile/lib/sync/powersync.ts`
- [ ] `/innerscape-mobile/components/CaptureInput.tsx`
- [ ] `/innerscape-mobile/components/InboxItem.tsx`
- [ ] `/innerscape-mobile/components/HabitCard.tsx`
- [ ] `/innerscape-mobile/components/StreakCalendar.tsx`
- [ ] `/innerscape-mobile/components/EnergyChart.tsx`
- [ ] `/innerscape-mobile/components/SleepCard.tsx`
- [ ] `/innerscape-mobile/components/TodaySummary.tsx`
- [ ] `/innerscape-mobile/components/InsightCard.tsx`
- [ ] `/innerscape-mobile/components/ActivityTimeline.tsx`
- [ ] `/innerscape-mobile/components/VoiceRecorder.tsx`
- [ ] `/innerscape-mobile/app/(tabs)/mind/projects.tsx`
- [ ] `/innerscape-mobile/app/(tabs)/mind/people.tsx`
- [ ] `/innerscape-mobile/app/(tabs)/mind/ideas.tsx`
- [ ] `/innerscape-mobile/app/(tabs)/flow/routines.tsx`
- [ ] `/innerscape-mobile/app/(tabs)/flow/streaks.tsx`
- [ ] `/innerscape-mobile/app/(tabs)/pulse/sleep.tsx`
- [ ] `/innerscape-mobile/app/(tabs)/pulse/trends.tsx`
- [ ] `/innerscape-mobile/app/(tabs)/hub/insights.tsx`

**Web**:
- [ ] `/Second Brain Project/src/lib/api.ts`
- [ ] `/Second Brain Project/src/lib/powersync.ts`
- [ ] `/Second Brain Project/src/components/hub/InsightGrid.tsx`
- [ ] `/Second Brain Project/src/components/hub/RecentActivity.tsx`
- [ ] `/Second Brain Project/src/components/goals/GoalForm.tsx`
- [ ] `/Second Brain Project/src/components/analytics/AnalyticsChart.tsx`
- [ ] `/Second Brain Project/src/components/analytics/CorrelationTable.tsx`

---

*End of Implementation Plan*
