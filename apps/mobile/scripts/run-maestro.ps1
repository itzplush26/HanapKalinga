<#
.SYNOPSIS
  Run Maestro E2E tests with seed data setup and cleanup.

.DESCRIPTION
  Orchestrates: seed Supabase → launch app → run Maestro flows → cleanup.
  Supports targeting local dev or staging environment.

.PARAMETER Env
  Target environment: "local" or "staging" (default: local).

.PARAMETER Flows
  Comma-separated flow paths or directory to run (default: maestro/).

.PARAMETER SkipCleanup
  Skip cleanup after test run.

.PARAMETER SkipSeed
  Skip seeding before test run.

.EXAMPLE
  .\scripts\run-maestro.ps1 -Env local
  .\scripts\run-maestro.ps1 -Env staging -Flows "maestro/auth/"
#>

param(
  [ValidateSet("local", "staging")]
  [string]$Env = "local",
  [string]$Flows = "maestro/",
  [switch]$SkipCleanup,
  [switch]$SkipSeed
)

$ErrorActionPreference = "Stop"
$MobileDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Push-Location $MobileDir

# Source environment variables
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

# Determine env-specific settings
if ($Env -eq "local") {
  $env:SUPABASE_URL = $env:SUPABASE_URL_LOCAL
  $env:APP_ID = $env:APP_ID_LOCAL
} else {
  $env:SUPABASE_URL = $env:SUPABASE_URL_STAGING
  $env:APP_ID = $env:APP_ID_STAGING
}

$env:ENV = $Env
$env:TEST_EMAIL_PREFIX = "e2e-test"

Write-Host "=== Maestro E2E Test Runner ===" -ForegroundColor Cyan
Write-Host "Environment: $Env"
Write-Host "SUPABASE_URL: $env:SUPABASE_URL"
Write-Host "APP_ID: $env:APP_ID"
Write-Host "Flows: $Flows"
Write-Host ""

# Step 1: Seed test data
if (-not $SkipSeed) {
  Write-Host ">>> Seeding test data..." -ForegroundColor Yellow
  node scripts/seed-e2e.mjs
  if ($LASTEXITCODE -ne 0) {
    Write-Error "Seed failed. Aborting."
    exit 1
  }
  Write-Host "Seed complete." -ForegroundColor Green
  Write-Host ""
}

# Step 2: Run Maestro flows
Write-Host ">>> Running Maestro flows..." -ForegroundColor Yellow
maestro test $Flows --env APP_ID=$env:APP_ID --env ENV=$Env
$MAESTRO_EXIT_CODE = $LASTEXITCODE

if ($MAESTRO_EXIT_CODE -eq 0) {
  Write-Host "All Maestro flows passed." -ForegroundColor Green
} else {
  Write-Host "Some Maestro flows failed (exit code: $MAESTRO_EXIT_CODE)." -ForegroundColor Red
}
Write-Host ""

# Step 3: Cleanup test data
if (-not $SkipCleanup) {
  Write-Host ">>> Cleaning up test data..." -ForegroundColor Yellow
  node scripts/cleanup-e2e.mjs
  if ($LASTEXITCODE -ne 0) {
    Write-Warning "Cleanup encountered errors (non-fatal)."
  }
  Write-Host "Cleanup complete." -ForegroundColor Green
}

Pop-Location
exit $MAESTRO_EXIT_CODE
