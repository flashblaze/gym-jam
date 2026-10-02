# UI/UX Overhaul

> **Status (2026-10-02):** Phases 0–4 implemented. Phase 5 (optional schema additions) not started.
> Deviations from this plan: `@mantine/charts` was adopted for the progress chart; swipe-to-delete and
> the ±weight quick-adjust buttons were dropped (no room in the set row on phones); the app now
> opens on today's workout; dependencies were upgraded (Vite+ 1.0, TypeScript 7, Mantine 9.6) and
> React Hook Form, the PostCSS stack, and unused extended components were removed.

## Objective

Rework the app's information architecture, logging flow, and visual system so that logging a full workout at the gym is fast and needs few taps, and reviewing progress is useful. The persisted data structure (`Category`, `Exercise`, `Session` → `SessionExercise` → `WorkoutSet` → `Segment`) and the CSV archive format must stay compatible. Phases 0–4 need **no schema change**. Phase 5 lists optional features that do need one, with an additive migration path.

## Analysis

### Workflow problems

1. **Logging is one exercise per round-trip.** `/log` saves one exercise and then navigates to the session page (`src/routes/log.tsx:165`). A 6-exercise workout means 6 trips through: tap "+", pick date, pick exercise, enter sets, save. The date picker comes first even though it is almost always "today".
2. **No context while logging.** The previous performance for the chosen exercise is never shown, and new sets don't prefill from last time. Users have to remember or go look it up.
3. **Two separate editors for the same data.** `/log` and `/sessions/$id` edit mode each have their own copy of the set operations (add set, drop, superset, validation). Session detail is read-only until you tap "Edit". There is no "add exercise" in session detail; the only way is the bottom-nav "+", which reads the session date from the URL as a hidden side effect (`BottomNav.tsx:28`).
4. **Deleting is too easy, and there's no undo.** Every session card and exercise row has a trash icon right next to the tap target (`SessionCard.tsx:283`, `ExerciseListItem.tsx:826`). The confirm modals are the only safety net.
5. **The sessions list doesn't tell you much.** Each card shows the date, the session name (almost always "Session"), and counts. It shows no exercise names, no volume, and no week grouping.
6. **Progress view is thin.** `WeightChart` has no date axis and no interaction. The stats show only top weight and session count. There's no PR, estimated 1RM, volume trend, or rep-range context. `topEntry.date` is shown as a raw ISO string (`$exerciseId.tsx:97`).
7. **Settings is hard to find.** It only appears as an icon in the Sessions header, and it disappears while in selection mode.
8. **Jargon and small targets.** "SS"/"DS" badges, `text-[10px]` labels, `ActionIcon size="sm"` delete buttons, and number inputs with Mantine steppers in `w-20` fields on a phone.

### Visual system problems

- **Two "primary" colours.** In Mantine the primary is a grey/black scale (`theme.ts:28`, shade 4 = `#757575`). In Tailwind it's amber (`index.css:6`). Filled Mantine buttons render grey, while Tailwind accents render amber.
- **Hardcoded hex everywhere** (`#d4d4e0`, `#565670`, `#18182a`, `#0f0f1c`, …), plus inline `style` colours in `BottomNav`. This goes against the CLAUDE.md styling rules.
- **Inline SVG checkmarks** in `SessionCard` and `ExerciseListItem` (also against CLAUDE.md).

### Correctness issues that affect UX

- **`todayIso()` returns the UTC date** (`calc.ts:47`). In UTC+5:30, anything logged between 00:00 and 05:30 local time goes to yesterday's session. Fix: `dayjs().format("YYYY-MM-DD")`.
- **Deleting an exercise orphans superset segments.** The cascade only removes blocks where `exerciseId === id` (`exercises/index.tsx:249`). Segments with `exId === id` inside other blocks stay behind, and then render with an `undefined` name.
- **Navigating during render**: `void navigate(...)` inside the render body when a record is missing (`$exerciseId.tsx:35`, `$sessionId.tsx:719`).
- **`/exercises` recomputes `lastDateMap`** by scanning every segment of every session on every render.

### Dead code

`src/components/sessions/ExerciseCard.tsx` and `src/components/sessions/SetRow.tsx` are unused (they're a light-theme duplicate of `ViewSetRow`). `src/components/form/*` and `LogoMark.tsx` are unused. CLAUDE.md says "No router", but the app uses TanStack Router.

## Data structure compatibility

Everything in Phases 0–4 maps onto the existing model:

| New UX concept                           | Storage                                                                                                                                    |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| "Workout" screen for a day               | Existing `Session` (one per `date`, found by the `date` index)                                                                             |
| Exercise card in a workout               | `SessionExercise`                                                                                                                          |
| Set row with a ✓ "done" state            | A completed set is a `WorkoutSet` in the session. Rows that aren't done yet live in a local draft and are never persisted (details below). |
| Drop set / superset                      | Unchanged: extra `Segment`s in the same `WorkoutSet`                                                                                       |
| "Last time" hints, PRs, e1RM, volume     | Derived at read time from `sessions`                                                                                                       |
| Rest timer, units display, last-used tab | Per-device UI preferences in `localStorage` (wrapped in try/catch)                                                                         |

**Invariant kept:** the import validator rejects `r === null` for non-timed exercises, and `r <= 0` for timed exercises (`import-archive.ts:183`). So persisted sets must stay complete. Incomplete rows in the new inline logger stay in a per-date draft (`localStorage` key `draft:<date>`) until the user marks them done. This avoids schema changes and keeps exports valid.

## Solution

### Phase 0: Foundations (no visible redesign)

1. **Design tokens.** Define the semantic tokens once, in `src/index.css` `@theme`: `--color-surface`, `--color-surface-raised`, `--color-border`, `--color-fg`, `--color-fg-muted`, `--color-fg-subtle`, `--color-accent-*` (amber). In `theme.ts`, change the Mantine `primary` tuple to the same amber scale so `<Button>` and Tailwind agree. Replace every hardcoded hex and inline `style` colour with token classes. Replace the inline SVG checkmarks with Mantine `Checkbox`, or a solar icon.
2. **Shared domain helpers** (new `src/lib/sets.ts`):
   - `isSegmentComplete(seg, exercise)`: the single validation rule, used by the logger, the session editor, and import.
   - `formatSegment` / `formatSet`: replace the 3 copies of the set-string logic (in `ViewSetRow`, `sessions/SetRow`, and `use-exercise-history`).
   - `emptySegment(exercise, prevW?)`: replaces the repeated `initialR = type === "timed" ? 0 : null`.
   - `workoutReducer`: pure set operations (add/remove/update set, add drop, add superset, add/remove exercise, reorder). This gives one implementation for both editors. Unit-test it in `src/lib/sets.test.ts`.
3. **Shared hooks:** `useExercisesById()` (memoised map; replaces 3 inline `reduce`s) and `useLastPerformance(exerciseId, beforeDate)`.
4. **Bug fixes:** `todayIso` local date; cascade-delete also strips orphan segments (and render missing exercises as "Deleted exercise" so existing data doesn't break); move not-found redirects into `useEffect` or route `loader`s.
5. Delete the dead code. Update CLAUDE.md (router, file layout).

### Phase 1: Inline workout logger (the main change)

Merge `/log` and `/sessions/$sessionId` into a single **Workout** screen: `/workout/$date` (default: today). `/log?date=` and `/sessions/$id` redirect to it so old links and PWA shortcuts keep working.

- **Header:** a date chip (tap opens Mantine `DatePickerInput` in a popover), the session name (inline-editable `TextInput`, placeholder "Workout"), and a summary line (exercises · sets · volume).
- **Body:** one card per `SessionExercise`. Each set row shows: set number, kg, reps (or mm:ss), and a ✓ button. A done row is committed with **one `db.sessions.put` per tap**, so the single-write pattern from plan 6 is kept. Rows that aren't done stay in the draft.
  - Placeholders show last time's values ("80 × 8"). An empty field takes the placeholder value when you tap ✓.
  - Use `inputMode="decimal"` / `"numeric"`, hide steppers, and make fields wide enough for 3–4 digits. Optionally add ±2.5 kg / ±1 rep quick-adjust chips.
  - Drop set / superset go in a per-set `Menu` ("Add drop set", "Superset with…"), with plain-language labels instead of SS/DS badges.
  - Swipe left, or use the menu, to delete a set. Deleting shows an **undo** toast (re-put the previous session snapshot).
- **"Add exercise"** opens a bottom `Drawer` picker with search, a "Recent" group first (derived from sessions), then categories, and an inline "Create new exercise". This replaces `SupersetPicker` and the `Select` on `/log`, and is shared by both.
- **Rest timer:** after a set is marked done, a small sticky bar counts up (or down from a per-exercise default kept in localStorage). It's UI only.
- **Draft recovery:** on load, merge `draft:<date>` from localStorage. Clear it when every row is done or discarded.

### Phase 2: History (sessions list)

- Rename the tab to **History**. Group by week, with a sticky week header showing total sessions and volume.
- Card: the date plus weekday, the name (hidden if it's the default), the first 3 exercise names, and sets · volume.
- Remove the per-card trash icon. Delete from the workout screen (`Menu` → Delete, with undo), or use multi-select via long-press (Mantine `Checkbox` in selection mode).
- Empty state: a CTA that starts today's workout.

### Phase 3: Exercises and progress

- List: a sticky search with no label; category filter chips (Mantine `Chip.Group`) instead of a long sectioned scroll; "last done" and the last top set on each row. Remove the per-row trash.
- Compute `lastDateMap` once in a `useLiveQuery` hook (or `useMemo`), not on every render.
- Detail:
  - Stat tiles: PR weight, best e1RM (Epley), best volume set, sessions. All dates formatted with `formatDate`.
  - Chart: replace the hand-rolled SVG with `@mantine/charts` (`LineChart`), which gives a date axis, tooltips, and a metric switch (top weight / e1RM / volume). This adds a dependency (`@mantine/charts` + `recharts`), so confirm before adding. The fallback is extending the SVG with axis labels and tap-to-inspect.
  - History list unchanged, but uses `formatSet`, and highlights PR sets with a `Badge`.
- Delete moves into the Edit drawer (`Menu` → Delete) with a confirm that states how many sessions are affected.

### Phase 4: Navigation, settings, and polish

- Bottom nav: **Workout · History · Exercises · Settings**. Workout opens today; it replaces the floating "+", which gets rid of the hidden date-passing behaviour. Active state uses token colours, not inline styles. Add `env(safe-area-inset-bottom)` padding for installed PWAs.
- Settings page: sections for Data (export/import, with a summary of what will be overwritten: counts from the archive before confirming), Preferences (default rest time, weight increment), and About.
- Accessibility: 44px minimum tap targets, labels of 12px or larger, `aria-label`s on all icon buttons, visible focus rings.
- Consistent loading and empty states (shared `Skeleton` layouts per page).
- Haptics on set completion (`navigator.vibrate?.(10)`), guarded.

### Phase 5 (optional): Features that need schema additions, and the migration path

Only do these if wanted. Every change is **additive and optional**, so existing records stay valid without being rewritten.

| Feature                                               | Change                                                                             |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Session notes, duration                               | `Session.notes?: string`, `Session.startedAt?: number`, `Session.endedAt?: number` |
| Per-set notes / RPE                                   | `Segment.rpe?: number`                                                             |
| Archive instead of destructive delete (keeps history) | `Exercise.archived?: boolean`                                                      |
| Synced preferences (instead of localStorage)          | New `settings` table: `"key"`                                                      |

Migration steps:

1. **Dexie:** add `db.version(3).stores({ settings: "key" })`. Non-indexed optional fields don't need a store change. No `upgrade()` data rewrite: an absent field means the default. Only add an `upgrade` if an index is needed (e.g. `exercises: "id, category, archived"`).
2. **Types:** add the optional fields to the interfaces in `src/db/index.ts`. The UI treats `undefined` as the default everywhere.
3. **CSV archive (backward compatible):**
   - Exports add new columns at the end (`sessionNotes`, `startedAt`, `endedAt` on `session_segments.csv`, repeated per row like `sessionName`; `rpe` per segment; `archived` on `exercises.csv`). Add `settings.csv` as an **optional** file.
   - Import schemas mark the new columns `.optional()` with the same `numericCoercion`. `getCsv` gets an optional variant for `settings.csv`. Old archives import unchanged, and new archives import into new builds.
   - Add a `meta.json` (`{ formatVersion: 2 }`) to the zip. Import treats a missing file as version 1.
   - Validate new numeric fields at the boundary: `rpe` 1–10, `endedAt >= startedAt`, timestamps non-negative.
   - Extend `flatten.test.ts` with round-trip tests for both a v1 archive (no new columns) and a v2 archive.
4. **Rollback:** the new fields are optional and the old code ignores unknown properties. A v2 archive imported into an old build fails only on `settings.csv`/extra columns if Papa/zod are strict. They aren't for extra keys (zod `object` strips them by default), so downgrade is safe apart from losing the new fields.

## Execution order and verification

1. Phase 0 is landed first and on its own; it has no visible behaviour change apart from the colour fix and bug fixes. Run `vp check` and `vp test` (new `sets.test.ts`).
2. Phase 1 behind the new route, with old routes redirecting. Test manually on an installed PWA: log a 5-exercise workout, kill the app mid-workout and reopen (draft restored), export then import round-trip.
3. Phases 2–4 independently, one PR each.
4. Phase 5 only after deciding which optional features are wanted.

### Files touched (main)

- `src/index.css`, `src/theme.ts`: tokens, primary colour
- `src/lib/calc.ts`: `todayIso`, `sessVolume` reuse, e1RM helper
- `src/lib/sets.ts` (new), `src/lib/sets.test.ts` (new)
- `src/hooks/use-exercises.ts` (`useExercisesById`), `src/hooks/use-last-performance.ts` (new)
- `src/routes/workout/$date.tsx` (new); `src/routes/log.tsx` and `src/routes/sessions/$sessionId.tsx` become redirects
- `src/components/workout/*` (new: `ExerciseBlock`, `SetRow`, `ExercisePickerDrawer`, `RestTimer`)
- `src/routes/sessions/index.tsx` → History; `src/components/sessions/SessionCard.tsx`
- `src/routes/exercises/*`, `src/components/exercises/*`
- `src/components/layout/BottomNav.tsx`, `AppShell.tsx`
- `src/routes/exercises/index.tsx`: orphan-safe cascade delete
- Delete: `src/components/sessions/ExerciseCard.tsx`, `src/components/sessions/SetRow.tsx`, `src/components/form/*`, `src/components/LogoMark.tsx`
