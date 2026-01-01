import type { BundleId, CssLink, ThemeId, UiBundle, UiRegistry } from "../../types.ts";
import { CssProxy } from "../proxy/css.ts";
import { themeLayers } from "./registry.ts";

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
