# Cowork / browser-AI prompts — for the actions I can't run from a shell

**Audience**: Said (paste into Cowork / Claude Desktop with browser tools / Chrome-in-Chrome).
**Rule**: each prompt is copy-paste-ready. Everything the agent needs is inline — no external context required.

**Convention used**:
- Prompts start with `PROMPT:` and are triple-back-tick delimited so you can copy in one Cmd+A.
- Every prompt ends with an explicit "what success looks like" verification.

---

## 1. Post Paper Sections into the Working Copy Google Doc

**Purpose**: Action 3 in `SAID_MANUAL_ACTIONS.md`. Paste 8 sections from a local Markdown file into the working copy Google Doc. Requires browser + Google-authenticated agent.

**PROMPT:**

```
Task: Paste 8 sections from a local Markdown file into the "PePFibPred_Paper_WORKING_Said_2026-07-12" Google Doc in Said's Drive.

SOURCE FILE (local): /Users/saidazaizah/Desktop/DESY/peptide_prediction/docs/active/paper_drafts/PASTE_MASTER_INTO_GOOGLE_DOC.md
TARGET (Google Doc): https://docs.google.com/document/d/1mawqsE2x2PIvPYcj_lon0oRMN5OsvOhnxGz8l8FElTQ/edit

The source file is organised into 9 sections delimited by lines like `═══ SECTION N/9: <TITLE> ═══`.

Steps:
1. Read the local source file end-to-end.
2. Open the target Google Doc in a browser tab.
3. For each of sections 1/9 through 6/9 (SKIP sections 7/9, 8/9, 9/9 — those go as comments, handled by a different prompt):
   a. Locate the corresponding section header in the Google Doc (e.g. "MATERIAL AND METHODS", "Server usage", "AUTHOR CONTRIBUTIONS", "DATA AVAILABILITY", "DISCUSSION")
   b. Paste the content from the Markdown source between the section delimiters
   c. Convert Markdown formatting to Google Docs equivalents:
      - `**bold**` → bold
      - `*italic*` → italic
      - `## **Method X. Title**` → Heading 2, bold, non-italic
      - `### *Sub-heading*` → Heading 3, italic, non-bold
      - Markdown tables → real Google Docs tables
      - Code blocks (triple-backtick) → monospace formatting
   d. Verify Unicode Greek characters render correctly (α, β, μH, δ) — do NOT romanise
   e. Verify unspaced en-dash ranges (10-40, not 10 - 40)

Section-to-Doc-heading mapping:
- 1/9 MATERIAL AND METHODS → paste under existing "MATERIAL AND METHODS" heading in Doc
- 2/9 Server usage → paste under existing "Server usage" or "RESULTS" section
- 3/9 AUTHOR CONTRIBUTIONS → paste below Peleg's existing "Peleg Ragonis-Bachar:" line
- 4/9 DATA AVAILABILITY → paste under existing "DATA AVAILABILITY" heading
- 5/9 DISCUSSION bullets → paste below Peleg's two existing DISCUSSION bullets
- 6/9 Future Work paragraph → paste at the end of DISCUSSION as a new "Ongoing development and roadmap" Heading 2 subsection

DO NOT touch these sections (Peleg / Meytal own them):
- ABSTRACT, INTRODUCTION, RESULTS opening + Computational scheme + Server Output + Interpretation of Results, Case Study 1, Case Study 2, ACKNOWLEDGEMENTS, FUNDING, REFERENCES

DO NOT overwrite the title "PePFibPred" — leave it exactly as is.

TERMINOLOGY GUARDRAILS — every paste must be checked against these before saving:
- Greek inline: α, β, μH, δ (never `alpha`, `beta`, `uH`, `mu_H`)
- Ranges: unspaced en-dash (10-40, not 10 - 40)
- "fibril formation" never "aggregation prediction"
- "database" never "cohort"
- "membrane-active overlap" never "false positive" (for AMPs)
- SSW axiom uses OR (∨), never AND (∧)
- No mention of `pI` (does not exist in code)
- No mention of `PSIPRED` in M&M
- No `PVL` in reader-facing prose — use "PePFibPred"
- The tool name in body is `PePFibPred` — do not change it

Success verification (report back):
1. Screenshot of the doc's MATERIAL AND METHODS section showing Method A through Method M pasted
2. Confirmation that Peleg's INTRODUCTION and Case Study sections are untouched
3. Report any Markdown → Google Docs conversion issues that need Said's manual attention
```

---

## 2. Post 2 Comments on Peleg's Threads

**Purpose**: Action 4 in `SAID_MANUAL_ACTIONS.md`. Post naming candidates + graphical-abstract concepts as replies on Peleg's existing comment threads. Requires browser + Google-authenticated agent.

**PROMPT:**

```
Task: Post two comment replies on existing comment threads in the PePFibPred Google Doc.

TARGET (Google Doc): https://docs.google.com/document/d/1mawqsE2x2PIvPYcj_lon0oRMN5OsvOhnxGz8l8FElTQ/edit
SOURCE (local, contains the comment text): /Users/saidazaizah/Desktop/DESY/peptide_prediction/docs/active/paper_drafts/PASTE_MASTER_INTO_GOOGLE_DOC.md

The source file contains Section 7/9 (naming table) and Section 8/9 (graphical-abstract concepts).

Steps:
1. Read the local source file.
2. Extract the content from `═══ SECTION 7/9 ═══` to `═══ SECTION 8/9 ═══` — this is the naming reply.
3. Extract the content from `═══ SECTION 8/9 ═══` to `═══ SECTION 9/9 ═══` — this is the graphical-abstract reply.
4. Open the target Google Doc in a browser.
5. In the Doc, locate two Peleg-authored comment threads:
   - Thread with text "Find a name" (likely at the title heading)
   - Thread with text "Ideas for graphical abstract?" (likely at the GRAPHICAL ABSTRACT section)
6. Click the "Find a name" thread → click Reply → paste the naming table text (Section 7/9) → post
7. Click the "Ideas for graphical abstract?" thread → click Reply → paste the graphical-abstract concepts text (Section 8/9) → post

DO NOT resolve either thread — leave them open for Peleg + Meytal to reply to.
DO NOT overwrite the title "PePFibPred" in the body of the doc.

Success verification (report back):
1. Screenshot showing the "Find a name" thread with the naming table posted as a reply
2. Screenshot showing the "Ideas for graphical abstract?" thread with the three concept sketches posted as a reply
3. Both threads should still show as "open" (not resolved)
```

---

## 3. Invite Alex to GitHub Org as Owner

**Purpose**: Action 5 in `SAID_MANUAL_ACTIONS.md`. Requires GitHub-authenticated browser session.

**PROMPT:**

```
Task: Invite Aleksandr Golubev to the `az-said` GitHub organisation as Owner.

Alex's GitHub handle: axelgolubev
Alex's DESY email: aleksandr.golubev@cssb-hamburg.de
Org: az-said
Repo: peptide_prediction

Steps:
1. Open https://github.com/orgs/az-said/people in a browser
2. Verify you are logged in as `az-said` (Said Azaizah) — check the top-right avatar
3. Click "Invite member" button
4. In the search box, type "axelgolubev"
5. Select the correct account (structural biologist at DESY, Hamburg — verify against https://github.com/axelgolubev)
6. Under "Role", select "Owner"
7. Click "Send invitation"

After: also invite him at repo level as a belt-and-suspenders redundancy:
1. Open https://github.com/az-said/peptide_prediction/settings/access
2. Click "Add people"
3. Add "axelgolubev" with role "Admin"

Success verification (report back):
1. Screenshot of https://github.com/orgs/az-said/people showing axelgolubev listed as "Pending invitation" or "Owner"
2. Confirmation that the pending invite was successfully sent (GitHub shows a green banner)
```

---

## 4. Invite Alex to Sentry as Owner

**Purpose**: Action 6 in `SAID_MANUAL_ACTIONS.md`. Requires Sentry-authenticated browser session.

**PROMPT:**

```
Task: Invite Aleksandr Golubev to the Sentry organisation `desycssb` as Owner.

Sentry org: desycssb
Alex's email: aleksandr.golubev@cssb-hamburg.de
Alex's role: Owner (same as Said)

Steps:
1. Log in to https://sentry.io
2. Switch to the `desycssb` organisation (top-left dropdown)
3. Navigate to Settings → Members
4. Click "Invite Member"
5. Email: aleksandr.golubev@cssb-hamburg.de
6. Role: Owner
7. (Optional) Teams: assign to all existing teams
8. Send invite

Alex will receive an email with an accept link. He should accept within 7 days (Sentry invites expire).

After: verify from Said's account (not the invited account) that Alex appears in Settings → Members with status "Pending" or "Owner".

Success verification (report back):
1. Screenshot of Settings → Members showing Alex listed
2. Confirmation that the invite email was sent (Sentry shows "Invite sent" message)
```

---

## 5. Sentry Migration — Redirect Alerts to Alex, Silence Said

**Purpose**: Action 7 in `SAID_MANUAL_ACTIONS.md`. Multi-step migration. Requires Alex to have accepted invite from prompt 4 first.

**PROMPT:**

```
Task: Migrate Sentry alerts so Alex Golubev receives them (not Said), while Said retains Owner access. Follow the runbook at docs/active/paper_drafts/13_sentry_migration_runbook.md exactly.

PRECONDITION: Alex must have already accepted the Sentry invite (from Prompt 4 in COWORK_PROMPTS.md). Verify at https://sentry.io → Settings → Members that Alex is listed as Owner (not "Pending").

Sentry org: desycssb
Said's user account: (already logged in as Said)
Alex's user account: aleksandr.golubev@cssb-hamburg.de (Owner)

Steps (7 total):

1. Redirect alert-rule recipients:
   - Log in to Sentry as Said
   - Navigate to Alerts → Alert Rules
   - For each existing alert rule:
     a. Click Edit
     b. Under "Then perform these actions", find every recipient set to "Said Azaizah" (user)
     c. Change to "Team: Owners" (team) — this routes to both Said + Alex but respects each user's per-user notification preferences
     d. Save

2. Silence Said's personal notifications:
   - Click the user avatar (top right) → Settings → Notifications
   - Under "Issue Alerts" → change to "Only on issues I'm subscribed to"
   - Under "Deploy" → set to Off
   - Under "Weekly Reports" → set to On (this stays enabled — it's the founder-oversight signal)
   - Under "Quotas" → On (billing owner)
   - Under "Spike Protection" → On
   - Everything else → Off

3. Add SEV1 escalation rule:
   - Alerts → Create Alert → Issues
   - Condition: `severity: sev1 AND has NOT been resolved for 30m`
   - Actions:
     * Send email to Said Azaizah (this bypasses Said's silenced default — the one email he wants)
     * Send email to Aleksandr Golubev (redundant reminder)
   - Owner: Team Owners
   - Save

4. (Optional) Slack integration redirect:
   - Only if Slack is set up. Update the Slack DM target from Said's Slack to Alex's Slack.

5. Redirect Sentry Weekly Report:
   - Verify Said's Notifications → Weekly Reports is On (his low-noise digest)
   - Verify Alex's Notifications → Weekly Reports is On (his default)

6. Update local doc:
   - Not part of this browser task; will be done via a separate git commit.

7. Sanity test:
   - Not part of this browser task; Said will trigger a staging error and verify Alex receives + he does not.

Success verification (report back):
1. Screenshot of Alerts → Alert Rules showing all rules now target "Team: Owners" (not "Said Azaizah user")
2. Screenshot of Said's Notifications settings showing Issue Alerts = "Only on issues I'm subscribed to"
3. Screenshot of the new SEV1 escalation rule
4. Confirmation that Alex's notification defaults were NOT changed (he keeps full alert stream)
```

---

## 6. Bonus — Address the 33 Dependabot Vulnerabilities

**Purpose**: The push in this session flagged 33 open Dependabot vulnerabilities (2 critical, 12 high, 12 moderate, 7 low). Alex triages these on Day 1 of Week 3 (Primary Responder mode). Draft prompt here for when he's onboarded.

**PROMPT (for Alex, once onboarded):**

```
Task: Triage 33 open Dependabot vulnerability alerts on az-said/peptide_prediction.

URL: https://github.com/az-said/peptide_prediction/security/dependabot

Steps:
1. Log in to GitHub as axelgolubev
2. Open the Dependabot alerts page
3. For each of the 2 critical alerts:
   a. Read the CVE description and affected version range
   b. Check if the affected package is actually used in production (grep the repo)
   c. If yes: draft a PR bumping the version. If green CI, comment `@dependabot merge`
   d. If no (dev-only dependency, test-only): dismiss with reason "Vulnerable dependency is not used in production"
4. Repeat for 12 high alerts
5. For 12 moderate + 7 low alerts: batch-review, dismiss test-only, merge patches with green CI
6. Aim to close all 2 critical + 12 high within 48 hours (per SECURITY.md SLA)

Reference docs:
- docs/active/OPERATOR_COOKBOOK.md → "How to merge a Dependabot PR safely"
- SECURITY.md → SLA for critical / high / moderate / low
- docs/active/API_STABILITY.md → what's STABLE vs UNSTABLE (do not break STABLE without a MAJOR bump)

Success verification (report back):
1. Count of alerts closed (fixed or dismissed) per severity
2. Any alert that required Said's approval (major dependency bump)
3. Any alert on a STABLE field of api_models.py — file an RFC per RFC_TEMPLATE.md
```

---

## Cowork usage note

Cowork writes to a scratch dir (`/Users/saidazaizah/Documents/Claude/Projects/PVL` per `project_cowork_workspace.md` memory), not the real repo. If Cowork produces a file it thinks should land in the real repo (e.g., a fresh draft), copy the file over manually or use the "WORKING DIRECTORY:" header trick to redirect Cowork to the real repo before running.

For the prompts above, most involve **browser actions** (Google Docs, GitHub UI, Sentry UI). Cowork doesn't do browser automation natively — you may want to run these in Claude Desktop with Chrome-in-Chrome MCP, or in a Cursor Composer session with a browser-agent tool, rather than Cowork itself.
