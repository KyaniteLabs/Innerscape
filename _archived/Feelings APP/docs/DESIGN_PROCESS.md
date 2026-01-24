# SOMA Design Process

## Vibe Definition (3 Words)
**Calm, Intentional, Organic**

## Typography

### Font Family
- **Primary**: Outfit
- **Fallback**: System fonts (if Google Fonts unavailable)
- **Monospace**: Space Mono (for code/technical text)

### Typography Scale

| Style | Size | Weight | Line Height | Use Case |
|-------|-------|--------|-------------|----------|
| Display | 28px | 300 (Light) | 1.0 | Page titles, hero text |
| Heading | 18px | 500 (Medium) | 1.0 | Section titles |
| Body | 16px | 400 (Regular) | 1.6 | Body text, content |
| Caption | 13px | 400 (Regular) | 1.0 | Labels, metadata |
| Mono | 12px | 400 (Regular) | 1.0 | Code, technical text |

### Typography Guidelines
- Minimum readable size: 14px
- Line height: 1.5 for body text
- Letter spacing: 0.5 for headings, 0 for body
- Use text scaling for accessibility

## Color Tokens

### Light Mode
```dart
class AppColors {
  static const Color background = Color(0xFFFAFAFA);
  static const Color foreground = Color(0xFF1A1A2E);
  static const Color primary = Color(0xFF4A7C59); // Soft green
  static const Color primaryForeground = Color(0xFFFFFFFF);
  static const Color secondary = Color(0xFFF1F5F9);
  static const Color muted = Color(0xFF6B7280);
  static const Color mutedForeground = Color(0xFF71717A);
  static const Color accent = Color(0xFFE8F5E9);
  static const Color destructive = Color(0xFFEF4444);
  static const Color border = Color(0xFFE5E7EB);
  static const Color ring = Color(0xFF4A7C59);
}
```

### Dark Mode
```dart
class AppColorsDark {
  static const Color background = Color(0xFF0A0A0A);
  static const Color foreground = Color(0xFFFAFAFA);
  static const Color primary = Color(0xFF6B9B7A); // Lighter green
  static const Color primaryForeground = Color(0xFF0A0A0A);
  static const Color secondary = Color(0xFF27272A);
  static const Color muted = Color(0xFFA1A1AA);
  static const Color mutedForeground = Color(0xFF71717A);
  static const Color border = Color(0xFF27272A);
}
```

### Color Usage Guidelines
- Use semantic color names, not raw values
- Ensure WCAG AA contrast ratios (4.5:1 for text, 3:1 for UI)
- Test in both light and dark modes
- Avoid color-only indicators (use icons, labels, patterns)

## Motion Budget

| Type | Duration | Use Case |
|------|-----------|-----------|
| Subtle | 150ms | Hovers, micro-interactions, focus states |
| Standard | 300ms | Reveals, transitions, page changes |
| Dramatic | 500ms | Hero animations, major transitions |

### Motion Guidelines
- Respect user's reduced motion preference
- Use easing curves for natural feel
- Avoid jarring or sudden movements
- Provide feedback for all interactions

## Spacing System

| Token | Value | Use Case |
|-------|--------|----------|
| spacingXS | 4px | Tight spacing, icons |
| spacingS | 8px | Small gaps, related items |
| spacingM | 16px | Standard spacing, padding |
| spacingL | 24px | Section spacing, large padding |
| spacingXL | 32px | Major sections, page margins |
| spacingXXL | 48px | Hero sections, full-page spacing |

### Spacing Guidelines
- Use spacing tokens, not arbitrary values
- Maintain consistent rhythm
- Use larger spacing for major sections
- Ensure touch targets have adequate spacing

## Border Radius

| Token | Value | Use Case |
|-------|--------|----------|
| radiusS | 4px | Small elements, tags |
| radiusM | 8px | Buttons, cards, inputs |
| radiusL | 16px | Large cards, modals |

### Border Radius Guidelines
- Use consistent radius for similar elements
- Larger radius for larger elements
- Avoid mixing radius values in same context

## Shadows

### Soft Shadow
```dart
static List<BoxShadow> softShadow = [
  BoxShadow(
    color: Colors.black.withValues(alpha: 0.05),
    blurRadius: 10,
    offset: const Offset(0, 4),
  ),
];
```

### Shadow Guidelines
- Use subtle shadows for depth
- Avoid harsh or heavy shadows
- Use shadows sparingly in dark mode
- Consider elevation system for consistency

## Design Principles

### 1. Calm
**Rationale**: Users experiencing emotional dysregulation need a calming environment.

**Implementation**:
- Soft colors (greens, warm whites)
- Gentle animations (300ms standard)
- Minimal visual noise
- Generous white space
- No aggressive or jarring elements

### 2. Intentional
**Rationale**: Every element should have a clear purpose and contribute to user goals.

**Implementation**:
- No decorative fluff
- Clear hierarchy and flow
- Purposeful animations
- Meaningful interactions
- Focused feature set

### 3. Organic
**Rationale**: The app deals with human emotions and physical sensations, which are inherently organic.

**Implementation**:
- Natural color palette (greens, warm tones)
- Organic shapes and curves
- Natural motion curves
- Human-centric language
- Warm, welcoming tone

## Component Design

### Buttons
- Minimum touch target: 44x44 points
- Clear visual hierarchy (primary vs secondary)
- Loading state for async actions
- Disabled state with clear indication
- Focus ring for keyboard navigation

### Inputs
- Clear labels and hints
- Validation feedback
- Error states with guidance
- Focus states visible
- Accessible via keyboard

### Cards
- Subtle shadow for depth
- Consistent padding
- Clear content hierarchy
- Touch-friendly size
- Focus ring when interactive

### Modals
- Backdrop dimming
- Clear close button
- Trap focus within modal
- Escape key to close
- Smooth enter/exit animation

## Accessibility

### Color Contrast
- Text: Minimum 4.5:1 contrast
- UI elements: Minimum 3:1 contrast
- Verified with contrast checker tools

### Keyboard Navigation
- All interactive elements accessible via Tab
- Logical tab order
- Enter/Space to activate
- Escape to close modals
- Visible focus indicators

### Screen Reader Support
- Semantic labels on all interactive elements
- Alt text for images
- ARIA labels where needed
- Live regions for dynamic content

### Reduced Motion
- Respect user's system preference
- Provide instant transitions when enabled
- No essential information in animations

## Responsive Design

### Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Responsive Guidelines
- Mobile-first approach
- Fluid layouts that adapt
- Touch-optimized on mobile
- Keyboard-optimized on desktop

## Design Tokens in Code

All design tokens are defined in `lib/core/design_system.dart`:

```dart
class DesignSystem {
  // Typography
  static TextStyle headingStyle({Color? color}) {
    return GoogleFonts.outfit(
      fontSize: 28,
      fontWeight: FontWeight.w300,
      color: color ?? AppColors.foreground,
      letterSpacing: 2,
    );
  }
  
  static TextStyle bodyStyle({Color? color}) {
    return GoogleFonts.outfit(
      fontSize: 16,
      fontWeight: FontWeight.w400,
      color: color ?? AppColors.foreground,
      height: 1.6,
    );
  }
  
  // Spacing
  static const double spacingXS = 4.0;
  static const double spacingS = 8.0;
  static const double spacingM = 16.0;
  static const double spacingL = 24.0;
  static const double spacingXL = 32.0;
  
  // Border Radius
  static const double radiusS = 4.0;
  static const double radiusM = 8.0;
  static const double radiusL = 16.0;
  
  // Shadows
  static List<BoxShadow> softShadow = [
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.05),
      blurRadius: 10,
      offset: const Offset(0, 4),
    ),
  ];
}
```

## Design Review Checklist

### Visual Design
- [ ] Follows color tokens
- [ ] Uses typography scale
- [ ] Applies spacing system
- [ ] Implements motion budget
- [ ] Respects reduced motion

### Accessibility
- [ ] WCAG AA contrast ratios
- [ ] Keyboard navigation works
- [ ] Screen reader labels present
- [ ] Touch targets adequate (44x44)
- [ ] Focus states visible

### Consistency
- [ ] Matches design system
- [ ] Consistent with similar components
- [ ] Follows established patterns
- [ ] Uses design tokens

## References

- [Material Design 3](https://m3.material.io/)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Web Content Accessibility Guidelines (WCAG)](https://www.w3.org/WAI/WCAG21/quickref/)
- [APEX Design Guidelines](../apex%20rules/APEX_DESIGN.md)

## Last Updated
- Date: 2026-01-24
- Version: 1.0.0

## 2026 Motion Trends (Optional Enhancements)

### Consider Adding:
- [ ] Scroll-triggered reveals (IntersectionObserver equivalent)
- [ ] Staggered animations for lists
- [ ] Parallax effects for hero sections
- [ ] Magnetic cursor effects (desktop)

### Implementation Notes
These are optional enhancements that can be added in future iterations to modernize the UI.

## Verification Checklist

Before shipping any UI:

- [ ] Typography locked (max 2 families, no banned fonts)
- [ ] Color tokens defined (3-5 colors, CSS variables)
- [ ] Contrast verified (4.5:1 text, 3:1 UI)
- [ ] Motion respects prefers-reduced-motion
- [ ] Keyboard navigation works
- [ ] Focus states visible
- [ ] Core Web Vitals within budget
- [ ] Tested on mobile viewport
- [ ] Dark mode works (if applicable)
- [ ] Doesn't look like a template
