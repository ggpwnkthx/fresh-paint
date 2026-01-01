export type RemoteEntry = {
  exp: number;
  bytes: number;
  status: number;
  headers: [string, string][];
  body: Uint8Array;
};

export class RemoteCache {
  #map = new Map<string, RemoteEntry>(); // LRU: insertion order
  #bytes = 0;

  constructor(private readonly maxEntries: number, private readonly maxBytes: number) {}

  get(url: string): RemoteEntry | undefined {
    const e = this.#map.get(url);
    if (!e) return;

    if (Date.now() >= e.exp) {
      this.#drop(url, e);
      return;
    }

    // Refresh LRU.
    this.#map.delete(url);
    this.#map.set(url, e);
    return e;
  }

  set(url: string, entry: RemoteEntry): void {
    const prev = this.#map.get(url);
    if (prev) this.#drop(url, prev);

    this.#map.set(url, entry);
    this.#bytes += entry.bytes;
    this.#evict();
  }

  #drop(url: string, e: RemoteEntry): void {
    this.#map.delete(url);
    this.#bytes -= e.bytes;
  }

  #evict(): void {
    while (this.#map.size > this.maxEntries || this.#bytes > this.maxBytes) {
      const oldest = this.#map.keys().next().value as string | undefined;
      if (!oldest) break;
      const e = this.#map.get(oldest);
      if (e) this.#drop(oldest, e);
      else this.#map.delete(oldest);
    }
  }
}
