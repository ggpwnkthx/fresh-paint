import type { ComponentRegistry, CssResource, LayoutDef, ThemeDef, UiBundle } from "../types.ts";
import { asString, isRecord } from "../lib/primitives.ts";
import { isComponentRegistry, isCssResourceArray, isLayoutMap, isThemeMap } from "./validators.ts";

type UnknownRecord = Record<string, unknown>;
type OptKey = Exclude<keyof UiBundle, "id" | "label">;

export function coerceUiBundle(modOrBundle: unknown, name: string): UiBundle {
  if (!isRecord(modOrBundle)) throw new Error(`Bundle "${name}" did not evaluate to an object.`);

  const exp = ("bundle" in modOrBundle || "default" in modOrBundle)
    ? (modOrBundle as UnknownRecord).bundle ?? (modOrBundle as UnknownRecord).default
    : modOrBundle;

  if (!isRecord(exp)) throw new Error(`Bundle "${name}" must export { bundle } or default.`);
  return parseUiBundle(exp, name);
}

export function parseUiBundle(b: UnknownRecord, name: string): UiBundle {
  const id = asString(b.id);
  const label = asString(b.label);
  if (!id || !label) throw new Error(`Bundle "${name}" is missing { id, label } strings.`);

  const out: UiBundle = { id, label };

  const set = <K extends OptKey>(
    k: K,
    ok: (v: unknown) => v is NonNullable<UiBundle[K]>,
  ) => {
    const v = b[k];
    if (v === undefined) return;
    if (!ok(v)) throw new Error(`Bundle "${name}" has invalid ${k}.`);
    out[k] = v;
  };

  set("globalCss", (v: unknown): v is CssResource[] => isCssResourceArray(v));
  set("themes", (v: unknown): v is Record<string, ThemeDef> => isThemeMap(v));
  set("layouts", (v: unknown): v is Record<string, LayoutDef> => isLayoutMap(v));
  set("primitives", (v: unknown): v is ComponentRegistry => isComponentRegistry(v));
  set("widgets", (v: unknown): v is ComponentRegistry => isComponentRegistry(v));

  return out;
}
