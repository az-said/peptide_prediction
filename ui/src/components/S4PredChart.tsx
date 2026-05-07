import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { ChartExportButtons } from "@/components/ChartExportButtons";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import type { Peptide } from "@/types/peptide";

interface S4PredChartProps {
  peptide: Peptide;
  /** Extra content rendered after the chart (e.g. summary stats grid) */
  children?: React.ReactNode;
  /** Card className override */
  className?: string;
}

/** Reusable S4PRED per-residue probability chart card. */
export function S4PredChart({ peptide, children, className }: S4PredChartProps) {
  const { s4pred, s4predHelixPercent, length, id } = peptide;

  if (!s4pred || (!s4pred.pH?.length && !s4pred.pE?.length) || !length || length > 200) {
    return null;
  }

  const pH = s4pred.pH || [];
  const pE = s4pred.pE || [];
  const pC = s4pred.pC || [];
  const n = Math.max(pH.length, pE.length, pC.length);

  // Chart data
  const data = Array.from({ length: n }, (_, i) => ({
    x: i + 1,
    "P(Helix)": pH[i] ?? null,
    "P(Beta)": pE[i] ?? null,
    "P(Coil)": pC[i] ?? null,
  }));

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>S4PRED Secondary Structure Probabilities</CardTitle>
        <CardDescription>
          Per-residue helix (H), beta (E), and coil (C) probabilities from S4PRED secondary
          structure prediction.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2" data-chart-export>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" tickCount={10} />
                <YAxis
                  domain={[0, 1]}
                  label={{ value: "Probability", angle: -90, position: "insideLeft" }}
                />
                <Tooltip
                  content={({ payload, label }) => {
                    if (!payload?.length) return null;
                    return (
                      <div className="bg-background border border-border rounded p-2 text-xs space-y-1">
                        <p className="font-medium">Residue {label}</p>
                        {payload.map((entry: any) => (
                          <p key={entry.dataKey} style={{ color: entry.color }}>
                            {entry.name}:{" "}
                            {typeof entry.value === "number" ? entry.value.toFixed(3) : entry.value}
                          </p>
                        ))}
                      </div>
                    );
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: "4px" }} />
                <Line
                  type="monotone"
                  dataKey="P(Helix)"
                  stroke="hsl(var(--helix))"
                  dot={false}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="P(Beta)"
                  stroke="hsl(var(--beta))"
                  dot={false}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="P(Coil)"
                  stroke="hsl(var(--muted-foreground))"
                  dot={false}
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <ChartExportButtons filename={`${id}-s4pred-probabilities`} />
        </div>

        {children}

        {/* Context note for short peptides with no helix */}
        {typeof s4predHelixPercent === "number" && s4predHelixPercent < 5 && length <= 25 && (
          <p className="text-xs text-muted-foreground px-1 leading-relaxed">
            S4PRED finds no stable helix segments. Short peptides often lack the sequence context
            required to predict stable helices (requires &ge;5 consecutive residues with P(Helix)
            &ge; 0.5).
          </p>
        )}
      </CardContent>
    </Card>
  );
}
