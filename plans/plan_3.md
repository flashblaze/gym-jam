# Plan 3 — Multi-Delete, Filled Nav Icons, Verdio Trash Style, Exercise Navigation & Edit

## Context

Six related UX improvements requested for gym-jam:

1. Bulk-delete sessions from the sessions list
2. Active bottom-nav tabs use filled (bold) Solar icons instead of broken (stroke) icons
3. Trash/delete ActionIcon style should match verdio (`variant="outline"` instead of `variant="default"`)
4. Bulk-delete exercises from the exercises list (also add individual delete button per item)
5. Exercise history entries are clickable and navigate to that session
6. Exercise name/category/type is editable via a drawer on the exercise detail page

---

## 1. Filled Icons in Bottom Nav

**File**: `src/components/layout/BottomNav.tsx`

- Import bold variants alongside broken ones:
  - `~icons/solar/list-check-bold` (Sessions active)
  - `~icons/solar/dumbbell-bold` (Exercises active)
- Render bold icon when tab is active, broken icon when inactive.

---

## 2. Verdio Trash Icon Style

**File**: `src/components/sessions/SessionCard.tsx` (line 35–43)

- Change the delete `ActionIcon` from `variant="default"` to `variant="outline"`.
- This matches the verdio pattern for inline item deletions (`variant="outline"`, `color="red"`, `size="sm"`).
- Same `variant="outline"` will be used for all new delete ActionIcons added in features 3 and 4.

---

## 3. Bulk-Delete Sessions

### UX Flow

- Header gains a "Select" `ActionIcon` (e.g. `solar/check-square-broken` icon or similar) that toggles selection mode.
- In selection mode:
  - Each `SessionCard` shows a visual checkbox indicator on the left; tapping the card body toggles selection instead of navigating.
  - The individual per-card trash button is hidden.
  - Header replaces "Select" with a red `Button` showing "Delete (N)" and a "Cancel" text/icon.
- Confirming opens the existing `modals.openConfirmModal` → `db.sessions.bulkDelete(ids)`.

### Files

- **`src/routes/sessions/index.tsx`**:
  - Add `selectionMode: boolean` and `selectedIds: Set<string>` state.
  - Add `toggleSelect(id)`, `handleBulkDelete()` handlers.
  - Render "Select" / "Cancel + Delete (N)" controls in the header.
  - Pass `selectionMode`, `isSelected`, `onToggleSelect` props to `SessionCard`.

- **`src/components/sessions/SessionCard.tsx`**:
  - New props: `selectionMode?: boolean`, `isSelected?: boolean`, `onToggleSelect?: () => void`.
  - In selection mode: left side shows a simple circular checkbox indicator; `onClick` on the main body calls `onToggleSelect`; trash button hidden.
  - Normal mode: unchanged (with `variant="outline"` from feature 2).

---

## 4. Bulk-Delete + Individual-Delete Exercises

### UX Flow

- Same selection-mode pattern as sessions.
- In normal mode, each `ExerciseListItem` gains two icon buttons on the right:
  - Edit (pen icon, `variant="default"`) — navigates to exercise detail (or opens edit drawer directly).
  - Delete (trash icon, `variant="outline"`, `color="red"`) — confirm modal → `db.exercises.delete(id)`.

### Cleanup on delete

When an exercise is deleted, any `SessionExercise` entries referencing that ID should be removed from sessions to prevent orphaned data.  
Handler:

```ts
await db.transaction("rw", [db.exercises, db.sessions], async () => {
  await db.exercises.bulkDelete(ids);
  const allSessions = await db.sessions.toArray();
  for (const sess of allSessions) {
    const filtered = sess.exercises.filter((e) => !ids.includes(e.exerciseId));
    if (filtered.length !== sess.exercises.length) {
      await db.sessions.put({ ...sess, exercises: filtered });
    }
  }
});
```

### Files

- **`src/routes/exercises/index.tsx`**:
  - Add `selectionMode`, `selectedIds`, `toggleSelect`, `handleBulkDelete` state/handlers.
  - Render "Select" / "Cancel + Delete (N)" in header (alongside existing "+" create button).
  - Pass `selectionMode`, `isSelected`, `onToggleSelect`, `onDelete` props to `ExerciseListItem`.

- **`src/components/exercises/ExerciseListItem.tsx`**:
  - New props: `selectionMode?`, `isSelected?`, `onToggleSelect?`, `onDelete?`.
  - Normal mode: show edit icon (`solar/pen-broken`) and trash icon (`solar/trash-bin-minimalistic-broken`, `variant="outline"`, `color="red"`, `size="sm"`) on the right.
  - Selection mode: left checkbox indicator, no action icons, tap toggles selection.
  - Edit icon click → `navigate` to `/exercises/$exerciseId` (detail page already exists; edit opens from there).

---

## 5. Navigate to Session from Exercise History

### Changes

**`src/hooks/use-exercise-history.ts`**:

- Add `sessionId: string` to `ExerciseHistoryEntry` interface.
- Populate it from `sess.id` in the loop: `entries.push({ date: sess.date, sessionId: sess.id, ... })`.

**`src/components/exercises/ExerciseHistoryItem.tsx`**:

- Add `onNavigate?: () => void` prop (or accept `sessionId` directly and call `useNavigate` internally).
- Wrap the entire card in `UnstyledButton` (same pattern as `ExerciseListItem`) with `onClick` navigating to `/sessions/$sessionId`.
- Add a subtle right-arrow icon (`solar/alt-arrow-right-broken`, small, `text-[#565670]`) on the right to signal navigability.

**`src/routes/exercises/$exerciseId.tsx`** (line 106–108):

- Pass `sessionId` from the history entry to `ExerciseHistoryItem`.

---

## 6. Edit Exercise

### New Component: `src/components/exercises/EditExerciseDrawer.tsx`

- Props: `opened`, `onClose`, `exercise: Exercise`, `categories: Category[]`
- Pre-populates `name`, `categoryId`, `type` from the passed exercise.
- "New category" flow identical to `CreateExerciseDrawer`.
- On save: `db.exercises.put({ ...exercise, name, category: resolvedCatId, type })`.
- Success/error toasts matching existing pattern.
- Note: exercise `id` is never changed.

### Changes to `src/routes/exercises/$exerciseId.tsx`

- Import `useDisclosure`, `EditExerciseDrawer`, `useCategories`.
- Add pen icon `ActionIcon` (`variant="default"`, `size="sm"`) in the header row next to "Back" button.
- Wire up `editDrawerOpened` / `openEditDrawer` / `closeEditDrawer` from `useDisclosure`.
- Render `<EditExerciseDrawer ... />` at the bottom of the page.

---

## Implementation Order

1. `BottomNav.tsx` — filled icons (isolated, safe first change)
2. `SessionCard.tsx` — `variant="outline"` on trash button
3. `ExerciseHistoryItem.tsx` + `use-exercise-history.ts` — add sessionId + navigation
4. `EditExerciseDrawer.tsx` (new) + `$exerciseId.tsx` — edit exercise
5. `SessionCard.tsx` + `sessions/index.tsx` — bulk-delete sessions
6. `ExerciseListItem.tsx` + `exercises/index.tsx` — individual delete + bulk-delete exercises

---

## Verification

- `vp dev` — open app in browser
- Sessions tab icon should be filled/bold when on `/sessions/*`, broken otherwise
- Exercises tab icon should be filled/bold when on `/exercises/*`, broken otherwise
- Tap delete on a session card → outline-red trash icon visible; confirm modal deletes it
- Select multiple sessions → confirm modal → all deleted
- Exercise detail page: pen icon opens pre-filled drawer; saving updates name/category/type
- Exercise list: trash icon deletes exercise (and purges from sessions); select mode bulk-deletes
- Exercise history item: tapping navigates to the correct session page
- `vp check` — no TypeScript or lint errors
