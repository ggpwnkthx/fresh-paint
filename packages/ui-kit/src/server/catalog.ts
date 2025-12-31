import type { BundleId, BundleLoader } from "../types.ts";
import { cleanLabel, isRecord } from "../lib/primitives.ts";
import type { ChoiceItem } from "../lib/primitives.ts";
import { moduleBundle, type BundleImporter } from "../bundle/mod.ts";

export type UiCatalogEntry =
  | BundleLoader
  | BundleImporter
  | { src: BundleLoader | BundleImporter; label?: string }
  | readonly [BundleLoader | BundleImporter, string];

type LabeledBundleLoader = BundleLoader & { label?: string };

const loaderLabel = (v: unknown): string | undefined => {
  if (!isRecord(v)) return undefined;
  return cleanLabel((v as { label?: unknown }).label);
};

function normalizeEntry(entry: UiCatalogEntry): { src: BundleImporter; label?: string } {
  if (Array.isArray(entry)) {
    const [src, label] = entry;
    return { src: src as BundleImporter, label: cleanLabel(label) };
  }

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

export function normalizeCatalog(
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

export function buildCatalogChoiceItems(
  catalog: Record<BundleId, LabeledBundleLoader>,
): ChoiceItem[] {
  return Object.entries(catalog).map(([id, loader]) => ({ id, label: loader.label ?? id }));
}
