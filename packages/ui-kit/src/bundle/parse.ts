import type { ComponentRegistry, CssResource, LayoutDef, ThemeDef, UiBundle } from "../types.ts";
import { cleanString, isRecord } from "../lib/primitives.ts";
import { UiKitError, uiKitError } from "../lib/errors.ts";
import { isComponentRegistry, isCssResourceArray, isLayoutMap, isThemeMap } from "./validators.ts";

type UnknownRecord = Record<string, unknown>;
type OptKey = Exclude<keyof UiBundle, "id" | "label">;

const bundleError = (name: string, msg: string, cause?: unknown): UiKitError =>
  uiKitError("E_BUNDLE_INVALID", `Bundle "${name}": ${msg}`, cause);

function pickExport(modOrBundle: UnknownRecord): unknown {
  // Accept: { bundle }, { default }, or the object itself.
  return ("bundle" in modOrBundle || "default" in modOrBundle)
    ? (modOrBundle.bundle ?? modOrBundle.default)
    : modOrBundle;
}

function reqString(b: UnknownRecord, key: "id" | "label", name: string): string {
  const s = cleanString(b[key]);
  if (!s) throw bundleError(name, `missing required "${key}" string.`, b[key]);
  return s;
}

const OPT_VALIDATORS = {
  globalCss: isCssResourceArray,
  themes: isThemeMap,
  layouts: isLayoutMap,
  primitives: isComponentRegistry,
  widgets: isComponentRegistry,
} satisfies Record<
  OptKey,
  (v: unknown) => v is
    | CssResource[]
    | Record<string, ThemeDef>
    | Record<string, LayoutDef>
    | ComponentRegistry
>;

export function coerceUiBundle(modOrBundle: unknown, name: string): UiBundle {
  if (!isRecord(modOrBundle)) {
    throw bundleError(name, "did not evaluate to an object.", modOrBundle);
  }

  const exp = pickExport(modOrBundle as UnknownRecord);
  if (!isRecord(exp)) throw bundleError(name, "must export { bundle } or default object.", exp);

  return parseUiBundle(exp as UnknownRecord, name);
}

export function parseUiBundle(b: UnknownRecord, name: string): UiBundle {
  const out: UiBundle = { id: reqString(b, "id", name), label: reqString(b, "label", name) };
  const target = out as unknown as Record<OptKey, unknown>;

  for (const k in OPT_VALIDATORS) {
    const key = k as OptKey;
    const v = b[key];
    if (v === undefined) continue;
    if (!OPT_VALIDATORS[key](v)) throw bundleError(name, `invalid "${key}".`, v);
    target[key] = v;
  }

  return out;
}
