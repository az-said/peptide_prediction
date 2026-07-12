# Runbook — DESY VM SSH lost

**Severity**: SEV3 (does not affect the Hetzner production deployment)
**Typical detection**: Alex or Said cannot SSH to `landau-webapp-dev` through the max-display jump host
**Runtime impact**: DESY VM cannot be provisioned or updated; Hetzner production continues to serve users

---

## Symptom

- `ssh -l root landau-webapp-dev` fails after `ssh azaizahs@max-display.desy.de` and `kinit`
- Kerberos error: `krb5_get_credentials()` failed
- Or: SSH times out with no message
- Or: authorized_keys was overwritten by a DESY IT reset

---

## Verify

Step through the three-hop chain (from `memory/reference_ssh_access.md`):

```bash
# On your Mac:
ssh azaizahs@max-display.desy.de
# Then on max-display:
kinit
# Enter the Kerberos password when prompted
klist    # verify the ticket is present
ssh -l root landau-webapp-dev
```

If step 1 fails: DESY jump-host is down (rare; escalate to DESY IT).
If `kinit` fails: password wrong / Kerberos realm changed (escalate to DESY IT).
If step 3 fails after successful `kinit`: authorized_keys or firewall issue on the VM.

---

## Escalate

- DESY IT — for jump-host, Kerberos, or VM-firewall issues (email `helpdesk@desy.de` or the CSSB-IT contact)
- Alex — if he set up the VM initially, he can re-run the bootstrap

---

## Rollback / Mitigate

1. **Ticket renewal** — if `klist` shows an expired ticket:
   ```bash
   kdestroy
   kinit
   klist
   ```

2. **authorized_keys reset** — if step 3 fails specifically with "Permission denied (publickey)", DESY IT may have wiped root's SSH keys during a maintenance window. Ask DESY IT to re-add your public key (from `~/.ssh/id_ed25519.pub` on your Mac).

3. **VM inaccessible** — if the VM itself is unreachable (rather than SSH-specific), ask DESY IT to check its status; the CSSB VM pool has occasional maintenance.

4. **Nothing works** — the Hetzner deployment is production. Continue serving users from Hetzner. The DESY VM migration remains pending; document the outage in `docs/active/DEPLOYMENT.md` § "DESY VM status" for the next reader.

---

## Post-incident

- No postmortem required (SEV3)
- If access issues recur: escalate through Alex to a stable named DESY-IT contact
- Update `memory/reference_ssh_access.md` if the SSH chain has changed (Kerberos realm, jump-host DNS)

---

## Related

- `memory/reference_ssh_access.md` (in Claude memory — not in the repo)
- `scripts/desy_vm_bootstrap.sh` — the bootstrap script
- `docs/active/DEPLOYMENT.md` — DESY VM configuration
- `memory/project_desy_vm_access.md` — the "we're waiting on DESY IT" status
