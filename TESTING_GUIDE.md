# Innerscape Suite — Manual Testing Guide

This guide provides step-by-step instructions for testing the Innerscape Suite.

## 1. Environment Setup

### Prerequisites
- Node.js 20+
- Turso CLI (for DB access)
- Clerk account (for Auth)
- iOS Simulator or Android Emulator

### Initialization
1. Run `npm run install:all` from the root to install all dependencies.
2. Setup `.env` files in each directory based on the `.env.example` files provided.
3. Run `npm run build:ds` and `npm run build:shared`.

### Database Seeding
1. Set `TURSO_CONNECTION_URL` and `TURSO_AUTH_TOKEN` in your terminal.
2. Run `npm run seed` to populate the database with test data.

### 4. Known Issues & Troubleshooting
- **Next.js 16 Build**: If you see Turbopack errors, ensure you are using the `--webpack` flag (included in root scripts).
- **Module Federation**: Currently disabled by default in `next.config.ts` to support App Router stability. Enable via `ENABLE_FEDERATION=true` if needed for testing micro-frontends.
- **Expo Prebuild**: If native builds fail, run `npx expo prebuild --clean` in the respective mobile directory.
- **Clerk Keys**: Build will fail if `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is not a valid-looking key (e.g., `pk_test_...`).


---

## 2. Core Feature Verification

### A. Unified Onboarding (Mobile)
1. Start Soma: `npm run dev:soma`.
2. Verify the 7-step onboarding flow appears for new users.
3. Complete onboarding and verify you land on the Check-in screen.
4. Open Innerscape Mobile: `npm run dev:mobile`.
5. Verify onboarding is already marked as complete (shared via AsyncStorage/App Groups).

### B. App Shell & Deep Linking
1. In Soma, tap the `UniversalHeader` app switcher.
2. Select "Innerscape".
3. Verify it opens the Innerscape Mobile app via the `innerscape://hub` deep link.
4. In Innerscape Mobile, verify the `UniversalHeader` shows "Innerscape".
5. Tap switcher and select "Soma". Verify it navigates back.

### C. Emotional Context Sync (App Groups)
1. In Soma, complete a check-in.
2. Verify the `UniversalHeader` updates with the new energy/valence emoji.
3. Switch to Innerscape Mobile.
4. Verify the `EmotionalContextBanner` and `UniversalHeader` reflect the SAME state without a network request (synced via iOS App Groups).

### D. Web Shell (Micro-Frontend)
1. Start Backend: `npm run dev:backend`.
2. Start Web: `npm run dev:web`.
3. Verify `UniversalNav` shows all modules (Hub, Goals, Analytics, Brain).
4. Navigate between modules and verify the shell remains consistent.
5. Check the `EmotionalContextWidget` in the web header. Verify it matches the state from your mobile check-in.

---

## 3. Data Flow Verification

### PowerSync (Local-First)
1. In Innerscape Mobile, capture a thought in the Mind tab.
2. Verify it appears instantly in the inbox (local write).
3. Check the Turso database (via CLI or Studio). Verify the record appears there after sync.
4. Open the Web app Hub. Verify the new activity appears in the "Recent Activity" feed.

### AI Processing (Background)
1. Capture a complex thought (e.g., "I need to call John about the design system next Tuesday").
2. Wait a few seconds for the backend agent to process.
3. Verify the item is automatically classified as a "Task" and metadata (date, person) is extracted.

---

## 4. APEX Compliance Check
- [ ] Check console logs for `[APEX]` prefixes.
- [ ] Verify error states show descriptive messages, not raw stack traces.
- [ ] Ensure dark mode works on all Card and Button components.
