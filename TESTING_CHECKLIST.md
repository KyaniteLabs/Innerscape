# LifeOS Manual Testing Checklist

**Status:** ✅ READY FOR TESTING  
**Updated:** January 24, 2026

---

## Setup Complete

All local development configuration has been done:

| Component | Status | Notes |
|-----------|--------|-------|
| **Shared Package** | ✅ Built | `lifeos-shared/dist/` |
| **Backend** | ✅ Ready | Local SQLite + Node.js server |
| **Mobile** | ✅ Ready | Environment configured |
| **Database** | ✅ Seeded | Test data with `local-dev-user` |

---

## Quick Start (2 Terminals)

### Terminal 1: Start Backend

```bash
cd "/Volumes/External Drive/02_DEVELOPMENT/Active Projects/LifeOS/lifeos-backend"
npm run dev:local
```

**Expected Output:**
```
╔══════════════════════════════════════════════════════════════╗
║       LifeOS Backend - Local Development Server             ║
╚══════════════════════════════════════════════════════════════╝

[APEX] ✅ Server running at http://localhost:8787
```

### Terminal 2: Start Mobile App

```bash
cd "/Volumes/External Drive/02_DEVELOPMENT/Active Projects/LifeOS/innerscape-mobile"
npm start
```

Then press:
- `i` - Open iOS Simulator
- `a` - Open Android Emulator
- Or scan QR code with Expo Go app

---

## Verify Backend is Working

```bash
# Health check
curl http://localhost:8787/

# Get habits (should return seeded data)
curl http://localhost:8787/api/flow/habits

# Get analytics
curl http://localhost:8787/api/analytics/streaks
```

**Expected: JSON responses with `"success": true`**

---

## Test Scenarios

### 1. Analytics Screen (Hub Tab)

**Location:** Hub → Analytics

| Test | Expected Result |
|------|-----------------|
| View streak cards | Shows 0 current streak (new user) |
| View trend chart | Shows empty or minimal data |
| View correlations | Shows "Not enough data" message |
| Pull to refresh | Reloads data |

### 2. Habits (Flow Tab)

**Location:** Flow tab

| Test | Expected Result |
|------|-----------------|
| View habits list | Shows 2 seeded habits |
| Tap habit checkbox | Marks as complete, checkbox fills |
| Refresh page | Completion persists |
| Tap again | Marks as incomplete (undo) |

### 3. Somatic Check-In (Body Tab)

**Location:** Body → Start Check-in

| Test | Expected Result |
|------|-----------------|
| Select emotion | Wheel responds to tap |
| Select body regions | Regions highlight |
| Add reflection | Text input works |
| Complete check-in | Saves to backend |
| Check analytics | Streak may update |

### 4. Quick Capture

**Location:** FAB or capture button

| Test | Expected Result |
|------|-----------------|
| Enter text | Input accepts text |
| Tap capture | Shows loading, then closes |
| Check Mind tab | Capture appears in inbox |

### 5. Navigation

| Test | Expected Result |
|------|-----------------|
| Tap each tab | Navigates correctly |
| Pull to refresh | Works on all data screens |
| Back navigation | Works correctly |

---

## Test Data

The database has been seeded with:

```
User: local-dev-user

Habits:
  - Morning Somatic Check-in (streak: 5, energy: 80)
  - Evening Reflection (streak: 12, energy: 30)

Goals:
  - Launch Innerscape Suite (90% progress)

Captures:
  - Read "Atomic Habits" summary (task)
  - Project Idea: AI-driven habit coach (idea)
```

---

## Troubleshooting

### Backend won't start

```bash
# Check if port is in use
lsof -i :8787

# Kill existing process
kill $(lsof -t -i :8787)

# Restart
npm run dev:local
```

### Mobile can't connect to backend

1. Check backend is running (`curl http://localhost:8787/`)
2. Check `.env.local` has correct URL:
   ```
   EXPO_PUBLIC_API_URL=http://localhost:8787/api
   ```
3. For physical device, use your computer's IP:
   ```bash
   # Find your IP
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```
   Then update `.env.local`:
   ```
   EXPO_PUBLIC_API_URL=http://192.168.x.x:8787/api
   ```

### Database issues

```bash
cd lifeos-backend

# Reset database
rm local.db
npm run db:push
npm run db:seed
```

### TypeScript errors

```bash
# Check compilation
npm run typecheck

# Clear caches if needed
rm -rf node_modules/.cache
```

---

## File Locations

| File | Purpose |
|------|---------|
| `lifeos-backend/.dev.vars` | Backend secrets (local dev) |
| `innerscape-mobile/.env.local` | Mobile environment |
| `lifeos-backend/local.db` | Local SQLite database |
| `lifeos-backend/src/local-server.ts` | Node.js dev server |

---

## Success Criteria

Testing is successful if:

- [ ] Backend starts without errors
- [ ] Mobile app launches without crashes
- [ ] All 5 tabs are accessible
- [ ] Habits can be completed and uncompleted
- [ ] Check-in flow completes successfully
- [ ] Quick capture saves to Mind inbox
- [ ] Analytics screen loads (even if empty)
- [ ] Pull-to-refresh works on all screens

---

**Ready to test!** Start with Terminal 1 (backend), then Terminal 2 (mobile).
