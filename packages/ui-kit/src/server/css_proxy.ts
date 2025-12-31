import { fromFileUrl } from "jsr:@std/path@1.1.4";
import { base64UrlEncode } from "../lib/encoding.ts";

export interface CssProxyOptions {
  basePath: string;
  allowFileUrls?: boolean;
  remoteCacheSeconds?: number;
}

type RemoteEntry = { exp: number; status: number; headers: [string, string][]; body: Uint8Array };

const te = new TextEncoder();
const bad = (msg: string, status: number) => new Response(msg, { status });

export class CssProxy {
  readonly basePath: string;
  readonly allowFileUrls: boolean;
  readonly remoteCacheSeconds: number;

  #idToUrl = new Map<string, string>();
  #remote = new Map<string, RemoteEntry>();

  constructor({ basePath, allowFileUrls = false, remoteCacheSeconds = 300 }: CssProxyOptions) {
    this.basePath = basePath.replace(/\/$/, "");
    this.allowFileUrls = allowFileUrls;
    this.remoteCacheSeconds = remoteCacheSeconds;
  }

  href(id: string): string {
    return `${this.basePath}/${id}.css`;
  }

  lookup(id: string): string | undefined {
    return this.#idToUrl.get(id);
  }

  async register(sourceUrl: string): Promise<{ id: string; href: string }> {
    const id = await hashId(sourceUrl);
    const prev = this.#idToUrl.get(id);
    if (prev && prev !== sourceUrl) throw new Error("CSS proxy id collision");
    this.#idToUrl.set(id, sourceUrl);
    return { id, href: this.href(id) };
  }

  handle(req: Request): Promise<Response> {
    const u = new URL(req.url);
    const id = u.pathname.slice(this.basePath.length + 1).replace(/\.css$/, "");
    const source = this.lookup(id);
    if (!source) return Promise.resolve(bad("Unknown stylesheet id", 404));

    let target: URL;
    try {
      target = new URL(source, u.origin);
    } catch {
      return Promise.resolve(bad("Invalid CSS URL", 400));
    }

    if (
      (target.protocol === "http:" || target.protocol === "https:") &&
      target.origin === u.origin &&
      target.pathname.startsWith(this.basePath)
    ) return Promise.resolve(bad("Refusing to proxy a proxied CSS URL", 400));

    if (target.protocol === "file:") {
      return this.allowFileUrls ? this.#serveFile(target) : Promise.resolve(bad("file: CSS not allowed", 403));
    }
    if (target.protocol === "http:" || target.protocol === "https:") {
      return this.#serveRemote(target.toString());
    }

    return Promise.resolve(bad("Unsupported CSS URL scheme", 400));
  }

  async #serveFile(fileUrl: URL): Promise<Response> {
    try {
      const file = await Deno.open(fromFileUrl(fileUrl), { read: true });
      return new Response(file.readable, {
        headers: { "content-type": "text/css; charset=utf-8", "cache-control": "no-cache" },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return bad(`Failed to read CSS file: ${msg}`, 404);
    }
  }

  async #serveRemote(sourceUrl: string): Promise<Response> {
    const now = Date.now();
    const cached = this.#remote.get(sourceUrl);
    if (cached && now < cached.exp) {
      return new Response(cached.body.slice(), { status: cached.status, headers: cached.headers });
    }

    const res = await fetch(sourceUrl, { redirect: "follow" });
    const body = new Uint8Array(await res.arrayBuffer());

    const headers = new Headers(res.headers);
    headers.set("content-type", "text/css; charset=utf-8");
    headers.set("cache-control", `public, max-age=${this.remoteCacheSeconds}`);

    const entry: RemoteEntry = {
      exp: now + this.remoteCacheSeconds * 1000,
      status: res.status,
      headers: Array.from(headers.entries()),
      body,
    };
    this.#remote.set(sourceUrl, entry);

    return new Response(body.slice(), { status: entry.status, headers });
  }
}

async function hashId(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", te.encode(input));
  return base64UrlEncode(new Uint8Array(digest).subarray(0, 12));
}
