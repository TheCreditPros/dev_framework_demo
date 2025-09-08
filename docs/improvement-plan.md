# AI-SDLC Template – Improvement Plan (Authoritative Instructions)

Owner: Platform Engineering
Scope: Make the template repository production-credible as a base, remove unwanted performance tracking, auto-install the AI PR tool, and ensure auto-improvement/correction is actually enforced.

## Objectives

- Remove deployment/performance speed tracking from the demo (Lighthouse/Artillery/perf workflow).
- Auto-install and validate the AI PR tool during setup.
- Enforce real auto-improvement/auto-correction at commit time (not aspirational).
- Resolve configuration inconsistencies, dead references, and misconfigurations.
- Keep advanced features optional and gated to avoid surprises in fresh clones.

## High-Level Steps

1. Remove performance tracking (Lighthouse/Artillery) from default template.
2. Make AI PR Agent a first-class, auto-installed tool.
3. Enforce auto-improvement and auto-correction in Git hooks.
4. Fix CODEOWNERS and file path inconsistencies.
5. Stabilize tests (Vitest excludes) and gate E2E by default.
6. Fix SonarCloud compliance step parsing and gating.
7. Clean artifacts and add minor DX improvements.
8. Align docs/readme to the actual, enabled-by-default features.

---

## 1) Remove Performance Tracking

- Delete performance workflow and configs that measure/perf-gate deployments.
  - Remove `.github/workflows/performance.yml`.
  - Remove `lighthouse.config.js`.
  - Remove performance mentions/badges from `README.md` and docs.
- Optional (if keeping as optional examples):
  - Move the files to `docs/examples/perf/` and add instructions to enable via `vars.ENABLE_PERF=true` when desired.

Acceptance Criteria

- No CI jobs run Lighthouse or Artillery by default.
- `npm run dev` is not required by any default CI step.
- README does not claim deployment/performance tracking is enabled by default.

Files to change

- `.github/workflows/performance.yml`
- `lighthouse.config.js`
- `README.md: Performance/CI references`
- `docs/*: any Lighthouse/Artillery references`

---

## 2) Auto‑Install AI PR Tool (PR Agent)

- Treat PR Agent as a required tool with automatic setup.
  - PR Agent is now integrated in `install-framework-smart.sh` with native GitHub Actions.
    - Preferred: `pipx install pr-agent` (isolated, reliable PATH) or `pip install pr-agent` as a fallback.
    - Validate with `pr-agent --help` and fail the setup with a clear message if install or token is missing.
  - Ensure `.pr_agent.toml` exists and is valid; honor env var `GITHUB_TOKEN` and/or `PR_AGENT_TOKEN`.
  - Keep the existing `pr:*` NPM scripts but document the required `PR_URL` and tokens.
- CI: do not run PR Agent automatically (requires secrets), but keep scripts ready.

Acceptance Criteria

- Fresh clone + `./install-framework-smart.sh` results in complete setup with native GitHub Actions integration.
- `npm run pr:review` runs without “command not found”.
- `.pr_agent.toml` is recognized; docs explain required tokens and scopes.

Files to change

- `install-framework-smart.sh`
- `README.md: PR Agent section`
- `.pr_agent.toml` (doc/comment updates only; secrets via env)

---

## 3) Make Auto‑Improvement/Auto‑Correction Real (Hooks)

- Pre-commit (`.husky/pre-commit`):
  - Ensure lint-staged runs ESLint and Prettier on staged source.
  - Update `.lintstagedrc.js` so code files also run Prettier:
    - `"*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"]`
  - Add safe, deterministic fixers for recurring issues:
    - Add `node scripts/fix-test-syntax-errors.js` and `node scripts/fix-css-module-mocks.js` as pre-commit steps (repo already includes these). These can operate on the repo (or staged list if desired) before ESLint/Prettier.
  - Optional: add `tstype` check for staged TS files (fast path) or run a minimal `tsc --noEmit` gate if fast enough.
- Commit-msg (`.husky/commit-msg`): keep commitlint.
- Pre-push (`.husky/pre-push`):
  - Keep `vitest run` but cap workers to reduce latency, e.g. `--maxWorkers=2`.
  - Alternatively, run only affected packages/tests (future improvement).
- Post-commit (`.husky/post-commit`):
  - Keep `validate-setup.js`. Augment the validator to check `vitest`, `tsc`, and `pr-agent` presence in addition to ESLint/Prettier/Husky.

Acceptance Criteria

- On commit, code is auto-fixed and formatted; commits are blocked only when unfixable issues remain.
- On push, unit tests run deterministically with limited workers.
- `validate-setup.js` reports all expected tools present.

Files to change

- `.lintstagedrc.js`
- `.husky/pre-commit`
- `.husky/pre-push`
- `validate-setup.js`
- `README.md: Git hooks behavior`

---

## 4) Fix CODEOWNERS and Path Inconsistencies

- Remove non-GitHub identifiers (emails) and fix non-existent files.
  - Replace `/memory_bank/` with `/memory-bank/`.
  - Replace ESLint entries to match `eslint.config.mjs`.
  - Remove references to Jest config and non-existent build configs.
- Keep a minimal, correct default; move extensive patterns to a commented “examples” section for adopters to tailor.

Acceptance Criteria

- CODEOWNERS passes GitHub syntax checks.
- All patterns reference existing files/paths.

File to change

- `.github/CODEOWNERS`

---

## 5) Stabilize Tests and Gate E2E by Default

- Vitest: remove the global exclusion for `**/*.spec.js` (it can hide valid unit tests). The E2E directory is already excluded.
- Playwright:
  - Gate by `ENABLE_E2E` env var and default to disabled in template clones.
  - Remove missing reporter dependency or add it; recommended: remove `playwright-qase-reporter` from `reporter` by default.
  - Remove/avoid `webServer` unless a `dev` script exists; otherwise document how to run E2E only when an app server is available.

Acceptance Criteria

- `npm test` (Vitest) passes in fresh clones without needing a dev server.
- E2E runs only when explicitly enabled and a server is provided.

Files to change

- `vitest.config.js`
- `playwright.config.js`
- `README.md: E2E section`

---

## 6) Fix SonarCloud Parsing and Gating

- Stop parsing `.scannerwork/report-task.txt` as JSON; use the action’s standard outputs or parse it as text.
- Gate Sonar steps on presence of `SONAR_TOKEN` to avoid noisy failures.
- If compliance checks depend on Sonar output, short-circuit gracefully with a clear message when no token/report is present.

Acceptance Criteria

- Sonar jobs don’t fail due to JSON parsing of text files.
- Quality gate checks only run when Sonar token exists.

Files to change

- `.github/workflows/ci-cd-enhanced.yml`
- `.github/workflows/sonarcloud.yml`

---

## 7) Clean Artifacts and Minor DX Improvements

- Remove binary release from the template: delete `releases/*`.
- Add Node version metadata and editor defaults:
  - Add `"engines": { "node": ">=18" }` to `package.json`.
  - Add `.nvmrc` with the pinned Node LTS if desired.
  - Add `.editorconfig` for whitespace/newlines.
- Align `README.md` and docs to version `v3.3.0` consistently.

Acceptance Criteria

- Repo is lean; no binary artifacts.
- New devs get consistent Node/editor behavior.

Files to change

- Remove: `releases/v3.3.0-demo-*.tar.gz`
- `package.json`
- Add: `.nvmrc`, `.editorconfig`
- `README.md`

---

## 8) Docs Alignment (Make “Auto‑Improve” Truthful)

- Update README and framework docs to reflect that auto-lint/format and fixers run on every commit (not aspirational). Keep AI “auto-heal”/advanced features clearly labeled as optional add-ons (require tokens/services).
- Remove or move aspirational sections that imply running services not available by default (e.g., performance budgets, external notifiers) to an “Advanced (Optional)” section.
- Add a Quick Start that works out-of-the-box:
  - `npm install`
  - `npm run framework:validate`
  - `npm test`
  - commit to see auto-fixes

Acceptance Criteria

- README accurately describes enabled-by-default behavior.
- Optional features are opt-in and documented with prerequisites.

Files to change

- `README.md`
- `AI-SDLC-FRAMEWORK.md` (trim or mark optional sections)
- `docs/*.md` that reference removed performance gating

---

## Implementation Order (Recommended)

1. Remove performance workflow/configs and doc references.
2. Gate E2E and adjust Vitest excludes.
3. Update hooks + lint-staged for real auto-improvement.
4. Add PR Agent auto-install and validation in setup scripts.
5. Fix CODEOWNERS and path issues.
6. Fix Sonar workflows.
7. Clean artifacts; add engines/.nvmrc/.editorconfig.
8. Align documentation and versioning.

---

## Command Snippets (When Applying Changes)

- Remove performance workflow and config
  - `git rm -f .github/workflows/performance.yml`
  - `git rm -f lighthouse.config.js`

- Update lint-staged to also run Prettier on code files
  - `.lintstagedrc.js` → `"*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"]`

- Cap pre-push test workers
  - `.husky/pre-push` → `npx vitest run --reporter=verbose --maxWorkers=2`

- Vitest exclude fix
  - Remove `"**/*.spec.js"` from `test.exclude` in `vitest.config.js`.

- Gate Playwright by env and remove missing reporter
  - `playwright.config.js` → conditionally add reporters; comment out `webServer` unless `ENABLE_E2E=true` and `npm run dev` exists.

- Sonar parsing fix (pseudocode replacement)
  - Replace `JSON.parse(fs.readFileSync('.scannerwork/report-task.txt'))` with a guard:
    - If `!process.env.SONAR_TOKEN` → skip with message.
    - Else rely on Sonar action output variables or parse `.scannerwork/report-task.txt` as text lines.

- PR Agent installation in setup script (example)
  - In `install-framework-smart.sh`:
    - Check `command -v pr-agent || { pipx install pr-agent || pip install --user pr-agent; }`
    - Validate `pr-agent --help` and `.pr_agent.toml` presence; instruct to set `GITHUB_TOKEN`.

---

## Post-Change Validation Checklist

- `npm install` succeeds with no missing CLIs referenced by scripts.
- `npm test` runs and passes locally without E2E.
- `git commit` triggers ESLint/Prettier and fixers; produces clean diffs.
- `git push` runs Vitest with limited workers.
- Native GitHub Actions integration available after `./install-framework-smart.sh`.
- CI workflows pass (quality, security); no performance jobs present by default.
