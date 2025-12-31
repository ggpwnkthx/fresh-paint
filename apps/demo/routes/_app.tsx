import type { ComponentType } from "preact";
import type { State } from "./_middleware.ts";

export default function App(
  { Component, state }: { Component: ComponentType<Record<string, unknown>>; state: State },
) {
  const ui = state.ui;

  return (
    <html lang="en" data-theme={ui?.prefs.theme ?? "light"}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Fresh Paint (runtime layering)</title>

        {ui?.css.map(({ href, media }) => (
          <link key={href} rel="stylesheet" href={href} media={media} />
        ))}
      </head>
      <body>
        <Component />
      </body>
    </html>
  );
}
