/**
 * Tests for the self-contained HTML report generator (Q15).
 *
 * Verifies:
 *  - Returns non-empty string
 *  - Contains the peptide ID, sequence, and "Peptide Visual Lab"
 *  - Does NOT contain `<link rel="stylesheet"` or `<script src=`
 *  - Contains inline style attributes (self-contained)
 *  - Contains all 4 classification labels
 *  - Contains per-tool chip labels
 *  - Contains biochem metric labels
 */
import { describe, it, expect } from "vitest";
import { buildReportHtml } from "../peptideHtmlReport";
import type { Peptide } from "@/types/peptide";

const basePeptide: Peptide = {
  id: "P12345",
  sequence: "ACDEFGHIKLMNPQRSTVWY",
  length: 20,
  hydrophobicity: 0.456,
  charge: 1.2,
  muH: 0.321,
  sswPrediction: 1,
  s4predHelixPrediction: 1,
  s4predHelixPercent: 45.5,
  s4predHasData: true,
  ffHelixFlag: 1,
  ffSswFlag: -1,
  tangoHasData: true,
  tangoAggMax: 25.5,
  tango: {
    agg: [0, 0, 5.5, 12.3, 25.5, 8.1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    beta: [0, 0, 3.2, 8.1, 18.3, 6.0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    helix: [0, 0, 0, 0.1, 0.2, 0.1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  s4pred: {
    pH: [0.9, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
    pE: [0.05, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
    pC: [0.05, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4],
  },
};

const minimalPeptide: Peptide = {
  id: "MIN001",
  sequence: "ACDEF",
  length: 5,
  hydrophobicity: null,
  charge: null,
  sswPrediction: null,
};

describe("buildReportHtml", () => {
  it("returns a non-empty string", () => {
    const html = buildReportHtml(basePeptide);
    expect(typeof html).toBe("string");
    expect(html.length).toBeGreaterThan(100);
  });

  it("starts with <!DOCTYPE html>", () => {
    const html = buildReportHtml(basePeptide);
    expect(html.trimStart().startsWith("<!DOCTYPE html>")).toBe(true);
  });

  it("contains the peptide ID", () => {
    const html = buildReportHtml(basePeptide);
    expect(html).toContain("P12345");
  });

  it("contains the peptide sequence", () => {
    const html = buildReportHtml(basePeptide);
    expect(html).toContain("ACDEFGHIKLMNPQRSTVWY");
  });

  it("contains 'Peptide Visual Lab' in the footer", () => {
    const html = buildReportHtml(basePeptide);
    expect(html).toContain("Peptide Visual Lab");
  });

  it("does NOT contain <link rel=\"stylesheet\"", () => {
    const html = buildReportHtml(basePeptide);
    expect(html).not.toContain('<link rel="stylesheet"');
  });

  it("does NOT contain <script src=", () => {
    const html = buildReportHtml(basePeptide);
    expect(html).not.toContain("<script src=");
  });

  it("does NOT contain any <script> tag at all", () => {
    const html = buildReportHtml(basePeptide);
    expect(html).not.toContain("<script");
  });

  it("contains inline style= attributes (self-contained)", () => {
    const html = buildReportHtml(basePeptide);
    expect(html).toContain('style="');
  });

  it("contains all 4 classification labels", () => {
    const html = buildReportHtml(basePeptide);
    expect(html).toContain("Helix");
    expect(html).toContain("FF-Helix");
    expect(html).toContain("SSW");
    expect(html).toContain("FF-SSW");
  });

  it("contains per-tool chip labels", () => {
    const html = buildReportHtml(basePeptide);
    expect(html).toContain("S4PRED");
    expect(html).toContain("TANGO");
  });

  it("contains biochem metric labels", () => {
    const html = buildReportHtml(basePeptide);
    expect(html).toContain("Hydrophobicity");
    expect(html).toContain("Hydrophobic moment");
    expect(html).toContain("Charge");
  });

  it("contains the biochem values", () => {
    const html = buildReportHtml(basePeptide);
    expect(html).toContain("0.46"); // hydrophobicity rounded to 2dp
    expect(html).toContain("0.32"); // muH
    expect(html).toContain("1.20"); // charge
  });

  it("contains S4PRED chart SVG when data available", () => {
    const html = buildReportHtml(basePeptide);
    expect(html).toContain("S4PRED P(Helix) per residue");
    expect(html).toContain("<svg");
  });

  it("contains TANGO aggregation chart SVG when data available", () => {
    const html = buildReportHtml(basePeptide);
    expect(html).toContain("Per-Residue Aggregation Propensity (TANGO)");
  });

  it("renders without crashing for minimal peptide", () => {
    const html = buildReportHtml(minimalPeptide);
    expect(html).toContain("MIN001");
    expect(html).toContain("ACDEF");
  });

  it("shows N/A for null biochem values", () => {
    const html = buildReportHtml(minimalPeptide);
    expect(html).toContain("N/A");
  });

  it("uses system-ui font stack (no external fonts)", () => {
    const html = buildReportHtml(basePeptide);
    expect(html).toContain("system-ui");
    expect(html).not.toContain("fonts.googleapis.com");
  });

  it("contains the citation block", () => {
    const html = buildReportHtml(basePeptide);
    expect(html).toContain("Ragonis-Bachar");
  });

  it("contains commit SHA in footer", () => {
    const html = buildReportHtml(basePeptide);
    // BUILD_SHA is "dev" in test env
    expect(html).toContain("commit");
  });

  it("contains UniProt link for valid accession", () => {
    const html = buildReportHtml(basePeptide);
    expect(html).toContain("uniprot.org/uniprotkb/P12345");
  });

  it("does NOT contain UniProt link for non-accession ID", () => {
    const html = buildReportHtml(minimalPeptide);
    expect(html).not.toContain("uniprot.org");
  });
});
