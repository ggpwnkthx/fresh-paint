import { cssUrl, defineBundle } from "@ggpwnkthx/fresh-paint";
import { AppLayout } from "./src/layouts.tsx";
import { Button } from "./src/primitives.tsx";

const u = (p: string) => ({ url: cssUrl(import.meta.url, p) });

export const bundle = defineBundle({
  id: "ocean",
  label: "Ocean",
  globalCss: [u("./components.css")],
  themes: {
    light: {
      id: "light",
      label: "Light (Ocean tint)",
      css: [u("./theme.light.css")],
    },
    ocean: {
      id: "ocean",
      label: "Ocean",
      extends: "light",
      css: [u("./theme.ocean.css")],
    },
  },
  layouts: {
    app: { id: "app", label: "App", Layout: AppLayout },
  },
  primitives: { Button },
});

export default bundle;
