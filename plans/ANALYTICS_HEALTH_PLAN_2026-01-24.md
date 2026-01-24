# Analytics & Health Integration Plan

> **Status:** READY FOR IMPLEMENTATION | **Created:** January 24, 2026 | **APEX v4.3.0 Compliant**
>
> This plan addresses the remaining items from the consolidation audit:
> 1. Replace mock analytics data with real backend endpoints
> 2. Implement HRV and health data integration via HealthKit/Health Connect

---

## Executive Summary

| Item | Current State | Target State | Effort |
|------|---------------|--------------|--------|
| Analytics (Streaks) | Hardcoded mock data | Real API with computed streaks | 2-3 hrs |
| Analytics (Correlations) | Hardcoded mock data | AI-computed correlations | 4-6 hrs |
| Health (HRV) | Stubbed, returns empty | HealthKit/Health Connect integration | 6-8 hrs |
| Health (Sync) | Stubbed, no-op | Background sync to backend | 2-3 hrs |

**Total Estimated Effort:** 14-20 hours

---

## Phase 1: Backend Analytics Endpoints (4-6 hours)

### 1.1: Create Analytics Route

**File to Create:** `lifeos-backend/src/routes/analytics.ts`

```typescript
/**
 * APEX Contract: Analytics Endpoints
 * 
 * GET /analytics/streaks
 * - Inputs: None
 * - Outputs: { currentStreak, longestStreak, totalDays, history[] }
 * - Errors: DATABASE_ERROR
 * 
 * GET /analytics/correlations
 * - Inputs: None
 * - Outputs: { factor, impact, strength, description }[]
 * - Errors: DATABASE_ERROR, INSUFFICIENT_DATA
 * 
 * GET /analytics/trends
 * - Inputs: ?metric=mood|energy|habits&days=7|30
 * - Outputs: { date, value }[]
 * - Errors: VALIDATION_ERROR, DATABASE_ERROR
 */
```

### 1.2: Streak Calculation Logic

**Algorithm:**
```
1. Fetch all habit completions for user, ordered by date DESC
2. Group by date (YYYY-MM-DD)
3. Count consecutive days from today going back
4. Track longest streak seen
5. Return: currentStreak, longestStreak, totalDays, last 30 dates
```

**SQL Query Pattern:**
```sql
SELECT DATE(completed_at) as day, COUNT(*) as completions
FROM habit_completions hc
JOIN habits h ON h.id = hc.habit_id
WHERE h.user_id = ?
GROUP BY DATE(completed_at)
ORDER BY day DESC
LIMIT 365
```

### 1.3: Correlation Calculation Logic

**Approach:** Simple statistical correlation between:
- Sleep quality → Next day energy level
- Mood valence → Habit completion rate
- Check-in count → Weekly goal progress

**Minimum Data Requirement:** 14 days of data for meaningful correlations

**Output Format:**
```typescript
interface Correlation {
  factor: string;        // e.g., "Sleep vs Energy"
  impact: 'positive' | 'negative' | 'neutral';
  strength: number;      // Pearson correlation coefficient (0-1)
  description: string;   // AI-generated or template-based
}
```

### 1.4: Register Route

**File to Modify:** `lifeos-backend/src/index.ts`

```typescript
import analytics from './routes/analytics';
// ...
app.route('/analytics', analytics);
```

### 1.5: Acceptance Criteria

- [ ] `GET /analytics/streaks` returns computed streak data
- [ ] `GET /analytics/correlations` returns at least 2 correlations (or empty with message)
- [ ] `GET /analytics/trends?metric=mood&days=7` returns 7 data points
- [ ] All endpoints handle empty data gracefully
- [ ] TypeScript types exported for frontend consumption

---

## Phase 2: Mobile Analytics Integration (2-3 hours)

### 2.1: Update useAnalytics Hook

**File to Modify:** `innerscape-mobile/lib/hooks/useAnalytics.ts`

**Changes:**
1. Remove all hardcoded mock data
2. Call real API endpoints
3. Add error handling and retry logic
4. Add caching with stale-while-revalidate pattern

**Implementation:**
```typescript
const fetchAnalytics = useCallback(async () => {
  try {
    setLoading(true);
    setError(null);
    
    const [streaksRes, correlationsRes] = await Promise.all([
      api.get<StreakData>('/analytics/streaks'),
      api.get<CorrelationData[]>('/analytics/correlations'),
    ]);
    
    if (streaksRes.success) setStreaks(streaksRes.data);
    if (correlationsRes.success) setCorrelations(correlationsRes.data || []);
    
  } catch (err) {
    setError('Failed to load analytics');
    console.error('[APEX] Analytics fetch error:', err);
  } finally {
    setLoading(false);
  }
}, [api]);
```

### 2.2: Add Trend Data Support

**New Export:**
```typescript
export interface TrendPoint {
  date: string;
  value: number;
}

const fetchTrends = async (metric: 'mood' | 'energy' | 'habits', days: number = 7) => {
  const res = await api.get<TrendPoint[]>(`/analytics/trends?metric=${metric}&days=${days}`);
  return res.success ? res.data : [];
};
```

### 2.3: Update Analytics Screen

**File to Modify:** `innerscape-mobile/app/(tabs)/hub/analytics.tsx`

- Replace `mockMoodData` with real trend data
- Show loading skeleton during fetch
- Show empty state with helpful message if no data

### 2.4: Acceptance Criteria

- [ ] Analytics screen loads real data from API
- [ ] Shows helpful empty state for new users
- [ ] Chart updates with real trend data
- [ ] Pull-to-refresh works correctly

---

## Phase 3: Health Service Implementation (6-8 hours)

### 3.1: Install Dependencies

**Commands:**
```bash
cd innerscape-mobile
npx expo install expo-health-connect  # Android
npx expo install expo-apple-healthkit # iOS (if available) or use react-native-health
```

**Note:** Health APIs require a development build (not Expo Go).

### 3.2: Create Platform-Specific Implementations

**File Structure:**
```
innerscape-mobile/lib/health/
├── healthService.ts       # Unified interface (existing)
├── healthService.ios.ts   # iOS HealthKit implementation
├── healthService.android.ts # Android Health Connect implementation
└── types.ts               # Shared types
```

### 3.3: iOS HealthKit Implementation

**File to Create:** `innerscape-mobile/lib/health/healthService.ios.ts`

**Permissions Required:**
- Sleep Analysis (read)
- Heart Rate Variability (read)
- Steps (read)
- Heart Rate (read)

**Key Methods:**
```typescript
async requestPermissions(): Promise<boolean> {
  const permissions = {
    read: [
      HKQuantityTypeIdentifier.heartRateVariabilitySDNN,
      HKQuantityTypeIdentifier.stepCount,
      HKCategoryTypeIdentifier.sleepAnalysis,
    ],
  };
  return await AppleHealthKit.requestAuthorization(permissions);
}

async getHRV(days: number = 7): Promise<HealthMetric[]> {
  const options = {
    startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString(),
  };
  const results = await AppleHealthKit.getHeartRateVariabilitySamples(options);
  return results.map(r => ({
    type: 'hrv',
    value: r.value,
    timestamp: new Date(r.startDate),
  }));
}
```

### 3.4: Android Health Connect Implementation

**File to Create:** `innerscape-mobile/lib/health/healthService.android.ts`

**Permissions Required:**
- Sleep Session (read)
- Heart Rate Variability (read)
- Steps (read)

**Key Methods:**
```typescript
async requestPermissions(): Promise<boolean> {
  const granted = await HealthConnect.requestPermission([
    { accessType: 'read', recordType: 'SleepSession' },
    { accessType: 'read', recordType: 'HeartRateVariabilityRmssd' },
    { accessType: 'read', recordType: 'Steps' },
  ]);
  return granted.length > 0;
}

async getHRV(days: number = 7): Promise<HealthMetric[]> {
  const startTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const records = await HealthConnect.readRecords('HeartRateVariabilityRmssd', {
    timeRangeFilter: { startTime, endTime: new Date() },
  });
  return records.map(r => ({
    type: 'hrv',
    value: r.heartRateVariabilityMillis,
    timestamp: new Date(r.time),
  }));
}
```

### 3.5: Unified Interface Update

**File to Modify:** `innerscape-mobile/lib/health/healthService.ts`

```typescript
import { Platform } from 'react-native';

// Platform-specific imports
const platformService = Platform.select({
  ios: () => require('./healthService.ios').default,
  android: () => require('./healthService.android').default,
  default: () => require('./healthService.stub').default,
})();

export const healthService = {
  ...platformService,
  
  // Common sync logic
  async syncToBackend(apiClient: ApiClient): Promise<SyncResult> {
    const [sleep, hrv, steps] = await Promise.all([
      this.getSleepData(7),
      this.getHRV(7),
      this.getSteps(7),
    ]);
    
    // Batch upload to backend
    const result = await apiClient.post('/health/sync', {
      sleep,
      metrics: [...hrv, ...steps],
    });
    
    return result;
  },
};
```

### 3.6: Backend Batch Sync Endpoint

**File to Modify:** `lifeos-backend/src/routes/health.ts`

**New Endpoint:**
```typescript
/**
 * APEX Contract: Batch Health Sync
 * Inputs: { sleep: SleepRecord[], metrics: HealthMetric[] }
 * Outputs: { synced: number, errors: string[] }
 */
health.post('/sync', async (c) => {
  const userId = c.get('userId');
  const db = c.get('db');
  const { sleep, metrics } = await c.req.json();
  
  let synced = 0;
  const errors: string[] = [];
  
  // Upsert sleep records (avoid duplicates)
  for (const record of sleep) {
    try {
      await db.insert(sleepRecords)
        .values({ id: crypto.randomUUID(), userId, ...record })
        .onConflictDoNothing();
      synced++;
    } catch (e) {
      errors.push(`Sleep: ${e.message}`);
    }
  }
  
  // Upsert metrics
  for (const metric of metrics) {
    try {
      await db.insert(healthMetrics)
        .values({ id: crypto.randomUUID(), userId, ...metric })
        .onConflictDoNothing();
      synced++;
    } catch (e) {
      errors.push(`Metric: ${e.message}`);
    }
  }
  
  return c.json({ success: true, data: { synced, errors } });
});
```

### 3.7: Update Body Tab to Show Real HRV

**File to Modify:** `innerscape-mobile/app/(tabs)/body/index.tsx`

```typescript
// Replace hrv: null with real data fetch
const [healthData, setHealthData] = useState<{
  hrv: number | null;
  steps: number | null;
}>({ hrv: null, steps: null });

useEffect(() => {
  const loadHealthData = async () => {
    const hrvData = await healthService.getHRV(1);
    const stepsData = await healthService.getSteps(1);
    
    setHealthData({
      hrv: hrvData.length > 0 ? hrvData[0].value : null,
      steps: stepsData.reduce((sum, s) => sum + s.value, 0) || null,
    });
  };
  
  loadHealthData();
}, []);
```

### 3.8: Acceptance Criteria

- [ ] iOS: HealthKit permissions request works
- [ ] iOS: HRV, Sleep, Steps data retrieved correctly
- [ ] Android: Health Connect permissions request works
- [ ] Android: HRV, Sleep, Steps data retrieved correctly
- [ ] Sync to backend works without duplicates
- [ ] Body tab displays real HRV value

---

## Phase 4: Background Sync (2-3 hours)

### 4.1: Configure Background Fetch

**File to Modify:** `innerscape-mobile/app.json`

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": ["fetch", "processing"]
      }
    },
    "android": {
      "permissions": ["FOREGROUND_SERVICE"]
    }
  }
}
```

### 4.2: Create Background Task

**File to Create:** `innerscape-mobile/lib/health/backgroundSync.ts`

```typescript
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { healthService } from './healthService';
import { useApiClient } from '../api/client';

const HEALTH_SYNC_TASK = 'HEALTH_SYNC_TASK';

TaskManager.defineTask(HEALTH_SYNC_TASK, async () => {
  try {
    const api = useApiClient();
    await healthService.syncToBackend(api);
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('[APEX] Background sync failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundSync() {
  const status = await BackgroundFetch.getStatusAsync();
  
  if (status === BackgroundFetch.BackgroundFetchStatus.Available) {
    await BackgroundFetch.registerTaskAsync(HEALTH_SYNC_TASK, {
      minimumInterval: 60 * 60, // 1 hour
      stopOnTerminate: false,
      startOnBoot: true,
    });
  }
}
```

### 4.3: Initialize on App Start

**File to Modify:** `innerscape-mobile/app/_layout.tsx`

```typescript
import { registerBackgroundSync } from '../lib/health/backgroundSync';

useEffect(() => {
  registerBackgroundSync().catch(console.error);
}, []);
```

### 4.4: Acceptance Criteria

- [ ] Background task registered on app launch
- [ ] Health data syncs every hour in background
- [ ] Sync works after device restart
- [ ] No duplicate records created

---

## Quality Gates

### After Each Phase

```bash
# Backend
cd lifeos-backend
npm run typecheck
npm test

# Mobile
cd innerscape-mobile
npm run typecheck
npm run lint
npx expo start  # Verify app launches
```

### Integration Testing Checklist

- [ ] Fresh install: App handles no health permissions gracefully
- [ ] Permission denied: Shows helpful message, doesn't crash
- [ ] No historical data: Shows empty state with call-to-action
- [ ] Network offline: Cached data still displays
- [ ] Background sync: Data appears after app reopen

---

## Rollback Protocol

If any quality gate fails after 3 fix attempts:

```bash
git stash pop       # Restore checkpoint
git checkout -- .   # Discard changes
```

Report blocker and move to next phase if non-critical.

---

## Dependencies & Blockers

| Dependency | Status | Notes |
|------------|--------|-------|
| Expo SDK 54 | ✅ Complete | Already upgraded |
| expo-health-connect | 🔲 Not Installed | Android Health Connect |
| react-native-health | 🔲 Not Installed | iOS HealthKit |
| Dev Client Build | 🔲 Required | Health APIs don't work in Expo Go |

### Creating Development Build

```bash
cd innerscape-mobile
npx expo prebuild
npx expo run:ios    # or run:android
```

---

## Summary

| Phase | Tasks | Estimate |
|-------|-------|----------|
| 1. Backend Analytics | Create endpoints for streaks, correlations, trends | 4-6 hrs |
| 2. Mobile Analytics | Connect hooks to real API | 2-3 hrs |
| 3. Health Service | Platform-specific HealthKit/Health Connect | 6-8 hrs |
| 4. Background Sync | Automatic health data sync | 2-3 hrs |

**Total:** 14-20 hours

---

*This plan complements the main CONSOLIDATION_PLAN_2026-01-24.md*
