import type { BundleLoader, UiBundle } from "../types.ts";
import { cleanLabel, cleanString } from "../lib/primitives.ts";
import { errorMessage, UiKitError, uiKitError } from "../lib/errors.ts";
import { coerceUiBundle } from "./parse.ts";

export type BundleImporter = string | (() => Promise<unknown>);
export const defineBundle = <T extends UiBundle>(b: T): T => b;

export const cssUrl = (importMetaUrl: string, path: string): string =>
  new URL(path, importMetaUrl).href;

type ImporterFn = () => Promise<unknown>;
type LabeledBundleLoader = BundleLoader & { label?: string };

const invalidInput = (name: string, msg: string, cause?: unknown): UiKitError =>
  uiKitError("E_INVALID_INPUT", `Bundle "${name}": ${msg}`, cause);

function normalizeImporter(src: unknown, displayName: string): ImporterFn {
  if (typeof src === "string") {
    const spec = cleanString(src);
    if (!spec) throw invalidInput(displayName, "empty import specifier.", src);
    return () => import(/* @vite-ignore */ spec);
  }
  if (typeof src === "function") return () => Promise.resolve((src as () => unknown)());
  throw invalidInput(displayName, "invalid importer.", src);
}

const onceAsync = <T>(fn: () => Promise<T>): () => Promise<T> => {
  let cache: Promise<T> | undefined;
  return () => (cache ??= Promise.resolve().then(fn));
};

export const moduleBundle = (src: BundleImporter, debugName?: string): BundleLoader => {
  const label = cleanLabel(debugName);
  const specForName = typeof src === "string" ? cleanString(src) : undefined;
  const displayName = label ?? specForName ??
    (typeof src === "string" ? "<empty specifier>" : "<bundle importer>");
  const importModule = normalizeImporter(src, displayName);

  const loader: LabeledBundleLoader = onceAsync(async () => {
    try {
      const mod = await importModule();
      return coerceUiBundle(mod, displayName);
    } catch (e) {
      throw uiKitError(
        "E_BUNDLE_INVALID",
        `Failed to load bundle "${displayName}": ${errorMessage(e)}`,
        e,
      );
    }
  });

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
