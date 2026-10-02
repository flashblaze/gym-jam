# Fixes and Improvements

## Objective

Fix the bugs found in the app review and add the workflow improvements that stop data problems at the source: duplicate exercises, wrong categories, workouts on the wrong day.

New features (wake lock, PR celebration, repeat workout, backup reminder, background rest alert) are **out of scope** and get their own plan.

All changes are in the app code; the stored data shapes are unchanged. Work happens on `ui-overhaul`, one commit per item, and each push redeploys the preview.

## Part 1 — Fixes

### F1 · Recover from stale code after a deploy (high)

**Problem.** Route code is lazy-loaded (`autoCodeSplitting`), the PWA updates itself as soon as a deploy lands (`registerType: "autoUpdate"`), and Cloudflare answers unknown paths with `index.html` (`not_found_handling: "single-page-application"`). An app that was open before a deploy then asks for an old chunk such as `_exerciseId-abc.js`. It gets HTML back, the module import fails, and that page doesn't load.

**Fix.**

- In `src/main.tsx`, listen for Vite's `vite:preloadError` event and reload the page.
- Guard against reload loops: store a timestamp in `sessionStorage` and skip the reload if one happened in the last 10 seconds. In that case show the router's error component with a "Reload" button instead.
- Add a router-level `defaultErrorComponent` with the same "This page failed to load · Reload" message, so any other chunk failure is recoverable too.

**Safe mid-workout?** Yes: unticked rows live in the localStorage draft, and ticked sets are already in IndexedDB once F2 lands.

**Verify.** Build, serve `dist`, then rename one chunk in `dist/assets` so it no longer matches. Navigating to that page should reload once and not loop.

### F2 · Never lose the last ticked set (high)

**Problem.** `useWorkoutPersistence` waits 400 ms after every change before writing. It flushes on `visibilitychange` and unmount, but not when the page is reloaded (F1) or the browser kills it, which is common on iOS.

**Fix.**

- **Write ticks immediately.** Write as soon as the _set of done sets_ changes (tick, untick, delete, undo). Keep the 400 ms delay only for typing into done sets and renaming, which are the cases that actually need batching. Detect it by comparing the count of done sets per block between the last write and now.
- **Flush on `pagehide`** as well as `visibilitychange`. The flush is best-effort, so the immediate write above is what really guarantees ticked sets are kept.

**Tests.** Unit-test the "done sets changed" check in `src/lib/workout.ts`.

### F3 · Export filename uses the local date (low)

`downloadExport` builds the name from `new Date().toISOString()` (UTC). Use `todayIso()` instead, the same fix `todayIso` itself got in Phase 0.

### F4 · Unnamed workouts look unnamed (low)

**Problem.** New workouts store the name `"Session"`, so the header shows "SESSION" and the "Name this workout" placeholder never appears.

**Fix.**

- **Stop writing a default name.** New drafts get `name: ""`. Empty names are valid in the CSV schema and in exports.
- **Treat both as unnamed.** Add an `isDefaultSessionName(name)` helper in `src/lib/workout.ts`, true for `""` and the legacy `"Session"`. The header shows an empty field for those, and the History card already hides them (it switches to the helper).
- **Old data stays as is.** Existing "Session" names aren't rewritten; they just display as unnamed.

### F5 · Cleanup (low)

- **README:** rewrite for the current app:
  - the workout page with tick-to-save
  - History, Exercises with progress, Settings
  - the Scoreboard theme
  - the preview deploy on `gj-preview.flashblaze.dev`
  - the current folder layout
- **Dead code:** delete the unused `SEED_SESSIONS` (~100 lines) from `src/db/seed.ts`.
- **Accessibility:** `SegmentInputs` gets a `setLabel` prop so inputs are named "Set 3 weight" and "Set 3 reps" instead of a bare "Reps".

## Part 2 — Improvements

### I1 · Duplicate-name guard when creating exercises

This prevents the duplicates that needed today's manual cleanup.

- **Name matching:** a new `src/lib/exercise-names.ts` with `normalizeExerciseName(name)` (tested):
  - lower case, punctuation and hyphens removed
  - known abbreviations expanded: `db` → dumbbell, `bb` → barbell, `ez` → ez bar, `ohp` → overhead press, `rdl` → romanian deadlift
  - simple plurals stripped
  - words sorted, so "Lat pulldown close grip" matches "Close grip lat pulldown"
- **Matching:** `findSimilarExercises(name, exercises)` returns:
  - **exact** matches, where the normalised names are equal
  - **similar** matches, where one name's words are a subset of the other's and they share at least two words
- **Form behaviour** (`ExerciseFormDrawer`):
  - **Exact match:** blocks saving with "Already exists as _Dumbbell curls_".
  - **Similar match:** shows a non-blocking "Similar: _Dumbbell curls_" with a **Use this** button.
  - **In the workout picker's create flow,** "Use this" adds the existing exercise to the workout instead.
- **Edit drawer:** the same checks apply, ignoring the exercise being edited.

### I2 · Merge exercises in the app

This replaces the script used for today's cleanup.

- **Entry point:** the edit drawer gets a **Merge into…** button. It opens the exercise picker, filtered to the **same type**; merging a weighted exercise into a bodyweight one isn't allowed.
- **Confirmation:** "Merge _Lateral raises_ (16 sets in 5 workouts) into _Dumbbell lateral raises_? Its history moves over and it's deleted."
- **Data function:** `src/db/merge-exercises.ts` → `mergeExercises(fromId, intoId)`, in one transaction:
  - re-points every segment `exId` and block `exerciseId`
  - deletes the old exercise
  - re-points any saved drafts' block and segment ids, so unticked rows aren't dropped
- **Pure logic:** a `remapExercise(session, fromId, intoId)` helper in `src/lib/sets.ts`, unit-tested next to `stripExercises`.

### I3 · Manage categories

Today categories can only be created, from the exercise form.

- **Settings → Exercises → Categories:** a list with exercise counts per category, plus **Add**, **Rename** and **Delete**.
  - **Delete when empty:** removes it immediately.
  - **Delete when it still has exercises:** asks which category to move them to first (a `Select`), then deletes.
- **Data functions:** `src/db/categories.ts` → `renameCategory`, `deleteCategory(id, moveTo)`, with name validation (non-empty, unique ignoring case).

### I4 · Move a workout to another date

- **Entry point:** the workout ⋯ menu gets **Move to another day…**, which opens a date picker capped at today.
- **Target day is empty:** update the session's `date` and move its draft key (`workout-draft:<old>` → `<new>`), then navigate there.
- **Target day already has a workout:** confirm "Merge into that day's workout?":
  - append this workout's blocks to the other one
  - keep the other workout's name, unless it's unnamed
  - delete this one
- **Data function:** `src/db/move-session.ts` → `moveSession(id, toDate)` and `mergeSessions(fromId, intoId)`, with a pure, tested block-append helper.
- **History** updates automatically through live queries.

### I5 · Rest timer survives leaving the workout page

**Problem.** The timer's state lives inside `WorkoutEditor`, so opening an exercise's history between sets resets it.

**Fix.**

- **Shared state:** move it to a small store, `src/lib/rest-timer.ts`, holding `{ startedAt, targetSeconds, extraSeconds } | null`. It's kept in `sessionStorage` and read with `useSyncExternalStore`.
- **Shown everywhere:** `RestTimer` is rendered once in `AppShell`, above the bottom nav, so it stays visible (and keeps buzzing at zero) on any page while it's running.
- **Starting it:** ticking a set calls `startRestTimer(seconds)`. The rest preference is read at tick time.
- **Ending it:** dismissing clears the store. The timer also auto-clears 10 minutes after the rest is over.

## Order and effort

| #   | Item                     | Effort | Why this order                    |
| --- | ------------------------ | ------ | --------------------------------- |
| 1   | F1 stale-chunk recovery  | S      | Will bite on every preview deploy |
| 2   | F2 immediate tick writes | S      | F1 reloads make it matter         |
| 3   | F3, F4, F5               | S      | Quick, visible polish             |
| 4   | I5 global rest timer     | S–M    | Daily annoyance; self-contained   |
| 5   | I1 duplicate guard       | M      | Prevents new data mess            |
| 6   | I2 merge exercises       | M      | Fixes existing mess in-app        |
| 7   | I3 categories            | M      | Pairs with I2                     |
| 8   | I4 move workout          | M      | Least frequent need               |

## Verification

- `vp check` and `vp test` for every item, with new unit tests for:
  - the done-set comparison (F2)
  - `isDefaultSessionName` (F4)
  - name normalisation and matching (I1)
  - `remapExercise` (I2)
  - category reassignment (I3)
  - the block merge (I4)
  - the rest-timer store (I5)
- Manual pass on the preview after F1/F2:
  - deploy while the app is open, then navigate to a page not yet visited
  - tick a set and immediately reload
- Merging `ui-overhaul` into `main` waits until Part 1 is done and checked on the phone.
