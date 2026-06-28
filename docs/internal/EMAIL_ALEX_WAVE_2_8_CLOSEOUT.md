# Email — Alex, Wave 2.8 close-out + DESY infra ask

To: alex.golubev@cssb-hamburg.de
Cc: peleg.ragonis-bachar@... (Technion)
Subject: PVL is wrap-up-ready — three asks from DESY infra side

Hi Alex,

PVL Wave 2.8 + 2.9 is feature-complete, tested, and merged to main. The Hetzner VPS at `94.130.178.182:3000` is running the new build and stable.

Three things from your side would close out the production story:

1. **DNS + TLS cert for `landau-webapp-dev`** (131.169.4.163). The bootstrap script is at `scripts/desy_vm_bootstrap.sh` — give me a hostname I can point Caddy at and I'll finish the DESY-side deploy in one session.

2. **DESY K8s namespace + Ingress** when DESY IT is ready. We can keep running on the VM in the meantime, but K8s is the right long-term home. `docs/active/DEPLOYMENT.md` §"K8s plan" has the manifest skeleton — needs a namespace, Ingress controller, and resource quotas from DESY IT.

3. **GitLab mirror** for the DESY-side fork. Automated mirror from `github.com/saidaz24-meet/peptide_prediction` so the DESY GitLab stays in sync without manual pushes.

Everything else is wired and running:
- **Sentry** (DSN in vault, runbook at `docs/active/SENTRY_RUNBOOK.md`)
- **CI** (GitHub Actions; backend pytest + frontend vitest + Docker Build, all green)
- **Backups** (image rebuild on every push; data volumes documented)
- **Perf instrumentation** (stage timers wired into the predict route, surfaced in Sentry)
- **Pre-push hook** to catch lint failures before they hit CI (no more email noise)

The handbook for the next developer is being produced in parallel by a dedicated Opus 4.8 documentation pass (Wave 1 just landed at `docs/handbook/`). When it's done, the on-ramp for any new collaborator is **one file**: `docs/handbook/humans/00_what_is_pvl.md`.

For your awareness: the Peleg-118 fibril-forming dataset is now bundled with the repo and surfaces in the UI as a one-click "Compare current dataset vs fibril-forming peptides (118)" chip on `/compare`. It's the positive-control set we cite in the paper.

If there's anything DESY needs from me to push this through CSSB infra review, let me know what's missing and I'll prepare the doc.

Said


---

## Notes (not part of email)

Verification we'd want before declaring DESY production ready:
- DNS resolves to the VM
- HTTPS works (Caddy auto-provisions LE cert)
- `make precompute-datasets` runs successfully on the VM (the M2 deploy task)
- A representative load test (1k peptides through the API) completes under 90 s

Reference docs Alex may want:
- `docs/active/DEPLOYMENT.md` — current + planned deploy paths
- `docs/active/SENTRY_RUNBOOK.md` — observability
- `docs/active/HOSTING_MAP.md` — what each box is for
- `scripts/desy_vm_bootstrap.sh` — the bootstrap script that needs his SSH approval
