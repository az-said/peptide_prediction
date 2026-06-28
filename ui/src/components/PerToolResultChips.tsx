/**
 * PerToolResultChips — Q9 (Peleg 2026-06-18 PDF1 p20).
 *
 * One horizontal row of color-coded chips, one per tool/provider, between
 * the sequence display and the biochemistry comparison block. Each chip
 * shows: tool name + headline number/verdict, in the tool's brand color.
 *
 * Goal: make the predictor outputs scannable without scrolling. The
 * biochem block + helical wheel below already show numeric depth; these
 * chips are the "at a glance" summary.
 *
 * Chip order mirrors the data dependency:
 *   S4PRED → TANGO → FF-Helix → SSW → FF-SSW
 *
 * Colors come from the existing PVL theme tokens (--helix/--beta/--ff-helix/
 * --ssw/--ff-ssw) so the strip stays in lockstep with the KPI cards and
 * Mol* overlay theme.
 */

import { Badge } from "@/components/ui/badge";
import type { Peptide } from "@/types/peptide";

interface PerToolResultChipsProps {
  peptide: Peptide;
}

type Status = "yes" | "no" | "na";

interface ChipSpec {
  toolLabel: string;
  valueLabel: string;
  status: Status;
  bgVar: string;
  borderVar: string;
  fgVar: string;
}

// ── Status helpers ──────────────────────────────────────────────────

function flagStatus(flag: number | null | undefined): Status {
  if (flag === 1) return "yes";
  if (flag === 0 || flag === -1) return "no";
  return "na";
}

function predStatus(pred: number | null | undefined): Status {
  return flagStatus(pred);
}

// ── Chip styling ────────────────────────────────────────────────────
// We pre-define inline-style backgrounds via CSS custom-property strings
// so the chip tokens flex with light/dark themes. shadcn Badge expects a
// className string; the inline style overlays the brand color.

function styleFor(token: string, status: Status): React.CSSProperties {
  const opacity = status === "na" ? 0.45 : status === "yes" ? 1 : 0.75;
  return {
    backgroundColor: `hsl(var(--${token}) / ${status === "yes" ? 0.18 : 0.08})`,
    borderColor: `hsl(var(--${token}) / ${opacity})`,
    color: `hsl(var(--${token}))`,
  };
}

// ── Component ───────────────────────────────────────────────────────

export function PerToolResultChips({ peptide }: PerToolResultChipsProps) {
  // S4PRED — show dominant 3-state with helix percent (if any)
  const helixPct = peptide.s4predHelixPercent;
  const s4predLabel =
    peptide.s4predHelixPrediction === 1 && helixPct != null
      ? `Helix ${helixPct.toFixed(0)}%`
      : peptide.s4predHelixPrediction === 0
        ? "No helix"
        : "N/A";

  // TANGO — show peak aggregation if available
  const tangoPeak = peptide.tangoAggMax;
  const tangoLabel =
    tangoPeak != null ? `Peak agg ${tangoPeak.toFixed(1)}` : peptide.tangoHasData ? "ran" : "N/A";

  const chips: ChipSpec[] = [
    {
      toolLabel: "S4PRED",
      valueLabel: s4predLabel,
      status: predStatus(peptide.s4predHelixPrediction),
      bgVar: "helix",
      borderVar: "helix",
      fgVar: "helix",
    },
    {
      toolLabel: "TANGO",
      valueLabel: tangoLabel,
      status: peptide.tangoHasData ? "yes" : "na",
      bgVar: "beta",
      borderVar: "beta",
      fgVar: "beta",
    },
    {
      toolLabel: "FF-Helix",
      valueLabel:
        peptide.ffHelixFlag === 1 ? "Candidate" : peptide.ffHelixFlag === -1 ? "No" : "N/A",
      status: flagStatus(peptide.ffHelixFlag),
      bgVar: "ff-helix",
      borderVar: "ff-helix",
      fgVar: "ff-helix",
    },
    {
      toolLabel: "SSW",
      valueLabel:
        peptide.sswPrediction === 1 ? "Switch" : peptide.sswPrediction === 0 ? "Stable" : "N/A",
      status: predStatus(peptide.sswPrediction),
      bgVar: "ssw",
      borderVar: "ssw",
      fgVar: "ssw",
    },
    {
      toolLabel: "FF-SSW",
      valueLabel: peptide.ffSswFlag === 1 ? "Candidate" : peptide.ffSswFlag === -1 ? "No" : "N/A",
      status: flagStatus(peptide.ffSswFlag),
      bgVar: "ff-ssw",
      borderVar: "ff-ssw",
      fgVar: "ff-ssw",
    },
  ];

  return (
    <div
      className="flex flex-wrap items-center gap-2 px-1 py-1.5"
      data-testid="per-tool-result-chips"
    >
      <span className="text-xs text-muted-foreground mr-1 shrink-0">Per-tool result:</span>
      {chips.map((c) => (
        <Badge
          key={c.toolLabel}
          variant="outline"
          style={styleFor(c.bgVar, c.status)}
          className="text-xs font-medium gap-1 px-2 py-0.5 border whitespace-nowrap"
          data-testid={`tool-chip-${c.toolLabel.toLowerCase().replace(/\W+/g, "-")}`}
        >
          <span className="opacity-60">{c.toolLabel}</span>
          <span className="font-semibold">{c.valueLabel}</span>
        </Badge>
      ))}
    </div>
  );
}
