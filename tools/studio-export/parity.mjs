#!/usr/bin/env node
/* Compare an exported bundle, rendered in the real Studio slide frame, with the
   static deck it came from.

     node tools/studio-export/parity.mjs first-home-without-mystery

   After an import, the same check can run on what the backend actually serves:

     node tools/studio-export/parity.mjs <deck-slug> --live-bundle <file.json> --approved-dir <dir>

   where the file is the public live-bundle JSON and the directory holds the
   approved asset bodies named by their SHA-256.

   Screenshots land in the deck's output/playwright/ folder. */

import path from 'node:path';
import { loadDeck } from './export.mjs';
import { runParity } from './lib/parity.mjs';

const MAX_CHANGED_RATIO = 0.001;   // 0.1% of the slide

const [slug, ...rest] = process.argv.slice(2);
const option = name => {
  const index = rest.indexOf(name);
  return index >= 0 && rest[index + 1] ? path.resolve(rest[index + 1]) : null;
};
if (!slug) {
  console.error('Usage: node tools/studio-export/parity.mjs <deck-slug> [--live-bundle <file> --approved-dir <dir>]');
  process.exit(2);
}

const deck = await loadDeck(slug);
const results = await runParity(deck, { liveBundlePath: option('--live-bundle'), approvedDir: option('--approved-dir') });
const percent = ratio => `${(ratio * 100).toFixed(3)}%`;
let failed = results.pageErrors.length > 0;

for (const entry of [...results.slides, ...results.popouts, ...results.calculators]) {
  const checks = ['reportedOpen', 'reportedClose', 'shellToggle']
    .filter(name => name in entry)
    .map(name => `${name}=${entry[name]}`);
  const ok = entry.sameSize && entry.ratio <= MAX_CHANGED_RATIO
    && !checks.some(check => check.endsWith('=false'));
  if (!ok) failed = true;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${entry.kind.padEnd(10)} ${entry.label.padEnd(44)} ${percent(entry.ratio).padStart(8)} ${checks.join(' ')}`);
}
results.pageErrors.forEach(error => console.log(`page error: ${error}`));
process.exit(failed ? 1 : 0);
