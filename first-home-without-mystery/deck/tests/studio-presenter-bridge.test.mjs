import assert from 'node:assert/strict';
import test from 'node:test';

import { initPresenterBridge } from '../js/studio/presenter-bridge.js';

const DASHBOARD = 'https://dashboard.msfgco.com';
const nonce = 'c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f';

class FakeWindow {
  constructor(opener) {
    this.opener = opener;
    this.listeners = new Map();
  }
  addEventListener(type, listener) {
    this.listeners.set(type, [...(this.listeners.get(type) || []), listener]);
  }
  removeEventListener(type, listener) {
    this.listeners.set(type, (this.listeners.get(type) || []).filter(item => item !== listener));
  }
  emit(type, event) {
    for (const listener of [...(this.listeners.get(type) || [])]) listener(event);
  }
}

function fakeController() {
  const calls = [];
  let listener = null;
  const controller = {
    currentSlide: { anchor: 'opening' },
    slideCount: 15,
    index: 0,
    fullscreen: false,
    navigationHidden: false,
    goToIndex(index) { calls.push(['goto', index]); controller.index = index; return true; },
    next() { calls.push(['next']); controller.index += 1; return true; },
    previous() { calls.push(['previous']); controller.index -= 1; return true; },
    sendAnimation(type) { calls.push(['animation', type]); return true; },
    applyAnnotationCommand(command) { calls.push(['annotation', command]); return true; },
    sendSupportedState(kind, id, visible) { calls.push(['supported', kind, id, visible]); return true; },
    requestFullscreen(on) { calls.push(['fullscreen', on]); return true; },
    setNavigationHidden(hidden) { calls.push(['nav', hidden]); controller.navigationHidden = hidden; return true; },
    subscribe(fn) { listener = fn; return () => { listener = null; }; },
    emit(state) { listener?.(state); },
    snapshot() {
      return { index: controller.index, total: controller.slideCount, annotationOn: false, fullscreen: controller.fullscreen, navigationHidden: controller.navigationHidden };
    },
  };
  return { controller, calls };
}

function harness({ opener = { postMessage() {} }, origins = [DASHBOARD] } = {}) {
  const posted = [];
  const openerWindow = opener && { ...opener, postMessage(message, target) { posted.push([message, target]); } };
  const windowObject = new FakeWindow(openerWindow);
  const { controller, calls } = fakeController();
  const ignored = [];
  const bridge = initPresenterBridge({
    controller,
    allowedDashboardOrigins: origins,
    windowObject,
    onIgnored: reason => ignored.push(reason),
  });
  const send = (data, { origin = DASHBOARD, source = openerWindow } = {}) => windowObject.emit('message', { origin, source, data });
  const init = () => send({ v: 1, nonce, type: 'presenter-init', payload: {} });
  return { bridge, windowObject, openerWindow, controller, calls, ignored, posted, send, init };
}

test('an audience opened without an opener has no bridge and never posts', () => {
  const test = harness({ opener: null });
  assert.equal(test.bridge.connected, false);
  test.send({ v: 1, nonce, type: 'presenter-init', payload: {} }, { source: null });
  assert.deepEqual(test.posted, []);
  assert.deepEqual(test.ignored, ['SOURCE_OR_ORIGIN']);
});

test('accepts initialization only from the exact opener and an allowed origin, then answers audience-ready', () => {
  const test = harness();
  const stranger = { postMessage() {} };
  test.send({ v: 1, nonce, type: 'presenter-init', payload: {} }, { source: stranger });
  test.send({ v: 1, nonce, type: 'presenter-init', payload: {} }, { origin: 'https://evil.example' });
  test.send({ v: 1, nonce, type: 'next', payload: {} });
  assert.deepEqual(test.ignored, ['SOURCE_OR_ORIGIN', 'SOURCE_OR_ORIGIN', 'NOT_INITIALIZED']);
  assert.deepEqual(test.posted, []);

  test.init();
  assert.equal(test.bridge.connected, true);
  assert.deepEqual(test.posted, [[{ v: 1, nonce, type: 'audience-ready', payload: { index: 0, total: 15 } }, DASHBOARD]]);
  assert.equal(JSON.stringify(test.ignored).includes(nonce), false, 'reasons never carry the nonce');
});

test('dispatches validated controls to the audience controller and rejects everything else', () => {
  const test = harness();
  test.init();
  test.posted.length = 0;
  test.send({ v: 1, nonce, type: 'goto', payload: { index: 4 } });
  test.send({ v: 1, nonce, type: 'next', payload: {} });
  test.send({ v: 1, nonce, type: 'previous', payload: {} });
  test.send({ v: 1, nonce, type: 'animation-forward', payload: {} });
  test.send({ v: 1, nonce, type: 'annotation-command', payload: { on: true, tool: 'pen' } });
  test.send({ v: 1, nonce, type: 'supported-calculator-state', payload: { id: 'cash-to-close', visible: true } });
  test.send({ v: 1, nonce, type: 'fullscreen-request', payload: { on: true } });
  test.send({ v: 1, nonce, type: 'nav-visibility', payload: { hidden: true } });
  assert.deepEqual(test.calls, [
    ['goto', 4], ['next'], ['previous'], ['animation', 'animation-forward'],
    ['annotation', { on: true, tool: 'pen' }], ['supported', 'calculator', 'cash-to-close', true],
    ['fullscreen', true], ['nav', true],
  ]);

  const before = test.calls.length;
  test.send({ v: 1, nonce: 'wrong-nonce-value-0000', type: 'next', payload: {} });
  test.send({ v: 2, nonce, type: 'next', payload: {} });
  test.send({ v: 1, nonce, type: 'eval', payload: {} });
  test.send({ v: 1, nonce, type: 'goto', payload: { url: 'https://evil.example' } });
  test.send({ v: 1, nonce, type: 'goto', payload: { index: 4, selector: '#x' } });
  test.send({ v: 1, nonce, type: 'annotation-command', payload: { tool: 'javascript:alert(1)' } });
  test.send({ v: 1, nonce, type: 'next', payload: {} }, { origin: 'https://evil.example' });
  test.send({ v: 1, nonce, type: 'next', payload: {} }, { source: { postMessage() {} } });
  assert.equal(test.calls.length, before);
  assert.deepEqual(test.ignored, ['WRONG_NONCE', 'WRONG_VERSION', 'UNKNOWN_TYPE', 'INVALID_PAYLOAD', 'INVALID_PAYLOAD', 'INVALID_PAYLOAD', 'SOURCE_OR_ORIGIN', 'SOURCE_OR_ORIGIN']);
  assert.equal(JSON.stringify(test.ignored).includes('evil'), false);
});

test('answers ping with pong and forwards controller state as scalar acknowledgements only', () => {
  const test = harness();
  test.init();
  test.posted.length = 0;
  test.send({ v: 1, nonce, type: 'ping', payload: {} });
  assert.deepEqual(test.posted.at(-1), [{ v: 1, nonce, type: 'pong', payload: {} }, DASHBOARD]);

  test.controller.emit({ type: 'slide-state', index: 3, total: 15, html: '<b>never</b>' });
  test.controller.emit({ type: 'animation-state', current: 1, total: 3, playing: true });
  test.controller.emit({ type: 'annotation-state', on: true });
  test.controller.emit({ type: 'supported-overlay-state', id: 'rates', visible: true });
  test.controller.emit({ type: 'fullscreen-state', on: false });
  test.controller.emit({ type: 'nav-state', hidden: true });
  test.controller.emit({ type: 'audience-error', code: 'SLIDE_RUNTIME_ERROR', stack: 'at evil' });
  test.controller.emit({ type: 'not-a-state', anything: 1 });
  test.controller.emit({ type: 'supported-overlay-state', id: 'javascript:alert(1)', visible: true });
  const messages = test.posted.slice(1).map(([message]) => message);
  assert.deepEqual(messages, [
    { v: 1, nonce, type: 'slide-state', payload: { index: 3, total: 15 } },
    { v: 1, nonce, type: 'animation-state', payload: { current: 1, total: 3, playing: true } },
    { v: 1, nonce, type: 'annotation-state', payload: { on: true } },
    { v: 1, nonce, type: 'supported-overlay-state', payload: { id: 'rates', visible: true } },
    { v: 1, nonce, type: 'fullscreen-state', payload: { on: false } },
    { v: 1, nonce, type: 'nav-state', payload: { hidden: true } },
    { v: 1, nonce, type: 'audience-error', payload: { code: 'SLIDE_RUNTIME_ERROR' } },
  ]);
  assert.equal(test.posted.every(([, target]) => target === DASHBOARD), true);
  assert.equal(JSON.stringify(test.posted).includes('never'), false);
  assert.equal(JSON.stringify(test.posted).includes('evil'), false);
});

test('a fresh initialization replaces the nonce, and nothing is posted before initialization', () => {
  const test = harness();
  test.controller.emit({ type: 'slide-state', index: 2, total: 15 });
  assert.deepEqual(test.posted, []);
  test.init();
  const second = 'd2e3f4a5-b6c7-4d8e-9f0a-1b2c3d4e5f6a';
  test.send({ v: 1, nonce: second, type: 'presenter-init', payload: {} });
  test.posted.length = 0;
  test.send({ v: 1, nonce, type: 'next', payload: {} });
  assert.deepEqual(test.ignored.at(-1), 'WRONG_NONCE');
  test.send({ v: 1, nonce: second, type: 'next', payload: {} });
  assert.deepEqual(test.calls.at(-1), ['next']);
  test.controller.emit({ type: 'slide-state', index: 1, total: 15 });
  assert.equal(test.posted.at(-1)[0].nonce, second);
});

test('refuses unsafe origin configuration and tears down cleanly', () => {
  assert.throws(() => initPresenterBridge({ controller: fakeController().controller, allowedDashboardOrigins: ['*'], windowObject: new FakeWindow({ postMessage() {} }) }), /origin/i);
  assert.throws(() => initPresenterBridge({ controller: fakeController().controller, allowedDashboardOrigins: ['http://dashboard.msfgco.com'], windowObject: new FakeWindow({ postMessage() {} }) }), /origin/i);
  assert.throws(() => initPresenterBridge({ controller: fakeController().controller, allowedDashboardOrigins: [], windowObject: new FakeWindow({ postMessage() {} }) }), /origin/i);
  const test = harness();
  test.init();
  test.bridge.destroy();
  assert.equal(test.windowObject.listeners.get('message').length, 0);
  test.controller.emit({ type: 'slide-state', index: 1, total: 15 });
  assert.equal(test.posted.length, 1);
  assert.equal(test.bridge.connected, false);
});

test('the viewer page attaches the presenter bridge to the audience controller for the Dashboard origin only', async () => {
  const { readFile } = await import('node:fs/promises');
  const html = await readFile(new URL('../studio-viewer.html', import.meta.url), 'utf8');
  assert.match(html, /import \{ initPresenterBridge \} from '\.\/js\/studio\/presenter-bridge\.js';/);
  const audienceBlock = html.slice(html.indexOf('} else {'), html.lastIndexOf('</script>'));
  assert.match(audienceBlock, /initStudioAudience\(\{/);
  assert.match(audienceBlock, /initPresenterBridge\(\{\s*controller,\s*allowedDashboardOrigins:\s*\[\s*'https:\/\/dashboard\.msfgco\.com',?\s*\],?\s*\}\)/);
  assert.equal((audienceBlock.match(/allowedDashboardOrigins/g) || []).length, 1);
  assert.doesNotMatch(audienceBlock, /http:\/\/(?:127\.0\.0\.1|localhost)/);
  assert.doesNotMatch(audienceBlock, /allowedDashboardOrigins:\s*\[[^\]]*\*/);
  // The bridge needs a live controller; a fatal load returns null and must not throw.
  assert.match(audienceBlock, /if \(controller\)/);
  // Presenter nav-visibility hides the whole dock, so the footer must carry the hook.
  assert.match(html, /<footer class="viewer-dock" data-nav-dock>/);
});
