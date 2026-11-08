# Innerscape

A self-hosted personal-growth workspace for recording inner state and turning it into small reflective actions: journal/check in, notice patterns, manage habits/goals/tasks, log sleep/body context, and review captured projects/knowledge. It is not clinical diagnosis or autonomous major-life decision making.

## Implemented surfaces

- Expo/React Native app with Home, Mind, Flow, Body and Hub routes, state-aware design profiles and accessibility/preferences controls.
- Fastify/PostgreSQL backend for accounts, journals/emotions, habits/goals/tasks, sleep/somatic/space records, PARA-style capture/reviews, decluttering and trade/listings.
- Rule-based insight generation from recent check-ins, sleep, habits and journaling frequency. The inspected insight service does not call a language model, despite “AI insights” wording elsewhere.
- Separate image/clutter analysis supports mock (default), OpenAI-compatible or Anthropic providers; external results/value estimates are not validated valuations.
- CLI/MCP/skill provide project/module descriptions and bounded planning prompts. They are not account-data clients or automatic journal/goal mutation tools.

Prisma models/shared types are product data contracts, not a bundled user-outcome dataset. Sensitive personal records belong to the deployment's database, not these docs.

## Proof and limits

Actual CLI plan and pure helper assertions passed (five module entries, guardrail, supplied focus). Backend registrations, journal ownership filters, Prisma schema, mobile home/API/token storage and analysis services were read. No database migration/test deletion, real account, journal, image, provider request or mobile/operator session was exercised; no screenshot-backed mobile acceptance or clinical efficacy is claimed.

Self-hosted is not automatically private: deployed database/auth/CORS/transport and optional outbound image analysis need review. See [ARCHITECTURE.md](ARCHITECTURE.md) and [README.md](README.md).
