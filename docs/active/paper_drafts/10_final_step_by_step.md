# Final Step-by-Step — Said's checklist (2026-07-12 → submission)

> **Update 2026-07-12 evening**: three new files added — `11_future_plans_paper_content.md`, `12_master_handover_playbook.md`, `13_sentry_migration_runbook.md`. Two new Phases added: Phase 11 (paper Future Work paragraph) and Phase 12 (adopt handover playbook). The Sentry migration is now its own explicit runbook (Phase 2.4 → `13_...`). **The core message stays: Said keeps Owner/admin on everything forever; Alex becomes Primary Responder; Said stops receiving routine pages.**

> Ordered from *"open right now"* through *"night before submission"*. Every step is either a **READ**, an **EDIT**, an **ADD**, a **PASTE** (into a Google Doc), a **SEND** (to a person / platform), or a **RUN** (a shell command).
> NAR Web Server submission window: **2026-11-10 → 2026-12-10** (≈ 17 weeks from today).
> Working copy: <https://docs.google.com/document/d/1mawqsE2x2PIvPYcj_lon0oRMN5OsvOhnxGz8l8FElTQ/edit>
> Original doc: <https://docs.google.com/document/d/1fDSC3k-9xrWiThHbnB8xMG0wS5yINZjRL-_oBg54ZFY/edit>
> Supporting Information shell: <https://docs.google.com/document/d/13vbt7v-T1dI3zr1Olqp08yRIUU0scBSzjA9ejZF_q3g/edit>

Legend:
- ✅ = do this now
- 🔒 = blocked (waiting on external)
- 💬 = comment goes to Peleg/Meytal/Alex
- 📌 = pin in Cursor and re-check nightly

---

## Phase 0 — Read before you touch anything (≈ 90 min)

**0.1** ✅ **READ** `docs/active/paper_drafts/09_correctness_deltas.md` end-to-end. This is the fastest way to internalise the 20+ facts that changed between v1 and v2 of the M&M. If nothing in that file surprises you, skip 0.2.

**0.2** ✅ **READ** `docs/active/paper_drafts/08_terminology_and_style_guide.md` end-to-end. This is the Peleg-lexicon. **📌 Pin it in Cursor** — you will re-check every paragraph you paste against it.

**0.3** ✅ **READ** `docs/active/paper_drafts/01_materials_and_methods.md` end-to-end (v2, ~2 800 words). Look for anything that reads wrong to you *from personal knowledge of the code you wrote* — you know the code better than anyone. Every mismatch you find is an issue.

**0.4** ✅ **READ** `docs/active/paper_drafts/README.md` — index of what's in the drafts folder, who owns what.

**0.5** ✅ **READ** `docs/active/PUBLICATION_PATH.md` if it exists (bio.tools + JOSS + Zenodo operator's checklist) and `docs/handbook/research/04_publication_path.md` — these are the operational steps that run in parallel with the paper writing.

---

## Phase 1 — Google Doc pastes (this week; ≈ 2 h)

Open the WORKING COPY tab. Do not touch the original doc. Order matters — Method A first because it sets the vocabulary the rest uses.

**1.1** ✅ **PASTE** Method A from `01_materials_and_methods.md` into the "MATERIAL AND METHODS" → "Method A" section. Format the heading as **Heading 2 (bold non-italic)** per Peleg's saved template. Verify the body renders with proper Greek (α, β, μH) and proper en-dashes (10-40 not 10 – 40).

**1.2** ✅ **PASTE** Method B, one at a time, checking Heading 2 for method titles and Heading 3 (italic non-bold) for any sub-heading. If a paragraph you paste breaks the Google Docs style, use **Format → Paste without formatting**, then re-apply Heading 2/3.

**1.3** ✅ **PASTE** Methods C → D → E → F → G → H → I → J → K → L → M in order. Each paste is one method block from `01_materials_and_methods.md`. After each paste, run a **quick sanity check**: search the Doc for `∧` (should not appear anywhere — SSW is OR not AND); search for `pI` (should not appear — no pI implementation); search for `TANGO_AGG_HOTSPOT_DEFAULT` (should not appear — actual name is `DEFAULT_AGG_THRESHOLD`).

**1.4** ✅ **PASTE** the "Server usage" content from `02_server_usage.md` into the corresponding section. Add production URL to be filled in later (labelled `[HOSTNAME PENDING FINAL DNS]`).

**1.5** ✅ **PASTE** Said's + Alex's CRediT lines from `03_author_contributions.md` into the "AUTHOR CONTRIBUTIONS" section. Leave Peleg's existing line intact. Placeholder names (John Smith / etc.) get replaced once Peleg + Meytal confirm the final byline order.

**1.6** ✅ **PASTE** the "Data Availability Statement (short form for the doc)" block from `04_data_availability.md` into the "DATA AVAILABILITY" section. Zenodo DOI stays `PENDING` until first tagged release (Phase 4).

**1.7** ✅ **PASTE** the entire block from `05_tool_name_and_graphical_abstract.md` as **two comments** on Peleg's threads:
- The naming table → the "Find a name" comment
- The graphical-abstract concepts → the "Ideas for graphical abstract?" comment

Do **not** overwrite the title `PePFibPred` in the body.

**1.8** ✅ **PASTE** the 8 discussion bullets from `06_discussion_bullets.md` into the "DISCUSSION" bullet list, below Peleg's existing two bullets. Do not merge with hers — she has explicitly said she will merge later.

**1.9** ✅ **REVIEW** the entire Doc top-to-bottom, checking that Peleg's already-written sections (ABSTRACT, INTRODUCTION, RESULTS opening, Computational scheme, Server Output, Interpretation of Results, Case Study 1, Case Study 2) are **untouched**.

---

## Phase 2 — Alex admin transfer (this week; ≈ 30 min of actions + waiting)

Follow `07_alex_admin_checklist.md` exactly. Order matters because Sentry redirection depends on his Sentry-account creation.

**2.1** ✅ **SEND** an email or Slack to Alex (`aleksandr.golubev@cssb-hamburg.de`) with:
- His GitHub handle confirmation: `axelgolubev` — is that his? (verified from his public profile 2026-07-12)
- Ask for his PyPI username (needed for step 4 of the admin runbook)
- Ask for his SSH public key (needed for step 6)
- Ask for his ORCID (needed for `CITATION.cff` — required for Zenodo mint)

**2.2** ✅ **INVITE** Alex to the GitHub org (`https://github.com/orgs/az-said/people`), role **Owner**. Wait for him to accept.

**2.3** ✅ Once accepted, **VERIFY** he now shows as Owner and inherits GHCR + GitHub Pages + Discussions moderator.

**2.4** ✅ **SENTRY MIGRATION** — follow `13_sentry_migration_runbook.md` end-to-end. 7-step runbook: invite Alex as Owner → redirect alert-rule recipients from "Said user" to "Team: Owners" → silence Said's *personal notification preferences* (so his inbox goes quiet while he stays Owner) → add SEV1 escalation rule (30 min unresolved → email Said) → redirect Slack → update `SENTRY_RUNBOOK.md` → sanity-test on staging.
**Result**: Said keeps every admin permission but stops receiving routine pages; Alex is primary responder; SEV1 auto-escalates to Said if Alex misses.

**2.5** 🔒 **PyPI** — waits on Alex sending his PyPI username. Once received, add him as Owner on `pvl-cli` and `pvl-mcp`.

**2.6** ✅ **Hetzner VPS SSH** — append Alex's SSH public key to `/root/.ssh/authorized_keys` on `94.130.178.182` once he sends it. Also invite him to the Hetzner Cloud console.

**2.7** 🔒 **DESY VM** — hold until DESY IT unblocks. Add to Alex's key + Kerberos principal at that point.

**2.8** ✅ **WRITE** `docs/active/OWNERSHIP_MATRIX.md` (from the template in `07_alex_admin_checklist.md` § 11) and commit. This is the definitive who-has-what for the paper's Acknowledgements and for the next dev.

**2.9** ✅ **UPDATE** `CITATION.cff`:
- Add Alex's ORCID (`orcid: "https://orcid.org/0000-0000-0000-0000"` — real ID once he sends)
- Bump version to what you want on the first tag (e.g., `0.4.0` or `1.0.0`)

**2.10** ✅ **UPDATE** `docs/active/HANDOFF.md` (or create) so the next reader sees Alex + Said as co-owners and Alex as primary Sentry recipient.

---

## Phase 3 — Reference dataset citation + Peleg follow-ups (2-4 weeks; async with her)

**3.1** 💬 **ASK PELEG** (single message, four items):
1. Ragonis-Bachar & Rayan **DOI** — for the threshold citation across M&M Method G, Method M, and the Help page. This is **OQ6** in `docs/handbook/research/03_open_questions.md`.
2. *Staphylococcus aureus* 2023 dataset **publication reference** — the specific paper her lab published that curated this set. Needed for the `[CITE: dataset publication]` placeholder in Method M.
3. Function name in her TANGO-aggregation-by-stretches reference code so we can port the stretch-method aggregation logic verbatim (**Zoom prep Q4**). If she prefers the *documented* behaviour of the current code (physicochemical parameters at pH 7 / 298 K / 0.1 M / 0 TFE), M&M Method C stays as v2 writes it. If she prefers we implement her stretch method, that's a code change first, then re-word Method C.
4. Her verbatim paste-in text for the SSW + FF-SSW Help section descriptions (she wrote Helix + FF-Helix; **Q5**). This lands on the Help page and mirrors into the paper's Server-Output section.

**3.2** 💬 **ASK PELEG + MEYTAL** on the naming thread: pick from the ranked candidates in `05_tool_name_and_graphical_abstract.md`, or propose a name. Recommendation: **PePFibPred** (keep default) or **FibrilPredictor** (Peleg's second placeholder) for discoverability.

**3.3** 💬 **ASK PELEG** whether Said = 2nd author or 3rd, and whether Said is one of the three co-first authors marked with `†`.

**3.4** ✅ Once she answers, **BATCH-EDIT** the placeholders in the drafts and in the CITATION.cff / mkdocs / package.json / pyproject.toml if the tool name changes.

---

## Phase 4 — Ship v1.0.0 + Zenodo + supporting infrastructure (~2 weeks)

**4.1** ✅ **VERIFY** current release version. Read `CITATION.cff:5`, `ui/package.json:4`, `pvl-cli/pyproject.toml:7`. If all read `0.3.0` and you want a new release for the paper, bump to `1.0.0` in all three files.

**4.2** ✅ **VERIFY** `LICENSE` is MIT only. If `LICENSE-DESY-RESEARCH.md` exists alongside, delete it or archive it (GitHub license detector previously flagged it as "Other"; PUBLICATION_PATH Step 0 covers this).

**4.3** ✅ **RUN** the CI locally before pushing the tag:
```
make ci
make smoke-tango
make contract-check
make precompute-datasets   # rebuilds gold_standard.json + peleg_118.json
```

**4.4** ✅ **PUSH** the tag:
```
git tag -a v1.0.0 -m "PePFibPred v1.0.0 — first paper-cut release"
git push origin v1.0.0
```
This triggers:
- `release.yml` → Sentry release + source-map upload + GitHub release
- `docker-publish.yml` → GHCR image tagged `v1.0.0`
- `publish-pypi.yml` → `pvl-cli` and `pvl-mcp` on PyPI (Trusted Publisher, OIDC)
- **Zenodo does NOT auto-mint** — this is currently a manual step (see 4.5).

**4.5** ✅ **MINT** Zenodo DOI manually: go to Zenodo → your GitHub-linked repos → enable webhook on `az-said/peptide_prediction` if not already → the tag push triggers the webhook → Zenodo mints a versioned DOI. Copy the DOI back into `CITATION.cff:52–55` (replace `zenodo.PENDING`).

**4.6** ✅ **REBUILD** the precompute artefacts on the production Hetzner VPS after the release deploys — the Docker volume rebuild wipes them. Runbook: `prod_redeploy.sh` (or `docs/active/CONSOLIDATED_FINAL_DEPLOY.md`).

**4.7** ✅ **UPDATE** the Data Availability paragraph in the WORKING COPY doc with the real Zenodo DOI.

**4.8** ✅ **BIO.TOOLS** — file the registration once the release is tagged. `docs/active/A4_BIO_TOOLS_SUBMISSION.md` if that packet still exists. This makes the tool discoverable per Peleg's Drive C25.

---

## Phase 5 — Meytal-owned sections (async)

**5.1** 💬 **ASK MEYTAL** on the ACKNOWLEDGEMENTS thread: DESY-specific people to acknowledge, and BioRender licence for the graphical abstract if we use BioRender.

**5.2** 💬 **ASK MEYTAL** on the FUNDING thread: which grant numbers to cite (Peleg's own `Meytal, which funding list should we put here?` comment).

**5.3** ✅ Meytal answers → Peleg writes → Peleg merges → you paste into the WORKING COPY, review, then into the ORIGINAL.

---

## Phase 6 — Case-study drafts (Peleg + Meytal own, but you support with data)

Peleg has claimed "Case Study 1: Known positive examples" and "Case Study 2: Novel predictions" as her sections. Your role:

**6.1** ✅ **PREPARE** the input data for Case Study 1 — the pinned canary peptides (PSM-α1, PSM-α3, Aβ16-22, α-synuclein NAC core, uperin 3.5, etc.). Send Peleg the pipeline outputs on those peptides as a CSV/JSON so she can pick which ones to feature.

**6.2** ✅ **PREPARE** the input data for Case Study 2 — top-K novel predictions from a fresh run against a Peleg-picked UniProt query. Awaiting Peleg to define the query.

**6.3** 💬 **ASK PELEG** which query she wants for Case Study 2.

---

## Phase 7 — Discussion merge (Peleg owns; ~1 week before submission)

**7.1** ✅ **VERIFY** your 8 bullets from `06_discussion_bullets.md` are in the WORKING COPY doc as bullets, below Peleg's two bullets, not merged.

**7.2** 💬 **CONFIRM** with Peleg when she'd like to do the merge (she has said "At the end I will generate something that combines all"). Offer to draft a first-pass merge if she'd like — with her voice for the science bullets and the engineering-side voice for our bullets.

---

## Phase 8 — Supporting Information (~2 weeks before submission)

The SI doc is currently just a shell. Fill:

**8.1** ✅ **WRITE** SI Table S1: full pipeline dependency versions (backend + frontend + external binaries) — from `01_materials_and_methods.md` Method K. Copy the version numbers directly.

**8.2** ✅ **WRITE** SI Table S2: per-classifier confusion tables on *Staphylococcus aureus* 2023 labeled subset (66 peptides) — the numbers are already in `docs/handbook/research/02_validation_evidence.md` §139-156.

**8.3** ✅ **WRITE** SI Figure S1: FF-Helix μH threshold-sensitivity sweep (F1 plateau across 0.0-0.6, collapse ≥ 0.7).

**8.4** ✅ **WRITE** SI Figure S2: FF-SSW hydrophobicity threshold-sensitivity sweep (max F1 = 0.385 at cutoff 0.5).

**8.5** ✅ **WRITE** SI Section S1: canary peptide list with UniProt/PMID/DOI references — from `backend/tests/test_canary_peptides.py`.

**8.6** ✅ **WRITE** SI Section S2: reproducibility-permalink protocol — how to reconstruct any interactive result from the permalink alone.

**8.7** ✅ **WRITE** SI Section S3: negative-class composition of the *S. aureus* 2023 subset (15 × PSM-α2 dominance, etc.). This is the honest disclosure Peleg has already blessed for the paper.

---

## Phase 9 — Nightly hygiene (weeks 9-17)

**9.1** 📌 Every night: `git log --oneline main -5` — check nothing merged that would invalidate an M&M claim (e.g. a change to `MAX_SEQUENCE_LEN`, `DEFAULT_AGG_THRESHOLD`, `_HELIX_PROP`, the SSW OR/AND rule).

**9.2** 📌 If any of the above changed, **re-verify** the affected M&M paragraph and update the WORKING COPY.

**9.3** 📌 If Peleg drops a new Drive comment, follow the same "read → update terminology guide (if new endorsed/rejected term) → update M&M if affected → paste into WORKING COPY".

---

## Phase 10 — Night before submission

**10.1** ✅ **RUN** the invariant test suite one last time:
```
make ci                      # backend pytest + frontend vitest + Docker build
make smoke-tango             # TANGO binary reachable + N-in-N-out
make contract-check          # backend↔UI schema alignment
```

**10.2** ✅ **REBUILD** precompute artefacts on production so the live demo matches the paper's Method M numbers.

**10.3** ✅ **VERIFY** the following are populated in the WORKING COPY:
- Real Zenodo DOI (not `PENDING`)
- Real production hostname (not `[HOSTNAME PENDING FINAL DNS]`)
- Real dataset citation for *Staphylococcus aureus* 2023 (not `[CITE: dataset publication — Peleg to supply DOI]`)
- Real Ragonis-Bachar & Rayan citation for thresholds (not `[CITE: ]`)
- Real tool name (or `PePFibPred` if Peleg + Meytal kept it)
- Real byline order (no `Name Surname†` placeholders)
- Real ORCIDs for every author

**10.4** ✅ **REVIEW** entire Doc one last time against `08_terminology_and_style_guide.md`. Search + replace:
- Any `alpha-helical` → `α-helical`
- Any `AND` in an SSW context → **verify it's the correct AND** (FF-Helix is `helix ∧ μH ≥ threshold`; FF-SSW is `SSW ∧ H̄ ≥ threshold`; SSW itself is `TANGO ∨ S4PRED`)
- Any `false positive` (for AMPs) → "membrane-active overlap"
- Any `cohort` → "database"
- Any `aggregation prediction` (as the tool's purpose) → "fibril-formation prediction"
- Any `PVL` in reader-facing prose → "PePFibPred" (or final name)
- Any `mu-H`, `μ_H`, `uH` → `μH`

**10.5** ✅ **PASTE** the approved WORKING COPY into the ORIGINAL doc so the team sees the final version at the shared link they already have.

**10.6** ✅ **SUBMIT** to <https://nar.bihealth.de/> per Peleg's link at the top of the doc.

---

## Phase 11 — Insert "Future Work" paragraph in the paper (~30 min, do with Phase 1)

Peleg's DISCUSSION section currently has two bullet-summaries she wrote. Our Future Work content is drafted at:
`docs/active/paper_drafts/11_future_plans_paper_content.md`

**11.1** ✅ **PASTE** the "Ongoing development and roadmap" subsection (Paragraphs 1-5 + closing sentence, ~1 500 words) into DISCUSSION, below Peleg's two bullets, before her closing summary. Recommended sub-heading: **"Ongoing development and roadmap"** (Heading 2, matches NAR house style).

**11.2** ✅ **REVIEW** each paragraph — verify no forward-looking claim exceeds what the repo actually shows as designed / scaffolded / planned. If in doubt, weaken the phrasing to "is planned" / "is queued" rather than "will land in the next release".

**11.3** 💬 **ASK PELEG** if she wants to *replace* her closing sentence with ours ("*A structured roadmap of ongoing work…*") or keep hers and add ours as an additional paragraph.

**11.4** ✅ **CROSS-CHECK** Method M (v2 M&M — the reference-databases section) against Paragraph 5's rigor claims. They must agree on: 9 axiom-invariant tests, canary-suite composition, threshold-sensitivity dashboard status (designed but not shipped).

---

## Phase 13 — Point Alex at the onboarding suite (~5 min, do with Phase 2)

Once Alex accepts the GitHub org invite (Phase 2.2), forward him the URL of his onboarding entry point:

**13.1** ✅ **EMAIL ALEX**:
> Subject: Your PePFibPred onboarding — start here
>
> Alex — welcome. Your first read is `docs/active/ALEX_ONBOARDING.md` — a week-by-week guided path. If you've never used GitHub, start with `GITHUB_101_FOR_ALEX.md` (linked from Day 1). Ping me when you finish Week 1. — Said

Alex's suite (all in `docs/active/`):
- `ALEX_ONBOARDING.md` — the week-by-week guide
- `GITHUB_101_FOR_ALEX.md` — GitHub primer if he's never used it
- `OPERATOR_COOKBOOK.md` — how to do X (Sentry response, redeploy, monthly report, release)
- `DOCS_MAP_FOR_ALEX.md` — where every doc lives

**13.2** 📌 **CHECK IN** with Alex after his Week 1 checkpoint (three questions in `ALEX_ONBOARDING.md` at end of Week 1). If he answers all three, he's on track. If not, walk him through the gaps.

---

## Phase 12 — Adopt master handover playbook (~14 h Said time; start after Phase 1)

Reference: `docs/active/paper_drafts/12_master_handover_playbook.md`

The playbook has 15 concrete adoption steps in dependency order. **Said stays Owner on everything forever**; Alex becomes Primary Responder. Two areas actually need work (`⚠` in the playbook's table): the Owner/Primary split (§1) and the founder-oversight loop (§10). The other 8 areas already meet big-co bar — just need small files added.

**12.1** ✅ **DO STEPS 1-5** (critical path — before v1.0.0 tag):
- Step 1: Add `SECURITY.md` at repo root
- Step 2: Promote `OWNERSHIP_MATRIX.md` from checklist §11 to its own file + add `ONCALL.md`
- Step 3: Sentry migration (Phase 2.4 above)
- Step 4: Add `.github/CODEOWNERS`
- Step 5: **Add `API_STABILITY.md` — must land BEFORE the v1.0.0 tag** (post-1.0, any tightening is a SemVer violation)

**12.2** ✅ **DO STEPS 6-10** (Alex-first-day readiness — do in the two weeks after v1.0.0 tag):
- Step 6: `INCIDENT_SEVERITY.md` + reformat existing failure-mode docs into `RUNBOOKS/`
- Step 7: `postmortems/TEMPLATE.md`
- Step 8: `SLO.md` + enable Sentry Phase S.6 + S.8
- Step 9: `MONTHLY_REPORT_TEMPLATE.md` + calendar invites for monthly + quarterly
- Step 10: `RFC_TEMPLATE.md` + footer line in `DECISIONS.md`

**12.3** ✅ **DO STEPS 11-15** (nice-to-have; ship whenever slack in the schedule):
- Step 11: Upptime status page
- Step 12: `DATA_GOVERNANCE.md` + About-page footer paragraph
- Step 13: `.github/workflows/gitleaks.yml`
- Step 14: Diátaxis-tag column in `handbook/README.md`
- Step 15: Six missing ADRs (ADR-028 → ADR-033)

**12.4** 📌 **PIN** the playbook's state-of-the-union table (bottom of `12_master_handover_playbook.md`) — it's the definitive "here's where we are on each of the 10 big-co dimensions" reference for the next dev (Alex or successor).

---

## Cheat-sheet — the 8 files you'll open every day

1. `docs/active/paper_drafts/01_materials_and_methods.md` — v2 M&M
2. `docs/active/paper_drafts/08_terminology_and_style_guide.md` — Peleg's lexicon
3. `docs/active/paper_drafts/09_correctness_deltas.md` — v1→v2 fact log
4. `docs/active/paper_drafts/10_final_step_by_step.md` — this file
5. `docs/active/paper_drafts/11_future_plans_paper_content.md` — paper's Future Work section
6. `docs/active/paper_drafts/12_master_handover_playbook.md` — big-co playbook
7. `docs/active/paper_drafts/13_sentry_migration_runbook.md` — Sentry step-by-step
8. The WORKING COPY Google Doc

---

## What you haven't done yet, listed by Phase (as of 2026-07-12)

| Phase | Status |
|---|---|
| Phase 0 (read) | ⬜ Not started — do this first. Est. 90 min. |
| Phase 1 (paste to Doc) | ⬜ Not started — do second. Est. 2 h. |
| Phase 2 (Alex admin + Sentry migration via `13_...`) | ⬜ Not started — do in parallel with Phase 1 email-first. Est. 60 min actions + 1 day wait. |
| Phase 3 (Peleg follow-ups) | ⬜ Not started — do after Phase 1 so you can point her at text. Est. 2 min per message; 1-2 weeks async. |
| Phase 4 (tag + Zenodo) | ⬜ Not started — do after Alex ORCID + `API_STABILITY.md` (Phase 12.1 step 5) land. Est. 1-2 h actions. |
| Phase 5 (Meytal) | 🔒 Started — comment thread open on the doc. |
| Phase 6 (case study data) | ⬜ Not started — do once Peleg answers OQ6 + defines Case Study 2 query. |
| Phase 7 (discussion merge) | 🔒 Blocks on Peleg's merge. |
| Phase 8 (SI writeup) | ⬜ Start 4 weeks before submission. |
| Phase 9 (nightly hygiene) | ⬜ Starts today. Est. 5 min/night. |
| Phase 10 (submission-night) | 🔒 Blocks on 2026-11-10 window opening. |
| **Phase 11 (Future Work paragraph in paper)** | ⬜ **NEW** — do with Phase 1. Est. 30 min. |
| **Phase 12 (adopt handover playbook)** | ⬜ **NEW** — 12.1 on critical path (before v1.0.0 tag), 12.2 within 2 wks of tag, 12.3 whenever. Total ≈ 14 h across weeks. |

---

## When something blocks

- **Peleg silent** on OQ6 (dataset DOI): submit the paper with `[CITE: PLACEHOLDER — TO BE SUPPLIED]` and follow up with reviewers.
- **Alex silent** on ORCID: cut the release without him, then update `CITATION.cff` and re-mint on the next patch tag.
- **DESY VM still down** on submission night: the Hetzner deployment is production-quality; the paper can go out citing Hetzner as the reference deployment and the DESY VM as "in preparation" (Method K already does this).
- **CI red** on release tag: don't force-push. Fix the failing test on a branch, PR, merge, then re-tag.

---

## When you finish a Phase, come back to this file, put a ✅ next to it, and re-run 9.1.
