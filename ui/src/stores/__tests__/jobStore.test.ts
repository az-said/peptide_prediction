/// <reference types="vitest/globals" />
/**
 * jobStore tests — V10-3 sync job lifecycle.
 *
 * Strategy: we test the store directly. To avoid the heavy datasetStore
 * dependency chain hanging vitest, we mock all transitive deps.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock ALL transitive deps BEFORE the store is imported.
// vi.mock calls are hoisted, so placement doesn't matter but readability does.
// ---------------------------------------------------------------------------

// jobApi — called by cancelJob and polling
vi.mock("@/lib/jobApi", () => ({
  pollJobStatus: vi.fn().mockResolvedValue({
    status: "PROGRESS",
    progress: { stage: "tango", percent: 50 },
    result: null,
    error: null,
  }),
  cancelJob: vi.fn().mockResolvedValue(undefined),
  cancelSyncJob: vi.fn().mockResolvedValue(undefined),
  STAGE_LABELS: { parsing: "Parsing...", tango: "TANGO..." },
}));

// metaAdapter — used in async polling success path
vi.mock("@/lib/metaAdapter", () => ({
  toDatasetMetadata: vi.fn((m: any) => m),
}));

// datasetStore — used in async polling success path
vi.mock("@/stores/datasetStore", () => ({
  useDatasetStore: { getState: () => ({ ingestBackendRows: vi.fn() }) },
}));

// sonner — toast notifications
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Import the store AFTER all mocks are registered
// ---------------------------------------------------------------------------

import { useJobStore, estimateSyncTotal } from "../jobStore";
import type { TrackedJob } from "../jobStore";

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: false });
  // Reset store
  useJobStore.setState({ jobs: {} });
});

afterEach(() => {
  useJobStore.getState().clearAll();
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// Pure function tests (no store involved)
// ---------------------------------------------------------------------------

describe("estimateSyncTotal", () => {
  it("returns at least 5 seconds", () => {
    expect(estimateSyncTotal(0, false, false)).toBeGreaterThanOrEqual(5);
  });

  it("increases with TANGO", () => {
    expect(estimateSyncTotal(100, true, false)).toBeGreaterThan(
      estimateSyncTotal(100, false, false),
    );
  });

  it("increases with S4PRED", () => {
    expect(estimateSyncTotal(100, false, true)).toBeGreaterThan(
      estimateSyncTotal(100, false, false),
    );
  });

  it("scales with peptide count", () => {
    expect(estimateSyncTotal(1000, true, true)).toBeGreaterThan(
      estimateSyncTotal(10, true, true),
    );
  });
});

// ---------------------------------------------------------------------------
// Sync job lifecycle
// ---------------------------------------------------------------------------

describe("sync job lifecycle", () => {
  it("startSyncJob creates a job with kind=sync", () => {
    const id = useJobStore.getState().startSyncJob({
      peptideCount: 100,
      fileName: "test.csv",
    });
    const job = useJobStore.getState().jobs[id];
    expect(job).toBeDefined();
    expect(job.kind).toBe("sync");
    expect(job.status).toBe("STARTED");
    expect(job.peptideCount).toBe(100);
    expect(job.progress?.percent).toBe(0);
  });

  it("tickSyncProgress updates percent > 0", () => {
    const id = useJobStore.getState().startSyncJob({
      peptideCount: 10,
      fileName: "t.csv",
      hasTango: true,
      hasS4pred: true,
    });
    // Fake 10s elapsed
    useJobStore.setState((s) => ({
      jobs: {
        ...s.jobs,
        [id]: { ...s.jobs[id], createdAt: Date.now() - 10_000 },
      },
    }));
    useJobStore.getState().tickSyncProgress(id);
    const job = useJobStore.getState().jobs[id];
    expect(job.status).toBe("PROGRESS");
    expect(job.progress!.percent).toBeGreaterThan(0);
  });

  it("completeSyncJob removes the job", () => {
    const id = useJobStore.getState().startSyncJob({
      peptideCount: 50,
      fileName: "t.csv",
    });
    useJobStore.getState().completeSyncJob(id);
    expect(useJobStore.getState().jobs[id]).toBeUndefined();
  });

  it("failSyncJob sets FAILURE + error", () => {
    const id = useJobStore.getState().startSyncJob({
      peptideCount: 50,
      fileName: "t.csv",
    });
    useJobStore.getState().failSyncJob(id, "timeout");
    expect(useJobStore.getState().jobs[id].status).toBe("FAILURE");
    expect(useJobStore.getState().jobs[id].error).toBe("timeout");
  });

  it("tickSyncProgress is a no-op for terminal jobs", () => {
    const id = useJobStore.getState().startSyncJob({
      peptideCount: 50,
      fileName: "t.csv",
    });
    useJobStore.getState().failSyncJob(id, "x");
    const snap = { ...useJobStore.getState().jobs[id] };
    useJobStore.getState().tickSyncProgress(id);
    expect(useJobStore.getState().jobs[id]).toEqual(snap);
  });
});

// ---------------------------------------------------------------------------
// cancelJob
// ---------------------------------------------------------------------------

describe("cancelJob", () => {
  it("cancels a sync job", async () => {
    const { cancelSyncJob } = await import("@/lib/jobApi");
    const abort = new AbortController();
    const spy = vi.spyOn(abort, "abort");

    const id = useJobStore.getState().startSyncJob({
      peptideCount: 50,
      fileName: "t.csv",
      cancelToken: "tok",
      abortController: abort,
    });
    await useJobStore.getState().cancelJob(id);

    expect(cancelSyncJob).toHaveBeenCalledWith("tok");
    expect(spy).toHaveBeenCalled();
    expect(useJobStore.getState().jobs[id].status).toBe("REVOKED");
  });

  it("cancels an async job via API", async () => {
    const { cancelJob: apiCancel } = await import("@/lib/jobApi");
    useJobStore.setState((s) => ({
      jobs: {
        ...s.jobs,
        "a1": {
          jobId: "a1",
          kind: "async",
          fileName: "b.csv",
          peptideCount: 100,
          status: "PROGRESS",
          progress: null,
          createdAt: Date.now(),
          error: null,
        } as TrackedJob,
      },
    }));
    await useJobStore.getState().cancelJob("a1");
    expect(apiCancel).toHaveBeenCalledWith("a1");
    expect(useJobStore.getState().jobs["a1"].status).toBe("REVOKED");
  });
});

// ---------------------------------------------------------------------------
// getActiveJob / activeCount
// ---------------------------------------------------------------------------

describe("getActiveJob & activeCount", () => {
  it("getActiveJob returns null when empty", () => {
    expect(useJobStore.getState().getActiveJob()).toBeNull();
  });

  it("getActiveJob returns active job", () => {
    const id = useJobStore.getState().startSyncJob({ peptideCount: 10, fileName: "t.csv" });
    expect(useJobStore.getState().getActiveJob()!.jobId).toBe(id);
  });

  it("getActiveJob skips terminal", () => {
    const id = useJobStore.getState().startSyncJob({ peptideCount: 10, fileName: "t.csv" });
    useJobStore.getState().failSyncJob(id, "x");
    expect(useJobStore.getState().getActiveJob()).toBeNull();
  });

  it("activeCount counts non-terminal", () => {
    const id1 = useJobStore.getState().startSyncJob({ peptideCount: 10, fileName: "a.csv" });
    useJobStore.getState().startSyncJob({ peptideCount: 20, fileName: "b.csv" });
    expect(useJobStore.getState().activeCount()).toBe(2);
    useJobStore.getState().failSyncJob(id1, "x");
    expect(useJobStore.getState().activeCount()).toBe(1);
  });
});
