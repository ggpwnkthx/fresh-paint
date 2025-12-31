import type {
  BundleLoader,
  ComponentRegistry,
  CssResource,
  LayoutDef,
  RegistryComponent,
  ThemeDef,
  UiBundle,
} from "./types.ts";
import { asString, isRecord } from "./validation.ts";

export type BundleImporter = string | (() => Promise<unknown>);

export const defineBundle = <T extends UiBundle>(b: T): T => b;
export const cssUrl = (importMetaUrl: string, path: string) => new URL(path, importMetaUrl).href;

type LabeledBundleLoader = BundleLoader & { label?: string };
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

export const moduleBundle = (src: BundleImporter, debugName?: string): BundleLoader => {
  const label = typeof debugName === "string" && debugName.trim() ? debugName.trim() : undefined;
  const name = label ?? (typeof src === "string" ? src : "<bundle importer>");
  const load = typeof src === "string" ? () => import(/* @vite-ignore */ src) : src;

  let cache: Promise<UiBundle> | undefined;
  const loader: LabeledBundleLoader = () => cache ??= load().then((m) => coerceUiBundle(m, name));
  if (label) loader.label = label;
  return loader;
};

function parseUiBundle(b: UnknownRecord, name: string): UiBundle {
  const id = asString(b.id), label = asString(b.label);
  if (!id || !label) throw new Error(`Bundle "${name}" is missing { id, label } strings.`);

  const out: UiBundle = { id, label };
  const set = <K extends OptKey>(k: K, ok: (v: unknown) => v is NonNullable<UiBundle[K]>) => {
    const v = b[k];
    if (v === undefined) return;
    if (!ok(v)) throw new Error(`Bundle "${name}" has invalid ${k}.`);
    out[k] = v;
  };

  set("globalCss", isCssResourceArray);
  set("themes", isThemeMap);
  set("layouts", isLayoutMap);
  set("primitives", isComponentRegistry);
  set("widgets", isComponentRegistry);
  return out;
}

const isRegistryComponent = (v: unknown): v is RegistryComponent =>
  typeof v === "string" || typeof v === "function";
const isComponentRegistry = (v: unknown): v is ComponentRegistry =>
  isRecord(v) && Object.values(v).every(isRegistryComponent);

const isCssResource = (v: unknown): v is CssResource =>
  isRecord(v) && typeof v.url === "string" &&
  (v.media === undefined || typeof v.media === "string");
const isCssResourceArray = (v: unknown): v is CssResource[] =>
  Array.isArray(v) && v.every(isCssResource);

const isThemeDef = (v: unknown): v is ThemeDef =>
  isRecord(v) && typeof v.id === "string" && typeof v.label === "string" &&
  (v.extends === undefined || typeof v.extends === "string") && isCssResourceArray(v.css);
const isThemeMap = (v: unknown): v is Record<string, ThemeDef> =>
  isRecord(v) && Object.values(v).every(isThemeDef);

const isLayoutDef = (v: unknown): v is LayoutDef =>
  isRecord(v) && typeof v.id === "string" && typeof v.label === "string" &&
  typeof v.Layout === "function";
const isLayoutMap = (v: unknown): v is Record<string, LayoutDef> =>
  isRecord(v) && Object.values(v).every(isLayoutDef);
