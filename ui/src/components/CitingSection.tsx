/**
 * CitingSection — "Citing PVL" block with copy-ready BibTeX/RIS.
 *
 * Designed to sit below or within the TrustSection on the landing page.
 * Pre-filled citation with placeholder DOI (swapped when Zenodo goes live).
 *
 * Features:
 * - BibTeX in a code block with copy button
 * - Team "Built by" credits
 * - "Open peer review" link to GitHub Issues
 */

import { useState, useCallback } from "react";
import { Copy, Check, Github, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CitingSectionProps {
  className?: string;
}

const BIBTEX = `@software{pvl2026,
  author       = {Azaizah, Said and Ragonis-Bachar, Peleg and Golubev, Aleksandr},
  title        = {{Peptide Visual Lab (PVL): All-in-one Prediction and Visualization for Peptide Aggregation and Structure}},
  year         = {2026},
  publisher    = {GitHub},
  url          = {https://github.com/saidaz24-meet/peptide_prediction},
  note         = {DOI pending -- Zenodo submission in progress}
}`;

export function CitingSection({ className }: CitingSectionProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(BIBTEX);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-HTTPS environments
      const ta = document.createElement("textarea");
      ta.value = BIBTEX;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  return (
    <div className={cn("max-w-4xl mx-auto", className)} data-testid="citing-section">
      {/* Heading */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold tracking-tight text-foreground mb-2">
          Citing PVL
        </h3>
        <p className="text-sm text-muted-foreground">
          If PVL contributed to your research, please cite it.
        </p>
      </div>

      {/* BibTeX card */}
      <div className="relative rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-mono text-muted-foreground">
              BibTeX
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 text-xs gap-1.5"
            data-testid="copy-bibtex"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-green-500" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy
              </>
            )}
          </Button>
        </div>

        {/* Code block */}
        <pre className="px-4 py-4 text-xs font-mono text-muted-foreground overflow-x-auto leading-relaxed">
          {BIBTEX}
        </pre>
      </div>

      {/* Credits + Open peer review */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 text-sm text-muted-foreground">
        <span>
          Built by{" "}
          <span className="text-foreground font-medium">Said Azaizah</span>
          {" (Technion · DESY) · Algorithms by "}
          <span className="text-foreground font-medium">
            Dr. Peleg Ragonis-Bachar
          </span>
          {" (Technion) · Scientific advisor: "}
          <span className="text-foreground font-medium">
            Dr. Aleksandr Golubev
          </span>
          {" (DESY)"}
        </span>
      </div>

      <div className="flex items-center justify-center mt-4">
        <a
          href="https://github.com/saidaz24-meet/peptide_prediction/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
          data-testid="open-peer-review-link"
        >
          <Github className="h-4 w-4" />
          Open peer review — contribute via GitHub Issues
        </a>
      </div>
    </div>
  );
}
