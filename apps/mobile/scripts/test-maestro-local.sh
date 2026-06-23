#!/bin/bash
# Local Maestro E2E Test Runner
# Usage: ./scripts/test-maestro-local.sh [auth|nurse|family|admin|all]

set -e

SHARD=${1:-auth}
APP_ID="com.hanapkalinga.mobile"
ENV="staging"

# Default test password
TEST_PASSWORD="${TEST_PASSWORD:-TestPass123!}"

# ------------------------------------------------------------------
# Seed test data if Supabase credentials are configured
# ------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SEED_OUTPUT=""

if [ -n "${SUPABASE_URL:-}" ] && [ -n "${SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
  echo "→ Seeding E2E test data..."
  SEED_OUTPUT=$(node "$SCRIPT_DIR/seed-e2e.mjs" 2>&1)
  echo "$SEED_OUTPUT"
  
  # Extract values from seed output
  FAMILY_EMAIL=$(echo "$SEED_OUTPUT" | grep -oE '^FAMILY_EMAIL=.+' | cut -d= -f2)
  NURSE_EMAIL=$(echo "$SEED_OUTPUT" | grep -oE '^NURSE_EMAIL=.+' | cut -d= -f2)
  ADMIN_EMAIL=$(echo "$SEED_OUTPUT" | grep -oE '^ADMIN_EMAIL=.+' | cut -d= -f2)
  SEED_PASSWORD=$(echo "$SEED_OUTPUT" | grep -oE '^PASSWORD=.+' | cut -d= -f2)
  BOOKING_ID=$(echo "$SEED_OUTPUT" | grep -oE '^BOOKING_ID=.+' | cut -d= -f2)
  NURSE_ID=$(echo "$SEED_OUTPUT" | grep -oE '^NURSE_ID=.+' | cut -d= -f2)
  VERIFICATION_ID=$(echo "$SEED_OUTPUT" | grep -oE '^VERIFICATION_ID=.+' | cut -d= -f2)
  
  if [ -n "$SEED_PASSWORD" ]; then
    TEST_PASSWORD="$SEED_PASSWORD"
  fi
  
  echo "→ Seed complete. Using dynamically generated test accounts."
else
  echo ""
  echo "NOTE: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY not set."
  echo "To auto-seed test accounts, set these environment variables."
  echo "Using fallback defaults (tests will fail if accounts don't exist)."
  echo ""
fi

echo "→ Running Maestro E2E tests for: $SHARD"
echo "→ App ID: $APP_ID"
echo "→ Environment: $ENV"
echo ""

# Check if maestro is installed
MAESTRO_VERSION="1.39.0"

if ! command -v maestro &> /dev/null; then
    echo "❌ Maestro CLI not found. Installing v${MAESTRO_VERSION}..."
    curl -Ls "https://get.maestro.mobile.dev" | bash -s -- --version "${MAESTRO_VERSION}"
    export PATH="$HOME/.maestro/bin:$PATH"
else
    # Check installed version
    INSTALLED=$(maestro --version 2>/dev/null || echo "unknown")
    if [ "$INSTALLED" != "$MAESTRO_VERSION" ]; then
        echo "⚠️  Maestro CLI v${INSTALLED} installed, expected v${MAESTRO_VERSION}. Upgrading..."
        curl -Ls "https://get.maestro.mobile.dev" | bash -s -- --version "${MAESTRO_VERSION}"
        export PATH="$HOME/.maestro/bin:$PATH"
    fi
fi

# Check if emulator is running
if ! adb devices | grep -q "emulator"; then
    echo "⚠️  No emulator detected. Starting emulator..."
    emulator -avd Pixel_6 -no-snapshot-load -no-boot-anim &
    echo "⏳ Waiting for emulator to boot..."
    adb wait-for-device
    sleep 10
fi

# Get device info
echo "📲 Device info:"
adb shell getprop ro.build.version.release
adb shell getprop ro.product.model
echo ""

# Check if app is installed
if ! adb shell pm list packages | grep -q "$APP_ID"; then
    echo "⚠️  App not installed. Building and installing..."
    cd "$(dirname "$0")/.."
    npm run android
    echo "⏳ Waiting for app to install..."
    sleep 5
else
    echo "✅ App already installed"
fi

# Pre-warm the app
echo "🔥 Pre-warming the app..."
adb shell am start -n $APP_ID/.MainActivity
sleep 5
adb shell am force-stop $APP_ID
sleep 2

# Clear app data for clean state
echo "🧹 Clearing app data..."
adb shell pm clear $APP_ID

echo ""
echo "🚀 Starting Maestro tests..."
echo ""

# Determine email and IDs based on shard
if [ -n "${FAMILY_EMAIL:-}" ]; then
    # Using seeded values
    case $SHARD in
        nurse)  TEST_EMAIL="$NURSE_EMAIL" ;;
        admin)  TEST_EMAIL="$ADMIN_EMAIL" ;;
        *)      TEST_EMAIL="$FAMILY_EMAIL" ;;
    esac
else
    # Fallback hardcoded defaults
    echo "WARNING: Using hardcoded test emails. Run seed-e2e.mjs or set SUPABASE_URL first."
    case $SHARD in
        nurse)  TEST_EMAIL="e2e-test-nurse@example.com" ;;
        admin)  TEST_EMAIL="e2e-test-admin@example.com" ;;
        *)      TEST_EMAIL="e2e-test-family@example.com" ;;
    esac
fi

# Ensure IDs are set (seed may have been skipped)
BOOKING_ID="${BOOKING_ID:-test-booking-id}"
NURSE_ID="${NURSE_ID:-test-nurse-id}"
VERIFICATION_ID="${VERIFICATION_ID:-test-verification-id}"

# Run tests
if [ "$SHARD" == "all" ]; then
    echo "Running all test suites..."
    maestro test "$(dirname "$0")/../maestro/" \
        --env APP_ID="$APP_ID" \
        --env ENV="$ENV" \
        --env TEST_EMAIL="$TEST_EMAIL" \
        --env TEST_PASSWORD="$TEST_PASSWORD" \
        --env BOOKING_ID="$BOOKING_ID" \
        --env NURSE_ID="$NURSE_ID" \
        --env VERIFICATION_ID="$VERIFICATION_ID"
else
    echo "Running $SHARD tests..."
    maestro test "$(dirname "$0")/../maestro/$SHARD/" \
        --env APP_ID="$APP_ID" \
        --env ENV="$ENV" \
        --env TEST_EMAIL="$TEST_EMAIL" \
        --env TEST_PASSWORD="$TEST_PASSWORD" \
        --env BOOKING_ID="$BOOKING_ID" \
        --env NURSE_ID="$NURSE_ID" \
        --env VERIFICATION_ID="$VERIFICATION_ID"
fi

echo ""
echo "✅ Tests complete!"
