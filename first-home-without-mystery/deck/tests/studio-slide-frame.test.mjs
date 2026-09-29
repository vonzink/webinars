import assert from 'node:assert/strict';
import test from 'node:test';

import { createSlideFrame } from '../js/studio/slide-frame.js';

const SLIDE_ONE = Object.freeze({
  id: '11111111-1111-4111-8111-111111111111',
  position: 0,
  anchor: 'opening',
  title: 'Opening',
  html: '<section>One</section>',
  css: '',
  javascript: '',
});
const SLIDE_TWO = Object.freeze({
  ...SLIDE_ONE,
  id: '22222222-2222-4222-8222-222222222222',
  position: 1,
  anchor: 'second',
  title: 'Second',
});
const POLICY = Object.freeze({
  assetOrigin: 'https://assets.example',
  stylesheetOrigins: Object.freeze([]),
  fontOrigins: Object.freeze([]),
});
const BUNDLE = Object.freeze({
  master: Object.freeze({ html: '<main>{{SLIDE_CONTENT}}</main>', css: '' }),
  assets: Object.freeze({}),
  resourcePolicy: POLICY,
});
const NONCES = [
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
];

function message(nonce, type, payload = {}) {
  return { v: 1, nonce, type, payload };
}

class FakeWindow {
  constructor(log) {
    this.log = log;
    this.listeners = new Map();
  }

  addEventListener(type, listener) {
    this.log.push(`listen:${type}`);
    const values = this.listeners.get(type) || [];
    values.push(listener);
    this.listeners.set(type, values);
  }

  removeEventListener(type, listener) {
    this.log.push(`unlisten:${type}`);
    this.listeners.set(type, (this.listeners.get(type) || []).filter(value => value !== listener));
  }

  emitMessage(event) {
    for (const listener of [...(this.listeners.get('message') || [])]) listener(event);
  }
}

class FakeContentWindow {
  constructor(name, log) {
    this.name = name;
    this.log = log;
  }

  postMessage(value, targetOrigin) {
    this.log.push({ event: 'post', name: this.name, targetOrigin, value });
  }
}

function createHarness({ autoReady = false, callback = null } = {}) {
  const log = [];
  const states = [];
  const windowObject = new FakeWindow(log);
  const frames = [];
  const timers = new Map();
  let nextTimer = 1;
  let cryptoIndex = 0;
  const harness = { log, states, windowObject, frames, timers };
  const runtimeCallback = callback || (state => states.push(state));

  const documentObject = {
    createElement(name) {
      assert.equal(name, 'iframe');
      const contentWindow = new FakeContentWindow(`frame-${frames.length + 1}`, log);
      const attributes = new Map();
      const frame = {
        contentWindow,
        attributes,
        removed: false,
        setAttribute(key, value) { attributes.set(key, value); },
        getAttribute(key) { return attributes.get(key) ?? null; },
        remove() {
          this.removed = true;
          log.push(`remove:${contentWindow.name}`);
        },
        set srcdoc(value) {
          this._srcdoc = value;
          log.push(`srcdoc:${contentWindow.name}`);
          if (autoReady) {
            const nonce = value.slice('document:'.length);
            windowObject.emitMessage({ source: contentWindow, data: message(nonce, 'runtime-ready') });
          }
        },
        get srcdoc() { return this._srcdoc; },
      };
      frames.push(frame);
      return frame;
    },
  };
  const container = {
    children: [],
    replaceChildren(...children) {
      log.push(`replace:${children[0]?.contentWindow?.name || 'empty'}`);
      this.children = children;
    },
  };
  const composeDocument = input => {
    log.push(`compose:${input.slide.anchor}`);
    return `document:${input.nonce}`;
  };
  const cryptoImpl = {
    randomUUID() {
      const value = NONCES[cryptoIndex];
      cryptoIndex += 1;
      if (!value) throw new Error('entropy unavailable');
      return value;
    },
  };
  const setTimeoutImpl = (fn, delay) => {
    const id = nextTimer++;
    timers.set(id, { fn, delay });
    log.push(`timer:${id}:${delay}`);
    return id;
  };
  const clearTimeoutImpl = id => {
    if (timers.delete(id)) log.push(`clear:${id}`);
  };

  harness.controller = createSlideFrame({
    bundle: BUNDLE,
    callback: runtimeCallback,
    composeDocument,
    container,
    cryptoImpl,
    documentObject,
    onRuntimeState: runtimeCallback,
    policy: POLICY,
    setTimeoutImpl,
    clearTimeoutImpl,
    startupTimeoutMs: 5000,
    windowObject,
  });
  harness.container = container;
  harness.fireTimer = id => timers.get(id)?.fn();
  return harness;
}

test('binds before srcdoc, creates a fresh allow-scripts-only frame, and accepts ready once', () => {
  const harness = createHarness({ autoReady: true });
  const frame = harness.controller.showSlide(SLIDE_ONE);

  assert.equal(frame, harness.frames[0]);
  assert.equal(frame.getAttribute('sandbox'), 'allow-scripts');
  assert.equal(frame.attributes.size, 1);
  assert.ok(harness.log.indexOf('listen:message') < harness.log.indexOf('srcdoc:frame-1'));
  assert.deepEqual(harness.states, [{ type: 'ready' }]);
  assert.equal(harness.timers.size, 0);

  harness.windowObject.emitMessage({
    source: frame.contentWindow,
    data: message(NONCES[0], 'runtime-ready'),
  });
  assert.deepEqual(harness.states, [{ type: 'ready' }]);
});

test('requires exact active source, nonce, version, type, and validated payloads', () => {
  const harness = createHarness();
  const frame = harness.controller.showSlide(SLIDE_ONE);
  const attacker = new FakeContentWindow('attacker', harness.log);

  for (const event of [
    { source: attacker, data: message(NONCES[0], 'runtime-ready') },
    { source: frame.contentWindow, data: message(NONCES[1], 'runtime-ready') },
    { source: frame.contentWindow, data: { ...message(NONCES[0], 'runtime-ready'), v: 2 } },
    { source: frame.contentWindow, data: message(NONCES[0], 'unknown') },
    { source: frame.contentWindow, data: message(NONCES[0], 'animation-state', { current: 3, total: 2, playing: false }) },
  ]) harness.windowObject.emitMessage(event);
  assert.deepEqual(harness.states, []);

  harness.windowObject.emitMessage({
    source: frame.contentWindow,
    data: message(NONCES[0], 'runtime-ready'),
  });
  harness.windowObject.emitMessage({
    source: frame.contentWindow,
    data: message(NONCES[0], 'animation-state', { current: 1, total: 2, playing: false }),
  });
  harness.windowObject.emitMessage({
    source: frame.contentWindow,
    data: message(NONCES[0], 'supported-overlay-state', { actionId: 'open-details' }),
  });
  harness.windowObject.emitMessage({
    source: frame.contentWindow,
    data: message(NONCES[0], 'supported-calculator-state', { actionId: 'recalculate' }),
  });
  assert.deepEqual(harness.states, [
    { type: 'ready' },
    { type: 'animation-state', current: 1, total: 2, playing: false },
    { type: 'supported-overlay-state', actionId: 'open-details' },
    { type: 'supported-calculator-state', actionId: 'recalculate' },
  ]);
});

test('send validates the inbound protocol and uses target * only for the exact active window', () => {
  const harness = createHarness();
  const frame = harness.controller.showSlide(SLIDE_ONE);

  assert.equal(harness.controller.send('animation-forward'), true);
  assert.equal(harness.controller.send('supported-overlay-state', { actionId: 'open-details' }), true);
  assert.equal(harness.controller.send('supported-overlay-state', { actionId: '../bad' }), false);
  assert.equal(harness.controller.send('runtime-ready'), false);

  const posts = harness.log.filter(entry => entry?.event === 'post');
  assert.deepEqual(posts, [
    {
      event: 'post',
      name: 'frame-1',
      targetOrigin: '*',
      value: message(NONCES[0], 'animation-forward'),
    },
    {
      event: 'post',
      name: 'frame-1',
      targetOrigin: '*',
      value: message(NONCES[0], 'supported-overlay-state', { actionId: 'open-details' }),
    },
  ]);
  assert.equal(frame.getAttribute('sandbox'), 'allow-scripts');
});

test('rapid switching sends slide-exit before replacement and ignores stale frames and timers', () => {
  const harness = createHarness();
  const first = harness.controller.showSlide(SLIDE_ONE);
  const firstTimer = [...harness.timers.keys()][0];
  const second = harness.controller.showSlide(SLIDE_TWO);

  const exitIndex = harness.log.findIndex(entry => entry?.event === 'post' && entry.name === 'frame-1');
  const replaceIndex = harness.log.indexOf('replace:frame-2');
  assert.ok(exitIndex >= 0 && exitIndex < replaceIndex);
  assert.equal(first.removed, true);
  assert.notEqual(first, second);

  harness.windowObject.emitMessage({ source: first.contentWindow, data: message(NONCES[0], 'runtime-ready') });
  harness.fireTimer(firstTimer);
  assert.deepEqual(harness.states, []);

  harness.windowObject.emitMessage({ source: second.contentWindow, data: message(NONCES[1], 'runtime-ready') });
  assert.deepEqual(harness.states, [{ type: 'ready' }]);
});

test('ready and timeout race is single-winner and timeout exposes only a safe code', () => {
  const readyFirst = createHarness();
  const readyFrame = readyFirst.controller.showSlide(SLIDE_ONE);
  const readyTimer = [...readyFirst.timers.keys()][0];
  readyFirst.windowObject.emitMessage({ source: readyFrame.contentWindow, data: message(NONCES[0], 'runtime-ready') });
  readyFirst.fireTimer(readyTimer);
  assert.deepEqual(readyFirst.states, [{ type: 'ready' }]);

  const timeoutFirst = createHarness();
  const timeoutFrame = timeoutFirst.controller.showSlide(SLIDE_ONE);
  const timeoutTimer = [...timeoutFirst.timers.keys()][0];
  timeoutFirst.fireTimer(timeoutTimer);
  timeoutFirst.windowObject.emitMessage({ source: timeoutFrame.contentWindow, data: message(NONCES[0], 'runtime-ready') });
  assert.deepEqual(timeoutFirst.states, [{ type: 'error', code: 'SLIDE_STARTUP_TIMEOUT' }]);
  assert.doesNotMatch(JSON.stringify(timeoutFirst.states), /document|nonce|source|stack|opening/i);
});

test('runtime errors are closed, callback exceptions are contained, and destroy is idempotent', () => {
  const received = [];
  const harness = createHarness({
    callback(state) {
      received.push(state);
      throw new Error('outer callback failure');
    },
  });
  const frame = harness.controller.showSlide(SLIDE_ONE);

  assert.doesNotThrow(() => harness.windowObject.emitMessage({
    source: frame.contentWindow,
    data: message(NONCES[0], 'runtime-error', { code: 'SLIDE_RUNTIME_ERROR', line: 999, column: 4 }),
  }));
  assert.deepEqual(received, [{ type: 'error', code: 'SLIDE_RUNTIME_ERROR' }]);

  assert.doesNotThrow(() => harness.controller.destroy());
  assert.doesNotThrow(() => harness.controller.destroy());
  assert.equal(frame.removed, true);
  assert.equal(harness.container.children.length, 0);
  assert.equal(harness.timers.size, 0);
  assert.equal(harness.windowObject.listeners.get('message').length, 0);
  assert.equal(harness.controller.send('animation-forward'), false);

  harness.windowObject.emitMessage({ source: frame.contentWindow, data: message(NONCES[0], 'runtime-ready') });
  assert.equal(received.length, 1);
});

test('destroy-before-ready suppresses callbacks and crypto failure does not replace the current frame', () => {
  const harness = createHarness();
  const frame = harness.controller.showSlide(SLIDE_ONE);
  const timer = [...harness.timers.keys()][0];
  harness.controller.destroy();
  harness.fireTimer(timer);
  harness.windowObject.emitMessage({ source: frame.contentWindow, data: message(NONCES[0], 'runtime-ready') });
  assert.deepEqual(harness.states, []);

  const cryptoFailure = createHarness();
  const first = cryptoFailure.controller.showSlide(SLIDE_ONE);
  cryptoFailure.controller.showSlide(SLIDE_TWO);
  assert.throws(
    () => cryptoFailure.controller.showSlide(SLIDE_ONE),
    error => {
      assert.equal(error.message, 'Unable to create slide frame');
      assert.equal(error.code, 'SLIDE_CRYPTO_UNAVAILABLE');
      return true;
    },
  );
  assert.equal(cryptoFailure.container.children[0].contentWindow.name, 'frame-2');
  assert.equal(cryptoFailure.frames.length, 2);
  assert.equal(first.removed, true);
});
