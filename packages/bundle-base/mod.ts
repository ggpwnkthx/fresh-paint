import { cssUrl, defineBundle } from "@ggpwnkthx/fresh-paint";
import { AppLayout, MarketingLayout } from "./src/layouts.tsx";
import { Button, Card } from "./src/primitives.tsx";
import { Hero } from "./src/widgets.tsx";

const u = (p: string) => ({ url: cssUrl(import.meta.url, p) });

export const bundle = defineBundle({
  id: "base",
  label: "Base",
  globalCss: [u("./components.css")],
  themes: {
    dark: { id: "dark", label: "Dark", css: [] },
    light: { id: "light", label: "Light", css: [u("./theme.light.css")] },
  },
  layouts: {
    app: { id: "app", label: "App", Layout: AppLayout },
    marketing: { id: "marketing", label: "Marketing", Layout: MarketingLayout },
  },
  primitives: { Button, Card },
  widgets: { Hero },
});

export default bundle;
