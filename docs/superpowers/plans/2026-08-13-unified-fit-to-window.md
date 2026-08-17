# Unified Fit-to-Window Rendering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the base slide, calculator, educational popouts, and presenter graphics render as complete fixed compositions that uniformly scale to fit every viewport without internal scrollbars, cropping, or accidental responsive reflow.

**Architecture:** Keep pure contain, clamp, and aspect-preserving resize math in `overlay-geometry.js`; add one DOM lifecycle controller in `surface-fit.js`; and make the slide, calculator, and modal systems supply only their intrinsic design dimensions and interaction hooks. The controller owns centering, transformed shell bounds, a preferred manual scale, ResizeObserver scheduling, and viewport clamping. The presenter dashboard remains a normal scrollable application workspace.

**Tech Stack:** Static HTML, CSS, browser ES modules, ResizeObserver, Pointer Events, Node's built-in test runner, Playwright CLI, Python static server.

## Global Constraints

- The contain rule is `min(availableWidth / designWidth, availableHeight / designHeight, 1)`.
- Never upscale a composed surface above its intended authored size.
- No upscaling is allowed: every geometry path caps uniform scale at 1.
- Fonts, buttons, inputs, spacing, borders, images, close controls, and resize controls scale together.
- Covered surfaces must not use `overflow: auto` or `overflow: scroll` as a size fallback.
- Covered surfaces must not crop required content or create horizontal or vertical internal scrollbars.
- The base slide remains 1920 by 1080 at every viewport, including below 900px.
- Calculator design states are 560 by 820 collapsed and 560 by 982 expanded. These dimensions include room for all five result rows, including a non-zero HOA row.
- Educational popouts are measured only at a fixed authored width: 1200px standard and 1500px for any table popout. Viewport width must never participate in text layout.
- Every presenter-opened educational popout and graphic uses the same compact 52px top title strip with a 20px title and close control. The former eyebrow, oversized heading, accent underline, and inset media mat are removed. Presenter graphics retain every source pixel at the decoded native image ratio; the compact strip scales with the image composition.
- Complete visibility takes priority over minimum rendered text size on very small screens.
- Preserve calculator formulas, values, content, slide order, presenter controls, annotations, BroadcastChannel payloads, navigation, focus behavior, and fullscreen behavior.
- Preserve these file hashes unless a task explicitly names the file:

```text
5e2551038a8c075103a5dc33f6084b9bf2380f0fd56f26a3f8e2d394e0b1b1ab  first-time-homebuyer/deck/js/calculator-math.js
0a2296b2380564f84b2f7fdbf722550f7a03a0739a04d2878723dd9eddd9e8ab  first-time-homebuyer/deck/content/slides.js
8aa72a8ead27ed94fe60eef0ae41e59241bbc0dd5b7ba2972865bf425e745ce8  first-time-homebuyer/deck/content/modals.js
ecb3871668addda146aa4078c66b1c2d6f78b02639936efa683bedf602e104f2  first-time-homebuyer/deck/content/presenter-media.js
b37970d546648801beee3a0ea1d9fd422a3929fff237ec1e3f7b3c48cc917bd4  first-time-homebuyer/deck/js/presenter.js
```

- Work in the existing dirty checkout without staging `.DS_Store`, `.playwright-cli`, `.superpowers`, output screenshots, portrait files, the nested Amplify export, or `va-loans-webinar-prompt.md`.
- Deployment is out of scope. Packaging and Amplify upload require a separate user approval after implementation and browser verification.

---

## File Structure

- Create `first-time-homebuyer/deck/js/surface-fit.js`: DOM lifecycle controller for any fixed design surface.
- Modify `first-time-homebuyer/deck/js/overlay-geometry.js`: pure geometry, including a preferred maximum scale.
- Modify `first-time-homebuyer/deck/js/deck.js`: base-slide consumer of the shared surface controller.
- Modify `first-time-homebuyer/deck/index.html`: add a screen-space slide shell around the 1920 by 1080 design surface.
- Modify `first-time-homebuyer/deck/js/calculator.js`: calculator consumer with two authored design states.
- Modify `first-time-homebuyer/deck/js/modal.js`: educational and media consumers with fixed-width measurement and decoded-image sizing.
- Modify `first-time-homebuyer/deck/css/base.css`: permanent fixed slide composition; remove mobile page flow.
- Modify `first-time-homebuyer/deck/css/components.css`: fixed educational/media surfaces; remove responsive modal and slide reflow.
- Modify `first-time-homebuyer/deck/css/slides.css`: remove under-900px slide-internal reflow.
- Modify `first-time-homebuyer/deck/css/calculator.css`: fixed calculator composition with no internal scrolling.
- Create `first-time-homebuyer/deck/tests/surface-fit-contract.test.mjs`: shared controller source contract.
- Create `first-time-homebuyer/deck/tests/slide-fit-contract.test.mjs`: base-slide no-reflow contract.
- Create `first-time-homebuyer/deck/tests/modal-fit-contract.test.mjs`: educational and media fit contract.
- Create `first-time-homebuyer/deck/tests/fit-browser-audit.js`: browser-side geometry and scroll-container assertions.
- Modify existing geometry, calculator, and media tests to reject the former behavior.
- Create `docs/superpowers/validation/2026-08-13-unified-fit-to-window.md`: final static and browser evidence.

---

### Task 1: Shared Geometry and DOM Surface Controller

**Files:**
- Modify: `first-time-homebuyer/deck/js/overlay-geometry.js:1-53`
- Create: `first-time-homebuyer/deck/js/surface-fit.js`
- Modify: `first-time-homebuyer/deck/tests/overlay-geometry.test.mjs:1-114`
- Create: `first-time-homebuyer/deck/tests/surface-fit-contract.test.mjs`

**Interfaces:**
- Consumes: no application-specific content.
- Produces: `fitOverlay(options)`, `clampOverlay(options)`, and `resizeOverlay(options)` returning `{ intrinsicWidth, intrinsicHeight, scale, width, height, left, top }`.
- Produces: `createSurfaceController({ viewport, shell, surface, getDesignSize, margin })` returning `{ setActive, fit, reset, moveFrom, resizeFrom, scheduleFit, getGeometry, destroy }`.
- `getDesignSize()` returns `{ width: number, height: number }` in unscaled design pixels.
- `fitOverlay` accepts optional `maxScale`; values above 1 are clamped to 1.
- The controller retains a preferred manual scale separately from the current viewport-limited scale, so shrinking then re-expanding the browser restores the preferred scale.

- [ ] **Step 1: Extend the pure geometry tests with preferred-scale and tiny-viewport cases**

Add these tests to `overlay-geometry.test.mjs`:

```js
test('fit honors a preferred scale without ever upscaling', () => {
  const reduced = fitOverlay({
    intrinsicWidth: 1000, intrinsicHeight: 500,
    viewportWidth: 1600, viewportHeight: 1000,
    maxScale: 0.6,
  });
  near(reduced.scale, 0.6);
  near(reduced.width / reduced.height, 2);

  const capped = fitOverlay({
    intrinsicWidth: 1000, intrinsicHeight: 500,
    viewportWidth: 3000, viewportHeight: 2000,
    maxScale: 4,
  });
  near(capped.scale, 1);
});

test('fit remains finite when the viewport is smaller than both margins', () => {
  const geometry = fitOverlay({
    intrinsicWidth: 1920, intrinsicHeight: 1080,
    viewportWidth: 20, viewportHeight: 12,
  });
  assert.ok(Object.values(geometry).every(Number.isFinite));
  assert.ok(geometry.scale > 0 && geometry.scale <= 1);
  assert.ok(geometry.left >= -0.000001);
  assert.ok(geometry.top >= -0.000001);
  assert.ok(geometry.left + geometry.width <= 20.000001);
  assert.ok(geometry.top + geometry.height <= 12.000001);
});
```

- [ ] **Step 2: Run the geometry tests and verify the new preferred-scale test fails**

Run:

```bash
node --no-warnings --test first-time-homebuyer/deck/tests/overlay-geometry.test.mjs
```

Expected: FAIL because `fitOverlay` does not read `maxScale`.

- [ ] **Step 3: Add the controller contract test**

Create `surface-fit-contract.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../js/surface-fit.js', import.meta.url), 'utf8').catch(() => '');

test('shared surface controller owns fit lifecycle and transformed bounds', () => {
  assert.match(source, /export function createSurfaceController\(/);
  assert.match(source, /fitOverlay\(/);
  assert.match(source, /clampOverlay\(/);
  assert.match(source, /resizeOverlay\(/);
  assert.match(source, /new ResizeObserver\(/);
  assert.match(source, /requestAnimationFrame\(/);
  assert.match(source, /transform:\s*`scale\(\$\{next\.scale\}\)`/);
  assert.match(source, /preferredScale/);
  assert.match(source, /userPositioned/);
});

test('controller exposes the complete application interface', () => {
  for (const name of ['setActive', 'fit', 'reset', 'moveFrom', 'resizeFrom', 'scheduleFit', 'getGeometry', 'destroy']) {
    assert.match(source, new RegExp(`\\b${name}\\b`));
  }
  assert.doesNotMatch(source, /overflow|scrollHeight|scrollWidth/);
});
```

- [ ] **Step 4: Run the controller contract test and verify it fails**

Run:

```bash
node --no-warnings --test first-time-homebuyer/deck/tests/surface-fit-contract.test.mjs
```

Expected: FAIL because `surface-fit.js` does not exist.

- [ ] **Step 5: Add optional `maxScale` to the pure contain calculation**

In `overlay-geometry.js`, resolve the requested cap before calculating scale:

```js
const scaleLimit = value => Math.min(1, positive(value, 1));
const available = (extent, margin) => Math.max(Number.EPSILON, extent - 2 * margin);

export function fitOverlay(options) {
  const d = size(options);
  const scale = Math.min(
    scaleLimit(options.maxScale),
    available(d.viewportWidth, d.margin) / d.intrinsicWidth,
    available(d.viewportHeight, d.margin) / d.intrinsicHeight,
  );
  const width = d.intrinsicWidth * scale;
  const height = d.intrinsicHeight * scale;
  return result(
    d,
    scale,
    Math.max(d.margin, (d.viewportWidth - width) / 2),
    Math.max(d.margin, (d.viewportHeight - height) / 2),
  );
}
```

Update `size(options)` before using this calculation: resolve viewport width and
height first, then reduce the effective margin to the greatest value that still
leaves a positive pixel of drawable area on both axes:

```js
const requestedMargin = Math.max(0, Number.isFinite(o.margin) ? o.margin : OVERLAY_MARGIN);
const viewportWidth = positive(o.viewportWidth, intrinsicWidth + 2 * requestedMargin);
const viewportHeight = positive(o.viewportHeight, intrinsicHeight + 2 * requestedMargin);
const margin = Math.min(
  requestedMargin,
  Math.max(0, (viewportWidth - 1) / 2),
  Math.max(0, (viewportHeight - 1) / 2),
);
```

Use the same `available()` helper in `clampOverlay` and use
`Math.max(Number.EPSILON, viewportExtent - margin - fixedPosition)` for the
manual-resize maximum. This guarantees that `between()` always receives an
ordered interval and that even a viewport smaller than two nominal margins
contains the whole rendered rectangle. Do not change the public result shape or
the manual resize minimum behavior when the nominal minimum fits.

- [ ] **Step 6: Implement the DOM controller**

Create `surface-fit.js` with this lifecycle and no application-specific selectors:

```js
import {
  OVERLAY_MARGIN,
  fitOverlay,
  clampOverlay,
  resizeOverlay,
} from './overlay-geometry.js';

const finiteSize = (value, fallback) => Number.isFinite(value) && value > 0 ? value : fallback;

export function createSurfaceController({
  viewport,
  shell,
  surface,
  getDesignSize,
  margin = OVERLAY_MARGIN,
}) {
  let active = false;
  let geometry = null;
  let preferredScale = 1;
  let userPositioned = false;
  let frame = 0;

  const viewportSize = () => ({
    viewportWidth: finiteSize(viewport.clientWidth, document.documentElement.clientWidth),
    viewportHeight: finiteSize(viewport.clientHeight, document.documentElement.clientHeight),
  });

  const dimensions = () => {
    const { width, height } = getDesignSize();
    return {
      intrinsicWidth: width,
      intrinsicHeight: height,
      fallbackWidth: width,
      fallbackHeight: height,
      margin,
      ...viewportSize(),
    };
  };

  const apply = next => {
    geometry = next;
    Object.assign(shell.style, {
      width: `${next.width}px`,
      height: `${next.height}px`,
      left: `${next.left}px`,
      top: `${next.top}px`,
    });
    Object.assign(surface.style, {
      width: `${next.intrinsicWidth}px`,
      height: `${next.intrinsicHeight}px`,
      transform: `scale(${next.scale})`,
    });
    return next;
  };

  const fit = () => {
    if (!active) return geometry;
    const options = dimensions();
    if (!geometry || !userPositioned) {
      return apply(fitOverlay({ ...options, maxScale: preferredScale }));
    }
    return apply(clampOverlay({
      ...options,
      scale: preferredScale,
      left: geometry.left,
      top: geometry.top,
    }));
  };

  const scheduleFit = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (active) fit();
    });
  };

  const reset = () => {
    preferredScale = 1;
    userPositioned = false;
    geometry = null;
  };

  const moveFrom = (start, deltaX, deltaY) => {
    if (!active || !start) return geometry;
    userPositioned = true;
    return apply(clampOverlay({
      ...dimensions(),
      scale: preferredScale,
      left: start.left + deltaX,
      top: start.top + deltaY,
    }));
  };

  const resizeFrom = (start, deltaX, deltaY) => {
    if (!active || !start) return geometry;
    const next = resizeOverlay({
      ...dimensions(),
      startScale: start.scale,
      left: start.left,
      top: start.top,
      deltaX,
      deltaY,
    });
    preferredScale = next.scale;
    userPositioned = true;
    return apply(next);
  };

  const observer = new ResizeObserver(scheduleFit);
  observer.observe(viewport);
  window.addEventListener('resize', scheduleFit);

  return {
    setActive(next) { active = Boolean(next); if (active) scheduleFit(); },
    fit,
    reset,
    moveFrom,
    resizeFrom,
    scheduleFit,
    getGeometry: () => geometry,
    destroy() {
      active = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', scheduleFit);
    },
  };
}
```

If implementation needs a small adjustment to avoid an observer loop, keep the interface and invariants exactly as specified; coalesce all writes into one animation frame.

- [ ] **Step 7: Run shared tests and syntax checks**

Run:

```bash
node --no-warnings --test \
  first-time-homebuyer/deck/tests/overlay-geometry.test.mjs \
  first-time-homebuyer/deck/tests/surface-fit-contract.test.mjs
node --check first-time-homebuyer/deck/js/overlay-geometry.js
node --check first-time-homebuyer/deck/js/surface-fit.js
git diff --check -- \
  first-time-homebuyer/deck/js/overlay-geometry.js \
  first-time-homebuyer/deck/js/surface-fit.js \
  first-time-homebuyer/deck/tests/overlay-geometry.test.mjs \
  first-time-homebuyer/deck/tests/surface-fit-contract.test.mjs
```

Expected: all tests and checks pass.

- [ ] **Step 8: Commit the shared fit engine**

```bash
git add -- \
  first-time-homebuyer/deck/js/overlay-geometry.js \
  first-time-homebuyer/deck/js/surface-fit.js \
  first-time-homebuyer/deck/tests/overlay-geometry.test.mjs \
  first-time-homebuyer/deck/tests/surface-fit-contract.test.mjs
git commit -m "feat: add shared fit-to-window controller"
```

---

### Task 2: Base Slide Always Fits as a 1920 by 1080 Composition

**Files:**
- Modify: `first-time-homebuyer/deck/index.html:18-22`
- Modify: `first-time-homebuyer/deck/js/deck.js:7-21,278-282,359-416`
- Modify: `first-time-homebuyer/deck/css/base.css:29-55,323-344`
- Modify: `first-time-homebuyer/deck/css/components.css:282-301`
- Modify: `first-time-homebuyer/deck/css/slides.css:105-end`
- Create: `first-time-homebuyer/deck/tests/slide-fit-contract.test.mjs`

**Interfaces:**
- Consumes: `createSurfaceController` from Task 1.
- Produces: `.slide-fit-shell[data-fit-shell]` containing `.slide-scaler[data-fit-surface]`.
- Produces: one controller with `getDesignSize: () => ({ width: 1920, height: 1080 })` and margin `0`.
- Preserves: slide rendering, 16-slide count, preview hash behavior, navigation, fullscreen, presenter channel, and annotations.

- [ ] **Step 1: Write the failing no-reflow contract**

Create `slide-fit-contract.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('base slide uses the shared 1920 by 1080 fit surface at every viewport', async () => {
  const [html, source, css] = await Promise.all([
    read('index.html'), read('js/deck.js'), read('css/base.css'),
  ]);
  assert.match(html, /class="slide-fit-shell"[^>]*data-fit-shell/);
  assert.match(html, /class="slide-scaler"[^>]*data-fit-surface/);
  assert.match(source, /from '\.\/surface-fit\.js'/);
  assert.match(source, /width:\s*1920,\s*height:\s*1080/);
  assert.match(source, /createSurfaceController\(/);
  assert.doesNotMatch(source, /matchMedia\('\(max-width:\s*900px\)'\)/);
  assert.match(css, /\.slide-fit-shell\s*\{/);
  assert.match(css, /\.slide-scaler\s*\{[^}]*transform-origin:\s*top left/s);
});

test('slide CSS contains no viewport-driven mobile composition', async () => {
  const files = await Promise.all([
    read('css/base.css'), read('css/components.css'), read('css/slides.css'),
  ]);
  for (const css of files) {
    assert.doesNotMatch(css, /@media\s*\(max-width:\s*900px\)/);
  }
  assert.doesNotMatch(files.join('\n'), /\.stage\s*\{[^}]*position:\s*static/s);
  assert.doesNotMatch(files.join('\n'), /\.slide-scaler\s*\{[^}]*transform:\s*none\s*!important/s);
});
```

- [ ] **Step 2: Run the contract and verify it fails**

Run:

```bash
node --no-warnings --test first-time-homebuyer/deck/tests/slide-fit-contract.test.mjs
```

Expected: FAIL because the slide has no screen-space shell and still disables scaling under 900px.

- [ ] **Step 3: Add the slide shell and shared controller**

Change the stage markup in `index.html` to:

```html
<main class="stage" aria-label="Presentation slides">
  <div class="slide-fit-shell" data-fit-shell>
    <div class="slide-scaler" data-fit-surface></div>
  </div>
</main>
```

In `deck.js`, import the controller and replace the old `fit()` function:

```js
import { createSurfaceController } from './surface-fit.js';

let current = 0, scaler, stage, slideFit, channel;

function fit() {
  slideFit.fit();
}
```

After resolving `stage` and `scaler` in `initDeck()`, create and activate it:

```js
const slideShell = document.querySelector('.slide-fit-shell');
slideFit = createSurfaceController({
  viewport: stage,
  shell: slideShell,
  surface: scaler,
  getDesignSize: () => ({ width: 1920, height: 1080 }),
  margin: 0,
});
slideFit.setActive(true);
```

Remove the standalone `window.addEventListener('resize', fit)` because the shared controller owns both ResizeObserver and window fallback. Keep the initial `fit()` call after slides are appended.

- [ ] **Step 4: Make the stage and slide a permanent fixed composition**

Replace the stage/scaler positioning in `base.css` with:

```css
.stage { position: fixed; inset: 0; background: #000; overflow: hidden; }
.slide-fit-shell { position: absolute; overflow: visible; }
.slide-scaler {
  position: absolute;
  inset: 0 auto auto 0;
  width: var(--slide-w);
  height: var(--slide-h);
  transform-origin: top left;
}
```

Delete the complete `@media (max-width: 900px)` block from `base.css`.

Delete the complete `@media (max-width: 900px)` block from `slides.css` so slide-specific grids never stack because the browser is narrow.

Delete the complete `@media (max-width: 900px)` block from `components.css`. It currently changes card grids, compare panels, typography, modal dimensions, and buttons; all those elements belong to fixed slide or fixed modal compositions. Do not touch the presenter dashboard's `@media (max-width: 860px)` rule in `presenter.html`.

- [ ] **Step 5: Run the slide contract, full static suite, and protected hashes**

Run:

```bash
node --no-warnings --test first-time-homebuyer/deck/tests/*.test.mjs
for file in first-time-homebuyer/deck/content/*.js first-time-homebuyer/deck/js/*.js; do node --check "$file"; done
test "$(shasum -a 256 first-time-homebuyer/deck/content/slides.js | awk '{print $1}')" = "0a2296b2380564f84b2f7fdbf722550f7a03a0739a04d2878723dd9eddd9e8ab"
git diff --check -- \
  first-time-homebuyer/deck/index.html \
  first-time-homebuyer/deck/js/deck.js \
  first-time-homebuyer/deck/css/base.css \
  first-time-homebuyer/deck/css/components.css \
  first-time-homebuyer/deck/css/slides.css \
  first-time-homebuyer/deck/tests/slide-fit-contract.test.mjs
```

Expected: all tests, syntax checks, hash check, and diff check pass.

- [ ] **Step 6: Commit the fixed base-slide composition**

```bash
git add -- \
  first-time-homebuyer/deck/index.html \
  first-time-homebuyer/deck/js/deck.js \
  first-time-homebuyer/deck/css/base.css \
  first-time-homebuyer/deck/css/components.css \
  first-time-homebuyer/deck/css/slides.css \
  first-time-homebuyer/deck/tests/slide-fit-contract.test.mjs
git commit -m "feat: fit the complete slide at every viewport"
```

---

### Task 3: Calculator Uses Two Fixed Design Surfaces

**Files:**
- Modify: `first-time-homebuyer/deck/js/calculator.js:1-309`
- Modify: `first-time-homebuyer/deck/css/calculator.css:1-92`
- Modify: `first-time-homebuyer/deck/tests/calculator-contract.test.mjs:14-58`

**Interfaces:**
- Consumes: `createSurfaceController` from Task 1.
- Produces: calculator design size `{ width: 560, height: 820 }` when collapsed and `{ width: 560, height: 982 }` when expanded.
- Produces: `.calculator-panel[data-fit-shell]` containing `.calculator-canvas[data-fit-surface]`.
- Preserves: `initCalculator`, `setCalculatorVisible`, `isCalculatorVisible`, calculator math, inputs, terms, focus trap/return, and visibility callback.

- [ ] **Step 1: Replace the measurement-based test with a fixed-state fit contract**

Update the proportional-geometry test in `calculator-contract.test.mjs` to assert:

```js
test('calculator scales two complete fixed design states without internal scrolling', async () => {
  const [source, css] = await Promise.all([read('js/calculator.js'), read('css/calculator.css')]);

  assert.match(source, /from '\.\/surface-fit\.js'/);
  assert.match(source, /CALCULATOR_WIDTH\s*=\s*560/);
  assert.match(source, /CALCULATOR_COLLAPSED_HEIGHT\s*=\s*820/);
  assert.match(source, /CALCULATOR_EXPANDED_HEIGHT\s*=\s*982/);
  assert.match(source, /createSurfaceController\(/);
  assert.doesNotMatch(source, /canvas\.scrollHeight|measureHeight/);
  assert.match(source, /data-fit-shell/);
  assert.match(source, /data-fit-surface/);
  assert.match(css, /\.calculator-canvas\s*\{[^}]*transform-origin:\s*top left/s);
  assert.match(css, /\.calculator-grid\s*\{[^}]*grid-template-columns:\s*1fr 1fr/s);
  assert.match(css, /\.calculator-scroll\s*\{[^}]*overflow:\s*visible/s);
  assert.doesNotMatch(css, /overflow(?:-x|-y)?:\s*(?:auto|scroll)/);
  assert.doesNotMatch(css, /@media\s*\(max-width/);
});

test('calculator controls are inside the uniformly scaled surface', async () => {
  const source = await read('js/calculator.js');
  const canvasMarkup = source.match(/<div class="calculator-canvas"[\s\S]*?<\/div>\s*<\/section>/)?.[0] || '';
  assert.match(canvasMarkup, /calculator-close/);
  assert.match(canvasMarkup, /calculator-resize-handle/);
});
```

Keep the existing content, presenter synchronization, and close-race tests.

- [ ] **Step 2: Run the calculator contract and verify it fails**

Run:

```bash
node --no-warnings --test first-time-homebuyer/deck/tests/calculator-contract.test.mjs
```

Expected: FAIL because the calculator still derives its height from `scrollHeight` and keeps controls outside the design surface.

- [ ] **Step 3: Replace calculated height with the two authored states**

At the top of `calculator.js`, replace the intrinsic width constant and direct geometry imports with:

```js
import { createSurfaceController } from './surface-fit.js';

const CALCULATOR_WIDTH = 560;
const CALCULATOR_COLLAPSED_HEIGHT = 820;
const CALCULATOR_EXPANDED_HEIGHT = 982;
```

Add `let fitController;` and define:

```js
function calculatorDesignSize() {
  return {
    width: CALCULATOR_WIDTH,
    height: state.showMore ? CALCULATOR_EXPANDED_HEIGHT : CALCULATOR_COLLAPSED_HEIGHT,
  };
}
```

Move the close and resize buttons inside `.calculator-canvas`, after the footer, so they receive the same transform as every field and label. Add `data-fit-shell` to `.calculator-panel` and `data-fit-surface` to `.calculator-canvas`. Keep the dialog role and accessible name on `.calculator-canvas`.

After resolving calculator elements in `initCalculator`, create:

```js
fitController = createSurfaceController({
  viewport: root,
  shell: panel,
  surface: canvas,
  getDesignSize: calculatorDesignSize,
});
```

Delete `applyGeometry`, `measureHeight`, `fitCalculator`, `clampCalculator`, and the calculator's direct window resize listener.

- [ ] **Step 4: Route calculator open, toggle, drag, and resize through the controller**

On open:

```js
root.hidden = false;
render();
fitController.reset();
fitController.setActive(true);
fitController.fit();
closeButton.focus({ preventScroll: true });
```

On close, call `fitController.setActive(false)` before hiding the root.

After the advanced toggle changes `state.showMore` and `[hidden]`, schedule a fit guarded by current visibility:

```js
requestAnimationFrame(() => {
  if (visible) fitController.fit();
});
```

At pointer start, capture `fitController.getGeometry()`. On pointer move call:

```js
if (mode === 'drag') fitController.moveFrom(start.geometry, dx, dy);
else fitController.resizeFrom(start.geometry, dx, dy);
```

Do not calculate independent screen width and height anywhere in `calculator.js`.

- [ ] **Step 5: Lock the calculator CSS to the design surface**

Keep `.calculator-overlay` fixed and full-screen. Ensure:

```css
.calculator-panel { position: fixed; overflow: visible; background: transparent; }
.calculator-canvas {
  position: relative;
  width: 560px;
  height: 820px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform-origin: top left;
}
.calculator-scroll { flex: none; min-height: 0; overflow: visible; padding: 0 16px 16px; }
```

Retain the existing two-column grid at all widths. Remove any viewport-width responsive block if one is introduced during implementation. Position `.calculator-close` and `.calculator-resize-handle` relative to `.calculator-canvas`.

- [ ] **Step 6: Run calculator tests, full suite, syntax, and math hash**

Run:

```bash
node --no-warnings --test \
  first-time-homebuyer/deck/tests/calculator-math.test.mjs \
  first-time-homebuyer/deck/tests/calculator-contract.test.mjs \
  first-time-homebuyer/deck/tests/overlay-geometry.test.mjs \
  first-time-homebuyer/deck/tests/surface-fit-contract.test.mjs
node --no-warnings --test first-time-homebuyer/deck/tests/*.test.mjs
node --check first-time-homebuyer/deck/js/calculator.js
test "$(shasum -a 256 first-time-homebuyer/deck/js/calculator-math.js | awk '{print $1}')" = "5e2551038a8c075103a5dc33f6084b9bf2380f0fd56f26a3f8e2d394e0b1b1ab"
git diff --check -- \
  first-time-homebuyer/deck/js/calculator.js \
  first-time-homebuyer/deck/css/calculator.css \
  first-time-homebuyer/deck/tests/calculator-contract.test.mjs
```

Expected: all tests and checks pass.

- [ ] **Step 7: Commit the fixed calculator composition**

```bash
git add -- \
  first-time-homebuyer/deck/js/calculator.js \
  first-time-homebuyer/deck/css/calculator.css \
  first-time-homebuyer/deck/tests/calculator-contract.test.mjs
git commit -m "feat: scale the complete calculator surface"
```

---

### Task 4: Educational Popouts Measure at Authored Width and Scale as One Surface

**Files:**
- Modify: `first-time-homebuyer/deck/js/modal.js:1-199`
- Modify: `first-time-homebuyer/deck/css/components.css:93-199`
- Create: `first-time-homebuyer/deck/tests/modal-fit-contract.test.mjs`

**Interfaces:**
- Consumes: `createSurfaceController` from Task 1.
- Produces: `.modal-shell[data-fit-shell]` containing `.modal[data-fit-surface]`.
- Produces: `openModal(id, opener)` that resolves after fixed-width measurement and first fit.
- Uses authored widths 1200px standard and 1500px when `d.table` exists.
- Produces: design height measured only after the surface is laid out at the authored width with no viewport constraint.
- Produces: one 52px compact top title strip with a 20px title and close control for every educational popout; no eyebrow, display-size title block, or accent underline.
- Preserves: modal ID lookup, content markup, Escape, backdrop close, focus trap/return, compliance footers, drag, and resize.

- [ ] **Step 1: Write the failing educational-popout contract**

Create `modal-fit-contract.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('educational popouts measure at authored width and use the shared controller', async () => {
  const [source, css] = await Promise.all([read('js/modal.js'), read('css/components.css')]);
  assert.match(source, /from '\.\/surface-fit\.js'/);
  assert.match(source, /CONTENT_WIDTH\s*=\s*1200/);
  assert.match(source, /WIDE_CONTENT_WIDTH\s*=\s*1500/);
  assert.match(source, /document\.fonts\.ready/);
  assert.match(source, /surface\.scrollHeight/);
  assert.match(source, /createSurfaceController\(/);
  assert.match(source, /data-fit-shell/);
  assert.match(source, /data-fit-surface/);
  assert.match(css, /\.modal\s*\{[^}]*transform-origin:\s*top left/s);
  assert.match(css, /\.modal-head\s*\{[^}]*height:\s*52px/s);
  assert.match(css, /\.modal-title\s*\{[^}]*font-size:\s*20px/s);
  assert.doesNotMatch(source, /modal-eyebrow|modal-title-bar/);
  assert.doesNotMatch(css, /\.modal-body\s*\{[^}]*overflow-y:\s*(?:auto|scroll)/s);
  assert.doesNotMatch(css, /\.modal-table-wrap\s*\{[^}]*overflow-x:\s*(?:auto|scroll)/s);
  assert.doesNotMatch(css, /max-height:\s*\d+vh|height:\s*min\([^;]*vh/);
});

test('modal controls are part of the scaled design surface', async () => {
  const source = await read('js/modal.js');
  const surfaceMarkup = source.match(/<div class="modal"[\s\S]*?<\/div>\s*<\/div>/)?.[0] || '';
  assert.match(surfaceMarkup, /modal-close/);
  assert.match(surfaceMarkup, /modal-resize/);
  assert.match(source, /aria-label="Resize popout"/);
  assert.doesNotMatch(source, /Math\.max\(520|Math\.max\(300/);
});
```

- [ ] **Step 2: Run the modal contract and verify it fails**

Run:

```bash
node --no-warnings --test first-time-homebuyer/deck/tests/modal-fit-contract.test.mjs
```

Expected: FAIL because the current modal is viewport-sized, scrollable, and independently width/height resizable.

- [ ] **Step 3: Add separate screen-space shell and design-surface markup**

Change `initModal()` markup to this hierarchy:

```html
<div class="modal-backdrop" data-close></div>
<div class="modal-shell" data-fit-shell>
  <div class="modal" data-fit-surface role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <button class="modal-close" data-close aria-label="Close">✕</button>
    <div class="modal-head" data-drag></div>
    <div class="modal-body"></div>
    <div class="modal-foot" hidden></div>
    <button type="button" class="modal-resize" aria-label="Resize popout"></button>
  </div>
</div>
```

Track `shell`, `surface`, `currentDesignSize`, `fitController`, and an integer `openToken`. The controller is created once in `initModal`:

```js
fitController = createSurfaceController({
  viewport: root,
  shell,
  surface,
  getDesignSize: () => currentDesignSize,
});
```

- [ ] **Step 4: Implement fixed-width measurement and stale-open protection**

Add:

```js
const CONTENT_WIDTH = 1200;
const WIDE_CONTENT_WIDTH = 1500;

const twoFrames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

async function fitEducational(d, token) {
  const width = d.table ? WIDE_CONTENT_WIDTH : CONTENT_WIDTH;
  root.classList.add('is-measuring');
  Object.assign(surface.style, { width: `${width}px`, height: 'auto', transform: 'none' });
  await document.fonts.ready;
  await twoFrames();
  if (!isOpen || token !== openToken || activeKind !== 'content') return false;

  currentDesignSize = { width, height: Math.ceil(surface.scrollHeight) };
  fitController.reset();
  fitController.setActive(true);
  fitController.fit();
  root.classList.remove('is-measuring');
  root.classList.add('is-visible');
  closeBtn.focus({ preventScroll: true });
  return true;
}
```

`openModal` must render content, set `isOpen = true`, set `activeKind = 'content'`, add `is-open is-measuring`, increment `openToken`, and return `fitEducational(d, token)`. Do not read `bodyEl.scrollTop`.

Render only the registered title in the shared header:

```js
headEl.innerHTML = `<h2 class="modal-title" id="modal-title">${d.title}</h2>`;
```

Do not render the modal eyebrow or decorative title bar. The compact strip is
the only overlay heading for every educational popout.

On close, increment `openToken`, call `fitController.setActive(false)`, and clear only fit-related inline geometry after the existing focus return completes.

- [ ] **Step 5: Keep the existing graphics operational through the shared shell**

Task 4 must not leave `openMedia` using deleted `pos`, `applyPos`, or independent
shell width/height. Before the native-image refinement in Task 5, adapt the
existing media path to the same controller with a temporary fixed design size:

```js
const LEGACY_MEDIA_SIZE = Object.freeze({ width: 1600, height: 900 });

currentDesignSize = LEGACY_MEDIA_SIZE;
fitController.reset();
fitController.setActive(true);
fitController.fit();
root.classList.remove('is-measuring');
root.classList.add('is-visible');
closeBtn.focus({ preventScroll: true });
```

The existing `object-fit: contain` image frame remains intact in this task. Task
5 replaces this temporary 1600 by 900 design surface with decoded native image
geometry and the 52px compact toolbar. Add a contract assertion in
`modal-fit-contract.test.mjs` for `LEGACY_MEDIA_SIZE` so Task 4 cannot silently
break the current nine graphics.

- [ ] **Step 6: Route drag and resize through uniform geometry**

At pointer start, capture `fitController.getGeometry()`. Header pointer move uses `moveFrom(start, dx, dy)`. Resize button pointer move uses `resizeFrom(start, dx, dy)`. Remove every direct assignment to modal width and height and remove `pos`/`applyPos`.

Keep the current rule that a drag cannot start from an interactive descendant.

- [ ] **Step 7: Replace viewport sizing and scroll CSS with a fixed design surface**

Use:

```css
.modal-root { position: fixed; inset: 0; z-index: 100; display: none; overflow: hidden; }
.modal-root.is-open { display: block; }
.modal-root.is-measuring .modal-shell { visibility: hidden; }
.modal-shell { position: fixed; overflow: visible; opacity: 0; transition: opacity var(--dur-fast) var(--ease-out); }
.modal-root.is-visible .modal-shell { opacity: 1; }
.modal {
  position: relative;
  width: 1200px;
  height: auto;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--white);
  transform-origin: top left;
}
.modal-head {
  height: 52px;
  flex: none;
  display: flex;
  align-items: center;
  padding: 8px 64px 8px 18px;
  background: var(--forest);
}
.modal-title {
  min-width: 0;
  overflow: hidden;
  color: var(--white);
  font-size: 20px;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.modal-close { top: 8px; right: 10px; width: 36px; height: 36px; }
.modal-body { flex: none; overflow: visible; padding: 44px 56px; }
.modal-table-wrap { overflow: visible; margin-bottom: 8px; }
```

Remove `max-height`, viewport-relative width/height, the old `.modal--wide` sizing rule, and all internal scroll fallbacks. Remove the oversized eyebrow/title/underline markup and styles. Keep authored body typography and padding unchanged. The 52px strip applies to content and media surfaces alike; Task 5 refines the image area below it.

- [ ] **Step 8: Run modal tests, full suite, syntax, and protected content hash**

Run:

```bash
node --no-warnings --test \
  first-time-homebuyer/deck/tests/modal-fit-contract.test.mjs \
  first-time-homebuyer/deck/tests/overlay-geometry.test.mjs \
  first-time-homebuyer/deck/tests/surface-fit-contract.test.mjs
node --no-warnings --test first-time-homebuyer/deck/tests/*.test.mjs
node --check first-time-homebuyer/deck/js/modal.js
test "$(shasum -a 256 first-time-homebuyer/deck/content/modals.js | awk '{print $1}')" = "8aa72a8ead27ed94fe60eef0ae41e59241bbc0dd5b7ba2972865bf425e745ce8"
git diff --check -- \
  first-time-homebuyer/deck/js/modal.js \
  first-time-homebuyer/deck/css/components.css \
  first-time-homebuyer/deck/tests/modal-fit-contract.test.mjs
```

Expected: all tests and checks pass. Existing media tests may still describe the legacy media body and are updated in Task 5.

- [ ] **Step 9: Commit educational fit behavior**

```bash
git add -- \
  first-time-homebuyer/deck/js/modal.js \
  first-time-homebuyer/deck/css/components.css \
  first-time-homebuyer/deck/tests/modal-fit-contract.test.mjs
git commit -m "feat: scale educational popouts as complete surfaces"
```

---

### Task 5: Graphics Use Native Image Geometry with a Scaled Compact Toolbar

**Files:**
- Modify: `first-time-homebuyer/deck/js/modal.js`
- Modify: `first-time-homebuyer/deck/css/components.css`
- Modify: `first-time-homebuyer/deck/tests/media-modal-layout.test.mjs:1-38`
- Modify: `first-time-homebuyer/deck/tests/modal-fit-contract.test.mjs`

**Interfaces:**
- Consumes: modal shell/controller from Task 4 and `mediaById(id)`.
- Produces: `openMedia(id, opener)` that resolves after image decode and first fit.
- Produces: media design size `{ width: image.naturalWidth, height: image.naturalHeight + 52 }`.
- Uses fallback graphic size `{ width: 960, height: 592 }`, which includes the 52px toolbar.
- Preserves: all nine registered image sources and alt text, presenter `open-media` messages, focus behavior, drag, resize, and error fallback.

- [ ] **Step 1: Replace the bounded-flex media test with a full-surface contract**

Replace `media-modal-layout.test.mjs` with:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../css/components.css', import.meta.url), 'utf8');

test('media image and compact toolbar form one fixed scaled composition', () => {
  const toolbar = css.match(/\.modal--media \.modal-head\s*\{([^}]*)\}/)?.[1] || '';
  const body = css.match(/\.modal--media \.modal-body\s*\{([^}]*)\}/)?.[1] || '';
  const image = css.match(/\.modal-media-frame img\s*\{([^}]*)\}/)?.[1] || '';
  assert.match(toolbar, /height:\s*52px/);
  assert.match(toolbar, /padding:\s*8px 64px 8px 18px/);
  assert.match(body, /overflow:\s*hidden/);
  assert.match(image, /width:\s*100%/);
  assert.match(image, /height:\s*100%/);
  assert.match(image, /object-fit:\s*contain/);
  assert.doesNotMatch(css, /\.modal--media[^}]*\b(?:max-height|\d+vh)/s);
  assert.doesNotMatch(css, /\.modal--media[\s\S]*?overflow(?:-x|-y)?:\s*(?:auto|scroll)/);
});
```

Add to `modal-fit-contract.test.mjs`:

```js
test('graphics fit decoded native dimensions plus the compact toolbar', async () => {
  const source = await read('js/modal.js');
  assert.match(source, /MEDIA_TOOLBAR_HEIGHT\s*=\s*52/);
  assert.match(source, /image\.naturalWidth/);
  assert.match(source, /image\.naturalHeight\s*\+\s*MEDIA_TOOLBAR_HEIGHT/);
  assert.match(source, /await image\.decode\(\)/);
  assert.match(source, /width:\s*960,\s*height:\s*592/);
});
```

- [ ] **Step 2: Run media contracts and verify they fail**

Run:

```bash
node --no-warnings --test \
  first-time-homebuyer/deck/tests/media-modal-layout.test.mjs \
  first-time-homebuyer/deck/tests/modal-fit-contract.test.mjs
```

Expected: FAIL because the current media popout uses a viewport-sized 1600 by 900 shell and a 24px inset frame.

- [ ] **Step 3: Decode each image before fitting its complete surface**

Add:

```js
const MEDIA_TOOLBAR_HEIGHT = 52;
const MEDIA_FALLBACK = Object.freeze({ width: 960, height: 592 });
```

In `openMedia`, render only the small registered title in `headEl` (no eyebrow
or title bar), render one full-size image frame in `bodyEl`, set
`activeKind = 'media'`, and await decode:

```js
try {
  await image.decode();
  if (!isOpen || token !== openToken || activeKind !== 'media') return false;
  currentDesignSize = {
    width: image.naturalWidth,
    height: image.naturalHeight + MEDIA_TOOLBAR_HEIGHT,
  };
} catch {
  image.hidden = true;
  error.hidden = false;
  currentDesignSize = MEDIA_FALLBACK;
}

fitController.reset();
fitController.setActive(true);
fitController.fit();
root.classList.remove('is-measuring');
root.classList.add('is-visible');
closeBtn.focus({ preventScroll: true });
return true;
```

The toolbar remains the drag surface. The close button and bottom-right resize button remain inside `.modal` and therefore scale uniformly. The toolbar title uses the registered media title; do not introduce extra graph copy.

- [ ] **Step 4: Make the media body exactly the image area**

Use:

```css
.modal--media .modal-head {
  height: 52px;
  flex: none;
  display: flex;
  align-items: center;
  padding: 8px 64px 8px 18px;
}
.modal--media .modal-foot { display: none; }
.modal--media .modal-title { font-size: 20px; line-height: 1; }
.modal--media .modal-body { flex: 1 1 auto; min-height: 0; padding: 0; overflow: hidden; }
.modal-media-frame { width: 100%; height: 100%; }
.modal-media-frame img { width: 100%; height: 100%; object-fit: contain; user-select: none; }
```

Do not use `max-width`, `max-height`, viewport units, or an internally scrolling frame. Keep the error message centered in the fixed fallback surface.
The image must begin immediately below the 52px strip; do not add an inset mat,
padding, secondary heading, eyebrow, or decorative underline.

- [ ] **Step 5: Run media, registry, modal, and full tests**

Run:

```bash
node --no-warnings --test \
  first-time-homebuyer/deck/tests/media-modal-layout.test.mjs \
  first-time-homebuyer/deck/tests/modal-fit-contract.test.mjs \
  first-time-homebuyer/deck/tests/presenter-media-registry.test.mjs
node --no-warnings --test first-time-homebuyer/deck/tests/*.test.mjs
node --check first-time-homebuyer/deck/js/modal.js
test "$(shasum -a 256 first-time-homebuyer/deck/content/presenter-media.js | awk '{print $1}')" = "ecb3871668addda146aa4078c66b1c2d6f78b02639936efa683bedf602e104f2"
git diff --check -- \
  first-time-homebuyer/deck/js/modal.js \
  first-time-homebuyer/deck/css/components.css \
  first-time-homebuyer/deck/tests/media-modal-layout.test.mjs \
  first-time-homebuyer/deck/tests/modal-fit-contract.test.mjs
```

Expected: all tests and checks pass.

- [ ] **Step 6: Commit native-ratio graphic fit behavior**

```bash
git add -- \
  first-time-homebuyer/deck/js/modal.js \
  first-time-homebuyer/deck/css/components.css \
  first-time-homebuyer/deck/tests/media-modal-layout.test.mjs \
  first-time-homebuyer/deck/tests/modal-fit-contract.test.mjs
git commit -m "feat: fit complete presenter graphics"
```

---

### Task 6: Cross-Surface Browser Audit and Final Verification

**Files:**
- Create: `first-time-homebuyer/deck/tests/fit-browser-audit.js`
- Create: `docs/superpowers/validation/2026-08-13-unified-fit-to-window.md`
- Modify only if verification exposes a defect: the smallest source/test file responsible for that defect.

**Interfaces:**
- Consumes: all prior tasks.
- Produces: `inspectComposedSurface({ shell, surface, tolerance })` and `assertComposedSurface(result, label)` for real-browser validation.
- Produces: a validation report with commands, test counts, viewport matrix, screenshot paths and hashes, console results, and any deviations.
- Preserves: deployment as a separate user-controlled action.

- [ ] **Step 1: Create the browser-side audit helper**

Create `fit-browser-audit.js`:

```js
const SCROLLING = /^(auto|scroll)$/;

export function inspectComposedSurface({ shell, surface, tolerance = 1 }) {
  const rect = shell.getBoundingClientRect();
  const viewport = { width: innerWidth, height: innerHeight };
  const descendants = [surface, ...surface.querySelectorAll('*')];
  const scrollContainers = descendants.filter(element => {
    const style = getComputedStyle(element);
    const scrollMode = SCROLLING.test(style.overflowX) || SCROLLING.test(style.overflowY);
    const hasOverflow = element.scrollWidth > element.clientWidth + tolerance
      || element.scrollHeight > element.clientHeight + tolerance;
    return scrollMode && hasOverflow;
  }).map(element => element.className || element.tagName);

  return {
    rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom },
    viewport,
    insideViewport: rect.left >= -tolerance
      && rect.top >= -tolerance
      && rect.right <= viewport.width + tolerance
      && rect.bottom <= viewport.height + tolerance,
    surfaceFitsLayout: surface.scrollWidth <= surface.clientWidth + tolerance
      && surface.scrollHeight <= surface.clientHeight + tolerance,
    scrollContainers,
  };
}

export function assertComposedSurface(result, label) {
  const failures = [];
  if (!result.insideViewport) failures.push('rendered rectangle leaves viewport');
  if (!result.surfaceFitsLayout) failures.push('design surface clips authored layout');
  if (result.scrollContainers.length) failures.push(`internal scroll containers: ${result.scrollContainers.join(', ')}`);
  if (failures.length) throw new Error(`${label}: ${failures.join('; ')}`);
}
```

- [ ] **Step 2: Run the full static gate before browser work**

Run:

```bash
git diff --check
for file in first-time-homebuyer/deck/content/*.js first-time-homebuyer/deck/js/*.js first-time-homebuyer/deck/tests/fit-browser-audit.js; do node --check "$file"; done
node --no-warnings --test first-time-homebuyer/deck/tests/*.test.mjs
shasum -a 256 \
  first-time-homebuyer/deck/js/calculator-math.js \
  first-time-homebuyer/deck/content/slides.js \
  first-time-homebuyer/deck/content/modals.js \
  first-time-homebuyer/deck/content/presenter-media.js \
  first-time-homebuyer/deck/js/presenter.js
```

Expected: diff and syntax checks pass; all tests pass; protected hashes match the Global Constraints.

- [ ] **Step 3: Start an owned same-origin server and open the deck**

Run:

```bash
python3 -m http.server 4196 --bind 127.0.0.1 --directory first-time-homebuyer/deck >/tmp/msfg-fit-http.log 2>&1 &
echo $! >/tmp/msfg-fit-http.pid
PWCLI=/Users/zacharyzink/.codex/skills/playwright/scripts/playwright_cli.sh
"$PWCLI" --session fit-final open http://127.0.0.1:4196/#myths
```

Expected: the deck opens with no failed local asset requests.

- [ ] **Step 4: Audit the base slide and both calculator states at every required viewport**

Use Playwright `run-code` with these viewports:

```js
const viewports = [
  { width: 1920, height: 1080 },
  { width: 1280, height: 720 },
  { width: 480, height: 800 },
  { width: 800, height: 480 },
  { width: 240, height: 180 },
];
```

For each viewport:

1. `page.setViewportSize(viewport)`.
2. Import `./tests/fit-browser-audit.js` in the page.
3. Audit `.slide-fit-shell` and `.slide-scaler`.
4. Import `./js/calculator.js`, open it, audit `.calculator-panel` and `.calculator-canvas` collapsed.
5. Click `[data-calculator-toggle]`, audit expanded.
6. Enter a non-zero HOA value, confirm the fifth result row does not overflow, and audit again.
7. Close the calculator and confirm focus returns.

Every audit must pass `assertComposedSurface`. Confirm the slide's rendered ratio is 16:9 and the calculator's rendered ratio equals its active authored ratio within `0.001`.

- [ ] **Step 5: Audit all 30 educational popouts at portrait and short-landscape sizes**

Set reduced motion for deterministic immediate close:

```js
await page.emulateMedia({ reducedMotion: 'reduce' });
```

At 480 by 800 and 800 by 480:

1. Import `MODALS` and `modal.js`.
2. For every `Object.keys(MODALS)`, await `openModal(id)`.
3. Audit `.modal-shell` and `.modal`.
4. Assert `.modal-body` has no internal scrolling and no descendant creates an auto/scroll container.
5. Assert the overlay header is 52px at design size, the title is 20px, and no eyebrow or accent underline is rendered.
6. Close and continue.

Also drag `myth-lowest-rate` to each viewport edge and manually resize it smaller and larger. After every operation, assert the full shell is clamped inside the viewport and the surface ratio is unchanged.

- [ ] **Step 6: Audit all nine graphics and decoded ratios**

At 480 by 800 and 800 by 480:

1. Import `PRESENTER_MEDIA` and `modal.js`.
2. For every registered item, await `openMedia(item.id)`.
3. Audit `.modal-shell` and `.modal`.
4. Assert the image is fully decoded, `naturalWidth > 0`, `naturalHeight > 0`, and the rendered image-area ratio equals `naturalWidth / naturalHeight` within `0.001`.
5. Assert the 52px toolbar is visible and no image pixel is cropped by `object-fit`.
6. Assert the image begins directly below the compact strip with zero body padding and no duplicate eyebrow, oversized heading, or accent underline.
7. Close and continue.

Drag and resize one portrait graphic (`debt-to-income`) and one landscape graphic (`budget-smart`) at both viewports. The complete toolbar and image must remain visible.

- [ ] **Step 7: Verify presenter synchronization and capture visual evidence**

Open the presenter from the audience window and verify:

- presenter calculator icon still opens and closes the audience calculator;
- popout and graphic buttons still open the correct audience surface;
- `D` still toggles drawing;
- arrow and space navigation still work;
- presenter dashboard scrolling remains available;
- the preview iframe still displays the complete slide.

Capture:

```js
await page.screenshot({ path: 'output/playwright/fit-slide-480x800.png', fullPage: true });
await page.screenshot({ path: 'output/playwright/fit-calculator-expanded-800x480.png', fullPage: true });
await page.screenshot({ path: 'output/playwright/fit-popout-480x800.png', fullPage: true });
await page.screenshot({ path: 'output/playwright/fit-graphic-800x480.png', fullPage: true });
```

Inspect every screenshot visually. Record SHA-256 hashes in the validation report; do not stage screenshot files.

- [ ] **Step 8: Confirm a clean browser console and stop owned processes**

Run:

```bash
PWCLI=/Users/zacharyzink/.codex/skills/playwright/scripts/playwright_cli.sh
"$PWCLI" --session fit-final console warning
"$PWCLI" --session fit-final close
kill "$(cat /tmp/msfg-fit-http.pid)"
lsof -nP -iTCP:4196 -sTCP:LISTEN
```

Expected: no console errors or warnings caused by the deck; browser session closes; the final `lsof` prints no listener.

- [ ] **Step 9: Write the validation report**

Create `docs/superpowers/validation/2026-08-13-unified-fit-to-window.md` with:

```markdown
# Unified Fit-to-Window Validation

## Baseline
- Branch and commit tested
- Protected content hashes

## Static gate
- Exact commands
- Test count, pass count, fail count
- Syntax and diff-check results

## Browser matrix
| Viewport | Base slide | Calculator collapsed | Calculator expanded | 30 popouts | 9 graphics |
|---|---|---|---|---|---|

## Interaction preservation
- Drag and uniform resize
- Focus trap and return
- Presenter synchronization
- Drawing and navigation shortcuts

## Overflow audit
- Zero covered internal auto/scroll containers
- One-pixel tolerance results

## Visual evidence
- Screenshot paths and SHA-256 hashes
- Inspection result for each image

## Console and cleanup
- Console result
- Server/session cleanup result

## Deployment status
- Not deployed; requires separate user approval
```

Populate every field with measured evidence; do not leave template labels in the committed report.

- [ ] **Step 10: Run the final controller gate**

Run fresh after the report is complete:

```bash
git diff --check
for file in first-time-homebuyer/deck/content/*.js first-time-homebuyer/deck/js/*.js first-time-homebuyer/deck/tests/fit-browser-audit.js; do node --check "$file"; done
node --no-warnings --test first-time-homebuyer/deck/tests/*.test.mjs
git status --short
```

Expected: all checks pass; only the intended implementation, tests, and validation report are candidates for commit; unrelated dirty files remain unstaged.

- [ ] **Step 11: Commit browser audit and validation evidence**

```bash
git add -- \
  first-time-homebuyer/deck/tests/fit-browser-audit.js \
  docs/superpowers/validation/2026-08-13-unified-fit-to-window.md
git commit -m "test: verify complete fit-to-window surfaces"
```

If browser verification required a source fix, explicitly add only that source file and its regression test to this commit and document the deviation in the validation report.

---

## Final Handoff

After all tasks:

1. Report the implementation commit range and fresh test count.
2. Report the browser matrix, screenshot inspection, and console result.
3. State that unrelated local files remain untouched.
4. Ask separately for authorization to push.
5. After push, ask separately for authorization to build a new full-site Amplify ZIP.
6. Do not deploy automatically.
