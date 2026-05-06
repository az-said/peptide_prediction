/**
 * DistributionChart — Configurable univariate distribution histogram.
 *
 * Handles all of PVL's distribution charts with consistent visual language:
 * - Bar style (canonical, consistent) or lollipop style (special cases)
 * - Always renders Y-axis label (Peleg FIX-019)
 * - Optional threshold line from store (not hardcoded — Peleg FIX-019)
 * - Optional summary text below chart
 * - Click-to-filter via chartSelectionStore
 *
 * Bar is the canonical PVL distribution style; lollipop is available
 * for special cases via `style='lollipop'`.
 *
 * @see docs/active/PELEG_FEEDBACK_INSTRUCTIONS.md FIX-019, FIX-021
 */

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  ComposedChart,
  Scatter,
} from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { CHART_COLORS } from "@/lib/chartConfig";

// ── Types ──

export interface DistributionMetric {
  /** Unique metric ID */
  id: string;
  /** Display label (used in tooltips) */
  label: string;
  /** Unit suffix (e.g., "aa", "%") */
  unit?: string;
  /** X-axis label */
  axisX: string;
  /** Y-axis label (default "Count") */
  axisY?: string;
}

export interface DistributionThreshold {
  /** Threshold value */
  value: number;
  /** Display label for the threshold line */
  label: string;
}

export interface PreBinnedData {
  /** Bin label (e.g., "0–5%") */
  label: string;
  /** Count of items in this bin */
  count: number;
  /** Item IDs for click-to-filter */
  ids: string[];
  /** Optional per-bin color (for gradient lollipops) */
  color?: string;
}

export interface DistributionChartProps {
  /** Raw numeric values — component computes bins. Mutually exclusive with `binnedData`. */
  data?: number[];
  /** Pre-binned data. Mutually exclusive with `data`. */
  binnedData?: PreBinnedData[];
  /** All peptides — needed to map raw values back to IDs for click-to-filter */
  peptideValues?: { id: string; value: number }[];
  /** Metric metadata */
  metric: DistributionMetric;
  /** Chart style. Bar is canonical for PVL consistency. Default 'bar'. */
  style?: "bar" | "lollipop";
  /** Optional threshold line */
  threshold?: DistributionThreshold;
  /** Summary mode: auto-generate a summary line below chart */
  summary?: "count-above" | "count-below";
  /** Number of bins for auto-binning (default 10) */
  bins?: number;
  /** Bar fill color (default uses chartConfig primary) */
  color?: string;
  /** Sequential color scale for lollipop mode (green→red gradient) */
  colorScale?: string[];
  /** Height of the chart container — overrides the mode default. */
  height?: number;
  /**
   * PELEG-FIX-2-RESOLVED (2026-05-06):
   *   "preview" — compact inline mode (height 180, smaller axis fonts, no
   *               summary line). Used as the inline render in ResultsCharts.
   *   "expanded" — full-size drill-down mode (current behaviour: height 300,
   *                regular fonts, summary line). Used inside ChartInspector.
   * Default: "expanded" (preserves the existing call sites that rely on the
   * full-size rendering).
   */
  mode?: "preview" | "expanded";
  /** Callback when a bin is clicked */
  onBinClick?: (ids: string[], binLabel: string) => void;
}

// ── Default color scales ──

const DEFAULT_BAR_COLOR = CHART_COLORS.scatterPrimary;
const DEFAULT_LOLLIPOP_COLORS = [
  "#22c55e",
  "#84cc16",
  "#eab308",
  "#f97316",
  "#ef4444",
  "#dc2626",
  "#991b1b",
];

// ── Binning helper ──

interface ComputedBin {
  label: string;
  count: number;
  ids: string[];
  color?: string;
  binStart: number;
}

function autoBin(
  values: number[],
  peptideValues: { id: string; value: number }[] | undefined,
  binCount: number,
  unit: string | undefined
): ComputedBin[] {
  if (values.length === 0) return [];

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1e-6, max - min);
  const binSize = span / binCount;

  return Array.from({ length: binCount }, (_, i) => {
    const binStart = min + i * binSize;
    const binEnd = binStart + binSize;

    // Find matching peptide IDs
    const ids: string[] = [];
    if (peptideValues) {
      for (const pv of peptideValues) {
        const v = pv.value;
        const inBin = i < binCount - 1 ? v >= binStart && v < binEnd : v >= binStart && v <= binEnd;
        if (inBin) ids.push(pv.id);
      }
    }

    const isInt = Number.isInteger(min) && Number.isInteger(max);
    const fmt = isInt ? (n: number) => String(Math.round(n)) : (n: number) => n.toFixed(2);
    const suffix = unit ? ` ${unit}` : "";

    return {
      label: `${fmt(binStart)}–${fmt(binEnd)}${suffix}`,
      count:
        ids.length ||
        values.filter((v) =>
          i < binCount - 1 ? v >= binStart && v < binEnd : v >= binStart && v <= binEnd
        ).length,
      ids,
      binStart,
    };
  }).sort((a, b) => a.binStart - b.binStart);
}

// ── Component ──

export function DistributionChart({
  data,
  binnedData,
  peptideValues,
  metric,
  style = "bar",
  threshold,
  summary,
  bins = 10,
  color,
  colorScale,
  height,
  mode = "expanded",
  onBinClick,
}: DistributionChartProps) {
  // PELEG-FIX-2-RESOLVED: preview vs expanded styling tokens.
  const isPreview = mode === "preview";
  const effectiveHeight = height ?? (isPreview ? 180 : 300);
  const tickFontSize = isPreview ? 9 : 11;
  const axisLabelFontSize = isPreview ? 10 : 12;
  const margin = isPreview
    ? { top: 8, right: 8, bottom: 24, left: 24 }
    : { top: 20, right: 30, bottom: 35, left: 40 };
  const lollipopBarSize = isPreview ? 2 : 3;
  const lollipopDotR = isPreview ? 4 : 6;
  // In preview mode we hide the summary text below the chart — the
  // expanded view in the drill-down still shows it.
  const showSummary = !isPreview;
  // Compute bins from raw data or use pre-binned
  const chartBins = useMemo<ComputedBin[]>(() => {
    if (binnedData) {
      return binnedData.map((b, i) => ({
        ...b,
        binStart: i,
      }));
    }
    if (data) {
      return autoBin(data, peptideValues, bins, metric.unit);
    }
    return [];
  }, [data, binnedData, peptideValues, bins, metric.unit]);

  // Summary computation
  const summaryText = useMemo(() => {
    if (!summary || !threshold || !data) return null;
    const total = data.length;
    if (total === 0) return null;

    const count =
      summary === "count-above"
        ? data.filter((v) => v > threshold.value).length
        : data.filter((v) => v < threshold.value).length;
    const pct = ((count / total) * 100).toFixed(0);
    const direction = summary === "count-above" ? "above" : "below";

    return `${count} of ${total} peptides (${pct}%) ${direction} ${threshold.label} (${threshold.value})`;
  }, [summary, threshold, data]);

  if (chartBins.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-sm text-muted-foreground"
        style={{ height: effectiveHeight }}
      >
        No data available
      </div>
    );
  }

  const fillColor = color || DEFAULT_BAR_COLOR;
  const lollipopColors = colorScale || DEFAULT_LOLLIPOP_COLORS;
  const chartConfig = { [metric.id]: { label: metric.label, color: fillColor } };
  const yLabel = metric.axisY || "Count";

  // Find threshold bin index for ReferenceLine
  const thresholdBinIdx =
    threshold && !binnedData && data
      ? chartBins.findIndex(
          (b, i) =>
            i < chartBins.length - 1 &&
            b.binStart <= threshold.value &&
            chartBins[i + 1]?.binStart > threshold.value
        )
      : -1;

  return (
    <div>
      <ChartContainer
        config={chartConfig}
        className={`h-[${effectiveHeight}px]`}
        style={{ height: effectiveHeight }}
      >
        <ResponsiveContainer width="100%" height="100%">
          {style === "lollipop" ? (
            <ComposedChart data={chartBins} margin={margin}>
              <CartesianGrid strokeOpacity={0.3} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: tickFontSize }}
                interval="preserveStartEnd"
                label={{
                  value: metric.axisX,
                  position: "insideBottom",
                  offset: -20,
                  fontSize: axisLabelFontSize,
                  fill: "hsl(var(--muted-foreground))",
                }}
              />
              <YAxis
                allowDecimals={false}
                label={{
                  value: yLabel,
                  angle: -90,
                  position: "insideLeft",
                  offset: -5,
                  fontSize: axisLabelFontSize,
                  fill: "hsl(var(--muted-foreground))",
                }}
              />
              <ChartTooltip
                content={({ payload }) => {
                  const item = payload?.[0]?.payload;
                  if (!item) return null;
                  return (
                    <div className="bg-background border border-border rounded p-2 text-xs">
                      <p className="font-medium">
                        {metric.label}: {item.label}
                      </p>
                      <p>
                        {item.count} peptide{item.count !== 1 ? "s" : ""}
                      </p>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="count"
                barSize={lollipopBarSize}
                cursor={onBinClick ? "pointer" : undefined}
                onClick={(_: unknown, idx: number) => {
                  const bin = chartBins[idx];
                  if (bin?.ids?.length && onBinClick) {
                    onBinClick(bin.ids, bin.label);
                  }
                }}
              >
                {chartBins.map((d, i) => (
                  <Cell
                    key={i}
                    fill={d.color || lollipopColors[Math.min(i, lollipopColors.length - 1)]}
                  />
                ))}
              </Bar>
              <Scatter
                dataKey="count"
                cursor={onBinClick ? "pointer" : undefined}
                onClick={(_: unknown, idx: number) => {
                  const bin = chartBins[idx];
                  if (bin?.ids?.length && onBinClick) {
                    onBinClick(bin.ids, bin.label);
                  }
                }}
              >
                {chartBins.map((d, i) => (
                  <Cell
                    key={i}
                    fill={d.color || lollipopColors[Math.min(i, lollipopColors.length - 1)]}
                    r={lollipopDotR}
                  />
                ))}
              </Scatter>
            </ComposedChart>
          ) : (
            <BarChart data={chartBins} margin={margin}>
              <CartesianGrid strokeOpacity={0.3} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: tickFontSize }}
                interval="preserveStartEnd"
                tickFormatter={(v: string) => v.split("–")[0]}
                label={{
                  value: metric.axisX,
                  position: "insideBottom",
                  offset: -20,
                  fontSize: axisLabelFontSize,
                  fill: "hsl(var(--muted-foreground))",
                }}
              />
              <YAxis
                allowDecimals={false}
                label={{
                  value: yLabel,
                  angle: -90,
                  position: "insideLeft",
                  offset: -5,
                  fontSize: axisLabelFontSize,
                  fill: "hsl(var(--muted-foreground))",
                }}
              />
              {threshold && thresholdBinIdx >= 0 && (
                <ReferenceLine
                  x={chartBins[thresholdBinIdx]?.label}
                  stroke="#eab308"
                  strokeDasharray="6 3"
                  label={{
                    value: threshold.label,
                    position: "top",
                    fontSize: 10,
                    fill: "#eab308",
                  }}
                />
              )}
              <ChartTooltip
                content={({ payload }) => {
                  const item = payload?.[0]?.payload;
                  if (!item) return null;
                  return (
                    <div className="bg-background border border-border rounded p-2 text-xs">
                      <p className="font-medium">
                        {metric.label}: {item.label}
                      </p>
                      <p>
                        {item.count} peptide{item.count !== 1 ? "s" : ""}
                      </p>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="count"
                fill={fillColor}
                cursor={onBinClick ? "pointer" : undefined}
                onClick={(_: unknown, idx: number) => {
                  const bin = chartBins[idx];
                  if (bin?.ids?.length && onBinClick) {
                    onBinClick(bin.ids, bin.label);
                  }
                }}
              >
                {binnedData &&
                  chartBins.map((d, i) =>
                    d.color ? <Cell key={i} fill={d.color} /> : <Cell key={i} fill={fillColor} />
                  )}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </ChartContainer>

      {/* Summary line — Peleg FIX-019: add threshold-based summary.
          PELEG-FIX-2-RESOLVED: hidden in "preview" mode to keep inline cards
          compact; rendered in "expanded" mode (drill-down). */}
      {showSummary && summaryText && (
        <p className="mt-2 text-xs text-muted-foreground text-center">{summaryText}</p>
      )}
    </div>
  );
}

export default DistributionChart;
