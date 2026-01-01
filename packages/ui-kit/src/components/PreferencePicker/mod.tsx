import type { ChoiceItem } from "../../lib/primitives.ts";
import type { UiPreferences } from "../../types.ts";
import { BundlePriorityList } from "./BundlePriorityList.tsx";
import { SelectField } from "./SelectField.tsx";
import { BTN, S } from "./constants.ts";
import { usePreferencesPicker } from "./usePreferencesPicker.ts";
import { onSelect } from "./utils.ts";

export type PreferencesPickerProps = {
  catalog: readonly ChoiceItem[];
  current: UiPreferences;
  themes: readonly ChoiceItem[];
  layouts: readonly ChoiceItem[];
  endpoint?: string;
  reloadOnApply?: boolean;
};

export function PreferencesPicker(props: PreferencesPickerProps) {
  const model = usePreferencesPicker({
    catalog: props.catalog,
    current: props.current,
    endpoint: props.endpoint,
    reloadOnApply: props.reloadOnApply,
  });

  const appearance = [
    {
      key: "Theme",
      label: "Theme",
      value: model.theme,
      items: props.themes,
      setValue: model.setTheme,
      emptyLabel: "No themes",
    },
    {
      key: "Layout",
      label: "Layout",
      value: model.layout,
      items: props.layouts,
      setValue: model.setLayout,
      emptyLabel: "No layouts",
    },
  ] as const;

  return (
    <div class="ui-card">
      <div style={S.header}>
        <h2 style="margin:0">Preferences</h2>
        <div style={S.help}>Pick a theme and layout. Bundles are optional (advanced).</div>
      </div>

      <div class="ui-pill" style="margin-bottom:10px">Appearance</div>

      <div style={S.row}>
        {appearance.map((f) => (
          <SelectField
            key={f.key}
            label={f.label}
            value={f.value}
            items={f.items}
            disabled={model.saving}
            setValue={f.setValue}
            emptyLabel={f.emptyLabel}
          />
        ))}
      </div>

      <details style={S.details}>
        <summary class="ui-pill" style="cursor:pointer">Bundles (advanced)</summary>

        <div style={S.help}>Higher priority is at the top (it overrides items below).</div>

        <BundlePriorityList
          priority={model.priority}
          saving={model.saving}
          bundleLabel={model.bundleLabel}
          move={model.move}
          disable={model.disable}
        />

        <div style={S.addRow}>
          <label class="ui-pill">
            Add bundle&nbsp;
            <select
              style={S.select}
              value={model.addId}
              onChange={onSelect(model.setAddId)}
              disabled={model.saving || model.available.length === 0}
            >
              {model.available.length === 0
                ? <option value="">No more bundles</option>
                : model.available.map((c, idx) => (
                  <option key={`${c.id}:${idx}`} value={c.id}>{c.label}</option>
                ))}
            </select>
          </label>

          <button
            {...BTN.ghost}
            disabled={model.saving || !model.addId}
            onClick={() => model.enable(model.addId)}
          >
            Enable
          </button>
        </div>
      </details>

      <div style={S.footer}>
        <button {...BTN.primary} disabled={model.saving || !model.dirty} onClick={model.apply}>
          {model.saving ? "Applying..." : "Apply"}
        </button>

        <button {...BTN.ghost} disabled={model.saving || !model.dirty} onClick={model.reset}>
          Cancel
        </button>

        {model.error && <span class="ui-pill" style={S.err}>{model.error}</span>}
        {!model.error && !model.dirty && <span class="ui-pill">No changes</span>}
      </div>
    </div>
  );
}
