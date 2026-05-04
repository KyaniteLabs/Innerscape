# Proposal: Innerscape Rebuild

## Executive Summary

We are building **Innerscape** — an executive prosthetic for neurodivergent users (ADHD, autism, AuDHD). This is not a productivity app; it is a cognitive environment that replaces degraded executive functions: working memory, task switching, temporal awareness, and emotional regulation.

This is both a learning vehicle for agentic SDLC workflows and a real product intended to ship. The rebuild takes a clean-slate approach — new stack, new architecture, no carryover from the existing codebase. The existing TypeScript code (`innerscape-mobile`, `lifeos-backend`, `lifeos-design-system`) serves as reference for product learnings only.

---

## The Problem

Neurodivergent users experience chronic executive dysfunction that standard productivity tools cannot address:

1. **Capture friction** — Thoughts escape faster than traditional apps can record them. Working memory decays in seconds.
2. **Out-of-sight, out-of-mind** — Filed information becomes invisible to the ADHD brain. Traditional organization creates invisibility.
3. **No dopamine feedback** — Task completion produces no neurochemical reward. Without it, sustained engagement is biologically impossible for ADHD users.
4. **Environmental blindness** — Physical clutter accumulates invisibly. Interoceptive awareness (reading body signals) is impaired. The connection between environment, body, and emotional state goes unperceived.

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
- **Declutter sprints** — 10-minute timed habit with streak tracking. Each completed sprint triggers a celebration. Weekly goal: "Declutter 1 space."
- **Trade marketplace** (post-launch) — Barter/trade items cleared during declutter sprints. Credit system, reputation, matching.

### Body Module — Somatic & Health Awareness
- 5-step guided body check-in (<90 seconds)
- Personal somatic dictionary (AI learns sensation→emotion mappings)
- Energy tracking with crash prediction
- Sleep logging (manual + Apple Health/Google Fit integration)
- Passive health metrics collection (HRV, steps, heart rate)
- **Space Scan** — Photo a cluttered space → AI detects items → rapid keep/donate/trash/sell decisions in a 10-minute timed sprint. Before/after photos tracked per space over time. Clutter levels correlated with emotional state.
- **Environment analytics** — Clutter trends per space, items cleared, emotional impact of tidy vs. cluttered spaces

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

## Resolved Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Platform priority | **Mobile first** | The product needs capture throughout the day — emotional check-ins, space scans, quick thoughts. You can't do that from a laptop. Web shell comes later for deep analytics. |
| AI model strategy | **Hybrid** | On-device classification (fast, private, works offline). Cloud LLM for insights/chat/RAG (needs reasoning power that small models can't provide). Standard pattern as of 2026. |
| Monetization | **Freemium** | Free tier with limited AI insights per week. Premium for unlimited insights, advanced analytics, chat. No ads (violates "calm technology" principle). |
| Health integration | **Read-only** | Pull data from Apple Health / Health Connect. Never write back. Manual entry as fallback. Keeps the app in "self-awareness" territory, not "medical device." |
| Social features | **No** | Private cognitive space. Maybe an optional accountability partner feature post-launch if users ask for it. Default is solo. |

---

## Target Users

### Primary: Simon (AuDHD, building for self first)
- Combined ADHD + autism traits. Hyperfocuses for hours then crashes for days.
- Has tried Notion, Todoist, Apple Notes, Google Keep — all abandoned within weeks.
- Physical workspace cycles between pristine and chaos with no in-between.
- Struggles to perceive body signals until burnout hits.
- Needs: a system that works even when he doesn't use it consistently, captures faster than thoughts escape, and makes the invisible (patterns, body signals, clutter) visible.

### Secondary: Alex (ADHD, 20s-30s, tech-adjacent)
- Constantly starting projects they never finish. 47 open browser tabs. 3 abandoned to-do apps.
- Forgets to eat. Cannot estimate how long anything takes. Loses track of time.
- Needs: capture that's faster than the thought escaping, visual streaks for dopamine, a system that degrades gracefully during weeks of non-use.

### Tertiary: Sam (Autistic, 30s, detail-oriented)
- Meticulous about structure but overwhelmed by unstructured information.
- Has elaborate Notion setups that collapsed under their own complexity.
- Cannot tell when stressed until physically burned out. Interoception is impaired.
- Needs: AI-driven pattern detection for self-awareness, predictable structure that doesn't require manual maintenance, body awareness tools that build interoceptive vocabulary over time.

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

## Business Value Analysis

### Who Benefits and How
| Beneficiary | How They Benefit | Value Type |
|-------------|-----------------|------------|
| Primary user (neurodivergent individual) | Regains executive function capacity. Stops losing thoughts, forgetting tasks, and burning out from invisible stress. | Direct personal utility |
| User's support network (partners, family, therapists) | Gets a window into the user's patterns that the user themselves cannot perceive. Therapist can review emotional timelines. | Indirect, via user's wellbeing |
| Future users in the neurodivergent community | A tool built *for* them, not adapted *to* them. Not an afterthought. | Community / mission |

### What Problem It Solves (The "Why")
Standard productivity tools (Notion, Todoist, Apple Notes) presume intact executive function. They assume you remember to check your to-do list, can categorize a note without friction, and feel rewarded when you complete a task. For neurodivergent users, these assumptions collapse. Innerscape replaces the executive functions that are degraded, not the user.

### Priority by Value Delivered (Not Technical Interest)
| Priority | Feature | Why It's Prioritized |
|----------|---------|---------------------|
| P0 (Critical) | Emotional check-in + context system | This is the core differentiator. Without it, Innerscape is just another app. The context layer makes everything else work. |
| P0 (Critical) | Sub-2-second capture | If capture has friction, the product fails on first use. Non-negotiable. |
| P1 (High) | Habit tracking + celebrations | Provides the dopamine feedback loop that sustains engagement. Without it, users churn in days. |
| P1 (High) | AI insight engine (even rule-based) | Makes invisible patterns visible. This is the "aha moment" that creates retention. |
| P2 (Medium) | Journal + prompts | Deepens self-awareness but requires more user investment. Second-wave engagement. |
| P2 (Medium) | Space scan + declutter sprints | Extends value into physical environment. High emotional impact but complex to build. |
| P3 (Lower) | Trade marketplace | Nice-to-have for the declutter flow. Doesn't affect core value proposition. Post-launch. |
| P3 (Lower) | AI assistant / chat | Powerful but expensive to build and run. Can be premium-only later. |

### What Happens If We Don't Build This
- Neurodivergent users continue cycling through productivity apps, each abandoned after 2-6 weeks.
- The "executive prosthetic" category remains unfilled. No one is building this.
- Existing solutions (Notion templates, habit trackers, therapy apps) each address one symptom but none address the systemic executive dysfunction.
- The user's environment, emotional patterns, and health data remain disconnected — no correlation, no insight, no action.

### Success Metrics — How We'll Know It's Working
| Category | Metric | Target | Why This Metric |
|----------|--------|--------|-----------------|
| Engagement | Daily check-ins | 3+ per day | Proves the capture flow is fast enough and the habit is forming |
| Engagement | 7-day retention | >60% | Industry average for health/wellness apps is ~25%. 60% proves we're solving a real problem |
| Engagement | Sessions per day | >4 | Indicates habitual use, not novelty |
| Effectiveness | Self-reported clarity | 7/10+ | Direct measure of whether insights are landing |
| Effectiveness | Goal completion | 50% | Proves the action system works, not just the awareness system |
| Effectiveness | Insight utilization | 30% acted upon | Measures whether AI insights drive behavior change |
| Cognitive Load | Capture time | <2 seconds | The foundational constraint. Everything else depends on this. |
| Cognitive Load | Time to first value | <5 seconds | New session → useful information in under 5 seconds |
| Cognitive Load | Feature discovery | >70% without tutorials | If users need a manual, the design has failed |

---

## Constraints

- **Privacy absolute** — All emotional/health data on-device by default; optional E2E encrypted cloud sync
- **Offline-first** — Full functionality without internet; sync when connected
- **Accessible** — WCAG AA minimum, dyslexia fonts, high-contrast, reduced-motion, screen reader compatible
- **Calm technology** — No dark patterns, no engagement hacking, no notification spam
- **Clean slate** — New stack, new repo structure, no carryover from existing codebases. Old code is reference only.

---

## What This Is Not

- Not a therapy tool (no diagnosis/treatment)
- Not a social platform (private cognitive space)
- Not generic productivity (every feature addresses specific dysfunction)
- Not enterprise software (individual users only)
- Not a medical device (self-awareness only, no clinical recommendations)

---

## Next Steps

Review this proposal, then proceed to `design.md` for technical architecture decisions and `tasks.md` for phased implementation plan.
