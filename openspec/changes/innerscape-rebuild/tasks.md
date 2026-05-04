# Implementation Tasks: Innerscape Rebuild

## Phase Overview

Tasks are organized by dependency order. Each phase must be substantially complete before the next begins. Parallel work within phases is encouraged where dependencies allow.

---

## Phase 0: Foundation & Infrastructure

**Goal:** Establish development environment, CI/CD, and core project structure.

### 0.1 Repository Setup
- [ ] Create new monorepo structure (or separate repos for mobile/backend)
- [ ] Configure TypeScript with strict mode across all packages
- [ ] Set up ESLint + Prettier with shared configs
- [ ] Configure Husky pre-commit hooks (lint, type-check)
- [ ] Create README with setup instructions

### 0.2 CI/CD Pipeline
- [ ] GitHub Actions workflow for mobile (lint, test, build)
- [ ] GitHub Actions workflow for backend (lint, test, deploy to staging)
- [ ] Automated changelog generation from PRs
- [ ] Branch protection rules (require passing CI, 1 review)

### 0.3 Development Environment
- [ ] Docker Compose for local backend (PostgreSQL, Redis)
- [ ] .env.example files with documentation
- [ ] Seed scripts for development data
- [ ] Storybook for UI component development

### 0.4 Project Scaffolding
- [ ] Initialize React Native app with Expo
- [ ] Initialize Fastify backend with Prisma
- [ ] Set up shared types package (TypeScript)
- [ ] Configure path aliases and module resolution

**Exit Criteria:** Developer can clone repo, run `docker-compose up`, and have a working local environment with hot reload.

---

## Phase 1: Core Data Layer & Authentication

**Goal:** User accounts, local database, and offline-first sync foundation.

### 1.1 Database Schema
- [ ] Design and implement Prisma schema (all entities from design.md)
- [ ] Create migration system
- [ ] Set up database seeding for testing
- [ ] Document schema relationships

### 1.2 Local Database (Mobile)
- [ ] Integrate WatermelonDB with React Native
- [ ] Create database schema mirroring backend
- [ ] Implement reactive queries hook (`useQuery`)
- [ ] Set up database encryption (SQLCipher)

### 1.3 Authentication System
- [ ] Backend: JWT auth with refresh tokens
- [ ] Backend: Password hashing (argon2)
- [ ] Backend: Rate limiting on auth endpoints
- [ ] Mobile: Login/signup screens
- [ ] Mobile: Biometric auth integration (FaceID/TouchID)
- [ ] Mobile: Secure token storage (Keychain/Keystore)
- [ ] Shared: Type-safe auth context/hook

### 1.4 Sync Engine Foundation
- [ ] WatermelonDB sync adapter implementation
- [ ] Backend sync endpoint (`POST /api/v1/sync`)
- [ ] Conflict detection (timestamp-based)
- [ ] Basic conflict resolution (last-write-wins)
- [ ] Sync status indicator in UI

### 1.5 User Preferences
- [ ] Backend: User preferences CRUD
- [ ] Mobile: Preferences screen (timezone, notification settings)
- [ ] Mobile: Accessibility settings (font size, contrast)
- [ ] Persist preferences locally and sync to cloud

**Exit Criteria:** User can create account, log in with biometrics, data persists locally and syncs to cloud, works offline.

---

## Phase 2: Emotional Context System

**Goal:** The core differentiator — real-time emotional state tracking and propagation.

### 2.1 Emotional Check-In Component
- [ ] Sub-2-second check-in UI (energy slider, valence picker, feeling label)
- [ ] Haptic feedback on completion
- [ ] Animation for confirmation (<300ms)
- [ ] Store check-in locally immediately
- [ ] Async sync to backend

### 2.2 Context Store & Propagation
- [ ] Zustand store for current emotional context
- [ ] Computed selectors for derived state
- [ ] `useEmotionalContext()` hook for all components
- [ ] Context change event system
- [ ] Persistence across app sessions

### 2.3 Inferred Context Logic
- [ ] Time-of-day inference (morning/afternoon/evening/night)
- [ ] Sleep quality integration (placeholder until Body module)
- [ ] Consecutive low-energy day counter
- [ ] Fallback context when no check-in exists

### 2.4 State-Adaptive UI Components
- [ ] Context-aware greeting component
- [ ] Dynamic task suggestion filter (by emotional state)
- [ ] Emergency mode UI (low energy + unpleasant)
- [ ] Celebration intensity scaler (based on state)

### 2.5 Emotional Timeline Visualization
- [ ] Backend: Aggregation query for emotional trends
- [ ] Mobile: Chart component (energy over time)
- [ ] Mobile: Valence distribution visualization
- [ ] Mobile: Pattern highlights (e.g., "3 low-energy days")

**Exit Criteria:** App UI visibly adapts based on emotional state, check-in takes <2 seconds, timeline shows historical patterns.

---

## Phase 3: Mind Module

**Goal:** Self-awareness features — journaling, AI insights, pattern recognition.

### 3.1 Journal Entry System
- [ ] Quick-capture journal input (text, voice-to-text)
- [ ] Rich text editor (minimal, distraction-free)
- [ ] Auto-tagging via classifier (placeholder until AI ready)
- [ ] Link to emotional check-ins
- [ ] Journal entry list with search
- [ ] Edit/delete functionality

### 3.2 AI Prompt System
- [ ] Backend: Prompt generation logic (based on patterns)
- [ ] Backend: Store prompt templates
- [ ] Mobile: Display contextual prompts ("You've felt low energy...")
- [ ] Mobile: Accept/dismiss prompt
- [ ] Track prompt acceptance rate

### 3.3 Insight Engine (Rule-Based MVP)
- [ ] Backend: Pattern detection rules (e.g., "3+ low-energy days")
- [ ] Backend: Correlation analysis (sleep → energy)
- [ ] Backend: Insight generation job (scheduled)
- [ ] Backend: Insight confidence scoring
- [ ] Mobile: Insights feed
- [ ] Mobile: Dismiss/act-on-insight actions
- [ ] Track insight utilization metrics

### 3.4 Pattern Recognition UI
- [ ] "Patterns You Might Notice" section
- [ ] Visual correlation display (e.g., scatter plot: sleep vs. energy)
- [ ] Gentle language throughout (no shame, suggestions only)
- [ ] BLUF formatting on all insights

**Exit Criteria:** User can journal, receives AI prompts based on patterns, sees insights about their emotional trends.

---

## Phase 4: Flow Module

**Goal:** Action and momentum — habits, goals, tasks, dopamine menu.

### 4.1 Habit Tracking
- [ ] Backend: Habit CRUD
- [ ] Mobile: Habit creation flow
- [ ] Mobile: Daily habit view with streaks
- [ ] Mobile: Completion action with celebration animation
- [ ] Streak calculation logic
- [ ] Longest streak tracking
- [ ] Soft streak-break handling (no shaming)

### 4.2 Goals & Tasks
- [ ] Backend: Goal hierarchy (parent/child)
- [ ] Backend: Task decomposition
- [ ] Mobile: Goal creation with deadline enforcement
- [ ] Mobile: Task list per goal
- [ ] Mobile: Next-step visibility (always show one actionable task)
- [ ] Mobile: Task completion with celebration
- [ ] Area→Project conversion reminder (if no deadline set)

### 4.3 Dopamine Menu
- [ ] Backend: Menu item CRUD
- [ ] Mobile: Menu creation (4 categories)
- [ ] Mobile: Step-by-step instructions display
- [ ] Mobile: Time estimates
- [ ] Mobile: Effectiveness rating after use
- [ ] Backend: Effectiveness learning algorithm
- [ ] Time-of-day awareness (different suggestions morning vs. evening)

### 4.4 Celebration System
- [ ] Animation library for celebrations (confetti, particles, etc.)
- [ ] Intensity scaler (small win vs. major milestone)
- [ ] Haptic feedback patterns
- [ ] Sound effects (optional, user-controlled)
- [ ] Celebration trigger points (habit, task, goal completion)

### 4.5 Project Management (PARA-Inspired)
- [ ] Backend: Project CRUD with mandatory deadlines
- [ ] Backend: Area categorization
- [ ] Mobile: Project dashboard
- [ ] Mobile: Progress visualization
- [ ] Auto-archive after 30 days inactivity (automation engine placeholder)

**Exit Criteria:** User can track habits with visible streaks, manage goals decomposed into tasks, use dopamine menu for self-regulation, experiences celebrations on completion.

---

## Phase 5: Body Module

**Goal:** Somatic awareness and health tracking.

### 5.1 Body Check-In Flow
- [ ] 5-step guided flow UI
- [ ] Step 1: Body scan (8 regions, tap interface)
- [ ] Step 2: Sensation identification (type + intensity 1-5)
- [ ] Step 3: Emotion wheel selection
- [ ] Step 4: AI hypothesis display
- [ ] Step 5: Reflection rating
- [ ] Total flow time <90 seconds optimization
- [ ] Progress indicator through steps

### 5.2 Somatic Dictionary
- [ ] Backend: Somatic mapping storage
- [ ] Backend: Pattern matching algorithm (sensations → emotions)
- [ ] Backend: Confidence scoring
- [ ] Mobile: Personal somatic profile view
- [ ] Mobile: Mapping history and validation

### 5.3 Energy Tracking
- [ ] Continuous energy level logging (from check-ins)
- [ ] Backend: Energy curve calculation
- [ ] Backend: Crash prediction algorithm
- [ ] Mobile: Energy trend chart
- [ ] Mobile: Pre-crash warning notifications

### 5.4 Sleep Logging
- [ ] Manual sleep entry UI (duration + quality)
- [ ] Backend: Sleep data storage
- [ ] Backend: Correlation with next-day energy
- [ ] Placeholder for Apple Health integration (TODO)
- [ ] Placeholder for Google Fit integration (TODO)

### 5.5 Health Metrics Dashboard
- [ ] Backend: Health metrics aggregation
- [ ] Mobile: Vitality score display
- [ ] Mobile: HRV, steps, heart rate charts (when integrations ready)
- [ ] Cross-reference with emotional states

**Exit Criteria:** User can complete body check-in in <90 seconds, sees somatic-emotional correlations, tracks sleep and energy trends.

### 5.6 Physical Environment — Space Tracking (Declutter v1)
- [ ] Backend: Space CRUD (named spaces per user)
- [ ] Backend: SpaceScan model (before/after photos, duration, status)
- [ ] Backend: DetectedItem model (label, confidence, decision, category)
- [ ] Mobile: Space creation and list UI
- [ ] Mobile: Photo capture for space scan (before photo)
- [ ] Mobile: AI item detection via cloud vision API (Claude Vision or similar)
- [ ] Mobile: Swipeable decision cards (keep/donate/trash/sell) for detected items
- [ ] Mobile: 10-minute countdown timer for declutter sprint
- [ ] Mobile: After-photo capture on sprint completion
- [ ] Mobile: Declutter sprint completion → trigger celebration (Flow integration)
- [ ] Emotional context gate: suppress declutter suggestions when low energy + unpleasant

**Exit Criteria:** User can create a space, scan it, make keep/donate/trash decisions in under 10 minutes, see before/after, sprint completion triggers a celebration.

---

## Phase 6: Hub Module

**Goal:** Second brain and analytics — universal capture, knowledge base, reviews.

### 6.1 Universal Capture Inbox
- [ ] Global capture button (accessible from any screen)
- [ ] Multi-modal input: text, voice, link, image
- [ ] Immediate local storage
- [ ] Classifier queue (pending → classified)
- [ ] Needs Review queue (confidence <60%)
- [ ] One-click classification UI (Task/Project/Idea/Person)

### 6.2 External Capture Integrations
- [ ] Backend: Email webhook endpoint (Zapier-compatible)
- [ ] Backend: SMS ingestion (Twilio integration)
- [ ] iOS Shortcuts action
- [ ] Browser bookmarklet
- [ ] IFTTT applet instructions
- [ ] All external captures route to inbox

### 6.3 Knowledge Base (PARA)
- [ ] Backend: Knowledge item CRUD
- [ ] Backend: PARA category management
- [ ] Mobile: Knowledge browser
- [ ] Mobile: Search and filter
- [ ] AI resurfacing logic (archived content when relevant)
- [ ] Aggressive archiving defaults

### 6.4 Analytics Dashboard
- [ ] Backend: Dashboard data aggregation query
- [ ] Mobile: Unified dashboard view
- [ ] Emotional trends widget
- [ ] Habit adherence widget
- [ ] Active projects widget
- [ ] Recent insights widget
- [ ] "How am I doing?" summary (answerable in <5 seconds)

### 6.5 Shutdown Ritual
- [ ] Scheduled notification (user-configurable time)
- [ ] Guided 3-minute review flow
- [ ] Today's captured items summary
- [ ] Energy rating for the day
- [ ] Tomorrow's focus generation
- [ ] Open loops acknowledgment
- [ ] Session close animation

### 6.6 Weekly Review
- [ ] Backend: Weekly aggregation job (scheduled)
- [ ] Backend: AI-generated summary text
- [ ] Mobile: Weekly review delivery (Sunday or user's choice)
- [ ] Sections: emotional trends, habits, accomplishments, patterns
- [ ] Chat interface for Q&A ("Why was Thursday rough?")
- [ ] Adjustment suggestions (habits, routines)

### 6.7 AI Assistant / Chat
- [ ] Backend: RAG pipeline over user data
- [ ] Backend: LLM API integration
- [ ] Backend: Query parsing and routing
- [ ] Mobile: Chat interface
- [ ] Mobile: Conversation history
- [ ] Natural language queries ("What was I working on last Tuesday?")
- [ ] Privacy safeguards (data never leaves encrypted channel)

### 6.8 Environment Analytics
- [ ] Backend: Clutter trends aggregation per space over time
- [ ] Backend: Correlation engine (clutter level vs. emotional state vs. energy)
- [ ] Mobile: Space history view (scan timeline, before/after photos)
- [ ] Mobile: Clutter-emotion correlation insights ("Your energy is lower when your desk is cluttered")
- [ ] Mobile: Items cleared summary (kept/donated/trashed/sold counts)
- [ ] Dashboard widget: environment health score

**Exit Criteria:** User can capture from anywhere, has unified dashboard including clutter trends, completes daily shutdown and weekly review, can chat with their data.

---

## Phase 7: AI Infrastructure

**Goal:** Production-ready AI engines (Classifier, Insight, Automation).

### 7.1 Classifier Engine
- [ ] Model selection (DistilBERT or similar)
- [ ] Training data preparation (labeled examples)
- [ ] Model fine-tuning
- [ ] On-device inference integration (TensorFlow Lite / CoreML)
- [ ] Confidence threshold tuning (60% default)
- [ ] Needs Review queue integration
- [ ] Continuous learning from user corrections

### 7.2 Insight Engine (Advanced)
- [ ] Replace rule-based with ML-driven insights
- [ ] Temporal pattern detection (seasonal, weekly, daily cycles)
- [ ] Multi-variable correlation analysis
- [ ] Anomaly detection (unusual patterns)
- [ ] Insight prioritization (what to surface first)
- [ ] A/B testing framework for insight presentation

### 7.3 Automation Engine
- [ ] Rules engine implementation
- [ ] Trigger conditions (time-based, event-based, state-based)
- [ ] Action types (resurface, suggest, archive, notify)
- [ ] Automation transparency (user can see what automated and why)
- [ ] Opt-out per automation type
- [ ] Examples:
  - [ ] Resurface archived project when related info arrives
  - [ ] Adjust tomorrow's schedule based on sleep
  - [ ] Archive stale projects after 30 days
  - [ ] Convert dormant areas to projects

### 7.4 AI Communication Layer
- [ ] Template system for all AI output
- [ ] BLUF enforcement
- [ ] Max 3 items per list validation
- [ ] Shame language detector (blocklist + sentiment analysis)
- [ ] "First tiny step" generator for tasks
- [ ] Temporal awareness formatter ("Due Friday" not "due soon")

**Exit Criteria:** AI classifies with >80% accuracy, generates non-obvious insights, automates routine decisions, communicates gently and clearly.

---

## Phase 8: Polish & Accessibility

**Goal:** WCAG AA compliance, performance optimization, delightful UX.

### 8.1 Accessibility
- [ ] Dyslexia-friendly font option
- [ ] High-contrast mode
- [ ] Reduced-motion support
- [ ] Screen reader testing (VoiceOver, TalkBack)
- [ ] Color-blind safe palette
- [ ] Minimum touch target sizes (44x44pt)
- [ ] Focus indicators for keyboard navigation
- [ ] WCAG AA audit and remediation

### 8.2 Performance Optimization
- [ ] Capture flow profiling (target: <2s)
- [ ] Time-to-first-value measurement (target: <5s)
- [ ] Animation frame rate monitoring (target: 60fps)
- [ ] Bundle size optimization
- [ ] Image lazy loading
- [ ] Query optimization (backend + local DB)
- [ ] Memory leak detection

### 8.3 Delight & Micro-interactions
- [ ] Onboarding animation polish
- [ ] Celebration variety (not repetitive)
- [ ] Smooth transitions between emotional states
- [ ] Loading state animations
- [ ] Error state empathy (calm, helpful messages)
- [ ] Empty state guidance

### 8.4 Calm Technology Audit
- [ ] Notification frequency review (no spam)
- [ ] Dark pattern elimination
- [ ] Engagement hacking removal
- [ ] User control emphasis (opt-in, not opt-out)
- [ ] Graceful degradation messaging

**Exit Criteria:** Passes WCAG AA audit, meets all performance targets, feels calm and supportive.

---

## Phase 9: Testing & QA

**Goal:** Comprehensive test coverage and bug-free launch.

### 9.1 Unit Tests
- [ ] Business logic tests (80%+ coverage)
- [ ] AI engine tests (deterministic outputs)
- [ ] Sync engine tests (conflict scenarios)
- [ ] Utility function tests

### 9.2 Integration Tests
- [ ] API endpoint tests
- [ ] Database query tests
- [ ] Auth flow tests
- [ ] Sync end-to-end tests

### 9.3 E2E Tests
- [ ] Mobile: Detox test suite (all user flows)
- [ ] Web: Playwright test suite (all user flows)
- [ ] Cross-device sync tests
- [ ] Offline scenario tests

### 9.4 Performance Tests
- [ ] Load testing (backend API)
- [ ] Stress testing (sync with large datasets)
- [ ] Memory profiling (mobile app)
- [ ] Battery impact assessment

### 9.5 Accessibility Tests
- [ ] Automated axe-core scans
- [ ] Manual screen reader testing
- [ ] Keyboard-only navigation testing
- [ ] Color contrast verification

### 9.6 User Acceptance Testing
- [ ] Internal dogfooding (2 weeks minimum)
- [ ] Beta tester recruitment (500 users)
- [ ] Feedback collection system
- [ ] Bug triage and prioritization
- [ ] Critical bug fixes

**Exit Criteria:** All critical bugs resolved, E2E tests passing, beta feedback incorporated, performance targets met.

---

## Phase 10: Launch Preparation

**Goal:** Production deployment and go-to-market readiness.

### 10.1 Infrastructure
- [ ] Production database setup (PostgreSQL, managed)
- [ ] Redis cluster for caching/queues
- [ ] CDN configuration (Cloudflare)
- [ ] SSL certificates
- [ ] Domain and DNS setup
- [ ] Backup and disaster recovery plan

### 10.2 Monitoring & Observability
- [ ] Sentry production setup
- [ ] PostHog analytics (self-hosted)
- [ ] Uptime monitoring
- [ ] Alert thresholds and escalation
- [ ] Log aggregation and search

### 10.3 App Store Preparation
- [ ] App Store screenshots and descriptions
- [ ] Privacy policy and terms of service
- [ ] Age rating questionnaire
- [ ] TestFlight internal testing
- [ ] App Store submission
- [ ] Google Play Console setup
- [ ] Google Play submission

### 10.4 Support Infrastructure
- [ ] Help center / FAQ
- [ ] In-app feedback mechanism
- [ ] Email support address
- [ ] Issue tracking system
- [ ] Response time SLAs

### 10.5 Launch Plan
- [ ] Marketing site live
- [ ] Social media presence
- [ ] Launch announcement strategy
- [ ] Press kit (if applicable)
- [ ] Community building (Discord, Reddit, etc.)

**Exit Criteria:** App approved in stores, production infrastructure live, monitoring active, support ready.

---

## Post-Launch: Iteration & Growth

### Trade Marketplace (Deferred — Post-MVP)

**Goal:** Barter/trade marketplace for items cleared during declutter sprints.

### TM.1 Listings & Credits
- [ ] Backend: TradeListing model (item, condition, estimated value, photos)
- [ ] Backend: Credit system (earn by giving, spend by receiving)
- [ ] Backend: Listing search with filters (category, distance, condition)
- [ ] Mobile: "List for trade" action from declutter decisions
- [ ] Mobile: Browse listings UI
- [ ] Mobile: Credit balance display

### TM.2 Matching & Proposals
- [ ] Backend: Algorithmic matching (based on want lists + proximity)
- [ ] Backend: Trade proposal flow (propose → accept/decline → schedule)
- [ ] Mobile: Trade proposal notifications
- [ ] Mobile: Trade detail screen with item comparison

### TM.3 Trust & Safety
- [ ] Backend: User reputation system
- [ ] Backend: Safety checklists per item category
- [ ] Backend: User verification pipeline
- [ ] Mobile: Verification badge display
- [ ] Mobile: Report/block functionality

### TM.4 Agent-Ready Foundation (Future)
- [ ] MCP server exposing trade tools and listing resources
- [ ] Auto-match agent: scans listings nightly, proposes matches
- [ ] User wishlist with priority ranking
- [ ] Agent transparency dashboard (what the agent did on your behalf)

**Exit Criteria:** Users can list decluttered items for trade, browse and propose trades, earn and spend credits, trust system is functional.

---

### Other Post-Launch Tasks

- [ ] Weekly review of user feedback
- [ ] Monthly feature prioritization
- [ ] Quarterly strategic planning
- [ ] Continuous performance monitoring
- [ ] AI model retraining with new data
- [ ] Platform expansion (tablet optimization, desktop app?)
- [ ] Integration partnerships (calendar apps, note-taking tools)

---

## Dependency Map

```
Phase 0 → Phase 1 → Phase 2 → Phase 3 ─┐
                    │                   │
                    ├→ Phase 4 ─────────┤
                    │                   │
                    ├→ Phase 5 ─────────┼→ Phase 6 → Phase 7 → Phase 8 → Phase 9 → Phase 10
                    │                   │                                │
                    └───────────────────┘                                └→ TM.1-4 (post-launch)
```

**Critical Path:** Phases 0-2 are foundational; delays here cascade. Phases 3-6 can proceed partially in parallel once Phase 2 is complete. Phases 7-10 are sequential. Trade Marketplace is post-launch only.

---

## Estimated Timeline (Rough)

| Phase | Duration | Notes |
|-------|----------|-------|
| Phase 0 | 1-2 weeks | Straightforward setup |
| Phase 1 | 3-4 weeks | Auth + sync complexity |
| Phase 2 | 3-4 weeks | Core differentiator, needs care |
| Phase 3 | 3-4 weeks | AI integration starts |
| Phase 4 | 4-5 weeks | Complex UI interactions |
| Phase 5 | 3-4 weeks | Body check-in + declutter sprints |
| Phase 6 | 5-6 weeks | Largest module, many subfeatures |
| Phase 7 | 4-6 weeks | AI model training iterative |
| Phase 8 | 2-3 weeks | Can overlap with Phase 9 |
| Phase 9 | 3-4 weeks | Testing at scale |
| Phase 10 | 2-3 weeks | Bureaucracy (app store reviews) |
| TM.1-4 | 6-8 weeks | Post-launch, trade marketplace |

**Total:** ~30-40 weeks for core rebuild + 6-8 weeks for trade marketplace post-launch

**MVP Scope:** Phases 0-4 + Phase 5 (including declutter sprints) + subset of Phase 6 (capture, habits, check-ins, basic dashboard, environment analytics) = ~18-22 weeks
