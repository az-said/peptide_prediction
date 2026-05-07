/**
 * sentryContext.ts — Rich context helpers for Sentry events.
 *
 * Sets structured context on every Sentry event so crash reports include:
 * - Current dataset metadata (peptide count, source, predictors)
 * - Active threshold preset
 * - Viewport class (mobile/tablet/desktop)
 * - Theme (light/dark)
 * - Anonymous session ID (UUID, persisted in localStorage)
 *
 * Wire into App.tsx boot + datasetStore.setPeptides so every error
 * carries the active dataset context.
 *
 * @example
 * ```ts
 * import { setPVLSentryContext, initSentrySession } from "@/lib/sentryContext";
 *
 * // On app boot:
 * initSentrySession();
 *
 * // After dataset loads:
 * setPVLSentryContext({
 *   peptideCount: 2916,
 *   predictors: ["tango", "s4pred"],
 *   dataSource: "csv",
 *   thresholdPreset: "original",
 * });
 * ```
 */

import * as Sentry from "@sentry/react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PVLSentryContext {
  /** Number of peptides in the current dataset */
  peptideCount?: number;
  /** Active predictors */
  predictors?: string[];
  /** How the data was loaded */
  dataSource?: "demo" | "quick" | "csv" | "fasta" | "uniprot";
  /** Active threshold preset name */
  thresholdPreset?: string;
  /** Viewport class */
  viewport?: "mobile" | "tablet" | "desktop";
  /** Current theme */
  theme?: "light" | "dark";
}

// ---------------------------------------------------------------------------
// Session ID (anonymous, persisted)
// ---------------------------------------------------------------------------

const LS_SESSION_KEY = "pvl-session-id";

/** Generate a v4-ish UUID without crypto import overhead. */
function generateSessionId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/**
 * Get or create an anonymous session ID for Sentry user tracking.
 * Persisted in localStorage so the same browser session always maps
 * to the same Sentry "user". No PII is collected.
 */
export function getSessionId(): string {
  try {
    let id = localStorage.getItem(LS_SESSION_KEY);
    if (!id) {
      id = generateSessionId();
      localStorage.setItem(LS_SESSION_KEY, id);
    }
    return id;
  } catch {
    // localStorage unavailable — return ephemeral ID
    return generateSessionId();
  }
}

/**
 * Initialize the Sentry user with an anonymous session ID.
 * Call once on app boot.
 */
export function initSentrySession(): void {
  const sessionId = getSessionId();
  Sentry.setUser({ id: sessionId });
}

// ---------------------------------------------------------------------------
// Viewport detection
// ---------------------------------------------------------------------------

function getViewportClass(): "mobile" | "tablet" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  if (w < 640) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

// ---------------------------------------------------------------------------
// Theme detection
// ---------------------------------------------------------------------------

function getTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

// ---------------------------------------------------------------------------
// Main context setter
// ---------------------------------------------------------------------------

/**
 * Set PVL-specific Sentry context on all future events.
 *
 * Call after:
 * - Dataset is loaded/changed → peptideCount, dataSource, predictors
 * - Theme changes → theme
 * - Threshold preset changes → thresholdPreset
 *
 * Partial updates are merged with previous context.
 */
export function setPVLSentryContext(ctx: PVLSentryContext): void {
  // Structured context (appears in Sentry event sidebar)
  Sentry.setContext("pvl", {
    peptide_count: ctx.peptideCount ?? null,
    predictors: ctx.predictors?.join(", ") ?? null,
    data_source: ctx.dataSource ?? null,
    threshold_preset: ctx.thresholdPreset ?? null,
    viewport: ctx.viewport ?? getViewportClass(),
    theme: ctx.theme ?? getTheme(),
  });

  // Also set as tags for filtering in Sentry search
  if (ctx.dataSource) {
    Sentry.setTag("data_source", ctx.dataSource);
  }
  if (ctx.peptideCount !== undefined) {
    Sentry.setTag(
      "dataset_size",
      ctx.peptideCount > 1000
        ? "large"
        : ctx.peptideCount > 100
          ? "medium"
          : "small",
    );
  }
  if (ctx.thresholdPreset) {
    Sentry.setTag("threshold_preset", ctx.thresholdPreset);
  }
}

/**
 * Clear PVL context (e.g., when dataset is reset).
 */
export function clearPVLSentryContext(): void {
  Sentry.setContext("pvl", null);
  Sentry.setTag("data_source", "");
  Sentry.setTag("dataset_size", "");
  Sentry.setTag("threshold_preset", "");
}

// ---------------------------------------------------------------------------
// Release string builder
// ---------------------------------------------------------------------------

/**
 * Build the Sentry release string.
 * Format: `pvl@{version}-{sha}` (matches backend convention).
 */
export function buildSentryRelease(version: string, sha?: string): string {
  const base = `pvl@${version}`;
  return sha ? `${base}-${sha}` : base;
}
