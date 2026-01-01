// Defensive parsing: avoid spending unbounded time on pathological headers.
const MAX_COOKIE_HEADER_CHARS = 16_384;
const MAX_COOKIE_PAIRS = 200;

export function parseCookieHeader(header: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;

  // Hardening: ignore absurdly large cookie headers (DoS safety).
  if (header.length > MAX_COOKIE_HEADER_CHARS) return out;

  let count = 0;
  for (const part of header.split(";")) {
    if (++count > MAX_COOKIE_PAIRS) break;

    const p = part.trim();
    if (!p) continue;

    const i = p.indexOf("=");
    const k = (i < 0 ? p : p.slice(0, i)).trim();
    if (!k) continue;

    out[k] = (i < 0 ? "" : p.slice(i + 1)).trim();
  }

  return out;
}
