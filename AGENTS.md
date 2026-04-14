<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, but it invokes Vite through `vp dev` and `vp build`.

## Vite+ Workflow

`vp` is a global binary that handles the full development lifecycle. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

### Start

- create - Create a new project from a template
- migrate - Migrate an existing project to Vite+
- config - Configure hooks and agent integration
- staged - Run linters on staged files
- install (`i`) - Install dependencies
- env - Manage Node.js versions

### Develop

- dev - Run the development server
- check - Run format, lint, and TypeScript type checks
- lint - Lint code
- fmt - Format code
- test - Run tests

### Execute

- run - Run monorepo tasks
- exec - Execute a command from local `node_modules/.bin`
- dlx - Execute a package binary without installing it as a dependency
- cache - Manage the task cache

### Build

- build - Build for production
- pack - Build libraries
- preview - Preview production build

### Manage Dependencies

Vite+ automatically detects and wraps the underlying package manager such as pnpm, npm, or Yarn through the `packageManager` field in `package.json` or package manager-specific lockfiles.

- add - Add packages to dependencies
- remove (`rm`, `un`, `uninstall`) - Remove packages from dependencies
- update (`up`) - Update packages to latest versions
- dedupe - Deduplicate dependencies
- outdated - Check for outdated packages
- list (`ls`) - List installed packages
- why (`explain`) - Show why a package is installed
- info (`view`, `show`) - View package information from the registry
- link (`ln`) / unlink - Manage local package links
- pm - Forward a command to the package manager

### Maintain

- upgrade - Update `vp` itself to the latest version

These commands map to their corresponding tools. For example, `vp dev --port 3000` runs Vite's dev server and works the same as Vite. `vp test` runs JavaScript tests through the bundled Vitest. The version of all tools can be checked using `vp --version`. This is useful when researching documentation, features, and bugs.

## Common Pitfalls

- **Using the package manager directly:** Do not use pnpm, npm, or Yarn directly. Vite+ can handle all package manager operations.
- **Always use Vite commands to run tools:** Don't attempt to run `vp vitest` or `vp oxlint`. They do not exist. Use `vp test` and `vp lint` instead.
- **Running scripts:** Vite+ built-in commands (`vp dev`, `vp build`, `vp test`, etc.) always run the Vite+ built-in tool, not any `package.json` script of the same name. To run a custom script that shares a name with a built-in command, use `vp run <script>`. For example, if you have a custom `dev` script that runs multiple services concurrently, run it with `vp run dev`, not `vp dev` (which always starts Vite's dev server).
- **Do not install Vitest, Oxlint, Oxfmt, or tsdown directly:** Vite+ wraps these tools. They must not be installed directly. You cannot upgrade these tools by installing their latest versions. Always use Vite+ commands.
- **Use Vite+ wrappers for one-off binaries:** Use `vp dlx` instead of package-manager-specific `dlx`/`npx` commands.
- **Import JavaScript modules from `vite-plus`:** Instead of importing from `vite` or `vitest`, all modules should be imported from the project's `vite-plus` dependency. For example, `import { defineConfig } from 'vite-plus';` or `import { expect, test, vi } from 'vite-plus/test';`. You must not install `vitest` to import test utilities.
- **Type-Aware Linting:** There is no need to install `oxlint-tsgolint`, `vp lint --type-aware` works out of the box.

## CI Integration

For GitHub Actions, consider using [`voidzero-dev/setup-vp`](https://github.com/voidzero-dev/setup-vp) to replace separate `actions/setup-node`, package-manager setup, cache, and install steps with a single action.

```yaml
- uses: voidzero-dev/setup-vp@v1
  with:
    cache: true
- run: vp check
- run: vp test
```

## Review Checklist for Agents

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to validate changes.
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
  components/
    extended/   – Mantine components extended with project defaults (via .extend())
    form/       – React Hook Form controlled wrappers for Mantine inputs
  assets/       – Static images
  App.tsx       – Root component
  main.tsx      – Entry point (MantineProvider, ModalsProvider, Notifications)
  theme.ts      – Mantine theme (colors, font, component overrides)
  cn.ts         – clsx + tailwind-merge utility
  index.css     – Global styles
```

### Stack

- **React 19**, Mantine v9, TailwindCSS v4, React Hook Form, Zod, dayjs
- **Dexie** (IndexedDB wrapper) + `dexie-react-hooks` for local persistence
- **No router, no server-side API**
- Path alias: `~` → `src/`

### Mantine Setup

`MantineProvider`, `ModalsProvider`, and `<Notifications position="top-center" />` are mounted in `main.tsx`. The theme lives in `src/theme.ts` and registers all extended components.

**Extended components** (`src/components/extended/`): Each wraps a Mantine component via `.extend()` to apply project-wide default props/classNames. All are registered in the Mantine theme — use Mantine components directly (e.g. `<Button>`) and they will pick up the extended defaults automatically.

**Controlled form components** (`src/components/form/`): Each wraps a Mantine input with `useFormContext()` from React Hook Form, wiring `register`, `errors`, and `isSubmitting`/`isLoading` read-only state. Named `Controlled[ComponentName]` (e.g. `ControlledTextInput`). Both sets export from their respective `index.ts` barrel files.

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
- **Mantine components**: Only use Mantine components that provide meaningful UI behavior beyond plain HTML — `Button`, `TextInput`, `PasswordInput`, `Table`, `CopyButton`, `Modal`, `Select`, `Checkbox`, `Badge`, `Timeline`, `Breadcrumbs`, `Anchor`, `Tabs`, `Accordion`, `Stepper`, `Notification`, `Tooltip`, `Popover`, `Menu`, `Drawer`, `Avatar`, `ActionIcon`, `Loader`, `Skeleton`, etc. Do NOT use Mantine layout/typography wrappers (`Text`, `Title`, `Group`, `Stack`, `Paper`, `Box`) — use native HTML + Tailwind instead.
- **MANDATORY — check Mantine before building custom UI**: Before writing any custom component for interactive or composite UI patterns, you MUST first check whether `@mantine/core` already provides that component. Only build a custom implementation if Mantine has no equivalent.
- **Colors**: Use Tailwind color classes or CSS variables — never hardcode hex values. The primary color is `primary` (blue scale registered in the Mantine theme).
- **Icons**: Always use Iconify via `unplugin-icons` — **never write inline SVGs**. Installed icon packs: `@iconify-json/solar`, `@iconify-json/tabler`, `@iconify-json/charm`. Import icons as React components: `import IconSolarEdit from "~icons/solar/pen-2-broken"`. Prefer `solar/*-broken` style for a consistent stroke look. Use `tabler/*` or `charm/*` when solar lacks the right icon. Size icons with Tailwind text classes (`text-sm`, `text-base`, `text-lg`).
- **`cn()` utility**: Use `cn()` from `~/cn` (clsx + tailwind-merge) for conditional class merging.

## Code Conventions

- TypeScript: `const`/`let` only, `===`, no `any` (prefer `unknown`), no `#private` (use TS `private`)
- Naming: `UpperCamelCase` types/classes, `lowerCamelCase` variables/functions, `CONSTANT_CASE` module-level constants
- Default exports for page/component files; named exports elsewhere

## INSTRUCTIONS

- Do not automatically `git add` any files
