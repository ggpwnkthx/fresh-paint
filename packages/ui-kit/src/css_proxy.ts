import { fromFileUrl } from "@std/path";
import { base64UrlEncode } from "./cookies.ts";

export interface CssProxyOptions {
  /** Route prefix. Example: `/ui/css` */
  basePath: string;
  /** Allow proxying file: URLs. Useful in local dev / monorepos. */
  allowFileUrls?: boolean;
  /** Cache remote CSS responses for N seconds (in-memory). */
  remoteCacheSeconds?: number;
}

type RemoteCacheEntry = {
  expiresAt: number;
  status: number;
  headers: Headers;
  body: Uint8Array;
};

export class CssProxy {
  readonly basePath: string;
  readonly allowFileUrls: boolean;
  readonly remoteCacheSeconds: number;

  #idToUrl = new Map<string, string>();
  #urlToId = new Map<string, string>();
  #remoteCache = new Map<string, RemoteCacheEntry>();

  constructor(opts: CssProxyOptions) {
    this.basePath = opts.basePath.replace(/\/$/, "");
    this.allowFileUrls = opts.allowFileUrls ?? false;
    this.remoteCacheSeconds = opts.remoteCacheSeconds ?? 300;
  }

  /** Returns the stable proxy href (`/ui/css/<id>.css`) for a given CSS source URL. */
  async register(sourceUrl: string): Promise<{ id: string; href: string }> {
    const existing = this.#urlToId.get(sourceUrl);
    if (existing) return { id: existing, href: this.href(existing) };

    const id = await hashId(sourceUrl);
    this.#idToUrl.set(id, sourceUrl);
    this.#urlToId.set(sourceUrl, id);
    return { id, href: this.href(id) };
  }

  href(id: string): string {
    return `${this.basePath}/${id}.css`;
  }

  lookup(id: string): string | undefined {
    return this.#idToUrl.get(id);
  }

  /**
   * A handler you can call from a Fresh route.
   *
   * It expects `req.url` to match `${basePath}/<id>.css`.
   */
  async handle(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const idWithExt = url.pathname.slice(this.basePath.length + 1);
    const id = idWithExt.endsWith(".css") ? idWithExt.slice(0, -4) : idWithExt;

    const sourceUrl = this.lookup(id);
    if (!sourceUrl) return new Response("Unknown stylesheet id", { status: 404 });

    const parsed = new URL(sourceUrl);

    if (parsed.protocol === "file:") {
      if (!this.allowFileUrls) return new Response("file: CSS not allowed", { status: 403 });
      return await this.#serveFile(parsed);
    }

    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return await this.#serveRemote(parsed.toString());
    }

    return new Response("Unsupported CSS URL scheme", { status: 400 });
  }

  async #serveFile(fileUrl: URL): Promise<Response> {
    const path = fromFileUrl(fileUrl);

    let file: Deno.FsFile;
    try {
      file = await Deno.open(path, { read: true });
    } catch (err) {
      return new Response(`Failed to read CSS file: ${(err as Error).message}`, { status: 404 });
    }

    const headers = new Headers({
      "content-type": "text/css; charset=utf-8",
      "cache-control": "no-cache",
    });

    return new Response(file.readable, { status: 200, headers });
  }

  async #serveRemote(sourceUrl: string): Promise<Response> {
    const cached = this.#remoteCache.get(sourceUrl);
    if (cached && Date.now() < cached.expiresAt) {
      return new Response(cached.body.slice(), { status: cached.status, headers: cached.headers });
    }

    const res = await fetch(sourceUrl, { redirect: "follow" });
    const body = new Uint8Array(await res.arrayBuffer());

    const headers = new Headers(res.headers);
    headers.set("content-type", "text/css; charset=utf-8");
    headers.set("cache-control", `public, max-age=${this.remoteCacheSeconds}`);

    this.#remoteCache.set(sourceUrl, {
      expiresAt: Date.now() + this.remoteCacheSeconds * 1000,
      status: res.status,
      headers,
      body,
    });

    return new Response(body.slice(), { status: res.status, headers });
  }
}

async function hashId(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  // 12 bytes (~16 base64url chars) is plenty for demo; increase if you want lower collision risk.
  const short = new Uint8Array(digest).slice(0, 12);
  return base64UrlEncode(short);
}
