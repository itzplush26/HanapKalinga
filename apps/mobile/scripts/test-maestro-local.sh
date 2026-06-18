#!/bin/bash
# Local Maestro E2E Test Runner
# Usage: ./scripts/test-maestro-local.sh [auth|nurse|family|admin|all]

set -e

SHARD=${1:-auth}
APP_ID="com.hanapkalinga.mobile"
ENV="staging"

# Default test credentials
TEST_EMAIL="e2e-test-family@example.com"
TEST_PASSWORD="TestPass123!"

# Optional IDs (set these if running booking/verification tests)
BOOKING_ID="${BOOKING_ID:-test-booking-id}"
NURSE_ID="${NURSE_ID:-test-nurse-id}"
VERIFICATION_ID="${VERIFICATION_ID:-test-verification-id}"

echo "🧪 Running Maestro E2E tests for: $SHARD"
echo "📱 App ID: $APP_ID"
echo "🌍 Environment: $ENV"
echo ""

# Check if maestro is installed
if ! command -v maestro &> /dev/null; then
    echo "❌ Maestro CLI not found. Installing..."
    curl -Ls "https://get.maestro.mobile.dev" | bash
    export PATH="$HOME/.maestro/bin:$PATH"
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

# Adjust email based on shard
case $SHARD in
    nurse)
        TEST_EMAIL="e2e-test-nurse@example.com"
        ;;
    admin)
        TEST_EMAIL="e2e-test-admin@example.com"
        ;;
    family|auth|all)
        TEST_EMAIL="e2e-test-family@example.com"
        ;;
esac

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
