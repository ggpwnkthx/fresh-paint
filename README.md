# Fresh Paint (monorepo)

Fresh Paint is a small UI "bundle stack" system for Deno Fresh apps.

It's split into:

- **UI kit** (`packages/ui-kit`): types + runtime + middleware that loads bundles, merges
  registries, and serves CSS.
- **Bundles** (`packages/bundle-*`): themed CSS + optional layouts/primitives/widgets you can stack
  to compose a UI.

## Core ideas

### Bundles

A bundle is a module that exports a `UiBundle` (usually via `defineBundle`). Bundles can provide:

- `globalCss`: always applied when the bundle is enabled
- `themes`: named theme definitions (with optional `extends`)
- `layouts`: layout components (e.g. app vs marketing)
- `primitives`: shared building blocks (e.g. Button, Card)
- `widgets`: higher-level components (e.g. Hero)

### Stack order (override semantics)

You enable a list of bundle ids called the **stack**.

When registries are merged, **later bundles in the stack override earlier bundles** for the same
keys (layouts, themes, primitives, widgets). Example: with stack `["base", "ocean"]`, any `ocean`
component with the same registry key wins.

### Themes

Themes are identified by id (e.g. `light`, `dark`, `ocean`, `holiday`). A theme can extend another
theme id; the runtime applies CSS from the base theme chain, then the chosen theme, in order.

### Layout selection

The runtime chooses one layout id (e.g. `app`, `marketing`) and exposes it as `ui.prefs.layout`.
Layout components receive `{ ui, children }`.

## Packages

- `@ggpwnkthx/fresh-paint` (exported from `packages/ui-kit`)
- `@ggpwnkthx/fresh-paint/bundle/base`
- `@ggpwnkthx/fresh-paint/bundle/ocean`
- `@ggpwnkthx/fresh-paint/bundle/holiday`

## Repo tasks

- `deno task dev` – run the demo app
- `deno task test` – run tests
- `deno task check` – fmt + lint + typecheck + tests
