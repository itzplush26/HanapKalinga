<#
.SYNOPSIS
  Run Maestro E2E tests with seed data setup and cleanup.

.DESCRIPTION
  Orchestrates: seed Supabase → capture seed IDs → run Maestro flows per role shard → cleanup.
  Each role shard (auth+family, nurse, admin) runs with its own test account email.
  Seed IDs (NURSE_ID, BOOKING_ID, VERIFICATION_ID) are automatically captured and passed to Maestro.

.PARAMETER Env
  Target environment: "local" or "staging" (default: local).

.PARAMETER Flows
  Optional: specific flow paths to run (e.g. "maestro/auth/login-success.yaml").
  When set, runs just those flows with the family test account email.
  When omitted, runs all 3 role shards sequentially.

.PARAMETER SkipCleanup
  Skip cleanup after test run.

.PARAMETER SkipSeed
  Skip seeding before test run.

.EXAMPLE
  .\scripts\run-maestro.ps1 -Env local
  .\scripts\run-maestro.ps1 -Env staging -Flows "maestro/family/"
  .\scripts\run-maestro.ps1 -Env local -SkipSeed
#>

param(
  [ValidateSet("local", "staging")]
  [string]$Env = "local",
  [string]$Flows = "",
  [switch]$SkipCleanup,
  [switch]$SkipSeed
)

$ErrorActionPreference = "Stop"
$MobileDir = Split-Path -Parent $PSScriptRoot
Push-Location $MobileDir

# Source environment variables from .env.maestro
$EnvFile = Join-Path $MobileDir "maestro/.env.maestro"
if (Test-Path $EnvFile) {
  Get-Content $EnvFile | ForEach-Object {
    if ($_ -match "^(.*?)=(.*)$") {
      $name = $matches[1].Trim()
      $value = $matches[2].Trim()
      if (-not [string]::IsNullOrEmpty($value)) {
        Set-Item -Path "env:$name" -Value $value
      }
    }
  }
}

# Determine env-specific Supabase URL, service role key, and app ID
if ($Env -eq "local") {
  $env:SUPABASE_URL = $env:SUPABASE_URL_LOCAL
  $env:SUPABASE_SERVICE_ROLE_KEY = $env:SUPABASE_SERVICE_ROLE_KEY_LOCAL
  $env:APP_ID = $env:APP_ID_LOCAL
} else {
  $env:SUPABASE_URL = $env:SUPABASE_URL_STAGING
  $env:SUPABASE_SERVICE_ROLE_KEY = $env:SUPABASE_SERVICE_ROLE_KEY_STAGING
  $env:APP_ID = $env:APP_ID_STAGING
}

$env:ENV = $Env
$env:TEST_EMAIL_PREFIX = "e2e-test"

# Validate required env
if (-not $env:SUPABASE_URL) {
  Write-Error "SUPABASE_URL is not set. Check .env.maestro or SUPABASE_URL_LOCAL / SUPABASE_URL_STAGING env vars."
  Pop-Location; exit 1
}
if (-not $env:SUPABASE_SERVICE_ROLE_KEY) {
  Write-Error "SUPABASE_SERVICE_ROLE_KEY is not set. Add SUPABASE_SERVICE_ROLE_KEY_LOCAL (for local) or SUPABASE_SERVICE_ROLE_KEY_STAGING (for staging) to maestro/.env.maestro."
  Pop-Location; exit 1
}
if (-not $env:APP_ID) {
  Write-Error "APP_ID is not set. Check .env.maestro or APP_ID_LOCAL / APP_ID_STAGING env vars."
  Pop-Location; exit 1
}

Write-Host "=== Maestro E2E Test Runner ===" -ForegroundColor Cyan
Write-Host "Environment: $Env"
Write-Host "APP_ID: $env:APP_ID"
Write-Host ""

# =============================================
# Step 1: Seed test data and capture output
# =============================================
$SEED = @{}  # Hash table: parsed key=value pairs from seed script

if (-not $SkipSeed) {
  Write-Host ">>> Seeding test data..." -ForegroundColor Yellow

  # Capture stdout (and redirect stderr to stdout so we see errors)
  $seedOutput = node scripts/seed-e2e.mjs 2>&1

  if ($LASTEXITCODE -ne 0) {
    Write-Host $seedOutput -ForegroundColor Red
    Write-Error "Seed failed. Aborting."
    Pop-Location
    exit 1
  }

  # Parse the "--- E2E Test Accounts ---" section for KEY=VALUE lines
  $inAccounts = $false
  $seedOutput | ForEach-Object {
    $line = $_.ToString()
    if ($line -match "^--- E2E Test Accounts ---$") { $inAccounts = $true; return }
    if ($inAccounts -and $line -match "^--- End ---$") { $inAccounts = $false; return }
    if ($inAccounts -and $line -match "^([A-Z_]+)=(.+)$") {
      $SEED[$matches[1]] = $matches[2].Trim()
    }
  }

  Write-Host "Seed complete." -ForegroundColor Green
  if ($SEED.Count -gt 0) {
    Write-Host "  Family: $($SEED['FAMILY_EMAIL'])"
    Write-Host "  Nurse:  $($SEED['NURSE_EMAIL'])"
    Write-Host "  Admin:  $($SEED['ADMIN_EMAIL'])"
    Write-Host "  IDs:    NURSE_ID=$($SEED['NURSE_ID']) BOOKING_ID=$($SEED['BOOKING_ID']) VERIFICATION_ID=$($SEED['VERIFICATION_ID'])"
  }
  Write-Host ""
} else {
  Write-Host ">>> Skipping seed (use -SkipSeed)." -ForegroundColor Yellow
  Write-Host ""
}

# =============================================
# Step 2: Build Maestro env args
# =============================================

function Get-CommonEnv {
  # Generate unique registration emails (Maestro has no built-in ${RANDOM} variable)
  $registerTs = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
  $registerEmailFamily = "e2e-test-family-$registerTs@example.com"
  $registerEmailNurse = "e2e-test-nurse-$registerTs@example.com"

  $argsList = @(
    "--env", "APP_ID=$env:APP_ID",
    "--env", "ENV=$Env",
    "--env", "TEST_EMAIL_PREFIX=$env:TEST_EMAIL_PREFIX",
    "--env", "REGISTER_EMAIL_FAMILY=$registerEmailFamily",
    "--env", "REGISTER_EMAIL_NURSE=$registerEmailNurse"
  )
  if ($SEED['PASSWORD']) {
    $argsList += "--env"; $argsList += "TEST_PASSWORD=$($SEED['PASSWORD'])"
  }
  if ($SEED['NURSE_ID']) {
    $argsList += "--env"; $argsList += "NURSE_ID=$($SEED['NURSE_ID'])"
  }
  if ($SEED['BOOKING_ID']) {
    $argsList += "--env"; $argsList += "BOOKING_ID=$($SEED['BOOKING_ID'])"
  }
  if ($SEED['VERIFICATION_ID']) {
    $argsList += "--env"; $argsList += "VERIFICATION_ID=$($SEED['VERIFICATION_ID'])"
  }
  return $argsList
}

$SHARD_RESULTS = @{}  # shard name → $true (pass) / $false (fail)

function Run-Shard($name, $paths, $testEmail) {
  if (-not $testEmail) {
    Write-Host ">>> [$name] Skipped (no test email available)." -ForegroundColor DarkYellow
    $SHARD_RESULTS[$name] = $true  # Not a failure, just skipped
    return
  }
  Write-Host ">>> [$name] Running flows with email: $testEmail" -ForegroundColor Yellow
  $envArgs = Get-CommonEnv
  $envArgs += "--env"; $envArgs += "TEST_EMAIL=$testEmail"

  $shardOk = $true
  foreach ($path in $paths) {
    Write-Host "  >> maestro test $path" -ForegroundColor DarkYellow
    & maestro test $path @envArgs
    if ($LASTEXITCODE -ne 0) {
      Write-Host "  << FAILED (exit code: $LASTEXITCODE)" -ForegroundColor Red
      $shardOk = $false
    } else {
      Write-Host "  << PASSED" -ForegroundColor Green
    }
  }

  $SHARD_RESULTS[$name] = $shardOk
  if ($shardOk) {
    Write-Host "<<< [$name] All flows passed." -ForegroundColor Green
  } else {
    Write-Host "<<< [$name] Some flows FAILED." -ForegroundColor Red
  }
  Write-Host ""
}

# =============================================
# Step 3: Run Maestro flows
# =============================================

if ($Flows) {
  # Custom flow path — run once with family email
  $paths = $Flows -split ","
  Run-Shard "custom" $paths $SEED['FAMILY_EMAIL']
} else {
  # Run 3 role-based shards (each with the correct test account)
  if ($SEED['FAMILY_EMAIL']) {
    Run-Shard "auth+family" @("maestro/auth", "maestro/family") $SEED['FAMILY_EMAIL']
  }
  if ($SEED['NURSE_EMAIL']) {
    Run-Shard "nurse" @("maestro/nurse") $SEED['NURSE_EMAIL']
  }
  if ($SEED['ADMIN_EMAIL']) {
    Run-Shard "admin" @("maestro/admin") $SEED['ADMIN_EMAIL']
  }
}

# =============================================
# Step 4: Report summary
# =============================================

$failedShards = $SHARD_RESULTS.GetEnumerator() | Where-Object { $_.Value -eq $false }
$allPassed = $failedShards.Count -eq 0

Write-Host "=== Maestro E2E Test Results ===" -ForegroundColor Cyan
if ($SHARD_RESULTS.Count -eq 0) {
  Write-Host "  (no shards were run)" -ForegroundColor DarkYellow
} else {
  $SHARD_RESULTS.Keys | Sort-Object | ForEach-Object {
    $icon = if ($SHARD_RESULTS[$_]) { "PASS" } else { "FAIL" }
    $color = if ($SHARD_RESULTS[$_]) { "Green" } else { "Red" }
    Write-Host "  [$icon] $_" -ForegroundColor $color
  }
  if ($allPassed) {
    Write-Host "Result: ALL PASSED" -ForegroundColor Green
  } else {
    Write-Host "Result: SOME FAILED" -ForegroundColor Red
  }
}
Write-Host ""

# =============================================
# Step 5: Cleanup test data
# =============================================

if (-not $SkipCleanup) {
  Write-Host ">>> Cleaning up test data..." -ForegroundColor Yellow
  node scripts/cleanup-e2e.mjs 2>&1
  if ($LASTEXITCODE -ne 0) {
    Write-Warning "Cleanup encountered errors (non-fatal)."
  } else {
    Write-Host "Cleanup complete." -ForegroundColor Green
  }
}

Pop-Location
if ($allPassed) { exit 0 } else { exit 1 }
