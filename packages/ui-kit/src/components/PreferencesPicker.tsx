import { useState } from "preact/hooks";
import type { ChoiceItem } from "../lib/primitives.ts";
import { readResponseError } from "../lib/http.ts";
import type { UiPreferences } from "../types.ts";

export type PreferencesPickerProps = {
  catalog: readonly ChoiceItem[];
  current: UiPreferences;
  themes: readonly ChoiceItem[];
  layouts: readonly ChoiceItem[];
  endpoint?: string;
  reloadOnApply?: boolean;
};

const S = {
  grid: "display:grid;grid-template-columns:1fr 1fr;gap:14px",
  col: "display:flex;flex-direction:column;gap:8px",
  row: "display:flex;gap:8px;align-items:center;justify-content:space-between",
  actions: "display:flex;gap:8px",
  selects: "margin-top:14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap",
  footer: "margin-top:14px;display:flex;gap:10px;align-items:center",
  err: "border-color:color-mix(in oklab, red, var(--ui-border) 70%)",
} as const;

const BTN = {
  ghost: { type: "button" as const, class: "ui-btn", "data-variant": "ghost" as const },
  primary: { type: "button" as const, class: "ui-btn", "data-variant": "primary" as const },
} as const;

const onSelect = (set: (v: string) => void) => (e: Event) =>
  set((e.currentTarget as HTMLSelectElement | null)?.value ?? "");

export function PreferencesPicker({
  catalog,
  current,
  themes,
  layouts,
  endpoint = "/api/ui-preferences",
  reloadOnApply = true,
}: PreferencesPickerProps) {
  const [stack, setStack] = useState<string[]>(() => [...current.stack]);
  const [theme, setTheme] = useState(current.theme);
  const [layout, setLayout] = useState(current.layout);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const enabled = new Set(stack);
  const available = catalog.filter((c) => !enabled.has(c.id));
  const labelOf = (id: string) => catalog.find((c) => c.id === id)?.label ?? id;

  const move = (id: string, dir: -1 | 1) =>
    setStack((s) => {
      const i = s.indexOf(id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= s.length) return s;
      const n = s.slice();
      [n[i], n[j]] = [n[j]!, n[i]!];
      return n;
    });

  const remove = (id: string) => setStack((s) => s.filter((x) => x !== id));
  const add = (id: string) => setStack((s) => (s.includes(id) ? s : [...s, id]));

  const apply = async () => {
    setSaving(true);
    setError(undefined);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ stack, theme, layout }),
      });
      if (!res.ok) throw new Error(await readResponseError(res));
      if (reloadOnApply) location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div class="ui-card">
      <h2>Preferences</h2>
      <p style="margin-bottom:12px">Reorder bundles, pick theme/layout, then Apply.</p>

      <div style={S.grid}>
        <div>
          <div class="ui-pill" style="margin-bottom:10px">Enabled stack (top overrides bottom)</div>

          {stack.length === 0 ? <div class="ui-pill">No bundles enabled</div> : (
            <div style={S.col}>
              {stack.map((id) => (
                <div key={id} style={S.row}>
                  <span class="ui-pill" title={id}>{labelOf(id)}</span>
                  <span style={S.actions}>
                    <button {...BTN.ghost} disabled={saving} onClick={() => move(id, -1)}>↑</button>
                    <button {...BTN.ghost} disabled={saving} onClick={() => move(id, 1)}>↓</button>
                    <button {...BTN.ghost} disabled={saving} onClick={() => remove(id)}>
                      Remove
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div class="ui-pill" style="margin-bottom:10px">Available bundles</div>

          {available.length === 0 ? <div class="ui-pill">All enabled</div> : (
            <div style={S.col}>
              {available.map((c) => (
                <div key={c.id} style={S.row}>
                  <span class="ui-pill" title={c.id}>{c.label}</span>
                  <button {...BTN.ghost} disabled={saving} onClick={() => add(c.id)}>Add</button>
                </div>
              ))}
            </div>
          )}

          <div style={S.selects}>
            <label class="ui-pill">
              Theme:&nbsp;
              <select value={theme} onChange={onSelect(setTheme)} disabled={saving}>
                {themes.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </label>

            <label class="ui-pill">
              Layout:&nbsp;
              <select value={layout} onChange={onSelect(setLayout)} disabled={saving}>
                {layouts.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
              </select>
            </label>
          </div>
        </div>
      </div>

      <div style={S.footer}>
        <button {...BTN.primary} disabled={saving} onClick={apply}>
          {saving ? "Applying…" : "Apply"}
        </button>
        {error && <span class="ui-pill" style={S.err}>{error}</span>}
      </div>
    </div>
  );
}
