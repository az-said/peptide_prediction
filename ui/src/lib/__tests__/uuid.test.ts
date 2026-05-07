import { describe, it, expect, vi, afterEach } from "vitest";
import { uuid } from "../uuid";

const V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("uuid", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns a v4-shaped UUID string", () => {
    const id = uuid();
    expect(id).toMatch(V4_PATTERN);
  });

  it("falls back when crypto.randomUUID is unavailable", () => {
    // Simulate non-secure context (HTTP / older Safari) where randomUUID is missing.
    // jsdom's `globalThis.crypto` is a getter, so we use vi.stubGlobal to override.
    vi.stubGlobal("crypto", {});
    const id = uuid();
    expect(id).toMatch(V4_PATTERN);
  });

  it("returns unique values across calls", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 50; i++) seen.add(uuid());
    expect(seen.size).toBe(50);
  });
});
