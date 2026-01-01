import type { ChoiceItem } from "../../lib/primitives.ts";
import { isChoiceItem } from "../../lib/primitives.ts";
import { S } from "./constants.ts";
import { onSelect } from "./utils.ts";

export type SelectFieldProps = Readonly<{
  label: string;
  value: string;
  items: readonly ChoiceItem[];
  disabled: boolean;
  setValue: (v: string) => void;
  emptyLabel: string;
}>;

const warned = new Set<string>();
const warnOnce = (key: string, ...args: unknown[]) => {
  if (warned.has(key)) return;
  warned.add(key);
  console.error(...args);
};

const noop = () => {};

export function SelectField(props: SelectFieldProps) {
  const p = props as unknown as Partial<SelectFieldProps> & { items?: unknown };
  const label = typeof p.label === "string" ? p.label : "";
  const value = typeof p.value === "string" ? p.value : "";
  const emptyLabel = typeof p.emptyLabel === "string" ? p.emptyLabel : "";
  const disabled = p.disabled === true;

  const setValue = typeof p.setValue === "function"
    ? p.setValue
    : (warnOnce("SelectField.setValue", "[SelectField] setValue must be a function", p.setValue),
      noop);

  const items = Array.isArray(p.items) ? p.items.filter(isChoiceItem) : [];

  return (
    <label class="ui-pill" style={S.field}>
      <span>{label}</span>
      <select value={value} onChange={onSelect(setValue)} disabled={disabled}>
        {items.length === 0
          ? <option value={value}>{emptyLabel}</option>
          : items.map((it, idx) => (
            <option key={`${it.id}:${idx}`} value={it.id}>
              {it.label}
            </option>
          ))}
      </select>
    </label>
  );
}
