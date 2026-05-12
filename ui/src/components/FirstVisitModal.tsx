/**
 * FirstVisitModal — Stripe-Dashboard-level welcome dialog.
 *
 * V8-1 redesign:
 * - Centered dialog, max-width 480px
 * - PVL logo + "Welcome to Peptide Visual Lab"
 * - 2-3 sentence value prop with demo dataset info
 * - 3 highlighted features (icon + 1-line each)
 * - Primary CTA: "Take a tour" (coachmark), Secondary: "Just let me explore"
 * - Close × in top-right, click-outside dismisses
 * - Persistent localStorage flag on dismiss
 *
 * References: Stripe onboarding, Linear first-time popovers, Vercel empty states.
 */

import {
  Sparkles,
  ArrowRight,
  Beaker,
  X,
  Layers,
  Box,
  Link2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { DEMO_DATASET_INFO } from "@/hooks/useDemoMode";

interface FirstVisitModalProps {
  open: boolean;
  onDismiss: () => void;
  /** Called when user clicks "Take a tour". Dismisses the modal. */
  onTour?: () => void;
}

/** Highlighted feature items shown in the modal body. */
const FEATURES = [
  {
    icon: Layers,
    label: "Multi-tool consensus",
    description: "TANGO + S4PRED + FF-Helix in one view",
  },
  {
    icon: Box,
    label: "Live 3D overlay",
    description: "AlphaFold structures with PVL annotations",
  },
  {
    icon: Link2,
    label: "Reproducible permalinks",
    description: "Share exact analysis state via URL",
  },
] as const;

export function FirstVisitModal({
  open,
  onDismiss,
  onTour,
}: FirstVisitModalProps) {
  const handleTour = () => {
    onTour?.();
    onDismiss();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            onClick={onDismiss}
            data-testid="first-visit-backdrop"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-0 z-[61] flex items-center justify-center p-4"
          >
            <div
              className="relative w-full max-w-[480px] rounded-2xl border border-border/60 bg-card shadow-2xl overflow-hidden"
              data-testid="first-visit-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Welcome to Peptide Visual Lab"
            >
              {/* Gradient accent bar */}
              <div className="h-1 bg-gradient-to-r from-primary via-purple-500 to-primary/60" />

              {/* Close button */}
              <button
                onClick={onDismiss}
                className="absolute top-3.5 right-3.5 p-1.5 rounded-lg text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/60 transition-colors"
                aria-label="Close welcome dialog"
                data-testid="first-visit-close"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="px-6 pt-5 pb-6">
                {/* Icon + Title */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Beaker className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      Welcome to Peptide Visual Lab
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      All-in-one peptide analysis dashboard
                    </p>
                  </div>
                </div>

                {/* Value proposition */}
                <p className="text-sm text-muted-foreground leading-relaxed mb-1">
                  PVL combines TANGO, S4PRED, and AlphaFold predictions with
                  biochemical analysis in one interactive dashboard.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                  We've loaded{" "}
                  <span className="text-foreground font-medium">
                    {DEMO_DATASET_INFO.name}
                  </span>{" "}
                  ({DEMO_DATASET_INFO.peptideCount.toLocaleString()} peptides) so
                  you can explore immediately.
                </p>

                {/* Highlighted features */}
                <div
                  className="space-y-3 mb-6"
                  data-testid="first-visit-features"
                >
                  {FEATURES.map((feat) => (
                    <div
                      key={feat.label}
                      className="flex items-start gap-3"
                      data-testid={`feature-${feat.label.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <div className="mt-0.5 h-7 w-7 shrink-0 rounded-lg bg-primary/8 flex items-center justify-center">
                        <feat.icon className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground leading-tight">
                          {feat.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {feat.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  {onTour && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleTour}
                      className="gap-1.5"
                      data-testid="first-visit-tour"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Take a tour
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onDismiss}
                    className="gap-1.5"
                    data-testid="first-visit-explore"
                  >
                    Just let me explore
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
