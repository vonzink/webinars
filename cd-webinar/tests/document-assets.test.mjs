import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { DOCUMENTS } from '../content/index.js';

const root = new URL('../', import.meta.url);
const expectedHashes = {
  le: '243551dbce6362e616328924eaf5b1818b734883d43ec91a73c160e5da52b385',
  le2: 'baadbe3d1f1254f422c6ab30b53dac91649be9d5300702cd5068bc1090be1560',
  le3: '15713c0328a3a45c856ba1d88a3e462b6aaab2b2b6f1d54227379478d26e610b',
  cd: '606a93c8baaca815439822df5cf8c78cbb2dcf6cc4af5aa291a459c7917e4173',
  cd2: '6c05ffba10741d55d5bdc6dd946eefc0873fd6088a19c3a24219fb2ed8aa341a',
  cd3: '06386504873d5d3d8b2268a128a1f9f39d5fcd6407a79ca1d611a9fa94c3789c',
};
const expectedImageHashes = {
  'le-page-1.png': '8f0960834b269a2d0ac680a8a29aaf7c448b6dc83c0c92eca8326f5f3902a55d',
  'le-page-2.png': '7e681d6addcb16ea400781f984a744d203f1fdbe1b57b2f7bba4d3f1f98e2334',
  'le-page-3.png': '20332e10436970186e898a996fb5b4e6e2d3f94a172dcc603ef7558f2716abfb',
  'le2-page-1.png': '6680254ab35e904c6e97d7441c78a8ab2fc34c8a782ea9d5c4e5e7094045d0e0',
  'le2-page-2.png': 'de48efdd3d5032c88e346ef5790746519e08a15f709131bbcc3a61eae27a246a',
  'le2-page-3.png': '8b223fd73ff99d90d8ea5d56b2670e14890fcaeab4152879a7b34a860615646b',
  'le3-page-1.png': '7e3324f4d71e28af712c20b6c37c8725d849eeb229189fc1ad871090561ddd6d',
  'le3-page-2.png': 'ebaa931e4d2ff01b826ecdceb22bc9c035341071f0b6bde5c397611d0f238ceb',
  'le3-page-3.png': 'c5c3370d995c15733d346e49acd31dfa219f9f1d82d6fa7f07af65d1d489832d',
  'cd-page-1.png': 'b6ab7f2df56ce60d44697ba9775d0f390c26c8a6956084428647f94d464556f5',
  'cd-page-2.png': 'e619148dc21ecf80ca64ccfe8d9c2a41b82377b654f9f02b85cc4f03a06ccb31',
  'cd-page-3.png': '584907464dc03b06cea726a1d1c90e9683c9d1f43449e962a1d969a9d97a68a9',
  'cd-page-4.png': '072a6e2498ff0a5b7345f9ebb38e554fa33acd16b9ec1f701d932d2d3082ecaa',
  'cd-page-5.png': 'b6b78b33d349bd075abe2aa86eaee0c35be88c69c9621c1c4b2f1b0931e5e80e',
  'cd2-page-1.png': '4ac8ab9051a85f2bc7cbd4aa0a138e6937aabd5c933f6afe3a376ef396e41bdf',
  'cd2-page-2.png': '524c328175baf64f1f426eb2631b89f168a0174855c14534139e8d6c148c0a54',
  'cd2-page-3.png': 'cac2e04d2ea58413e88f6d2ba5cfd65515fd665081167d854f99e386ebb36688',
  'cd2-page-4.png': '7a0a8877329e257b702f27b34170c55547f9b07abffc656f9f8cbb293c4c5c28',
  'cd2-page-5.png': 'e881ad77a1e71d39dfdeb2b6416e80d75b274b6899cf761558a19f261ffaf62a',
  'cd3-page-1.png': '6cb9153e93cbf67ecd998457b5489d44cb1cd4972068b8d0e1f54d172d27e188',
  'cd3-page-2.png': '7dcec577cb7f4022628d440b149f01a5811dec01bfcede92937187a0fb01c1f1',
  'cd3-page-3.png': 'ab7c67cf2e753aa845f31e4681da1d3e83258fbb309f39c38925f955e81aef23',
  'cd3-page-4.png': '22fddb3529a7e357ca1df9daa4803fb3dcf4dcd1b183c1365462ba32c09a2b3f',
  'cd3-page-5.png': '4037200ee2b86e26f18e3cb74ae6dd4c74fad4efd3b2034c405a26a5ea1a2685',
};

const runtimeExamples = DOCUMENTS.flatMap(document => document.examples);

const pngSize = data => ({
  width: data.readUInt32BE(16),
  height: data.readUInt32BE(20),
});

test('the matched source PDFs are hash-pinned', async () => {
  const manifest = JSON.parse(await readFile(new URL('references/source-manifest.json', root)));
  assert.deepEqual(manifest.documents.map(item => item.id), ['le', 'le2', 'le3', 'cd', 'cd2', 'cd3']);
  for (const item of manifest.documents) {
    const data = await readFile(new URL(`references/${item.file}`, root));
    assert.equal(createHash('sha256').update(data).digest('hex'), expectedHashes[item.id]);
  }
});

test('the source manifest and runtime catalog have the exact same page mapping', async () => {
  const manifest = JSON.parse(await readFile(new URL('references/source-manifest.json', root)));
  const runtimeMapping = runtimeExamples.map(example => ({
    id: example.id,
    sourcePdf: example.pages[0].sourcePdf.replace('./references/', ''),
    pageMap: Object.fromEntries(example.pages.map(page => [String(page.number), page.pdfPage])),
  }));
  const manifestMapping = manifest.documents
    .map(document => ({ id: document.id, sourcePdf: document.file, pageMap: document.pageMap }))
    .sort((a, b) => runtimeMapping.findIndex(item => item.id === a.id) - runtimeMapping.findIndex(item => item.id === b.id));

  assert.deepEqual(runtimeMapping.find(item => item.id === 'le'), {
    id: 'le',
    sourcePdf: 'loan-estimate-H24B.pdf',
    pageMap: { 1: 2, 2: 3, 3: 4 },
  });
  assert.deepEqual(runtimeMapping.find(item => item.id === 'le3'), {
    id: 'le3',
    sourcePdf: 'loan-estimate-model-H24A.pdf',
    pageMap: { 1: 2, 2: 4, 3: 8 },
  });
  assert.deepEqual(runtimeMapping.find(item => item.id === 'cd'), {
    id: 'cd',
    sourcePdf: 'closing-disclosure-H25B.pdf',
    pageMap: { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6 },
  });
  assert.deepEqual(manifestMapping, runtimeMapping);
});

test('all twenty-four form pages are rendered at the approved size and hash-pinned', async () => {
  const seen = [];
  for (const example of runtimeExamples) {
    for (const page of example.pages) {
      const file = page.image.replace('./assets/documents/', '');
      const data = await readFile(new URL(`assets/documents/${file}`, root));
      assert.deepEqual(pngSize(data), { width: 1530, height: 1980 }, file);
      assert.equal(createHash('sha256').update(data).digest('hex'), expectedImageHashes[file], file);
      seen.push(file);
    }
  }
  assert.equal(seen.length, 24);
  assert.deepEqual([...seen].sort(), Object.keys(expectedImageHashes).sort());
});
