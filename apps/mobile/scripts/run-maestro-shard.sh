#!/usr/bin/env bash
set -u

shard="$1"
target_env="$2"
family_email="$3"
nurse_email="$4"
admin_email="$5"
password="$6"
booking_id="$7"
nurse_id="$8"
verification_id="$9"
debug_dir="${10}"

case "$shard" in
  nurse)
    test_email="$nurse_email"
    ;;
  admin)
    test_email="$admin_email"
    ;;
  family | auth)
    test_email="$family_email"
    ;;
  *)
    echo "Unknown Maestro shard: $shard" >&2
    exit 2
    ;;
esac

# Validate credentials are non-empty (fail fast with clear error)
if [ -z "$test_email" ]; then
  echo "ERROR: TEST_EMAIL is empty for shard '$shard'. Seed output may be missing." >&2
  echo "Check that seed-e2e job produced valid outputs." >&2
  exit 1
fi
if [ -z "$password" ]; then
  echo "ERROR: TEST_PASSWORD is empty for shard '$shard'. Seed output may be missing." >&2
  exit 1
fi

# Default prefix for registration flows; must match seed-e2e.mjs default
email_prefix="${TEST_EMAIL_PREFIX:-e2e-test}"

echo "→ Shard: $shard | Email: $test_email | Prefix: $email_prefix"

failures=0
total=0
mkdir -p "$debug_dir"

# Results file in simple pipe-delimited format:
#   Line format: flow_name|status|error_message
#   Status: PASS or FAIL
results_file="$debug_dir/results.txt"

shopt -s nullglob
flows=(apps/mobile/maestro/"$shard"/*.yaml)

if [ "${#flows[@]}" -eq 0 ]; then
  echo "No Maestro flows found for shard: $shard" >&2
  exit 2
fi

total="${#flows[@]}"

# Write header
echo "# shard: $shard" > "$results_file"
echo "# total: $total" >> "$results_file"

for flow in "${flows[@]}"; do
  name="$(basename "$flow" .yaml)"
  echo "::group::Maestro $shard/$name"

  # Capture stdout+stderr for error parsing
  output_file="$debug_dir/$name-output.txt"

  if maestro test "$flow" \
    --env APP_ID=com.hanapkalinga.mobile \
    --env ENV="$target_env" \
    --env TEST_EMAIL="$test_email" \
    --env TEST_PASSWORD="$password" \
    --env TEST_EMAIL_PREFIX="$email_prefix" \
    --env BOOKING_ID="$booking_id" \
    --env NURSE_ID="$nurse_id" \
    --env VERIFICATION_ID="$verification_id" \
    > "$output_file" 2>&1; then
    echo "$name|PASS|" >> "$results_file"
    echo "  ✅ $shard/$name: PASSED"
  else
    failures=$((failures + 1))
    # Extract meaningful error message from Maestro output
    error_msg=$(grep -m1 -iE '(Error |error:|FAIL|Element .* not found|Timed out|Timeout|Crash)' "$output_file" 2>/dev/null | head -1 || echo "See output file for details")
    # Escape pipe characters in error message (replace | with \|)
    error_msg="${error_msg//|/\\|}"
    echo "$name|FAIL|$error_msg" >> "$results_file"
    echo "  ❌ $shard/$name: FAILED - $error_msg"
    
    # Take screenshot and dump hierarchy for debugging
    adb exec-out screencap -p > "$debug_dir/$name.png" || true
    adb shell uiautomator dump /sdcard/window.xml || true
    adb pull /sdcard/window.xml "$debug_dir/$name-window.xml" || true
    adb logcat -d -t 500 > "$debug_dir/$name-logcat.txt" || true
  fi

  # Always force-stop and clear app after each test to prevent state leakage
  adb shell am force-stop com.hanapkalinga.mobile 2>/dev/null || true

  echo "::endgroup::"
done

# Write footer
passed=$((total - failures))
echo "# passed: $passed" >> "$results_file"
echo "# failed: $failures" >> "$results_file"

echo "---"
echo "📊 Shard '$shard' results: $passed passed, $failures failed, $total total"
echo "---"

exit "$failures"
