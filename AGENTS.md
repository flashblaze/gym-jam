<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Tool Versions

Run `vp toolchain` to show versions and relationships in the active Vite+
release. Add a tool name to select part of the graph. For example, run
`vp toolchain vite`. Use `--global` to ignore the local `vite-plus` package. Use
`vp why <package>` to show the package-manager dependency graph.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->

## Commands

```sh
vp dev       # Start Vite dev server
vp build     # TypeScript check + production build (runs tsc -b && vp build)
vp lint .    # Lint with oxlint
vp preview   # Preview production build
```

**Linter/formatter**: `oxlint` and `oxfmt` via `vp` — not ESLint or Prettier.

## Architecture

Single-page React 19 app. No monorepo, no separate backend.

```
src/
  routes/       – TanStack Router file-based routes (routeTree.gen.ts is generated)
  components/
    extended/   – Mantine components extended with project defaults (via .extend())
    layout/     – AppShell, BottomNav
    exercises/, sessions/, workout/ – feature components
  db/           – Dexie schema (index.ts), seeding, multi-table mutations
  hooks/        – useLiveQuery-backed data hooks
  lib/          – Pure helpers: calc.ts, sets.ts (set validation/formatting/builders),
                  workout.ts (in-progress workout draft ⇄ Session), history.ts (week grouping),
                  progress.ts (per-exercise metrics, PRs, e1RM), csv/
  main.tsx      – Entry point (MantineProvider, ModalsProvider, Notifications, RouterProvider)
  theme.ts      – Mantine theme (colors, font, component overrides)
  cn.ts         – clsx + tailwind-merge utility
  index.css     – Global styles and Tailwind color tokens
```

### Stack

- **React 19**, Mantine v9 (+ `@mantine/charts` on recharts), TailwindCSS v4, Zod (CSV import validation), dayjs
- **Dexie** (IndexedDB wrapper) + `dexie-react-hooks` for local persistence
- **TanStack Router** (file-based, `src/routes/`, `autoCodeSplitting` on, so each route component is its own chunk); no server-side API
- Path alias: `~` → `src/`

### Mantine Setup

`MantineProvider`, `ModalsProvider`, and `<Notifications position="top-center" />` are mounted in `main.tsx`. The theme lives in `src/theme.ts` and registers all extended components.

**Extended components** (`src/components/extended/`): Each wraps a Mantine component via `.extend()` to apply project-wide default props/classNames. All are registered in the Mantine theme — use Mantine components directly (e.g. `<Button>`) and they will pick up the extended defaults automatically.

Only components the app renders are extended; add a new `Extended*` file (and register it in `theme.ts`) when you start using another Mantine component. Extended components export from `src/components/extended/index.ts`.

## Toast Notifications

`@mantine/notifications` is installed and `<Notifications position="top-center" />` is already mounted in `main.tsx`. Import and use directly:

```ts
import { notifications } from "@mantine/notifications";

// Success
notifications.show({
  title: "Action completed",
  message: "Descriptive success message.",
  color: "green",
});

// Error
notifications.show({
  title: "Action failed",
  message: err instanceof Error ? err.message : "Fallback error message.",
  color: "red",
});
```

- Keep toast titles short (2–4 words); put detail in `message`
- Use `color: "green"` for success, `color: "red"` for errors

## Styling

- **Tailwind-first**: Use Tailwind utilities for all styling. Fall back to inline styles only for values Tailwind cannot express (complex gradients, dynamic JS values).
- **Semantic HTML**: Use `<header>`, `<main>`, `<nav>`, `<section>`, `<article>`, `<footer>`, `<figure>`, `<h1>`–`<h6>`, `<p>`, `<span>`, `<dl>`/`<dt>`/`<dd>` instead of generic `<div>` where the element has a semantic role. Reserve `<div>` for pure layout wrappers with no semantic meaning.
- **Mantine components**: Only use Mantine components that provide meaningful UI behavior beyond plain HTML — `Button`, `TextInput`, `PasswordInput`, `Table`, `CopyButton`, `Modal`, `Select`, `Checkbox`, `Badge`, `Timeline`, `Breadcrumbs`, `Anchor`, `Tabs`, `Accordion`, `Stepper`, `Notification`, `Tooltip`, `Popover`, `Menu`, `Drawer`, `Avatar`, `ActionIcon`, `Loader`, `Skeleton`, etc. Do NOT use Mantine layout/typography wrappers (`Text`, `Title`, `Group`, `Stack`, `Paper`, `Box`, `Container`, `Flex`, `Grid`, `SimpleGrid`, `Center`, `Space`, `Divider`) — use native HTML + Tailwind instead.
- **MANDATORY — check Mantine before building custom UI**: Before writing any custom component for interactive or composite UI patterns, you MUST first check whether `@mantine/core` already provides that component. Only build a custom implementation if Mantine has no equivalent.
- **Colors**: Use the semantic token classes from `src/index.css` — never hardcode hex values. Hex values live only in the Mantine palettes in `src/theme.ts`; the Tailwind tokens read them via `--mantine-color-*` variables, so Mantine and Tailwind always agree.
  - Text: `text-fg`, `text-fg-muted`, `text-fg-subtle`, `text-fg-faint`
  - Surfaces: `bg-surface` (page), `bg-surface-raised` (cards), `bg-surface-hover` (hover/selected)
  - Borders: `border-line`, `border-line-strong`
  - Accent: `primary-50`…`primary-900` (electric lime; also Mantine's `primaryColor`). Status: `text-success`, `text-danger`
  - `src/theme.test.ts` checks WCAG contrast of every text/surface pair; keep it passing when changing the palette.
- **Visual language ("Scoreboard")**: dark only, hard 2px corners, hairline `border-line` rules instead of cards, uppercase letter-spaced labels. Headings and every number use `font-display` (Barlow Condensed) with `tabular-nums`; body text is Barlow. Animations (`animate-pop`, `animate-flash`) are always prefixed `motion-safe:`.
- **Domain helpers**: Use `src/lib/sets.ts` for set validation (`isSegmentComplete`, `isSetComplete`), formatting (`formatSet`, `formatSegmentValue`), and building sets (`appendSet`, `appendDrop`, `appendSuperset`) instead of re-implementing them in components.
- **Shared UI**: Use `PageHeader`, `SectionHeading` and `StatTile` (in a `grid … gap-px border border-line bg-line` `<dl>`) for page chrome, `selectableRowClass` + `SelectionIndicator` for tappable list rows, `EmptyState` (`src/components/EmptyState.tsx`) for empty lists/pages, `useSelection` + `useLongPressSelect` for multi-select lists, and `haptic()` from `src/lib/haptics.ts` for vibration feedback.
- **Preferences**: Per-device settings go through `usePreferences()` (`src/hooks/use-preferences.ts`), which validates stored values on read. Add new fields there with a default.
- **Workout logging**: `/workout/$date` is the only place sessions are created or edited. Only sets marked done are written to IndexedDB (`toSession` in `src/lib/workout.ts`); unfinished rows live in a per-date localStorage draft. Delete sessions through `deleteSessions` (`src/db/delete-sessions.ts`) so stale drafts are cleared too.
- **App icons**: Edit `public/favicon.svg`, then run `vp run generate-pwa-assets` (config in `pwa-assets.config.ts`) to regenerate the PWA PNGs.
- **Icons**: Always use Iconify via `unplugin-icons` — **never write inline SVGs**. Installed icon packs: `@iconify-json/solar`, `@iconify-json/tabler`. Import icons as React components: `import IconSolarEdit from "~icons/solar/pen-2-broken"`. Prefer `solar/*-broken` style for a consistent stroke look. Use `tabler/*` when solar lacks the right icon. Size icons with Tailwind text classes (`text-sm`, `text-base`, `text-lg`).
- **`cn()` utility**: Use `cn()` from `~/cn` (clsx + tailwind-merge) for conditional class merging.

## Code Conventions

- TypeScript: `const`/`let` only, `===`, no `any` (prefer `unknown`), no `#private` (use TS `private`)
- Naming: `UpperCamelCase` types/classes, `lowerCamelCase` variables/functions, `CONSTANT_CASE` module-level constants
- Default exports for page/component files; named exports elsewhere

## Code Quality

Apply these criteria when writing or reviewing code:

### Comments

- Write no comments by default. Add one only when the **why** is non-obvious: a hidden constraint, a subtle invariant, or a workaround for a specific bug.
- Never leave deliberation or design-debate comments in production code (e.g. "// should we use X or Y?"). That belongs in PR descriptions or planning docs.
- Never describe what the code does — well-named identifiers already do that.

### Duplication

- Extract shared logic into named helpers the moment it appears in two places. Prefer a single exported function over two inline copies, even when they look trivial.
- Name helpers after what they encode or decode, not after the caller (e.g. `encodeBlockExId` / `decodeBlockExId`, not `formatForCsv`).

### Type casts

- Remove redundant `as` casts when TypeScript can already infer the type (e.g. via a generic parameter).
- When a cast is unavoidable, use the most precise type (`as ArrayBuffer`, not `as BlobPart`) so the intent is clear and future callers get accurate types.

### Validation

- Validate all numeric fields at system boundaries (import, form submit): check non-negative for weights, positive for durations, and any type-specific rules.
- Only validate at boundaries — trust internal functions and framework guarantees.

### Tests

- Reference exported constants and helpers instead of hardcoding magic values (e.g. `encodeBlockExId(0, "ex1")` not `"0_ex1"`). This keeps tests correct if the encoding format changes.

## INSTRUCTIONS

- Do not automatically `git add` any files

<!-- code-review-graph MCP tools -->

## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool                        | Use when                                               |
| --------------------------- | ------------------------------------------------------ |
| `detect_changes`            | Reviewing code changes — gives risk-scored analysis    |
| `get_review_context`        | Need source snippets for review — token-efficient      |
| `get_impact_radius`         | Understanding blast radius of a change                 |
| `get_affected_flows`        | Finding which execution paths are impacted             |
| `query_graph`               | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes`     | Finding functions/classes by name or keyword           |
| `get_architecture_overview` | Understanding high-level codebase structure            |
| `refactor_tool`             | Planning renames, finding dead code                    |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.

### Token Efficiency Rules

- ALWAYS start with `get_minimal_context(task="<your task>")` before any other graph tool.
- Use `detail_level="minimal"` on all calls. Only escalate to "standard" when minimal is insufficient.
- Target: complete any review/debug/refactor task in ≤5 tool calls and ≤800 total output tokens.

## Workflows

### Explore Codebase

Use the code-review-graph MCP tools to navigate and understand the codebase.

1. Run `list_graph_stats` to see overall codebase metrics.
2. Run `get_architecture_overview` for high-level community structure.
3. Use `list_communities` to find major modules, then `get_community` for details.
4. Use `semantic_search_nodes` to find specific functions or classes.
5. Use `query_graph` with patterns like `callers_of`, `callees_of`, `imports_of` to trace relationships.
6. Use `list_flows` and `get_flow` to understand execution paths.

Tips: start broad (stats, architecture) then narrow down. Use `children_of` on a file to see all its functions. Use `find_large_functions` to identify complex code.

### Review Changes

Perform a risk-aware code review using the knowledge graph.

1. Run `detect_changes` to get risk-scored change analysis.
2. Run `get_affected_flows` to find impacted execution paths.
3. For each high-risk function, run `query_graph` with `pattern="tests_for"` to check test coverage.
4. Run `get_impact_radius` to understand the blast radius.
5. For any untested changes, suggest specific test cases.

Output: group findings by risk level (high/medium/low) with what changed, test coverage status, suggested improvements, and merge recommendation.

### Debug Issue

Systematically trace and debug issues using the knowledge graph.

1. Use `semantic_search_nodes` to find code related to the issue.
2. Use `query_graph` with `callers_of` and `callees_of` to trace call chains.
3. Use `get_flow` to see full execution paths through suspected areas.
4. Run `detect_changes` to check if recent changes caused the issue.
5. Use `get_impact_radius` on suspected files to see what else is affected.

Tips: check both callers and callees for full context. Look at affected flows to find the entry point that triggers the bug.

### Refactor Safely

Plan and execute refactoring with confidence using dependency analysis.

1. Use `refactor_tool` with `mode="suggest"` for community-driven refactoring suggestions.
2. Use `refactor_tool` with `mode="dead_code"` to find unreferenced code.
3. For renames, use `refactor_tool` with `mode="rename"` to preview all affected locations.
4. Use `apply_refactor_tool` with the `refactor_id` to apply renames.
5. After changes, run `detect_changes` to verify the refactoring impact.

Safety: always preview before applying. Check `get_impact_radius` before major refactors. Use `get_affected_flows` to ensure no critical paths are broken.
