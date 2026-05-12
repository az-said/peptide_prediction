/**
 * peptideReport.ts — Multi-page scientific PDF report renderer.
 *
 * Produces a Nature-supplement-quality PDF for a single peptide.
 * Pure-frontend: uses jsPDF for layout, no server-side rendering.
 *
 * Architecture:
 * ─────────────────────────────────────────────────────────────────
 * Each page is a "panel" — a function that draws onto a jsPDF instance.
 * Panels are registered in PANEL_REGISTRY and called sequentially.
 * If a panel's data is unavailable, it renders a graceful fallback.
 *
 * Visual style (matches Galagos reference):
 * - Header band: dark blue (#1e3a8a), white text
 * - Body: sans-serif for tables, serif for paragraphs
 * - Tables: dark blue header, striped rows
 * - Footer: "Peptide Visual Lab v{version} · {permalink} · Generated {timestamp}"
 * - Page size: A4 (210×297mm), 20mm margins
 *
 * @example
 * ```ts
 * import { renderPeptideReport } from "@/lib/peptideReport";
 *
 * const blob = await renderPeptideReport(peptide, {
 *   version: "0.8.0",
 *   permalink: "https://pvl.example.com/results?pv=1&dh=abc...",
 *   datasetName: "Staphylococcus 2023",
 * });
 * // trigger download
 * const url = URL.createObjectURL(blob);
 * ```
 */

import { jsPDF } from "jspdf";
import type { Peptide } from "@/types/peptide";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Aggregated data needed across panels. Backend provides some of this. */
export interface ReportData {
  /** PVL version string */
  version: string;
  /** Full permalink URL for this analysis */
  permalink?: string;
  /** Dataset name (e.g., "Staphylococcus 2023") */
  datasetName?: string;
  /** Threshold config used */
  thresholds?: {
    muHCutoff: number;
    hydroCutoff: number;
  };
  /** Build SHA */
  buildSha?: string;
}

/** Panel = one page/section of the report */
export interface ReportPanel {
  /** Panel identifier */
  id: string;
  /** Human-readable title for the page header */
  title: string;
  /** Render this panel onto the jsPDF document */
  render: (doc: jsPDF, peptide: Peptide, data: ReportData, ctx: RenderContext) => void;
  /** Return false to skip this panel when data is unavailable */
  shouldRender?: (peptide: Peptide, data: ReportData) => boolean;
}

/** Shared rendering context passed to all panels */
export interface RenderContext {
  /** Current page number (1-indexed) */
  pageNumber: number;
  /** Total pages (set after dry run) */
  totalPages: number;
  /** Page dimensions in mm */
  pageWidth: number;
  pageHeight: number;
  /** Margins in mm */
  margin: number;
  /** Usable content width */
  contentWidth: number;
  /** Y position of content start (below header) */
  contentTop: number;
  /** Y position of footer */
  footerY: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const REPORT_COLORS = {
  /** Dark blue header band */
  headerBg: "#1e3a8a",
  /** Header text */
  headerText: "#ffffff",
  /** Section heading text */
  sectionHeading: "#1e3a8a",
  /** Table header */
  tableHeader: "#1e3a8a",
  tableHeaderText: "#ffffff",
  /** Table stripe */
  tableStripe: "#f0f4ff",
  /** Body text */
  bodyText: "#1f2937",
  /** Muted text */
  mutedText: "#6b7280",
  /** Border */
  border: "#d1d5db",
  /** PVL palette */
  helix: "#a855f7",
  ssw: "#f59e0b",
  ffHelix: "#22c55e",
  ffSsw: "#ef4444",
} as const;

/** A4 in mm */
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 20;
const CONTENT_W = PAGE_W - 2 * MARGIN;
const HEADER_H = 16; // header band height
const FOOTER_H = 12;
const CONTENT_TOP = MARGIN + HEADER_H + 8;
const FOOTER_Y = PAGE_H - MARGIN - FOOTER_H;

// ---------------------------------------------------------------------------
// Shared drawing helpers (exported for panel use)
// ---------------------------------------------------------------------------

/** Draw the dark blue header band with page title + page number */
export function drawPageHeader(
  doc: jsPDF,
  title: string,
  ctx: RenderContext,
): void {
  doc.setFillColor(REPORT_COLORS.headerBg);
  doc.rect(0, 0, ctx.pageWidth, MARGIN + HEADER_H, "F");

  doc.setTextColor(REPORT_COLORS.headerText);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(title, MARGIN, MARGIN + 10);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const pageStr = `Page ${ctx.pageNumber}`;
  doc.text(pageStr, ctx.pageWidth - MARGIN, MARGIN + 10, { align: "right" });
}

/** Draw the footer with version, permalink, timestamp */
export function drawPageFooter(
  doc: jsPDF,
  data: ReportData,
  ctx: RenderContext,
): void {
  const y = ctx.footerY + 6;
  doc.setDrawColor(REPORT_COLORS.border);
  doc.line(MARGIN, ctx.footerY, ctx.pageWidth - MARGIN, ctx.footerY);

  doc.setFontSize(7);
  doc.setTextColor(REPORT_COLORS.mutedText);
  doc.setFont("helvetica", "normal");

  const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");
  const parts: string[] = [`Peptide Visual Lab v${data.version}`];
  if (data.permalink) {
    // Truncate long permalink
    const maxLen = 60;
    const pl =
      data.permalink.length > maxLen
        ? data.permalink.slice(0, maxLen) + "..."
        : data.permalink;
    parts.push(pl);
  }
  parts.push(`Generated ${timestamp}`);

  doc.text(parts.join("  ·  "), MARGIN, y);
}

/** Draw a section heading (colored, left-aligned) */
export function drawSectionHeading(
  doc: jsPDF,
  text: string,
  y: number,
): number {
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(REPORT_COLORS.sectionHeading);
  doc.text(text, MARGIN, y);
  return y + 8;
}

/** Draw a simple key-value table (2 columns, striped) */
export function drawKeyValueTable(
  doc: jsPDF,
  rows: Array<[string, string]>,
  startY: number,
  keyWidth = 50,
): number {
  const rowH = 8;
  let y = startY;

  for (let i = 0; i < rows.length; i++) {
    const [key, value] = rows[i];
    // Stripe
    if (i % 2 === 0) {
      doc.setFillColor(REPORT_COLORS.tableStripe);
      doc.rect(MARGIN, y - 5, CONTENT_W, rowH, "F");
    }
    // Key
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(REPORT_COLORS.bodyText);
    doc.text(key, MARGIN + 2, y);
    // Value
    doc.setFont("helvetica", "normal");
    doc.text(value, MARGIN + keyWidth, y);
    y += rowH;
  }

  return y + 4;
}

/** Draw a data table with header + rows */
export function drawDataTable(
  doc: jsPDF,
  headers: string[],
  rows: string[][],
  startY: number,
  colWidths?: number[],
): number {
  const headerH = 8;
  const rowH = 7;
  const numCols = headers.length;
  const defaultColW = CONTENT_W / numCols;
  const widths = colWidths ?? headers.map(() => defaultColW);

  let y = startY;

  // Header
  doc.setFillColor(REPORT_COLORS.tableHeader);
  doc.rect(MARGIN, y - 5, CONTENT_W, headerH, "F");
  doc.setTextColor(REPORT_COLORS.tableHeaderText);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");

  let x = MARGIN + 2;
  for (let c = 0; c < numCols; c++) {
    doc.text(headers[c], x, y);
    x += widths[c];
  }
  y += headerH;

  // Rows
  doc.setTextColor(REPORT_COLORS.bodyText);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  for (let r = 0; r < rows.length; r++) {
    // Stripe
    if (r % 2 === 0) {
      doc.setFillColor(REPORT_COLORS.tableStripe);
      doc.rect(MARGIN, y - 5, CONTENT_W, rowH, "F");
    }
    x = MARGIN + 2;
    for (let c = 0; c < numCols; c++) {
      doc.text(rows[r][c] ?? "", x, y);
      x += widths[c];
    }
    y += rowH;

    // Page overflow guard (leave room for footer)
    if (y > FOOTER_Y - 10 && r < rows.length - 1) {
      // Truncate with notice
      doc.setFont("helvetica", "italic");
      doc.setTextColor(REPORT_COLORS.mutedText);
      doc.text(`... ${rows.length - r - 1} more rows (see full data in PVL dashboard)`, MARGIN + 2, y);
      y += rowH;
      break;
    }
  }

  return y + 4;
}

/** Draw a paragraph of body text with word wrapping */
export function drawParagraph(
  doc: jsPDF,
  text: string,
  startY: number,
  fontSize = 9,
): number {
  doc.setFontSize(fontSize);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(REPORT_COLORS.bodyText);

  const lines = doc.splitTextToSize(text, CONTENT_W);
  const lineH = fontSize * 0.45;
  let y = startY;

  for (const line of lines) {
    if (y > FOOTER_Y - 5) break; // don't overrun footer
    doc.text(line, MARGIN, y);
    y += lineH;
  }

  return y + 4;
}

// ---------------------------------------------------------------------------
// Panel registry (lazy-imported from peptideReportPanels/)
// ---------------------------------------------------------------------------

// Import panels — each is a ReportPanel object
import { coverPanel } from "./peptideReportPanels/cover";
import { summaryPanel } from "./peptideReportPanels/summary";
import { biochemPanel } from "./peptideReportPanels/biochem";
import { interpretationPanel } from "./peptideReportPanels/interpretation";
import { methodsPanel } from "./peptideReportPanels/methods";
import { referencesPanel } from "./peptideReportPanels/references";

/** Ordered panel registry. Add new panels here. */
export const PANEL_REGISTRY: ReportPanel[] = [
  coverPanel,
  summaryPanel,
  biochemPanel,
  interpretationPanel,
  methodsPanel,
  referencesPanel,
];

// ---------------------------------------------------------------------------
// Main renderer
// ---------------------------------------------------------------------------

/**
 * Render a multi-page scientific PDF report for a single peptide.
 *
 * @returns PDF as Blob
 */
export async function renderPeptideReport(
  peptide: Peptide,
  reportData: ReportData,
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Filter panels to those that have data
  const activePanels = PANEL_REGISTRY.filter(
    (panel) => !panel.shouldRender || panel.shouldRender(peptide, reportData),
  );

  const totalPages = activePanels.length;

  for (let i = 0; i < activePanels.length; i++) {
    if (i > 0) doc.addPage();

    const ctx: RenderContext = {
      pageNumber: i + 1,
      totalPages,
      pageWidth: PAGE_W,
      pageHeight: PAGE_H,
      margin: MARGIN,
      contentWidth: CONTENT_W,
      contentTop: CONTENT_TOP,
      footerY: FOOTER_Y,
    };

    const panel = activePanels[i];

    // Header + footer
    drawPageHeader(doc, panel.title, ctx);
    drawPageFooter(doc, reportData, ctx);

    // Panel content
    try {
      panel.render(doc, peptide, reportData, ctx);
    } catch (err) {
      // Graceful fallback — don't crash the whole report
      doc.setFontSize(11);
      doc.setTextColor(REPORT_COLORS.mutedText);
      doc.setFont("helvetica", "italic");
      doc.text(
        `Data for "${panel.title}" is not available.`,
        MARGIN,
        ctx.contentTop + 10,
      );
      console.warn(`[peptideReport] Panel "${panel.id}" failed:`, err);
    }
  }

  return doc.output("blob");
}

/**
 * Convenience: render and trigger browser download.
 */
export async function downloadPeptideReport(
  peptide: Peptide,
  reportData: ReportData,
  filename?: string,
): Promise<void> {
  const blob = await renderPeptideReport(peptide, reportData);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename ?? `PVL_Report_${peptide.id}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
