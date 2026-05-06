/**
 * Mol3DViewer — 3D structure viewer with PVL prediction overlays.
 *
 * The killer differentiator: renders AlphaFold structures with TANGO peaks,
 * S4PRED helix segments, FF-Helix candidates, and SSW switch zones overlaid
 * directly on the 3D cartoon. No peptide tool does this.
 *
 * Architecture:
 * ─────────────────────────────────────────────────────────────────────────
 * Phase 1 (current): Uses EBI's embedded Mol* viewer via iframe for the 3D
 * rendering, with a local overlay legend + residue highlight bar showing which
 * regions carry which annotations. The iframe approach avoids bundling ~4MB of
 * Mol* core into PVL's bundle while still providing interactive 3D.
 *
 * Phase 2 (future): When molstar npm package is integrated, replace the iframe
 * with programmatic Mol* plugin, enabling true overpaint/transparency per-residue
 * and bidirectional hover sync via hoverStore.
 *
 * Overlay visualization (Phase 1):
 * Since iframe-embedded Mol* doesn't support external overpaint commands, we
 * render a "Prediction overlay map" — a horizontal residue bar below the 3D
 * viewer showing colored bands for each active overlay. This gives researchers
 * the spatial context of "which residues have which annotations" alongside the
 * 3D structure they can freely rotate.
 *
 * Toggle controls: each overlay type is independently toggleable.
 * Empty states: graceful messages for no accession, short peptides, load errors.
 * Lazy loading: Mol* iframe loads only on user click.
 * Export: PNG screenshot (Phase 2), PDB download (existing), session URL.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Loader2,
  ExternalLink,
  RotateCcw,
  Download,
  Eye,
  EyeOff,
  AlertTriangle,
  Box,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  fetchAlphaFoldEntry,
  isValidUniProtAccession,
  getMolstarViewerUrl,
  type AlphaFoldEntry,
} from "@/lib/alphafold";
import {
  buildDefaultOverlays,
  OVERLAY_TOGGLES,
  type StructureOverlay,
  type OverlayType,
} from "@/lib/molstarOverlays";
import type { Peptide } from "@/types/peptide";

// ── Props ──────────────────────────────────────────────────────────────────

interface Mol3DViewerProps {
  /** The peptide to visualize */
  peptide: Peptide;
  /** Custom overlays (default: auto-built from peptide data) */
  overlays?: StructureOverlay[];
  /** TANGO aggregation threshold for peak detection */
  aggThreshold?: number;
  /** Initial collapsed state */
  defaultCollapsed?: boolean;
}

// ── Overlay toggle state ───────────────────────────────────────────────────

type OverlayVisibility = Record<OverlayType, boolean>;

const DEFAULT_VISIBILITY: OverlayVisibility = {
  tango: true,
  "s4pred-helix": true,
  "ff-helix": true,
  ssw: true,
};

// ── Residue bar overlay visualization ──────────────────────────────────────

function OverlayResidueBar({
  overlays,
  visibility,
  sequenceLength,
}: {
  overlays: StructureOverlay[];
  visibility: OverlayVisibility;
  sequenceLength: number;
}) {
  if (sequenceLength === 0) return null;

  const visibleOverlays = overlays.filter((o) => visibility[o.type]);

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] text-muted-foreground font-medium">
        Prediction overlay map ({sequenceLength} residues)
      </p>
      {visibleOverlays.length === 0 ? (
        <p className="text-[10px] text-muted-foreground/60 italic">
          No overlays active — toggle above to show
        </p>
      ) : (
        <div className="space-y-1">
          {visibleOverlays.map((overlay) => (
            <div key={overlay.type} className="flex items-center gap-2">
              <span className="text-[9px] text-muted-foreground w-24 shrink-0 truncate">
                {overlay.label}
              </span>
              <div
                className="flex-1 h-3 bg-muted/50 rounded-sm relative overflow-hidden"
                aria-label={`${overlay.label} residue ranges`}
              >
                {overlay.ranges.map(([start, end], i) => {
                  const leftPct = (start / sequenceLength) * 100;
                  const widthPct = ((end - start) / sequenceLength) * 100;
                  return (
                    <div
                      key={i}
                      className="absolute top-0 h-full rounded-sm"
                      style={{
                        left: `${leftPct}%`,
                        width: `${Math.max(widthPct, 0.5)}%`,
                        backgroundColor: overlay.color,
                        opacity: overlay.opacity,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Residue number ticks */}
      <div className="flex justify-between text-[8px] text-muted-foreground/50 font-mono px-[104px]">
        <span>1</span>
        <span>{Math.round(sequenceLength / 2)}</span>
        <span>{sequenceLength}</span>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function Mol3DViewer({
  peptide,
  overlays: customOverlays,
  aggThreshold = 5.0,
  defaultCollapsed = false,
}: Mol3DViewerProps) {
  const [entry, setEntry] = useState<AlphaFoldEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [viewerLoaded, setViewerLoaded] = useState(false);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [visibility, setVisibility] = useState<OverlayVisibility>(DEFAULT_VISIBILITY);

  const peptideId = peptide.id;
  const isValid = isValidUniProtAccession(peptideId);
  const sequenceLength = peptide.length ?? peptide.sequence?.length ?? 0;
  const isTooShort = sequenceLength < 8;

  // Build overlays
  const overlays = useMemo(
    () => customOverlays ?? buildDefaultOverlays(peptide, aggThreshold),
    [peptide, customOverlays, aggThreshold],
  );

  // Fetch AlphaFold entry
  useEffect(() => {
    if (!isValid || isTooShort) {
      setChecked(true);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchAlphaFoldEntry(peptideId)
      .then((data) => {
        if (!cancelled) {
          setEntry(data);
          if (!data) setError("No AlphaFold structure found for this accession.");
          setChecked(true);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Failed to fetch AlphaFold structure. Please try again.");
          setChecked(true);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [peptideId, isValid, isTooShort]);

  // Toggle overlay visibility
  const toggleOverlay = useCallback((type: OverlayType) => {
    setVisibility((prev) => ({ ...prev, [type]: !prev[type] }));
  }, []);

  // Retry fetch
  const handleRetry = useCallback(() => {
    setChecked(false);
    setEntry(null);
    setError(null);
    setLoading(true);

    fetchAlphaFoldEntry(peptideId)
      .then((data) => {
        setEntry(data);
        if (!data) setError("No AlphaFold structure found.");
        setChecked(true);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch structure.");
        setChecked(true);
        setLoading(false);
      });
  }, [peptideId]);

  // ── Empty states ─────────────────────────────────────────────────────────

  // Not a valid UniProt accession
  if (!isValid) {
    return (
      <Card className="border-[hsl(var(--border))]" data-testid="mol3d-viewer">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Box className="h-4.5 w-4.5 text-muted-foreground" />
            3D Structure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-[hsl(var(--border))] bg-muted/30 p-6 text-center">
            <p className="text-sm text-foreground font-medium">
              No AlphaFold structure available
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              This is expected for short or non-canonical peptides without a UniProt accession.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Too short for meaningful 3D
  if (isTooShort) {
    return (
      <Card className="border-[hsl(var(--border))]" data-testid="mol3d-viewer">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Box className="h-4.5 w-4.5 text-muted-foreground" />
            3D Structure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-[hsl(var(--border))] bg-muted/30 p-6 text-center">
            <p className="text-sm text-foreground font-medium">
              Peptide too short for meaningful 3D structure prediction
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              AlphaFold requires at least 8 residues. This peptide has {sequenceLength}.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Card className="border-[hsl(var(--border))]" data-testid="mol3d-viewer">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Box className="h-4.5 w-4.5 text-muted-foreground" />
                3D Structure with PVL Annotations
              </CardTitle>
              <CardDescription>
                AlphaFold structure · {peptideId}
                {entry?.gene && ` (${entry.gene})`}
                {overlays.length > 0 && ` · ${overlays.length} overlay${overlays.length > 1 ? "s" : ""}`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-1.5">
              {entry && (
                <>
                  <a
                    href={`https://alphafold.ebi.ac.uk/entry/${entry.uniprotAccession}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                      <ExternalLink className="h-3 w-3" />
                      AlphaFold
                    </Button>
                  </a>
                  {entry.pdbUrl && (
                    <a href={entry.pdbUrl} download>
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                        <Download className="h-3 w-3" />
                        PDB
                      </Button>
                    </a>
                  )}
                </>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Checking AlphaFold DB...
              </span>
            </div>
          )}

          {/* Error with retry */}
          {error && checked && !loading && (
            <div className="rounded-lg border border-dashed border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 p-6 text-center">
              <AlertTriangle className="h-5 w-5 text-amber-500 mx-auto mb-2" />
              <p className="text-sm text-foreground font-medium">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 gap-1.5"
                onClick={handleRetry}
              >
                <RotateCcw className="h-3 w-3" />
                Retry
              </Button>
            </div>
          )}

          {/* Structure loaded */}
          {entry && !loading && (
            <>
              {/* Overlay toggles */}
              {overlays.length > 0 && (
                <div className="flex flex-wrap gap-2" data-testid="overlay-toggles">
                  {OVERLAY_TOGGLES.map((toggle) => {
                    const hasData = overlays.some((o) => o.type === toggle.type);
                    const isVisible = visibility[toggle.type];
                    return (
                      <UITooltip key={toggle.type}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => toggleOverlay(toggle.type)}
                            disabled={!hasData}
                            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-all ${
                              hasData && isVisible
                                ? "bg-muted/80 text-foreground border border-[hsl(var(--border))]"
                                : hasData
                                  ? "bg-transparent text-muted-foreground border border-transparent hover:border-[hsl(var(--border))]"
                                  : "bg-transparent text-muted-foreground/40 border border-transparent cursor-not-allowed"
                            }`}
                            aria-label={`Toggle ${toggle.label}`}
                            data-testid={`toggle-${toggle.type}`}
                          >
                            <span
                              className="h-2.5 w-2.5 rounded-full shrink-0"
                              style={{
                                backgroundColor: hasData ? toggle.color : "hsl(var(--muted-foreground))",
                                opacity: hasData && isVisible ? 1 : 0.3,
                              }}
                            />
                            {hasData && isVisible ? (
                              <Eye className="h-3 w-3" />
                            ) : (
                              <EyeOff className="h-3 w-3" />
                            )}
                            <span>{toggle.label}</span>
                            {!hasData && (
                              <Badge variant="secondary" className="h-3.5 px-1 text-[8px]">
                                no data
                              </Badge>
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs max-w-[200px]">
                          {toggle.description}
                          {!hasData && " (no data available for this peptide)"}
                        </TooltipContent>
                      </UITooltip>
                    );
                  })}
                </div>
              )}

              {/* 3D viewer (lazy-loaded) */}
              {viewerLoaded ? (
                <div
                  className="rounded-lg overflow-hidden border border-[hsl(var(--border))]"
                  style={{ height: 420 }}
                  data-testid="mol3d-iframe-container"
                >
                  <iframe
                    src={getMolstarViewerUrl(entry.uniprotAccession, entry.cifUrl)}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    allow="fullscreen"
                    title={`3D structure: ${entry.uniprotAccession} with PVL annotations`}
                    style={{ border: "none" }}
                  />
                </div>
              ) : (
                <button
                  onClick={() => setViewerLoaded(true)}
                  className="w-full rounded-lg border-2 border-dashed border-muted-foreground/30 p-10 text-center hover:border-primary/50 hover:bg-muted/30 transition-colors group"
                  data-testid="load-viewer-button"
                >
                  <Box className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50 group-hover:text-primary/60 transition-colors" />
                  <div className="text-sm font-medium">Load 3D Structure Viewer</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Opens Mol* viewer ({entry.sequenceLength} residues)
                    {overlays.length > 0 &&
                      ` · ${overlays.length} annotation layer${overlays.length > 1 ? "s" : ""} ready`}
                  </div>
                </button>
              )}

              {/* Overlay residue bar — always visible (even before iframe loads) */}
              {overlays.length > 0 && (
                <OverlayResidueBar
                  overlays={overlays}
                  visibility={visibility}
                  sequenceLength={sequenceLength}
                />
              )}

              {/* Confidence summary */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>
                  pLDDT:{" "}
                  <span
                    className={`font-medium ${
                      entry.globalMetricValue >= 90
                        ? "text-blue-600"
                        : entry.globalMetricValue >= 70
                          ? "text-cyan-600"
                          : "text-amber-600"
                    }`}
                  >
                    {entry.globalMetricValue.toFixed(1)}
                  </span>
                </span>
                <span className="text-muted-foreground/50">|</span>
                <span>
                  {entry.globalMetricValue >= 90
                    ? "Very high confidence"
                    : entry.globalMetricValue >= 70
                      ? "Confident"
                      : entry.globalMetricValue >= 50
                        ? "Low confidence"
                        : "Very low confidence"}
                </span>
                {entry.sequenceLength < 30 && (
                  <>
                    <span className="text-muted-foreground/50">|</span>
                    <span className="text-amber-600">
                      Short peptide — interpret with care
                    </span>
                  </>
                )}
              </div>

              {/* Phase note */}
              <p className="text-[9px] text-muted-foreground/50">
                Overlay map shows prediction annotations on the residue axis.
                Full 3D overpaint coming in Phase 2 (Mol* npm integration).
                Structure: AlphaFold v2 (DeepMind/EMBL-EBI).
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
