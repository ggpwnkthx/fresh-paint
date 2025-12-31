# @ggpwnkthx/fresh-paint/bundle/holiday

Holiday is a seasonal "layer" bundle that adds a holiday theme and selectively overrides parts of
the UI (especially the Hero widget) to create a festive look.

It is designed to be stacked above other bundles (e.g. base, ocean) so it can override widgets and
CSS styling.

## What it includes

### Global CSS overrides

- `components.css` tweaks:
  - card border/background treatment
  - brand icon glow
  - button hover motion

These overrides assume the same classnames as Base (`.ui-card`, `.ui-brand`, `.ui-btn`).

### Theme

- `holiday`:
  - extends the `dark` theme id
  - sets holiday-flavored accents and adjusted surface/border/muted variables

This means it expects a `dark` theme to exist in the registry (Base provides one). If `dark` is
missing, the runtime still registers `holiday`, but the "extends" chain won't have a real parent
layer.

### Layouts

- `marketing`: a holiday-branded marketing layout with the theme pill in the header.

### Widgets

- `Hero`: overrides the Hero widget to show a winter/holiday treatment and a note that it's intended
  as a layer override.

## What it does not include

- No `app` layout (Base/Ocean typically provide it).
- No primitives (it expects primitives to come from other bundles).

## Recommended stacking

- Typical stacks:
  - `["base", "holiday"]` for a simple seasonal marketing variant
  - `["base", "ocean", "holiday"]` to keep ocean styling but override the Hero and add the holiday
    theme

To ensure `Hero` is overridden, put `holiday` after whichever bundle originally provided
`widgets.Hero`.

## Practical notes

- Holiday is intentionally narrow: it mostly changes appearance and overrides a single
  widget/layout.
- It's a good example of how to build "event" bundles that sit at the top of the stack.
