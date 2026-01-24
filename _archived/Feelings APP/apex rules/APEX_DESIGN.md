# APEX ENGINEERING RULES v4.3.0 — DESIGN
**Frontend Aesthetics & UI/UX Standards | January 2026**

---

## PHILOSOPHY: INTENTIONAL MAXIMALISM

The era of safe minimalism is over. 2026 is about **human craft over algorithmic sameness**.

| Principle | Meaning |
|-----------|---------|
| **Anti-Template** | If it looks like a generic template, redesign it |
| **Context-Driven** | Design matches project purpose, not trends |
| **Intentional** | Every element has a reason to exist |
| **Craft Signals** | Show human attention to detail |

---

## DESIGN PROCESS (MANDATORY)

Before ANY UI work:

1. **Define the vibe** — 3 words (e.g., "bold editorial warmth")
2. **Gather inspiration** — Awwwards, Mobbin, land-book
3. **Lock typography** — Pick fonts BEFORE anything else
4. **Set color tokens** — Define in CSS variables, not raw hex
5. **Motion budget** — Decide: subtle (0.15s), standard (0.3s), dramatic (0.5s+)

**Rule**: Never start coding UI without completing steps 1-4.

---

## TYPOGRAPHY

### The Rules

| Rule | Guideline |
|------|-----------|
| **Max 2 families** | One display, one body |
| **Ban generic fonts** | Inter, Roboto, Arial, system = BANNED as primary |
| **Variable fonts** | Preferred for flexibility (weight, width axes) |
| **Line height** | 1.4-1.6 for body (`leading-relaxed`) |
| **Never < 14px** | Minimum readable body size |

### Recommended Pairings (2026)

| Aesthetic | Display | Body |
|-----------|---------|------|
| Editorial | Fraunces, Playfair | Söhne, DM Sans |
| Tech/Modern | Cabinet Grotesk, Space Grotesk | Satoshi, General Sans |
| Luxury | Romie, Cormorant | Suisse Int'l, Graphik |
| Bold/Creative | Clash Display, Bebas Neue | Switzer, Outfit |
| Mono/Dev | JetBrains Mono | Geist, IBM Plex Sans |

### Type as Design Element

2026 trend: **Kinetic typography** — type as imagery, not just text.

- Oversized display type (hero sections)
- Animated text reveals
- Variable font animations
- Mixed weights in single headlines

---

## COLOR

### The System

| Component | Rule |
|-----------|------|
| **Total colors** | 3-5 maximum |
| **Structure** | 1 dominant + 1-2 accent + neutrals |
| **Contrast** | 4.5:1 text, 3:1 UI (WCAG AA minimum) |
| **Dark mode** | Design for both, test both |

### Context-Driven Palettes

| Project Type | Palette Direction |
|--------------|-------------------|
| Finance/Trust | Deep navy, warm neutrals, gold accent |
| Creative/Bold | Black + one electric accent (lime, coral, cyan) |
| Luxury | Rich blacks, subtle metallics, cream |
| SaaS/Product | Ink blue or charcoal + single vibrant CTA |
| E-commerce | Neutral base + brand color + urgency accent |
| Health/Wellness | Soft greens, warm whites, organic tones |

### What to Avoid

| Avoid | Why |
|-------|-----|
| Purple gradients on white | #1 "AI slop" indicator |
| Rainbow gradients | Looks cheap, no hierarchy |
| Neon on neon | Unreadable, eye strain |
| Gray-on-gray | Low energy, invisible CTAs |
| Opposing temperature gradients | Pink→green, orange→blue clash |

### Semantic Token Naming (Standard)

| Token | Purpose | Example Value |
|-------|---------|---------------|
| `--background` | Page/app background | `#ffffff` / `#0a0a0a` |
| `--foreground` | Primary text | `#1a1a2e` / `#fafafa` |
| `--primary` | Brand/action color | `#2563eb` |
| `--primary-foreground` | Text on primary | `#ffffff` |
| `--secondary` | Supporting actions | `#f1f5f9` |
| `--muted` | Subdued text/areas | `#6b7280` |
| `--muted-foreground` | Text on muted | `#71717a` |
| `--accent` | Highlights/focus | `#f1f5f9` |
| `--destructive` | Errors/delete | `#ef4444` |
| `--border` | Default borders | `#e5e7eb` |
| `--ring` | Focus rings | `#2563eb` |
| `--radius` | Border radius | `0.5rem` |

### Implementation

```css
/* Light mode */
:root {
  --background: #ffffff;
  --foreground: #0a0a0a;
  --primary: #1a1a2e;
  --primary-foreground: #fafafa;
  --muted: #f4f4f5;
  --muted-foreground: #71717a;
  --accent: #f4f4f5;
  --destructive: #ef4444;
  --border: #e4e4e7;
  --ring: #1a1a2e;
  --radius: 0.5rem;
}

/* Dark mode */
.dark {
  --background: #0a0a0a;
  --foreground: #fafafa;
  --primary: #fafafa;
  --primary-foreground: #1a1a2e;
  --muted: #27272a;
  --muted-foreground: #a1a1aa;
  --border: #27272a;
}
```

**Rule**: Never use raw hex in components. Always reference tokens.

---

## LAYOUT

### Hierarchy

1. **Flexbox** — default for most layouts
2. **CSS Grid** — only for true 2D layouts
3. **Never floats** — unless legacy requirement

### Spacing

| Use | Pattern |
|-----|---------|
| Scale | 4px base (4, 8, 12, 16, 24, 32, 48, 64) |
| Gap | Prefer `gap-*` over margin |
| Consistency | Same spacing system throughout |

### Responsive

- **Mobile-first** — design smallest, enhance up
- **Breakpoints** — sm (640), md (768), lg (1024), xl (1280), 2xl (1536)
- **Fluid where possible** — clamp(), min(), max()

---

## MOTION & ANIMATION

### Motion Budget

| Level | Duration | Use Case |
|-------|----------|----------|
| Subtle | 0.1-0.2s | Hovers, micro-interactions |
| Standard | 0.2-0.4s | Reveals, transitions |
| Dramatic | 0.4-0.8s | Hero animations, page transitions |

### Easing

| Easing | Use |
|--------|-----|
| `ease-out` | Enter animations |
| `ease-in` | Exit animations |
| `ease-in-out` | Position changes |
| `spring` | Playful, bouncy UI |

### 2026 Motion Trends

| Trend | Implementation |
|-------|----------------|
| Scroll-triggered reveals | Intersection Observer + fade/slide |
| Staggered animations | `animation-delay` on children |
| Magnetic cursors | Mouse proximity effects |
| Parallax (subtle) | Background layers at different speeds |
| View Transitions | Native browser API for page transitions |

### What to Avoid

- Motion for motion's sake
- Blocking animations (user waits)
- Disabling reduced-motion preference
- Competing animations

```css
/* Always respect user preference */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## DEPTH & TEXTURE

### Layering Techniques

| Technique | Use |
|-----------|-----|
| **Elevation/Shadow** | Cards, modals, dropdowns |
| **Glassmorphism** | Overlays, navigation (use sparingly) |
| **Grain/Noise** | Backgrounds, hero sections |
| **Gradients** | Backgrounds only, subtle |

### Shadow Scale

```css
--shadow-sm: 0 1px 2px rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px rgb(0 0 0 / 0.15);
```

---

## COMPONENTS

### Component Rules

| Rule | Guideline |
|------|-----------|
| **Use existing** | Check shadcn/ui, Radix, Headless UI first |
| **No custom modals** | Use library dialogs |
| **Consistent variants** | Define sizes, states upfront |
| **Composition** | Small, composable > large monolithic |

### State Design

Every interactive component needs:
- Default
- Hover
- Focus (visible ring)
- Active/Pressed
- Disabled
- Loading (if async)
- Error (if input)

---

## ACCESSIBILITY

### Minimum Requirements (WCAG AA)

| Area | Requirement |
|------|-------------|
| **Color contrast** | 4.5:1 text, 3:1 UI elements |
| **Focus visible** | Clear ring on all interactive |
| **Keyboard nav** | Full functionality without mouse |
| **Screen reader** | Semantic HTML, ARIA when needed |
| **Labels** | All inputs labeled |
| **Alt text** | All meaningful images |

### Quick Wins

```jsx
// Focus ring
focus:ring-2 focus:ring-offset-2 focus:ring-primary

// Screen reader only
<span className="sr-only">Close menu</span>

// Semantic HTML
<nav>, <main>, <article>, <aside>, <header>, <footer>
```

---

## IMAGES & ASSETS

### Format Selection

| Format | Use Case |
|--------|----------|
| WebP | Photos, complex images |
| AVIF | Next-gen (check support) |
| SVG | Icons, logos, illustrations |
| PNG | Transparency needed, simple graphics |

### Performance

| Rule | Implementation |
|------|----------------|
| Lazy load | `loading="lazy"` below fold |
| Responsive | `srcset` + `sizes` |
| Placeholder | Blur-up or LQIP |
| CDN | Always serve from CDN |

---

## PERFORMANCE BUDGETS

### Core Web Vitals (2026)

| Metric | Target | Limit |
|--------|--------|-------|
| LCP | < 2.0s | < 2.5s |
| INP | < 150ms | < 200ms |
| CLS | < 0.05 | < 0.1 |
| TTFB | < 200ms | < 400ms |
| TBT | < 150ms | < 200ms |

### Bundle Budgets

| Type | Target |
|------|--------|
| Initial JS | < 100KB (compressed) |
| Total JS | < 300KB (compressed) |
| CSS | < 50KB |
| Largest image | < 200KB |

---

## ANTI-PATTERNS (NEVER DO)

| Anti-Pattern | Why |
|--------------|-----|
| Generic gradient backgrounds | AI slop indicator |
| Stock photo grids | Feels corporate, soulless |
| Decorative blobs/shapes | Meaningless visual noise |
| Carousel as default | Low engagement, accessibility issues |
| Infinite scroll everywhere | Frustrating, no sense of progress |
| Modal on page load | Hostile UX |
| Auto-playing video with sound | Instant bounce |
| Text over busy images | Unreadable |

---

## VERIFICATION CHECKLIST

Before shipping any UI:

```
□ Typography locked (max 2 families, no banned fonts)
□ Color tokens defined (3-5 colors, CSS variables)
□ Contrast verified (4.5:1 text, 3:1 UI)
□ Motion respects prefers-reduced-motion
□ Keyboard navigation works
□ Focus states visible
□ Core Web Vitals within budget
□ Tested on mobile viewport
□ Dark mode works (if applicable)
□ Doesn't look like a template
```

---

*APEX v4.3.0 Design — 2026 standards for intentional, craft-driven UI. See APEX_CORE.md for fundamentals.*
