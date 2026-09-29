import assert from 'node:assert/strict';
import test from 'node:test';

let protocol = {};
try {
  protocol = await import('../js/studio/runtime-protocol.js');
} catch {
  // RED: Task 3 starts before the runtime protocol module exists.
}

const {
  RUNTIME_PROTOCOL_VERSION,
  RUNTIME_INBOUND_TYPES,
  RUNTIME_OUTBOUND_TYPES,
  validateRuntimeInbound,
  validateRuntimeOutbound,
} = protocol;

const NONCE = '550e8400-e29b-41d4-a716-446655440000';

const INBOUND_TYPES = [
  'slide-enter',
  'slide-exit',
  'animation-back',
  'animation-forward',
  'animation-play',
  'animation-pause',
  'supported-overlay-state',
  'supported-calculator-state',
];

const OUTBOUND_TYPES = [
  'runtime-ready',
  'runtime-error',
  'animation-state',
  'supported-overlay-state',
  'supported-calculator-state',
];

test('the iframe protocol exposes only the approved versioned message types', () => {
  assert.equal(RUNTIME_PROTOCOL_VERSION, 1);
  assert.deepEqual(RUNTIME_INBOUND_TYPES, INBOUND_TYPES);
  assert.deepEqual(RUNTIME_OUTBOUND_TYPES, OUTBOUND_TYPES);
  assert.equal(Object.isFrozen(RUNTIME_INBOUND_TYPES), true);
  assert.equal(Object.isFrozen(RUNTIME_OUTBOUND_TYPES), true);
});

test('inbound animation events require the exact nonce and normalize an omitted payload', () => {
  const accepted = validateRuntimeInbound({
    v: 1,
    nonce: NONCE,
    type: 'animation-forward',
  }, NONCE);

  assert.deepEqual(accepted, {
    v: 1,
    nonce: NONCE,
    type: 'animation-forward',
    payload: {},
  });
  assert.equal(Object.getPrototypeOf(accepted), Object.prototype);
  assert.equal(Object.getPrototypeOf(accepted.payload), Object.prototype);
});

test('inbound supported-state events accept only one bounded action identifier and return a copy', () => {
  const payload = { actionId: 'cash-to-close-open' };
  const accepted = validateRuntimeInbound({
    v: 1,
    nonce: NONCE,
    type: 'supported-calculator-state',
    payload,
  }, NONCE);

  assert.deepEqual(accepted, {
    v: 1,
    nonce: NONCE,
    type: 'supported-calculator-state',
    payload: { actionId: 'cash-to-close-open' },
  });
  assert.notEqual(accepted.payload, payload);
  accepted.payload.actionId = 'changed';
  assert.equal(payload.actionId, 'cash-to-close-open');
});

test('inbound validation rejects wrong envelopes instead of accepting generic mutations', () => {
  const valid = { v: 1, nonce: NONCE, type: 'animation-forward', payload: {} };
  const cases = [
    null,
    [],
    { ...valid, v: 2 },
    { ...valid, nonce: 'wrong-nonce-value' },
    { ...valid, type: 'set-html', payload: '<b>x</b>' },
    { ...valid, html: '<b>x</b>' },
    { ...valid, payload: [] },
    { ...valid, payload: { extra: true } },
    { ...valid, payload: { actionId: 'not-allowed-for-animation' } },
  ];

  for (const candidate of cases) {
    assert.equal(validateRuntimeInbound(candidate, NONCE), null);
  }
});

test('supported action identifiers reject selectors, URLs, code, nesting, and oversized values', () => {
  const candidate = actionId => ({
    v: 1,
    nonce: NONCE,
    type: 'supported-overlay-state',
    payload: { actionId },
  });

  for (const actionId of [
    '',
    'A-capital',
    '#dialog',
    'https://evil.example',
    'alert(1)',
    'a'.repeat(65),
    { nested: true },
  ]) {
    assert.equal(validateRuntimeInbound(candidate(actionId), NONCE), null);
  }
});

test('inbound validation rejects prototype-polluted records, symbols, and getters without invoking them', () => {
  const pollutedEnvelope = Object.create({ injected: true });
  Object.assign(pollutedEnvelope, {
    v: 1,
    nonce: NONCE,
    type: 'animation-forward',
    payload: {},
  });
  assert.equal(validateRuntimeInbound(pollutedEnvelope, NONCE), null);

  const pollutedPayload = Object.create({ injected: true });
  pollutedPayload.actionId = 'safe-id';
  assert.equal(validateRuntimeInbound({
    v: 1,
    nonce: NONCE,
    type: 'supported-overlay-state',
    payload: pollutedPayload,
  }, NONCE), null);

  const symbolEnvelope = {
    v: 1,
    nonce: NONCE,
    type: 'animation-forward',
    payload: {},
    [Symbol('hidden')]: true,
  };
  assert.equal(validateRuntimeInbound(symbolEnvelope, NONCE), null);

  let reads = 0;
  const getterEnvelope = { v: 1, nonce: NONCE, type: 'animation-forward' };
  Object.defineProperty(getterEnvelope, 'payload', {
    enumerable: true,
    get() {
      reads += 1;
      return {};
    },
  });
  assert.equal(validateRuntimeInbound(getterEnvelope, NONCE), null);
  assert.equal(reads, 0);

  const getterPayload = {};
  Object.defineProperty(getterPayload, 'actionId', {
    enumerable: true,
    get() {
      reads += 1;
      return 'safe-id';
    },
  });
  assert.equal(validateRuntimeInbound({
    v: 1,
    nonce: NONCE,
    type: 'supported-overlay-state',
    payload: getterPayload,
  }, NONCE), null);
  assert.equal(reads, 0);
});

test('outbound animation state is bounded, finite, exact, and newly normalized', () => {
  const payload = { current: 2, total: 5, playing: true };
  const accepted = validateRuntimeOutbound({
    v: 1,
    nonce: NONCE,
    type: 'animation-state',
    payload,
  }, NONCE);

  assert.deepEqual(accepted, {
    v: 1,
    nonce: NONCE,
    type: 'animation-state',
    payload: { current: 2, total: 5, playing: true },
  });
  assert.notEqual(accepted.payload, payload);

  for (const invalidPayload of [
    { current: -1, total: 5, playing: true },
    { current: 6, total: 5, playing: true },
    { current: 1.5, total: 5, playing: true },
    { current: 1, total: Number.POSITIVE_INFINITY, playing: true },
    { current: 1, total: 10001, playing: true },
    { current: 1, total: 5, playing: 'yes' },
    { current: 1, total: 5, playing: true, source: 'private' },
  ]) {
    assert.equal(validateRuntimeOutbound({
      v: 1,
      nonce: NONCE,
      type: 'animation-state',
      payload: invalidPayload,
    }, NONCE), null);
  }
});

test('outbound runtime errors expose only a fixed code and optional bounded preview location', () => {
  assert.deepEqual(validateRuntimeOutbound({
    v: 1,
    nonce: NONCE,
    type: 'runtime-error',
    payload: { code: 'SLIDE_RUNTIME_ERROR' },
  }, NONCE), {
    v: 1,
    nonce: NONCE,
    type: 'runtime-error',
    payload: { code: 'SLIDE_RUNTIME_ERROR' },
  });

  assert.deepEqual(validateRuntimeOutbound({
    v: 1,
    nonce: NONCE,
    type: 'runtime-error',
    payload: { code: 'SLIDE_RUNTIME_ERROR', line: 14, column: 7 },
  }, NONCE), {
    v: 1,
    nonce: NONCE,
    type: 'runtime-error',
    payload: { code: 'SLIDE_RUNTIME_ERROR', line: 14, column: 7 },
  });

  for (const payload of [
    { code: 'PRIVATE_SOURCE_ERROR' },
    { code: 'SLIDE_RUNTIME_ERROR', message: 'secret source' },
    { code: 'SLIDE_RUNTIME_ERROR', stack: 'secret stack' },
    { code: 'SLIDE_RUNTIME_ERROR', line: 14 },
    { code: 'SLIDE_RUNTIME_ERROR', line: 0, column: 1 },
    { code: 'SLIDE_RUNTIME_ERROR', line: 1, column: Number.NaN },
  ]) {
    assert.equal(validateRuntimeOutbound({
      v: 1,
      nonce: NONCE,
      type: 'runtime-error',
      payload,
    }, NONCE), null);
  }
});

test('outbound ready and supported-state messages use the same strict nonce-bound envelope', () => {
  assert.deepEqual(validateRuntimeOutbound({
    v: 1,
    nonce: NONCE,
    type: 'runtime-ready',
  }, NONCE), {
    v: 1,
    nonce: NONCE,
    type: 'runtime-ready',
    payload: {},
  });

  assert.deepEqual(validateRuntimeOutbound({
    v: 1,
    nonce: NONCE,
    type: 'supported-overlay-state',
    payload: { actionId: 'program-modal-open' },
  }, NONCE), {
    v: 1,
    nonce: NONCE,
    type: 'supported-overlay-state',
    payload: { actionId: 'program-modal-open' },
  });

  for (const candidate of [
    { v: 1, nonce: NONCE, type: 'runtime-ready', payload: { code: 'extra' } },
    { v: 1, nonce: NONCE, type: 'runtime-ready', payload: {}, extra: true },
    { v: 1, nonce: NONCE, type: 'arbitrary-event', payload: {} },
    { v: 1, nonce: 'wrong-nonce-value', type: 'runtime-ready', payload: {} },
  ]) {
    assert.equal(validateRuntimeOutbound(candidate, NONCE), null);
  }
});

test('invalid expected nonces fail closed without inspecting caller-controlled values', () => {
  const message = { v: 1, nonce: NONCE, type: 'runtime-ready', payload: {} };
  for (const expectedNonce of ['', 'short', 'contains space but is long', 'a'.repeat(129), null]) {
    assert.equal(validateRuntimeOutbound(message, expectedNonce), null);
    assert.equal(validateRuntimeInbound({ ...message, type: 'slide-enter' }, expectedNonce), null);
  }
});
