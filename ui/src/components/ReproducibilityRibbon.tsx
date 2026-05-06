/**
 * ReproducibilityRibbon — persistent bar at the top of Results + PeptideDetail.
 *
 * Displays: PVL version, build SHA, query summary, timestamp, and actions
 * (copy permalink, open citation dialog). On hover/click of the query chip,
 * expands to show full query, thresholds, predictor flags, and dataset hash.
 *
 * Mobile: collapses to a single-row summary with tap-to-expand.
 *
 * Design: muted background, compact height (~36px collapsed), Bloomberg-style
 * monospace metadata. Sits between page header and content — not a sticky bar.
 */

import { useState, useCallback, useMemo } from "react";
import { Link, Check, Quote, ChevronDown, FlaskConical, Hash } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CitationDialog } from "@/components/CitationDialog";
import {
  encodePermalinkURL,
  type PermalinkState,
  type CitationParams,
  PERMALINK_VERSION,
} from "@/lib/permalink";
import {
  useReproducibilityStore,
  PVL_VERSION,
  BUILD_SHA,
} from "@/stores/reproducibilityStore";
import { useThresholdStore } from "@/stores/thresholdStore";

// ── Props ──────────────────────────────────────────────────────────────────

interface ReproducibilityRibbonProps {
  /** Base path for the permalink URL (e.g., "/results" or "/peptides/P12345") */
  basePath?: string;
}

// ── Component ──────────────────────────────────────────────────────────────

export function ReproducibilityRibbon({
  basePath = "/results",
}: ReproducibilityRibbonProps) {
  const queryMeta = useReproducibilityStore((s) => s.queryMeta);
  const datasetHash = useReproducibilityStore((s) => s.datasetHash);
  const thresholds = useThresholdStore((s) => s.active);

  const [expanded, setExpanded] = useState(false);
  const [citationOpen, setCitationOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Build permalink state
  const permalinkState: PermalinkState | null = useMemo(() => {
    if (!queryMeta || !datasetHash) return null;
    return {
      pv: PERMALINK_VERSION,
      datasetHash,
      query: queryMeta,
      thresholds,
      pvlVersion: PVL_VERSION,
    };
  }, [queryMeta, datasetHash, thresholds]);

  // Permalink URL
  const permalinkURL = useMemo(() => {
    if (!permalinkState) return null;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}${encodePermalinkURL(basePath, permalinkState)}`;
  }, [permalinkState, basePath]);

  // Citation params
  const citationParams: CitationParams | null = useMemo(() => {
    if (!queryMeta || !datasetHash || !permalinkURL) return null;
    return {
      version: PVL_VERSION,
      analysisId: datasetHash.slice(0, 12),
      date: queryMeta.timestamp.split("T")[0],
      url: permalinkURL,
    };
  }, [queryMeta, datasetHash, permalinkURL]);

  // Copy permalink handler
  const handleCopyLink = useCallback(async () => {
    if (!permalinkURL) return;
    try {
      await navigator.clipboard.writeText(permalinkURL);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = permalinkURL;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }, [permalinkURL]);

  // Query summary chip text
  const querySummary = useMemo(() => {
    if (!queryMeta) return "No analysis loaded";
    const source =
      queryMeta.source === "uniprot"
        ? `UniProt: ${queryMeta.query ?? "query"}`
        : queryMeta.source === "csv"
          ? "CSV upload"
          : "Quick Analyze";
    const predictors = [
      queryMeta.predictors.s4pred ? "S4PRED" : null,
      queryMeta.predictors.tango ? "TANGO" : null,
    ]
      .filter(Boolean)
      .join(", ");
    return `${source} · ${queryMeta.peptideCount} peptides · ${predictors || "no predictors"}`;
  }, [queryMeta]);

  const formattedDate = useMemo(() => {
    if (!queryMeta?.timestamp) return "";
    try {
      return new Date(queryMeta.timestamp).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return queryMeta.timestamp;
    }
  }, [queryMeta]);

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className="rounded-lg border border-[hsl(var(--border))] bg-muted/30 px-4 py-2"
        data-testid="reproducibility-ribbon"
      >
        {/* Main row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {/* Left: version + build SHA */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge
              variant="secondary"
              className="h-5 px-1.5 text-[10px] font-mono"
            >
              v{PVL_VERSION}
            </Badge>
            <UITooltip>
              <TooltipTrigger asChild>
                <span className="text-[10px] font-mono text-muted-foreground/60 cursor-default">
                  {BUILD_SHA.slice(0, 7)}
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Build: {BUILD_SHA}
              </TooltipContent>
            </UITooltip>
          </div>

          {/* Center: query chip (clickable to expand) */}
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="inline-flex items-center gap-1.5 rounded-md bg-muted/60 px-2.5 py-1 text-xs text-foreground transition-colors hover:bg-muted min-w-0"
            aria-label="Toggle analysis details"
            data-testid="query-chip"
          >
            <FlaskConical className="h-3 w-3 shrink-0 text-muted-foreground" />
            <span className="truncate">{querySummary}</span>
            <motion.span
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.15 }}
              className="shrink-0"
            >
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </motion.span>
          </button>

          {/* Timestamp */}
          {formattedDate && (
            <span className="text-[10px] text-muted-foreground/60 font-mono hidden sm:inline">
              {formattedDate}
            </span>
          )}

          {/* Right: actions */}
          <div className="flex items-center gap-1 ml-auto shrink-0">
            <UITooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={handleCopyLink}
                  disabled={!permalinkURL}
                  aria-label="Copy permalink"
                  data-testid="copy-permalink"
                >
                  {linkCopied ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Link className="h-3.5 w-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {linkCopied ? "Copied!" : "Copy permalink"}
              </TooltipContent>
            </UITooltip>

            <UITooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setCitationOpen(true)}
                  disabled={!citationParams}
                  aria-label="Cite this analysis"
                  data-testid="cite-button"
                >
                  <Quote className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Cite this analysis
              </TooltipContent>
            </UITooltip>
          </div>
        </div>

        {/* Expanded details */}
        <AnimatePresence initial={false}>
          {expanded && queryMeta && (
            <motion.div
              key="ribbon-details"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              style={{ overflow: "hidden" }}
            >
              <div className="mt-2 pt-2 border-t border-[hsl(var(--border))] space-y-1.5">
                {/* Query details */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <span className="text-muted-foreground">
                    Source:{" "}
                    <span className="text-foreground font-medium">
                      {queryMeta.source === "uniprot"
                        ? "UniProt API"
                        : queryMeta.source === "csv"
                          ? "CSV upload"
                          : "Quick Analyze (single sequence)"}
                    </span>
                  </span>
                  {queryMeta.query && (
                    <span className="text-muted-foreground">
                      Query:{" "}
                      <span className="text-foreground font-mono text-[11px]">
                        {queryMeta.query}
                      </span>
                    </span>
                  )}
                  <span className="text-muted-foreground">
                    Peptides:{" "}
                    <span className="text-foreground font-mono">
                      {queryMeta.peptideCount}
                    </span>
                  </span>
                </div>

                {/* Predictor flags */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Predictors:</span>
                  <Badge
                    variant={queryMeta.predictors.s4pred ? "default" : "secondary"}
                    className="h-4 px-1.5 text-[9px]"
                  >
                    S4PRED {queryMeta.predictors.s4pred ? "ON" : "OFF"}
                  </Badge>
                  <Badge
                    variant={queryMeta.predictors.tango ? "default" : "secondary"}
                    className="h-4 px-1.5 text-[9px]"
                  >
                    TANGO {queryMeta.predictors.tango ? "ON" : "OFF"}
                  </Badge>
                </div>

                {/* Dataset hash */}
                {datasetHash && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Hash className="h-3 w-3" />
                    <span className="font-mono text-[10px]">
                      {datasetHash.slice(0, 12)}…
                    </span>
                  </div>
                )}

                {/* Threshold summary */}
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground/70 font-mono">
                  <span>μH≥{thresholds.muHCutoff}</span>
                  <span>H≥{thresholds.hydroCutoff}</span>
                  <span>
                    helixScore≥{thresholds.minS4predHelixScore}
                  </span>
                  <span>helix%≥{thresholds.minHelixPercentContent}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Citation dialog */}
      <CitationDialog
        open={citationOpen}
        onOpenChange={setCitationOpen}
        params={citationParams}
      />
    </TooltipProvider>
  );
}
