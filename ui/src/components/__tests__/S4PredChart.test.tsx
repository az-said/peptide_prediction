/// <reference types="@testing-library/jest-dom" />
/**
 * Locks Peleg FIX-011 + HELIX_PERCENTAGE_AUDIT.md fix #1:
 * the "Avg composition: Helix N% / Beta N% / Coil N%" line MUST NOT
 * be rendered. The probability mean is a different metric and
 * cannot share the "% Helix" label with the canonical column.
 */
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { S4PredChart } from "../S4PredChart";
import type { Peptide } from "@/types/peptide";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverMock;

function makePeptide(): Peptide {
  // Per-residue probability arrays whose mean ≠ canonical Helix %.
  // Mean P(H) here is 0.65 → would render as "65% Helix" in the old composition line.
  const pH = [0.65, 0.65, 0.65, 0.65, 0.65, 0.65, 0.65, 0.65, 0.65, 0.65];
  const pE = [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1];
  const pC = [0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25];
  return {
    id: "P12345",
    sequence: "AAAAAAAAAA",
    length: 10,
    hydrophobicity: 0.5,
    muH: 0.4,
    charge: 1,
    sswPrediction: null,
    s4predHelixPercent: 30, // canonical (segment-based) — different from probability mean
    s4pred: { pH, pE, pC },
  } as Peptide;
}

describe("S4PredChart (canonical Helix %)", () => {
  it("does not render the legacy 'Avg composition' line", () => {
    const { container } = render(<S4PredChart peptide={makePeptide()} />);
    expect(container.textContent ?? "").not.toContain("Avg composition");
  });

  it("does not render '% Helix' anywhere inside the chart card", () => {
    const { container } = render(<S4PredChart peptide={makePeptide()} />);
    // The probability-mean composition was the only place that showed "65% Helix"
    // (or "70% Helix", etc.) inside this component. The canonical Helix % lives
    // on the parent's summary tile, not inside the chart card.
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/\d+%\s*Helix/);
    expect(text).not.toMatch(/Helix\s+\d+%/);
  });

  it("renders the card title (sanity check)", () => {
    const { container } = render(<S4PredChart peptide={makePeptide()} />);
    expect(container.textContent ?? "").toContain("S4PRED Secondary Structure Probabilities");
  });
});
