# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

## Maestro E2E Testing

### Prerequisites

- Install Maestro CLI: `curl -Ls "https://get.maestro.mobile.dev" | bash`
- Android Emulator or iOS Simulator running locally
- Local Supabase instance (for `local` env) or access to staging Supabase

### Setup

E2E test infrastructure lives under `apps/mobile/`:
- `maestro/` — Flow definitions (auth, family, nurse, admin suites)
- `maestro/shared/` — Reusable helper flows (setup, teardown, loginAs, logout)
- `maestro/.env.maestro` — Environment variable templates
- `maestro/config.yaml` — Maestro flow discovery paths
- `scripts/seed-e2e.mjs` — Creates deterministic test accounts via Supabase Admin API
- `scripts/cleanup-e2e.mjs` — Deletes all e2e-test-* records
- `scripts/run-maestro.ps1` — Orchestrator script (seed → test → cleanup)

### Running locally

```powershell
# Full run (seed → all flows → cleanup) against local dev
.\scripts\run-maestro.ps1 -Env local

# Run a specific flow directory
.\scripts\run-maestro.ps1 -Env local -Flows "maestro/auth/"

# Manual steps (if you prefer):
node scripts/seed-e2e.mjs
maestro test maestro/
node scripts/cleanup-e2e.mjs
```

### Required env vars (set in `.env.maestro` or CI secrets)

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (admin API) |
| `TEST_EMAIL_PREFIX` | Prefix for test accounts (default: e2e-test) |
| `TEST_PASSWORD` | Shared password for test accounts |

### GitHub Actions CI

The `maestro-e2e` workflow (`.github/workflows/maestro-e2e.yml`) runs on:
- `workflow_dispatch` — manual trigger with environment selection
- `pull_request` — auto-triggered on mobile/maestro changes

It requires these GitHub Actions secrets:
| Secret | Description |
|--------|-------------|
| `EXPO_TOKEN` | Expo access token for EAS Build |
| `SUPABASE_URL_STAGING` | Staging Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Staging service role key |

### EAS Build profile

`eas.json` includes a `preview` profile that builds a debug APK for E2E testing:
```bash
eas build -p android --profile preview --local
```
