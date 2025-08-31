#!/usr/bin/env node
/*
 * Create a "dirty" PR to validate auto-fixes (lint/format) and E2E auto-heal.
 *
 * Examples:
 *   node scripts/create-dirty-pr.js --type=lint
 *   node scripts/create-dirty-pr.js --type=e2e --open-pr
 *   node scripts/create-dirty-pr.js --type=mixed --bypass-hooks --open-pr
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function run(cmd) {
  return execSync(cmd, { stdio: 'pipe' }).toString().trim();
}

function safe(cmd) {
  try {
    return run(cmd);
  } catch {
    return null;
  }
}

function ensureRepo() {
  if (!safe('git rev-parse --git-dir')) {
    console.error('❌ Not a git repository.');
    process.exit(1);
  }
}

function writeFile(file, content) {
  const dir = path.dirname(file);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
}

function dirtyLintFiles() {
  const target = 'src/utils/dirtyLint.ts';
  const content = `// Intentional style issues for dirty PR validation

export function badFormat( value :number){
console.log("bad",  value)
const UNUSED = 123
return value+1}
`;
  writeFile(target, content);
  return [target];
}

function dirtyE2EFiles() {
  const target = 'tests/e2e/dirty-heal.spec.js';
  const content = `import { test, expect } from '@playwright/test';\n\n// Intentionally fragile selectors to trigger auto-heal learnings\nconst BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';\n\ntest.describe('Dirty Auto-Heal Validation', () => {\n  test('uses outdated selectors to trigger learnings', async ({ page }) => {\n    await page.goto(BASE);\n    await page.click('#old-nonexistent-button');\n    await page.waitForTimeout(300);\n    // Expectation is not strict; this test is allowed to fail in CI (|| true)\n    expect(true).toBe(true);\n  });\n});\n`;
  writeFile(target, content);
  return [target];
}

function main() {
  ensureRepo();
  const args = process.argv.slice(2);
  const get = (k, d) => {
    const p = args.find((a) => a.startsWith(`--${k}=`));
    return p ? p.split('=')[1] : d;
  };
  const has = (k) => args.includes(`--${k}`);

  const type = get('type', 'lint'); // lint | e2e | mixed
  const bypass = has('bypass-hooks');
  const openPr = has('open-pr');

  const branch = `test/dirty-${type}-${Date.now()}`;
  safe(`git checkout -b ${branch}`) || safe(`git switch -c ${branch}`);

  const files = [];
  if (type === 'lint' || type === 'mixed') files.push(...dirtyLintFiles());
  if (type === 'e2e' || type === 'mixed') files.push(...dirtyE2EFiles());

  run('git add -A');
  const msg = `test: dirty pr to validate auto-fixes (${type})`;
  const commitCmd = bypass
    ? `git commit --no-verify -m ${JSON.stringify(msg)}`
    : `git commit -m ${JSON.stringify(msg)}`;
  run(commitCmd);

  console.log(`✅ Created dirty commit on ${branch}`);
  console.log('Changed files:\n - ' + files.join('\n - '));

  // Push and open PR if gh available
  if (openPr && safe('gh --version')) {
    safe(`git push -u origin ${branch}`);
    const prUrl = safe(
      `gh pr create --title ${JSON.stringify(msg)} --body "Automated dirty PR for validating AI auto-fixes and auto-healing."`
    );
    console.log(`🔗 Opened PR: ${prUrl || '(see gh output)'}`);
  } else if (openPr) {
    console.log('ℹ️ gh CLI not found. Manually push and open a PR:');
    console.log(`   git push -u origin ${branch}`);
  }
}

main();
