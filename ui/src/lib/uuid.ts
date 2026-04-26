/**
 * RFC4122 v4 UUID with safe fallback for non-secure contexts.
 *
 * `crypto.randomUUID` is only available on secure origins (HTTPS / localhost).
 * The VPS serves over HTTP, so calling `crypto.randomUUID()` directly throws
 * on production. This wrapper falls back to a Math.random-based v4 generator,
 * which is fine for client-side cancel tokens and request IDs (not for
 * cryptographic use).
 */
export function uuid(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
