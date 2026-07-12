# Security policy

Thank you for taking the time to help make PePFibPred more secure.

## Reporting a vulnerability

**Do not open a public GitHub issue for a security vulnerability.**

Instead, report privately to:

- **Primary contact**: Said Azaizah — `said.azaizah@cssb-hamburg.de` (DESY-CSSB)
- **Secondary contact**: Aleksandr Golubev — `aleksandr.golubev@cssb-hamburg.de` (DESY-CSSB)
- **GitHub Security Advisories**: <https://github.com/az-said/peptide_prediction/security/advisories/new>

Please include:
1. A description of the vulnerability
2. Steps to reproduce (a minimal proof-of-concept is ideal)
3. The affected version(s)
4. Any suggested mitigations you already know
5. Whether you plan to disclose publicly and on what timeline

We commit to:
- Acknowledging your report within **3 business days**
- A working fix in the codebase for **Critical** issues within **48 hours** of confirmation
- A working fix for **High** issues within **7 days**
- A working fix for **Medium / Low** issues within **30 days** or the next planned release, whichever is sooner
- A public advisory + credit (unless you prefer anonymity) once the fix ships

## Supported versions

| Version | Status |
|---|---|
| v1.x | ✅ Actively supported |
| v0.3.x | 🟡 Security fixes only until v1.1 is cut |
| v0.2.x and earlier | ❌ No longer supported |

## Scope

**In scope**
- The `pvl` backend (`backend/`) and its FastAPI HTTP surface
- The `pvl-cli` Python package published to PyPI
- The `pvl-mcp` Model Context Protocol server published to PyPI
- The container images published to `ghcr.io/az-said/peptide_prediction`
- The reference deployment at the current production hostname

**Out of scope**
- Vulnerabilities in third-party dependencies for which no PePFibPred configuration is exploitable (report to the upstream)
- Vulnerabilities in TANGO or S4PRED themselves that are not exploitable through PePFibPred's exposed surfaces
- Denial-of-service via unbounded input at the /api/predict/batch route beyond the 30-req/min/IP rate limit (this is a known-and-documented rate-limiting boundary, not a vulnerability)

## Supply-chain posture

PePFibPred is built with the following supply-chain controls:
- **Dependabot** — weekly grouped updates across pip, npm, GitHub Actions, and Docker (`.github/dependabot.yml`)
- **CodeQL** — `security-extended` queries run on every pull request and on a weekly cron (`.github/workflows/codeql.yml`)
- **Trusted Publishing** — PyPI OIDC / OpenID-Connect for `pvl-cli` and `pvl-mcp` (`.github/workflows/publish-pypi.yml`) — no long-lived credentials leave the GitHub Actions environment
- **Build provenance attestations** — SLSA Build Level 2 for both container images (`actions/attest-build-provenance@v4` in `.github/workflows/docker-publish.yml`)
- **Secret scanning + push protection** — GitHub-native, enabled at the org level
- **Vulnerability alerts** — GitHub Advisory Database → Dependabot alerts, enabled

## Cryptographic assurances

The `pvl` cache uses SHA-256 (truncated to 128 bits) as a *sequence-normalisation key* for deterministic per-predictor caching. It is not intended as a cryptographic authenticity check.

The Sentry release integration signs source maps at upload time. TLS is terminated by Caddy 2 with automatic Let's Encrypt certificate rotation.

## Credits

Security researchers who responsibly disclose vulnerabilities will be credited by name in the security advisory unless anonymity is requested.
