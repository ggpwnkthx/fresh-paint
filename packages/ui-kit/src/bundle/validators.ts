import type {
  ComponentRegistry,
  CssResource,
  LayoutDef,
  RegistryComponent,
  ThemeDef,
} from "../types.ts";
import { hasOwn, isNonEmptyString, isRecord } from "../lib/primitives.ts";

const isFn = (v: unknown): v is (...args: unknown[]) => unknown => typeof v === "function";

const isRecordOf = <T>(
  v: unknown,
  isT: (x: unknown) => x is T,
): v is Record<string, T> => {
  if (!isRecord(v)) return false;
  const rec = v as Record<string, unknown>;
  for (const k in rec) if (hasOwn(rec, k) && !isT(rec[k])) return false;
  return true;
};

/**
 * NOTE (necessary hardening): string registry components must be non-empty.
 * Empty tag names are not meaningful and can cause runtime rendering failures.
 */
export const isRegistryComponent = (v: unknown): v is RegistryComponent =>
  isNonEmptyString(v) || isFn(v);

export const isComponentRegistry = (v: unknown): v is ComponentRegistry =>
  isRecordOf<RegistryComponent>(v, isRegistryComponent);

export const isCssResource = (v: unknown): v is CssResource =>
  isRecord(v) &&
  isNonEmptyString(v.url) &&
  (v.media === undefined || isNonEmptyString(v.media));

export const isCssResourceArray = (v: unknown): v is CssResource[] =>
  Array.isArray(v) && v.every(isCssResource);

export const isThemeDef = (v: unknown): v is ThemeDef =>
  isRecord(v) &&
  isNonEmptyString(v.id) &&
  isNonEmptyString(v.label) &&
  (v.extends === undefined || isNonEmptyString(v.extends)) &&
  isCssResourceArray(v.css);

export const isThemeMap = (v: unknown): v is Record<string, ThemeDef> =>
  isRecordOf<ThemeDef>(v, isThemeDef);

export const isLayoutDef = (v: unknown): v is LayoutDef =>
  isRecord(v) &&
  isNonEmptyString(v.id) &&
  isNonEmptyString(v.label) &&
  isFn(v.Layout);

export const isLayoutMap = (v: unknown): v is Record<string, LayoutDef> =>
  isRecordOf<LayoutDef>(v, isLayoutDef);
