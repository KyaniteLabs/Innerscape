# Innerscape architecture

```text
Expo routes/components -> query hooks -> mobile API client + bearer token
 -> Fastify routes -> JWT middleware/Zod -> Prisma -> PostgreSQL
recent user records -> deterministic insight rules -> insight candidates
room image -> configured vision provider (mock by default) -> parsed item estimates
CLI/MCP -> static brief/module map/planning prompts (separate from user-record API)
```

[server.ts](apps/backend/src/server.ts) registers module routes, CORS/rate limits and error handling, then listens on all interfaces; importing that entrypoint starts a listener. [Prisma schema](apps/backend/prisma/schema.prisma) owns relational user records/preferences and cascades. [Journal routes](apps/backend/src/routes/journal.ts) validate input, attach authenticated user IDs and scope record lookup; this example is not a full tenant-isolation audit.

[Mobile API](apps/mobile/lib/api.ts) selects an environment/default backend URL and attaches bearer tokens. Native tokens use Expo SecureStore; web uses localStorage. Mobile home composes check-in/review hooks and need-state/design controls. Shared types connect contracts but do not enforce authorization by themselves.

[Insights](apps/backend/src/services/insights.ts) query recent per-user records and apply heuristic thresholds/correlations. [Vision](apps/backend/src/services/vision-analysis.ts) separately reads an image into a data URI, calls a selected provider or mock, and parses estimated items. [CLI](tools/innerscape-cli.mjs) only emits descriptive JSON/prompts; it does not execute plans or fetch journals.

## Risk / failure boundaries

- Journals, body/emotion/sleep records and room images are sensitive. External vision providers can receive image content and incur cost; mock output is not observed analysis. Insight confidence numbers are heuristic, not clinical evidence.
- JWT, ownership filters, validation, web token storage, permissive CORS and all-interface binding need deployment-specific access/transport review. Health metadata alone does not prove database or user isolation.
- Schema migrations, cascading deletes and integration fixtures can destroy records; never run them against a real profile to manufacture proof. Back up/review changes separately.
- Mobile localhost defaults do not reach the server from every device; auth/network/query errors can leave views empty. CLI prompt success says nothing about mobile persistence, accessibility or lived user outcomes.

## Docs verification

Read purpose/rules and actual backend entry/journal/insight/vision/schema, mobile home/API and CLI source. Ran actual CLI plan and pure helper assertions only. No dependency build, DB/deletion suite, provider/model, account or native/mobile recording; acceptance remains unverified. Runtime unchanged; rollback is reverting these docs.
