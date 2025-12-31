# @demo/ui-kit

A tiny, no-codegen **UI bundle** runtime for Fresh:

- bundles export **TSX components + CSS URLs**
- apps build a merged registry by stacking bundles (later overrides earlier)
- stylesheets are served through a **same-origin CSS proxy** (`/ui/css/<id>.css`)
- user preferences are stored in a cookie (stack + theme + layout)

This package is framework-light: it doesn't require special Vite plugins; it is regular Deno/Fresh
middleware.

See `apps/demo` in the monorepo for a working example.
