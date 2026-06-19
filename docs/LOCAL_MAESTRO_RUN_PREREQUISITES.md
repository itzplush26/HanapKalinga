# Maestro E2E Testing — Local Setup Guide

> **Target:** Windows (your dev machine)
> **Last updated:** June 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites Checklist](#prerequisites-checklist)
3. [Step 1: Install Maestro CLI](#step-1-install-maestro-cli)
4. [Step 2: Set Up Android Emulator](#step-2-set-up-android-emulator)
5. [Step 3: Install the App on Emulator](#step-3-install-the-app-on-emulator)
6. [Step 4: Configure Environment Variables](#step-4-configure-environment-variables)
7. [Step 5: Run Maestro Tests Locally](#step-5-run-maestro-tests-locally)
8. [Running Specific Tests](#running-specific-tests)
9. [Troubleshooting Common Issues](#troubleshooting-common-issues)
10. [Workflow — When to Run Locally vs CI](#workflow--when-to-run-locally-vs-ci)

---

## Overview

Maestro E2E tests simulate real user interactions on the NurseLink mobile app. Tests are written as YAML flow files under `apps/mobile/maestro/` and can be run against:

- **Local Supabase** — fastest, isolated, no network needed
- **Staging Supabase** — uses the real staging backend

You can run tests on your local machine for fast iteration, or let GitHub Actions run them in CI when you push.

---

## Prerequisites Checklist

Before you start, make sure you have these installed:

| Tool | Required for | Check with |
|------|-------------|------------|
| ✅ Node.js 22+ | Running the app + seed scripts | `node --version` |
| ✅ npm | Installing dependencies | `npm --version` |
| ✅ Android Studio | Creating and running emulators | Check Start Menu |
| ✅ Java 17+ | Android build tools | `java --version` |
| ✅ ADB (Android Debug Bridge) | Connecting to emulator | `adb --version` |
| ✅ Git Bash or WSL | Running shell scripts | `bash --version` |

---

## Step 1: Install Maestro CLI

Open **Git Bash** (not cmd, not PowerShell) and run:

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

**Verify it installed:**
```bash
export PATH="$HOME/.maestro/bin:$PATH"
maestro --version
```

You should see a version number (e.g., `1.39.3`).

> **Note:** You'll need to add `$HOME/.maestro/bin` to your PATH permanently.
> In Git Bash, add this to `~/.bashrc`:
> ```bash
> echo 'export PATH="$HOME/.maestro/bin:$PATH"' >> ~/.bashrc
> source ~/.bashrc
> ```

---

## Step 2: Set Up Android Emulator

### Create the emulator (one-time)

Open **Android Studio** → **Device Manager** → **Create Device**:

- **Device:** Pixel 6
- **System Image:** API 34 (Android 14), x86_64, with Google APIs
- **AVD Name:** `Pixel_6`

Or using the command line:

```bash
avdmanager create avd -n Pixel_6 \
  -k "system-images;android-34;google_apis;x86_64" \
  -d pixel_6
```

> **Why Pixel 6 + API 34?** This matches what GitHub Actions CI uses. Using the same configuration ensures tests behave consistently.

### Start the emulator

```bash
emulator -avd Pixel_6 -no-snapshot-load -no-boot-anim -gpu swiftshader_indirect
```

> **Keep this terminal window open.** Minimize but don't close it.

### Verify the emulator is connected

Open a **second** Git Bash window and run:

```bash
adb devices
```

Expected output:
```
List of devices attached
emulator-5554   device
```

---

## Step 3: Install the App on Emulator

From the project root (`NurseLink/`):

```bash
cd apps/mobile
npm run android
```

This will build and install the app on your running emulator. Wait for it to finish — the emulator should show the NurseLink app.

**Verify:**
```bash
adb shell pm list packages | grep hanapkalinga
```

You should see: `package:com.hanapkalinga.mobile`

---

## Step 4: Configure Environment Variables

The file `apps/mobile/maestro/.env.maestro` contains environment templates. For local testing, make sure it has:

```
ENV=local
APP_ID_LOCAL=host.exp.Exponent
APP_ID_STAGING=com.hanapkalinga.mobile
SUPABASE_URL_LOCAL=http://localhost:54321
SUPABASE_URL_STAGING=https://urdfufklvspnpllotvkn.supabase.co
TEST_EMAIL_PREFIX=e2e-test
TEST_PASSWORD=TestPass123!
```

If you're testing against **staging**, you need these **environment variables** set:
```
SUPABASE_URL=https://urdfufklvspnpllotvkn.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

> ⚠️ **Do NOT commit** the service role key. It's already in GitHub Secrets for CI.

---

## Step 5: Run Maestro Tests Locally

### Option A: PowerShell runner (recommended — handles everything)

This script handles: seed data → run tests → cleanup data.

```powershell
cd apps/mobile
.\scripts\run-maestro.ps1 -Env local
```

For a single shard:
```powershell
.\scripts\run-maestro.ps1 -Env local -Flows "maestro/auth/"
```

> ⚠️ **Windows note:** If you get a security error from PowerShell, run:
> ```powershell
> Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
> ```
> Then try again.

### Option B: Batch script (quick, manual)

```cmd
cd apps\mobile
scripts\test-maestro-local.bat auth
```

This runs the `auth` shard against staging. It assumes:
- Emulator is already running
- App is already installed
- Seed data already exists (run `node scripts/seed-e2e.mjs` first)

### Option C: Direct Maestro CLI (most flexible)

```bash
cd apps/mobile

# Run a single test
maestro test maestro/auth/login-success.yaml \
  --env APP_ID=com.hanapkalinga.mobile \
  --env ENV=staging \
  --env TEST_EMAIL="e2e-test-family-12345@example.com" \
  --env TEST_PASSWORD="TestPass123!"

# Run an entire shard
maestro test maestro/auth/ \
  --env APP_ID=com.hanapkalinga.mobile \
  --env ENV=staging \
  --env TEST_EMAIL="e2e-test-family-12345@example.com" \
  --env TEST_PASSWORD="TestPass123!"

# Run all tests (full regression)
maestro test maestro/ \
  --env APP_ID=com.hanapkalinga.mobile \
  --env ENV=staging
```

---

## Running Specific Tests

| You want to... | Command |
|---------------|---------|
| Run auth tests only | `maestro test maestro/auth/ --env ...` |
| Run a single test | `maestro test maestro/auth/login-success.yaml --env ...` |
| Run with debug output | `maestro test maestro/auth/login-success.yaml --debug-output` |
| See what Maestro sees | `export MAESTRO_CLI_DEBUG=true` then run test |
| View recorded screenshots | Look in `~/.maestro/tests/` after a run |

---

## Troubleshooting Common Issues

### "maestro: command not found"

**Fix:** Add Maestro to your PATH:
```bash
export PATH="$HOME/.maestro/bin:$PATH"
# Make permanent:
echo 'export PATH="$HOME/.maestro/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### "adb: command not found"

**Fix:** Add Android SDK platform-tools to PATH:
```bash
export PATH="$PATH:$HOME/AppData/Local/Android/Sdk/platform-tools"
# Or wherever your Android SDK is installed
```

### "Error: Could not find device"

**Fix:** Make sure your emulator is running and visible via `adb devices`. If not:
1. Close and restart the emulator
2. Run `adb kill-server && adb start-server`
3. Run `adb devices` again

### Tests pass but show "NO PROCESS FOUND" in diagnostic

**Fix:** This is the emulator pre-warming check. It's non-fatal — the tests should still work. If tests fail with missing element errors, the app may be crashing. Check logcat output.

### "Session persists between tests"

**Root cause:** Expo SecureStore doesn't clear between test runs.
**Fix:** The CI workflow runs `adb shell pm clear com.hanapkalinga.mobile` before tests. Locally, you can also clear app data via Settings → Apps → HanapKalinga → Clear Data.

---

## Workflow — When to Run Locally vs CI

```
You write/modify a test
        │
        ▼
  Run locally (fast, ~30s per test)
        │
        ├── ✅ Passes? ──> Commit & Push
        │                     │
        │                     ▼
        │               CI runs (4 shards parallel)
        │                     │
        │                     ├── ✅ All green? ──> PR ready
        │                     │
        │                     └── ❌ Fails? ──> Check maestro-summary job
        │                                        for consolidated failure report
        │
        └── ❌ Fails? ──> Debug locally
                              │
                              ▼
                      Fix test, re-run locally
```

**Rule of thumb:** If your test takes more than 2 local iterations to pass, you're better off debugging locally. CI is for verification, not debugging.

---

## Files Reference

| File | Purpose |
|------|---------|
| `apps/mobile/maestro/*.yaml` | Maestro test flow files |
| `apps/mobile/maestro/shared/` | Reusable helper flows (setup, login, logout) |
| `apps/mobile/maestro/.env.maestro` | Environment variable templates |
| `apps/mobile/scripts/seed-e2e.mjs` | Creates test accounts and sample data |
| `apps/mobile/scripts/cleanup-e2e.mjs` | Deletes test data after run |
| `apps/mobile/scripts/run-maestro.ps1` | Full orchestrator (seed → test → cleanup) |
| `apps/mobile/scripts/run-maestro-shard.sh` | Runs a single shard with failure tracking |
| `apps/mobile/scripts/consolidate-maestro-summary.sh` | Aggregates all shard results into one report |
| `.github/workflows/maestro-e2e.yml` | CI workflow definition |

---

## Need Help?

- Check `apps/mobile/maestro/TROUBLESHOOTING.md` for known issues
- Check `docs/MAESTRO_E2E_FIXES.md` for past fixes
- Ask in #mobile-dev Slack
