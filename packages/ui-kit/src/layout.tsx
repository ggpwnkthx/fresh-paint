import type { FunctionComponent } from "preact";
import type { LayoutComponentProps, UiRuntime } from "./types.ts";

export function resolveLayoutComponent(
  ui: UiRuntime,
  fallback: FunctionComponent<LayoutComponentProps>,
): FunctionComponent<LayoutComponentProps> {
  return ui.registry.layouts[ui.prefs.layout]?.Layout ?? fallback;
}
