export type ChoiceItem = { id: string; label: string };

export const toChoiceItems = <T extends ChoiceItem>(m: Record<string, T>): ChoiceItem[] =>
  Object.values(m).map(({ id, label }) => ({ id, label }));
