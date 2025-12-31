import type { BundleLoader, UiBundle } from "./types.ts";
import { isRecord } from "./validation.ts";

/** Helper for bundle authors: returns the input with strong typing. */
export function defineBundle(bundle: UiBundle): UiBundle {
  return bundle;
}

/** Build an absolute URL to a CSS file adjacent to a module. */
export function cssUrl(importMetaUrl: string, relativePath: string): string {
  return new URL(relativePath, importMetaUrl).href;
}

/**
 * Load a bundle module dynamically.
 *
 * The module must export either:
 * - `export const bundle = defineBundle(...)`
 * - `export default defineBundle(...)`
 */
export function moduleBundle(specifier: string): BundleLoader {
  let cached: UiBundle | undefined;

  return async () => {
    if (cached) return cached;

    const mod: unknown = await import(specifier);
    if (!isRecord(mod)) {
      throw new Error(`Bundle module "${specifier}" did not evaluate to an object export.`);
    }

    const candidate = (mod["bundle"] ?? mod["default"]) as unknown;
    if (!isRecord(candidate)) {
      throw new Error(
        `Bundle module "${specifier}" must export { bundle } or default export with a bundle object.`,
      );
    }

    // Minimal structural checks.
    const id = candidate["id"];
    const label = candidate["label"];
    if (typeof id !== "string" || typeof label !== "string") {
      throw new Error(`Bundle "${specifier}" is missing required string fields: { id, label }.`);
    }

    // We intentionally keep validation light here (demo). Runtime merge logic tolerates missing optionals.
    cached = candidate as unknown as UiBundle;
    return cached;
  };
}
