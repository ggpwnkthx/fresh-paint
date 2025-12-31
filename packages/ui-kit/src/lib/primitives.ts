export type ChoiceItem = { id: string; label: string };

export const toChoiceItems = <T extends { id: string; label: string }>(
  m: Record<string, T>,
): ChoiceItem[] => Object.values(m).map(({ id, label }) => ({ id, label }));

export const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

export const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x): x is string => typeof x === "string");

export const asString = (v: unknown): string | undefined =>
  typeof v === "string" ? v : undefined;

export const cleanLabel = (v: unknown): string | undefined => {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  return s ? s : undefined;
};
