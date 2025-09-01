This repository has been streamlined after the v3.3.0 CI/CD + E2E stabilization.

What moved to archive/

- Validation reports and iterative logs from earlier cycles
- Internal notes from memory-bank/

Why

- Reduce noise in the root, keep only production-facing docs and code
- Preserve full history under archive/ for traceability

How to find old material

- See archive/2025-08-validation/ for validation reports
- See archive/2025-08-notes/memory-bank/ for prior internal notes

Operational note

- E2E currently uses a simple static server for demo pages. To point to a real app,
  set PLAYWRIGHT_WEB_SERVER to your start command and PLAYWRIGHT_BASE_URL to the app URL
  in the workflow or repo variables, then optionally remove public/ + scripts/simple-static-server.js.
