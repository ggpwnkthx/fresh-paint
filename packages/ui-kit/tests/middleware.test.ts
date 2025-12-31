import { assertEquals, assertStringIncludes } from "@std/assert";
import { createUiKitMiddleware } from "../src/middleware.ts";
import type { UiPreferences, UiRuntime } from "../src/types.ts";

function runtime(): UiRuntime {
  return {
    prefs: { stack: ["a"], theme: "light", layout: "app" },
    registry: { bundles: {}, themes: {}, layouts: {}, primitives: {}, widgets: {} },
    css: [],
    warnings: [],
    catalog: [],
    choices: { themes: [], layouts: [] },
  };
}

Deno.test("createUiKitMiddleware: intercepts GET css proxy and does not call next/resolve", async () => {
  let nextCalled = 0;
  let resolveCalled = 0;

  const kit = {
    cssProxy: {
      basePath: "/ui/css",
      handle(_req: Request): Promise<Response> {
        return Promise.resolve(
          new Response("/* css */", { headers: { "content-type": "text/css; charset=utf-8" } }),
        );
      },
    },
    resolve(_req: Request): Promise<UiRuntime> {
      resolveCalled++;
      return Promise.resolve(runtime());
    },
    setPreferencesCookie(_headers: Headers, _prefs: UiPreferences): void {},
  };

  const mw = createUiKitMiddleware<{ ui?: UiRuntime }>(kit);

  const req = new Request("http://localhost/ui/css/abc.css", { method: "GET" });
  const res = await mw({
    req,
    url: new URL(req.url),
    state: {},
    next: () => {
      nextCalled++;
      return Promise.resolve(new Response("should-not-run", { status: 500 }));
    },
  });

  assertEquals(res.status, 200);
  assertEquals(await res.text(), "/* css */");
  assertEquals(resolveCalled, 0);
  assertEquals(nextCalled, 0);
});

Deno.test("createUiKitMiddleware: intercepts POST preferences endpoint and sets cookie", async () => {
  let lastSetCookie = "";

  const kit = {
    cssProxy: {
      basePath: "/ui/css",
      handle(_req: Request): Promise<Response> {
        return Promise.resolve(new Response("css", { status: 200 }));
      },
    },
    resolve(_req: Request): Promise<UiRuntime> {
      return Promise.resolve(runtime());
    },
    setPreferencesCookie(headers: Headers, prefs: UiPreferences): void {
      headers.append("Set-Cookie", `ui=${prefs.theme}`);
      lastSetCookie = headers.get("Set-Cookie") ?? "";
    },
  };

  const mw = createUiKitMiddleware<{ ui?: UiRuntime }>(kit);

  const req = new Request("http://localhost/api/ui-preferences", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ stack: ["x"], theme: "dark", layout: "app" }),
  });

  const res = await mw({
    req,
    url: new URL(req.url),
    state: {},
    next: () => Promise.resolve(new Response("should-not-run", { status: 500 })),
  });

  assertEquals(res.status, 200);
  assertStringIncludes(lastSetCookie, "ui=dark");
});

Deno.test("createUiKitMiddleware: injects ui into ctx.state for normal requests", async () => {
  const kit = {
    cssProxy: {
      basePath: "/ui/css",
      handle(_req: Request): Promise<Response> {
        return Promise.resolve(new Response("css", { status: 200 }));
      },
    },
    resolve(_req: Request): Promise<UiRuntime> {
      return Promise.resolve(runtime());
    },
    setPreferencesCookie(_headers: Headers, _prefs: UiPreferences): void {},
  };

  const state: { ui?: UiRuntime } = {};
  const mw = createUiKitMiddleware<typeof state>(kit);

  const req = new Request("http://localhost/");
  const res = await mw({
    req,
    url: new URL(req.url),
    state,
    next: () => Promise.resolve(new Response("ok")),
  });

  assertEquals(res.status, 200);
  assertEquals(state.ui?.prefs.theme, "light");
});
