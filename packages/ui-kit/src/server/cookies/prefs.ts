import type { UiPreferences } from "../../types.ts";
import { asString, isRecord, isStringArray } from "../../lib/primitives.ts";
import { base64UrlDecode, base64UrlEncode } from "../../lib/encoding.ts";

const te = new TextEncoder();
const td = new TextDecoder();

// Hardening: cookies should be small. This prevents wasting CPU/memory on huge values.
const MAX_PREFS_COOKIE_CHARS = 4096;
// Hardening: prevents pathological stacks from causing huge work during resolve().
const MAX_PREFS_STACK = 50;

export const encodePrefsCookie = (prefs: UiPreferences): string =>
  base64UrlEncode(te.encode(JSON.stringify(prefs)));

export function decodePrefsCookie(value: string): UiPreferences | null {
  if (!value || value.length > MAX_PREFS_COOKIE_CHARS) return null;

  const bytes = base64UrlDecode(value);
  if (!bytes) return null;

  let v: unknown;
  try {
    v = JSON.parse(td.decode(bytes));
  } catch {
    return null;
  }

  if (!isRecord(v)) return null;

  const stack = (v as { stack?: unknown }).stack;
  const themeRaw = asString((v as { theme?: unknown }).theme);
  const layoutRaw = asString((v as { layout?: unknown }).layout);

  // Necessary hardening: whitespace-only ids cause confusing lookups + warnings; treat as invalid.
  const theme = themeRaw?.trim();
  const layout = layoutRaw?.trim();

  if (!isStringArray(stack) || !theme || !layout) return null;
  if (stack.length > MAX_PREFS_STACK) return null;
  if (stack.some((s) => !s.trim())) return null;

  return { stack, theme, layout };
}
