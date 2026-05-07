/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import {
  ClassificationComparison,
  SSW_CLASSIFICATION,
  HELIX_CLASSIFICATION,
} from "../ClassificationComparison";
import type {
  ClassificationScheme,
  ComparisonMetric,
} from "../ClassificationComparison";
import type { Peptide } from "@/types/peptide";

// Mock ResizeObserver for Recharts
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverMock;

// ── Test data ──

function makePeptide(overrides: Partial<Peptide> & { id: string }): Peptide {
  return {
    sequence: "AAAAAA",
    length: 6,
    hydrophobicity: 0.5,
    charge: 0,
    sswPrediction: null,
    ...overrides,
  };
}

const METRICS: ComparisonMetric[] = [
  {
    id: "hydrophobicity",
    label: "Hydrophobicity",
    getValue: (p) => p.hydrophobicity,
  },
  {
    id: "charge",
    label: "|Charge|",
    unit: "e",
    getValue: (p) => (p.charge != null ? Math.abs(p.charge) : null),
  },
];

const TWO_GROUP_PEPTIDES: Peptide[] = [
  makePeptide({ id: "P1", sswPrediction: 1, hydrophobicity: 0.8, charge: 2 }),
  makePeptide({ id: "P2", sswPrediction: 1, hydrophobicity: 0.6, charge: -1 }),
  makePeptide({
    id: "P3",
    sswPrediction: -1,
    hydrophobicity: 0.3,
    charge: 0,
  }),
  makePeptide({
    id: "P4",
    sswPrediction: -1,
    hydrophobicity: 0.2,
    charge: -2,
  }),
];

const THREE_GROUP_PEPTIDES: Peptide[] = [
  makePeptide({
    id: "H1",
    ffHelixFlag: 1,
    s4predHelixPercent: 80,
    hydrophobicity: 0.9,
    charge: 1,
  }),
  makePeptide({
    id: "H2",
    ffHelixFlag: -1,
    s4predHelixPercent: 70,
    hydrophobicity: 0.7,
    charge: -1,
  }),
  makePeptide({
    id: "H3",
    ffHelixFlag: -1,
    s4predHelixPercent: 20,
    hydrophobicity: 0.3,
    charge: 0,
  }),
  makePeptide({
    id: "H4",
    ffHelixFlag: -1,
    s4predHelixPercent: 10,
    hydrophobicity: 0.2,
    charge: 2,
  }),
];

// ── Tests ──

describe("ClassificationComparison", () => {
  it("renders with 2 groups (No SSW, SSW)", () => {
    const { container } = render(
      <ClassificationComparison
        peptides={TWO_GROUP_PEPTIDES}
        classification={SSW_CLASSIFICATION}
        metrics={METRICS}
      />
    );
    expect(
      container.querySelector(".recharts-responsive-container")
    ).not.toBeNull();
    // Should show sample size labels
    expect(container.textContent).toContain("n=");
  });

  it("renders with 3 groups (No Helix, Helix, FF-Helix)", () => {
    const { container } = render(
      <ClassificationComparison
        peptides={THREE_GROUP_PEPTIDES}
        classification={HELIX_CLASSIFICATION}
        metrics={METRICS}
      />
    );
    expect(
      container.querySelector(".recharts-responsive-container")
    ).not.toBeNull();
    // All three groups should appear in sample size legend
    expect(container.textContent).toContain("No Helix");
    expect(container.textContent).toContain("Helix");
    expect(container.textContent).toContain("FF-Helix");
  });

  it("handles empty groups gracefully (no FF-SSW peptides)", () => {
    // None of these peptides have ffSswFlag === 1, so FF-SSW group is empty
    const peptides: Peptide[] = [
      makePeptide({ id: "S1", sswPrediction: 1, hydrophobicity: 0.5, charge: 1 }),
      makePeptide({ id: "S2", sswPrediction: -1, hydrophobicity: 0.3, charge: -1 }),
    ];

    // Should not crash
    const { container } = render(
      <ClassificationComparison
        peptides={peptides}
        classification={SSW_CLASSIFICATION}
        metrics={METRICS}
      />
    );
    expect(
      container.querySelector(".recharts-responsive-container")
    ).not.toBeNull();
  });

  it("shows sample size labels when showSampleSize=true", () => {
    const { container } = render(
      <ClassificationComparison
        peptides={TWO_GROUP_PEPTIDES}
        classification={SSW_CLASSIFICATION}
        metrics={METRICS}
        showSampleSize={true}
      />
    );
    // Should contain n= labels in the legend
    expect(container.textContent).toContain("n=2");
  });

  it("uses median aggregation when specified", () => {
    // Median should not crash and should render
    const { container } = render(
      <ClassificationComparison
        peptides={TWO_GROUP_PEPTIDES}
        classification={SSW_CLASSIFICATION}
        metrics={METRICS}
        aggregation="median"
      />
    );
    expect(
      container.querySelector(".recharts-responsive-container")
    ).not.toBeNull();
  });

  it("renders with no data (empty peptides array)", () => {
    const { container } = render(
      <ClassificationComparison
        peptides={[]}
        classification={SSW_CLASSIFICATION}
        metrics={METRICS}
      />
    );
    expect(container.textContent).toContain("No data available");
  });
});
