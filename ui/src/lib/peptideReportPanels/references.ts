/**
 * References panel — Last page of the report.
 *
 * Contents:
 * - Literature references for TANGO, S4PRED, FF-Helix, biophysics scales
 * - PVL citation / DOI placeholder
 * - Software versions
 */

import type { jsPDF } from "jspdf";
import type { Peptide } from "@/types/peptide";
import type { ReportData, ReportPanel, RenderContext } from "../peptideReport";
import {
  REPORT_COLORS,
  drawSectionHeading,
  drawParagraph,
  drawKeyValueTable,
} from "../peptideReport";

const MARGIN = 20;

type Reference = {
  key: string;
  text: string;
};

const REFERENCES: Reference[] = [
  {
    key: "1",
    text:
      "Fernandez-Escamilla AM, Rousseau F, Schymkowitz J, Serrano L. " +
      "Prediction of sequence-dependent and mutational effects on the aggregation of peptides and proteins. " +
      "Nat Biotechnol. 2004;22(10):1302-1306.",
  },
  {
    key: "2",
    text:
      "Linding R, Schymkowitz J, Rousseau F, Diella F, Serrano L. " +
      "A comparative study of the relationship between protein structure and beta-aggregation in " +
      "globular and intrinsically disordered proteins. J Mol Biol. 2004;342(1):345-353.",
  },
  {
    key: "3",
    text:
      "Moffat L, Jones DT. " +
      "Increasing the accuracy of single sequence prediction methods using a deep semi-supervised learning framework. " +
      "Bioinformatics. 2021;37(21):3744-3751.",
  },
  {
    key: "4",
    text:
      "Fauchere JL, Pliska V. " +
      "Hydrophobic parameters pi of amino-acid side chains from the partitioning of " +
      "N-acetyl-amino-acid amides. Eur J Med Chem. 1983;18(4):369-375.",
  },
  {
    key: "5",
    text:
      "Eisenberg D, Weiss RM, Terwilliger TC. " +
      "The helical hydrophobic moment: a measure of the amphiphilicity of a helix. " +
      "Nature. 1982;299(5881):371-374.",
  },
];

function drawReferencesContent(
  doc: jsPDF,
  _peptide: Peptide,
  data: ReportData,
  ctx: RenderContext,
): void {
  let y = ctx.contentTop;

  y = drawSectionHeading(doc, "References", y);

  // ── Literature references ──────────────────────────────────────
  doc.setFontSize(8);
  for (const ref of REFERENCES) {
    if (y > ctx.footerY - 15) break;

    // Reference number
    doc.setFont("helvetica", "bold");
    doc.setTextColor(REPORT_COLORS.sectionHeading);
    doc.text(`[${ref.key}]`, MARGIN, y);

    // Reference text (wrapped)
    doc.setFont("helvetica", "normal");
    doc.setTextColor(REPORT_COLORS.bodyText);
    const lines = doc.splitTextToSize(ref.text, ctx.contentWidth - 12);
    const lineH = 3.6;
    for (const line of lines) {
      if (y > ctx.footerY - 10) break;
      doc.text(line, MARGIN + 10, y);
      y += lineH;
    }
    y += 3;
  }

  y += 4;

  // ── PVL citation ───────────────────────────────────────────────
  if (y < ctx.footerY - 30) {
    y = drawSectionHeading(doc, "Citing PVL", y);
    y = drawParagraph(
      doc,
      "If you use Peptide Visual Lab in your research, please cite: " +
      "Azaizah S, et al. Peptide Visual Lab: an integrated web platform for peptide " +
      "aggregation and structural prediction analysis. (Manuscript in preparation). " +
      "DOI: Pending — Zenodo submission in progress.",
      y,
      8,
    );
    y += 4;
  }

  // ── Software versions ──────────────────────────────────────────
  if (y < ctx.footerY - 25) {
    y = drawSectionHeading(doc, "Software Versions", y);

    const versionRows: Array<[string, string]> = [
      ["Peptide Visual Lab", `v${data.version}`],
      ["PDF Renderer", "jsPDF v3.x"],
    ];

    if (data.buildSha) {
      versionRows.push(["Build SHA", data.buildSha.slice(0, 12)]);
    }

    y = drawKeyValueTable(doc, versionRows, y, 50);
  }
}

export const referencesPanel: ReportPanel = {
  id: "references",
  title: "References",
  render: drawReferencesContent,
};
