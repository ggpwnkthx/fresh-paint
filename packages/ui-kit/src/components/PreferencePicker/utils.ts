import { useEffect, useRef } from "preact/hooks";
import type { JSX } from "preact";
import type { ChoiceItem } from "../../lib/primitives.ts";

export const onSelect =
  (set: (v: string) => void) => (e: JSX.TargetedEvent<HTMLSelectElement, Event>) =>
    set(e.currentTarget?.value ?? "");

export function arraysEqual(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

export const toPriority = (stack: readonly string[]): string[] => [...stack].reverse();
export const toStack = (priority: readonly string[]): string[] => [...priority].reverse();

export const firstAvailableId = (available: readonly ChoiceItem[]): string =>
  available[0]?.id ?? "";

export function useIsMountedRef(): { current: boolean } {
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => void (mounted.current = false);
  }, []);
  return mounted;
}

export function normalizeEndpoint(input: unknown, fallback: string): string {
  const raw = typeof input === "string" ? input.trim() : "";
  if (!raw) return fallback;
  if (raw.startsWith("/") || raw.startsWith("./") || raw.startsWith("../")) return raw;

  try {
    const u = new URL(raw);
    return (u.protocol === "http:" || u.protocol === "https:") ? u.toString() : fallback;
  } catch {
    return fallback;
  }
}

export function isAbortError(e: unknown): boolean {
  return e instanceof DOMException && e.name === "AbortError";
}

export function toErrorMessage(e: unknown): string {
  return e instanceof Error ? (e.message || "Unknown error") : String(e);
}
