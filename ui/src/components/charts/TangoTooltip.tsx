/**
 * Shared rich tooltip for per-residue TANGO charts.
 *
 * Format: "Residue N — X" header (residue position + amino-acid letter)
 * followed by per-series rows colored to match each chart line/bar.
 *
 * Used by AggregationHeatmap (per-residue Aggregation, Beta+Helix overlay,
 * and Aggregation–Structure overlay) so QuickAnalyze and PeptideDetail show
 * an identical tooltip on every TANGO chart.
 */
type TooltipEntry = {
  dataKey?: string | number;
  name?: string;
  value?: number | string;
  color?: string;
  payload?: { aa?: string } & Record<string, unknown>;
};

interface TangoTooltipProps {
  payload?: TooltipEntry[];
  label?: string | number;
}

export function TangoTooltip({ payload, label }: TangoTooltipProps) {
  if (!payload?.length) return null;
  const aa = payload[0]?.payload?.aa;
  return (
    <div className="bg-background border border-border rounded p-2 text-xs space-y-1">
      <p className="font-medium">
        Residue {label}
        {aa ? ` — ${aa}` : ""}
      </p>
      {payload.map((entry) => {
        if (entry.value == null) return null;
        const v =
          typeof entry.value === "number"
            ? entry.value.toFixed(1)
            : entry.value;
        return (
          <p key={String(entry.dataKey)} style={{ color: entry.color }}>
            {entry.name}: {v}
          </p>
        );
      })}
    </div>
  );
}
