import test from 'node:test';
import assert from 'node:assert/strict';
import { DOCUMENTS, EXPLANATIONS, HOTSPOTS } from '../content/index.js';
import {
  getRenderableHotspots,
  validateContent,
  validateDocumentCatalog,
} from '../js/content-validation.js';

test('catalog contains the exact twenty-four disclosure pages across six examples', () => {
  assert.deepEqual(DOCUMENTS.map(item => [item.id, item.pages.length]), [['le', 9], ['cd', 15]]);
  assert.deepEqual(DOCUMENTS.map(item => [item.id, item.examples.map(example => [example.id, example.pages.length])]), [
    ['le', [['le', 3], ['le2', 3], ['le3', 3]]],
    ['cd', [['cd', 5], ['cd2', 5], ['cd3', 5]]],
  ]);
  assert.deepEqual(DOCUMENTS.flatMap(item => item.pages.map(page => page.id)), [
    'le-1', 'le-2', 'le-3', 'le2-1', 'le2-2', 'le2-3', 'le3-1', 'le3-2', 'le3-3',
    'cd-1', 'cd-2', 'cd-3', 'cd-4', 'cd-5', 'cd2-1', 'cd2-2', 'cd2-3', 'cd2-4', 'cd2-5',
    'cd3-1', 'cd3-2', 'cd3-3', 'cd3-4', 'cd3-5',
  ]);
});

test('every page record is deeply frozen', () => {
  for (const document of DOCUMENTS) {
    assert.equal(Object.isFrozen(document.pages), true, `${document.id}: pages array`);
    for (const page of document.pages) {
      assert.equal(Object.isFrozen(page), true, page.id);
    }
  }
});

test('an empty or structurally incomplete document catalog is unusable', () => {
  assert.deepEqual(validateDocumentCatalog([]), ['document catalog must contain at least one document']);
  assert.deepEqual(validateDocumentCatalog([{ id: 'le', pages: [] }]), [
    'document pages must contain at least one page: le',
  ]);
});

test('the vertical-slice content is valid for local preview', () => {
  assert.deepEqual(validateContent({ DOCUMENTS, EXPLANATIONS, HOTSPOTS, release: false }), []);
});

test('invalid bounds, duplicate ids, and missing copy are reported together', () => {
  const errors = validateContent({
    DOCUMENTS,
    EXPLANATIONS: {},
    HOTSPOTS: [
      { id: 'bad', pageId: 'le-1', readingOrder: 1, bounds: { x: -1, y: 0, width: 1, height: 1 }, explanationId: 'missing', accessibleLabel: '' },
      { id: 'bad', pageId: 'le-1', readingOrder: 1, bounds: { x: 0, y: 0, width: 1, height: 1 }, explanationId: 'missing', accessibleLabel: '' },
    ],
    release: false,
  });
  assert.ok(errors.some(error => error.includes('duplicate hotspot id: bad')));
  assert.ok(errors.some(error => error.includes('outside page bounds')));
  assert.ok(errors.some(error => error.includes('missing explanation: missing')));
  assert.ok(errors.some(error => error.includes('missing accessible label')));
});

test('release validation requires recorded compliance approval', () => {
  assert.deepEqual(validateContent({ DOCUMENTS, EXPLANATIONS, HOTSPOTS, release: true }), []);
  const pending = Object.fromEntries(Object.entries(EXPLANATIONS).map(([id, explanation]) => [id, {
    ...explanation,
    review: { status: 'pending-msfg', reviewer: '', reviewedOn: '' },
  }]));
  const errors = validateContent({ DOCUMENTS, EXPLANATIONS: pending, HOTSPOTS, release: true });
  assert.ok(errors.some(error => error.includes('review status must be approved')));
});

test('runtime filtering skips an invalid hotspot and keeps valid content', () => {
  const interestRate = HOTSPOTS.find(item => item.id === 'le.p1.interest-rate');
  assert.ok(interestRate);
  const invalid = { ...interestRate, id: 'invalid', bounds: { x: -1, y: 0, width: 1, height: 1 } };
  const renderable = getRenderableHotspots({ DOCUMENTS, EXPLANATIONS, HOTSPOTS: [interestRate, invalid] });
  assert.deepEqual(renderable.map(item => item.id), ['le.p1.interest-rate']);
});

test('malformed hotspot records are reported and skipped without hiding valid content', () => {
  const interestRate = HOTSPOTS.find(item => item.id === 'le.p1.interest-rate');
  assert.ok(interestRate);
  const malformed = [null, undefined, 'not-a-hotspot'];
  const errors = validateContent({ DOCUMENTS, EXPLANATIONS, HOTSPOTS: malformed });
  assert.deepEqual(errors, [
    'malformed hotspot record: null',
    'malformed hotspot record: undefined',
    'malformed hotspot record: not-a-hotspot',
  ]);

  const renderable = getRenderableHotspots({
    DOCUMENTS,
    EXPLANATIONS,
    HOTSPOTS: [interestRate, ...malformed],
  });
  assert.deepEqual(renderable.map(item => item.id), ['le.p1.interest-rate']);
});
