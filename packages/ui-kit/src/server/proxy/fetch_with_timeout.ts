export async function fetchWithTimeout(
  url: string,
  timeoutMs: number,
  init: RequestInit = {},
): Promise<Response> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, redirect: init.redirect ?? "follow", signal: ac.signal });
  } finally {
    clearTimeout(t);
  }
}
