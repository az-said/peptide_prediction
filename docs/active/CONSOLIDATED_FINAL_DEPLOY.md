# PVL — Consolidated Final Deploy Runbook

> **Purpose.** The single, ordered, paste-ready procedure for the *one final deploy* after Alex hands over the DESY DNS hostname + ORCID + firewall holes. Designed to be run exactly once — every prior partial deploy in this project's history was incremental; this one is the destination state.

This doc is what the next developer reads to take over the DESY VM. It's also what Said reads to do the final v1.0.0 cut.

---

## When you run this runbook

ALL FIVE of these must be true:

1. ✅ Alex has assigned a DNS hostname (e.g. `pvl.cssb-hamburg.de`).
2. ✅ Alex has opened TCP 80 + 443 inbound from the public internet to the VM IP.
3. ✅ Alex has provided his ORCID (`CITATION.cff` currently has `PENDING-ASK-ALEX`).
4. ✅ Peleg's six scientific questions (GitHub Issues #106–#111 + #116–#119) are all closed or deferred per ADR-021.
5. ✅ `main` is clean and CI green (Backend Tests, Frontend Build, Docker Build, CodeQL, docs deploy — all 5 passing).

If any is false, stop. The runbook expects them all true. Use `BACKLOG.md` Tier 0 to walk the remaining gates first.

---

## What this runbook produces

When complete, you have:

- A public HTTPS URL on a DESY hostname serving the full PVL web app + API
- All 4 surfaces (web, CLI, Python pkg, MCP) reachable via that single API
- A v1.0.0 GitHub release tag triggering Zenodo DOI mint + GHCR image publish + PyPI publish for `pvl-cli` and `pvl-mcp` all in one automated pass
- `CITATION.cff` carrying the real Zenodo DOI + Alex's ORCID
- README badge row showing the DOI badge live
- `docs/active/HANDOVER_CHECKLIST.md` marked complete in §5

---

## The deploy in one paragraph

SSH into the DESY VM via the Maxwell-Kerberos chain. Set the DOMAIN env var to Alex's hostname. Pull `main`. Rebuild **only** the frontend + backend images. Bring the stack up with the Caddy compose file (so HTTPS is on automatically). Caddy provisions a Let's Encrypt cert on first request. Smoke-test the HTTPS URL. Run the precompute for both reference datasets. On your Mac, fill in Alex's ORCID, cut the `v1.0.0` tag, push. The three GitHub Actions workflows (Zenodo via release tag, PyPI publish, GHCR publish) fire automatically. Confirm Zenodo minted the DOI, wire it back into `CITATION.cff` + README, push the wire-up commit, smoke-test the badge row. Then mark `HANDOVER_CHECKLIST.md` §5 complete and email Peleg the live URL.

That's the destination. The expanded version below has the exact commands.

---

## Step-by-step

### Phase 1 — Local prep on your Mac (~10 min)

1. **Pull latest:**
   ```bash
   cd /Users/saidazaizah/Desktop/DESY/peptide_prediction
   git checkout main
   git pull --ff-only origin main
   ```

2. **Verify clean state:**
   ```bash
   git status                            # should be clean
   git log --oneline -5                  # confirm you're on the commit you intend to deploy
   make ci                               # backend pytest + frontend vitest + lint + typecheck
   ```

3. **Fill in Alex's ORCID** (he sent it in his email):
   ```bash
   # Edit CITATION.cff — find the line "orcid: \"PENDING-ASK-ALEX\""
   # Replace with his actual ORCID URL
   sed -i.bak 's|"PENDING-ASK-ALEX"|"https://orcid.org/<HIS-REAL-ORCID>"|' CITATION.cff
   rm CITATION.cff.bak
   git diff CITATION.cff                 # verify the change
   git add CITATION.cff
   git commit -m "ci: Alex's ORCID into CITATION.cff (last gap before v1.0.0)"
   git push origin main
   ```

   *Wait for CI green before continuing.*

### Phase 2 — DESY VM deploy (~15 min)

4. **SSH into the VM via the Maxwell chain:**
   ```bash
   ssh azaizahs@max-display.desy.de   # password + OTP
   kinit                              # DESY password again
   ssh -l root landau-webapp-dev      # Kerberos auth, no prompt
   ```

5. **Pull main on the VM:**
   ```bash
   cd /opt/pvl
   git pull --ff-only origin main
   git log -1 --oneline               # confirm you got the ORCID commit
   ```

6. **Set the DOMAIN env var** in `.env.deploy`:
   ```bash
   # Replace pvl.cssb-hamburg.de with whatever Alex assigned
   grep -q '^DOMAIN=' .env.deploy && sed -i 's|^DOMAIN=.*|DOMAIN=pvl.cssb-hamburg.de|' .env.deploy || echo 'DOMAIN=pvl.cssb-hamburg.de' >> .env.deploy
   cat .env.deploy | head -3          # verify
   ```

7. **Rebuild backend + frontend** (one rebuild only — that's the whole point of consolidating):
   ```bash
   docker compose -f docker/docker-compose.caddy.yml --env-file .env.deploy build backend frontend
   ```

   This takes ~5 min. Includes the React #310 fix, the ISSUE-034 fix, the M3 UniProt batch flow, every CR fix, every test that's in `main`.

8. **Bring up the full stack via the Caddy compose file:**
   ```bash
   docker compose -f docker/docker-compose.caddy.yml --env-file .env.deploy up -d
   docker compose -f docker/docker-compose.caddy.yml ps
   ```

   Six containers should be `Up (healthy)`: `pvl-backend`, `pvl-frontend`, `pvl-redis`, `pvl-celery-batch`, `pvl-celery-quick`, `pvl-caddy`.

9. **First-hit Caddy ACME** — hit the new domain so Caddy fetches the Let's Encrypt cert:
   ```bash
   curl -I https://pvl.cssb-hamburg.de/   # may fail the first time while ACME provisions
   sleep 30
   curl -I https://pvl.cssb-hamburg.de/   # second hit returns 200
   ```

   If it never resolves a cert, check Caddy logs:
   ```bash
   docker compose -f docker/docker-compose.caddy.yml logs caddy | tail -50
   ```
   Common gotcha: Alex's firewall wasn't actually opened for inbound 80 → Caddy can't do the HTTP-01 challenge.

10. **Generate the precompute artifacts on the new host:**
    ```bash
    docker compose -f docker/docker-compose.caddy.yml exec -T backend python scripts/precompute_dataset.py peleg_118
    docker compose -f docker/docker-compose.caddy.yml exec -T backend python scripts/precompute_dataset.py gold_standard
    ```
    Peleg-118 takes ~45 s; gold_standard takes ~15 min.

11. **Smoke test all endpoints** over HTTPS:
    ```bash
    curl -sS https://pvl.cssb-hamburg.de/api/health
    # {"ok":true}

    curl -sS -o /dev/null -w "precomputed=%{http_code} time=%{time_total}s\n" \
      https://pvl.cssb-hamburg.de/api/precomputed/peleg_118
    # precomputed=200 time=0.5s

    curl -sS -o /dev/null -w "predict=%{http_code} time=%{time_total}s\n" \
      -X POST -F "sequence=LKLLKLLLKLLLKLL" \
      https://pvl.cssb-hamburg.de/api/predict
    # predict=200 time=1.2s
    ```

12. **Open the new URL in a browser** and walk the manual verification checklist from `docs/active/HANDOVER_CHECKLIST.md` Phase 3. Click everything. The TLS padlock should be solid, the page should load, the demo should auto-load instantly.

### Phase 3 — Cut v1.0.0 (~10 min)

13. **Back on your Mac**, verify `CITATION.cff` version field:
    ```bash
    grep -E "^version|^date-released" CITATION.cff
    # version: "1.0.0"
    # date-released: "YYYY-MM-DD"  ← today's date
    ```

    If wrong, edit, commit, push, wait for CI.

14. **Cut the release:**
    ```bash
    gh release create v1.0.0 \
      --title "v1.0.0 — first stable release" \
      --notes-file docs/active/RELEASE_NOTES_v1.0.0.md \
      --target main
    ```

    Three workflows fire automatically:
    - **Zenodo via GitHub release tag** — mints the versioned DOI + concept DOI in ~2 min
    - **PyPI publish** — `pvl-cli` v0.1.0 + `pvl-mcp` v0.1.0 published in ~5 min
    - **GHCR publish** — `pvl-backend:1.0.0`, `pvl-backend:1.0`, `pvl-backend:latest` (and frontend) published in ~10 min

15. **Verify Zenodo minted the DOI:**
    ```bash
    open "https://zenodo.org/account/records"   # paste the new DOIs into CITATION.cff
    ```

16. **Wire the DOI back into CITATION.cff + README:**
    ```bash
    # CITATION.cff identifiers block — paste both DOIs
    # README.md — update the DOI badge URL from "mints on release" → the real one

    git add CITATION.cff README.md
    git commit -m "docs: wire Zenodo DOI for v1.0.0 (concept + versioned)"
    git push origin main
    ```

17. **Smoke test the README badge row** — every badge should be live + clickable:
    - CI ✅
    - License: MIT ✅
    - Version v1.0.0 ✅
    - DOI ✅ (live with the Zenodo DOI)
    - Status ✅
    - PRs welcome ✅
    - CodeQL ✅

### Phase 4 — Hand-over (~5 min)

18. **Email Peleg + Alex**:
    - Use the templates in `docs/internal/EMAIL_PELEG_FINAL.md` + `EMAIL_ALEX_FINAL.md`
    - Replace the URL placeholders with `https://pvl.cssb-hamburg.de/`
    - Add the Zenodo DOI badge link
    - Send

19. **Update `docs/active/HANDOVER_CHECKLIST.md`** — tick every Phase 1–3 box.

20. **Submit to bio.tools** — paste-ready fields in `docs/active/PUBLICATION_PATH.md` §4. ~20 min on bio.tools.

21. **Submit to JOSS** — paste the Zenodo concept DOI into `paper/paper.md` `archive_doi:`, then submit at https://joss.theoj.org/papers/new. ~1 hr.

The hand-over is complete.

---

## Troubleshooting

### Caddy can't get a cert
- Most common: Alex's firewall hasn't opened TCP 80. ACME HTTP-01 challenge needs port 80 inbound from the public internet.
- Less common: DNS hasn't propagated yet. `dig pvl.cssb-hamburg.de +short` should return the VM's public IP.
- Rare: the rate limit on Let's Encrypt's staging API. Switch to staging temporarily by adding `acme_ca https://acme-staging-v02.api.letsencrypt.org/directory` to the global block in `Caddyfile`, redeploy, get a staging cert, then remove the line and let production ACME issue a real cert.

### Precompute fails on the new host
- Re-read `docs/active/KNOWN_ISSUES.md` ISSUE-034. The fix is shipped via `force_recompute=True` + `bypass_tango_budget=True` in `scripts/precompute_dataset.py`. If the artifact ships with empty `tangoAggCurve`, the runtime hit the same lock; re-run.

### v1.0.0 tag triggers but Zenodo doesn't mint
- Zenodo's GitHub integration needs to be enabled per repo (one-time). `https://zenodo.org/account/settings/github/` → toggle `peptide_prediction` to ON. After the toggle, re-trigger the release: `gh release delete v1.0.0 && gh release create v1.0.0 ...`.

### Backend container won't start after rebuild
- TANGO binary path mismatch. The bundled XLSX path in `precompute_dataset.py` assumes `backend/data/reference_datasets/staphylococcus_2023.xlsx`. Confirm it copied into the image: `docker compose exec backend ls -la /app/data/reference_datasets/`.

### docker compose up has container name conflicts
- Stale containers from a partial prior run. Force-clean: `docker compose -f docker/docker-compose.caddy.yml down && docker rm -f $(docker ps -aq --filter "name=pvl-")`. Then `up -d` again.

---

## Why one deploy not iterative

Every iterative re-deploy on a research project burns precious time on:
- Researchers asking "is it back?" mid-deploy
- Bookmarked URLs that work, then don't, then work again
- Caddy re-provisioning certs each rebuild (Let's Encrypt rate-limits us if we abuse it)
- Container churn that confuses Sentry release tagging
- Lost focus while waiting for builds

The destination state is HTTPS-on-DESY-domain + v1.0.0 + Zenodo DOI. There's no partial state in between worth shipping. Wait until all 5 prerequisites at the top are true, then do this runbook once.

---

## Cross-references

- `docs/active/DEPLOYMENT.md` — the general deploy guide (this runbook is the special one-shot version)
- `docs/active/HANDOVER_CHECKLIST.md` — the broader hand-over tick-list
- `docs/active/PUBLICATION_PATH.md` — Zenodo + bio.tools + JOSS narrative
- `docs/active/PRODUCTION_LOCKDOWN.md` — security hardening checklist
- `docs/internal/EMAIL_PELEG_FINAL.md` + `EMAIL_ALEX_FINAL.md` — emails to send when hand-over closes
- `docker/Caddyfile` — the production Caddy config; every block annotated with rationale
