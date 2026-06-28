/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AnalysisProgress } from "../AnalysisProgress";
import { useJobStore } from "@/stores/jobStore";
import type { TrackedJob } from "@/stores/jobStore";

// ---------------------------------------------------------------------------
// Mock jobApi (transitive dep via jobStore)
// ---------------------------------------------------------------------------

vi.mock("@/lib/jobApi", () => ({
  pollJobStatus: vi.fn(),
  cancelJob: vi.fn().mockResolvedValue(undefined),
  cancelSyncJob: vi.fn().mockResolvedValue(undefined),
  STAGE_LABELS: {
    parsing: "Parsing file...",
    tango: "Running TANGO...",
    s4pred: "Running S4PRED...",
  },
}));

vi.mock("@/lib/metaAdapter", () => ({
  toDatasetMetadata: vi.fn((m: any) => m),
}));

vi.mock("@/stores/datasetStore", () => ({
  useDatasetStore: {
    getState: vi.fn(() => ({
      ingestBackendRows: vi.fn(),
    })),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ACTIVE_JOB: TrackedJob = {
  jobId: "sync-1-123",
  kind: "sync",
  fileName: "test.csv",
  peptideCount: 250,
  status: "PROGRESS",
  progress: { stage: "tango", percent: 45 },
  createdAt: Date.now() - 10_000,
  error: null,
};

beforeEach(() => {
  useJobStore.setState({ jobs: {} });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AnalysisProgress", () => {
  it("renders nothing when no active job", () => {
    const { container } = render(<AnalysisProgress />);
    expect(container.innerHTML).toBe("");
  });

  it("renders when the store has an active job", () => {
    useJobStore.setState({ jobs: { [ACTIVE_JOB.jobId]: ACTIVE_JOB } });
    render(<AnalysisProgress />);

    const progress = screen.getByTestId("analysis-progress");
    expect(progress).toBeInTheDocument();
    // B8 (2026-06-18) replaced "Analyzing N peptides" with the
    // "Analyzing <processed> / <total> peptides" progress counter for batches
    // > 1. The label spans 3 elements (text + tabular-nums span + text), so
    // assert against the full container text instead of a single text node.
    expect(progress.textContent).toMatch(/Analyzing/);
    expect(progress.textContent).toMatch(/\/ 250/);
    expect(progress.textContent).toMatch(/peptides/);
  });

  it("shows the stage label from STAGE_LABELS", () => {
    useJobStore.setState({ jobs: { [ACTIVE_JOB.jobId]: ACTIVE_JOB } });
    render(<AnalysisProgress />);

    // "Running TANGO..." from our mock STAGE_LABELS
    expect(screen.getByText("Running TANGO...")).toBeInTheDocument();
  });

  it("shows the percent value", () => {
    useJobStore.setState({ jobs: { [ACTIVE_JOB.jobId]: ACTIVE_JOB } });
    render(<AnalysisProgress />);

    expect(screen.getByText("45%")).toBeInTheDocument();
  });

  it("calls cancelJob when cancel button is clicked", () => {
    useJobStore.setState({ jobs: { [ACTIVE_JOB.jobId]: ACTIVE_JOB } });
    const cancelSpy = vi.spyOn(useJobStore.getState(), "cancelJob");

    render(<AnalysisProgress />);

    const cancelBtn = screen.getByTestId("analysis-progress-cancel");
    fireEvent.click(cancelBtn);

    expect(cancelSpy).toHaveBeenCalledWith("sync-1-123");
  });

  it("hides when the job becomes terminal", () => {
    useJobStore.setState({ jobs: { [ACTIVE_JOB.jobId]: ACTIVE_JOB } });
    const { rerender } = render(<AnalysisProgress />);

    expect(screen.getByTestId("analysis-progress")).toBeInTheDocument();

    // Mark job as terminal
    useJobStore.setState({
      jobs: {
        [ACTIVE_JOB.jobId]: { ...ACTIVE_JOB, status: "SUCCESS" },
      },
    });

    rerender(<AnalysisProgress />);

    expect(screen.queryByTestId("analysis-progress")).not.toBeInTheDocument();
  });

  it("handles singular peptide count", () => {
    useJobStore.setState({
      jobs: {
        single: { ...ACTIVE_JOB, jobId: "single", peptideCount: 1 },
      },
    });
    render(<AnalysisProgress />);

    expect(screen.getByText(/Analyzing 1 peptide$/)).toBeInTheDocument();
  });
});
