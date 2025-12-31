# @ggpwnkthx/fresh-paint (UI kit)

This package is the core runtime for Fresh Paint. It defines the bundle shape, loads bundles into a
registry, resolves user preferences (stack/theme/layout), and provides helpers for integrating into
a Fresh (Deno) server.

If you are building bundles, you use `defineBundle` and the shared types. If you are building an
app, you use `createUiKitMiddleware` (or `createUiKit`) to resolve `ui` at request time and inject
it into request state.

## What this package provides

### Bundle authoring

- `defineBundle(b)`: identity helper that returns `b` (useful for typing and a consistent
  convention).
- `cssUrl(import.meta.url, "./file.css")`: build absolute CSS URLs relative to a bundle module.

### Bundle loading utilities

- `moduleBundle(src, label?)`: creates a lazy bundle loader from a module specifier string or a
  dynamic importer function, and validates/coerces the result into a `UiBundle`.
- `coerceUiBundle(modOrBundle, name)`: accepts either a raw bundle or a module with
  `bundle`/`default`, validates shape, and returns a `UiBundle`.

### Server-side runtime

- `createUiKit({ catalog, defaults, cookieName?, cssProxyBasePath?, allowFileCss? })`:
  - reads prefs from a cookie (or uses defaults)
  - validates/normalizes the stack against the catalog
  - loads bundles
  - merges registries (later bundles override earlier)
  - selects theme and layout (with sensible fallbacks + warnings)
  - collects CSS and exposes a CSS proxy link list (`ui.css`)
- `createUiKitMiddleware(...)`:
  - injects `ui` into `ctx.state.ui` for normal requests
  - serves proxied CSS from `cssProxyBasePath` (default `/ui/css`)
  - exposes a preferences POST endpoint (default `/api/ui-preferences`) that sets the prefs cookie

### Preact helpers

- `UiCssLinks`: renders `<link rel="stylesheet">` tags for all CSS resolved by the runtime.
- `resolveLayoutComponent(ui, fallback)`: returns the selected layout component from the registry.

### UI components

- `PreferencesPicker`: a simple UI for reordering the bundle stack and selecting theme/layout,
  posting to the preferences endpoint.

## Key types

- `UiBundle`: bundle contract (themes/layouts/primitives/widgets/globalCss)
- `UiRuntime`: resolved runtime state for a request (prefs, registry, css links, warnings, catalog +
  choices)
- `UiPreferences`: `{ stack: string[], theme: string, layout: string }`

## How resolution works (high level)

1. Read cookie (or defaults) to get requested `{ stack, theme, layout }`.
2. Validate stack against catalog; dedupe; keep order.
3. Load bundles in the stack.
4. Merge registries in stack order; later bundles override earlier.
5. Choose theme + layout ids, falling back if unknown.
6. Collect CSS:
   - all enabled `globalCss` in stack order
   - theme CSS for each layer in the theme's extends-chain, applied in chain order, and for each
     layer applied in stack order
7. Return `UiRuntime` with CSS links routed through the CSS proxy.

## Notes / gotchas

- Override behavior is "last writer wins" within a registry key. If two bundles both register
  `widgets.Hero`, the last bundle in the stack wins.
- The middleware adds `Vary: Cookie` when it injects `ui` so caches behave correctly.
- `allowFileCss` controls whether `file:` CSS URLs are allowed through the proxy (off by default).
