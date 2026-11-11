# Innerscape design preflight

This file records why the Innerscape mark looks the way it does. Read it before changing any Innerscape identity asset.

## 1. Purpose

Innerscape is a self-hosted personal growth OS built neurodivergent-first. It covers journaling, emotional check-ins, habits, body and sleep logs, and a PARA-style hub. The user's outcome: stay steady through fluctuating capacity, and always know the next action. The Coach (formerly Unstuck Coach) is a feature inside Innerscape, not a separate mark.

## 2. Title ↔ stone ↔ purpose

| Element | Choice | Evidence class |
|---|---|---|
| Object | A cairn of tumbled stones: balance built one stone at a time, like an inner landscape kept steady | Product fit (our metaphor); Simon approved the cairn 2026-10-26 ("innerscape A approved") and the v2 render 2026-11-10 |
| Cap stone | Amethyst | Approved render (v2, "amethyst cap") |
| Body stones | Base to top: pink, then pale banded grey-white, then banded blue | **Assumption:** read visually from the approved render as rose quartz, a satin grey-white stone and blue lace agate. Simon has not named them; confirm before writing stone claims in copy. |

## 3. Rejected metaphors

- The earlier cairn render: Simon (2026-10-27) said it "needs more craft and craftsmanship, it looks cheap".
- Opaque RGB tile with no alpha: the icon must be transparent.
- A separate Coach mark: dropped, because the Coach is a feature of Innerscape.

## 4. Material reference

Tumbled, satin-polished stones with natural banding and clouding; never glass, plastic or wet gloss. Brand law: `kyanite-icon-eye-gate/references/material-realism.md`. Approved render: eye-gate v4, Innerscape A (v2 cairn).

## 5. Family icon law and form

One hero object, centred at about 80% fill, three-quarter light from the upper left, transparent background. The adaptive Android foreground keeps the cairn inside the safe zone on `#08110E`.

## 6. Typography

The lockup Simon approved on 2026-11-10 is Chakra Petch Bold 700 uppercase for the wordmark, with Medium 500 for "by KyaniteLabs". Glyphs are unmodified and use native kerning. On dark backgrounds only the ink is inverted. The OFL licence ships in `branding/CHAKRA-PETCH-OFL.txt`.

## 7. Platform conventions

| Surface | File |
|---|---|
| Expo icon (iOS) | `apps/mobile/assets/icon.png` 1024² RGB (Apple rejects alpha in app icons) |
| Android adaptive foreground | `apps/mobile/assets/adaptive-icon.png` 1024² RGBA, background `#08110E` |
| Web favicon | `apps/mobile/assets/favicon.png` 48² |
| PWA manifest | `apps/mobile/public/icon-192.png`, `icon-512.png` |
| README hero | `branding/innerscape-lockup-transparent-{light,dark}-ink.png` via `<picture>` |

## 8. UI colour

Background `#08110E` and theme `#A8F0C6` are unchanged from `app.config.ts`.

## 9. Hermes Desktop page (added 2026-11-11)

The Hermes plugin ships a Desktop half (`plugins/innerscape-hermes/desktop/plugin.js`): one page at `/innerscape`, a sidebar entry, an optional status-bar chip and four command-palette entries.

| Element | Choice | Evidence class |
|---|---|---|
| Ground | One fixed mode on the Hush Garden surface: background `#08110E`, card `#13241D`, raised `#1B3027` | `apps/mobile/lib/theme.ts` (Hush Garden is the app's decompression archetype); §8 background |
| Text | Primary `#F3FFF7`, secondary `#CDE8D7`, muted `#95B8A4` | Same file; every pair measured at WCAG AA or better on the card |
| Accent | `#A8F0C6` for focus and the primary button, ink `#07120E` on it | §8 theme colour; Hush Garden `inverse` |
| Mark | The approved cairn render, downscaled from `branding/innerscape-512.png` and embedded | §2, §5. Never redrawn as an SVG |
| Type | Chakra Petch Bold 700 for the wordmark and section titles, Medium 500 for labels; body text in the host sans | §6 lockup law; subset woff embedded, OFL text in `branding/` |
| States | Pleasant, neutral and unpleasant are words on equal-weight controls with no colour coding, no emoji and no score | Product rule: the plugin never scores, labels or diagnoses a mood |

Platform conventions: the Desktop plugin SDK (`desktop-plugin-sdk.md`) and catalog rule 8. Plain ESM, imports only `@hermes/plugin-sdk` and React, SDK components (`Button`, `Input`, `Textarea`, `SegmentedControl`, `ConfirmDialog`), CSS scoped under `.isc` and removed on dispose. Reference packages: Selenite and TasteCheck.

Not used: brown, orange or amber anywhere; the "walnut" lockup; red for "unpleasant".

**Unstuck Coach card (added 2026-11-11).** The Coach is a feature inside Innerscape, not a separate mark, so its card uses the same ground, card surface, text tokens, accent button and Chakra Petch section title as the rest of the page. No new colour, icon or illustration. It sits right under Today because being stuck is the moment someone opens the page with the least capacity. It explains itself in one line, takes free text, and hands off to a new chat with the note drafted and unsent; the button reads "Get unstuck", not a stance menu.

**Assumption:** a fixed dark ground reads well inside a light Desktop theme. Selenite took the same route (one fixed ground) after an owner correction; Simon's eye-gate confirms it.
