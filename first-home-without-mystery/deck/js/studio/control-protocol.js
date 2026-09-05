/* ============================================================================
   PRESENTER CONTROL PROTOCOL, VERSION 1 — the fixed cross-window contract
   between the private Dashboard presenter and the public audience shell.

   Every message is { v: 1, nonce, type, payload }. Types and payloads are
   closed sets of scalars. Nothing here can carry code, HTML, URLs, selectors,
   or credentials, and validation returns fresh copies so callers never hold
   the sender's objects. The Dashboard keeps a structurally identical copy in
   js/webinar-studio/bridge.js; the test suites on both sides pin the shape.
   ========================================================================= */

export const CONTROL_PROTOCOL_VERSION = 1;

export const CONTROL_TYPES = Object.freeze([
  'goto', 'next', 'previous',
  'animation-back', 'animation-forward', 'animation-play', 'animation-pause',
  'annotation-command', 'supported-overlay-state', 'supported-calculator-state',
  'fullscreen-request', 'nav-visibility', 'ping',
]);

export const AUDIENCE_TYPES = Object.freeze([
  'audience-ready', 'slide-state', 'animation-state', 'annotation-state',
  'supported-overlay-state', 'supported-calculator-state', 'fullscreen-state',
  'nav-state', 'pong', 'audience-error',
]);

export const IGNORE_REASONS = Object.freeze([
  'SOURCE_OR_ORIGIN', 'INVALID_MESSAGE', 'WRONG_VERSION', 'WRONG_NONCE', 'UNKNOWN_TYPE', 'INVALID_PAYLOAD', 'NOT_INITIALIZED',
]);

export const INIT_TYPE = 'presenter-init';

const NONCE = /^[A-Za-z0-9_-]{16,128}$/;
const ACTION_ID = /^[a-z][a-z0-9-]{0,63}$/;
const ERROR_CODE = /^[A-Z][A-Z0-9_]{0,63}$/;
const MAX_INDEX = 100_000;
const MAX_ANIMATION_ITEMS = 10_000;
const ANNOTATION_TOOLS = new Set(['pen', 'highlight', 'box', 'text', 'laser']);
const ANNOTATION_COLORS = new Set(['green', 'yellow', 'blue', 'red', 'black', 'white']);

function dataProperties(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return null;
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const keys = Reflect.ownKeys(value);
  if (keys.some(key => typeof key !== 'string')) return null;
  for (const key of keys) {
    const descriptor = descriptors[key];
    if (!descriptor || !descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return null;
  }
  return { descriptors, keys };
}

function exactRecord(value, required, optional = []) {
  const data = dataProperties(value);
  if (!data) return null;
  const allowed = new Set([...required, ...optional]);
  if (data.keys.some(key => !allowed.has(key))) return null;
  if (required.some(key => !Object.hasOwn(data.descriptors, key))) return null;
  const record = {};
  for (const key of data.keys) record[key] = data.descriptors[key].value;
  return record;
}

const boundedIndex = value => Number.isSafeInteger(value) && value >= 0 && value <= MAX_INDEX;
const isBoolean = value => typeof value === 'boolean';
const isActionId = value => typeof value === 'string' && ACTION_ID.test(value);

function emptyPayload(value) {
  const record = exactRecord(value, []);
  return record ? {} : null;
}

function indexPayload(value) {
  const record = exactRecord(value, ['index']);
  return record && boundedIndex(record.index) ? { index: record.index } : null;
}

function positionPayload(value) {
  const record = exactRecord(value, ['index', 'total']);
  if (!record || !boundedIndex(record.index) || !Number.isSafeInteger(record.total)
    || record.total < 1 || record.total > MAX_INDEX || record.index >= record.total) return null;
  return { index: record.index, total: record.total };
}

function annotationPayload(value) {
  // `toolbar` is accepted for parity with the presenter's pen controls, but the
  // public audience page keeps its annotation toolbar hidden, so it is a no-op there.
  const record = exactRecord(value, [], ['on', 'tool', 'color', 'autoOff', 'toolbar', 'undo', 'redo', 'clear']);
  if (!record || Object.keys(record).length === 0) return null;
  const payload = {};
  for (const [key, item] of Object.entries(record)) {
    if (['on', 'autoOff', 'toolbar'].includes(key)) {
      if (!isBoolean(item)) return null;
    } else if (key === 'tool') {
      if (!ANNOTATION_TOOLS.has(item)) return null;
    } else if (key === 'color') {
      if (!ANNOTATION_COLORS.has(item)) return null;
    } else if (item !== true) {
      return null;
    }
    payload[key] = item;
  }
  return payload;
}

function supportedPayload(value) {
  const record = exactRecord(value, ['id', 'visible']);
  return record && isActionId(record.id) && isBoolean(record.visible) ? { id: record.id, visible: record.visible } : null;
}

function flagPayload(key) {
  return value => {
    const record = exactRecord(value, [key]);
    return record && isBoolean(record[key]) ? { [key]: record[key] } : null;
  };
}

function animationPayload(value) {
  const record = exactRecord(value, ['current', 'total', 'playing']);
  if (!record || !Number.isSafeInteger(record.current) || !Number.isSafeInteger(record.total)
    || record.current < 0 || record.total < 0 || record.current > record.total
    || record.total > MAX_ANIMATION_ITEMS || !isBoolean(record.playing)) return null;
  return { current: record.current, total: record.total, playing: record.playing };
}

function errorPayload(value) {
  const record = exactRecord(value, ['code']);
  return record && typeof record.code === 'string' && ERROR_CODE.test(record.code) ? { code: record.code } : null;
}

const CONTROL_PAYLOADS = Object.freeze({
  goto: indexPayload,
  next: emptyPayload,
  previous: emptyPayload,
  'animation-back': emptyPayload,
  'animation-forward': emptyPayload,
  'animation-play': emptyPayload,
  'animation-pause': emptyPayload,
  'annotation-command': annotationPayload,
  'supported-overlay-state': supportedPayload,
  'supported-calculator-state': supportedPayload,
  'fullscreen-request': flagPayload('on'),
  'nav-visibility': flagPayload('hidden'),
  ping: emptyPayload,
});

const AUDIENCE_PAYLOADS = Object.freeze({
  'audience-ready': positionPayload,
  'slide-state': positionPayload,
  'animation-state': animationPayload,
  'annotation-state': flagPayload('on'),
  'supported-overlay-state': supportedPayload,
  'supported-calculator-state': supportedPayload,
  'fullscreen-state': flagPayload('on'),
  'nav-state': flagPayload('hidden'),
  pong: emptyPayload,
  'audience-error': errorPayload,
});

function classify(data, expectedNonce, payloads) {
  try {
    if (typeof expectedNonce !== 'string' || !NONCE.test(expectedNonce)) return { ok: false, reason: 'NOT_INITIALIZED' };
    const envelope = exactRecord(data, ['v', 'nonce', 'type', 'payload']);
    if (!envelope) return { ok: false, reason: 'INVALID_MESSAGE' };
    if (envelope.v !== CONTROL_PROTOCOL_VERSION) return { ok: false, reason: 'WRONG_VERSION' };
    if (envelope.nonce !== expectedNonce) return { ok: false, reason: 'WRONG_NONCE' };
    if (typeof envelope.type !== 'string' || !Object.hasOwn(payloads, envelope.type)) return { ok: false, reason: 'UNKNOWN_TYPE' };
    const payload = payloads[envelope.type](envelope.payload);
    if (!payload) return { ok: false, reason: 'INVALID_PAYLOAD' };
    return { ok: true, message: { v: CONTROL_PROTOCOL_VERSION, nonce: expectedNonce, type: envelope.type, payload } };
  } catch {
    return { ok: false, reason: 'INVALID_MESSAGE' };
  }
}

export function classifyControlMessage(data, nonce) {
  return classify(data, nonce, CONTROL_PAYLOADS);
}

export function classifyAudienceMessage(data, nonce) {
  return classify(data, nonce, AUDIENCE_PAYLOADS);
}

export function validateControlMessage(data, nonce) {
  const result = classifyControlMessage(data, nonce);
  return result.ok ? result.message : null;
}

export function validateAudienceMessage(data, nonce) {
  const result = classifyAudienceMessage(data, nonce);
  return result.ok ? result.message : null;
}

/* The only message accepted before a nonce is known. It carries the nonce and
   nothing else; source and origin are checked by the receiver before this. */
export function validateInitMessage(data) {
  try {
    const envelope = exactRecord(data, ['v', 'nonce', 'type', 'payload']);
    if (!envelope || envelope.v !== CONTROL_PROTOCOL_VERSION || envelope.type !== INIT_TYPE
      || typeof envelope.nonce !== 'string' || !NONCE.test(envelope.nonce) || !emptyPayload(envelope.payload)) return null;
    return { v: CONTROL_PROTOCOL_VERSION, nonce: envelope.nonce, type: INIT_TYPE, payload: {} };
  } catch {
    return null;
  }
}

export function isValidNonce(value) {
  return typeof value === 'string' && NONCE.test(value);
}
