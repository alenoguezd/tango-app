# Tango (単語) — Project Context & Current State

## Overview
Japanese-Spanish flashcard PWA. Upload a photo of vocabulary → 
Claude Vision extracts words → study with spaced repetition (SM-2).

**Live URL:** https://tango-app.vercel.app  
**Local path:** /Users/alejandra/flashcard-app  
**GitHub:** tango-app  
**Current branch:** main (ui-consistency merged)

---

## Tech Stack
- **Framework:** Next.js 16 App Router + TypeScript
- **Styling:** Tailwind CSS + inline styles + shadcn/ui
- **Database:** Supabase (PostgreSQL + Auth)
- **AI:** Claude Haiku 4.5 via Anthropic API (/api/extract-vocab)
- **Deployment:** Vercel
- **Development:** Claude Code

---

## Design System (completed)
- **Page background:** #F5F4F0 (warm off-white)
- **Ink:** #1A1A1A
- **Sage:** #A8C87A (primary accent)
- **Butter:** #F5DC7A (due chip)
- **Rose:** #F2B8CD
- **Sky:** #B8CEEA
- **Muted text:** #8A7F74 (updated from #B0A898 for WCAG contrast)
- **Border:** #E8E5E0

**Tokens:** Full typography scale, spacing scale, and color tokens 
in lib/design-tokens.ts  
**Components:** PageTitle, SectionHeader, StatPill, SetChip, Avatar 
in /components/ui/  
**Shared nav:** /components/bottom-nav.tsx used across all screens

---

## Database Schema

### Table: sets
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid | references auth.users |
| name | text | |
| cards | jsonb | [{id, kana, kanji, spanish, example_usage}] |
| is_favorite | boolean | |
| is_public | boolean | |
| progress | jsonb | [{cardId, known, interval, easeFactor, nextReview, repetitions}] |
| share_token | text UNIQUE | nullable — for public sharing |
| shared_at | timestamptz | nullable |
| created_at | timestamp | |
| last_studied | timestamp | |

### RLS Policies
- Users can read/insert/update/delete own sets
- Users can read public sets

---

## Current Screens & Routes

| Screen | Route | Status |
|--------|-------|--------|
| Entry/Splash | / | ✅ Working |
| Inicio | /inicio | ✅ Working |
| Crear | /crear | ✅ Working |
| Estudiar | /estudiar/[id] | ✅ Working |
| Progreso | /progreso | ⚠️ Data loading bug |
| Perfil | /perfil | ✅ Working |

---

## Navigation (current — 4 tabs)
Mobile bottom nav: **Inicio · Crear · Progreso · Perfil**  
Desktop: Fixed 220px left sidebar  
Component: /components/bottom-nav.tsx (shared across all screens)

---

## What's Working

### Core features
- Full auth (signup, login, email verification, password reset)
- Photo upload → Claude Vision extraction → flashcard JSON
- Flashcard flip animation (CSS rotateY)
- Swipe left/right with Web Audio feedback
- Set sharing via public link (/estudiar/[id])
- Save shared set to own account
- Upload limit: 3 sets/month free
- PWA installable from Safari
- Responsive: mobile bottom nav, desktop sidebar
- localStorage fallback for offline use

### SM-2 Spaced Repetition (completed)
- **lib/sm2.ts** — CardProgress type, calculateSM2(), 
  getDueCards(), migrateProgress(), getReviewStats()
- Cards served based on nextReview date
- Swipe right (known) = interval grows exponentially
- Swipe left (repasar) = interval resets to 1 day
- Progress saved to Supabase + localStorage after each swipe
- Non-destructive migration from old {cardId, known} format
- "¡Al día!" empty state when 0 cards due
- Due card count shown on home screen set cards
- Defensive guards for backward-compatible progress format

### Design System (completed)
- Typography scale: xs(10px) → 5xl(56px) in tokens
- Spacing scale: 4px → 48px in tokens  
- Full color token system including missing colors added
- Shared UI components: PageTitle, SectionHeader, StatPill, 
  SetChip, Avatar
- Unified BottomNav across all 4 screens
- All P0 accessibility issues fixed:
  - Touch targets minimum 44x44px
  - WCAG AA contrast on muted text
  - Page background consistent (#F5F4F0)
  - Focus states via globals.css (*:focus-visible)
  - Keyboard navigation on flashcard (← → Space)

---

## Known Issues

| Issue | Priority | Notes |
|-------|----------|-------|
| Progreso screen shows empty state despite studied sets | P1 | Data query bug with new SM-2 progress format |
| All cards show as due on first load (review avalanche) | P1 | No daily cap implemented yet |
| Sets show "223 cards due" — overwhelming | P1 | Needs daily cap from onboarding goal |
| No onboarding flow | P1 | User lands in app with no guidance |
| Descubrir shows hardcoded placeholder data | P1 | Needs real pre-built sets in Supabase |

---

## Pending — Sprint 1 (next)

### 1. Schema update for multi-language (do first)
Add `translation_language: "es" | "en"` to sets table before 
seeding pre-built sets. Cards column will rename `spanish` → 
`translation` conceptually.

### 2. Figma UI implementation
Alejandra has redesigned screens in Figma using shadcn components.
Pure UI changes, no backend. Needs Figma screenshots → Claude Code.

### 3. Onboarding goal selector (shown once after signup)
Three options with projections:
- 5 min/day → 5 new + 15 review → ~650 words/year
- 15 min/day → 10 new + 40 review → ~1,500 words/year  
- 30 min/day → 20 new + 80 review → ~3,000 words/year

Saves to user profile. Drives daily cap.

### 4. Daily cap based on goal
Replace "223 due" with capped daily session.
SM-2 serves only today's cap, not all due cards at once.

### 5. Pre-built sets — seed into Supabase
- 10 sets × ~25 words = ~250 words
- Generated as JSON with Claude, reviewed manually
- Seeded with system user_id, is_public: true
- Both ES and EN translations

**Sets planned:**
| Set | Words | Category |
|-----|-------|----------|
| Saludos y presentaciones | 20 | Esencial |
| Números y tiempo | 25 | Esencial |
| En el restaurante | 30 | Viaje |
| Transporte y direcciones | 25 | Viaje |
| Hotel y alojamiento | 20 | Viaje |
| Ir de compras | 25 | Viaje |
| Emergencias y salud | 20 | Esencial |
| Tiempo y clima | 15 | Cotidiano |
| Familia y personas | 20 | Cotidiano |
| Comida y bebida | 30 | Cotidiano |

### 6. Rōmaji toggle
- Add wanakana library for kana → rōmaji conversion
- Global toggle in Perfil (on/off)
- Converts kana client-side, no DB changes

### 7. Loading skeleton states
Screens needing skeletons: Inicio, Estudiar, Progreso
Use shadcn Skeleton component.

### 8. "Añadir" mechanic in Descubrir
Tap pre-built set → adds to user's library
Green checkmark on already-added sets.

### 9. Free study mode
Tap any set from Inicio → study it directly
Swipes still update SM-2 regardless of entry point.

---

## Roadmap

### Sprint 1 — Now (defines v1 experience)
New language architecture · Figma UI · Onboarding · Daily cap · 
Pre-built sets · Rōmaji · Skeleton states · Free study mode

### Sprint 2 — After validation
- Milestone badges (100 · 500 · 1,500 · 3,000 words)
- Progress by category ("18 of 30 restaurant words")
- Streak calendar (30-day dot grid)
- Empty states with illustrations
- English-Japanese extraction prompt

### Sprint 3 — Monetization & growth
- Stripe subscription (unlimited uploads for Pro)
- Google Login
- Push notifications for daily reminders
- Multi-language expansion (Chinese, Korean, Arabic)
