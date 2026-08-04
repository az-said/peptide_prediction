# Browser-agent prompts and manual click-lists

**Audience**: Said (running a browser-capable agent, e.g. Claude Desktop with Chrome tools).

**Why this file is split into two parts**

Part A holds tasks a browser agent can safely do for you: pasting your own drafted text into your own Google Doc, and posting your own drafted replies on your own comment threads. These operate only on content you wrote, in a document you own.

Part B holds tasks that involve access control and security triage: granting someone Owner of your GitHub org, adding repo Admin, inviting an Owner to Sentry, redirecting alert recipients, changing notification settings, and triaging or dismissing security alerts. A responsible AI agent will refuse to perform these on your authenticated sessions, and it is correct to refuse, because they are the same actions an attacker would want automated. These are a couple of minutes of your own clicking each, so Part B is a plain human checklist, not an agent prompt. If an agent ever offers to do a Part B item for you, that is a red flag, not a convenience.

Every Part A prompt is copy-paste-ready and ends with an explicit "what success looks like" check.

---

# Part A. Agent-runnable (your own content, your own doc)

## A1. Paste the paper sections into your working-copy Google Doc

**Covers**: Action 3 in `SAID_MANUAL_ACTIONS.md`. Six sections you wrote, pasted into your own working copy.

**PROMPT:**

```
I am working on my own manuscript. Paste six sections I wrote from a local Markdown file into my own Google Doc working copy. Both the file and the doc belong to me.

SOURCE FILE (local, mine): /Users/saidazaizah/Desktop/DESY/peptide_prediction/docs/active/paper_drafts/PASTE_MASTER_INTO_GOOGLE_DOC.md
TARGET DOC (mine, already open and signed in to my Google account): https://docs.google.com/document/d/1mawqsE2x2PIvPYcj_lon0oRMN5OsvOhnxGz8l8FElTQ/edit

The source file is split into nine blocks delimited by lines like:  ═══ SECTION N/9: <TITLE> ═══

Paste only blocks 1/9 through 6/9. Do NOT paste 7/9, 8/9, or 9/9 (those are comment replies, handled by a separate prompt, and 9/9 has nothing to paste).

For each block 1 through 6:
  1. Find the matching heading already in the doc.
  2. Paste the block's content directly under that heading.
  3. Convert Markdown to Google Docs formatting:
       **bold** to bold
       *italic* to italic
       ## **Method X. Title** to Heading 2, bold, not italic
       ### *Sub-heading* to Heading 3, italic, not bold
       Markdown tables to real Google Docs tables
       triple-backtick code to monospace
  4. Keep Greek characters as Unicode (alpha as the alpha glyph, and likewise beta, mu-H, delta). Do not romanise them.
  5. Keep numeric ranges as an unspaced hyphen, e.g. 10-40, not 10 - 40.

Heading map:
  1/9 MATERIAL AND METHODS  ->  under the existing "MATERIAL AND METHODS" heading
  2/9 Server usage          ->  under the existing "Server usage" (or "RESULTS") section
  3/9 AUTHOR CONTRIBUTIONS   ->  below the existing "Peleg Ragonis-Bachar:" line
  4/9 DATA AVAILABILITY      ->  under the existing "DATA AVAILABILITY" heading
  5/9 DISCUSSION bullets     ->  below the two existing DISCUSSION bullets (do not merge with them)
  6/9 Future Work paragraph  ->  at the end of DISCUSSION, as a new Heading 2 titled "Ongoing development and roadmap"

Leave these sections untouched (co-authors own them): ABSTRACT, INTRODUCTION, the RESULTS opening, Computational scheme, Server Output, Interpretation of Results, Case Study 1, Case Study 2, ACKNOWLEDGEMENTS, FUNDING, REFERENCES. Leave the title "PePFibPred" exactly as is.

Terminology to preserve on every paste:
  Greek inline as Unicode: alpha, beta, mu-H, delta glyphs (never spelled out)
  Ranges as unspaced hyphen: 10-40
  "fibril formation", never "aggregation prediction"
  "database", never "cohort"
  "membrane-active overlap", never "false positive" (for AMPs)
  SSW axiom uses OR, never AND
  no mention of pI (it does not exist in the code)
  no mention of PSIPRED in Materials and Methods
  no "PVL" in reader-facing prose; use "PePFibPred"

Report back:
  1. A screenshot of MATERIAL AND METHODS showing Method A through Method M pasted.
  2. Confirmation that the INTRODUCTION and Case Study sections are unchanged.
  3. Any Markdown-to-Docs conversion issue I should fix by hand.
```

---

## A2. Post your two comment replies on the existing threads

**Covers**: Action 4 in `SAID_MANUAL_ACTIONS.md`. Two replies you wrote, on threads in your own doc.

**PROMPT:**

```
I am replying to two open comment threads in my own Google Doc, with text I wrote.

TARGET DOC (mine, already open and signed in): https://docs.google.com/document/d/1mawqsE2x2PIvPYcj_lon0oRMN5OsvOhnxGz8l8FElTQ/edit
SOURCE (local, mine): /Users/saidazaizah/Desktop/DESY/peptide_prediction/docs/active/paper_drafts/PASTE_MASTER_INTO_GOOGLE_DOC.md

Steps:
  1. In the source file, take the text between  ═══ SECTION 7/9 ═══  and  ═══ SECTION 8/9 ═══ . That is the naming reply.
  2. Take the text between  ═══ SECTION 8/9 ═══  and  ═══ SECTION 9/9 ═══ . That is the graphical-abstract reply.
  3. In the doc, find the thread whose text is "Find a name". Click Reply, paste the naming text, post.
  4. Find the thread whose text is "Ideas for graphical abstract?". Click Reply, paste the graphical-abstract text, post.

Do NOT resolve either thread; leave both open. Do NOT change the title "PePFibPred" in the body.

Report back:
  1. A screenshot of the "Find a name" thread showing my naming reply.
  2. A screenshot of the "Ideas for graphical abstract?" thread showing my reply.
  3. Confirmation that both threads are still open.
```

**Note before running A1 or A2**: as of the last check, the working copy contained only the Data Availability section. Confirm the current state of the doc (open File then Version history) before pasting, so you do not duplicate anything.

---

# Part B. Do these yourself (access control and security)

These are the invites, permission changes, alert routing, and security-alert triage. They take a couple of minutes each. Do not hand them to an agent. Each is also written out in full in `SAID_MANUAL_ACTIONS.md`.

## B1. Invite Alex to the GitHub org (Action 5)

Prereq: Alex confirms his handle is `axelgolubev`.

1. Go to https://github.com/orgs/az-said/people
2. Invite member, search `axelgolubev`, pick the DESY Hamburg account (cross-check https://github.com/axelgolubev).
3. Role: Owner. Send invitation.
4. Optional repo-level redundancy: https://github.com/az-said/peptide_prediction/settings/access , Add people, `axelgolubev`, role Admin.

Done when the people page shows him as Pending invitation.

## B2. Invite Alex to Sentry (Action 6)

Prereq: he has accepted the GitHub invite.

1. Sign in to https://sentry.io , switch to the `desycssb` org.
2. Settings, Members, Invite Member.
3. Email `aleksandr.golubev@cssb-hamburg.de`, role Owner, optionally add to all teams. Send.

Done when Members shows him as Pending. He must accept within 7 days.

## B3. Sentry alert migration (Action 7)

Prereq: Alex is Owner (not Pending) in Sentry. Follow `docs/active/paper_drafts/13_sentry_migration_runbook.md` end to end. Summary:

1. Alerts, Alert Rules: for each rule, change the recipient from "Said Azaizah (user)" to "Team: Owners", save.
2. Your avatar, Settings, Notifications: Issue Alerts to "Only on issues I'm subscribed to"; Deploy Off; Weekly Reports On; Quotas On; Spike Protection On; everything else Off.
3. Add a SEV1 escalation rule: condition severity sev1 not resolved for 30m, actions email you plus email Alex, owner Team Owners, save. Add a second rule at 2h for off-hours.
4. If Slack is wired up, re-point the channel target to Alex.
5. Confirm both your and Alex's Weekly Reports are On.
6. Sanity test: trigger a staging 500. Confirm Alex is paged and you are not; after 30m confirm you get the SEV1 escalation.

After this, you stop receiving routine pages; Alex is primary.

## B4. Dependabot triage (Alex, once onboarded)

This is Alex's Week 3 task, not yours. He works from https://github.com/az-said/peptide_prediction/security/dependabot , using `docs/active/OPERATOR_COOKBOOK.md` ("merge a Dependabot PR safely"), `SECURITY.md` (SLA), and `docs/active/API_STABILITY.md`. Target: close the 2 critical and 12 high within 48h. Anything touching a STABLE field of `api_models.py` gets an RFC, not a direct bump.

---

## Usage note

The two Part A prompts need a browser agent signed in to your Google account. Cowork does not drive the browser itself; run them in Claude Desktop with Chrome tools. Part B is all manual and belongs to you.
