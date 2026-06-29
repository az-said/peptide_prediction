# PVL — Final Report (2026-06-29)

> **Status**: feature-complete, scientifically complete, production-deployed on two hosts, top-tier GitHub scaffold in place, hand-over documents written. Waiting on Peleg's 6 scientific questions + Alex's DNS hostname + Alex's ORCID before cutting v1.0.0.

---

## 1. What's live right now

| Where | URL | State |
|---|---|---|
| **Public (paper-citable)** | http://94.130.178.182:3000 | Live, healthy, ISSUE-034 fix being deployed |
| **DESY institutional** | `landau-webapp-dev` (internal, tunnel `localhost:8080`) | Live, healthy, fix deployed + artifacts regenerated |
| **GitHub** | https://github.com/saidaz24-meet/peptide_prediction | Public, MIT, branch-protected, CodeQL, secret scanning |

## 2. Scientific completeness

- **TANGO + S4PRED + FF-Helix + SSW + FF-SSW**: all 4 classes computing correctly per Peleg's algorithm
- **Bundled reference datasets**:
  - `peleg_118` (Peleg-118 fibril-validated) — precomputed JSON, ~600 KB, instant load
  - `gold_standard` (Staphylococcus 2023, 2,916 peptides) — precomputed JSON, 18.7 MB, instant load
- **Both artifacts now have full TANGO data** (ISSUE-034 fixed this turn — `55ee37a`). Aggregation heatmap renders for every row; SSW classification is scientifically correct (TANGO ∪ S4PRED) not S4PRED-only.

## 3. Wave 2.8 + 2.9 shipped (high-impact items only)

- 4-class KPI strip with reason text per class (Q6)
- Per-tool result chips below the sequence track (Q9)
- Pipeline-aware residue coloring on Quick Analyze (Q7)
- Hover tooltip showing TANGO row alongside S4PRED (Q8)
- TANGO panel renamed + reordered: secondary structure first, aggregation second (Q12)
- Database tabs in the biochem block (Q11)
- Per-peptide HTML report (Q15)
- Provenance header on every CSV/TSV/XLSX export (B15 + E4)
- Mol* SSW residue overpaint Phase-1 stub (B16)
- Compare page split-button: vs Peleg-118 / vs Gold Standard (B20)
- M3 UniProt accession-list upload mode
- Precompute endpoint + frontend fallback (instant example loads)
- slowapi rate limiter on the two expensive routes (30 req/min/IP)
- Stripped "Peleg" from user-facing strings (credits-only)
- DESY VM bootstrap script + Kerberos access verified
- ISSUE-034 root-cause fix: precompute now bypasses provider cache + TANGO budget gate

## 4. Production hardening (GitHub side)

- ✅ Branch protection on `main`: 1 review + 4 CI checks required
- ✅ Secret scanning + push protection
- ✅ Vulnerability alerts + Dependabot automated security fixes
- ✅ CodeQL static analysis (Python + TypeScript, security-extended pack)
- ✅ Issue templates (bug / feature / scientific question) + PR template with invariants checklist
- ✅ Contact links route bug-reporters to BACKLOG / HANDOFF first

## 5. Quality + scale

- **Backend**: 646 / 646 pytest cases passing
- **Frontend**: 672 / 672 vitest cases passing
- **Static analysis**: ruff clean, tsc clean, CodeRabbit + CodeQL on every PR
- **Deploy**: 5-container stack (backend + frontend + redis + celery-batch + celery-quick) all healthy on both hosts

---

## 6. What's left for hand-over

Five items. All blocked on external people; nothing in this list is technical work for me.

| # | Item | Owner | ETA |
|---|---|---|---|
| 1 | Send `EMAIL_PELEG_FINAL.md` | You | 5 min |
| 2 | Send `EMAIL_ALEX_FINAL.md` | You | 5 min |
| 3 | Peleg answers OQ1, OQ2, OQ4, OQ5, OQ7, OQ8 ([#106-111](https://github.com/saidaz24-meet/peptide_prediction/issues)) | Peleg | 1-2 weeks |
| 4 | Alex provides: DNS hostname, firewall 80/443, ORCID | Alex | 1-2 weeks |
| 5 | Cut v1.0.0 tag → Zenodo DOI → wire DOI into CITATION.cff + README | You | 30 min after #3 + #4 |

After #5, optional polish:
- bio.tools registration (20 min, paste-ready fields in `PUBLICATION_PATH.md` §4)
- JOSS paper submission (1 hr after Zenodo DOI lands)
- Caddy DNS handover on DESY VM (5 min when Alex's hostname lands)

That's the entire remaining flight.

---

## 7. What the next developer sees

Five files give them the whole project:

1. **`docs/active/HANDOFF.md`** — single-page on-ramp, what is PVL + how the code is organized
2. **`docs/active/BACKLOG.md`** — Tier 0 → Tier 4 prioritized backlog, every spec + improvement folded in
3. **`docs/active/HANDOVER_CHECKLIST.md`** — your tick-list for handover day
4. **`docs/active/ARCHITECTURE.md`** — deep technical reference (the bible)
5. **`docs/active/PUBLICATION_PATH.md`** — Zenodo → bio.tools → JOSS workflow

Everything else they need is one git-grep away.

---

## 8. Email Peleg (paste-ready)

The polished version is at **`docs/internal/EMAIL_PELEG_FINAL.md`**. Body summary:
- Live URLs (Hetzner + DESY)
- 11-bullet researcher-facing changes summary
- 6 open scientific questions with GitHub Issue links
- Quality + scale numbers
- 3 next steps from her end

## 9. Email Alex (paste-ready)

At **`docs/internal/EMAIL_ALEX_FINAL.md`**. Body summary:
- DESY VM end-to-end verified state
- 3 asks: DNS hostname, firewall 80/443, optional GitLab mirror
- Production hardening summary
- File pointers Alex may want to skim

---

## 10. Final word

PVL is, as of this commit:

- A scientifically complete peptide aggregation + SSW prediction tool
- Open source under MIT, public on GitHub, branch-protected, security-scanned
- Deployed on two hosts with auto-precomputed instant-load example datasets
- Documented for a researcher (HANDOFF), an agent (Opus 4.8 docs handbook in flight), and a paper author (PAPER_METHODS_REFERENCE)
- Ready for a Zenodo DOI cut at v1.0.0
- Ready for bio.tools listing
- Ready for JOSS submission
- Ready for hand-over to the next developer

You walked it from "first draft on a single VPS" to "publication-ready scientific instrument" in 2.8 + 2.9.

Send the two emails, get Peleg + Alex's replies, cut v1.0.0. That's the project shipped.

Said
