/**
 * Single source of truth for API base URL.
 *
 * All API calls must use this constant - no hardcoded URLs allowed.
 *
 * Behavior:
 * - If VITE_API_BASE_URL is set: Use it (production or dev with explicit URL)
 * - In development only: Fall back to relative URL (uses vite proxy)
 * - In production: VITE_API_BASE_URL is required (throws if missing)
 *
 * The vite.config.ts proxy is only used in development and should match VITE_API_BASE_URL.
 * Production builds make direct requests to VITE_API_BASE_URL and do NOT use the proxy.
 */
export const API_BASE = (() => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;

  // If VITE_API_BASE_URL is explicitly set (even to ""), use it.
  // Fetch calls already include /api/ in their paths, so "" is the
  // correct value for same-origin deployments (Docker with nginx proxy).
  if (typeof envUrl === "string") {
    return envUrl.trim();
  }

  // Not set at all — in dev, fall back to relative URL (vite proxy handles it)
  if (import.meta.env.DEV) {
    console.warn("[API_BASE] VITE_API_BASE_URL not set, using relative URL (dev proxy).");
    return "";
  }

  // Production without VITE_API_BASE_URL is an error
  throw new Error(
    "VITE_API_BASE_URL must be set in production. " +
      "Set it in your build environment or .env.production file."
  );
})();

import type { ThresholdConfig, Peptide } from "@/types/peptide";
import type { RowsResponse, PredictResponse } from "@/types/api";
import { mapApiRowToPeptide } from "@/lib/peptideMapper";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function handleResponse(res: Response) {
  const text = await res.text();
  if (!res.ok) {
    // try to parse JSON error from FastAPI, else show raw text
    try {
      const j = JSON.parse(text);
      throw new ApiError(j.detail || JSON.stringify(j), res.status);
    } catch (e) {
      if (e instanceof ApiError) throw e;
      throw new ApiError(text || `${res.status} ${res.statusText}`, res.status);
    }
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function uploadCSV(
  file: File,
  thresholdConfig?: ThresholdConfig,
  signal?: AbortSignal
): Promise<RowsResponse> {
  const fd = new FormData();
  fd.append("file", file);
  if (thresholdConfig) {
    fd.append("thresholdConfig", JSON.stringify(thresholdConfig));
  }
  const res = await fetch(`${API_BASE}/api/upload-csv`, {
    method: "POST",
    body: fd,
    mode: "cors",
    signal,
  });
  return (await handleResponse(res)) as RowsResponse;
}

export async function predictOne(
  sequence: string,
  entry?: string,
  thresholdConfig?: ThresholdConfig,
  signal?: AbortSignal
): Promise<PredictResponse> {
  const fd = new FormData();
  fd.append("sequence", sequence);
  if (entry) fd.append("entry", entry);
  if (thresholdConfig) {
    fd.append("thresholdConfig", JSON.stringify(thresholdConfig));
  }
  const res = await fetch(`${API_BASE}/api/predict`, {
    method: "POST",
    body: fd,
    mode: "cors",
    signal,
  });
  return (await handleResponse(res)) as PredictResponse;
}

/**
 * Execute a UniProt query with centralized error handling and auto-retry.
 * Strips HTML from error messages and provides clean error text.
 */
export async function executeUniProtQuery(
  requestBody: any,
  signal?: AbortSignal,
  cancelToken?: string
): Promise<RowsResponse> {
  const params = cancelToken ? `?cancelToken=${cancelToken}` : "";
  const response = await fetch(`${API_BASE}/api/uniprot/execute${params}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
    signal,
  });

  if (!response.ok) {
    let errorData: any;
    try {
      const text = await response.text();
      try {
        errorData = JSON.parse(text);
      } catch {
        // If not JSON, try to extract from HTML or use text
        const htmlMatch = text.match(/<h1[^>]*>([^<]+)<\/h1>/i) || text.match(/HTTP Status (\d+)/i);
        if (htmlMatch) {
          errorData = { detail: htmlMatch[1] || `HTTP ${response.status}` };
        } else {
          errorData = { detail: text || `HTTP ${response.status}` };
        }
      }
    } catch {
      errorData = { detail: `HTTP ${response.status}` };
    }

    // Extract error message (handle both formats: {detail: "..."} or {source: "uniprot", error: "..."})
    let errorMessage = errorData.detail || errorData.error || "Failed to execute query";
    // If it's a JSON string, try to parse it
    if (typeof errorMessage === "string" && errorMessage.startsWith("{")) {
      try {
        const parsed = JSON.parse(errorMessage);
        errorMessage = parsed.error || parsed.detail || errorMessage;
      } catch {
        // Not JSON, use as-is
      }
    }

    // Strip HTML tags if present and show clean error
    const cleanMessage = errorMessage.replace(/<[^>]*>/g, "").trim() || "Failed to execute query";
    throw new ApiError(cleanMessage, response.status);
  }

  return await response.json();
}

// ---------------------------------------------------------------------------
// Peptide similarity search (Wave 2 §G, backend §D — schemas/peptides.py)
// ---------------------------------------------------------------------------

/** Raw backend response shape for POST /api/peptides/similar. */
interface FindSimilarRawResponse {
  reference_id: string;
  results: Array<{
    peptide: Record<string, unknown>;
    distance: number;
  }>;
  method: string;
  elapsed_ms: number;
}

/** Result row exposed to the UI (peptide is the canonical frontend type). */
export interface SimilarPeptideHit {
  peptide: Peptide;
  distance: number;
}

/** Mapped response — what UI components consume. */
export interface FindSimilarPeptidesResult {
  referenceId: string;
  results: SimilarPeptideHit[];
  /** Identifier for the embedding pipeline. "disabled" when the index is off. */
  method: string;
  elapsedMs: number;
}

/**
 * Find the k peptides most similar to `referenceId` by embedding distance.
 *
 * Backend contract: `backend/schemas/peptides.py`. The response peptide rows
 * are partial PeptideRow shapes (camelCase) which we forward through the
 * standard mapper so the UI gets canonical `Peptide` objects.
 *
 * Empty `results` is a valid response (reference not in index, or
 * `method === "disabled"`). Callers should surface the empty state.
 */
export async function findSimilarPeptides(
  referenceId: string,
  k: number = 10,
  datasetId?: string,
  signal?: AbortSignal
): Promise<FindSimilarPeptidesResult> {
  const body: Record<string, unknown> = { reference_id: referenceId, k };
  if (datasetId) body.dataset_id = datasetId;

  const res = await fetch(`${API_BASE}/api/peptides/similar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    mode: "cors",
    signal,
  });
  const raw = (await handleResponse(res)) as FindSimilarRawResponse;

  return {
    referenceId: raw.reference_id,
    method: raw.method,
    elapsedMs: raw.elapsed_ms,
    results: raw.results.map((r) => ({
      peptide: mapApiRowToPeptide(r.peptide as Record<string, unknown>, "/api/peptides/similar"),
      distance: r.distance,
    })),
  };
}

/**
 * Try to load a precomputed reference dataset (instant, no pipeline run).
 * Returns the raw RowsResponse if the file exists on the server, or null
 * on 404 so callers can fall back to the live upload-CSV path without a
 * thrown error. Any other error (5xx, malformed JSON) does throw so the
 * caller can surface it.
 */
export async function loadPrecomputedDataset(
  datasetId: string,
  signal?: AbortSignal
): Promise<RowsResponse | null> {
  const res = await fetch(`${API_BASE}/api/precomputed/${encodeURIComponent(datasetId)}`, {
    method: "GET",
    mode: "cors",
    signal,
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ApiError(text || `HTTP ${res.status}`, res.status);
  }
  return (await res.json()) as RowsResponse;
}
