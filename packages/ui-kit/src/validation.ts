export const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

export const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x): x is string => typeof x === "string");

export const asString = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);
