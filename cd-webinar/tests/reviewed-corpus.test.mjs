import test from 'node:test';
import assert from 'node:assert/strict';
import { DOCUMENTS, EXPLANATIONS, HOTSPOTS } from '../content/index.js';
import {
  buildReviewedCorpus,
  canonicalStringify,
  digestReviewedCorpus,
  getReleaseReadinessErrors,
  isValidIsoCalendarDate,
} from '../scripts/reviewed-corpus.mjs';

const pendingExplanations = () => Object.fromEntries(Object.entries(EXPLANATIONS).map(([id, explanation]) => [id, {
  ...explanation,
  review: { status: 'pending-msfg', reviewer: '', reviewedOn: '' },
}]));

test('canonical serialization and digest use stable recursively sorted keys', () => {
  const corpus = { b: 2, a: [3, { d: 4, c: 5 }] };
  assert.equal(canonicalStringify(corpus), '{"a":[3,{"c":5,"d":4}],"b":2}');
  assert.equal(digestReviewedCorpus(corpus), 'a6f69edf708062e50cc8668b6e0ec14b540803930d10f02db84e74b339448c52');
});

test('review dates must be real ISO calendar dates', () => {
  assert.equal(isValidIsoCalendarDate('2024-02-29'), true);
  assert.equal(isValidIsoCalendarDate('2026-02-29'), false);
  assert.equal(isValidIsoCalendarDate('2026-02-30'), false);
  assert.equal(isValidIsoCalendarDate('2026-13-01'), false);
  assert.equal(isValidIsoCalendarDate('August 27, 2026'), false);
});

test('the canonical corpus covers copy, hotspot semantics and geometry, manifest, and exact assets', async () => {
  const corpus = await buildReviewedCorpus();
  assert.equal(corpus.schemaVersion, 1);
  assert.equal(corpus.explanations.length, 180);
  assert.equal(corpus.hotspots.length, 502);
  assert.equal(corpus.sourceManifest.documents.length, 6);
  assert.deepEqual(corpus.sourceDocuments.map(item => item.path), [
    'references/closing-disclosure-H25B.pdf',
    'references/closing-disclosure-refinance-H25E.pdf',
    'references/closing-disclosure-refinance-cash-H25G.pdf',
    'references/loan-estimate-H24B.pdf',
    'references/loan-estimate-model-H24A.pdf',
    'references/loan-estimate-refinance-H24D.pdf',
  ]);
  assert.deepEqual(corpus.brandAssets.map(item => item.path), ['assets/brand/logo-horizontal.svg']);
  assert.equal(corpus.renderedImages.length, 24);
  assert.deepEqual(corpus.renderedImages.map(item => item.path).slice(0, 5), [
    'assets/documents/cd-page-1.png',
    'assets/documents/cd-page-2.png',
    'assets/documents/cd-page-3.png',
    'assets/documents/cd-page-4.png',
    'assets/documents/cd-page-5.png',
  ]);

  const digest = digestReviewedCorpus(corpus);
  assert.match(digest, /^[a-f0-9]{64}$/);
  for (const mutate of [
    value => { value.explanations[0].body += ' changed'; },
    value => { value.hotspots[0].bounds.x += 0.0001; },
    value => { value.sourceManifest.renderDpi = 181; },
    value => { value.sourceDocuments[0].sha256 = '0'.repeat(64); },
    value => { value.brandAssets[0].sha256 = '0'.repeat(64); },
    value => { value.renderedImages[0].sha256 = '0'.repeat(64); },
  ]) {
    const changed = structuredClone(corpus);
    mutate(changed);
    assert.notEqual(digestReviewedCorpus(changed), digest);
  }
});

test('pending review fails only on missing genuine approval and digest evidence', async () => {
  const approval = { status: 'pending-msfg', reviewer: '', reviewedOn: '', reviewedCorpusSha256: '' };
  assert.deepEqual(await getReleaseReadinessErrors({
    documents: DOCUMENTS,
    explanations: pendingExplanations(),
    hotspots: HOTSPOTS,
    approval,
  }), [
    'real MSFG explanation approval is pending: 180 records',
    'reviewed corpus approval status must be approved',
    'reviewed corpus reviewer must contain a real full name',
    'reviewed corpus review date must be a real ISO calendar date',
    'reviewed corpus digest must be a SHA-256 value',
  ]);
});

test('release readiness requires the approved evidence digest to match the exact current corpus', async () => {
  const approvedExplanations = Object.fromEntries(Object.entries(EXPLANATIONS).map(([id, explanation]) => [id, {
    ...explanation,
    review: { status: 'approved', reviewer: 'Morgan Lee', reviewedOn: '2026-08-27' },
  }]));
  const corpus = await buildReviewedCorpus({
    documents: DOCUMENTS,
    explanations: approvedExplanations,
    hotspots: HOTSPOTS,
  });
  const approval = {
    status: 'approved',
    reviewer: 'Morgan Lee',
    reviewedOn: '2026-08-27',
    reviewedCorpusSha256: digestReviewedCorpus(corpus),
  };

  assert.deepEqual(await getReleaseReadinessErrors({
    documents: DOCUMENTS,
    explanations: approvedExplanations,
    hotspots: HOTSPOTS,
    approval,
  }), []);
  assert.deepEqual(await getReleaseReadinessErrors({
    documents: DOCUMENTS,
    explanations: approvedExplanations,
    hotspots: HOTSPOTS,
    approval: { ...approval, reviewedCorpusSha256: '0'.repeat(64) },
  }), ['reviewed corpus digest does not match the exact current reviewed bytes']);
  assert.deepEqual(await getReleaseReadinessErrors({
    documents: DOCUMENTS,
    explanations: approvedExplanations,
    hotspots: HOTSPOTS,
    approval: { ...approval, reviewedOn: '2026-02-30' },
  }), ['reviewed corpus review date must be a real ISO calendar date']);
});

test('release validation reports malformed content without trying to hash an unusable corpus', async () => {
  const errors = await getReleaseReadinessErrors({
    documents: DOCUMENTS,
    explanations: pendingExplanations(),
    hotspots: [null, undefined],
    approval: {
      status: 'approved',
      reviewer: 'Morgan Lee',
      reviewedOn: '2026-08-27',
      reviewedCorpusSha256: '0'.repeat(64),
    },
  });

  assert.ok(errors.includes('malformed hotspot record: null'));
  assert.ok(errors.some(error => /approval is pending/.test(error)));
  assert.equal(errors.includes('reviewed corpus digest does not match the exact current reviewed bytes'), false);
});
