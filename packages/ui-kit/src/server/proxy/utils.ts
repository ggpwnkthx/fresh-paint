import { base64UrlEncode } from "../../lib/encoding.ts";

const te = new TextEncoder();

export const bad = (msg: string, status: number) => new Response(msg, { status });

export function normalizeBasePath(p: string): string {
  const trimmed = p.trim() || "/ui/css";
  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withSlash.replace(/\/+$/, "");
}

export function parseIdFromPath(pathname: string, basePath: string): string | null {
  if (!pathname.startsWith(basePath + "/")) return null;
  const raw = pathname.slice(basePath.length + 1).replace(/\.css$/, "");
  if (!raw) return null;
  // Hardening: prevent odd path segments / injection.
  if (!/^[A-Za-z0-9_-]+$/.test(raw)) return null;
  return raw;
}

export async function readBodyUpTo(
  body: ReadableStream<Uint8Array> | null,
  max: number,
): Promise<Uint8Array | null> {
  if (!body) return new Uint8Array();

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > max) return null;
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.byteLength;
  }

  return out;
}

export async function hashId(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", te.encode(input));
  return base64UrlEncode(new Uint8Array(digest).subarray(0, 12));
}
