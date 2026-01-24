# PRD: Innerscape Suite Foundation (Phase 0)

## Introduction
Establish the foundational infrastructure for the Innerscape Suite, ensuring cross-platform compatibility, centralized design tokens, and a shared type system. This phase sets the stage for rapid, consistent development across Flutter, React Native, and Next.js.

## Goals
- **Unified Types**: Single source of truth for all domain models and API contracts.
- **Design Consistency**: Automated token transformation for all platforms.
- **Backend Readiness**: Edge-ready API skeleton with database schema defined.
- **Mobile Infrastructure**: Expo monorepo/app structure ready for feature development.

## User Stories

### US-001: Shared Type System (`lifeos-shared`)
**Description**: As a developer, I want a single package for all TypeScript types so that I have consistent models across backend, web, and mobile.

**Acceptance Criteria**:
- [x] `package.json` and `tsconfig.json` initialized.
- [ ] Comprehensive types for: Feelings, Brain, Habits, Insights, Sync.
- [ ] Exported via a single index file.
- [ ] `npm run build` passes.

---

### US-002: Design Token System (`lifeos-design-system`)
**Description**: As a designer/developer, I want centralized design tokens that can be used by Flutter, React Native, and Web.

**Acceptance Criteria**:
- [x] Style Dictionary configured.
- [x] Color, Typography, and Spacing tokens defined.
- [ ] **[APEX Alignment]** Use non-generic fonts (Outfit + Satoshi/General Sans).
- [ ] Tokens transform successfully to JS, SCSS, and Dart.

---

### US-003: Backend Core Skeleton (`lifeos-backend`)
**Description**: As a backend developer, I want a scalable API skeleton that follows APEX standards for logging and error handling.

**Acceptance Criteria**:
- [x] Hono app initialized for Cloudflare Workers.
- [x] Drizzle ORM configured with Turso schema.
- [ ] Standardized APEX logging middleware (`[APEX]` prefix).
- [ ] Standardized REST error format.
- [ ] `wrangler dev` runs without errors.

---

### US-004: Mobile App Scaffolding (`innerscape-mobile`)
**Description**: As a mobile developer, I want an Expo app with file-based routing and shared library setup.

**Acceptance Criteria**:
- [ ] Expo SDK 52+ initialized.
- [ ] Expo Router configured with (tabs) structure.
- [ ] Tailwind (NativeWind) or standard CSS-in-JS configured.
- [ ] Shared components and lib directories created.
- [ ] `npm run ios` / `android` starts the app.

---

## Functional Requirements
- **FR-1**: Shared types must be published or linked locally for use in other packages.
- **FR-2**: Design tokens must generate a `style_dictionary.dart` file for Flutter.
- **FR-3**: Backend must include CORS middleware and Clerk auth skeleton.
- **FR-4**: Mobile app must include placeholders for all 4 main tabs (Mind, Flow, Pulse, Hub).

## Non-Goals
- No actual feature implementation (e.g., body scan logic, habit streaks).
- No production deployment (staging/prod envs).
- No complex AI prompt engineering in this phase.

## Technical Considerations
- **Architecture**: Monorepo-like structure but independent packages.
- **Language**: TypeScript (Node 20+) across all TS projects.
- **Edge Runtime**: Backend must remain compatible with Cloudflare Workers (no Node-only modules).

## Success Metrics
- 0 type errors across all packages.
- Design tokens successfully used in one React Native component.
- Backend API responds with standardized error format on 404.
