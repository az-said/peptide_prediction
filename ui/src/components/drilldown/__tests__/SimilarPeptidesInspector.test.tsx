/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  SimilarPeptidesInspector,
  type SimilarPeptideResult,
} from "../SimilarPeptidesInspector";
import type { Peptide } from "@/types/peptide";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const refPeptide: Peptide = {
  id: "REF_001",
  sequence: "ACDEFGHIKLMNPQRSTVWY",
  length: 20,
  hydrophobicity: 0.5,
  charge: 1.0,
  sswPrediction: 1,
  s4predHelixPrediction: 1,
  ffHelixFlag: 1,
  ffSswFlag: -1,
};

function makeSimilar(
  id: string,
  distance: number,
  overrides: Partial<Peptide> = {},
): SimilarPeptideResult {
  return {
    peptide: {
      id,
      sequence: "AAAAAAAAA",
      length: 9,
      hydrophobicity: 0.3,
      charge: 0,
      sswPrediction: null,
      s4predHelixPrediction: 0,
      ffHelixFlag: -1,
      ffSswFlag: -1,
      ...overrides,
    },
    distance,
  };
}

const threeResults: SimilarPeptideResult[] = [
  makeSimilar("SIM_A", 0.05, { s4predHelixPrediction: 1, ffHelixFlag: 1 }),
  makeSimilar("SIM_B", 0.15),
  makeSimilar("SIM_C", 0.42, { sswPrediction: 1, ffSswFlag: 1 }),
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SimilarPeptidesInspector", () => {
  // ── Loading state ──────────────────────────────────────────────
  describe("loading state", () => {
    it("renders loading indicator with shimmer rows", () => {
      render(
        <SimilarPeptidesInspector reference={refPeptide} isLoading={true} />,
      );
      expect(screen.getByTestId("similar-loading")).toBeInTheDocument();
      expect(screen.getByText(/Searching for similar/)).toBeInTheDocument();
    });
  });

  // ── Error state ────────────────────────────────────────────────
  describe("error state", () => {
    it("renders error message", () => {
      render(
        <SimilarPeptidesInspector
          reference={refPeptide}
          error="Vector index unavailable"
        />,
      );
      expect(screen.getByTestId("similar-error")).toBeInTheDocument();
      expect(screen.getByText("Search failed")).toBeInTheDocument();
      expect(
        screen.getByText("Vector index unavailable"),
      ).toBeInTheDocument();
    });

    it("shows retry button when onRetry is provided", () => {
      const onRetry = vi.fn();
      render(
        <SimilarPeptidesInspector
          reference={refPeptide}
          error="timeout"
          onRetry={onRetry}
        />,
      );
      const btn = screen.getByTestId("similar-retry");
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it("hides retry button when onRetry is absent", () => {
      render(
        <SimilarPeptidesInspector reference={refPeptide} error="timeout" />,
      );
      expect(screen.queryByTestId("similar-retry")).not.toBeInTheDocument();
    });
  });

  // ── Empty state ────────────────────────────────────────────────
  describe("empty state", () => {
    it("renders when results is undefined", () => {
      render(<SimilarPeptidesInspector reference={refPeptide} />);
      expect(screen.getByTestId("similar-empty")).toBeInTheDocument();
      expect(
        screen.getByText("No similar peptides found"),
      ).toBeInTheDocument();
    });

    it("renders when results is an empty array", () => {
      render(
        <SimilarPeptidesInspector reference={refPeptide} results={[]} />,
      );
      expect(screen.getByTestId("similar-empty")).toBeInTheDocument();
    });
  });

  // ── Results state ──────────────────────────────────────────────
  describe("results state", () => {
    it("renders results container", () => {
      render(
        <SimilarPeptidesInspector
          reference={refPeptide}
          results={threeResults}
        />,
      );
      expect(screen.getByTestId("similar-results")).toBeInTheDocument();
    });

    it("shows reference peptide block", () => {
      render(
        <SimilarPeptidesInspector
          reference={refPeptide}
          results={threeResults}
        />,
      );
      const ref = screen.getByTestId("similar-reference");
      expect(ref).toBeInTheDocument();
      expect(ref).toHaveTextContent("REF_001");
    });

    it("renders correct number of result rows", () => {
      render(
        <SimilarPeptidesInspector
          reference={refPeptide}
          results={threeResults}
        />,
      );
      expect(screen.getByTestId("similar-row-SIM_A")).toBeInTheDocument();
      expect(screen.getByTestId("similar-row-SIM_B")).toBeInTheDocument();
      expect(screen.getByTestId("similar-row-SIM_C")).toBeInTheDocument();
    });

    it("respects k parameter for result count", () => {
      render(
        <SimilarPeptidesInspector
          reference={refPeptide}
          results={threeResults}
          k={2}
        />,
      );
      expect(screen.getByTestId("similar-row-SIM_A")).toBeInTheDocument();
      expect(screen.getByTestId("similar-row-SIM_B")).toBeInTheDocument();
      expect(
        screen.queryByTestId("similar-row-SIM_C"),
      ).not.toBeInTheDocument();
    });

    it("calls onSelectPeptide when accession link is clicked", () => {
      const onSelect = vi.fn();
      render(
        <SimilarPeptidesInspector
          reference={refPeptide}
          results={threeResults}
          onSelectPeptide={onSelect}
        />,
      );
      fireEvent.click(screen.getByTestId("similar-link-SIM_A"));
      expect(onSelect).toHaveBeenCalledWith("SIM_A");
    });

    it("shows distance values in result rows", () => {
      render(
        <SimilarPeptidesInspector
          reference={refPeptide}
          results={threeResults}
        />,
      );
      expect(screen.getByText("0.050")).toBeInTheDocument();
      expect(screen.getByText("0.150")).toBeInTheDocument();
      expect(screen.getByText("0.420")).toBeInTheDocument();
    });
  });

  // ── Selection & actions ────────────────────────────────────────
  describe("selection and actions", () => {
    it("shows compare button after selecting a row", () => {
      const onCompare = vi.fn();
      render(
        <SimilarPeptidesInspector
          reference={refPeptide}
          results={threeResults}
          onCompare={onCompare}
        />,
      );
      // Compare button should not exist yet
      expect(
        screen.queryByTestId("similar-compare"),
      ).not.toBeInTheDocument();

      // Click a row to select it
      fireEvent.click(screen.getByTestId("similar-row-SIM_B"));

      // Compare button should now appear
      const compareBtn = screen.getByTestId("similar-compare");
      expect(compareBtn).toBeInTheDocument();
      expect(compareBtn).toHaveTextContent("Compare (1)");

      fireEvent.click(compareBtn);
      expect(onCompare).toHaveBeenCalledWith(["SIM_B"]);
    });

    it("toggles selection on repeated clicks", () => {
      const onCompare = vi.fn();
      render(
        <SimilarPeptidesInspector
          reference={refPeptide}
          results={threeResults}
          onCompare={onCompare}
        />,
      );
      const row = screen.getByTestId("similar-row-SIM_A");

      // Select
      fireEvent.click(row);
      expect(screen.getByTestId("similar-compare")).toHaveTextContent(
        "Compare (1)",
      );

      // Deselect
      fireEvent.click(row);
      expect(
        screen.queryByTestId("similar-compare"),
      ).not.toBeInTheDocument();
    });

    it("shows export button when onExport is provided", () => {
      const onExport = vi.fn();
      render(
        <SimilarPeptidesInspector
          reference={refPeptide}
          results={threeResults}
          onExport={onExport}
        />,
      );
      const btn = screen.getByTestId("similar-export");
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
      expect(onExport).toHaveBeenCalledTimes(1);
    });

    it("hides export button when onExport is absent", () => {
      render(
        <SimilarPeptidesInspector
          reference={refPeptide}
          results={threeResults}
        />,
      );
      expect(screen.queryByTestId("similar-export")).not.toBeInTheDocument();
    });
  });

  // ── Classification pills ───────────────────────────────────────
  describe("classification pills", () => {
    it("renders active helix pill for peptides with s4predHelixPrediction=1", () => {
      render(
        <SimilarPeptidesInspector
          reference={refPeptide}
          results={[makeSimilar("H1", 0.1, { s4predHelixPrediction: 1 })]}
        />,
      );
      const row = screen.getByTestId("similar-row-H1");
      // The H pill should have a background color (active state)
      const pills = row.querySelectorAll("span");
      const hPill = Array.from(pills).find((el) => el.textContent === "H");
      expect(hPill).toBeDefined();
      expect(hPill!.style.backgroundColor).toBeTruthy();
    });

    it("renders inactive pill for peptides without classification", () => {
      render(
        <SimilarPeptidesInspector
          reference={refPeptide}
          results={[
            makeSimilar("NO_CLASS", 0.2, {
              s4predHelixPrediction: 0,
              ffHelixFlag: -1,
              ffSswFlag: -1,
              sswPrediction: -1,
            }),
          ]}
        />,
      );
      const row = screen.getByTestId("similar-row-NO_CLASS");
      const pills = row.querySelectorAll("span");
      const hPill = Array.from(pills).find((el) => el.textContent === "H");
      expect(hPill).toBeDefined();
      // Inactive: no backgroundColor
      expect(hPill!.style.backgroundColor).toBeFalsy();
    });
  });
});
