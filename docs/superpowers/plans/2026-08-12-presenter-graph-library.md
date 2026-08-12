# Presenter Graph Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add five presenter-only Slide 2 graphs, a fail-safe private navigation toggle, and the approved bullet/copy cleanup without exposing graph controls on the audience slide.

**Architecture:** A focused presenter-media registry owns graph metadata. The private presenter renders registry-backed buttons and sends stable IDs through the existing `BroadcastChannel`; the shared deck validates IDs and renders images through the existing draggable/resizable modal. The shared deck owns navigation visibility and restores it through presenter unload messages, a direct same-origin API, and closed-window polling.

**Tech Stack:** Static HTML, CSS, native JavaScript ES modules, `BroadcastChannel`, Node.js built-in test runner, Python HTTP server, Playwright CLI, PNG assets.

## Global Constraints

- Graph access exists only in the private presenter window and only while the `myths` slide is current.
- The five supplied PNG files must be copied byte-for-byte; do not edit or recompress them.
- The shared graph popout must retain existing modal close, focus, drag, and resize behavior.
- The navigation toggle hides only `.deck-nav`; the progress indicator and slide content remain visible.
- Navigation must restore when the presenter closes or reloads.
- Main-slide and modal bullet sentences must contain no `<strong>` descendants; title and section-heading CSS remains bold.
- The first mortgage-insurance note must read `Mortgage insurance on a conventional loan is removable.`
- The lowest-rate reality must read `The lowest rate and the lowest cost are never the same loan`.
- `Pros of a lower rate` must include `The benefit of a lower Rate is lower payment.` without inline bold markup.
- Mirror content changes in `build_pptx.py`; do not rebuild the PowerPoint and do not deploy.
- Preserve unrelated dirty files and the user's Slide 3 deletion. If the current `SLIDES` array still contains the empty object left by that deletion, remove only that empty object and its adjacent comma; do not restore its deleted content.
- Do not stash, reset, format unrelated files, or stage user-owned changes. Because implementation paths already contain uncommitted work, replace commit steps with explicit ownership checkpoints unless the user separately requests commits.

---

## File Structure

### Create

- `first-time-homebuyer/deck/content/presenter-media.js` — immutable graph metadata and lookup functions.
- `first-time-homebuyer/deck/assets/presenter/slide-02/fha-buyers.png` — supplied FHA graph.
- `first-time-homebuyer/deck/assets/presenter/slide-02/down-payment-ranges.png` — supplied down-payment graph.
- `first-time-homebuyer/deck/assets/presenter/slide-02/credit-score.png` — supplied credit-score graph.
- `first-time-homebuyer/deck/assets/presenter/slide-02/rent-vs-buy.png` — supplied rent-versus-buy graph.
- `first-time-homebuyer/deck/assets/presenter/slide-02/lowest-rate.png` — supplied rate-cost graph.
- `first-time-homebuyer/deck/tests/presenter-media-registry.test.mjs` — registry, slide ownership, and copied-asset contract tests.
- `first-time-homebuyer/deck/tests/content-emphasis.test.mjs` — exact copy and no-bold-bullets contract tests.

### Modify

- `first-time-homebuyer/deck/presenter.html` — private graph list and navigation toggle UI.
- `first-time-homebuyer/deck/js/presenter.js` — graph-button rendering, media messages, navigation state, and unload restoration.
- `first-time-homebuyer/deck/js/modal.js` — validated media rendering in the existing modal.
- `first-time-homebuyer/deck/js/deck.js` — media message routing, navigation ownership, presenter reference, and close watchdog.
- `first-time-homebuyer/deck/css/base.css` — deterministic navigation-hidden state.
- `first-time-homebuyer/deck/css/components.css` — graph modal sizing, containment, and error state.
- `first-time-homebuyer/deck/content/slides.js` — remove inline emphasis from bullet arrays and finish the already-started empty Slide 3 removal if still present.
- `first-time-homebuyer/deck/content/modals.js` — requested wording and modal bullet emphasis cleanup.
- `first-time-homebuyer/deck/build_pptx.py` — mirror the approved content strings and bullet emphasis.

---

### Task 1: Presenter Media Registry and Supplied Assets

**Files:**
- Create: `first-time-homebuyer/deck/tests/presenter-media-registry.test.mjs`
- Create: `first-time-homebuyer/deck/content/presenter-media.js`
- Create: `first-time-homebuyer/deck/assets/presenter/slide-02/*.png`

**Interfaces:**
- Produces: `PRESENTER_MEDIA: ReadonlyArray<PresenterMedia>`
- Produces: `mediaForSlide(slideId: string): PresenterMedia[]`
- Produces: `mediaById(id: string): PresenterMedia | null`
- `PresenterMedia` fields: `{ id, slideId, title, src, alt }`, all strings.

- [ ] **Step 1: Write the failing registry contract test**

Create `first-time-homebuyer/deck/tests/presenter-media-registry.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const expected = [
  ['fha-buyers', 'FHA Buyers', './assets/presenter/slide-02/fha-buyers.png'],
  ['down-payment-ranges', 'Down Payment Ranges', './assets/presenter/slide-02/down-payment-ranges.png'],
  ['credit-score', 'Credit Scores', './assets/presenter/slide-02/credit-score.png'],
  ['rent-vs-buy', 'Rent vs. Buy', './assets/presenter/slide-02/rent-vs-buy.png'],
  ['lowest-rate', 'The Lowest Rate', './assets/presenter/slide-02/lowest-rate.png'],
];

test('Slide 2 exposes exactly the five approved presenter graphs', async () => {
  const registry = await import('../content/presenter-media.js').catch(() => null);
  assert.ok(registry, 'presenter media registry must exist');
  assert.deepEqual(
    registry.mediaForSlide('myths').map(({ id, title, src }) => [id, title, src]),
    expected,
  );
  assert.deepEqual(registry.mediaForSlide('opening'), []);
});

test('every registered graph resolves to a copied local PNG', async () => {
  const registry = await import('../content/presenter-media.js').catch(() => null);
  assert.ok(registry, 'presenter media registry must exist');
  for (const item of registry.PRESENTER_MEDIA) {
    assert.equal(item.slideId, 'myths');
    assert.ok(item.alt.length >= 20, `${item.id} needs descriptive alt text`);
    const assetUrl = new URL(`../${item.src.replace('./', '')}`, import.meta.url);
    assert.ok(existsSync(fileURLToPath(assetUrl)), `${item.src} must exist`);
    assert.equal(registry.mediaById(item.id), item);
  }
  assert.equal(registry.mediaById('unknown'), null);
});
```

- [ ] **Step 2: Run the registry test and verify RED**

Run:

```bash
node --experimental-default-type=module --test first-time-homebuyer/deck/tests/presenter-media-registry.test.mjs
```

Expected: FAIL with `presenter media registry must exist`.

- [ ] **Step 3: Copy the supplied PNG files without modifying them**

Run:

```bash
mkdir -p first-time-homebuyer/deck/assets/presenter/slide-02
cp '/Users/zacharyzink/Desktop/FHA Buyers.png' first-time-homebuyer/deck/assets/presenter/slide-02/fha-buyers.png
cp '/Users/zacharyzink/Desktop/Down Payment range graph.png' first-time-homebuyer/deck/assets/presenter/slide-02/down-payment-ranges.png
cp '/Users/zacharyzink/Desktop/Credit Score.png' first-time-homebuyer/deck/assets/presenter/slide-02/credit-score.png
cp '/Users/zacharyzink/Desktop/Rent vs Buy.png' first-time-homebuyer/deck/assets/presenter/slide-02/rent-vs-buy.png
cp '/Users/zacharyzink/Desktop/lowest rate.png' first-time-homebuyer/deck/assets/presenter/slide-02/lowest-rate.png
```

Verify each source/destination pair with `cmp -s`; every command must exit `0`:

```bash
cmp -s '/Users/zacharyzink/Desktop/FHA Buyers.png' first-time-homebuyer/deck/assets/presenter/slide-02/fha-buyers.png
cmp -s '/Users/zacharyzink/Desktop/Down Payment range graph.png' first-time-homebuyer/deck/assets/presenter/slide-02/down-payment-ranges.png
cmp -s '/Users/zacharyzink/Desktop/Credit Score.png' first-time-homebuyer/deck/assets/presenter/slide-02/credit-score.png
cmp -s '/Users/zacharyzink/Desktop/Rent vs Buy.png' first-time-homebuyer/deck/assets/presenter/slide-02/rent-vs-buy.png
cmp -s '/Users/zacharyzink/Desktop/lowest rate.png' first-time-homebuyer/deck/assets/presenter/slide-02/lowest-rate.png
```

- [ ] **Step 4: Implement the immutable registry**

Create `first-time-homebuyer/deck/content/presenter-media.js` with these exact exports:

```js
const items = [
  {
    id: 'fha-buyers', slideId: 'myths', title: 'FHA Buyers',
    src: './assets/presenter/slide-02/fha-buyers.png',
    alt: 'Chart showing the percentage of FHA purchase loans made to first-time homebuyers.',
  },
  {
    id: 'down-payment-ranges', slideId: 'myths', title: 'Down Payment Ranges',
    src: './assets/presenter/slide-02/down-payment-ranges.png',
    alt: 'Pie chart showing down payment ranges among first-time homebuyers.',
  },
  {
    id: 'credit-score', slideId: 'myths', title: 'Credit Scores',
    src: './assets/presenter/slide-02/credit-score.png',
    alt: 'Bar chart comparing borrower credit score ranges across conventional, FHA, and VA loans.',
  },
  {
    id: 'rent-vs-buy', slideId: 'myths', title: 'Rent vs. Buy',
    src: './assets/presenter/slide-02/rent-vs-buy.png',
    alt: 'Colorado ten-year comparison of cumulative renting costs and homeowner equity.',
  },
  {
    id: 'lowest-rate', slideId: 'myths', title: 'The Lowest Rate',
    src: './assets/presenter/slide-02/lowest-rate.png',
    alt: 'Loan comparison showing how lower rates can require higher upfront costs.',
  },
];

export const PRESENTER_MEDIA = Object.freeze(items.map(item => Object.freeze(item)));
const byId = new Map(PRESENTER_MEDIA.map(item => [item.id, item]));
export const mediaForSlide = slideId => PRESENTER_MEDIA.filter(item => item.slideId === slideId);
export const mediaById = id => byId.get(id) || null;
```

- [ ] **Step 5: Run the registry tests and verify GREEN**

Run the Step 2 command. Expected: `2` tests pass, `0` fail.

- [ ] **Step 6: Record the ownership checkpoint**

Run:

```bash
git status --short -- first-time-homebuyer/deck/content/presenter-media.js first-time-homebuyer/deck/assets/presenter/slide-02 first-time-homebuyer/deck/tests/presenter-media-registry.test.mjs
```

Expected: only the new registry, five copied assets, and registry test appear. Do not stage them.

---

### Task 2: Image-Capable Shared Popout

**Files:**
- Modify: `first-time-homebuyer/deck/js/modal.js`
- Modify: `first-time-homebuyer/deck/css/components.css`

**Interfaces:**
- Consumes: `mediaById(id)` from Task 1.
- Produces: `openMedia(id: string, opener?: Element): boolean`.
- Preserves: `openModal`, `closeModal`, and `isModalOpen` behavior.

- [ ] **Step 1: Start the local server and open the shared deck**

Run from `first-time-homebuyer/deck`:

```bash
python3 -m http.server 4173
```

In a second shell, verify `npx` and open a headed browser:

```bash
command -v npx
/Users/zacharyzink/.codex/skills/playwright/scripts/playwright_cli.sh -s=webinar-media open 'http://127.0.0.1:4173/index.html?media-test=red' --headed
/Users/zacharyzink/.codex/skills/playwright/scripts/playwright_cli.sh -s=webinar-media snapshot
```

- [ ] **Step 2: Run the failing browser assertion for `openMedia`**

Run:

```bash
/Users/zacharyzink/.codex/skills/playwright/scripts/playwright_cli.sh -s=webinar-media eval "async () => { const modal = await import('./js/modal.js'); if (typeof modal.openMedia !== 'function') throw new Error('openMedia must exist'); return true; }"
```

Expected: FAIL with `openMedia must exist`.

- [ ] **Step 3: Add media rendering to the existing modal module**

Modify `modal.js` to import `mediaById`, track `activeKind`, and export `openMedia`. Preserve the existing focus, animation, size-reset, and body-locking sequence. The media path must implement this contract:

```js
export function openMedia(id, opener) {
  const item = mediaById(id);
  if (!item) {
    console.warn(`[deck] no presenter media "${id}"`);
    return false;
  }

  lastFocused = opener || document.activeElement;
  headEl.innerHTML = `
    <div class="modal-eyebrow">Presenter graph</div>
    <h2 class="modal-title" id="modal-title">${item.title}</h2>
    <div class="modal-title-bar"></div>`;
  bodyEl.innerHTML = `
    <div class="modal-media-frame">
      <img src="${item.src}" alt="${item.alt}">
      <p class="modal-media-error" hidden>Graph unavailable</p>
    </div>`;
  const image = bodyEl.querySelector('img');
  const error = bodyEl.querySelector('.modal-media-error');
  image.addEventListener('error', () => {
    image.hidden = true;
    error.hidden = false;
  }, { once: true });
  footEl.hidden = true;

  pos = { x: 0, y: 0 };
  panel.style.width = '';
  panel.style.height = '';
  panel.classList.remove('modal--wide');
  panel.classList.add('modal--media');
  root.classList.add('is-open');
  requestAnimationFrame(() => {
    root.classList.add('is-visible');
    applyPos();
    closeBtn.focus();
  });
  isOpen = true;
  document.body.classList.add('modal-open');
  activeKind = 'media';
  return true;
}
```

`openModal` must set `activeKind = 'content'` and remove `.modal--media`. `closeModal` must set `activeKind = null` after closing.

- [ ] **Step 4: Add contained graph styling**

Add to `components.css`:

```css
.modal--media { width: min(1600px, 100%); height: min(900px, 84vh); }
.modal--media .modal-body {
  min-height: 0; padding: 24px; overflow: hidden;
  display: grid; place-items: center; background: var(--white);
}
.modal-media-frame { width: 100%; height: 100%; min-height: 280px; display: grid; place-items: center; }
.modal-media-frame img { width: 100%; height: 100%; object-fit: contain; }
.modal-media-error { font-family: var(--font-display); font-size: 32px; font-weight: var(--fw-700); color: var(--forest); }
```

Add a mobile rule setting `.modal--media { height: 80vh; }` below the existing `max-width: 900px` block.

- [ ] **Step 5: Run the media popout browser assertion and verify GREEN**

Reload with a cache-busting query, snapshot, and run:

```bash
/Users/zacharyzink/.codex/skills/playwright/scripts/playwright_cli.sh -s=webinar-media goto 'http://127.0.0.1:4173/index.html?media-test=green'
/Users/zacharyzink/.codex/skills/playwright/scripts/playwright_cli.sh -s=webinar-media snapshot
/Users/zacharyzink/.codex/skills/playwright/scripts/playwright_cli.sh -s=webinar-media eval "async () => { const modal = await import('./js/modal.js'); const opened = modal.openMedia('fha-buyers'); if (!opened) throw new Error('FHA graph did not open'); const img = document.querySelector('.modal--media img'); await img.decode(); if (!img.naturalWidth) throw new Error('FHA graph did not decode'); if (document.querySelector('.modal-title').textContent !== 'FHA Buyers') throw new Error('wrong media title'); return { width: img.naturalWidth, height: img.naturalHeight }; }"
```

Expected: PASS with `{ width: 1402, height: 1122 }`.

- [ ] **Step 6: Verify unknown IDs fail closed**

Run:

```bash
/Users/zacharyzink/.codex/skills/playwright/scripts/playwright_cli.sh -s=webinar-media eval "async () => { const modal = await import('./js/modal.js'); modal.closeModal(); if (modal.openMedia('unknown') !== false) throw new Error('unknown media must return false'); if (document.querySelector('.modal-root').classList.contains('is-open')) throw new Error('unknown media opened the dialog'); return true; }"
```

Expected: PASS and one console warning naming `unknown`.

- [ ] **Step 7: Record the ownership checkpoint**

Run `git diff --check` for `modal.js` and `components.css`, then inspect only those diffs. Do not stage them.

---

### Task 3: Presenter Graph Controls and Fail-Safe Navigation Toggle

**Files:**
- Modify: `first-time-homebuyer/deck/presenter.html`
- Modify: `first-time-homebuyer/deck/js/presenter.js`
- Modify: `first-time-homebuyer/deck/js/deck.js`
- Modify: `first-time-homebuyer/deck/css/base.css`

**Interfaces:**
- Consumes: `mediaForSlide(slideId)` and `openMedia(id)`.
- Broadcast messages: `{ type: 'open-media', id }`, `{ type: 'nav-visibility', hidden }`, `{ type: 'navstate', hidden }`, and `{ type: 'presenter-exit' }`.
- Produces same-origin deck API: `window.__deckSetNavigationHidden(hidden: boolean)`.

- [ ] **Step 1: Run failing presenter-control assertions**

Open the presenter directly and snapshot before using element references:

```bash
/Users/zacharyzink/.codex/skills/playwright/scripts/playwright_cli.sh -s=webinar-presenter open 'http://127.0.0.1:4173/presenter.html?controls-test=red' --headed
/Users/zacharyzink/.codex/skills/playwright/scripts/playwright_cli.sh -s=webinar-presenter snapshot
/Users/zacharyzink/.codex/skills/playwright/scripts/playwright_cli.sh -s=webinar-presenter eval "() => { if (!document.querySelector('#p-media-section')) throw new Error('presenter media section must exist'); if (!document.querySelector('#p-nav-visibility')) throw new Error('navigation toggle must exist'); return true; }"
```

Expected: FAIL with `presenter media section must exist`.

- [ ] **Step 2: Add the private presenter controls**

Add beside the existing fullscreen control in `presenter.html`:

```html
<button id="p-nav-visibility" title="Show or hide the navigation bar on the shared slide">Slide navigation: Shown</button>
```

Add immediately before `Popouts on this slide`:

```html
<section id="p-media-section" hidden>
  <div class="p-h">Slide 2 graphs (<span id="p-media-count">0</span>)</div>
  <ul class="p-popouts" id="p-media-list"></ul>
</section>
```

Reuse `.p-popouts` button styling; do not add graph thumbnails.

- [ ] **Step 3: Render graph buttons only for the current slide**

Import `mediaForSlide` in `presenter.js`. In `render()`, implement:

```js
const media = mediaForSlide(cur.id);
const section = $('#p-media-section');
const mediaList = $('#p-media-list');
section.hidden = media.length === 0;
mediaList.innerHTML = '';
media.forEach(item => {
  const li = document.createElement('li');
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = item.title;
  button.addEventListener('click', () => channel.postMessage({ type: 'open-media', id: item.id }));
  li.appendChild(button);
  mediaList.appendChild(li);
});
$('#p-media-count').textContent = String(media.length);
```

- [ ] **Step 4: Make the shared deck own navigation state**

In `deck.js`, store the presenter window returned by `window.open`, route `open-media` through `openMedia`, and implement:

```js
let presenterWindow = null;
let navHidden = false;
let presenterClosedWatch = null;

function setNavigationHidden(hidden) {
  navHidden = Boolean(hidden);
  document.body.classList.toggle('deck-nav-hidden', navHidden);
  if (channel) channel.postMessage({ type: 'navstate', hidden: navHidden });
  clearInterval(presenterClosedWatch);
  presenterClosedWatch = null;
  if (navHidden && presenterWindow) {
    presenterClosedWatch = setInterval(() => {
      if (presenterWindow.closed) setNavigationHidden(false);
    }, 500);
  }
}

window.__deckSetNavigationHidden = setNavigationHidden;
```

`openPresenter()` must assign the `window.open` result to `presenterWindow`. `initChannel()` must handle:

```js
if (m.type === 'open-media') openMedia(m.id);
if (m.type === 'nav-visibility') setNavigationHidden(m.hidden);
if (m.type === 'presenter-exit') setNavigationHidden(false);
if (m.type === 'hello') {
  broadcast();
  channel.postMessage({ type: 'navstate', hidden: navHidden });
}
```

- [ ] **Step 5: Add presenter toggle state and close restoration**

In `presenter.js`, track `navHidden`, render authoritative `navstate` messages, and add:

```js
function renderNavState(hidden) {
  navHidden = Boolean(hidden);
  const button = $('#p-nav-visibility');
  button.textContent = `Slide navigation: ${navHidden ? 'Hidden' : 'Shown'}`;
  button.classList.toggle('on', navHidden);
}

function restoreNavigation() {
  channel.postMessage({ type: 'presenter-exit' });
  if (window.opener && !window.opener.closed && window.opener.__deckSetNavigationHidden) {
    window.opener.__deckSetNavigationHidden(false);
  }
}
```

The button posts `{ type: 'nav-visibility', hidden: !navHidden }`. Register `restoreNavigation` for both `pagehide` and `beforeunload`; the operation is idempotent.

- [ ] **Step 6: Add the deterministic hidden style**

Add to `base.css` adjacent to `.deck-nav`:

```css
.deck-nav-hidden .deck-nav { display: none; }
```

- [ ] **Step 7: Verify private-only graph controls**

After cache-busting reloads, use a second channel instance to move the presenter to Slide 2:

```bash
/Users/zacharyzink/.codex/skills/playwright/scripts/playwright_cli.sh -s=webinar-presenter eval "() => { const testChannel = new BroadcastChannel('msfg-deck'); testChannel.postMessage({ type: 'slide', index: 1 }); testChannel.close(); return true; }"
```

Then run this assertion after the presenter has processed the message:

```js
async () => {
  await new Promise(resolve => setTimeout(resolve, 50));
  const section = document.querySelector('#p-media-section');
  const labels = [...document.querySelectorAll('#p-media-list button')].map(button => button.textContent);
  if (section.hidden) throw new Error('Slide 2 graph section is hidden');
  if (labels.join('|') !== 'FHA Buyers|Down Payment Ranges|Credit Scores|Rent vs. Buy|The Lowest Rate') {
    throw new Error(`wrong presenter graph labels: ${labels.join('|')}`);
  }
  return labels;
}
```

On the audience page, assert `document.querySelector('#p-media-section') === null` and no slide card references an asset path containing `/presenter/slide-02/`.

- [ ] **Step 8: Verify navigation closes safely with the presenter**

Open the presenter through the audience page so `window.opener` and `presenterWindow` are set. Toggle navigation hidden from the presenter, confirm `.deck-nav-hidden` on the audience body, close the presenter session, wait up to two seconds, and assert the class is absent and `.deck-nav` has nonzero layout dimensions.

- [ ] **Step 9: Record the ownership checkpoint**

Run `git diff --check` and inspect diffs only for the four Task 3 files. Do not stage them.

---

### Task 4: Bullet Emphasis and Exact Copy Contracts

**Files:**
- Create: `first-time-homebuyer/deck/tests/content-emphasis.test.mjs`
- Modify: `first-time-homebuyer/deck/content/slides.js`
- Modify: `first-time-homebuyer/deck/content/modals.js`
- Modify: `first-time-homebuyer/deck/build_pptx.py`

**Interfaces:**
- Consumes existing `SLIDES` and `MODALS` data shapes.
- Produces plain-text bullet strings; heading fields remain unchanged.

- [ ] **Step 1: Write the failing content contract test**

Create `first-time-homebuyer/deck/tests/content-emphasis.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { SLIDES } from '../content/slides.js';
import { MODALS } from '../content/modals.js';

const slideBullets = SLIDES.flatMap(slide => [
  ...(slide.points || []),
  ...(slide.left?.items || []),
  ...(slide.right?.items || []),
]);
const modalBullets = Object.values(MODALS)
  .flatMap(modal => (modal.sections || []).flatMap(section => section.items || []));

test('rendered bullet strings contain no strong markup', () => {
  for (const bullet of [...slideBullets, ...modalBullets]) {
    assert.doesNotMatch(bullet, /<\/?strong>/i, bullet);
  }
});

test('requested first-popout and lowest-rate wording is exact', () => {
  const down = MODALS['myth-20-down'];
  assert.equal(down.sections.at(-1).note, 'Mortgage insurance on a conventional loan is removable.');

  const rate = MODALS['myth-lowest-rate'];
  const reality = rate.sections.find(section => section.head === 'The reality');
  const pros = rate.sections.find(section => section.head === 'Pros of a lower rate');
  assert.ok(reality.items.includes('The lowest rate and the lowest cost are never the same loan'));
  assert.ok(pros.items.includes('The benefit of a lower Rate is lower payment.'));
});
```

- [ ] **Step 2: Run the content tests and verify RED**

Run:

```bash
node --experimental-default-type=module --test first-time-homebuyer/deck/tests/content-emphasis.test.mjs
```

Expected: both tests fail: one names a bullet containing `<strong>`, and one reports the superseded first-popout note.

- [ ] **Step 3: Finish the user's Slide 3 deletion only if the empty object remains**

Inspect the `SLIDES` array. If the `/* 3 — ... */` entry is an empty `{}`, remove that comment, object, and adjacent comma. Preserve the user's `Renting is cheaper` text and do not restore any deleted Slide 3 copy.

- [ ] **Step 4: Remove inline emphasis from bullet data**

Use targeted patches to remove opening and closing `<strong>` tags from:

- every `SLIDES` `points` string;
- every `SLIDES` `left.items` and `right.items` string;
- every `MODALS` section `items` string;
- the corresponding bullet arrays in `build_pptx.py`.

Do not change heading fields, card titles, modal titles, modal section heads, comparison-table cells, or unrelated modal notes.

- [ ] **Step 5: Apply the three exact text changes**

In `modals.js` and the corresponding `build_pptx.py` modal definitions:

```js
note: 'Mortgage insurance on a conventional loan is removable.'
```

```js
'The lowest rate and the lowest cost are never the same loan'
```

Append to `Pros of a lower rate`:

```js
'The benefit of a lower Rate is lower payment.'
```

- [ ] **Step 6: Run the content tests and verify GREEN**

Run the Step 2 command. Expected: `2` tests pass, `0` fail.

- [ ] **Step 7: Verify the rendered DOM contract**

With Slide 2 active, open each content popout and assert:

```js
() => ({
  bulletStrongCount: document.querySelectorAll('.modal-list li strong, .points li strong, .panel-list li strong').length,
  modalHeadWeight: getComputedStyle(document.querySelector('.modal-section-head')).fontWeight,
})
```

Expected: `bulletStrongCount` is `0`; `modalHeadWeight` is `800`.

- [ ] **Step 8: Record the ownership checkpoint**

Inspect targeted diffs carefully because `slides.js` contains user-owned edits. Do not stage or commit this file.

---

### Task 5: Full Two-Window Verification and Handoff

**Files:**
- Verify all files from Tasks 1-4.
- Do not create deployment artifacts.

**Interfaces:**
- Exercises the complete presenter-to-audience workflow.

- [ ] **Step 1: Run both Node contract suites**

Run:

```bash
node --experimental-default-type=module --test first-time-homebuyer/deck/tests/*.test.mjs
```

Expected: `4` tests pass, `0` fail.

- [ ] **Step 2: Run syntax and whitespace verification**

Run:

```bash
node --check first-time-homebuyer/deck/content/presenter-media.js
node --check first-time-homebuyer/deck/js/modal.js
node --check first-time-homebuyer/deck/js/presenter.js
node --check first-time-homebuyer/deck/js/deck.js
python3 -m py_compile first-time-homebuyer/deck/build_pptx.py
git diff --check
```

Expected: all commands exit `0` with no syntax or whitespace errors.

- [ ] **Step 3: Verify all five graphs end to end**

For each presenter graph button:

1. snapshot the presenter and click the button using its current Playwright element reference;
2. snapshot the audience page;
3. assert `.modal--media` is visible;
4. await the image's `decode()` promise;
5. assert the image `src` ends with the expected registry filename;
6. close the modal before testing the next image.

Expected: five decoded images, five correct titles, no broken-image state.

- [ ] **Step 4: Verify drag and resize behavior**

Open `Rent vs. Buy`, record `.modal` bounding coordinates, drag `.modal-head` by at least 80 pixels, drag `.modal-resize` by at least 100 pixels in each axis, and assert both position and size changed. Confirm the contained image remains fully visible within `.modal-body`.

- [ ] **Step 5: Verify slide-change closure**

Open a graph on Slide 2, click `Next` in the presenter, and assert `.modal-root.is-open` becomes false on the audience page.

- [ ] **Step 6: Verify navigation recovery**

Hide navigation from the presenter and assert the audience body has `.deck-nav-hidden`. Close the presenter window and poll the audience for at most two seconds. Assert `.deck-nav-hidden` is absent and the navigation bar is available again.

- [ ] **Step 7: Review browser console output**

Run `console error` in both Playwright sessions. Expected: no product errors. A missing `favicon.ico` request may be reported separately and must not be described as a feature failure.

- [ ] **Step 8: Capture and inspect final screenshots**

Capture:

- presenter Slide 2 controls at `1366x768`;
- audience `Credit Scores` graph popout at `1366x768`;
- audience `Rent vs. Buy` graph popout at `1920x1080`;
- audience slide after presenter-close navigation restoration.

Inspect each image for clipping, unreadable controls, incorrect containment, or audience-visible graph buttons.

- [ ] **Step 9: Reconcile scope and report**

Run `git status --short` and `git diff --stat`. Report:

- files created and modified for this feature;
- the preserved user-owned files and hunks;
- exact verification counts;
- that no PowerPoint was rebuilt and no deployment occurred;
- any remaining blocker from unrelated dirty work.

Do not commit or deploy unless the user explicitly requests it.
