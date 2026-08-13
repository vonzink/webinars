# Presenter Quick Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the private presenter faster to operate with an always-available top-right calculator icon, side-by-side Popout and Graphic action buttons, and `D` as a safe drawing toggle.

**Architecture:** Keep the existing browser-native presenter and `BroadcastChannel('msfg-deck')` protocol. `presenter.html` continues to own presenter-only layout and styling, while `presenter.js` retains slide-specific rendering, calculator state synchronization, and annotation state; one new static contract file locks the layout and keyboard guards. No audience module, calculator arithmetic, slide content, media registry, PowerPoint, or deployment bundle changes.

**Tech Stack:** Browser-native HTML/CSS and ES modules, existing `BroadcastChannel`, Node's built-in test runner, Playwright CLI for the two-window verification.

## Global Constraints

- Work in `/Users/zacharyzink/MSFG/Webinars` on the current `deck/v6-html-build` checkout; preserve all unrelated dirty files and concurrent work.
- The only runtime files owned by this plan are `first-time-homebuyer/deck/presenter.html` and `first-time-homebuyer/deck/js/presenter.js`.
- The only test files owned by this plan are the new `first-time-homebuyer/deck/tests/presenter-contract.test.mjs` and the narrow heading assertion in `first-time-homebuyer/deck/tests/presenter-media-registry.test.mjs`.
- Do not modify audience slide content, presenter media ownership, popout content, calculator fields, calculator arithmetic, overlay geometry, annotations other than the `D` shortcut, clocks, notes, presentation navigation, PowerPoint output, or deployment state.
- Keep all presenter media and educational popout actions visible; do not add drawers, tabs, carousels, or simultaneous audience overlays.
- Use only the existing MSFG palette and typefaces. Add no framework, build step, remote dependency, icon library, gradient, or animation.
- The calculator remains shared-deck authoritative and presenter-private. It must not appear in audience navigation.
- The `D` shortcut must not fire from text-entry contexts, modified key events, or repeated keydown events.
- Do not deploy production in this plan. Deployment requires a separate, explicit approval after verified local review.
- Because the two runtime files already contain approved uncommitted work, do not commit them unless the controller confirms that staging includes only this plan's intended hunks. When safe isolation is impossible, leave implementation uncommitted and record the verification instead of bundling unrelated changes.

## File Structure

- `first-time-homebuyer/deck/presenter.html` — top-bar calculator icon, two-column library markup, visible `D` keycap, and private presenter CSS.
- `first-time-homebuyer/deck/js/presenter.js` — slide-specific list rendering, calculator accessible-state synchronization, and guarded drawing shortcut.
- `first-time-homebuyer/deck/tests/presenter-contract.test.mjs` — static layout, accessible-state, message, and keyboard contracts.
- `first-time-homebuyer/deck/tests/presenter-media-registry.test.mjs` — existing media registry and the updated visible `Graphics` heading contract.
- `docs/superpowers/validation/2026-08-13-presenter-quick-controls.md` — final test and headed-browser evidence; create only after all implementation checks pass.

---

### Task 1: Build the Top-Right Calculator Utility and Two-Column Action Library

**Files:**
- Modify: `first-time-homebuyer/deck/presenter.html:14-81,85-170`
- Modify: `first-time-homebuyer/deck/js/presenter.js:21-64,121-134`
- Create: `first-time-homebuyer/deck/tests/presenter-contract.test.mjs`
- Modify: `first-time-homebuyer/deck/tests/presenter-media-registry.test.mjs:74-78`

**Interfaces:**
- Consumes: existing `#p-calculator`, `#p-popouts`, `#p-popout-count`, `#p-media-section`, `#p-media-list`, `#p-media-count`, `MODALS`, `mediaForSlide(slideId)`, and channel messages `{ type: 'open', id }`, `{ type: 'open-media', id }`, `{ type: 'calculator-visibility', visible }`, and `{ type: 'calculator-state', visible }`.
- Produces: `#p-library-grid`, `#p-popout-section`, `#p-media-section`, icon-only `#p-calculator`, `.p-library-grid.is-single`, and synchronized calculator `aria-label`, `title`, `aria-pressed`, and `.on`.

- [ ] **Step 1: Capture the owned-file baseline**

Run:

```bash
cd /Users/zacharyzink/MSFG/Webinars
git status --short -- \
  first-time-homebuyer/deck/presenter.html \
  first-time-homebuyer/deck/js/presenter.js \
  first-time-homebuyer/deck/tests/presenter-contract.test.mjs \
  first-time-homebuyer/deck/tests/presenter-media-registry.test.mjs
git diff -- \
  first-time-homebuyer/deck/presenter.html \
  first-time-homebuyer/deck/js/presenter.js \
  first-time-homebuyer/deck/tests/presenter-media-registry.test.mjs
```

Expected: `presenter.html` and `presenter.js` are already modified and the tests directory is untracked in the current approved working baseline. Preserve those changes; do not reset, stash, or overwrite them.

- [ ] **Step 2: Write the failing presenter layout contracts**

Create `first-time-homebuyer/deck/tests/presenter-contract.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('calculator is an icon-only utility at the end of the top presenter bar', async () => {
  const [html, source] = await Promise.all([read('presenter.html'), read('js/presenter.js')]);
  const bar = html.match(/<header class="p-bar">([\s\S]*?)<\/header>/)?.[1] || '';
  const button = html.match(/<button[^>]*id="p-calculator"[^>]*>([\s\S]*?)<\/button>/)?.[1] || '';

  assert.ok(bar.indexOf('class="p-clocks"') < bar.indexOf('id="p-calculator"'));
  assert.match(button, /<svg/);
  assert.doesNotMatch(button, /Show calculator|Hide calculator/);
  assert.match(source, /const label = calculatorVisible \? 'Hide calculator' : 'Show calculator'/);
  assert.match(source, /button\.setAttribute\('aria-label', label\)/);
  assert.match(source, /button\.setAttribute\('title', label\)/);
  assert.match(source, /button\.setAttribute\('aria-pressed', String\(calculatorVisible\)\)/);
  assert.match(source, /button\.classList\.toggle\('on', calculatorVisible\)/);
});

test('popouts precede graphics in one responsive action library', async () => {
  const [html, source] = await Promise.all([read('presenter.html'), read('js/presenter.js')]);

  assert.match(html, /id="p-library-grid"/);
  assert.ok(html.indexOf('id="p-popout-section"') < html.indexOf('id="p-media-section"'));
  assert.match(html, />Popouts \(<span id="p-popout-count">0<\/span>\)</);
  assert.match(html, />Graphics \(<span id="p-media-count">0<\/span>\)</);
  assert.match(html, /\.p-right\s*\{[^}]*container-type:\s*inline-size/s);
  assert.match(html, /\.p-library-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s);
  assert.match(html, /\.p-library-grid\.is-single\s*\{[^}]*grid-template-columns:\s*1fr/s);
  assert.match(html, /@container\s*\(max-width:\s*420px\)\s*\{[\s\S]*?\.p-library-grid\s*\{[^}]*grid-template-columns:\s*1fr/s);
  assert.match(source, /library\.classList\.toggle\('is-single', media\.length === 0\)/);
});

test('existing popout, media, and calculator channel messages remain intact', async () => {
  const source = await read('js/presenter.js');

  assert.match(source, /type:\s*'open',\s*id/);
  assert.match(source, /type:\s*'open-media',\s*id:\s*item\.id/);
  assert.match(source, /type:\s*'calculator-visibility',\s*visible:\s*!calculatorVisible/);
  assert.match(source, /type === 'calculator-state'/);
});
```

In `first-time-homebuyer/deck/tests/presenter-media-registry.test.mjs`, replace the final heading test with:

```js
test('presenter labels registered media as graphics in the shared action library', () => {
  const source = readFileSync(new URL('../presenter.html', import.meta.url), 'utf8');
  assert.match(source, /Graphics \(<span id="p-media-count">0<\/span>\)/);
  assert.doesNotMatch(source, /Slide 2 graphs|Optional visuals/);
});
```

- [ ] **Step 3: Run the focused tests to verify RED**

Run:

```bash
cd /Users/zacharyzink/MSFG/Webinars/first-time-homebuyer/deck
node --no-warnings --test \
  tests/presenter-contract.test.mjs \
  tests/presenter-media-registry.test.mjs \
  tests/calculator-contract.test.mjs
```

Expected: the new layout tests fail because the calculator is still a text button in the preview row, the lists are still separate vertical sections, the media heading is still `Optional visuals`, and calculator accessible labels are not synchronized through the icon state renderer. Existing registry and calculator ownership tests continue passing.

- [ ] **Step 4: Move the calculator icon into the presenter top bar**

In `presenter.html`, place this immediately after `.p-clocks` and before `</header>`:

```html
<button class="p-utility-icon" id="p-calculator" type="button"
  aria-label="Show calculator" title="Show calculator" aria-pressed="false">
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <rect x="5" y="3" width="14" height="18" rx="2"></rect>
    <path d="M8 7h8M8 11h2M12 11h2M16 11h1M8 15h2M12 15h2M16 15h1M8 18h2M12 18h5"></path>
  </svg>
</button>
```

Remove the existing calculator text button from the tool row beneath the preview. Add these presenter-only rules alongside `.p-tools`:

```css
.p-utility-icon { width: 36px; height: 36px; flex: 0 0 36px; display: grid; place-items: center;
  padding: 0; border-radius: 4px; }
.p-utility-icon svg { width: 19px; height: 19px; fill: none; stroke: currentColor;
  stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.p-utility-icon.on { color: #0C3335; background: #8cc63E; border-color: #8cc63E; }
```

In `presenter.js`, replace `renderCalculatorState` with:

```js
function renderCalculatorState(nextVisible) {
  calculatorVisible = Boolean(nextVisible);
  const button = $('#p-calculator');
  const label = calculatorVisible ? 'Hide calculator' : 'Show calculator';
  button.classList.toggle('on', calculatorVisible);
  button.setAttribute('aria-label', label);
  button.setAttribute('title', label);
  button.setAttribute('aria-pressed', String(calculatorVisible));
}
```

Do not assign `textContent` to the icon button; that would remove the inline SVG.

- [ ] **Step 5: Build the two-column Popout and Graphic action library**

In `presenter.html`, replace the separate media and popout blocks with:

```html
<div class="p-library-grid" id="p-library-grid">
  <section class="p-library-column" id="p-popout-section">
    <div class="p-h">Popouts (<span id="p-popout-count">0</span>)</div>
    <ul class="p-action-list" id="p-popouts"></ul>
  </section>
  <section class="p-library-column" id="p-media-section" hidden>
    <div class="p-h">Graphics (<span id="p-media-count">0</span>)</div>
    <ul class="p-action-list" id="p-media-list"></ul>
  </section>
</div>
```

Replace the `.p-popouts` list rules with:

```css
.p-right { container-type: inline-size; }
.p-library-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px; align-items: start; margin-top: 14px; }
.p-library-grid.is-single { grid-template-columns: 1fr; }
.p-library-column { min-width: 0; }
.p-library-column .p-h { margin-top: 0; }
.p-action-list { display: grid; gap: 6px; }
.p-action-list button { width: 100%; min-height: 38px; padding: 8px 11px;
  border-left: 3px solid rgba(140,198,62,.45); border-radius: 3px;
  text-align: left; font-size: 14px; line-height: 1.25; }
.p-action-list button:hover { border-left-color: #8cc63E; }
@container (max-width: 420px) {
  .p-library-grid { grid-template-columns: 1fr; }
}
```

Keep the existing `.p-none` rule. In `presenter.js`, obtain the library beside the existing media section and toggle the single-column class after media is loaded:

```js
const library = $('#p-library-grid');
const section = $('#p-media-section');
const mediaList = $('#p-media-list');
section.hidden = media.length === 0;
library.classList.toggle('is-single', media.length === 0);
```

Retain all existing loops and message payloads. A graphics-only slide must continue rendering `No popouts on this slide` in the left column; a slide with no graphics hides only the right column.

- [ ] **Step 6: Run focused and full tests to verify GREEN**

Run:

```bash
cd /Users/zacharyzink/MSFG/Webinars/first-time-homebuyer/deck
node --no-warnings --test \
  tests/presenter-contract.test.mjs \
  tests/presenter-media-registry.test.mjs \
  tests/calculator-contract.test.mjs
node --no-warnings --test tests/*.test.mjs
node --check js/presenter.js
git diff --check -- presenter.html js/presenter.js tests/presenter-contract.test.mjs tests/presenter-media-registry.test.mjs
```

Expected: all focused and full tests pass; JavaScript syntax and whitespace checks emit no errors.

- [ ] **Step 7: Review the Task 1 diff and checkpoint safely**

Run:

```bash
cd /Users/zacharyzink/MSFG/Webinars
git diff -- \
  first-time-homebuyer/deck/presenter.html \
  first-time-homebuyer/deck/js/presenter.js \
  first-time-homebuyer/deck/tests/presenter-contract.test.mjs \
  first-time-homebuyer/deck/tests/presenter-media-registry.test.mjs
```

Expected: only the icon, action-library, synchronized label, and narrow test changes described above appear on top of the preserved baseline. Request an independent requirements and code-quality review before Task 2. Do not commit if the diff includes earlier approved work that cannot be separated safely.

If and only if the controller confirms the owned hunks can be staged without unrelated changes:

```bash
git add -p -- \
  first-time-homebuyer/deck/presenter.html \
  first-time-homebuyer/deck/js/presenter.js
git add -- \
  first-time-homebuyer/deck/tests/presenter-contract.test.mjs \
  first-time-homebuyer/deck/tests/presenter-media-registry.test.mjs
git diff --cached --check
git commit -m 'feat: streamline presenter action library'
```

---

### Task 2: Add the Guarded `D` Drawing Shortcut

**Files:**
- Modify: `first-time-homebuyer/deck/presenter.html:45-59,129-153`
- Modify: `first-time-homebuyer/deck/js/presenter.js:112-119,148-155,188-217`
- Modify: `first-time-homebuyer/deck/tests/presenter-contract.test.mjs`

**Interfaces:**
- Consumes: existing `ann(msg)`, `annOn`, `setAnnOn(on)`, `#p-annon`, `annotate` channel messages, and current Arrow Left, Arrow Right, and Space shortcuts.
- Produces: `renderAnnState(on)`, `isTextEntryTarget(target)`, `isDrawShortcut(event)`, `#p-ann-state`, and a visible `<kbd>D</kbd>` keycap.

- [ ] **Step 1: Add the failing drawing-shortcut contract**

Append to `tests/presenter-contract.test.mjs`:

```js
test('D toggles drawing through the existing state path and stays out of text entry', async () => {
  const [html, source] = await Promise.all([read('presenter.html'), read('js/presenter.js')]);

  assert.match(html, /id="p-annon"[^>]*aria-pressed="false"/);
  assert.match(html, /id="p-ann-state">Off<\/span>/);
  assert.match(html, /<kbd[^>]*>D<\/kbd>/);
  assert.match(source, /function renderAnnState\(on\)/);
  assert.match(source, /function isTextEntryTarget\(target\)/);
  assert.match(source, /function isDrawShortcut\(event\)/);
  assert.match(source, /event\.key\.toLowerCase\(\) === 'd'/);
  assert.match(source, /!event\.repeat/);
  assert.match(source, /!event\.ctrlKey/);
  assert.match(source, /!event\.altKey/);
  assert.match(source, /!event\.metaKey/);
  assert.match(source, /!isTextEntryTarget\(event\.target\)/);
  assert.match(source, /if \(isDrawShortcut\(e\)\)[\s\S]*setAnnOn\(!annOn\)/);
  assert.match(source, /if \(e\.key === 'ArrowRight' \|\| e\.key === ' '\)/);
  assert.match(source, /if \(e\.key === 'ArrowLeft'\)/);
});
```

- [ ] **Step 2: Run the focused contract to verify RED**

Run:

```bash
cd /Users/zacharyzink/MSFG/Webinars/first-time-homebuyer/deck
node --no-warnings --test tests/presenter-contract.test.mjs
```

Expected: only the new shortcut contract fails because no keycap, state renderer, or guarded `D` predicate exists yet.

- [ ] **Step 3: Make the drawing button state-safe and show the keycap**

Replace the drawing toggle markup in `presenter.html` with:

```html
<button id="p-annon" data-annon title="Toggle drawing on the shared slide" aria-pressed="false">
  <span>Draw: <span id="p-ann-state">Off</span></span><kbd>D</kbd>
</button>
```

Add:

```css
#p-annon { display: inline-flex; align-items: center; gap: 8px; }
#p-annon kbd { min-width: 20px; padding: 1px 5px; border: 1px solid currentColor;
  border-radius: 3px; font: 700 10px/1.5 var(--font-display); text-align: center; }
```

In `presenter.js`, replace the direct button text mutations with:

```js
function renderAnnState(on) {
  annOn = Boolean(on);
  const button = $('#p-annon');
  $('#p-ann-state').textContent = annOn ? 'On' : 'Off';
  button.classList.toggle('on', annOn);
  button.setAttribute('aria-pressed', String(annOn));
}

function setAnnOn(on) {
  renderAnnState(on);
  ann({ on: annOn });
  if (!annOn) {
    barOn = false;
    const toolbar = $('#p-anntoolbar');
    if (toolbar) {
      toolbar.textContent = 'On-slide tools: Off';
      toolbar.classList.remove('on');
    }
  }
}
```

In `channel.onmessage`, replace the `annstate` text assignments with `renderAnnState(e.data.on)`.

- [ ] **Step 4: Add the guarded shortcut without changing navigation keys**

Add above `initPresenter`:

```js
function isTextEntryTarget(target) {
  return target instanceof Element && (
    target.matches('input, textarea, select') ||
    target.isContentEditable ||
    Boolean(target.closest('[contenteditable="true"]'))
  );
}

function isDrawShortcut(event) {
  return event.key.toLowerCase() === 'd' &&
    !event.repeat &&
    !event.ctrlKey &&
    !event.altKey &&
    !event.metaKey &&
    !isTextEntryTarget(event.target);
}
```

Replace the existing presenter `keydown` listener with:

```js
document.addEventListener('keydown', e => {
  if (isDrawShortcut(e)) {
    e.preventDefault();
    setAnnOn(!annOn);
    return;
  }
  if (e.target instanceof Element &&
      (e.target.matches('button, textarea, input, select') || e.target.isContentEditable)) return;
  if (e.key === 'ArrowRight' || e.key === ' ') {
    e.preventDefault();
    channel.postMessage({ type: 'next' });
  }
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    channel.postMessage({ type: 'prev' });
  }
});
```

Do not block `Shift`; browsers report uppercase `D` while `event.key.toLowerCase()` still resolves to `d`. The shortcut therefore accepts both `d` and `D` but rejects Ctrl-, Alt-, and Meta-modified variants.

- [ ] **Step 5: Run focused and full tests to verify GREEN**

Run:

```bash
cd /Users/zacharyzink/MSFG/Webinars/first-time-homebuyer/deck
node --no-warnings --test tests/presenter-contract.test.mjs tests/calculator-contract.test.mjs
node --no-warnings --test tests/*.test.mjs
node --check js/presenter.js
git diff --check -- presenter.html js/presenter.js tests/presenter-contract.test.mjs
```

Expected: the shortcut and regression contracts pass, the full deck suite passes, and syntax/whitespace checks emit no errors.

- [ ] **Step 6: Review the Task 2 diff and checkpoint safely**

Run:

```bash
cd /Users/zacharyzink/MSFG/Webinars
git diff -- \
  first-time-homebuyer/deck/presenter.html \
  first-time-homebuyer/deck/js/presenter.js \
  first-time-homebuyer/deck/tests/presenter-contract.test.mjs
```

Expected: the delta from Task 1 is limited to the keycap, drawing state renderer, guarded shortcut predicates, and keydown branch. Request an independent requirements and code-quality review before browser verification.

If and only if the controller confirms clean hunk isolation:

```bash
git add -p -- \
  first-time-homebuyer/deck/presenter.html \
  first-time-homebuyer/deck/js/presenter.js \
  first-time-homebuyer/deck/tests/presenter-contract.test.mjs
git diff --cached --check
git commit -m 'feat: add presenter drawing shortcut'
```

---

### Task 3: Verify the Real Presenter and Audience Workflow

**Files:**
- Create: `docs/superpowers/validation/2026-08-13-presenter-quick-controls.md`
- Verify only: `first-time-homebuyer/deck/presenter.html`
- Verify only: `first-time-homebuyer/deck/js/presenter.js`
- Verify only: `first-time-homebuyer/deck/content/presenter-media.js`

**Interfaces:**
- Consumes: completed Task 1 and Task 2 presenter UI, existing audience `index.html`, and `BroadcastChannel('msfg-deck')`.
- Produces: browser evidence for layout, calculator synchronization, slide-specific actions, guarded `D`, navigation regression, responsive stacking, and zero product console errors.

- [ ] **Step 1: Run the complete static verification gate**

Run:

```bash
cd /Users/zacharyzink/MSFG/Webinars/first-time-homebuyer/deck
node --no-warnings --test tests/*.test.mjs
for file in content/*.js js/*.js; do node --check "$file" || exit 1; done
git diff --check
```

Expected: all tests, all JavaScript syntax checks, and the whitespace check pass.

- [ ] **Step 2: Start an isolated local server and presenter session**

First confirm the browser wrapper prerequisite:

```bash
command -v npx >/dev/null 2>&1
```

Choose an unused port rather than stopping a pre-existing server:

```bash
cd /Users/zacharyzink/MSFG/Webinars/first-time-homebuyer/deck
python3 -m http.server 4175 --bind 127.0.0.1
```

In a separate terminal:

```bash
PWCLI=/Users/zacharyzink/.codex/skills/playwright/scripts/playwright_cli.sh
"$PWCLI" -s=presenter-quick open 'http://127.0.0.1:4175/index.html#myths' --headed
"$PWCLI" -s=presenter-quick resize 1280 800
"$PWCLI" -s=presenter-quick snapshot
```

Expected: the audience deck opens on `#myths` without console errors. Open Presenter View from the fresh snapshot and keep the two same-origin pages in the same browser session.

- [ ] **Step 3: Verify the calculator icon and two-column library at desktop width**

At `1280×800` presenter viewport:

1. Confirm the calculator is a small icon at the far right of the top bar and contains no visible show/hide text.
2. Confirm its accessible state is `Show calculator`, `aria-pressed=false`.
3. Confirm `Popouts (5)` is left of `Graphics (5)` on Slide 2 and every entry is a compact button.
4. Click one Popout button and verify the audience opens the matching educational popout.
5. Close it, click one Graphic button, and verify the audience opens the matching PNG only after selection.
6. Click the calculator icon and verify the audience calculator opens; confirm the icon changes to `Hide calculator`, `aria-pressed=true`, and green active styling.
7. Close the calculator from the audience and verify the presenter icon returns to `Show calculator`, `aria-pressed=false`.

Expected: all existing channel behaviors and labels remain synchronized.

- [ ] **Step 4: Verify single-column and responsive library states**

Use presenter navigation to reach a slide with no registered graphics. Confirm the Graphics section is hidden and Popouts occupy the available library width. Return to Slide 2, resize the presenter so the right-column container is at most `420px`, and confirm Popouts stack above Graphics without changing the audience layout.

Expected: categories never reverse order; the empty graph column never consumes space.

- [ ] **Step 5: Verify `D` drawing behavior and shortcut guards**

With focus outside text entry:

1. Press `D`; verify the presenter button reads `Draw: On`, `aria-pressed=true`, and the audience annotation state turns on.
2. Press `d`; verify both return to Off.
3. Focus the personal-note textarea, type `D`, and confirm the character appears without toggling drawing.
4. Dispatch or press Ctrl+D, Alt+D where supported, Meta+D where supported, and a repeated `keydown`; confirm none toggles drawing. Avoid browser-bookmark side effects by using a focused browser evaluation for the guarded modified/repeat event cases if necessary.
5. Focus a normal presenter button and press `D`; confirm drawing toggles, because only text-entry contexts suppress it.

Expected: visible state, `aria-pressed`, and audience annotation state agree after every accepted toggle.

- [ ] **Step 6: Verify existing navigation shortcuts and console health**

With focus outside controls, press Arrow Right, Arrow Left, and Space and verify the same next/previous behavior as the baseline. Query console messages at error and warning levels.

Expected: navigation remains intact and there are zero product errors or warnings.

- [ ] **Step 7: Capture and inspect the presenter evidence**

Capture under `first-time-homebuyer/deck/output/playwright/`:

- `presenter-quick-controls-1280x800.png` — top-right calculator icon and side-by-side Popouts/Graphics.
- `presenter-quick-controls-narrow.png` — Popouts stacked above Graphics.

Visually inspect both images. The desktop layout must be readable without excessive vertical whitespace; the calculator must be small but clearly interactive; the narrow layout must not clip action labels.

- [ ] **Step 8: Record validation and clean only owned processes**

Create `docs/superpowers/validation/2026-08-13-presenter-quick-controls.md` containing:

- exact test and syntax commands with pass totals;
- desktop and narrow presenter dimensions;
- calculator open/close synchronization evidence;
- Popout and Graphic message/selection evidence;
- accepted and suppressed `D` shortcut cases;
- navigation regression results;
- console results;
- screenshot paths and visual findings;
- exact local-server PID and confirmation that only that process and the `presenter-quick` browser session were stopped;
- explicit statement that no deployment or PowerPoint build occurred.

Stop only the local server and Playwright session started by this task. Do not stop a pre-existing port owner.

- [ ] **Step 9: Final review and optional documentation checkpoint**

Request an independent final review of the two runtime files, two test files, validation report, and screenshots. Resolve every Critical or Important finding and rerun the complete gate.

If the validation document is clean and staging does not capture unrelated work:

```bash
cd /Users/zacharyzink/MSFG/Webinars
git add -- docs/superpowers/validation/2026-08-13-presenter-quick-controls.md
git diff --cached --check
git commit -m 'docs: verify presenter quick controls'
```

Expected: final review PASS, no open Critical or Important findings, and production remains unchanged.

## Completion Criteria

- [ ] The calculator is a persistent, icon-only `36px × 36px` control at the far right of the presenter top bar on every slide.
- [ ] Calculator `aria-label`, `title`, `aria-pressed`, and active styling synchronize with the shared audience calculator state.
- [ ] Popouts render left of Graphics as compact action buttons in a two-column presenter library and stack in that order at narrow width.
- [ ] Slides without graphics hide the Graphics column and expand Popouts; graphics-only slides retain the concise left-column empty state.
- [ ] `D` and `d` toggle drawing through `setAnnOn`, while text entry, Ctrl/Alt/Meta-modified keys, and repeated events do not.
- [ ] Arrow Left, Arrow Right, and Space navigation remain unchanged.
- [ ] Existing popout, graphic, calculator, notes, clocks, navigation, and annotation channel contracts remain intact.
- [ ] Full tests, syntax checks, diff checks, headed two-window browser verification, visual inspection, and final independent review pass.
- [ ] No PowerPoint build or production deployment occurs without separate approval.
