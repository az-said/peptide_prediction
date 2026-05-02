/**
 * CorrelationMatrix — Configurable Pearson correlation matrix for peptide metrics.
 *
 * Computes pairwise Pearson correlations across a configurable set of numeric
 * metrics, with support for missing-value strategies and triangle display modes.
 *
 * Terminology: "database" not "cohort" throughout (Peleg FIX-003/FIX-016).
 *
 * @see docs/active/PELEG_REVIEW_TASKS.md FIX-022, FIX-023
 */

import { useMemo } from "react";
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
}

// ── Default metric list ──

// PELEG-Q-FIX-022: Charge handling — current implementation uses signed charge.
// Verify with Peleg whether |Charge| or signed is preferred for correlation purposes.

export const DEFAULT_CORRELATION_METRICS: CorrelationMetric[] = [
  { id: "hydrophobicity", label: "Hydrophobicity", getValue: (p) => p.hydrophobicity },
  { id: "muH", label: "μH", getValue: (p) => p.muH },
  { id: "charge", label: "Charge", getValue: (p) => p.charge },
  { id: "length", label: "Length", getValue: (p) => p.length },
  { id: "s4predHelixPct", label: "S4PRED helix", getValue: (p) => p.s4predHelixPercent },
];
// EXCLUDED per Peleg FIX-023:
//   - SSW score (no real meaning, threshold-bound)
//   - SSW diff (no real meaning, threshold-bound)
//   - Agg Max (Peleg flagged as not appropriate for matrix)
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

// ── Component ──

export function CorrelationMatrix({
  peptides,
  metrics,
  missingStrategy = "pairwise-exclude",
  display = "upper",
  colorScale = "diverging-rb",
  cellRenderer,
  minSampleSize = 5,
}: CorrelationMatrixProps) {
  const { matrix, sampleSizes } = useMemo(
    () => computeCorrelationMatrix(peptides, metrics, missingStrategy),
    [peptides, metrics, missingStrategy],
  );

  const k = metrics.length;

  if (k === 0) {
    return (
      <Card className="rounded-xl border-[hsl(var(--border))]">
        <CardContent className="py-8 text-center text-muted-foreground text-sm">
          No metrics configured for correlation analysis.
        </CardContent>
      </Card>
    );
  }

  function shouldRenderCell(row: number, col: number): boolean {
    if (display === "full") return true;
    if (display === "upper") return col >= row;
    return row >= col; // lower
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

    if (row === col) {
      return {
        backgroundColor: interpolateColor(1, colorScale),
        color: textColorForBg(1),
      };
    }

    if (n < minSampleSize || !Number.isFinite(val)) {
      return { color: "var(--muted-foreground, #9ca3af)" };
    }

    return {
      backgroundColor: interpolateColor(val, colorScale),
      color: textColorForBg(val),
    };
  }

  function getCellTooltip(row: number, col: number): string {
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

  const negLabel = colorScale === "diverging-rb" ? "#ef4444" : "#3b82f6";
  const posLabel = colorScale === "diverging-rb" ? "#3b82f6" : "#f97316";

  return (
    <Card className="rounded-xl border-[hsl(var(--border))]">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Correlation matrix</CardTitle>
        <CardDescription>
          Pairwise Pearson correlations across database metrics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <TooltipProvider delayDuration={200}>
          <div className="overflow-x-auto">
            <table
              className="border-collapse text-xs"
              style={{ tableLayout: "fixed" }}
              role="grid"
              aria-label="Correlation matrix"
            >
              {/* Column headers */}
              <thead>
                <tr>
                  <th className="p-1" />
                  {metrics.map((m) => (
                    <th
                      key={m.id}
                      className="p-1 text-center font-medium text-muted-foreground"
                      style={{
                        width: "4rem",
                        maxWidth: "5rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={m.label}
                    >
                      {m.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {metrics.map((rowMetric, row) => (
                  <tr key={rowMetric.id}>
                    {/* Row header */}
                    <th
                      className="p-1 text-right font-medium text-muted-foreground pr-2"
                      style={{
                        whiteSpace: "nowrap",
                        maxWidth: "7rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={rowMetric.label}
                    >
                      {rowMetric.label}
                    </th>

                    {metrics.map((colMetric, col) => {
                      if (!shouldRenderCell(row, col)) {
                        return (
                          <td
                            key={colMetric.id}
                            className="p-1"
                            style={{ width: "4rem" }}
                          />
                        );
                      }

                      return (
                        <td
                          key={colMetric.id}
                          className="p-1"
                          style={{ width: "4rem" }}
                        >
                          <UITooltip>
                            <TooltipTrigger asChild>
                              <div
                                className="flex items-center justify-center rounded text-center font-mono cursor-default"
                                style={{
                                  ...getCellStyle(row, col),
                                  width: "100%",
                                  height: "2rem",
                                  fontSize: "0.7rem",
                                }}
                                title={getCellTooltip(row, col)}
                                role="gridcell"
                                aria-label={getCellTooltip(row, col)}
                              >
                                {renderCellContent(row, col)}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs max-w-xs">
                              {getCellTooltip(row, col)}
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
        <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
          <span>−1</span>
          <div
            className="h-3 rounded"
            style={{
              width: "10rem",
              background: `linear-gradient(to right, ${negLabel}, #ffffff, ${posLabel})`,
            }}
          />
          <span>+1</span>
        </div>
        <p className="text-[9px] text-muted-foreground/60 text-center">
          Pearson correlation coefficient (r). Cells with N &lt; {minSampleSize} shown as &ldquo;&mdash;&rdquo;.
        </p>
      </CardContent>
    </Card>
  );
}

export default CorrelationMatrix;
