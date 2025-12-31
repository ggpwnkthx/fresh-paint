import type { Result, UiPreferences } from "./types.ts";
import { asString, isRecord, isStringArray } from "./validation.ts";

export interface ParseUiPreferencesOptions {
  maxStack?: number;
}

export interface UiKitLike {
  setPreferencesCookie(headers: Headers, prefs: UiPreferences): void;
}

const bad = (error: string, status = 400) => Response.json({ ok: false, error }, { status });

export function parseUiPreferencesJson(
  body: unknown,
  { maxStack = 20 }: ParseUiPreferencesOptions = {},
): Result<UiPreferences> {
  if (!isRecord(body)) return { ok: false, error: "Invalid JSON" };

  const stack = body.stack;
  const theme = asString(body.theme)?.trim();
  const layout = asString(body.layout)?.trim();

  if (!isStringArray(stack) || !theme || !layout) {
    return { ok: false, error: "Expected { stack: string[], theme: string, layout: string }" };
  }
  if (stack.length > maxStack) return { ok: false, error: "Stack too large" };
  if (stack.some((s) => !s.trim())) {
    return { ok: false, error: "Preference ids must be non-empty strings" };
  }

  return { ok: true, value: { stack, theme, layout } };
}

export async function handleUiPreferencesPost(
  req: Request,
  kit: UiKitLike,
  opts: ParseUiPreferencesOptions = {},
): Promise<Response> {
  const body: unknown = await req.json().catch(() => null);
  const parsed = parseUiPreferencesJson(body, opts);
  if (!parsed.ok) return bad(parsed.error);

  const headers = new Headers();
  kit.setPreferencesCookie(headers, parsed.value);
  return Response.json({ ok: true }, { headers });
}
