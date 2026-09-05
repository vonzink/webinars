import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { initPreviewHost } from '../js/studio/preview-host.js';

const DASHBOARD_ORIGIN = 'https://dashboard.msfgco.com';
const NONCE = '11111111-1111-4111-8111-111111111111';
const SLIDE_ID = '22222222-2222-4222-8222-222222222222';
const ASSET_ID = '33333333-3333-4333-8333-333333333333';

function candidate() {
  return {
    master: { html: '<main>{{SLIDE_CONTENT}}</main>', css: 'main{display:grid}' },
    slide: {
      id: SLIDE_ID,
      anchor: 'opening',
      title: 'Opening',
      html: '<section>{{ASSET:33333333-3333-4333-8333-333333333333}}</section>',
      css: '.slide{display:grid}',
      javascript: 'window.addEventListener("slide-enter", () => {});',
    },
    assets: { [ASSET_ID]: 'https://assets.example/opening.webp' },
    resourcePolicy: {
      assetOrigin: 'https://assets.example',
      stylesheetOrigins: [],
      fontOrigins: [],
    },
  };
}

class FakeWindow {
  constructor(parent) {
    this.parent = parent;
    this.listeners = new Map();
  }
  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }
  removeEventListener(type, listener) {
    this.listeners.set(type, (this.listeners.get(type) || []).filter(value => value !== listener));
  }
  emit(type, event) {
    for (const listener of [...(this.listeners.get(type) || [])]) listener(event);
  }
}

function harness() {
  const posts = [];
  const parent = {
    postMessage(message, targetOrigin) { posts.push({ message, targetOrigin }); },
  };
  const windowObject = new FakeWindow(parent);
  const container = { replaceChildren() {} };
  const root = { querySelector: selector => selector === '[data-preview-frame]' ? container : null };
  const frames = [];
  const createFrame = options => {
    const frame = {
      options,
      slides: [],
      destroyed: false,
      showSlide(slide) { this.slides.push(slide); },
      destroy() { this.destroyed = true; },
    };
    frames.push(frame);
    return frame;
  };
  const host = initPreviewHost({
    allowedDashboardOrigins: [DASHBOARD_ORIGIN],
    createFrame,
    root,
    windowObject,
  });
  return { createFrame, frames, host, parent, posts, windowObject };
}

function envelope(payload = candidate(), overrides = {}) {
  return { v: 1, nonce: NONCE, type: 'preview-candidate', payload, ...overrides };
}

test('accepts only the exact parent, configured origin, version, nonce, type, and candidate shape', () => {
  const testHarness = harness();
  const attacker = {};
  const invalidEvents = [
    { source: attacker, origin: DASHBOARD_ORIGIN, data: envelope() },
    { source: testHarness.parent, origin: 'https://evil.example', data: envelope() },
    { source: testHarness.parent, origin: DASHBOARD_ORIGIN, data: envelope(candidate(), { v: 2 }) },
    { source: testHarness.parent, origin: DASHBOARD_ORIGIN, data: envelope(candidate(), { nonce: 'short' }) },
    { source: testHarness.parent, origin: DASHBOARD_ORIGIN, data: envelope(candidate(), { type: 'presenter-control' }) },
  ];
  invalidEvents.forEach(event => testHarness.windowObject.emit('message', event));
  assert.equal(testHarness.frames.length, 0);
  assert.deepEqual(testHarness.posts, []);

  testHarness.windowObject.emit('message', {
    source: testHarness.parent,
    origin: DASHBOARD_ORIGIN,
    data: envelope(),
  });
  assert.equal(testHarness.frames.length, 1);
  assert.deepEqual(testHarness.frames[0].options.bundle, {
    master: candidate().master,
    assets: candidate().assets,
    resourcePolicy: candidate().resourcePolicy,
  });
  assert.deepEqual(testHarness.frames[0].options.policy, candidate().resourcePolicy);
  assert.deepEqual(testHarness.frames[0].slides, [candidate().slide]);

  testHarness.frames[0].options.onRuntimeState({ type: 'ready' });
  assert.deepEqual(testHarness.posts, [{
    targetOrigin: DASHBOARD_ORIGIN,
    message: { v: 1, nonce: NONCE, type: 'preview-ready', payload: {} },
  }]);
});

test('rejects extra, accessor, inherited, multiple-slide, and unsafe candidate envelopes without reading source', () => {
  const testHarness = harness();
  let getterReads = 0;
  const accessor = candidate();
  Object.defineProperty(accessor.slide, 'html', {
    enumerable: true,
    get() { getterReads += 1; return '<section>getter</section>'; },
  });
  const inherited = Object.create({ token: 'private' });
  Object.assign(inherited, candidate());
  const malformed = [
    { ...candidate(), extra: 'private-token' },
    { ...candidate(), slides: [candidate().slide, candidate().slide] },
    { ...candidate(), slide: [candidate().slide, candidate().slide] },
    accessor,
    inherited,
  ];
  malformed.forEach(payload => testHarness.windowObject.emit('message', {
    source: testHarness.parent,
    origin: DASHBOARD_ORIGIN,
    data: envelope(payload),
  }));
  assert.equal(getterReads, 0);
  assert.equal(testHarness.frames.length, 0);
  assert.equal(testHarness.posts.length, malformed.length);
  assert.ok(testHarness.posts.every(post => post.targetOrigin === DASHBOARD_ORIGIN));
  assert.ok(testHarness.posts.every(post => post.message.type === 'preview-error'));
  assert.ok(testHarness.posts.every(post => post.message.payload.code === 'PREVIEW_CANDIDATE_INVALID'));
  assert.doesNotMatch(JSON.stringify(testHarness.posts), /private-token|getter|section/i);
});

test('replaces stale frames and exposes only bounded canonical runtime failure codes', () => {
  const testHarness = harness();
  const send = payload => testHarness.windowObject.emit('message', {
    source: testHarness.parent,
    origin: DASHBOARD_ORIGIN,
    data: envelope(payload),
  });
  send(candidate());
  send({ ...candidate(), slide: { ...candidate().slide, title: 'Changed' } });
  assert.equal(testHarness.frames.length, 2);
  assert.equal(testHarness.frames[0].destroyed, true);

  testHarness.frames[0].options.onRuntimeState({ type: 'ready' });
  assert.deepEqual(testHarness.posts, []);
  testHarness.frames[1].options.onRuntimeState({ type: 'error', code: 'SLIDE_STARTUP_TIMEOUT', source: '<script>secret</script>' });
  assert.deepEqual(testHarness.posts, [{
    targetOrigin: DASHBOARD_ORIGIN,
    message: { v: 1, nonce: NONCE, type: 'preview-error', payload: { code: 'SLIDE_STARTUP_TIMEOUT' } },
  }]);
  assert.doesNotMatch(JSON.stringify(testHarness.posts), /secret|script|source/i);

  testHarness.host.destroy();
  assert.equal(testHarness.frames[1].destroyed, true);
  assert.deepEqual(testHarness.windowObject.listeners.get('message'), []);
});

test('studio viewer selects preview mode without changing the default public audience path', async () => {
  const html = await readFile(new URL('../studio-viewer.html', import.meta.url), 'utf8');
  assert.match(html, /data-preview-frame/);
  assert.match(html, /mode.*preview/);
  assert.match(html, /initPreviewHost/);
  assert.match(html, /initStudioAudience/);
  assert.match(html, /https:\/\/dashboard\.msfgco\.com/);
  assert.doesNotMatch(html, /http:\/\/(?:127\.0\.0\.1|localhost)/);
  assert.match(html, /import \{ initPreviewHost \} from '\.\/js\/studio\/preview-host\.js';/);
  assert.match(html, /import \{ initStudioAudience \} from '\.\/js\/studio\/audience-controller\.js';/);
  assert.doesNotMatch(html, /await\s+import\s*\(/);
});
