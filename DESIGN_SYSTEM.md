# Design System Documentation

> Single source of truth for all design values. Never hardcode colors, spacing, or typography.

## Overview

This design system is defined in three places:

1. **CSS Custom Properties** — `styles/design-tokens.css`
2. **TypeScript Tokens** — `lib/design-tokens.ts`
3. **Tailwind Extensions** — `tailwind.config.extend.ts`

All three must stay in sync. Use the TypeScript tokens in component code, and CSS variables in stylesheets.

---

## Color System

### Core Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg-page` | `#f5f4f0` | Page background (light beige) |
| `--color-bg-surface` | `#ffffff` | Cards, surfaces |
| `--color-text-primary` | `#1a1a1a` | Primary text / ink |
| `--color-text-secondary` | `#8a7f74` | Secondary text / muted |

### Accents

| Token | Value | Usage |
|-------|-------|-------|
| `--color-sage` | `#a8c87a` | Primary accent (green) — buttons, active states |
| `--color-butter` | `#f5dc7a` | Secondary accent (yellow) — highlights, progress |
| `--color-sky` | `#b8ceea` | Tertiary accent (blue) — tags, badges |
| `--color-rose` | `#f2b8cd` | Accent (pink) — alternative highlight |
| `--color-orange` | `#f5a623` | Streak indicator (fire emoji companion) |

### Status Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--color-success-bg` | `#dcfce7` | Success background |
| `--color-success-text` | `#166534` | Success text |
| `--color-success-soft` | `#d4edba` | "Al día" (caught up) chip |
| `--color-error-bg` | `#fee2e2` | Error background |
| `--color-error-text` | `#991b1b` | Error text |

### Light Variants (for backgrounds)

Used for badge/tag backgrounds:

- `--color-bg-sage-soft` — Green badge background
- `--color-bg-sky-light` — Blue badge background  
- `--color-bg-rose-soft` — Pink badge background
- `--color-bg-butter-light` — Yellow badge background
- `--color-bg-grey` — Neutral badge background

### Pastel Colors (Set Card Icons)

Icon backgrounds cycle through these five colors:

- `--color-pastel-pink` — `#fddde6`
- `--color-pastel-blue` — `#c8dfff`
- `--color-pastel-green` — `#c8eaaa`
- `--color-pastel-peach` — `#fde8c8`
- `--color-pastel-purple` — `#e8d5f5`

### Interactive Elements

| Token | Value | Usage |
|-------|-------|-------|
| `--color-border` | `#eeebe6` | Card borders, dividers |
| `--color-nav-pill` | `#f0f0f0` | Nav item background (hover/inactive) |
| `--color-progress-track` | `#e0dcd4` | Progress bar background |

---

## Typography System

### Font Families

```css
--font-ui: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-card: Georgia, 'Times New Roman', serif;
```

### Font Scale (4px base)

| Token | Size | Usage |
|-------|------|-------|
| `--text-xs` | 10px | Meta labels, badge text |
| `--text-sm` | 12px | Small text, tab labels |
| `--text-base` | 13px | Body text (default) |
| `--text-md` | 14px | Button text, card meta |
| `--text-lg` | 16px | Body + card titles |
| `--text-xl` | 18px | Section headers |
| `--text-2xl` | 22px | Page display (display) |
| `--text-3xl` | 28px | Greeting ("Hi, Alejandra") |
| `--text-4xl` | 36px | Large display |
| `--text-5xl` | 56px | Hero/extra large |

### Font Weights

```css
--font-weight-regular: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

### Line Heights

```css
--line-height-tight: 1;        /* display text */
--line-height-normal: 1.2;     /* body, buttons */
--line-height-relaxed: 1.5;    /* section headers */
--line-height-loose: 1.6;      /* large display */
```

### Real-World Examples

- **Greeting** ("Hi, Alejandra"): `text-3xl font-semibold`
- **Page Title**: `text-2xl font-bold`
- **Section Header** ("Sets"): `text-lg font-bold`
- **Card Title** ("Saludos"): `text-md font-bold`
- **Card Meta** ("20 tarjetas"): `text-xs text-secondary`
- **Button Text**: `text-md font-semibold`
- **Tab Label**: `text-sm font-semibold` (active) or `font-regular` (inactive)

---

## Spacing System

### Scale (4px base unit)

```css
--spacing-1: 4px;      /* Minimal gaps */
--spacing-2: 8px;      /* Small gaps */
--spacing-3: 12px;     /* Small-medium gaps */
--spacing-4: 16px;     /* Default padding */
--spacing-5: 20px;     /* Medium gaps */
--spacing-6: 24px;     /* Large gaps */
--spacing-8: 32px;     /* Section spacing */
--spacing-10: 40px;    /* Extra large */
--spacing-12: 48px;    /* Extra extra large */
```

### Common Usage Patterns

| Context | Value | Example |
|---------|-------|---------|
| Page padding | `16px` (spacing-4) | `px-4` |
| Card padding | `16px` (spacing-4) | `p-4` |
| Section gap | `24px` (spacing-6) | `mb-6` |
| Icon + text gap | `8px` (spacing-2) | `gap-2` |
| Tight group gap | `4px` (spacing-1) | `gap-1` |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-xs` | 4px | Minimal curves |
| `--radius-sm` | 8px | Buttons, small elements |
| `--radius-md` | 10px | Inputs, moderate rounding |
| `--radius-lg` | 14px | **Cards** (standard) |
| `--radius-full` | 50px | Pill buttons, circular |

---

## Shadows & Borders

### Shadows (Subtle depth)

```css
--shadow-none: none;
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);     /* Cards */
--shadow-md: 0 2px 4px rgba(0, 0, 0, 0.08);     /* Hover */
--shadow-lg: 0 4px 8px rgba(0, 0, 0, 0.1);      /* Modals */
--shadow-xl: 0 8px 16px rgba(0, 0, 0, 0.12);    /* Elevated */
```

### Borders

| Token | Value | Usage |
|-------|-------|-------|
| `--border-width` | 1px | Default (cards, inputs) |
| `--border-width-2` | 2px | Active states |
| `--border-width-3` | 3px | Focus outline left border |
| `--border-default` | 1px solid #eeebe6 | Card borders |

---

## Component Patterns

### Card

```css
border: 1px solid var(--color-border);
border-radius: var(--radius-lg);
background: var(--color-bg-surface);
padding: var(--spacing-4);
box-shadow: var(--shadow-sm);
```

**Tailwind class:** `rounded-lg border border-border-default bg-surface shadow-sm`

### Button (Primary)

```css
background: var(--color-text-primary);
color: var(--color-bg-surface);
border-radius: var(--radius-sm);
padding: var(--spacing-3) var(--spacing-4);
font-weight: var(--font-weight-semibold);
```

**Tailwind class:** `px-4 py-3 rounded-sm bg-text-primary text-surface font-semibold`

### Badge

```css
background: var(--color-bg-subtle);
color: var(--color-text-primary);
border-radius: var(--radius-xs);
padding: 4px 8px;
font-size: var(--text-xs);
font-weight: var(--font-weight-semibold);
```

**Tailwind class:** `px-2 py-1 rounded-xs bg-bg-subtle text-text-primary text-xs font-semibold`

### Progress Bar

```css
background: var(--color-progress-track);
border-radius: 9999px;
height: 8px;
overflow: hidden;

/* Filled part */
background: var(--color-butter);
border-radius: 9999px;
height: 100%;
```

**Tailwind class:** `w-full bg-progress-track rounded-full h-2 overflow-hidden`

---

## Usage in Components

### TypeScript (Recommended for logic)

```tsx
import { tokens } from '@/lib/design-tokens';

// Use in style objects
style={{ 
  background: tokens.color.sage,
  padding: tokens.spacing['4'],
  borderRadius: tokens.radius.card
}}

// Use in conditionals
const isActive = status === 'complete';
const bgColor = isActive ? tokens.color.sage : tokens.color.border;
```

### CSS (Stylesheets)

```css
/* Direct CSS custom properties */
.card {
  background: var(--color-bg-surface);
  border: var(--border-default);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
  box-shadow: var(--shadow-sm);
}
```

### Tailwind Classes (Preferred for UI)

```tsx
<div className="rounded-lg border border-border-default bg-surface shadow-sm p-4">
  <h2 className="text-lg font-bold text-text-primary">Sets</h2>
  <p className="text-sm text-text-secondary">20 tarjetas</p>
</div>
```

---

## Responsive Behavior

Spacing and sizing follow mobile-first approach:

| Breakpoint | Width | Context |
|-----------|-------|---------|
| Mobile | < 768px | Full width, single column |
| Tablet | 768px - 1023px | Adjusted padding/spacing |
| Desktop | ≥ 1024px | Multi-column, sidebar visible |

Typography and colors are **consistent** across all sizes. Only layout and spacing adjust responsively.

---

## Maintenance

When updating the design system:

1. **Update `styles/design-tokens.css`** first (CSS custom properties)
2. **Update `lib/design-tokens.ts`** to match (TypeScript constants)
3. **Update `tailwind.config.extend.ts`** for Tailwind utilities
4. **Update this document** with examples

All three sources of truth must stay synchronized.

---

## Future Enhancements

- [ ] Dark mode color scheme
- [ ] Animation/easing presets
- [ ] Elevation system (z-index scale)
- [ ] Semantic semantic color aliases (e.g., `success-primary`, `error-secondary`)
