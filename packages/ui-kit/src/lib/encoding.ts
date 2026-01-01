const b64u = (s: string) => btoa(s).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");

const ub64 = (s: string) => {
  const base = s.replaceAll("-", "+").replaceAll("_", "/");
  const pad = (4 - (base.length % 4)) % 4;
  return base + "=".repeat(pad);
};

function bytesToBinaryString(bytes: Uint8Array): string {
  // Avoid O(n^2) concatenation for larger inputs.
  const parts: string[] = [];
  const CHUNK = 0x8000;

  for (let i = 0; i < bytes.length; i += CHUNK) {
    const sub = bytes.subarray(i, i + CHUNK);
    parts.push(String.fromCharCode(...sub));
  }
  return parts.join("");
}

export const base64UrlEncode = (bytes: Uint8Array): string => b64u(bytesToBinaryString(bytes));

export const base64UrlDecode = (s: string): Uint8Array | null => {
  try {
    const bin = atob(ub64(s));
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i) & 0xff;
    return out;
  } catch {
    return null;
  }
};
