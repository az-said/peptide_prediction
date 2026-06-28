/**
 * QuickKpiStrip — 4-class status badges for Quick Analyze (single peptide).
 *
 * Q6 (Peleg 2026-06-18 PDF1 p18): mirror the batch Results KPI cards but
 * for a single peptide. Where the batch dashboard shows percentages
 * across N peptides, here each card is a boolean flag (✓ / ✗) plus a
 * one-line explanation of why the verdict landed where it did.
 *
 * Order matches the canonical PVL class lattice:
 *   Helix → FF-Helix → SSW → FF-SSW
 *
 * Subset relations (FF-Helix ⊆ Helix, FF-SSW ⊆ SSW) are surfaced through
 * the sub-label wording — when the base class fails, the FF-* card says
 * so explicitly so users learn the dependency structure.
 *
 * Color tokens reuse the existing --helix / --ff-helix / --ssw / --ff-ssw
 * CSS variables, so the strip stays in lockstep with the badge row and
 * the dashboard's KPI cards.
 */

import { Card, CardContent } from "@/components/ui/card";
import {
  HelixToFibrilIcon,
  StructuralSwitchIcon,
  SwitchToFibrilIcon,
} from "@/components/icons/PeptideIcons";
import type { Peptide } from "@/types/peptide";

interface QuickKpiStripProps {
  peptide: Peptide;
}

type KpiVerdict = "positive" | "negative" | "na";

interface KpiSpec {
  label: string;
  verdict: KpiVerdict;
  sublabel: string;
  iconColor: string;
  accentVar: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}

// ── Verdict helpers ─────────────────────────────────────────────────

function flagToVerdict(flag: number | null | undefined): KpiVerdict {
  if (flag === 1) return "positive";
  if (flag === -1 || flag === 0) return "negative";
  return "na";
}

function predictionToVerdict(pred: number | null | undefined): KpiVerdict {
  if (pred === 1) return "positive";
  if (pred === 0 || pred === -1) return "negative";
  return "na";
}

// ── Sub-label generators ────────────────────────────────────────────
// Each generator returns one short, plain-English sentence explaining
// why the class flag has its current verdict. Plain-language verdicts
// matter: a researcher should understand the classification without
// touching the threshold tuner.

function helixSubLabel(p: Peptide): string {
  const pct = p.s4predHelixPercent;
  if (p.s4predHelixPrediction === 1) {
    const helixPct = pct != null ? `${pct.toFixed(0)}%` : "≥ threshold";
    return `S4PRED helix coverage ${helixPct}.`;
  }
  if (p.s4predHelixPrediction === 0) {
    return "No helix segment passes the configured threshold.";
  }
  return "S4PRED did not run on this sequence.";
}

function ffHelixSubLabel(p: Peptide): string {
  if (p.ffHelixFlag === 1) {
    const muH = p.muH != null ? p.muH.toFixed(2) : "—";
    return `Helix detected and µH ${muH} above the cut-off.`;
  }
  if (p.ffHelixFlag === -1) {
    if (p.s4predHelixPrediction !== 1) {
      return "Not a candidate — needs Helix first.";
    }
    const muH = p.muH != null ? p.muH.toFixed(2) : "—";
    return `Helix yes, but µH ${muH} is below the cut-off.`;
  }
  return "Pending — depends on Helix and µH.";
}

function sswSubLabel(p: Peptide): string {
  if (p.sswPrediction === 1) {
    return "Helix and β-aggregation overlap detected.";
  }
  if (p.sswPrediction === 0) {
    return "No switching position found in the sequence.";
  }
  return "Requires TANGO; provider did not run.";
}

function ffSswSubLabel(p: Peptide): string {
  if (p.ffSswFlag === 1) {
    const hydro = p.hydrophobicity != null ? p.hydrophobicity.toFixed(2) : "—";
    return `SSW detected and hydrophobicity ${hydro} above the cut-off.`;
  }
  if (p.ffSswFlag === -1) {
    if (p.sswPrediction !== 1) {
      return "Not a candidate — needs SSW first.";
    }
    const hydro = p.hydrophobicity != null ? p.hydrophobicity.toFixed(2) : "—";
    return `SSW yes, but hydrophobicity ${hydro} is below the cut-off.`;
  }
  return "Pending — depends on SSW and hydrophobicity.";
}

// ── Verdict styling ─────────────────────────────────────────────────

function verdictStyles(v: KpiVerdict): {
  badgeText: string;
  badgeClasses: string;
  cardClasses: string;
} {
  switch (v) {
    case "positive":
      return {
        badgeText: "✓",
        badgeClasses: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
        cardClasses: "border-green-500/40",
      };
    case "negative":
      return {
        badgeText: "✗",
        badgeClasses: "bg-muted text-muted-foreground",
        cardClasses: "border-border",
      };
    default:
      return {
        badgeText: "N/A",
        badgeClasses: "bg-muted/40 text-muted-foreground",
        cardClasses: "border-border opacity-70",
      };
  }
}

// ── Component ───────────────────────────────────────────────────────

export function QuickKpiStrip({ peptide }: QuickKpiStripProps) {
  const kpis: KpiSpec[] = [
    {
      label: "Helix",
      verdict: predictionToVerdict(peptide.s4predHelixPrediction),
      sublabel: helixSubLabel(peptide),
      iconColor: "text-[hsl(var(--helix))]",
      accentVar: "hsl(var(--helix))",
      icon: HelixToFibrilIcon,
    },
    {
      label: "FF-Helix",
      verdict: flagToVerdict(peptide.ffHelixFlag),
      sublabel: ffHelixSubLabel(peptide),
      iconColor: "text-[hsl(var(--ff-helix))]",
      accentVar: "hsl(var(--ff-helix))",
      icon: HelixToFibrilIcon,
    },
    {
      label: "SSW",
      verdict: predictionToVerdict(peptide.sswPrediction),
      sublabel: sswSubLabel(peptide),
      iconColor: "text-[hsl(var(--ssw))]",
      accentVar: "hsl(var(--ssw))",
      icon: StructuralSwitchIcon,
    },
    {
      label: "FF-SSW",
      verdict: flagToVerdict(peptide.ffSswFlag),
      sublabel: ffSswSubLabel(peptide),
      iconColor: "text-[hsl(var(--ff-ssw))]",
      accentVar: "hsl(var(--ff-ssw))",
      icon: SwitchToFibrilIcon,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-testid="quick-kpi-strip">
      {kpis.map((k) => {
        const Icon = k.icon;
        const styles = verdictStyles(k.verdict);
        return (
          <Card
            key={k.label}
            className={`rounded-xl shadow-soft ${styles.cardClasses}`}
            data-testid={`quick-kpi-${k.label.toLowerCase()}`}
          >
            <CardContent className="p-3.5 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Icon className={k.iconColor} size={14} />
                  {k.label}
                </span>
                <span
                  className={`inline-flex items-center justify-center px-1.5 min-w-[1.75rem] h-5 rounded-md text-xs font-semibold ${styles.badgeClasses}`}
                >
                  {styles.badgeText}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-snug">{k.sublabel}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
