/// <reference types="@testing-library/jest-dom" />
/**
 * CorrelationMatrix — Unit tests for correlation computation and rendering.
 *
 * Covers: computation correctness, header styles (rotate/wrap/short),
 * hatched cells for insufficient N, diagonal treatment, empty state (<2 peptides).
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import {
  CorrelationMatrix,
  computeCorrelationMatrix,
  DEFAULT_CORRELATION_METRICS,
  type CorrelationMetric,
} from "../CorrelationMatrix";
import type { Peptide } from "@/types/peptide";

// ── Helpers ──

/** Minimal Peptide stub with only the fields metrics access. */
function makePeptide(overrides: Partial<Peptide>): Peptide {
  return {
    id: "test",
    sequence: "ACGT",
    length: 4,
    hydrophobicity: 0,
    charge: 0,
    sswPrediction: null,
    ...overrides,
  };
}

const metricA: CorrelationMetric = {
  id: "a",
  label: "Metric A",
  shortLabel: "A",
  getValue: (p) => p.hydrophobicity,
};

const metricB: CorrelationMetric = {
  id: "b",
  label: "Metric B",
  shortLabel: "B",
  getValue: (p) => p.charge,
};

const metricC: CorrelationMetric = {
  id: "c",
  label: "Metric C",
  getValue: (p) => p.muH,
};

/** Generate N peptides with incrementing values for testing. */
function makePeptides(count: number): Peptide[] {
  return Array.from({ length: count }, (_, i) =>
    makePeptide({
      id: String(i),
      hydrophobicity: i,
      charge: i * 2,
    }),
  );
}

// ── Computation tests ──

describe("computeCorrelationMatrix", () => {
  it("pairwise-exclude: uses only rows where both values are non-null", () => {
    const peptides: Peptide[] = [
      makePeptide({ id: "1", hydrophobicity: 1, charge: 2, muH: null }),
      makePeptide({ id: "2", hydrophobicity: 2, charge: 4, muH: 10 }),
      makePeptide({ id: "3", hydrophobicity: 3, charge: 6, muH: 20 }),
    ];

    const { matrix, sampleSizes } = computeCorrelationMatrix(
      peptides,
      [metricA, metricB, metricC],
      "pairwise-exclude",
    );

    // A vs B: all 3 peptides valid => N=3, perfect correlation (r=1)
    expect(sampleSizes[0][1]).toBe(3);
    expect(matrix[0][1]).toBeCloseTo(1.0, 5);

    // A vs C: only peptides 2,3 valid (muH null for peptide 1) => N=2
    expect(sampleSizes[0][2]).toBe(2);

    // B vs C: only peptides 2,3 valid => N=2
    expect(sampleSizes[1][2]).toBe(2);
  });

  it("listwise-exclude: excludes entire row if any metric is null", () => {
    const peptides: Peptide[] = [
      makePeptide({ id: "1", hydrophobicity: 1, charge: 2, muH: null }),
      makePeptide({ id: "2", hydrophobicity: 2, charge: 4, muH: 10 }),
      makePeptide({ id: "3", hydrophobicity: 3, charge: 6, muH: 20 }),
    ];

    const { sampleSizes } = computeCorrelationMatrix(
      peptides,
      [metricA, metricB, metricC],
      "listwise-exclude",
    );

    // Peptide 1 excluded (muH null) — only 2 peptides remain for ALL pairs
    expect(sampleSizes[0][1]).toBe(2);
    expect(sampleSizes[0][2]).toBe(2);
    expect(sampleSizes[1][2]).toBe(2);
  });

  it("never-zero: same as pairwise-exclude, emits console warning", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const peptides: Peptide[] = [
      makePeptide({ id: "1", hydrophobicity: 1, charge: 2, muH: null }),
      makePeptide({ id: "2", hydrophobicity: 2, charge: 4, muH: 10 }),
    ];

    const { sampleSizes } = computeCorrelationMatrix(
      peptides,
      [metricA, metricB, metricC],
      "never-zero",
    );

    // Same pairwise behavior
    expect(sampleSizes[0][1]).toBe(2);
    expect(sampleSizes[0][2]).toBe(1); // only peptide 2 has muH

    // Warning was emitted
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("never-zero"),
    );

    warnSpy.mockRestore();
  });

  it("all-null column produces NaN correlations", () => {
    const allNullMetric: CorrelationMetric = {
      id: "allNull",
      label: "All Null",
      getValue: () => null,
    };

    const peptides: Peptide[] = [
      makePeptide({ id: "1", hydrophobicity: 1 }),
      makePeptide({ id: "2", hydrophobicity: 2 }),
    ];

    const { matrix, sampleSizes } = computeCorrelationMatrix(
      peptides,
      [metricA, allNullMetric],
      "pairwise-exclude",
    );

    // N=0 for cross-metric pairs
    expect(sampleSizes[0][1]).toBe(0);
    expect(Number.isNaN(matrix[0][1])).toBe(true);
  });
});

// ── Rendering tests ──

describe("CorrelationMatrix component", () => {
  it("renders without crashing with empty peptides array", () => {
    render(
      <CorrelationMatrix
        peptides={[]}
        metrics={[metricA, metricB]}
      />,
    );

    // Should show empty state for < 2 peptides
    expect(screen.getByText("Need at least 2 peptides for correlation analysis.")).toBeInTheDocument();
  });

  it("renders empty state for single peptide", () => {
    render(
      <CorrelationMatrix
        peptides={[makePeptide({ id: "1" })]}
        metrics={[metricA, metricB]}
      />,
    );

    expect(
      screen.getByText("Need at least 2 peptides for correlation analysis."),
    ).toBeInTheDocument();
    // Title should still render
    expect(screen.getByText("Correlation matrix")).toBeInTheDocument();
  });

  it("renders em dash for N < minSampleSize", () => {
    // Only 2 peptides, minSampleSize=5 => all off-diagonal cells should show "—"
    const peptides: Peptide[] = [
      makePeptide({ id: "1", hydrophobicity: 1, charge: 2 }),
      makePeptide({ id: "2", hydrophobicity: 2, charge: 4 }),
    ];

    render(
      <CorrelationMatrix
        peptides={peptides}
        metrics={[metricA, metricB]}
        minSampleSize={5}
      />,
    );

    // There should be at least one em dash cell
    const cells = screen.getAllByText("—");
    expect(cells.length).toBeGreaterThan(0);
  });

  it("renders hatched cells for insufficient sample size", () => {
    const peptides: Peptide[] = [
      makePeptide({ id: "1", hydrophobicity: 1, charge: 2 }),
      makePeptide({ id: "2", hydrophobicity: 2, charge: 4 }),
    ];

    const { container } = render(
      <CorrelationMatrix
        peptides={peptides}
        metrics={[metricA, metricB]}
        minSampleSize={5}
      />,
    );

    // Hatched cells should have data-testid starting with "cell-hatched"
    const hatchedCells = container.querySelectorAll("[data-testid^='cell-hatched']");
    expect(hatchedCells.length).toBeGreaterThan(0);
  });

  it("renders em dash for all-null column", () => {
    const allNullMetric: CorrelationMetric = {
      id: "allNull",
      label: "All Null",
      getValue: () => null,
    };

    const peptides: Peptide[] = [
      makePeptide({ id: "1", hydrophobicity: 1 }),
      makePeptide({ id: "2", hydrophobicity: 2 }),
      makePeptide({ id: "3", hydrophobicity: 3 }),
      makePeptide({ id: "4", hydrophobicity: 4 }),
      makePeptide({ id: "5", hydrophobicity: 5 }),
    ];

    render(
      <CorrelationMatrix
        peptides={peptides}
        metrics={[metricA, allNullMetric]}
        minSampleSize={2}
      />,
    );

    // Cross-metric cell should be "—" since allNull has N=0
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThan(0);
  });

  it("upper triangle display hides cells below diagonal", () => {
    const peptides = makePeptides(6);

    const { container } = render(
      <CorrelationMatrix
        peptides={peptides}
        metrics={[metricA, metricB]}
        display="upper"
        minSampleSize={2}
      />,
    );

    // In upper triangle with 2 metrics: row 0 has 2 cells, row 1 has 1 cell rendered + 1 empty
    // The lower-left cell (row=1, col=0) should be an empty <td>
    const rows = container.querySelectorAll("tbody tr");
    expect(rows.length).toBe(2);

    // Second row: first data cell (col=0, below diagonal) should have no gridcell
    const secondRowCells = rows[1].querySelectorAll("td");
    const emptyCell = secondRowCells[0];
    expect(emptyCell.querySelector("[role='gridcell']")).toBeNull();
  });

  it("shows no-metrics message when metrics array is empty", () => {
    render(
      <CorrelationMatrix
        peptides={[makePeptide({ id: "1" })]}
        metrics={[]}
      />,
    );

    expect(
      screen.getByText("No metrics configured for correlation analysis."),
    ).toBeInTheDocument();
  });

  it("renders diagonal cells with recessed treatment", () => {
    const peptides = makePeptides(6);

    const { container } = render(
      <CorrelationMatrix
        peptides={peptides}
        metrics={[metricA, metricB]}
        display="full"
        minSampleSize={2}
      />,
    );

    // Diagonal cells should have data-testid "cell-diagonal-*"
    const diagonalCells = container.querySelectorAll("[data-testid^='cell-diagonal']");
    expect(diagonalCells.length).toBe(2);

    // Each should show "1.00"
    diagonalCells.forEach((cell) => {
      expect(cell.textContent).toBe("1.00");
    });
  });
});

// ── Header style tests ──

describe("CorrelationMatrix header styles", () => {
  const peptides = makePeptides(6);
  const longLabelMetric: CorrelationMetric = {
    id: "long",
    label: "Hydrophobicity",
    shortLabel: "Hydro",
    getValue: (p) => p.hydrophobicity,
  };

  it("rotate: renders column headers with rotate transform", () => {
    const { container } = render(
      <CorrelationMatrix
        peptides={peptides}
        metrics={[longLabelMetric, metricB]}
        headerStyle="rotate"
        minSampleSize={2}
      />,
    );

    const colHeader = container.querySelector("[data-testid='col-header-long']");
    expect(colHeader).toBeInTheDocument();
    // Should have rotate transform style
    expect(colHeader?.getAttribute("style")).toContain("rotate(-45deg)");
    // Full label shown (not short)
    expect(colHeader?.textContent).toBe("Hydrophobicity");
  });

  it("short: uses shortLabel when available", () => {
    const { container } = render(
      <CorrelationMatrix
        peptides={peptides}
        metrics={[longLabelMetric, metricB]}
        headerStyle="short"
        minSampleSize={2}
      />,
    );

    const colHeader = container.querySelector("[data-testid='col-header-long']");
    expect(colHeader).toBeInTheDocument();
    expect(colHeader?.textContent).toBe("Hydro");

    // metricB has shortLabel "B"
    const colHeaderB = container.querySelector("[data-testid='col-header-b']");
    expect(colHeaderB?.textContent).toBe("B");
  });

  it("short: falls back to full label when shortLabel not set", () => {
    const noShortMetric: CorrelationMetric = {
      id: "noshort",
      label: "Full Label Only",
      getValue: (p) => p.charge,
    };

    const { container } = render(
      <CorrelationMatrix
        peptides={peptides}
        metrics={[noShortMetric, metricA]}
        headerStyle="short"
        minSampleSize={2}
      />,
    );

    const colHeader = container.querySelector("[data-testid='col-header-noshort']");
    expect(colHeader?.textContent).toBe("Full Label Only");
  });

  it("wrap: renders column headers without rotate", () => {
    const { container } = render(
      <CorrelationMatrix
        peptides={peptides}
        metrics={[longLabelMetric, metricB]}
        headerStyle="wrap"
        minSampleSize={2}
      />,
    );

    const colHeader = container.querySelector("[data-testid='col-header-long']");
    expect(colHeader).toBeInTheDocument();
    // Should NOT have rotate transform
    expect(colHeader?.getAttribute("style")).not.toContain("rotate");
    // Full label shown
    expect(colHeader?.textContent).toBe("Hydrophobicity");
  });
});

// ── DEFAULT_CORRELATION_METRICS tests ──

describe("DEFAULT_CORRELATION_METRICS", () => {
  it("all metrics have shortLabel defined", () => {
    for (const metric of DEFAULT_CORRELATION_METRICS) {
      expect(metric.shortLabel).toBeDefined();
      expect(typeof metric.shortLabel).toBe("string");
      expect((metric.shortLabel as string).length).toBeGreaterThan(0);
    }
  });

  it("has the expected short labels", () => {
    // 2026-06-07 (Peleg Zoom 2026-06-04): metrics updated — S4PRED helix score
    // replaces helix %, TANGO H/β/agg added, FF flags added as binary targets.
    const shortLabels = DEFAULT_CORRELATION_METRICS.map((m) => m.shortLabel);
    expect(shortLabels).toEqual([
      "Hydro",
      "μH",
      "Charge",
      "Length",
      "Helix sc.",
      "TANGO H",
      "TANGO β",
      "TANGO agg",
      "FF-Helix",
      "FF-SSW",
    ]);
  });
});
