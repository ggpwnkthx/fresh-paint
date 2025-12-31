import { App, createDefine, staticFiles } from "fresh";
import { paint, type UiState } from "@ggpwnkthx/fresh-paint";

export type State = UiState;
export const define = createDefine<State>();

export const app = new App<State>()
  .appWrapper(({ Component, state }) => {
    {
      const ui = state.ui;
      const Layout = ui?.registry.layouts[ui.prefs.layout]?.Layout;
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
            {(ui && Layout) && (
                  <Layout ui={ui}>
                    <Component />
                  </Layout>
                ) || <Component />}
          </body>
        </html>
      );
    }
  })
  .use(paint<State>({
    catalog: {
      base: { src: () => import("@ggpwnkthx/fresh-paint/bundle/base"), label: "Base" },
      ocean: { src: () => import("@ggpwnkthx/fresh-paint/bundle/ocean"), label: "Ocean" },
      holiday: { src: () => import("@ggpwnkthx/fresh-paint/bundle/holiday"), label: "Holiday" },
    },
    defaults: { stack: ["base", "ocean", "holiday"], theme: "light", layout: "app" },
    cookieName: "ui",
    cssProxyBasePath: "/ui/css",
    allowFileCss: true,
  }))
  .use(staticFiles())
  .fsRoutes();

if (import.meta.main) await app.listen();
