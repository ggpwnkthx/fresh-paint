import { errorMessage } from "./errors.ts";

export function methodNotAllowed(allow: string): Response {
  return new Response("Method Not Allowed", {
    status: 405,
    headers: { Allow: allow },
  });
}

export function addVary(headers: Headers, value: string): void {
  const next = value.trim();
  if (!next) return;

  const cur = headers.get("Vary") ?? headers.get("vary");
  if (!cur) return void headers.set("Vary", next);

  const tokens = cur.split(",").map((s) => s.trim()).filter(Boolean);
  if (!tokens.some((t) => t.toLowerCase() === next.toLowerCase())) {
    headers.set("Vary", [...tokens, next].join(", "));
  }
}

export const normalizePathname = (p: string): string => {
  // URL.pathname is always absolute, but callers may pass arbitrary strings.
  if (!p) return "/";
  if (p === "/") return "/";
  const s = p.startsWith("/") ? p : `/${p}`;
  return s.replace(/\/+$/, "");
};

export const isUnderPath = (p: string, base: string): boolean =>
  p === base || p.startsWith(base + "/");

async function readTextBodyLimited(
  body: ReadableStream<Uint8Array> | null,
  maxChars: number,
): Promise<string> {
  if (!body) return "";

  const td = new TextDecoder();
  const reader = body.getReader();
  let out = "";

  try {
    while (out.length < maxChars) {
      const { value, done } = await reader.read();
      if (done) break;

      if (value?.length) {
        out += td.decode(value, { stream: true });
        if (out.length >= maxChars) {
          out = out.slice(0, maxChars);
          await reader.cancel().catch(() => {});
          break;
        }
      }
    }
    // Flush any buffered decoder state.
    out += td.decode();
    return out;
  } finally {
    reader.releaseLock();
  }
}

/**
 * Read an error message from a Response, without unbounded memory usage.
 * - Tries JSON `{ error }` if content-type includes "json" (bounded to `maxChars`)
 * - Falls back to reading up to `maxChars` of text (streaming)
 *
 * NOTE (necessary hardening): previously, JSON parsing used `res.clone().json()`,
 * which can read an arbitrarily large body into memory. This now caps reads.
 */
export async function readResponseError(
  res: Response,
  opts: { maxChars?: number } = {},
): Promise<string> {
  const maxChars = Math.max(1, opts.maxChars ?? 300);
  const ct = (res.headers.get("content-type") ?? "").toLowerCase();

  if (ct.includes("json")) {
    try {
      const txt = await readTextBodyLimited(res.clone().body, maxChars);
      const j: unknown = JSON.parse(txt);
      if (j && typeof j === "object" && "error" in j) {
        return String((j as { error?: unknown }).error);
      }
    } catch {
      // ignore and fall back to text streaming
    }
  }

  try {
    const txt = await readTextBodyLimited(res.body, maxChars);
    const s = txt.trim();
    return s ? s : `HTTP ${res.status}`;
  } catch (e) {
    return errorMessage(e) || `HTTP ${res.status}`;
  }
}
