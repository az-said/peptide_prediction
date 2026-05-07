# Sentry Production Runbook — PVL

## Overview

PVL uses Sentry for frontend (React) and backend (FastAPI) error tracking, performance monitoring, and session replay.

**Organization**: `pvl`
**Projects**: `pvl-frontend` (React), `pvl-backend` (FastAPI)
**Environment tags**: `development`, `staging`, `production`

---

## S1 — Source Maps in CI

### Vite Plugin Setup

The `@sentry/vite-plugin` uploads source maps during production builds.

**vite.config.ts** — add to plugins array:

```typescript
import { sentryVitePlugin } from "@sentry/vite-plugin";

// In plugins array (production only):
...(mode === "production" ? [
  sentryVitePlugin({
    org: process.env.SENTRY_ORG || "pvl",
    project: process.env.SENTRY_PROJECT || "pvl-frontend",
    authToken: process.env.SENTRY_AUTH_TOKEN,
    sourcemaps: {
      filesToDeleteAfterUpload: ["./dist/**/*.map"],
    },
  }),
] : []),
```

### GitHub Secrets Required

| Secret | Description |
|--------|-------------|
| `SENTRY_AUTH_TOKEN` | Organization-level auth token with `project:releases` + `org:read` scopes |
| `SENTRY_ORG` | `pvl` |
| `SENTRY_PROJECT` | `pvl-frontend` |

### CI Workflow Changes

In `.github/workflows/*.yml`, inject the token:

```yaml
env:
  SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
  SENTRY_ORG: pvl
  SENTRY_PROJECT: pvl-frontend
```

---

## S2 — Release Tagging

### Format

Both frontend and backend use the same release format:

```
pvl@{VERSION}-{BUILD_SHA}
```

### Frontend

In `main.tsx`:

```typescript
import { buildSentryRelease } from "@/lib/sentryContext";

Sentry.init({
  release: buildSentryRelease(
    (typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "0.0.0"),
    (typeof __BUILD_SHA__ !== "undefined" ? __BUILD_SHA__ : undefined),
  ),
  // ...
});
```

### Backend

In `backend/api/main.py` (already configured):

```python
release = settings.SENTRY_RELEASE or f"pvl@{settings.VERSION}-{settings.BUILD_SHA or 'dev'}"
```

### Auto-Resolve

Configure in Sentry dashboard: **Settings → General → Auto Resolve** → "Resolved in the next release" or "Resolved after 3 releases".

---

## S3 — Rich Context

### Context Wrapper (`ui/src/lib/sentryContext.ts`)

Exposes:

| Function | When to Call |
|----------|-------------|
| `initSentrySession()` | App.tsx boot — sets anonymous user ID |
| `setPVLSentryContext(opts)` | After dataset load, theme change, preset change |
| `clearPVLSentryContext()` | After dataset reset |
| `buildSentryRelease(version, sha)` | main.tsx init |

### Context Fields

| Field | Sentry Type | Values |
|-------|-------------|--------|
| `peptide_count` | Context | number |
| `predictors` | Context | "tango, s4pred" |
| `data_source` | Tag + Context | demo / quick / csv / fasta / uniprot |
| `dataset_size` | Tag | small / medium / large |
| `threshold_preset` | Tag + Context | original / strict / exploratory / custom |
| `viewport` | Context | mobile / tablet / desktop |
| `theme` | Context | light / dark |

### Anonymous User ID

Generated via `crypto.randomUUID()`, stored in `localStorage.pvl-session-id`. Set as `Sentry.setUser({ id })`. No PII.

---

## S4 — Backend FastAPI Integration

Already configured in `backend/api/main.py`:

- `FastApiIntegration()` — auto-captures 5xx errors
- `LoggingIntegration()` — captures WARNING+ log entries
- `before_send` filter drops expected `HTTPException` (4xx contract errors)
- trace_id middleware sets `sentry_sdk.set_tag("trace_id", trace_id)` for cross-linking

### Adding trace_id tag

In the `TraceIDMiddleware.dispatch()` method:

```python
sentry_sdk.set_tag("trace_id", trace_id)
```

This links frontend and backend events by the same trace_id header.

---

## S5 — Slack Webhook (Manual Config by Said)

1. Go to **Sentry → Settings → Integrations → Slack**
2. Add PVL workspace
3. Create notification rules:
   - **Critical**: P0 errors (unhandled exceptions) → `#pvl-alerts`
   - **Digest**: Weekly summary → `#pvl-engineering`

---

## S6 — Alert Rules (Manual Config by Said)

Recommended rules:

| Rule | Condition | Action |
|------|-----------|--------|
| **New issue** | First occurrence of new issue | Slack + email |
| **Regression** | Issue marked resolved but reoccurred | Slack + email |
| **Spike** | Error count > 50 in 1 hour | Slack critical |
| **Slow API** | Transaction p95 > 10s | Slack warning |

---

## S7 — Replay Tuning

In `main.tsx`, update `replayIntegration()`:

```typescript
Sentry.replayIntegration({
  maskAllText: false,
  blockAllMedia: false,
  // Only capture API request/response details for PVL-relevant routes
  networkDetailAllowUrls: [
    /api\/predict/,
    /api\/upload/,
    /api\/search/,
    /api\/jobs/,
  ],
  // Mask sensitive inputs
  networkRequestHeaders: ["X-Trace-ID"],
  networkResponseHeaders: ["X-Trace-ID"],
}),
```

Additionally, add `data-sentry-mask` to sequence input fields:

```html
<textarea name="sequence" data-sentry-mask ... />
```

---

## S10 — SDK Upgrade

### Frontend

```bash
cd ui && npm install @sentry/react@latest @sentry/vite-plugin@latest
```

Verify no breaking changes (v8+ has new API surface).

### Backend

```bash
pip install --upgrade sentry-sdk[fastapi]
```

Verify `sentry_sdk >= 2.x`.

---

## Common Error Fingerprints

| Fingerprint Pattern | Meaning | Action |
|--------------------|---------|--------|
| `TANGO binary not found` | TANGO not installed on host | Check Docker build |
| `S4PRED timeout` | S4PRED model download hung | Restart container |
| `uploadCSV 413` | File too large | Expected, ignore |
| `fetchAlphaFoldEntry 404` | Unknown UniProt ID | Expected, ignore |
| `ChunkLoadError` | Stale JS after deploy | Expected, auto-resolves |

---

## Quarterly Review Checklist

- [ ] Verify source maps are uploading (check Sentry release artifacts)
- [ ] Review error volume trends — are new features creating new classes?
- [ ] Check replay quota usage (free tier: limited replays/month)
- [ ] Audit `before_send` filter — are we dropping events we shouldn't?
- [ ] Review alert rules — are they still relevant?
- [ ] Check SDK versions — upgrade if > 2 minor versions behind
- [ ] Verify trace_id linking between frontend and backend events
- [ ] Review custom context — are new features adding their context?
