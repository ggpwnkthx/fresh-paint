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

export const defineBundle = <T extends UiBundle>(b: T): T => b;

export const cssUrl = (importMetaUrl: string, path: string): string =>
  new URL(path, importMetaUrl).href;

type Importer = string | (() => Promise<unknown>);

export const moduleBundle = (src: Importer, debugName?: string): BundleLoader => {
  const name = debugName ?? (typeof src === "string" ? src : "<bundle importer>");
  const load = typeof src === "string" ? () => import(/* @vite-ignore */ src) : src;

  let cache: UiBundle | undefined;
  return async () => cache ??= readBundle(await load(), name);
};

type UnknownRecord = Record<string, unknown>;

function readBundle(mod: unknown, name: string): UiBundle {
  if (!isRecord(mod)) throw new Error(`Bundle "${name}" did not evaluate to an object.`);

  const exp = mod.bundle ?? mod.default;
  if (!isRecord(exp)) throw new Error(`Bundle "${name}" must export { bundle } or default.`);

  return parseUiBundle(exp, name);
}

function parseUiBundle(b: UnknownRecord, name: string): UiBundle {
  const id = asString(b.id);
  const label = asString(b.label);
  if (!id || !label) throw new Error(`Bundle "${name}" is missing { id, label } strings.`);

  const out: UiBundle = { id, label };

  const globalCss = b.globalCss;
  if (globalCss !== undefined) {
    if (!isCssResourceArray(globalCss)) {
      throw new Error(`Bundle "${name}" has invalid globalCss (expected CssResource[]).`);
    }
    out.globalCss = globalCss;
  }

  const themes = b.themes;
  if (themes !== undefined) {
    if (!isThemeMap(themes)) {
      throw new Error(`Bundle "${name}" has invalid themes (expected Record<ThemeId, ThemeDef>).`);
    }
    out.themes = themes;
  }

  const layouts = b.layouts;
  if (layouts !== undefined) {
    if (!isLayoutMap(layouts)) {
      throw new Error(
        `Bundle "${name}" has invalid layouts (expected Record<LayoutId, LayoutDef>).`,
      );
    }
    out.layouts = layouts;
  }

  const primitives = b.primitives;
  if (primitives !== undefined) {
    if (!isComponentRegistry(primitives)) {
      throw new Error(
        `Bundle "${name}" has invalid primitives (expected Record<string, JSX.ElementType>).`,
      );
    }
    out.primitives = primitives;
  }

  const widgets = b.widgets;
  if (widgets !== undefined) {
    if (!isComponentRegistry(widgets)) {
      throw new Error(
        `Bundle "${name}" has invalid widgets (expected Record<string, JSX.ElementType>).`,
      );
    }
    out.widgets = widgets;
  }

  return out;
}

function isRegistryComponent(v: unknown): v is RegistryComponent {
  // JSX.ElementType: string (intrinsic) or function/class component
  return typeof v === "string" || typeof v === "function";
}

function isComponentRegistry(v: unknown): v is ComponentRegistry {
  return isRecord(v) && Object.values(v).every(isRegistryComponent);
}

function isCssResource(v: unknown): v is CssResource {
  if (!isRecord(v)) return false;
  if (typeof v.url !== "string") return false;
  if (v.media !== undefined && typeof v.media !== "string") return false;
  return true;
}

function isCssResourceArray(v: unknown): v is CssResource[] {
  return Array.isArray(v) && v.every(isCssResource);
}

function isThemeDef(v: unknown): v is ThemeDef {
  if (!isRecord(v)) return false;
  if (typeof v.id !== "string") return false;
  if (typeof v.label !== "string") return false;
  if (v.extends !== undefined && typeof v.extends !== "string") return false;
  return isCssResourceArray(v.css);
}

function isThemeMap(v: unknown): v is Record<string, ThemeDef> {
  return isRecord(v) && Object.values(v).every(isThemeDef);
}

function isLayoutDef(v: unknown): v is LayoutDef {
  if (!isRecord(v)) return false;
  if (typeof v.id !== "string") return false;
  if (typeof v.label !== "string") return false;
  return typeof v.Layout === "function";
}

function isLayoutMap(v: unknown): v is Record<string, LayoutDef> {
  return isRecord(v) && Object.values(v).every(isLayoutDef);
}
