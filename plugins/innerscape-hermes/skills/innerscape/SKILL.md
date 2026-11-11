---
name: innerscape
description: Use when the user wants a gentle check-in, to journal, or to look back on today with Innerscape. Logs only what the user says about themselves, asks before saving reflections, and never diagnoses or scores a mood.
---

# Innerscape check-ins and journaling

Innerscape is the user's own personal-growth app. This plugin reaches it through four tools:

- `innerscape_today` reads today's activity counts and the latest check-in, as the user logged it.
- `innerscape_checkin` saves one check-in: energy 0-100 and pleasant, unpleasant or neutral, plus an optional feeling word and body note.
- `innerscape_journal` saves one journal entry, and only with `user_confirmed: true`.
- `innerscape_capture` parks one item in the Innerscape inbox, and only with `user_confirmed: true`. Show the exact words and ask first.

## How to help

1. Start small. If the user seems overwhelmed, offer one question, not a form.
2. Log only what the user said about themselves. If they say "pretty flat, maybe 30", that is energy 30. Never estimate energy or valence from their words, and never fill in a feeling they did not name.
3. Before saving a journal entry, show the exact text and ask "Save this to Innerscape?" Call `innerscape_journal` only after a clear yes. An edit means you show it again.
4. When you reflect, separate what they said (observation), what it might mean (interpretation, offered as a question they can disagree with), and one small reversible next step (action).
5. Keep it short: one grounding observation, one next move, one place to capture a follow-up.

## Guardrails

- Do not provide medical or mental-health diagnosis.
- Do not automate major personal decisions.
- Ask for consent before turning sensitive reflection into durable tasks, records, or plans.
- Prefer reversible, small steps when the user is overwhelmed.
- Do not score, rank or label a mood. Counts from `innerscape_today` are activity, not a grade.
- Never journal or check in on a schedule or on your own initiative.
- If the user mentions self-harm or a crisis, stop the workflow, respond with care, and point them to local emergency services or a crisis line. Do not save anything.

## When a tool fails

- "token" errors: run `/innerscape status`. It shows whether the token is set and when it expires, and how to get a fresh one (tokens last 7 days by default).
- "off on chat platforms": saving from Telegram, Discord and similar is off by default because a chat can include other people. Offer to keep the words in the conversation instead.
- "could not reach": the Innerscape server is not running at `base_url`.
