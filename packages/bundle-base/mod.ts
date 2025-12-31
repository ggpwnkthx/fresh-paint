import { cssUrl, defineBundle } from "@repo/ui-kit";
import { AppLayout, MarketingLayout } from "./src/layouts.tsx";
import { Button, Card } from "./src/primitives.tsx";
import { Hero } from "./src/widgets.tsx";

export const bundle = defineBundle({
  id: "base",
  label: "Base (primitives + tokens)",
  globalCss: [
    { url: cssUrl(import.meta.url, "./components.css") },
  ],
  themes: {
    light: {
      id: "light",
      label: "Light",
      css: [{ url: cssUrl(import.meta.url, "./theme.light.css") }],
    },
    dark: {
      id: "dark",
      label: "Dark",
      css: [{ url: cssUrl(import.meta.url, "./theme.dark.css") }],
    },
  },
  layouts: {
    app: { id: "app", label: "App Shell", Layout: AppLayout },
    marketing: { id: "marketing", label: "Marketing", Layout: MarketingLayout },
  },
  primitives: { Button, Card },
  widgets: { Hero },
});

export default bundle;
