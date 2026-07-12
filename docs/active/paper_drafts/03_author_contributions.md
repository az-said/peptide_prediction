# AUTHOR CONTRIBUTIONS — Said + Alex lines (draft v2, 2026-07-12)

> Peleg tagged this section "Saaid, Alex: Please add the detail contribution of your work here"
> **Said = 2nd or 3rd author** (Said, 2026-07-12). Ordering to be finalised by Peleg + Meytal.
> Peleg's own line is already drafted verbatim in the doc:
> *Peleg Ragonis-Bachar: Conceptualization, Methodology, Data curation, Validation, Formal analysis, Investigation, Project administration, Writing – original draft, Writing – review & editing.*
> Below is what to paste for Said and Alex. CRediT vocabulary is used exactly (`https://credit.niso.org/`).

---

**Said Azaizah**: Software, Data curation, Validation, Formal analysis, Visualization, Investigation, Writing – original draft, Writing – review & editing.

**Aleksandr Golubev**: Investigation, Formal analysis, Validation, Supervision, Writing – review & editing.

---

## Long-form contribution notes (for reference; trim into the CRediT line above once agreed with Peleg and Meytal)

**Said Azaizah** designed and implemented the PePFibPred web server end-to-end. This includes the FastAPI backend, the React 18 / TypeScript / Vite / Tailwind / Zustand frontend, the deterministic sequence-analysis pipeline (TANGO subprocess wrapper, S4PRED five-model ensemble integration, FF-Helix classifier, unified SSW verdict logic and the FF-SSW / FF-Helix subset axioms, percentile-rank Smart Ranking, biochemical descriptors), the DuckDB provider cache with sequence-hash keys, the UniProt-guided discovery surface, the four-service Docker Compose deployment on Hetzner, the Caddy reverse-proxy TLS configuration, the seven GitHub Actions CI workflows (including CodeQL and PyPI Trusted Publishing), the `pvl-cli` command-line client and Python package, the `pvl-mcp` Model Context Protocol server, the mkdocs-material user handbook, and the batch validation harness against the *Staphylococcus aureus* 2023 reference dataset. Contributed to formal analysis (design and enforcement of the axiom-invariant regression suite that closed the ISSUE-032 defect) and to visualisation (per-residue tracks, batch density plots, threshold-sensitivity curves).

**Aleksandr Golubev** contributed scientific supervision on the DESY-side integration and the structural-biology use cases the server is intended to support, contributed to candidate curation for the reference dataset, participated in validation of the pipeline outputs against experimental structural data, and reviewed the manuscript. Prior collaborative work with P. R.-B. on AlphaFold-guided candidate discovery [CITE: Ragonis-Bachar *et al.*, *Proteins* 2024, 92, 265–281] motivated the UniProt-guided discovery mode in Method J.

## Notes for Said before pasting

- The doc's placeholder byline shows three `†` co-first-author slots. Said = 2nd or 3rd author per Said's decision 2026-07-12; the co-first-author status is a Peleg + Meytal call.
- CRediT terms above are canonical (`https://credit.niso.org/`). Do not paraphrase.
- Peleg has "Project administration"; Said should not claim that role.
- Alex's line intentionally light — Said/Peleg confirm before pushing to the original.
- **Alex's ORCID is still pending** — required for Zenodo mint. Ask Alex to send the ORCID URL and Said pastes it into `CITATION.cff` before the first tagged release.
