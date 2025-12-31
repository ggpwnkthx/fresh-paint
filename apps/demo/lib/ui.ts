import { createUiKit, moduleBundle } from "@repo/ui-kit";

function fileUrl(rel: string): string {
  return new URL(rel, import.meta.url).href;
}

export const uiKit = createUiKit({
  catalog: {
    base: moduleBundle(fileUrl("../../packages/bundle-base/mod.ts")),
    ocean: moduleBundle(fileUrl("../../packages/bundle-ocean/mod.ts")),
    holiday: moduleBundle(fileUrl("../../packages/bundle-holiday/mod.ts")),
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
