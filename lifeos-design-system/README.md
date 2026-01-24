# LifeOS Design System

Shared design tokens and assets for all LifeOS applications.

## Overview

This package uses [Style Dictionary](https://amzn.github.io/style-dictionary/) to transform design tokens into platform-specific formats for Flutter, React, React Native, and CSS.

## Structure

```
lifeos-design-system/
├── tokens/
│   ├── colors.json        # Color palette
│   ├── typography.json    # Font definitions
│   └── spacing.json       # Spacing scale
├── build/                 # Generated outputs (gitignored)
│   ├── flutter/           # Dart constants
│   ├── react/             # TypeScript exports
│   ├── tailwind/          # Tailwind config
│   └── css/               # CSS custom properties
├── assets/
│   ├── icons/             # App icons
│   └── logos/             # Brand logos
└── package.json
```

## Usage

```bash
# Install dependencies
npm install

# Build all platform outputs
npm run build

# Watch for changes
npm run watch
```

## Consuming Tokens

### Flutter (Feelings APP)
```dart
import 'package:lifeos_design_system/colors.dart';

Container(color: LifeOSColors.primary)
```

### React / Next.js (Second Brain Web)
```tsx
import { colors } from '@lifeos/design-system';

<div style={{ color: colors.primary }} />
```

### React Native (Mobile Apps)
```tsx
import { colors } from '@lifeos/design-system/native';

<View style={{ backgroundColor: colors.surface.card }} />
```

### CSS
```css
@import '@lifeos/design-system/css/variables.css';

.card {
  background: var(--color-surface-card);
}
```

## Branding Options

This design system supports multiple branding directions. See the tokens files for the current implementation. Branding can be switched by updating the token values.

**Current Options Under Consideration**:
- Innerscape (recommended)
- Pulse
- Nous
- Meridian
- Aware

See [LIFEOS_SUITE_PLAN.md](../Feelings%20APP/LIFEOS_SUITE_PLAN.md) for full branding details.

---

> This folder structure will be populated during Phase 0 of the LifeOS Suite implementation.
