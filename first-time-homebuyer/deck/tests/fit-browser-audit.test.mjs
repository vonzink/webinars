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
  children = [],
}) {
  const node = {
    tagName,
    className,
    clientWidth,
    clientHeight,
    scrollWidth,
    scrollHeight,
    childNodes: [],
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
  innerWidth: globalThis.innerWidth,
  innerHeight: globalThis.innerHeight,
  getComputedStyle: globalThis.getComputedStyle,
};

globalThis.innerWidth = 200;
globalThis.innerHeight = 200;
globalThis.getComputedStyle = node => node._style;

test.after(() => {
  globalThis.innerWidth = original.innerWidth;
  globalThis.innerHeight = original.innerHeight;
  globalThis.getComputedStyle = original.getComputedStyle;
});

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
