import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../js/surface-fit.js', import.meta.url), 'utf8').catch(() => '');

test('shared surface controller owns fit lifecycle and transformed bounds', () => {
  assert.match(source, /export function createSurfaceController\(/);
  assert.match(source, /fitOverlay\(/);
  assert.match(source, /clampOverlay\(/);
  assert.match(source, /resizeOverlay\(/);
  assert.match(source, /new ResizeObserver\(/);
  assert.match(source, /requestAnimationFrame\(/);
  assert.match(source, /transform:\s*`scale\(\$\{next\.scale\}\)`/);
  assert.match(source, /preferredScale/);
  assert.match(source, /userPositioned/);
});

test('controller exposes the complete application interface', () => {
  for (const name of ['setActive', 'fit', 'reset', 'moveFrom', 'resizeFrom', 'scheduleFit', 'getGeometry', 'destroy']) {
    assert.match(source, new RegExp(`\\b${name}\\b`));
  }
  assert.doesNotMatch(source, /overflow|scrollHeight|scrollWidth/);
});
