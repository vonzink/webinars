export const RUNTIME_PROTOCOL_VERSION = 1;

export const RUNTIME_INBOUND_TYPES = Object.freeze([
  'slide-enter',
  'slide-exit',
  'animation-back',
  'animation-forward',
  'animation-play',
  'animation-pause',
  'supported-overlay-state',
  'supported-calculator-state',
]);

export const RUNTIME_OUTBOUND_TYPES = Object.freeze([
  'runtime-ready',
  'runtime-error',
  'animation-state',
  'supported-overlay-state',
  'supported-calculator-state',
]);

const INBOUND_TYPE_SET = new Set(RUNTIME_INBOUND_TYPES);
const OUTBOUND_TYPE_SET = new Set(RUNTIME_OUTBOUND_TYPES);
const EMPTY_INBOUND_TYPES = new Set([
  'slide-enter',
  'slide-exit',
  'animation-back',
  'animation-forward',
  'animation-play',
  'animation-pause',
]);
const NONCE = /^[A-Za-z0-9_-]{16,128}$/;
const ACTION_ID = /^[a-z][a-z0-9-]{0,63}$/;
const MAX_ANIMATION_ITEMS = 10_000;
const MAX_SOURCE_LOCATION = 1_000_000;

function dataProperties(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  if (Object.getPrototypeOf(value) !== Object.prototype) return null;

  const descriptors = Object.getOwnPropertyDescriptors(value);
  const keys = Reflect.ownKeys(value);
  if (keys.some(key => typeof key !== 'string')) return null;
  for (const key of keys) {
    const descriptor = descriptors[key];
    if (!descriptor || !descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return null;
  }
  return { descriptors, keys };
}

function exactProperties(value, required, optional = []) {
  const data = dataProperties(value);
  if (!data) return null;
  const allowed = new Set([...required, ...optional]);
  if (data.keys.some(key => !allowed.has(key))) return null;
  if (required.some(key => !Object.hasOwn(data.descriptors, key))) return null;
  return data.descriptors;
}

function emptyPayload(value) {
  if (value === undefined) return {};
  const descriptors = exactProperties(value, []);
  return descriptors ? {} : null;
}

function actionPayload(value) {
  const descriptors = exactProperties(value, ['actionId']);
  if (!descriptors) return null;
  const actionId = descriptors.actionId.value;
  if (typeof actionId !== 'string' || !ACTION_ID.test(actionId)) return null;
  return { actionId };
}

function animationPayload(value) {
  const descriptors = exactProperties(value, ['current', 'total', 'playing']);
  if (!descriptors) return null;
  const current = descriptors.current.value;
  const total = descriptors.total.value;
  const playing = descriptors.playing.value;
  if (!Number.isSafeInteger(current) || !Number.isSafeInteger(total)
    || current < 0 || total < 0 || current > total || total > MAX_ANIMATION_ITEMS
    || typeof playing !== 'boolean') return null;
  return { current, total, playing };
}

function runtimeErrorPayload(value) {
  const descriptors = exactProperties(value, ['code'], ['line', 'column']);
  if (!descriptors || descriptors.code.value !== 'SLIDE_RUNTIME_ERROR') return null;
  const hasLine = Object.hasOwn(descriptors, 'line');
  const hasColumn = Object.hasOwn(descriptors, 'column');
  if (hasLine !== hasColumn) return null;
  if (!hasLine) return { code: 'SLIDE_RUNTIME_ERROR' };

  const line = descriptors.line.value;
  const column = descriptors.column.value;
  if (!Number.isSafeInteger(line) || line < 1 || line > MAX_SOURCE_LOCATION
    || !Number.isSafeInteger(column) || column < 0 || column > MAX_SOURCE_LOCATION) return null;
  return { code: 'SLIDE_RUNTIME_ERROR', line, column };
}

function normalizePayload(direction, type, value) {
  if (direction === 'inbound') {
    if (EMPTY_INBOUND_TYPES.has(type)) return emptyPayload(value);
    return actionPayload(value);
  }

  if (type === 'runtime-ready') return emptyPayload(value);
  if (type === 'runtime-error') return runtimeErrorPayload(value);
  if (type === 'animation-state') return animationPayload(value);
  return actionPayload(value);
}

function validateEnvelope(data, expectedNonce, direction) {
  try {
    if (typeof expectedNonce !== 'string' || !NONCE.test(expectedNonce)) return null;
    const descriptors = exactProperties(data, ['v', 'nonce', 'type'], ['payload']);
    if (!descriptors) return null;

    const version = descriptors.v.value;
    const nonce = descriptors.nonce.value;
    const type = descriptors.type.value;
    const acceptedTypes = direction === 'inbound' ? INBOUND_TYPE_SET : OUTBOUND_TYPE_SET;
    if (version !== RUNTIME_PROTOCOL_VERSION || nonce !== expectedNonce
      || typeof type !== 'string' || !acceptedTypes.has(type)) return null;

    const rawPayload = Object.hasOwn(descriptors, 'payload')
      ? descriptors.payload.value
      : undefined;
    const payload = normalizePayload(direction, type, rawPayload);
    if (!payload) return null;
    return { v: RUNTIME_PROTOCOL_VERSION, nonce: expectedNonce, type, payload };
  } catch {
    return null;
  }
}

export function validateRuntimeInbound(data, nonce) {
  return validateEnvelope(data, nonce, 'inbound');
}

export function validateRuntimeOutbound(data, nonce) {
  return validateEnvelope(data, nonce, 'outbound');
}
