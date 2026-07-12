# Said — Manual Actions Master Checklist

**Last updated**: 2026-07-12
**Scope**: every action that only *you* can do — actions that require your credentials, physical login, keyboard, email, or personal decision. Everything else that could be automated **has been**. If it's on this list, it's on this list because Claude cannot do it for you.

**How to use**: this is dense on purpose. Read the ordered list once end-to-end. Then execute in order. Check off as you go. Time estimates assume you're moving briskly, not deliberating.

---

## Ordered by dependency — do them in this order

| # | Action | Est. time | Depends on | Category |
|---|---|---|---|---|
| 1 | **Read this file end-to-end + commit today's staged changes** | 15 min | — | Repo |
| 2 | **Email Alex** — collect his identifiers | 5 min | — | Alex |
| 3 | **Paste 8 paper sections into the Google Doc working copy** | 90 min | — | Paper |
| 4 | **Post 2 comments on Peleg's threads** (naming + graphical abstract) | 5 min | — | Paper |
| 5 | **Invite Alex to GitHub org as Owner** | 2 min | Alex confirms handle | Alex |
| 6 | **Invite Alex to Sentry as Owner** | 2 min | Alex accepts GitHub invite | Alex |
| 7 | **Run Sentry migration runbook `13_sentry_migration_runbook.md`** | 30 min | Alex accepts Sentry invite | Sentry |
| 8 | ~~Add Alex's SSH key to Hetzner~~ **SKIPPED — Alex owns Hetzner** | — | — | — |
| 9 | **Email Peleg — 4 blocking questions + naming decision** | 15 min | Paste done | Peleg |
| 10 | **Email Meytal — Acknowledgements + Funding + BioRender licence** | 10 min | Paste done | Meytal |
| 11 | **Add Alex to PyPI as Owner on `pvl-cli` + `pvl-mcp`** | 5 min | Alex sends PyPI username | Infra |
| 12 | **Update `CITATION.cff` with Alex's ORCID + real Peleg + Meytal ORCIDs** | 3 min | Alex sends ORCID | Repo |
| 13 | **Send Alex the onboarding email** pointing at `ALEX_ONBOARDING.md` | 2 min | Alex accepts invites | Alex |
| 14 | **Cut `v1.0.0` tag** — bump versions, verify LICENSE-MIT only, run CI locally, push tag | 60 min | Alex ORCID + Peleg approvals | Release |
| 15 | **Mint Zenodo DOI + thread through `CITATION.cff`** | 20 min | v1.0.0 tag pushed | Release |
| 16 | **Update working copy Data Availability paragraph with real Zenodo DOI** | 2 min | Zenodo DOI minted | Paper |
| 17 | **First `bio.tools` submission** using `A4_BIO_TOOLS_SUBMISSION.md` | 30 min | Zenodo DOI | Release |
| 18 | **Push approved WORKING COPY content into the ORIGINAL Google Doc** | 30 min | Peleg + Meytal review approved | Paper |
| 19 | **First monthly report** (delegated to Alex) — schedule for 2026-08-04 | 5 min setup | Alex operational | Ops |
| 20 | **DESY VM finalisation** — bootstrap + add Alex's key + update DEPLOYMENT.md | 45 min | **BLOCKED on DESY IT unblock** | Infra |

**Total: ≈ 8 hours of your active time across the next 4 weeks, with the critical path front-loaded to the first 4 hours.**

---

## Action 1 — Read + commit today's staged changes

Everything in the repo I've written this session is uncommitted. About 40 files. Command:

```bash
cd /Users/saidazaizah/Desktop/DESY/peptide_prediction
git status                             # scan the file list
git add -A                             # stage everything
git commit -m "docs: paper drafts v2 + handover playbook + Alex onboarding + operator cookbook + governance artefacts

- Paper drafts v2: MATERIAL AND METHODS rewrite against verified code, 20+ fact
  corrections logged in 09_correctness_deltas.md
- 08_terminology_and_style_guide.md — canonical Landau-lab lexicon + Peleg
  writing conventions
- 11_future_plans_paper_content.md — 5-paragraph 'Ongoing development' for
  DISCUSSION
- 12_master_handover_playbook.md + materialized artefacts:
  * OWNERSHIP_MATRIX.md, ONCALL.md, SLO.md
  * INCIDENT_SEVERITY.md, postmortems/TEMPLATE.md
  * RUNBOOKS/ (5 example runbooks + template + index)
  * RFC_TEMPLATE.md, API_STABILITY.md, DATA_GOVERNANCE.md
  * MONTHLY_REPORT_TEMPLATE.md, reports/
  * .github/CODEOWNERS, SECURITY.md (root)
- Alex onboarding suite:
  * ALEX_ONBOARDING.md (master week-by-week guide)
  * GITHUB_101_FOR_ALEX.md (GitHub primer)
  * OPERATOR_COOKBOOK.md (21 recipes)
  * DOCS_MAP_FOR_ALEX.md (map of everything)
- SAID_MANUAL_ACTIONS.md, INVENTORY_EVERYTHING.md, PASTE_MASTER_INTO_GOOGLE_DOC.md
- Updates: HANDOFF.md (§1a ownership), SENTRY_RUNBOOK.md (roles),
  DECISIONS.md (RFC footer), CONTRIBUTING.md (RFC + edge-image), README.md
  (Alex callout), 07_alex_admin_checklist.md (companion note)"
git push origin main
```

If you want to split into multiple commits by concern instead, that's fine — just say the word.

---

## Action 2 — Email Alex to collect identifiers

**To**: `aleksandr.golubev@cssb-hamburg.de`
**Subject**: `PePFibPred handover — what I need from you`

```
Hi Alex,

To wire you up as Primary Responder on PePFibPred (the peptide fibril-prediction web server), I need four things from you:

1. Confirm your GitHub handle is "axelgolubev" — I saw it on your public profile
2. Your PyPI username (register at https://pypi.org/account/register if you don't have one; send me the username)
3. Your SSH public key — run `cat ~/.ssh/id_ed25519.pub` and paste the whole line here (starts with "ssh-ed25519")
4. Your ORCID URL (e.g. https://orcid.org/0000-0000-0000-0000) — needed for the paper + Zenodo

Once I have these I'll invite you to all the platforms in one go. Then you'll get an onboarding email pointing at a guided week-by-week plan that assumes zero prior GitHub knowledge.

Nothing to do on your end until my second email. Thanks!

Said
```

---

## Action 3 — Paste 8 paper sections into the Google Doc working copy

**Working copy**: <https://docs.google.com/document/d/1mawqsE2x2PIvPYcj_lon0oRMN5OsvOhnxGz8l8FElTQ/edit>
**Paste source**: `docs/active/paper_drafts/PASTE_MASTER_INTO_GOOGLE_DOC.md` — open in Cursor
**Index / landing Google Doc**: <https://docs.google.com/document/d/1npwQzzTkPHCV5UDIqb9FhWeyf5D1_-4qOzMZJAQM4DA/edit> (I created this in your Drive earlier)

**Steps**:
1. Open the working copy in a browser tab
2. Open `PASTE_MASTER_INTO_GOOGLE_DOC.md` in Cursor
3. For each `═══ SECTION N/9 ═══` block:
   - Copy from immediately after the delimiter until the next delimiter
   - Paste (Cmd+V) into the corresponding section of the working copy
   - Fix formatting: Heading 2 for method names, Heading 3 (italic) for sub-heads
   - Verify Greek renders (α, β, μH, δ)
4. Skip sections 7 + 8 — those go on Peleg's comment threads (Action 4)
5. Read the 12-item verification checklist at the bottom of the paste-master and tick each box

**Time**: 90 min. If it goes to 120, that's normal for a first pass.

---

## Action 4 — Post 2 comments on Peleg's threads

**In the working copy** (or original — Peleg won't mind if it's the working copy since she can see it):

1. Find the "Find a name" comment thread (Peleg's tag "Find a name"). Reply with Section 7/9 from PASTE_MASTER (the naming table).
2. Find the "Ideas for graphical abstract?" comment thread. Reply with Section 8/9 (the three concept sketches).

Do NOT overwrite the title `PePFibPred` in the body. Do NOT change the graphical abstract section — just comment on the thread.

---

## Action 5 — Invite Alex to GitHub org

**URL**: <https://github.com/orgs/az-said/people>
**Action**: Click **Invite member** → username `axelgolubev` → role **Owner** → Send

Verify Alex accepts. He'll receive an email.

---

## Action 6 — Invite Alex to Sentry

**URL**: your Sentry org login (`desycssb` org)
**Action**: Settings → Members → **Invite Member** → email `aleksandr.golubev@cssb-hamburg.de` → role **Owner** → Send

Wait for Alex to accept before Action 7.

---

## Action 7 — Sentry migration (the big one)

**Follow `docs/active/paper_drafts/13_sentry_migration_runbook.md` end-to-end.** Seven steps:

1. Confirm Alex is Owner (from Action 6)
2. **Update alert-rule recipients**: for each existing rule, change "Send to Said Azaizah (user)" → "Send to Team: Owners"
3. **Silence your personal notification preferences**: Account → Notifications → Issue Alerts → change to "Only on issues I'm subscribed to"; Deploy → Off; Weekly Reports → **ON** (this is your low-noise founder-oversight signal); Quotas → ON; Spike Protection → ON; everything else → Off
4. **Add SEV1 escalation rule**: Alerts → Create Alert → Issues → condition `severity:sev1 AND has NOT been resolved for 30m` → action: send to you personally + Alex → save. Add a second rule with `2h` for off-hours.
5. **Slack integration** (if used): re-route the Slack channel to Alex's Slack
6. **Update `docs/active/SENTRY_RUNBOOK.md`** to reflect the new roles (already partially done — I added the Roles section this session; verify it reads right)
7. **Sanity test**: trigger a test 500 on the staging deployment. Confirm Alex receives the email. Confirm you do not. Wait 30 min; confirm you receive the SEV1 escalation.

**Time**: 30 min setup + 30-45 min waiting for the sanity test.

**After this runs**: you stop receiving routine Sentry pages permanently. Alex is primary. You're founder-oversight only.

---

## Action 8 — SKIPPED

Alex is the Hetzner account owner (billing + Cloud console admin). No SSH-key-add needed from you. Alex retains the account; you retain root SSH via your existing key.

If in the future you need to invite a third person to Hetzner:
```bash
# Log into <https://console.hetzner.cloud>
# Project → Members → Invite email with role Admin
```

---

## Action 9 — Email Peleg (four blockers + naming pick)

**To**: Peleg's email
**Subject**: `PePFibPred paper — 4 blockers before I can lock the draft`

```
Peleg,

I've drafted our sections in the working copy — Method A through Method M in MATERIAL AND METHODS, Server usage, Author Contributions, Data Availability, and 8 discussion bullets, plus a 5-paragraph "Ongoing development and roadmap" for the DISCUSSION section. You'll see them in the working copy.

Four things I need from you to close the draft:

1. Ragonis-Bachar & Rayan DOI — for the threshold citation in Method G. I have "[CITE: threshold citation — Ragonis-Bachar and Rayan]" as a placeholder throughout.

2. Staphylococcus aureus 2023 dataset publication reference — for Method M. Which paper introduced or first curated this set?

3. TANGO aggregation-by-stretches function name in your reference code — you mentioned on 2026-06-03 that we should "apply the same method we used to obtain the secondary structure prediction... using the part of my code that finds secondary structure by sending the tango aggregation score list with average score limitation = 0". Which function name in your repo do you want me to port from? Right now the code runs TANGO at fixed physicochemical conditions (pH 7, T 298 K, ionic strength 0.1 M, TFE 0) — I've documented that in Method C. If you want me to implement the stretch method instead, I need the function name.

4. Verbatim Help-page text for SSW + FF-SSW definitions — you wrote Helix + FF-Helix; I need the symmetric two so we can mirror them in the paper's Server-Output section.

Also — could you and Meytal pick the tool name? I posted a candidate table as a comment on the "Find a name" thread. My recommendation: keep PePFibPred as the paper title, or FibrilPredictor for max discoverability per your Drive comment 25.

Two smaller things:
- Signed charge vs |charge| (Q-FIX-022) — ok to ship with signed? I've written the paper as signed.
- OQ7 (Beta % threshold) — do you want me to close this before submission, or is it a next-cycle item?

Thanks — let me know when you get a chance.

Said
```

---

## Action 10 — Email Meytal

**To**: `meytal.landau@desy.de`
**Subject**: `PePFibPred paper — Acknowledgements + Funding + BioRender`

```
Meytal,

I've drafted the technical sections of the NAR paper — you can see the working copy Peleg shared. Two things only you can supply:

1. ACKNOWLEDGEMENTS — anyone at DESY-CSSB (or elsewhere) we should credit for support beyond authorship? You put a comment placeholder there.

2. FUNDING — the grant numbers we need to cite. You put a placeholder there too.

Third: for the graphical abstract, we'll almost certainly use BioRender. NAR requires an article-specific licence + explicit acknowledgment. Do you have a lab licence we can use, or should we get one dedicated to this article?

Thanks — no urgency; whenever you have a moment.

Said
```

---

## Action 11 — Add Alex to PyPI

Once Alex sends his PyPI username:

1. Log in to <https://pypi.org/manage/account/>
2. For `pvl-cli`: Collaborators → Add → username → role **Owner**
3. For `pvl-mcp`: same
4. Verify Alex sees both packages under his account

---

## Action 12 — Update `CITATION.cff`

Once Alex sends his ORCID:

```bash
# Open CITATION.cff
# Find the "authors:" block
# Add or update Alex's ORCID: "https://orcid.org/0000-0000-0000-0000"
# Also verify Peleg's ORCID (0000-0002-0979-8165) and Meytal's ORCID (0000-0002-1743-3430) are correct
```

If any are wrong, ask them directly for the correct value.

---

## Action 13 — Send Alex the onboarding email

Once he's accepted all invites:

**To**: Alex
**Subject**: `Your PePFibPred onboarding — start here`

```
Alex — welcome.

Your first read is `docs/active/ALEX_ONBOARDING.md` in the repo — a week-by-week guided path assuming zero prior GitHub knowledge. If you've never used GitHub, start with `docs/active/GITHUB_101_FOR_ALEX.md` (linked from Day 1).

Week 1 is ~6 hours across the week; you don't take over as Primary Responder until Week 2. During Week 1 you shadow-read; I'll still be on the pager. After the Sentry migration completes (I'm running that this week), you become primary alert recipient.

Ping me when you finish Week 1's end-of-week checkpoint (3 questions at the bottom of ALEX_ONBOARDING.md).

Said
```

---

## Action 14 — Cut `v1.0.0` tag

Prep:

```bash
cd /Users/saidazaizah/Desktop/DESY/peptide_prediction
git checkout main && git pull

# Bump versions
# CITATION.cff line 5: version: "0.3.0" → "1.0.0"
# ui/package.json line 4: "version": "0.3.0" → "1.0.0"
# pvl-cli/pyproject.toml version field → "1.0.0"
# mcp_server/pyproject.toml (if version present) → "1.0.0"

# Move CHANGELOG.md [Unreleased] items to [1.0.0] - 2026-XX-XX

# Verify LICENSE is MIT only
ls LICENSE*
# If LICENSE-DESY-RESEARCH.md or similar exists, move it to docs/archive/

# Local CI
make ci             # backend pytest + frontend vitest + Docker build
make smoke-tango    # TANGO binary reachable
make contract-check # backend↔UI schema alignment
make precompute-datasets   # rebuild gold_standard.json + peleg_118.json

# Commit + push
git add CITATION.cff ui/package.json pvl-cli/pyproject.toml CHANGELOG.md
git commit -m "chore(release): v1.0.0"
git push

# Tag
git tag -a v1.0.0 -m "PePFibPred v1.0.0 — first paper-cut release"
git push origin v1.0.0
```

This triggers `release.yml`, `docker-publish.yml`, `publish-pypi.yml`. Watch the Actions tab: <https://github.com/az-said/peptide_prediction/actions>

Wait for all to go green.

---

## Action 15 — Mint Zenodo DOI

**Zenodo does not auto-mint yet.** Manual step:

1. Log in to <https://zenodo.org/> with the account that owns the GitHub linkage
2. My deposits → find the v1.0.0 release (should appear within 5 min of push)
3. If it does not appear: Settings → GitHub → verify `az-said/peptide_prediction` shows the webhook enabled → toggle if necessary
4. Copy the DOI (looks like `10.5281/zenodo.XXXXXXX`)
5. Update `CITATION.cff` line 52-55: replace `zenodo.PENDING` with the real DOI
6. Commit + push
7. Update the Data Availability paragraph in the WORKING COPY with the real DOI (Action 16)

---

## Action 16 — Update Data Availability paragraph in working copy

Find `10.5281/zenodo.[PENDING]` in the working copy DATA AVAILABILITY section. Replace with the real DOI from Action 15.

---

## Action 17 — bio.tools submission

Follow `docs/active/A4_BIO_TOOLS_SUBMISSION.md` end-to-end. Submission form is at <https://bio.tools/>. Approximately 30 min.

---

## Action 18 — Push approved content to the ORIGINAL Google Doc

Once Peleg + Meytal have reviewed the working copy and given a thumbs up:

1. Open the ORIGINAL doc: <https://docs.google.com/document/d/1fDSC3k-9xrWiThHbnB8xMG0wS5yINZjRL-_oBg54ZFY/edit>
2. Open the working copy side by side
3. Copy each of your sections from the working copy → paste into the same section of the original
4. Preserve Peleg's Introduction / Results / Case Studies / References
5. Save

Peleg + Meytal now see the final content in the original doc (the same URL they've been using for months).

---

## Action 19 — First monthly report (delegated)

Send Alex a calendar invite: **PePFibPred monthly report** — recurring, first Monday of every month, drafter Alex. First occurrence: **2026-08-04** covering July 2026.

Template: `docs/active/MONTHLY_REPORT_TEMPLATE.md`.

Once Alex sends the first one, verify it's green and reply "thanks, no action needed". This is your founder-oversight loop.

---

## Action 20 — DESY VM (blocked)

**Currently blocked** on DESY IT completing the VM setup. When they unblock:

1. SSH the 3-hop Kerberos chain (from `memory/reference_ssh_access.md`)
2. Run `curl -fsSL https://raw.githubusercontent.com/az-said/peptide_prediction/main/scripts/desy_vm_bootstrap.sh | bash`
3. Add Alex's SSH key to `/root/.ssh/authorized_keys`
4. Update `docs/active/DEPLOYMENT.md` with the DESY hostname
5. Point Alex at the DESY runbook if any adjustments needed

---

## What I have NOT put on this list

Not on this list = I've already done it OR it's Alex's responsibility OR it's a future-cycle item.

**Already done this session (in the repo, uncommitted)**:
- ✅ All 20+ M&M fact corrections
- ✅ Peleg-style terminology guide
- ✅ Correctness deltas log
- ✅ 5-paragraph Future Work content
- ✅ 10-area big-co handover playbook + all 15 artefact files (SECURITY, OWNERSHIP_MATRIX, ONCALL, SLO, INCIDENT_SEVERITY, RUNBOOKS/, postmortems/, RFC_TEMPLATE, API_STABILITY, DATA_GOVERNANCE, MONTHLY_REPORT_TEMPLATE, CODEOWNERS, reports/)
- ✅ Alex onboarding suite (ALEX_ONBOARDING, GITHUB_101_FOR_ALEX, OPERATOR_COOKBOOK, DOCS_MAP_FOR_ALEX)
- ✅ Google Doc index in your Drive
- ✅ Callouts to Alex onboarding from HANDOFF, OWNERSHIP_MATRIX, README, CONTRIBUTING, paper_drafts/README
- ✅ Sentry migration runbook (13_sentry_migration_runbook.md)

**Alex's job (not yours)**:
- Reads ALEX_ONBOARDING.md
- Runs Week 1 checkpoint
- Responds to Sentry alerts
- Drafts monthly reports
- Merges Dependabot patch PRs on green CI
- Files postmortems for SEV1/SEV2

**Future-cycle (post-submission)**:
- CV essay / storytelling (saved in memory as `project_cv_storytelling_future.md`)
- ADR-028 through ADR-033 doc debt
- Diátaxis-tag column in handbook README
- Upptime status page workflow

---

## The one-sentence version

**You have ≈ 8 hours of your active time across the next 4 weeks. Actions 1–7 are the critical first 4 hours (commit, email Alex, paste to Google Doc, comment on Peleg's threads, invite Alex, Sentry migration). Everything else unblocks from those.**
