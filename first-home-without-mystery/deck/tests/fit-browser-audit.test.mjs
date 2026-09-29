import test from 'node:test';
import assert from 'node:assert/strict';

import {
  assertComposedSurface,
  inspectComposedSurface,
} from './fit-browser-audit.js';

const box = (left, top, width, height) => ({
  left,
  top,
  right: left + width,
  bottom: top + height,
  width,
  height,
});

function element({
  tagName = 'DIV',
  className = '',
  rect,
  clientWidth = rect.width,
  clientHeight = rect.height,
  scrollWidth = clientWidth,
  scrollHeight = clientHeight,
  overflowX = 'visible',
  overflowY = 'visible',
  ariaHidden = false,
  allowClip = false,
  directTextRect = null,
  children = [],
}) {
  const textNode = directTextRect
    ? { nodeType: 3, textContent: 'Required direct text', _rect: directTextRect }
    : null;
  const node = {
    tagName,
    className,
    clientWidth,
    clientHeight,
    scrollWidth,
    scrollHeight,
    childNodes: textNode ? [textNode] : [],
    children,
    parentElement: null,
    _rect: rect,
    _style: { overflowX, overflowY, textOverflow: 'clip' },
    _ariaHidden: ariaHidden,
    _allowClip: allowClip,
    getBoundingClientRect() { return this._rect; },
    getClientRects() { return rect.width > 0 && rect.height > 0 ? [rect] : []; },
    getAttribute(name) { return name === 'aria-hidden' && this._ariaHidden ? 'true' : null; },
    matches(selector) {
      if (selector === '[data-audit-allow-clip]') return this._allowClip;
      return selector.split(',').map(part => part.trim().toUpperCase()).includes(this.tagName);
    },
    closest(selector) {
      let current = this;
      while (current) {
        if (current.matches(selector)) return current;
        current = current.parentElement;
      }
      return null;
    },
    querySelectorAll() {
      return this.children.flatMap(child => [child, ...child.querySelectorAll('*')]);
    },
  };
  for (const child of children) child.parentElement = node;
  return node;
}

function fixture({ childRect, ariaHidden = false, allowClip = false }) {
  const image = element({
    tagName: 'IMG',
    className: 'required-image',
    rect: childRect,
    clientWidth: 100,
    clientHeight: 100,
    ariaHidden,
    allowClip,
  });
  const clip = element({
    className: 'clip-frame',
    rect: box(10, 10, 50, 50),
    clientWidth: 50,
    clientHeight: 50,
    scrollWidth: 100,
    scrollHeight: 100,
    overflowX: 'hidden',
    overflowY: 'hidden',
    children: [image],
  });
  const surface = element({
    className: 'fixture-surface',
    rect: box(0, 0, 100, 100),
    children: [clip],
  });
  const shell = element({ className: 'fixture-shell', rect: box(0, 0, 100, 100) });
  return { shell, surface };
}

const original = {
  document: globalThis.document,
  innerWidth: globalThis.innerWidth,
  innerHeight: globalThis.innerHeight,
  getComputedStyle: globalThis.getComputedStyle,
};

globalThis.document = {
  createRange() {
    return {
      node: null,
      selectNodeContents(node) { this.node = node; },
      getClientRects() { return this.node?._rect ? [this.node._rect] : []; },
      detach() {},
    };
  },
};
globalThis.innerWidth = 200;
globalThis.innerHeight = 200;
globalThis.getComputedStyle = node => node._style;

test.after(() => {
  globalThis.document = original.document;
  globalThis.innerWidth = original.innerWidth;
  globalThis.innerHeight = original.innerHeight;
  globalThis.getComputedStyle = original.getComputedStyle;
});

function directTextFixture({
  ariaHidden = false,
  allowClip = false,
  directTextRect = box(10, 10, 270, 20),
  scrollWidth = 280,
  scrollHeight = 20,
} = {}) {
  const label = element({
    className: 'required-label',
    rect: box(10, 10, 50, 20),
    clientWidth: 50,
    clientHeight: 20,
    scrollWidth,
    scrollHeight,
    overflowX: 'hidden',
    overflowY: 'hidden',
    ariaHidden,
    allowClip,
    directTextRect,
  });
  const surface = element({
    className: 'fixture-surface',
    rect: box(0, 0, 200, 100),
    children: [label],
  });
  const shell = element({ className: 'fixture-shell', rect: box(0, 0, 200, 100) });
  return { shell, surface };
}

test('nested required content clipped by overflow hidden fails the composed-surface audit', () => {
  const result = inspectComposedSurface(fixture({ childRect: box(10, 10, 100, 100) }));

  assert.equal(result.clippedContent?.length, 1);
  assert.match(result.clippedContent[0], /required-image.*clip-frame/);
  assert.throws(
    () => assertComposedSurface(result, 'clipped fixture'),
    /clipped required content/,
  );
});

test('a transformed child whose visual rectangle fits is not a clip failure', () => {
  const result = inspectComposedSurface(fixture({ childRect: box(10, 10, 50, 50) }));

  assert.deepEqual(result.clippedContent ?? [], []);
  assert.doesNotThrow(() => assertComposedSurface(result, 'transformed fixture'));
});

test('aria-hidden and explicitly allowlisted decoration is excluded from required-content clipping', () => {
  const hidden = inspectComposedSurface(fixture({
    childRect: box(10, 10, 100, 100),
    ariaHidden: true,
  }));
  const allowlisted = inspectComposedSurface(fixture({
    childRect: box(10, 10, 100, 100),
    allowClip: true,
  }));

  assert.deepEqual(hidden.clippedContent ?? [], []);
  assert.deepEqual(allowlisted.clippedContent ?? [], []);
});

test('direct text clipped by its own overflow-hidden element fails unless explicitly excluded', () => {
  const clipped = inspectComposedSurface(directTextFixture());
  const hidden = inspectComposedSurface(directTextFixture({ ariaHidden: true }));
  const allowlisted = inspectComposedSurface(directTextFixture({ allowClip: true }));

  assert.equal(clipped.clippedContent?.length, 1);
  assert.match(clipped.clippedContent[0], /required-label.*required-label/);
  assert.throws(
    () => assertComposedSurface(clipped, 'self-clipped text fixture'),
    /clipped required content/,
  );
  assert.deepEqual(hidden.clippedContent ?? [], []);
  assert.deepEqual(allowlisted.clippedContent ?? [], []);
});

test('fractional text ink outside its own box is accepted when layout content does not overflow', () => {
  const result = inspectComposedSurface(directTextFixture({
    directTextRect: box(10, 8, 50, 24),
    scrollWidth: 50,
    scrollHeight: 22,
  }));

  assert.deepEqual(result.clippedContent ?? [], []);
  assert.doesNotThrow(() => assertComposedSurface(result, 'fractional text ink'));
});
