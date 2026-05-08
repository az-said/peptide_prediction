/**
 * DemoModeChip — Floating indicator when demo data is active.
 *
 * V8-1 polish:
 * - Position: bottom-right, 16px from edges
 * - Two states: collapsed (icon only) ↔ expanded (icon + dataset name + CTA)
 * - Smooth transitions on hover/focus
 * - Dismissible with localStorage persistence
 *
 * Design: Stripe-style restraint — subtle, non-blocking, informative.
 */

import { useState } from "react";
import { X, Upload, Beaker } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { DEMO_DATASET_INFO } from "@/hooks/useDemoMode";

interface DemoModeChipProps {
  /** Subset of useDemoMode() return — pass them through */
  isDemo: boolean;
  isDemoLoading: boolean;
  isChipDismissed: boolean;
  clearDemo: () => void;
  dismissChip: () => void;
}

export function DemoModeChip({
  isDemo,
  isDemoLoading,
  isChipDismissed,
  clearDemo,
  dismissChip,
}: DemoModeChipProps) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(true);

  const visible = (isDemo || isDemoLoading) && !isChipDismissed;

  const handleUpload = () => {
    clearDemo();
    navigate("/upload");
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-4 right-4 z-50"
          data-testid="demo-mode-chip"
          onMouseEnter={() => setIsExpanded(true)}
          onFocus={() => setIsExpanded(true)}
        >
          <motion.div
            layout
            className="rounded-xl border border-border/60 bg-card/95 backdrop-blur-md shadow-lg overflow-hidden"
            transition={{ layout: { duration: 0.25, ease: "easeOut" } }}
          >
            <div className="flex items-start gap-3 px-4 py-3">
              {/* Icon */}
              <div className="shrink-0 mt-0.5">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Beaker className="h-4 w-4 text-primary" />
                </div>
              </div>

              {/* Content — expanded */}
              <AnimatePresence mode="wait">
                {isDemoLoading ? (
                  <motion.p
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-muted-foreground self-center"
                  >
                    Loading demo dataset…
                  </motion.p>
                ) : isExpanded ? (
                  <motion.div
                    key="expanded"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 min-w-0"
                  >
                    <p className="text-sm font-medium text-foreground leading-tight">
                      Demo data: {DEMO_DATASET_INFO.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {DEMO_DATASET_INFO.peptideCount.toLocaleString()} peptides
                    </p>
                    <button
                      onClick={handleUpload}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 mt-1.5 transition-colors group"
                      data-testid="demo-upload-cta"
                    >
                      <Upload className="h-3 w-3" />
                      <span className="group-hover:underline">
                        Use your own data →
                      </span>
                    </button>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              {/* Dismiss */}
              {!isDemoLoading && (
                <button
                  onClick={dismissChip}
                  className="shrink-0 p-1 rounded-md text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/60 transition-colors"
                  aria-label="Dismiss demo chip"
                  data-testid="demo-chip-dismiss"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
