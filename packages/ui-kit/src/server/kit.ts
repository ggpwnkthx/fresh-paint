import type { BundleId, ThemeId, UiPreferences, UiRegistry, UiRuntime } from "../types.ts";
import { toChoiceItems } from "../lib/primitives.ts";
import { buildCatalogChoiceItems, normalizeCatalog, type UiCatalogEntry } from "./catalog.ts";
import { isCookieToken, setCookieHeader } from "./cookies/set.ts";
import { parseCookieHeader } from "./cookies/parse.ts";
import { decodePrefsCookie, encodePrefsCookie } from "./cookies/prefs.ts";
import { CssProxy } from "./proxy/css.ts";
import { collectCss, proxyCss } from "./resolve/css.ts";
import { loadBundles, mergeRegistry, pickId } from "./resolve/registry.ts";
import { pickStack } from "./resolve/stack.ts";

export interface UiKitOptions {
  catalog: Record<BundleId, UiCatalogEntry>;
  defaults: UiPreferences;
  cookieName?: string;
  cssProxyBasePath?: string;
  allowFileCss?: boolean;
}

function assertValidDefaults(d: UiPreferences): void {
  if (!Array.isArray(d.stack) || d.stack.some((s) => typeof s !== "string" || !s.trim())) {
    throw new Error(`Invalid defaults.stack`);
  }
  if (typeof d.theme !== "string" || !d.theme.trim()) throw new Error(`Invalid defaults.theme`);
  if (typeof d.layout !== "string" || !d.layout.trim()) throw new Error(`Invalid defaults.layout`);
}

export function createUiKit({
  catalog: rawCatalog,
  defaults,
  cookieName = "ui",
  cssProxyBasePath = "/ui/css",
  allowFileCss = false,
}: UiKitOptions) {
  assertValidDefaults(defaults);
  if (!isCookieToken(cookieName)) throw new Error(`Invalid cookieName: "${cookieName}"`);

  const catalog = normalizeCatalog(rawCatalog);
  const cssProxy = new CssProxy({ basePath: cssProxyBasePath, allowFileUrls: allowFileCss });
  const catalogItems = buildCatalogChoiceItems(catalog);

  const resolve = async (req: Request): Promise<UiRuntime> => {
    const warnings: string[] = [];
    const cookie = parseCookieHeader(req.headers.get("cookie"))[cookieName];
    const raw = (cookie ? decodePrefsCookie(cookie) : null) ?? defaults;

    const stack = pickStack(raw.stack, defaults.stack, catalog, warnings);
    const bundles = await loadBundles(stack, catalog, warnings);
    const registry: UiRegistry = mergeRegistry(stack, bundles);

    const theme = pickId("theme", raw.theme, registry.themes, defaults.theme, warnings);
    const layout = pickId("layout", raw.layout, registry.layouts, defaults.layout, warnings);

    const prefs: UiPreferences = { stack, theme, layout };
    const css = await proxyCss(cssProxy, collectCss(theme as ThemeId, stack, bundles, registry));

    return {
      prefs,
      registry,
      css,
      warnings,
      catalog: catalogItems,
      choices: {
        themes: toChoiceItems(registry.themes),
        layouts: toChoiceItems(registry.layouts),
      },
    };
  };

  const setPreferencesCookie = (headers: Headers, prefs: UiPreferences) =>
    setCookieHeader(headers, { name: cookieName, value: encodePrefsCookie(prefs) });

  return { cookieName, cssProxy, resolve, setPreferencesCookie };
}
