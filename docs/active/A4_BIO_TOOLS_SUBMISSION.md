# A4 — bio.tools submission packet

> Form: https://bio.tools/contribute  (login required)
> Estimated time: 20 min once you start
> Prerequisites: real LICENSE file (see "Blockers" at bottom), public homepage URL

This is a paste-ready packet. Each field heading matches a bio.tools form field. Where I had to pick a value, the rationale is in *italics*. Strip italics before pasting.

---

## Identity

**Name**: `Peptide Visual Lab`
**bio.tools ID** (auto-suggested): `peptide-visual-lab` or `pvl`
**Short name**: `PVL`

**Description (short, 1 line, max 200 chars)**:
> All-in-one web dashboard for peptide aggregation propensity (TANGO), secondary-structure prediction (S4PRED), fibril-forming helix detection, and AlphaFold 3D overlay.

**Description (full, max 1000 chars)**:
> Peptide Visual Lab (PVL) is an open-source web platform that unifies peptide aggregation propensity (TANGO), secondary-structure prediction (S4PRED), fibril-forming-helix (FF-Helix) candidate detection, secondary-structure-switch (SSW) prediction, and live 3D structure visualization (AlphaFold via Mol*) in a single interactive dashboard. Researchers can upload a CSV/FASTA, paste a single sequence, or query UniProt directly; every analysis becomes a citable permalink encoding version + thresholds for reproducibility. PVL is designed as a multi-surface research instrument: a web app, an embeddable widget, a Python package (`pvl-py`), a CLI (`pvl-cli`), and an MCP server so AI assistants can drive analyses. Built for structural biology and biophysics groups working on amyloid, antimicrobial, and chameleon peptides.

---

## URLs

**Homepage**:
- Current (placeholder): `http://94.130.178.182:3000`
- Target (post-DESY-migration): `https://landau-webapp-dev.desy.de` (or wherever Alex routes it)

> Pick the one Peleg + Alex are actually using when you submit. bio.tools allows URL updates after registration.

**Source code**: `https://github.com/saidaz24-meet/peptide_prediction`
**Issue tracker**: `https://github.com/saidaz24-meet/peptide_prediction/issues`
**Documentation**: `https://github.com/saidaz24-meet/peptide_prediction#readme`
**Download**: `https://github.com/saidaz24-meet/peptide_prediction/releases` *(currently empty — A5 Zenodo release creates the first tag)*

---

## License

**License (OSI)**: `MIT`
> ⚠️ Blocked until you decide on the LICENSE resolution (see top of this packet). bio.tools will not accept "MIT" if the repo has `LICENSE-DESY-RESEARCH.md` only.

**License (alternative, if you keep DESY-only)**: `Non-Commercial` — but this disqualifies PVL from bio.tools' "openSource" filter and from JOSS submission. Strongly discouraged.

---

## Topics (EDAM ontology — pick all that apply)

- `topic_0078` Proteins
- `topic_0166` Protein structural motifs
- `topic_0820` Membrane and lipoproteins
- `topic_2275` Molecular modelling
- `topic_3382` Imaging *(for the AlphaFold 3D viewer)*
- `topic_3892` Sequence comparison *(for the cohort comparison feature)*

EDAM browser: https://ifb-elixirfr.github.io/edam-browser/

---

## Operation (what PVL DOES, EDAM ontology)

- `operation_0473` Protein secondary structure prediction *(via S4PRED)*
- `operation_0269` Protein property prediction *(hydrophobicity, charge, µH)*
- `operation_0407` Protein function annotation *(via UniProt cross-link)*
- `operation_0245` Protein architecture recognition *(FF-Helix + SSW classification)*
- `operation_0570` Structure visualisation *(Mol* / AlphaFold overlay)*
- `operation_0337` Visualisation
- `operation_0306` Text mining *(only loosely — UniProt query parsing)*

> `operation_0473` is the primary; others are secondary. Bio.tools lets you mark primary vs secondary.

---

## Input / Output

**Inputs**:
- Format: `Protein sequence` (FASTA, plain text, CSV, TSV, XLSX)
  - EDAM data: `data_2976` Protein sequence
  - EDAM format: `format_1929` FASTA, `format_3752` CSV, `format_3475` TSV, `format_3620` XLSX
- Format: `UniProt accession` (single accession, keyword search, or organism ID)
  - EDAM data: `data_3021` UniProt accession
  - EDAM format: `format_2330` (text)

**Outputs**:
- Format: `Aggregation propensity` (per-residue TANGO scores)
  - EDAM data: `data_1278` Genetic map
  - EDAM format: `format_3464` JSON
- Format: `Protein secondary structure` (per-residue S4PRED probabilities)
  - EDAM data: `data_2877` Protein secondary structure
  - EDAM format: `format_3464` JSON
- Format: `Classification flags` (FF-Helix, SSW, FF-SSW, Helix as `1 | -1 | null`)
  - EDAM data: `data_2884` Plot
  - EDAM format: `format_3464` JSON
- Format: `Publication-ready figures` (SVG, PNG per chart + helical wheel + Mol* viewer screenshot)
  - EDAM format: `format_3604` SVG, `format_3603` PNG
- Format: `Citable permalink` (URL encoding version + SHA + thresholds + accessions)

---

## Tool type

`Web application` — primary
`Library` — for the planned `pvl-py` (mark TBD until pvl-py v0.1 ships)
`Command-line tool` — for the planned `pvl-cli` (mark TBD)

---

## Platforms

- Linux *(primary, Docker)*
- macOS *(dev only)*
- Windows *(via Docker Desktop)*
- Browser *(any modern; tested on Chrome, Firefox, Safari)*

---

## Maturity

`Mature` — production-grade test coverage (538 backend + 611 frontend tests as of 2026-05-20), CI green, deployed publicly. Pre-paper, pre-Zenodo-DOI.

---

## Cost

`Free of charge`

---

## Accessibility

`Open access`

---

## Operating system / architecture

`Linux` (Docker, x86_64 + arm64), `macOS` (dev), `Windows` (Docker Desktop)

---

## Programming language

- `Python` (backend, FastAPI)
- `TypeScript` (frontend, React + Vite)

---

## Documentation

URL: `https://github.com/saidaz24-meet/peptide_prediction/blob/main/README.md`
Type: `User manual` + `Quick start`

> Consider adding a dedicated `docs/` site (mkdocs/Docusaurus) before JOSS submission — bio.tools accepts a README, but JOSS reviewers expect more.

---

## Authors

1. **Said Azaizah** — Lead developer, Co-founder
   - Email: az.said2007@gmail.com
   - ORCID: 0009-0002-3596-5358
   - Affiliation: Technion — Israel Institute of Technology + DESY
2. **Dr. Peleg Ragonis-Bachar** — Algorithms, scientific reviewer
   - Affiliation: Technion — Israel Institute of Technology
   - ORCID: PENDING (ask Peleg before submission)
3. **Dr. Aleksandr Golubev** — Scientific advisor, deployment infra
   - Affiliation: DESY (Deutsches Elektronen-Synchrotron) + Technion
   - ORCID: PENDING (ask Alex before submission)

---

## Funding

- DESY / CSSB Hamburg (deployment infrastructure)
- Technion (algorithm collaboration, no direct funding to date)

> If there's a DESY grant ID or technical agreement number, add it here.

---

## Citations to add post-submission

After Zenodo DOI arrives (A5), come back and add:
- `Publications → Other → Zenodo archive` DOI

After JOSS paper accepted (A7), come back and add:
- `Publications → Primary → JOSS paper` DOI

---

## Blockers (resolve before submitting)

1. ⚠️ **LICENSE resolution** — repo has `LICENSE-DESY-RESEARCH.md` (non-commercial) while README/CITATION claim MIT. Pick one path. T1 will action this once Said replies `MIT` / `DESY` / `dual` (see top of `docs/active/A4_BIO_TOOLS_SUBMISSION.md` thread).

2. ⚠️ **Stable homepage URL** — Hetzner `94.130.178.182:3000` is fine for a first registration but Alex's DESY URL is the long-term home. bio.tools allows URL updates so this is not strictly a blocker, but you'll re-edit after DESY migration. Decide if you want to submit on Hetzner now or wait for DESY.

3. ⚠️ **Peleg + Alex ORCIDs** — CITATION.cff has them as PENDING. bio.tools accepts authors without ORCIDs but it's a JOSS prerequisite. Ask them once.

4. ✅ **Public source code** — done.
5. ✅ **README** — done.
6. ✅ **Tests + CI** — green.
7. ⏳ **Zenodo DOI** — pending A5. Not a strict bio.tools blocker; add later.

---

## Submission flow

1. Resolve blocker #1 (LICENSE).
2. Sign in at https://bio.tools/login (ELIXIR AAI or email).
3. Click "Contribute" → "New tool".
4. Paste the fields above. Use the form's autosuggest for EDAM terms — paste the IDs above, the form fills in the human-readable labels.
5. Submit. Review by bio.tools curators takes ~1-2 weeks.
6. Once approved, add the bio.tools badge to README:
   ```markdown
   [![bio.tools](https://img.shields.io/badge/bio.tools-PVL-blue)](https://bio.tools/pvl)
   ```
