import { uiKit } from "../../lib/ui.ts";

type Ctx = { req: Request };

type IncomingPrefs = {
  stack: string[];
  theme: string;
  layout: string;
};

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

function parseIncoming(v: unknown): IncomingPrefs | null {
  if (typeof v !== "object" || v === null) return null;
  const r = v as Record<string, unknown>;
  if (!isStringArray(r.stack)) return null;
  if (typeof r.theme !== "string") return null;
  if (typeof r.layout !== "string") return null;
  return { stack: r.stack, theme: r.theme, layout: r.layout };
}

export const handler = {
  async POST(ctx: Ctx): Promise<Response> {
    let body: unknown;
    try {
      body = await ctx.req.json();
    } catch {
      return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }

    const incoming = parseIncoming(body);
    if (!incoming) {
      return Response.json(
        { ok: false, error: "Expected { stack: string[], theme: string, layout: string }" },
        { status: 400 },
      );
    }

    if (incoming.stack.length > 20) {
      return Response.json({ ok: false, error: "Stack too large" }, { status: 400 });
    }

    const headers = new Headers();
    uiKit.setPreferencesCookie(headers, {
      stack: incoming.stack,
      theme: incoming.theme,
      layout: incoming.layout,
    });

    return Response.json({ ok: true }, { headers });
  },
};
