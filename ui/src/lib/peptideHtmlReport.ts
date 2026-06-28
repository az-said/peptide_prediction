/**
 * peptideHtmlReport.ts — Self-contained HTML report for a single peptide.
 *
 * Q15 (Peleg 2026-06-18): Generates a .html file a researcher can attach to
 * Slack/email or save next to a manuscript. Opens cold in any browser.
 *
 * Constraints:
 *   - No external CSS or JS (`<link rel="stylesheet">` / `<script src>`)
 *   - No external font links — system-ui stack
 *   - Charts rendered as inline SVG (not PNG — avoids canvas dependency)
 *   - All styles inline on elements (no class-based CSS)
 *
 * Content order:
 *   1. Header (ID, length, FASTA)
 *   2. Classification pills (Helix / FF-Helix / SSW / FF-SSW)
 *   3. Per-tool result chips
 *   4. Biochem stat cards (hydrophobicity, µH, charge)
 *   5. Sequence track (inline-colored residues)
 *   6. Helical wheel (placeholder — full SVG in Phase 2)
 *   7. S4PRED chart (inline SVG bar chart)
 *   8. TANGO aggregation chart (inline SVG bar chart)
 *   9. Footer (PVL version, build SHA, citation)
 */

import type { Peptide, SSWPrediction } from "@/types/peptide";
import { isPositionInFragments } from "@/lib/fragmentClassification";
import { SSW_RESIDUE_HEX } from "@/lib/sswColor";
import { BUILD_SHA, PVL_VERSION } from "@/stores/reproducibilityStore";

// ── Resolved colors (no CSS vars — report must be self-contained) ────────

const COLOR = {
  helix: "#4d9de0",
  ffHelix: "#22c55e",
  ssw: "#3b82f6",
  ffSsw: "#166534",
  sswMagenta: SSW_RESIDUE_HEX,
  coil: "#6b7280",
  beta: "#f97316",
  aggLow: "#14b8a6",
  aggMid: "#f59e0b",
  aggHigh: "#ef4444",
  green: "#16a34a",
  red: "#dc2626",
  muted: "#6b7280",
  border: "#e5e7eb",
  bg: "#ffffff",
  text: "#111827",
  textMuted: "#6b7280",
} as const;

const FONT = `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;

// ── Classification helpers (mirrors QuickKpiStrip logic) ─────────────────

type Verdict = "positive" | "negative" | "na";

function flagVerdict(flag: number | null | undefined): Verdict {
  if (flag === 1) return "positive";
  if (flag === -1 || flag === 0) return "negative";
  return "na";
}

function predVerdict(pred: number | null | undefined): Verdict {
  if (pred === 1) return "positive";
  if (pred === 0 || pred === -1) return "negative";
  return "na";
}

function sswVerdict(pred: SSWPrediction): Verdict {
  if (pred === 1) return "positive";
  if (pred === 0 || pred === -1) return "negative";
  return "na";
}

function verdictSymbol(v: Verdict): string {
  if (v === "positive") return "✓";
  if (v === "negative") return "✗";
  return "—";
}

function verdictColor(v: Verdict): string {
  if (v === "positive") return COLOR.green;
  if (v === "negative") return COLOR.red;
  return COLOR.muted;
}

// Mirrors QuickKpiStrip sub-label generators
function helixSub(p: Peptide): string {
  const pct = p.s4predHelixPercent;
  if (p.s4predHelixPrediction === 1) {
    return `S4PRED helix coverage ${pct != null ? pct.toFixed(0) + "%" : "≥ threshold"}.`;
  }
  if (p.s4predHelixPrediction === 0) return "No helix segment passes threshold.";
  return "S4PRED did not run.";
}

function ffHelixSub(p: Peptide): string {
  if (p.ffHelixFlag === 1) return `Helix detected, µH ${p.muH?.toFixed(2) ?? "—"} above cut-off.`;
  if (p.ffHelixFlag === -1) {
    if (p.s4predHelixPrediction !== 1) return "Needs Helix first.";
    return `Helix yes, but µH ${p.muH?.toFixed(2) ?? "—"} below cut-off.`;
  }
  return "Pending — depends on Helix and µH.";
}

function sswSub(p: Peptide): string {
  if (p.sswPrediction === 1) return "Helix and β-aggregation overlap detected.";
  if (p.sswPrediction === 0) return "No switching position found.";
  return "Requires TANGO; provider did not run.";
}

function ffSswSub(p: Peptide): string {
  if (p.ffSswFlag === 1)
    return `SSW detected, hydrophobicity ${p.hydrophobicity?.toFixed(2) ?? "—"} above cut-off.`;
  if (p.ffSswFlag === -1) {
    if (p.sswPrediction !== 1) return "Needs SSW first.";
    return `SSW yes, but hydrophobicity ${p.hydrophobicity?.toFixed(2) ?? "—"} below cut-off.`;
  }
  return "Pending — depends on SSW and hydrophobicity.";
}

// ── Per-tool chip helpers (mirrors PerToolResultChips logic) ─────────────

interface ToolChip {
  tool: string;
  value: string;
  color: string;
}

function buildToolChips(p: Peptide): ToolChip[] {
  const chips: ToolChip[] = [];

  // S4PRED
  const helixPct = p.s4predHelixPercent;
  const s4Label =
    p.s4predHelixPrediction === 1 && helixPct != null
      ? `Helix ${helixPct.toFixed(0)}%`
      : p.s4predHelixPrediction === 0
        ? "No helix"
        : "N/A";
  chips.push({ tool: "S4PRED", value: s4Label, color: COLOR.helix });

  // TANGO
  const tangoPeak = p.tangoAggMax;
  const tangoLabel = tangoPeak != null ? `Peak agg ${tangoPeak.toFixed(1)}` : "N/A";
  chips.push({ tool: "TANGO", value: tangoLabel, color: COLOR.beta });

  // FF-Helix
  chips.push({
    tool: "FF-Helix",
    value: p.ffHelixFlag === 1 ? "Candidate" : p.ffHelixFlag === -1 ? "No" : "N/A",
    color: COLOR.ffHelix,
  });

  // SSW
  chips.push({
    tool: "SSW",
    value: p.sswPrediction === 1 ? "Switch" : p.sswPrediction === 0 ? "Stable" : "N/A",
    color: COLOR.ssw,
  });

  // FF-SSW
  chips.push({
    tool: "FF-SSW",
    value: p.ffSswFlag === 1 ? "Candidate" : p.ffSswFlag === -1 ? "No" : "N/A",
    color: COLOR.ffSsw,
  });

  return chips;
}

// ── Sequence coloring (mirrors Q7 pipeline 3-class scheme) ───────────────

type PipelineClass = "helix" | "ssw" | "coiled-coil";

function classifyResidue(
  idx: number,
  helixSegs: Array<[number, number]> | null,
  sswSource: Array<[number, number]> | null
): PipelineClass {
  if (isPositionInFragments(idx, sswSource)) return "ssw";
  if (isPositionInFragments(idx, helixSegs)) return "helix";
  return "coiled-coil";
}

function pipelineColor(cls: PipelineClass): string {
  if (cls === "helix") return COLOR.helix;
  if (cls === "ssw") return COLOR.sswMagenta;
  return COLOR.coil;
}

// ── Inline SVG bar chart for per-residue data ────────────────────────────

function miniBarSvg(
  values: number[],
  options: {
    title: string;
    width?: number;
    height?: number;
    maxVal?: number;
    colorFn?: (val: number) => string;
  }
): string {
  const w = options.width ?? 700;
  const h = options.height ?? 120;
  const maxVal = options.maxVal ?? Math.max(...values, 1);
  const barW = Math.max(1, (w - 60) / values.length);
  const colorFn = options.colorFn ?? (() => COLOR.helix);

  const bars = values
    .map((v, i) => {
      const barH = (v / maxVal) * (h - 30);
      const x = 50 + i * barW;
      const y = h - 10 - barH;
      return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(barW - 0.5, 0.5).toFixed(1)}" height="${barH.toFixed(1)}" fill="${colorFn(v)}" opacity="0.85"/>`;
    })
    .join("\n    ");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="max-width:100%;height:auto;">
  <text x="25" y="12" font-family="${FONT}" font-size="11" fill="${COLOR.text}" font-weight="600">${esc(options.title)}</text>
  <line x1="50" y1="${h - 10}" x2="${w - 10}" y2="${h - 10}" stroke="${COLOR.border}" stroke-width="1"/>
  <text x="25" y="${h - 6}" font-family="${FONT}" font-size="9" fill="${COLOR.textMuted}">1</text>
  <text x="${w - 10}" y="${h - 6}" font-family="${FONT}" font-size="9" fill="${COLOR.textMuted}" text-anchor="end">${values.length}</text>
  ${bars}
</svg>`;
}

function aggBarColor(score: number): string {
  if (score < 10) return COLOR.aggLow;
  if (score < 30) return COLOR.aggMid;
  return COLOR.aggHigh;
}

// ── HTML escaping ────────────────────────────────────────────────────────

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmt(v: number | null | undefined, d = 2): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "N/A";
  return v.toFixed(d);
}

// ── Main builder ─────────────────────────────────────────────────────────

/**
 * Build a self-contained HTML string for a single peptide report.
 * No external CSS, JS, or fonts — opens cold in any browser.
 */
export function buildReportHtml(peptide: Peptide): string {
  const p = peptide;
  const isUniprot = /^[A-Z][0-9][A-Z0-9]{3}[0-9](-\d+)?$/i.test(p.id);
  const now = new Date().toISOString();
  const sha = BUILD_SHA?.slice(0, 7) ?? "dev";

  // ── 1. Header ──
  const fastaSnippet = p.sequence.slice(0, 60) + (p.sequence.length > 60 ? "..." : "");
  const headerHtml = `
    <div style="border-bottom:2px solid ${COLOR.helix};padding-bottom:16px;margin-bottom:24px;">
      <h1 style="font-family:${FONT};font-size:22px;color:${COLOR.text};margin:0 0 4px 0;">
        ${isUniprot ? `<a href="https://www.uniprot.org/uniprotkb/${esc(p.id)}/entry" style="color:${COLOR.helix};text-decoration:none;">${esc(p.id)}</a>` : esc(p.id)}
      </h1>
      <p style="font-family:${FONT};font-size:13px;color:${COLOR.textMuted};margin:0;">${p.length ?? "?"} amino acids</p>
      <p style="font-family:monospace;font-size:11px;color:${COLOR.textMuted};margin:8px 0 0;word-break:break-all;">&gt;${esc(p.id)}\n${esc(fastaSnippet)}</p>
    </div>`;

  // ── 2. Classification pills ──
  const pills = [
    {
      label: "Helix",
      verdict: predVerdict(p.s4predHelixPrediction),
      sub: helixSub(p),
      accent: COLOR.helix,
    },
    {
      label: "FF-Helix",
      verdict: flagVerdict(p.ffHelixFlag),
      sub: ffHelixSub(p),
      accent: COLOR.ffHelix,
    },
    { label: "SSW", verdict: sswVerdict(p.sswPrediction), sub: sswSub(p), accent: COLOR.ssw },
    { label: "FF-SSW", verdict: flagVerdict(p.ffSswFlag), sub: ffSswSub(p), accent: COLOR.ffSsw },
  ];
  const pillsHtml = `
    <div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:20px;">
      ${pills
        .map(
          (pill) => `
        <div style="border:1px solid ${COLOR.border};border-top:3px solid ${pill.accent};border-radius:8px;padding:10px 14px;min-width:140px;flex:1;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-family:${FONT};font-size:12px;font-weight:600;color:${COLOR.text};">${esc(pill.label)}</span>
            <span style="font-family:${FONT};font-size:14px;font-weight:700;color:${verdictColor(pill.verdict)};">${verdictSymbol(pill.verdict)}</span>
          </div>
          <p style="font-family:${FONT};font-size:11px;color:${COLOR.textMuted};margin:4px 0 0;line-height:1.4;">${esc(pill.sub)}</p>
        </div>
      `
        )
        .join("")}
    </div>`;

  // ── 3. Per-tool chips ──
  const chips = buildToolChips(p);
  const chipsHtml = `
    <div style="margin-bottom:20px;">
      <span style="font-family:${FONT};font-size:11px;color:${COLOR.textMuted};margin-right:8px;">Per-tool result:</span>
      ${chips.map((c) => `<span style="display:inline-block;font-family:${FONT};font-size:11px;border:1px solid ${c.color};color:${c.color};border-radius:4px;padding:2px 8px;margin:2px 4px 2px 0;white-space:nowrap;"><span style="opacity:0.6;">${esc(c.tool)}</span> <strong>${esc(c.value)}</strong></span>`).join("")}
    </div>`;

  // ── 4. Biochem stat cards ──
  const stats = [
    { label: "Hydrophobicity", value: fmt(p.hydrophobicity), unit: "" },
    { label: "Hydrophobic moment", value: fmt(p.muH), unit: "µH" },
    { label: "Charge", value: fmt(p.charge), unit: "(pH 7.4)" },
  ];
  const biochemHtml = `
    <div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:24px;">
      ${stats
        .map(
          (s) => `
        <div style="border:1px solid ${COLOR.border};border-radius:8px;padding:12px 16px;min-width:120px;flex:1;">
          <p style="font-family:${FONT};font-size:11px;color:${COLOR.textMuted};margin:0;">${esc(s.label)} ${s.unit ? `<span style="font-size:10px;">${esc(s.unit)}</span>` : ""}</p>
          <p style="font-family:${FONT};font-size:20px;font-weight:700;color:${COLOR.text};margin:4px 0 0;">${esc(s.value)}</p>
        </div>
      `
        )
        .join("")}
    </div>`;

  // ── 5. Sequence track (inline-colored) ──
  const helixSegs = (p.s4pred?.helixSegments ?? null) as Array<[number, number]> | null;
  const sswPrimary = (p.s4predSswFragments ?? null) as Array<[number, number]> | null;
  const betaSegs = (p.s4pred?.betaSegments ?? null) as Array<[number, number]> | null;
  const sswSource = sswPrimary && sswPrimary.length > 0 ? sswPrimary : betaSegs;
  const hasFragments = !!(helixSegs?.length || sswSource?.length);

  const residueSpans = Array.from(p.sequence)
    .map((aa, i) => {
      const cls = hasFragments ? classifyResidue(i, helixSegs, sswSource) : "coiled-coil";
      const color = pipelineColor(cls);
      const weight = cls !== "coiled-coil" ? "font-weight:600;" : "";
      return `<span style="color:${color};${weight}">${esc(aa)}</span>`;
    })
    .join("");

  const seqHtml = `
    <div style="margin-bottom:24px;">
      <h2 style="font-family:${FONT};font-size:14px;color:${COLOR.text};margin:0 0 8px;">Predicted Secondary Structure</h2>
      <div style="display:flex;gap:12px;margin-bottom:8px;">
        <span style="font-family:${FONT};font-size:11px;color:${COLOR.textMuted};"><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${COLOR.helix};vertical-align:middle;margin-right:4px;"></span>Helix</span>
        <span style="font-family:${FONT};font-size:11px;color:${COLOR.textMuted};"><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${COLOR.sswMagenta};vertical-align:middle;margin-right:4px;"></span>SSW</span>
        <span style="font-family:${FONT};font-size:11px;color:${COLOR.textMuted};"><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${COLOR.coil};vertical-align:middle;margin-right:4px;"></span>Coiled-coil</span>
      </div>
      <div style="font-family:monospace;font-size:12px;line-height:1.8;background:#f9fafb;border-radius:8px;padding:12px 16px;word-break:break-all;">
        ${residueSpans}
      </div>
    </div>`;

  // ── 6. Helical wheel placeholder ──
  const wheelHtml =
    p.length != null && p.length <= 40
      ? `<div style="margin-bottom:24px;">
        <h2 style="font-family:${FONT};font-size:14px;color:${COLOR.text};margin:0 0 8px;">Helical Wheel Projection</h2>
        <p style="font-family:${FONT};font-size:11px;color:${COLOR.textMuted};">Helical wheel visualization available in the web interface.</p>
      </div>`
      : "";

  // ── 7. S4PRED chart ──
  const s4predSvg =
    p.s4pred?.pH && p.s4pred.pH.length > 0
      ? miniBarSvg(
          p.s4pred.pH.map((v) => (v ?? 0) * 100),
          {
            title: "S4PRED P(Helix) per residue",
            maxVal: 100,
            colorFn: () => COLOR.helix,
          }
        )
      : "";

  const s4predHtml = s4predSvg ? `<div style="margin-bottom:24px;">${s4predSvg}</div>` : "";

  // ── 8. TANGO aggregation chart ──
  const tangoSvg =
    p.tango?.agg && p.tango.agg.length > 0
      ? miniBarSvg(p.tango.agg, {
          title: "Per-Residue Aggregation Propensity (TANGO)",
          maxVal: 100,
          colorFn: aggBarColor,
        })
      : "";

  const tangoHtml = tangoSvg ? `<div style="margin-bottom:24px;">${tangoSvg}</div>` : "";

  // ── 9. Footer ──
  const footerHtml = `
    <div style="border-top:1px solid ${COLOR.border};padding-top:16px;margin-top:32px;">
      <p style="font-family:${FONT};font-size:10px;color:${COLOR.textMuted};margin:0;">
        Generated by PVL on ${esc(now)} · commit ${esc(sha)}
      </p>
      <p style="font-family:${FONT};font-size:10px;color:${COLOR.textMuted};margin:4px 0 0;">
        Peptide Visual Lab (PVL) v${esc(PVL_VERSION)} — an integrated prediction and visualization web server
        for peptide aggregation, structural switching, and fibril formation analysis.
      </p>
      <p style="font-family:${FONT};font-size:10px;color:${COLOR.textMuted};margin:4px 0 0;">
        If citing PVL, please reference: Ragonis-Bachar P., Azaizah S. et al. (in preparation).
      </p>
    </div>`;

  // ── Assemble ──
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>PVL Report — ${esc(p.id)}</title>
</head>
<body style="font-family:${FONT};max-width:800px;margin:0 auto;padding:32px 24px;color:${COLOR.text};background:${COLOR.bg};">
${headerHtml}
${pillsHtml}
${chipsHtml}
${biochemHtml}
${seqHtml}
${wheelHtml}
${s4predHtml}
${tangoHtml}
${footerHtml}
</body>
</html>`;
}

/**
 * Download the HTML report using the same Blob → anchor.click pattern
 * as handleDownloadFASTA in PeptideViewer.tsx.
 */
export function downloadReportHtml(peptide: Peptide): void {
  const html = buildReportHtml(peptide);
  const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${peptide.id}_pvl_report.html`;
  link.click();
  URL.revokeObjectURL(url);
}
