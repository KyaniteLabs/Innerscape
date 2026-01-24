# Innerscape Mobile

The unified React Native + Expo app for the Innerscape suite.

## Architecture

**Single app with 4 tabs** — User installs one app, not four.

```
┌─────────────────────────────────────────────────────────────────┐
│                     Innerscape Mobile App                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Emotional Context Banner (reads from Soma)              │    │
│  │  "Currently: High energy, Pleasant"                      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Tab Content Area                      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────┬─────────┬─────────┬─────────┬─────────┐           │
│  │  Mind   │  Flow   │    +    │  Pulse  │   Hub   │           │
│  │   🧠    │   ⚡    │  (FAB)  │   💜    │   📊    │           │
│  └─────────┴─────────┴─────────┴─────────┴─────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

## Tabs

| Tab | Purpose |
|-----|---------|
| **Mind** | Thought capture, AI organization, inbox, journal mode |
| **Flow** | Habit tracking, daily routines, energy-aware suggestions |
| **Pulse** | Sleep/energy dashboard, health data visualization |
| **Hub** | Daily summary, cross-app insights, activity timeline |

## Folder Structure

```
innerscape-mobile/
├── app/                        # Expo Router file-based routing
│   ├── (tabs)/                 # Tab navigator
│   │   ├── mind/               # Mind tab screens
│   │   │   ├── index.tsx       # Capture + inbox
│   │   │   ├── projects.tsx
│   │   │   ├── people.tsx
│   │   │   ├── ideas.tsx
│   │   │   └── journal.tsx     # Journal mode
│   │   ├── flow/               # Flow tab screens
│   │   │   ├── index.tsx       # Today's habits
│   │   │   ├── routines.tsx
│   │   │   └── streaks.tsx
│   │   ├── pulse/              # Pulse tab screens
│   │   │   ├── index.tsx       # Energy dashboard
│   │   │   ├── sleep.tsx
│   │   │   └── trends.tsx
│   │   ├── hub/                # Hub tab screens
│   │   │   ├── index.tsx       # Today summary
│   │   │   └── insights.tsx
│   │   └── _layout.tsx         # Tab bar config
│   ├── chat.tsx                # AI chat (modal)
│   ├── capture.tsx             # Quick capture (modal)
│   └── _layout.tsx             # Root layout
├── components/                 # Shared components
├── lib/                        # Business logic
│   ├── api/                    # API client
│   ├── sync/                   # PowerSync
│   ├── health/                 # HealthKit/Google Fit
│   └── voice/                  # Whisper/Deepgram
├── packages/                   # Internal packages
│   ├── ui/                     # Design system
│   ├── api-client/             # Typed API
│   ├── sync/                   # PowerSync wrapper
│   ├── health/                 # Health abstraction
│   ├── voice/                  # Speech-to-text
│   └── widgets/                # iOS/Android widgets
└── widgets/                    # Native widget code
    ├── ios/                    # WidgetKit
    └── android/                # Glance
```

## Getting Started

```bash
# Install dependencies
npm install

# Start development
npm run dev

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Key Concepts

### Emotional Context Banner
All tabs show the current emotional state from Soma at the top. This reads from the `emotional_context` table in the shared database.

### Journal Mode
Journaling is a mode within the Mind tab, not a separate app. The AI classifies captures:
- "I need to buy groceries" → Task/Idea
- "Today was a rough day, I felt overwhelmed" → Journal entry

### Energy-Aware Suggestions
Flow tab reads emotional context to suggest appropriate habits:
- High energy → Show challenging habits
- Low energy → Show easy wins

## Tech Stack

- **Framework**: React Native + Expo (SDK 52+)
- **Routing**: Expo Router (file-based)
- **State**: TanStack Query + Zustand
- **Sync**: PowerSync
- **Auth**: Clerk
- **Health**: Apple HealthKit, Google Health Connect
- **Voice**: Whisper.cpp (on-device), Deepgram (cloud)

---

See [LIFEOS_SUITE_PLAN.md](../Second%20Brain%20Project/LIFEOS_SUITE_PLAN.md) for full architecture.
