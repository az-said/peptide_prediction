/**
 * CSS-only regular dot grid background pattern.
 * Adapts opacity automatically for dark/light mode.
 *
 * Per Said directive 2026-05-12: viewport-fixed (not page-scrolling).
 * The dots stay still while content scrolls past them — gives the page
 * a calm, anchored feel rather than the parallax-of-a-parallax effect
 * you get when the background scrolls with its container.
 *
 * @example
 * <div className="relative min-h-screen">
 *   <BgDotGrid />
 *   <div className="relative z-10">Content here</div>
 * </div>
 */

import { cn } from "@/lib/utils";

interface BgDotGridProps {
  /** Override opacity (0-1). If not set, auto-detects dark (0.04) / light (0.07). */
  opacity?: number;
  /** Grid spacing in px. Default: 24 */
  spacing?: number;
  className?: string;
}

export function BgDotGrid({ opacity, spacing = 24, className }: BgDotGridProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-0 pointer-events-none overflow-hidden",
        // Auto dark/light opacity if no override
        !opacity && "opacity-[0.15] dark:opacity-[0.06]",
        className
      )}
      style={{
        ...(opacity != null ? { opacity } : {}),
        backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
        backgroundSize: `${spacing}px ${spacing}px`,
        color: "hsl(var(--foreground))",
      }}
      aria-hidden="true"
    />
  );
}
