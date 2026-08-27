import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const expectedHashes = {
  le: '243551dbce6362e616328924eaf5b1818b734883d43ec91a73c160e5da52b385',
  cd: '606a93c8baaca815439822df5cf8c78cbb2dcf6cc4af5aa291a459c7917e4173',
};

const pngSize = data => ({
  width: data.readUInt32BE(16),
  height: data.readUInt32BE(20),
});

test('the matched source PDFs are hash-pinned', async () => {
  const manifest = JSON.parse(await readFile(new URL('references/source-manifest.json', root)));
  assert.deepEqual(manifest.documents.map(item => item.id), ['le', 'cd']);
  for (const item of manifest.documents) {
    const data = await readFile(new URL(`references/${item.file}`, root));
    assert.equal(createHash('sha256').update(data).digest('hex'), expectedHashes[item.id]);
  }
});

test('the eight form pages are rendered at the approved size', async () => {
  for (const [prefix, count] of [['le', 3], ['cd', 5]]) {
    for (let page = 1; page <= count; page += 1) {
      const data = await readFile(new URL(`assets/documents/${prefix}-page-${page}.png`, root));
      assert.deepEqual(pngSize(data), { width: 1530, height: 1980 });
    }
  }
});
