# PVL — Final Handover Checklist

> Single page. Ticks at the top, references at the bottom. When every box is ticked, PVL is handed over.

---

## Phase 1 — Today / this week (you)

### Send the two emails
- [ ] `docs/internal/EMAIL_PELEG_FINAL.md` → Peleg (CC Alex)
- [ ] `docs/internal/EMAIL_ALEX_FINAL.md` → Alex (CC Peleg)

Both are paste-ready into Gmail. Edit the recipient address line, copy the body, send.

### Answers you're waiting on
- [ ] **Peleg OQ1, OQ2, OQ4, OQ5, OQ7, OQ8** — six scientific questions filed as Issues [#106–#111]. Each takes Peleg ~5 minutes to answer. Push for async if no sync is on the calendar.
- [ ] **Alex DNS hostname** for the DESY VM (e.g. `pvl.cssb-hamburg.de`).
- [ ] **Alex firewall holes** — TCP 80 + 443 inbound to `131.169.4.163` (otherwise the public URL is only reachable via SSH tunnel).
- [ ] **Alex ORCID** — paste it into `CITATION.cff` (currently `PENDING`).
- [ ] **Alex GitLab decision** — does DESY require a GitLab mirror? Runbook at `docs/active/GITLAB_MIRROR.md`. Default: skip unless required.

### Cut v1.0.0 (after Peleg signs off + Alex ORCID lands)
- [ ] Verify `CITATION.cff` version line says `1.0.0` and `date-released` is today.
- [ ] `gh release create v1.0.0 --title "v1.0.0 — Wave 2.8 + 2.9 close-out" --notes-file docs/active/RELEASE_NOTES.md --target main`
- [ ] Wait 2 minutes, check Zenodo: `open https://zenodo.org/account/records`
- [ ] Paste the versioned DOI + concept DOI into `CITATION.cff` `identifiers:` block.
- [ ] Update README badge: `[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.XXXX.svg)](https://doi.org/10.5281/zenodo.XXXX)`
- [ ] Commit + push (don't tag this one — it lives between releases).

Full walkthrough: `docs/active/PUBLICATION_PATH.md` §1–3.

---

## Phase 2 — After v1.0.0 (you, ~1 hour)

### bio.tools registration
- [ ] Sign in at <https://bio.tools/login>
- [ ] "Contribute → New tool"
- [ ] Paste-ready field values: `docs/active/PUBLICATION_PATH.md` §4

### JOSS paper submission
- [ ] Edit `paper/paper.md` — paste the Zenodo concept DOI into `archive_doi:` field.
- [ ] Verify `paper/paper.bib` entries resolve.
- [ ] Submit at <https://joss.theoj.org/papers/new>
- [ ] Tell Peleg + Alex the submission ID once received.

---

## Phase 3 — Once Alex hands over DNS (~5 minutes you, then ~10 min Caddy)

- [ ] SSH to the DESY VM via Maxwell (`docs/active/DEPLOYMENT.md` access path).
- [ ] Edit `/opt/pvl/docker/Caddyfile` — change `localhost:3000` → the new hostname.
- [ ] `docker compose -f docker/docker-compose.prod.yml restart frontend`
- [ ] Wait ~30 seconds for Caddy to provision Let's Encrypt.
- [ ] `curl -I https://<hostname>/api/health` → expect 200.
- [ ] Update three places to point at the DESY URL:
  - [ ] `README.md` "Try it" badge or link
  - [ ] `CITATION.cff` `url:` field
  - [ ] bio.tools homepage URL (re-edit the registered tool)

After this, PVL has its permanent public URL.

---

## Phase 4 — Optional polish (you OR the next dev — listed but NOT required for handover)

- [ ] **ISSUE-034 (#112)** — diagnose why precompute_dataset.py silently skips TANGO. Probable cause in `services/upload_service.py` cache/row-validation path. ~1 day. Fix unblocks aggregation heatmap for both precomputed reference sets.
- [ ] **Doc cleanup finish** — `docs/active/` is at 27 files. Opus 4.8 documentation terminal will produce `docs/handbook/` (Wave 1 already shipped, Waves 2–11 queued). When Wave 11 lands, archive most of `docs/active/`.
- [ ] **Export redesign Tier 1** — `docs/active/EXPORT_REDESIGN_BRIEF.md`. Shortlist PDF row-count dropdown + provenance footer + legend appendix. ~1 day. Highest user-visibility win.

---

## What's already done (nothing to tick)

Everything in `docs/active/BACKLOG.md` "Recently shipped" is live on both Hetzner + DESY:

- **Code**: 646 backend tests + 672 frontend tests passing; ruff + tsc clean; CI + CodeQL + CodeRabbit green; rate limiter live on the two expensive routes.
- **DESY VM**: bootstrap script idempotent, full stack healthy, both reference datasets precomputed and served on `/api/precomputed/{id}`.
- **Hetzner VPS**: still serving as paper-citable URL until DESY DNS lands.
- **GitHub**: branch protection on main, secret scanning, push protection, vulnerability alerts, Dependabot security fixes, issue templates (bug/feature/sci), PR template with invariants checklist.
- **Docs**: 11 dated artifacts archived; A4 + A5 merged → PUBLICATION_PATH; DEVELOPER_REFERENCE renamed → ARCHITECTURE; PRODUCTION_LOCKDOWN.md + EXPORT_REDESIGN_BRIEF.md + GITLAB_MIRROR.md + BACKLOG.md + this HANDOVER_CHECKLIST written.
- **Process**: pre-push ruff hook, CI watcher, scripts/desy_vm_bootstrap.sh idempotent, scripts/prod_redeploy.sh on Hetzner, precompute registry covers peleg_118 + gold_standard.

---

## Gold-standard precompute — final state

| Aspect | State |
|---|---|
| Artifact written to disk | ✅ `/app/data/precomputed/gold_standard.json`, 8.5 MB |
| Endpoint serves the artifact | ✅ `/api/precomputed/gold_standard` returns 200 with 2,916 rows |
| Frontend loads instantly | ✅ Demo button, Upload "Gold Standard" button, Compare split-button — all routed through `loadPrecomputedDataset("gold_standard")` |
| S4PRED + biochem + FF flags | ✅ Populated for all 2,916 rows |
| TANGO per-residue curves | ❌ Empty (ISSUE-034 — TANGO subprocess skipped in precompute path) |
| Aggregation heatmap on these rows | Empty until ISSUE-034 is fixed |
| Live `/api/predict` (any peptide) | ✅ Still populates TANGO fully — unaffected by ISSUE-034 |

**Decision**: ship as-is. Empty heatmap on demos is a minor gap; everything else works. ISSUE-034 is tracked at #112 for the next dev.

---

## Docs on the VM (auto-synced)

The DESY VM holds the full git clone at `/opt/pvl`. Every doc that lives on GitHub also lives on the VM. To sync after a GitHub change:

```bash
ssh -J azaizahs@max-display.desy.de root@landau-webapp-dev
cd /opt/pvl && git pull --ff-only origin main
```

That's it. No separate doc deployment.

If you need to read a specific doc from your Mac without SSHing in:

```bash
gh api repos/saidaz24-meet/peptide_prediction/contents/docs/active/HANDOVER_CHECKLIST.md --jq '.content' | base64 -d | less
```

---

## When this checklist is fully ticked

PVL is:
- Citable (Zenodo DOI + concept DOI)
- Discoverable (bio.tools listing approved)
- Peer-reviewed (JOSS paper accepted)
- Production-deployed (DESY VM live at a stable HTTPS URL)
- Handed over (next developer reads `HANDOFF.md` + `BACKLOG.md` and ships)

That's the whole project.
