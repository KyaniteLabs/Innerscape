# LifeOS Suite — Master Implementation Plan

> **Version**: 2.1.0 | **Date**: January 2026
> 
> This document defines the unified plan for transforming Feelings APP and Second Brain into a comprehensive LifeOS suite.

---

## Consolidated Architecture (Option B)

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
```

**Full plan**: `/LifeOS/Second Brain Project/LIFEOS_SUITE_PLAN.md`

---

## Soma-Specific Details (This App)

### Role in the Suite

**Innerscape Soma is the PRIMARY source of emotional context.**

All other apps READ from Soma's data:
- **Mind tab**: Shows mood in header, factors into AI classification
- **Flow tab**: Energy-aware habit suggestions
- **Pulse tab**: Correlates energy with sleep/health
- **Hub tab**: Displays current emotional state

### Phase 2 Enhancements

1. **Add PowerSync Flutter SDK** for cloud sync
2. **Add Clerk Flutter SDK** for authentication
3. **NEW: AI Pattern Detection** — Analyze historical check-ins
4. **NEW: Voice-Guided Check-ins** — Audio prompts, eyes-closed mode
5. **Read health correlations** from Pulse (not sync health data directly)
6. Write emotional context to shared `emotional_context` table

### New Files to Create

```
lib/
├── domain/services/
│   ├── ai_pattern_service.dart       # AI pattern detection
│   ├── voice_checkin_service.dart    # Voice-guided check-ins
│   ├── auth_service.dart             # Clerk authentication
│   └── sync_service.dart             # PowerSync sync
├── data/repositories/
│   └── correlation_repository.dart   # READ health correlations
└── presentation/screens/
    ├── voice_checkin_screen.dart     # Voice mode UI
    ├── patterns_screen.dart          # View detected patterns
    └── login_screen.dart             # Authentication UI
```

### Dependencies to Add (pubspec.yaml)

```yaml
dependencies:
  # Sync & Auth
  powersync: ^1.0.0
  clerk_flutter: ^1.0.0
  
  # Voice
  speech_to_text: ^6.0.0
  flutter_tts: ^3.0.0
  
  # AI (API client)
  dio: ^5.0.0
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          SOMA IS THE SOURCE                             │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                          ┌─────────┴─────────┐
                          │  emotional_context │
                          │      table         │
                          └─────────┬─────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│  Mind Tab     │         │  Flow Tab     │         │  Pulse Tab    │
│  Shows mood   │         │  Energy-aware │         │  Visualizes   │
│  in header    │         │  suggestions  │         │  over time    │
└───────────────┘         └───────────────┘         └───────────────┘
```

---

## Branding

This app will be **Innerscape Soma**.

- **App Store Name**: Innerscape Soma — Body Check-in
- **Subtitle**: "Understand what your body is telling you"
- **Primary Color**: Deep indigo (#4F46E5)
- **Accent Color**: Warm amber (#F59E0B)
- **Icon**: Abstract body silhouette with inner glow

---

## Key Changes in v2.1.0

1. **Health data sync removed from Soma** — Pulse handles health data
2. **Soma is the PRIMARY emotional source** — No redundant mood capture elsewhere
3. **Journal mode removed** — Now in Mind tab (AI classifies journal vs. actionable)
4. **Simpler integration** — Just sync check-ins, read correlations from Pulse

---

For the complete plan, see `/LifeOS/Second Brain Project/LIFEOS_SUITE_PLAN.md`.
