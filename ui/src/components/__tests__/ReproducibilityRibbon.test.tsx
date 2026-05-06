/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ReproducibilityRibbon } from "../ReproducibilityRibbon";
import type { QueryMetadata } from "@/lib/permalink";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockQueryMeta: QueryMetadata = {
  source: "uniprot",
  query: "amyloid AND reviewed:true",
  peptideCount: 16,
  timestamp: "2026-05-06T14:23:00Z",
  predictors: { s4pred: true, tango: true },
};

const mockThresholds = {
  muHCutoff: 0.507,
  hydroCutoff: 0.486,
  minSegmentLength: 3,
  maxGap: 2,
  minS4predHelixScore: 0.5,
  minHelixPercentContent: 20,
  s4predMaxHelixBetaDiff: 0.2,
  tangoMaxHelixBetaDiff: 0.2,
  minSsPercentContent: 20,
  aggThreshold: 5.0,
  percentOfLengthCutoff: 20.0,
  minSswResidues: 3,
  minPredictionPercent: 50.0,
};

let mockStoreState = {
  queryMeta: mockQueryMeta as QueryMetadata | null,
  datasetHash: "abc123def456789012345678" as string | null,
  isHashing: false,
};

vi.mock("@/stores/reproducibilityStore", () => ({
  useReproducibilityStore: (selector: (s: typeof mockStoreState) => unknown) =>
    selector(mockStoreState),
  PVL_VERSION: "0.1.2",
  BUILD_SHA: "abc1234",
}));

vi.mock("@/stores/thresholdStore", () => ({
  useThresholdStore: (selector: (s: { active: typeof mockThresholds }) => unknown) =>
    selector({ active: mockThresholds }),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock CitationDialog
vi.mock("@/components/CitationDialog", () => ({
  CitationDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="citation-dialog">Citation Dialog</div> : null,
}));

// Mock Radix tooltip (no portal in jsdom)
vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: any) => <>{children}</>,
  TooltipContent: ({ children }: any) => <span>{children}</span>,
  TooltipProvider: ({ children }: any) => <>{children}</>,
  TooltipTrigger: ({ children }: any) => <>{children}</>,
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ReproducibilityRibbon", () => {
  beforeEach(() => {
    mockStoreState = {
      queryMeta: mockQueryMeta,
      datasetHash: "abc123def456789012345678",
      isHashing: false,
    };
  });

  it("renders with version badge and build SHA", () => {
    render(<ReproducibilityRibbon />);
    expect(screen.getByTestId("reproducibility-ribbon")).toBeInTheDocument();
    expect(screen.getByText("v0.1.2")).toBeInTheDocument();
    expect(screen.getByText("abc1234")).toBeInTheDocument();
  });

  it("displays query summary in the chip", () => {
    render(<ReproducibilityRibbon />);
    const chip = screen.getByTestId("query-chip");
    expect(chip.textContent).toContain("UniProt");
    expect(chip.textContent).toContain("16 peptides");
    expect(chip.textContent).toContain("S4PRED");
    expect(chip.textContent).toContain("TANGO");
  });

  it("shows permalink and cite buttons", () => {
    render(<ReproducibilityRibbon />);
    expect(screen.getByTestId("copy-permalink")).toBeInTheDocument();
    expect(screen.getByTestId("cite-button")).toBeInTheDocument();
  });

  it("expands to show full details on chip click", () => {
    render(<ReproducibilityRibbon />);

    // Click the query chip to expand
    fireEvent.click(screen.getByTestId("query-chip"));

    // Should show expanded details
    expect(screen.getByText("UniProt API")).toBeInTheDocument();
    expect(screen.getByText("amyloid AND reviewed:true")).toBeInTheDocument();
  });

  it("shows 'No analysis loaded' when queryMeta is null", () => {
    mockStoreState = {
      queryMeta: null,
      datasetHash: null,
      isHashing: false,
    };
    render(<ReproducibilityRibbon />);
    expect(screen.getByTestId("query-chip").textContent).toContain(
      "No analysis loaded",
    );
  });

  it("opens citation dialog on cite button click", () => {
    render(<ReproducibilityRibbon />);
    fireEvent.click(screen.getByTestId("cite-button"));
    expect(screen.getByTestId("citation-dialog")).toBeInTheDocument();
  });

  it("shows CSV source correctly", () => {
    mockStoreState = {
      queryMeta: { ...mockQueryMeta, source: "csv", query: null },
      datasetHash: "abc123def456789012345678",
      isHashing: false,
    };
    render(<ReproducibilityRibbon />);
    expect(screen.getByTestId("query-chip").textContent).toContain("CSV upload");
  });

  it("shows predictor badges in expanded view", () => {
    render(<ReproducibilityRibbon />);
    fireEvent.click(screen.getByTestId("query-chip"));
    expect(screen.getByText("S4PRED ON")).toBeInTheDocument();
    expect(screen.getByText("TANGO ON")).toBeInTheDocument();
  });

  it("shows dataset hash prefix in expanded view", () => {
    render(<ReproducibilityRibbon />);
    fireEvent.click(screen.getByTestId("query-chip"));
    expect(screen.getByText(/abc123def456/)).toBeInTheDocument();
  });

  it("shows threshold values in expanded view", () => {
    render(<ReproducibilityRibbon />);
    fireEvent.click(screen.getByTestId("query-chip"));
    expect(screen.getByText(/μH≥0.507/)).toBeInTheDocument();
  });
});
