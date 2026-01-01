import { isNonEmptyString } from "../../lib/primitives.ts";
import { BTN, S } from "./constants.ts";

type Props = Readonly<{
  priority: readonly string[];
  saving: boolean;
  bundleLabel: (id: string) => string;
  move: (id: string, dir: -1 | 1) => void;
  disable: (id: string) => void;
}>;

const EMPTY_STYLE = { marginTop: "10px" } as const;

const toIds = (v: unknown): readonly string[] => Array.isArray(v) ? v.filter(isNonEmptyString) : [];

const tryVoid = (label: string, fn: () => void): void => {
  try {
    fn();
  } catch (err) {
    console.error(`[BundlePriorityList] ${label} failed`, err);
  }
};

const tryLabel = (id: string, get: (id: string) => string): string => {
  try {
    const label = get(id);
    return isNonEmptyString(label) ? label : id;
  } catch (err) {
    console.error("[BundlePriorityList] bundleLabel failed", { id, err });
    return id;
  }
};

type Action =
  | {
    key: "up" | "down";
    title: string;
    aria: string;
    text: "↑" | "↓";
    dir: -1 | 1;
    disabled: (idx: number, len: number, saving: boolean) => boolean;
  }
  | {
    key: "disable";
    title: string;
    aria: string;
    text: "Disable";
    disabled: (_idx: number, _len: number, saving: boolean) => boolean;
  };

const ACTIONS: readonly Action[] = [
  {
    key: "up",
    title: "Move up",
    aria: "Move up",
    text: "↑",
    dir: -1,
    disabled: (i, _l, s) => s || i === 0,
  },
  {
    key: "down",
    title: "Move down",
    aria: "Move down",
    text: "↓",
    dir: 1,
    disabled: (i, l, s) => s || i === l - 1,
  },
  {
    key: "disable",
    title: "Disable",
    aria: "Disable",
    text: "Disable",
    disabled: (_i, _l, s) => s,
  },
] as const;

export function BundlePriorityList({ priority, saving, bundleLabel, move, disable }: Props) {
  const ids = toIds(priority);

  if (ids.length === 0) {
    return (
      <div class="ui-pill" style={EMPTY_STYLE}>
        No bundles enabled
      </div>
    );
  }

  return (
    <div style={S.list}>
      {ids.map((id, idx) => (
        // key includes idx to avoid collisions when ids are duplicated
        <div key={`${id}:${idx}`} style={S.item}>
          <span class="ui-pill" title={id}>
            {idx === 0 ? "Priority: " : ""}
            {tryLabel(id, bundleLabel)}
          </span>

          <span style={S.actions}>
            {ACTIONS.map((a) => (
              <button
                key={a.key}
                {...BTN.ghost}
                disabled={a.disabled(idx, ids.length, saving)}
                onClick={() =>
                  tryVoid(a.key, () => {
                    if (a.key === "disable") disable(id);
                    else move(id, a.dir);
                  })}
                title={a.title}
                aria-label={a.aria}
              >
                {a.text}
              </button>
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}
