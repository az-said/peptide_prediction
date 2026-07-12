# DATA AVAILABILITY — draft

> Peleg tagged this "Saaid/Alex, please list all the places where the data is available. meaning github or anything like this"
> NAR requires: (1) subject-specific public repo → (2) generic DOI-minting repo → (3) institutional link → (4) supplementary files. Google Drive / GitHub-only links **do not count** for NAR. Zenodo DOI is the compliant path.

---

The source code implementing the PePFibPred pipeline, the pinned dependency manifest, the Docker build recipes, the CI/CD workflow definitions, and the mkdocs-material user handbook are permanently archived on Zenodo under the DOI **10.5281/zenodo.[DOI PENDING TAGGED RELEASE]**, minted automatically on the first tagged GitHub release. A live mirror of the same code base is maintained on GitHub at **https://github.com/az-said/peptide_prediction** for interactive browsing and issue tracking.

The `pvl-cli` command-line interface and `pvl-mcp` Model Context Protocol server are distributed via the Python Package Index under the release identifiers listed in the CHANGELOG (`pip install pvl-cli`; `pip install pvl-mcp`), with signed provenance attestations produced by PyPI's Trusted Publisher workflow. Container images built from every merge to `main` are published to the GitHub Container Registry at **ghcr.io/az-said/peptide_prediction**.

The precomputed prediction artefact used to seed the interactive demo — comprising the full three-runner pipeline output for the 2 916 *Staphylococcus aureus* peptides in the reference dataset [CITE: Reference dataset — S. aureus 2023] — is embedded in the source distribution at `backend/data/precomputed/gold_standard.json` and, in addition, deposited on Zenodo alongside the source archive so that the file can be cited by DOI independently of the code release.

The reference-dataset spreadsheet (`Final_Staphylococcus_2023_new.xlsx`) is bundled with the code archive and with the mirrored public demo. All external binary dependencies (the TANGO Linux ELF, the five S4PRED PyTorch checkpoints from the PSIPRED group at UCL v1.2.4) are pulled through pinned mirrors in the bootstrap script (`scripts/desy_vm_bootstrap.sh`); their SHA-256 digests are recorded in the pipeline's provenance manifest and reproduced in the Zenodo deposit metadata.

The full evaluation output on the reference dataset — including confusion tables, per-residue prediction tracks, and reproduction commands — is published as static supplementary data (`docs/handbook/research/02_validation_evidence.md`) and mirrored on Zenodo. No new experimental data were generated for this manuscript; wet-lab data supporting the reference dataset are those published in [CITE: Reference dataset publication — S. aureus 2023].

**Data Availability Statement (short form for the doc):**

> All source code, dependency manifests, Docker recipes, and the precomputed prediction artefact for the reference dataset are archived on Zenodo (DOI **10.5281/zenodo.[PENDING]**) and mirrored on GitHub (**https://github.com/az-said/peptide_prediction**, MIT-licensed). Distributable packages are on PyPI (`pvl-cli`, `pvl-mcp`). Container images are on GHCR (`ghcr.io/az-said/peptide_prediction`). No new experimental data were generated for this study.

## Notes for Said before pasting
- Get the actual Zenodo DOI by pushing a tag (`v0.1.0` or similar) once the release is cut. Zenodo mint is automatic on tagged GitHub release.
- If Meytal/Peleg want the dataset citation as its own item, add the source publication for the *S. aureus* 2023 curated set — I don't have the citation yet, marked `[CITE: Reference dataset publication — S. aureus 2023]`.
- The `github.com/az-said/peptide_prediction` URL replaces the old `saidaz24-meet/peptide_prediction` URL — GitHub username changed to `az-said` on 2026-06-24 (per commit `150e8ba`).
