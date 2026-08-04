# Founder-exit kit — CV, archive, journal, and signout playbook

**Owner**: Said Azaizah
**Purpose**: Everything you carry forward from 11 months of PePFibPred — links to share, artifacts to archive, a top-tier signout playbook, and paste-ready Cowork prompts to execute it. Structured so you can act on any section independently, in any order.
**Time to execute all of it**: 4-6 h your time, distributed over 1-2 weeks. Nothing time-critical.

---

## 0. Quick map

| Section | What you get |
|---|---|
| 1. Public assets | Every URL/artifact that's already public and CV-linkable, plus what unlocks post-submission |
| 2. Private archive | What to save into a "PePFibPred Archive 2026-08" Drive folder for future reference |
| 3. Signout playbook | 10 things top-tier operators do at signout, ranked by ROI, with your recommended pick order |
| 4. Cowork prompts | 6 paste-ready prompts to execute the playbook |
| 5. Alex — casual Claude Code onboarding | A short paragraph to add to his email + a copy-paste 3-step setup |
| 6. 11-month journal seed | Structure + reflection prompts to seed your personal journal |
| 7. Suggested CV bullets + LinkedIn copy | Draft language you can lift or adapt |
| 8. Execution timeline | The order I'd recommend if you want to do all of it |

---

## 1. Public assets — link these on CV / LinkedIn / portfolio

### 1.1 Live right now (link today)

| Asset | URL | Use it for |
|---|---|---|
| Source repo | https://github.com/az-said/peptide_prediction | CV, LinkedIn "Featured", portfolio, GitHub profile pinned |
| Live production app | http://94.130.178.182:3000 | Portfolio "see it in action" link (upgrade to `pepfibpred.desy.de` once DNS lands) |
| Milestones timeline | https://github.com/az-said/peptide_prediction/blob/main/pvl_milestones.md | LinkedIn post source, self-drafted case-study inputs |
| README | https://github.com/az-said/peptide_prediction#readme | The one-glance pitch — keep it clean |
| Handoff playbook | https://github.com/az-said/peptide_prediction/blob/main/docs/active/HANDOFF_TECH_PLAYBOOK.md | Portfolio proof-of-rigor — a rare artifact for a research tool |
| Ownership matrix | https://github.com/az-said/peptide_prediction/blob/main/docs/active/OWNERSHIP_MATRIX.md | Portfolio proof — showing you built for handoff, not for solo-owning |
| Operator cookbook | https://github.com/az-said/peptide_prediction/blob/main/docs/active/OPERATOR_COOKBOOK.md | Portfolio proof — 21 real runbooks |
| Deployment doc | https://github.com/az-said/peptide_prediction/blob/main/docs/active/DEPLOYMENT.md | Portfolio proof — production reality |
| GitHub org | https://github.com/az-said | The org you own; keep clean, pin the repo |
| SECURITY.md | https://github.com/az-said/peptide_prediction/blob/main/SECURITY.md | Optional — signals disclosure-policy maturity |
| Personal handle | @az-said | GitHub |

### 1.2 Unlocks post-paper-submission (queue for LinkedIn post + CV update)

| Asset | Where it'll live | Trigger |
|---|---|---|
| Zenodo DOI + badge | https://zenodo.org (auto-mints on `v1.0.0` tag) | You cut `v1.0.0` after Alex sends ORCID |
| bio.tools entry | https://bio.tools/pepfibpred | Submit via `docs/active/A4_BIO_TOOLS_SUBMISSION.md` (draft yet to be written; use the ELIXIR bio.tools onboarding wizard as reference) |
| PyPI: pvl-cli | https://pypi.org/project/pvl-cli/ | Auto-publishes on `v1.0.0` via `publish-pypi.yml` |
| PyPI: pvl-mcp | https://pypi.org/project/pvl-mcp/ | Same |
| bioRxiv preprint | https://biorxiv.org/... | Meytal submits |
| NAR paper (once accepted) | Journal DOI | Editorial acceptance |
| JOSS paper (optional) | https://joss.theoj.org/... | Submit after NAR acceptance |

### 1.3 Media to create (Cowork prompts 2, 4 will do these)

- **6-shot screenshot set** of the live app: landing, Quick Analyze, Results dashboard, PeptideDetail, batch upload, UniProt search
- **Architecture diagram** — you already have the mermaid diagram inside `HANDOFF_TECH_PLAYBOOK.md` Ch. 2; export as PNG for LinkedIn/CV
- **Graphical abstract** — Meytal owns via BioRender; use for LinkedIn post once ready
- **Demo Loom / YouTube walkthrough** — 3-4 min unlisted video showing single-sequence + batch prediction (optional but very high LinkedIn engagement)

---

## 2. Private archive — save to "PePFibPred Archive 2026-08" Drive folder

Purpose: everything you might want to reference in 3 years without needing to touch the repo.

### 2.1 From this repo (Cowork prompt 3 will copy)

- `docs/active/**/*.md` — all 84 active docs
- `docs/archive/**/*.md` — historical for the why-trail
- `docs/internal/*.md` — process docs (won't be public forever, snapshot now)
- `pvl_milestones.md` — the honest dev history
- `CLAUDE.md` — the ground rules you designed
- `README.md`, `SECURITY.md`, `CITATION.cff`
- Full `git log` as a text export (`git log --all --stat > pvl_full_git_log.txt`)
- List of every merged PR and its date

### 2.2 From Google Drive

- The 20-page working-copy paper Doc (make a view-only copy tagged `PePFibPred paper — snapshot 2026-08`)
- All Peleg's Drive comment threads (export via File → Print → Save as PDF, or use Cowork prompt 3)
- Meytal's threads, similarly
- Any meeting-notes docs from Peleg / Meytal
- Any Drive attachments from the team (Round-2 slides, Likoyim doc, review notes)

### 2.3 From your local machine

- Any screenshots you took during development
- Draft LinkedIn posts / journal snippets from `~/Documents` or `~/Desktop`
- The `CLAUDE_CODE_FINAL_CHECKLIST.md` file at repo root (Cowork's V11 dispatch)
- `PePFibPred_Materials_For_Peleg.docx` at repo root (paper materials, local-only)
- Session logs from `docs/active/SESSION_LOG.md`
- Cowork dispatch history if you have it

### 2.4 From external services (screenshot / export)

- Sentry issue history for the whole lifetime (export before you leave the org)
- Hetzner Cloud usage graphs (screenshot)
- GitHub Insights → Community → Traffic (screenshot; auto-deletes after 14 days on GitHub anyway)
- GitHub Insights → Contributors graph (screenshot)
- Cloudflare Analytics if you set it up

---

## 3. Signout playbook — 10 top-tier moves, ranked by ROI

Ranked for **your** situation (11-month research build, going into next role/project, wants CV + LinkedIn signal + preserved relationships + a real journal). Do the top 5 minimum; the rest are optional.

### 3.1 Do (high ROI, low effort)

1. **LinkedIn signout post + carousel** — high signal, quick to make. 300-word post + 5-slide carousel image. Use `pvl_milestones.md` as source. **(Cowork prompt 4)**
2. **11-month personal journal** — most personal ROI. 12-section outline, one per month, prompted reflections. **(Section 6 has the seed)**
3. **Zenodo DOI mint on `v1.0.0`** — permanent portfolio anchor. Auto-mints on tag. **(Blocked on Alex ORCID)**
4. **ORCID profile setup** — if you don't have one yet, create it now (`orcid.org/register`). Author on the paper needs it. Adds "Dr.-level receipts" to your CV.
5. **LinkedIn recommendation exchange** — trade recommendations with Peleg, Meytal, Alex. Highest-signal social proof you can get. Draft one for each of them first (people reciprocate what they receive).

### 3.2 Do if you want a stronger public brand (higher effort, high payoff)

6. **Case-study blog post** — "Building PePFibPred: an 11-month sprint on a peptide fibril-prediction web server". 1,500 words. Publish on Medium, dev.to, or your own site. **(Cowork prompt 5)**
7. **Portfolio piece on Life in Motion** — a dedicated page with hero + stack + metrics + screenshots + DOI badge + team quotes. **(Cowork prompt 6 seeds this)**
8. **Google Scholar profile** — set one up (or update). Add the NAR paper once accepted. Pairs with ORCID.

### 3.3 Optional (lower ROI or later timing)

9. **Speaker deck / talk-material** — pull out the tech-and-lessons for a 15-min conference/meetup talk. Publish on SpeakerDeck or GitHub. Do when you actually get invited to speak.
10. **Archive announcement post** — once `v1.0.0` and paper are published, post a "we shipped, tool is live, DOI here, thanks to the team" note. Low ROI unless you're a public builder; skip if not your style.

---

## 4. Cowork prompts (paste-ready)

Six prompts, each self-contained. Feed to a browser-capable agent (Claude Desktop with Chrome tools, or Cursor Composer with browser tools) — plain Cowork can do the file-level ones but not the browser-driven ones (screenshots, LinkedIn).

### Prompt 1 — Audit local files worth archiving

```
Audit my local machine for PePFibPred-related files worth adding to a private archive. Search these paths:

  ~/Desktop
  ~/Documents
  ~/Downloads
  /Users/saidazaizah/Desktop/DESY/peptide_prediction (skip .git/, node_modules/, ui/node_modules/, __pycache__/, venv/, .venv/)

Types to catch:
  - .png / .jpg / .heic / .webp (any screenshots or images of the app)
  - .pptx / .key / .pdf (any slide decks or presentations)
  - .docx / .odt (any drafts about the project)
  - .md / .txt (any personal notes)
  - .mp4 / .mov (any screen-recording of the app)

For each hit, write a row to /tmp/pvl_archive_manifest.md with:
  - Path
  - Size
  - Last-modified date
  - One-sentence guess at what it is (opened + skimmed briefly)
  - Recommended action: KEEP / ARCHIVE-ONLY / DELETE

Skip anything that looks unrelated to PePFibPred (screenshots of unrelated apps, personal photos, etc.). Report the total count found and the manifest file path.
```

### Prompt 2 — Take screenshots of the live prod app (browser)

```
Take publication-quality screenshots of the live PePFibPred app at http://94.130.178.182:3000 for use in CV, LinkedIn posts, and portfolio pages.

Set browser viewport to 1440x900 before each capture.

Capture the following 8 shots, saving to ~/Desktop/pvl_screenshots/ as .png named exactly as below:

  01_landing.png            - Landing page, hero section visible
  02_quick_analyze.png      - Quick Analyze panel with an example sequence pasted (use ACDEFGHIKLMNPQRSTVWY or similar known peptide)
  03_results_dashboard.png  - Results dashboard after a single-sequence run, all charts visible
  04_peptide_detail.png     - PeptideDetail deep-dive view for one peptide, all cards expanded
  05_batch_upload.png       - Batch upload panel with the example CSV visible
  06_uniprot_search.png     - UniProt search panel, showing "insulin" or similar search
  07_about_page.png         - About page with team credits visible
  08_status_page.png        - The Upptime status page (if wired up), else the /api/health endpoint response formatted in browser

For each shot: full-page screenshot (not just visible area), no browser chrome. If any page 404s or errors, skip it and note in the report. Report: which shots succeeded, sizes, and any pages that were missing or broken.

DO NOT trigger any destructive actions (no submit-and-navigate-away chains). DO NOT log in as any user; use the app as an anonymous visitor.
```

### Prompt 3 — Consolidate Drive archive folder

```
Create a Google Drive folder called "PePFibPred Archive 2026-08" at the root of my Drive.

Inside it, create these sub-folders:
  01_paper_and_supplementary
  02_peleg_review_threads
  03_meytal_notes
  04_meeting_docs
  05_screenshots
  06_repo_snapshot_docs
  07_external_correspondence

Then:
  1. Search my Drive for any Doc, Sheet, or Slide with "PePFibPred", "PVL", "peptide", "fibril", "TANGO", "S4PRED", "aggregation prediction", or "Peleg Ragonis" in the title or content. For each match, make a VIEW-ONLY COPY (not a shared link — a fresh copy owned by me) into the appropriate sub-folder above. Name each copy with the pattern: [ORIG-DATE-YYYY-MM-DD] [ORIG-TITLE] (archive).
  2. For the working-copy paper Doc, also export a PDF into 01_paper_and_supplementary/.
  3. Export all Peleg's comment threads from the working-copy Doc to 02_peleg_review_threads/ (File > Print > Save as PDF works).
  4. Do not delete or modify any original files - copy only.

At the end, report:
  - Folder count and total file count in the archive
  - The full folder URL (drive.google.com/drive/folders/...)
  - Any files that seemed relevant but you skipped, with the reason
```

### Prompt 4 — LinkedIn signout post + carousel

```
Draft a LinkedIn signout post announcing my transition from Primary Builder to founder-oversight on PePFibPred. Aleksandr Golubev is taking over as Primary Responder; the tool ships to Nucleic Acids Research Web Server Issue.

Source material:
  - /Users/saidazaizah/Desktop/DESY/peptide_prediction/pvl_milestones.md
  - /Users/saidazaizah/Desktop/DESY/peptide_prediction/docs/active/FOR_NEXT_BUILDER.md
  - /Users/saidazaizah/Desktop/DESY/peptide_prediction/docs/active/HANDOFF_TECH_PLAYBOOK.md

Deliverable:
  1. A single LinkedIn post, 250-320 words, written as Said (first person). Warm but professional. Names Peleg Ragonis-Bachar and Meytal Landau in the acknowledgements paragraph, and Alex as the successor. Does NOT mention any AI/assistant tool by name (this is a hard rule). Ends with a soft "reach out for future collaborations" note.
  2. A 5-slide carousel outline (text only, no image generation):
       Slide 1: Title + one-line pitch
       Slide 2: The problem (why PePFibPred exists)
       Slide 3: The stack (React + FastAPI + TANGO + S4PRED + FF-Helix + SSW axiom)
       Slide 4: What we built (bullets: repo, live app, Zenodo DOI, paper submitted)
       Slide 5: Team + what's next (Alex + Peleg + Meytal + roadmap teaser)
     For each slide provide: headline text, body bullets, image concept (what the visual should show).
  3. 6-10 hashtags at the end of the post.
  4. Tag suggestions: DESY, Technion, MIT (if applicable), Peleg Ragonis-Bachar (her LinkedIn), Meytal Landau (her LinkedIn), Alex Golubev.

Do NOT publish — I'll review and post myself. Write output to /tmp/pvl_linkedin_signout.md.
```

### Prompt 5 — Case study blog post outline

```
Draft a 1500-word blog post outline titled "Building PePFibPred: an 11-month sprint on a peptide fibril-prediction web server" written by Said (first person).

Source material:
  - pvl_milestones.md
  - docs/active/HANDOFF_TECH_PLAYBOOK.md
  - docs/active/DECISIONS.md (if it exists)
  - docs/active/FOR_NEXT_BUILDER.md
  - git log --oneline main

Structure:
  1. Hook (150 words) - the peptide-aggregation problem, why nobody had built a combined-visualisation server
  2. The stack decision (200 words) - React + FastAPI + Docker on Hetzner; why not K8s from day one
  3. The four scientific engines (300 words) - TANGO / S4PRED / FF-Helix / SSW axiom; who owned each; why the axiom is OR-union not AND-intersection
  4. Wave-by-wave shipping (350 words) - the 11 months summarised, milestones from pvl_milestones.md
  5. Three hardest calls (250 words) - one per: architecture, science, team. Concrete, honest.
  6. The handoff (200 words) - why we built for handoff on day one, what the Owner-without-a-pager pattern looks like in practice
  7. What's next + credits (50 words)

For each section: 3-5 sub-bullets I can expand. Include 3 pull-quote suggestions I could highlight. Include 2 hero-image concepts (what the featured image should be).

Do NOT write the full 1500 words - I'll draft it myself. This is an outline + prompt. Write output to /tmp/pvl_case_study_outline.md.
```

### Prompt 6 — Compile `cv-links.md`

```
Walk my repo + my Drive + the live web to produce a compact "cv-links.md" file listing every public URL worth linking on my CV, LinkedIn, or portfolio for PePFibPred.

Sections to build:
  1. PROJECT LINKS (5-8 rows: repo, live app, Zenodo, bio.tools placeholder, PyPI x2, docs entry, status page)
  2. DOCUMENT LINKS (rows for any publicly-shareable doc — README, HANDOFF_TECH_PLAYBOOK, OPERATOR_COOKBOOK, FOR_NEXT_BUILDER, DEPLOYMENT, OWNERSHIP_MATRIX, pvl_milestones)
  3. PEOPLE LINKS (5 rows: Peleg's Google Scholar / ORCID / Technion page / Landau lab page / Alex Golubev's DESY page)
  4. ORGANISATION LINKS (Landau lab, DESY-CSSB, Technion CS/BME faculty, NAR Web Server Issue landing page)
  5. FUTURE-ANCHORS (empty rows with placeholder text for: Zenodo DOI when minted, NAR paper DOI when accepted, JOSS paper if pursued, bioRxiv preprint)

For each row: [Label] | [URL] | [1-sentence why-this-matters].

For any URL you cannot find with confidence, write "TODO" in the URL column and note where I should look.

Output to /Users/saidazaizah/Desktop/DESY/peptide_prediction/docs/active/CV_LINKS.md (this file is CV-facing so it can live in docs/active/ - do NOT overwrite anything else there).
```

---

## 5. Alex — casual Claude Code onboarding (short paragraph for his email + copy-paste snippet)

Add this paragraph anywhere in Alex's email (I'd put it right after the "Really glad we built this together" line, or as an optional PS):

> **PS — optional but recommended:** if you want a coding agent to help you navigate the repo (Claude Code is what I used throughout — free tier is enough for exploration), it takes 3 minutes to wire up:
>
> ```
> npm install -g @anthropic-ai/claude-code
> cd /path/to/peptide_prediction    # after you git clone
> claude                             # follow the login prompt (use your DESY-CSSB email if you have Anthropic org access, otherwise personal Google/GitHub is fine for the free tier)
> ```
>
> Then type: *"Read docs/active/FOR_NEXT_BUILDER.md and docs/active/HANDOFF_TECH_PLAYBOOK.md Chapters 0 and 7, then confirm you understand the guardrails."* It'll load the whole context in one go and follow the rules I wrote for coding agents (no touching `api_models.py`, no axiom edits, no bypassing pre-commit, etc.). Same setup works for Matheus.

Two things to note:
- If DESY has an Anthropic institutional agreement, Alex can log in with that; if not, personal free tier works
- The rule "never attribute commits as AI" is enforced by `CLAUDE.md` at the repo root; the agent auto-reads it

---

## 6. Journal seed — structure for your 11-month personal journal

Structure the journal by month (Sep 2025 → Aug 2026), one page per month. For each month, use these reflection prompts:

**Standard prompts (use for every month)**:
1. What was I building this month?
2. What was the single hardest decision?
3. What did I get right that I didn't expect to?
4. What did I get wrong that I could see clearly at the time but ignored?
5. Who did I collaborate with, and how did our working style evolve?
6. What did I learn about the domain (peptide science, web architecture, team ops)?
7. What was I feeling about the project? (energy, doubt, momentum, boredom, urgency)
8. If I could send myself one message from now, what would it be?

**Source material to pull from** (Cowork can compile a per-month digest):
- `git log --author="Said" --since="YYYY-MM-01" --until="YYYY-MM-31" --oneline` for each month
- `docs/active/SESSION_LOG.md` if you kept one
- `docs/archive/` — dated one-shot artifacts
- `pvl_milestones.md` — the authored dev history
- Any Slack/Discord/email history you have
- The three Peleg follow-up packets (2026-05-21)
- The wave logs (Wave A / B / 2 / 2.5 / 2.8 / 2.9)

**Chapter idea** (once monthly reflections are drafted): pull out 5-7 cross-cutting themes for a closing chapter — "What 11 months of PePFibPred taught me about building tools for scientists" or similar.

If you want, I can spawn a Cowork prompt (Prompt 7 in a follow-up) that generates the per-month source-material digest for you to reflect against.

---

## 7. Suggested CV bullets + LinkedIn Experience copy

### 7.1 CV bullets (Experience → PePFibPred / Landau Lab)

Pick 3-5, or adapt to your voice:

- Led end-to-end design, build, and deployment of PePFibPred, an open-source peptide-fibril-formation prediction web server; adopted for a Nucleic Acids Research submission by the Landau lab (DESY-CSSB / Technion).
- Architected a full-stack scientific tool combining three biophysical predictors (TANGO β-aggregation, S4PRED secondary structure, custom FF-Helix Chou-Fasman classifier) with a React + TypeScript visualisation layer; single-sequence and batch pipelines guaranteed identical outputs by design.
- Delivered production infrastructure end-to-end: Dockerised backend + frontend behind Caddy on Hetzner Cloud with GitHub-Actions-driven CI/CD (lint, typecheck, tests, secret scan, container build, auto-deploy).
- Instituted engineering discipline unusual for a research tool: 600+ automated tests, formal API contract (Pydantic v2), ADR log, CODEOWNERS-routed reviews, Sentry error tracking with tiered severity SLAs, Dependabot triage, Upptime status page.
- Handed off to a Primary Responder with a 90-page operator playbook (onboarding, cookbook, tech reference, ownership matrix, monthly-report cadence), enabling the maintainer to run day-to-day operations without founder involvement.

### 7.2 LinkedIn "Experience" — job description block (~120 words)

> **Full-stack developer + technical lead — PePFibPred (Landau Lab, DESY-CSSB / Technion)** · Sep 2025 - Aug 2026
>
> Designed and built PePFibPred, an open-source peptide fibril-formation prediction web server combining three biophysical algorithms (β-aggregation, secondary structure, fibril-forming helix classifier) with an interactive visualisation frontend. Shipped end-to-end: React + TypeScript UI, FastAPI backend, Dockerised deployment on Hetzner with GitHub-Actions CI/CD, Sentry monitoring, Dependabot triage, and a full ADR-based governance log. Transitioned to founder-oversight in August 2026 after writing a 90-page operator handbook that lets the successor run day-to-day operations independently. Tool is being submitted to *Nucleic Acids Research* Web Server Issue 2026.
>
> Repo: github.com/az-said/peptide_prediction · Live: pepfibpred.desy.de · DOI: (mints on v1.0.0)

Swap DOI + live URL to real values once they land.

---

## 8. Execution timeline — the order I'd recommend

If you want to do the whole kit, this is the sequence with the least friction:

| Day | What | Time | Prompt / section |
|---|---|---|---|
| Today | Send the 3 warm emails from CLOSE_OUT_ONE_FILE.md | 25 min | (existing plan) |
| Today | Turn off your repo Watch + Dependabot subscription | 30 sec | (existing plan) |
| Today | Add the Alex Claude Code paragraph to his email before sending | 30 sec | Section 5 |
| +1-2 days | Run Cowork Prompt 1 (local audit) | 15 min your time | § 4 Prompt 1 |
| +1-2 days | Run Cowork Prompt 2 (screenshots) | 5 min your time | § 4 Prompt 2 |
| +1-2 days | Run Cowork Prompt 3 (Drive archive folder) | 20 min your time | § 4 Prompt 3 |
| +3-5 days | Run Cowork Prompt 6 (cv-links.md) | 10 min your time | § 4 Prompt 6 |
| +3-5 days | Run Cowork Prompt 4 (LinkedIn post + carousel) | 30 min to review + polish | § 4 Prompt 4 |
| +7 days | Publish the LinkedIn signout post | 5 min | — |
| +7 days | Ask Peleg, Meytal, Alex for LinkedIn recommendations (write theirs first) | 30 min | Playbook § 5 |
| +7-14 days | Run Cowork Prompt 5 (blog outline), draft 1500-word case study | 4-6 h your writing time | § 4 Prompt 5 |
| Ongoing | Start the 11-month journal, one month per sitting | 30 min per month | § 6 |
| When Alex sends ORCID | Cut `v1.0.0` tag → Zenodo mints DOI → add badge to README + CV | 20 min | § 1.2 |
| After NAR acceptance | Update LinkedIn + CV with paper DOI, cite in bioRxiv | 10 min | § 1.2 |
| After NAR acceptance | Consider a follow-up "we shipped" LinkedIn post | 30 min | Playbook § 3.3 |

---

## 8b. What Cowork already delivered (as of your paste 2026-08-04)

Cowork ran Prompts 3, 4, 5, 6 in a subsequent session and delivered:

| Deliverable | Location | Notes |
|---|---|---|
| **CV_LINKS.md** | `docs/active/CV_LINKS.md` | 50+ rows across Project / Documents / People / Organisations / Future-anchors. Test-count fact-checked + corrected to ≈608 backend + ≈613 frontend (was 887). |
| **Drive Archive** | Drive folder "PePFibPred Archive 2026-08" with 5 sub-folders, 12 files | Sub-folder `02_peleg_review_threads/` is empty — you export the comment PDFs manually (File → Print → Save as PDF). |
| **LinkedIn signout post** | `docs/active/LINKEDIN_SIGNOUT_POST.md` | 280 words + 5-slide carousel outline + 12 hashtags + tag suggestions. Review + polish before posting; the `pepfibpred.desy.de` URL is aspirational — swap to `http://94.130.178.182:3000` if DNS hasn't landed by post time. |
| **Case-study blog outline** | `docs/active/CASE_STUDY_OUTLINE.md` | 7 sections, 3 pull-quote candidates, 2 hero-image concepts. Ready for you to expand to 1,500 words. |
| **Video demo research** | `docs/active/VIDEO_DEMO_OPTIONS.md` | Remotion recommended (fits your React skills). Static carousel is enough for the initial LinkedIn post; Remotion is for a standalone demo video later. |

**Stale item from Cowork's manual-action list — ignore**: "Claude Code — paste CLAUDE_CODE_FINAL_CHECKLIST.md → runs CI, commits V11 files, opens PR, tags v1.0.0". Wave 2.8/2.9 is fully merged into `main`; there's nothing to PR. The checklist file has been moved to `docs/archive/2026-08/CLAUDE_CODE_FINAL_CHECKLIST_stale_wave2_8.md` to avoid confusion.

**Correction to Cowork's manual-action list**: "Invite Alex — GitHub org Owner + repo Admin" is stale under the 2026-08-04 ownership pivot. Correct invite is **repo Admin ONLY** (do not invite him at org level). See `OWNERSHIP_MATRIX.md` change-log.

## 9. What I did for you already (this session)

- Locked ownership pivot (Said keeps org, Alex repo-Admin, Sentry transfers)
- Wrote `FOR_NEXT_BUILDER.md` (cold-landing one-pager)
- Wrote `HANDOFF_TECH_PLAYBOOK.md` (comprehensive tech ref + coding-agent contract)
- Updated `OWNERSHIP_MATRIX.md` for the pivot
- Rewrote 3 warm emails in `CLOSE_OUT_ONE_FILE.md`
- Merged 13 safe Dependabot PRs (vuln count 41 → 20)
- Wrote this file (`CV_ARCHIVE_AND_SIGNOUT_KIT.md`)
- Added Alex Claude Code onboarding paragraph to his email template

## 10. What only you can do

- Post the 2 comments on Peleg's threads
- Invite Alex as repo Admin
- Send the 3 emails
- Verify Sentry cutover when Alex replies
- Turn off your repo Watch + Dependabot subscription
- Approve / run any of the 6 Cowork prompts here
- Write the personal journal
- Draft the LinkedIn post from the Cowork output
- Update your CV / LinkedIn / portfolio site

Everything else is either in the repo waiting for a maintainer, waiting on Alex, or waiting on Peleg / Meytal.
