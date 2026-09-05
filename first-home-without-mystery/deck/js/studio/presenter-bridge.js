/* ============================================================================
   PRESENTER BRIDGE — audience side of the two-window control contract.

   The Dashboard presenter opens this window and keeps its WindowProxy. Only
   messages whose source is exactly window.opener and whose origin is one of
   the configured Dashboard origins are considered. The first accepted message
   must be presenter-init, which carries the per-launch nonce; from then on
   every control must carry that nonce and one of the fixed types. State goes
   back as scalar acknowledgements only. Nothing here reads storage, tokens,
   or anything beyond the audience controller's public surface.
   ========================================================================= */
import {
  CONTROL_PROTOCOL_VERSION,
  classifyControlMessage,
  validateAudienceMessage,
  validateInitMessage,
} from './control-protocol.js';

const MAX_ORIGINS = 32;

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

/* Controller state events become acknowledgements. Anything that does not fit
   the fixed scalar shape is dropped here before it can be posted. */
function acknowledgementFor(state) {
  if (!state || typeof state !== 'object' || typeof state.type !== 'string') return null;
  switch (state.type) {
    case 'slide-state':
      return { type: 'slide-state', payload: { index: state.index, total: state.total } };
    case 'animation-state':
      return { type: 'animation-state', payload: { current: state.current, total: state.total, playing: state.playing } };
    case 'annotation-state':
      return { type: 'annotation-state', payload: { on: state.on } };
    case 'supported-overlay-state':
    case 'supported-calculator-state':
      return { type: state.type, payload: { id: state.id, visible: state.visible } };
    case 'fullscreen-state':
      return { type: 'fullscreen-state', payload: { on: state.on } };
    case 'nav-state':
      return { type: 'nav-state', payload: { hidden: state.hidden } };
    case 'audience-error':
      return { type: 'audience-error', payload: { code: state.code } };
    default:
      return null;
  }
}

export function initPresenterBridge({
  controller,
  allowedDashboardOrigins,
  windowObject = globalThis.window,
  onIgnored = () => {},
} = {}) {
  if (!controller || typeof controller !== 'object') throw new TypeError('Presenter bridge needs the audience controller');
  if (!Array.isArray(allowedDashboardOrigins) || allowedDashboardOrigins.length < 1
    || allowedDashboardOrigins.length > MAX_ORIGINS) throw new TypeError('Presenter bridge origin configuration is invalid');
  const origins = new Set(allowedDashboardOrigins.map(validOrigin));
  if (origins.has(null) || origins.size !== allowedDashboardOrigins.length) {
    throw new TypeError('Presenter bridge origin configuration is invalid');
  }
  if (!windowObject || typeof windowObject.addEventListener !== 'function'
    || typeof windowObject.removeEventListener !== 'function') throw new TypeError('Presenter bridge window is invalid');

  const presenterWindow = windowObject.opener || null;
  let nonce = null;
  let origin = null;
  let destroyed = false;
  let unsubscribe = null;

  function ignore(reason) {
    try { onIgnored(reason); } catch { /* observers cannot break the boundary */ }
  }

  function post(type, payload) {
    if (destroyed || !nonce || !origin || !presenterWindow || typeof presenterWindow.postMessage !== 'function') return false;
    const message = validateAudienceMessage({ v: CONTROL_PROTOCOL_VERSION, nonce, type, payload }, nonce);
    if (!message) return false;
    try {
      presenterWindow.postMessage(message, origin);
      return true;
    } catch {
      return false;
    }
  }

  function snapshot() {
    const state = typeof controller.snapshot === 'function' ? controller.snapshot() : {};
    const total = Number(state?.total);
    const index = Number(state?.index);
    return {
      index: Number.isSafeInteger(index) && index >= 0 ? index : 0,
      total: Number.isSafeInteger(total) && total >= 1 ? total : 1,
    };
  }

  function dispatch(message) {
    const { type, payload } = message;
    try {
      if (type === 'ping') return post('pong', {});
      if (type === 'goto') return controller.goToIndex?.(payload.index) !== undefined;
      if (type === 'next') return controller.next?.() !== undefined;
      if (type === 'previous') return controller.previous?.() !== undefined;
      if (type.startsWith('animation-')) return controller.sendAnimation?.(type) !== undefined;
      if (type === 'annotation-command') return controller.applyAnnotationCommand?.(payload) !== undefined;
      if (type === 'supported-overlay-state') return controller.sendSupportedState?.('overlay', payload.id, payload.visible) !== undefined;
      if (type === 'supported-calculator-state') return controller.sendSupportedState?.('calculator', payload.id, payload.visible) !== undefined;
      if (type === 'fullscreen-request') return controller.requestFullscreen?.(payload.on) !== undefined;
      if (type === 'nav-visibility') return controller.setNavigationHidden?.(payload.hidden) !== undefined;
    } catch {
      return false;
    }
    return false;
  }

  function receive(event) {
    if (destroyed) return;
    if (!presenterWindow || event?.source !== presenterWindow || !origins.has(event?.origin)) {
      ignore('SOURCE_OR_ORIGIN');
      return;
    }
    const init = validateInitMessage(event.data);
    if (init) {
      // A new launch or reconnect replaces the nonce; the old one is dead.
      nonce = init.nonce;
      origin = event.origin;
      post('audience-ready', snapshot());
      return;
    }
    if (!nonce) {
      ignore('NOT_INITIALIZED');
      return;
    }
    if (event.origin !== origin) {
      ignore('SOURCE_OR_ORIGIN');
      return;
    }
    const result = classifyControlMessage(event.data, nonce);
    if (!result.ok) {
      ignore(result.reason);
      return;
    }
    dispatch(result.message);
  }

  function forward(state) {
    if (destroyed || !nonce) return;
    const acknowledgement = acknowledgementFor(state);
    if (acknowledgement) post(acknowledgement.type, acknowledgement.payload);
  }

  // Listen even without an opener so stray messages are recorded as ignored;
  // acknowledgements are only possible when a presenter window exists.
  windowObject.addEventListener('message', receive);
  if (presenterWindow && typeof controller.subscribe === 'function') unsubscribe = controller.subscribe(forward);

  return Object.freeze({
    get connected() { return Boolean(!destroyed && presenterWindow && nonce); },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      nonce = null;
      origin = null;
      windowObject.removeEventListener('message', receive);
      try { unsubscribe?.(); } catch { /* idempotent */ }
      unsubscribe = null;
    },
  });
}
