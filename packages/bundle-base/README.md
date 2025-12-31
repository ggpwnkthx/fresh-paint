# @ggpwnkthx/fresh-paint/bundle/base

The Base bundle is the foundation bundle for Fresh Paint. It provides the default styling, the
primary layouts, and the baseline primitives/widgets you can build on.

Use this bundle at the bottom of your stack (or near the bottom) so "layer" bundles can override
pieces above it.

## What it includes

### Global CSS

- `components.css`: the main UI styling for shell/nav/main layout, pills, cards, buttons, and the
  default hero styling.
- The CSS defines a set of `--ui-*` variables (font, radius, surfaces, accents, etc.) used
  throughout the primitives and widgets.

### Themes

- `dark` (default look): registered with no extra CSS (it relies on the base variables from
  `components.css`).
- `light`: a light theme that overrides the base CSS variables via `theme.light.css`.

### Layouts

- `app`: `AppLayout` renders a top nav showing the selected `theme` and `layout`, and optionally
  uses the registered `Button` primitive for navigation.
- `marketing`: `MarketingLayout` is a simpler shell intended for landing pages.

### Primitives

- `Button`: variants `default`, `ghost`, `primary`. Can render as `<a>` if `href` is provided.
- `Card`: a titled card container.

### Widgets

- `Hero`: a simple title/subtitle hero block that can optionally render a CTA using the registered
  `Button` primitive.

## Intended usage

- Put `base` in your stack to get a complete working UI baseline: layouts + basic components +
  default themes.
- Add "layer" bundles above it (e.g. ocean/holiday) to override specific primitives/widgets/layouts
  and to tweak theme variables or CSS recipes.

## Behavior when stacked with other bundles

- If a later bundle registers the same layout/primitives/widgets keys, it will override Base's
  implementation.
- Base's CSS variables are designed to be overridden by theme CSS (either from Base or from other
  bundles).
