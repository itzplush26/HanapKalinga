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

failures=0
mkdir -p "$debug_dir"

shopt -s nullglob
flows=(apps/mobile/maestro/"$shard"/*.yaml)

if [ "${#flows[@]}" -eq 0 ]; then
  echo "No Maestro flows found for shard: $shard" >&2
  exit 2
fi

for flow in "${flows[@]}"; do
  name="$(basename "$flow" .yaml)"
  echo "::group::Maestro $shard/$name"

  if ! maestro test "$flow" \
    --env APP_ID=com.hanapkalinga.mobile \
    --env ENV="$target_env" \
    --env TEST_EMAIL="$test_email" \
    --env TEST_PASSWORD="$password" \
    --env BOOKING_ID="$booking_id" \
    --env NURSE_ID="$nurse_id" \
    --env VERIFICATION_ID="$verification_id"; then
    failures=$((failures + 1))
    adb exec-out screencap -p > "$debug_dir/$name.png" || true
    adb shell uiautomator dump /sdcard/window.xml || true
    adb pull /sdcard/window.xml "$debug_dir/$name-window.xml" || true
    adb logcat -d -t 500 > "$debug_dir/$name-logcat.txt" || true
  fi

  echo "::endgroup::"
done

exit "$failures"
