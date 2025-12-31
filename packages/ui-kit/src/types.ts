import type { ComponentChildren, FunctionComponent, JSX } from "preact";

export type BundleId = string;
export type ThemeId = string;
export type LayoutId = string;

export interface CssResource {
  /** Absolute URL string (http(s): or file: during dev). */
  url: string;
  /** Optional media query for <link media="..."> */
  media?: string;
}

export interface ThemeDef {
  id: ThemeId;
  label: string;
  /** Optional theme inheritance; used to layer CSS for a derived theme. */
  extends?: ThemeId;
  css: CssResource[];
}

export interface LayoutComponentProps {
  children: ComponentChildren;
  /** Resolved UI runtime for this request (so layouts can access primitives/widgets). */
  ui: UiRuntime;
}

export interface LayoutDef {
  id: LayoutId;
  label: string;
  Layout: FunctionComponent<LayoutComponentProps>;
}

/**
 * Registry boundary:
 * - Props are intentionally NOT enforced across bundles.
 * - We want bundle authors to register typed components (FC<CardProps>, FC<ButtonProps>, ...)
 *   without variance errors under `strict`.
 *
 * `JSX.ElementType` is the correct “any component” type for JSX and avoids contravariance issues.
 */
export type RegistryComponent = JSX.ElementType;

/** A registry of components (props intentionally not enforced at this boundary). */
export type ComponentRegistry = Record<string, RegistryComponent>;

export interface UiBundle {
  id: BundleId;
  label: string;

  /** CSS always included (in stack order). */
  globalCss?: CssResource[];

  /** Theme CSS can be layered via ThemeDef.extends and bundle stacking. */
  themes?: Record<ThemeId, ThemeDef>;

  /** Layout templates (later bundles can override by key). */
  layouts?: Record<LayoutId, LayoutDef>;

  /** Low-level building blocks (buttons, cards, typography…). */
  primitives?: ComponentRegistry;

  /** Higher-level building blocks (Hero, PricingTable, etc.). */
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
  /** The original URL (useful for debugging). */
  sourceUrl: string;
}

export interface UiRuntime {
  prefs: UiPreferences;
  registry: UiRegistry;
  css: CssLink[];
  /** Warnings computed during preference resolution (unknown bundle ids, invalid theme/layout…). */
  warnings: string[];
}

/** A (lazy) bundle loader. */
export type BundleLoader = () => Promise<UiBundle>;

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };
