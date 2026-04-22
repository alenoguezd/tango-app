# Tango (単語) — Project Plan

> **Read this first.** Developer reference for architecture, decisions, rules, and roadmap.

---

## 1. Project Overview

**Tango** is a Japanese-Spanish flashcard PWA. Users photograph vocabulary lists → Claude Vision extracts words → study with SM-2 spaced repetition.

| | |
|---|---|
| **Prod** | https://tango-app-gamma.vercel.app (branch: `main`) |
| **Dev preview** | Vercel preview URL for branch: `dev` |
| **Repo** | github.com/alenoguezd/tango-app |
| **Local path** | /Users/alejandra/flashcard-app |

### Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16, App Router, TypeScript |
| Styling | Tailwind CSS v4 (`@theme inline`) + shadcn/ui |
| Database + Auth | Supabase (PostgreSQL + Auth) |
| AI | Claude Haiku 4.5 via `/api/extract-vocab` |
| Deployment | Vercel |

---

## 2. Architecture Decisions

### SM-2 Spaced Repetition (`lib/sm2.ts`)
Simplified two-quality variant: swipe right = quality 1 (known), swipe left = quality 0 (repasar).  
Key functions: `calculateSM2`, `getDueCards`, `buildDailyQueue`, `getTodayString`, `addDays`.  
`getTodayString()` and `addDays()` both use **local time** — keep them consistent, never mix with UTC.

### Progress Storage (`user_progress` table)
Progress lives in `user_progress` — one row per `(user_id, card_id)`.  
Upsert on every swipe. Never write SM-2 state to `sets.progress` or localStorage.  
`sets.progress` column still exists in the DB but is no longer read or written by the app.

### Daily Cap Logic
`user.user_metadata.daily_goal = { newPerDay, reviewPerDay }` (set during onboarding).  
`buildDailyQueue(allCardIds, progress, newPerDay, reviewPerDay)` → `Set<cardId>`.  
New = card has no `user_progress` row. Review = row exists with `next_review <= today`.

### Supabase Client
Always use `createClient()` from `lib/supabase.ts` — the anon-key JS client with RLS.  
Never call Supabase from bash scripts or server-side scripts with the service role key in app code.

### Branch Strategy
`dev` = active development, Vercel preview.  
`main` = production, Vercel prod build.  
All commits go to `dev`. Merge to `main` only for releases (`git merge dev` fast-forward).

### Tailwind v4
CSS variables defined in `app/globals.css` under `@theme inline` are auto-available as Tailwind utilities.  
Examples: `text-text-primary`, `bg-bg-page`, `text-sky`, `border-border-default`.

---

## 3. Roadmap

### ✅ Completed
- Auth: signup, login, email verification, password reset
- Photo upload → Claude Vision → flashcard JSON extraction
- Flashcard flip + swipe gestures (left/right/down) with haptic feedback
- SM-2 spaced repetition with daily cap (newPerDay + reviewPerDay)
- `user_progress` table — replaces localStorage+sets.progress merge
- Today card on home screen (new + review count)
- Per-set due count badges
- Pre-built public sets (10 sets, curator-system-001 user)
- Public set progress tracked per-user via `user_progress` (no ownership required)
- Set sharing via public link (`/estudiar/[share_token]`)
- Save shared set to own account
- Onboarding flow (daily goal selection)
- Responsive layout: mobile bottom nav, desktop left sidebar
- PWA installable from Safari
- Word feedback feature: flag icon on card → modal → `feedback` table
- Progreso screen reads from `user_progress`
- Upload limit: 3 sets/month (free tier)

### 🔄 In Progress
- `(supabase as any).from("user_progress")` casts — remove once Supabase types are regenerated after table creation (`npx supabase gen types typescript`)

### ⬜ Upcoming
- **Romaji toggle** — show/hide romaji reading on card front
- **English → Japanese** — reverse study direction (Spanish prompt, type/pick kana)
- **SVG icons** — replace Lucide with custom SVG set matching Figma spec
- **Figma design alignment** — audit all screens against Figma file
- **Streak tracking** — compute from `user_progress.last_studied` (currently hardcoded 0)
- **Feedback review dashboard** — admin view of `feedback` table reports

---

## 4. Coding Rules

1. **Tailwind classes only — no inline styles.**  
   Exception: dynamic values that can't be expressed as classes (e.g. `width: ${pct}%` on progress bars).

2. **`Array.isArray(x)` for progress guards — never `x || []`.**  
   Old sets stored `progress` as a number; `5 || []` returns `5`, not `[]`.

3. **Never use the service role key in app code or bash commands.**  
   It lives only in `.env.local`. Use `createClient()` (anon key + RLS) for all DB operations.  
   Never log or print API keys or secrets anywhere.

4. **Plan before acting on multi-file changes.**  
   State root cause, list every file touched, get confirmation before writing code.

5. **All commits go to `dev`. Never commit directly to `main`.**

6. **No localStorage for SM-2 progress.**  
   `user_progress` is the source of truth. localStorage may cache set metadata (title, cards) but never progress state.

---

## 5. Known Caveats & Technical Debt

| Issue | Detail |
|---|---|
| `(supabase as any)` casts | Three files cast `user_progress` queries to `any` because Supabase generated types don't include the new table. Fix: run `npx supabase gen types typescript --project-id rcvarkhfdavprartsydl > lib/database.types.ts` then wire up the client. |
| `card_id` uses index strings | Sets created before the ID migration have card IDs like `"0"`, `"1"`, `"2"` instead of UUIDs. The `unique (user_id, card_id)` constraint means if card IDs ever change, old `user_progress` rows become orphaned. |
| `sets.progress` column | Still present in DB, still returned by `select("*")`. Ignored by the app. Could be dropped after confirming no rollback needed. |
| `handleSaveSet` uses `progress: 0` | When copying a shared set, the insert still writes `progress: 0` to the sets row (old format). Harmless but inconsistent. |
| Pre-existing TypeScript errors | Several files have pre-existing `TS6133` (unused vars) and `TS2769` (Supabase type) errors unrelated to recent work. |
| Streak counter | `currentStreak` is hardcoded to `0` in progreso-screen since the localStorage-based streak was removed. Needs reimplementation using `user_progress.last_studied`. |

---

## 6. Supabase Schema

**Project ID:** `rcvarkhfdavprartsydl`

### `sets`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | refs auth.users; null for curator/public sets |
| name | text | |
| cards | jsonb | `[{id, kana, kanji, spanish, example_usage}]` |
| is_favorite | boolean | |
| is_public | boolean | |
| progress | jsonb | **Legacy — no longer written.** Old `[{cardId, known, …}]` format |
| share_token | text UNIQUE | nullable; used for public sharing links |
| shared_at | timestamptz | nullable |
| created_at | timestamptz | |
| last_studied | timestamptz | no longer updated by the app (progress moved to user_progress) |

RLS: users read/write own rows; anyone reads public rows.

### `user_progress`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | gen_random_uuid() |
| user_id | uuid | refs auth.users, not null |
| card_id | text | matches `cards[n].id` in sets.cards |
| set_id | text | matches sets.id |
| interval | int | days until next review (SM-2) |
| repetitions | int | successful review count |
| ease_factor | float | SM-2 difficulty multiplier (1.3–2.5) |
| next_review | date | YYYY-MM-DD; compared against getTodayString() |
| last_studied | timestamptz | updated on every swipe |

Unique constraint: `(user_id, card_id)`.  
RLS: users read/write only their own rows (single `for all` policy).

### `feedback`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | |
| card_id | text | |
| set_id | text | |
| reason | text | "Traducción incorrecta" \| "Ejemplo incorrecto" \| "Otro" |
| comment | text | nullable |

RLS: users insert own rows; no read policy (admin-only review).
