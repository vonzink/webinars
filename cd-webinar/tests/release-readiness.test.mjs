import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DOCUMENTS, EXPLANATIONS, HOTSPOTS } from '../content/index.js';
import { getReleaseReadinessErrors } from '../scripts/reviewed-corpus.mjs';

const release = process.env.LE_CD_RELEASE === '1';

test('release content has recorded MSFG review bound to the exact corpus digest', { skip: !release }, async () => {
  const approval = JSON.parse(await readFile(new URL('../CONTENT-APPROVAL.json', import.meta.url), 'utf8'));
  assert.deepEqual(await getReleaseReadinessErrors({
    documents: DOCUMENTS,
    explanations: EXPLANATIONS,
    hotspots: HOTSPOTS,
    approval,
  }), []);
});
