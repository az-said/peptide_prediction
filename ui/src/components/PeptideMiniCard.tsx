/**
 * Floating mini-card shown when a peptide is selected from a chart.
 *
 * Shows KPIs and a "View Detail" button that navigates to PeptideDetail
 * while preserving back-navigation context.
 *
 * PELEG-Q7-RESOLVED: consensus tier badge + tinted background removed
 * per Said+Peleg 2026-05-06 (FIX-013 — tier system is unjustified).
 */

import { X, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useChartSelection } from "@/stores/chartSelectionStore";
import type { Peptide } from "@/types/peptide";

interface PeptideMiniCardProps {
  peptide: Peptide;
}

export function PeptideMiniCard({ peptide }: PeptideMiniCardProps) {
  const navigate = useNavigate();
  const { clearSelection } = useChartSelection();

  return (
    <Card className="border shadow-lg">
      <CardContent className="p-3 space-y-2">
        {/* Header: ID + close */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-sm font-semibold truncate">{peptide.id}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={clearSelection}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <div className="font-semibold">{peptide.hydrophobicity?.toFixed(2) ?? "–"}</div>
            <div className="text-muted-foreground">Hydro</div>
          </div>
          <div>
            <div className="font-semibold">
              {peptide.charge != null
                ? `${peptide.charge > 0 ? "+" : ""}${peptide.charge.toFixed(1)}`
                : "–"}
            </div>
            <div className="text-muted-foreground">Charge</div>
          </div>
          <div>
            <div className="font-semibold">{peptide.muH?.toFixed(2) ?? "–"}</div>
            <div className="text-muted-foreground">μH</div>
          </div>
        </div>

        {/* Navigate to detail */}
        <Button
          variant="outline"
          size="sm"
          className="w-full h-7 text-xs"
          onClick={() => navigate(`/peptides/${encodeURIComponent(peptide.id)}`)}
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          View Detail
        </Button>
      </CardContent>
    </Card>
  );
}
