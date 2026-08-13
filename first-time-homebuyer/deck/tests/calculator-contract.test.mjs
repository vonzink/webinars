import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('audience entry point loads the calculator stylesheet', async () => {
  const html = await read('index.html');
  assert.match(html, /href="\.\/css\/calculator\.css"/);
  assert.match(html, /rel="icon" href="data:,"/);
});

test('calculator module exposes the approved dialog interface and content', async () => {
  const source = await read('js/calculator.js');

  assert.match(source, /export function initCalculator\(/);
  assert.match(source, /export function setCalculatorVisible\(/);
  assert.match(source, /export function isCalculatorVisible\(/);
  assert.match(source, /role="dialog"/);
  assert.match(source, /aria-modal="true"/);
  assert.match(source, /Estimate your payment/);
  assert.match(source, /Indicative only\. Not a commitment to lend\./);
  assert.match(source, /Mountain State Financial Group, LLC/);
  assert.match(source, /NMLS# 1314257/);
  assert.match(source, /EQUAL%20HOUSING%20LENDER\.png/);
  assert.match(source, /data-calculator-resize/);
  assert.match(source, /aria-label="Close calculator"/);
  assert.doesNotMatch(source, /Get my real rate|msfg\.us/);
});

test('calculator uses shared proportional geometry without a scrolling mobile sheet', async () => {
  const [source, css] = await Promise.all([read('js/calculator.js'), read('css/calculator.css')]);

  assert.match(source, /from '\.\/overlay-geometry\.js'/);
  assert.match(source, /INTRINSIC_WIDTH\s*=\s*560/);
  for (const name of ['fitOverlay', 'resizeOverlay', 'clampOverlay']) {
    assert.match(source, new RegExp(`${name}\\(`));
  }
  assert.match(source, /canvas\.scrollHeight/);
  assert.match(css, /\.calculator-canvas\s*\{[^}]*transform-origin:\s*top left/s);
  assert.match(css, /\.calculator-scroll\s*\{[^}]*overflow:\s*visible/s);
  assert.match(css, /\.calculator-advanced\[hidden\]\s*\{\s*display:\s*none/);
  assert.doesNotMatch(css, /min-width:\s*420px|min-height:\s*420px/);
  assert.doesNotMatch(css, /@media \(max-width:\s*560px\)/);
  assert.doesNotMatch(css, /overflow:\s*auto/);
  assert.doesNotMatch(css, /fonts\.googleapis\.com|@import\s+url/);
});

test('advanced toggle skips its queued refit after the calculator closes', async () => {
  const source = await read('js/calculator.js');

  assert.match(
    source,
    /requestAnimationFrame\(\(\)\s*=>\s*\{\s*if\s*\(!visible\)\s*return;\s*fitCalculator\(\{\s*preservePosition:\s*true\s*}\);?\s*}\)/s,
    'calculator.js must guard the queued advanced-toggle refit with visible before measuring a hidden canvas',
  );
});

test('presenter has a persistent calculator control with synchronized labels', async () => {
  const [html, source] = await Promise.all([read('presenter.html'), read('js/presenter.js')]);

  assert.match(html, /rel="icon" href="data:,"/);
  assert.match(html, /id="p-calculator"/);
  assert.match(source, /Show calculator/);
  assert.match(source, /Hide calculator/);
  assert.match(source, /type:\s*'calculator-visibility'/);
  assert.match(source, /type === 'calculator-state'/);
});

test('shared deck owns and broadcasts calculator visibility', async () => {
  const source = await read('js/deck.js');

  assert.match(source, /from '\.\/calculator\.js'/);
  assert.match(source, /initCalculator\(/);
  assert.match(source, /m\.type === 'calculator-visibility'/);
  assert.match(source, /type:\s*'calculator-state'/);
  assert.match(source, /isCalculatorVisible\(\)/);
});
