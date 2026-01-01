export type ChoiceItem = { id: string; label: string };

export const hasOwn = (o: object, k: PropertyKey): boolean =>
  Object.prototype.hasOwnProperty.call(o, k);

export const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

export const isObjectLike = (v: unknown): v is object =>
  (typeof v === "object" && v !== null) || typeof v === "function";

export const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x): x is string => typeof x === "string");

export const asString = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);

export const cleanString = (v: unknown): string | undefined => {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  return s ? s : undefined;
};

/** A non-empty string after trimming, without rewriting the original value. */
export const isNonEmptyString = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0;

/** Runtime guard for potentially-untrusted ChoiceItem values. */
export const isChoiceItem = (v: unknown): v is ChoiceItem =>
  isRecord(v) && typeof v.id === "string" && typeof v.label === "string";

/** Kept for compatibility; use cleanString for general strings. */
export const cleanLabel = cleanString;

export function sortChoiceItems<T extends ChoiceItem>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => a.label.localeCompare(b.label) || a.id.localeCompare(b.id));
}

export const toChoiceItems = <T extends ChoiceItem>(m: Record<string, T>): ChoiceItem[] =>
  sortChoiceItems(Object.values(m).map(({ id, label }) => ({ id, label })));
