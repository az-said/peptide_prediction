# Close-out — the one file you follow to lock this chapter in

**Owner**: Said Azaizah
**Purpose**: Everything left to do to hand this off cleanly to Alex + close the loop with Peleg and Meytal. Do the steps in order; each step has a one-line success check.
**Time**: ~2h 40min of your active work + async waits.
**When you're done with this file**: you're a co-author on a submitted paper with an operating co-founder handling day-to-day. You move on to non-PVL work. This file gets renamed to `CLOSE_OUT_DONE.md` and archived.

---

## Where we are (the lock-in state)

- `main` is at commit `9f3319c`, all handover docs pushed.
- 82 markdown files in `docs/active/`. Anyone with repo access can pick up the trail from `README.md` → `docs/active/README.md`.
- Wave 2.8/2.9 fully merged into `main`. The `wave-2.8/peleg-pdf-followups` branch is stale; you can ignore it.
- Sentry, GitHub, PyPI, Hetzner ownership documented in `docs/active/OWNERSHIP_MATRIX.md`. Alex is Hetzner owner; you retain root SSH for founder-oversight.
- Paper-side: full Materials & Methods v2 + 6 other sections drafted locally, ready to paste. Working-copy Google Doc already opened + shared with the team.
- Cowork prompt library: `docs/active/COWORK_PROMPTS.md` (6 prompts, feed to a browser-capable agent).
- Every action still needed for you personally is below.

---

## Do these in order

### STEP 1 — Paste 6 sections into the working-copy Google Doc

**Time**: 90 min (Cowork does it; you review + accept).
**Owns**: You (feed the Cowork prompt).
**Blocks**: Nothing downstream; but Peleg + Meytal have nothing to review until this lands.

**How**: open `docs/active/COWORK_PROMPTS.md` § A1 and paste the whole prompt into a browser-capable agent (Claude Desktop with Chrome tools, or Cursor Composer). It will paste sections 1/9 through 6/9 into the working copy, converting Markdown to Docs formatting and preserving Greek characters + your terminology guardrails.

**Success check**: open <https://docs.google.com/document/d/1mawqsE2x2PIvPYcj_lon0oRMN5OsvOhnxGz8l8FElTQ/edit> — MATERIAL AND METHODS shows Method A through Method M; DATA AVAILABILITY replaced; DISCUSSION has your bullets + the "Ongoing development and roadmap" section.

---

### STEP 2 — Post two replies on Peleg's threads

**Time**: 5 min (Cowork does it).
**Owns**: You (feed the Cowork prompt).
**Blocks**: Signals to Peleg that naming + graphical-abstract discussion is live.

**How**: `docs/active/COWORK_PROMPTS.md` § A2. Same browser-capable agent. Posts your naming candidates + graphical-abstract proposal as replies on the two open threads. Both stay open (Peleg resolves).

**Success check**: both threads show your reply as the last comment.

---

### STEP 3 — Invite Alex to GitHub org as Owner

**Time**: 2 min. **You do this manually** (do not delegate access-control to an agent).

1. <https://github.com/orgs/az-said/people>
2. Invite member → search `axelgolubev` → pick DESY Hamburg profile
3. Role: **Owner** → Send invitation
4. Belt-and-suspenders: <https://github.com/az-said/peptide_prediction/settings/access> → Add people → `axelgolubev` → role **Admin**

**Success check**: People page shows Alex as *Pending invitation*.

---

### STEP 4 — Invite Alex to Sentry as Owner

**Time**: 2 min. **Manual**.

1. <https://sentry.io> → switch to `desycssb` org
2. Settings → Members → Invite Member
3. Email `aleksandr.golubev@cssb-hamburg.de` → role **Owner** → add to all teams → Send

**Success check**: Members shows Alex as *Pending*. He has 7 days to accept.

---

### STEP 5 — Send Peleg the warm close-out email

**Time**: 15 min (write once, review, send).
**Owns**: You, from `said.azaizah@cssb-hamburg.de` (or Technion, or MIT — never personal Gmail).

**To**: Peleg Ragonis-Bachar
**Subject**: `PePFibPred paper — closing the loop + four things I need`

```
Peleg,

I've drafted everything I could without you — Method A through M in Materials and Methods, the Server Usage section, Author Contributions, Data Availability, eight Discussion bullets, and a five-paragraph roadmap for Ongoing Development. It's all in the working copy of the Doc; I posted the sections directly under your existing headings so nothing you or Meytal wrote gets touched.

Working with you on this has been the best part of building it. The algorithms are yours — TANGO's stretch-average method, the FF-Helix Chou-Fasman propensity, the SSW-union axiom, the μH + hydrophobicity gates — and I tried to make sure the paper reads that way. I've been listing you as first author (and Meytal senior) per Author Contributions, and I'll keep it that way unless you and Meytal want it framed differently.

Four things I still need from you before I can send it to Meytal for a final read:

1. The Ragonis-Bachar and Rayan threshold citation DOI — for Method G. I have "[CITE]" as a placeholder in three places.
2. The Staphylococcus aureus 2023 dataset publication reference — for Method M validation table.
3. TANGO aggregation-by-stretches: on 2026-06-03 you mentioned porting the stretch-scan function from your reference code (with average score limit = 0). Which function name in your repo should I port? Right now the code runs TANGO at fixed conditions (pH 7, T 298 K, ionic strength 0.1 M, TFE 0); I've documented that faithfully. If you want the stretch method instead, I'll implement it as soon as you point me to the function.
4. Verbatim Help-page text for SSW and FF-SSW definitions — you already wrote Helix + FF-Helix; I want to mirror them so the paper's Server-Output section stays symmetric.

Two smaller things:
- Signed charge vs. absolute charge (Q-FIX-022) — ok to ship with signed? I wrote the paper that way; happy to switch if you prefer absolute.
- OQ7 (β-% threshold definition) — close it before submission, or defer to a next-cycle patch? I'm fine either way.

On team going forward: Alex Golubev is stepping in as the primary maintainer for the ops side (Sentry alerts, dependency updates, deployment). I stay in the loop as founder-oversight — I'll see the monthly report, and I'm still on any scientific ADR you want me to look at — but for day-to-day questions about the server it's fastest to ping Alex directly (aleksandr.golubev@cssb-hamburg.de). Everything he'd need to answer you is in the repo under docs/active/; the entry point for a new maintainer is docs/active/ALEX_ONBOARDING.md.

Take your time on the four items — nothing is urgent. Thank you again for trusting me with this. I hope we get to build the next one together.

Said
```

**Success check**: sent from a DESY / Technion / MIT address; you've cc'd Meytal so she has visibility on the naming + citation asks.

---

### STEP 6 — Send Meytal the warm close-out email

**Time**: 10 min.
**Owns**: You, from the same address family.

**To**: Meytal Landau
**Subject**: `PePFibPred paper — Acknowledgements, Funding, BioRender + handoff note`

```
Meytal,

The technical sections of the NAR draft are in the working copy — Peleg has the link. I drafted six of them (Materials and Methods, Server Usage, Author Contributions, Data Availability, Discussion bullets, and a five-paragraph roadmap section) and left every section you or Peleg wrote untouched.

Thank you for trusting me with the build and for giving me the space to design it end-to-end. Being part of this — from the algorithms to the visualisations to the paper — is something I won't forget.

Three things only you can provide before we can lock the draft:

1. ACKNOWLEDGEMENTS — anyone at DESY-CSSB (or elsewhere) we should credit for support beyond authorship? The section has a placeholder comment I left for you.
2. FUNDING — the grant numbers to cite. Placeholder in the same area.
3. BIORENDER — for the graphical abstract, NAR wants an article-specific licence and an explicit acknowledgment line. Does the Landau lab have one we can reuse, or should I get one dedicated to this article?

On operations going forward: Aleksandr Golubev is taking over as primary maintainer for the running server (Sentry alerts, dependency updates, DESY VM handling once IT unblocks). He's now GitHub org Owner and Hetzner account owner. I stay involved as founder-oversight — the paper's my baby too — but for anything server-side after submission, Alex will be faster. Everything he needs is written up in the repo (docs/active/ALEX_ONBOARDING.md is his entry point).

I'll be moving to non-PVL work in the coming weeks — happy to be pinged any time on paper-side questions, or for reference work down the road.

With gratitude,
Said
```

**Success check**: sent. Peleg cc'd (or she'll get the same context from her thread).

---

### STEP 7 — Send Alex the warm handoff email

**Time**: 5 min.
**Owns**: You. Send AFTER Alex accepts the GitHub and Sentry invites (Steps 3 + 4).

**To**: `aleksandr.golubev@cssb-hamburg.de`
**Subject**: `PePFibPred handoff — you're now Primary Responder`

```
Alex,

Welcome as Primary Responder + Hetzner account owner for PePFibPred. Thank you for taking this on — genuinely. The scientific side belongs to Peleg and Meytal; the operational side is now yours; I stay in the loop as founder-oversight but silent on day-to-day pages.

Everything you need is in the repo, and I wrote it assuming you're new to GitHub. Read these in order:

1. docs/active/ALEX_ONBOARDING.md — your master guide, Week 1 / Week 2 / Week 3 plan
2. docs/active/GITHUB_101_FOR_ALEX.md — GitHub primer if you want it
3. docs/active/DOCS_MAP_FOR_ALEX.md — file tree + which doc to read for which task
4. docs/active/OWNERSHIP_MATRIX.md — who owns what, who gets what alert
5. docs/active/OPERATOR_COOKBOOK.md — 21 how-to recipes (SSH to VM, merge Dependabot, roll back a deploy, etc.)

There's an example monthly report at docs/active/reports/2026-07-EXAMPLE.md — I'd like you to draft the real one for August by 2026-09-04. Template lives at docs/active/MONTHLY_REPORT_TEMPLATE.md; five to ten minutes of your time each month.

Two things I need from you when you have a moment:
- Your PyPI username — so I can add you as Owner on pvl-cli and pvl-mcp
- Your ORCID URL — so I can add you to CITATION.cff before we cut v1.0.0

First real task waiting for you when you're ready: 33 open Dependabot security PRs. The playbook is in docs/active/COWORK_PROMPTS.md § B4 and docs/active/OPERATOR_COOKBOOK.md ("Merge a Dependabot PR safely"). Target: close the 2 critical + 12 high within 48 hours of you starting.

Pinging me directly on anything you want a second read on. And congratulations — you're on the paper too.

Said
```

**Success check**: sent. You can now stop watching Sentry.

---

### STEP 8 — Sentry alert migration

**Time**: 30 min. **You do this manually** (access-control + notification routing).
**Blocks on**: Alex accepting the Sentry invite (Step 4). Usually within a few hours.

Follow `docs/active/paper_drafts/13_sentry_migration_runbook.md` end-to-end. Summary:

1. **Alerts → Alert Rules**: for each rule, change recipient from "Said Azaizah (user)" to "Team: Owners". Save.
2. **Your avatar → Settings → Notifications**: Issue Alerts → "Only on issues I'm subscribed to". Deploy off. Weekly Reports on. Quotas on. Spike Protection on. Everything else off.
3. **Add SEV1 escalation rule**: severity = sev1, unresolved for 30 min → email you + email Alex. Second rule at 2 h for off-hours.
4. **Slack (if wired)**: re-point channel target to Alex.
5. **Confirm both weekly reports on**.
6. **Sanity test**: trigger a staging 500. Confirm Alex is paged, you are not. After 30 min confirm you receive the SEV1 escalation.

**Success check**: your inbox stops receiving routine pages; Alex's starts. You still receive the SEV1 escalation ping in a controlled test.

---

## Once Steps 1-8 are done

You send one final message to yourself (or to me next session): "close-out done". Then:

- I rename `CLOSE_OUT_ONE_FILE.md` → `docs/archive/2026-08/CLOSE_OUT_DONE.md` and commit.
- I update `docs/active/SAID_MANUAL_ACTIONS.md` to mark Actions 3, 4, 5, 6, 7, 9, 10 as DONE.
- I update the auto-memory index (`MEMORY.md`) with a `project_pvl_closeout_2026_08.md` entry that captures the handoff state for future compaction cycles.
- We move on to your next non-PVL project.

---

## What's still open at that point (async, not blocking you)

| Waiting on | What it unblocks | ETA |
|---|---|---|
| Alex's PyPI username | Action 11 — add him as PyPI Owner | Days |
| Alex's ORCID | Action 12 → 14 → 15 — `CITATION.cff`, `v1.0.0` tag, Zenodo DOI mint | Days |
| Peleg's four blockers (Step 5) | Locking the paper draft | 1-2 weeks realistically |
| Meytal's ACK + Funding + BioRender (Step 6) | Draft ready for internal review | 1-2 weeks |
| DESY IT unblocking landau-webapp-dev | Public dev VM | Weeks — Alex tracks |
| bio.tools submission (Action 17) | Registry visibility | After v1.0.0 |

Nothing on that list requires you to babysit. Alex owns operational unblocking; Peleg + Meytal reply on their own timeline; you're notified only if the monthly report flags something.

---

## Rules of the road while these are async

- If Alex escalates a SEV1 to you (30-min unresolved page), respond within a business day. Everything else, defer to him.
- If Peleg emails you scientifically, respond promptly (she's your co-author, not your ops).
- If Meytal emails you, same.
- If GitHub Dependabot pings you on a security PR, forward to Alex — Week 3 backlog is his.
- Monthly report from Alex lands on the 4th of each month; read it, note flags, otherwise silent.

---

## Files this close-out reads / relies on (all committed to `main`)

- `docs/active/paper_drafts/PASTE_MASTER_INTO_GOOGLE_DOC.md` — Section 1/9-9/9 source of truth
- `docs/active/COWORK_PROMPTS.md` — Cowork prompts A1, A2 + Part B manual checklist
- `docs/active/SAID_MANUAL_ACTIONS.md` — the 20-action master list (this close-out compresses it)
- `docs/active/OWNERSHIP_MATRIX.md` — who owns what
- `docs/active/ALEX_ONBOARDING.md` — Alex's Week 1-3 plan
- `docs/active/DOCS_MAP_FOR_ALEX.md` — Alex's file-tree map
- `docs/active/OPERATOR_COOKBOOK.md` — 21 how-to recipes
- `docs/active/GITHUB_101_FOR_ALEX.md` — GitHub primer
- `docs/active/paper_drafts/13_sentry_migration_runbook.md` — Sentry migration detail
- `docs/active/paper_drafts/12_master_handover_playbook.md` — the "Owner without a pager" pattern
- `docs/active/MONTHLY_REPORT_TEMPLATE.md` + `docs/active/reports/2026-07-EXAMPLE.md` — Alex's cadence
- `docs/active/INVENTORY_EVERYTHING.md` — full asset inventory (GitHub, PyPI, Zenodo, Sentry, Hetzner, DESY VM, DNS, etc.)

If anything in this close-out file conflicts with any of the above, the above wins — they're the durable references, this file is the ordered runbook for closing the chapter.
