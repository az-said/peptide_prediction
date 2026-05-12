/**
 * Methods panel — Computational methods page.
 *
 * Contents:
 * - TANGO algorithm description
 * - S4PRED algorithm description
 * - FF-Helix / FF-SSW classification criteria
 * - Biophysical property calculation methods
 * - Threshold configuration (if provided)
 */

import type { jsPDF } from "jspdf";
import type { Peptide } from "@/types/peptide";
import type { ReportData, ReportPanel, RenderContext } from "../peptideReport";
import {
  drawSectionHeading,
  drawParagraph,
  drawKeyValueTable,
} from "../peptideReport";

const TANGO_DESCRIPTION =
  "TANGO is a statistical-mechanics-based algorithm for predicting aggregation-prone " +
  "regions in peptide sequences. It evaluates the propensity of each residue to adopt " +
  "beta-aggregated conformations by considering the thermodynamic cost of burying backbone " +
  "hydrogen bonds, side-chain interactions, and entropic penalties. TANGO outputs per-residue " +
  "scores for aggregation (AGG), beta-strand (BETA), alpha-helix (HELIX), and turn (TURN) " +
  "propensities.";

const S4PRED_DESCRIPTION =
  "S4PRED (Sequence-only Secondary Structure Prediction using a deep Recurrent Neural " +
  "Network) predicts three-state secondary structure (helix, strand, coil) from amino acid " +
  "sequence alone. It uses a bidirectional LSTM architecture trained on high-resolution " +
  "crystallographic data. S4PRED provides per-residue probabilities for each secondary " +
  "structure state (P(H), P(E), P(C)).";

const FF_HELIX_DESCRIPTION =
  "FF-Helix (Fibril-Forming Helix) classification identifies peptides with helical " +
  "segments whose biophysical properties (hydrophobicity, hydrophobic moment) are " +
  "consistent with fibril-forming helices. The classification uses S4PRED-predicted " +
  "helical segments and evaluates whether the combined helix score (helix_uH + helix_score) " +
  "exceeds a validated reference threshold. Default thresholds: hydrophobicity >= 0.417, " +
  "hydrophobic moment (μH) >= 0.388.";

const FF_SSW_DESCRIPTION =
  "FF-SSW (Fibril-Forming Secondary Structure Switch) classification identifies peptides " +
  "that undergo a predicted structural transition from helix to beta-strand conformation. " +
  "The score combines hydrophobicity, beta hydrophobic moment, full-length hydrophobic " +
  "moment, and SSW prediction into a composite metric. Peptides meeting the combined " +
  "threshold are flagged as FF-SSW candidates.";

const BIOPHYSICS_DESCRIPTION =
  "Biophysical properties are computed from the amino acid sequence using established scales: " +
  "hydrophobicity (Fauchere–Pliska scale, mean over all residues), charge at pH 7.4 " +
  "(Henderson–Hasselbalch with standard pKa values for Asp, Glu, His, Lys, Arg, Cys, " +
  "and termini), and hydrophobic moment (μH, Eisenberg formulation with an 100° " +
  "angular step for ideal alpha-helix geometry).";

function drawMethodsContent(
  doc: jsPDF,
  peptide: Peptide,
  data: ReportData,
  ctx: RenderContext,
): void {
  let y = ctx.contentTop;

  y = drawSectionHeading(doc, "Computational Methods", y);

  // ── TANGO ──────────────────────────────────────────────────────
  y = drawSectionHeading(doc, "TANGO", y);
  y = drawParagraph(doc, TANGO_DESCRIPTION, y, 8);
  y += 2;

  // ── S4PRED ─────────────────────────────────────────────────────
  if (y < ctx.footerY - 40) {
    y = drawSectionHeading(doc, "S4PRED", y);
    y = drawParagraph(doc, S4PRED_DESCRIPTION, y, 8);
    y += 2;
  }

  // ── FF-Helix ───────────────────────────────────────────────────
  if (y < ctx.footerY - 40) {
    y = drawSectionHeading(doc, "FF-Helix Classification", y);
    y = drawParagraph(doc, FF_HELIX_DESCRIPTION, y, 8);
    y += 2;
  }

  // ── FF-SSW ─────────────────────────────────────────────────────
  if (y < ctx.footerY - 40) {
    y = drawSectionHeading(doc, "FF-SSW Classification", y);
    y = drawParagraph(doc, FF_SSW_DESCRIPTION, y, 8);
    y += 2;
  }

  // ── Biophysics ─────────────────────────────────────────────────
  if (y < ctx.footerY - 40) {
    y = drawSectionHeading(doc, "Biophysical Calculations", y);
    y = drawParagraph(doc, BIOPHYSICS_DESCRIPTION, y, 8);
    y += 2;
  }

  // ── Thresholds ─────────────────────────────────────────────────
  if (data.thresholds && y < ctx.footerY - 30) {
    y += 2;
    y = drawSectionHeading(doc, "Threshold Configuration", y);

    const threshRows: Array<[string, string]> = [
      ["μH Cutoff", data.thresholds.muHCutoff.toFixed(3)],
      ["Hydrophobicity Cutoff", data.thresholds.hydroCutoff.toFixed(3)],
    ];

    y = drawKeyValueTable(doc, threshRows, y, 55);
  }
}

export const methodsPanel: ReportPanel = {
  id: "methods",
  title: "Methods",
  render: drawMethodsContent,
};
