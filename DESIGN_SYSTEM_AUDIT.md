# Design System Refactor — Pre-Implementation Audit

**Branch:** `ui-consistency`  
**Date:** 2026-04-06  
**Status:** Ready for Phase 0

---

## RISK ASSESSMENT & RESOLUTIONS

### ✅ RISK 1: Color hex value mismatch
**Finding:** Plan said `#B0A898` but actual code uses `#8A7F74`  
**Resolution:** Use `#8A7F74` (confirmed in bottom-nav.tsx, perfil/page.tsx)  
**Action:** Corrected in Phase 1 token additions

### ✅ RISK 2: Line-height tokens missing
**Finding:** Current code uses lineHeight: 1, 1.2, 1.5, 1.6  
**Resolution:** Add to Phase 1 typography tokens:
```typescript
lineHeight: {
  tight: 1,
  normal: 1.2,
  relaxed: 1.5,
  loose: 1.6,
}
```

### ✅ RISK 3: "Para Hoy" → "Para hoy" is already fixed
**Finding:** home-screen.tsx already uses lowercase "Para hoy"  
**Resolution:** No action needed; remove from Phase 3 changes

### ✅ RISK 4: Perfil heading inconsistency
**Finding:** Uses `fontFamily: FONT` (var(--font-sans)) while other screens use hardcoded `FONT_UI`  
**Issue:** Not a "large bold serif"—it's already correct (48px, 800wt, sans)  
**Resolution:** In Phase 3, standardize to use tokens.typography.family.ui

### ✅ RISK 5: Component API audit complete
**Finding:** StatPill implementation exists in home-screen.tsx
```typescript
function StatPill({ label, value }: { label: string; value: number | string })
```
**Props confirmed:** label (string), value (number | string)  
**Styling:** 16px padding, 12px border-radius, flex column, 8px gap  
**Resolution:** Phase 2 component can match this exactly

### ✅ RISK 6: SetChip and Avatar patterns verified
**Finding:** No existing SetChip/Avatar components; inline JSX only  
**Pattern in home-screen.tsx:** Chips use inline background + text color styling  
**Resolution:** Phase 2 will create these; prop API documented below

### ✅ RISK 7: Design tokens already 70% complete
**Finding:** lib/design-tokens.ts already has:
- ✓ Core colors (sage, rose, butter, sky, ink, muted, border)
- ✓ Semantic colors (textSuccess, textError, textWarning, textBlue)
- ✓ Light background variants (bgSageSoft, bgSageSuccess, bgSkyLight, bgRoseSoft, bgButterLight, bgGrey, bgSubtle, bgHover, bgDesktopPage)
- ✓ Component colors (progressTrack, navPill, progressIndent)
- ✓ Radius tokens (card, btn)
- ✗ Missing: typography scale, spacing scale, pastel colors

**Resolution:** Phase 1 only adds missing pieces

### ✅ RISK 8: Styling approach defined
**Decision:** Continue using inline React styles + tokens (no CSS migration)
**Rationale:** Existing codebase uses inline styles consistently; CSS migration is out of scope  
**Implementation:** All components will destructure `tokens` from design-tokens.ts

### ✅ RISK 9: Accessibility not deferred—integrated into Phase 2
**Decision:** Aria-labels added during component creation, not Phase 5  
**Reason:** Aria-labels affect JSX structure; can't retrofit cleanly later

### ✅ RISK 10: Visual regression testing strategy
**Approach:**
1. After Phase 1: Build must pass (no visual changes yet)
2. After Phase 2: Components built but not in use (no visual changes yet)
3. After Phase 3: Visual regression likely
   - **Manual check:** Inspect key screens (home, progreso, crear, perfil) at 390px mobile
   - **No automated testing** (out of scope, but manual screenshot comparison recommended)
4. After Phase 4 & 5: Final QA

---

## CONFIRMED COMPONENT APIS

### StatPill
```typescript
interface StatPillProps {
  label: string;        // "Para hoy", "Tarjetas", "Dominadas"
  value: number | string; // count or percentage
}
// Returns: white card, centered flex, 8px gap, label + large value
```

### SetChip
```typescript
interface SetChipProps {
  type: "due" | "aldía";  // determines color
  count?: number;          // optional badge count
}
// due: butter bg (#F5DC7A), butterText color (#5C4A00)
// aldía: softGreen bg (#D4EDBA), softGreenText color (#2E6010)
```

### Avatar
```typescript
interface AvatarProps {
  initials: string;     // 1-2 character initials
  size?: number;        // default 38px
  backgroundColor?: string; // default rose (#F2B8CD)
}
// Returns: circular div, centered text, initials in uppercase
```

### PageTitle
```typescript
interface PageTitleProps {
  children: string;     // "Progreso", "Nuevo set", "Perfil"
}
// Returns: h1, 2xl font size, medium weight, ink color, 0 0 24px margin
```

### SectionHeader
```typescript
interface SectionHeaderProps {
  title: string;
  action?: {
    label: string;      // "Ver todos"
    onClick: () => void;
  };
}
// Returns: flex row with title (left) and optional link (right)
```

---

## UPDATED PHASE BREAKDOWN

### Phase 0 (NEW) — Token & Component Audit ✅ COMPLETE
- [x] Verify hex color values against codebase
- [x] Audit line-height usage and finalize scale
- [x] Audit component APIs (StatPill, SetChip, Avatar)
- [x] Clarify Perfil heading intent
- [x] Confirm styling approach (inline React styles)
- [x] Document accessibility strategy
- [x] Plan visual regression approach

### Phase 1 — Design Tokens (foundation)
**Changes:**
- Add typography scale (size, weight, lineHeight, family)
- Add spacing scale (1, 2, 3, 4, 5, 6, 8, 10, 12)
- Add missing colors (orange, softGreen, softGreenText, butterText, errorBg, errorText, successBg, successText, pastel colors)
- **UPDATED:** Use #8A7F74 (not #B0A898) for secondary text
- **NEW:** Include lineHeight tokens

**Commits:**
1. "Add typography scale to design tokens"
2. "Add spacing scale and missing color tokens"

**Build check:** ✓ Must pass

---

### Phase 2 — Shared UI Components
**Components to create in /components/ui/:**

1. **page-title.tsx** — Reusable heading for all screens
2. **section-header.tsx** — Heading + optional action link
3. **stat-pill.tsx** — Stat card (value + label)
4. **set-chip.tsx** — Status badge (due/aldía)
5. **avatar.tsx** — User initials circle

**Accessibility included:** Each component has aria-labels, aria-current where needed

**Commit:** "Add shared UI component library with accessibility"

**Build check:** ✓ Must pass

---

### Phase 3 — Apply tokens and components
**Files to update (in order):**

1. components/bottom-nav.tsx
   - Replace `#1A1A1A` → `tokens.color.ink`
   - Replace `#8A7F74` → `tokens.color.muted`
   - Update font size if hardcoded

2. components/home-screen.tsx
   - Replace all `#1A1A1A`, `#8A7F74`, hex colors → tokens
   - Replace inline StatPill → `<StatPill>`
   - Replace inline chips → `<SetChip>`
   - Replace inline avatar → `<Avatar>`
   - Update font sizes → tokens.typography.size
   - Update line-height where needed → tokens.typography.lineHeight

3. components/progreso-screen.tsx
   - Add `<PageTitle>Progreso</PageTitle>`
   - Replace hardcoded colors → tokens
   - Update font sizes → tokens

4. components/crear-screen.tsx
   - Add `<PageTitle>Nuevo set</PageTitle>`
   - Replace hardcoded colors → tokens
   - Update font sizes → tokens

5. app/perfil/page.tsx
   - Add `<PageTitle>Perfil</PageTitle>`
   - Replace `fontFamily: FONT` → `tokens.typography.family.ui`
   - Replace hardcoded colors → tokens
   - Update font sizes → tokens

**Commit:** "Apply design tokens and shared components across all screens"

**Build check:** ✓ Must pass, visual regression check required

---

### Phase 4 — Spacing standardization
**Add to design-tokens.ts:**
```typescript
spacing: {
  "1": "4px",
  "2": "8px",
  "3": "12px",
  "4": "16px",
  "5": "20px",
  "6": "24px",
  "8": "32px",
  "10": "40px",
  "12": "48px",
}
```

**Apply standardized spacing:**
- Section header padding-bottom: tokens.spacing["3"]
- Gap between major sections: tokens.spacing["5"]
- Card internal padding: tokens.spacing["4"]
- Grid gap: tokens.spacing["2"]
- Page horizontal padding: tokens.spacing["4"]

**Commit:** "Standardize spacing scale across all screens"

**Build check:** ✓ Must pass

---

### Phase 5 — Accessibility polish
**Items to add (if not in Phase 2):**

- bottom-nav.tsx: aria-label on each button, aria-current on active
- Set card menu: aria-label="Opciones para [set name]"
- Dropdown items: aria-label on each item
- Flashcard controls: aria-label="Voltear tarjeta", etc.

**Commit:** "Add remaining accessibility labels"

**Build check:** ✓ Must pass

---

## SUCCESS CRITERIA

✅ Each phase: `npm run build` passes without errors  
✅ Phase 3: Manual visual QA on mobile, tablet, desktop  
✅ Phase 5: No console warnings about missing accessibility labels  
✅ Final: All hardcoded colors/font-sizes/spacing removed from components (except comments)

---

## NEXT STEPS

1. Review this audit ✓
2. Confirm all findings are correct
3. Proceed with Phase 1 implementation
4. After each phase: Run `npm run build` before moving forward

**Ready to proceed? Say yes to start Phase 1.**
