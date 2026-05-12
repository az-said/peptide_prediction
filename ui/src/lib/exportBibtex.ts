/**
 * BibTeX export — pre-filled citations for every method PVL uses.
 *
 * Per ADR-013: researchers using PVL in publications need a one-click `.bib`
 * download with TANGO + S4PRED + Hamodrakas 2007 + PVL itself. No competitor
 * (TANGO web, PASTA 2.0, AGGRESCAN, Waltz, AggreProt) provides this.
 *
 * For v0.x this file is the single source of truth. Predictor versions don't
 * change often enough to need a backend round-trip. CitingSection.tsx (landing
 * page) imports PVL_CITATION from here so the page block and the download stay
 * in sync.
 */

/** PVL self-citation. Update when Zenodo DOI lands. */
export const PVL_CITATION = `@software{pvl2026,
  author       = {Azaizah, Said and Ragonis-Bachar, Peleg and Golubev, Aleksandr},
  title        = {{Peptide Visual Lab (PVL): All-in-one Prediction and Visualization for Peptide Aggregation and Structure}},
  year         = {2026},
  publisher    = {GitHub},
  url          = {https://github.com/saidaz24-meet/peptide_prediction},
  note         = {DOI pending -- Zenodo submission in progress}
}`;

/** TANGO — Fernandez-Escamilla et al. 2004, Nature Biotechnology. */
export const TANGO_CITATION = `@article{tango2004,
  author       = {Fernandez-Escamilla, Ana-Maria and Rousseau, Frederic and Schymkowitz, Joost and Serrano, Luis},
  title        = {Prediction of sequence-dependent and mutational effects on the aggregation of peptides and proteins},
  journal      = {Nature Biotechnology},
  volume       = {22},
  number       = {10},
  pages        = {1302--1306},
  year         = {2004},
  doi          = {10.1038/nbt1012}
}`;

/** S4PRED — Moffat & Jones 2021, Bioinformatics. */
export const S4PRED_CITATION = `@article{s4pred2021,
  author       = {Moffat, Lewis and Jones, David T.},
  title        = {Increasing the accuracy of single sequence prediction methods using a deep semi-supervised learning framework},
  journal      = {Bioinformatics},
  volume       = {37},
  number       = {21},
  pages        = {3744--3751},
  year         = {2021},
  doi          = {10.1093/bioinformatics/btab491}
}`;

/** Hamodrakas 2007 — fibril-forming helix prediction. */
export const HAMODRAKAS_CITATION = `@article{hamodrakas2007,
  author       = {Hamodrakas, Stavros J. and Liappa, Christianna and Iconomidou, Vassiliki A.},
  title        = {Consensus prediction of amyloidogenic determinants in amyloid fibril-forming proteins},
  journal      = {International Journal of Biological Macromolecules},
  volume       = {41},
  number       = {3},
  pages        = {295--300},
  year         = {2007},
  doi          = {10.1016/j.ijbiomac.2007.03.008}
}`;

/** Available methods that can appear in a BibTeX export. */
export type CitedMethod = "pvl" | "tango" | "s4pred" | "hamodrakas";

const CITATIONS: Record<CitedMethod, string> = {
  pvl: PVL_CITATION,
  tango: TANGO_CITATION,
  s4pred: S4PRED_CITATION,
  hamodrakas: HAMODRAKAS_CITATION,
};

const HEADER = `% PVL — peptide-visual-lab.org
% Generated: ${new Date().toISOString()}
% Methods cited: TANGO (aggregation), S4PRED (secondary structure),
% Hamodrakas et al. 2007 (FF-Helix), and PVL itself.
`;

/**
 * Build a `.bib` file content from a list of methods.
 *
 * Default includes all four methods. Pass a subset to limit output (e.g. when
 * the user disables a predictor for a specific analysis).
 */
export function buildBibtex(
  methods: CitedMethod[] = ["pvl", "tango", "s4pred", "hamodrakas"],
): string {
  const headerLine = `% PVL — peptide-visual-lab.org\n% Generated: ${new Date().toISOString()}\n% Methods cited: ${methods.join(", ")}\n`;
  const blocks = methods.map((m) => CITATIONS[m]).join("\n\n");
  return `${headerLine}\n${blocks}\n`;
}

/**
 * Trigger a browser download of the BibTeX file.
 *
 * Default filename `PVL_methods.bib`. Pass `filename` to override (e.g. when
 * exporting per-peptide and you want `PVL_methods_P49913.bib`).
 */
export function downloadBibtex(
  methods: CitedMethod[] = ["pvl", "tango", "s4pred", "hamodrakas"],
  filename: string = "PVL_methods.bib",
): void {
  const content = buildBibtex(methods);
  const blob = new Blob([content], { type: "application/x-bibtex;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// HEADER kept for tests; not exported because tests construct the expected
// header from buildBibtex output.
void HEADER;
