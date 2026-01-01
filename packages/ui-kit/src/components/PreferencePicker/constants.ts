const btnBase = { type: "button" as const, class: "ui-btn" } as const;

export const S = {
  header: "display:flex;flex-direction:column;gap:6px;margin-bottom:12px",
  help: "opacity:.8;font-size:.95em",
  row: "display:flex;gap:10px;align-items:center;flex-wrap:wrap",
  field: "display:flex;flex-direction:column;gap:6px;min-width:240px",
  footer: "margin-top:14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap",
  err: "border-color:color-mix(in oklab, red, var(--ui-border) 70%)",
  details: "margin-top:10px",
  list: "margin-top:10px;display:flex;flex-direction:column;gap:8px",
  item: "display:flex;gap:8px;align-items:center;justify-content:space-between",
  actions: "display:flex;gap:8px;align-items:center;flex-wrap:wrap",
  addRow: "margin-top:10px;display:flex;gap:10px;align-items:center;flex-wrap:wrap",
  select: "min-width:260px",
} as const;

export const BTN = {
  ghost: { ...btnBase, "data-variant": "ghost" as const },
  primary: { ...btnBase, "data-variant": "primary" as const },
} as const;
