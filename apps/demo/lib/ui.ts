import { createUiKit, moduleBundle } from "@repo/ui-kit";

export const uiKit = createUiKit({
  catalog: {
    // Importer form => Vite can analyze and chunk these correctly.
    base: moduleBundle(() => import("@repo/bundle-base/mod.ts"), "bundle-base"),
    ocean: moduleBundle(() => import("@repo/bundle-ocean/mod.ts"), "bundle-ocean"),
    holiday: moduleBundle(() => import("@repo/bundle-holiday/mod.ts"), "bundle-holiday"),
  },
  defaults: {
    stack: ["base", "ocean", "holiday"],
    theme: "light",
    layout: "app",
  },
  cookieName: "ui",
  cssProxyBasePath: "/ui/css",
  allowFileCss: true,
});
