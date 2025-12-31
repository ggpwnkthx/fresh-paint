export const CATALOG = [
  { id: "base", label: "Base" },
  { id: "ocean", label: "Ocean" },
  { id: "holiday", label: "Holiday" },
] as const;

export type CatalogId = typeof CATALOG[number]["id"];
