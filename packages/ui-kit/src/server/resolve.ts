import type {
  BundleId,
  BundleLoader,
  CssLink,
  ThemeId,
  UiBundle,
  UiRegistry,
} from "../types.ts";
import type { CssProxy } from "./css_proxy.ts";

export function pickStack(
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

export async function loadBundles(
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
        const msg = e instanceof Error ? e.message : String(e);
        warnings.push(`Failed to load bundle "${id}": ${msg}`);
      }
    }),
  );

  return out;
}

export function mergeRegistry(
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

export function pickId<T extends string>(
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

export function themeLayers(theme: ThemeId, themes: UiRegistry["themes"]): ThemeId[] {
  const out: ThemeId[] = [];
  const seen = new Set<ThemeId>();

  for (let cur: ThemeId | undefined = theme; cur && !seen.has(cur); cur = themes[cur]?.extends) {
    seen.add(cur);
    out.unshift(cur);
  }

  return out;
}

export function collectCss(
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

export async function proxyCss(
  proxy: CssProxy,
  resources: Array<{ url: string; media?: string }>,
): Promise<CssLink[]> {
  const out: CssLink[] = [];
  const seen = new Set<string>();

  for (const r of resources) {
    const { href } = await proxy.register(r.url);
    if (seen.has(href)) continue;

    seen.add(href);
    out.push({ href, media: r.media, sourceUrl: r.url });
  }

  return out;
}
