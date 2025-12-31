import type { UiPreferences } from "./types.ts";
import { asString, isRecord, isStringArray } from "./validation.ts";

const te = new TextEncoder();
const td = new TextDecoder();

export function parseCookieHeader(header: string | null): Record<string, string> {
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const [k, v] = part.split("=", 2).map((s) => s.trim());
    if (k) out[k] = v ?? "";
  }
  return out;
}

export const base64UrlEncode = (bytes: Uint8Array): string => {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
};

export const base64UrlDecode = (s: string): Uint8Array | null => {
  const padded = s.replaceAll("-", "+").replaceAll("_", "/") + "===".slice((s.length + 3) % 4);
  try {
    return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
};

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

  const stack = v.stack, theme = asString(v.theme), layout = asString(v.layout);
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
  const p = [
    `${o.name}=${o.value}`,
    `Path=${o.path ?? "/"}`,
    `SameSite=${o.sameSite ?? "Lax"}`,
    ...(o.httpOnly ?? true ? ["HttpOnly"] : []),
    ...(o.secure ? ["Secure"] : []),
    ...(typeof o.maxAgeSeconds === "number" ? [`Max-Age=${o.maxAgeSeconds}`] : []),
  ];
  headers.append("Set-Cookie", p.join("; "));
}
