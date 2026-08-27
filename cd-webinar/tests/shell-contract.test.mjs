import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('the static shell exposes the approved landmarks and module entry point', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /<nav[^>]+aria-label="Disclosure pages"/);
  assert.match(html, /data-document-stage/);
  assert.match(html, /data-explanation-panel/);
  assert.match(html, /type="module" src="\.\/js\/app\.js"/);
  assert.doesNotMatch(html, /Previous lesson|Next lesson|progress/i);
});
