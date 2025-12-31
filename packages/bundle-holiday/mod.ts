import { cssUrl, defineBundle } from "@ggpwnkthx/fresh-paint";
import { MarketingLayout } from "./src/layouts.tsx";
import { Hero } from "./src/widgets.tsx";

const u = (p: string) => ({ url: cssUrl(import.meta.url, p) });

export const bundle = defineBundle({
  id: "holiday",
  label: "Holiday",
  globalCss: [u("./components.css")],
  themes: {
    holiday: {
      id: "holiday",
      label: "Holiday",
      extends: "dark",
      css: [u("./theme.holiday.css")],
    },
  },
  layouts: {
    marketing: { id: "marketing", label: "Marketing", Layout: MarketingLayout },
  },
  widgets: { Hero },
});

export default bundle;
