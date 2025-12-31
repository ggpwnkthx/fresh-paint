import { cssUrl, defineBundle } from "@repo/ui-kit";
import { MarketingLayout } from "./src/layouts.tsx";
import { Hero } from "./src/widgets.tsx";

export const bundle = defineBundle({
  id: "holiday",
  label: "Holiday (theme + widget override)",
  globalCss: [
    { url: cssUrl(import.meta.url, "./components.css") },
  ],
  themes: {
    holiday: {
      id: "holiday",
      label: "Holiday",
      extends: "dark",
      css: [{ url: cssUrl(import.meta.url, "./theme.holiday.css") }],
    },
  },
  layouts: {
    marketing: { id: "marketing", label: "Marketing (Holiday)", Layout: MarketingLayout },
  },
  widgets: {
    Hero,
  },
});

export default bundle;
