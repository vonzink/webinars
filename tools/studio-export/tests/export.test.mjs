/* Export contract for every configured deck.
   Each deck is captured once in a real browser; the committed bundle must match
   a fresh export, so a deck edit that is not re-exported fails here.

   Set DASHBOARD_ROOT to a dashboard.msfgco.com checkout to also run the
   Dashboard's own content policy against each bundle. */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { canonicalJson } from '../lib/canonical-json.mjs';
import { exportDeck, REPO_ROOT } from '../lib/export-deck.mjs';
import { validateBundle } from '../lib/validate.mjs';

const DECKS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'decks');
const DASHBOARD_ROOT = process.env.DASHBOARD_ROOT;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const decks = await Promise.all(fs.readdirSync(DECKS_DIR).sort()
  .map(async name => (await import(path.join(DECKS_DIR, name))).default));

for (const deck of decks) {
  const exported = await exportDeck(deck);
  const { bundle, assetManifest, report } = exported;

  test(`${deck.slug}: bundle shape`, () => {
    assert.equal(bundle.schemaVersion, 1);
    assert.equal(bundle.webinar.slug, deck.slug);
    assert.equal(bundle.slides.length, deck.expectedSlides);
    assert.equal((bundle.master.html.match(/{{SLIDE_CONTENT}}/g) || []).length, 1);
    assert.deepEqual(bundle.slides.map(slide => slide.position), bundle.slides.map((_slide, index) => index));
    assert.equal(new Set(bundle.slides.map(slide => slide.id)).size, deck.expectedSlides);
    assert.equal(new Set(bundle.slides.map(slide => slide.anchor)).size, deck.expectedSlides);
    for (const slide of bundle.slides) {
      assert.match(slide.id, UUID);
      assert.ok(slide.title.trim(), `${slide.anchor} has a title`);
      assert.ok(Number.isInteger(slide.targetSeconds) && slide.targetSeconds > 0, `${slide.anchor} has a target time`);
      assert.ok(slide.speakerNotes.trim(), `${slide.anchor} has speaker notes`);
      assert.match(slide.html, /^<section class="slide is-active"/);
      assert.doesNotMatch(slide.html, /\bis-in\b/, `${slide.anchor} builds start hidden`);
    }
  });

  test(`${deck.slug}: nothing private or machine-specific leaks into the bundle`, () => {
    const everything = JSON.stringify(bundle);
    for (const forbidden of ['x-webinar-key', 'writeKey', 'api.msfgco.com', REPO_ROOT, '/Users/']) {
      assert.ok(!everything.includes(forbidden), `bundle must not contain ${forbidden}`);
    }
    for (const slide of bundle.slides) {
      for (const field of ['html', 'css', 'javascript']) {
        assert.ok(!slide[field].includes(slide.speakerNotes), `${slide.anchor}.${field} must not embed speaker notes`);
        assert.doesNotMatch(slide[field], /(?:^|["'(\s])\.?\/?assets\//, `${slide.anchor}.${field} has a local asset path`);
      }
      assert.doesNotMatch(slide.html, /<a\b[^>]*\bhref=/, `${slide.anchor} has a live link`);
    }
  });

  test(`${deck.slug}: every asset is referenced, hashed, and present`, () => {
    const referenced = new Set(JSON.stringify(bundle).match(/\{\{LOCAL_ASSET:[a-z0-9-]+\}\}/g) || []);
    assert.equal(referenced.size, assetManifest.assets.length);
    for (const asset of assetManifest.assets) {
      assert.ok(referenced.has(`{{LOCAL_ASSET:${asset.key}}}`), `${asset.key} is referenced`);
      assert.match(asset.sha256, /^[a-f0-9]{64}$/);
      assert.ok(asset.usedBy.length > 0);
      assert.equal(fs.statSync(path.join(REPO_ROOT, deck.deckDir, asset.path)).size, asset.byteSize);
    }
  });

  test(`${deck.slug}: popouts and calculators are wired on the slides that use them`, () => {
    for (const entry of report.slides) {
      const slide = bundle.slides.find(candidate => candidate.anchor === entry.anchor);
      const overlays = entry.popouts.length + entry.graphics.length > 0;
      assert.equal(slide.javascript.includes('supported-overlay-state'), overlays, `${entry.anchor} popouts and graphics`);
      assert.equal(slide.html.includes('class="slide-graphics"'), slide.javascript.includes('startGraphicsMenu'), `${entry.anchor} graphics menu`);
      for (const id of [...entry.popouts, ...entry.graphics]) assert.match(id, /^[a-z][a-z0-9-]{0,63}$/);
      assert.equal(slide.javascript.includes('supported-calculator-state'), Boolean(entry.calculator), `${entry.anchor} calculator`);
      assert.ok(slide.javascript.includes('animation-state'), `${entry.anchor} builds`);
    }
  });

  test(`${deck.slug}: a second export is byte-for-byte identical`, async () => {
    const again = await exportDeck(deck);
    assert.equal(canonicalJson(again.bundle), canonicalJson(bundle));
    assert.equal(canonicalJson(again.assetManifest), canonicalJson(assetManifest));
  });

  test(`${deck.slug}: the committed export is current`, () => {
    const read = name => fs.readFileSync(path.join(REPO_ROOT, deck.outDir, name), 'utf8');
    assert.equal(read('source-bundle.json'), canonicalJson(bundle), 'run tools/studio-export/export.mjs and commit the result');
    assert.equal(read('asset-manifest.json'), canonicalJson(assetManifest));
    assert.equal(read('export-report.json'), canonicalJson(report));
  });

  test(`${deck.slug}: passes the Dashboard content policy`, { skip: DASHBOARD_ROOT ? false : 'DASHBOARD_ROOT is not set' }, () => {
    assert.deepEqual(validateBundle(bundle, DASHBOARD_ROOT), []);
  });

  test(`${deck.slug}: the policy check is not vacuous`, { skip: DASHBOARD_ROOT ? false : 'DASHBOARD_ROOT is not set' }, () => {
    const broken = structuredClone(bundle);
    broken.slides[0].html += '<a href="https://example.com">x</a><img src="./assets/a.png">';
    broken.master.css += '\na::before { content: "\\2013"; }';
    const codes = validateBundle(broken, DASHBOARD_ROOT).map(issue => issue.code);
    assert.ok(codes.includes('RESOURCE_ORIGIN_FORBIDDEN'));
    assert.ok(codes.includes('RESOURCE_NOT_HTTPS'));
    assert.ok(codes.includes('CSS_VALUE_UNSUPPORTED'));
  });
}
