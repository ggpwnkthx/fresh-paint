import type { BundleId, BundleLoader, UiBundle, UiRegistry } from "../../types.ts";

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
        warnings.push(
          `Failed to load bundle "${id}": ${e instanceof Error ? e.message : String(e)}`,
        );
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

const firstSortedKey = <T extends string>(map: Record<string, unknown>): T | undefined => {
  const ks = Object.keys(map);
  if (ks.length === 0) return undefined;
  ks.sort((a, b) => a.localeCompare(b));
  return ks[0] as T;
};

export function pickId<T extends string>(
  kind: "theme" | "layout",
  requested: T,
  map: Record<string, unknown>,
  fallback: T,
  warnings: string[],
): T {
  if (map[requested]) return requested;

  const first = firstSortedKey<T>(map);
  const next = map[fallback] ? fallback : first;

  warnings.push(
    next
      ? `Unknown ${kind} "${requested}", falling back to "${next}".`
      : `No ${kind}s registered; using "${requested}".`,
  );

  return next ?? requested;
}

export function themeLayers<T extends string>(
  theme: T,
  themes: Record<string, { extends?: T }>,
): T[] {
  const out: T[] = [];
  const seen = new Set<T>();

  for (let cur: T | undefined = theme; cur && !seen.has(cur); cur = themes[cur]?.extends) {
    seen.add(cur);
    out.unshift(cur);
  }

  return out;
}
