import type { FunctionComponent } from "preact";
import type { LayoutComponentProps, UiRuntime } from "./types.ts";

export const UiCssLinks = ({ ui }: { ui?: UiRuntime }) => (
  <>
    {ui?.css.map(({ href, media }) => (
      <link
        key={href}
        rel="stylesheet"
        href={href}
        media={media}
      />
    ))}
  </>
);

export function resolveLayoutComponent(
  ui: UiRuntime,
  fallback: FunctionComponent<LayoutComponentProps>,
): FunctionComponent<LayoutComponentProps> {
  return ui.registry.layouts[ui.prefs.layout]?.Layout ?? fallback;
}
