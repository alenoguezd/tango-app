# App Analysis & Fix Plan

**Date**: March 13, 2026
**Status**: Analysis Complete - Ready for Review

---

## EXECUTIVE SUMMARY

5 issues identified across the app. All have clear root causes and low-to-medium fix complexity. No architectural changes needed.

| Issue | Location | Risk | Status |
|-------|----------|------|--------|
| 1. Logout missing on mobile | home-screen.tsx | Low | 🔴 Not implemented |
| 2. Password reset not wired | app/page.tsx | Medium | 🔴 Not implemented |
| 3. Rename/Delete/Favorite not syncing | home-screen.tsx, components | Medium | ⚠️ Partial (localStorage only) |
| 4. Progress reset missing | progreso-screen.tsx | Low | 🔴 Not implemented |
| 5. Error handling incomplete | Multiple files | Medium | ⚠️ Partial (some logging) |

---

## DETAILED ANALYSIS

### 🔴 ISSUE 1: Logout Button Missing on Mobile

**What's happening:**
- Desktop: Logout button visible on AppSidebar (app-sidebar.tsx:60-80)
- Mobile: No logout button at all
- HomeScreen receives `onLogout` prop (home-screen.tsx:27) but never renders it
- Mobile nav doesn't have logout option

**Where the code is:**
- `components/app-sidebar.tsx` lines 60-80 (logout button exists for desktop)
- `components/home-screen.tsx` lines 89, 441-458 (mobile nav defined, no logout)
- `app/inicio/page.tsx` lines 76-82 (logout handler defined but only passed to desktop sidebar)

**Current behavior:**
```
Desktop: [Inicio][Crear][Progreso][---logout button---]
Mobile:  [Inicio][Crear][Progreso] ← no logout option
```

**Expected behavior:**
Mobile should have logout in the nav or as a button somewhere accessible.

**Fix approach:**
- Add logout option to mobile nav in HomeScreen (lines 455-457)
- OR add a logout button at bottom of mobile content before nav
- Option A (recommended): Add logout to mobile nav as 4th item or in a menu

**Risk**: LOW - UI-only change, no database interactions

---

### 🔴 ISSUE 2: Password Reset Not Wired

**What's happening:**
- Login form has "¿Olvidaste tu contraseña?" link (app/page.tsx:~210)
- Link has no onClick handler
- No password reset logic exists in the app

**Where the code is:**
- `app/page.tsx` lines 196-210 (login form, forgot password link)
- Link is a button with no handler or functionality

**Current behavior:**
```javascript
<button>¿Olvidaste tu contraseña?</button> // does nothing
```

**Expected behavior:**
Clicking should trigger Supabase password reset flow or show password reset screen.

**Fix approach:**
- Option A: Add `onClick={handleForgotPassword}` handler
- Handler should call `supabase.auth.resetPasswordForEmail(email)`
- Show success message: "Enviamos un link de recuperación a tu email"
- OR show new "Reset Password" screen with code input

**Risk**: MEDIUM - Requires Supabase auth flow, but straightforward API call

---

### ⚠️ ISSUE 3: Rename/Delete/Favorite Not Syncing to Supabase

**What's happening:**
1. **Rename** (home-screen.tsx:576-597):
   - Updates localStorage (lines 584-590)
   - NO Supabase update call
   - Changes are lost on logout

2. **Delete** (home-screen.tsx:149-157):
   - Removes from localStorage only (line 152-153)
   - NO Supabase delete call
   - Deleted set still appears after logout

3. **Favorite** (home-screen.tsx:138-146):
   - Updates localStorage only (line 143)
   - NO Supabase update call
   - Status lost on logout

4. **Share** (home-screen.tsx:113-135):
   - DOES update Supabase (lines 121-125) ✅
   - Sets `is_public = true`
   - Good example to follow

**Where the code is:**
- `components/home-screen.tsx`:
  - handleShare: lines 113-135 (has Supabase, good example)
  - handleToggleFavorite: lines 138-146 (localStorage only)
  - handleDeleteSet: lines 149-157 (localStorage only)
  - saveName (for rename): lines 581-597 (localStorage only)

**Current behavior:**
```
User renames "Set 1" → "New Name"
  ✅ Updates localStorage
  ❌ Supabase still shows "Set 1"
After logout → "Set 1" appears again (from Supabase)
```

**Expected behavior:**
```
User renames "Set 1" → "New Name"
  ✅ Updates localStorage (immediate feedback)
  ✅ Updates Supabase (persistence)
After logout → "New Name" appears (from Supabase)
```

**Fix approach:**

**For Rename** (lines 581-597):
```javascript
const saveName = async () => {
  if (editedName.trim()) {
    // 1. Update localStorage (existing code, lines 584-590)
    const savedSets = localStorage.getItem("vocab_sets");
    if (savedSets) {
      const sets = JSON.parse(savedSets);
      const updatedSets = sets.map((s: any) =>
        s.id === set.id ? { ...s, title: editedName.trim() } : s
      );
      localStorage.setItem("vocab_sets", JSON.stringify(updatedSets));
    }

    // 2. NEW: Update Supabase
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("sets")
          .update({ title: editedName.trim() })
          .eq("id", set.id)
          .eq("user_id", user.id);
        console.log("[Rename] Updated Supabase");
      }
    } catch (err) {
      console.error("[Rename] Supabase update failed:", err);
      // Don't revert - keep localStorage change
    }

    set.title = editedName.trim();
  } else {
    setEditedName(set.title);
  }
  setIsEditing(false);
};
```

**For Favorite** (lines 138-146):
Follow handleShare pattern (lines 113-135). Need to:
- Get user ID
- Call Supabase update with `is_favorite = true/false`
- Handle errors gracefully

```javascript
const handleToggleFavorite = async (setId: string) => {
  // 1. Update localStorage (existing, line 143)
  setLocalSets((prev) => {
    const updated = prev.map((set) =>
      set.id === setId ? { ...set, favorite: !set.favorite } : set
    );
    localStorage.setItem("vocab_sets", JSON.stringify(updated));
    return updated;
  });

  // 2. NEW: Update Supabase
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const isFavorite = localSets.find(s => s.id === setId)?.favorite;

    if (user) {
      await supabase
        .from("sets")
        .update({ is_favorite: !isFavorite })
        .eq("id", setId)
        .eq("user_id", user.id);
    }
  } catch (err) {
    console.error("[Favorite] Supabase update failed:", err);
  }
};
```

**For Delete** (lines 149-157):
```javascript
const handleDeleteSet = async (setId: string) => {
  if (confirm("¿Eliminar este set? Esta acción no se puede deshacer")) {
    // 1. Update localStorage (existing, line 152-153)
    setLocalSets((prev) => {
      const updated = prev.filter((set) => set.id !== setId);
      localStorage.setItem("vocab_sets", JSON.stringify(updated));
      return updated;
    });

    // 2. NEW: Delete from Supabase
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { error } = await supabase
          .from("sets")
          .delete()
          .eq("id", setId)
          .eq("user_id", user.id);

        if (error) {
          console.error("[Delete] Supabase delete failed:", error);
          showToast("No se pudo eliminar el set en la nube");
        } else {
          console.log("[Delete] Deleted from Supabase");
        }
      }
    } catch (err) {
      console.error("[Delete] Error deleting from Supabase:", err);
    }
  }
};
```

**Risk**: MEDIUM
- Requires Supabase calls (straightforward)
- Must handle errors without breaking localStorage state
- Follow existing pattern from `handleShare`

---

### 🔴 ISSUE 4: Progress Reset Missing

**What's happening:**
- Progress screen exists (progreso-screen.tsx)
- Shows progress stats and per-set breakdown
- NO "Reset Progress" button or functionality
- User can't reset their progress

**Where the code is:**
- `components/progreso-screen.tsx` - entire component
- `app/progreso/page.tsx` - page wrapper
- No reset handler exists anywhere

**Current behavior:**
User views progress, cannot reset it.

**Expected behavior:**
Button to "Reiniciar progreso" that:
- Clears all card `known` flags
- Resets progress percentages to 0%
- Updates both localStorage and Supabase
- Shows confirmation dialog

**Fix approach:**
1. Add "Reiniciar progreso" button to ProgresoScreen (bottom of screen)
2. Create `handleResetProgress` function
3. Get all user's sets from localStorage + Supabase
4. Reset all cards: `{ ...card, known: false }`
5. Reset progress: `0`
6. Update both localStorage and Supabase
7. Show toast confirmation

**Risk**: LOW
- No complex logic
- Clear user intent (confirmation dialog)
- Straightforward updates

---

### ⚠️ ISSUE 5: Error Handling Incomplete

**Problems found:**

1. **Missing try-catch in critical paths:**
   - home-screen.tsx `handleShare` (line 113): has try-catch ✅ but swallows errors silently
   - home-screen.tsx `handleToggleFavorite` (line 138): NO try-catch ❌
   - home-screen.tsx `handleDeleteSet` (line 149): NO try-catch ❌
   - home-screen.tsx `saveName` (line 581): NO try-catch ❌

2. **Silent failures:**
   - Supabase calls fail, user never knows
   - No error messages to user
   - Only console logs in some places

3. **Incomplete validation:**
   - Email validation only in password field type
   - Password strength not validated
   - No check for empty set names before saving

4. **Missing error messages:**
   - No user-facing error toast for Supabase failures
   - User doesn't know if action succeeded or failed

**Where the code is:**
- `components/home-screen.tsx` (multiple handlers)
- `app/page.tsx` (login/signup)
- `components/crear-screen.tsx` (image upload)
- `app/estudiar/[id]/page.tsx` (save progress)

**Current behavior:**
```javascript
try {
  await supabase.from("sets").update(...);
} catch (err) {
  console.log("Supabase save failed"); // only console, user doesn't see
}
```

**Expected behavior:**
```javascript
try {
  await supabase.from("sets").update(...);
  showToast("¡Set actualizado!");
} catch (err) {
  console.error("[Rename] Error:", err);
  showToast("Error: no se pudo guardar en la nube"); // user sees this
}
```

**Fix approach:**

1. **Add try-catch to all Supabase calls:**
   - Wrap all `.update()`, `.delete()`, `.insert()` calls
   - Catch errors and show toast

2. **Add error toast to showToast function:**
   - Toast already exists (home-screen.tsx:107-110)
   - Use for both success and error messages

3. **Add console.log prefixes for debugging:**
   - Already done in recent commits ([Crear], [Inicio], [Estudiar])
   - Extend to home-screen operations

4. **Add client-side validation:**
   - Check set name not empty before save
   - Check email format before submission
   - Check password meets minimum requirements

**Risk**: MEDIUM
- Many places to update
- Needs consistent error message structure
- Should not break existing functionality

---

## FIX IMPLEMENTATION SEQUENCE

**Phase 1 - Critical (Days 1-2):**
1. Add logout to mobile nav (Issue 1)
2. Add Supabase sync for rename/delete/favorite (Issue 3)

**Phase 2 - Important (Days 3-4):**
3. Wire up password reset (Issue 2)
4. Add progress reset button (Issue 4)

**Phase 3 - Quality (Days 5-6):**
5. Improve error handling across app (Issue 5)
6. Add validation

---

## FILES TO MODIFY

### Issue 1: Logout Button (Mobile)
- `components/home-screen.tsx` - add logout to mobile nav
- `app/inicio/page.tsx` - pass onLogout to HomeScreen (already done)

### Issue 2: Password Reset
- `app/page.tsx` - add handleForgotPassword function and handler

### Issue 3: Supabase Sync
- `components/home-screen.tsx` - update handleToggleFavorite, handleDeleteSet, saveName
- Add 3 Supabase update calls following handleShare pattern

### Issue 4: Progress Reset
- `components/progreso-screen.tsx` - add reset button and handler
- `app/progreso/page.tsx` - pass necessary props if needed

### Issue 5: Error Handling
- `components/home-screen.tsx` - add error handling to all Supabase calls
- `app/page.tsx` - improve validation and error messages
- `components/crear-screen.tsx` - already has some error handling
- Other files as needed

---

## RISK ASSESSMENT

| Issue | Complexity | Risk | Effort |
|-------|-----------|------|--------|
| 1. Mobile logout | Simple | LOW | 30 min |
| 2. Password reset | Moderate | MEDIUM | 1 hour |
| 3. Supabase sync | Moderate | MEDIUM | 2 hours |
| 4. Progress reset | Simple | LOW | 1 hour |
| 5. Error handling | High | MEDIUM | 3 hours |

**Total Estimated Effort**: 7-8 hours

**No architectural changes needed** - all fixes are localized to existing functions/components.

**No database schema changes needed** - columns already exist (title, is_favorite, is_public, cards).

---

## TESTING CHECKLIST (Post-Implementation)

- [ ] Logout works on mobile nav
- [ ] Logout works on desktop sidebar
- [ ] Rename updates in Supabase and persists after logout
- [ ] Delete removes from Supabase and doesn't reappear
- [ ] Favorite toggles sync to Supabase
- [ ] Share still works (already tested)
- [ ] Password reset email is sent
- [ ] Progress reset clears all cards and Supabase
- [ ] All Supabase errors show toast messages
- [ ] No console errors on happy path

---

## NOTES

- All console.log prefixes ([Crear], [Inicio], etc.) help with debugging
- Follow handleShare() pattern for all Supabase updates - it's correct
- localStorage should always be updated FIRST for immediate UI feedback
- Supabase updates are secondary (fire-and-forget is OK for UX)
- Error handling should be user-friendly, not technical
