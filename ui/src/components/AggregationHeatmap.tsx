/**
 * TANGO per-residue aggregation heatmap.
 *
 * OQ6 (Peleg confirmed 2026-06-23): per-plot toggle rows under each plot's
 * title. Each plot controls its own visible series. No unified bottom row.
 *
 * Layout per plot:
 *   <h3>Plot title</h3>
 *   <Row of toggles controlling THIS plot's series>
 *   <Chart>
 *
 * OQ3 (Peleg confirmed 2026-06-23): aggregation bars use a single-hue magenta
 * gradient. The chart used to shade per bar (teal / amber / red) which
 * collided with the orange used consistently for β-strand elsewhere.
 * Same #E040FB token used for the SSW Mol* overlay — both encode
 * "this position is doing something interesting", consistent hue reinforces
 * the meaning.
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
import { ChartExportButtons } from "@/components/ChartExportButtons";
import { TangoTooltip } from "@/components/charts/TangoTooltip";
import { Toggle } from "@/components/ui/toggle";
import { useThresholdStore } from "@/stores/thresholdStore";

/** OQ3: single-hue magenta gradient (low → moderate → high). */
function aggBarColor(score: number): string {
  if (score < 10) return "rgba(224, 64, 251, 0.35)";
  if (score < 30) return "rgba(224, 64, 251, 0.65)";
  return "#E040FB";
}

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
  // Per-plot toggle states (OQ6)
  const [showSecondaryPlot, setShowSecondaryPlot] = useState(false);
  const [showHelixSeries, setShowHelixSeries] = useState(true);
  const [showBetaSeries, setShowBetaSeries] = useState(true);

  const [showOverlayPlot, setShowOverlayPlot] = useState(false);
  const [overlayAgg, setOverlayAgg] = useState(true);
  const [overlayBeta, setOverlayBeta] = useState(true);
  const [overlayHelix, setOverlayHelix] = useState(true);
  const [overlayS4pred, setOverlayS4pred] = useState(true);

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

  const maxAgg = useMemo(() => aggCurve.reduce((max, v) => (v > max ? v : max), 0), [aggCurve]);
  const hotspotCount = useMemo(
    () => aggCurve.filter((v) => v > tangoAggThreshold).length,
    [aggCurve, tangoAggThreshold]
  );

  const hasSecondary = !!(betaCurve?.length || helixCurve?.length);
  const hasOverlayData = !!(betaCurve?.length || s4predBetaCurve?.length || helixCurve?.length);

  return (
    <div className="space-y-4">
      {/* Summary stats */}
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

      {/* Plot 1: Secondary Structure (Helix + Beta)
          OQ6: title → toggle row → chart.
          Q12 (Peleg 2026-06-18 PDF1 p21): secondary structure FIRST, aggregation SECOND. */}
      {hasSecondary && (
        <div className="space-y-2" data-chart-export>
          <h3 className="text-sm font-semibold">TANGO Secondary Structure (Helix + Beta)</h3>
          <div className="flex items-center gap-2">
            <Toggle
              variant="outline"
              size="sm"
              pressed={showSecondaryPlot}
              onPressedChange={setShowSecondaryPlot}
              className="text-xs h-7 px-2.5 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
              data-testid="toggle-secondary-plot"
            >
              {showSecondaryPlot ? "Hide" : "Show"} chart
            </Toggle>
            {showSecondaryPlot && (
              <>
                <Toggle
                  variant="outline"
                  size="sm"
                  pressed={showHelixSeries}
                  onPressedChange={setShowHelixSeries}
                  className="text-xs h-7 px-2.5 data-[state=on]:bg-[hsl(var(--helix)/0.15)] data-[state=on]:text-[hsl(var(--helix))] data-[state=on]:border-[hsl(var(--helix)/0.4)]"
                >
                  Helix
                </Toggle>
                <Toggle
                  variant="outline"
                  size="sm"
                  pressed={showBetaSeries}
                  onPressedChange={setShowBetaSeries}
                  className="text-xs h-7 px-2.5 data-[state=on]:bg-[hsl(var(--beta)/0.15)] data-[state=on]:text-[hsl(var(--beta))] data-[state=on]:border-[hsl(var(--beta)/0.4)]"
                >
                  Beta
                </Toggle>
              </>
            )}
          </div>
          {showSecondaryPlot && (
            <>
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
                    {showHelixSeries && (
                      <Bar dataKey="Helix" fill="hsl(var(--helix, 0 80% 50%))" opacity={0.7} />
                    )}
                    {showBetaSeries && (
                      <Bar dataKey="Beta" fill="hsl(var(--beta, 210 80% 50%))" opacity={0.7} />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <ChartExportButtons filename={`${peptideId}-tango-secondary-structure`} />
            </>
          )}
        </div>
      )}

      {/* Plot 2: Per-Residue Aggregation Propensity (always visible, single series) */}
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

      {/* Plot 3: Aggregation–Structure Overlay
          OQ6: title → toggle row → chart */}
      {hasOverlayData && (
        <div className="space-y-2" data-chart-export>
          <h3 className="text-sm font-semibold">Aggregation–Structure Overlay</h3>
          <div className="flex flex-wrap items-center gap-2">
            <Toggle
              variant="outline"
              size="sm"
              pressed={showOverlayPlot}
              onPressedChange={setShowOverlayPlot}
              className="text-xs h-7 px-2.5 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
              data-testid="toggle-overlay-plot"
            >
              {showOverlayPlot ? "Hide" : "Show"} chart
            </Toggle>
            {showOverlayPlot && (
              <>
                <Toggle
                  variant="outline"
                  size="sm"
                  pressed={overlayAgg}
                  onPressedChange={setOverlayAgg}
                  className="text-xs h-7 px-2.5 data-[state=on]:bg-[#E040FB]/15 data-[state=on]:text-[#E040FB] data-[state=on]:border-[#E040FB]/40"
                >
                  Aggregation
                </Toggle>
                {betaCurve?.length && (
                  <Toggle
                    variant="outline"
                    size="sm"
                    pressed={overlayBeta}
                    onPressedChange={setOverlayBeta}
                    className="text-xs h-7 px-2.5 data-[state=on]:bg-blue-500/15 data-[state=on]:text-blue-600 data-[state=on]:border-blue-500/40"
                  >
                    TANGO Beta
                  </Toggle>
                )}
                {helixCurve?.length && (
                  <Toggle
                    variant="outline"
                    size="sm"
                    pressed={overlayHelix}
                    onPressedChange={setOverlayHelix}
                    className="text-xs h-7 px-2.5 data-[state=on]:bg-[hsl(var(--helix)/0.15)] data-[state=on]:text-[hsl(var(--helix))] data-[state=on]:border-[hsl(var(--helix)/0.4)]"
                  >
                    TANGO Helix
                  </Toggle>
                )}
                {s4predBetaCurve?.length && (
                  <Toggle
                    variant="outline"
                    size="sm"
                    pressed={overlayS4pred}
                    onPressedChange={setOverlayS4pred}
                    className="text-xs h-7 px-2.5 data-[state=on]:bg-cyan-500/15 data-[state=on]:text-cyan-600 data-[state=on]:border-cyan-500/40"
                  >
                    S4PRED P(β)
                  </Toggle>
                )}
              </>
            )}
          </div>
          {showOverlayPlot && (
            <>
              <p className="text-xs text-muted-foreground">
                Regions where aggregation, beta propensity, and helix propensity overlap help
                identify aggregation-prone structural regions.
              </p>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={aggCurve.map((agg, i) => ({
                      pos: i + 1,
                      aa: sequence[i] || "?",
                      Aggregation: agg,
                      "TANGO Beta": betaCurve?.[i] ?? null,
                      "TANGO Helix": helixCurve?.[i] ?? null,
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
                      label={{
                        value: "TANGO score",
                        angle: -90,
                        position: "insideLeft",
                        fontSize: 11,
                      }}
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
                    {overlayAgg && (
                      <Line
                        type="monotone"
                        dataKey="Aggregation"
                        stroke="#E040FB"
                        strokeWidth={2}
                        dot={false}
                      />
                    )}
                    {overlayBeta && betaCurve?.length && (
                      <Line
                        type="monotone"
                        dataKey="TANGO Beta"
                        stroke="#3b82f6"
                        strokeWidth={1.5}
                        strokeDasharray="4 2"
                        dot={false}
                      />
                    )}
                    {overlayHelix && helixCurve?.length && (
                      <Line
                        type="monotone"
                        dataKey="TANGO Helix"
                        stroke="hsl(var(--helix, 211 96% 68%))"
                        strokeWidth={1.5}
                        strokeDasharray="6 3"
                        dot={false}
                      />
                    )}
                    {overlayS4pred && s4predBetaCurve?.length && (
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
            </>
          )}
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        TANGO predicts aggregation propensity per residue. Higher scores indicate regions with
        higher aggregation propensity.
      </div>
    </div>
  );
}
