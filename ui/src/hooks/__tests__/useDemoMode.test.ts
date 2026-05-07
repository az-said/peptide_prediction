import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useDemoMode, DEMO_DATASET_INFO } from "../useDemoMode";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockIngestBackendRows = vi.fn();
const mockResetData = vi.fn();
let mockPeptides: any[] = [];
let mockMeta: any = null;

vi.mock("@/stores/datasetStore", () => ({
  useDatasetStore: () => ({
    peptides: mockPeptides,
    meta: mockMeta,
    ingestBackendRows: mockIngestBackendRows,
    resetData: mockResetData,
  }),
}));

vi.mock("@/lib/api", () => ({
  uploadCSV: vi.fn().mockResolvedValue({
    rows: [{ id: "P1", sequence: "AKL", length: 3 }],
    meta: { runId: "demo-run" },
  }),
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
// fetch mock
// ---------------------------------------------------------------------------

let fetchResponses: Record<string, { ok: boolean; data?: any }> = {};

globalThis.fetch = vi.fn(async (url: string) => {
  const resp = fetchResponses[url];
  if (!resp || !resp.ok) {
    return { ok: false, status: 404 } as Response;
  }
  return {
    ok: true,
    status: 200,
    json: async () => resp.data,
    blob: async () => new Blob(["fake-xlsx"], { type: "application/octet-stream" }),
  } as unknown as Response;
});

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  localStorageMock.clear();
  mockPeptides = [];
  mockMeta = null;
  mockIngestBackendRows.mockClear();
  mockResetData.mockClear();
  fetchResponses = {};
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useDemoMode", () => {
  it("exports DEMO_DATASET_INFO constants", () => {
    expect(DEMO_DATASET_INFO.name).toBe("Staphylococcus 2023");
    expect(DEMO_DATASET_INFO.peptideCount).toBe(2916);
  });

  it("returns initial state correctly on fresh visit", () => {
    // Prevent auto-load from running fetch
    mockPeptides = [{ id: "existing" }];
    const { result } = renderHook(() => useDemoMode());
    expect(result.current.isDemo).toBe(false);
    expect(result.current.isDemoLoading).toBe(false);
    expect(result.current.demoError).toBeNull();
    expect(result.current.isChipDismissed).toBe(false);
  });

  it("skips loading when peptides already exist", () => {
    mockPeptides = [{ id: "P1" }];
    renderHook(() => useDemoMode());
    expect(mockIngestBackendRows).not.toHaveBeenCalled();
  });

  it("skips loading when acknowledged AND has data", () => {
    localStorageMock.setItem("pvl-demo-acknowledged", "true");
    mockPeptides = [{ id: "P1" }];
    renderHook(() => useDemoMode());
    expect(mockIngestBackendRows).not.toHaveBeenCalled();
  });

  it("loads demo from JSON when available", async () => {
    fetchResponses["/demo-dataset.json"] = {
      ok: true,
      data: {
        rows: [{ id: "D1", sequence: "AKL" }],
        meta: { runId: "demo-json" },
      },
    };

    renderHook(() => useDemoMode());

    await waitFor(() => {
      expect(mockIngestBackendRows).toHaveBeenCalledTimes(1);
    });

    const [rows, meta] = mockIngestBackendRows.mock.calls[0];
    expect(rows).toEqual([{ id: "D1", sequence: "AKL" }]);
    expect(meta.isDemo).toBe(true);
    expect(localStorageMock.getItem("pvl-demo-acknowledged")).toBe("true");
  });

  it("falls back to XLSX when JSON not found", async () => {
    fetchResponses["/demo-dataset.json"] = { ok: false };
    fetchResponses["/Final_Staphylococcus_2023_new.xlsx"] = { ok: true };

    renderHook(() => useDemoMode());

    await waitFor(() => {
      expect(mockIngestBackendRows).toHaveBeenCalledTimes(1);
    });

    const [, meta] = mockIngestBackendRows.mock.calls[0];
    expect(meta.isDemo).toBe(true);
  });

  it("sets demoError when both strategies fail", async () => {
    fetchResponses["/demo-dataset.json"] = { ok: false };
    fetchResponses["/Final_Staphylococcus_2023_new.xlsx"] = { ok: false };

    const { result } = renderHook(() => useDemoMode());

    await waitFor(() => {
      expect(result.current.isDemoLoading).toBe(false);
    });

    expect(result.current.demoError).toBeTruthy();
    expect(mockIngestBackendRows).not.toHaveBeenCalled();
  });

  it("shows first-visit modal on first ever visit", () => {
    mockPeptides = [{ id: "existing" }]; // prevent load
    const { result } = renderHook(() => useDemoMode());
    expect(result.current.showFirstVisit).toBe(true);
  });

  it("does NOT show first-visit modal on return visit", () => {
    localStorageMock.setItem("pvl-first-visit-dismissed", "true");
    mockPeptides = [{ id: "existing" }]; // prevent load
    const { result } = renderHook(() => useDemoMode());
    expect(result.current.showFirstVisit).toBe(false);
  });

  it("dismissFirstVisit hides modal and persists", () => {
    mockPeptides = [{ id: "existing" }];
    const { result } = renderHook(() => useDemoMode());
    expect(result.current.showFirstVisit).toBe(true);

    act(() => {
      result.current.dismissFirstVisit();
    });

    expect(result.current.showFirstVisit).toBe(false);
    expect(localStorageMock.getItem("pvl-first-visit-dismissed")).toBe("true");
  });

  it("dismissChip hides chip and persists", () => {
    mockPeptides = [{ id: "existing" }];
    const { result } = renderHook(() => useDemoMode());
    expect(result.current.isChipDismissed).toBe(false);

    act(() => {
      result.current.dismissChip();
    });

    expect(result.current.isChipDismissed).toBe(true);
    expect(localStorageMock.getItem("pvl-demo-chip-dismissed")).toBe("true");
  });

  it("clearDemo resets data and sets flags", () => {
    mockPeptides = [{ id: "existing" }];
    const { result } = renderHook(() => useDemoMode());

    act(() => {
      result.current.clearDemo();
    });

    expect(mockResetData).toHaveBeenCalledTimes(1);
    expect(result.current.isChipDismissed).toBe(true);
    expect(localStorageMock.getItem("pvl-demo-acknowledged")).toBe("true");
    expect(localStorageMock.getItem("pvl-demo-chip-dismissed")).toBe("true");
  });

  it("isDemo reflects store meta", () => {
    mockMeta = { isDemo: true };
    mockPeptides = [{ id: "P1" }];
    const { result } = renderHook(() => useDemoMode());
    expect(result.current.isDemo).toBe(true);
  });

  it("isDemo is false when meta has no flag", () => {
    mockMeta = { runId: "abc" };
    mockPeptides = [{ id: "P1" }];
    const { result } = renderHook(() => useDemoMode());
    expect(result.current.isDemo).toBe(false);
  });
});
