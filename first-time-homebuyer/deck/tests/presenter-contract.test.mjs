import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

function assertCalculatorIsLastTopBarControl(bar) {
  const clocksIndex = bar.indexOf('class="p-clocks"');
  const calculatorIndex = bar.indexOf('id="p-calculator"');
  const interactiveControls = [...bar.matchAll(/<(?:button|a|input|select|textarea)\b[^>]*>/g)];
  const calculatorControlIndex = interactiveControls.findIndex(control => control[0].includes('id="p-calculator"'));
  const buydownControlIndex = interactiveControls.findIndex(control => control[0].includes('id="p-buydown"'));

  assert.notEqual(clocksIndex, -1, 'top presenter bar must include the clocks');
  assert.notEqual(calculatorIndex, -1, 'top presenter bar must include the calculator');
  assert.ok(clocksIndex < calculatorIndex, 'calculator must follow the clocks');
  assert.equal(buydownControlIndex, calculatorControlIndex + 1, 'buydown must immediately follow the calculator');
  assert.equal(buydownControlIndex, interactiveControls.length - 1, 'calculator utilities must be the last interactive top-bar control block');
}

test('calculator is an icon-only utility at the end of the top presenter bar', async () => {
  const [html, source] = await Promise.all([read('presenter.html'), read('js/presenter.js')]);
  const bar = html.match(/<header class="p-bar">([\s\S]*?)<\/header>/)?.[1] || '';
  const button = html.match(/<button[^>]*id="p-calculator"[^>]*>([\s\S]*?)<\/button>/)?.[1] || '';

  assertCalculatorIsLastTopBarControl(bar);
  assert.match(button, /<svg/);
  assert.doesNotMatch(button, /Show calculator|Hide calculator/);
  assert.match(source, /const label = calculatorVisible \? 'Hide mortgage calculator' : 'Show mortgage calculator'/);
  assert.match(source, /button\.setAttribute\('aria-label', label\)/);
  assert.match(source, /button\.setAttribute\('title', label\)/);
  assert.match(source, /button\.setAttribute\('aria-pressed', String\(calculatorVisible\)\)/);
  assert.match(source, /button\.classList\.toggle\('on', calculatorVisible\)/);
});

test('calculator top-bar order rejects missing clocks and later controls', () => {
  const orderedBar = '<div class="p-clocks"></div><button id="p-calculator"></button><button id="p-buydown"></button>';

  assert.throws(
    () => assertCalculatorIsLastTopBarControl(orderedBar.replace('class="p-clocks"', 'class="p-timers"')),
    /must include the clocks/
  );
  assert.throws(
    () => assertCalculatorIsLastTopBarControl(`${orderedBar}<button id="p-help"></button>`),
    /last interactive top-bar control/
  );
});

test('popouts precede graphics in one responsive action library', async () => {
  const [html, source] = await Promise.all([read('presenter.html'), read('js/presenter.js')]);

  assert.match(html, /id="p-library-grid"/);
  assert.ok(html.indexOf('id="p-popout-section"') < html.indexOf('id="p-media-section"'));
  assert.match(html, />Popouts \(<span id="p-popout-count">0<\/span>\)</);
  assert.match(html, />Graphics \(<span id="p-media-count">0<\/span>\)</);
  assert.match(html, /\.p-right\s*\{[^}]*container-type:\s*inline-size/s);
  assert.match(html, /\.p-library-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s);
  assert.match(html, /\.p-library-grid\.is-single\s*\{[^}]*grid-template-columns:\s*1fr/s);
  assert.match(html, /@container\s*\(max-width:\s*420px\)\s*\{[\s\S]*?\.p-library-grid\s*\{[^}]*grid-template-columns:\s*1fr/s);
  assert.match(source, /library\.classList\.toggle\('is-single', media\.length === 0\)/);
});

test('existing popout, media, and calculator channel messages remain intact', async () => {
  const source = await read('js/presenter.js');

  assert.match(source, /type:\s*'open',\s*id/);
  assert.match(source, /type:\s*'open-media',\s*id:\s*item\.id/);
  assert.match(source, /type:\s*'calculator-visibility',\s*visible:\s*!calculatorVisible/);
  assert.match(source, /type === 'calculator-state'/);
});

test('D toggles drawing through the existing state path and stays out of text entry', async () => {
  const [html, source] = await Promise.all([read('presenter.html'), read('js/presenter.js')]);

  assert.match(html, /id="p-annon"[^>]*aria-pressed="false"/);
  assert.match(html, /id="p-ann-state">Off<\/span>/);
  assert.match(html, /<kbd[^>]*>D<\/kbd>/);
  assert.match(source, /function renderAnnState\(on\)/);
  assert.match(source, /function isTextEntryTarget\(target\)/);
  assert.match(source, /function isDrawShortcut\(event\)/);
  assert.match(source, /event\.key\.toLowerCase\(\) === 'd'/);
  assert.match(source, /!event\.repeat/);
  assert.match(source, /!event\.ctrlKey/);
  assert.match(source, /!event\.altKey/);
  assert.match(source, /!event\.metaKey/);
  assert.match(source, /!isTextEntryTarget\(event\.target\)/);
  assert.match(source, /if \(isDrawShortcut\(e\)\)[\s\S]*setAnnOn\(!annOn\)/);
  assert.match(source, /if \(e\.key === 'ArrowRight' \|\| e\.key === ' '\)/);
  assert.match(source, /if \(e\.key === 'ArrowLeft'\)/);
});
