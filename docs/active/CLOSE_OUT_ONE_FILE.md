# Close-out — final plan, executable step by step

**Owner**: Said Azaizah
**Last edited**: 2026-08-04 (post ownership pivot)
**Purpose**: The one file you follow to finish the handoff and move on. Everything already done is marked ✅ and can be skipped; everything left is numbered in order with success checks and the exact wording you send.
**When you're done**: I archive this file to `docs/archive/2026-08/CLOSE_OUT_DONE.md` and flip the memory to RESOLVED.

---

## Ownership decision (2026-08-04, locked)

You keep everything visible on your portfolio. Alex gets everything he needs to operate. No credibility trade.

| Surface | You | Alex | Why |
|---|---|---|---|
| **GitHub org `az-said`** | **Owner (permanent)** | — | Public org page is a portfolio signal. Stays yours. |
| **`peptide_prediction` repo** | Owner (via org) | **Admin** | Alex can merge PRs, manage secrets, invite outside collaborators, triage Dependabot. Cannot delete the repo or remove you. |
| **Sentry** | Leaves free org | **New free org, own DSN** | Sentry is invisible to CV. Alex owns it entirely; you get only `[SEV1]` mail-forwarded. |
| **PyPI `pvl-cli` / `pvl-mcp`** | **Owner (permanent)** | Maintainer | Both can publish; ownership stays with you. |
| **Hetzner VPS** | Root SSH + oversight | **Account Owner (billing)** | Already done 2026-07-12. |
| **Zenodo (via GitHub)** | Auto via linked repo | — | DOI mint webhook. |
| **DESY VM `landau-webapp-dev`** | Transitional SSH | **Owner (when IT unblocks)** | DESY-institutional; Alex's home turf. |
| **`CITATION.cff` / ADR log** | **Veto** | Review | Peleg approves off-repo for anything touching axioms. |

**GitLab prep**: DESY will likely mirror or migrate the repo to `gitlab.desy.de` at some point. When that happens, the transfer is a `git remote add gitlab …` + push + org handover in one afternoon. Documented in `docs/active/HANDOFF_TECH_PLAYBOOK.md` Ch. 4 so whoever's on-call at the time doesn't have to invent it.

---

## Done ✅ (in this session or before)

- ✅ **Paper sections shared** — you shared the full 20-page working doc with the team. No more pasting needed; you kept the long sections you wrote, they edit around them.
- ✅ **Cowork V11 landed** — test file, dead-code removal, README HANDOFF link, PR body doc all on `main`.
- ✅ **Master push** — 22 handover docs (`ALEX_ONBOARDING`, `DOCS_MAP_FOR_ALEX`, `OPERATOR_COOKBOOK`, `GITHUB_101_FOR_ALEX`, ownership matrix, monthly report template + example, security policy, CODEOWNERS, gitleaks + uptime workflows, etc.) all committed and pushed.
- ✅ **Dependabot triage** — 13 safe PRs merged this session; 7 risky ones deferred to Alex with per-PR triage comments; vulnerability count 41 → 27.
- ✅ **Hetzner ownership** transferred to Alex.
- ✅ **Ownership decision** — you keep the GitHub org, Alex gets repo-Admin.

---

## Still to do (in order — each ~2-15 min)

### 1. Post two comments on Peleg's threads (5 min, browser)

Peleg has two open threads in the Doc: "Find a name" and "Ideas for graphical abstract?". You wrote replies for both in `docs/active/paper_drafts/PASTE_MASTER_INTO_GOOGLE_DOC.md` (§ 7/9 and § 8/9). Copy each, paste into the corresponding thread's Reply box, post. Leave both threads open.

**Success**: both threads show your reply as the last comment, both still open.

---

### 2. Invite Alex as repo Admin (NOT org Owner) — 2 min

Open <https://github.com/az-said/peptide_prediction/settings/access> → **Add people** → search `axelgolubev` → pick DESY Hamburg profile → role **Admin** → send.

Do **not** invite him at the org level — keep the org clean under your name.

**Success**: the repo Access page shows Alex as *Pending invitation* with role Admin.

---

### 3. Send Alex the warm handoff email (5 min)

**To**: `aleksandr.golubev@cssb-hamburg.de`
**Subject**: `PePFibPred — handoff, welcome, and how to get set up`

```
Alex,

You're now Primary Responder for PePFibPred. Thank you for taking this on — genuinely. This project mattered to me and it means a lot to hand it to someone who cares about the science.

One structural note before the reading list. I'm keeping GitHub org ownership under my account (the org page is on my portfolio and I want it to stay stable there), but I've given you Admin on the peptide_prediction repo — that's full write, merge, secret management, and Dependabot triage. Practically identical to Owner for day-to-day operation. If DESY moves us to gitlab.desy.de down the line, we cut a clean transfer at that point; there's a chapter in the tech playbook (link below) describing exactly how.

Hetzner stays with you (already done 2026-07-12). The one thing I need you to set up: Sentry. My current free-tier org is capped at 1 user, so the cleanest path is you creating a fresh Sentry account under this email address, spinning up an org (call it "pepfibpred" or similar) with a Python project inside, and sending me:

  1. The project DSN (from Settings -> Projects -> [project] -> Client Keys)
  2. A Sentry auth token with scopes project:releases and org:read (Settings -> Account -> API -> Auth Tokens)

I'll swap those into GitHub Actions secrets, leave my old org, and Sentry is yours end-to-end. I only want [SEV1] mail forwarded to said.azaizah@cssb-hamburg.de - a single mailbox rule on your side is enough.

Everything you need to run the server is written down. Read in this order:

  1. docs/active/FOR_NEXT_BUILDER.md         - one-pager if you land cold
  2. docs/active/CLAUDE.md                   - project ground rules
  3. docs/active/ALEX_ONBOARDING.md          - Week 1-3 plan I wrote for you specifically
  4. docs/active/HANDOFF_TECH_PLAYBOOK.md    - deep tech reference (also written to be readable by a coding agent if you use Cursor/Claude Code/similar)
  5. docs/active/OPERATOR_COOKBOOK.md        - 21 how-to recipes (SSH, deploy rollback, Dependabot merge, etc.)
  6. docs/active/DOCS_MAP_FOR_ALEX.md        - full file tree if you want to explore

If you want to delegate day-to-day debugging to Matheus or someone else on the team, the docs are structured so anyone can walk in cold - point them at FOR_NEXT_BUILDER.md and HANDOFF_TECH_PLAYBOOK.md. There's an "AI-agent-consumable" section in the tech playbook so if they run a coding agent, it has enough guardrails to not break anything scientific.

Two small things I need from you when you have a moment:
  - Your PyPI username - so I can add you as Maintainer on pvl-cli and pvl-mcp (you get publish rights; ownership stays with me for the portfolio record)
  - Your ORCID URL - so I can add you to CITATION.cff before we cut v1.0.0 and mint the Zenodo DOI

Your first real work: 27 open Dependabot alerts. I merged the 13 safe ones this session and deferred 7 risky bumps (majors + one backend test failure) to you with triage comments pointing to OPERATOR_COOKBOOK.md ("Merge a Dependabot PR safely"). Target: 2 critical + 12 high closed within 2 weeks. Fine to hand this to Matheus if you want.

I'll stop being the default page - turning off my repo watch and unsubscribing from Dependabot right after I send this. From here on only SEV1 escalations reach me.

Really glad we built this together, and if you ever want a second read on anything, ping me at the DESY address. Same for future collaborations or references.

Said
Said Azaizah - DESY-CSSB / Technion
said.azaizah@cssb-hamburg.de

PS - optional but recommended: if you want a coding agent to help you navigate the repo (Claude Code is what I used throughout - free tier is plenty for exploration), it takes about 3 minutes to wire up:

  npm install -g @anthropic-ai/claude-code
  cd /path/to/peptide_prediction    # after you git clone
  claude                            # follow the login prompt; use your DESY-CSSB email if you have Anthropic org access, otherwise personal Google/GitHub works for the free tier

Then type: "Read docs/active/FOR_NEXT_BUILDER.md and docs/active/HANDOFF_TECH_PLAYBOOK.md Chapters 0 and 7, then confirm you understand the guardrails." It loads the whole context in one go and follows the rules I wrote for coding agents (no touching api_models.py, no axiom edits, no bypassing pre-commit). Same setup works for Matheus.
```

**Success**: sent from your DESY address. You then go to <https://github.com/az-said/peptide_prediction> → top-right *Unwatch* → **Ignore**, and to <https://github.com/az-said/peptide_prediction/settings/notifications> → uncheck *Dependabot alerts*. Your inbox goes quiet.

---

### 4. Send Peleg the warm close-out email (10 min)

**To**: Peleg Ragonis-Bachar
**Subject**: `PePFibPred paper — closing the loop + four things I need`

```
Peleg,

I drafted everything I could without you - Method A through M in Materials and Methods, the Server Usage section, Author Contributions, Data Availability, eight Discussion bullets, and a five-paragraph Ongoing Development and Roadmap section. It's all in the working copy of the Doc, posted under your existing headings so nothing you or Meytal wrote gets touched.

Working with you on this has been the best part of building it. The algorithms are yours - TANGO's stretch-average method, the FF-Helix Chou-Fasman propensity, the SSW-union axiom, the mu-H + hydrophobicity gates - and I tried to make the paper read that way. I've been listing you as first author (Meytal senior) per Author Contributions and will keep it there unless you and Meytal want a different order.

Four things I still need from you before I can send it to Meytal for a final read:

  1. The Ragonis-Bachar and Rayan threshold citation DOI (Method G references it three times as [CITE])
  2. The Staphylococcus aureus 2023 dataset publication reference (Method M validation table)
  3. TANGO aggregation-by-stretches - on 2026-06-03 you mentioned porting the stretch-scan function from your reference code with average score limit = 0. Which function name in your repo should I port? Right now the code runs TANGO at fixed conditions (pH 7, T 298 K, ionic strength 0.1 M, TFE 0); I documented that faithfully. If you want the stretch method instead, I'll implement it as soon as you point me to the function.
  4. Verbatim Help-page text for SSW and FF-SSW definitions - you already wrote Helix and FF-Helix; I want to mirror them so the paper's Server Output section stays symmetric.

Two smaller things:
  - Signed charge vs absolute charge (Q-FIX-022): ok to ship signed? Happy to switch to absolute if you prefer.
  - OQ7 (beta-% threshold definition): close before submission, or defer to a next-cycle patch? Fine either way.

On team going forward: Aleksandr Golubev is now Primary Responder for the ops side (Sentry alerts, dependency updates, deployment). I stay in the loop as founder-oversight - I'll see the monthly report, and I'm still on any scientific ADR you want me to look at - but for day-to-day server questions it's fastest to ping Alex directly at aleksandr.golubev@cssb-hamburg.de. Everything he needs to answer you is in the repo under docs/active/; entry point is docs/active/ALEX_ONBOARDING.md.

Take your time on the four items - nothing is urgent. And thank you again for trusting me with this. I hope we build the next one together; feel free to reach out any time - for the paper, for references, or if a future project comes up.

Said
said.azaizah@cssb-hamburg.de
```

**Success**: sent from your DESY address, ideally cc'ing Meytal.

---

### 5. Send Meytal the warm close-out email (10 min)

**To**: Meytal Landau
**Subject**: `PePFibPred paper — Acknowledgements, Funding, BioRender + handoff`

```
Meytal,

The technical sections of the NAR draft are in the working copy - Peleg has the link. I drafted six of them (Materials and Methods, Server Usage, Author Contributions, Data Availability, Discussion bullets, and a five-paragraph roadmap section) and left every section you or Peleg wrote untouched.

Thank you for trusting me with the build and for giving me the space to design it end-to-end. Being part of this - from the algorithms through the visualisations to the paper - is something I won't forget, and it shaped how I think about scientific tools.

Three things only you can provide before we can lock the draft:

  1. ACKNOWLEDGEMENTS - anyone at DESY-CSSB (or elsewhere) we should credit for support beyond authorship? The section has a placeholder comment I left for you.
  2. FUNDING - the grant numbers to cite. Placeholder in the same area.
  3. BIORENDER - for the graphical abstract, NAR requires an article-specific licence and an explicit acknowledgment line. Does the Landau lab have one we can reuse, or should I get one dedicated to this article?

On operations going forward: Aleksandr Golubev is taking over as Primary Responder for the running server (Sentry alerts, dependency updates, DESY VM handling once IT unblocks). He's now Admin on the repo and Hetzner account owner. I stay involved as founder-oversight - the paper's my baby too - but for anything server-side after submission, Alex will be faster. Everything he needs is in the repo (docs/active/ALEX_ONBOARDING.md is his entry point).

I'll be moving to non-PVL work in the coming weeks - happy to be pinged any time on paper-side questions, references for the future, or if a related project ever comes up where I could contribute.

With gratitude,
Said
said.azaizah@cssb-hamburg.de
```

**Success**: sent.

---

### 6. Sentry cutover verification (10 min, after Alex sends his DSN)

Blocks on Alex's reply to Step 3. When you have the DSN + auth token:

1. <https://github.com/az-said/peptide_prediction/settings/secrets/actions> → update `SENTRY_DSN` and `SENTRY_AUTH_TOKEN` to Alex's values.
2. Push any trivial commit (a whitespace edit to `README.md` works) → watch `.github/workflows/deploy.yml` → confirm the Sentry release-upload step succeeds against Alex's DSN.
3. Hit a synthetic 500 in prod (or wait for a real error). Verify it appears in Alex's Sentry, not your `desycssb` org.
4. Leave your old org: <https://sentry.io/settings/members/> → your row → **Leave** (or Settings → General → Close Account).

**Success**: errors flow to Alex, no Sentry mail in your inbox for 24 h, `desycssb` abandoned.

---

## Everything after Step 6 is fully async (Alex or Peleg or Meytal drives)

| Waiting on | Unblocks | Notes |
|---|---|---|
| Alex sends PyPI username | Add him as Maintainer on `pvl-cli` + `pvl-mcp` | 2 min for you when it arrives |
| Alex sends ORCID | Update `CITATION.cff` → tag `v1.0.0` → Zenodo DOI mints | Single 15-min session |
| Peleg's 4 blockers | Locking the paper draft | 1-2 weeks realistically |
| Meytal's ACK + Funding + BioRender | Draft ready for internal review | 1-2 weeks |
| DESY IT unblocking `landau-webapp-dev` | Public dev VM | Alex tracks; see `HANDOFF_TECH_PLAYBOOK.md` Ch. 3 |
| bio.tools submission | Registry visibility | After `v1.0.0`; template ready in `docs/active/A4_BIO_TOOLS_SUBMISSION.md` |

---

## When you finish Step 6

Tell me "close-out executed" and I:
1. Move this file → `docs/archive/2026-08/CLOSE_OUT_DONE.md`
2. Mark done Actions in `SAID_MANUAL_ACTIONS.md`
3. Flip `project_pvl_closeout_2026_08.md` memory to `[RESOLVED]`
4. You start your next project with PVL fully compounded and off your plate.

---

## Rules of the road after that

- SEV1 mail (from Alex's forwarding rule) → respond within a business day
- Peleg or Meytal emails → respond promptly, they're co-authors not ops
- Dependabot noise → no longer reaches you, Alex owns
- Monthly report from Alex (4th of each month) → read, note flags, silent otherwise
- If Matheus or a future hire joins → point them at `docs/active/FOR_NEXT_BUILDER.md`; the whole stack self-serves from there

---

## Reference files (all pushed to `main`)

- `docs/active/FOR_NEXT_BUILDER.md` — cold-landing one-pager (new)
- `docs/active/HANDOFF_TECH_PLAYBOOK.md` — comprehensive tech ref + AI-agent contract (new)
- `docs/active/OWNERSHIP_MATRIX.md` — updated ownership (Said keeps Owner)
- `docs/active/ALEX_ONBOARDING.md` — Alex's Week 1-3 plan
- `docs/active/OPERATOR_COOKBOOK.md` — 21 how-to recipes
- `docs/active/paper_drafts/PASTE_MASTER_INTO_GOOGLE_DOC.md` — paper sections + comment replies
- `docs/active/paper_drafts/13_sentry_migration_runbook.md` — forward to Alex for his side
- `docs/active/INVENTORY_EVERYTHING.md` — full asset inventory
