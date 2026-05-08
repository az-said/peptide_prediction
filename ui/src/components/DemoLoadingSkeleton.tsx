/**
 * DemoLoadingSkeleton — placeholder shown on Results while the demo dataset
 * is still being fetched (~1-3s for JSON path, longer for XLSX fallback).
 *
 * V8-1 redesign:
 * - Uses framer-motion for smooth shimmer animation (gradient sweep)
 * - Mimics Results page layout: KPI cards, set diagram, table rows, chart area
 * - Kept intentionally generic so it doesn't lock layout if Results changes
 */

import { motion, type Variants } from "framer-motion";
import { Beaker } from "lucide-react";

// ---------------------------------------------------------------------------
// Shimmer primitives
// ---------------------------------------------------------------------------

const shimmerVariants: Variants = {
  initial: { backgroundPosition: "-200% 0" },
  animate: {
    backgroundPosition: "200% 0",
    transition: {
      duration: 1.8,
      ease: "linear",
      repeat: Infinity,
    },
  },
};

/** Animated shimmer block using framer-motion gradient sweep. */
function Shimmer({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      className={`rounded-md bg-gradient-to-r from-muted/40 via-muted/80 to-muted/40 bg-[length:200%_100%] ${className}`}
      variants={shimmerVariants}
      initial="initial"
      animate="animate"
      style={style}
    />
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Single KPI card skeleton. */
function KPICardSkeleton() {
  return (
    <div className="rounded-xl border border-border/40 bg-card/50 p-5 space-y-3">
      <Shimmer className="h-3 w-1/2" />
      <Shimmer className="h-8 w-3/4" />
      <Shimmer className="h-2 w-full" />
    </div>
  );
}

/** Set diagram skeleton (circle + legend strips). */
function SetDiagramSkeleton() {
  return (
    <div className="rounded-xl border border-border/40 bg-card/50 p-6 flex flex-col items-center justify-center gap-4">
      <Shimmer className="h-4 w-32" />
      <motion.div
        className="h-40 w-40 rounded-full bg-gradient-to-r from-muted/40 via-muted/80 to-muted/40 bg-[length:200%_100%]"
        variants={shimmerVariants}
        initial="initial"
        animate="animate"
      />
      <div className="flex gap-3">
        <Shimmer className="h-3 w-16" />
        <Shimmer className="h-3 w-16" />
        <Shimmer className="h-3 w-16" />
      </div>
    </div>
  );
}

/** Table row skeleton. */
function TableRowSkeleton({ wide = false }: { wide?: boolean }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Shimmer className="h-4 w-16 shrink-0" />
      <Shimmer className={`h-4 ${wide ? "w-full" : "w-3/4"}`} />
      <Shimmer className="h-4 w-12 shrink-0" />
      <Shimmer className="h-4 w-12 shrink-0" />
      <Shimmer className="h-4 w-8 shrink-0" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface DemoLoadingSkeletonProps {
  className?: string;
}

export function DemoLoadingSkeleton({ className }: DemoLoadingSkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={`max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 ${className ?? ""}`}
      data-testid="demo-loading-skeleton"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading demo dataset"
    >
      {/* Header with status */}
      <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/50 px-4 py-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Beaker className="h-4 w-4 text-primary animate-pulse" />
        </div>
        <div className="space-y-1.5 flex-1">
          <Shimmer className="h-3.5 w-48" />
          <Shimmer className="h-3 w-72" />
        </div>
      </div>

      {/* KPI cards row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-testid="skeleton-kpi-row">
        <KPICardSkeleton />
        <KPICardSkeleton />
        <KPICardSkeleton />
        <KPICardSkeleton />
      </div>

      {/* Main content: diagram + table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Set diagram (1 col) */}
        <div className="lg:col-span-1" data-testid="skeleton-diagram">
          <SetDiagramSkeleton />
        </div>

        {/* Table (2 cols) */}
        <div
          className="lg:col-span-2 rounded-xl border border-border/40 bg-card/50 p-4"
          data-testid="skeleton-table"
        >
          {/* Table header */}
          <div className="flex items-center gap-3 pb-3 mb-3 border-b border-border/30">
            <Shimmer className="h-4 w-24" />
            <Shimmer className="h-4 w-32" />
            <div className="flex-1" />
            <Shimmer className="h-7 w-20 rounded-md" />
          </div>

          {/* Table rows */}
          <div className="space-y-1">
            <TableRowSkeleton wide />
            <TableRowSkeleton />
            <TableRowSkeleton wide />
            <TableRowSkeleton />
            <TableRowSkeleton wide />
            <TableRowSkeleton />
          </div>
        </div>
      </div>

      {/* Chart area placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border/40 bg-card/50 p-4 space-y-3">
          <Shimmer className="h-4 w-36" />
          <Shimmer className="h-40 w-full rounded-lg" />
        </div>
        <div className="rounded-xl border border-border/40 bg-card/50 p-4 space-y-3">
          <Shimmer className="h-4 w-28" />
          <Shimmer className="h-40 w-full rounded-lg" />
        </div>
      </div>
    </motion.div>
  );
}
