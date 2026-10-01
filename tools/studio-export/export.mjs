#!/usr/bin/env node
/* Export a static webinar deck as a Webinar Studio source bundle.

     node tools/studio-export/export.mjs first-home-without-mystery

   Writes source-bundle.json, asset-manifest.json, export-report.json, and
   source-checksums.sha256 into the deck's migration/ folder. Nothing is
   uploaded and nothing outside this repository is touched. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { REPO_ROOT, writeDeckExport } from './lib/export-deck.mjs';

const DECKS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'decks');

export async function loadDeck(slug) {
  const file = path.join(DECKS_DIR, `${slug}.mjs`);
  if (!/^[a-z0-9-]+$/.test(slug) || !fs.existsSync(file)) {
    const known = fs.readdirSync(DECKS_DIR).map(name => name.replace(/\.mjs$/, '')).join(', ');
    throw new Error(`Unknown deck "${slug}". Known decks: ${known}`);
  }
  return (await import(file)).default;
}

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error('Usage: node tools/studio-export/export.mjs <deck-slug>');
    process.exit(2);
  }
  const deck = await loadDeck(slug);
  const { bundle, assetManifest, report, files } = await writeDeckExport(deck);
  const relative = file => path.relative(REPO_ROOT, file);
  console.log(`${deck.title}`);
  console.log(`  slides:      ${bundle.slides.length}`);
  console.log(`  assets:      ${assetManifest.assets.length}`);
  console.log(`  inert links: ${report.inertLinks.length}`);
  console.log(`  bundle:      ${relative(files.bundle)}`);
  console.log(`  manifest:    ${relative(files.assets)}`);
  console.log(`  report:      ${relative(files.report)}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(error.message);
    process.exit(1);
  });
}
