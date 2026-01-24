# Innerscape Brand Guidelines

**Version**: 1.0.0 | **Date**: January 24, 2026

## Core Brand Identity

Innerscape is a suite of tools for self-awareness, depth, and intentional action.

### Color Palette

| App | Color | Hex | Role |
|-----|-------|-----|------|
| **Soma** | Purple | `#8B5CF6` | Body awareness, check-ins |
| **Mind** | Indigo | `#4F46E5` | Thought capture, Second Brain |
| **Flow** | Amber | `#F59E0B` | Habits, routines, action |
| **Pulse** | Green | `#22C55E` | Health, energy, vitality |
| **Hub** | Blue | `#3B82F6` | Overview, command center |

### Typography

- **Headings**: Outfit (300 Weight for Elegance)
- **Body**: Satoshi (Standard Sans-Serif)
- **Code**: Space Mono

### Iconography

- Use **Lucide** icons throughout the suite.
- Stroke weight: `2px`
- Size: `24px` for primary nav, `20px` for UI actions.

### Design Tokens

All design tokens are managed in `lifeos-design-system/tokens/`.
Build outputs are generated for CSS, SCSS, and JavaScript.

## App Shell Experience

### Mobile (Soma & Mobile)

- **Universal Header**: Consistent app-switching and emotional context.
- **Deep Linking**: `innerscape://[app]/[route]`
- **Native Data Sharing**: iOS App Groups for zero-network sync of emotional state.

### Web (Second Brain)

- **Universal Nav**: Top-bar navigation between modules.
- **Micro-Frontend**: Module Federation architecture for independent module deployment.
