/**
 * Chart selection state for cross-filtering / linked views.
 *
 * Tracks the currently selected peptide from chart interactions,
 * preview sheet visibility, histogram bin selection, and active tab.
 *
 * Persistence (B1, 2026-05-21): only `activeTab` survives reloads —
 * selections / bin filters / table filters stay transient because they
 * encode mid-interaction context that would be confusing to restore.
 * The activeTab pick, on the other hand, is "which view did I land on" —
 * losing it on reload was a real bug.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface BinSelection {
  ids: string[];
  binLabel: string;
  source: string;
}

export interface TableFilter {
  label: string;
  field: string;
  value: number;
}

interface ChartSelectionState {
  /** Currently selected peptide ID from chart click (null = none) */
  selectedId: string | null;
  /** Source of selection (for breadcrumb navigation) */
  selectedFrom: string | null;
  /** Controls PeptidePreviewSheet visibility */
  sheetOpen: boolean;
  /** Histogram bin click context */
  binSelection: BinSelection | null;
  /** Preserves active Results tab for navigation return */
  activeTab: string;
  /** KPI-driven table filter */
  tableFilter: TableFilter | null;

  /** Set selected peptide (from chart click) — also opens sheet */
  select: (id: string, source: string) => void;
  /** Clear selection */
  clearSelection: () => void;
  /** Control sheet visibility */
  setSheetOpen: (open: boolean) => void;
  /** Select a histogram bin */
  selectBin: (bin: BinSelection) => void;
  /** Clear histogram bin selection */
  clearBinSelection: () => void;
  /** Set active Results tab */
  setActiveTab: (tab: string) => void;
  /** Set table filter from KPI click */
  setTableFilter: (filter: TableFilter | null) => void;
}

export const useChartSelection = create<ChartSelectionState>()(
  persist(
    (set) => ({
      selectedId: null,
      selectedFrom: null,
      sheetOpen: false,
      binSelection: null,
      activeTab: "data",
      tableFilter: null,

      select: (id, source) => set({ selectedId: id, selectedFrom: source, sheetOpen: true }),
      clearSelection: () => set({ selectedId: null, selectedFrom: null, sheetOpen: false }),
      setSheetOpen: (open) =>
        set(
          open
            ? { sheetOpen: true }
            : { sheetOpen: false, selectedId: null, selectedFrom: null }
        ),
      selectBin: (bin) => set({ binSelection: bin }),
      clearBinSelection: () => set({ binSelection: null }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setTableFilter: (filter) => set({ tableFilter: filter }),
    }),
    {
      name: "pvl-chart-selection",
      version: 1,
      // window.localStorage is the jsdom shim in tests + real DOM storage in
      // prod. The bare `localStorage` identifier collides with Node 22+'s
      // file-backed global — see jobStore.ts for the full reasoning.
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : (undefined as never)
      ),
      // Only persist activeTab — selection/bin/table-filter remain transient.
      partialize: (state) => ({ activeTab: state.activeTab }),
    }
  )
);
