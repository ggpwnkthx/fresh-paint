import { isRecord, isStringArray } from "./validation.ts";
import type { UiPreferences } from "./types.ts";

export function parseCookieHeader(header: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;

  const parts = header.split(";");
  for (const part of parts) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const raw = part.slice(idx + 1).trim();
    if (!key) continue;
    out[key] = raw;
  }
  return out;
}

export function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  const b64 = btoa(binary);
  return b64.replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

export function base64UrlDecode(s: string): Uint8Array | null {
  const padded = s.replaceAll("-", "+").replaceAll("_", "/") + "===".slice((s.length + 3) % 4);
  try {
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

export function encodePrefsCookie(prefs: UiPreferences): string {
  const json = JSON.stringify(prefs);
  return base64UrlEncode(new TextEncoder().encode(json));
}

export function decodePrefsCookie(value: string): UiPreferences | null {
  const bytes = base64UrlDecode(value);
  if (!bytes) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }

  if (!isRecord(parsed)) return null;
  const stack = parsed["stack"];
  const theme = parsed["theme"];
  const layout = parsed["layout"];

  if (!isStringArray(stack) || typeof theme !== "string" || typeof layout !== "string") return null;

  return { stack, theme, layout };
}

/** Appends a `Set-Cookie` header. */
export function setCookieHeader(
  headers: Headers,
  opts: {
    name: string;
    value: string;
    path?: string;
    httpOnly?: boolean;
    sameSite?: "Lax" | "Strict" | "None";
    secure?: boolean;
    maxAgeSeconds?: number;
  },
): void {
  const parts: string[] = [];
  parts.push(`${opts.name}=${opts.value}`);
  parts.push(`Path=${opts.path ?? "/"}`);

  if (opts.httpOnly ?? true) parts.push("HttpOnly");
  parts.push(`SameSite=${opts.sameSite ?? "Lax"}`);
  if (opts.secure) parts.push("Secure");
  if (typeof opts.maxAgeSeconds === "number") parts.push(`Max-Age=${opts.maxAgeSeconds}`);

  headers.append("Set-Cookie", parts.join("; "));
}
