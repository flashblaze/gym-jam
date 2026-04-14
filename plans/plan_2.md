# Polish Plan: Mantine, Geist Font, TanStack Router Plugin

## Context

Three improvements to the gym-jam React app after the initial implementation:

1. Several screens use raw `<button>` elements where Mantine components should be used, per project conventions.
2. The app uses the default Manrope font in `theme.ts` — switching to Geist via fontsource.
3. `TanStackRouterVite` from `@tanstack/router-vite-plugin` is a shim that re-exports from `@tanstack/router-plugin/vite`. The canonical package and function name per the official docs are `@tanstack/router-plugin` and `tanstackRouter`.

---

## Task 1: Mantine Component Replacements

### Rule recap

Use Mantine for interactive UI. Do NOT use Mantine layout/typography wrappers (Text, Title, Group, Stack, Paper, Box). Keep HTML + Tailwind for layout.

### Changes per file

**`src/routes/sessions/$sessionId.tsx`**

- Back `<button>` → `<Button variant="subtle" size="compact-sm" leftSection={<IconSolarAltArrowLeftBroken/>}>`

**`src/routes/exercises/$exerciseId.tsx`**

- Back `<button>` → `<Button variant="subtle" size="compact-sm" leftSection={<IconSolarAltArrowLeftBroken/>}>`

**`src/routes/log.tsx`**

- Cancel `<button>` → `<Button variant="subtle" size="compact-sm" leftSection={<IconSolarAltArrowLeftBroken/>}>`
- "add set" dashed `<button>` → `<Button variant="outline" fullWidth color="gray" className="border-dashed">`

**`src/components/sessions/SessionCard.tsx`**

- Card `<button>` → `<UnstyledButton>` (provides accessibility: role, keyboard nav, focus ring)

**`src/components/sessions/ExerciseCard.tsx`**

- Exercise name `<button>` (nav-only, looks like a link) → `<Anchor component="button" onClick={...}>`

**`src/components/exercises/ExerciseListItem.tsx`**

- List item `<button>` → `<UnstyledButton>` (same accessibility reason as SessionCard)

**`src/components/log/SetRow.tsx`** (log version)

- × remove `<button>` → `<ActionIcon variant="subtle" color="gray" size="sm">`
- `+ drop` pill `<button>` → `<Button size="xs" variant="light" color="violet" radius="xl">`
- `+ superset` pill `<button>` → `<Button size="xs" variant="light" color="teal" radius="xl">`

**`src/components/log/SegmentRow.tsx`**

- × remove `<button>` → `<ActionIcon variant="subtle" color="gray" size="sm">`

**`src/components/log/SupersetPicker.tsx`**

- All exercise-picker `<button>` rows (two groups) → `<UnstyledButton>`

**`src/components/layout/BottomNav.tsx`**

- Keep `<Link>` from TanStack Router (correct, these are router navigation links not Mantine's domain)

---

## Task 2: Geist Font via Fontsource

### Install

```
vp add @fontsource-variable/geist
```

### Update `src/main.tsx`

Add import after existing style imports:

```ts
import "@fontsource-variable/geist";
```

### Update `src/theme.ts`

Change font family from `"Manrope"` to `"Geist Variable"`:

```ts
fontFamily: '"Geist Variable", sans-serif',
headings: { fontFamily: '"Geist Variable", sans-serif' },
```

### Update `src/index.css`

If a `font-family` is set on `body` or `:root` in index.css, update it there too. (Check file.)

---

## Task 3: TanStack Router Plugin Update

### What changed

`@tanstack/router-vite-plugin` is a shim — its source is a single re-export of `@tanstack/router-plugin/vite`. The official docs (tanstack.com/router/latest/docs/installation/manual) show only `@tanstack/router-plugin` with:

```ts
import { tanstackRouter } from "@tanstack/router-plugin/vite";
```

The function name also changed: `TanStackRouterVite` → `tanstackRouter`.

### Steps

1. **Install** `@tanstack/router-plugin` as devDependency: `vp add -D @tanstack/router-plugin`
2. **Remove** `@tanstack/router-vite-plugin`: `vp remove @tanstack/router-vite-plugin`
3. **Update `vite.config.ts`**:
   - Change import: `import { tanstackRouter } from "@tanstack/router-plugin/vite"`
   - Change usage: `tanstackRouter({...})` (same config options)

---

## Files Modified

| File                                            | Change                                                 |
| ----------------------------------------------- | ------------------------------------------------------ |
| `src/routes/sessions/$sessionId.tsx`            | Back button → Mantine Button                           |
| `src/routes/exercises/$exerciseId.tsx`          | Back button → Mantine Button                           |
| `src/routes/log.tsx`                            | Cancel + add-set buttons → Mantine                     |
| `src/components/sessions/SessionCard.tsx`       | Card button → UnstyledButton                           |
| `src/components/sessions/ExerciseCard.tsx`      | Exercise name button → Anchor                          |
| `src/components/exercises/ExerciseListItem.tsx` | List button → UnstyledButton                           |
| `src/components/log/SetRow.tsx`                 | × → ActionIcon; pills → Button                         |
| `src/components/log/SegmentRow.tsx`             | × → ActionIcon                                         |
| `src/components/log/SupersetPicker.tsx`         | Picker rows → UnstyledButton                           |
| `src/main.tsx`                                  | Add Geist fontsource import                            |
| `src/theme.ts`                                  | Update fontFamily to Geist Variable                    |
| `src/index.css`                                 | Update body font-family if set                         |
| `vite.config.ts`                                | Update TanStack Router plugin import + usage           |
| `package.json`                                  | Add @tanstack/router-plugin, remove router-vite-plugin |

## Verification

1. `vp dev` — all screens render, buttons/links work, font updates visually
2. `vp lint` — 0 errors, 0 warnings
3. `vp build` — clean build, PWA service worker generated
