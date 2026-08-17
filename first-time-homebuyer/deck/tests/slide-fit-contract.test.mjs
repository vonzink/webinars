import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('base slide uses the shared 1920 by 1080 fit surface at every viewport', async () => {
  const [html, source, css] = await Promise.all([
    read('index.html'), read('js/deck.js'), read('css/base.css'),
  ]);
  assert.match(html, /class="slide-fit-shell"[^>]*data-fit-shell/);
  assert.match(html, /class="slide-scaler"[^>]*data-fit-surface/);
  assert.match(source, /from '\.\/surface-fit\.js'/);
  assert.match(source, /width:\s*1920,\s*height:\s*1080/);
  assert.match(source, /createSurfaceController\(/);
  assert.doesNotMatch(source, /matchMedia\('\(max-width:\s*900px\)'\)/);
  assert.match(css, /\.slide-fit-shell\s*\{/);
  assert.match(css, /\.slide-scaler\s*\{[^}]*transform-origin:\s*top left/s);
});

test('slide CSS contains no viewport-driven mobile composition', async () => {
  const files = await Promise.all([
    read('css/base.css'), read('css/components.css'), read('css/slides.css'),
  ]);
  for (const css of files) {
    assert.doesNotMatch(css, /@media\s*\(max-width:\s*900px\)/);
  }
  assert.doesNotMatch(files.join('\n'), /\.stage\s*\{[^}]*position:\s*static/s);
  assert.doesNotMatch(files.join('\n'), /\.slide-scaler\s*\{[^}]*transform:\s*none\s*!important/s);
});
