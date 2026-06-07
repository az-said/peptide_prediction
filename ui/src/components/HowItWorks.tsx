/**
 * HowItWorks — 4-step visual walkthrough for the landing page.
 *
 * Each card: icon, step number, title, 1-sentence description.
 * Designed for the "How it works" section below the hero.
 *
 * Steps:
 * 1. Paste / upload sequences (CSV, FASTA, UniProt query)
 * 2. PVL runs TANGO + S4PRED + biochem + flags
 * 3. Interactive dashboard: classifications, distributions, 3D overlay, drill-down
 * 4. Export figure pack or copy permalink for your paper
 */

import { Upload, Cpu, BarChart3, FileDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface HowItWorksProps {
  className?: string;
}

const STEPS = [
  {
    step: 1,
    icon: Upload,
    title: "Paste or Upload",
    description:
      "Single sequence, CSV batch, FASTA file, or UniProt proteome query. Any input, same pipeline.",
    accent: "from-primary/20 to-primary/5",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  // 2026-06-07 (Peleg Zoom 2026-06-04): step 2 split into 2a (parallel raw
  // predictors run) and 2b (Peleg's downstream classification rules applied
  // to their outputs). The old single step mistakenly listed FF-Helix as a
  // predictor running in parallel with TANGO/S4PRED; it's actually a
  // downstream classification derived from S4PRED helix segments + dataset-
  // derived μH threshold — exactly what Peleg flagged on the call.
  {
    step: "2a",
    icon: Cpu,
    title: "Run S4PRED + TANGO + biochem",
    description:
      "Three independent inputs run in parallel: S4PRED secondary-structure prediction (per-residue helix/β/coil), TANGO β-strand aggregation propensity, and biochemical features (Fauchère-Pliska hydrophobicity, charge at pH 7.4, μH).",
    accent: "from-purple-500/20 to-purple-500/5",
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-500",
  },
  {
    step: "2b",
    icon: Cpu,
    title: "Apply Ragonis-Bachar / Rayan classification rules",
    description:
      "Peleg's gap-smoothed segment finder (MIN_SEGMENT_LENGTH=5, MAX_GAP=3) re-interprets the raw predictor outputs. Dataset-derived thresholds — the mean μH over helix-positive peptides and the mean hydrophobicity over SSW-positive peptides in your batch — gate the FF-Helix and FF-SSW candidate flags.",
    accent: "from-fuchsia-500/20 to-fuchsia-500/5",
    iconBg: "bg-fuchsia-500/10",
    iconColor: "text-fuchsia-500",
  },
  {
    step: 3,
    icon: BarChart3,
    title: "Interactive Dashboard",
    description:
      "Classification sets, distribution charts, correlation matrices, 3D structure overlay, and per-residue drill-down.",
    accent: "from-green-500/20 to-green-500/5",
    iconBg: "bg-green-500/10",
    iconColor: "text-green-500",
  },
  {
    step: 4,
    icon: FileDown,
    title: "Export & Cite",
    description:
      "Download a publication-ready figure pack (SVG/PNG) or copy a reproducible permalink with auto-generated BibTeX.",
    accent: "from-amber-500/20 to-amber-500/5",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-500",
  },
] as const;

export function HowItWorks({ className }: HowItWorksProps) {
  return (
    <div className={className} data-testid="how-it-works">
      {/* Heading */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3">
          How It Works
        </h2>
        <p className="text-lg text-muted-foreground leading-relaxed">
          From sequence to publication in four steps.
        </p>
      </div>

      {/* Step cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {STEPS.map(({ step, icon: Icon, title, description, accent, iconBg, iconColor }) => (
          <div
            key={step}
            className="relative rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm p-6 group hover:border-border transition-colors"
            data-testid={`how-step-${step}`}
          >
            {/* Gradient accent top */}
            <div
              className={cn(
                "absolute top-0 left-0 right-0 h-1 rounded-t-xl bg-gradient-to-r",
                accent
              )}
            />

            {/* Step number */}
            <span className="text-xs font-mono text-muted-foreground/50 mb-3 block">
              Step {step}
            </span>

            {/* Icon */}
            <div
              className={cn("h-12 w-12 rounded-xl flex items-center justify-center mb-4", iconBg)}
            >
              <Icon className={cn("h-6 w-6", iconColor)} />
            </div>

            {/* Content */}
            <h3 className="text-base font-semibold text-foreground mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
