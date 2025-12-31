import type { ComponentChildren, FunctionComponent, JSX } from "preact";
import type { ChoiceItem } from "./lib/primitives.ts";

export type BundleId = string;
export type ThemeId = string;
export type LayoutId = string;

export interface CssResource {
  url: string;
  media?: string;
}

export interface ThemeDef {
  id: ThemeId;
  label: string;
  extends?: ThemeId;
  css: CssResource[];
}

export interface LayoutComponentProps {
  children: ComponentChildren;
  ui: UiRuntime;
}

export interface LayoutDef {
  id: LayoutId;
  label: string;
  Layout: FunctionComponent<LayoutComponentProps>;
}

export type RegistryComponent = JSX.ElementType;
export type ComponentRegistry = Record<string, RegistryComponent>;

export interface UiBundle {
  id: BundleId;
  label: string;
  globalCss?: CssResource[];
  themes?: Record<ThemeId, ThemeDef>;
  layouts?: Record<LayoutId, LayoutDef>;
  primitives?: ComponentRegistry;
  widgets?: ComponentRegistry;
}

export interface UiPreferences {
  stack: BundleId[];
  theme: ThemeId;
  layout: LayoutId;
}

export interface UiRegistry {
  bundles: Record<BundleId, UiBundle>;
  themes: Record<ThemeId, ThemeDef>;
  layouts: Record<LayoutId, LayoutDef>;
  primitives: ComponentRegistry;
  widgets: ComponentRegistry;
}

export interface CssLink {
  href: string;
  media?: string;
  sourceUrl: string;
}

export interface UiRuntime {
  prefs: UiPreferences;
  registry: UiRegistry;
  css: CssLink[];
  warnings: string[];
  catalog: readonly ChoiceItem[];
  choices: { themes: readonly ChoiceItem[]; layouts: readonly ChoiceItem[] };
}

export type BundleLoader = () => Promise<UiBundle>;
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };
export type UiState = { ui?: UiRuntime };
