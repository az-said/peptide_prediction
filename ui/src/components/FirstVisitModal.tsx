/**
 * FirstVisitModal — Low-key welcome dialog on first-ever visit.
 *
 * "Welcome to PVL. We've loaded an example dataset so you can explore.
 *  [Take a tour] [Just let me explore]"
 *
 * Design: Stripe-style restraint — centered, clean, minimal animation.
 * Doesn't block interaction — clicking outside also dismisses.
 *
 * "Take a tour" is wired to a future coachmark system (react-joyride or custom).
 * For now, it just calls onTour() callback and dismisses.
 */

import { Sparkles, ArrowRight, Beaker } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { DEMO_DATASET_INFO } from "@/hooks/useDemoMode";

interface FirstVisitModalProps {
  open: boolean;
  onDismiss: () => void;
  /** Called when user clicks "Take a tour". Dismisses the modal. */
  onTour?: () => void;
}

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
              className="w-full max-w-md rounded-2xl border border-border/60 bg-card shadow-2xl overflow-hidden"
              data-testid="first-visit-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Welcome to PVL"
            >
              {/* Gradient accent bar */}
              <div className="h-1 bg-gradient-to-r from-primary via-purple-500 to-primary/60" />

              <div className="px-6 py-6">
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

                {/* Body */}
                <p className="text-sm text-muted-foreground leading-relaxed mb-1">
                  We've loaded an example dataset so you can explore immediately.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                  <span className="text-foreground font-medium">
                    {DEMO_DATASET_INFO.name}
                  </span>{" "}
                  — {DEMO_DATASET_INFO.peptideCount.toLocaleString()} peptides with
                  TANGO, S4PRED, and FF-Helix predictions ready to explore.
                </p>

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
