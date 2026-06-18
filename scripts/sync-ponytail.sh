#!/usr/bin/env bash
# Refresh Ponytail rules from upstream. Run from repo root.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

git clone --depth 1 https://github.com/DietrichGebert/ponytail.git "$TMP/ponytail"

cp "$TMP/ponytail/.cursor/rules/ponytail.mdc" "$ROOT/.cursor/rules/ponytail.mdc"

# Keep HanapKalinga header; replace Ponytail body from upstream AGENTS.md
{
  head -n 8 "$ROOT/AGENTS.md"
  echo "---"
  echo
  tail -n +2 "$TMP/ponytail/AGENTS.md"
} > "$ROOT/AGENTS.md.tmp"
mv "$ROOT/AGENTS.md.tmp" "$ROOT/AGENTS.md"

echo "Synced Ponytail rules to .cursor/rules/ponytail.mdc and AGENTS.md"
