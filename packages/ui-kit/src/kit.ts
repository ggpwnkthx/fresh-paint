import type {
  BundleId,
  BundleLoader,
  ThemeId,
  UiBundle,
  UiPreferences,
  UiRegistry,
  UiRuntime,
} from "./types.ts";
import { CssProxy } from "./css_proxy.ts";
import {
  decodePrefsCookie,
  encodePrefsCookie,
  parseCookieHeader,
  setCookieHeader,
} from "./cookies.ts";

export interface UiKitOptions {
  catalog: Record<BundleId, BundleLoader>;
  defaults: UiPreferences;
  cookieName?: string;
  cssProxyBasePath?: string;
  allowFileCss?: boolean;
}

export function createUiKit({
  catalog,
  defaults,
  cookieName = "ui",
  cssProxyBasePath = "/ui/css",
  allowFileCss = false,
}: UiKitOptions) {
  const cssProxy = new CssProxy({ basePath: cssProxyBasePath, allowFileUrls: allowFileCss });

  const resolve = async (req: Request): Promise<UiRuntime> => {
    const warnings: string[] = [];
    const cookie = parseCookieHeader(req.headers.get("cookie"))[cookieName];
    const raw = (cookie ? decodePrefsCookie(cookie) : null) ?? defaults;

    const stack = pickStack(raw.stack, defaults.stack, catalog, warnings);
    const bundles = await loadBundles(stack, catalog, warnings);
    const registry = mergeRegistry(stack, bundles);

    const theme = pickId("theme", raw.theme, registry.themes, defaults.theme, warnings);
    const layout = pickId("layout", raw.layout, registry.layouts, defaults.layout, warnings);

    const prefs: UiPreferences = { stack, theme, layout };
    const css = await proxyCss(cssProxy, collectCss(theme, stack, bundles, registry));
    return { prefs, registry, css, warnings };
  };

  const setPreferencesCookie = (headers: Headers, prefs: UiPreferences) =>
    setCookieHeader(headers, { name: cookieName, value: encodePrefsCookie(prefs) });

  return { cookieName, cssProxy, resolve, setPreferencesCookie };
}

function pickStack(
  requested: BundleId[],
  fallback: BundleId[],
  catalog: Record<BundleId, BundleLoader>,
  warnings: string[],
): BundleId[] {
  const clean = (ids: BundleId[]) => {
    const seen = new Set<BundleId>();
    const out: BundleId[] = [];
    for (const id of ids) {
      if (seen.has(id)) continue;
      seen.add(id);
      if (!catalog[id]) warnings.push(`Unknown bundle id ignored: "${id}"`);
      else out.push(id);
    }
    return out;
  };

  const a = clean(requested);
  if (a.length) return a;
  warnings.push("Requested stack was empty after validation.");
  return clean(fallback);
}

type LoadedBundle = {
  id: BundleId;
  bundle?: UiBundle;
  warn?: string;
};

async function loadBundles(
  stack: BundleId[],
  catalog: Record<BundleId, BundleLoader>,
  warnings: string[],
): Promise<Partial<Record<BundleId, UiBundle>>> {
  const loaded: LoadedBundle[] = await Promise.all(
    stack.map(async (id): Promise<LoadedBundle> => {
      const loader = catalog[id];
      if (!loader) {
        // Should be prevented by pickStack(), but keep this for safety and for strict indexing.
        return { id, warn: `Unknown bundle id ignored: "${id}"` };
      }

      try {
        return { id, bundle: await loader() };
      } catch (e) {
        return {
          id,
          warn: `Failed to load bundle "${id}": ${(e as Error).message}`,
        };
      }
    }),
  );

  const out: Partial<Record<BundleId, UiBundle>> = {};
  for (const r of loaded) {
    if (r.warn) warnings.push(r.warn);
    if (r.bundle) out[r.id] = r.bundle;
  }
  return out;
}

function mergeRegistry(
  stack: BundleId[],
  bundles: Partial<Record<BundleId, UiBundle>>,
): UiRegistry {
  const out: UiRegistry = { bundles: {}, themes: {}, layouts: {}, primitives: {}, widgets: {} };

  for (const id of stack) {
    const b = bundles[id];
    if (!b) continue;

    out.bundles[id] = b;
    if (b.themes) Object.assign(out.themes, b.themes);
    if (b.layouts) Object.assign(out.layouts, b.layouts);
    if (b.primitives) Object.assign(out.primitives, b.primitives);
    if (b.widgets) Object.assign(out.widgets, b.widgets);
  }

  return out;
}

function pickId<T extends string>(
  kind: "theme" | "layout",
  requested: T,
  map: Record<string, unknown>,
  fallback: T,
  warnings: string[],
): T {
  if (map[requested]) return requested;
  if (map[fallback]) {
    warnings.push(`Unknown ${kind} "${requested}", falling back to "${fallback}".`);
    return fallback;
  }
  const first = Object.keys(map)[0] as T | undefined;
  if (first) {
    warnings.push(`Unknown ${kind} "${requested}", falling back to "${first}".`);
    return first;
  }
  warnings.push(`No ${kind}s registered; using "${requested}".`);
  return requested;
}

function themeLayers(theme: ThemeId, themes: UiRegistry["themes"]): ThemeId[] {
  const out: ThemeId[] = [];
  const seen = new Set<ThemeId>();
  for (let cur: ThemeId | undefined = theme; cur && !seen.has(cur); cur = themes[cur]?.extends) {
    seen.add(cur);
    out.unshift(cur);
  }
  return out;
}

function collectCss(
  theme: ThemeId,
  stack: BundleId[],
  bundles: Partial<Record<BundleId, UiBundle>>,
  registry: UiRegistry,
): Array<{ url: string; media?: string }> {
  const out: Array<{ url: string; media?: string }> = [];
  for (const id of stack) out.push(...(bundles[id]?.globalCss ?? []));
  for (const t of themeLayers(theme, registry.themes)) {
    for (const id of stack) out.push(...(bundles[id]?.themes?.[t]?.css ?? []));
  }
  return out;
}

async function proxyCss(
  proxy: CssProxy,
  resources: Array<{ url: string; media?: string }>,
): Promise<Array<{ href: string; media?: string; sourceUrl: string }>> {
  const out: Array<{ href: string; media?: string; sourceUrl: string }> = [];
  const seen = new Set<string>();

  for (const r of resources) {
    const { href } = await proxy.register(r.url);
    if (seen.has(href)) continue;
    seen.add(href);
    out.push({ href, media: r.media, sourceUrl: r.url });
  }

  return out;
}
