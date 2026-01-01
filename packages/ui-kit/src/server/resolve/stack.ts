import type { BundleId, BundleLoader } from "../../types.ts";

function dedupeAndValidateStack(
  ids: BundleId[],
  catalog: Record<BundleId, BundleLoader>,
  warnings: string[],
): BundleId[] {
  const out: BundleId[] = [];
  const seen = new Set<BundleId>();

  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);

    if (catalog[id]) out.push(id);
    else warnings.push(`Unknown bundle id ignored: "${id}"`);
  }

  return out;
}

export function pickStack(
  requested: BundleId[],
  fallback: BundleId[],
  catalog: Record<BundleId, BundleLoader>,
  warnings: string[],
): BundleId[] {
  const a = dedupeAndValidateStack(requested, catalog, warnings);
  if (a.length) return a;

  warnings.push("Requested stack was empty after validation.");
  return dedupeAndValidateStack(fallback, catalog, warnings);
}
