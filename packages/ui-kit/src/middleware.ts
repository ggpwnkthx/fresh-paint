import type { UiRuntime, UiState } from "./types.ts";
import { handleUiPreferencesPost, type UiKitLike } from "./preferences.ts";
import { createUiKit, type UiKitOptions } from "./kit.ts";

export type FreshContextLike<State> = {
  req: Request;
  url: URL;
  state: State;
  next(): Promise<Response>;
};
export type FreshMiddleware<State> = (ctx: FreshContextLike<State>) => Response | Promise<Response>;

export interface UiKitResolver {
  resolve(req: Request): Promise<UiRuntime>;
}

export interface UiKitCssProxy {
  cssProxy: { basePath: string; handle(req: Request): Promise<Response> };
}

export type UiKitServer = UiKitLike & UiKitResolver & UiKitCssProxy;

export interface UiKitMiddlewareOptions {
  preferencesEndpoint?: string;
  maxStack?: number;
  skipResolve?: (req: Request, url: URL) => boolean;
}

export type UiKitMiddlewareConfig = UiKitOptions & UiKitMiddlewareOptions;

const norm = (p: string) => (p === "/" ? "/" : p.replace(/\/+$/, ""));
const under = (p: string, base: string) => p === base || p.startsWith(base + "/");
const mna = (allow: string) =>
  new Response("Method Not Allowed", { status: 405, headers: { allow } });

function addVary(headers: Headers, value: string) {
  const cur = headers.get("vary");
  if (!cur) return void headers.set("vary", value);
  const tokens = cur.split(",").map((s) => s.trim()).filter(Boolean);
  if (tokens.some((t) => t.toLowerCase() === value.toLowerCase())) return;
  headers.set("vary", [...tokens, value].join(", "));
}

function isUiKitServer(v: unknown): v is UiKitServer {
  if (typeof v !== "object" || v === null) return false;
  const r = v as Partial<UiKitServer>;
  return typeof r.resolve === "function" &&
    typeof r.setPreferencesCookie === "function" &&
    typeof r.cssProxy?.basePath === "string" &&
    typeof r.cssProxy?.handle === "function";
}

function splitConfig(config: UiKitMiddlewareConfig) {
  const { preferencesEndpoint, maxStack, skipResolve, ...kitOpts } = config;
  return {
    kitOpts: kitOpts as UiKitOptions,
    mwOpts: { preferencesEndpoint, maxStack, skipResolve } as UiKitMiddlewareOptions,
  };
}

export function createUiKitMiddleware<State extends UiState>(
  config: UiKitMiddlewareConfig,
): FreshMiddleware<State>;
export function createUiKitMiddleware<State extends UiState>(
  kit: UiKitServer,
  opts?: UiKitMiddlewareOptions,
): FreshMiddleware<State>;
export function createUiKitMiddleware<State extends UiState>(
  kitOrConfig: UiKitServer | UiKitMiddlewareConfig,
  opts: UiKitMiddlewareOptions = {},
): FreshMiddleware<State> {
  const isServer = isUiKitServer(kitOrConfig);
  const { kitOpts, mwOpts } = isServer
    ? { kitOpts: undefined, mwOpts: opts }
    : splitConfig(kitOrConfig);

  const kit: UiKitServer = isServer ? kitOrConfig : createUiKit(kitOpts!);

  const endpoint = norm(mwOpts.preferencesEndpoint ?? "/api/ui-preferences");
  const maxStack = mwOpts.maxStack ?? 20;
  const skipResolve = mwOpts.skipResolve ?? defaultSkipResolve;
  const cssBase = norm(kit.cssProxy.basePath);

  return async (ctx: FreshContextLike<State>) => {
    const pathname = norm(ctx.url.pathname);
    const method = ctx.req.method.toUpperCase();

    if (under(pathname, cssBase)) {
      if (method !== "GET" && method !== "HEAD") return mna("GET, HEAD");
      const res = await kit.cssProxy.handle(ctx.req);
      return method === "HEAD"
        ? new Response(null, { status: res.status, headers: res.headers })
        : res;
    }

    if (pathname === endpoint) {
      if (method !== "POST") return mna("POST");
      return handleUiPreferencesPost(ctx.req, kit, { maxStack });
    }

    const injected = !skipResolve(ctx.req, ctx.url);
    if (injected) ctx.state.ui = await kit.resolve(ctx.req);

    const res = await ctx.next();
    if (injected) addVary(res.headers, "Cookie");
    return res;
  };
}

function defaultSkipResolve(_req: Request, url: URL) {
  const p = url.pathname;
  return p.startsWith("/_fresh/") || p.startsWith("/favicon") || p === "/robots.txt";
}
