import type {
  BundleId,
  BundleLoader,
  LayoutId,
  ThemeId,
  UiBundle,
  UiPreferences,
  UiRegistry,
  UiRuntime,
} from "./types.ts";
import { CssProxy } from "./css_proxy.ts";
import { decodePrefsCookie, encodePrefsCookie, parseCookieHeader } from "./cookies.ts";

export interface UiKitOptions {
  catalog: Record<BundleId, BundleLoader>;
  defaults: UiPreferences;

  cookieName?: string;

  /** Where proxied CSS will be served from. */
  cssProxyBasePath?: string;
  /** Allow proxying file: URLs (useful for local monorepos). */
  allowFileCss?: boolean;
}

export function createUiKit(opts: UiKitOptions) {
  const cookieName = opts.cookieName ?? "ui";
  const cssProxy = new CssProxy({
    basePath: opts.cssProxyBasePath ?? "/ui/css",
    allowFileUrls: opts.allowFileCss ?? false,
  });

  async function resolve(req: Request): Promise<UiRuntime> {
    const warnings: string[] = [];

    const cookies = parseCookieHeader(req.headers.get("cookie"));
    const parsedPrefs = cookies[cookieName] ? decodePrefsCookie(cookies[cookieName]) : null;

    const rawPrefs: UiPreferences = parsedPrefs ?? opts.defaults;

    // Validate requested stack; if it collapses to empty, fall back to defaults (validated too).
    let { stack: stack, stackWarnings } = normalizeStack(rawPrefs.stack, opts.catalog);
    warnings.push(...stackWarnings);

    if (stack.length === 0) {
      const fallback = normalizeStack(opts.defaults.stack, opts.catalog);
      stack = fallback.stack;
      warnings.push(...fallback.stackWarnings);
    }

    const bundles: Partial<Record<BundleId, UiBundle>> = {};
    for (const id of stack) {
      const loader = opts.catalog[id];
      if (!loader) {
        // Should not happen after normalizeStack, but stay safe under noUncheckedIndexedAccess.
        warnings.push(`Unknown bundle id ignored at load time: "${id}"`);
        continue;
      }

      try {
        bundles[id] = await loader();
      } catch (err) {
        warnings.push(`Failed to load bundle "${id}": ${(err as Error).message}`);
      }
    }

    const registry = mergeRegistryInOrder(stack, bundles);

    const theme = normalizeTheme(rawPrefs.theme, registry, opts.defaults.theme, warnings);
    const layout = normalizeLayout(rawPrefs.layout, registry, opts.defaults.layout, warnings);

    const prefs: UiPreferences = { stack, theme, layout };

    const cssResources = collectCss(prefs.theme, stack, bundles, registry);
    const cssLinks = await proxyCss(cssProxy, cssResources);

    return {
      prefs,
      registry,
      css: cssLinks,
      warnings,
    };
  }

  function setPreferencesCookie(headers: Headers, prefs: UiPreferences): void {
    const value = encodePrefsCookie(prefs);
    // Prefer small cookie values. If you exceed cookie limits, move storage server-side.
    headers.append(
      "Set-Cookie",
      `${cookieName}=${value}; Path=/; HttpOnly; SameSite=Lax`,
    );
  }

  return {
    cookieName,
    cssProxy,
    resolve,
    setPreferencesCookie,
  };
}

function normalizeStack(
  requested: BundleId[],
  catalog: Record<BundleId, BundleLoader>,
): { stack: BundleId[]; stackWarnings: string[] } {
  const seen = new Set<string>();
  const stack: BundleId[] = [];
  const warnings: string[] = [];

  for (const id of requested) {
    if (seen.has(id)) continue;
    seen.add(id);
    if (!catalog[id]) {
      warnings.push(`Unknown bundle id ignored: "${id}"`);
      continue;
    }
    stack.push(id);
  }

  if (stack.length === 0) warnings.push("Requested stack was empty after validation.");

  return { stack, stackWarnings: warnings };
}

function mergeRegistryInOrder(
  stack: BundleId[],
  bundles: Partial<Record<BundleId, UiBundle>>,
): UiRegistry {
  const themes: UiRegistry["themes"] = {};
  const layouts: UiRegistry["layouts"] = {};
  const primitives: UiRegistry["primitives"] = {};
  const widgets: UiRegistry["widgets"] = {};

  for (const id of stack) {
    const b = bundles[id];
    if (!b) continue;

    if (b.themes) Object.assign(themes, b.themes);
    if (b.layouts) Object.assign(layouts, b.layouts);
    if (b.primitives) Object.assign(primitives, b.primitives);
    if (b.widgets) Object.assign(widgets, b.widgets);
  }

  // Registry also exposes loaded bundles.
  const bundleSay: Record<BundleId, UiBundle> = {};
  for (const [id, b] of Object.entries(bundles)) {
    if (b) bundleSay[id] = b;
  }

  return { bundles: bundleSay, themes, layouts, primitives, widgets };
}

function normalizeTheme(
  requested: ThemeId,
  registry: UiRegistry,
  fallback: ThemeId,
  warnings: string[],
): ThemeId {
  if (registry.themes[requested]) return requested;
  if (registry.themes[fallback]) {
    warnings.push(`Unknown theme "${requested}", falling back to "${fallback}".`);
    return fallback;
  }
  const first = Object.keys(registry.themes)[0];
  if (first) {
    warnings.push(`Unknown theme "${requested}", falling back to first theme "${first}".`);
    return first;
  }
  warnings.push(`No themes registered; using "${requested}" anyway.`);
  return requested;
}

function normalizeLayout(
  requested: LayoutId,
  registry: UiRegistry,
  fallback: LayoutId,
  warnings: string[],
): LayoutId {
  if (registry.layouts[requested]) return requested;
  if (registry.layouts[fallback]) {
    warnings.push(`Unknown layout "${requested}", falling back to "${fallback}".`);
    return fallback;
  }
  const first = Object.keys(registry.layouts)[0];
  if (first) {
    warnings.push(`Unknown layout "${requested}", falling back to first layout "${first}".`);
    return first;
  }
  warnings.push(`No layouts registered; using "${requested}" anyway.`);
  return requested;
}

function collectCss(
  theme: ThemeId,
  stack: BundleId[],
  bundles: Partial<Record<BundleId, UiBundle>>,
  registry: UiRegistry,
): Array<{ url: string; media?: string }> {
  const out: Array<{ url: string; media?: string }> = [];

  // global CSS (stack order)
  for (const id of stack) {
    const b = bundles[id];
    if (!b?.globalCss) continue;
    for (const css of b.globalCss) out.push(css);
  }

  // theme CSS (base → derived; then stack order within each theme layer)
  const chain = themeChain(theme, registry).reverse();
  for (const themeId of chain) {
    for (const id of stack) {
      const b = bundles[id];
      const def = b?.themes?.[themeId];
      if (!def) continue;
      for (const css of def.css) out.push(css);
    }
  }

  return out;
}

function themeChain(theme: ThemeId, registry: UiRegistry): ThemeId[] {
  const chain: ThemeId[] = [];
  const seen = new Set<ThemeId>();

  let cur: ThemeId | undefined = theme;
  while (cur && !seen.has(cur)) {
    seen.add(cur);
    chain.push(cur);

    const next: ThemeId | undefined = registry.themes[cur]?.extends;
    cur = next;
  }

  return chain;
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
