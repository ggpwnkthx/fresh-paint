export type ErrorCode =
  | "E_INVALID_INPUT"
  | "E_BUNDLE_INVALID"
  | "E_CATALOG_INVALID"
  | "E_COOKIE_INVALID"
  | "E_PROXY"
  | "E_HTTP";

export class UiKitError extends Error {
  readonly code: ErrorCode;

  constructor(code: ErrorCode, message: string, opts: ErrorOptions = {}) {
    super(message, opts);
    this.name = "UiKitError";
    this.code = code;
  }
}

export const isUiKitError = (e: unknown): e is UiKitError => e instanceof UiKitError;

export function uiKitError(code: ErrorCode, message: string, cause?: unknown): UiKitError {
  return new UiKitError(code, message, cause === undefined ? {} : { cause });
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export function toError(e: unknown): Error {
  return e instanceof Error ? e : new Error(String(e));
}
