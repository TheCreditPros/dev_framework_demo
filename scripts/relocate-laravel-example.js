#!/usr/bin/env node
/*
 * Relocate Laravel example from repo root to examples/laravel/
 * Safe to run multiple times; skips files that were already moved.
 */
const fs = require('fs');
const path = require('path');

const moves = [
  { from: 'app', to: 'examples/laravel/app' },
  { from: 'database', to: 'examples/laravel/database' },
  { from: 'composer.json', to: 'examples/laravel/composer.json' },
  { from: 'phpunit.xml', to: 'examples/laravel/phpunit.xml' },
  { from: 'phpstan.neon', to: 'examples/laravel/phpstan.neon' },
];

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function moveRecursive(src, dest) {
  if (!fs.existsSync(src)) return false;
  ensureDir(path.dirname(dest));
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    ensureDir(dest);
    for (const entry of fs.readdirSync(src)) {
      moveRecursive(path.join(src, entry), path.join(dest, entry));
    }
    fs.rmdirSync(src);
  } else {
    fs.renameSync(src, dest);
  }
  return true;
}

let moved = 0;
for (const m of moves) {
  const src = path.join(process.cwd(), m.from);
  const dest = path.join(process.cwd(), m.to);
  if (fs.existsSync(src)) {
    console.log(`➡️  Moving ${m.from} → ${m.to}`);
    moveRecursive(src, dest);
    moved++;
  } else {
    // Skip silently if already moved
  }
}

if (moved === 0)
  console.log(
    'ℹ️  Nothing to move. Laravel example is already under examples/laravel/.'
  );
else console.log('✅ Laravel example relocated to examples/laravel/.');
