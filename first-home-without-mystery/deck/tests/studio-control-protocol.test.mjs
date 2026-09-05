import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CONTROL_PROTOCOL_VERSION,
  CONTROL_TYPES,
  AUDIENCE_TYPES,
  IGNORE_REASONS,
  classifyControlMessage,
  classifyAudienceMessage,
  validateControlMessage,
  validateAudienceMessage,
  validateInitMessage,
} from '../js/studio/control-protocol.js';

const nonce = 'b7b6f2a4-1f3c-4d2e-9a5b-0c1d2e3f4a5b';
const envelope = (type, payload = {}, overrides = {}) => ({ v: 1, nonce, type, payload, ...overrides });

test('protocol version 1 lists exactly the fixed control and acknowledgement types', () => {
  assert.equal(CONTROL_PROTOCOL_VERSION, 1);
  assert.deepEqual([...CONTROL_TYPES], [
    'goto', 'next', 'previous',
    'animation-back', 'animation-forward', 'animation-play', 'animation-pause',
    'annotation-command', 'supported-overlay-state', 'supported-calculator-state',
    'fullscreen-request', 'nav-visibility', 'ping',
  ]);
  assert.deepEqual([...AUDIENCE_TYPES], [
    'audience-ready', 'slide-state', 'animation-state', 'annotation-state',
    'supported-overlay-state', 'supported-calculator-state', 'fullscreen-state',
    'nav-state', 'pong', 'audience-error',
  ]);
  assert.deepEqual([...IGNORE_REASONS], [
    'SOURCE_OR_ORIGIN', 'INVALID_MESSAGE', 'WRONG_VERSION', 'WRONG_NONCE', 'UNKNOWN_TYPE', 'INVALID_PAYLOAD', 'NOT_INITIALIZED',
  ]);
});

test('accepts exact control envelopes and returns fresh normalized copies', () => {
  const accepted = validateControlMessage(envelope('goto', { index: 4 }), nonce);
  assert.deepEqual(accepted, { v: 1, nonce, type: 'goto', payload: { index: 4 } });
  const raw = envelope('next', {});
  const next = validateControlMessage(raw, nonce);
  assert.deepEqual(next, { v: 1, nonce, type: 'next', payload: {} });
  assert.notEqual(next, raw);
  assert.notEqual(next.payload, raw.payload);
  assert.deepEqual(validateControlMessage(envelope('animation-play'), nonce).payload, {});
  assert.deepEqual(validateControlMessage(envelope('annotation-command', { on: true }), nonce).payload, { on: true });
  assert.deepEqual(validateControlMessage(envelope('annotation-command', { tool: 'pen', color: 'green' }), nonce).payload, { tool: 'pen', color: 'green' });
  assert.deepEqual(validateControlMessage(envelope('annotation-command', { undo: true }), nonce).payload, { undo: true });
  assert.deepEqual(validateControlMessage(envelope('supported-overlay-state', { id: 'cash-to-close', visible: false }), nonce).payload, { id: 'cash-to-close', visible: false });
  assert.deepEqual(validateControlMessage(envelope('supported-calculator-state', { id: 'buydown', visible: true }), nonce).payload, { id: 'buydown', visible: true });
  assert.deepEqual(validateControlMessage(envelope('fullscreen-request', { on: true }), nonce).payload, { on: true });
  assert.deepEqual(validateControlMessage(envelope('nav-visibility', { hidden: true }), nonce).payload, { hidden: true });
  assert.deepEqual(validateControlMessage(envelope('ping'), nonce).payload, {});
});

test('rejects wrong nonce, version, unknown type, extra or executable fields, and invalid scalars with reason codes only', () => {
  const cases = [
    [envelope('next', {}, { nonce: 'wrong-nonce-value-1234' }), 'WRONG_NONCE'],
    [envelope('next', {}, { v: 2 }), 'WRONG_VERSION'],
    [envelope('next', {}, { v: '1' }), 'WRONG_VERSION'],
    [envelope('eval', {}), 'UNKNOWN_TYPE'],
    [envelope('goto', { url: 'https://evil.example' }), 'INVALID_PAYLOAD'],
    [envelope('goto', { index: '4' }), 'INVALID_PAYLOAD'],
    [envelope('goto', { index: -1 }), 'INVALID_PAYLOAD'],
    [envelope('goto', { index: 4, selector: '#x' }), 'INVALID_PAYLOAD'],
    [envelope('next', { code: 'alert(1)' }), 'INVALID_PAYLOAD'],
    [envelope('annotation-command', {}), 'INVALID_PAYLOAD'],
    [envelope('annotation-command', { tool: 'javascript:alert(1)' }), 'INVALID_PAYLOAD'],
    [envelope('annotation-command', { color: '#fff' }), 'INVALID_PAYLOAD'],
    [envelope('annotation-command', { on: 'yes' }), 'INVALID_PAYLOAD'],
    [envelope('annotation-command', { undo: false }), 'INVALID_PAYLOAD'],
    [envelope('annotation-command', { html: '<b>x</b>' }), 'INVALID_PAYLOAD'],
    [envelope('supported-overlay-state', { id: 'javascript:alert(1)', visible: true }), 'INVALID_PAYLOAD'],
    [envelope('supported-overlay-state', { id: 'ok', visible: 'true' }), 'INVALID_PAYLOAD'],
    [envelope('supported-overlay-state', { id: 'ok' }), 'INVALID_PAYLOAD'],
    [envelope('fullscreen-request', { on: 1 }), 'INVALID_PAYLOAD'],
    [envelope('nav-visibility', { hidden: 'true' }), 'INVALID_PAYLOAD'],
    [{ v: 1, nonce, type: 'next' }, 'INVALID_MESSAGE'],
    [{ v: 1, nonce, type: 'next', payload: {}, extra: 1 }, 'INVALID_MESSAGE'],
    [{ v: 1, nonce, type: 'next', payload: [] }, 'INVALID_PAYLOAD'],
    ['next', 'INVALID_MESSAGE'],
    [null, 'INVALID_MESSAGE'],
    [Object.create({ v: 1, nonce, type: 'next', payload: {} }), 'INVALID_MESSAGE'],
  ];
  for (const [raw, reason] of cases) {
    const result = classifyControlMessage(raw, nonce);
    assert.equal(result.ok, false, JSON.stringify(raw));
    assert.equal(result.reason, reason, JSON.stringify(raw));
    assert.equal(Object.keys(result).sort().join(','), 'ok,reason', 'reasons carry no payload');
    assert.equal(validateControlMessage(raw, nonce), null);
  }
  assert.equal(validateControlMessage(envelope('next'), 'x'), null, 'an invalid expected nonce accepts nothing');
  const getter = { v: 1, nonce, type: 'next', get payload() { return {}; } };
  assert.equal(classifyControlMessage(getter, nonce).reason, 'INVALID_MESSAGE', 'accessor properties are not data');
});

test('accepts exact audience acknowledgements and rejects anything else', () => {
  assert.deepEqual(validateAudienceMessage(envelope('audience-ready', { index: 0, total: 15 }), nonce).payload, { index: 0, total: 15 });
  assert.deepEqual(validateAudienceMessage(envelope('slide-state', { index: 3, total: 15 }), nonce).payload, { index: 3, total: 15 });
  assert.deepEqual(validateAudienceMessage(envelope('animation-state', { current: 1, total: 3, playing: true }), nonce).payload, { current: 1, total: 3, playing: true });
  assert.deepEqual(validateAudienceMessage(envelope('annotation-state', { on: false }), nonce).payload, { on: false });
  assert.deepEqual(validateAudienceMessage(envelope('supported-overlay-state', { id: 'rates', visible: true }), nonce).payload, { id: 'rates', visible: true });
  assert.deepEqual(validateAudienceMessage(envelope('fullscreen-state', { on: true }), nonce).payload, { on: true });
  assert.deepEqual(validateAudienceMessage(envelope('nav-state', { hidden: true }), nonce).payload, { hidden: true });
  assert.deepEqual(validateAudienceMessage(envelope('pong'), nonce).payload, {});
  assert.deepEqual(validateAudienceMessage(envelope('audience-error', { code: 'SLIDE_RUNTIME_ERROR' }), nonce).payload, { code: 'SLIDE_RUNTIME_ERROR' });
  for (const raw of [
    envelope('slide-state', { index: 3 }),
    envelope('slide-state', { index: 16, total: 15 }),
    envelope('animation-state', { current: 4, total: 3, playing: false }),
    envelope('audience-error', { code: 'x'.repeat(65) }),
    envelope('audience-error', { code: 'evil', stack: 'trace' }),
    envelope('next'),
    envelope('goto', { index: 1 }),
  ]) {
    assert.equal(validateAudienceMessage(raw, nonce), null, JSON.stringify(raw));
  }
  assert.equal(classifyAudienceMessage(envelope('goto', { index: 1 }), nonce).reason, 'UNKNOWN_TYPE');
  assert.equal(classifyAudienceMessage(envelope('pong', {}, { nonce: 'other-nonce-value-9999' }), nonce).reason, 'WRONG_NONCE');
});

test('initialization is the only message accepted before a nonce exists, and it carries nothing but the nonce', () => {
  assert.deepEqual(validateInitMessage({ v: 1, nonce, type: 'presenter-init', payload: {} }), { v: 1, nonce, type: 'presenter-init', payload: {} });
  for (const raw of [
    { v: 1, nonce, type: 'presenter-init', payload: { token: 'abc' } },
    { v: 1, nonce: 'short', type: 'presenter-init', payload: {} },
    { v: 1, nonce: 'x'.repeat(129), type: 'presenter-init', payload: {} },
    { v: 1, nonce: 'has spaces in it 1234', type: 'presenter-init', payload: {} },
    { v: 2, nonce, type: 'presenter-init', payload: {} },
    { v: 1, nonce, type: 'next', payload: {} },
  ]) {
    assert.equal(validateInitMessage(raw), null, JSON.stringify(raw));
  }
});
