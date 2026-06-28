/**
 * BiochemComparison — Unified biochemical feature comparison framework.
 *
 * Replaces the 3 disjoint sections on PeptideDetail (radar, percentile bars,
 * summary stat cards) with a single configurable component reading from one
 * metrics declaration — single source of truth.
 *
 * Terminology: "cohort" → "database" throughout (Peleg FIX-003/FIX-016).
 * Badge colors: "Above median" uses green, not gold/brown (Peleg FIX-016).
 *
 * Q11 (Peleg 2026-06-18 PDF1 p20, confirmed 2026-06-23): clickable database
 * comparison tabs for single-peptide mode. When `comparisonDatasets` is
 * provided, fetches the CSV, computes percentile against the reference
 * distribution client-side, feeds radar + percentile panels.
 *
 * @see docs/active/PELEG_FEEDBACK_INSTRUCTIONS.md FIX-016
 */

import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Peptide, DatasetStats } from "@/types/peptide";
import {
  fetchReferenceDataset,
  type ReferenceDatasetConfig,
  type ReferenceDatasetResult,
} from "@/lib/referenceDistributions";

export type BiochemDisplayMode = "radar" | "percentile" | "stat-card" | "all";

export interface BiochemMetric {
  id: string;
  label: string;
  unit?: string;
  displayMode: BiochemDisplayMode;
  getValue: (p: Peptide) => number | null | undefined;
  getMean?: (stats: DatasetStats) => number | null | undefined;
  interpretation?: (value: number, percentile: number) => string;
}

export interface BiochemComparisonProps {
  peptide: Peptide;
  allPeptides: Peptide[];
  stats: DatasetStats | null;
  metrics: BiochemMetric[];
  layout?: "compact" | "expanded";
  /**
   * Wave Q.1: explicit display mode override.
   *  - "full" (default): all sub-panels render
   *  - "single-peptide": stat cards render absolute values only; radar +
   *    percentile bars hide unless a reference dataset is loaded.
   * If omitted, auto-detect via `allPeptides.length < 2`.
   */
  mode?: "full" | "single-peptide";
  /**
   * Q11: reference datasets for comparison tabs. When provided in single-
   * peptide mode, renders clickable tabs that fetch the CSV and compute
   * percentile against the reference distribution.
   */
  comparisonDatasets?: ReferenceDatasetConfig[];
  /** Q11: default dataset tab to show. Falls back to first enabled. */
  defaultDatasetId?: string;
}

export const DEFAULT_PVL_METRICS: BiochemMetric[] = [
  {
    id: "hydrophobicity",
    label: "Hydrophobicity",
    unit: "",
    displayMode: "all",
    getValue: (p) => p.hydrophobicity,
    getMean: (s) => s.meanHydrophobicity,
  },
  {
    id: "muH",
    label: "Hydrophobic moment",
    unit: "μH",
    displayMode: "all",
    getValue: (p) => p.muH,
    getMean: (s) => s.meanMuH,
  },
  {
    id: "charge",
    label: "Charge",
    unit: "(pH 7.4)",
    displayMode: "all",
    getValue: (p) => p.charge,
    getMean: (s) => s.meanCharge,
  },
];

function calculatePercentile(value: number, allValues: number[]): number {
  if (allValues.length === 0) return 50;
  const below = allValues.filter((v) => v < value).length;
  return (below / allValues.length) * 100;
}

function getPercentileBand(pct: number): { label: string; colorClass: string } {
  if (pct >= 90) return { label: "Top 10%", colorClass: "text-green-600 dark:text-green-400" };
  if (pct >= 75) return { label: "Top 25%", colorClass: "text-green-600 dark:text-green-400" };
  if (pct >= 50) return { label: "Above median", colorClass: "text-green-600 dark:text-green-400" };
  if (pct >= 25) return { label: "Below median", colorClass: "text-muted-foreground" };
  return { label: "Bottom 25%", colorClass: "text-muted-foreground" };
}

function StatCardSkeleton() {
  return (
    <div className="border rounded-lg p-3 space-y-2 animate-pulse">
      <div className="h-3 w-20 bg-muted rounded" />
      <div className="h-6 w-16 bg-muted rounded" />
      <div className="h-2 w-24 bg-muted rounded" />
    </div>
  );
}

function PercentileBarSkeleton() {
  return (
    <div className="flex items-center gap-3 animate-pulse">
      <div className="h-3 w-28 bg-muted rounded" />
      <div className="flex-1 h-3 bg-muted rounded-full" />
      <div className="h-3 w-12 bg-muted rounded" />
    </div>
  );
}

const METRIC_VALUE_KEY: Record<string, "hydrophobicity" | "muH" | "charge"> = {
  hydrophobicity: "hydrophobicity",
  muH: "muH",
  charge: "charge",
};

export function BiochemComparison({
  peptide,
  allPeptides,
  stats,
  metrics,
  mode,
  comparisonDatasets,
  defaultDatasetId,
}: BiochemComparisonProps) {
  const isSinglePeptide = mode === "single-peptide" || (mode !== "full" && allPeptides.length < 2);

  const firstEnabled = comparisonDatasets?.find((d) => !d.disabled)?.id ?? "";
  const [activeTab, setActiveTab] = useState(defaultDatasetId ?? firstEnabled);
  const [refCache, setRefCache] = useState<Record<string, ReferenceDatasetResult>>({});
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const activeConfig = comparisonDatasets?.find((d) => d.id === activeTab);
  const hasComparisonTabs = isSinglePeptide && !!comparisonDatasets?.length;

  useEffect(() => {
    if (!hasComparisonTabs || !activeConfig || activeConfig.disabled) return;
    if (refCache[activeTab]) return;

    let cancelled = false;
    setLoading(true);
    setFetchError(null);

    fetchReferenceDataset(activeConfig.csvUrl)
      .then((result) => {
        if (!cancelled) {
          setRefCache((prev) => ({ ...prev, [activeTab]: result }));
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setFetchError(err.message ?? "Failed to load reference dataset");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, activeConfig, hasComparisonTabs, refCache]);

  const refData = refCache[activeTab] ?? null;
  const effectiveStats = refData?.stats ?? stats;

  const metricsWithPercentiles = useMemo(() => {
    return metrics.map((m) => {
      const value = m.getValue(peptide);
      const mean = effectiveStats && m.getMean ? m.getMean(effectiveStats) : null;

      let percentile: number | null = null;

      if (refData && typeof value === "number" && Number.isFinite(value)) {
        const key = METRIC_VALUE_KEY[m.id];
        const refValues = key ? refData.values[key] : null;
        if (refValues && refValues.length > 0) {
          percentile = calculatePercentile(value, refValues);
        }
      } else if (!isSinglePeptide && typeof value === "number" && Number.isFinite(value)) {
        const allValues = allPeptides
          .map((p) => m.getValue(p))
          .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
        percentile = calculatePercentile(value, allValues);
      }

      return { metric: m, value, percentile, mean };
    });
  }, [peptide, allPeptides, effectiveStats, metrics, isSinglePeptide, refData]);

  const statCardMetrics = metricsWithPercentiles.filter(
    (m) => m.metric.displayMode === "stat-card" || m.metric.displayMode === "all"
  );
  const percentileMetrics = metricsWithPercentiles.filter(
    (m) => m.metric.displayMode === "percentile" || m.metric.displayMode === "all"
  );
  const radarMetrics = metricsWithPercentiles.filter(
    (m) => m.metric.displayMode === "radar" || m.metric.displayMode === "all"
  );

  const showComparison = refData !== null || !isSinglePeptide;

  return (
    <Card className="rounded-xl border-[hsl(var(--border))]">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Biochemical feature comparison</CardTitle>
        <CardDescription>How this peptide compares to the database</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {hasComparisonTabs && (
          <div className="space-y-3">
            <p className="text-sm font-semibold">Compare with database:</p>
            <TooltipProvider delayDuration={200}>
              <div className="flex flex-wrap gap-2" data-testid="comparison-tabs">
                {comparisonDatasets!.map((ds) => {
                  const isActive = activeTab === ds.id;
                  const btn = (
                    <button
                      key={ds.id}
                      type="button"
                      onClick={() => !ds.disabled && setActiveTab(ds.id)}
                      disabled={ds.disabled}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all border ${
                        ds.disabled
                          ? "border-border/50 text-muted-foreground/50 cursor-not-allowed bg-transparent"
                          : isActive
                            ? "border-primary bg-primary/10 text-primary shadow-sm"
                            : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground bg-transparent"
                      }`}
                      data-testid={`tab-${ds.id}`}
                      aria-selected={isActive}
                      role="tab"
                    >
                      {ds.label}
                    </button>
                  );

                  if (ds.disabled && ds.disabledTooltip) {
                    return (
                      <UITooltip key={ds.id}>
                        <TooltipTrigger asChild>
                          <span>{btn}</span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs max-w-[240px]">
                          {ds.disabledTooltip}
                        </TooltipContent>
                      </UITooltip>
                    );
                  }
                  return btn;
                })}
              </div>
            </TooltipProvider>
          </div>
        )}

        {hasComparisonTabs && loading && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </div>
            <div className="space-y-2">
              <PercentileBarSkeleton />
              <PercentileBarSkeleton />
              <PercentileBarSkeleton />
            </div>
          </div>
        )}

        {hasComparisonTabs && fetchError && !loading && (
          <p className="text-xs text-destructive">{fetchError}</p>
        )}

        {!loading && statCardMetrics.length > 0 && (
          <div
            className={`grid gap-3 ${
              statCardMetrics.length <= 2
                ? "grid-cols-1 sm:grid-cols-2"
                : statCardMetrics.length <= 4
                  ? "grid-cols-2 sm:grid-cols-4"
                  : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
            }`}
          >
            {statCardMetrics.map(({ metric: m, value, mean, percentile }) => {
              const band = percentile !== null ? getPercentileBand(percentile) : null;
              return (
                <div key={m.id} className="border rounded-lg p-3 space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">
                    {m.label} {m.unit && <span className="text-[10px]">{m.unit}</span>}
                  </p>
                  <p className="text-xl font-bold tracking-tight">
                    {typeof value === "number" ? value.toFixed(2) : "N/A"}
                  </p>
                  {typeof mean === "number" && (
                    <p className="text-[10px] text-muted-foreground">
                      Database mean: {mean.toFixed(2)}
                    </p>
                  )}
                  {band && (
                    <span className={`text-[10px] font-medium ${band.colorClass}`}>
                      {band.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!loading && showComparison && radarMetrics.length >= 3 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">
              Radar comparison (peptide vs{" "}
              {refData ? (activeConfig?.label ?? "reference") : "database"} mean)
            </p>
            <RadarComparisonSVG metrics={radarMetrics} />
          </div>
        )}

        {!loading && showComparison && percentileMetrics.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">
              Percentile ranking
              {refData ? ` (vs ${activeConfig?.label ?? "reference"})` : " across key metrics"}
            </p>
            <div className="space-y-2">
              {percentileMetrics.map(({ metric: m, percentile }) => {
                const band = percentile !== null ? getPercentileBand(percentile) : null;
                return (
                  <div key={m.id} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-28 shrink-0 truncate">
                      {m.label}
                    </span>
                    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(2, percentile ?? 0)}%`,
                          backgroundColor:
                            (percentile ?? 0) >= 50
                              ? "hsl(var(--ff-helix))"
                              : "hsl(var(--muted-foreground))",
                        }}
                      />
                    </div>
                    <span className="text-xs font-mono w-12 text-right">
                      {percentile !== null ? `${percentile.toFixed(0)}%` : "—"}
                    </span>
                    {band && (
                      <span className={`text-[10px] w-20 ${band.colorClass}`}>{band.label}</span>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-[9px] text-muted-foreground/60 mt-2">
              Note: percentiles are relative to{" "}
              {refData ? `the ${activeConfig?.label ?? "reference"} dataset` : "this dataset"} only.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RadarComparisonSVG({
  metrics,
}: {
  metrics: {
    metric: BiochemMetric;
    value: number | null | undefined;
    percentile: number | null;
    mean: number | null | undefined;
  }[];
}) {
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.38;
  const n = metrics.length;

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (n < 3) return null;

  const peptidePoints = metrics.map((m, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const r = maxR * ((m.percentile ?? 50) / 100);
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      label: m.metric.label,
      labelX: cx + (maxR + 15) * Math.cos(angle),
      labelY: cy + (maxR + 15) * Math.sin(angle),
    };
  });

  const meanPoints = metrics.map((_, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const r = maxR * 0.5;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  });

  const peptidePath =
    peptidePoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
  const meanPath =
    meanPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  const hovered = hoveredIdx != null ? metrics[hoveredIdx] : null;
  const hoveredPoint = hoveredIdx != null ? peptidePoints[hoveredIdx] : null;
  const fmt = (v: number | null | undefined) =>
    typeof v === "number" && Number.isFinite(v) ? v.toFixed(2) : "—";

  return (
    <div className="flex justify-center">
      <div className="relative w-full max-w-[240px]" data-testid="biochem-radar">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-auto"
          onMouseLeave={() => setHoveredIdx(null)}
        >
          {[0.25, 0.5, 0.75, 1].map((frac) => (
            <circle
              key={frac}
              cx={cx}
              cy={cy}
              r={maxR * frac}
              fill="none"
              stroke="currentColor"
              strokeOpacity={0.1}
              strokeWidth={1}
            />
          ))}

          {metrics.map((_, i) => {
            const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
            return (
              <line
                key={i}
                x1={cx}
                y1={cy}
                x2={cx + maxR * Math.cos(angle)}
                y2={cy + maxR * Math.sin(angle)}
                stroke="currentColor"
                strokeOpacity={0.1}
                strokeWidth={1}
              />
            );
          })}

          <path
            d={meanPath}
            fill="hsl(var(--muted-foreground))"
            fillOpacity={0.1}
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={1.5}
            strokeDasharray="4 2"
          />

          <path
            d={peptidePath}
            fill="hsl(var(--primary))"
            fillOpacity={0.15}
            stroke="hsl(var(--primary))"
            strokeWidth={2}
          />

          {peptidePoints.map((p, i) => (
            <g
              key={i}
              onMouseEnter={() => setHoveredIdx(i)}
              onFocus={() => setHoveredIdx(i)}
              tabIndex={0}
              data-testid={`biochem-radar-vertex-${i}`}
              style={{ cursor: "pointer" }}
            >
              <circle cx={p.x} cy={p.y} r={9} fill="transparent" />
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIdx === i ? 4 : 3}
                fill="hsl(var(--primary))"
                stroke={hoveredIdx === i ? "hsl(var(--primary-foreground))" : "none"}
                strokeWidth={hoveredIdx === i ? 1.5 : 0}
              />
            </g>
          ))}

          {peptidePoints.map((p, i) => (
            <text
              key={i}
              x={p.labelX}
              y={p.labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={8}
              className="fill-muted-foreground"
            >
              {p.label}
            </text>
          ))}
        </svg>

        {hovered && hoveredPoint && (
          <div
            className="pointer-events-none absolute z-10 rounded-md border border-border bg-background/95 backdrop-blur-sm px-2.5 py-1.5 text-[11px] shadow-md whitespace-nowrap"
            style={{
              left: `${(hoveredPoint.x / size) * 100}%`,
              top: `${(hoveredPoint.y / size) * 100}%`,
              transform: "translate(-50%, calc(-100% - 8px))",
            }}
            role="tooltip"
            data-testid="biochem-radar-tooltip"
          >
            <p className="font-semibold mb-0.5">{hovered.metric.label}</p>
            <p className="text-muted-foreground">
              <span className="text-primary">●</span> Peptide:{" "}
              <span className="font-mono text-foreground">{fmt(hovered.value)}</span>
              {hovered.metric.unit ? ` ${hovered.metric.unit}` : ""}
            </p>
            <p className="text-muted-foreground">
              <span className="text-muted-foreground">○</span> Database mean:{" "}
              <span className="font-mono text-foreground">{fmt(hovered.mean)}</span>
              {hovered.metric.unit ? ` ${hovered.metric.unit}` : ""}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default BiochemComparison;
