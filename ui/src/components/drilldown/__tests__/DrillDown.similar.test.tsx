/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { Peptide } from "@/types/peptide";

// ---------------------------------------------------------------------------
// Mocks — set up BEFORE importing the component under test.
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn();
let mockParams = new URLSearchParams();
const mockSetSearchParams = vi.fn(
  (updater: (prev: URLSearchParams) => URLSearchParams) => {
    if (typeof updater === "function") {
      mockParams = updater(mockParams);
    }
  },
);

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: () => [mockParams, mockSetSearchParams],
}));

const mockFindSimilar = vi.fn();
vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    findSimilarPeptides: (...args: unknown[]) => mockFindSimilar(...args),
  };
});

const refPeptide: Peptide = {
  id: "P12345",
  sequence: "AKLMNPQR",
  length: 8,
} as Peptide;

const neighbour: Peptide = {
  id: "Q98765",
  sequence: "AKLMNPQS",
  length: 8,
} as Peptide;

vi.mock("@/stores/datasetStore", () => ({
  useDatasetStore: (selector: (s: unknown) => unknown) =>
    selector({
      peptides: [refPeptide],
      stats: null,
      getPeptideById: (id: string) =>
        id === refPeptide.id ? refPeptide : undefined,
    }),
}));

// Sheet uses Radix portals — render children inline so testing-library can find them.
vi.mock("@/components/ui/sheet", () => {
  const Pass = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
  return {
    Sheet: Pass,
    SheetContent: ({ children }: { children?: React.ReactNode }) => (
      <div data-testid="sheet-content">{children}</div>
    ),
    SheetHeader: Pass,
    SheetTitle: Pass,
    SheetDescription: Pass,
  };
});

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Component under test
// ---------------------------------------------------------------------------

import { DrillDown } from "../DrillDown";
import { DrillDownProvider } from "../DrillDownProvider";

function renderDrillDown() {
  return render(
    <DrillDownProvider>
      <DrillDown />
    </DrillDownProvider>,
  );
}

beforeEach(() => {
  mockNavigate.mockReset();
  mockSetSearchParams.mockReset();
  mockFindSimilar.mockReset();
  // Force similar mode with a reference peptide already in the store
  mockParams = new URLSearchParams(
    `drillPeptide=${refPeptide.id}&drillMode=similar`,
  );
});

describe("DrillDown — similar mode", () => {
  it("calls findSimilarPeptides with the reference peptide id on open", async () => {
    mockFindSimilar.mockResolvedValue({
      referenceId: refPeptide.id,
      method: "lancedb+local-minilm",
      elapsedMs: 5,
      results: [{ peptide: neighbour, distance: 0.05 }],
    });

    renderDrillDown();

    await waitFor(() => {
      expect(mockFindSimilar).toHaveBeenCalledTimes(1);
    });
    const [calledRefId, k] = mockFindSimilar.mock.calls[0];
    expect(calledRefId).toBe(refPeptide.id);
    expect(k).toBe(10);
  });

  it("renders the inspector with the resolved results", async () => {
    mockFindSimilar.mockResolvedValue({
      referenceId: refPeptide.id,
      method: "lancedb+local-minilm",
      elapsedMs: 5,
      results: [{ peptide: neighbour, distance: 0.05 }],
    });

    renderDrillDown();

    await waitFor(() => {
      expect(screen.getByTestId("similar-results")).toBeInTheDocument();
    });
    expect(screen.getByTestId(`similar-row-${neighbour.id}`)).toBeInTheDocument();
  });

  it("navigates + closes drill-down when a row accession is clicked", async () => {
    mockFindSimilar.mockResolvedValue({
      referenceId: refPeptide.id,
      method: "lancedb+local-minilm",
      elapsedMs: 5,
      results: [{ peptide: neighbour, distance: 0.05 }],
    });

    renderDrillDown();

    const link = await screen.findByTestId(`similar-link-${neighbour.id}`);
    fireEvent.click(link);

    expect(mockNavigate).toHaveBeenCalledWith(
      `/peptides/${neighbour.id}`,
    );
    // close() calls setSearchParams to clear drill params
    expect(mockSetSearchParams).toHaveBeenCalled();
  });

  it("shows the error state and supports retry on API failure", async () => {
    mockFindSimilar
      .mockRejectedValueOnce(new Error("Vector index unavailable"))
      .mockResolvedValueOnce({
        referenceId: refPeptide.id,
        method: "lancedb+local-minilm",
        elapsedMs: 5,
        results: [{ peptide: neighbour, distance: 0.05 }],
      });

    renderDrillDown();

    const retry = await screen.findByTestId("similar-retry");
    expect(screen.getByTestId("similar-error")).toHaveTextContent(
      /Vector index unavailable/,
    );

    fireEvent.click(retry);
    await waitFor(() => {
      expect(mockFindSimilar).toHaveBeenCalledTimes(2);
    });
  });

  it("opens /compare with reference + selected ids when Compare is clicked", async () => {
    mockFindSimilar.mockResolvedValue({
      referenceId: refPeptide.id,
      method: "lancedb+local-minilm",
      elapsedMs: 5,
      results: [{ peptide: neighbour, distance: 0.05 }],
    });

    renderDrillDown();

    const row = await screen.findByTestId(`similar-row-${neighbour.id}`);
    fireEvent.click(row); // selects the row
    const compareBtn = await screen.findByTestId("similar-compare");
    fireEvent.click(compareBtn);

    expect(mockNavigate).toHaveBeenCalledWith(
      `/compare?ids=${refPeptide.id},${neighbour.id}`,
    );
  });
});
