import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  setPVLSentryContext,
  clearPVLSentryContext,
  buildSentryRelease,
  getSessionId,
  initSentrySession,
} from "../sentryContext";

// ---------------------------------------------------------------------------
// Mock @sentry/react
// ---------------------------------------------------------------------------

const mockSetContext = vi.fn();
const mockSetTag = vi.fn();
const mockSetUser = vi.fn();

vi.mock("@sentry/react", () => ({
  setContext: (...args: any[]) => mockSetContext(...args),
  setTag: (...args: any[]) => mockSetTag(...args),
  setUser: (...args: any[]) => mockSetUser(...args),
}));

// ---------------------------------------------------------------------------
// localStorage mock
// ---------------------------------------------------------------------------

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("sentryContext", () => {
  describe("buildSentryRelease", () => {
    it("builds release with version only", () => {
      expect(buildSentryRelease("1.2.3")).toBe("pvl@1.2.3");
    });

    it("builds release with version and SHA", () => {
      expect(buildSentryRelease("1.2.3", "abc1234")).toBe(
        "pvl@1.2.3-abc1234",
      );
    });

    it("omits SHA when undefined", () => {
      expect(buildSentryRelease("0.1.0", undefined)).toBe("pvl@0.1.0");
    });
  });

  describe("getSessionId", () => {
    it("generates a new ID on first call", () => {
      const id = getSessionId();
      expect(id).toBeTruthy();
      expect(typeof id).toBe("string");
      expect(id.length).toBeGreaterThan(10);
    });

    it("returns the same ID on subsequent calls", () => {
      const id1 = getSessionId();
      const id2 = getSessionId();
      expect(id1).toBe(id2);
    });

    it("persists to localStorage", () => {
      const id = getSessionId();
      expect(localStorageMock.getItem("pvl-session-id")).toBe(id);
    });
  });

  describe("initSentrySession", () => {
    it("calls Sentry.setUser with session ID", () => {
      initSentrySession();
      expect(mockSetUser).toHaveBeenCalledTimes(1);
      const arg = mockSetUser.mock.calls[0][0];
      expect(arg.id).toBeTruthy();
      expect(typeof arg.id).toBe("string");
    });
  });

  describe("setPVLSentryContext", () => {
    it("sets Sentry context with all fields", () => {
      setPVLSentryContext({
        peptideCount: 500,
        predictors: ["tango", "s4pred"],
        dataSource: "csv",
        thresholdPreset: "strict",
        viewport: "desktop",
        theme: "dark",
      });

      expect(mockSetContext).toHaveBeenCalledWith("pvl", {
        peptide_count: 500,
        predictors: "tango, s4pred",
        data_source: "csv",
        threshold_preset: "strict",
        viewport: "desktop",
        theme: "dark",
      });
    });

    it("sets data_source tag", () => {
      setPVLSentryContext({ dataSource: "demo" });
      expect(mockSetTag).toHaveBeenCalledWith("data_source", "demo");
    });

    it("sets dataset_size tag based on peptide count", () => {
      setPVLSentryContext({ peptideCount: 50 });
      expect(mockSetTag).toHaveBeenCalledWith("dataset_size", "small");

      mockSetTag.mockClear();
      setPVLSentryContext({ peptideCount: 500 });
      expect(mockSetTag).toHaveBeenCalledWith("dataset_size", "medium");

      mockSetTag.mockClear();
      setPVLSentryContext({ peptideCount: 5000 });
      expect(mockSetTag).toHaveBeenCalledWith("dataset_size", "large");
    });

    it("sets threshold_preset tag", () => {
      setPVLSentryContext({ thresholdPreset: "exploratory" });
      expect(mockSetTag).toHaveBeenCalledWith(
        "threshold_preset",
        "exploratory",
      );
    });

    it("handles partial context (null defaults)", () => {
      setPVLSentryContext({});
      expect(mockSetContext).toHaveBeenCalledWith("pvl", {
        peptide_count: null,
        predictors: null,
        data_source: null,
        threshold_preset: null,
        viewport: expect.any(String),
        theme: expect.any(String),
      });
    });
  });

  describe("clearPVLSentryContext", () => {
    it("clears context and tags", () => {
      clearPVLSentryContext();
      expect(mockSetContext).toHaveBeenCalledWith("pvl", null);
      expect(mockSetTag).toHaveBeenCalledWith("data_source", "");
      expect(mockSetTag).toHaveBeenCalledWith("dataset_size", "");
      expect(mockSetTag).toHaveBeenCalledWith("threshold_preset", "");
    });
  });
});
