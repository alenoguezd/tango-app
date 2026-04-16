# Design System — Visual Summary

Extracted from the flashcard app screenshot and existing codebase.

---

## Color Palette

### Core Foundations

```
┌─ BACKGROUNDS ─────────────────────────────────┐
│                                                │
│  Page (Light Beige)     ████ #f5f4f0           │
│  Surface (White)        ████ #ffffff           │
│  Hover                  ████ #f8f8f8           │
│  Subtle                 ████ #f5f5f5           │
│  Desktop Page           ████ #f7f6f3           │
│                                                │
└────────────────────────────────────────────────┘

┌─ TEXT / INK ───────────────────────────────────┐
│                                                │
│  Primary (Dark)         ████ #1a1a1a (text)    │
│  Secondary (Muted Gray) ████ #8a7f74           │
│                                                │
└────────────────────────────────────────────────┘
```

### Accent Colors (Actions & Highlights)

```
┌─ PRIMARY ACTIONS ──────────────────────────────┐
│                                                │
│  ✓ Sage Green (main action button)             │
│    ████████████ #a8c87a ← Used in Estudiar btn│
│                                                │
│  ★ Butter Yellow (progress highlight)          │
│    ████████████ #f5dc7a ← Progress bars        │
│                                                │
└────────────────────────────────────────────────┘

┌─ SECONDARY ACCENTS ────────────────────────────┐
│                                                │
│  Sky Blue (badge/tag)  ████████████ #b8ceea   │
│  Rose Pink (accent)    ████████████ #f2b8cd   │
│  Orange (indicator)    ████████████ #f5a623   │
│                                                │
└────────────────────────────────────────────────┘
```

### Badge Backgrounds (5 pastel colors for icons)

```
┌─ PASTEL ICON BACKGROUNDS ──────────────────────┐
│                                                │
│  Pink    ████ #fddde6    Purple  ████ #e8d5f5│
│  Blue    ████ #c8dfff    Green   ████ #c8eaaa│
│  Peach   ████ #fde8c8                         │
│                                                │
└────────────────────────────────────────────────┘
```

### Status Colors

```
┌─ STATUS & SEMANTIC ────────────────────────────┐
│                                                │
│  ✓ Success   BG: #dcfce7  Text: #166534       │
│  ✗ Error     BG: #fee2e2  Text: #991b1b       │
│  ⚠ Warning              Text: #6b5500         │
│  ✓ Caught Up (Al día)   BG: #d4edba           │
│                                                │
└────────────────────────────────────────────────┘
```

### Light Background Variants (for badges)

```
When accent color is BG, use light variant:

  Sage   → bg: #e8f4d8  (green badge)
  Sky    → bg: #e8f2f9  (blue badge)
  Rose   → bg: #ffe5f0  (pink badge)
  Butter → bg: #fff4e0  (yellow badge)
```

### Borders & Interactive

```
  Border      ████ #eeebe6 ← 1px on cards
  Nav Pill    ████ #f0f0f0 ← Inactive nav bg
  Progress    ████ #e0dcd4 ← Progress bar track
```

---

## Typography Hierarchy

### Sizes (Inter font throughout)

```
56px  ▲ ─ Hero / Extra Large Display
       │
36px  │ ─ Large Display
       │
28px  │ ─ Greeting ("Hi, Alejandra")
       │
22px  │ ─ Page Display ("Today")
       │
18px  │ ─ Section Headers ("Sets")
       │
16px  │ ─ Body Emphasis / Card Titles
       │
14px  │ ─ Button Text / Card Metadata
       │
13px  │ ─ Body Text (Default)
       │
12px  │ ─ Small Text / Tab Labels
       │
10px  ▼ ─ Meta Labels / Badge Text
```

### Weights Used

```
Regular (400) ─ Inactive tabs, secondary text
Medium  (500) ─ Rarely used
Bold    (600) ─ Button text
Bold    (700) ─ Headings, active states, emphasis
```

### Line Heights

```
1.0  ─ Tight (single-line display text)
1.2  ─ Normal (body, buttons, default)
1.5  ─ Relaxed (section headers)
1.6  ─ Loose (large display text)
```

---

## Spacing System

**4px base unit** (Tailwind-aligned)

```
4px   ▓░░░░░ spacing-1  Minimal gaps
8px   ▓▓░░░░ spacing-2  Icon + text gaps
12px  ▓▓▓░░░ spacing-3  Small containers
16px  ▓▓▓▓░░ spacing-4  Default padding (MOST COMMON)
20px  ▓▓▓▓▓░ spacing-5  Medium gaps
24px  ▓▓▓▓▓▓ spacing-6  Section gaps

32px  ▓▓▓▓▓▓▓░░░░ spacing-8   Large gaps
40px  ▓▓▓▓▓▓▓▓░░░ spacing-10  Extra large
48px  ▓▓▓▓▓▓▓▓▓░░ spacing-12  Extra extra large
```

### Real Usage

```
Page Padding         → 16px (spacing-4)
Card Padding         → 16px (spacing-4)
Icon + Text Gap      → 8px  (spacing-2)
Between Sections     → 24px (spacing-6)
Card Row Gap         → 8px  (spacing-2)
```

---

## Border Radius

```
4px   ▮░░░░░░░░░ xs   (minimal, badges)
8px   ▮▮░░░░░░░░ sm   (buttons, small)
10px  ▮▮▮░░░░░░░ md   (inputs)
14px  ▮▮▮▮░░░░░░ lg   (CARDS - standard)
50px  ▮▮▮▮▮▮▮▮▮▮ full (pills, circles)
```

---

## Shadows (Subtle Depth)

```
none   ░░░░░░░░░░ No shadow
small  ▒░░░░░░░░░ 0 1px 2px (cards)
medium ▒▒░░░░░░░░ 0 2px 4px (hover)
large  ▒▒▒░░░░░░░ 0 4px 8px (modals)
xl     ▒▒▒▒░░░░░░ 0 8px 16px (elevated)
```

---

## Component Patterns

### Card (Most Common)

```
┌──────────────────────┐
│ ┌──────────────────┐ │  Padding: 16px
│ │                  │ │  Border: 1px #eeebe6
│ │   Card Content   │ │  Radius: 14px
│ │                  │ │  Shadow: 1px 2px
│ │ ┌──────────────┐ │ │  Background: white
│ │ │ Estudiar Btn │ │ │
│ │ └──────────────┘ │ │
│ └──────────────────┘ │
└──────────────────────┘
```

### Button (Primary)

```
┌─────────────────┐
│  Estudiar       │  Bg: #1a1a1a (ink)
│                 │  Text: white
│                 │  Radius: 8px
└─────────────────┘  Padding: 12px v, 16px h
                     Weight: bold (700)
```

### Badge / Tag

```
┌─────────────┐
│  Básico     │  Bg: light variant (#e8f2f9)
│             │  Text: primary (#1a1a1a)
└─────────────┘  Radius: 4px
                 Size: 10px
                 Weight: bold
```

### Progress Bar

```
┌────────────────────────────┐
│ ████████████░░░░░░░░░░░░░░ │  Fill: #f5dc7a (butter)
└────────────────────────────┘  Track: #e0dcd4
                                Height: 8px
                                Radius: 50% (pill)
```

### Navigation Item (Active)

```
  ■ Inicio ←─ Left border accent: 3px #a8c87a
    Text: #1a1a1a (primary)
    Font: 14px, bold
```

---

## Color Decision Matrix

"What color should I use?"

```
PRIMARY ACTION        → Sage Green (#a8c87a)
                        Example: Estudiar button

HIGHLIGHT / PROGRESS  → Butter Yellow (#f5dc7a)
                        Example: Progress bar fill

SECONDARY ACCENT      → Sky Blue (#b8ceea)
                        Example: "Básico" badge

ALTERNATIVE ACCENT    → Rose Pink (#f2b8cd)

STREAK INDICATOR      → Orange (#f5a623)
                        Example: 🔥 icon

PRIMARY TEXT          → Ink Black (#1a1a1a)

SECONDARY TEXT        → Muted Gray (#8a7f74)

BORDERS / DIVIDERS    → Light Gray (#eeebe6)

STATUS: SUCCESS       → Green (#dcfce7 bg, #166534 text)

STATUS: ERROR         → Red (#fee2e2 bg, #991b1b text)

STATUS: WARNING       → Yellow (#fff4e0 bg, #6b5500 text)

"CAUGHT UP" CHIP      → Soft Green (#d4edba)
```

---

## Responsive Breakpoints

Colors and typography are **consistent** across all sizes.
Only spacing and layout change responsively.

```
Mobile (< 768px)     → Full width, single column, 16px padding
Tablet (768-1023px)  → Adjusted spacing
Desktop (≥ 1024px)   → Multi-column, sidebar visible
```

---

## File Manifest

```
styles/
  ├─ design-tokens.css         ← CSS custom properties
  ├─ globals.css               ← Imports design-tokens.css
  └─ ... (other styles)

lib/
  ├─ design-tokens.ts          ← TypeScript constants (existing)
  └─ ... (other utilities)

tailwind.config.extend.ts       ← Tailwind utilities
tailwind.config.ts              ← (Import extension here)

DESIGN_SYSTEM.md                ← Full documentation
TOKENS_REFERENCE.md             ← Quick lookup
DESIGN_TOKENS_VISUAL.md         ← This file
TOKENS_EXTRACTION_SUMMARY.md    ← Summary of extraction
```

---

## Quick Stats

- **45 color tokens** (core, accents, status, variants)
- **12 typography tokens** (sizes, weights, heights)
- **9 spacing tokens** (4px to 48px)
- **5 border radius tokens** (4px to 50px)
- **5 shadow tokens** (none to xl)
- **3 border width tokens**
- **6 component preset patterns** (card, button, badge, progress, input, nav)

**Total coverage:** All design elements in the flashcard app

---

## Dark Mode (Reserved)

```css
@media (prefers-color-scheme: dark) {
  --color-bg-page: #0f0f0f;
  --color-bg-surface: #1a1a1a;
  --color-text-primary: #fafaf8;
  --color-text-secondary: #a0a098;
  /* Other dark mode colors... */
}
```

Placeholder for future dark mode support. Light colors remain primary.

---

## Next Steps

✅ **Token Definition:** Complete  
📋 **Documentation:** Complete  
⏳ **Tailwind Integration:** Import in `tailwind.config.ts`  
⏳ **Component Refactor:** Use Tailwind classes  
⏳ **Dark Mode:** Implement when needed  

**No components changed.** Tokens are ready to use.
