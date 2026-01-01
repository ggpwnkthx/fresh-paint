import type { BundleId, BundleLoader } from "../types.ts";
import { cleanLabel, isObjectLike, isRecord, sortChoiceItems } from "../lib/primitives.ts";
import type { ChoiceItem } from "../lib/primitives.ts";
import { UiKitError } from "../lib/errors.ts";
import { type BundleImporter, moduleBundle } from "../bundle/mod.ts";

export type UiCatalogEntry =
  | BundleLoader
  | BundleImporter
  | { src: BundleLoader | BundleImporter; label?: string }
  | readonly [BundleLoader | BundleImporter, string];

type LabeledBundleLoader = BundleLoader & { label?: string };

function loaderLabel(v: unknown): string | undefined {
  if (!isObjectLike(v)) return undefined;
  return cleanLabel((v as { label?: unknown }).label);
}

function isImporter(v: unknown): v is BundleImporter {
  return typeof v === "string" || typeof v === "function";
}

function invalidEntry(id: string, msg: string): UiKitError {
  return new UiKitError("E_CATALOG_INVALID", `Invalid catalog entry for "${id}": ${msg}`);
}

function normalizeCatalogEntry(
  id: string,
  entry: UiCatalogEntry,
): { src: BundleImporter; label?: string } {
  if (Array.isArray(entry)) {
    const [src, label] = entry;
    if (!isImporter(src)) throw invalidEntry(id, "tuple src must be a string or function");
    return { src, label: cleanLabel(label) };
  }

  if (isRecord(entry) && "src" in entry) {
    const src = (entry as { src?: unknown }).src;
    if (!isImporter(src)) throw invalidEntry(id, "{ src } must be a string or function");
    return { src, label: cleanLabel((entry as { label?: unknown }).label) };
  }

  if (!isImporter(entry)) {
    throw invalidEntry(id, "must be a string, function, tuple, or { src } object");
  }

  return { src: entry };
}

export function normalizeCatalog(
  raw: Record<BundleId, UiCatalogEntry>,
): Record<BundleId, LabeledBundleLoader> {
  const out: Record<BundleId, LabeledBundleLoader> = {};

  for (const [id, entry] of Object.entries(raw)) {
    const { src, label } = normalizeCatalogEntry(id, entry);
    const inferred = label ?? (typeof src === "function" ? loaderLabel(src) : undefined);
    out[id] = moduleBundle(src, inferred);
  }

  return out;
}

export function buildCatalogChoiceItems(
  catalog: Record<BundleId, LabeledBundleLoader>,
): ChoiceItem[] {
  const items = Object.entries(catalog).map(([id, loader]) => ({ id, label: loader.label ?? id }));
  return sortChoiceItems(items);
}
