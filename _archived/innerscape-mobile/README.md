# Innerscape Mobile

The unified React Native + Expo app for the Innerscape suite.

## Architecture

**Single app with 4 tabs** — User installs one app, not four.

```
┌─────────────────────────────────────────────────────────────────┐
│                     Innerscape Mobile App                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Emotional Context Banner (unified context)              │    │
│  │  "Currently: High energy, Pleasant"                      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Tab Content Area                      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────┬─────────┬─────────┬─────────┬─────────┐           │
│  │  Mind   │  Flow   │    +    │  Body   │   Hub   │           │
│  │   🧠    │   ⚡    │  (FAB)  │   💜    │   📊    │           │
│  └─────────┴─────────┴─────────┴─────────┴─────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

## Tabs

| Tab | Purpose |
|-----|---------|
| **Mind** | Thought capture, AI organization, inbox, journal mode |
| **Flow** | Habit tracking, daily routines, energy-aware suggestions |
| **Body** | Somatic check-ins (Soma), sleep/energy dashboard, health data |
| **Hub** | Daily summary, dopamine menu, goals, analytics |

## Folder Structure

```
innerscape-mobile/
├── app/                        # Expo Router file-based routing
│   ├── (tabs)/                 # Tab navigator
│   │   ├── mind/               # Mind tab screens
│   │   │   ├── index.tsx       # Capture + inbox
│   │   │   ├── projects.tsx
│   │   │   ├── journal.tsx     # Context-aware journal mode
│   │   ├── flow/               # Flow tab screens
│   │   │   ├── index.tsx       # Today's habits
│   │   │   ├── routines.tsx
│   │   ├── body/               # Body tab screens (Soma + Pulse)
│   │   │   ├── index.tsx       # Health dashboard
│   │   │   ├── check-in/       # Somatic check-in flow
│   │   │   ├── sleep.tsx
│   │   │   └── trends.tsx
│   │   ├── hub/                # Hub tab screens
│   │   │   ├── index.tsx       # Today summary
│   │   │   ├── goals.tsx       # Goals management
│   │   │   └── analytics.tsx   # Trends & correlations
│   │   └── _layout.tsx         # Tab bar config
│   ├── chat.tsx                # AI chat (modal)
│   ├── capture.tsx             # Quick capture (modal)
│   └── _layout.tsx             # Root layout
├── components/                 # Shared components
├── lib/                        # Business logic
│   ├── api/                    # API client
│   ├── sync/                   # PowerSync
│   ├── hooks/                  # Custom hooks (Dopamine, Shutdown, etc.)
│   └── store/                  # Global state (Zustand)
```

## Getting Started

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start development
npm start
```

## Key Concepts

### Somatic Check-ins
Located in the Body tab, the check-in flow helps you connect with physical sensations using an interactive Body Scan and Emotion Wheel.

### Contextual Journaling
If you feel a strong emotion during a Body check-in, you can "Go Deeper" which takes you to the Mind tab with a pre-populated, context-aware reflection prompt.

### Feature Parity
This app maintains 100% feature parity with the Innerscape Web app, including the Dopamine Menu, Shutdown Ritual, and Analytics.

## Tech Stack

- **Framework**: React Native + Expo (SDK 54)
- **Engine**: React 19 / RN 0.81.5
- **Graphics**: React Native Skia (Emotion Wheel, Charts)
- **State**: TanStack Query + Zustand
- **Sync**: PowerSync
- **Auth**: Clerk
- **Charts**: Victory Native XL
