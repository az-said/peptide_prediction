/**
 * TANGO per-residue aggregation heatmap.
 *
 * Shows per-residue Aggregation, Beta, and Helix prediction scores from TANGO
 * as color-coded bars. Scientists use this to identify aggregation-prone regions
 * in the sequence.
 *
 * Color scale: teal (0-10%) → amber (10-30%) → red (30%+)
 */
import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
} from "recharts";

/** Map a TANGO aggregation score to a proportional color.
 *
 *  OQ3 (Peleg confirmed 2026-06-23): aggregation is magenta. The chart used to
 *  shade per bar (teal / amber / red) which collided with the orange used
 *  consistently for β-strand elsewhere. Single-hue magenta gradient: faint
 *  for low scores, saturated for the danger zone. Same #E040FB token used for
 *  the SSW Mol* overlay — both encode "this position is doing something
 *  interesting", just in different views, so consistent hue reinforces the
 *  meaning.
 */
function aggBarColor(score: number): string {
  if (score < 10) return "rgba(224, 64, 251, 0.35)"; // faint magenta — low
  if (score < 30) return "rgba(224, 64, 251, 0.65)"; // medium magenta — moderate
  return "#E040FB"; // full magenta — high
}
import { ChartExportButtons } from "@/components/ChartExportButtons";
import { TangoTooltip } from "@/components/charts/TangoTooltip";
import { useThresholdStore } from "@/stores/thresholdStore";

interface AggregationHeatmapProps {
  sequence: string;
  aggCurve: number[];
  betaCurve?: number[];
  helixCurve?: number[];
  s4predBetaCurve?: number[];
  peptideId: string;
}

export function AggregationHeatmap({
  sequence,
  aggCurve,
  betaCurve,
  helixCurve,
  s4predBetaCurve,
  peptideId,
}: AggregationHeatmapProps) {
  const [showAll, setShowAll] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  // PELEG-Q6-PARTIAL: hardcoded "5%" replaced with the live store value.
  const tangoAggThreshold = useThresholdStore((s) => s.active.tangoAggregationThreshold);

  const data = useMemo(() => {
    return aggCurve.map((agg, i) => ({
      pos: i + 1,
      aa: sequence[i] || "?",
      Aggregation: agg,
      Beta: betaCurve?.[i] ?? 0,
      Helix: helixCurve?.[i] ?? 0,
    }));
  }, [aggCurve, betaCurve, helixCurve, sequence]);

  // Summary: max agg score and region (safe for empty/large arrays)
  const maxAgg = useMemo(() => aggCurve.reduce((max, v) => (v > max ? v : max), 0), [aggCurve]);
  const hotspotCount = useMemo(
    () => aggCurve.filter((v) => v > tangoAggThreshold).length,
    [aggCurve, tangoAggThreshold]
  );

  return (
    <div className="space-y-4">
      {/* Summary stats — PELEG-Q6-PARTIAL: configurable threshold from store */}
      <div className="flex gap-4 text-sm">
        <div className="px-3 py-1.5 rounded bg-muted/50">
          <span className="text-muted-foreground">Peak aggregation: </span>
          <span
            className={`font-semibold ${
              maxAgg > 50
                ? "text-destructive"
                : maxAgg > tangoAggThreshold
                  ? "text-orange-500"
                  : "text-green-600"
            }`}
          >
            {maxAgg.toFixed(1)}
          </span>
        </div>
        <div className="px-3 py-1.5 rounded bg-muted/50">
          <span className="text-muted-foreground">
            Residues &gt; {tangoAggThreshold.toFixed(1)}:{" "}
          </span>
          <span
            className={`font-semibold ${hotspotCount > 5 ? "text-orange-500" : "text-muted-foreground"}`}
          >
            {hotspotCount}/{aggCurve.length}
          </span>
        </div>
      </div>

      {/* Q12 (Peleg 2026-06-18 PDF1 p21): secondary structure FIRST,
          aggregation SECOND. */}
      {showAll && (betaCurve?.length || helixCurve?.length) ? (
        <div className="space-y-2" data-chart-export>
          <h3 className="text-sm font-semibold">TANGO Secondary Structure (Helix + Beta)</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} barGap={0} barCategoryGap={0}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="pos"
                  tickCount={Math.min(data.length, 20)}
                  tick={{ fontSize: 10 }}
                />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                <Tooltip content={<TangoTooltip />} />
                <Legend />
                <Bar dataKey="Helix" fill="hsl(var(--helix, 0 80% 50%))" opacity={0.7} />
                <Bar dataKey="Beta" fill="hsl(var(--beta, 210 80% 50%))" opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ChartExportButtons filename={`${peptideId}-tango-secondary-structure`} />
        </div>
      ) : null}

      {/* Aggregation bar chart */}
      <div className="space-y-2" data-chart-export>
        <h3 className="text-sm font-semibold">Per-Residue Aggregation Propensity</h3>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={0} barCategoryGap={0}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="pos"
                tickCount={Math.min(data.length, 20)}
                tick={{ fontSize: 10 }}
                label={{
                  value: "Residue position",
                  position: "insideBottom",
                  offset: -2,
                  fontSize: 11,
                }}
              />
              <YAxis
                label={{
                  value: "TANGO score",
                  angle: -90,
                  position: "insideLeft",
                  fontSize: 11,
                }}
                tick={{ fontSize: 10 }}
                domain={[0, 100]}
              />
              <Tooltip content={<TangoTooltip />} />
              <Bar dataKey="Aggregation" opacity={0.85}>
                {data.map((entry, idx) => (
                  <Cell key={idx} fill={aggBarColor(entry.Aggregation)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <ChartExportButtons filename={`${peptideId}-tango-aggregation`} />
      </div>

      {/* Toggle links */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {betaCurve?.length || helixCurve?.length ? (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            {showAll ? "Hide Beta & Helix curves" : "Show Beta & Helix curves"}
          </button>
        ) : null}
        {betaCurve?.length || s4predBetaCurve?.length ? (
          <button
            onClick={() => setShowOverlay(!showOverlay)}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            {showOverlay
              ? "Hide Aggregation–Structure Overlay"
              : "Show Aggregation–Structure Overlay"}
          </button>
        ) : null}
      </div>

      {/* Aggregation–Structure Overlay (rendered outside toggle row) */}
      {showOverlay && (betaCurve?.length || s4predBetaCurve?.length) && (
        <div className="space-y-2" data-chart-export>
          <h3 className="text-sm font-semibold">Aggregation–Structure Overlay</h3>
          <p className="text-xs text-muted-foreground">
            Regions where aggregation (amber) and beta propensity (blue/cyan) overlap suggest
            aggregation-prone regions.
          </p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={aggCurve.map((agg, i) => ({
                  pos: i + 1,
                  aa: sequence[i] || "?",
                  Aggregation: agg,
                  "TANGO Beta": betaCurve?.[i] ?? null,
                  "S4PRED P(β)": s4predBetaCurve?.[i] != null ? s4predBetaCurve[i] * 100 : null,
                }))}
                margin={{ top: 10, right: 20, bottom: 20, left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="pos"
                  tickCount={Math.min(aggCurve.length, 20)}
                  tick={{ fontSize: 10 }}
                  label={{
                    value: "Residue position",
                    position: "insideBottom",
                    offset: -2,
                    fontSize: 11,
                  }}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  label={{ value: "TANGO score", angle: -90, position: "insideLeft", fontSize: 11 }}
                />
                <ReferenceLine
                  y={tangoAggThreshold}
                  stroke="#eab308"
                  strokeDasharray="6 3"
                  label={{
                    value: `${tangoAggThreshold.toFixed(1)}`,
                    position: "right",
                    fontSize: 9,
                    fill: "#eab308",
                  }}
                />
                <Tooltip content={<TangoTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Aggregation"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                />
                {betaCurve?.length && (
                  <Line
                    type="monotone"
                    dataKey="TANGO Beta"
                    stroke="#3b82f6"
                    strokeWidth={1.5}
                    strokeDasharray="4 2"
                    dot={false}
                  />
                )}
                {s4predBetaCurve?.length && (
                  <Line
                    type="monotone"
                    dataKey="S4PRED P(β)"
                    stroke="#06b6d4"
                    strokeWidth={1.5}
                    strokeDasharray="4 2"
                    dot={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <ChartExportButtons filename={`${peptideId}-agg-structure-overlay`} />
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        TANGO predicts aggregation propensity per residue. Higher scores indicate regions with
        higher aggregation propensity.
      </div>
    </div>
  );
}
