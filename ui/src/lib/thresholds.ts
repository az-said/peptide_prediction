/**
 * Threshold application helpers
 *
 * Centralizes logic for applying thresholds to peptides for consistent
 * filtering and ranking across Results and QuickAnalyze.
 */
import type { Peptide } from "@/types/peptide";
import { computeAggFlag, type AggFlagConfig, DEFAULT_AGG_CONFIG } from "@/lib/aggregationFlags";

/**
 * Resolved thresholds — single source of truth for the UI.
 * Defaults must match `backend/config.py` (Peleg's 9 canonical thresholds, FIX-002).
 *
 * Peleg's groups (FIX-002):
 *   Group 1 — General secondary-structure thresholds
 *   Group 2 — Helical thresholds
 *   Group 3 — Secondary-structure switch thresholds
 *   Group 4 — Fibril-formation thresholds
 *
 * Legacy aggregation-flagging fields (aggThreshold, percentOfLengthCutoff,
 * minSswResidues, sswMaxDifference, minPredictionPercent) are kept for
 * back-compat with the consensus / report / aggregation-flag pipeline.
 * Peleg flagged these for discussion — surfaced in the UI under "Advanced".
 */
export type ResolvedThresholds = {
  // Group 1: General secondary-structure thresholds
  minSegmentLength: number;
  maxGap: number;

  // Group 2: Helical thresholds
  minS4predHelixScore: number;
  minHelixPercentContent: number;

  // Group 3: Secondary-structure switch thresholds
  s4predMaxHelixBetaDiff: number;
  tangoMaxHelixBetaDiff: number;
  minSsPercentContent: number;

  // Group 4: Fibril-formation thresholds
  muHCutoff: number;
  hydroCutoff: number;
  // PELEG-Q6-PARTIAL: TANGO aggregation threshold (default 5.0). Replaces
  // the hardcoded "5%" annotation on the TANGO chart per Said+Peleg 2026-05-06.
  tangoAggregationThreshold: number;

  // PELEG-Q5-RESOLVED + PELEG-PEL-G-RESOLVED: aggThreshold +
  //   percentOfLengthCutoff are no longer surfaced as user controls but
  //   remain on the resolved-thresholds shape for back-compat with the
  //   aggregation-flag pipeline.
  aggThreshold: number;
  percentOfLengthCutoff: number;
  minSswResidues: number;
  sswMaxDifference: number;
  minPredictionPercent: number;
  /** @deprecated superseded by tangoMaxHelixBetaDiff (Peleg FIX-002 Group 3) */
  maxTangoDifference: number;
};

/**
 * Default thresholds — match backend/config.py constants (Peleg FIX-002).
 * Fallback when meta.thresholds is unavailable.
 */
export const DEFAULT_THRESHOLDS: ResolvedThresholds = {
  // Group 1
  minSegmentLength: 5,
  maxGap: 3,
  // Group 2
  minS4predHelixScore: 0.5,
  minHelixPercentContent: 0,
  // Group 3
  s4predMaxHelixBetaDiff: 0.03,
  tangoMaxHelixBetaDiff: 3,
  minSsPercentContent: 0,
  // Group 4
  muHCutoff: 0.5,
  hydroCutoff: 0.5,
  tangoAggregationThreshold: 5.0,
  // Legacy
  aggThreshold: 5.0,
  percentOfLengthCutoff: 20.0,
  minSswResidues: 3,
  sswMaxDifference: 0.0,
  minPredictionPercent: 50.0,
  maxTangoDifference: 0.0,
};

/** Extract AggFlagConfig from ResolvedThresholds */
export function toAggConfig(t: ResolvedThresholds): AggFlagConfig {
  return {
    aggThreshold: t.aggThreshold,
    percentOfLengthCutoff: t.percentOfLengthCutoff,
    minSswResidues: t.minSswResidues,
  };
}

/**
 * Apply thresholds to a peptide and return view flags
 *
 * @param peptide - Peptide to evaluate
 * @param thresholds - Resolved thresholds from meta.thresholds
 * @returns Object with ffHelixView and sswView flags (1, 0, or -1)
 */
export function applyThresholds(
  peptide: Peptide,
  thresholds: ResolvedThresholds
): { ffHelixView: number; sswView: number } {
  const muH = typeof peptide.muH === "number" ? peptide.muH : 0;
  const H = typeof peptide.hydrophobicity === "number" ? peptide.hydrophobicity : 0;
  const ssw = peptide.sswPrediction ?? -1;

  // FF-Helix flag: 1 if muH >= muHCutoff, else 0
  const ffHelixView = muH >= thresholds.muHCutoff ? 1 : 0;

  // SSW flag: 1 if ssw === 1 AND H >= hydroCutoff, -1 if ssw === -1, else 0
  const sswView = ssw === 1 && H >= thresholds.hydroCutoff ? 1 : ssw === -1 ? -1 : 0;

  return { ffHelixView, sswView };
}

/**
 * Compute classification summary counts for a set of peptides given thresholds.
 *
 * Used by ThresholdTuner to show impact counts when thresholds change.
 */
export function classificationSummary(
  peptides: Peptide[],
  thresholds: ResolvedThresholds
): {
  ffHelixCandidates: number;
  sswCandidates: number;
  aggFlagged: number;
  total: number;
} {
  let ffHelixCandidates = 0;
  let sswCandidates = 0;
  let aggFlagged = 0;

  const aggConfig = toAggConfig(thresholds);

  for (const p of peptides) {
    const { ffHelixView, sswView } = applyThresholds(p, thresholds);
    if (ffHelixView === 1) ffHelixCandidates++;
    if (sswView === 1) sswCandidates++;
    if (computeAggFlag(p, aggConfig).flagged) aggFlagged++;
  }

  return {
    ffHelixCandidates,
    sswCandidates,
    aggFlagged,
    total: peptides.length,
  };
}
