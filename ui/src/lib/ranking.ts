/**
 * Percentile-based peptide ranking engine v2.
 *
 * 3 default metrics + 4 optional add-ons. Proportional weights sum to 100%.
 * Direction toggles allow inverting "high is good" vs "low is good".
 *
 * Peleg FIX-024 (2026-04): TANGO Agg Max moved out of default metrics
 * (Peleg: "should NOT be in the default ranking"); Hydrophobicity promoted
 * into defaults (Peleg: "MUST be a default metric"). Added "helix" preset.
 * Renamed "Amyloid Focus" UI label → "Fibril-formation Focus" (code key
 * `amyloid` retained for back-compat).
 *
 * PELEG-Q1-RESOLVED + PELEG-SSW-SCORE-RESOLVED (2026-05-06):
 *   ffHelixPercent (Chou-Fasman) and sswScore moved from default → optional
 *   per Said+Peleg. Both are dropped from user-facing surfaces; the keys
 *   remain on the RankingMetric union for back-compat with persisted state.
 *
 * Default metrics:  s4predHelixPercent, muH, hydrophobicity
 * Optional add-ons: tangoAggMax, absCharge, ffHelixPercent, sswScore
 */
import type { Peptide } from "@/types/peptide";

// ---- Types ----

export type RankingMetric =
  | "tangoAggMax"
  | "s4predHelixPercent"
  | "s4predHelixScore"
  | "ffHelixPercent"
  | "ffHelixFlag"
  | "ffSswFlag"
  | "sswPrediction"
  | "muH"
  | "sswScore"
  | "hydrophobicity"
  | "absCharge";

export type MetricDirection = "high" | "low";

export type MetricDirections = Partial<Record<RankingMetric, MetricDirection>>;

export type ProportionalWeights = Partial<Record<RankingMetric, number>>;

export type PeptideRanking = {
  peptideId: string;
  compositeScore: number; // 0-100
  metricPercentiles: Record<RankingMetric, number | null>;
};

export interface RankingOptions {
  tangoAvailable?: boolean;
  directions?: MetricDirections;
}

export type RankingPreset = "fibril" | "equal" | "amyloid" | "helix" | "switch";

// ---- Constants ----

// PELEG-Q1-RESOLVED + PELEG-SSW-SCORE-RESOLVED (2026-05-06):
//   ffHelixPercent (Chou-Fasman) + sswScore relegated to optional.
export const DEFAULT_METRICS: RankingMetric[] = ["s4predHelixPercent", "muH", "hydrophobicity"];

export const OPTIONAL_METRICS: RankingMetric[] = [
  "tangoAggMax",
  "absCharge",
  "ffHelixPercent",
  "sswScore",
  // Fibril-formation preset metrics — surfaced via the new "fibril" preset only.
  "ffHelixFlag",
  "ffSswFlag",
  "sswPrediction",
  "s4predHelixScore",
];

export const ALL_METRICS: RankingMetric[] = [...DEFAULT_METRICS, ...OPTIONAL_METRICS];

// 2026-06-07 (Peleg Drive 2026-05-22): "% is a feature, not a class." The
// FF-Helix sliding-window propensity is exposed as "FF-Helix score" (no %
// suffix) so it reads as a continuous feature rather than a class-membership
// ratio. S4PRED Helix % stays as a labelled percent because that one IS a
// per-sequence coverage percentage (S4PRED's residues-predicted-helical / total).
export const METRIC_LABELS: Record<RankingMetric, string> = {
  tangoAggMax: "TANGO Aggregation Max",
  s4predHelixPercent: "S4PRED Helix %",
  s4predHelixScore: "S4PRED Helix score",
  // Peleg 2026-06-07: % is a feature, not a class — label as a raw score.
  // Data field name (ffHelixPercent) retained for back-compat.
  ffHelixPercent: "FF-Helix score",
  ffHelixFlag: "FF-Helix candidate",
  ffSswFlag: "FF-SSW candidate",
  sswPrediction: "SSW positive",
  muH: "uH",
  sswScore: "SSW Score",
  hydrophobicity: "Hydrophobicity",
  absCharge: "|Charge|",
};

/**
 * Peleg FIX-024: per-metric explanations shown in tooltips next to weight controls.
 * Each describes what the weight emphasises and which underlying data column feeds it.
 */
export const METRIC_DESCRIPTIONS: Record<RankingMetric, string> = {
  tangoAggMax:
    "Peak per-residue TANGO aggregation propensity (column: tangoAggMax). Higher weight emphasises peptides with strong aggregation-prone regions.",
  s4predHelixPercent:
    "Percentage of residues S4PRED predicts as helical (column: s4predHelixPercent). Higher weight emphasises helix content.",
  s4predHelixScore:
    "Mean S4PRED P(helix) across the sequence (column: s4predHelixScore). Raw probability, not a percentage.",
  ffHelixPercent:
    "FF-Helix score — sliding-window helix-propensity (column: ffHelixPercent). Higher weight emphasises intrinsic helix tendency.",
  ffHelixFlag:
    "Binary FF-Helix candidate flag (column: ffHelixFlag). Higher weight pushes Peleg-classified FF-Helix candidates to the top.",
  ffSswFlag:
    "Binary FF-SSW candidate flag (column: ffSswFlag). Higher weight pushes Peleg-classified FF-SSW candidates to the top.",
  sswPrediction:
    "Binary SSW positive flag (column: sswPrediction). Higher weight emphasises peptides flagged as structure-switch positive.",
  muH: "Hydrophobic moment uH (column: muH). Higher weight emphasises amphipathic peptides — used in fibril-formation classification.",
  sswScore:
    "TANGO secondary-structure-switch score (column: sswScore). Higher weight emphasises peptides with structural-switch potential.",
  hydrophobicity:
    "Mean hydrophobicity (Fauchere-Pliska, column: hydrophobicity). Higher weight emphasises hydrophobic peptides — used in FF-SSW classification.",
  absCharge:
    "Absolute net charge at pH 7.4 (column: |charge|). Higher weight emphasises strongly charged peptides.",
};

export const METRIC_COLORS: Record<RankingMetric, string> = {
  tangoAggMax: "bg-red-500",
  s4predHelixPercent: "bg-violet-500",
  s4predHelixScore: "bg-violet-400",
  ffHelixPercent: "bg-purple-500",
  ffHelixFlag: "bg-green-500",
  ffSswFlag: "bg-emerald-600",
  sswPrediction: "bg-blue-500",
  muH: "bg-blue-500",
  sswScore: "bg-amber-500",
  hydrophobicity: "bg-cyan-500",
  absCharge: "bg-emerald-500",
};

export const METRIC_COLORS_HEX: Record<RankingMetric, string> = {
  tangoAggMax: "#ef4444",
  s4predHelixPercent: "#8b5cf6",
  s4predHelixScore: "#a78bfa",
  ffHelixPercent: "#a855f7",
  ffHelixFlag: "#22c55e",
  ffSswFlag: "#059669",
  sswPrediction: "#3b82f6",
  muH: "#3b82f6",
  sswScore: "#f59e0b",
  hydrophobicity: "#06b6d4",
  absCharge: "#10b981",
};

/** Default directions: high = good for all metrics. */
export const DEFAULT_DIRECTIONS: MetricDirections = {
  tangoAggMax: "high",
  s4predHelixPercent: "high",
  s4predHelixScore: "high",
  ffHelixPercent: "high",
  ffHelixFlag: "high",
  ffSswFlag: "high",
  sswPrediction: "high",
  muH: "high",
  sswScore: "high",
  hydrophobicity: "high",
  absCharge: "high",
};

/** Equal weights across 3 default metrics (sums to 100; 34/33/33). */
function equalWeights(): ProportionalWeights {
  return {
    s4predHelixPercent: 34,
    muH: 33,
    hydrophobicity: 33,
  };
}

/**
 * PELEG-Q1-RESOLVED + PELEG-SSW-SCORE-RESOLVED preset rebalance (2026-05-06):
 *   ffHelixPercent (Chou-Fasman) and sswScore are no longer surfaced — presets
 *   now distribute weight across the 3 default metrics + S4PRED. Each preset's
 *   weights still sum to 100.
 *
 * - `amyloid` (UI label: "Fibril-formation Focus") emphasises uH + hydrophobicity
 *   — the two thresholds that drive Peleg's FF-Helix and FF-SSW classifications.
 * - `helix` (UI label: "Helix Focus") emphasises S4PRED helix + uH.
 * - `switch` (UI label: "Switch Focus") emphasises S4PRED helix balance against
 *   uH + hydrophobicity (was previously SSW-score weighted; that metric is gone).
 * Code key `amyloid` retained for back-compat with existing tests/state.
 */
export const PRESETS: Record<
  RankingPreset,
  { weights: ProportionalWeights; directions: MetricDirections }
> = {
  // Default "Recommended" preset (Peleg 2026-06-07). Fibril formation is what
  // researchers actually come to PVL for — surface candidates first.
  fibril: {
    weights: {
      ffHelixFlag: 30,
      ffSswFlag: 30,
      sswPrediction: 20,
      muH: 10,
      s4predHelixScore: 10,
    },
    directions: { ...DEFAULT_DIRECTIONS },
  },
  equal: {
    weights: equalWeights(),
    directions: { ...DEFAULT_DIRECTIONS },
  },
  amyloid: {
    weights: {
      muH: 40,
      hydrophobicity: 40,
      s4predHelixPercent: 20,
    },
    directions: { ...DEFAULT_DIRECTIONS },
  },
  helix: {
    weights: {
      s4predHelixPercent: 50,
      muH: 30,
      hydrophobicity: 20,
    },
    directions: {
      ...DEFAULT_DIRECTIONS,
      s4predHelixPercent: "high",
    },
  },
  switch: {
    weights: {
      s4predHelixPercent: 40,
      muH: 30,
      hydrophobicity: 30,
    },
    directions: {
      ...DEFAULT_DIRECTIONS,
      s4predHelixPercent: "high", // high helix content → helix-to-beta switch
    },
  },
};

// Metrics that require TANGO
const TANGO_GATED: RankingMetric[] = ["sswScore", "tangoAggMax"];

// ---- Core Functions ----

/** Map a class-flag value to a binary 0/1 (or null when missing). */
function binaryFlag(v: number | null | undefined): number | null {
  if (v == null) return null;
  return v === 1 ? 1 : 0;
}

/** Extract a numeric metric value from a peptide, returning null if unavailable. */
function extractMetric(p: Peptide, metric: RankingMetric): number | null {
  switch (metric) {
    case "hydrophobicity":
      return p.hydrophobicity;
    case "absCharge":
      return p.charge != null ? Math.abs(p.charge) : null;
    case "muH":
      return p.muH ?? null;
    case "ffHelixPercent":
      return p.ffHelixPercent ?? null;
    case "ffHelixFlag":
      return binaryFlag(p.ffHelixFlag);
    case "ffSswFlag":
      return binaryFlag(p.ffSswFlag);
    case "sswPrediction":
      return binaryFlag(p.sswPrediction as number | null | undefined);
    case "sswScore":
      return p.sswScore ?? null;
    case "tangoAggMax":
      return p.tangoAggMax ?? null;
    case "s4predHelixPercent":
      return p.s4predHelixPercent ?? null;
    case "s4predHelixScore":
      return p.s4predHelixScore ?? null;
  }
}

/**
 * Compute the percentile rank of `value` within `allValues`.
 *
 * percentileRank = (count of values ≤ value) / totalCount × 100
 *
 * Edge cases:
 * - Single element → 50
 * - All same values → 50 for all
 */
export function computePercentileRank(value: number, allValues: number[]): number {
  const n = allValues.length;
  if (n <= 1) return 50;

  const countBelow = allValues.filter((v) => v <= value).length;
  return (countBelow / n) * 100;
}

/**
 * Redistribute weights proportionally when some metrics are removed.
 * Returns a new weights record that sums to 100.
 */
export function redistributeWeights(
  weights: ProportionalWeights,
  activeMetrics: RankingMetric[]
): ProportionalWeights {
  const activeWeights: ProportionalWeights = {};
  let sum = 0;
  for (const m of activeMetrics) {
    const w = weights[m] ?? 0;
    activeWeights[m] = w;
    sum += w;
  }
  if (sum === 0) {
    // Fallback: equal distribution
    const each = 100 / activeMetrics.length;
    for (const m of activeMetrics) activeWeights[m] = each;
    return activeWeights;
  }
  // Scale to sum to 100
  const scale = 100 / sum;
  for (const m of activeMetrics) {
    activeWeights[m] = (activeWeights[m] ?? 0) * scale;
  }
  return activeWeights;
}

/**
 * Rank all peptides using percentile normalization and proportional weighted scoring.
 *
 * @param peptides - Array of peptides to rank
 * @param weights - Per-metric weights (values sum to 100)
 * @param options - tangoAvailable gates SSW/TANGO metrics, directions invert percentiles
 */
export function rankPeptides(
  peptides: Peptide[],
  weights: ProportionalWeights,
  options?: RankingOptions
): PeptideRanking[] {
  const tangoAvailable = options?.tangoAvailable ?? true;
  const directions = options?.directions ?? DEFAULT_DIRECTIONS;

  // Determine which metrics are active (from weights keys, minus TANGO-gated when unavailable)
  const requestedMetrics = ALL_METRICS.filter((m) => (weights[m] ?? 0) > 0);
  const activeMetrics = requestedMetrics.filter((m) => tangoAvailable || !TANGO_GATED.includes(m));

  // Redistribute weights excluding gated metrics
  const effectiveWeights = redistributeWeights(weights, activeMetrics);

  // Collect all valid values per metric (for percentile computation)
  const metricValues: Partial<Record<RankingMetric, number[]>> = {};
  for (const m of activeMetrics) {
    metricValues[m] = peptides
      .map((p) => extractMetric(p, m))
      .filter((v): v is number => v != null && Number.isFinite(v));
  }

  // Compute per-peptide rankings
  return peptides.map((p) => {
    const metricPercentiles: Record<RankingMetric, number | null> = {} as any;

    for (const m of ALL_METRICS) {
      if (!activeMetrics.includes(m)) {
        metricPercentiles[m] = null;
        continue;
      }
      const value = extractMetric(p, m);
      if (value == null || !Number.isFinite(value)) {
        metricPercentiles[m] = null;
      } else {
        let pct = computePercentileRank(value, metricValues[m]!);
        // Invert percentile when direction is "low" (lower raw value = higher score)
        if (directions[m] === "low") {
          pct = 100 - pct;
        }
        metricPercentiles[m] = pct;
      }
    }

    // Composite score: weighted average of adjusted percentiles / 100
    let weightedSum = 0;
    let weightSum = 0;
    for (const m of activeMetrics) {
      const pct = metricPercentiles[m];
      const w = effectiveWeights[m] ?? 0;
      if (pct != null) {
        weightedSum += w * pct;
        weightSum += w;
      }
    }
    const compositeScore = weightSum > 0 ? weightedSum / weightSum : 50;

    return {
      peptideId: p.id,
      compositeScore,
      metricPercentiles,
    };
  });
}
