import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { initStudioAudience } from '../js/studio/audience-controller.js';

const SLIDES = Object.freeze([
  Object.freeze({
    id: '11111111-1111-4111-8111-111111111111',
    position: 0,
    anchor: 'opening',
    title: 'Opening',
    html: '<section>Opening</section>',
    css: '',
    javascript: '',
  }),
  Object.freeze({
    id: '22222222-2222-4222-8222-222222222222',
    position: 1,
    anchor: 'confident-number',
    title: 'A confident number',
    html: '<section>Number</section>',
    css: '',
    javascript: '',
  }),
  Object.freeze({
    id: '33333333-3333-4333-8333-333333333333',
    position: 2,
    anchor: 'next-steps',
    title: 'Next steps',
    html: '<section>Next</section>',
    css: '',
    javascript: '',
  }),
]);

function liveBundle(liveVersion = 7) {
  return Object.freeze({
    schemaVersion: 1,
    webinar: Object.freeze({
      id: 41,
      slug: 'first-home-without-mystery',
      title: 'Your first home, without the mystery.',
      liveVersion,
    }),
    master: Object.freeze({ html: '<main>{{SLIDE_CONTENT}}</main>', css: '' }),
    slides: SLIDES,
    assets: Object.freeze({}),
    resourcePolicy: Object.freeze({
      assetOrigin: 'https://assets.example',
      stylesheetOrigins: Object.freeze([]),
      fontOrigins: Object.freeze([]),
    }),
  });
}

class FakeElement {
  constructor(tagName = 'div') {
    this.tagName = tagName.toUpperCase();
    this.hidden = false;
    this.disabled = false;
    this.textContent = '';
    this.value = 0;
    this.max = 0;
    this.children = [];
    this.attributes = new Map();
    this.listeners = new Map();
    this.style = {
      values: new Map(),
      setProperty: (name, value) => this.style.values.set(name, value),
      removeProperty: name => this.style.values.delete(name),
    };
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type, listener) {
    this.listeners.set(type, (this.listeners.get(type) || []).filter(item => item !== listener));
  }

  emit(type, event = {}) {
    for (const listener of [...(this.listeners.get(type) || [])]) {
      listener({ target: this, preventDefault() {}, ...event });
    }
  }

  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  removeAttribute(name) { this.attributes.delete(name); }
  replaceChildren(...children) { this.children = children; }
  appendChild(child) { this.children.push(child); return child; }
}

class FakeWindow {
  constructor() { this.listeners = new Map(); }
  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }
  removeEventListener(type, listener) {
    this.listeners.set(type, (this.listeners.get(type) || []).filter(item => item !== listener));
  }
  emit(type, event = {}) {
    for (const listener of [...(this.listeners.get(type) || [])]) listener(event);
  }
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function makeRoot() {
  const selectors = [
    '[data-audience-loading]',
    '[data-audience-fatal]',
    '[data-audience-shell]',
    '[data-slide-frame]',
    '[data-stage]',
    '[data-fit-shell]',
    '[data-fit-surface]',
    '[data-slide-unavailable]',
    '[data-slide-count]',
    '[data-progress]',
    '[data-runtime-status]',
    '[data-live-version]',
    '[data-nav="previous"]',
    '[data-nav="next"]',
    '[data-nav="fullscreen"]',
    '[data-animation="back"]',
    '[data-animation="forward"]',
    '[data-animation="play"]',
    '[data-animation="pause"]',
    '[data-annotation-toggle]',
  ];
  const elements = new Map(selectors.map(selector => [selector, new FakeElement('div')]));
  for (const selector of selectors.filter(value => value.includes('data-nav')
    || value.includes('data-animation') || value.includes('annotation-toggle'))) {
    elements.set(selector, new FakeElement('button'));
  }
  elements.set('[data-progress]', new FakeElement('progress'));
  elements.get('[data-audience-loading]').hidden = true;
  elements.get('[data-audience-fatal]').hidden = true;
  elements.get('[data-audience-shell]').hidden = true;
  elements.get('[data-slide-unavailable]').hidden = true;
  return {
    elements,
    querySelector(selector) { return elements.get(selector) || null; },
  };
}

function makeHarness({
  hash = '#opening',
  bundle = liveBundle(),
  loadPromise = null,
  loadError = null,
  fetchImpl = async () => ({ ok: true, status: 204 }),
  fullscreenRejects = false,
  annotationFails = false,
  showSlideThrowsFor = null,
} = {}) {
  const root = makeRoot();
  const windowObject = new FakeWindow();
  const locationObject = { hash };
  const historyCalls = [];
  const setHash = url => {
    const marker = String(url).indexOf('#');
    locationObject.hash = marker < 0 ? '' : String(url).slice(marker);
  };
  const historyObject = {
    pushState(_state, _title, url) { historyCalls.push(['push', url]); setHash(url); },
    replaceState(_state, _title, url) { historyCalls.push(['replace', url]); setHash(url); },
  };
  const documentObject = {
    fullscreenElement: null,
    async exitFullscreen() { this.fullscreenElement = null; },
  };
  const annotationLayer = new FakeElement('div');
  const annotationToolbar = new FakeElement('div');
  documentObject.getElementById = id => ({
    'annotate-layer': annotationLayer,
    'annotate-bar': annotationToolbar,
  })[id] || null;
  root.elements.get('[data-audience-shell]').requestFullscreen = async () => {
    if (fullscreenRejects) throw new Error('denied');
    documentObject.fullscreenElement = root.elements.get('[data-audience-shell]');
  };

  const loaderCalls = [];
  const createLoader = options => {
    loaderCalls.push(['create', options]);
    return {
      loadOnce(slug) {
        loaderCalls.push(['load', slug]);
        if (loadError) return Promise.reject(loadError);
        return loadPromise || Promise.resolve(bundle);
      },
    };
  };
  const frameCalls = [];
  let runtimeCallback;
  const frame = {
    showSlide(slide) {
      frameCalls.push(['show', slide.anchor]);
      if (slide.anchor === showSlideThrowsFor) throw new Error('frame install failed');
    },
    send(type, payload) { frameCalls.push(['send', type, payload]); return true; },
    destroy() { frameCalls.push(['destroy']); },
  };
  const createFrame = options => {
    frameCalls.push(['create', options.bundle.webinar.liveVersion]);
    runtimeCallback = options.onRuntimeState;
    return frame;
  };
  const surfaceCalls = [];
  const createSurface = options => {
    surfaceCalls.push(['create', options]);
    return {
      setActive(value) { surfaceCalls.push(['active', value]); },
      scheduleFit() { surfaceCalls.push(['fit']); },
      destroy() { surfaceCalls.push(['destroy']); },
    };
  };
  const annotationCalls = [];
  const annotationApi = {
    initAnnotate() {
      annotationCalls.push('init');
      if (annotationFails) throw new Error('annotation unavailable');
    },
    toggle() { annotationCalls.push('toggle'); },
    clear() {
      annotationCalls.push('clear');
      if (annotationFails) throw new Error('annotation unavailable');
    },
    isOn() { return annotationCalls.at(-1) === 'toggle'; },
  };

  const init = () => initStudioAudience({
    annotationApi,
    apiBase: 'https://dashboard.example/',
    createFrame,
    createLoader,
    createSurface,
    documentObject,
    fetchImpl,
    historyObject,
    locationObject,
    root,
    slug: 'first-home-without-mystery',
    windowObject,
  });
  return {
    annotationCalls,
    annotationLayer,
    annotationToolbar,
    bundle,
    documentObject,
    frameCalls,
    get runtimeCallback() { return runtimeCallback; },
    historyCalls,
    init,
    loaderCalls,
    locationObject,
    root,
    surfaceCalls,
    windowObject,
  };
}

const element = (harness, selector) => harness.root.elements.get(selector);
const flush = () => new Promise(resolve => setTimeout(resolve, 0));

test('shows loading before the pinned bundle resolves and renders the exact initial anchor', async () => {
  const pending = deferred();
  const harness = makeHarness({ hash: '#confident-number', loadPromise: pending.promise });
  const initialized = harness.init();

  assert.equal(element(harness, '[data-audience-loading]').hidden, false);
  assert.equal(element(harness, '[data-audience-shell]').hidden, true);
  assert.equal(element(harness, '[data-audience-fatal]').hidden, true);

  pending.resolve(harness.bundle);
  const controller = await initialized;
  assert.equal(controller.currentSlide.anchor, 'confident-number');
  assert.equal(element(harness, '[data-audience-loading]').hidden, true);
  assert.equal(element(harness, '[data-audience-shell]').hidden, false);
  assert.equal(element(harness, '[data-slide-count]').textContent, '2 / 3');
  assert.equal(element(harness, '[data-progress]').max, 3);
  assert.equal(element(harness, '[data-progress]').value, 2);
  assert.equal(element(harness, '[data-live-version]').textContent, 'Live version 7');
  assert.deepEqual(harness.frameCalls.slice(0, 2), [['create', 7], ['show', 'confident-number']]);

  harness.runtimeCallback({ type: 'ready' });
  assert.deepEqual(harness.frameCalls.at(-1), ['send', 'slide-enter', undefined]);
  assert.match(element(harness, '[data-runtime-status]').textContent, /A confident number/);
});

test('clamps numeric navigation, updates history and progress, and makes edge actions no-ops', async () => {
  const harness = makeHarness({ hash: '#confident-number' });
  const controller = await harness.init();

  assert.equal(controller.goToIndex(99), true);
  assert.equal(controller.currentSlide.anchor, 'next-steps');
  assert.equal(element(harness, '[data-slide-count]').textContent, '3 / 3');
  assert.equal(element(harness, '[data-progress]').value, 3);
  assert.equal(element(harness, '[data-nav="next"]').disabled, true);
  assert.deepEqual(harness.historyCalls.at(-1), ['push', '#next-steps']);
  const before = harness.frameCalls.length;
  assert.equal(controller.next(), false);
  assert.equal(controller.goToIndex(3), false);
  assert.equal(harness.frameCalls.length, before);

  assert.equal(controller.goToIndex(-8), true);
  assert.equal(controller.currentSlide.anchor, 'opening');
  assert.equal(element(harness, '[data-nav="previous"]').disabled, true);
  const atStart = harness.frameCalls.length;
  assert.equal(controller.previous(), false);
  assert.equal(harness.frameCalls.length, atStart);
});

test('uses exact decoded anchors and follows browser history without navigation loops', async () => {
  const harness = makeHarness({ hash: '#opening' });
  const controller = await harness.init();

  assert.equal(controller.goToAnchor('confident-number'), true);
  assert.deepEqual(harness.historyCalls, [['push', '#confident-number']]);
  assert.equal(controller.goToAnchor('CONFIDENT-NUMBER'), false);

  harness.locationObject.hash = '#next-steps';
  harness.windowObject.emit('hashchange');
  assert.equal(controller.currentSlide.anchor, 'next-steps');
  assert.deepEqual(harness.historyCalls, [['push', '#confident-number']]);

  harness.locationObject.hash = '#%E0%A4%A';
  harness.windowObject.emit('hashchange');
  assert.equal(controller.currentSlide.anchor, 'opening');
  assert.deepEqual(harness.historyCalls.at(-1), ['replace', '#opening']);
});

test('maps unmodified navigation keys and suppresses editable, button, and modified events', async () => {
  const harness = makeHarness();
  const controller = await harness.init();
  let prevented = 0;
  const press = (key, target = new FakeElement('div'), extras = {}) => {
    harness.windowObject.emit('keydown', {
      key,
      target,
      preventDefault() { prevented += 1; },
      ...extras,
    });
  };

  press('ArrowRight');
  assert.equal(controller.currentSlide.anchor, 'confident-number');
  press('PageDown');
  assert.equal(controller.currentSlide.anchor, 'next-steps');
  press('Home');
  assert.equal(controller.currentSlide.anchor, 'opening');
  press('End');
  assert.equal(controller.currentSlide.anchor, 'next-steps');
  press('ArrowLeft');
  press('PageUp');
  press(' ');
  assert.equal(controller.currentSlide.anchor, 'confident-number');
  assert.equal(prevented, 7);

  const before = harness.frameCalls.length;
  for (const target of [new FakeElement('input'), new FakeElement('textarea'),
    new FakeElement('select'), new FakeElement('button')]) press('ArrowRight', target);
  const editable = new FakeElement('div');
  editable.isContentEditable = true;
  press('ArrowRight', editable);
  press('ArrowRight', new FakeElement('div'), { ctrlKey: true });
  press('ArrowRight', new FakeElement('div'), { metaKey: true });
  press('ArrowRight', new FakeElement('div'), { altKey: true });
  press('ArrowRight', new FakeElement('div'), { shiftKey: true });
  assert.equal(harness.frameCalls.length, before);
});

test('delegates only fixed animation actions after ready and reflects bounded runtime state', async () => {
  const harness = makeHarness();
  const controller = await harness.init();

  assert.equal(controller.sendAnimation('animation-forward'), false);
  harness.runtimeCallback({ type: 'ready' });
  harness.runtimeCallback({ type: 'animation-state', current: 1, total: 3, playing: false });
  assert.equal(element(harness, '[data-animation="back"]').disabled, false);
  assert.equal(element(harness, '[data-animation="forward"]').disabled, false);
  assert.equal(element(harness, '[data-animation="play"]').disabled, false);
  assert.equal(element(harness, '[data-animation="pause"]').disabled, true);
  assert.equal(controller.sendAnimation('animation-forward'), true);
  assert.equal(controller.sendAnimation('runtime-ready'), false);
  assert.deepEqual(harness.frameCalls.at(-1), ['send', 'animation-forward', undefined]);

  element(harness, '[data-animation="play"]').emit('click');
  assert.deepEqual(harness.frameCalls.at(-1), ['send', 'animation-play', undefined]);
  harness.runtimeCallback({ type: 'animation-state', current: 2, total: 3, playing: true });
  assert.equal(element(harness, '[data-animation="play"]').disabled, true);
  assert.equal(element(harness, '[data-animation="pause"]').disabled, false);
});

test('keeps navigation usable after a runtime failure and posts one redacted event', async () => {
  const requests = [];
  const harness = makeHarness({
    fetchImpl: async (...args) => {
      requests.push(args);
      throw new Error('transport unavailable with private diagnostics');
    },
  });
  const controller = await harness.init();
  harness.runtimeCallback({ type: 'error', code: 'SLIDE_RUNTIME_ERROR', source: 'do not send' });
  harness.runtimeCallback({ type: 'error', code: 'SLIDE_RUNTIME_ERROR', stack: 'do not send' });
  await flush();

  assert.equal(element(harness, '[data-slide-unavailable]').hidden, false);
  assert.equal(element(harness, '[data-slide-unavailable]').textContent, 'Slide unavailable');
  assert.equal(requests.length, 1);
  assert.equal(requests[0][0], 'https://dashboard.example/api/public/webinars/first-home-without-mystery/runtime-events');
  assert.deepEqual(JSON.parse(requests[0][1].body), {
    liveVersion: 7,
    slideId: '11111111-1111-4111-8111-111111111111',
    code: 'SLIDE_RUNTIME_ERROR',
  });
  assert.doesNotMatch(requests[0][1].body, /source|stack|diagnostic|private/i);
  assert.equal(controller.next(), true);
  assert.equal(controller.currentSlide.anchor, 'confident-number');
  assert.equal(element(harness, '[data-slide-unavailable]').hidden, true);
});

test('ignores preserved prior-frame events after a replacement throws', async () => {
  const requests = [];
  const harness = makeHarness({
    showSlideThrowsFor: 'confident-number',
    fetchImpl: async (...args) => {
      requests.push(args);
      return { ok: true, status: 204 };
    },
  });
  const controller = await harness.init();

  assert.equal(controller.next(), true);
  await flush();
  assert.equal(controller.currentSlide.anchor, 'confident-number');
  assert.equal(element(harness, '[data-slide-frame]').hidden, true);
  assert.equal(element(harness, '[data-slide-unavailable]').hidden, false);
  assert.match(element(harness, '[data-runtime-status]').textContent, /Slide 2 unavailable/);
  assert.deepEqual(JSON.parse(requests[0][1].body), {
    liveVersion: 7,
    slideId: '22222222-2222-4222-8222-222222222222',
    code: 'SLIDE_RUNTIME_ERROR',
  });

  harness.runtimeCallback({ type: 'ready' });
  harness.runtimeCallback({ type: 'error', code: 'SLIDE_STARTUP_TIMEOUT' });
  harness.runtimeCallback({ type: 'animation-state', current: 0, total: 2, playing: false });
  await flush();

  assert.equal(element(harness, '[data-slide-frame]').hidden, true);
  assert.equal(element(harness, '[data-slide-unavailable]').hidden, false);
  assert.match(element(harness, '[data-runtime-status]').textContent, /Slide 2 unavailable/);
  assert.equal(element(harness, '[data-animation="forward"]').disabled, true);
  assert.equal(harness.frameCalls.filter(call => call[0] === 'send').length, 0);
  assert.equal(requests.length, 1);
});

test('tracks browser fullscreen state and reports rejected requests without trapping controls', async () => {
  const success = makeHarness();
  await success.init();
  element(success, '[data-nav="fullscreen"]').emit('click');
  await flush();
  success.windowObject.emit('fullscreenchange');
  assert.equal(element(success, '[data-nav="fullscreen"]').getAttribute('aria-pressed'), 'true');
  assert.equal(element(success, '[data-nav="fullscreen"]').getAttribute('aria-label'), 'Exit fullscreen');

  const rejected = makeHarness({ fullscreenRejects: true });
  const controller = await rejected.init();
  element(rejected, '[data-nav="fullscreen"]').emit('click');
  await flush();
  assert.match(element(rejected, '[data-runtime-status]').textContent, /could not enter fullscreen/i);
  assert.equal(controller.next(), true);
});

test('pins one load per controller while a fresh controller can see a new live version', async () => {
  const first = makeHarness({ bundle: liveBundle(7) });
  const firstController = await first.init();
  firstController.next();
  firstController.previous();
  assert.equal(first.loaderCalls.filter(([type]) => type === 'load').length, 1);
  assert.equal(element(first, '[data-live-version]').textContent, 'Live version 7');

  const refreshed = makeHarness({ bundle: liveBundle(8) });
  await refreshed.init();
  assert.equal(refreshed.loaderCalls.filter(([type]) => type === 'load').length, 1);
  assert.equal(element(refreshed, '[data-live-version]').textContent, 'Live version 8');
});

test('shows a fixed fatal state for bundle failures without sending fabricated telemetry', async () => {
  const requests = [];
  const harness = makeHarness({
    loadError: new Error('sensitive upstream response'),
    fetchImpl: async (...args) => { requests.push(args); },
  });
  const controller = await harness.init();

  assert.equal(controller, null);
  assert.equal(element(harness, '[data-audience-loading]').hidden, true);
  assert.equal(element(harness, '[data-audience-shell]').hidden, true);
  assert.equal(element(harness, '[data-audience-fatal]').hidden, false);
  assert.equal(element(harness, '[data-audience-fatal]').textContent,
    'This presentation is unavailable. Refresh the page to try again.');
  assert.doesNotMatch(element(harness, '[data-audience-fatal]').textContent, /sensitive|upstream/i);
  assert.equal(requests.length, 0);
});

test('wires annotation outside the iframe and clears marks on every slide change', async () => {
  const harness = makeHarness();
  const controller = await harness.init();
  assert.deepEqual(harness.annotationCalls, ['init']);
  assert.deepEqual(element(harness, '[data-audience-shell]').children,
    [harness.annotationLayer, harness.annotationToolbar]);
  element(harness, '[data-annotation-toggle]').emit('click');
  assert.deepEqual(harness.annotationCalls, ['init', 'toggle']);
  assert.equal(element(harness, '[data-annotation-toggle]').getAttribute('aria-pressed'), 'true');
  controller.next();
  assert.deepEqual(harness.annotationCalls, ['init', 'toggle', 'clear']);
});

test('keeps the viewer usable when the optional annotation surface is unavailable', async () => {
  const harness = makeHarness({ annotationFails: true });
  const controller = await harness.init();
  assert.equal(element(harness, '[data-annotation-toggle]').disabled, true);
  assert.doesNotThrow(() => controller.next());
  assert.equal(controller.currentSlide.anchor, 'confident-number');
});

test('ships one public live region, semantic controls, and no restricted surfaces', async () => {
  const html = await readFile(new URL('../studio-viewer.html', import.meta.url), 'utf8');
  assert.equal((html.match(/aria-live=/g) || []).length, 1);
  assert.match(html, /<main[^>]*data-audience-shell/);
  for (const control of ['previous', 'next', 'fullscreen']) {
    assert.match(html, new RegExp(`<button[^>]*data-nav="${control}"`));
  }
  for (const control of ['back', 'forward', 'play', 'pause']) {
    assert.match(html, new RegExp(`<button[^>]*data-animation="${control}"`));
  }
  assert.match(html, /<canvas[^>]*data-annotation-surface/);
  assert.doesNotMatch(html, /presenter|speaker\s+note|owner|audit|history|code\s+editor|private/i);
});
