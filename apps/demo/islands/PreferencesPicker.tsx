import { useMemo, useState } from "preact/hooks";

type CatalogItem = { id: string; label: string };
type Choice = { id: string; label: string };

type Prefs = {
  stack: string[];
  theme: string;
  layout: string;
};

export default function PreferencesPicker(props: {
  catalog: CatalogItem[];
  current: Prefs;
  themes: Choice[];
  layouts: Choice[];
}) {
  const [stack, setStack] = useState<string[]>(() => props.current.stack.slice());
  const [theme, setTheme] = useState<string>(() => props.current.theme);
  const [layout, setLayout] = useState<string>(() => props.current.layout);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enabled = useMemo(() => new Set(stack), [stack]);
  const available = useMemo(
    () => props.catalog.filter((c) => !enabled.has(c.id)),
    [props.catalog, enabled],
  );

  function move(id: string, dir: -1 | 1) {
    setStack((cur) => {
      const idx = cur.indexOf(id);
      if (idx === -1) return cur;
      const next = idx + dir;
      if (next < 0 || next >= cur.length) return cur;
      const copy = cur.slice();
      const tmp = copy[idx]!;
      copy[idx] = copy[next]!;
      copy[next] = tmp;
      return copy;
    });
  }

  function remove(id: string) {
    setStack((cur) => cur.filter((x) => x !== id));
  }

  function add(id: string) {
    setStack((cur) => cur.includes(id) ? cur : [...cur, id]);
  }

  async function apply() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/ui-preferences", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ stack, theme, layout }),
      });
      const json: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = (json && typeof json === "object" && json !== null && "error" in json)
          ? String((json as Record<string, unknown>).error)
          : `HTTP ${res.status}`;
        throw new Error(msg);
      }
      globalThis.location.reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div class="ui-card">
      <h2>Preferences</h2>
      <p style="margin-bottom: 12px;">
        Reorder the stack, then choose a theme and layout. Click <b>Apply</b>{" "}
        to set a cookie and reload.
      </p>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 14px;">
        <div>
          <div class="ui-pill" style="margin-bottom:10px;">
            Enabled stack (top overrides bottom)
          </div>
          {stack.length === 0
            ? <div class="ui-pill">No bundles enabled</div>
            : (
              <div style="display:flex; flex-direction:column; gap:8px;">
                {stack.map((id) => {
                  const label = props.catalog.find((c) => c.id === id)?.label ?? id;
                  return (
                    <div
                      key={id}
                      style="display:flex; gap:8px; align-items:center; justify-content:space-between;"
                    >
                      <span class="ui-pill" title={id}>{label}</span>
                      <span style="display:flex; gap:8px;">
                        <button
                          type="button"
                          class="ui-btn"
                          data-variant="ghost"
                          disabled={saving}
                          onClick={() => move(id, -1)}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          class="ui-btn"
                          data-variant="ghost"
                          disabled={saving}
                          onClick={() => move(id, 1)}
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          class="ui-btn"
                          data-variant="ghost"
                          disabled={saving}
                          onClick={() => remove(id)}
                        >
                          Remove
                        </button>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
        </div>

        <div>
          <div class="ui-pill" style="margin-bottom:10px;">Available bundles</div>
          {available.length === 0
            ? <div class="ui-pill">All enabled</div>
            : (
              <div style="display:flex; flex-direction:column; gap:8px;">
                {available.map((c) => (
                  <div
                    key={c.id}
                    style="display:flex; gap:8px; align-items:center; justify-content:space-between;"
                  >
                    <span class="ui-pill" title={c.id}>{c.label}</span>
                    <button
                      type="button"
                      class="ui-btn"
                      data-variant="ghost"
                      disabled={saving}
                      onClick={() => add(c.id)}
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}

          <div style="margin-top:14px; display:flex; gap:10px; align-items:center; flex-wrap: wrap;">
            <label class="ui-pill">
              Theme:&nbsp;
              <select
                value={theme}
                onChange={(e) => setTheme((e.currentTarget as HTMLSelectElement).value)}
              >
                {props.themes.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </label>

            <label class="ui-pill">
              Layout:&nbsp;
              <select
                value={layout}
                onChange={(e) => setLayout((e.currentTarget as HTMLSelectElement).value)}
              >
                {props.layouts.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
              </select>
            </label>
          </div>
        </div>
      </div>

      <div style="margin-top:14px; display:flex; gap:10px; align-items:center;">
        <button
          type="button"
          class="ui-btn"
          data-variant="primary"
          disabled={saving}
          onClick={apply}
        >
          {saving ? "Applying…" : "Apply"}
        </button>
        {error
          ? (
            <span
              class="ui-pill"
              style="border-color: color-mix(in oklab, red, var(--ui-border) 70%);"
            >
              {error}
            </span>
          )
          : null}
      </div>
    </div>
  );
}
