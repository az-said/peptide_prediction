/**
 * UniProtBatchPreview — M3 accession list preview table.
 *
 * Shows parsed accessions with validation status, dupe detection, and
 * per-row remove buttons. The parent (Upload.tsx) owns the accession
 * array and passes setAccessions for mutations.
 */

import { useMemo } from "react";
import { X, AlertTriangle, CheckCircle, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ── UniProt accession validation ──────────────────────────────────────────

/** Matches standard UniProt accession format (e.g. P12345, Q9UHC3-2) */
const UNIPROT_RE = /^[OPQ][0-9][A-Z0-9]{3}[0-9](-\d+)?$|^[A-NR-Z][0-9]([A-Z][A-Z0-9]{2}[0-9]){1,2}(-\d+)?$/i;

export function isValidAccession(acc: string): boolean {
  return UNIPROT_RE.test(acc.trim());
}

// ── Types ─────────────────────────────────────────────────────────────────

export interface AccessionEntry {
  /** Raw accession string (trimmed) */
  accession: string;
  /** Whether this is a valid UniProt accession format */
  valid: boolean;
  /** Whether this is a duplicate of an earlier entry */
  duplicate: boolean;
}

interface UniProtBatchPreviewProps {
  entries: AccessionEntry[];
  /** Called when user removes a row */
  onRemove: (index: number) => void;
  /** Called when user removes all invalid/duplicate entries */
  onCleanup: () => void;
}

// ── Parse helper (used by Upload.tsx) ─────────────────────────────────────

/**
 * Parse a raw text block into validated accession entries.
 * Handles one accession per line, comma-separated, space-separated.
 * Strips whitespace, empty lines, and comment lines (#).
 */
export function parseAccessionList(text: string): AccessionEntry[] {
  const raw = text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith("#"));

  const seen = new Set<string>();
  const entries: AccessionEntry[] = [];

  for (const token of raw) {
    const upper = token.toUpperCase();
    const valid = isValidAccession(upper);
    const duplicate = seen.has(upper);
    if (valid) seen.add(upper);
    entries.push({ accession: upper, valid, duplicate });
  }

  return entries;
}

// ── Component ─────────────────────────────────────────────────────────────

export function UniProtBatchPreview({
  entries,
  onRemove,
  onCleanup,
}: UniProtBatchPreviewProps) {
  const stats = useMemo(() => {
    const valid = entries.filter((e) => e.valid && !e.duplicate).length;
    const invalid = entries.filter((e) => !e.valid).length;
    const dupes = entries.filter((e) => e.duplicate).length;
    return { valid, invalid, dupes, total: entries.length };
  }, [entries]);

  const hasIssues = stats.invalid > 0 || stats.dupes > 0;

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3 text-sm">
          <Badge variant="secondary" className="text-xs">
            {stats.total} accessions
          </Badge>
          <span className="text-green-600 text-xs font-medium">
            {stats.valid} valid
          </span>
          {stats.invalid > 0 && (
            <span className="text-red-500 text-xs font-medium">
              {stats.invalid} invalid
            </span>
          )}
          {stats.dupes > 0 && (
            <span className="text-amber-500 text-xs font-medium">
              {stats.dupes} duplicate{stats.dupes > 1 ? "s" : ""}
            </span>
          )}
        </div>
        {hasIssues && (
          <Button variant="outline" size="sm" className="text-xs h-7" onClick={onCleanup}>
            Remove invalid & duplicates
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-[hsl(var(--border))] overflow-hidden max-h-[320px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground w-10">#</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Accession</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground w-24">Status</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => (
              <tr
                key={`${entry.accession}-${i}`}
                className={`border-t border-[hsl(var(--border))] ${
                  !entry.valid ? "bg-red-50/50 dark:bg-red-950/10" :
                  entry.duplicate ? "bg-amber-50/50 dark:bg-amber-950/10" : ""
                }`}
              >
                <td className="py-1.5 px-3 text-xs text-muted-foreground tabular-nums">
                  {i + 1}
                </td>
                <td className="py-1.5 px-3 font-mono text-xs">
                  {entry.accession}
                </td>
                <td className="py-1.5 px-3">
                  {!entry.valid ? (
                    <span className="inline-flex items-center gap-1 text-xs text-red-500">
                      <AlertTriangle className="w-3 h-3" />
                      Invalid
                    </span>
                  ) : entry.duplicate ? (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-500">
                      <Copy className="w-3 h-3" />
                      Duplicate
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle className="w-3 h-3" />
                      Valid
                    </span>
                  )}
                </td>
                <td className="py-1.5 px-2">
                  <button
                    type="button"
                    onClick={() => onRemove(i)}
                    className="p-0.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    aria-label={`Remove ${entry.accession}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {stats.valid === 0 && entries.length > 0 && (
        <p className="text-xs text-red-500">
          No valid accessions found. Check the format — expected: P12345, Q9UHC3, A0A0K9RCN8, etc.
        </p>
      )}
    </div>
  );
}
