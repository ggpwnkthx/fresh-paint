import { App, HttpError, staticFiles } from "fresh";
import { h } from "preact";
import type { ComponentChild, ComponentType } from "preact";
import type { State } from "@/lib/state.ts";

type AppWrapperProps = {
  Component: ComponentType<Record<string, unknown>>;
  state: State;
};

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function prefersJson(req: Request): boolean {
  const accept = req.headers.get("accept") ?? "";
  if (accept.includes("application/json")) return true;

  const url = new URL(req.url);
  return url.pathname.startsWith("/api/");
}

function AppWrapper({ Component, state }: AppWrapperProps) {
  const ui = state.ui;
  const theme = ui.prefs.theme;

  const headChildren: ComponentChild[] = [
    h("meta", { charSet: "utf-8" }),
    h("meta", { name: "viewport", content: "width=device-width, initial-scale=1" }),
    h("title", null, "Fresh UI Bundles (runtime stacking)"),
    ...ui.css.map((l) => h("link", { rel: "stylesheet", href: l.href, media: l.media })),
  ];

  return h(
    "html",
    { lang: "en", "data-theme": theme },
    h("head", null, ...headChildren),
    h("body", null, h(Component, {})),
  );
}

export const app = new App<State>()
  .use(staticFiles())
  .appWrapper(AppWrapper)
  .onError("*", (ctx: unknown) => {
    const c = ctx as { req?: unknown; error?: unknown };
    const req = c.req instanceof Request ? c.req : null;
    const err = c.error;

    const status = err instanceof HttpError
      ? err.status
      : (typeof (err as { status?: unknown })?.status === "number"
        ? (err as { status: number }).status
        : 500);

    if (req && prefersJson(req)) {
      const message = err instanceof Error ? err.message : "Internal Server Error";
      return Response.json({ ok: false, error: message }, { status });
    }

    const urlText = req ? escapeHtml(req.url) : "(unknown url)";
    const message = err instanceof Error ? escapeHtml(err.message) : "Something went wrong";
    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${status} - Error</title>
</head>
<body style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; padding: 24px;">
  <h1>${status} - Something went wrong</h1>
  <p style="opacity:.8;">${urlText}</p>
  <pre style="white-space: pre-wrap; background: #f6f6f6; padding: 12px; border-radius: 8px;">${message}</pre>
</body>
</html>`;
    return new Response(html, {
      status,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  })
  .notFound((ctx: unknown) => {
    const c = ctx as { req?: unknown };
    const req = c.req instanceof Request ? c.req : null;

    if (req && prefersJson(req)) {
      return Response.json({ ok: false, error: "Not Found" }, { status: 404 });
    }

    const urlText = req ? escapeHtml(req.url) : "(unknown url)";
    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>404 - Not Found</title>
</head>
<body style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; padding: 24px;">
  <h1>404 - Not Found</h1>
  <p style="opacity:.8;">${urlText}</p>
</body>
</html>`;
    return new Response(html, {
      status: 404,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  })
  .fsRoutes();

if (import.meta.main) {
  await app.listen();
}
