#!/usr/bin/env node
/*
 * Apply Auto-Heal Learnings
 *
 * Aggregates Playwright auto-heal learnings from test-results/*.json and
 * applies safe selector replacements in E2E test files. Optionally commits
 * changes on a new branch and opens a PR via GitHub CLI (gh) when requested.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.cwd();
const RESULTS_DIR = path.join(ROOT, 'test-results');
const E2E_DIR = path.join(ROOT, 'tests', 'e2e');

function loadLearnings() {
  const learnings = {};
  if (!fs.existsSync(RESULTS_DIR)) return learnings;
  const files = fs
    .readdirSync(RESULTS_DIR)
    .filter((f) => f.endsWith('learnings.json'));
  for (const f of files) {
    try {
      const data = JSON.parse(
        fs.readFileSync(path.join(RESULTS_DIR, f), 'utf8')
      );
      if (data && data.workingFallbacks) {
        for (const [primary, fallback] of Object.entries(
          data.workingFallbacks
        )) {
          // Keep the first discovered fallback as canonical for a primary
          if (!learnings[primary]) learnings[primary] = fallback;
        }
      }
    } catch (e) {
      console.warn(`⚠️  Skipping invalid learnings file: ${f} (${e.message})`);
    }
  }
  return learnings;
}

function escapeForRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceInContent(content, primary, fallback) {
  // Replace only inside string literals (single, double, or template literals)
  const patterns = [
    new RegExp(`(['"])${escapeForRegex(primary)}\\1`, 'g'),
    new RegExp('`' + escapeForRegex(primary) + '`', 'g'),
  ];
  let changed = false;
  for (const rx of patterns) {
    const before = content;
    content = content.replace(rx, (m) => m.replace(primary, fallback));
    if (content !== before) changed = true;
  }
  return { content, changed };
}

function collectE2EFiles() {
  const files = [];
  if (!fs.existsSync(E2E_DIR)) return files;
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (/\.(spec|test)\.(js|ts)$/i.test(entry.name)) files.push(p);
    }
  };
  walk(E2E_DIR);
  return files;
}

function applyReplacements(files, learnings, dryRun = false) {
  const changes = [];
  for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let fileChanged = false;
    const replacements = [];
    for (const [primary, fallback] of Object.entries(learnings)) {
      const result = replaceInContent(content, primary, fallback);
      if (result.changed) {
        fileChanged = true;
        content = result.content;
        replacements.push({ primary, fallback });
      }
    }
    if (fileChanged) {
      if (!dryRun) fs.writeFileSync(file, content, 'utf8');
      changes.push({ file, replacements });
    }
  }
  return changes;
}

function gitSafe(cmd) {
  try {
    return execSync(cmd, { stdio: 'pipe' }).toString().trim();
  } catch {
    return null;
  }
}

function createBranchAndCommit(changes, openPr = false) {
  const branch = `chore/auto-heal-${new Date()
    .toISOString()
    .replace(/[-:T.]/g, '')
    .slice(0, 12)}`;
  if (!gitSafe('git rev-parse --git-dir')) {
    console.log('ℹ️  Not a git repository; skipping branch/commit.');
    return;
  }
  gitSafe(`git checkout -b ${branch}`) || gitSafe(`git switch -c ${branch}`);
  gitSafe('git add -A');
  const message =
    'chore(auto-heal): apply selector learnings\n\n' +
    changes
      .flatMap((c) =>
        c.replacements.map(
          (r) => `- ${c.file}: "${r.primary}" → "${r.fallback}"`
        )
      )
      .join('\n');
  gitSafe(`git commit -m ${JSON.stringify(message)}`);

  if (openPr && gitSafe('gh --version')) {
    gitSafe(
      'gh pr create --title "chore(auto-heal): apply selector learnings" --body "Automated selector updates from Playwright auto-healing learnings."'
    );
  } else if (openPr) {
    console.log('ℹ️  gh CLI not found; push and open PR manually.');
  }
}

function main() {
  const args = process.argv.slice(2);
  const dryRun =
    args.includes('--dry-run') || process.env.APPLY_HEAL_DRY_RUN === 'true';
  const openPr =
    args.includes('--open-pr') || process.env.APPLY_HEAL_OPEN_PR === 'true';

  const learnings = loadLearnings();
  const totalLearnings = Object.keys(learnings).length;
  if (!totalLearnings) {
    console.log('ℹ️  No auto-heal learnings found in test-results/*.json');
    process.exit(0);
  }
  console.log(`🔎 Loaded ${totalLearnings} learned selector replacements`);

  const e2eFiles = collectE2EFiles();
  if (!e2eFiles.length) {
    console.log('ℹ️  No E2E spec files found under tests/e2e');
    process.exit(0);
  }

  const changes = applyReplacements(e2eFiles, learnings, dryRun);
  if (!changes.length) {
    console.log('✅ No changes required; specs already use healed selectors.');
    process.exit(0);
  }

  console.log('📄 Planned changes:');
  for (const c of changes) {
    console.log(`  • ${path.relative(ROOT, c.file)}`);
    for (const r of c.replacements)
      console.log(`    - "${r.primary}" → "${r.fallback}"`);
  }

  if (!dryRun) createBranchAndCommit(changes, openPr);
  else
    console.log(
      '\n(dry-run) No files written; pass --open-pr to open PR after applying.'
    );
}

main();
