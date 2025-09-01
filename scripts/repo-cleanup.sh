#!/usr/bin/env bash
set -euo pipefail

# Minimal, reversible archive script.
# Moves iterative validation docs and internal notes to archive/ to declutter root.

ARCHIVE_ROOT="archive/2025-08-validation"
NOTES_ROOT="archive/2025-08-notes"

mkdir -p "$ARCHIVE_ROOT" "$NOTES_ROOT"

mv -v COMPREHENSIVE-E2E-VALIDATION-COMPLETE.md "$ARCHIVE_ROOT" 2>/dev/null || true
mv -v E2E-TESTING-VALIDATION-REPORT.md            "$ARCHIVE_ROOT" 2>/dev/null || true
mv -v ENHANCED-WORKFLOW-VALIDATION.md             "$ARCHIVE_ROOT" 2>/dev/null || true
mv -v FINAL-E2E-VALIDATION-REPORT.md              "$ARCHIVE_ROOT" 2>/dev/null || true
mv -v FINAL-E2E-VALIDATION.md                     "$ARCHIVE_ROOT" 2>/dev/null || true
mv -v FINAL-FIX-VALIDATION.md                     "$ARCHIVE_ROOT" 2>/dev/null || true
mv -v FINAL-VALIDATION-REPORT.md                  "$ARCHIVE_ROOT" 2>/dev/null || true
mv -v VALIDATION-REPORT.md                        "$ARCHIVE_ROOT" 2>/dev/null || true
mv -v VALIDATION-TRIGGER.md                       "$ARCHIVE_ROOT" 2>/dev/null || true
mv -v IMPLEMENTATION-REVIEW.md                    "$ARCHIVE_ROOT" 2>/dev/null || true
mv -v CLAUDE.md                                   "$ARCHIVE_ROOT" 2>/dev/null || true

# Internal notes
if [ -d memory-bank ]; then
  mv -v memory-bank "$NOTES_ROOT" 2>/dev/null || true
fi

echo "Archive completed. Review changes, then commit:"
echo "  git add -A && git commit -m 'chore(repo): archive legacy validation docs and notes'"

