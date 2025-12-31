import type { UiPreferences } from "../types.ts";
import { asString, isRecord, isStringArray } from "../lib/primitives.ts";
import { base64UrlDecode, base64UrlEncode } from "../lib/encoding.ts";

const te = new TextEncoder();
const td = new TextDecoder();

export function parseCookieHeader(header: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (header ?? "").split(";")) {
    const p = part.trim();
    if (!p) continue;

    const i = p.indexOf("=");
    const k = (i < 0 ? p : p.slice(0, i)).trim();
    if (!k) continue;

    out[k] = (i < 0 ? "" : p.slice(i + 1)).trim();
  }
  return out;
}

export const encodePrefsCookie = (prefs: UiPreferences): string =>
  base64UrlEncode(te.encode(JSON.stringify(prefs)));

export function decodePrefsCookie(value: string): UiPreferences | null {
  const bytes = base64UrlDecode(value);
  if (!bytes) return null;

  let v: unknown;
  try {
    v = JSON.parse(td.decode(bytes));
  } catch {
    return null;
  }
  if (!isRecord(v)) return null;

  const stack = v.stack;
  const theme = asString(v.theme);
  const layout = asString(v.layout);

  return isStringArray(stack) && theme && layout ? { stack, theme, layout } : null;
}

export interface SetCookieOpts {
  name: string;
  value: string;
  path?: string;
  httpOnly?: boolean;
  sameSite?: "Lax" | "Strict" | "None";
  secure?: boolean;
  maxAgeSeconds?: number;
}

export function setCookieHeader(headers: Headers, o: SetCookieOpts): void {
  headers.append(
    "Set-Cookie",
    [
      `${o.name}=${o.value}`,
      `Path=${o.path ?? "/"}`,
      `SameSite=${o.sameSite ?? "Lax"}`,
      ...(o.httpOnly === false ? [] : ["HttpOnly"]),
      ...(o.secure ? ["Secure"] : []),
      ...(o.maxAgeSeconds == null ? [] : [`Max-Age=${o.maxAgeSeconds}`]),
    ].join("; "),
  );
}
