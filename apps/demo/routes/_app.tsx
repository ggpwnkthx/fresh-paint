import type { FunctionComponent } from "npm:preact@^10";
import type { State } from "../lib/state.ts";

type AppProps = {
  Component: FunctionComponent;
  state: State;
};

export default function App({ Component, state }: AppProps) {
  const ui = state.ui;

  return (
    <html lang="en" data-theme={ui.prefs.theme}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Fresh UI Bundles (runtime stacking)</title>

        {ui.css.map((l) => <link key={l.href} rel="stylesheet" href={l.href} media={l.media} />)}
      </head>
      <body>
        <Component />
      </body>
    </html>
  );
}
