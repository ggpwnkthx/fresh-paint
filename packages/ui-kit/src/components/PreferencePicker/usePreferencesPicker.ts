import { useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks";
import type { ChoiceItem } from "../../lib/primitives.ts";
import { cleanString, isChoiceItem, isNonEmptyString } from "../../lib/primitives.ts";
import { readResponseError } from "../../lib/http.ts";
import type { UiPreferences } from "../../types.ts";
import {
  arraysEqual,
  firstAvailableId,
  isAbortError,
  normalizeEndpoint,
  toErrorMessage,
  toPriority,
  toStack,
  useIsMountedRef,
} from "./utils.ts";

const DEFAULT_ENDPOINT = "/api/ui-preferences";

export type PreferencesPickerModel = {
  safeEndpoint: string;

  priority: string[];
  theme: string;
  layout: string;

  addId: string;
  available: readonly ChoiceItem[];

  saving: boolean;
  error?: string;
  dirty: boolean;

  bundleLabel(id: string): string;

  setTheme(v: string): void;
  setLayout(v: string): void;
  setAddId(v: string): void;

  move(id: string, dir: -1 | 1): void;
  disable(id: string): void;
  enable(id: string): void;

  reset(): void;
  apply(): Promise<void>;
};

type Args = {
  catalog: readonly ChoiceItem[];
  current: UiPreferences;
  endpoint?: string;
  reloadOnApply?: boolean;
};

const normalizePriority = (stack: readonly string[]): string[] =>
  toPriority(stack).filter(isNonEmptyString);

export function usePreferencesPicker({
  catalog,
  current,
  endpoint,
  reloadOnApply = true,
}: Args): PreferencesPickerModel {
  const safeEndpoint = normalizeEndpoint(endpoint, DEFAULT_ENDPOINT);

  const safeCatalog = useMemo(() => (Array.isArray(catalog) ? catalog.filter(isChoiceItem) : []), [
    catalog,
  ]);
  const labelById = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of safeCatalog) m.set(c.id, c.label);
    return m;
  }, [safeCatalog]);

  const [priority, setPriority] = useState<string[]>(() => normalizePriority(current.stack));
  const [theme, setTheme] = useState(current.theme);
  const [layout, setLayout] = useState(current.layout);
  const [addId, setAddId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const mounted = useIsMountedRef();
  const reqRef = useRef<{ saving: boolean; abort: AbortController | null }>({
    saving: false,
    abort: null,
  });

  useEffect(() => () => reqRef.current.abort?.abort(), []);

  const enabled = useMemo(() => new Set(priority), [priority]);

  const available = useMemo(() => {
    const out: ChoiceItem[] = [];
    for (const c of safeCatalog) if (!enabled.has(c.id)) out.push(c);
    return out;
  }, [enabled, safeCatalog]);

  useEffect(() => {
    const next = available.some((c) => c.id === addId) ? addId : firstAvailableId(available);
    if (next !== addId) setAddId(next);
  }, [available, addId]);

  const currentPriority = useMemo(() => normalizePriority(current.stack), [current.stack]);
  const dirty = !arraysEqual(priority, currentPriority) || theme !== current.theme ||
    layout !== current.layout;

  const bundleLabel = useCallback((id: string) => labelById.get(id) ?? id, [labelById]);

  const move = useCallback((id: string, dir: -1 | 1) => {
    setPriority((p) => {
      const i = p.indexOf(id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= p.length) return p;
      const n = p.slice();
      const tmp = n[i];
      n[i] = n[j]!;
      n[j] = tmp!;
      return n;
    });
  }, []);

  const disable = useCallback((id: string) => setPriority((p) => p.filter((x) => x !== id)), []);

  const enable = useCallback((id: string) => {
    const safeId = cleanString(id);
    if (!safeId || !labelById.has(safeId)) return; // ignore tampered/untrusted ids
    setPriority((p) => (p.includes(safeId) ? p : [...p, safeId]));
  }, [labelById]);

  const reset = useCallback(() => {
    setError(undefined);
    setPriority(normalizePriority(current.stack));
    setTheme(current.theme);
    setLayout(current.layout);
  }, [current.layout, current.stack, current.theme]);

  const apply = useCallback(async () => {
    const req = reqRef.current;
    if (req.saving) return;
    req.saving = true;

    req.abort?.abort();
    const controller = new AbortController();
    req.abort = controller;

    setSaving(true);
    setError(undefined);

    try {
      const res = await fetch(safeEndpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        signal: controller.signal,
        body: JSON.stringify({ stack: toStack(priority), theme, layout }),
      });

      if (!res.ok) throw new Error(await readResponseError(res));
      if (reloadOnApply && typeof location !== "undefined") location.reload();
    } catch (e) {
      if (isAbortError(e)) return; // ignore canceled in-flight requests
      if (mounted.current) setError(toErrorMessage(e));
    } finally {
      if (mounted.current) setSaving(false);
      req.saving = false;
    }
  }, [layout, mounted, priority, reloadOnApply, safeEndpoint, theme]);

  return {
    safeEndpoint,
    priority,
    theme,
    layout,
    addId,
    available,
    saving,
    error,
    dirty,
    bundleLabel,
    setTheme,
    setLayout,
    setAddId,
    move,
    disable,
    enable,
    reset,
    apply,
  };
}
