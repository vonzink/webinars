import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('educational popouts measure at authored width and use the shared controller', async () => {
  const [source, css] = await Promise.all([read('js/modal.js'), read('css/components.css')]);
  assert.match(source, /from '\.\/surface-fit\.js'/);
  assert.match(source, /CONTENT_WIDTH\s*=\s*1200/);
  assert.match(source, /WIDE_CONTENT_WIDTH\s*=\s*1500/);
  assert.match(source, /document\.fonts\.ready/);
  assert.match(source, /surface\.scrollHeight/);
  assert.match(source, /createSurfaceController\(/);
  assert.match(source, /data-fit-shell/);
  assert.match(source, /data-fit-surface/);
  assert.match(css, /\.modal\s*\{[^}]*transform-origin:\s*top left/s);
  assert.match(css, /\.modal\s*\{[^}]*transition:\s*none/s);
  assert.match(css, /\.modal-head\s*\{[^}]*height:\s*52px/s);
  assert.match(css, /\.modal-title\s*\{[^}]*font-size:\s*20px/s);
  assert.doesNotMatch(source, /modal-eyebrow|modal-title-bar/);
  assert.doesNotMatch(css, /\.modal-body\s*\{[^}]*overflow-y:\s*(?:auto|scroll)/s);
  assert.doesNotMatch(css, /\.modal-table-wrap\s*\{[^}]*overflow-x:\s*(?:auto|scroll)/s);
  assert.doesNotMatch(css, /max-height:\s*\d+vh|height:\s*min\([^;]*vh/);
});

test('modal controls are part of the scaled design surface', async () => {
  const source = await read('js/modal.js');
  const surfaceMarkup = source.match(/<div class="modal"[\s\S]*?<\/div>\s*<\/div>/)?.[0] || '';
  assert.match(surfaceMarkup, /modal-close/);
  assert.match(surfaceMarkup, /modal-resize/);
  assert.match(source, /aria-label="Resize popout"/);
  assert.doesNotMatch(source, /Math\.max\(520|Math\.max\(300/);
});

test('graphics remain operational on the shared controller before native image sizing', async () => {
  const source = await read('js/modal.js');
  assert.match(source, /LEGACY_MEDIA_SIZE\s*=\s*Object\.freeze\(\{\s*width:\s*1600,\s*height:\s*900\s*\}\)/);
  assert.match(source, /currentDesignSize\s*=\s*LEGACY_MEDIA_SIZE/);
});
