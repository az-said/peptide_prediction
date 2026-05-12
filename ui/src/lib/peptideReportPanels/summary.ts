/**
 * Summary panel — Page 2: TANGO + S4PRED prediction summary tables.
 *
 * Mirrors the Galagos reference layout:
 * - Identity key-value table (Accession, Organism, Protein, Gene, Sequence, Length)
 * - TANGO Prediction Summary (AGG %, AMYLO, TURN %, HELIX %, HELAGG %, BETA %)
 * - Per-Residue TANGO Prediction table (Res, AA, Beta %, Turn %, Helix %, Agg %)
 */

import type { jsPDF } from "jspdf";
import type { Peptide } from "@/types/peptide";
import type { ReportData, ReportPanel, RenderContext } from "../peptideReport";
import {
  drawSectionHeading,
  drawKeyValueTable,
  drawDataTable,
} from "../peptideReport";

const MARGIN = 20;

function drawSummaryContent(
  doc: jsPDF,
  peptide: Peptide,
  _data: ReportData,
  ctx: RenderContext,
): void {
  let y = ctx.contentTop;

  // ── Identity table ─────────────────────────────────────────────
  y = drawSectionHeading(doc, `${peptide.id} — Prediction Summary`, y);

  const identityRows: Array<[string, string]> = [
    ["UniProt Accession", peptide.id],
    ["Protein Name", peptide.name ?? "—"],
    ["Organism", peptide.species ?? "—"],
    ["Gene", peptide.geneName ?? "—"],
    ["Sequence", peptide.sequence.length > 50 ? peptide.sequence.slice(0, 50) + "..." : peptide.sequence],
    ["Length", `${peptide.length ?? peptide.sequence.length} aa`],
  ];

  y = drawKeyValueTable(doc, identityRows, y, 45);
  y += 6;

  // ── TANGO Prediction Summary ───────────────────────────────────
  const hasTango = peptide.tangoHasData || (peptide.tango?.agg && peptide.tango.agg.length > 0);

  if (hasTango) {
    y = drawSectionHeading(doc, "TANGO Prediction Summary", y);

    const tangoHeaders = ["AGG (%)", "AMYLO", "TURN (%)", "HELIX (%)", "HELAGG (%)", "BETA (%)"];
    const tangoAgg = peptide.tango?.agg ?? [];
    const tangoBeta = peptide.tango?.beta ?? [];
    const tangoHelix = peptide.tango?.helix ?? [];
    const tangoTurn = peptide.tango?.turn ?? [];

    const maxAgg = tangoAgg.length > 0 ? Math.max(...tangoAgg) : 0;
    const maxBeta = tangoBeta.length > 0 ? Math.max(...tangoBeta) : 0;
    const maxHelix = tangoHelix.length > 0 ? Math.max(...tangoHelix) : 0;
    const maxTurn = tangoTurn.length > 0 ? Math.max(...tangoTurn) : 0;

    const tangoRow = [
      (peptide.tangoAggMax ?? maxAgg).toFixed(2),
      "—", // AMYLO not directly available; placeholder
      maxTurn.toFixed(2),
      maxHelix.toFixed(2),
      "—", // HELAGG placeholder
      (peptide.tangoBetaMax ?? maxBeta).toFixed(2),
    ];

    const colW = ctx.contentWidth / 6;
    y = drawDataTable(doc, tangoHeaders, [tangoRow], y, Array(6).fill(colW));
    y += 6;
  }

  // ── S4PRED Summary ─────────────────────────────────────────────
  const hasS4pred = peptide.s4predHasData || peptide.s4pred;

  if (hasS4pred) {
    y = drawSectionHeading(doc, "S4PRED Secondary Structure Summary", y);

    const s4rows: Array<[string, string]> = [
      ["Helix Prediction", peptide.s4predHelixPrediction === 1 ? "Yes" : peptide.s4predHelixPrediction === -1 ? "No" : "—"],
      ["Helix %", peptide.s4predHelixPercent != null ? `${peptide.s4predHelixPercent.toFixed(1)}%` : "—"],
      ["SSW Prediction", peptide.s4predSswPrediction === 1 ? "Yes" : peptide.s4predSswPrediction === -1 ? "No" : "—"],
      ["SSW Diff", peptide.s4predSswDiff != null ? peptide.s4predSswDiff.toFixed(3) : "—"],
    ];

    y = drawKeyValueTable(doc, s4rows, y, 45);
    y += 6;
  }

  // ── Per-Residue TANGO table ────────────────────────────────────
  if (hasTango && peptide.tango?.agg) {
    y = drawSectionHeading(doc, "Per-Residue TANGO Prediction", y);

    const resHeaders = ["Res", "AA", "Beta (%)", "Turn (%)", "Helix (%)", "Agg (%)"];
    const resRows: string[][] = [];

    const seq = peptide.sequence;
    const agg = peptide.tango.agg;
    const beta = peptide.tango.beta ?? [];
    const helix = peptide.tango.helix ?? [];
    const turn = peptide.tango.turn ?? [];

    for (let i = 0; i < seq.length; i++) {
      resRows.push([
        String(i + 1),
        seq[i],
        (beta[i] ?? 0).toFixed(1),
        (turn[i] ?? 0).toFixed(1),
        (helix[i] ?? 0).toFixed(3),
        (agg[i] ?? 0).toFixed(3),
      ]);
    }

    const colWidths = [15, 12, 28, 28, 28, 28];
    // Adjust to fill content width
    const totalW = colWidths.reduce((s, w) => s + w, 0);
    const scale = ctx.contentWidth / totalW;
    const scaledWidths = colWidths.map((w) => w * scale);

    y = drawDataTable(doc, resHeaders, resRows, y, scaledWidths);
  }

  // ── FF-Helix + biochem quick stats ─────────────────────────────
  if (y < ctx.footerY - 30) {
    y += 4;
    y = drawSectionHeading(doc, "Biochemical Properties", y);

    const biochemRows: Array<[string, string]> = [
      ["Hydrophobicity (FP)", peptide.hydrophobicity != null ? peptide.hydrophobicity.toFixed(3) : "—"],
      ["Charge (pH 7.4)", peptide.charge != null ? peptide.charge.toFixed(2) : "—"],
      ["μH", peptide.muH != null ? peptide.muH.toFixed(3) : "—"],
      ["FF-Helix %", peptide.ffHelixPercent != null ? `${peptide.ffHelixPercent.toFixed(1)}%` : "—"],
      ["FF-Helix Flag", peptide.ffHelixFlag === 1 ? "Candidate" : peptide.ffHelixFlag === -1 ? "Not candidate" : "—"],
      ["FF-SSW Flag", peptide.ffSswFlag === 1 ? "Candidate" : peptide.ffSswFlag === -1 ? "Not candidate" : "—"],
    ];

    y = drawKeyValueTable(doc, biochemRows, y, 45);
  }
}

export const summaryPanel: ReportPanel = {
  id: "summary",
  title: "Prediction Summary",
  render: drawSummaryContent,
};
