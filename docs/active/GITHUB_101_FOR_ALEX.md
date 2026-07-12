# GitHub 101 — for Alex

> **You only need this file if you have never used GitHub before.** If you already know what a pull request is and how to click Merge, skip this file entirely and go back to `ALEX_ONBOARDING.md`.

**Time investment**: 15 minutes to read + 15 minutes to click around and get comfortable.

---

## What GitHub is

GitHub is a website that hosts code repositories. A **repository** (or "repo") is a folder of files with a full history of every change ever made to it. Think of it like Google Drive for code, except every version of every file is kept forever and you can compare any two versions.

Our repo lives at: <https://github.com/az-said/peptide_prediction>

You have **Owner** access — meaning you can do anything on that repo (change settings, add collaborators, merge pull requests). Said and you are both Owners.

---

## The vocabulary — 10 words you'll see constantly

- **Commit** — a single "save point" with a message describing what changed. Every change is a commit.
- **Branch** — a parallel line of development. The main branch is called `main`. Every new feature or fix starts on a new branch.
- **Pull request (PR)** — a proposal to merge a branch into `main`. It shows the diff (what changed), triggers CI (see below), invites review, and only after being approved and merged does the change land on `main`.
- **Merge** — accepting a PR and putting its changes into `main`.
- **Fork** — a personal copy of a repo. External contributors fork the repo, make changes on their fork, then open a PR back to the original. You don't need to fork; you have direct access.
- **Issue** — a public message on the repo (bug report, question, feature request). Anyone can file one. You triage them.
- **Discussion** — like an Issue but more conversational. We use Discussions for RFCs (proposed changes to axiom logic — see `RFC_TEMPLATE.md`).
- **CI (Continuous Integration)** — automated tests that run on every PR. If CI is "green", tests passed. If CI is "red", something is broken and the PR shouldn't be merged.
- **CODEOWNERS** — a file (`.github/CODEOWNERS`) that says who must review a PR that touches specific files. You are auto-added as a reviewer to any PR touching infra / ops files.
- **Dependabot** — GitHub's automated dependency updater. It opens PRs to bump versions of libraries we use. You'll see these frequently.

---

## The 5 pages of GitHub you'll live in

Bookmark all five.

### 1. Repo landing page — <https://github.com/az-said/peptide_prediction>

Shows: README, files, recent commits, "About" sidebar with links.

### 2. Pull requests — <https://github.com/az-said/peptide_prediction/pulls>

Shows: open PRs (waiting for review or merge). Filter by label (`dependabot`, `docs`, `sev3`, etc.). Click a PR to see its diff, CI status, and comments.

### 3. Issues — <https://github.com/az-said/peptide_prediction/issues>

Shows: open bug reports and feature requests. You triage these. Add labels, close duplicates, assign yourself to the ones you'll work on.

### 4. Actions — <https://github.com/az-said/peptide_prediction/actions>

Shows: every CI run (green = pass, red = fail). If `main` shows a red run, something merged that broke the build. Click into it to see logs.

### 5. Discussions — <https://github.com/az-said/peptide_prediction/discussions>

Shows: open discussions grouped by category. **RFC** category is where axiom-change proposals live. Comment freely.

---

## The 10 things you'll actually do

### 1. Look at a PR

Go to the Pull Requests tab → click any PR → the tabs at the top of the PR view are:
- **Conversation** — the chat + review comments
- **Commits** — every save-point in the PR
- **Checks** — CI status (green ✓ or red ✗)
- **Files changed** — the diff

The **Files changed** tab is the important one. Green lines = added; red lines = removed.

### 2. Approve a PR

On the PR page, click **Files changed** → click **Review changes** (top right) → choose **Approve** → click **Submit review**.

You should only approve PRs you have read and understood. If unsure, ask Said in a comment.

### 3. Merge a PR

Approved PRs with green CI show a green **Merge pull request** button at the bottom of the Conversation tab. Click it. Choose **Create a merge commit** (not squash) unless the PR is a Dependabot bump. Confirm.

### 4. Comment on a PR

Click the blue **Comment** box under the diff or at the bottom of the Conversation tab. Markdown works. `@mention` a user with `@axelgolubev` or `@az-said` to notify them.

### 5. Merge a Dependabot PR

Dependabot PRs auto-titled like `Bump requests from 2.31.0 to 2.32.0`.

- **Patch bumps** (`2.31.0 → 2.31.1`) — comment `@dependabot merge` if CI is green. Dependabot will merge itself.
- **Minor bumps** (`2.31.0 → 2.32.0`) — ask Said before merging. Usually safe but he wants to know.
- **Major bumps** (`2.31.0 → 3.0.0`) — never merge without Said's explicit approval. Major bumps break things.

### 6. Look at CI logs

Actions tab → click any run → click a failed job → expand the failed step. The last ~30 lines of output tell you what broke.

If CI is red on `main`, that's a SEV2 or SEV3 depending on scope. See `INCIDENT_SEVERITY.md`.

### 7. File an issue

Issues tab → **New issue** → pick a template (Bug / Feature / Scientific question) → fill it in. Save.

### 8. Respond to CodeRabbit

Every PR gets a review by CodeRabbit, an AI reviewer. Its comments are inline on the diff. Address the notes you agree with; reply "Won't fix — <reason>" to those you don't. Don't just ignore CodeRabbit — reviewers expect you to have engaged with it.

### 9. Look at CODEOWNERS

`.github/CODEOWNERS` in the repo lists who is auto-requested as reviewer for each file. You will be auto-requested when a PR touches `docker/`, `.github/workflows/`, `docs/active/SENTRY_RUNBOOK.md`, `docs/active/RUNBOOKS/`, or anything ops-adjacent. When you see a PR waiting on you, review it.

### 10. Accept a review request

You'll get an email like *"Aleksandr, you've been requested for review"*. Click the link → land on the PR → do the review steps above (approve / request changes / comment).

---

## The 3 things you WILL do wrong at least once

Everyone does. That's fine.

### 1. Accidentally push to `main` directly

If you clone the repo and `git commit && git push` from your local checkout, you're pushing directly to `main`. This is bad but recoverable — Said will get a red CI email, the PR-review process was skipped, and it's an easy fix (`git revert` the commit and open a proper PR).

**Rule**: only push directly to `main` for absolutely trivial doc typo fixes. Everything else goes through a branch + PR.

### 2. Merge a Dependabot PR without reading what it changes

If it's a patch bump and CI is green, you're fine. If it's a major bump and things break in production, that's a SEV1. Read the PR body to see the change type.

### 3. Confuse Discussions with Issues

**Issues** = "something is broken / something should be built".
**Discussions** = "let's talk about what to do".

An RFC (proposed axiom change) goes as a Discussion, not an Issue. See `RFC_TEMPLATE.md`.

---

## Your first ~5 GitHub actions (do these on Day 1)

1. Log in at <https://github.com/> with your `axelgolubev` account
2. Visit <https://github.com/orgs/az-said/people> — verify you're listed as Owner
3. Star the repo: <https://github.com/az-said/peptide_prediction> — click the ⭐ button (bookmarks it in your GitHub UI)
4. Watch the repo: same page, click **Watch** → **All Activity** (or **Custom** → check "Issues" + "Pull requests" + "Discussions") so you get email notifications for anything happening
5. Open <https://github.com/az-said/peptide_prediction/actions> and see the CI runs. Green = healthy. Red = someone needs to fix something.

---

## Making your first change safely (only when you're ready)

Say you want to fix a typo in a doc. The full "correct" flow:

```bash
cd ~/Documents/peptide_prediction   # or wherever you cloned
git checkout main
git pull                            # get the latest
git checkout -b fix/typo-in-oncall  # start a branch
# ... edit the file in Cursor / VS Code ...
git add docs/active/ONCALL.md
git commit -m "docs: fix typo in ONCALL.md quiet-hours section"
git push -u origin fix/typo-in-oncall
```

Then in the browser:
- <https://github.com/az-said/peptide_prediction> will show a yellow banner: *"fix/typo-in-oncall had recent pushes. Compare & pull request"*
- Click it → fill in the PR title + body → **Create pull request**
- CodeRabbit reviews within a minute or two
- Said (or you, if you're the only reviewer) approves
- Merge

**First time doing this, do it with a doc change, not a code change.** Docs won't break anything if you get the flow wrong.

---

## Cheat sheet — pin this on your desktop

```
Repo:        https://github.com/az-said/peptide_prediction
PRs:         https://github.com/az-said/peptide_prediction/pulls
Issues:      https://github.com/az-said/peptide_prediction/issues
Actions:     https://github.com/az-said/peptide_prediction/actions
Discussions: https://github.com/az-said/peptide_prediction/discussions
Sentry:      https://sentry.io/organizations/desycssb/
Docs site:   https://az-said.github.io/peptide_prediction/

Common commands:
git status                     # what's changed locally
git pull                       # fetch latest from GitHub
git checkout -b <branch>       # start a branch
git commit -m "msg"            # save changes
git push                       # send to GitHub
git log --oneline -10          # last 10 commits

Never do:
git push --force               # rewrites history — don't
git reset --hard HEAD          # discards uncommitted work
git commit --amend             # rewrites the last commit; only OK before pushing
```

---

## When you're stuck

Two escape hatches:

1. **GitHub Docs** — <https://docs.github.com/> is the official reference. Very readable.
2. **Ask Said** — direct email. "How do I do X on GitHub?" is a legitimate question. Nobody was born knowing this.

---

Go back to [`ALEX_ONBOARDING.md`](ALEX_ONBOARDING.md) Day 1 checklist and continue.
