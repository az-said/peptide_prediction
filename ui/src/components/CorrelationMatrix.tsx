/**
 * CorrelationMatrix — Premium Pearson correlation matrix for peptide metrics.
 *
 * Design: Bloomberg/Stripe/Linear quality grid with:
 *   - Configurable header treatment (rotate | wrap | short)
 *   - 56x56px minimum cells with diverging red-white-blue palette
 *   - Row + column header highlighting on hover
 *   - Hatched pattern for insufficient sample sizes
 *   - Horizontal gradient legend with tick marks
 *   - Recessed diagonal treatment
 *
 * Terminology: "database" not "cohort" throughout (Peleg FIX-003/FIX-016).
 *
 * @see docs/active/PELEG_REVIEW_TASKS.md FIX-022, FIX-023
 */

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Peptide } from "@/types/peptide";

// ── Types ──

export interface CorrelationMetric {
  id: string;
  label: string;
  shortLabel?: string;
  getValue: (p: Peptide) => number | null | undefined;
}

export type MissingStrategy = "pairwise-exclude" | "listwise-exclude" | "never-zero";

export interface CorrelationMatrixProps {
  peptides: Peptide[];
  metrics: CorrelationMetric[];
  missingStrategy?: MissingStrategy; // default 'pairwise-exclude'
  display?: "upper" | "lower" | "full"; // default 'upper'
  colorScale?: "diverging-rb" | "diverging-bo"; // default 'diverging-rb' (red-blue)
  cellRenderer?: (val: number, n: number) => React.ReactNode;
  minSampleSize?: number; // default 5
  headerStyle?: "rotate" | "wrap" | "short"; // default 'rotate'
}

// ── Default metric list ──

// PELEG-Q-FIX-022: Charge handling — current implementation uses signed charge.
// Verify with Peleg whether |Charge| or signed is preferred for correlation purposes.

// 2026-06-07 (Peleg Zoom 2026-06-04): correlation matrix updated.
//   - Replace S4PRED helix PERCENT with S4PRED helix SCORE (raw probability from
//     S4PRED). Peleg: "use the score not the %; the % is a feature we display
//     elsewhere; correlation against the score is the canonical one."
//   - Add TANGO helix max, TANGO beta max, TANGO aggregation max as metrics.
//   - Add FF-Helix flag and FF-SSW flag as BINARY correlation TARGETS — researchers
//     see "which features correlate with being an FF candidate" (Peleg's
//     "something we are testing" framing).
//   - TANGO agg max was previously EXCLUDED per FIX-023, but Peleg re-included
//     it in the Zoom — the matrix should expose TANGO's actual output so
//     researchers see the gap between TANGO's raw aggregation signal and PVL's
//     re-interpreted fibril-formation flags.
export const DEFAULT_CORRELATION_METRICS: CorrelationMetric[] = [
  { id: "hydrophobicity", label: "Hydrophobicity", shortLabel: "Hydro", getValue: (p) => p.hydrophobicity },
  { id: "muH", label: "μH", shortLabel: "μH", getValue: (p) => p.muH },
  { id: "charge", label: "Charge", shortLabel: "Charge", getValue: (p) => p.charge },
  { id: "length", label: "Length", shortLabel: "Length", getValue: (p) => p.length },
  // 2026-06-07: switched from s4predHelixPercent to s4predHelixScore per Peleg.
  // The "score" is the raw S4PRED probability (average helix probability over
  // detected segments); the "percent" was a derived sequence-coverage ratio
  // that obscured the underlying prediction confidence.
  { id: "s4predHelixScore", label: "S4PRED helix score", shortLabel: "Helix sc.", getValue: (p) => p.s4predHelixScore },
  { id: "tangoHelixMax", label: "TANGO helix max", shortLabel: "TANGO H", getValue: (p) => p.tangoHelixMax },
  { id: "tangoBetaMax", label: "TANGO β max", shortLabel: "TANGO β", getValue: (p) => p.tangoBetaMax },
  { id: "tangoAggMax", label: "TANGO aggregation max", shortLabel: "TANGO agg", getValue: (p) => p.tangoAggMax },
  // FF flags as binary correlation targets — researchers see "which features
  // correlate with being an FF candidate" (Peleg "as something we are testing").
  // Render as 0/1 numeric so Pearson correlation is meaningful.
  { id: "ffHelixFlag", label: "FF-Helix candidate", shortLabel: "FF-Helix", getValue: (p) => (p.ffHelixFlag === 1 ? 1 : p.ffHelixFlag === -1 ? 0 : null) },
  { id: "ffSswFlag", label: "FF-SSW candidate", shortLabel: "FF-SSW", getValue: (p) => (p.ffSswFlag === 1 ? 1 : p.ffSswFlag === -1 ? 0 : null) },
];
// EXCLUDED per Peleg FIX-023 (still excluded):
//   - SSW score (no real meaning, threshold-bound)
//   - SSW diff (no real meaning, threshold-bound)
//   - FF-Helix % removed from label (no "%" suffix — Peleg FIX-023)

// ── Correlation computation ──

function isFiniteNumber(v: number | null | undefined): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function pearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n < 2) return NaN;

  let sumX = 0;
  let sumY = 0;
  for (let i = 0; i < n; i++) {
    sumX += xs[i];
    sumY += ys[i];
  }
  const meanX = sumX / n;
  const meanY = sumY / n;

  let num = 0;
  let denomX = 0;
  let denomY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  const denom = Math.sqrt(denomX * denomY);
  if (denom === 0) return NaN;
  return num / denom;
}

export function computeCorrelationMatrix(
  peptides: Peptide[],
  metrics: CorrelationMetric[],
  missingStrategy: MissingStrategy = "pairwise-exclude",
): { matrix: number[][]; sampleSizes: number[][] } {
  const k = metrics.length;
  const matrix: number[][] = Array.from({ length: k }, () => Array(k).fill(NaN));
  const sampleSizes: number[][] = Array.from({ length: k }, () => Array(k).fill(0));

  // Extract raw values for each metric
  const rawValues: (number | null | undefined)[][] = metrics.map((m) =>
    peptides.map((p) => m.getValue(p)),
  );

  if (missingStrategy === "listwise-exclude") {
    // Find peptides where ALL metrics have valid values
    const validIndices: number[] = [];
    for (let row = 0; row < peptides.length; row++) {
      const allValid = rawValues.every((col) => isFiniteNumber(col[row]));
      if (allValid) validIndices.push(row);
    }

    const filtered: number[][] = rawValues.map((col) =>
      validIndices.map((i) => col[i] as number),
    );

    for (let i = 0; i < k; i++) {
      for (let j = 0; j < k; j++) {
        sampleSizes[i][j] = filtered[i].length;
        if (i === j) {
          matrix[i][j] = 1;
        } else {
          matrix[i][j] = pearson(filtered[i], filtered[j]);
        }
      }
    }
  } else {
    // pairwise-exclude and never-zero both use pairwise logic
    if (missingStrategy === "never-zero") {
      // Warn if any null values exist that might have been zero-imputed
      const hasNulls = rawValues.some((col) => col.some((v) => !isFiniteNumber(v)));
      if (hasNulls) {
        console.warn(
          "[CorrelationMatrix] never-zero strategy: null values detected. " +
            "These are excluded pairwise. No zeros were imputed.",
        );
      }
    }

    for (let i = 0; i < k; i++) {
      for (let j = 0; j < k; j++) {
        if (i === j) {
          matrix[i][j] = 1;
          sampleSizes[i][j] = rawValues[i].filter(isFiniteNumber).length;
          continue;
        }

        // Collect pairs where both values are valid
        const xs: number[] = [];
        const ys: number[] = [];
        for (let row = 0; row < peptides.length; row++) {
          const xi = rawValues[i][row];
          const yi = rawValues[j][row];
          if (isFiniteNumber(xi) && isFiniteNumber(yi)) {
            xs.push(xi);
            ys.push(yi);
          }
        }

        sampleSizes[i][j] = xs.length;
        matrix[i][j] = pearson(xs, ys);
      }
    }
  }

  return { matrix, sampleSizes };
}

// ── Color interpolation ──

function interpolateColor(r: number, scale: "diverging-rb" | "diverging-bo"): string {
  if (!Number.isFinite(r)) return "transparent";

  // Clamp to [-1, 1]
  const clamped = Math.max(-1, Math.min(1, r));

  // -1 = negColor, 0 = white, +1 = posColor
  const negColor = scale === "diverging-rb" ? [239, 68, 68] : [59, 130, 246]; // red or blue
  const posColor = scale === "diverging-rb" ? [59, 130, 246] : [249, 115, 22]; // blue or orange
  const white = [255, 255, 255];

  let rgb: number[];
  if (clamped < 0) {
    const t = Math.abs(clamped);
    rgb = white.map((w, i) => Math.round(w + (negColor[i] - w) * t));
  } else {
    const t = clamped;
    rgb = white.map((w, i) => Math.round(w + (posColor[i] - w) * t));
  }

  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

function textColorForBg(r: number): string {
  // Use dark text for light backgrounds (near 0), white for saturated ends
  if (!Number.isFinite(r)) return "inherit";
  return Math.abs(r) > 0.6 ? "#fff" : "#1f2937";
}

// ── Hatched background for insufficient samples ──

const HATCH_PATTERN =
  "repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 6px)";

// ── Component ──

export function CorrelationMatrix({
  peptides,
  metrics,
  missingStrategy = "pairwise-exclude",
  display = "upper",
  colorScale = "diverging-rb",
  cellRenderer,
  minSampleSize = 5,
  headerStyle = "rotate",
}: CorrelationMatrixProps) {
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);

  const { matrix, sampleSizes } = useMemo(
    () => computeCorrelationMatrix(peptides, metrics, missingStrategy),
    [peptides, metrics, missingStrategy],
  );

  const k = metrics.length;

  // Empty state: no metrics
  if (k === 0) {
    return (
      <Card className="rounded-xl border-[hsl(var(--border))]">
        <CardContent className="py-8 text-center text-muted-foreground text-sm">
          No metrics configured for correlation analysis.
        </CardContent>
      </Card>
    );
  }

  // Empty state: fewer than 2 peptides
  if (peptides.length < 2) {
    return (
      <Card className="rounded-xl border-[hsl(var(--border))]">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Correlation matrix</CardTitle>
          <CardDescription>
            Pairwise Pearson correlations across database metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground text-sm">
          Need at least 2 peptides for correlation analysis.
        </CardContent>
      </Card>
    );
  }

  function shouldRenderCell(row: number, col: number): boolean {
    if (display === "full") return true;
    if (display === "upper") return col >= row;
    return row >= col; // lower
  }

  /** Resolve display label based on headerStyle */
  function getHeaderLabel(metric: CorrelationMetric): string {
    if (headerStyle === "short" && metric.shortLabel) {
      return metric.shortLabel;
    }
    return metric.label;
  }

  function renderCellContent(row: number, col: number): React.ReactNode {
    if (row === col) return "1.00";

    const val = matrix[row][col];
    const n = sampleSizes[row][col];

    if (n < minSampleSize || !Number.isFinite(val)) {
      return "—"; // em dash
    }

    if (cellRenderer) return cellRenderer(val, n);

    // Use minus sign (U+2212) for negative values
    const formatted = val < 0
      ? `−${Math.abs(val).toFixed(2)}`
      : val.toFixed(2);
    return formatted;
  }

  function getCellStyle(row: number, col: number): React.CSSProperties {
    if (!shouldRenderCell(row, col)) return {};

    const val = matrix[row][col];
    const n = sampleSizes[row][col];

    // Diagonal: recessed/muted treatment
    if (row === col) {
      return {
        backgroundColor: "hsl(var(--muted) / 0.3)",
        color: "hsl(var(--muted-foreground))",
      };
    }

    // Insufficient sample size: hatched pattern
    if (n < minSampleSize || !Number.isFinite(val)) {
      return {
        background: HATCH_PATTERN,
        color: "hsl(var(--muted-foreground))",
      };
    }

    return {
      backgroundColor: interpolateColor(val, colorScale),
      color: textColorForBg(val),
      transition: "background-color 0.3s",
    };
  }

  function getCellTooltipContent(row: number, col: number): React.ReactNode {
    if (row === col) {
      return (
        <div className="space-y-0.5">
          <div className="font-medium">{metrics[row].label}</div>
          <div className="text-muted-foreground">Self-correlation (always 1.00)</div>
        </div>
      );
    }

    const val = matrix[row][col];
    const n = sampleSizes[row][col];

    if (n < minSampleSize) {
      return (
        <div className="space-y-0.5">
          <div className="font-medium">{metrics[row].label} vs {metrics[col].label}</div>
          <div className="text-muted-foreground">
            Insufficient sample size (n &lt; {minSampleSize})
          </div>
          <div className="text-xs text-muted-foreground/70">N = {n}</div>
        </div>
      );
    }

    if (!Number.isFinite(val)) {
      return (
        <div className="space-y-0.5">
          <div className="font-medium">{metrics[row].label} vs {metrics[col].label}</div>
          <div className="text-muted-foreground">Cannot compute correlation</div>
        </div>
      );
    }

    return (
      <div className="space-y-0.5">
        <div className="font-medium">{metrics[row].label} vs {metrics[col].label}</div>
        <div className="font-mono">r = {val.toFixed(3)}</div>
        <div className="text-xs text-muted-foreground/70">N = {n}</div>
      </div>
    );
  }

  function getCellAriaLabel(row: number, col: number): string {
    if (row === col) return `${metrics[row].label} (self-correlation)`;

    const val = matrix[row][col];
    const n = sampleSizes[row][col];

    if (n < minSampleSize) {
      return `${metrics[row].label} vs ${metrics[col].label}: insufficient data (N=${n}, min=${minSampleSize})`;
    }

    if (!Number.isFinite(val)) {
      return `${metrics[row].label} vs ${metrics[col].label}: cannot compute`;
    }

    return `${metrics[row].label} vs ${metrics[col].label}: r=${val.toFixed(3)}, N=${n}`;
  }

  const isRowHighlighted = (row: number) => hoveredCell !== null && hoveredCell.row === row;
  const isColHighlighted = (col: number) => hoveredCell !== null && hoveredCell.col === col;

  const negLabel = colorScale === "diverging-rb" ? "#ef4444" : "#3b82f6";
  const posLabel = colorScale === "diverging-rb" ? "#3b82f6" : "#f97316";

  // Column header styles based on headerStyle prop
  const colHeaderStyle: React.CSSProperties =
    headerStyle === "rotate"
      ? {
          writingMode: "horizontal-tb" as const,
          transform: "rotate(-45deg)",
          transformOrigin: "bottom left",
          whiteSpace: "nowrap" as const,
          height: "5rem",
          verticalAlign: "bottom",
        }
      : headerStyle === "wrap"
        ? {
            whiteSpace: "normal" as const,
            textWrap: "balance" as const,
            width: "5rem",
            wordBreak: "break-word" as const,
          }
        : {
            whiteSpace: "nowrap" as const,
          };

  return (
    <Card className="rounded-xl border-[hsl(var(--border))]">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Correlation matrix</CardTitle>
        <CardDescription>
          Pairwise Pearson correlations across database metrics
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-5">
        <TooltipProvider delayDuration={150}>
          <div className="flex justify-center">
            <table
              className="text-sm"
              style={{
                borderCollapse: "separate",
                borderSpacing: "2px",
              }}
              role="grid"
              aria-label="Correlation matrix"
            >
              {/* Column headers */}
              <thead>
                <tr>
                  <th
                    className="p-1"
                    style={{
                      width: headerStyle === "wrap" ? "7rem" : "auto",
                    }}
                  />
                  {metrics.map((m, col) => (
                    <th
                      key={m.id}
                      className={`p-1 text-center font-medium text-xs ${
                        isColHighlighted(col)
                          ? "text-foreground bg-accent/50 rounded"
                          : "text-muted-foreground"
                      }`}
                      style={{
                        ...colHeaderStyle,
                        minWidth: "56px",
                        transition: "background-color 0.2s, color 0.2s",
                      }}
                      title={m.label}
                      data-testid={`col-header-${m.id}`}
                    >
                      <span
                        style={
                          headerStyle === "rotate"
                            ? { display: "inline-block", paddingBottom: "4px" }
                            : undefined
                        }
                      >
                        {getHeaderLabel(m)}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {metrics.map((rowMetric, row) => (
                  <tr key={rowMetric.id}>
                    {/* Row header */}
                    <th
                      className={`p-1 text-right font-medium text-xs pr-3 ${
                        isRowHighlighted(row)
                          ? "text-foreground bg-accent/50 rounded"
                          : "text-muted-foreground"
                      }`}
                      style={{
                        whiteSpace: "nowrap",
                        transition: "background-color 0.2s, color 0.2s",
                      }}
                      title={rowMetric.label}
                      data-testid={`row-header-${rowMetric.id}`}
                    >
                      {getHeaderLabel(rowMetric)}
                    </th>

                    {metrics.map((colMetric, col) => {
                      if (!shouldRenderCell(row, col)) {
                        return (
                          <td
                            key={colMetric.id}
                            className="p-0"
                            style={{ minWidth: "56px", minHeight: "56px" }}
                          />
                        );
                      }

                      const isDiagonal = row === col;
                      const n = sampleSizes[row][col];
                      const isInsufficient =
                        !isDiagonal && (n < minSampleSize || !Number.isFinite(matrix[row][col]));

                      return (
                        <td
                          key={colMetric.id}
                          className="p-0"
                          style={{ minWidth: "56px" }}
                        >
                          <UITooltip>
                            <TooltipTrigger asChild>
                              <div
                                className={`flex items-center justify-center rounded cursor-default font-mono text-sm ${
                                  isDiagonal ? "text-muted-foreground" : ""
                                }`}
                                style={{
                                  ...getCellStyle(row, col),
                                  minWidth: "56px",
                                  minHeight: "56px",
                                  border: "1px solid hsl(var(--border) / 0.15)",
                                }}
                                role="gridcell"
                                aria-label={getCellAriaLabel(row, col)}
                                data-testid={
                                  isDiagonal
                                    ? `cell-diagonal-${row}`
                                    : isInsufficient
                                      ? `cell-hatched-${row}-${col}`
                                      : `cell-${row}-${col}`
                                }
                                onMouseEnter={() => setHoveredCell({ row, col })}
                                onMouseLeave={() => setHoveredCell(null)}
                              >
                                {renderCellContent(row, col)}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              className="text-xs max-w-xs"
                            >
                              {getCellTooltipContent(row, col)}
                            </TooltipContent>
                          </UITooltip>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TooltipProvider>

        {/* Color scale legend */}
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[11px] font-medium text-muted-foreground">
            Pearson correlation coefficient
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground font-mono">{"−1"}</span>
            <div className="relative" style={{ width: "200px", height: "12px" }}>
              <div
                className="w-full h-full rounded-sm"
                style={{
                  background: `linear-gradient(to right, ${negLabel}, #ffffff 50%, ${posLabel})`,
                }}
              />
              {/* Tick marks at -0.5, 0, +0.5 */}
              {[0.25, 0.5, 0.75].map((pct) => (
                <div
                  key={pct}
                  className="absolute top-0"
                  style={{
                    left: `${pct * 100}%`,
                    width: "1px",
                    height: "12px",
                    backgroundColor: "hsl(var(--muted-foreground) / 0.3)",
                  }}
                />
              ))}
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">+1</span>
          </div>
          {/* Tick labels */}
          <div className="flex justify-between text-[9px] text-muted-foreground/60 font-mono" style={{ width: "200px" }}>
            <span>{"−0.5"}</span>
            <span>0</span>
            <span>+0.5</span>
          </div>
          <p className="text-[9px] text-muted-foreground/50 text-center mt-0.5">
            Pairwise complete observations (N shown on hover). Cells with N &lt; {minSampleSize} shown as &ldquo;&mdash;&rdquo;.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default CorrelationMatrix;
