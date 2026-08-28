import test from 'node:test';
import assert from 'node:assert/strict';
import { DOCUMENTS, EXPLANATIONS, HOTSPOTS } from '../content/index.js';
import { startWebinar } from '../js/app.js';

const interestRate = HOTSPOTS.find(item => item.id === 'le.p1.interest-rate');

test('startup logs recoverable hotspot rows and initializes with only renderable records', () => {
  assert.ok(interestRate);
  const duplicate = { ...interestRate };
  const outsidePage = {
    ...interestRate,
    id: 'le.p1.outside-page',
    readingOrder: 900,
    bounds: { x: 0.9, y: 0.9, width: 0.2, height: 0.2 },
  };
  const missingExplanation = {
    ...interestRate,
    id: 'le.p1.missing-explanation',
    readingOrder: 901,
    explanationId: 'not-in-corpus',
  };
  const logged = [];
  const initialized = [];

  const result = startWebinar({
    root: { id: 'viewer-root' },
    documents: DOCUMENTS,
    explanations: EXPLANATIONS,
    hotspots: [interestRate, null, duplicate, outsidePage, missingExplanation],
    logError: message => logged.push(message),
    initialize: options => {
      initialized.push(options);
      return { destroy() {} };
    },
  });

  assert.equal(result.started, true);
  assert.equal(initialized.length, 1);
  assert.deepEqual(initialized[0].hotspots.map(item => item.id), ['le.p1.interest-rate']);
  assert.match(logged.join('\n'), /malformed hotspot record: null/);
  assert.match(logged.join('\n'), /duplicate hotspot id: le\.p1\.interest-rate/);
  assert.match(logged.join('\n'), /hotspot outside page bounds: le\.p1\.outside-page/);
  assert.match(logged.join('\n'), /missing explanation: not-in-corpus/);
});

test('startup reserves a full stop for an unusable document catalog', () => {
  let initializeCalls = 0;
  const logged = [];

  const result = startWebinar({
    root: { id: 'viewer-root' },
    documents: [],
    explanations: EXPLANATIONS,
    hotspots: HOTSPOTS,
    logError: message => logged.push(message),
    initialize: () => {
      initializeCalls += 1;
    },
  });

  assert.equal(result.started, false);
  assert.equal(initializeCalls, 0);
  assert.match(logged.join('\n'), /unusable webinar document catalog/i);
});
