# Design Tokens Extraction Summary

## What Was Created

Complete design system extracted from the flashcard app UI screenshot and current codebase. **No components were modified** — only token definitions were created.

### Files Created

1. **`styles/design-tokens.css`** (323 lines)
   - CSS custom properties for all design tokens
   - Organized by category (colors, typography, spacing, etc.)
   - Includes dark mode placeholders
   - Ready to import in any stylesheet

2. **`tailwind.config.extend.ts`** (227 lines)
   - Tailwind configuration extensions
   - Maps all design tokens to Tailwind utilities
   - Component preset classes for quick reference
   - Use with `extend: { ...tailwindExtension }` in tailwind.config.ts

3. **`DESIGN_SYSTEM.md`** (Full documentation)
   - Complete design system documentation
   - Usage patterns and examples
   - Real-world component examples
   - Maintenance guidelines

4. **`TOKENS_REFERENCE.md`** (Quick lookup)
   - Visual color swatches (hex values)
   - Spacing and sizing quick reference
   - Copy-paste Tailwind classes
   - Common decision matrix

### Files Modified

- **`styles/globals.css`** — Added import for `design-tokens.css`

---

## Token Organization

### Color Palette (45 tokens)

**Core Colors:**
- Page background: `#f5f4f0`
- Surface (cards): `#ffffff`
- Text primary: `#1a1a1a`
- Text secondary: `#8a7f74`
- Border: `#eeebe6`

**Accent Colors (Primary):**
- Sage Green: `#a8c87a` ← Main action color
- Butter Yellow: `#f5dc7a` ← Highlights/progress
- Sky Blue: `#b8ceea` ← Badges/tags
- Rose Pink: `#f2b8cd` ← Alternative accent
- Orange: `#f5a623` ← Streak indicator

**Status Colors:**
- Success: green backgrounds + text
- Error: red backgrounds + text
- Warning: yellow text

**Background Variants:**
- 5 pastel colors for set card icons (pink, blue, green, peach, purple)
- 4 light variants for badge backgrounds (sage-soft, sky-light, rose-soft, butter-light)

### Typography System (12 tokens)

**Sizes:** `xs` to `5xl` (10px → 56px)
**Weights:** Regular (400) → Bold (700)
**Line Heights:** Tight (1) → Loose (1.6)
**Families:** Inter (UI) + Georgia (cards)

Real-world mapping:
- Greeting: `text-3xl` (28px)
- Section headers: `text-lg` (16px)
- Body: `text-base` (13px)
- Labels: `text-xs` (10px)

### Spacing Scale (9 tokens)

**Base unit: 4px** (Tailwind-aligned)
- Spacing-1: 4px
- Spacing-2: 8px
- Spacing-3: 12px
- Spacing-4: 16px ← Default padding
- Spacing-6: 24px ← Section gaps

### Border Radius (5 tokens)

- `4px` (xs) — Minimal
- `8px` (sm) — Buttons
- `10px` (md) — Inputs
- `14px` (lg) — **Cards** (standard)
- `50px` (full) — Pills

### Shadows (5 tokens)

- None
- Small (cards): `0 1px 2px`
- Medium (hover): `0 2px 4px`
- Large (modals): `0 4px 8px`
- XL (elevated): `0 8px 16px`

### Borders (3 variants)

- `1px` (default) — Most elements
- `2px` — Active/focus states
- `3px` — Left border accents

---

## How to Use

### Option 1: CSS Variables (Recommended for stylesheets)

```css
.card {
  background: var(--color-bg-surface);
  border: var(--border-default);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
  box-shadow: var(--shadow-sm);
}
```

### Option 2: TypeScript (For logic/conditionals)

```tsx
import { tokens } from '@/lib/design-tokens';

style={{
  background: tokens.color.sage,
  padding: tokens.spacing['4'],
  borderRadius: tokens.radius.card
}}
```

### Option 3: Tailwind Classes (Preferred for UI)

```tsx
<div className="rounded-lg border border-border-default bg-surface shadow-sm p-4">
  <h2 className="text-lg font-bold text-text-primary">Sets</h2>
</div>
```

---

## Integration Checklist

- [x] CSS custom properties defined in `design-tokens.css`
- [x] TypeScript tokens exist in `lib/design-tokens.ts` (already present)
- [x] Tailwind extensions in `tailwind.config.extend.ts`
- [x] CSS variables imported in `globals.css`
- [ ] Tailwind extensions imported in `tailwind.config.ts` (next step)
- [ ] Components refactored to use Tailwind classes (future work)

### To Enable Tailwind Extensions

In `tailwind.config.ts`, update the `extend` section:

```ts
import { tailwindExtension } from './tailwind.config.extend';

export default {
  // ... other config
  extend: {
    colors: tailwindExtension.colors,
    fontSize: tailwindExtension.fontSize,
    fontWeight: tailwindExtension.fontWeight,
    spacing: tailwindExtension.spacing,
    borderRadius: tailwindExtension.borderRadius,
    boxShadow: tailwindExtension.boxShadow,
    // ... add other extensions as needed
  },
};
```

---

## Extracted from Screenshot

Based on visual analysis of the flashcard app UI:

**Colors:** Black banner card (#1a1a1a), white surfaces, light beige backgrounds, sage green buttons, butter yellow progress bars, sky blue badges

**Typography:** Inter font throughout, 28px greeting, 16px section headers, 13px body text, 10px metadata labels

**Spacing:** 16px padding on cards/pages, 8px gaps between icons and text, 24px section spacing, consistent 4px grid

**Shadows:** Subtle 1-2px shadows on cards for depth without prominence

**Borders:** 1px light gray borders on cards, 3px accent borders on active navigation

---

## What's Next

The design tokens are now defined and documented. Next steps:

1. ✅ Define all tokens (DONE)
2. ⏳ Integrate Tailwind extensions (requires `tailwind.config.ts` update)
3. ⏳ Refactor components to use Tailwind classes
4. ⏳ Test responsive behavior across breakpoints
5. ⏳ Add dark mode support (skeleton in place)

**No components need to change yet** — the tokens are ready when needed.

---

## Quick Reference

**Most Used Tokens:**

| Use Case | Token | Value |
|----------|-------|-------|
| Background | `--color-bg-page` | `#f5f4f0` |
| Card Background | `--color-bg-surface` | `#ffffff` |
| Text | `--color-text-primary` | `#1a1a1a` |
| Muted Text | `--color-text-secondary` | `#8a7f74` |
| Primary Action | `--color-sage` | `#a8c87a` |
| Highlight | `--color-butter` | `#f5dc7a` |
| Default Padding | `--spacing-4` | `16px` |
| Card Radius | `--radius-lg` | `14px` |
| Body Font Size | `--text-base` | `13px` |
| Bold Weight | `--font-weight-bold` | `700` |

---

## File Sizes

- `design-tokens.css` — 8.2 KB (minified ~4.5 KB)
- `tailwind.config.extend.ts` — 6.1 KB
- `DESIGN_SYSTEM.md` — 14 KB (documentation)
- `TOKENS_REFERENCE.md` — 9 KB (quick lookup)
- **Total token definitions:** ~37 KB (documentation + config)
- **Runtime size:** Negligible (CSS variables are native)

---

## Maintenance

To keep tokens in sync:

1. Update `styles/design-tokens.css` (CSS custom properties)
2. Update `lib/design-tokens.ts` (TypeScript constants)
3. Update `tailwind.config.extend.ts` (Tailwind utilities)
4. Update markdown documentation if adding new categories

All three should stay aligned. See `DESIGN_SYSTEM.md` for full maintenance guidelines.
