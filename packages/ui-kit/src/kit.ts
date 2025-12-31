import type { ChoiceItem } from "./choices.ts";
import { toChoiceItems } from "./choices.ts";
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
import { type BundleImporter, moduleBundle } from "./bundle.ts";
import { isRecord } from "./validation.ts";

export type UiCatalogEntry =
  | BundleLoader
  | BundleImporter
  | { src: BundleLoader | BundleImporter; label?: string }
  | readonly [BundleLoader | BundleImporter, string];

export interface UiKitOptions {
  catalog: Record<BundleId, UiCatalogEntry>;
  defaults: UiPreferences;
  cookieName?: string;
  cssProxyBasePath?: string;
  allowFileCss?: boolean;
}

type LabeledBundleLoader = BundleLoader & { label?: string };
const cleanLabel = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
const loaderLabel = (
  v: unknown,
) => (isRecord(v) ? cleanLabel((v as { label?: unknown }).label) : undefined);

function normalizeEntry(entry: UiCatalogEntry): { src: BundleImporter; label?: string } {
  if (Array.isArray(entry)) return { src: entry[0] as BundleImporter, label: cleanLabel(entry[1]) };
  if (isRecord(entry) && "src" in entry) {
    const src = (entry as { src?: unknown }).src;
    if (typeof src !== "string" && typeof src !== "function") {
      throw new Error("Invalid catalog entry: { src } must be a string or function");
    }
    return { src: src as BundleImporter, label: cleanLabel((entry as { label?: unknown }).label) };
  }
  if (typeof entry !== "string" && typeof entry !== "function") {
    throw new Error("Invalid catalog entry");
  }
  return { src: entry as BundleImporter };
}

function normalizeCatalog(
  raw: Record<BundleId, UiCatalogEntry>,
): Record<BundleId, LabeledBundleLoader> {
  const out: Record<BundleId, LabeledBundleLoader> = {};
  for (const [id, entry] of Object.entries(raw)) {
    const { src, label } = normalizeEntry(entry);
    out[id] = moduleBundle(
      src,
      label ?? (typeof src === "function" ? loaderLabel(src) : undefined),
    );
  }
  return out;
}

function buildCatalogChoiceItems(catalog: Record<BundleId, LabeledBundleLoader>): ChoiceItem[] {
  return Object.entries(catalog).map(([id, loader]) => ({ id, label: loader.label ?? id }));
}

export function createUiKit({
  catalog: rawCatalog,
  defaults,
  cookieName = "ui",
  cssProxyBasePath = "/ui/css",
  allowFileCss = false,
}: UiKitOptions) {
  const catalog = normalizeCatalog(rawCatalog);
  const cssProxy = new CssProxy({ basePath: cssProxyBasePath, allowFileUrls: allowFileCss });
  const catalogItems = buildCatalogChoiceItems(catalog);

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

    return {
      prefs,
      registry,
      css,
      warnings,
      catalog: catalogItems,
      choices: { themes: toChoiceItems(registry.themes), layouts: toChoiceItems(registry.layouts) },
    };
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
    const out: BundleId[] = [];
    const seen = new Set<BundleId>();
    for (const id of ids) {
      if (seen.has(id)) continue;
      seen.add(id);
      if (catalog[id]) out.push(id);
      else warnings.push(`Unknown bundle id ignored: "${id}"`);
    }
    return out;
  };

  const a = clean(requested);
  if (a.length) return a;
  warnings.push("Requested stack was empty after validation.");
  return clean(fallback);
}

async function loadBundles(
  stack: BundleId[],
  catalog: Record<BundleId, BundleLoader>,
  warnings: string[],
): Promise<Partial<Record<BundleId, UiBundle>>> {
  const out: Partial<Record<BundleId, UiBundle>> = {};
  await Promise.all(
    stack.map(async (id) => {
      const loader = catalog[id];
      if (!loader) return warnings.push(`Unknown bundle id ignored: "${id}"`);
      try {
        out[id] = await loader();
      } catch (e) {
        warnings.push(`Failed to load bundle "${id}": ${(e as Error).message}`);
      }
    }),
  );
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
  const first = Object.keys(map)[0] as T | undefined;
  const next = map[fallback] ? fallback : first;
  warnings.push(
    next
      ? `Unknown ${kind} "${requested}", falling back to "${next}".`
      : `No ${kind}s registered; using "${requested}".`,
  );
  return next ?? requested;
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
