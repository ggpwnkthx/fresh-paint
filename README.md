# Fresh UI Bundles Monorepo (Fresh v2.2 + Vite + Tailwind)

This repo demonstrates a **runtime‑swappable** UI system for Fresh where users can:

- stack **bundle layers** arbitrarily (base → ocean → holiday, etc.)
- switch **themes** and **layouts** at runtime (cookie‑backed)
- let designers ship **only TSX + CSS** in bundle packages (no code‑gen)

It includes:

- `packages/ui-kit/` - the middleware + runtime registry + CSS proxy
- `packages/bundle-base/` - base primitives, themes, layouts
- `packages/bundle-ocean/` - overrides + additional theme/layout
- `packages/bundle-holiday/` - overrides + additional theme/layout
- `apps/demo/` - a Fresh app that wires everything together

## Quickstart

From the repo root:

```bash
cd apps/demo
deno task dev
```

Then open the printed URL (usually `http://localhost:5173`).

## Why a CSS proxy?

Bundles provide CSS as URLs (including `file:` URLs during local dev). The app injects `<link>` tags
that point at `/ui/css/<id>.css`. The server resolves `<id>` → real URL and serves the stylesheet
with caching headers.

This keeps bundles **no-build** (plain CSS files) and keeps the browser on same-origin CSS.

## Notes

- Deno permissions in dev are broad (`-A`) because Vite, file reads, and optional remote CSS fetches
  can be involved.
- In production you can tighten permissions to `--allow-net --allow-read`.
