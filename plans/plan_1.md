# Gym Tracker Migration Plan

## Context

Migrating a standalone HTML gym workout tracker prototype (`gym_tracker_full_app.html`) into the existing React 19 project. The prototype has sessions, exercises, supersets/drop-sets, a set builder, and an SVG weight chart. The goal is an offline-first PWA that launches instantly, persists data in IndexedDB, and has proper routing.

## New Dependencies

Install via `vp add`:

- `@tanstack/react-router` -- client-side routing
- `@tanstack/router-vite-plugin` -- file-based route generation for Vite

Everything else is already installed: Dexie, dexie-react-hooks, vite-plugin-pwa, Mantine, RHF, Zod, dayjs.

No charting library needed -- the SVG weight chart is ~60 lines as a custom component.

## Dexie Schema

**`src/db/index.ts`** -- Two tables:

| Table       | Schema                        | Indexes               |
| ----------- | ----------------------------- | --------------------- |
| `exercises` | `id, name, category, type`    | `id` (PK), `category` |
| `sessions`  | `id, date, name, exercises[]` | `id` (PK), `date`     |

Sessions store exercises as nested JSON (each exercise has `sets: Segment[][]`). A segment is `{exId, w, r}`. Single segment = normal set, multi same exId = drop set, multi diff exId = superset.

**`src/db/seed.ts`** -- 23 exercises + 8 sessions from the prototype.
**`src/db/seed-runner.ts`** -- `seedIfEmpty()` called once at app startup.

## Route Structure (TanStack Router, file-based)

| Path                     | File                               | View                    |
| ------------------------ | ---------------------------------- | ----------------------- |
| `/`                      | `routes/index.tsx`                 | Redirect to `/sessions` |
| `/sessions`              | `routes/sessions/index.tsx`        | Sessions list           |
| `/sessions/$sessionId`   | `routes/sessions/$sessionId.tsx`   | Session detail          |
| `/exercises`             | `routes/exercises/index.tsx`       | Exercises list          |
| `/exercises/$exerciseId` | `routes/exercises/$exerciseId.tsx` | Exercise detail         |
| `/log`                   | `routes/log.tsx`                   | Log exercise            |

**Root layout** (`routes/__root.tsx`): AppShell (max-width container) + BottomNav + `<Outlet />`.

## File Structure

```
src/
  db/
    index.ts              -- Dexie instance + type exports
    seed.ts               -- seed data
    seed-runner.ts        -- seedIfEmpty()
  hooks/
    use-exercises.ts      -- useLiveQuery wrappers
    use-sessions.ts       -- useLiveQuery wrappers
    use-exercise-history.ts
  routes/
    __root.tsx            -- Layout: AppShell + BottomNav + seed
    index.tsx             -- Redirect → /sessions
    sessions/
      index.tsx           -- Sessions list
      $sessionId.tsx      -- Session detail
    exercises/
      index.tsx           -- Exercises list
      $exerciseId.tsx     -- Exercise detail
    log.tsx               -- Log exercise
  components/
    layout/
      AppShell.tsx        -- <div class="mx-auto max-w-md min-h-dvh flex flex-col">
      BottomNav.tsx       -- Sessions | + | Exercises (3 nav buttons)
    sessions/
      SessionCard.tsx
      SessionStats.tsx    -- 3-col stat grid (dl/dt/dd)
      ExerciseCard.tsx    -- Exercise within session detail
      SetRow.tsx          -- weight×reps with SS/DS Badge
    exercises/
      ExerciseCategoryGroup.tsx
      ExerciseListItem.tsx
      WeightChart.tsx     -- SVG line chart
      ExerciseHistoryItem.tsx
    log/
      ExercisePicker.tsx  -- Mantine Select grouped by category
      SetBuilder.tsx      -- Manages sets array
      SetRow.tsx          -- Weight/reps inputs + drop/super buttons
      SegmentRow.tsx      -- Drop/superset segment inputs
      SupersetPicker.tsx  -- Mantine Drawer (bottom sheet) exercise picker
  lib/
    calc.ts               -- sessVolume, sessSetCount, formatDate
    constants.ts          -- category order, type labels
  routeTree.gen.ts        -- Auto-generated (do not edit)
```

## Key UI Decisions

- **BottomNav**: 3 buttons. Center = "+" circle linking to `/log`. Active state from router pathname. Icons from solar icon pack.
- **Superset picker**: Mantine `<Drawer position="bottom">` with exercise list grouped into "Already in this session" + "All exercises". Matches the prototype's bottom-sheet pattern.
- **Set builder**: Each set is a bordered card. Primary segment has full `NumberInput`s. Additional segments indented with smaller inputs. `+ drop` and `+ superset` pill buttons per set.
- **Badges**: Mantine `<Badge size="xs">` -- "SS" (teal/green) for supersets, "DS" (violet) for drop sets.
- **Weight chart**: Custom SVG component with path line + area fill + circles. No library.
- **Forms**: React Hook Form + Zod for the log exercise form. `useFieldArray` for sets, manual segment management within each set.

## PWA Configuration

Add `VitePWA` to `vite.config.ts` plugins:

- `registerType: "autoUpdate"`
- Manifest: name "Gym Jam", display "standalone", theme_color "#2563eb"
- Workbox precaches all assets. No runtime caching (all data is local IndexedDB).
- Create `public/icons/icon-192.png` and `public/icons/icon-512.png` (from favicon.svg).
- Update `index.html`: add theme-color meta tag + apple-touch-icon link.

## Files to Modify

| File             | Change                                    |
| ---------------- | ----------------------------------------- |
| `vite.config.ts` | Add TanStackRouterVite + VitePWA plugins  |
| `src/main.tsx`   | Replace `<App />` with `<RouterProvider>` |
| `index.html`     | Add PWA meta tags                         |

## Files to Delete

- `src/App.tsx` -- replaced by route pages
- `src/App.css` -- unused

## Build Sequence

### Phase 1: Foundation

1. Create `src/db/index.ts` (schema + types)
2. Create `src/db/seed.ts` (seed data)
3. Create `src/db/seed-runner.ts`
4. Create `src/lib/calc.ts` + `src/lib/constants.ts`

### Phase 2: Routing

5. Install deps: `vp add @tanstack/react-router @tanstack/router-vite-plugin`
6. Add TanStackRouterVite plugin to `vite.config.ts`
7. Create `src/routes/__root.tsx` (AppShell + BottomNav + seed)
8. Create all route stubs (placeholder content)
9. Update `src/main.tsx` with RouterProvider
10. Delete `src/App.tsx` + `src/App.css`
11. Verify with `vp dev`

### Phase 3: Read-only views

12. Create hooks (`use-sessions.ts`, `use-exercises.ts`, `use-exercise-history.ts`)
13. Sessions list page + SessionCard
14. Session detail page + SessionStats + ExerciseCard + SetRow
15. Exercises list page + ExerciseCategoryGroup + ExerciseListItem
16. Exercise detail page + WeightChart + ExerciseHistoryItem

### Phase 4: Log exercise

17. ExercisePicker component
18. SetBuilder + SetRow (log) + SegmentRow
19. SupersetPicker (Drawer)
20. Form submission wiring with Dexie writes
21. Test full flow

### Phase 5: PWA

22. Add VitePWA plugin config
23. Create PWA icons
24. Update index.html meta tags
25. Build + test offline: `vp build && vp preview`

### Phase 6: Polish

26. Loading skeletons (Mantine Skeleton)
27. Empty states
28. Run `vp check`

## Verification

1. `vp dev` -- all routes render, navigation works
2. Seed data appears on first load; persists after refresh
3. Log exercise flow: pick exercise → add sets with drops/supersets → save → appears in session detail
4. Exercise detail shows weight chart with >=2 data points
5. `vp build && vp preview` -- service worker registered, app works offline
6. `vp check` -- no type or lint errors
