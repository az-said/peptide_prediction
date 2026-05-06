/**
 * permalink.ts — URL state encoding/decoding for PVL analysis reproducibility.
 *
 * URL Schema (forward-compatible, versioned):
 * ─────────────────────────────────────────────
 *  /results?pv=1&dh={dataset-hash}&q={base64-query}&t={base64-thresholds}&ver={pvl-version}
 *  /peptides/{id}?pv=1&from={dataset-hash}&t={base64-thresholds}&ver={pvl-version}
 *
 * - `pv` = permalink version (currently 1). Future schema changes bump this.
 * - `dh` = SHA-256 hex digest of the canonical input (CSV content | UniProt query string).
 * - `q`  = base64url-encoded JSON of the query metadata (source, query string, predictor flags).
 * - `t`  = base64url-encoded JSON of the threshold config at analysis time.
 * - `ver`= PVL version string ("0.1.2").
 *
 * Base64url (RFC 4648 §5) is used instead of standard base64 to avoid URL-unsafe chars.
 *
 * Forward-compatibility: unknown keys are preserved on decode. Consumers check `pv`
 * and degrade gracefully for unknown versions.
 */

import type { ResolvedThresholds } from "@/lib/thresholds";

// ── Types ──────────────────────────────────────────────────────────────────

export const PERMALINK_VERSION = 1;

export interface QueryMetadata {
  /** Data source: "csv" for file upload, "uniprot" for API query, "single" for Quick Analyze */
  source: "csv" | "uniprot" | "single";
  /** Human-readable query summary (e.g., "amyloid AND reviewed:true") */
  query?: string | null;
  /** Number of peptides in the dataset */
  peptideCount: number;
  /** ISO timestamp of the analysis */
  timestamp: string;
  /** Predictor flags at analysis time */
  predictors: {
    s4pred: boolean;
    tango: boolean;
  };
}

export interface PermalinkState {
  /** Permalink schema version */
  pv: number;
  /** Dataset hash (SHA-256 hex) */
  datasetHash: string;
  /** Query metadata */
  query: QueryMetadata;
  /** Threshold config snapshot */
  thresholds: ResolvedThresholds;
  /** PVL version */
  pvlVersion: string;
}

// ── Base64url helpers (RFC 4648 §5) ────────────────────────────────────────

function toBase64url(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64url(b64: string): string {
  let s = b64.replace(/-/g, "+").replace(/_/g, "/");
  // Re-add padding
  while (s.length % 4 !== 0) s += "=";
  return atob(s);
}

// ── Dataset hashing ────────────────────────────────────────────────────────

/**
 * Compute a SHA-256 hex digest of the given input string.
 * For CSV uploads: hash the raw file content.
 * For UniProt queries: hash the canonical query string.
 * For single-peptide: hash the sequence.
 */
export async function computeDatasetHash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Compute a short dataset hash (first 12 hex chars) for display.
 */
export async function computeShortHash(input: string): Promise<string> {
  const full = await computeDatasetHash(input);
  return full.slice(0, 12);
}

// ── Encode / Decode ────────────────────────────────────────────────────────

/**
 * Encode a PermalinkState into URL search params.
 */
export function encodePermalink(state: PermalinkState): URLSearchParams {
  const params = new URLSearchParams();
  params.set("pv", String(state.pv));
  params.set("dh", state.datasetHash);
  params.set("q", toBase64url(JSON.stringify(state.query)));
  params.set("t", toBase64url(JSON.stringify(state.thresholds)));
  params.set("ver", state.pvlVersion);
  return params;
}

/**
 * Encode a PermalinkState into a full URL string.
 */
export function encodePermalinkURL(
  basePath: string,
  state: PermalinkState,
): string {
  const params = encodePermalink(state);
  return `${basePath}?${params.toString()}`;
}

/**
 * Decode URL search params into a PermalinkState, or null if not a valid permalink.
 */
export function decodePermalink(
  params: URLSearchParams,
): PermalinkState | null {
  const pvStr = params.get("pv");
  if (!pvStr) return null;

  const pv = parseInt(pvStr, 10);
  if (isNaN(pv) || pv < 1) return null;

  const datasetHash = params.get("dh");
  if (!datasetHash) return null;

  try {
    const queryJson = params.get("q");
    const thresholdsJson = params.get("t");
    const pvlVersion = params.get("ver") ?? "unknown";

    if (!queryJson || !thresholdsJson) return null;

    const query: QueryMetadata = JSON.parse(fromBase64url(queryJson));
    const thresholds: ResolvedThresholds = JSON.parse(
      fromBase64url(thresholdsJson),
    );

    return { pv, datasetHash, query, thresholds, pvlVersion };
  } catch {
    return null;
  }
}

// ── Citation generation ────────────────────────────────────────────────────

export interface CitationParams {
  /** PVL version */
  version: string;
  /** Short analysis ID (dataset hash prefix) */
  analysisId: string;
  /** ISO date string */
  date: string;
  /** Full permalink URL */
  url: string;
  /** DOI if available */
  doi?: string;
}

const AUTHORS = "Said Azaizah, Peleg Ragonis-Bachar, Aleksandr Golubev";
const YEAR = "2026";

export function generatePlainCitation(p: CitationParams): string {
  const doiLine = p.doi ? ` DOI: ${p.doi}.` : "";
  return (
    `${AUTHORS} (${YEAR}). Peptide Visual Lab v${p.version} ` +
    `[analysis ID: ${p.analysisId}, accessed ${p.date}]. ` +
    `${p.url}${doiLine}`
  );
}

export function generateBibTeX(p: CitationParams): string {
  const doiField = p.doi ? `\n  doi = {${p.doi}},` : "";
  return `@misc{pvl_analysis_${p.analysisId},
  author = {Azaizah, Said and Ragonis-Bachar, Peleg and Golubev, Aleksandr},
  title = {{Peptide Visual Lab v${p.version}}},
  year = {${YEAR}},
  note = {Analysis ID: ${p.analysisId}, accessed ${p.date}},
  url = {${p.url}},${doiField}
  howpublished = {\\url{${p.url}}}
}`;
}

export function generateRIS(p: CitationParams): string {
  const lines = [
    "TY  - COMP",
    `AU  - Azaizah, Said`,
    `AU  - Ragonis-Bachar, Peleg`,
    `AU  - Golubev, Aleksandr`,
    `TI  - Peptide Visual Lab v${p.version}`,
    `PY  - ${YEAR}`,
    `UR  - ${p.url}`,
    `N1  - Analysis ID: ${p.analysisId}, accessed ${p.date}`,
  ];
  if (p.doi) lines.push(`DO  - ${p.doi}`);
  lines.push("ER  -");
  return lines.join("\n");
}
