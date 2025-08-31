#!/usr/bin/env node
/*
 * Close dirty PRs created for validation and optionally delete remote branches.
 * Requires GitHub CLI (gh) authenticated.
 */
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

function main() {
  if (!safe('gh --version')) {
    console.error(
      '❌ gh CLI not found. Install GitHub CLI and authenticate (gh auth login).'
    );
    process.exit(1);
  }

  const json = safe('gh pr list --search "dirty PR" --json number,headRefName');
  if (!json) {
    console.log('ℹ️ No PRs found matching search.');
    return;
  }
  const prs = JSON.parse(json);
  if (!prs.length) {
    console.log('ℹ️ No dirty PRs to close.');
    return;
  }
  for (const pr of prs) {
    console.log(`🧹 Closing PR #${pr.number} (${pr.headRefName})`);
    safe(`gh pr close ${pr.number} --delete-branch`);
  }
  console.log('✅ Cleanup completed.');
}

main();
