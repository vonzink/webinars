import { createSlideFrame } from './slide-frame.js';

const PROTOCOL_VERSION = 1;
const NONCE = /^[A-Za-z0-9_-]{16,128}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const ANCHOR = /^[a-z][a-z0-9-]{0,189}$/;
const RUNTIME_ERROR_CODES = new Set(['SLIDE_RUNTIME_ERROR', 'SLIDE_STARTUP_TIMEOUT']);

function invalid() {
  throw new TypeError('Invalid preview input');
}

function dataRecord(value, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid();
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) invalid();
  const ownKeys = Reflect.ownKeys(value);
  if (ownKeys.length !== keys.length
    || ownKeys.some(key => typeof key !== 'string' || !keys.includes(key))) invalid();
  const descriptors = Object.getOwnPropertyDescriptors(value);
  for (const key of keys) {
    const descriptor = descriptors[key];
    if (!descriptor || !descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) invalid();
  }
  return descriptors;
}

function stringValue(descriptors, key) {
  const value = descriptors[key].value;
  if (typeof value !== 'string') invalid();
  return value;
}

function cloneArray(value) {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) invalid();
  const keys = Reflect.ownKeys(value);
  const expected = [...Array(value.length).keys()].map(String);
  if (keys.length !== expected.length + 1 || keys.at(-1) !== 'length'
    || expected.some((key, index) => keys[index] !== key)) invalid();
  const descriptors = Object.getOwnPropertyDescriptors(value);
  return expected.map(key => {
    const descriptor = descriptors[key];
    if (!descriptor || !descriptor.enumerable || !Object.hasOwn(descriptor, 'value')
      || typeof descriptor.value !== 'string') invalid();
    return descriptor.value;
  });
}

function cloneAssetMap(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid();
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) invalid();
  const keys = Reflect.ownKeys(value);
  if (keys.length > 10_000 || keys.some(key => typeof key !== 'string' || !UUID.test(key))) invalid();
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const assets = {};
  for (const key of keys) {
    const descriptor = descriptors[key];
    if (!descriptor || !descriptor.enumerable || !Object.hasOwn(descriptor, 'value')
      || typeof descriptor.value !== 'string') invalid();
    assets[key] = descriptor.value;
  }
  return assets;
}

function cloneCandidate(value) {
  const candidate = dataRecord(value, ['master', 'slide', 'assets', 'resourcePolicy']);
  const master = dataRecord(candidate.master.value, ['html', 'css']);
  const slide = dataRecord(candidate.slide.value, ['id', 'anchor', 'title', 'html', 'css', 'javascript']);
  const policy = dataRecord(candidate.resourcePolicy.value, ['assetOrigin', 'stylesheetOrigins', 'fontOrigins']);
  const id = stringValue(slide, 'id');
  const anchor = stringValue(slide, 'anchor');
  if (!UUID.test(id) || !ANCHOR.test(anchor)) invalid();
  return {
    master: {
      html: stringValue(master, 'html'),
      css: stringValue(master, 'css'),
    },
    slide: {
      id,
      anchor,
      title: stringValue(slide, 'title'),
      html: stringValue(slide, 'html'),
      css: stringValue(slide, 'css'),
      javascript: stringValue(slide, 'javascript'),
    },
    assets: cloneAssetMap(candidate.assets.value),
    resourcePolicy: {
      assetOrigin: stringValue(policy, 'assetOrigin'),
      stylesheetOrigins: cloneArray(policy.stylesheetOrigins.value),
      fontOrigins: cloneArray(policy.fontOrigins.value),
    },
  };
}

function validOrigin(value) {
  if (typeof value !== 'string' || value !== value.trim() || value.includes('*')) return null;
  try {
    const parsed = new URL(value);
    const localHttp = parsed.protocol === 'http:'
      && (parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost');
    if ((parsed.protocol !== 'https:' && !localHttp) || parsed.username || parsed.password
      || parsed.pathname !== '/' || parsed.search || parsed.hash || parsed.origin !== value) return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

function envelope(raw) {
  try {
    const value = dataRecord(raw, ['v', 'nonce', 'type', 'payload']);
    if (value.v.value !== PROTOCOL_VERSION || typeof value.nonce.value !== 'string'
      || !NONCE.test(value.nonce.value) || value.type.value !== 'preview-candidate') return null;
    return {
      nonce: value.nonce.value,
      payload: value.payload.value,
    };
  } catch {
    return null;
  }
}

export function initPreviewHost({
  allowedDashboardOrigins,
  root = globalThis.document,
  windowObject = globalThis.window,
  createFrame = createSlideFrame,
} = {}) {
  if (!Array.isArray(allowedDashboardOrigins) || allowedDashboardOrigins.length < 1
    || allowedDashboardOrigins.length > 32 || !root || typeof root.querySelector !== 'function'
    || !windowObject || typeof windowObject.addEventListener !== 'function'
    || typeof windowObject.removeEventListener !== 'function'
    || !windowObject.parent || typeof windowObject.parent.postMessage !== 'function'
    || typeof createFrame !== 'function') throw new TypeError('Preview host configuration is invalid');
  const origins = new Set(allowedDashboardOrigins.map(validOrigin));
  if (origins.has(null) || origins.size !== allowedDashboardOrigins.length) {
    throw new TypeError('Preview host origin configuration is invalid');
  }
  const container = root.querySelector('[data-preview-frame]');
  if (!container || typeof container.replaceChildren !== 'function') {
    throw new TypeError('Preview host frame container is missing');
  }

  let active = null;
  let destroyed = false;

  function post(origin, nonce, type, payload) {
    windowObject.parent.postMessage({ v: PROTOCOL_VERSION, nonce, type, payload }, origin);
  }

  function rejectCandidate(origin, nonce) {
    post(origin, nonce, 'preview-error', { code: 'PREVIEW_CANDIDATE_INVALID' });
  }

  function receive(event) {
    if (destroyed || event?.source !== windowObject.parent || !origins.has(event.origin)) return;
    const message = envelope(event.data);
    if (!message) return;

    let candidate;
    try {
      candidate = cloneCandidate(message.payload);
    } catch {
      rejectCandidate(event.origin, message.nonce);
      return;
    }

    const prior = active;
    if (prior) prior.frame.destroy();
    const record = { frame: null, nonce: message.nonce, origin: event.origin };
    active = record;
    try {
      record.frame = createFrame({
        container,
        bundle: {
          master: candidate.master,
          assets: candidate.assets,
          resourcePolicy: candidate.resourcePolicy,
        },
        policy: candidate.resourcePolicy,
        onRuntimeState(state) {
          if (destroyed || active !== record || !state || typeof state !== 'object') return;
          if (state.type === 'ready') {
            post(record.origin, record.nonce, 'preview-ready', {});
            return;
          }
          if (state.type === 'error' && RUNTIME_ERROR_CODES.has(state.code)) {
            post(record.origin, record.nonce, 'preview-error', { code: state.code });
          }
        },
      });
      record.frame.showSlide(candidate.slide);
    } catch {
      try { record.frame?.destroy(); } catch { /* failed frame is already inert */ }
      if (active === record) active = null;
      post(record.origin, record.nonce, 'preview-error', { code: 'PREVIEW_COMPOSITION_FAILED' });
    }
  }

  windowObject.addEventListener('message', receive);
  return Object.freeze({
    destroy() {
      if (destroyed) return;
      destroyed = true;
      windowObject.removeEventListener('message', receive);
      try { active?.frame?.destroy(); } catch { /* best-effort sandbox cleanup */ }
      active = null;
    },
  });
}
