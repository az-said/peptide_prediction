import "@testing-library/jest-dom/vitest";

// Node 22+ ships a built-in `localStorage` global that requires the
// `--localstorage-file=<path>` flag to be functional. Under vitest+jsdom that
// global object shadows jsdom's real Storage shim, and its `setItem` resolves
// to `undefined` (see: `Warning: --localstorage-file was provided without a
// valid path`). zustand's persist middleware then throws
// `storage.setItem is not a function` on every write.
//
// Install a minimal in-memory Storage on both `window.localStorage` and
// `window.sessionStorage` so persist works in the test environment exactly
// the way it does in a real browser.
class InMemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

if (typeof window !== "undefined") {
  const needsLocalStorage =
    !window.localStorage || typeof window.localStorage.setItem !== "function";
  const needsSessionStorage =
    !window.sessionStorage || typeof window.sessionStorage.setItem !== "function";

  if (needsLocalStorage) {
    Object.defineProperty(window, "localStorage", {
      value: new InMemoryStorage(),
      configurable: true,
      writable: true,
    });
  }
  if (needsSessionStorage) {
    Object.defineProperty(window, "sessionStorage", {
      value: new InMemoryStorage(),
      configurable: true,
      writable: true,
    });
  }
}
