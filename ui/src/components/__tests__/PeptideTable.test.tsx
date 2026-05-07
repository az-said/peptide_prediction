/// <reference types="@testing-library/jest-dom" />
/**
 * Locks HELIX_PERCENTAGE_AUDIT.md fix #2:
 * the S4PRED dominant-class hover preview must NOT label probability means
 * with "% Helix" — the canonical column header is already "Helix %", so the
 * cell-internal text would collide with it.
 *
 * The new format is "Dominant: H 0.62 · E 0.10 · C 0.28" — no percent signs,
 * no bare "Helix" word with a number adjacent.
 */
import { describe, it, expect } from "vitest";
import { getS4PredComposition } from "../PeptideTable";
import type { Peptide } from "@/types/peptide";

function makePeptide(pH: number[], pE: number[], pC: number[]): Peptide {
  return {
    id: "P1",
    sequence: "A".repeat(pH.length),
    length: pH.length,
    hydrophobicity: 0,
    muH: 0,
    charge: 0,
    sswPrediction: null,
    s4pred: { pH, pE, pC },
  } as Peptide;
}

describe("getS4PredComposition (PeptideTable hover preview)", () => {
  it("returns the H/E/C probability-mean format with no percent signs", () => {
    const text = getS4PredComposition(
      makePeptide(
        [0.6, 0.6, 0.6, 0.6, 0.6],
        [0.2, 0.2, 0.2, 0.2, 0.2],
        [0.2, 0.2, 0.2, 0.2, 0.2]
      )
    );
    expect(text).toBe("Dominant: H 0.60 · E 0.20 · C 0.20");
  });

  it("does NOT collide with the canonical 'Helix %' column header", () => {
    const text =
      getS4PredComposition(
        makePeptide(
          [0.65, 0.65, 0.65, 0.65, 0.65],
          [0.2, 0.2, 0.2, 0.2, 0.2],
          [0.15, 0.15, 0.15, 0.15, 0.15]
        )
      ) ?? "";
    // The old format produced "65% Helix · 20% Beta · 15% Coil" — that's the regression
    // we're locking out.
    expect(text).not.toContain("%");
    expect(text).not.toMatch(/\d+\s*Helix/);
    expect(text).not.toMatch(/Helix\s+\d/);
  });

  it("returns null when no S4PRED probability arrays are present", () => {
    const text = getS4PredComposition({
      id: "P2",
      sequence: "AAA",
      length: 3,
      hydrophobicity: 0,
      muH: 0,
      charge: 0,
      sswPrediction: null,
    } as Peptide);
    expect(text).toBeNull();
  });
});
