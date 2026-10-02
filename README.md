# Gym Jam

An offline-first gym workout tracker that runs entirely in the browser. No account, no server, no sync: your data lives in IndexedDB and stays on your device. Install it as a PWA and use it at the gym without a connection.

Live at [gj.flashblaze.dev](https://gj.flashblaze.dev).

## Features

- **Workout logging**: one screen per day. Add exercises, enter weight × reps (or mm:ss for timed exercises) and tap ✓ to save each set. Last time's numbers appear as hints and fill empty fields when you tick. Drop sets and supersets live in each set's menu, and deletes can be undone.
- **Saving**: ticked sets are saved immediately, while unticked rows stay in a per-day draft that survives closing the app.
- **Rest timer**: an optional countdown (or count-up) after each set, with vibration when rest is over. You can turn it off in Settings.
- **History**: workouts grouped by week, with total lifted per week. Long-press to multi-select and delete.
- **Exercises**: search, category filters, and your last best set for each exercise. Each exercise page shows:
  - records: top weight, estimated 1RM, total lifted (or reps/time for non-weighted exercises)
  - a progress chart
  - a history list with PR badges
- **Export / import**: back up everything as a ZIP of CSV files. The import shows what's in the archive before replacing your data.
- **Installable PWA**: works offline after the first load, on iOS and Android home screens.

## Stack

| Layer     | Library                                                   |
| --------- | --------------------------------------------------------- |
| UI        | React 19 + Mantine v9 (+ `@mantine/charts`) + Tailwind v4 |
| Routing   | TanStack Router (file-based, per-route code splitting)    |
| Storage   | Dexie (IndexedDB) + dexie-react-hooks                     |
| CSV       | Papa Parse + fflate, validated with Zod                   |
| PWA       | vite-plugin-pwa + Workbox                                 |
| Icons     | Iconify (Solar, Tabler) via unplugin-icons                |
| Toolchain | Vite+ (`vp`): wraps Vite, Rolldown, Vitest, Oxlint, Oxfmt |
| Hosting   | Cloudflare Workers static assets (wrangler)               |

## Getting started

Requires Node.js 24, pnpm 10 and the Vite+ CLI (`npm install -g vite-plus`).

```sh
vp install          # install dependencies
vp dev              # dev server at http://localhost:5173
```

## Commands

```sh
vp dev                       # dev server with HMR
vp run build                 # type-check (tsc -b) + production build
vp preview                   # serve the production build locally
vp check                     # format + lint + type check
vp test                      # unit tests
vp run generate-pwa-assets   # regenerate app icons from public/favicon.svg
```

## Project structure

```
src/
  routes/               # pages (TanStack Router)
    workout/$date.tsx   # the workout logger: one per day, the app's start page
    sessions/           # History (/sessions/$id redirects to the workout page)
    exercises/          # exercise list + per-exercise progress
    settings.tsx        # rest timer, export/import, about
  components/
    workout/            # header, exercise blocks, set rows, picker, rest timer
    sessions/ exercises/ layout/
    extended/           # Mantine components with project defaults (registered in theme)
  db/                   # Dexie schema, seeding, multi-table deletes
  hooks/                # live-query hooks, persistence, preferences, selection
  lib/                  # pure helpers: sets, workout drafts, progress metrics, history, csv/
  theme.ts              # the only place colours are defined (with a contrast test)
```

## Data model

Three IndexedDB tables:

- **Category**: `{ id, name }`
- **Exercise**: `{ id, name, category, type }`, where `type` is `weighted | bodyweight | assisted | timed`
- **Session**: `{ id, date, name, exercises[] }`. Each exercise holds ordered sets, and each set is a list of segments, which is how drop sets and supersets are stored.

Only ticked sets are stored in sessions. Unfinished rows are kept in `localStorage` drafts (`workout-draft:<date>`).

## Export / import

**Settings → Export** downloads a ZIP containing:

| File                   | Contents                              |
| ---------------------- | ------------------------------------- |
| `categories.csv`       | All categories                        |
| `exercises.csv`        | All exercises with type and category  |
| `session_segments.csv` | Every logged set, one row per segment |

Import validates the whole archive first, then replaces all local data.

## Deployment

GitHub Actions (`.github/workflows/deploy.yml`) builds and deploys every push to `main` to the
`gym-jam` Cloudflare Worker on `gj.flashblaze.dev`.

## License

MIT
