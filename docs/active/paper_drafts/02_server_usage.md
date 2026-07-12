# Server Usage — draft

> Peleg tagged this section "Saaid". Paste into the doc as the corresponding sub-headings.
> Two sub-heads under **Server usage**: *Access and Availability* (Heading 3, italic) and *Job Submission Options* (Heading 3, italic).

---

## Server usage

### *Access and Availability*

PePFibPred is accessible through five equivalent surfaces, each backed by the same deterministic pipeline core (Method H). All surfaces are open access and require no user registration.

*Web interface.* The primary entry point is the browser-based analysis dashboard at **https://[HOSTNAME PENDING FINAL DNS]/** (production deployment on Hetzner CX33) with a parallel DESY-hosted mirror in preparation. The UI supports single-sequence entry, CSV/XLSX batch upload, and UniProt-guided discovery, and renders per-residue tracks, batch statistics, and publication-ready plots.

*RESTful API.* A programmatic HTTPS interface is exposed at `https://[HOSTNAME]/api/` with an OpenAPI 3.1 schema auto-published at `/api/openapi.json`. Requests are rate-limited to 30 requests / minute / IP (slowapi) to preserve the shared TANGO/S4PRED resources; institutional callers requiring a higher limit are asked to raise a GitHub Issue.

*Python package.* Users who prefer local execution or need to embed PePFibPred inside an existing analysis pipeline can install the `pvl-cli` Python package from PyPI (`pip install pvl-cli`), which ships both the CLI entry point and the `pvl` importable module. This surface is the recommended path for HPC / cluster deployments and for scripted batch runs against a private dataset.

*Command-line interface.* The bundled `pvl` executable exposes single-sequence, batch, and UniProt subcommands (`pvl predict`, `pvl batch`, `pvl uniprot`) with a `--json` output flag for downstream piping. The CLI targets the same REST endpoints as the web UI (production URL by default; overridable through `--base-url`), so results are bit-identical to the browser-driven analysis.

*Model Context Protocol (MCP) server.* For interoperability with LLM assistants (e.g. Claude, ChatGPT with an MCP-capable client), the `pvl-mcp` server exposes each pipeline function as a typed MCP tool, allowing conversational batch analysis such as *"predict fibril-forming propensity for every peptide in this FASTA"*. The server is available on PyPI (`pip install pvl-mcp`) and is intended as a first-of-its-kind LLM-native surface for a computational amyloid predictor.

The full source code, container images, precomputed reference-dataset artefact, and continuous-integration workflows are archived under a persistent DOI on Zenodo and mirrored on GitHub (Data Availability).

### *Job Submission Options*

Three distinct job-submission modes are supported through every surface listed above, matching the three interaction styles typical of the AMP / amyloid research workflow:

**Single-sequence mode.** A single peptide is entered as an FASTA-formatted string or as a bare amino-acid sequence. The pipeline runs synchronously (typical latency 3–10 s on a warm cache; 40–80 s cold) and returns the full per-residue tracks (TANGO β-aggregation, S4PRED Q3 probabilities and label, FF-Helix core windows), the biochemical scalars (H̄, net charge, μH, pI), the derived flags (`ssw_candidate`, `ff_helix_flag`), and the ranking score. Sequences outside 10 ≤ *L* ≤ 40 residues are rejected client-side with an explicit reason (Method B).

**Batch mode (CSV / XLSX upload).** A tab- or comma-delimited file with a column of peptide sequences is uploaded. Optional columns are auto-detected and preserved through the pipeline: identifier, organism, source, and any user-defined annotation column. The pipeline runs asynchronously behind a job queue (background thread pool; the response returns immediately with a `job_id`); the results dashboard polls until completion and offers per-column filtering, batch statistics (density plots for each descriptor, threshold-sensitivity curves), publication-ready SVG downloads, and an exportable results workbook containing the raw input, the full per-residue tracks, and the classification columns.

**UniProt-guided discovery mode.** Instead of supplying peptides directly, users can build a typed UniProt query (organism, keyword, length range, database cross-reference filter) that is issued against the UniProtKB REST API; the pipeline then runs on the returned FASTA batch and preserves the UniProt provenance metadata (accession, entry name, evidence code) all the way through to the exported workbook. This mode is designed to accelerate the "start from a hypothesis, not a peptide list" workflow — the same workflow that produced the AlphaFold-guided candidate discovery reported in [CITE: Ragonis-Bachar, Axel, Blau, Ben-Tal, Kolodny, Landau, Proteins 2024].

Across all three modes, the user-controllable thresholds (TANGO hotspot, S4PRED helix probability, FF-Helix window compositional cut-off, ranking weights) are re-evaluated at the presentation layer without re-running any predictor, so a user can re-classify a large batch in constant time.

**Input Formats and Parameters.**

| Input | Accepted formats | Constraints |
|---|---|---|
| Single peptide | Bare 1-letter code, or single-record FASTA | 10 ≤ *L* ≤ 40 aa; canonical residues only |
| Batch | CSV, TSV, XLSX; column header `sequence` (case-insensitive) | ≤ 5 000 rows per submission; sequences validated as per single-peptide rules |
| UniProt query | Structured query builder | 100-hit page size; max 20 pages per query |
| Thresholds | Float parameters on all surfaces | Bounded [0, 1] for probability cuts; [0, 100] for TANGO % |
| API auth | None required | Anonymous rate limit 30 req/min/IP |
