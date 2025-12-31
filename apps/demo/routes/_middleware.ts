import { define } from "@/lib/define.ts";
import { createUiKitMiddleware, type UiState } from "@ggpwnkthx/fresh-paint";

export type State = UiState;

export default define.middleware(
  createUiKitMiddleware<State>({
    catalog: {
      base: { src: () => import("@ggpwnkthx/fresh-paint/bundle/base"), label: "Base" },
      ocean: { src: () => import("@ggpwnkthx/fresh-paint/bundle/ocean"), label: "Ocean" },
      holiday: { src: () => import("@ggpwnkthx/fresh-paint/bundle/holiday"), label: "Holiday" },
    },
    defaults: { stack: ["base", "ocean", "holiday"], theme: "light", layout: "app" },
    cookieName: "ui",
    cssProxyBasePath: "/ui/css",
    allowFileCss: true,
  }),
);
