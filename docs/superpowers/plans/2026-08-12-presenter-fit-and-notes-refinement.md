# Presenter Overlay Fit and Notes Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make presenter graphs, educational popouts, and the mortgage calculator remain fully visible while resizing proportionally, then compact the presenter graph/popout controls and make personal notes read like speaker notes.

**Architecture:** A pure geometry module owns fit, proportional-resize, and viewport-clamp calculations. `modal.js` and `calculator.js` keep separate DOM, state, focus, and synchronization responsibilities while consuming the same geometry contract; presenter-only layout and notes stay in `presenter.html` and `presenter.js`. Execution first reproduces the hash-pinned approved dirty runtime in an isolated worktree so the source checkout remains untouched.

**Tech Stack:** Static HTML5, CSS, native JavaScript ES modules, Node.js 24 built-in test runner, Python HTTP server, Playwright CLI.

## Global Constraints

- Implement `docs/superpowers/specs/2026-08-12-presenter-fit-and-notes-refinement-design.md` using `superpowers:subagent-driven-development`: one fresh implementer and one independent reviewer per task, then one whole-branch review.
- Treat `/Users/zacharyzink/MSFG/Webinars` as read-only after baseline capture. Never stash, reset, switch, format, stage, or commit its unrelated dirty files.
- Work only in `/Users/zacharyzink/.worktrees/webinars-presenter-fit-notes` on `feature/presenter-fit-notes`, created from the commit that contains the user-approved revision of this plan and its design specification, using `superpowers:using-git-worktrees`.
- Stop on any mismatch against `docs/superpowers/plans/2026-08-12-presenter-fit-and-notes-baseline.sha256`; do not silently copy newer files.
- Preserve slide content, graph bytes, calculator formulas/defaults/values, presenter identities, annotation/clocks/navigation/fullscreen behavior, channel messages, and `msfg-notes:${slideId}` with `Array<string>` values.
- Use a `16px` viewport margin, initial scale capped at `1`, and nominal manual minimum `0.35`; full visibility wins on smaller viewports.
- Graph intrinsic size is decoded image size. Educational popouts shrink-wrap their measured document bounds with maximum-width caps of `960px` standard and `1200px` comparison; the caps never reserve empty width. Calculator uses `560px` width with measured current height.
- Scale the whole content canvas inside an unscaled fitted shell. Keep close/resize controls as shell siblings at their screen-pixel target size. No graph header, internal overlay scrollbar, mobile calculator sheet, third-party package, icon library, remote asset, backend, note sharing/export, or PowerPoint note integration.
- Calculator/pencil/trash icons have at least `32px × 32px` targets; graph close/resize controls have at least `36px × 36px` targets and explicit accessible names.
- Do not rebuild PowerPoint or deploy. Stop after a verified local preview.

---

## File Structure

### Create

- `first-time-homebuyer/deck/js/overlay-geometry.js` — pure fit, resize, and clamp calculations.
- `first-time-homebuyer/deck/tests/overlay-geometry.test.mjs` — exact numeric geometry tests.
- `first-time-homebuyer/deck/tests/modal-fit-contract.test.mjs` — modal and graph-only contracts.
- `first-time-homebuyer/deck/tests/presenter-contract.test.mjs` — presenter layout, icon, and notes contracts.
- `docs/superpowers/validation/2026-08-12-presenter-fit-and-notes.md` — browser evidence.

### Modify

- `first-time-homebuyer/deck/js/modal.js`
- `first-time-homebuyer/deck/css/components.css`
- `first-time-homebuyer/deck/js/calculator.js`
- `first-time-homebuyer/deck/css/calculator.css`
- `first-time-homebuyer/deck/tests/calculator-contract.test.mjs`
- `first-time-homebuyer/deck/presenter.html`
- `first-time-homebuyer/deck/js/presenter.js`
- `docs/superpowers/specs/2026-08-12-presenter-fit-and-notes-refinement-design.md` — final status only after PASS.

### Preserve byte-for-byte

- `first-time-homebuyer/deck/assets/presenter/**/*.png`
- `first-time-homebuyer/deck/js/calculator-math.js`
- `first-time-homebuyer/deck/content/{modals,slides,presenters,presenter-media}.js`
- `first-time-homebuyer/deck/build_pptx.py`

---

### Task 1: Reproduce and Commit the Approved Dirty Baseline

Run all Task 1 steps in the same `zsh` process so the scoped variables and array persist.

**Files:**
- Copy: exactly the files named in `2026-08-12-presenter-fit-and-notes-baseline.sha256`.
- Do not modify: `/Users/zacharyzink/MSFG/Webinars/**`.

**Interfaces:**
- Consumes: the commit containing the approved plan/specification and the hash-pinned current runtime.
- Produces: clean isolated branch whose first commit is byte-identical to that runtime.

- [ ] **Step 1: Verify source state and all pinned hashes**

```bash
source_root='/Users/zacharyzink/MSFG/Webinars'
feature_root='/Users/zacharyzink/.worktrees/webinars-presenter-fit-notes'
manifest="$source_root/docs/superpowers/plans/2026-08-12-presenter-fit-and-notes-baseline.sha256"
plan_path='docs/superpowers/plans/2026-08-12-presenter-fit-and-notes-refinement.md'
spec_path='docs/superpowers/specs/2026-08-12-presenter-fit-and-notes-refinement-design.md'
plan_base="$(git -C "$source_root" log -1 --format=%H -- "$plan_path" "$spec_path")"
test -n "$plan_base"
git -C "$source_root" cat-file -e "$plan_base:$plan_path"
git -C "$source_root" cat-file -e "$plan_base:$spec_path"
git -C "$source_root" show "$plan_base:$spec_path" | grep -q '^Status: Approved for implementation$'
source_status_hash="$(git -C "$source_root" status --porcelain=v1 -z | shasum -a 256 | awk '{print $1}')"
(cd "$source_root" && shasum -a 256 -c "$manifest")
```

Expected: all `30` paths report `OK`, and `plan_base` contains the approved revised design and implementation plan. Any mismatch is a stop condition requiring user re-baselining.

- [ ] **Step 2: Create the isolated worktree**

Use `superpowers:using-git-worktrees`, then:

```bash
git -C "$source_root" worktree add "$feature_root" -b feature/presenter-fit-notes "$plan_base"
```

Expected: a clean feature worktree based on the approved plan/specification commit.

- [ ] **Step 3: Copy only the pinned allowlist and prove byte identity**

```bash
baseline_paths=("${(@f)$(awk '{ $1=""; sub(/^ +/, ""); print }' "$manifest")}")
(cd "$source_root" && rsync -aR "${baseline_paths[@]}" "$feature_root/")
for path in "${baseline_paths[@]}"; do
  cmp -s "$source_root/$path" "$feature_root/$path" || { printf 'Mismatch: %s\n' "$path" >&2; exit 1; }
done
git -C "$feature_root" status --short
```

Expected: only the `30` named files appear; no `.DS_Store`, Playwright artifact, output screenshot, unrelated portrait, unapproved documentation change, or PowerPoint is copied.

- [ ] **Step 4: Verify and commit the isolated baseline**

```bash
cd "$feature_root/first-time-homebuyer/deck"
node --test tests/*.test.mjs
find js content -name '*.js' -print0 | xargs -0 -n1 node --check
git -C "$feature_root" diff --check
git -C "$feature_root" add -- "${baseline_paths[@]}"
git -C "$feature_root" diff --cached --check
git -C "$feature_root" commit -m 'chore: capture approved presenter baseline'
test "$(git -C "$source_root" status --porcelain=v1 -z | shasum -a 256 | awk '{print $1}')" = "$source_status_hash"
```

Expected: `20` tests pass, baseline JavaScript parses, the worktree is clean, and the source status hash is unchanged.

---

### Task 2: Implement the Shared Geometry Engine Test-First

**Files:**
- Create: `first-time-homebuyer/deck/js/overlay-geometry.js`
- Create: `first-time-homebuyer/deck/tests/overlay-geometry.test.mjs`

**Interfaces:**
- Produces: `OVERLAY_MARGIN = 16`, `OVERLAY_MIN_SCALE = 0.35`.
- Produces: `fitOverlay(options)`, `resizeOverlay(options)`, and `clampOverlay(options)`.
- Every function returns `{ intrinsicWidth, intrinsicHeight, scale, width, height, left, top }` with finite values.

- [ ] **Step 1: Write failing numeric tests**

Create `tests/overlay-geometry.test.mjs` with these cases:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { OVERLAY_MARGIN, OVERLAY_MIN_SCALE, fitOverlay, resizeOverlay, clampOverlay } from '../js/overlay-geometry.js';

const near = (actual, expected) => assert.ok(Math.abs(actual - expected) <= 0.000001, `${actual} != ${expected}`);

test('constants are fixed', () => {
  assert.equal(OVERLAY_MARGIN, 16);
  assert.equal(OVERLAY_MIN_SCALE, 0.35);
});

test('1200 by 900 fits inside 1280 by 720', () => {
  const g = fitOverlay({ intrinsicWidth: 1200, intrinsicHeight: 900, viewportWidth: 1280, viewportHeight: 720 });
  near(g.scale, 688 / 900); near(g.height, 688); near(g.left, (1280 - g.width) / 2); near(g.top, 16);
});

test('initial fit does not upscale', () => {
  assert.deepEqual(fitOverlay({ intrinsicWidth: 560, intrinsicHeight: 700, viewportWidth: 1920, viewportHeight: 1080 }),
    { intrinsicWidth: 560, intrinsicHeight: 700, scale: 1, width: 560, height: 700, left: 680, top: 190 });
});

test('invalid intrinsic size uses explicit fallback', () => {
  const g = fitOverlay({ intrinsicWidth: NaN, intrinsicHeight: -1, fallbackWidth: 560, fallbackHeight: 700, viewportWidth: 1920, viewportHeight: 1080 });
  assert.equal(g.intrinsicWidth, 560); assert.equal(g.intrinsicHeight, 700);
  assert.ok(Object.values(g).every(Number.isFinite));
});

test('invalid intrinsic size without an authored fallback is rejected', () => {
  assert.throws(() => fitOverlay({ intrinsicWidth: NaN, intrinsicHeight: 0,
    viewportWidth: 1920, viewportHeight: 1080 }), RangeError);
});

test('tiny viewport overrides nominal minimum for full visibility', () => {
  const g = fitOverlay({ intrinsicWidth: 560, intrinsicHeight: 700, viewportWidth: 200, viewportHeight: 160 });
  near(g.scale, 128 / 700); assert.ok(g.scale < 0.35); near(g.top, 16);
});

test('resize projects both pointer deltas onto one scale', () => {
  const g = resizeOverlay({ intrinsicWidth: 1000, intrinsicHeight: 500, startScale: 0.5, deltaX: 100, deltaY: 50, left: 16, top: 16, viewportWidth: 1600, viewportHeight: 1000 });
  near(g.scale, 0.6); near(g.width / g.height, 2);
});

test('manual shrink stops at nominal minimum when it fits', () => {
  const g = resizeOverlay({ intrinsicWidth: 1000, intrinsicHeight: 500, startScale: 0.5, deltaX: -1000, deltaY: -1000, left: 16, top: 16, viewportWidth: 1600, viewportHeight: 1000 });
  assert.equal(g.scale, 0.35);
});

test('clamp shrinks and repositions after viewport loss', () => {
  const g = clampOverlay({ intrinsicWidth: 1000, intrinsicHeight: 800, scale: 1, left: 50, top: 50, viewportWidth: 600, viewportHeight: 500 });
  near(g.scale, 568 / 1000); near(g.left, 16); near(g.top, 500 - 16 - g.height);
  assert.ok(g.left + g.width <= 584.000001 && g.top + g.height <= 484.000001);
});
```

- [ ] **Step 2: Verify RED**

Run: `node --test tests/overlay-geometry.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement the exact formulas**

Create `js/overlay-geometry.js`:

```js
export const OVERLAY_MARGIN = 16;
export const OVERLAY_MIN_SCALE = 0.35;

const positive = (value, fallback) => Number.isFinite(value) && value > 0 ? value : fallback;
const requiredDimension = (value, fallback, name) => {
  const resolved = positive(value, fallback);
  if (!Number.isFinite(resolved) || resolved <= 0) throw new RangeError(`Invalid ${name}`);
  return resolved;
};
const between = (value, low, high) => Math.min(Math.max(value, low), high);
const size = o => {
  const margin = Math.max(0, Number.isFinite(o.margin) ? o.margin : OVERLAY_MARGIN);
  const intrinsicWidth = requiredDimension(o.intrinsicWidth, o.fallbackWidth, 'intrinsic width');
  const intrinsicHeight = requiredDimension(o.intrinsicHeight, o.fallbackHeight, 'intrinsic height');
  return {
    intrinsicWidth, intrinsicHeight, margin,
    viewportWidth: positive(o.viewportWidth, intrinsicWidth + 2 * margin),
    viewportHeight: positive(o.viewportHeight, intrinsicHeight + 2 * margin),
  };
};
const result = (d, scale, left, top) => ({
  intrinsicWidth: d.intrinsicWidth, intrinsicHeight: d.intrinsicHeight,
  scale, width: d.intrinsicWidth * scale, height: d.intrinsicHeight * scale,
  left, top,
});

export function fitOverlay(options) {
  const d = size(options);
  const scale = Math.min(1, Math.max(1, d.viewportWidth - 2 * d.margin) / d.intrinsicWidth, Math.max(1, d.viewportHeight - 2 * d.margin) / d.intrinsicHeight);
  const width = d.intrinsicWidth * scale, height = d.intrinsicHeight * scale;
  return result(d, scale, Math.max(d.margin, (d.viewportWidth - width) / 2), Math.max(d.margin, (d.viewportHeight - height) / 2));
}

export function clampOverlay(options) {
  const d = size(options);
  const scale = Math.min(positive(options.scale, 1), Math.max(1, d.viewportWidth - 2 * d.margin) / d.intrinsicWidth, Math.max(1, d.viewportHeight - 2 * d.margin) / d.intrinsicHeight);
  const width = d.intrinsicWidth * scale, height = d.intrinsicHeight * scale;
  return result(d, scale,
    between(Number.isFinite(options.left) ? options.left : d.margin, d.margin, d.viewportWidth - d.margin - width),
    between(Number.isFinite(options.top) ? options.top : d.margin, d.margin, d.viewportHeight - d.margin - height));
}

export function resizeOverlay(options) {
  const d = size(options);
  const left = Math.max(d.margin, Number.isFinite(options.left) ? options.left : d.margin);
  const top = Math.max(d.margin, Number.isFinite(options.top) ? options.top : d.margin);
  const dx = Number.isFinite(options.deltaX) ? options.deltaX : 0;
  const dy = Number.isFinite(options.deltaY) ? options.deltaY : 0;
  const delta = (dx * d.intrinsicWidth + dy * d.intrinsicHeight) / (d.intrinsicWidth ** 2 + d.intrinsicHeight ** 2);
  const maximum = Math.min(Math.max(1, d.viewportWidth - d.margin - left) / d.intrinsicWidth, Math.max(1, d.viewportHeight - d.margin - top) / d.intrinsicHeight);
  const scale = between(positive(options.startScale, 1) + delta, Math.min(OVERLAY_MIN_SCALE, maximum), maximum);
  return result(d, scale, left, top);
}
```

- [ ] **Step 4: Verify GREEN and commit**

```bash
node --test tests/overlay-geometry.test.mjs
node --test tests/*.test.mjs
node --check js/overlay-geometry.js
git diff --check -- js/overlay-geometry.js tests/overlay-geometry.test.mjs
git add -- first-time-homebuyer/deck/js/overlay-geometry.js first-time-homebuyer/deck/tests/overlay-geometry.test.mjs
git commit -m 'feat: add proportional overlay geometry'
```

Expected: `9` geometry tests and the full suite pass; only two new files are committed.

---

### Task 3: Fit Graphs and Educational Popouts as Complete Canvases

**Files:**
- Create: `first-time-homebuyer/deck/tests/modal-fit-contract.test.mjs`
- Modify: `first-time-homebuyer/deck/js/modal.js`
- Modify: `first-time-homebuyer/deck/css/components.css`

**Interfaces:**
- Consumes: all three functions from `./overlay-geometry.js`.
- Preserves: `initModal`, `openModal`, `openMedia`, `closeModal`, and `isModalOpen`.
- Standard educational documents shrink-wrap up to `960px`; comparison documents shrink-wrap up to `1200px`. Graph size is decoded `naturalWidth × naturalHeight`.

- [ ] **Step 1: Write the failing modal-fit contract**

Create `tests/modal-fit-contract.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('modal uses shared proportional geometry and shrink-wrap caps', async () => {
  const source = await read('js/modal.js');
  assert.match(source, /from '\.\/overlay-geometry\.js'/);
  for (const name of ['fitOverlay', 'resizeOverlay', 'clampOverlay']) assert.match(source, new RegExp(`${name}\\(`));
  assert.match(source, /STANDARD_MAX_WIDTH\s*=\s*960/);
  assert.match(source, /WIDE_MAX_WIDTH\s*=\s*1200/);
  assert.match(source, /canvas\.scrollWidth/);
  assert.match(source, /canvas\.scrollHeight/);
  assert.match(source, /canvas\.getBoundingClientRect\(\)/);
  assert.match(source, /document\.fonts\.ready/);
  assert.match(source, /ResizeObserver/);
});

test('graph has no visible title header and retains an accessible name', async () => {
  const source = await read('js/modal.js');
  assert.doesNotMatch(source, /Presenter graph/);
  assert.match(source, /panel\.setAttribute\('aria-label', item\.title\)/);
  assert.match(source, /image\.draggable\s*=\s*false/);
  assert.match(source, /image\.naturalWidth/);
  assert.match(source, /image\.naturalHeight/);
});

test('CSS exposes one complete non-scrolling canvas inside an unscaled shell', async () => {
  const css = await read('css/components.css');
  const shell = css.match(/\.modal\s*\{([^}]*)\}/s)?.[1] || '';
  assert.match(shell, /width:\s*auto/);
  assert.match(shell, /height:\s*auto/);
  assert.match(shell, /min-width:\s*0/);
  assert.match(shell, /min-height:\s*0/);
  assert.match(shell, /transform:\s*none/);
  assert.doesNotMatch(shell, /(?:min-|max-)?(?:width|height):\s*(?:\d+px|\d+vh)/);
  assert.match(css, /\.modal-canvas\s*\{[^}]*transform-origin:\s*top left/s);
  assert.match(css, /\.modal-canvas\s*\{[^}]*width:\s*fit-content/s);
  assert.match(css, /\.modal-canvas\s*\{[^}]*max-width:\s*960px/s);
  assert.match(css, /\.modal--wide\s+\.modal-canvas\s*\{[^}]*max-width:\s*1200px/s);
  assert.doesNotMatch(css, /\.modal-canvas\s*\{[^}]*width:\s*(1200|1500)px/s);
  assert.match(css, /\.modal--media\s+\.modal-head\s*\{[^}]*display:\s*none/s);
  assert.match(css, /\.modal--media\s+\.modal-body\s*\{[^}]*padding:\s*0/s);
  assert.match(css, /\.modal-body\s*\{[^}]*overflow:\s*visible/s);
  assert.match(css, /\.modal--media\s+\.modal-close\s*\{[^}]*min-width:\s*36px/s);
  assert.doesNotMatch(css, /\.modal--media\s*\{[^}]*height:\s*80vh/s);
});
```

- [ ] **Step 2: Verify RED**

Run: `node --test tests/modal-fit-contract.test.mjs`

Expected: FAIL because the modal has independent dimensions and visible graph heading copy.

- [ ] **Step 3: Add measured geometry state to `modal.js`**

Wrap the header, body, and footer in `<div class="modal-canvas">`; keep close and resize as direct children of the dialog shell. Store `canvas = root.querySelector('.modal-canvas')`. Add the import, maximum-width caps, and helpers:

```js
import { fitOverlay, resizeOverlay, clampOverlay } from './overlay-geometry.js';
const STANDARD_MAX_WIDTH = 960;
const WIDE_MAX_WIDTH = 1200;
let overlayGeometry = null;

function applyGeometry(next) {
  overlayGeometry = next;
  panel.style.width = `${next.width}px`;
  panel.style.height = `${next.height}px`;
  panel.style.left = `${next.left}px`;
  panel.style.top = `${next.top}px`;
  canvas.style.width = `${next.intrinsicWidth}px`;
  canvas.style.maxWidth = 'none';
  canvas.style.height = `${next.intrinsicHeight}px`;
  canvas.style.transform = `scale(${next.scale})`;
  canvas.dataset.intrinsicWidth = `${next.intrinsicWidth}`;
  canvas.dataset.intrinsicHeight = `${next.intrinsicHeight}`;
}

function fitIntrinsic(intrinsicWidth, intrinsicHeight, fallback) {
  applyGeometry(fitOverlay({ intrinsicWidth, intrinsicHeight,
    fallbackWidth: fallback.width, fallbackHeight: fallback.height,
    viewportWidth: innerWidth, viewportHeight: innerHeight }));
}

function measureDocument(maxWidth) {
  Object.assign(canvas.style, {
    width: 'fit-content', maxWidth: `${maxWidth}px`,
    height: 'auto', transform: 'none',
  });
  const rect = canvas.getBoundingClientRect();
  const tolerance = 1 / (devicePixelRatio || 1);
  if (canvas.scrollWidth - canvas.clientWidth > tolerance ||
      canvas.scrollHeight - canvas.clientHeight > tolerance) {
    throw new RangeError('Educational popout overflowed its measured document');
  }
  const measured = {
    width: Math.min(maxWidth, Math.ceil(rect.width)),
    height: Math.ceil(rect.height),
  };
  if (!Number.isFinite(measured.width) || measured.width <= 0 ||
      !Number.isFinite(measured.height) || measured.height <= 0) {
    throw new RangeError('Educational popout has invalid document bounds');
  }
  return measured;
}
```

Change `.modal-resize` from an aria-hidden `div` to `<button type="button" class="modal-resize" aria-label="Resize popout"></button>`. Drag changes screen-pixel `left`/`top` through `clampOverlay`; resize calls `resizeOverlay` with start scale, pointer deltas, intrinsic size, position, and live viewport size.

- [ ] **Step 4: Measure and fit educational content**

After content is rendered, add `is-open is-measuring` so the document participates in layout without flashing an unfitted panel. Increment an open token so stale asynchronous work cannot reopen a closed or replaced modal. Wait for fonts plus two layout frames, shrink-wrap the complete document, and reveal it only after fitting:

```js
async function fitEducational(d, token) {
  if (document.fonts?.ready) await document.fonts.ready;
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  if (!isOpen || activeKind !== 'content' || token !== activeOpenToken) return;
  try {
    const maximumWidth = d.table ? WIDE_MAX_WIDTH : STANDARD_MAX_WIDTH;
    const measured = measureDocument(maximumWidth);
    fitIntrinsic(measured.width, measured.height, measured);
    root.classList.remove('is-measuring');
    root.classList.add('is-visible');
    closeBtn.focus();
  } catch (error) {
    console.error('[deck] unable to measure educational popout', error);
    root.classList.remove('is-open', 'is-measuring', 'is-visible');
    isOpen = false;
    activeKind = null;
    if (lastFocused && document.contains(lastFocused)) lastFocused.focus();
  }
}
```

Set `aria-labelledby`, remove `aria-label`, then call `fitEducational(d, ++activeOpenToken)`. Keep the content header as its drag surface. Remove `bodyEl.scrollTop` and every internal scrolling fallback. Add a guarded `ResizeObserver` for the educational document; if its content box changes after the initial fit, debounce through two animation frames, return it to measurement mode, and run the same measure/refit path. Disconnect or ignore the observer for graph mode and after close, and suppress callbacks caused solely by applying the already-measured geometry.

- [ ] **Step 5: Render and fit only the decoded graph**

In `openMedia()`:

```js
headEl.replaceChildren();
panel.removeAttribute('aria-labelledby');
panel.setAttribute('aria-label', item.title);
bodyEl.innerHTML = `<div class="modal-media-frame">
  <img src="${item.src}" alt="${item.alt}">
  <p class="modal-media-error" hidden>Graph unavailable</p>
</div>`;
const image = bodyEl.querySelector('img');
image.draggable = false;
const showGraph = () => fitIntrinsic(image.naturalWidth, image.naturalHeight,
  { width: 960, height: 540 });
if (image.complete && image.naturalWidth) showGraph();
else image.addEventListener('load', showGraph, { once: true });
image.addEventListener('error', () => {
  image.hidden = true;
  bodyEl.querySelector('.modal-media-error').hidden = false;
  fitIntrinsic(960, 540, { width: 960, height: 540 });
}, { once: true });
```

Allow media dragging from `bodyEl`, excluding close/resize origins. Advancing slides, Escape, backdrop click, focus trap/return, and unknown-media failure stay unchanged.

- [ ] **Step 6: Apply complete-canvas CSS**

Make `.modal` the fixed-positioned rendered shell and `.modal-canvas` a shrink-wrapped intrinsic transformed child. Close/resize remain unscaled shell controls. Remove fixed/minimum modal dimensions, fixed `vh` heights, and body scrolling. Add:

```css
.modal {
  position: fixed; width: auto; height: auto; min-width: 0; min-height: 0;
  padding: 0; overflow: visible; background: transparent; transform: none;
}
.modal-canvas {
  width: fit-content; max-width: 960px; height: auto; transform-origin: top left;
  display: inline-flex; flex-direction: column; overflow: hidden; background: var(--white);
}
.modal--wide .modal-canvas { max-width: 1200px; }
.modal-head, .modal-body, .modal-foot { width: auto; min-width: 0; }
.modal-body { flex: 1 1 auto; min-height: 0; overflow: visible; }
.modal-head, .modal-body, .modal-foot,
.modal-table th, .modal-table td { overflow-wrap: anywhere; }
.modal-table-wrap { max-width: 100%; overflow: visible; }
.modal-table { max-width: 100%; }
.modal--media { background: var(--white); }
.modal--media .modal-head, .modal--media .modal-foot { display: none; }
.modal--media .modal-body { padding: 0; overflow: hidden; }
.modal--media .modal-media-frame,
.modal--media .modal-media-frame img { width: 100%; height: 100%; }
.modal--media .modal-media-frame img { display: block; object-fit: contain; user-select: none; }
.modal--media .modal-close {
  top: 8px; right: 8px; min-width: 36px; min-height: 36px;
  color: var(--forest); background: rgba(255,255,255,.92);
}
.modal--media .modal-resize { min-width: 36px; min-height: 36px; }
```

- [ ] **Step 7: Refit on browser resize and clear geometry on close**

```js
window.addEventListener('resize', () => {
  if (!isOpen || !overlayGeometry) return;
  applyGeometry(clampOverlay({ ...overlayGeometry,
    viewportWidth: innerWidth, viewportHeight: innerHeight }));
});
```

After close animation, invalidate the open token, clear `overlayGeometry`, disconnect/ignore the educational observer, and clear shell width/height/left/top and canvas width/max-width/height/transform. Do not clear content before focus is returned.

- [ ] **Step 8: Verify GREEN and commit**

```bash
node --test tests/modal-fit-contract.test.mjs tests/overlay-geometry.test.mjs
node --test tests/*.test.mjs
node --check js/modal.js
git diff --check -- js/modal.js css/components.css tests/modal-fit-contract.test.mjs
git add -- first-time-homebuyer/deck/js/modal.js first-time-homebuyer/deck/css/components.css first-time-homebuyer/deck/tests/modal-fit-contract.test.mjs
git commit -m 'feat: fit presenter popouts proportionally'
```

Expected: the full suite passes and only the modal task files are committed.

---

### Task 4: Fit the Complete Calculator Proportionally

**Files:**
- Modify: `first-time-homebuyer/deck/js/calculator.js`
- Modify: `first-time-homebuyer/deck/css/calculator.css`
- Modify: `first-time-homebuyer/deck/tests/calculator-contract.test.mjs`

**Interfaces:**
- Consumes: `fitOverlay`, `resizeOverlay`, and `clampOverlay`.
- Preserves: calculator public functions, inputs, values, math, focus trap/return, visibility callback, and BroadcastChannel behavior.
- Uses intrinsic width `560` and measured current height.

- [ ] **Step 1: Replace freeform/mobile-sheet expectations with a failing fit contract**

Replace the calculator style test with:

```js
test('calculator uses shared proportional geometry without a scrolling mobile sheet', async () => {
  const [source, css] = await Promise.all([read('js/calculator.js'), read('css/calculator.css')]);
  assert.match(source, /from '\.\/overlay-geometry\.js'/);
  assert.match(source, /INTRINSIC_WIDTH\s*=\s*560/);
  for (const name of ['fitOverlay', 'resizeOverlay', 'clampOverlay']) assert.match(source, new RegExp(`${name}\\(`));
  assert.match(source, /canvas\.scrollHeight/);
  assert.match(css, /\.calculator-canvas\s*\{[^}]*transform-origin:\s*top left/s);
  assert.match(css, /\.calculator-scroll\s*\{[^}]*overflow:\s*visible/s);
  assert.doesNotMatch(css, /min-width:\s*420px|min-height:\s*420px/);
  assert.doesNotMatch(css, /@media \(max-width:\s*560px\)/);
  assert.doesNotMatch(css, /overflow:\s*auto/);
});
```

- [ ] **Step 2: Verify RED**

Run: `node --test tests/calculator-contract.test.mjs`

Expected: FAIL on missing shared geometry and current mobile sheet rules.

- [ ] **Step 3: Replace calculator dimensions with measured geometry**

Wrap the calculator drag bar and complete `.calculator-scroll` content in `<div class="calculator-canvas">`; move close and resize buttons outside that canvas as direct `.calculator-panel` children. Store `canvas = panel.querySelector('.calculator-canvas')`. Replace old size/mobile constants and helpers with:

```js
import { fitOverlay, resizeOverlay, clampOverlay } from './overlay-geometry.js';
const INTRINSIC_WIDTH = 560;
let overlayGeometry = null;

function applyGeometry(next) {
  overlayGeometry = next;
  Object.assign(panel.style, {
    width: `${next.width}px`, height: `${next.height}px`,
    left: `${next.left}px`, top: `${next.top}px`,
  });
  Object.assign(canvas.style, {
    width: `${next.intrinsicWidth}px`, height: `${next.intrinsicHeight}px`,
    transform: `scale(${next.scale})`,
  });
}

function measureHeight() {
  Object.assign(canvas.style, { width: `${INTRINSIC_WIDTH}px`, height: 'auto', transform: 'none' });
  return Math.ceil(canvas.scrollHeight);
}

function fitCalculator({ preservePosition = false } = {}) {
  const intrinsicHeight = measureHeight();
  const fitted = fitOverlay({ intrinsicWidth: INTRINSIC_WIDTH, intrinsicHeight,
    fallbackWidth: INTRINSIC_WIDTH, fallbackHeight: intrinsicHeight,
    viewportWidth: innerWidth, viewportHeight: innerHeight });
  if (!preservePosition || !overlayGeometry) return applyGeometry(fitted);
  applyGeometry(clampOverlay({ intrinsicWidth: INTRINSIC_WIDTH, intrinsicHeight,
    fallbackWidth: INTRINSIC_WIDTH, fallbackHeight: intrinsicHeight,
    scale: Math.min(overlayGeometry.scale, fitted.scale),
    left: overlayGeometry.left, top: overlayGeometry.top,
    viewportWidth: innerWidth, viewportHeight: innerHeight }));
}
```

Dragging updates screen-pixel position through `clampOverlay`. Resizing uses `resizeOverlay`; remove all mobile-specific JS branches.

- [ ] **Step 4: Remeasure on open and advanced-field change**

Open order is `root.hidden = false`, `render()`, `fitCalculator()`, then focus close. After advanced fields toggle:

```js
requestAnimationFrame(() => fitCalculator({ preservePosition: true }));
```

On window resize clamp current geometry. On close preserve values and `showMore`, hide the root, restore focus, and keep `onVisibilityChange` unchanged.

- [ ] **Step 5: Replace sheet/reflow CSS with one intrinsic canvas**

```css
.calculator-panel { position: fixed; overflow: visible; background: transparent; }
.calculator-canvas {
  width: 560px; height: auto; transform-origin: top left;
  display: flex; flex-direction: column; overflow: hidden; background: var(--forest);
}
.calculator-dragbar { padding-right: 54px; }
.calculator-close {
  position: absolute; z-index: 2; top: 7px; right: 8px;
  width: 36px; height: 36px;
}
.calculator-scroll { flex: none; min-height: 0; overflow: visible; padding: 0 16px 16px; }
```

Remove min/max dimension rules and the complete `@media (max-width: 560px)` block. Preserve the two-column grid, drag bar, inputs, result, footer, controls, and reduced-motion rule.

- [ ] **Step 6: Verify GREEN and commit**

```bash
node --test tests/calculator-math.test.mjs tests/calculator-contract.test.mjs tests/overlay-geometry.test.mjs
node --test tests/*.test.mjs
node --check js/calculator.js
test "$(shasum -a 256 js/calculator-math.js | awk '{print $1}')" = '5e2551038a8c075103a5dc33f6084b9bf2380f0fd56f26a3f8e2d394e0b1b1ab'
git diff --check -- js/calculator.js css/calculator.css tests/calculator-contract.test.mjs
git add -- first-time-homebuyer/deck/js/calculator.js first-time-homebuyer/deck/css/calculator.css first-time-homebuyer/deck/tests/calculator-contract.test.mjs
git commit -m 'feat: fit mortgage calculator proportionally'
```

Expected: calculator math hash is unchanged and the full suite passes.

---

### Task 5: Compact the Presenter Libraries, Calculator Control, and Notes

**Files:**
- Modify: `first-time-homebuyer/deck/presenter.html`
- Modify: `first-time-homebuyer/deck/js/presenter.js`
- Create: `first-time-homebuyer/deck/tests/presenter-contract.test.mjs`

**Interfaces:**
- Preserves: graph/popout/calculator messages, all unrelated presenter tools, slide-authored notes, and per-slide local storage.
- Produces: `#p-library-grid`, `#p-popout-section`, right-hand `#p-media-section`, and `#p-notes-region`.
- Produces: icon-only `#p-calculator`, `.p-note-edit`, `.p-note-delete`, and compact `#p-note-save`.

- [ ] **Step 1: Write failing presenter contracts**

Create `tests/presenter-contract.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('popouts are left of graphs in one responsive library', async () => {
  const html = await read('presenter.html');
  assert.match(html, /id="p-library-grid"/);
  assert.ok(html.indexOf('id="p-popout-section"') < html.indexOf('id="p-media-section"'));
  assert.match(html, /\.p-right\s*\{[^}]*container-type:\s*inline-size/s);
  assert.match(html, /\.p-library-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s);
  assert.match(html, /\.p-library-grid\.is-single\s*\{[^}]*grid-template-columns:\s*1fr/s);
  assert.match(html, /@container\s*\(max-width:\s*340px\)\s*\{[\s\S]*\.p-library-grid\s*\{[^}]*grid-template-columns:\s*1fr/s);
});

test('calculator control is icon-only with authoritative accessible state', async () => {
  const [html, source] = await Promise.all([read('presenter.html'), read('js/presenter.js')]);
  const body = html.match(/<button[^>]*id="p-calculator"[^>]*>([\s\S]*?)<\/button>/)?.[1] || '';
  assert.match(body, /<svg/); assert.doesNotMatch(body, /Show calculator|Hide calculator/);
  assert.match(source, /setAttribute\('aria-label', label\)/);
  assert.match(source, /setAttribute\('title', label\)/);
  assert.match(source, /setAttribute\('aria-pressed', String\(calculatorVisible\)\)/);
});

test('authored and personal notes share one reference-first region', async () => {
  const [html, source] = await Promise.all([read('presenter.html'), read('js/presenter.js')]);
  assert.match(html, /id="p-notes-region"/); assert.match(html, />Notes for this slide</);
  assert.doesNotMatch(html, />My notes — this slide</);
  assert.ok(html.indexOf('id="p-notes"') < html.indexOf('id="p-note-list"'));
  assert.match(source, /className = 'p-note-edit'/); assert.match(source, /className = 'p-note-delete'/);
  assert.match(source, /aria-label', `Edit note \$\{i \+ 1\}`/);
  assert.match(source, /aria-label', `Delete note \$\{i \+ 1\}`/);
  assert.match(source, /Array\.isArray\(parsed\)/);
});
```

- [ ] **Step 2: Verify RED**

Run: `node --test tests/presenter-contract.test.mjs`

Expected: FAIL because lists are stacked, calculator has text, and notes are separate.

- [ ] **Step 3: Build the left-popout/right-graph library**

Replace the separate list blocks with:

```html
<div class="p-library-grid" id="p-library-grid">
  <section class="p-library-column" id="p-popout-section">
    <div class="p-h">Popouts on this slide (<span id="p-popout-count">0</span>)</div>
    <ul class="p-popouts" id="p-popouts"></ul>
  </section>
  <section class="p-library-column" id="p-media-section" hidden>
    <div class="p-h">Graphs on this slide (<span id="p-media-count">0</span>)</div>
    <ul class="p-popouts" id="p-media-list"></ul>
  </section>
</div>
```

Add:

```css
.p-library-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; align-items: start; }
.p-library-grid.is-single { grid-template-columns: 1fr; }
.p-library-column { min-width: 0; }
.p-library-column .p-h { margin-top: 22px; }
.p-right { container-type: inline-size; }
@container (max-width: 340px) { .p-library-grid { grid-template-columns: 1fr; gap: 0; } }
```

In `render()`, keep current list creation and add:

```js
section.hidden = media.length === 0;
$('#p-library-grid').classList.toggle('is-single', media.length === 0);
```

- [ ] **Step 4: Replace the calculator label with a local icon**

```html
<button class="ic" id="p-calculator" type="button" aria-label="Show calculator" title="Show calculator" aria-pressed="false">
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <rect x="4" y="3" width="16" height="18" rx="1"></rect>
    <path d="M7 6h10v4H7zM7 13h2M12 13h2M17 13h0M7 17h2M12 17h2M17 17h0"></path>
  </svg>
</button>
```

Set it to `32px × 32px`; use `fill:none`, `stroke:currentColor`, and existing `.on`. In `renderCalculatorState()`:

```js
const label = calculatorVisible ? 'Hide calculator' : 'Show calculator';
button.setAttribute('aria-label', label);
button.setAttribute('title', label);
button.classList.toggle('on', calculatorVisible);
button.setAttribute('aria-pressed', String(calculatorVisible));
```

- [ ] **Step 5: Merge authored and personal notes into one surface**

```html
<section id="p-notes-region" aria-labelledby="p-notes-heading">
  <div class="p-h" id="p-notes-heading">Notes for this slide</div>
  <div class="p-notes-reference">
    <div class="p-notes" id="p-notes"></div>
    <div class="p-note-list" id="p-note-list"></div>
    <div class="p-note-add">
      <textarea id="p-note-input" rows="2" aria-label="Add a personal note" placeholder="Add a personal note…"></textarea>
      <button class="ic" id="p-note-save" type="button" aria-label="Save note" title="Save note">＋</button>
    </div>
  </div>
</section>
```

Style personal notes as flat paragraphs with quiet separators, not cards. Put actions in a trailing inline group and make the add row subordinate to reference text.

- [ ] **Step 6: Render robust personal notes with small icon actions**

```js
function loadNotes(id) {
  try {
    const parsed = JSON.parse(localStorage.getItem(notesKey(id)));
    return Array.isArray(parsed) ? parsed.filter(note => typeof note === 'string') : [];
  } catch { return []; }
}
```

Render no empty-state card. For each note, append text and these buttons:

```js
const edit = document.createElement('button');
edit.type = 'button'; edit.className = 'p-note-edit';
edit.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4l11-11-4-4L4 16v4zM13.5 6.5l4 4"></path></svg>';
edit.setAttribute('aria-label', `Edit note ${i + 1}`); edit.setAttribute('title', 'Edit note');

const del = document.createElement('button');
del.type = 'button'; del.className = 'p-note-delete';
del.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"></path></svg>';
del.setAttribute('aria-label', `Delete note ${i + 1}`); del.setAttribute('title', 'Delete note');
```

Retain selected-note prompt editing, blank-edit deletion, immediate delete, save, rerender, and exact storage key. Do not alter `cur.notes`.

- [ ] **Step 7: Verify GREEN and commit**

```bash
node --test tests/presenter-contract.test.mjs tests/calculator-contract.test.mjs tests/presenter-media-registry.test.mjs
node --test tests/*.test.mjs
node --check js/presenter.js
git diff --check -- presenter.html js/presenter.js tests/presenter-contract.test.mjs
git add -- first-time-homebuyer/deck/presenter.html first-time-homebuyer/deck/js/presenter.js first-time-homebuyer/deck/tests/presenter-contract.test.mjs
git commit -m 'feat: refine presenter tools and notes'
```

Expected: all tests pass and unrelated presenter controls remain present.

---

### Task 6: Verify the Real Two-Window Experience and Record Evidence

**Files:**
- Create: `docs/superpowers/validation/2026-08-12-presenter-fit-and-notes.md`
- Modify after all PASS: `docs/superpowers/specs/2026-08-12-presenter-fit-and-notes-refinement-design.md`

**Interfaces:**
- Consumes: complete Tasks 1–5 branch.
- Produces: repeatable local validation record; screenshots remain uncommitted under `first-time-homebuyer/deck/output/playwright/`.

- [ ] **Step 1: Run the complete technical suite**

```bash
cd /Users/zacharyzink/.worktrees/webinars-presenter-fit-notes/first-time-homebuyer/deck
command -v npx >/dev/null 2>&1
node --test tests/*.test.mjs
find js content -name '*.js' -print0 | xargs -0 -n1 node --check
find assets -type f -name '*.svg' -print0 | xargs -0 -n1 xmllint --noout
git -C /Users/zacharyzink/.worktrees/webinars-presenter-fit-notes diff --check
```

Expected: all tests and syntax/XML checks pass.

- [ ] **Step 2: Start the local deck and headed browser**

Terminal A:

```bash
python3 -m http.server 4173 --directory /Users/zacharyzink/.worktrees/webinars-presenter-fit-notes/first-time-homebuyer/deck
```

Terminal B:

```bash
PWCLI='/Users/zacharyzink/.codex/skills/playwright/scripts/playwright_cli.sh'
"$PWCLI" -s=presenter-fit open 'http://127.0.0.1:4173/index.html?fit-review' --headed
"$PWCLI" -s=presenter-fit resize 1280 720
"$PWCLI" -s=presenter-fit snapshot
```

- [ ] **Step 3: Verify every graph and educational popout**

For every `PRESENTER_MEDIA` ID, call `openMedia()`, wait for `img.decode()`, and assert: no visible header; dialog `aria-label`; decoded graph; `16px` bounds; image/panel ratio difference at most `0.001`; no cropping. Use Playwright mouse commands on the FHA graph resize handle and graph surface; assert size/position changes while ratio and bounds remain valid.

For every `MODALS` ID at `1920×1080`, `1280×720`, and `1024×768`, call `openModal()`, await `document.fonts.ready`, wait two animation frames, and assert the shell hugs an independently remeasured document:

```js
() => {
  const panel = document.querySelector('.modal'), canvas = document.querySelector('.modal-canvas');
  const body = canvas.querySelector('.modal-body');
  const r = panel.getBoundingClientRect(), c = canvas.getBoundingClientRect();
  const tolerance = 1 / (devicePixelRatio || 1) + 0.01;
  if (r.left < 15.5 || r.top < 15.5 || r.right > innerWidth - 15.5 || r.bottom > innerHeight - 15.5) throw new Error('modal escaped viewport');
  if (getComputedStyle(panel).transform !== 'none') throw new Error('shell is transformed');
  if (Math.abs(r.width - c.width) > tolerance || Math.abs(r.height - c.height) > tolerance) throw new Error('shell does not match document');
  if (canvas.scrollWidth - canvas.clientWidth > tolerance || canvas.scrollHeight - canvas.clientHeight > tolerance) throw new Error('document overflows canvas');
  if (!body.firstElementChild || !body.lastElementChild) throw new Error('modal content missing');

  for (const el of [canvas.querySelector('.modal-head'), body.lastElementChild,
    canvas.querySelector('.modal-foot:not([hidden])')].filter(Boolean)) {
    const e = el.getBoundingClientRect();
    if (e.left < c.left - tolerance || e.top < c.top - tolerance ||
        e.right > c.right + tolerance || e.bottom > c.bottom + tolerance) {
      throw new Error('document child escaped canvas');
    }
  }

  const probePanel = panel.cloneNode(true);
  Object.assign(probePanel.style, {
    position: 'fixed', left: '-10000px', top: '0', width: 'auto', height: 'auto',
    visibility: 'hidden', opacity: '0', transform: 'none',
  });
  const probe = probePanel.querySelector('.modal-canvas');
  Object.assign(probe.style, {
    width: 'fit-content', maxWidth: panel.classList.contains('modal--wide') ? '1200px' : '960px',
    height: 'auto', transform: 'none',
  });
  document.body.append(probePanel);
  const natural = probe.getBoundingClientRect();
  const intrinsicWidth = Number(canvas.dataset.intrinsicWidth);
  const intrinsicHeight = Number(canvas.dataset.intrinsicHeight);
  probePanel.remove();
  if (Math.abs(intrinsicWidth - Math.ceil(natural.width)) > tolerance ||
      Math.abs(intrinsicHeight - Math.ceil(natural.height)) > tolerance) {
    throw new Error('stored geometry does not match shrink-wrap measurement');
  }
  return { shell: { width: r.width, height: r.height },
    intrinsic: { width: intrinsicWidth, height: intrinsicHeight } };
}
```

For every standard document, assert the stored intrinsic width is no greater than `960`; for every comparison document, no greater than `1200`. For the short `prog-fha` document, also assert its independently remeasured intrinsic width is below `960`; it must not inherit the standard cap as empty width. If any current modal model contains a table, validate the same independent measurement under the comparison cap; otherwise record that comparison-table coverage is not applicable to this baseline. Resize one short and one long popout; ratio difference before/after must be at most `0.001`.

- [ ] **Step 4: Verify complete calculator fit and interaction**

At `1920×1080`, `1280×720`, `1024×768`, and `390×844`, open the calculator and assert title, inputs, result, disclosure, footer, EHL mark, close, and resize controls are within the panel and viewport. Fill home price `500000`; verify the total updates. Expand advanced fields; verify all four fields and footer remain visible. Resize and confirm values persist and ratio remains fixed.

```js
() => {
  const panel = document.querySelector('.calculator-panel'), content = document.querySelector('.calculator-scroll');
  const footer = document.querySelector('.calculator-footer'), r = panel.getBoundingClientRect(), f = footer.getBoundingClientRect();
  if (r.left < 15.5 || r.top < 15.5 || r.right > innerWidth - 15.5 || r.bottom > innerHeight - 15.5) throw new Error('calculator escaped viewport');
  if (content.scrollHeight > content.clientHeight + 1) throw new Error('calculator scrolls');
  if (f.bottom > r.bottom + 0.5) throw new Error('calculator footer clipped');
  return { width: r.width, height: r.height, total: document.querySelector('[data-calculator-total]').textContent };
}
```

- [ ] **Step 5: Verify presenter layout, icon state, and notes**

At `1280×800`, broadcast Slide 2 and assert popouts are left of graphs. At `900×800`, assert graphs stack below popouts. Broadcast calculator states and assert the icon stays visually text-free while `aria-label`, `title`, `aria-pressed`, and `.on` synchronize.

Seed `msfg-notes:myths` with two strings and verify authored notes render first, personal notes are flat paragraphs, and every personal note has labeled `32px × 32px` pencil/trash controls. Exercise add, edit-dialog accept, blank-edit deletion, delete, slide change/return, malformed JSON recovery, and reload persistence.

- [ ] **Step 6: Verify recovery and capture screenshots**

Verify Escape, backdrop close, focus trap/return, unknown graph rejection, graph-load failure, slide-change graph closing, calculator close synchronization, browser-resize refit, and zero product console errors. Capture graph `1280×720`, long popout `1024×768`, expanded calculator `390×844`, and presenter Slide 2 `1280×800` under `output/playwright/`; do not stage them.

- [ ] **Step 7: Record validation and final local status**

Create the validation file with exact test/file counts, measured rectangles, browser matrix, screenshot paths, calculator-math hash, all nine graph hashes, channel-message preservation, source-checkout status hash, and `Local preview only; production not deployed.` Set the spec status to:

```text
Status: Implemented and verified locally; production not deployed
```

- [ ] **Step 8: Run final checks and commit evidence**

```bash
node --test first-time-homebuyer/deck/tests/*.test.mjs
git diff --check
git add -- docs/superpowers/validation/2026-08-12-presenter-fit-and-notes.md docs/superpowers/specs/2026-08-12-presenter-fit-and-notes-refinement-design.md
git diff --cached --check
git commit -m 'docs: verify presenter overlay refinement'
```

Expected: only validation and spec status are committed; screenshots remain untracked.

---

## Final Review and Approval Gate

1. Dispatch one whole-branch reviewer for all changes after the baseline commit.
2. Resolve each Critical or Important finding through the subagent fix loop and rerun affected browser checks.
3. Report worktree, branch, commits, exact tests, screenshots, fit measurements, source-checkout preservation hash, and local URL.
4. Stop for user review. Do not merge into the dirty source checkout, rebuild PowerPoint, or deploy without separate approval.

## Plan Self-Review Checklist

- [x] Dirty baseline is hash-pinned and copied without modifying the source checkout.
- [x] Geometry tests cover fit, non-upscaling, invalid input, tiny viewports, ratio-locked resizing, minimum scale, and clamping.
- [x] Graphs remove the visible header but preserve accessible naming, close/resize, drag, and failure behavior.
- [x] Educational popouts shrink-wrap actual document bounds, and both popouts and calculator scale complete measured canvases inside fitted shells without internal scrolling or shrinking shell controls.
- [x] Calculator math, state, focus, and synchronization remain protected.
- [x] Popouts are left, graphs right, and responsive stacking keeps that order.
- [x] Calculator and note actions become compact accessible icons.
- [x] Authored and personal notes share one reference-first region without changing storage.
- [x] Automated, real-browser, responsive, focus, recovery, and visual checks cover the approved behavior.
- [x] Deployment and PowerPoint remain outside scope.
