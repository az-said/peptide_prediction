/**
 * reproducibilityStore — Zustand store for analysis reproducibility state.
 *
 * Tracks: query metadata, dataset hash, build info, and permalink state.
 * Fed by ingest flows (CSV upload, UniProt query, Quick Analyze) and
 * consumed by ReproducibilityRibbon + CitationDialog.
 */

import { create } from "zustand";
import type { QueryMetadata } from "@/lib/permalink";
import { computeDatasetHash } from "@/lib/permalink";

// ── Build info (injected by Vite at build time) ────────────────────────────

export const PVL_VERSION: string =
  // @ts-expect-error — injected by vite.config.ts define
  typeof __APP_VERSION__ === "string" ? __APP_VERSION__ : "0.0.0-dev";

export const BUILD_SHA: string =
  // @ts-expect-error — injected by vite.config.ts define
  typeof __BUILD_SHA__ === "string" ? __BUILD_SHA__ : "dev";

// ── Store ──────────────────────────────────────────────────────────────────

interface ReproducibilityState {
  /** Query metadata for the current analysis */
  queryMeta: QueryMetadata | null;
  /** SHA-256 hex digest of the input data */
  datasetHash: string | null;
  /** Whether the hash is being computed */
  isHashing: boolean;

  /** Set query metadata (called by ingest flows) */
  setQueryMeta: (meta: QueryMetadata) => void;
  /** Compute and set dataset hash from input string */
  setDatasetHashFromInput: (input: string) => Promise<void>;
  /** Directly set dataset hash (for cases where it's already known) */
  setDatasetHash: (hash: string) => void;
  /** Clear all reproducibility state (on reset/new analysis) */
  clear: () => void;
}

export const useReproducibilityStore = create<ReproducibilityState>(
  (set) => ({
    queryMeta: null,
    datasetHash: null,
    isHashing: false,

    setQueryMeta: (meta) => set({ queryMeta: meta }),

    setDatasetHashFromInput: async (input) => {
      set({ isHashing: true });
      try {
        const hash = await computeDatasetHash(input);
        set({ datasetHash: hash, isHashing: false });
      } catch {
        set({ isHashing: false });
      }
    },

    setDatasetHash: (hash) => set({ datasetHash: hash }),

    clear: () =>
      set({
        queryMeta: null,
        datasetHash: null,
        isHashing: false,
      }),
  }),
);
