---
title: "Peptide Visual Lab (PVL): an interactive web tool for fibril-formation prediction combining aggregation, secondary structure, and dataset-derived classification"
tags:
  - bioinformatics
  - peptides
  - secondary structure
  - aggregation
  - fibril formation
  - amyloid
  - visualization
  - reproducibility
  - web server
authors:
  - name: Peleg Ragonis-Bachar
    orcid: 0000-0002-0979-8165
    corresponding: false
    affiliation: 1
  - name: Said Azaizah
    orcid: 0009-0002-3596-5358
    corresponding: false
    affiliation: "2, 3"
  - name: Aleksandr Golubev
    corresponding: false
    affiliation: "3, 1"
  - name: Meytal Landau
    orcid: 0000-0002-1743-3430
    corresponding: true
    affiliation: "1, 4, 5"
affiliations:
  - name: Technion — Israel Institute of Technology, Department of Biology, Haifa, Israel
    index: 1
  - name: Massachusetts Institute of Technology, Cambridge, MA, USA
    index: 2
  - name: Deutsches Elektronen-Synchrotron (DESY), Hamburg, Germany
    index: 3
  - name: European Molecular Biology Laboratory (EMBL), Hamburg Unit, Germany
    index: 4
  - name: Centre for Structural Systems Biology (CSSB), Hamburg, Germany
    index: 5
date: 8 June 2026
bibliography: paper.bib
---

# Summary

Peptide Visual Lab (PVL) is an open-source web server that combines aggregation propensity, secondary structure prediction, and fibril-forming candidate detection in a single interactive dashboard. PVL implements the four-category peptide classification algorithm published by @ragonis_bachar_2022 — Helix, Fibril-Forming Helix (FF-Helix), Secondary Structure Switch (SSW), and Fibril-Forming SSW (FF-SSW) — and exposes it through a permalink-citable web interface, a Python package, a command-line tool, an MCP (Model Context Protocol) server, and a self-host Docker bundle. Every analysis becomes a stable URL with embedded version, threshold configuration, and dataset identifier, allowing reviewers to reproduce the exact view a researcher cites in a paper.

PVL is designed as a research instrument, not a feature collection. Its single-sequence and batch pipelines are guaranteed to produce identical results for the same input, its API response schema is the canonical source of truth across all five surfaces, and its fibril-formation thresholds are derived from the dataset under analysis (matching the exact algorithm in @ragonis_bachar_2022 rather than approximating with fixed constants). Backend services run S4PRED [@moffat_2022] for secondary structure prediction, TANGO [@fernandez_escamilla_2004] for aggregation propensity, a pure-Python implementation of the gap-smoothed segment finder for fibril-forming helix detection, and a vectorized biochemistry module for charge, hydrophobicity, and hydrophobic moment.

# Statement of need

Researchers studying peptide aggregation, conformational switching, and fibril formation routinely combine outputs from several specialist tools — PASTA 2.0 [@walsh_2014], Waltz [@maurer_stroh_2010], AGGRESCAN [@conchillo_sole_2007], TANGO, PSIPRED [@buchan_2019] — each of which is a single-algorithm command-line program emitting static PNG images or text files. The published workflow in @ragonis_bachar_2022 itself runs S4PRED for secondary structure, computes fibril-formation gates from the dataset mean of hydrophobicity and hydrophobic moment over the class-positive subset, and validates the resulting candidate list against experimental fibril formation in *Staphylococcus aureus* peptides. Manually reproducing this workflow requires juggling multiple offline tools, custom scripts, and careful threshold derivation — a substantial barrier for researchers who want to apply the method without re-implementing it.

Existing web servers in this space — bioSyntax browsers, AmyloidPredictor, AmyPred-FRL, AntiAMP — solve adjacent problems but none combine the full PVL workflow in an interactive form with structure overlay, dataset-derived thresholds, and citation-quality reproducibility. PVL closes this gap by:

1. Implementing @ragonis_bachar_2022's algorithm verbatim, including the dataset-derived gate computation (μH-positive mean for FF-Helix; hydrophobicity-positive mean for FF-SSW) rather than fixed constants.
2. Layering an AlphaFold 3D structure overlay [@jumper_2021; @varadi_2024] on every prediction, rendered through Mol* [@sehnal_2021], so researchers see the predicted helix/SSW/aggregation regions on the actual three-dimensional fold.
3. Generating a citation-stable permalink for every analysis: paste the URL in a paper and reviewers see the same view, computed under the same software version and threshold configuration.
4. Exposing the same prediction pipeline through five surfaces (web, Python package, CLI, MCP server, Docker self-host) so the same analysis can be run from a browser, a Jupyter notebook, a CI pipeline, or a Claude Desktop conversation, with byte-identical results.

PVL has been used internally by the Landau and Ragonis-Bachar groups for FF-candidate identification in *S. aureus* and *Cupiennius salei* peptide cohorts, and serves as the reference implementation of the 2022 algorithm for the community.

# Implementation

The backend is implemented in Python 3.11 using FastAPI and Pydantic v2 (with `extra="forbid"` for strict schema validation). S4PRED runs as a TorchScript model on CPU; TANGO runs as a Linux subprocess. The fibril-formation segment finder and the dataset-derived threshold computation are pure Python and ship with the package.

The frontend is React 18 + TypeScript 5 + Vite, with state managed by Zustand stores. Charts use Recharts; the 3D viewer uses Mol*. The classification pipeline runs on the backend; the frontend reads canonical column names from a single API contract (`api_models.py`) shared across all five surfaces.

Reproducibility is achieved through three mechanisms:

- **Permalink encoding**: every analysis URL contains the input sequence(s), version SHA, threshold configuration, and dataset identifier.
- **Version-tagged Sentry telemetry**: each release tags backend exceptions with the release SHA so reproducing a reported bug requires only the version string.
- **Dataset-derived thresholds**: rather than freezing fibril-formation cutoffs at constants, PVL computes them from the per-run dataset mean over the class-positive subset, exactly matching `main.py` lines 147–170 of @ragonis_bachar_2022.

PVL is released under the MIT license, with the canonical archive on Zenodo and a citation hook through `CITATION.cff`. A comprehensive test suite (1,500+ deterministic tests) runs on every commit through GitHub Actions, with type checks via mypy and CodeRabbit AI review.

# Acknowledgements

We thank the developers of S4PRED, TANGO, AlphaFold DB, and Mol* for their tools and unrestricted licensing. Computational resources were provided by DESY (Deutsches Elektronen-Synchrotron) and the Centre for Structural Systems Biology (CSSB). The MIT contribution of S.A. is acknowledged. P.R.-B. acknowledges funding from the Israel Science Foundation. M.L. acknowledges funding from the European Research Council and the Israel Science Foundation.

# References
