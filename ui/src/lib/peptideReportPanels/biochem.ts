/**
 * Biochem panel — Page 3: Biophysical property details.
 *
 * Contents:
 * - Hydrophobicity / charge / μH summary table
 * - FF-Helix classification details
 * - FF-SSW classification details
 * - Aggregation hotspot summary (from TANGO agg curve)
 */

import type { jsPDF } from "jspdf";
import type { Peptide } from "@/types/peptide";
import type { ReportData, ReportPanel, RenderContext } from "../peptideReport";
import {
  drawSectionHeading,
  drawKeyValueTable,
  drawDataTable,
  drawParagraph,
} from "../peptideReport";

function drawBiochemContent(
  doc: jsPDF,
  peptide: Peptide,
  _data: ReportData,
  ctx: RenderContext,
): void {
  let y = ctx.contentTop;

  // ── Biophysical properties ─────────────────────────────────────
  y = drawSectionHeading(doc, "Biophysical Properties", y);

  const biophysRows: Array<[string, string]> = [
    ["Hydrophobicity (Fauchere–Pliska)", peptide.hydrophobicity != null ? peptide.hydrophobicity.toFixed(3) : "—"],
    ["Charge (pH 7.4)", peptide.charge != null ? peptide.charge.toFixed(2) : "—"],
    ["Hydrophobic Moment (μH)", peptide.muH != null ? peptide.muH.toFixed(3) : "—"],
    ["Sequence Length", `${peptide.length ?? peptide.sequence.length} aa`],
  ];

  y = drawKeyValueTable(doc, biophysRows, y, 55);
  y += 8;

  // ── FF-Helix classification ────────────────────────────────────
  y = drawSectionHeading(doc, "FF-Helix Classification", y);

  const ffHelixRows: Array<[string, string]> = [
    ["FF-Helix Flag", peptide.ffHelixFlag === 1 ? "Candidate" : peptide.ffHelixFlag === -1 ? "Not candidate" : "—"],
    ["FF-Helix %", peptide.ffHelixPercent != null ? `${peptide.ffHelixPercent.toFixed(1)}%` : "—"],
    ["FF-Helix Score", peptide.ffHelixScore != null ? peptide.ffHelixScore.toFixed(3) : "—"],
  ];

  if (peptide.ffHelixFragments && peptide.ffHelixFragments.length > 0) {
    const fragStr = peptide.ffHelixFragments
      .map((f) => {
        if (Array.isArray(f) && f.length === 2) return `${f[0]}–${f[1]}`;
        if ("start" in f && "end" in f) return `${f.start}–${f.end}`;
        return String(f);
      })
      .join(", ");
    ffHelixRows.push(["Helix Fragments", fragStr]);
  }

  y = drawKeyValueTable(doc, ffHelixRows, y, 55);
  y += 8;

  // ── FF-SSW classification ──────────────────────────────────────
  y = drawSectionHeading(doc, "FF-SSW Classification", y);

  const ffSswRows: Array<[string, string]> = [
    ["FF-SSW Flag", peptide.ffSswFlag === 1 ? "Candidate" : peptide.ffSswFlag === -1 ? "Not candidate" : "—"],
    ["FF-SSW Score", peptide.ffSswScore != null ? peptide.ffSswScore.toFixed(3) : "—"],
    ["SSW Prediction", peptide.sswPrediction === 1 ? "Positive" : peptide.sswPrediction === -1 ? "Negative" : peptide.sswPrediction === 0 ? "Uncertain" : "—"],
    ["SSW Score", peptide.sswScore != null ? peptide.sswScore.toFixed(3) : "—"],
    ["SSW Diff", peptide.sswDiff != null ? peptide.sswDiff.toFixed(3) : "—"],
  ];

  y = drawKeyValueTable(doc, ffSswRows, y, 55);
  y += 8;

  // ── Aggregation hotspot summary ────────────────────────────────
  const tangoAgg = peptide.tango?.agg;
  if (tangoAgg && tangoAgg.length > 0) {
    y = drawSectionHeading(doc, "Aggregation Hotspot Summary", y);

    // Find residues with agg > 5% (common TANGO threshold)
    const hotspots: Array<{ start: number; end: number; peak: number }> = [];
    let inHotspot = false;
    let start = 0;
    let peak = 0;

    for (let i = 0; i < tangoAgg.length; i++) {
      if (tangoAgg[i] > 5) {
        if (!inHotspot) {
          inHotspot = true;
          start = i;
          peak = tangoAgg[i];
        } else {
          peak = Math.max(peak, tangoAgg[i]);
        }
      } else if (inHotspot) {
        hotspots.push({ start: start + 1, end: i, peak });
        inHotspot = false;
      }
    }
    if (inHotspot) {
      hotspots.push({ start: start + 1, end: tangoAgg.length, peak });
    }

    if (hotspots.length > 0) {
      const headers = ["Region", "Residues", "Peak Agg (%)"];
      const rows = hotspots.map((h, idx) => [
        `Hotspot ${idx + 1}`,
        `${h.start}–${h.end}`,
        h.peak.toFixed(2),
      ]);

      const colWidths = [40, 40, 40];
      const totalW = colWidths.reduce((s, w) => s + w, 0);
      const scale = ctx.contentWidth / totalW;
      const scaledWidths = colWidths.map((w) => w * scale);

      y = drawDataTable(doc, headers, rows, y, scaledWidths);
    } else {
      y = drawParagraph(
        doc,
        "No aggregation hotspots detected (threshold: 5% aggregation propensity).",
        y,
      );
    }
  }
}

export const biochemPanel: ReportPanel = {
  id: "biochem",
  title: "Biophysical & Classification Details",
  render: drawBiochemContent,
};
