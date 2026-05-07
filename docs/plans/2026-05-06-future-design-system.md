# Innerscape Future Design System — May 2026

## Product truth
Innerscape is an executive prosthetic for ADHD/autistic users. The interface must reduce recall burden, lower shame, expose the next tiny action, and make emotional/body/context signals visible without turning the product into a childish tracker.

## Design position
**Cognitive cockpit, not wellness dashboard.** A dark, quiet control surface with precise bioluminescent signals. The app should feel like a personal cognitive environment that protects attention and brings the user's state, memory, and next action into view.

## System rules
1. **Capacity first:** every screen starts with state, next action, or a stabilizing prompt.
2. **Three choices max at primary decision points:** avoid overwhelm and option sprawl.
3. **No toy color blocks:** module colors are signals, not full-card paint buckets.
4. **No shame language:** copy observes and supports.
5. **Frictionless capture remains sacred:** Hub/capture language stays prominent.
6. **Future without slop:** no random gradients, glassmorphism overload, or emoji-first identity.

## Tokens
- Base: obsidian / deep ink / graphite layers.
- Signal: neuro cyan primary, violet mind, amber flow, rose body, blue hub.
- Surfaces: quiet panels with hairline borders and subtle glow.
- Type: high contrast headings, compact metadata, generous line-height.
- Shape: large calm radii, pill controls, card hierarchy.

## Visible implementation scope
- Central token system in `apps/mobile/lib/theme.ts`.
- Shared primitives in `apps/mobile/components/design/System.tsx`.
- Home rebuilt as a cognitive cockpit.
- Check-in rebuilt as a capacity scan.
- Tab chrome redesigned to match the system.
- Existing screens inherit improved cards, colors, borders, typography through the token layer.
