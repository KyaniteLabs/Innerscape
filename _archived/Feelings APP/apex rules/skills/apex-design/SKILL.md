---
name: apex-design
description: >
  2026 frontend aesthetics and UI/UX standards with Intentional Maximalism
  philosophy. Use when working on UI, frontend, design system, CSS, components,
  styling, color tokens, typography, layout, animation, accessibility, or
  visual design tasks. Covers typography, color systems, motion, and Core Web Vitals.
license: Apache-2.0
compatibility: Claude Code, Cursor, VS Code, GitHub Copilot
metadata:
  author: apex
  version: "4.1"
  updated: "2026-01"
---

# Frontend Design Standards

## TL;DR

**Philosophy**: The era of safe minimalism is over. 2026 is about **human craft over algorithmic sameness**.

---

## PHILOSOPHY: INTENTIONAL MAXIMALISM

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

### Rules

| Rule | Guideline |
|------|-----------|
| **Max 2 families** | One display, one body |
| **Ban generic fonts** | Inter, Roboto, Arial = BANNED as primary |
| **Variable fonts** | Preferred for flexibility |
| **Line height** | 1.4-1.6 for body |
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

2026 trend: **Kinetic typography** — type as imagery.

- Oversized display type (hero sections)
- Animated text reveals
- Variable font animations
- Mixed weights in single headlines

---

## COLOR

### System

| Component | Rule |
|-----------|------|
| **Total colors** | 3-5 maximum |
| **Structure** | 1 dominant + 1-2 accent + neutrals |
| **Contrast** | 4.5:1 text, 3:1 UI (WCAG AA) |
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

### Semantic Token Naming

| Token | Purpose |
|-------|---------|
| `--background` | Page/app background |
| `--foreground` | Primary text |
| `--primary` | Brand/action color |
| `--primary-foreground` | Text on primary |
| `--secondary` | Supporting actions |
| `--muted` | Subdued text/areas |
| `--muted-foreground` | Text on muted |
| `--accent` | Highlights/focus |
| `--destructive` | Errors/delete |
| `--border` | Default borders |
| `--ring` | Focus rings |
| `--radius` | Border radius |

### Implementation

```css
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
3. **Never floats** — unless legacy

### Spacing

| Use | Pattern |
|-----|---------|
| Scale | 4px base (4, 8, 12, 16, 24, 32, 48, 64) |
| Gap | Prefer `gap-*` over margin |
| Consistency | Same spacing system throughout |

### Responsive

- **Mobile-first** — design smallest, enhance up
- **Breakpoints** — sm (640), md (768), lg (1024), xl (1280), 2xl (1536)
- **Fluid** — clamp(), min(), max()

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
| View Transitions | Native browser API |

### Respect Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## DEPTH & TEXTURE

### Techniques

| Technique | Use |
|-----------|-----|
| **Elevation/Shadow** | Cards, modals, dropdowns |
| **Glassmorphism** | Overlays, navigation (sparingly) |
| **Grain/Noise** | Backgrounds, hero sections |
| **Gradients** | Backgrounds only, subtle |

### Shadow Scale

```css
--shadow-sm: 0 1px 2px rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px rgb(0 0 0 / 0.15);
```

### Tactile & 3D Elements (2026 Trend)

Flat design is evolving. 2026 embraces **tactile maximalism** — UI elements that feel physical.

| Technique | Use Case | Implementation |
|-----------|----------|----------------|
| **Squishy buttons** | Primary CTAs | Scale + shadow on press |
| **Clay morphism** | Cards, badges | Soft shadows, subtle 3D |
| **Inflatable UI** | Hero elements | Rounded corners, depth gradients |
| **Responsive 3D** | Interactive elements | Transform on hover/press |

```css
/* Tactile button example */
.btn-tactile {
  background: linear-gradient(145deg, #f0f0f0, #cacaca);
  box-shadow: 
    5px 5px 10px #bebebe,
    -5px -5px 10px #ffffff;
  border-radius: 12px;
  transition: all 0.15s ease-out;
}

.btn-tactile:hover {
  transform: translateY(-2px);
  box-shadow: 
    7px 7px 14px #bebebe,
    -7px -7px 14px #ffffff;
}

.btn-tactile:active {
  transform: translateY(1px) scale(0.98);
  box-shadow: 
    3px 3px 6px #bebebe,
    -3px -3px 6px #ffffff;
}
```

**Rule**: Use tactile elements sparingly for emphasis. Not every button needs to be squishy.

---

## AI-DRIVEN PERSONALIZATION

AI personalization can lift conversion rates by up to 40% when done well.

| Pattern | Use Case | Caution |
|---------|----------|---------|
| **Predictive navigation** | Show likely next actions | Don't be creepy |
| **Adaptive layouts** | Adjust to user behavior | Maintain consistency |
| **Smart defaults** | Pre-fill based on history | Always allow override |
| **Contextual help** | Surface relevant docs | Don't interrupt flow |

### Implementation Guidelines

1. **Genuine utility over novelty** — AI features should solve real problems
2. **Transparency** — Users should understand why they're seeing something
3. **Graceful fallback** — Works without AI, enhanced with it
4. **Privacy-first** — Local preferences over cloud tracking when possible

```jsx
// Example: Smart default with override
function SmartDatePicker({ userId }) {
  const [date, setDate] = useState(null);
  const suggestion = useAIPrediction('preferred_date', userId);
  
  return (
    <DatePicker
      value={date}
      onChange={setDate}
      placeholder={suggestion ? `Suggested: ${suggestion}` : 'Select date'}
      // User can always override AI suggestion
    />
  );
}
```

**Anti-pattern**: AI features that feel like gimmicks. If it doesn't measurably improve UX, remove it.

---

## 2026 DESIGN MOVEMENTS

### Referential Design (Retro Revival)

Drawing from past decades for warmth and familiarity:

| Era | Characteristics | When to Use |
|-----|-----------------|-------------|
| **Y2K (1999-2003)** | Metallic gradients, bubble fonts, tech-optimism | Gaming, entertainment, crypto |
| **90s Grunge** | Rough textures, collage, anti-corporate | Creative agencies, indie brands |
| **80s New Wave** | Neon, geometric, bold lines | Music, nightlife, bold startups |
| **70s Earth Tones** | Warm browns, oranges, organic shapes | Wellness, sustainable brands |

```css
/* Y2K-inspired button */
.btn-y2k {
  background: linear-gradient(135deg, #c0c0c0, #808080);
  border: 2px solid #ffffff;
  border-radius: 20px;
  box-shadow: 
    inset 0 1px 0 #ffffff,
    0 2px 4px rgba(0,0,0,0.3);
  font-family: 'Arial Black', sans-serif;
  text-transform: uppercase;
}
```

### Personification

Brands giving platforms human qualities through expressive elements:

| Element | Personification Approach | Example |
|---------|-------------------------|---------|
| **Colors** | Mood-expressing palettes | Warm coral for friendly, deep blue for trustworthy |
| **Icons** | Expressive, character-like | Animated mascots, emotive reactions |
| **Typography** | Personality through type choices | Playful rounded fonts vs serious serifs |
| **Micro-copy** | Conversational, witty tone | "Oops!" vs "Error 404" |
| **Illustrations** | Character-driven narratives | Empty states with friendly characters |

```jsx
// Personified empty state
function FriendlyEmptyState() {
  return (
    <div className="empty-state">
      <Character mood="curious" />
      <h2>Nothing here yet!</h2>
      <p>Let's change that together.</p>
      <Button variant="playful">Get Started</Button>
    </div>
  );
}
```

### Expressive Typography

Type as the primary design element:

| Technique | Use Case | Implementation |
|-----------|----------|----------------|
| **Variable font animation** | Hero sections | Animate weight/width on scroll |
| **Mixed weights in headlines** | Editorial | `The <span class="heavy">Bold</span> Choice` |
| **Kinetic type** | Landing pages | Scroll-triggered letter animations |
| **Oversized display** | Brand statements | 150-300px headlines |

```css
/* Variable font animation */
@font-face {
  font-family: 'InterVariable';
  src: url('Inter-Variable.woff2') format('woff2');
  font-weight: 100 900;
}

.hero-text {
  font-family: 'InterVariable', sans-serif;
  font-weight: 100;
  transition: font-weight 0.3s ease;
}

.hero-text:hover {
  font-weight: 900;
}
```

---

## COMPONENTS

### Rules

| Rule | Guideline |
|------|-----------|
| **Use existing** | Check shadcn/ui, Radix, Headless UI first |
| **No custom modals** | Use library dialogs |
| **Consistent variants** | Define sizes, states upfront |
| **Composition** | Small, composable > large monolithic |

### Required States

Every interactive component needs:

- Default
- Hover
- Focus (visible ring)
- Active/Pressed
- Disabled
- Loading (if async)
- Error (if input)

---

## ACCESSIBILITY (WCAG AA)

| Area | Requirement |
|------|-------------|
| **Color contrast** | 4.5:1 text, 3:1 UI |
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
| PNG | Transparency, simple graphics |

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
| Stock photo grids | Corporate, soulless |
| Decorative blobs/shapes | Meaningless noise |
| Carousel as default | Low engagement |
| Infinite scroll everywhere | No sense of progress |
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

*APEX v4.1 Design — 2026 standards for intentional, craft-driven UI.*
