/**
 * demoStore — global signal for "demo dataset is currently being fetched".
 *
 * Lives outside `useDemoMode` so any page (most importantly Results) can
 * decide whether to render its empty state, redirect to /upload, or show
 * the DemoLoadingSkeleton without remounting the loader hook.
 */

import { create } from "zustand";

interface DemoState {
  isDemoLoading: boolean;
  setDemoLoading: (v: boolean) => void;
}

export const useDemoStore = create<DemoState>((set) => ({
  isDemoLoading: false,
  setDemoLoading: (v) => set({ isDemoLoading: v }),
}));
