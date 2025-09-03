## PR Summary

Describe the change and its impact in 1–3 sentences.

## Configuration Checklist (Per Repository)

Use this checklist when adopting the template in a new repo. See README “High‑Priority Configuration”.

- [ ] E2E target (recommended): set repo Variables
  - `PLAYWRIGHT_WEB_SERVER` = app start command (e.g., Vite/React `npm run preview -- --host --port 3000`, Next.js `npm run start`, Express `node server.js`, Laravel `php artisan serve --host=127.0.0.1 --port=3000`)
  - `PLAYWRIGHT_BASE_URL` = app URL (e.g., `http://localhost:3000`)
- [ ] AI PR Review (optional, non‑blocking): add repo Secret `OPENAI_KEY`
- [ ] Optional toggles: `ENABLE_E2E`, `ENABLE_INTEGRATION`
- [ ] Decide whether to keep the demo fallback (`public/` + `scripts/simple-static-server.js`) or remove after the app server is stable

## CI Validation (tick after PR checks)

- [ ] Lint + type‑check green
- [ ] Unit tests green (`test-results-unit-node20` uploaded)
- [ ] E2E (Chromium‑only) completed; `playwright-report-node20` uploaded
- [ ] AI PR Review ran or skipped (non‑blocking)
- [ ] Dirty PR auto‑healing (optional): add label `apply-ai-fixes` if you want safe fixes. A follow‑up PR is created only if changes exist.

## Notes

Add any repo‑specific details (app start command, base URL, domain constraints).
