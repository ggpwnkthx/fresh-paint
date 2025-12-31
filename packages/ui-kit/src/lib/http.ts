export function methodNotAllowed(allow: string): Response {
  return new Response("Method Not Allowed", {
    status: 405,
    headers: { allow },
  });
}

export function addVary(headers: Headers, value: string): void {
  const cur = headers.get("vary");
  if (!cur) return void headers.set("vary", value);

  const tokens = cur.split(",").map((s) => s.trim()).filter(Boolean);
  if (tokens.some((t) => t.toLowerCase() === value.toLowerCase())) return;

  headers.set("vary", [...tokens, value].join(", "));
}

export const normalizePathname = (p: string): string => p === "/" ? "/" : p.replace(/\/+$/, "");

export const isUnderPath = (p: string, base: string): boolean =>
  p === base || p.startsWith(base + "/");

export async function readResponseError(
  res: Response,
  opts: { maxChars?: number } = {},
): Promise<string> {
  const maxChars = opts.maxChars ?? 300;

  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("json")) {
    const j: unknown = await res.json().catch(() => null);
    if (j && typeof j === "object" && "error" in j) {
      return String((j as { error?: unknown }).error);
    }
  }

  const t = await res.text().catch(() => "");
  const s = t.trim().slice(0, maxChars);
  return s ? s : `HTTP ${res.status}`;
}
