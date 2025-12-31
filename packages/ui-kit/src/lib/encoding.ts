const b64u = (s: string) =>
  btoa(s).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");

const ub64 = (s: string) =>
  s.replaceAll("-", "+").replaceAll("_", "/") + "===".slice((s.length + 3) % 4);

export const base64UrlEncode = (bytes: Uint8Array): string => {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return b64u(bin);
};

export const base64UrlDecode = (s: string): Uint8Array | null => {
  try {
    return Uint8Array.from(atob(ub64(s)), (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
};
