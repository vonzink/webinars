import test from 'node:test';
import assert from 'node:assert/strict';
import { DOCUMENTS, EXPLANATIONS, HOTSPOTS } from '../content/index.js';
import { validateContent } from '../js/content-validation.js';

const release = process.env.LE_CD_RELEASE === '1';

test('release content has recorded MSFG review', { skip: !release }, () => {
  assert.deepEqual(validateContent({ DOCUMENTS, EXPLANATIONS, HOTSPOTS, release: true }), []);
  for (const item of Object.values(EXPLANATIONS)) {
    assert.match(item.review.reviewer, /\S+\s+\S+/);
    assert.match(item.review.reviewedOn, /^\d{4}-\d{2}-\d{2}$/);
  }
});
