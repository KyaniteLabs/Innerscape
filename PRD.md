# Product Requirements Document: Innerscape

## Meta

| Field | Value |
|-------|-------|
| Product | Innerscape |
| Version | 2.0 (clean-slate rebuild) |
| Date | 2026-05-04 |
| Status | Draft |

---

## 1. The Problem

People with ADHD and autism experience chronic executive dysfunction — working memory failures, time blindness, object impermanence, decision paralysis, and dopamine dysregulation. Standard productivity tools (Notion, Todoist, Apple Notes) presume intact executive function: they assume you remember to check your to-do list, can categorize a note without friction, and feel rewarded when you complete a task.

For neurodivergent users, these assumptions collapse. The tool becomes another source of psychological entropy instead of relief.

**Three specific failure modes:**

1. **Capture friction** — If it takes more than 2 seconds to record a thought, it's lost. Working memory decays in seconds.
2. **Out-of-sight, out-of-mind** — Once information is filed into a folder or tag, it ceases to exist for the ADHD brain. Traditional organization creates invisibility.
3. **No dopamine feedback** — Completing a task in a standard app produces no neurochemical reward. Without it, sustained engagement is biologically impossible for ADHD users.

---

## 2. The Product

**Innerscape is an executive prosthetic** — a cross-platform app (mobile + web) that replaces the executive functions that ADHD and autism degrade: working memory, inhibition control, task switching, and temporal awareness.

It is not a to-do list. It is not a journal. It is not a habit tracker. It is a **cognitive environment** that adapts to the user's current emotional and energetic state, surfaces what they need before they forget it, and provides the neurochemical feedback their brain cannot generate on its own.

### 2.1 Design Principles

1. **Sub-2-second capture** — Any thought, feeling, or observation can be recorded in under 2 seconds from anywhere in the app. No navigation required.
2. **Proactive surfacing** — The system brings information to the user. Nothing requires recall. If the user has to remember to check something, the design has failed.
3. **Emotional context awareness** — The app knows the user's current energy level and emotional valence, and adapts what it shows and how it behaves accordingly.
4. **Dopamine by design** — Every interaction provides calibrated positive feedback. Completion is visible, celebrated, and accumulates toward streaks and patterns.
5. **Chaos-resilient** — The system works even when the user is inconsistent. It degrades gracefully, not catastrophically. A week of missed entries should not break the user's data or motivation.

---

## 3. The Four Modules

The app is organized into four modules, each mapping to a domain of executive function:

### 3.1 Mind — Self-Awareness & Reflection

**Purpose:** Externalize the user's internal state so they can see patterns they cannot perceive in real time.

**Core Features:**

- **Feeling capture** — One-tap emotional check-in: energy level (high/low), valence (pleasant/unpleasant/neutral), dominant feeling label, and optional body sensation note. Takes < 2 seconds.
- **Journal** — Free-form text entries, optionally prompted by AI based on recent patterns ("You've felt low energy for 3 days — want to write about it?").
- **AI insight engine** — Continuously analyzes captured feelings, journal entries, and activity data to surface non-obvious patterns: "Your energy drops every Wednesday" or "You feel anxious on days you skip morning routines."
- **Emotional timeline** — Visual history of emotional states over time. Reveals cycles the user cannot perceive subjectively.
- **Pattern recognition** — AI-generated correlations between behaviors, feelings, and outcomes. Presented as gentle observations, not diagnoses.

### 3.2 Flow — Action & Momentum

**Purpose:** Convert the user's intentions into forward motion without requiring the executive function to organize, prioritize, or initiate.

**Core Features:**

- **Habits** — Simple, visual habit tracking with streak mechanics. Streaks are prominent. Breaking a streak is soft (not punitive). The system celebrates consistency without shaming gaps.
- **Goals** — Hierarchical goals that decompose into concrete, single-session tasks. Every goal has a visible next step at all times.
- **Dopamine menu** — A structured self-regulation system with four categories: **Warm Up** (appetizers — quick activation actions), **Deep Work** (entrees — sustained focus tasks), **Support** (sides — external aids and accountability), **Rest** (desserts — recovery activities). Each item has step-by-step instructions and time estimates. The menu is time-of-day aware (morning vs. evening suggestions differ). The system learns which actions reliably produce positive feelings for this specific user and prioritizes them.
- **Projects** — PARA-inspired project containers with deadlines. Areas (ongoing responsibilities without deadlines) are automatically converted into time-bound projects to prevent the "no finish line" paralysis that kills ADHD engagement.
- **Celebrations** — Every completed task, habit, or goal triggers a celebration. The intensity scales with significance. These are not decorative — they are the neurochemical infrastructure that makes sustained engagement possible for dopamine-deficient brains.

### 3.3 Body — Somatic & Health Awareness

**Purpose:** Build interoceptive awareness — the ability to perceive internal body signals — which is impaired in both ADHD and autism.

**Core Features:**

- **Guided body check-in** — A 5-step somatic awareness flow: (1) Body scan — tap 8 body regions (head/face, neck/throat, shoulders/arms, chest/heart, belly/gut, back, hips/groin, legs/feet) where sensation is present. (2) Sensations — identify the physical quality (tension, warmth, numbness, etc.) with intensity levels 1-5. (3) Emotion wheel — select dominant feeling and valence. (4) Result — see a summary with an AI-generated hypothesis ("You might feel this way because..."). (5) Reflection — rate whether the suggested action helped. Takes under 90 seconds.
- **Personal somatic dictionary** — The system learns over time which body sensations map to which emotions for this specific user. Confidence-scored personal mappings build a unique somatic profile. After enough data, the system can predict emotional state from physical sensation patterns alone.
- **Energy tracking** — Continuous energy level monitoring (0-100 scale). The system learns the user's energy curves and warns before predicted crashes.
- **Sleep logging** — Sleep quality and duration tracking with sources: manual entry, Apple Health, or Google Fit. Correlated with next-day energy and mood.
- **Health metrics** — Passive collection from Apple Health / Health Connect (HRV, steps, heart rate). Combined with self-reported data for a complete picture.
- **Somatic patterns** — AI cross-references physical sensations with emotional states and activities. Reveals connections like "tension in your jaw correlates with high-anxiety work meetings."

### 3.4 Hub — Second Brain & Analytics

**Purpose:** Serve as the user's external memory and analytical engine. The place where all data converges into actionable intelligence.

**Core Features:**

- **Universal capture inbox** — Every thought, clip, link, voice note, or photo enters a single inbox. No categorization required at capture time. AI auto-tags and routes later. Capture is not limited to the app: available via email webhook (Zapier), iOS Shortcuts, browser bookmarklet, SMS (Twilio), and IFTTT. The entry point is everywhere the user's thoughts happen.
- **Knowledge base** — A PARA-structured knowledge management system (Projects, Areas, Resources, Archives) adapted for neurodivergent use: minimal Areas, aggressive archiving, and AI-driven resurfacing of archived content when it becomes relevant again.
- **Analytics dashboard** — Unified view across all modules. Shows trends, correlations, and progress. Designed to answer "how am I doing?" in under 5 seconds.
- **Shutdown ritual** — End-of-day guided review: what happened, what was captured, what's tomorrow's focus. Converts the anxiety of unresolved open loops into calm, closed sessions.
- **Weekly review** — AI-generated summary of the week: emotional trends, habit adherence, accomplishments, patterns noticed. Reduces the executive burden of self-reflection.
- **AI assistant / Chat** — Conversational interface to the user's own data. "What was I working on last Tuesday?" "When did I last feel this way?" "What should I focus on tomorrow?" The user's data becomes queryable.

---

## 4. The Cross-Cutting Emotional Context System

The single most important architectural feature of Innerscape is the **emotional context layer** — a real-time awareness of the user's current state that flows through every module and adapts the entire experience.

### How It Works

1. The user's latest emotional check-in (energy + valence + feeling) is the **current context**.
2. If no check-in exists, the system infers context from recent behavior (time of day, activity patterns, sleep data).
3. This context is available to every screen, every AI suggestion, and every notification.

### What It Controls

| User State | App Behavior |
|------------|-------------|
| High energy, pleasant | Show challenging tasks, suggest creative work, offer stretch goals |
| High energy, unpleasant | Limit options, show grounding exercises, suppress overwhelm triggers |
| Low energy, pleasant | Show easy wins, suggest browsing analytics, offer low-effort capture |
| Low energy, unpleasant | Emergency mode: minimal UI, single focus task, offer support resources |

This is not a notification scheduler. It is a **state-adaptive interface**. The entire app reshapes itself around the user's current capacity.

---

## 5. AI Capabilities

AI is not a feature in Innerscape — it is infrastructure. Three AI engines run continuously:

### 5.1 Classifier
Auto-categorizes every captured item (thought, feeling, body sensation, task, link) into the appropriate module and context. The user never manually categorizes anything.

### 5.2 Insight Engine
Runs correlation analysis across all user data. Identifies temporal patterns ("you feel anxious on Sunday evenings"), behavioral correlations ("sleep < 6h predicts low energy next day"), and emerging trends. Presents insights as gentle observations, not commands.

### 5.3 Automation Engine
Converts patterns into actions without being asked. Examples:
- Resurface an archived project when related new information arrives
- Adjust tomorrow's suggested schedule based on tonight's sleep
- Generate a weekly review without being prompted
- Move stale projects to archive after 30 days of inactivity
- Convert long-dormant "areas" into time-bound projects before they decay into invisibility

### 5.4 AI Communication Principles

All AI-generated text in Innerscape follows these rules, derived from the product's research foundation:

- **BLUF** (Bottom Line Up Front) — always lead with the action, not the reasoning
- **Max 3 items per list** — chunked output prevents cognitive overload
- **No shame language** — never "you still haven't..." or "you forgot to..." The system observes, never accuses
- **Gentle suggestions** — "you might..." not "you should..." The user is in control
- **First tiny step** — when suggesting a task, always include a sub-2-minute first action to overcome initiation paralysis
- **Temporal awareness** — always detect and surface time components. "Due Friday" not "due soon"
- **Deduplication-first** — search before creating. Merge into existing items rather than spawning duplicates that create clutter

### 5.5 Needs Review Queue

When the AI classifier confidence is below 60%, items land in a "Needs Review" queue instead of being auto-filed. The user sees a simple one-click classification: Task, Project, Idea, or Person. This prevents misfiling while keeping cognitive load minimal.

---

## 6. Onboarding

New users see a 7-step guided introduction, one screen per module plus bookends:

| Step | Screen | Color | Message |
|------|--------|-------|---------|
| 0 | Welcome | Indigo | "Your unified suite for self-awareness, depth, and intentional action." |
| 1 | Body (Soma) | Purple | "Listen to your body. Track physical sensations and connect them to your emotional state." |
| 2 | Mind | Indigo | "Capture every thought. Your digital inbox for ideas, tasks, and reflections." |
| 3 | Flow | Amber | "Master your routines. Build habits that align with your natural energy patterns." |
| 4 | Body (Pulse) | Green | "Track your vitality. Monitor sleep, energy levels, and health trends automatically." |
| 5 | Hub | Blue | "Your command center. Unified insights from across the entire suite in one dashboard." |
| 6 | Setup | Indigo | Sign-in / account creation to enable cross-device sync |

After onboarding, the user lands on Hub (the dashboard). Onboarding state persists so returning users skip it entirely.

---

## 7. User Personas

### Primary: Alex (ADHD, 28)
- Works in tech, constantly starting projects they never finish
- Has 47 open browser tabs and 3 abandoned to-do apps
- Forgets to eat, loses track of time, cannot estimate how long anything takes
- Needs: capture that's faster than the thought escaping, visual streaks for dopamine, a system that works even when they don't

### Secondary: Sam (Autistic, 34)
- Meticulous about structure but overwhelmed by unstructured information
- Has elaborate Notion setups that collapsed under their own complexity
- Struggles with interoception — cannot tell when they're stressed until they're burned out
- Needs: AI-driven pattern detection for self-awareness, predictable structure that doesn't require manual maintenance, body awareness tools

### Tertiary: Jordan (AuDHD, 22)
- Combined ADHD + autism traits
- Hyperfocuses for 14 hours then crashes for 3 days
- Cannot maintain routines but craves them
- Needs: energy curve awareness, shutdown rituals to prevent crashes, celebration systems that make consistency feel achievable

---

## 8. User Flows

### 7.1 Morning Opening
1. App opens to a greeting adapted to current emotional context
2. AI shows 1-3 things to focus on today (derived from goals, habits, and yesterday's state)
3. User does a 2-second feeling check-in
4. App adjusts the day's suggestions based on the check-in

### 7.2 Mid-Day Capture
1. User hits the global capture button from anywhere in the app
2. Speaks, types, or taps a quick feeling
3. AI classifies the entry and routes it to the correct module
4. Entry is stored and correlated with existing data

### 7.3 Evening Shutdown
1. Notification at user's preferred time
2. Guided 3-minute shutdown ritual: review the day, see what was captured, rate energy
3. System generates tomorrow's focus based on today's data
4. All open loops are acknowledged and held by the system — the user can let go

### 7.4 Weekly Review
1. AI-generated summary delivered every Sunday (or user's preferred day)
2. Shows: emotional trends, habit adherence, accomplishments, energy curve, patterns noticed
3. User can chat with the AI about their week: "Why was Thursday so rough?"
4. System suggests adjustments to habits, goals, or routines based on the week's data

---

## 9. Success Metrics

### Engagement (Does it stick?)
- Daily active check-ins (target: 3+ per day)
- 7-day retention > 60%
- Average session count per day > 4 (indicates habitual use)

### Effectiveness (Does it help?)
- Self-reported clarity score (weekly survey, target: 7/10+)
- Goal completion rate (target: 50% of set goals completed)
- Pattern insight utilization (target: 30% of AI insights acted upon)

### Cognitive Load (Is it easy?)
- Average capture time < 2 seconds
- Time to first value on new session < 5 seconds
- Feature discovery without tutorials > 70%

---

## 10. Non-Goals (What This Is Not)

- **Not a therapy tool** — Does not diagnose, treat, or replace professional mental health support
- **Not a social platform** — No sharing, no community, no feed. This is a private cognitive space.
- **Not a generic productivity app** — Every feature exists because it addresses a specific executive dysfunction
- **Not an enterprise product** — Designed for individual neurodivergent users, not teams or organizations
- **Not a medical device** — Health data is for self-awareness only. No clinical recommendations.

---

## 11. Constraints

- **Privacy is absolute** — All emotional and health data stays on-device by default. Cloud sync is optional and encrypted end-to-end.
- **Offline-first** — The app must be fully functional without internet. Sync happens when connectivity returns.
- **Accessible by default** — WCAG AA compliance minimum. Dyslexia-friendly fonts, high-contrast mode, reduced-motion support, screen reader compatible.
- **Calm technology** — No dark patterns, no engagement hacking, no notification spam. The system works for the user, not against them.

---

## 12. Open Questions

1. **Platform priority** — Should mobile ship first (higher touch frequency) or web first (broader access, easier iteration)?
2. **AI model strategy** — Local on-device inference vs. cloud API? Trade-off: privacy vs. capability.
3. **Monetization** — Freemium with AI limits? Subscription? One-time purchase?
4. **Health integration depth** — Apple Health / Health Connect read-only, or bidirectional (writing back sleep/wellness data)?
5. **Social features** — Should there be an optional, private accountability partner feature, or does any social element violate the "private cognitive space" principle?

---

*This PRD describes the product Innerscape could become. It does not prescribe technology, architecture, or implementation order. Those decisions belong to the engineering phase.*
