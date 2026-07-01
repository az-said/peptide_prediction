# GitHub Account Migration — `saidaz24-meet` → `az-said`

**Date:** 2026-06-30
**Owner:** Said Azaizah (az.said2007@gmail.com)

## What changed

The GitHub username for this project's owner was renamed from `saidaz24-meet` to `az-said`.
All canonical URLs moved accordingly. The account, repository, history, issues, and
commit attribution are unchanged — only the username label moved.

| Surface | Old | New |
|---|---|---|
| Repository | `github.com/saidaz24-meet/peptide_prediction` | `github.com/az-said/peptide_prediction` |
| Docs site (GitHub Pages) | `saidaz24-meet.github.io/peptide_prediction/` | `az-said.github.io/peptide_prediction/` |
| Container images (GHCR) | `ghcr.io/saidaz24-meet/pvl-*` | `ghcr.io/az-said/pvl-*` |
| Clone (HTTPS) | `https://github.com/saidaz24-meet/peptide_prediction.git` | `https://github.com/az-said/peptide_prediction.git` |

## Why links may have looked broken briefly

- **Repo URLs** auto-redirect from the old username (GitHub keeps the redirect alive
  unless someone claims `saidaz24-meet` *and* creates a repo with the same name). All
  in-repo references were updated to the new URL regardless, so no reliance on redirects.
- **The GitHub Pages docs site has NO redirect.** The old
  `saidaz24-meet.github.io/...` URL now returns 404. The site is republished at the new
  `az-said.github.io/peptide_prediction/` address — the `docs.yml` workflow rebuilds it
  on the next push to `main`.
- **GHCR image namespace moved with the account.** Pulls of `ghcr.io/saidaz24-meet/...`
  will fail; use the `az-said` namespace. Re-publish/re-tag images under the new
  namespace (`docker-publish.yml` / `publish_v0_3_0.sh`).

## Commit attribution

Commits are attributed by **email**, not username. Author email
`az.said2007@gmail.com` is unchanged, so the full contribution graph and authorship
are preserved.

## For collaborators (DESY / Technion / Peleg)

Update any bookmarks, local clones, and citation references to `az-said`. To repoint
an existing local clone:

```bash
git remote set-url origin https://github.com/az-said/peptide_prediction.git
```

## For automated agents working in this repo

The canonical owner is now `az-said`. Any reference to `saidaz24-meet` found anywhere
is stale and should be updated to `az-said`.
