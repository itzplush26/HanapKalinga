#!/usr/bin/env bash
# consolidate-maestro-summary.sh
#
# Aggregates per-shard Maestro results.txt files into a single
# markdown report. Designed for GitHub Actions step summary output.
#
# Usage:
#   ./consolidate-maestro-summary.sh <results_dir> [output_file]
#
#   <results_dir>   Directory containing results.txt files from each shard.
#                   Each file uses pipe-delimited format produced by
#                   run-maestro-shard.sh.
#   [output_file]   Optional file to write the markdown report to.
#                   If omitted, writes to stdout.
#
# Environment:
#   GITHUB_STEP_SUMMARY   If set, the report is also appended to this file
#                         (GitHub Actions step summary protocol).
#
# Examples:
#   ./consolidate-maestro-summary.sh /tmp/maestro-summary/
#   ./consolidate-maestro-summary.sh /tmp/maestro-summary/ /tmp/report.md

set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <results_dir> [output_file]" >&2
  exit 1
fi

results_dir="$1"
output_file="${2:-}"

# Find all results.txt files
shopt -s nullglob
result_files=("$results_dir"/*/results.txt "$results_dir"/results.txt)
shopt -u nullglob

# Deduplicate and filter to existing files
declare -A seen
unique_files=()
for f in "${result_files[@]}"; do
  [ -f "$f" ] || continue
  [ -n "${seen[$f]:-}" ] && continue
  seen[$f]=1
  unique_files+=("$f")
done

if [ ${#unique_files[@]} -eq 0 ]; then
  echo "::warning::No results.txt files found in $results_dir"
  echo "## ⚠️ Maestro E2E Results Summary"
  echo ""
  echo "No result files found in \`$results_dir\`."
  echo ""
  echo "| Shard | Total | Passed | Failed |"
  echo "|-------|-------|--------|--------|"
  echo "| — | — | — | — |"
  echo ""
  exit 0
fi

# Create a temporary file for the markdown output
tmp_report=$(mktemp)
trap 'rm -f "$tmp_report"' EXIT

# Overall totals
grand_total=0
grand_passed=0
grand_failed=0
declare -A shard_data  # Will store "total passed failed" per shard
declare -A shard_failures  # Will store multiline failure details per shard
shard_order=()

# Parse each results.txt
for rf in "${unique_files[@]}"; do
  shard_name=""
  shard_total=0
  shard_passed=0
  shard_failed=0
  failures_text=""

  while IFS= read -r line; do
    case "$line" in
      "# shard: "*)
        shard_name="${line#\# shard: }"
        ;;
      "# total: "*)
        shard_total="${line#\# total: }"
        ;;
      "# passed: "*)
        shard_passed="${line#\# passed: }"
        ;;
      "# failed: "*)
        shard_failed="${line#\# failed: }"
        ;;
      *"|FAIL|"*)
        # Parse: flow_name|FAIL|error_message
        flow_name="${line%%|*}"
        error_part="${line#*|FAIL|}"
        # Escape pipes in error message for markdown
        error_part="${error_part//|/\\|}"
        failures_text+="| \`${flow_name}\` | \`${error_part}\` |"$'\n'
        ;;
    esac
  done < "$rf"

  if [ -n "$shard_name" ]; then
    shard_data["$shard_name"]="$shard_total $shard_passed $shard_failed"
    shard_failures["$shard_name"]="$failures_text"
    shard_order+=("$shard_name")
    grand_total=$((grand_total + shard_total))
    grand_passed=$((grand_passed + shard_passed))
    grand_failed=$((grand_failed + shard_failed))
  fi
done

# Build the markdown report
{
  # Header
  if [ "$grand_failed" -eq 0 ]; then
    echo "# ✅ Maestro E2E Test Summary: ALL PASSED"
  else
    echo "# ❌ Maestro E2E Test Summary: ${grand_failed} FAILURE(S) DETECTED"
  fi
  echo ""
  echo "**Overall**: ${grand_passed} passed / ${grand_total} total  "
  echo "**Failed**: ${grand_failed}  "
  echo ""

  # Per-shard summary table
  echo "## 📊 Per-Shard Summary"
  echo ""
  echo "| Shard | Total | Passed | Failed | Status |"
  echo "|-------|-------|--------|--------|--------|"

  for s in "${shard_order[@]}"; do
    read -r t p f <<< "${shard_data[$s]}"
    if [ "$f" -eq 0 ]; then
      icon="✅"
    else
      icon="❌"
    fi
    echo "| ${s} | ${t} | ${p} | ${f} | ${icon} |"
  done
  echo ""

  # Failure details
  any_failures=false
  for s in "${shard_order[@]}"; do
    read -r t p f <<< "${shard_data[$s]}"
    if [ "$f" -gt 0 ]; then
      any_failures=true
      break
    fi
  done

  if [ "$any_failures" = true ]; then
    echo "## 💥 Failure Details"
    echo ""

    for s in "${shard_order[@]}"; do
      read -r t p f <<< "${shard_data[$s]}"
      [ "$f" -eq 0 ] && continue

      echo "### 🔴 Shard: ${s}"
      echo ""
      echo "| Flow | Error |"
      echo "|------|-------|"
      failures_text="${shard_failures[$s]}"
      if [ -n "$failures_text" ]; then
        echo -n "$failures_text"
      fi
      echo ""
    done

    echo "---"
    echo ""
    echo "### 💫 Debug Artifacts"
    echo ""
    for s in "${shard_order[@]}"; do
      read -r t p f <<< "${shard_data[$s]}"
      if [ "$f" -gt 0 ]; then
        echo "- \`maestro-debug-${s}\` — screenshots, UI hierarchy, logcat"
      fi
    done
    echo ""
  else
    echo "## ✅ All Flows Passed"
    echo ""
    echo "🎉 All ${grand_total} flows passed. No failures to report."
    echo ""
  fi

  echo "---"
  echo "*🤖 Generated by consolidate-maestro-summary.sh*"
} > "$tmp_report"

# Output
if [ -n "$output_file" ]; then
  cp "$tmp_report" "$output_file"
fi
cat "$tmp_report"

# Append to GITHUB_STEP_SUMMARY if set
if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
  cat "$tmp_report" >> "$GITHUB_STEP_SUMMARY"
fi
