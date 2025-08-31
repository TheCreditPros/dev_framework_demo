#!/usr/bin/env bash
set -euo pipefail

if command -v black >/dev/null 2>&1; then
  echo "Formatting Python files with Black: $@"
  black "$@"
else
  echo "Black not installed; skipping Python formatting." >&2
fi

