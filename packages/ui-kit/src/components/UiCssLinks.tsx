import type { UiRuntime } from "../types.ts";

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
