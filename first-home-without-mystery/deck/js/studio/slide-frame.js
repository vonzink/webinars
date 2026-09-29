import { composeSlideDocument } from './composition.js';
import {
  RUNTIME_PROTOCOL_VERSION,
  validateRuntimeInbound,
  validateRuntimeOutbound,
} from './runtime-protocol.js';

const NONCE = /^[A-Za-z0-9_-]{16,128}$/;
const DEFAULT_STARTUP_TIMEOUT_MS = 10_000;

export class SlideFrameError extends Error {
  constructor(code) {
    super('Unable to create slide frame');
    this.name = 'SlideFrameError';
    this.code = code;
  }
}

function frameFail(code) {
  throw new SlideFrameError(code);
}

function safeCallback(callback, state) {
  try {
    callback(state);
  } catch {
    // The trusted shell callback cannot be allowed to break frame cleanup.
  }
}

function toTrustedState(message) {
  if (message.type === 'runtime-ready') return { type: 'ready' };
  if (message.type === 'runtime-error') {
    return { type: 'error', code: 'SLIDE_RUNTIME_ERROR' };
  }
  if (message.type === 'animation-state') {
    return {
      type: 'animation-state',
      current: message.payload.current,
      total: message.payload.total,
      playing: message.payload.playing,
    };
  }
  if (message.type === 'supported-overlay-state'
    || message.type === 'supported-calculator-state') {
    return { type: message.type, actionId: message.payload.actionId };
  }
  return null;
}

export function createSlideFrame({
  container,
  bundle,
  policy,
  onRuntimeState,
  composeDocument = composeSlideDocument,
  cryptoImpl = globalThis.crypto,
  documentObject = globalThis.document,
  windowObject = globalThis.window,
  setTimeoutImpl = globalThis.setTimeout,
  clearTimeoutImpl = globalThis.clearTimeout,
  startupTimeoutMs = DEFAULT_STARTUP_TIMEOUT_MS,
}) {
  if (!container || typeof container.replaceChildren !== 'function'
    || !bundle || typeof bundle !== 'object'
    || !policy || typeof policy !== 'object'
    || typeof onRuntimeState !== 'function'
    || typeof composeDocument !== 'function'
    || !documentObject || typeof documentObject.createElement !== 'function'
    || !windowObject || typeof windowObject.addEventListener !== 'function'
    || typeof windowObject.removeEventListener !== 'function'
    || typeof setTimeoutImpl !== 'function' || typeof clearTimeoutImpl !== 'function'
    || !Number.isSafeInteger(startupTimeoutMs) || startupTimeoutMs < 1
    || startupTimeoutMs > 120_000) frameFail('SLIDE_FRAME_CONFIGURATION_INVALID');

  let active = null;
  let destroyed = false;

  function clearStartupTimer(record) {
    if (record.timer !== null) {
      try {
        clearTimeoutImpl(record.timer);
      } catch {
        // Stale timeout identity checks still prevent an outer-shell callback.
      }
      record.timer = null;
    }
  }

  function postToRecord(record, type, payload) {
    if (!record || !record.contentWindow) return false;
    const raw = {
      v: RUNTIME_PROTOCOL_VERSION,
      nonce: record.nonce,
      type,
      payload: payload === undefined ? {} : payload,
    };
    const message = validateRuntimeInbound(raw, record.nonce);
    if (!message) return false;
    try {
      // The scripts-only sandbox has an opaque origin. Exact WindowProxy
      // identity plus the per-frame nonce forms the trust boundary.
      record.contentWindow.postMessage(message, '*');
      return true;
    } catch {
      return false;
    }
  }

  function disposeActive({ clearContainer = false, sendExit = true } = {}) {
    const record = active;
    if (!record) {
      if (clearContainer) {
        try { container.replaceChildren(); } catch { /* already empty */ }
      }
      return;
    }
    if (sendExit) postToRecord(record, 'slide-exit', {});
    active = null;
    clearStartupTimer(record);
    try { record.iframe.remove(); } catch { /* replacement still owns cleanup */ }
    if (clearContainer) {
      try { container.replaceChildren(); } catch { /* frame was already removed */ }
    }
  }

  function receiveRuntimeMessage(event) {
    if (destroyed) return;
    const record = active;
    if (!record || event?.source !== record.contentWindow) return;
    const message = validateRuntimeOutbound(event.data, record.nonce);
    if (!message) return;

    if (message.type === 'runtime-ready') {
      if (record.startupState !== 'pending') return;
      record.startupState = 'ready';
      clearStartupTimer(record);
      safeCallback(onRuntimeState, { type: 'ready' });
      return;
    }

    if (message.type === 'runtime-error') {
      if (record.startupState === 'pending') {
        record.startupState = 'error';
        clearStartupTimer(record);
      }
      safeCallback(onRuntimeState, { type: 'error', code: 'SLIDE_RUNTIME_ERROR' });
      return;
    }

    if (record.startupState !== 'ready') return;
    const state = toTrustedState(message);
    if (state) safeCallback(onRuntimeState, state);
  }

  try {
    windowObject.addEventListener('message', receiveRuntimeMessage);
  } catch {
    frameFail('SLIDE_FRAME_CONFIGURATION_INVALID');
  }

  function showSlide(slide) {
    if (destroyed) frameFail('SLIDE_FRAME_DESTROYED');

    let nonce;
    try {
      if (!cryptoImpl || typeof cryptoImpl.randomUUID !== 'function') {
        frameFail('SLIDE_CRYPTO_UNAVAILABLE');
      }
      nonce = cryptoImpl.randomUUID();
      if (typeof nonce !== 'string' || !NONCE.test(nonce)) frameFail('SLIDE_CRYPTO_UNAVAILABLE');
    } catch (error) {
      if (error instanceof SlideFrameError) throw error;
      frameFail('SLIDE_CRYPTO_UNAVAILABLE');
    }

    let sourceDocument;
    try {
      sourceDocument = composeDocument({
        master: bundle.master,
        slide,
        assets: bundle.assets,
        policy,
        nonce,
        previewMode: false,
      });
      if (typeof sourceDocument !== 'string' || !sourceDocument) {
        frameFail('SLIDE_COMPOSITION_FAILED');
      }
    } catch (error) {
      if (error instanceof SlideFrameError) throw error;
      frameFail('SLIDE_COMPOSITION_FAILED');
    }

    let iframe;
    try {
      iframe = documentObject.createElement('iframe');
      if (!iframe || typeof iframe.setAttribute !== 'function') frameFail('SLIDE_FRAME_CREATION_FAILED');
      iframe.setAttribute('sandbox', 'allow-scripts');
      if (typeof iframe.getAttribute !== 'function'
        || iframe.getAttribute('sandbox') !== 'allow-scripts') frameFail('SLIDE_FRAME_CREATION_FAILED');
    } catch (error) {
      if (error instanceof SlideFrameError) throw error;
      frameFail('SLIDE_FRAME_CREATION_FAILED');
    }

    disposeActive({ clearContainer: false, sendExit: true });
    const record = {
      contentWindow: null,
      iframe,
      nonce,
      startupState: 'pending',
      timer: null,
    };
    active = record;

    try {
      container.replaceChildren(iframe);
      record.contentWindow = iframe.contentWindow;
      if (!record.contentWindow || typeof record.contentWindow.postMessage !== 'function') {
        frameFail('SLIDE_FRAME_CREATION_FAILED');
      }
      record.timer = setTimeoutImpl(() => {
        if (destroyed || active !== record || record.startupState !== 'pending') return;
        record.timer = null;
        record.startupState = 'timeout';
        safeCallback(onRuntimeState, { type: 'error', code: 'SLIDE_STARTUP_TIMEOUT' });
      }, startupTimeoutMs);
      iframe.srcdoc = sourceDocument;
    } catch (error) {
      if (active === record) disposeActive({ clearContainer: true, sendExit: false });
      if (error instanceof SlideFrameError) throw error;
      frameFail('SLIDE_FRAME_CREATION_FAILED');
    }
    return iframe;
  }

  function send(type, payload) {
    if (destroyed || !active) return false;
    return postToRecord(active, type, payload);
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    disposeActive({ clearContainer: true, sendExit: true });
    try { windowObject.removeEventListener('message', receiveRuntimeMessage); } catch { /* idempotent */ }
  }

  return Object.freeze({ destroy, send, showSlide });
}
