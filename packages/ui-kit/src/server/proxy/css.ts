import { fromFileUrl } from "@std/path";
import { errorMessage, UiKitError } from "../../lib/errors.ts";
import { RemoteCache, type RemoteEntry } from "./remote_cache.ts";
import { bad, hashId, normalizeBasePath, parseIdFromPath, readBodyUpTo } from "./utils.ts";
import { readableFromFile } from "./file_stream.ts";
import { fetchWithTimeout } from "./fetch_with_timeout.ts";

export interface CssProxyOptions {
  basePath: string;
  allowFileUrls?: boolean;
  remoteCacheSeconds?: number;
  remoteMaxEntries?: number;
  remoteMaxBytes?: number;
  remoteMaxResourceBytes?: number;
  remoteFetchTimeoutMs?: number;
}

export class CssProxy {
  readonly basePath: string;
  readonly allowFileUrls: boolean;
  readonly remoteCacheSeconds: number;
  readonly remoteMaxEntries: number;
  readonly remoteMaxBytes: number;
  readonly remoteMaxResourceBytes: number;
  readonly remoteFetchTimeoutMs: number;

  #idToUrl = new Map<string, string>();
  #urlToId = new Map<string, string>();
  #remote: RemoteCache;

  constructor(o: CssProxyOptions) {
    this.basePath = normalizeBasePath(o.basePath);
    this.allowFileUrls = o.allowFileUrls ?? false;
    this.remoteCacheSeconds = o.remoteCacheSeconds ?? 300;
    this.remoteMaxEntries = o.remoteMaxEntries ?? 128;
    this.remoteMaxBytes = o.remoteMaxBytes ?? 5_000_000;
    this.remoteMaxResourceBytes = o.remoteMaxResourceBytes ?? 1_000_000;
    this.remoteFetchTimeoutMs = o.remoteFetchTimeoutMs ?? 10_000;
    this.#remote = new RemoteCache(this.remoteMaxEntries, this.remoteMaxBytes);
  }

  href(id: string): string {
    return `${this.basePath}/${id}.css`;
  }

  lookup(id: string): string | undefined {
    return this.#idToUrl.get(id);
  }

  async register(sourceUrl: string): Promise<{ id: string; href: string }> {
    const prev = this.#urlToId.get(sourceUrl);
    if (prev) return { id: prev, href: this.href(prev) };

    const id = await hashId(sourceUrl);
    const cur = this.#idToUrl.get(id);
    if (cur && cur !== sourceUrl) {
      throw new UiKitError("E_PROXY", `CSS proxy id collision for "${id}"`, {
        cause: { id, sourceUrl, existing: cur },
      });
    }

    this.#idToUrl.set(id, sourceUrl);
    this.#urlToId.set(sourceUrl, id);
    return { id, href: this.href(id) };
  }

  async handle(req: Request): Promise<Response> {
    const u = new URL(req.url);
    const id = parseIdFromPath(u.pathname, this.basePath);
    const source = id ? this.lookup(id) : undefined;
    if (!source) return bad("Unknown stylesheet id", 404);

    let target: URL;
    try {
      target = new URL(source, u.origin);
    } catch {
      return bad("Invalid CSS URL", 400);
    }

    if (this.#isRecursive(target, u)) return bad("Refusing to proxy a proxied CSS URL", 400);

    if (target.protocol === "file:") {
      return this.allowFileUrls ? this.#serveFile(target) : bad("file: CSS not allowed", 403);
    }
    if (target.protocol === "https:" || target.protocol === "http:") {
      return await this.#serveRemote(target.toString());
    }

    return bad("Unsupported CSS URL scheme", 400);
  }

  #isRecursive(target: URL, requestUrl: URL): boolean {
    return (target.protocol === "http:" || target.protocol === "https:") &&
      target.origin === requestUrl.origin &&
      target.pathname.startsWith(this.basePath);
  }

  async #serveFile(fileUrl: URL): Promise<Response> {
    try {
      const file = await Deno.open(fromFileUrl(fileUrl), { read: true });
      return new Response(readableFromFile(file), {
        headers: { "content-type": "text/css; charset=utf-8", "cache-control": "no-cache" },
      });
    } catch (e) {
      return bad(`Failed to read CSS file: ${errorMessage(e)}`, 404);
    }
  }

  async #serveRemote(sourceUrl: string): Promise<Response> {
    const cached = this.#remote.get(sourceUrl);
    if (cached) {
      return new Response(cached.body.slice(), {
        status: cached.status,
        headers: new Headers(cached.headers),
      });
    }

    let res: Response;
    try {
      res = await fetchWithTimeout(sourceUrl, this.remoteFetchTimeoutMs, {});
    } catch (e) {
      return bad(`Failed to fetch CSS: ${errorMessage(e)}`, 502);
    }

    const body = await readBodyUpTo(res.body, this.remoteMaxResourceBytes);
    if (!body) return bad("CSS too large", 413);

    const headers = new Headers();
    for (const k of ["etag", "last-modified"] as const) {
      const v = res.headers.get(k);
      if (v) headers.set(k, v);
    }
    headers.set("content-type", "text/css; charset=utf-8");
    headers.set("cache-control", `public, max-age=${this.remoteCacheSeconds}`);

    const entry: RemoteEntry = {
      exp: Date.now() + this.remoteCacheSeconds * 1000,
      bytes: body.byteLength,
      status: res.status,
      headers: Array.from(headers.entries()),
      body,
    };

    this.#remote.set(sourceUrl, entry);
    return new Response(body.slice(), { status: entry.status, headers });
  }
}
