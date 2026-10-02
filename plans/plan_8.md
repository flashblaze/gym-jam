# New Visual Theme

> **Status (2026-10-02):** Direction **A · Scoreboard** chosen and implemented on `ui-overhaul`
> (dark only, lime accent). The Logbook-specific T0 light/dark plumbing was skipped. Accent choice
> in Settings (orange/cyan/white swatches) is a possible follow-up.

## Objective

Replace the current look with a distinctive theme built for logging at the gym, which means it has to be:

- **glanceable:** readable at arm's length, mid-set, under bad lighting
- **fast:** fat-finger friendly
- **recognisable:** obviously Gym Jam

This is a visual change only: no data model or flow changes. Visual comparison of three directions:
[Gym Jam theme directions](https://claude.ai/artifact/LTFPVjUppfcTQG8XLChe15).

## What's wrong with the current theme

1. **Generic.** Navy-black, an amber accent, rounded cards and Geist is the default "dark SaaS dashboard" look. Nothing about it says training log.
2. **Low contrast where it matters.** `text-fg-faint` (`#565670` on `#0f0f1c`) is about **2.7:1**, below WCAG AA (4.5:1). It's used for dates, captions, set hints and "Last ·" lines, which are exactly the things you squint at between sets.
3. **Dark only.** `forceColorScheme="dark"` is fixed. Bright commercial gyms and outdoor training need a light option.
4. **Numbers aren't the hero.** Weights and reps use the same size and weight as the labels around them, so the set row has no hierarchy.
5. **Every surface is the same card.** Workouts, exercises, stats and set rows all share one rounded-rectangle-with-border, so nothing stands out.
6. **No memorable moments.** Ticking a set, a PR and the rest timer finishing all look like ordinary state changes.

## Directions

All three were mocked up on the workout screen (Bench Press with a PR, a pending set with hints, the rest timer and the 4-tab nav).

### A · Scoreboard

Near-black with one electric accent (lime by default; orange, cyan and white swatches are on the canvas). Condensed uppercase type (Barlow Condensed), huge tabular numerals, hard 2px corners, hairline grid rules. The rest timer is a solid accent bar with LED-style segments.

- **For:** the most glanceable of the three, and it reads from across the room. Low effort, since it stays dark.
- **Against:** dark only by nature; can feel aggressive or "gym-bro"; condensed uppercase hurts long exercise names.

### B · Logbook (recommended)

A digital version of the paper training log lifters carry:

- **Page:** warm off-white grid paper with a red margin rule.
- **Ink:** graphite text, with IBM Plex Mono for the numbers.
- **Done sets:** marked with a **highlighter swipe** (yellow) behind the numbers.
- **PRs:** circled in **red pen**.
- **Pending sets:** a ruled line with grey pencil hints.
- **Night mode:** the same metaphor on graphite paper (toggle on the canvas).

- **For:** genuinely different from every other fitness app. The metaphor explains the interaction for free: tick a set, it gets highlighted. Light-first with a real night variant. Highest contrast of the three, with every text colour at 4.5:1 or better.
- **Against:** the most work, because light and dark both need tuning. The paper texture must stay subtle or it gets busy.

### C · Plates

Warm rubber-black with Olympic bumper-plate colours as the semantic palette: red 25, blue 20, yellow 15, green 10, white 5. Its signature is a **loaded-barbell graphic** on each barbell set, showing the plates per side for that weight (82.5 kg → 25 + 5 + 1.25). Chunky pill shapes, Bricolage Grotesque, a circular rest ring.

- **For:** playful and instantly "gym". The plate graphic is actually useful because it answers "what do I load?".
- **Against:** five strong colours make it hard to stay calm. The plate math needs bar-weight settings (20 kg vs 15 kg bar, kg vs lb), which is a feature on its own.

### Recommendation

**B · Logbook**, following the system colour scheme (auto light and dark) with an Appearance override in Settings. **C's plate graphic** can be added later as an optional feature in any theme.

## Implementation plan

The Phase 0 token layer makes this mostly a palette, type and component restyle. Steps are written for Logbook, but T0 and T1 are the same for any direction.

### T0 · Light/dark plumbing (no visual change)

- `main.tsx`: replace `forceColorScheme="dark"` with `defaultColorScheme="auto"` and add `<ColorSchemeScript>` support in `index.html` so first paint doesn't flash the wrong scheme.
- `src/index.css`: define semantic tokens per scheme on `[data-mantine-color-scheme="light"]` and `[...="dark"]` instead of mapping to fixed `--mantine-color-dark-*` shades. Add tokens the app currently fakes with Tailwind colours:
  - `--color-success`, `--color-danger` (replacing `text-green-500` / `text-red-400` in `WorkoutHeader` and `RestTimer`)
  - `--color-highlight` / `--color-on-highlight`, `--color-pen`, `--color-rule`
- Settings → **Appearance**: System / Light / Dark via `useMantineColorScheme` (Mantine persists it).
- PWA: two `theme-color` metas (one per `prefers-color-scheme` media query) and a matching `background_color`.

### T1 · Palette and type

- **Palette** in `theme.ts`: a `paper` scale (light ground → ink) and a `graphite` scale (night), plus `highlighter` (yellow) and `pen` (red) tuples. `primaryColor` becomes the ink scale, so filled buttons are ink-on-paper and stay neutral; the highlighter is reserved for "done" and "current".
- **Contrast:** every text token at ≥ 4.5:1 on its ground, checked in a unit test that computes ratios from the token hexes so regressions fail CI.
- **Type:** `@fontsource-variable/ibm-plex-sans` and `@fontsource/ibm-plex-mono` replace Geist; `Schibsted Grotesk` 700/800 for headings. Numbers everywhere get `font-mono tabular-nums`.

### T2 · Component restyle

- **Signature, the set row:** ruled-line rows instead of boxed cards. When done, the inputs lose their borders and get the highlighter swipe (slight −0.6° rotation); the checkbox is an ink square. PR is a red-pen ring badge. Pending inputs keep a pencil placeholder.
- **Exercise blocks:** a heading with a 2px ink underline instead of a bordered card.
- **History:** week headers as notebook section dividers; workout rows as ruled entries.
- **Page and nav:**
  - The margin rule goes on the page background (`AppShell`), and the grid texture is a 16px CSS background at ≤ 5% opacity.
  - Nav: text-first tabs, with the active tab marked by a highlighter swipe.
- **Mantine extended components** (Button, ActionIcon, inputs, Menu, Modal, Drawer, Notification): 3–4px radii, ink borders, no shadows. Chart lines in ink, PR points in pen red.
- **Rest timer:** an ink bar with a highlighter progress fill. Inverted in night mode.

### T3 · Motion and moments

- **Tick a set:** the highlighter wipes left to right (150ms, `transform: scaleX`), together with the existing haptic.
- **New PR:** the pen ring draws itself in (SVG stroke-dash, 400ms).
- **Rest over:** the timer bar flashes to highlighter yellow once.
- All of it is wrapped in `prefers-reduced-motion: no-preference`.

### T4 · Brand assets

- New app icon and favicon (a highlighted tick on paper), maskable PWA icons, a splash `background_color`, and updated `theme_color`s.

## Verification

- A contrast unit test on the token pairs (T1).
- Manual check on a phone in bright light and in a dark room, in both schemes.
- Screenshots of the five main screens in both schemes before merging.

## Effort and order

T0 (small) → T1 (small) → T2 (largest: about 15 components, mostly class changes) → T3 → T4. Choosing A or C changes T1 and T2's palette and type, but not T0 or the order.

## Decision needed

Pick a direction (A, B or C), or a mix (e.g. B plus C's plate graphic). Tweak the canvas freely: the Scoreboard accent and Logbook night mode are live toggles.
