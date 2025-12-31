import { useEffect, useMemo, useState } from "preact/hooks";
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

const BTN = {
  ghost: { type: "button" as const, class: "ui-btn", "data-variant": "ghost" as const },
  primary: { type: "button" as const, class: "ui-btn", "data-variant": "primary" as const },
} as const;

const onSelect =
  (set: (v: string) => void) => (e: Event) =>
    set((e.currentTarget as HTMLSelectElement | null)?.value ?? "");

function arraysEqual(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

/**
 * Server merge semantics: later overrides earlier.
 * UI shows "priority": first item is highest priority (wins).
 * Therefore payload stack is reverse(priority).
 */
function toPriority(stack: readonly string[]): string[] {
  return [...stack].reverse();
}
function toStack(priority: readonly string[]): string[] {
  return [...priority].reverse();
}

export function PreferencesPicker({
  catalog,
  current,
  themes,
  layouts,
  endpoint = "/api/ui-preferences",
  reloadOnApply = true,
}: PreferencesPickerProps) {
  const [priority, setPriority] = useState<string[]>(() => toPriority(current.stack));
  const [theme, setTheme] = useState(current.theme);
  const [layout, setLayout] = useState(current.layout);

  const [addId, setAddId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const labelById = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of catalog) m.set(c.id, c.label);
    return m;
  }, [catalog]);

  const enabled = useMemo(() => new Set(priority), [priority]);

  const available = useMemo(() => {
    const out: ChoiceItem[] = [];
    for (const c of catalog) if (!enabled.has(c.id)) out.push(c);
    return out;
  }, [catalog, enabled]);

  // Keep addId always pointing at an available option (or empty).
  useEffect(() => {
    if (available.length === 0) {
      if (addId !== "") setAddId("");
      return;
    }
    const ok = addId && available.some((c) => c.id === addId);
    if (!ok) setAddId(available[0]!.id);
  }, [available, addId]);

  const currentPriority = useMemo(() => toPriority(current.stack), [current.stack]);
  const dirty =
    !arraysEqual(priority, currentPriority) ||
    theme !== current.theme ||
    layout !== current.layout;

  const bundleLabel = (id: string) => labelById.get(id) ?? id;

  const move = (id: string, dir: -1 | 1) => {
    setPriority((p) => {
      const i = p.indexOf(id);
      if (i < 0) return p;

      const j = i + dir;
      if (j < 0 || j >= p.length) return p;

      const n = p.slice();
      [n[i], n[j]] = [n[j]!, n[i]!];
      return n;
    });
  };

  const disable = (id: string) => setPriority((p) => p.filter((x) => x !== id));

  const enable = (id: string) => {
    if (!id) return;
    setPriority((p) => (p.includes(id) ? p : [...p, id])); // new ones start at lowest priority
  };

  const reset = () => {
    setError(undefined);
    setPriority(toPriority(current.stack));
    setTheme(current.theme);
    setLayout(current.layout);
  };

  const apply = async () => {
    setSaving(true);
    setError(undefined);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ stack: toStack(priority), theme, layout }),
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
      <div style={S.header}>
        <h2 style="margin:0">Preferences</h2>
        <div style={S.help}>
          Pick a theme and layout. Bundles are optional (advanced).
        </div>
      </div>

      <div class="ui-pill" style="margin-bottom:10px">Appearance</div>

      <div style={S.row}>
        <label class="ui-pill" style={S.field}>
          <span>Theme</span>
          <select value={theme} onChange={onSelect(setTheme)} disabled={saving}>
            {themes.length === 0
              ? <option value={theme}>No themes</option>
              : themes.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </label>

        <label class="ui-pill" style={S.field}>
          <span>Layout</span>
          <select value={layout} onChange={onSelect(setLayout)} disabled={saving}>
            {layouts.length === 0
              ? <option value={layout}>No layouts</option>
              : layouts.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
        </label>
      </div>

      <details style={S.details}>
        <summary class="ui-pill" style="cursor:pointer">Bundles (advanced)</summary>

        <div style={S.help}>
          Higher priority is at the top (it overrides items below).
        </div>

        {priority.length === 0 ? (
          <div class="ui-pill" style="margin-top:10px">No bundles enabled</div>
        ) : (
          <div style={S.list}>
            {priority.map((id, idx) => (
              <div key={id} style={S.item}>
                <span class="ui-pill" title={id}>
                  {idx === 0 ? "Priority: " : ""}{bundleLabel(id)}
                </span>

                <span style={S.actions}>
                  <button
                    {...BTN.ghost}
                    disabled={saving || idx === 0}
                    onClick={() => move(id, -1)}
                    title="Move up"
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    {...BTN.ghost}
                    disabled={saving || idx === priority.length - 1}
                    onClick={() => move(id, 1)}
                    title="Move down"
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                  <button
                    {...BTN.ghost}
                    disabled={saving}
                    onClick={() => disable(id)}
                    title="Disable"
                  >
                    Disable
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}

        <div style={S.addRow}>
          <label class="ui-pill">
            Add bundle&nbsp;
            <select
              style={S.select}
              value={addId}
              onChange={onSelect(setAddId)}
              disabled={saving || available.length === 0}
            >
              {available.length === 0
                ? <option value="">No more bundles</option>
                : available.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </label>

          <button
            {...BTN.ghost}
            disabled={saving || !addId}
            onClick={() => enable(addId)}
          >
            Enable
          </button>
        </div>
      </details>

      <div style={S.footer}>
        <button {...BTN.primary} disabled={saving || !dirty} onClick={apply}>
          {saving ? "Applying…" : "Apply"}
        </button>

        <button {...BTN.ghost} disabled={saving || !dirty} onClick={reset}>
          Cancel
        </button>

        {error && <span class="ui-pill" style={S.err}>{error}</span>}
        {!error && !dirty && <span class="ui-pill">No changes</span>}
      </div>
    </div>
  );
}
