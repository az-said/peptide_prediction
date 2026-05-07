/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Mol3DViewer } from "../Mol3DViewer";
import type { Peptide } from "@/types/peptide";
import type { AlphaFoldEntry } from "@/lib/alphafold";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockEntry: AlphaFoldEntry = {
  modelEntityId: "AF-P12345-F1",
  uniprotAccession: "P12345",
  gene: "TEST",
  organismScientificName: "Homo sapiens",
  globalMetricValue: 85.5,
  fractionPlddtVeryHigh: 0.6,
  fractionPlddtConfident: 0.3,
  fractionPlddtLow: 0.08,
  fractionPlddtVeryLow: 0.02,
  pdbUrl: "https://example.com/test.pdb",
  cifUrl: "https://example.com/test.cif",
  paeImageUrl: null,
  sequenceLength: 42,
};

let mockFetchResult: AlphaFoldEntry | null = mockEntry;

vi.mock("@/lib/alphafold", () => ({
  fetchAlphaFoldEntry: () => Promise.resolve(mockFetchResult),
  isValidUniProtAccession: (id: string) =>
    /^[A-Z][0-9][A-Z0-9]{3}[0-9](-\d+)?$/i.test(id),
  getMolstarViewerUrl: (id: string) =>
    `https://molstar.org/viewer/?id=${id}`,
}));

// Mock Radix tooltip (no portal in jsdom)
vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: any) => <>{children}</>,
  TooltipContent: ({ children }: any) => <span>{children}</span>,
  TooltipProvider: ({ children }: any) => <>{children}</>,
  TooltipTrigger: ({ children }: any) => <>{children}</>,
}));

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function makePeptide(overrides?: Partial<Peptide>): Peptide {
  return {
    id: "P12345",
    sequence: "AKLVFFAEDVGSNKAKLVFFAEDVGSNKAKLVFFAEDVGSNKA",
    length: 43,
    hydrophobicity: 0.5,
    charge: 1.0,
    sswPrediction: null,
    ...overrides,
  } as Peptide;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Mol3DViewer", () => {
  beforeEach(() => {
    mockFetchResult = mockEntry;
  });

  it("renders the component with title", async () => {
    render(<Mol3DViewer peptide={makePeptide()} />);
    await waitFor(() => {
      expect(screen.getByTestId("mol3d-viewer")).toBeInTheDocument();
    });
    expect(screen.getByText(/3D Structure with PVL Annotations/)).toBeInTheDocument();
  });

  it("shows empty state for non-UniProt peptide ID", () => {
    const p = makePeptide({ id: "not-uniprot-123" });
    render(<Mol3DViewer peptide={p} />);
    expect(
      screen.getByText(/No AlphaFold structure available/),
    ).toBeInTheDocument();
  });

  it("shows too-short message for peptides < 8 residues", () => {
    const p = makePeptide({ id: "P12345", sequence: "AKLVF", length: 5 });
    render(<Mol3DViewer peptide={p} />);
    expect(
      screen.getByText(/too short for meaningful/),
    ).toBeInTheDocument();
  });

  it("shows load button after AlphaFold data fetched", async () => {
    render(<Mol3DViewer peptide={makePeptide()} />);
    await waitFor(() => {
      expect(screen.getByTestId("load-viewer-button")).toBeInTheDocument();
    });
    expect(screen.getByText(/Load 3D Structure Viewer/)).toBeInTheDocument();
  });

  it("loads iframe when load button clicked", async () => {
    render(<Mol3DViewer peptide={makePeptide()} />);
    await waitFor(() => {
      expect(screen.getByTestId("load-viewer-button")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId("load-viewer-button"));
    expect(screen.getByTestId("mol3d-iframe-container")).toBeInTheDocument();
  });

  it("shows overlay toggles when peptide has prediction data", async () => {
    const p = makePeptide({
      tango: { agg: [0, 0, 10, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
      s4pred: { helixSegments: [[2, 10]] },
    });
    render(<Mol3DViewer peptide={p} />);
    await waitFor(() => {
      expect(screen.getByTestId("overlay-toggles")).toBeInTheDocument();
    });
  });

  it("renders overlay residue bar for peptides with prediction data", async () => {
    const p = makePeptide({
      s4pred: { helixSegments: [[2, 10]] },
    });
    render(<Mol3DViewer peptide={p} />);
    await waitFor(() => {
      expect(screen.getByText(/Prediction overlay map/)).toBeInTheDocument();
    });
  });

  it("shows pLDDT confidence score", async () => {
    render(<Mol3DViewer peptide={makePeptide()} />);
    await waitFor(() => {
      expect(screen.getByText("85.5")).toBeInTheDocument();
    });
    expect(screen.getByText("Confident")).toBeInTheDocument();
  });

  it("shows error state with retry when fetch fails", async () => {
    mockFetchResult = null;
    render(<Mol3DViewer peptide={makePeptide()} />);
    await waitFor(() => {
      expect(screen.getByText(/No AlphaFold structure found/)).toBeInTheDocument();
    });
    expect(screen.getByText("Retry")).toBeInTheDocument();
  });

  it("shows PDB download button", async () => {
    render(<Mol3DViewer peptide={makePeptide()} />);
    await waitFor(() => {
      expect(screen.getByText("PDB")).toBeInTheDocument();
    });
  });

  it("renders with no overlays gracefully", async () => {
    const p = makePeptide(); // no prediction data
    render(<Mol3DViewer peptide={p} />);
    await waitFor(() => {
      expect(screen.getByTestId("mol3d-viewer")).toBeInTheDocument();
    });
    // Should not crash, just no overlay toggles
    expect(screen.queryByTestId("overlay-toggles")).not.toBeInTheDocument();
  });
});
