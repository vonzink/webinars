import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { DOCUMENTS } from '../content/index.js';

const root = new URL('../', import.meta.url);
const expectedHashes = {
  le: '243551dbce6362e616328924eaf5b1818b734883d43ec91a73c160e5da52b385',
  cd: '606a93c8baaca815439822df5cf8c78cbb2dcf6cc4af5aa291a459c7917e4173',
};
const expectedImageHashes = {
  'le-page-1.png': '8f0960834b269a2d0ac680a8a29aaf7c448b6dc83c0c92eca8326f5f3902a55d',
  'le-page-2.png': '7e681d6addcb16ea400781f984a744d203f1fdbe1b57b2f7bba4d3f1f98e2334',
  'le-page-3.png': '20332e10436970186e898a996fb5b4e6e2d3f94a172dcc603ef7558f2716abfb',
  'cd-page-1.png': 'b6ab7f2df56ce60d44697ba9775d0f390c26c8a6956084428647f94d464556f5',
  'cd-page-2.png': 'e619148dc21ecf80ca64ccfe8d9c2a41b82377b654f9f02b85cc4f03a06ccb31',
  'cd-page-3.png': '584907464dc03b06cea726a1d1c90e9683c9d1f43449e962a1d969a9d97a68a9',
  'cd-page-4.png': '072a6e2498ff0a5b7345f9ebb38e554fa33acd16b9ec1f701d932d2d3082ecaa',
  'cd-page-5.png': 'b6b78b33d349bd075abe2aa86eaee0c35be88c69c9621c1c4b2f1b0931e5e80e',
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

test('the source manifest and runtime catalog have the exact same page mapping', async () => {
  const manifest = JSON.parse(await readFile(new URL('references/source-manifest.json', root)));
  const runtimeMapping = DOCUMENTS.map(document => ({
    id: document.id,
    sourcePdf: document.pages[0].sourcePdf.replace('./references/', ''),
    pageMap: Object.fromEntries(document.pages.map(page => [String(page.number), page.pdfPage])),
  }));
  const manifestMapping = manifest.documents.map(document => ({
    id: document.id,
    sourcePdf: document.file,
    pageMap: document.pageMap,
  }));

  assert.deepEqual(runtimeMapping, [
    {
      id: 'le',
      sourcePdf: 'loan-estimate-H24B.pdf',
      pageMap: { 1: 2, 2: 3, 3: 4 },
    },
    {
      id: 'cd',
      sourcePdf: 'closing-disclosure-H25B.pdf',
      pageMap: { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6 },
    },
  ]);
  assert.deepEqual(manifestMapping, runtimeMapping);
});

test('the eight form pages are rendered at the approved size', async () => {
  for (const [prefix, count] of [['le', 3], ['cd', 5]]) {
    for (let page = 1; page <= count; page += 1) {
      const data = await readFile(new URL(`assets/documents/${prefix}-page-${page}.png`, root));
      assert.deepEqual(pngSize(data), { width: 1530, height: 1980 });
      assert.equal(
        createHash('sha256').update(data).digest('hex'),
        expectedImageHashes[`${prefix}-page-${page}.png`],
      );
    }
  }
});
