# Gym Jam

An offline-first gym workout tracker that runs entirely in the browser. No account, no server, no sync — your data lives in IndexedDB and stays on your device. Install it as a PWA and use it at the gym without a connection.

## Features

- **Log workouts** — pick an exercise, add sets with weight + reps (or duration for timed exercises), record drop sets and supersets in the same set row
- **Session history** — browse past sessions by date, edit any session after the fact, bulk-delete
- **Exercise library** — create and manage exercises grouped by category (weighted, bodyweight, assisted, timed types)
- **Per-exercise history** — view every logged set for an exercise and a weight-over-time chart
- **Export / Import** — back up your entire database as a ZIP archive (three CSV files) and restore it on any device
- **Installable PWA** — works offline after first load; add to home screen on iOS and Android

## Stack

| Layer     | Library                                                    |
| --------- | ---------------------------------------------------------- |
| UI        | React 19 + Mantine v9 + TailwindCSS v4                     |
| Routing   | TanStack Router (file-based)                               |
| Forms     | React Hook Form + Zod                                      |
| Storage   | Dexie (IndexedDB wrapper) + dexie-react-hooks              |
| PWA       | vite-plugin-pwa + Workbox                                  |
| CSV       | Papa Parse + fflate                                        |
| Icons     | Iconify (Solar, Tabler, Charm)                             |
| Toolchain | Vite+ (`vp`) — wraps Vite, Rolldown, Vitest, Oxlint, Oxfmt |

## Prerequisites

- **Node.js** ≥ 18 (use `vp env` to manage versions if you have Vite+ installed)
- **pnpm** ≥ 10 — `npm install -g pnpm`
- **Vite+** global CLI — `npm install -g vite-plus` (provides the `vp` command)

## Getting started

```sh
# Install dependencies
vp install          # or: pnpm install

# Start the dev server
vp dev              # opens http://localhost:5173
```

## Available commands

```sh
vp dev              # Dev server with HMR
vp build            # Type-check + production build
vp preview          # Preview the production build locally
vp check            # Format + lint + TypeScript type check
vp test             # Run unit tests (Vitest)
vp lint .           # Lint with Oxlint
vp fmt              # Format with Oxfmt
```

## Project structure

```
src/
  routes/             # File-based pages (TanStack Router)
    log.tsx           # Log a new exercise
    settings.tsx      # Export / import data
    sessions/         # Session list + detail/edit
    exercises/        # Exercise list + detail
  components/
    layout/           # AppShell (top bar) + BottomNav
    log/              # Set/segment row inputs, superset picker
    sessions/         # Session card, exercise card, stats
    exercises/        # Create/edit drawers, history, weight chart
    form/             # Controlled* wrappers (React Hook Form + Mantine)
    extended/         # Mantine .extend() components registered in theme
  db/
    index.ts          # Dexie schema (Category, Exercise, Session)
    seed.ts           # Default exercises and categories
  hooks/              # useLiveQuery wrappers (useExercises, useSessions, …)
  lib/
    calc.ts           # Formatting and computation utilities
    csv/              # Export/import pipeline (schemas, flatten, archive)
```

## Data model

All data is stored locally in IndexedDB via Dexie. There are three tables:

- **Category** — `{ id, name }`
- **Exercise** — `{ id, name, category, type }` where `type` ∈ `weighted | bodyweight | assisted | timed`
- **Session** — `{ id, date, name, exercises[] }` where each exercise holds an ordered array of sets, and each set is an array of segments (enabling supersets and drop sets)

## Export / Import

Go to **Settings** → **Export Archive** to download a ZIP containing:

| File                   | Contents                                       |
| ---------------------- | ---------------------------------------------- |
| `categories.csv`       | All categories                                 |
| `exercises.csv`        | All exercises with type and category reference |
| `session_segments.csv` | All sets, one row per segment                  |

Import replaces the entire local database with the archive contents. Use it to migrate between devices or as a manual backup.

## PWA / Offline

The app registers a Workbox service worker on first load and caches all assets. Subsequent visits — including after installing to the home screen — work without a network connection. Data is never sent anywhere.

## License

MIT
