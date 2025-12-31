import type { BundleLoader, UiBundle } from "../types.ts";
import { coerceUiBundle } from "./parse.ts";

export type BundleImporter = string | (() => Promise<unknown>);

export const defineBundle = <T extends UiBundle>(b: T): T => b;

export const cssUrl = (importMetaUrl: string, path: string) =>
  new URL(path, importMetaUrl).href;

type LabeledBundleLoader = BundleLoader & { label?: string };

export const moduleBundle = (src: BundleImporter, debugName?: string): BundleLoader => {
  const label = typeof debugName === "string" && debugName.trim() ? debugName.trim() : undefined;
  const name = label ?? (typeof src === "string" ? src : "<bundle importer>");
  const load = typeof src === "string" ? () => import(/* @vite-ignore */ src) : src;

  let cache: Promise<UiBundle> | undefined;
  const loader: LabeledBundleLoader = () => cache ??= load().then((m) => coerceUiBundle(m, name));
  if (label) loader.label = label;
  return loader;
};

export { coerceUiBundle } from "./parse.ts";
export {
  isComponentRegistry,
  isCssResource,
  isCssResourceArray,
  isLayoutDef,
  isLayoutMap,
  isRegistryComponent,
  isThemeDef,
  isThemeMap,
} from "./validators.ts";
