import { UiKitError } from "../../lib/errors.ts";

export interface SetCookieOpts {
  name: string;
  value: string;
  path?: string;
  httpOnly?: boolean;
  sameSite?: "Lax" | "Strict" | "None";
  secure?: boolean;
  maxAgeSeconds?: number;
}

// RFC-ish token check: reject CTLs, whitespace, and separators ("tspecials")
const COOKIE_SEPARATORS = new Set<string>([
  "(",
  ")",
  "<",
  ">",
  "@",
  ",",
  ";",
  ":",
  "\\",
  '"',
  "/",
  "[",
  "]",
  "?",
  "=",
  "{",
  "}",
  " ",
  "\t",
]);

export function isCookieToken(s: string): boolean {
  if (!s) return false;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i]!;
    const code = ch.charCodeAt(0);

    // Reject CTLs and non-ASCII (and also excludes all whitespace <= 0x20)
    if (code <= 0x20 || code >= 0x7f) return false;
    if (COOKIE_SEPARATORS.has(ch)) return false;
  }

  return true;
}

// Minimal hardening: prevent header injection / breaking the Set-Cookie header.
// (Cookie values should be encoded by callers; UiKit's prefs cookie is base64url-safe.)
function isSafeCookieValue(value: string): boolean {
  if (value.length === 0) return true;
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code <= 0x1f || code === 0x7f) return false; // CTLs
  }
  // Disallow ';' because we do not implement quoting/escaping in this helper.
  return !value.includes(";");
}

export function setCookieHeader(headers: Headers, o: SetCookieOpts): void {
  if (!isCookieToken(o.name)) {
    throw new UiKitError("E_COOKIE_INVALID", `Invalid cookie name: "${o.name}"`);
  }
  if (!isSafeCookieValue(o.value)) {
    throw new UiKitError("E_COOKIE_INVALID", `Invalid cookie value for "${o.name}"`);
  }

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
