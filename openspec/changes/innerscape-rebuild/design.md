# Technical Design: Innerscape Rebuild

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Presentation Layer                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │   Mind   │  │   Flow   │  │   Body   │  │       Hub        │ │
│  │  Module  │  │  Module  │  │  Module  │  │     Module       │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │
│                     ↑                                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           Emotional Context Layer (State Adapter)         │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↑
┌─────────────────────────────────────────────────────────────────┐
│                      AI Infrastructure Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Classifier  │  │    Insight   │  │     Automation       │  │
│  │   Engine     │  │    Engine    │  │      Engine          │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↑
┌─────────────────────────────────────────────────────────────────┐
│                       Data Layer                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │   Local Store    │  │   Sync Engine    │  │  Cloud Store │  │
│  │   (SQLite/Realm) │  │   (Offline-First)│  │  (Optional)  │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Stack Decisions

### Mobile Application
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | **React Native** (TypeScript) | Cross-platform, leverages existing team knowledge, strong ecosystem for offline-first apps |
| State Management | **Zustand** + **TanStack Query** | Lightweight, works well with offline sync, minimal boilerplate |
| Local Database | **WatermelonDB** | Built for React Native, offline-first by design, reactive queries, handles sync conflicts |
| Navigation | **Expo Router** | File-based routing, deep linking support, native stack navigation |
| UI Components | **NativeWind** (Tailwind for RN) | Rapid styling, consistency across platforms, design system integration |
| Animations | **React Native Reanimated 3** | 60fps animations for celebrations and transitions, runs on UI thread |

### Backend Services
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Runtime | **Node.js 20 LTS** with **TypeScript** | Shared types with frontend, large ecosystem |
| Framework | **Fastify** | High performance, low overhead, schema validation built-in |
| API Style | **REST** + **GraphQL** (for complex queries) | REST for CRUD, GraphQL for analytics dashboard queries |
| Database | **PostgreSQL** | Relational data integrity, JSONB for flexible schemas |
| ORM | **Prisma** | Type-safe queries, migrations, excellent DX |
| Queue | **BullMQ** (Redis) | Job processing for AI pipelines, scheduled tasks |
| Cache | **Redis** | Session management, rate limiting, hot data caching |

### AI Infrastructure
| Component | Approach | Rationale |
|-----------|----------|-----------|
| Classifier | **Fine-tuned small model** (e.g., DistilBERT) | Fast inference, can run on-device for privacy, adequate for classification |
| Insight Engine | **Rule-based + statistical analysis** | Transparent, auditable, no hallucination risk |
| Automation Engine | **Deterministic rules engine** | Predictable behavior, user trust |
| Chat Assistant | **Cloud LLM API** (with RAG over user data) | Complex reasoning requires larger models; data never leaves encrypted channel |
| On-device vs Cloud | **Hybrid**: Classification on-device, insights cloud-assisted | Balances privacy with capability |

### Infrastructure
| Service | Provider | Notes |
|---------|----------|-------|
| Hosting | **Fly.io** or **Railway** | Low latency, easy scaling, PostgreSQL included |
| Object Storage | **Cloudflare R2** | S3-compatible, no egress fees |
| CDN | **Cloudflare** | Global edge caching |
| Push Notifications | **OneSignal** | Cross-platform, reliable delivery |
| Analytics (self) | **PostHog** (self-hosted) | Privacy-focused, product analytics |
| Error Tracking | **Sentry** | Real-time error monitoring |

---

## Data Model (Core Entities)

### User & Authentication
```typescript
interface User {
  id: string; // UUID
  email: string;
  createdAt: Date;
  updatedAt: Date;
  preferences: UserPreferences;
  onboardingCompleted: boolean;
}

interface UserPreferences {
  timezone: string;
  shutdownRitualTime: string; // HH:mm
  weeklyReviewDay: number; // 0-6 (Sun-Sat)
  accessibilitySettings: AccessibilitySettings;
  notificationSettings: NotificationSettings;
}
```

### Emotional Context
```typescript
interface EmotionalCheckIn {
  id: string;
  userId: string;
  timestamp: Date;
  energyLevel: number; // 0-100
  valence: 'pleasant' | 'unpleasant' | 'neutral';
  feelingLabel?: string; // e.g., "anxious", "calm"
  bodySensationNote?: string;
  source: 'manual' | 'inferred';
}

interface CurrentEmotionalContext {
  userId: string;
  checkIn: EmotionalCheckIn;
  inferredFactors: {
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    sleepQuality?: number; // 0-100
    consecutiveLowEnergyDays: number;
  };
  computedState: EmotionalState; // derived from checkIn + factors
}

type EmotionalState = 
  | 'high_energy_pleasant'
  | 'high_energy_unpleasant'
  | 'low_energy_pleasant'
  | 'low_energy_unpleasant';
```

### Mind Module
```typescript
interface JournalEntry {
  id: string;
  userId: string;
  content: string;
  createdAt: Date;
  tags: string[]; // auto-generated by classifier
  linkedCheckIns: string[]; // emotional check-in IDs
  aiPromptUsed?: string;
}

interface Insight {
  id: string;
  userId: string;
  type: 'pattern' | 'correlation' | 'trend' | 'warning';
  title: string;
  description: string;
  confidence: number; // 0-1
  dataPoints: string[]; // references to source data
  dismissedAt?: Date;
  actedUponAt?: Date;
  createdAt: Date;
}
```

### Flow Module
```typescript
interface Habit {
  id: string;
  userId: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'custom';
  streak: number;
  longestStreak: number;
  lastCompletedAt?: Date;
  createdAt: Date;
}

interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  deadline?: Date;
  status: 'active' | 'completed' | 'archived';
  parentGoalId?: string; // hierarchy
}

interface Task {
  id: string;
  goalId?: string;
  userId: string;
  title: string;
  estimatedDuration: number; // minutes
  completed: boolean;
  completedAt?: Date;
  dueDate?: Date;
  contextRequirements?: EmotionalState[]; // when this task is best done
}

interface DopamineMenuItem {
  id: string;
  userId: string;
  category: 'warm_up' | 'deep_work' | 'support' | 'rest';
  name: string;
  instructions: string[]; // step-by-step
  estimatedDuration: number;
  effectivenessScore?: number; // learned from user feedback
  lastUsedAt?: Date;
}
```

### Body Module
```typescript
interface BodyCheckIn {
  id: string;
  userId: string;
  timestamp: Date;
  bodyScan: BodyRegionSensation[]; // 8 regions
  emotionWheelSelection: {
    feeling: string;
    valence: 'pleasant' | 'unpleasant' | 'neutral';
  };
  aiHypothesis?: string;
  reflectionRating?: number; // 1-5, did the suggested action help?
}

interface BodyRegionSensation {
  region: 'head_face' | 'neck_throat' | 'shoulders_arms' | 
          'chest_heart' | 'belly_gut' | 'back' | 
          'hips_groin' | 'legs_feet';
  sensationType?: 'tension' | 'warmth' | 'numbness' | 
                  'tingling' | 'pain' | 'neutral';
  intensity: number; // 1-5
}

interface SomaticMapping {
  id: string;
  userId: string;
  sensationPattern: BodyRegionSensation[];
  predictedEmotion: string;
  confidence: number; // 0-1
  occurrences: number;
  lastValidatedAt?: Date;
}

interface SleepLog {
  id: string;
  userId: string;
  date: Date; // the night's date
  durationHours: number;
  qualityScore: number; // 0-100
  source: 'manual' | 'apple_health' | 'google_fit';
}
```

### Hub Module
```typescript
interface CaptureItem {
  id: string;
  userId: string;
  content: string;
  contentType: 'text' | 'voice' | 'link' | 'image' | 'email';
  capturedAt: Date;
  source: 'app' | 'email' | 'shortcut' | 'bookmarklet' | 'sms' | 'ifttt';
  classificationStatus: 'pending' | 'classified' | 'needs_review';
  classifiedAs?: {
    module: 'mind' | 'flow' | 'body' | 'hub';
    type: string; // e.g., 'task', 'idea', 'journal'
    confidence: number;
  };
  tags: string[];
}

interface Project {
  id: string;
  userId: string;
  name: string;
  area?: string; // PARA area
  deadline: Date; // required - areas convert to projects
  status: 'active' | 'completed' | 'archived';
  tasks: string[]; // task IDs
}

interface KnowledgeItem {
  id: string;
  userId: string;
  title: string;
  content: string;
  paraCategory: 'projects' | 'areas' | 'resources' | 'archives';
  tags: string[];
  lastAccessedAt: Date;
  relatedProjectIds?: string[];
}
```

---

## Data Flow

### 1. Capture Flow (Sub-2-second requirement)
```
User Input → Global Capture Button → Local Queue → 
Classifier (on-device) → Route to Module → 
Show Confirmation → Async Sync to Cloud
```

**Key optimization:** Classification happens locally first; cloud sync is background. User sees immediate confirmation.

### 2. Emotional Context Propagation
```
Check-In Created → Update CurrentContext Store → 
Publish Event → All Modules Subscribe → 
UI Re-renders with Adapted Content
```

**Implementation:** Zustand store with computed selectors. Every component reads from `useEmotionalContext()` hook.

### 3. AI Pipeline (Async)
```
New Data → Event Bus → Classification Queue → 
If confidence < 0.6 → Needs Review Queue → 
Else → Auto-file → Insight Engine (batch every 15min) → 
Update Insights Store → Notify if high-priority
```

### 4. Offline-First Sync
```
Local Write → WatermelonDB → Mark as changed → 
Sync Worker (when online) → Conflict Resolution → 
Cloud DB → Broadcast to other devices
```

**Conflict strategy:** Last-write-wins for simple fields; merge for arrays (tags, check-ins); user prompt for complex conflicts.

---

## API Design

### REST Endpoints (Core CRUD)
```
POST   /api/v1/auth/login
POST   /api/v1/auth/register
GET    /api/v1/user/me
PUT    /api/v1/user/preferences

POST   /api/v1/checkins              # Emotional check-in
GET    /api/v1/checkins              # History
GET    /api/v1/context/current       # Current emotional context

POST   /api/v1/journal/entries
GET    /api/v1/journal/entries
POST   /api/v1/capture               # Universal capture

GET    /api/v1/habits
POST   /api/v1/habits/:id/complete

GET    /api/v1/goals
POST   /api/v1/tasks/:id/complete

GET    /api/v1/insights              # AI-generated insights
POST   /api/v1/insights/:id/dismiss
POST   /api/v1/insights/:id/act

GET    /api/v1/analytics/dashboard   # Unified dashboard data
GET    /api/v1/analytics/weekly      # Weekly review data
```

### GraphQL (Analytics Queries)
```graphql
query DashboardData {
  currentUser {
    emotionalTrend(days: 7) {
      date
      averageEnergy
      dominantValence
    }
    habitCompletionRate(weeks: 4)
    activeProjects {
      name
      progress
      nextTask
    }
    recentInsights(limit: 5) {
      title
      type
    }
  }
}
```

---

## Security & Privacy

### Encryption
- **At rest:** SQLite database encrypted with SQLCipher (mobile), PostgreSQL TDE (backend)
- **In transit:** TLS 1.3 everywhere
- **End-to-end (optional):** User's encryption key derived from password; cloud stores only ciphertext

### Authentication
- **Mobile:** Biometric (FaceID/TouchID) + PIN fallback
- **Web:** JWT with refresh tokens, httpOnly cookies
- **Session management:** Device-bound tokens, revocation supported

### Data Minimization
- AI processes only what's needed for each function
- Health data never leaves device unless user enables cloud sync
- Analytics are aggregated and anonymized before leaving device

---

## Testing Strategy

| Layer | Tool | Coverage Target |
|-------|------|-----------------|
| Unit | Jest + Vitest | 80%+ business logic |
| Component | React Native Testing Library | Critical paths only |
| E2E | Detox (mobile), Playwright (web) | All user flows |
| Performance | Flipper + custom metrics | Capture <2s, render <100ms |
| Accessibility | axe-core, manual testing | WCAG AA compliance |

---

## Deployment Strategy

### Phase 1: Internal Testing
- TestFlight (iOS) + Internal Track (Android)
- Staging backend on Fly.io
- Feature flags via ConfigCat

### Phase 2: Beta Launch
- Limited public beta (500 users)
- PostHog analytics enabled
- Sentry error tracking live

### Phase 3: General Availability
- App Store + Google Play launch
- Marketing site live
- Support infrastructure ready

---

## Open Technical Questions

1. **AI Model Hosting:** Should we self-host the classifier model or use a managed service (Hugging Face Inference API)?
2. **Real-time Sync:** Is WatermelonDB's sync protocol sufficient, or do we need CRDTs for complex conflict scenarios?
3. **Push Notification Strategy:** Should shutdown ritual reminders be time-based or context-aware (e.g., only if user hasn't checked in)?
4. **Health Integration:** Start with manual entry only, or invest in Apple Health/Google Fit integration for MVP?
