# Design Tokens — Quick Reference

## Color Swatches

### Primary Colors
```
Background Page    #f5f4f0  (var(--color-bg-page))
Surface           #ffffff  (var(--color-bg-surface))
Text Primary      #1a1a1a  (var(--color-text-primary))
Text Secondary    #8a7f74  (var(--color-text-secondary))
Border            #eeebe6  (var(--color-border))
```

### Accent Colors (CORE)
```
Sage Green (Primary)     #a8c87a  ← Main action color
Butter Yellow (Highlight) #f5dc7a  ← Secondary highlight
Sky Blue (Accent)        #b8ceea  ← Badge/tag accent
Rose Pink (Accent)       #f2b8cd  ← Alternative accent
Orange (Indicator)       #f5a623  ← Streak indicator
```

### Status Colors
```
Success BG   #dcfce7  Error BG      #fee2e2
Success Text #166534  Error Text    #991b1b
Success Soft #d4edba  Warning Text  #6b5500
```

### Background Variants (for badges)
```
Sage Soft      #e8f4d8  ← Green background
Sky Light      #e8f2f9  ← Blue background
Rose Soft      #ffe5f0  ← Pink background
Butter Light   #fff4e0  ← Yellow background
```

### Pastel Colors (set card icons)
```
Pastel Pink    #fddde6
Pastel Blue    #c8dfff
Pastel Green   #c8eaaa
Pastel Peach   #fde8c8
Pastel Purple  #e8d5f5
```

---

## Typography Scale

### Font Families
```
UI/Default    'Inter', system fonts
Card Content  Georgia, serif
```

### Sizes
```
10px (xs)  — Meta labels, badge text
12px (sm)  — Small text, tab labels, secondary
13px (base)— Body text (default size)
14px (md)  — Button text, card metadata
16px (lg)  — Body emphasis, card titles
18px (xl)  — Section headers ("Sets")
22px (2xl) — Display text ("Today")
28px (3xl) — Greeting ("Hi, Alejandra")
36px (4xl) — Large display
56px (5xl) — Hero/extra large
```

### Weights
```
400 Regular
500 Medium
600 Semibold
700 Bold (most common in UI)
```

### Line Heights
```
1.0  — Tight (display text, single line)
1.2  — Normal (body, buttons, default)
1.5  — Relaxed (section headers, larger text)
1.6  — Loose (hero text, large display)
```

---

## Spacing Scale

**Base unit: 4px**

```
4px   (spacing-1) — Minimal gaps
8px   (spacing-2) — Icon + text gaps
12px  (spacing-3) — Small containers
16px  (spacing-4) — Default padding (cards, page)
20px  (spacing-5) — Medium gaps
24px  (spacing-6) — Section gaps
32px  (spacing-8) — Large section gaps
40px  (spacing-10)— Extra large
48px  (spacing-12)— Extra extra large
```

### Common Patterns
```
Page/Card Padding      → 16px
Icon + Text Gap        → 8px
Between Sections       → 24px
Grid Gaps              → 8px to 12px
```

---

## Border Radius

```
4px   (xs)   — Minimal curves
8px   (sm)   — Buttons, small elements
10px  (md)   — Inputs, modest rounding
14px  (lg)   — Cards (STANDARD)
50px  (full) — Pills, circles
```

---

## Shadows

```
none   — No shadow
sm     — Cards (subtle: 0 1px 2px)
md     — Hover states (0 2px 4px)
lg     — Modals, elevated (0 4px 8px)
xl     — High elevation (0 8px 16px)
```

---

## Borders

```
1px solid #eeebe6   — Card borders (default)
2px solid #eeebe6   — Active/focus states
3px solid #a8c87a   — Left border accent (active nav)
```

---

## Component Usage Quick Ref

### Card
- **Radius:** 14px
- **Padding:** 16px
- **Border:** 1px solid #eeebe6
- **Shadow:** 0 1px 2px rgba(0,0,0,0.05)
- **Background:** #ffffff

### Button
- **Primary:** #1a1a1a bg, white text
- **Secondary:** #a8c87a bg, dark text
- **Padding:** 12-16px horizontal, 8-12px vertical
- **Radius:** 8px
- **Font:** 600-700 weight

### Badge
- **Padding:** 4px horizontal, 2px vertical
- **Radius:** 4px
- **Font:** 10px, 700 weight
- **Examples:**
  - Default: dark bg, white text
  - Success: green bg, dark text
  - Warning: yellow bg, dark text

### Progress Bar
- **Height:** 8px
- **Track:** #e0dcd4
- **Fill:** #f5dc7a (butter)
- **Radius:** 50% (pill shape)

### Input/Form
- **Padding:** 12px (vertical/horizontal)
- **Border:** 1px solid #eeebe6
- **Radius:** 10px
- **Focus:** 2px solid #a8c87a ring

### Nav Item
- **Inactive:** text #8a7f74 (muted)
- **Active:** text #1a1a1a (primary)
- **Font:** 12-14px
- **Active indicator:** 3px left border #a8c87a

---

## Dark Mode (Reserved)

When dark mode is needed:

```css
@media (prefers-color-scheme: dark) {
  --color-bg-page: #0f0f0f
  --color-bg-surface: #1a1a1a
  --color-text-primary: #fafaf8
  --color-text-secondary: #a0a098
}
```

---

## File Locations

| Purpose | File | Type |
|---------|------|------|
| CSS Variables | `styles/design-tokens.css` | CSS Custom Properties |
| TypeScript Tokens | `lib/design-tokens.ts` | JavaScript constants |
| Tailwind Extensions | `tailwind.config.extend.ts` | Tailwind config |
| Full Docs | `DESIGN_SYSTEM.md` | Markdown documentation |
| This Reference | `TOKENS_REFERENCE.md` | Quick lookup |

---

## Copy-Paste Tailwind Classes

### Card Component
```html
<div class="rounded-lg border border-border-default bg-surface shadow-sm p-4">
  <!-- content -->
</div>
```

### Button (Primary)
```html
<button class="px-4 py-2 rounded-sm bg-text-primary text-surface font-semibold hover:opacity-90">
  Action
</button>
```

### Badge
```html
<span class="px-2 py-1 rounded-xs bg-bg-subtle text-text-primary text-xs font-semibold">
  Label
</span>
```

### Section Header
```html
<h2 class="text-lg font-bold text-text-primary mb-6">
  Sets
</h2>
```

### Body Text
```html
<p class="text-base text-text-secondary leading-relaxed">
  Description text
</p>
```

### Progress Bar
```html
<div class="w-full h-2 rounded-full bg-progress-track overflow-hidden">
  <div class="h-full bg-butter" style="width: 75%"></div>
</div>
```

---

## CSS Variable Copy-Paste

### Complete Variable Set
```css
/* Colors */
--color-bg-page: #f5f4f0;
--color-bg-surface: #ffffff;
--color-text-primary: #1a1a1a;
--color-text-secondary: #8a7f74;
--color-sage: #a8c87a;
--color-butter: #f5dc7a;
--color-border: #eeebe6;

/* Spacing */
--spacing-1: 4px;
--spacing-2: 8px;
--spacing-3: 12px;
--spacing-4: 16px;
--spacing-6: 24px;

/* Sizing */
--text-base: 13px;
--text-lg: 16px;
--text-3xl: 28px;

/* Radius */
--radius-sm: 8px;
--radius-lg: 14px;

/* Shadow */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
```

---

## Quick Decisions

**"What color should this be?"**
- Primary action → `#a8c87a` (sage)
- Highlight/progress → `#f5dc7a` (butter)
- Important text → `#1a1a1a` (ink)
- Secondary text → `#8a7f74` (muted)

**"What's the padding?"**
- Cards → `16px`
- Page → `16px`
- Buttons → `12px vertical, 16px horizontal`

**"What's the border radius?"**
- Cards → `14px`
- Buttons → `8px`
- Badges → `4px`

**"What size text?"**
- Body → `13px`
- Headers → `18px`+
- Labels → `10-12px`
