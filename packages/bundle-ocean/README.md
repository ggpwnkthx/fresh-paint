# @ggpwnkthx/fresh-paint/bundle/ocean

Ocean is a "layer" bundle that adds an ocean-flavored app layout, a themed button primitive, and a
set of CSS recipe overrides (nav background, hero background, and primary button background).

It's meant to be stacked above `base` so it can override or complement parts of the base look
without needing to re-implement everything.

## What it includes

### Global CSS overrides

- `components.css` updates CSS custom properties used by Base:
  - `--ui-nav-bg`
  - `--ui-hero-bg`
  - `--ui-btn-primary-bg`

This is intentionally light: it relies on Base's components and classnames, but changes the
"recipes" via variables.

### Themes

- `light` (Ocean tint): adjusts accent variables so the Base light theme uses ocean colors.
- `ocean`: a full theme that extends `light` and sets background/surface/border/muted variables for
  a brighter "sea glass" look.

### Layouts

- `app`: `AppLayout` with Ocean branding and a small stack indicator.
  - It uses the registry `Button` (if present) so the layout stays compatible even if another bundle
    overrides the Button primitive later.

### Primitives

- `Button`: wraps button content with a 🌊 icon but keeps the same `data-variant` API as Base.

## What it does not include

- No `Card` primitive (Base's Card is expected).
- No `Hero` widget (Base's Hero is expected, unless another layer overrides it).

## Recommended stacking

- Typical stack: `["base", "ocean"]`
- If you add additional layers (like holiday), put them after ocean if you want them to override
  ocean's components/widgets.

## Practical notes

- Ocean focuses on variable-driven overrides so it stays compatible with Base's classnames and
  structure.
- If another bundle later in the stack replaces `primitives.Button`, Ocean's `AppLayout` will
  automatically render that newer Button instead.
