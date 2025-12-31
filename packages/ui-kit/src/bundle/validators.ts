import type {
  ComponentRegistry,
  CssResource,
  LayoutDef,
  RegistryComponent,
  ThemeDef,
} from "../types.ts";
import { isRecord } from "../lib/primitives.ts";

export const isRegistryComponent = (v: unknown): v is RegistryComponent =>
  typeof v === "string" || typeof v === "function";

export const isComponentRegistry = (v: unknown): v is ComponentRegistry =>
  isRecord(v) && Object.values(v).every(isRegistryComponent);

export const isCssResource = (v: unknown): v is CssResource =>
  isRecord(v) && typeof v.url === "string" &&
  (v.media === undefined || typeof v.media === "string");

export const isCssResourceArray = (v: unknown): v is CssResource[] =>
  Array.isArray(v) && v.every(isCssResource);

export const isThemeDef = (v: unknown): v is ThemeDef =>
  isRecord(v) && typeof v.id === "string" && typeof v.label === "string" &&
  (v.extends === undefined || typeof v.extends === "string") &&
  isCssResourceArray(v.css);

export const isThemeMap = (v: unknown): v is Record<string, ThemeDef> =>
  isRecord(v) && Object.values(v).every(isThemeDef);

export const isLayoutDef = (v: unknown): v is LayoutDef =>
  isRecord(v) && typeof v.id === "string" && typeof v.label === "string" &&
  typeof v.Layout === "function";

export const isLayoutMap = (v: unknown): v is Record<string, LayoutDef> =>
  isRecord(v) && Object.values(v).every(isLayoutDef);
