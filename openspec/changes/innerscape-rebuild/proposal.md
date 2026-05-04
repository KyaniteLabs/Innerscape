# Proposal: Innerscape Rebuild

## Executive Summary

We are building **Innerscape** — an executive prosthetic for neurodivergent users (ADHD, autism, AuDHD). This is not a productivity app; it is a cognitive environment that replaces degraded executive functions: working memory, task switching, temporal awareness, and emotional regulation.

The rebuild takes a clean-slate approach, learning from existing codebases in this repository while implementing the full vision from PRD v2.0.

---

## The Problem

Neurodivergent users experience chronic executive dysfunction that standard productivity tools cannot address:

1. **Capture friction** — Thoughts escape faster than traditional apps can record them
2. **Out-of-sight, out-of-mind** — Filed information becomes invisible to the ADHD brain
3. **No dopamine feedback** — Task completion produces no neurochemical reward

These failure modes turn tools into sources of psychological entropy rather than relief.

---

## The Solution: Four Modules + Emotional Context

### Mind Module — Self-Awareness & Reflection
- Sub-2-second emotional check-ins (energy + valence + feeling)
- AI-powered journal with pattern-based prompts
- Emotional timeline visualization
- Continuous insight generation about mood/behavior correlations

### Flow Module — Action & Momentum
- Visual habit tracking with streak mechanics (celebratory, not punitive)
- Hierarchical goals decomposed into single-session tasks
- Dopamine Menu: Warm Up, Deep Work, Support, Rest categories
- PARA-inspired projects with enforced deadlines
- Celebration system scaled by significance

### Body Module — Somatic & Health Awareness
- 5-step guided body check-in (<90 seconds)
- Personal somatic dictionary (AI learns sensation→emotion mappings)
- Energy tracking with crash prediction
- Sleep logging (manual + Apple Health/Google Fit integration)
- Passive health metrics collection (HRV, steps, heart rate)

### Hub Module — Second Brain & Analytics
- Universal capture inbox (no categorization required at input)
- Multi-channel capture: email webhook, iOS Shortcuts, bookmarklet, SMS, IFTTT
- PARA knowledge base with aggressive archiving and AI resurfacing
- Unified analytics dashboard
- Shutdown ritual (end-of-day review)
- Weekly AI-generated review
- Conversational AI assistant for querying personal data

---

## Cross-Cutting: Emotional Context System

The core architectural innovation: a real-time emotional context layer that adapts the entire UI based on user state.

| User State | App Behavior |
|------------|-------------|
| High energy, pleasant | Challenging tasks, creative work, stretch goals |
| High energy, unpleasant | Limited options, grounding exercises, overwhelm prevention |
| Low energy, pleasant | Easy wins, browsing analytics, low-effort capture |
| Low energy, unpleasant | Emergency mode: minimal UI, single focus, support resources |

This is not notification scheduling — it is **state-adaptive interface design**.

---

## AI Infrastructure (Not Features)

Three engines run continuously:

1. **Classifier** — Auto-categorizes all captured items; user never manually tags
2. **Insight Engine** — Correlation analysis across all data; surfaces temporal patterns
3. **Automation Engine** — Converts patterns to actions without prompting

### Communication Principles
- BLUF (Bottom Line Up Front)
- Maximum 3 items per list
- No shame language ("you might" not "you should")
- First tiny step always included
- Temporal awareness ("Due Friday" not "due soon")
- Deduplication-first routing

---

## Target Users

| Persona | Profile | Needs |
|---------|---------|-------|
| Alex (ADHD, 28) | Tech worker, 47 open tabs, abandoned apps | Fast capture, visual streaks, grace for inconsistency |
| Sam (Autistic, 34) | Structure-loving, overwhelmed by chaos | AI pattern detection, predictable structure, body awareness |
| Jordan (AuDHD, 22) | Hyperfocus/crash cycles | Energy curve awareness, shutdown rituals, achievable consistency |

---

## Success Metrics

| Category | Metric | Target |
|----------|--------|--------|
| Engagement | Daily check-ins | 3+ per day |
| Engagement | 7-day retention | >60% |
| Engagement | Sessions per day | >4 |
| Effectiveness | Self-reported clarity | 7/10+ |
| Effectiveness | Goal completion | 50% |
| Effectiveness | Insight utilization | 30% acted upon |
| Cognitive Load | Capture time | <2 seconds |
| Cognitive Load | Time to first value | <5 seconds |
| Cognitive Load | Feature discovery | >70% without tutorials |

---

## Constraints

- **Privacy absolute** — All emotional/health data on-device by default; optional E2E encrypted cloud sync
- **Offline-first** — Full functionality without internet; sync when connected
- **Accessible** — WCAG AA minimum, dyslexia fonts, high-contrast, reduced-motion, screen reader compatible
- **Calm technology** — No dark patterns, no engagement hacking, no notification spam

---

## What This Is Not

- Not a therapy tool (no diagnosis/treatment)
- Not a social platform (private cognitive space)
- Not generic productivity (every feature addresses specific dysfunction)
- Not enterprise software (individual users only)
- Not a medical device (self-awareness only, no clinical recommendations)

---

## Why Rebuild Now?

Existing codebases in this repository (`innerscape-mobile`, `lifeos-backend`, `lifeos-design-system`) contain valuable learnings but were not built with the complete emotional context architecture or the full AI infrastructure described in this PRD. A clean-slate rebuild allows us to:

1. Implement the emotional context layer as foundational infrastructure, not an add-on
2. Design the AI engines as core architecture from day one
3. Apply lessons learned from previous iterations without technical debt
4. Ship a cohesive product that fully embodies the design principles

---

## Next Steps

Review this proposal, then proceed to `design.md` for technical architecture decisions and `tasks.md` for phased implementation plan.
