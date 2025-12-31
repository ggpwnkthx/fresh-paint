import { cssUrl, defineBundle } from "@repo/ui-kit";
import { AppLayout } from "./src/layouts.tsx";
import { Button } from "./src/primitives.tsx";

export const bundle = defineBundle({
  id: "ocean",
  label: "Ocean (overrides)",
  globalCss: [
    { url: cssUrl(import.meta.url, "./components.css") },
  ],
  themes: {
    // This adds extra CSS when the user selects 'light' (demonstrates per-theme overlay)
    light: {
      id: "light",
      label: "Light (tinted by ocean)",
      css: [{ url: cssUrl(import.meta.url, "./theme.light.override.css") }],
    },
    ocean: {
      id: "ocean",
      label: "Ocean",
      extends: "light",
      css: [{ url: cssUrl(import.meta.url, "./theme.ocean.css") }],
    },
  },
  // Override the base 'app' layout by key
  layouts: {
    app: { id: "app", label: "App Shell (Ocean)", Layout: AppLayout },
  },
  // Override the base Button primitive by key
  primitives: {
    Button,
  },
});

export default bundle;
