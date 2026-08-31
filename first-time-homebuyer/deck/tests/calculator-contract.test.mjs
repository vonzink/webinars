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

test('calculator scales two complete fixed design states without internal scrolling', async () => {
  const [source, css] = await Promise.all([read('js/calculator.js'), read('css/calculator.css')]);

  assert.match(source, /from '\.\/surface-fit\.js'/);
  assert.match(source, /CALCULATOR_WIDTH\s*=\s*560/);
  assert.match(source, /CALCULATOR_COLLAPSED_HEIGHT\s*=\s*820/);
  assert.match(source, /CALCULATOR_EXPANDED_HEIGHT\s*=\s*982/);
  assert.match(source, /createSurfaceController\(/);
  assert.doesNotMatch(source, /canvas\.scrollHeight|measureHeight/);
  assert.match(source, /data-fit-shell/);
  assert.match(source, /data-fit-surface/);
  assert.match(css, /\.calculator-canvas\s*\{[^}]*transform-origin:\s*top left/s);
  assert.match(css, /\.calculator-grid\s*\{[^}]*grid-template-columns:\s*1fr 1fr/s);
  assert.match(css, /\.calculator-scroll\s*\{[^}]*overflow:\s*visible/s);
  assert.doesNotMatch(css, /overflow(?:-x|-y)?:\s*(?:auto|scroll)/);
  assert.doesNotMatch(css, /@media\s*\(max-width/);
});

test('calculator controls are inside the uniformly scaled surface', async () => {
  const source = await read('js/calculator.js');
  const canvasMarkup = source.match(/<div class="calculator-canvas"[\s\S]*?<\/div>\s*<\/section>/)?.[0] || '';
  assert.match(canvasMarkup, /calculator-close/);
  assert.match(canvasMarkup, /calculator-resize-handle/);
});

test('advanced toggle skips its queued refit after the calculator closes', async () => {
  const source = await read('js/calculator.js');

  assert.match(
    source,
    /requestAnimationFrame\(\(\)\s*=>\s*\{\s*if\s*\(visible\)\s*fitController\.fit\(\);?\s*}\)/s,
    'calculator.js must guard the queued advanced-toggle refit with visible before fitting a hidden canvas',
  );
});

test('presenter has a persistent calculator control with synchronized labels', async () => {
  const [html, source] = await Promise.all([read('presenter.html'), read('js/presenter.js')]);

  assert.match(html, /rel="icon" href="data:,"/);
  assert.match(html, /id="p-calculator"/);
  assert.match(source, /Show mortgage calculator/);
  assert.match(source, /Hide mortgage calculator/);
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
