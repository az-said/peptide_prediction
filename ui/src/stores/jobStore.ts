/**
 * Zustand store for tracking active background analysis jobs.
 *
 * Features:
 * - Persisted to localStorage (jobs survive page refresh)
 * - Auto-polls every 2 seconds for async (Celery) jobs
 * - Synthetic sync jobs (V10-3): same TrackedJob shape, time-estimated progress
 * - Calls ingestBackendRows on SUCCESS
 * - Shows toast notifications for completion/failure
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { toast } from "sonner";

import { pollJobStatus, cancelJob as apiCancelJob, cancelSyncJob } from "@/lib/jobApi";
import type { JobProgress, JobStatusValue } from "@/lib/jobApi";
import { toDatasetMetadata } from "@/lib/metaAdapter";
import { useDatasetStore } from "./datasetStore";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type JobKind = "async" | "sync";

export interface TrackedJob {
  jobId: string;
  kind: JobKind;
  fileName: string;
  peptideCount: number;
  status: JobStatusValue;
  progress: JobProgress | null;
  createdAt: number;
  error: string | null;
  /** Sync-only: cancel token for backend /cancel-sync/{token} */
  cancelToken?: string;
  /** Sync-only: AbortController for the HTTP request */
  _abortController?: AbortController;
}

export interface SyncJobOpts {
  peptideCount: number;
  fileName: string;
  hasTango?: boolean;
  hasS4pred?: boolean;
  cancelToken?: string;
  abortController?: AbortController;
}

interface JobStore {
  /** Map of jobId → tracked job */
  jobs: Record<string, TrackedJob>;

  /** Add a new async job and start polling */
  addJob: (jobId: string, fileName: string, peptideCount: number) => void;

  /** Start a synthetic sync job (V10-3) */
  startSyncJob: (opts: SyncJobOpts) => string;

  /** Tick sync job progress — call every 500ms from Upload's sync handler */
  tickSyncProgress: (jobId: string) => void;

  /** Mark a sync job as complete and remove it */
  completeSyncJob: (jobId: string) => void;

  /** Mark a sync job as failed */
  failSyncJob: (jobId: string, error: string) => void;

  /** Cancel a running job (handles both sync and async) */
  cancelJob: (jobId: string) => void;

  /** Remove a completed/failed job from tracking */
  removeJob: (jobId: string) => void;

  /** Clear all jobs */
  clearAll: () => void;

  /** Get count of active (non-terminal) jobs */
  activeCount: () => number;

  /** Get the first active job (convenience for AnalysisProgress) */
  getActiveJob: () => TrackedJob | null;

  /** Resume polling for any persisted active jobs (called on mount) */
  resumePolling: () => void;
}

// ---------------------------------------------------------------------------
// Sync job time estimation (moved from AnalysisProgress.tsx)
// ---------------------------------------------------------------------------

/**
 * Estimate total processing time in seconds.
 * Based on observed timings on VPS (4 vCPU, 8GB):
 *   FF-Helix + Biochem: ~2s + 0.001s/peptide (fast, vectorized)
 *   TANGO (parallelized): ~5s + 0.5s/peptide (batched subprocess, ~4 parallel)
 *   S4PRED: ~3s + 1s/peptide (LSTM per-sequence, CPU-bound)
 */
export function estimateSyncTotal(count: number, tango: boolean, s4pred: boolean): number {
  let base = 3;
  let perPeptide = 0.001;
  if (tango) {
    base += 5;
    perPeptide += 0.5;
  }
  if (s4pred) {
    base += 3;
    perPeptide += 1.0;
  }
  return Math.max(5, base + count * perPeptide);
}

const SYNC_STAGES: Array<{ threshold: number; label: string }> = [
  { threshold: 0, label: "parsing" },
  { threshold: 0.1, label: "ff_helix" },
  { threshold: 0.25, label: "biochem" },
  { threshold: 0.4, label: "tango" },
  { threshold: 0.65, label: "s4pred" },
  { threshold: 0.85, label: "normalize" },
];

function syncStageForPercent(pct: number): string {
  let stage = "parsing";
  for (const s of SYNC_STAGES) {
    if (pct >= s.threshold * 100) stage = s.label;
  }
  return stage;
}

// ---------------------------------------------------------------------------
// Polling management (module-level, not persisted)
// ---------------------------------------------------------------------------

const pollingIntervals = new Map<string, ReturnType<typeof setInterval>>();

const POLL_INTERVAL_MS = 2000;

function stopPolling(jobId: string) {
  const interval = pollingIntervals.get(jobId);
  if (interval) {
    clearInterval(interval);
    pollingIntervals.delete(jobId);
  }
}

function isTerminal(status: JobStatusValue): boolean {
  return status === "SUCCESS" || status === "FAILURE" || status === "REVOKED";
}

// Sync job estimated totals (not persisted, module-level)
const syncEstimates = new Map<string, number>();

let syncIdCounter = 0;

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useJobStore = create<JobStore>()(
  persist(
    (set, get) => ({
      jobs: {},

      addJob: (jobId, fileName, peptideCount) => {
        const job: TrackedJob = {
          jobId,
          kind: "async",
          fileName,
          peptideCount,
          status: "PENDING",
          progress: null,
          createdAt: Date.now(),
          error: null,
        };

        set((state) => ({
          jobs: { ...state.jobs, [jobId]: job },
        }));

        startPolling(jobId, set, get);
      },

      startSyncJob: (opts) => {
        const jobId = `sync-${++syncIdCounter}-${Date.now()}`;
        const estTotal = estimateSyncTotal(
          opts.peptideCount,
          opts.hasTango ?? true,
          opts.hasS4pred ?? true
        );
        syncEstimates.set(jobId, estTotal);

        const job: TrackedJob = {
          jobId,
          kind: "sync",
          fileName: opts.fileName,
          peptideCount: opts.peptideCount,
          status: "STARTED",
          progress: { stage: "parsing", percent: 0 },
          createdAt: Date.now(),
          error: null,
          cancelToken: opts.cancelToken,
          _abortController: opts.abortController,
        };

        set((state) => ({
          jobs: { ...state.jobs, [jobId]: job },
        }));

        return jobId;
      },

      tickSyncProgress: (jobId) => {
        const job = get().jobs[jobId];
        if (!job || job.kind !== "sync" || isTerminal(job.status)) return;

        const elapsed = (Date.now() - job.createdAt) / 1000;
        const estTotal = syncEstimates.get(jobId) ?? 30;
        const pct = Math.min(95, (elapsed / estTotal) * 100);
        const stage = syncStageForPercent(pct);

        set((state) => ({
          jobs: {
            ...state.jobs,
            [jobId]: {
              ...state.jobs[jobId],
              status: "PROGRESS",
              progress: { stage, percent: Math.round(pct), peptide_count: job.peptideCount },
            },
          },
        }));
      },

      completeSyncJob: (jobId) => {
        syncEstimates.delete(jobId);
        set((state) => {
          const { [jobId]: _, ...rest } = state.jobs;
          return { jobs: rest };
        });
      },

      failSyncJob: (jobId, error) => {
        syncEstimates.delete(jobId);
        set((state) => ({
          jobs: {
            ...state.jobs,
            [jobId]: { ...state.jobs[jobId], status: "FAILURE" as const, error },
          },
        }));
      },

      cancelJob: async (jobId) => {
        const job = get().jobs[jobId];
        if (!job) return;

        if (job.kind === "sync") {
          // Sync job: cancel via token + abort HTTP request
          if (job.cancelToken) {
            cancelSyncJob(job.cancelToken).catch(() => {});
          }
          if (job._abortController) {
            job._abortController.abort();
          }
          syncEstimates.delete(jobId);
          set((state) => ({
            jobs: {
              ...state.jobs,
              [jobId]: { ...state.jobs[jobId], status: "REVOKED" as const },
            },
          }));
          toast.info("Analysis cancelled");
        } else {
          // Async job: cancel via API
          try {
            await apiCancelJob(jobId);
            stopPolling(jobId);
            set((state) => ({
              jobs: {
                ...state.jobs,
                [jobId]: { ...state.jobs[jobId], status: "REVOKED" as const },
              },
            }));
            toast.info("Analysis cancelled");
          } catch (e: any) {
            toast.error(`Failed to cancel: ${e.message}`);
          }
        }
      },

      removeJob: (jobId) => {
        stopPolling(jobId);
        syncEstimates.delete(jobId);
        set((state) => {
          const { [jobId]: _, ...rest } = state.jobs;
          return { jobs: rest };
        });
      },

      clearAll: () => {
        for (const jobId of Object.keys(get().jobs)) {
          stopPolling(jobId);
        }
        syncEstimates.clear();
        set({ jobs: {} });
      },

      activeCount: () => {
        return Object.values(get().jobs).filter((j) => !isTerminal(j.status)).length;
      },

      getActiveJob: () => {
        const active = Object.values(get().jobs).filter((j) => !isTerminal(j.status));
        return active.length > 0 ? active[0] : null;
      },

      resumePolling: () => {
        const { jobs } = get();
        for (const job of Object.values(jobs)) {
          // Only resume polling for async jobs
          if (job.kind === "async" && !isTerminal(job.status) && !pollingIntervals.has(job.jobId)) {
            startPolling(job.jobId, set, get);
          }
          // Sync jobs that survived refresh are stale — clear them
          if (job.kind === "sync" && !isTerminal(job.status)) {
            set((state) => {
              const { [job.jobId]: _, ...rest } = state.jobs;
              return { jobs: rest };
            });
          }
        }
      },
    }),
    {
      name: "pvl-jobs",
      version: 2,
      // Explicit storage — must target `window.localStorage` rather than the
      // bare `localStorage` identifier. Node 22+ exposes its own global
      // `localStorage` (file-backed, requires --localstorage-file) which
      // shadows jsdom's window.localStorage in vitest and causes
      // `storage.setItem is not a function` errors. `window.localStorage` is
      // unambiguously the jsdom shim in test and the real DOM storage in prod.
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : (undefined as never)
      ),
      // Only persist the jobs map — omit _abortController (not serializable)
      partialize: (state) => ({
        jobs: Object.fromEntries(
          Object.entries(state.jobs).map(([k, v]) => {
            const { _abortController, ...rest } = v;
            return [k, rest];
          })
        ),
      }),
    }
  )
);

// ---------------------------------------------------------------------------
// Polling implementation (async jobs only)
// ---------------------------------------------------------------------------

function startPolling(
  jobId: string,
  set: (fn: (state: JobStore) => Partial<JobStore>) => void,
  get: () => JobStore
) {
  // Don't duplicate polling
  if (pollingIntervals.has(jobId)) return;

  const interval = setInterval(async () => {
    try {
      const status = await pollJobStatus(jobId);

      // Update job state
      set((state) => ({
        jobs: {
          ...state.jobs,
          [jobId]: {
            ...state.jobs[jobId],
            status: status.status,
            progress: status.progress,
            error: status.error,
          },
        },
      }));

      // Handle terminal states
      if (status.status === "SUCCESS" && status.result) {
        stopPolling(jobId);

        // Ingest results into the dataset store
        const { rows, meta } = status.result;
        useDatasetStore.getState().ingestBackendRows(rows, toDatasetMetadata(meta));

        const job = get().jobs[jobId];
        toast.success(`Analysis complete — ${rows.length} peptides`, {
          description: job?.fileName ?? undefined,
        });

        // Navigate to results (if the app has a navigate function)
        if (window.__pvlNavigate) {
          window.__pvlNavigate("/results");
        }
      } else if (status.status === "FAILURE") {
        stopPolling(jobId);
        toast.error(`Analysis failed: ${status.error || "Unknown error"}`);
      } else if (status.status === "REVOKED") {
        stopPolling(jobId);
      }
    } catch {
      // Network error — keep polling, might recover
    }
  }, POLL_INTERVAL_MS);

  pollingIntervals.set(jobId, interval);
}

// ---------------------------------------------------------------------------
// Global navigate helper (set by App.tsx)
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    __pvlNavigate?: (path: string) => void;
  }
}
