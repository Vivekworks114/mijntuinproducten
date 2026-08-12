#!/usr/bin/env node
/**
 * Fail if the repo tracks any Windows-invalid paths (e.g. files with ? in the name).
 * Run before commit / in CI: node scripts/check-windows-paths.mjs
 */
import { execSync } from 'child_process';
import { isWindowsInvalidPath } from './lib/safe-media-path.mjs';

const files = execSync('git ls-files -z', { encoding: 'buffer' })
  .toString('utf8')
  .split('\0')
  .filter(Boolean);

const bad = files.filter((f) => isWindowsInvalidPath(f));

if (bad.length) {
  console.error(`Found ${bad.length} Windows-invalid path(s):`);
  for (const f of bad) console.error(`  ${f}`);
  console.error('\nStrip query strings from downloads (see scripts/download-images.mjs).');
  process.exit(1);
}

console.log(`OK — ${files.length} tracked paths are Windows-safe.`);
