# Interactive LE/CD Free-Exploration Webinar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static webinar viewer in `cd-webinar/` that displays the exact three-page CFPB Loan Estimate and five-page CFPB Closing Disclosure samples and explains any populated fee or important field the learner selects, without a required sequence.

**Architecture:** Export the matched CFPB PDF form pages to deterministic high-resolution PNG assets and place semantic button hotspots above them using normalized page coordinates. Native ES modules separate document metadata, educational content, state transitions, fit/zoom geometry, and DOM rendering; Node's built-in test runner validates pure logic and content, while Playwright CLI verifies the complete browser experience.

**Tech Stack:** Static HTML5, CSS, native JavaScript ES modules, Node.js 24 built-in test runner, Python 3 HTTP server, Poppler 25 PDF utilities, Playwright CLI, no package installation and no runtime backend.

**Spec:** `docs/superpowers/specs/2026-08-27-interactive-le-cd-free-exploration-design.md`

## Global Constraints

- The learner can open any of the three LE pages and five CD pages directly and in any order.
- Do not add previous/next lesson controls, required order, progress tracking, a quiz, completion state, or presenter-controlled progression.
- Use only the matched fictional CFPB H24B Loan Estimate and H25B Closing Disclosure samples in the first release.
- Render the actual disclosure pages as high-resolution images; do not reconstruct, edit, recolor, or restyle the forms as HTML.
- Exclude each source PDF's cover page. PDF pages 2-4 become LE Pages 1-3; PDF pages 2-6 become CD Pages 1-5.
- Every populated fee and every important teaching field must be selectable. The printed label and its amount must resolve to the same explanation ID.
- Unselected disclosures remain visually clean. Show the soft green outline only on hover, keyboard focus, or selection; do not add always-visible pins or dots.
- Each learner-facing explanation is one plain-English paragraph that describes what the item is, why it is part of the mortgage process, and what the borrower should understand.
- Store educational copy, hotspot coordinates, source metadata, and review status separately from DOM rendering logic.
- Store hotspot bounds as normalized `x`, `y`, `width`, and `height` values in the inclusive range `0..1`.
- Fit and zoom the page image and hotspot layer through one shared coordinate container so they cannot drift apart.
- Use semantic buttons for hotspots, logical form reading order for keyboard navigation, Enter/Space activation, Escape dismissal, visible focus, focus restoration, and non-color selection cues.
- Wide screens use left page navigation, center disclosure, and right explanation panel. Narrow screens use a compact page selector and viewport-safe explanation bottom sheet.
- The static viewer must not collect, upload, log, or persist borrower data or learner selections.
- No backend, database, login, account, cookies, analytics, editable calculator, scenario selector, tolerance ruling, or public deployment is included.
- Identify the documents as fictional CFPB samples and show the educational-use disclaimer from the spec.
- Do not mark content as compliance-approved without an actual MSFG mortgage/compliance reviewer and review date.
- Work only in the exact `cd-webinar/` and new-plan paths. Preserve unrelated dirty files and do not stash, reset, reformat, or stage them.
- Use an isolated worktree at execution time because the source repository currently contains unrelated dirty and untracked work. Copy only the two selected source PDFs into that worktree and verify their hashes before continuing.

---

## File Structure

### Source and generated assets

- `cd-webinar/references/loan-estimate-H24B.pdf` — pinned matched CFPB LE source.
- `cd-webinar/references/closing-disclosure-H25B.pdf` — pinned matched CFPB CD source.
- `cd-webinar/references/source-manifest.json` — filenames, hashes, page mappings, and provenance.
- `cd-webinar/scripts/render-disclosures.sh` — deterministic Poppler export for the eight form pages.
- `cd-webinar/assets/documents/le-page-1.png` through `le-page-3.png` — rendered LE pages.
- `cd-webinar/assets/documents/cd-page-1.png` through `cd-page-5.png` — rendered CD pages.
- `cd-webinar/assets/brand/logo-horizontal.svg` — copied MSFG horizontal logo used only by the surrounding shell.

### Content

- `cd-webinar/content/documents.js` — document/page catalog, image paths, alternate descriptions, and source-page mappings.
- `cd-webinar/content/explanations.js` — paragraph copy plus source and review metadata keyed by explanation ID.
- `cd-webinar/content/hotspots/le.js` — normalized LE hotspot definitions in reading order.
- `cd-webinar/content/hotspots/cd.js` — normalized CD hotspot definitions in reading order.
- `cd-webinar/content/index.js` — immutable combined content export consumed by the viewer and validators.

### Application

- `cd-webinar/index.html` — static application landmarks, metadata, and module entry point.
- `cd-webinar/js/app.js` — initialization and top-level event wiring.
- `cd-webinar/js/viewer-state.js` — pure reducer for page, selection, and zoom actions.
- `cd-webinar/js/page-geometry.js` — pure fit/zoom calculations and normalized hotspot styling.
- `cd-webinar/js/content-validation.js` — catalog, hotspot, explanation, and review validation.
- `cd-webinar/js/viewer.js` — page navigation, disclosure rendering, hotspot buttons, explanation panel, focus restoration, ResizeObserver, and image failure behavior.
- `cd-webinar/css/tokens.css` — local MSFG shell tokens.
- `cd-webinar/css/base.css` — reset, typography, buttons, visually-hidden utility, and focus treatment.
- `cd-webinar/css/webinar.css` — desktop shell, document stage, hotspots, controls, and explanation panel.
- `cd-webinar/css/responsive.css` — tablet/mobile navigator and bottom-sheet behavior.

### Verification and documentation

- `cd-webinar/tests/document-assets.test.mjs` — source hashes, page mappings, and PNG dimensions.
- `cd-webinar/tests/content-validation.test.mjs` — schema failure cases and development/release review rules.
- `cd-webinar/tests/content-completeness.test.mjs` — exact page-by-page target inventory.
- `cd-webinar/tests/viewer-state.test.mjs` — selection clearing and zoom transitions.
- `cd-webinar/tests/page-geometry.test.mjs` — fit, zoom, and hotspot coordinate math.
- `cd-webinar/tests/browser-audit.run.js` — viewport, interaction, alignment, error-state, and accessibility checks.
- `cd-webinar/tests/run-browser-audit.sh` — owned static server and Playwright CLI lifecycle.
- `cd-webinar/tests/release-readiness.test.mjs` — source/reviewer approval gate.
- `cd-webinar/README.md` — local preview, controls, source generation, content authoring, tests, and boundaries.
- `cd-webinar/CONTENT-REVIEW.md` — reviewer checklist and evidence record.

---

### Task 1: Pin and Render the Matched CFPB Disclosure Assets

**Files:**
- Create: `cd-webinar/references/loan-estimate-H24B.pdf`
- Create: `cd-webinar/references/closing-disclosure-H25B.pdf`
- Create: `cd-webinar/references/source-manifest.json`
- Create: `cd-webinar/scripts/render-disclosures.sh`
- Create: `cd-webinar/assets/documents/le-page-1.png`
- Create: `cd-webinar/assets/documents/le-page-2.png`
- Create: `cd-webinar/assets/documents/le-page-3.png`
- Create: `cd-webinar/assets/documents/cd-page-1.png`
- Create: `cd-webinar/assets/documents/cd-page-2.png`
- Create: `cd-webinar/assets/documents/cd-page-3.png`
- Create: `cd-webinar/assets/documents/cd-page-4.png`
- Create: `cd-webinar/assets/documents/cd-page-5.png`
- Create: `cd-webinar/tests/document-assets.test.mjs`

**Interfaces:**
- Produces: eight `1530x1980` PNG images at 180 DPI.
- Produces: `source-manifest.json` with `{ id, file, sha256, pdfPages, formPages, pageMap }`.
- Consumed by: `content/documents.js` in Task 2 and browser rendering in Task 5.

- [ ] **Step 1: Write the failing source and image test**

Create `cd-webinar/tests/document-assets.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const expectedHashes = {
  le: '243551dbce6362e616328924eaf5b1818b734883d43ec91a73c160e5da52b385',
  cd: '606a93c8baaca815439822df5cf8c78cbb2dcf6cc4af5aa291a459c7917e4173',
};

const pngSize = data => ({
  width: data.readUInt32BE(16),
  height: data.readUInt32BE(20),
});

test('the matched source PDFs are hash-pinned', async () => {
  const manifest = JSON.parse(await readFile(new URL('references/source-manifest.json', root)));
  assert.deepEqual(manifest.documents.map(item => item.id), ['le', 'cd']);
  for (const item of manifest.documents) {
    const data = await readFile(new URL(`references/${item.file}`, root));
    assert.equal(createHash('sha256').update(data).digest('hex'), expectedHashes[item.id]);
  }
});

test('the eight form pages are rendered at the approved size', async () => {
  for (const [prefix, count] of [['le', 3], ['cd', 5]]) {
    for (let page = 1; page <= count; page += 1) {
      const data = await readFile(new URL(`assets/documents/${prefix}-page-${page}.png`, root));
      assert.deepEqual(pngSize(data), { width: 1530, height: 1980 });
    }
  }
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
node --test cd-webinar/tests/document-assets.test.mjs
```

Expected: FAIL because the pinned references, manifest, and rendered pages do not exist.

- [ ] **Step 3: Copy and verify only the approved source pair**

From the isolated worktree, copy the two user-supplied files from the original workspace:

```bash
mkdir -p cd-webinar/references
cp '/Users/zacharyzink/MSFG/Webinars/cd-webinar/CD Webinar/201403_cfpb_loan-estimate_fixed-rate-loan-sample-H24B.pdf' cd-webinar/references/loan-estimate-H24B.pdf
cp '/Users/zacharyzink/MSFG/Webinars/cd-webinar/CD Webinar/201403_cfpb_closing-disclosure_cover-H25B.pdf' cd-webinar/references/closing-disclosure-H25B.pdf
shasum -a 256 cd-webinar/references/loan-estimate-H24B.pdf cd-webinar/references/closing-disclosure-H25B.pdf
```

Expected hashes, in order:

```text
243551dbce6362e616328924eaf5b1818b734883d43ec91a73c160e5da52b385
606a93c8baaca815439822df5cf8c78cbb2dcf6cc4af5aa291a459c7917e4173
```

- [ ] **Step 4: Create the exact source manifest**

Create `cd-webinar/references/source-manifest.json`:

```json
{
  "renderDpi": 180,
  "documents": [
    {
      "id": "le",
      "file": "loan-estimate-H24B.pdf",
      "sha256": "243551dbce6362e616328924eaf5b1818b734883d43ec91a73c160e5da52b385",
      "pdfPages": 4,
      "formPages": 3,
      "pageMap": { "1": 2, "2": 3, "3": 4 }
    },
    {
      "id": "cd",
      "file": "closing-disclosure-H25B.pdf",
      "sha256": "606a93c8baaca815439822df5cf8c78cbb2dcf6cc4af5aa291a459c7917e4173",
      "pdfPages": 6,
      "formPages": 5,
      "pageMap": { "1": 2, "2": 3, "3": 4, "4": 5, "5": 6 }
    }
  ]
}
```

- [ ] **Step 5: Write the deterministic rendering script**

Create `cd-webinar/scripts/render-disclosures.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
webinar_dir=$(cd -- "$script_dir/.." && pwd)
asset_dir="$webinar_dir/assets/documents"
render_dir=$(mktemp -d)
trap 'rm -rf -- "$render_dir"' EXIT

mkdir -p "$asset_dir"
pdftoppm -png -r 180 -f 2 -l 4 "$webinar_dir/references/loan-estimate-H24B.pdf" "$render_dir/le"
pdftoppm -png -r 180 -f 2 -l 6 "$webinar_dir/references/closing-disclosure-H25B.pdf" "$render_dir/cd"

for mapping in '2:1' '3:2' '4:3'; do
  source_page=${mapping%%:*}
  form_page=${mapping##*:}
  cp "$render_dir/le-$source_page.png" "$asset_dir/le-page-$form_page.png"
done

for mapping in '2:1' '3:2' '4:3' '5:4' '6:5'; do
  source_page=${mapping%%:*}
  form_page=${mapping##*:}
  cp "$render_dir/cd-$source_page.png" "$asset_dir/cd-page-$form_page.png"
done
```

- [ ] **Step 6: Render, verify, and commit the assets**

Run:

```bash
chmod +x cd-webinar/scripts/render-disclosures.sh
cd-webinar/scripts/render-disclosures.sh
node --test cd-webinar/tests/document-assets.test.mjs
```

Expected: 2 tests PASS and exactly eight form images exist.

Commit:

```bash
git add -- cd-webinar/references cd-webinar/scripts cd-webinar/assets/documents cd-webinar/tests/document-assets.test.mjs
git commit -m 'chore: pin and render LE CD sample pages'
```

---

### Task 2: Define the Document Catalog and Content Validation Contracts

**Files:**
- Create: `cd-webinar/content/documents.js`
- Create: `cd-webinar/content/explanations.js`
- Create: `cd-webinar/content/hotspots/le.js`
- Create: `cd-webinar/content/hotspots/cd.js`
- Create: `cd-webinar/content/index.js`
- Create: `cd-webinar/js/content-validation.js`
- Create: `cd-webinar/tests/content-validation.test.mjs`

**Interfaces:**
- Produces: `DOCUMENTS: readonly DocumentDefinition[]`.
- Produces: `EXPLANATIONS: Readonly<Record<string, Explanation>>`.
- Produces: `HOTSPOTS: readonly Hotspot[]`.
- Produces: `validateContent({ DOCUMENTS, EXPLANATIONS, HOTSPOTS, release }): string[]`.
- Produces: `getRenderableHotspots({ DOCUMENTS, EXPLANATIONS, HOTSPOTS }): Hotspot[]`, which skips malformed or duplicate records without breaking the page.
- Consumed by: Task 4's viewer and Task 6's completeness test.

- [ ] **Step 1: Write failing contract tests**

Create `cd-webinar/tests/content-validation.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { DOCUMENTS, EXPLANATIONS, HOTSPOTS } from '../content/index.js';
import { getRenderableHotspots, validateContent } from '../js/content-validation.js';

test('catalog contains the exact eight disclosure pages', () => {
  assert.deepEqual(DOCUMENTS.map(item => [item.id, item.pages.length]), [['le', 3], ['cd', 5]]);
  assert.deepEqual(DOCUMENTS.flatMap(item => item.pages.map(page => page.id)),
    ['le-1', 'le-2', 'le-3', 'cd-1', 'cd-2', 'cd-3', 'cd-4', 'cd-5']);
});

test('the vertical-slice content is valid for local preview', () => {
  assert.deepEqual(validateContent({ DOCUMENTS, EXPLANATIONS, HOTSPOTS, release: false }), []);
});

test('invalid bounds, duplicate ids, and missing copy are reported together', () => {
  const errors = validateContent({
    DOCUMENTS,
    EXPLANATIONS: {},
    HOTSPOTS: [
      { id: 'bad', pageId: 'le-1', readingOrder: 1, bounds: { x: -1, y: 0, width: 1, height: 1 }, explanationId: 'missing', accessibleLabel: '' },
      { id: 'bad', pageId: 'le-1', readingOrder: 1, bounds: { x: 0, y: 0, width: 1, height: 1 }, explanationId: 'missing', accessibleLabel: '' },
    ],
    release: false,
  });
  assert.ok(errors.some(error => error.includes('duplicate hotspot id: bad')));
  assert.ok(errors.some(error => error.includes('outside page bounds')));
  assert.ok(errors.some(error => error.includes('missing explanation: missing')));
  assert.ok(errors.some(error => error.includes('missing accessible label')));
});

test('release validation requires recorded compliance approval', () => {
  const errors = validateContent({ DOCUMENTS, EXPLANATIONS, HOTSPOTS, release: true });
  assert.ok(errors.some(error => error.includes('review status must be approved')));
});

test('runtime filtering skips an invalid hotspot and keeps valid content', () => {
  const invalid = { ...HOTSPOTS[0], id: 'invalid', bounds: { x: -1, y: 0, width: 1, height: 1 } };
  const renderable = getRenderableHotspots({ DOCUMENTS, EXPLANATIONS, HOTSPOTS: [HOTSPOTS[0], invalid] });
  assert.deepEqual(renderable.map(item => item.id), ['le.p1.interest-rate']);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
node --test cd-webinar/tests/content-validation.test.mjs
```

Expected: FAIL because the content modules and validator do not exist.

- [ ] **Step 3: Create the exact page catalog**

Create `cd-webinar/content/documents.js` with immutable objects shaped like:

```js
const pages = (prefix, count, sourcePdf) => Array.from({ length: count }, (_, index) => ({
  id: `${prefix}-${index + 1}`,
  number: index + 1,
  pdfPage: index + 2,
  image: `./assets/documents/${prefix}-page-${index + 1}.png`,
  width: 1530,
  height: 1980,
  alt: `${prefix === 'le' ? 'Loan Estimate' : 'Closing Disclosure'} sample, page ${index + 1} of ${count}`,
  sourcePdf,
}));

export const DOCUMENTS = Object.freeze([
  Object.freeze({ id: 'le', shortLabel: 'LE', title: 'Loan Estimate', pages: Object.freeze(pages('le', 3, './references/loan-estimate-H24B.pdf')) }),
  Object.freeze({ id: 'cd', shortLabel: 'CD', title: 'Closing Disclosure', pages: Object.freeze(pages('cd', 5, './references/closing-disclosure-H25B.pdf')) }),
]);
```

- [ ] **Step 4: Seed the approved Interest Rate vertical slice**

Create `cd-webinar/content/explanations.js`:

```js
export const EXPLANATIONS = Object.freeze({
  'interest-rate': Object.freeze({
    id: 'interest-rate',
    title: 'Interest Rate',
    body: 'The interest rate is the percentage the lender charges for borrowing the principal balance of the loan. It helps determine the monthly principal-and-interest payment and the total interest paid over time, but it is not the same as the annual percentage rate, which also reflects certain loan costs. On this fixed-rate sample, 3.875% does not change during the loan term.',
    source: Object.freeze({ type: 'CFPB sample and Regulation Z', reference: 'H24B Loan Estimate, page 1; 12 CFR 1026.37(b)(2)' }),
    review: Object.freeze({ status: 'pending-msfg', reviewer: '', reviewedOn: '' }),
  }),
});
```

Create `cd-webinar/content/hotspots/le.js` with the initial calibrated target:

```js
export const LE_HOTSPOTS = Object.freeze([
  Object.freeze({
    id: 'le.p1.interest-rate',
    documentId: 'le',
    pageId: 'le-1',
    readingOrder: 12,
    bounds: Object.freeze({ x: 0.052, y: 0.257, width: 0.677, height: 0.029 }),
    fieldLabel: 'Interest Rate',
    value: '3.875%',
    explanationId: 'interest-rate',
    accessibleLabel: 'Interest Rate, 3.875 percent',
  }),
]);
```

Create `cd-webinar/content/hotspots/cd.js`:

```js
export const CD_HOTSPOTS = Object.freeze([]);
```

Create `cd-webinar/content/index.js`:

```js
import { DOCUMENTS } from './documents.js';
import { EXPLANATIONS } from './explanations.js';
import { LE_HOTSPOTS } from './hotspots/le.js';
import { CD_HOTSPOTS } from './hotspots/cd.js';

export { DOCUMENTS, EXPLANATIONS };
export const HOTSPOTS = Object.freeze([...LE_HOTSPOTS, ...CD_HOTSPOTS]);
```

- [ ] **Step 5: Implement aggregated content validation**

Create `cd-webinar/js/content-validation.js` with these exact rules:

```js
const insideUnitInterval = value => Number.isFinite(value) && value >= 0 && value <= 1;

export function validateContent({ DOCUMENTS, EXPLANATIONS, HOTSPOTS, release = false }) {
  const errors = [];
  const pageIds = new Set(DOCUMENTS.flatMap(document => document.pages.map(page => page.id)));
  const hotspotIds = new Set();
  const readingKeys = new Set();

  for (const hotspot of HOTSPOTS) {
    if (hotspotIds.has(hotspot.id)) errors.push(`duplicate hotspot id: ${hotspot.id}`);
    hotspotIds.add(hotspot.id);
    const readingKey = `${hotspot.pageId}:${hotspot.readingOrder}`;
    if (readingKeys.has(readingKey)) errors.push(`duplicate reading order: ${readingKey}`);
    readingKeys.add(readingKey);
    if (!pageIds.has(hotspot.pageId)) errors.push(`unknown page: ${hotspot.pageId}`);
    const { x, y, width, height } = hotspot.bounds ?? {};
    if (![x, y, width, height].every(insideUnitInterval) || x + width > 1 || y + height > 1 || width === 0 || height === 0) {
      errors.push(`hotspot outside page bounds: ${hotspot.id}`);
    }
    if (!hotspot.accessibleLabel?.trim()) errors.push(`missing accessible label: ${hotspot.id}`);
    const explanation = EXPLANATIONS[hotspot.explanationId];
    if (!explanation) errors.push(`missing explanation: ${hotspot.explanationId}`);
    if (release && explanation?.review?.status !== 'approved') {
      errors.push(`review status must be approved: ${hotspot.explanationId}`);
    }
  }
  return [...new Set(errors)];
}

export function getRenderableHotspots({ DOCUMENTS, EXPLANATIONS, HOTSPOTS }) {
  const pageIds = new Set(DOCUMENTS.flatMap(document => document.pages.map(page => page.id)));
  const ids = new Set();
  const readingKeys = new Set();
  return HOTSPOTS.filter(hotspot => {
    const { x, y, width, height } = hotspot.bounds ?? {};
    const readingKey = `${hotspot.pageId}:${hotspot.readingOrder}`;
    const valid = !ids.has(hotspot.id)
      && !readingKeys.has(readingKey)
      && pageIds.has(hotspot.pageId)
      && [x, y, width, height].every(insideUnitInterval)
      && width > 0 && height > 0 && x + width <= 1 && y + height <= 1
      && Boolean(hotspot.accessibleLabel?.trim())
      && Boolean(EXPLANATIONS[hotspot.explanationId]);
    if (valid) {
      ids.add(hotspot.id);
      readingKeys.add(readingKey);
    }
    return valid;
  });
}
```

- [ ] **Step 6: Verify the contracts and commit**

Run:

```bash
node --test cd-webinar/tests/content-validation.test.mjs
```

Expected: 5 tests PASS; the release-mode assertion passes because it correctly detects the pending review.

Commit:

```bash
git add -- cd-webinar/content cd-webinar/js/content-validation.js cd-webinar/tests/content-validation.test.mjs
git commit -m 'feat: define LE CD content contracts'
```

---

### Task 3: Build the Pure Viewer State and Page Geometry

**Files:**
- Create: `cd-webinar/js/viewer-state.js`
- Create: `cd-webinar/js/page-geometry.js`
- Create: `cd-webinar/tests/viewer-state.test.mjs`
- Create: `cd-webinar/tests/page-geometry.test.mjs`

**Interfaces:**
- Produces: `DEFAULT_STATE`, `ZOOM_LEVELS`, and `reduceViewerState(state, action, validPageIds)`.
- Produces: `fitPage({ intrinsicWidth, intrinsicHeight, availableWidth, availableHeight, zoom })`.
- Produces: `hotspotPercentStyle(bounds)`.
- Consumed by: `viewer.js` in Tasks 4 and 5.

- [ ] **Step 1: Write the failing state tests**

Create `cd-webinar/tests/viewer-state.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_STATE, reduceViewerState } from '../js/viewer-state.js';

const pages = new Set(['le-1', 'le-2', 'cd-5']);

test('the default is LE Page 1 with no item selected and Fit zoom', () => {
  assert.deepEqual(DEFAULT_STATE, { pageId: 'le-1', selectedHotspotId: null, zoom: 1 });
});

test('selecting a new page clears the explanation and preserves zoom', () => {
  const state = { pageId: 'le-1', selectedHotspotId: 'le.p1.interest-rate', zoom: 1.5 };
  assert.deepEqual(reduceViewerState(state, { type: 'select-page', pageId: 'cd-5' }, pages),
    { pageId: 'cd-5', selectedHotspotId: null, zoom: 1.5 });
});

test('invalid pages leave state unchanged', () => {
  assert.equal(reduceViewerState(DEFAULT_STATE, { type: 'select-page', pageId: 'missing' }, pages), DEFAULT_STATE);
});

test('zoom actions use the fixed 1, 1.25, 1.5, 2 scale', () => {
  let state = reduceViewerState(DEFAULT_STATE, { type: 'zoom-in' }, pages);
  assert.equal(state.zoom, 1.25);
  state = reduceViewerState(state, { type: 'zoom-in' }, pages);
  state = reduceViewerState(state, { type: 'zoom-in' }, pages);
  state = reduceViewerState(state, { type: 'zoom-in' }, pages);
  assert.equal(state.zoom, 2);
  assert.equal(reduceViewerState(state, { type: 'fit' }, pages).zoom, 1);
});
```

- [ ] **Step 2: Write the failing geometry tests**

Create `cd-webinar/tests/page-geometry.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { fitPage, hotspotPercentStyle } from '../js/page-geometry.js';

test('Fit contains a letter page inside the available stage', () => {
  assert.deepEqual(fitPage({ intrinsicWidth: 1530, intrinsicHeight: 1980, availableWidth: 900, availableHeight: 900, zoom: 1 }),
    { width: 695.4545454545455, height: 900, scale: 0.45454545454545453 });
});

test('zoom multiplies the common image and hotspot canvas', () => {
  const fit = fitPage({ intrinsicWidth: 1530, intrinsicHeight: 1980, availableWidth: 900, availableHeight: 900, zoom: 2 });
  assert.equal(fit.height, 1800);
  assert.equal(fit.width, 1390.909090909091);
});

test('normalized hotspot bounds become percentage styles', () => {
  assert.deepEqual(hotspotPercentStyle({ x: 0.1, y: 0.2, width: 0.3, height: 0.04 }),
    { left: '10%', top: '20%', width: '30%', height: '4%' });
});

test('invalid dimensions and bounds throw', () => {
  assert.throws(() => fitPage({ intrinsicWidth: 0, intrinsicHeight: 1980, availableWidth: 900, availableHeight: 900, zoom: 1 }), RangeError);
  assert.throws(() => hotspotPercentStyle({ x: 0.9, y: 0, width: 0.2, height: 0.1 }), RangeError);
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run:

```bash
node --test cd-webinar/tests/viewer-state.test.mjs cd-webinar/tests/page-geometry.test.mjs
```

Expected: FAIL because both modules are missing.

- [ ] **Step 4: Implement the pure state reducer**

Create `cd-webinar/js/viewer-state.js`:

```js
export const ZOOM_LEVELS = Object.freeze([1, 1.25, 1.5, 2]);
export const DEFAULT_STATE = Object.freeze({ pageId: 'le-1', selectedHotspotId: null, zoom: 1 });

export function reduceViewerState(state, action, validPageIds) {
  if (action.type === 'select-page') {
    if (!validPageIds.has(action.pageId)) return state;
    return { ...state, pageId: action.pageId, selectedHotspotId: null };
  }
  if (action.type === 'select-hotspot') return { ...state, selectedHotspotId: action.hotspotId };
  if (action.type === 'clear-selection') return { ...state, selectedHotspotId: null };
  if (action.type === 'fit') return { ...state, zoom: 1 };
  if (action.type === 'zoom-in' || action.type === 'zoom-out') {
    const current = ZOOM_LEVELS.indexOf(state.zoom);
    const delta = action.type === 'zoom-in' ? 1 : -1;
    const index = Math.max(0, Math.min(ZOOM_LEVELS.length - 1, current + delta));
    return { ...state, zoom: ZOOM_LEVELS[index] };
  }
  return state;
}
```

- [ ] **Step 5: Implement common fit and hotspot geometry**

Create `cd-webinar/js/page-geometry.js` with finite-positive input checks, the `min(width ratio, height ratio, 1)` fit rule, and rounded percentage strings:

```js
const positive = value => Number.isFinite(value) && value > 0;
const percent = value => `${Number((value * 100).toFixed(4))}%`;

export function fitPage({ intrinsicWidth, intrinsicHeight, availableWidth, availableHeight, zoom }) {
  if (![intrinsicWidth, intrinsicHeight, availableWidth, availableHeight, zoom].every(positive)) {
    throw new RangeError('page geometry values must be finite and positive');
  }
  const fitScale = Math.min(availableWidth / intrinsicWidth, availableHeight / intrinsicHeight, 1);
  const scale = fitScale * zoom;
  return { width: intrinsicWidth * scale, height: intrinsicHeight * scale, scale };
}

export function hotspotPercentStyle({ x, y, width, height }) {
  const values = [x, y, width, height];
  if (!values.every(value => Number.isFinite(value) && value >= 0 && value <= 1)
      || width === 0 || height === 0 || x + width > 1 || y + height > 1) {
    throw new RangeError('hotspot bounds must fit inside the normalized page');
  }
  return { left: percent(x), top: percent(y), width: percent(width), height: percent(height) };
}
```

- [ ] **Step 6: Verify and commit**

Run:

```bash
node --test cd-webinar/tests/viewer-state.test.mjs cd-webinar/tests/page-geometry.test.mjs
```

Expected: 8 tests PASS.

Commit:

```bash
git add -- cd-webinar/js/viewer-state.js cd-webinar/js/page-geometry.js cd-webinar/tests/viewer-state.test.mjs cd-webinar/tests/page-geometry.test.mjs
git commit -m 'feat: add viewer state and page geometry'
```

---

### Task 4: Build the Static Free-Exploration Shell and Page Navigation

**Files:**
- Create: `cd-webinar/index.html`
- Create: `cd-webinar/js/app.js`
- Create: `cd-webinar/js/viewer.js`
- Create: `cd-webinar/css/tokens.css`
- Create: `cd-webinar/css/base.css`
- Create: `cd-webinar/css/webinar.css`
- Create: `cd-webinar/css/responsive.css`
- Create: `cd-webinar/assets/brand/logo-horizontal.svg`
- Create: `cd-webinar/tests/shell-contract.test.mjs`

**Interfaces:**
- Produces: `initViewer({ root, documents, explanations, hotspots })`.
- Produces stable test hooks: `data-page-button`, `data-page-canvas`, `data-page-image`, `data-hotspot-layer`, `data-explanation-panel`, `data-action="fit|zoom-in|zoom-out"`.
- Consumes: `DOCUMENTS`, `EXPLANATIONS`, `HOTSPOTS`, state reducer, and geometry functions.

- [ ] **Step 1: Write the failing application-shell contract**

Create `cd-webinar/tests/shell-contract.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('the static shell exposes the approved landmarks and module entry point', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /<nav[^>]+aria-label="Disclosure pages"/);
  assert.match(html, /data-document-stage/);
  assert.match(html, /data-explanation-panel/);
  assert.match(html, /type="module" src="\.\/js\/app\.js"/);
  assert.doesNotMatch(html, /Previous lesson|Next lesson|progress/i);
});
```

- [ ] **Step 2: Run the shell test to verify it fails**

Run:

```bash
node --test cd-webinar/tests/shell-contract.test.mjs
```

Expected: FAIL because `index.html` does not exist.

- [ ] **Step 3: Create the accessible static HTML landmarks**

Create `cd-webinar/index.html` with this structure:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Understanding Your Loan Estimate and Closing Disclosure | MSFG</title>
  <meta name="description" content="Explore fictional CFPB Loan Estimate and Closing Disclosure samples and learn what each item means.">
  <link rel="icon" href="data:,">
  <link rel="stylesheet" href="./css/tokens.css">
  <link rel="stylesheet" href="./css/base.css">
  <link rel="stylesheet" href="./css/webinar.css">
  <link rel="stylesheet" href="./css/responsive.css">
</head>
<body>
  <header class="webinar-header">
    <img src="./assets/brand/logo-horizontal.svg" alt="Mountain State Financial Group">
    <div><p class="eyebrow">Interactive webinar</p><h1>Understand Your LE and CD</h1></div>
  </header>
  <main class="webinar-layout" data-viewer-root>
    <nav class="page-nav" aria-label="Disclosure pages" data-page-nav></nav>
    <section class="document-region" aria-label="Selected disclosure page">
      <div class="viewer-tools" aria-label="Document zoom controls" data-viewer-tools></div>
      <div class="document-stage" data-document-stage></div>
    </section>
    <aside class="explanation-panel" aria-live="polite" aria-atomic="true" data-explanation-panel></aside>
  </main>
  <p class="educational-disclaimer">Educational example using fictional CFPB sample documents. This is not a loan quote or legal, tax, or financial advice.</p>
  <script type="module" src="./js/app.js"></script>
</body>
</html>
```

- [ ] **Step 4: Create the app entry point and shell renderer**

In `js/app.js`, validate local-preview content, stop initialization if validation reports errors, and call the viewer:

```js
import { DOCUMENTS, EXPLANATIONS, HOTSPOTS } from '../content/index.js';
import { getRenderableHotspots, validateContent } from './content-validation.js';
import { initViewer } from './viewer.js';

const errors = validateContent({ DOCUMENTS, EXPLANATIONS, HOTSPOTS, release: false });
if (errors.length) console.error(`Invalid webinar content:\n${errors.join('\n')}`);
const renderableHotspots = getRenderableHotspots({ DOCUMENTS, EXPLANATIONS, HOTSPOTS });
initViewer({ root: document.querySelector('[data-viewer-root]'), documents: DOCUMENTS, explanations: EXPLANATIONS, hotspots: renderableHotspots });
```

In `js/viewer.js`, render grouped LE/CD page buttons, Fit/Zoom In/Zoom Out controls, the active page image, and an empty explanation state that says `Choose any highlighted item on the document to learn what it means.` Use the pure reducer for every state change and `ResizeObserver` to call `fitPage()` with the current stage dimensions. Keep all mutable values inside `initViewer`:

```js
export function initViewer({ root, documents, explanations, hotspots }) {
  const pages = documents.flatMap(document => document.pages.map(page => ({ ...page, document })));
  const pageIds = new Set(pages.map(page => page.id));
  let state = { ...DEFAULT_STATE };
  let lastSelectedId = null;
  let animationFrame = 0;

  const dispatch = action => {
    if (state.selectedHotspotId) lastSelectedId = state.selectedHotspotId;
    state = reduceViewerState(state, action, pageIds);
    render();
  };

  const resize = () => {
    cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(renderPageGeometry);
  };

  const observer = new ResizeObserver(resize);
  observer.observe(root.querySelector('[data-document-stage]'));
  render();
  return { dispatch, destroy: () => { observer.disconnect(); cancelAnimationFrame(animationFrame); } };
}
```

- [ ] **Step 5: Create the approved quiet visual shell**

Use the exact tokens below in `css/tokens.css`:

```css
:root {
  --forest-deep: #0c3335;
  --forest-mid: #14494b;
  --msfg-green: #8cc63e;
  --mist: #f5f7f4;
  --white: #ffffff;
  --charcoal: #404041;
  --line: #d8dfdb;
  --focus: #245e00;
  --header-height: 76px;
}
```

Implement a squared, shadow-free three-column layout in `webinar.css` with `220px minmax(0, 1fr) 340px`, a contained page stage, and a selected page state that uses both a left bar and `aria-current="page"`. In `responsive.css`, switch below `900px` to one content column, convert page navigation to a horizontal overflow strip, and display the explanation as a bottom sheet when it contains a selection.

Copy only `first-time-homebuyer/deck/assets/brand/logo-horizontal.svg` into `cd-webinar/assets/brand/logo-horizontal.svg`; do not reference the sibling webinar at runtime.

- [ ] **Step 6: Verify all pages load through a local server**

Run:

```bash
node --test cd-webinar/tests/shell-contract.test.mjs
python3 -m http.server 4177 --bind 127.0.0.1 --directory cd-webinar
```

In a second terminal, run:

```bash
curl --fail --silent http://127.0.0.1:4177/ >/dev/null
curl --fail --silent http://127.0.0.1:4177/assets/documents/le-page-1.png >/dev/null
curl --fail --silent http://127.0.0.1:4177/assets/documents/cd-page-5.png >/dev/null
```

Expected: the shell test passes and all three requests return success. Stop only the server process started for this task.

- [ ] **Step 7: Commit the free-exploration shell**

```bash
git add -- cd-webinar/index.html cd-webinar/js/app.js cd-webinar/js/viewer.js cd-webinar/css cd-webinar/assets/brand cd-webinar/tests/shell-contract.test.mjs
git commit -m 'feat: add free-exploration disclosure viewer shell'
```

---

### Task 5: Complete the Interactive Hotspot and Explanation Behavior

**Files:**
- Modify: `cd-webinar/js/viewer.js`
- Modify: `cd-webinar/css/webinar.css`
- Modify: `cd-webinar/css/responsive.css`
- Create: `cd-webinar/tests/hotspot-view-model.test.mjs`

**Interfaces:**
- Produces: `createHotspotViewModel(hotspot, explanation)` for testable semantic properties.
- Produces: transparent `.hotspot` buttons with `data-hotspot-id`, `aria-label`, and `aria-pressed`.
- Produces: selected explanation markup with title, paragraph, optional learner question, and close button.
- Consumed by: browser audit in Task 7.

- [ ] **Step 1: Write the failing hotspot view-model tests**

Create `cd-webinar/tests/hotspot-view-model.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHotspotViewModel } from '../js/viewer.js';

const hotspot = {
  id: 'le.p1.interest-rate',
  accessibleLabel: 'Interest Rate, 3.875 percent',
  bounds: { x: 0.052, y: 0.257, width: 0.677, height: 0.029 },
};
const explanation = { title: 'Interest Rate', body: 'Body copy.' };

test('hotspot view model keeps geometry and accessible meaning together', () => {
  assert.deepEqual(createHotspotViewModel(hotspot, explanation), {
    id: 'le.p1.interest-rate',
    ariaLabel: 'Interest Rate, 3.875 percent',
    title: 'Interest Rate',
    body: 'Body copy.',
    style: { left: '5.2%', top: '25.7%', width: '67.7%', height: '2.9%' },
  });
});

test('a hotspot without matching content is rejected', () => {
  assert.throws(() => createHotspotViewModel(hotspot, undefined), /missing explanation/i);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
node --test cd-webinar/tests/hotspot-view-model.test.mjs
```

Expected: FAIL because `createHotspotViewModel` is not exported.

- [ ] **Step 3: Render semantic hotspot buttons on the active page**

Export `createHotspotViewModel` from `viewer.js`. For the active page, sort hotspots by `readingOrder`, create a real `button` for each model, apply percentage geometry from `hotspotPercentStyle`, and set:

```js
button.type = 'button';
button.className = 'hotspot';
button.dataset.hotspotId = model.id;
button.setAttribute('aria-label', model.ariaLabel);
button.setAttribute('aria-pressed', String(model.id === state.selectedHotspotId));
```

Append those buttons to an absolutely positioned `[data-hotspot-layer]` inside the same `[data-page-canvas]` as the image.

- [ ] **Step 4: Implement selection, replacement, dismissal, and focus restoration**

On hotspot activation, dispatch `{ type: 'select-hotspot', hotspotId }`, rerender `aria-pressed`, and fill the explanation panel. On close button or Escape, dispatch `{ type: 'clear-selection' }`, return the panel to its instructional state, and call `focus()` on the previously selected hotspot if it still exists. Page changes clear the selected item through the reducer and focus the new page heading, not a removed hotspot.

The selected explanation uses this semantic structure:

```html
<div class="explanation-content" data-selected-explanation>
  <button type="button" class="explanation-close" aria-label="Close explanation">Close</button>
  <p class="explanation-kicker">Selected item</p>
  <h2></h2>
  <p class="explanation-body"></p>
</div>
```

Do not render internal source or review metadata into the learner-facing panel.

- [ ] **Step 5: Add hover, focus, selected, and mobile bottom-sheet styles**

Keep `.hotspot` transparent with no border by default. Apply the soft green outline on `.hotspot:hover`, `.hotspot:focus-visible`, and `[aria-pressed="true"]`. Add a small solid corner marker only to the selected state as the non-color cue. At widths below `900px`, add the bottom sheet only when `[data-explanation-panel]` contains `[data-selected-explanation]`; keep the document visible behind it and provide a visible Close button.

- [ ] **Step 6: Verify and commit the interaction slice**

Run:

```bash
node --test cd-webinar/tests/hotspot-view-model.test.mjs cd-webinar/tests/viewer-state.test.mjs cd-webinar/tests/page-geometry.test.mjs cd-webinar/tests/content-validation.test.mjs
```

Expected: all tests PASS.

Commit:

```bash
git add -- cd-webinar/js/viewer.js cd-webinar/css/webinar.css cd-webinar/css/responsive.css cd-webinar/tests/hotspot-view-model.test.mjs
git commit -m 'feat: explain selected disclosure fields'
```

---

### Task 6: Add the Complete Eight-Page Teaching Inventory and Copy

**Files:**
- Modify: `cd-webinar/content/explanations.js`
- Modify: `cd-webinar/content/hotspots/le.js`
- Modify: `cd-webinar/content/hotspots/cd.js`
- Create: `cd-webinar/tests/content-completeness.test.mjs`

**Interfaces:**
- Produces: all approved populated-fee and important-field hotspot IDs listed below.
- Produces: one 45-110 word explanation per unique `explanationId` with `source` and `review` records.
- Consumed by: viewer, browser audit, and release-readiness gate.

- [ ] **Step 1: Write the failing exact-inventory test**

Create `cd-webinar/tests/content-completeness.test.mjs`. Define `EXPECTED_TARGETS` with the arrays below, then compare each page's sorted hotspot IDs to its expected array and assert every explanation body contains 45-110 words.

```js
const EXPECTED_TARGETS = {
  'le-1': [
    'date-issued','applicants','property','sale-price','loan-term','purpose','product','loan-type','loan-id','rate-lock',
    'loan-amount','interest-rate','monthly-principal-interest','prepayment-penalty','balloon-payment',
    'projected-principal-interest','mortgage-insurance','estimated-escrow','estimated-total-monthly-payment',
    'estimated-taxes-insurance-assessments','property-taxes','homeowners-insurance','estimated-closing-costs','estimated-cash-to-close'
  ],
  'le-2': [
    'a-total','points','application-fee','underwriting-fee','b-total','appraisal-fee','credit-report-fee',
    'flood-determination-fee','flood-monitoring-fee','tax-monitoring-fee','tax-status-research-fee','c-total',
    'pest-inspection-fee','survey-fee','title-insurance-binder','title-lenders-policy','title-settlement-agent-fee',
    'title-search','d-total','e-total','recording-fees','transfer-taxes','f-total','homeowners-insurance-premium',
    'mortgage-insurance-premium','prepaid-interest','prepaid-property-taxes','g-total','homeowners-insurance-escrow',
    'mortgage-insurance-escrow','property-taxes-escrow','h-total','owners-title-policy','i-total','j-total','d-plus-i',
    'lender-credits','cash-total-closing-costs','closing-costs-financed','down-payment','deposit','funds-for-borrower',
    'seller-credits','adjustments-other-credits','estimated-cash-to-close'
  ],
  'le-3': [
    'lender-contact','loan-officer-contact','five-year-total-paid','five-year-principal-paid','apr','tip','appraisal',
    'assumption','homeowners-insurance','late-payment','refinance','servicing','confirm-receipt'
  ],
  'cd-1': [
    'date-issued','closing-date','disbursement-date','settlement-agent','file-number','property','sale-price','borrower',
    'seller','lender','loan-term','purpose','product','loan-type','loan-id','mic-number','loan-amount','interest-rate',
    'monthly-principal-interest','prepayment-penalty','balloon-payment','projected-principal-interest','mortgage-insurance',
    'estimated-escrow','estimated-total-monthly-payment','estimated-taxes-insurance-assessments','property-taxes',
    'homeowners-insurance','hoa-dues','closing-costs','cash-to-close'
  ],
  'cd-2': [
    'borrower-paid-at-closing','borrower-paid-before-closing','seller-paid-at-closing','seller-paid-before-closing',
    'paid-by-others','a-total','points','application-fee','underwriting-fee','b-total','appraisal-fee','credit-report-fee',
    'flood-determination-fee','flood-monitoring-fee','tax-monitoring-fee','tax-status-research-fee','c-total',
    'pest-inspection-fee','survey-fee','title-insurance-binder','title-lenders-policy','title-settlement-agent-fee',
    'title-search','d-total','loan-costs-subtotals','e-total','recording-fees','transfer-tax','f-total',
    'homeowners-insurance-premium','mortgage-insurance-premium','prepaid-interest','prepaid-property-taxes','g-total',
    'homeowners-insurance-escrow','mortgage-insurance-escrow','property-taxes-escrow','aggregate-adjustment','h-total',
    'hoa-capital-contribution','hoa-processing-fee','home-inspection-fee','home-warranty-fee','buyer-broker-commission',
    'seller-broker-commission','owners-title-policy','i-total','other-costs-subtotals','j-total','closing-costs-subtotals',
    'lender-credits'
  ],
  'cd-3': [
    'cash-total-closing-costs','closing-costs-paid-before-closing','closing-costs-financed','down-payment','deposit',
    'funds-for-borrower','seller-credits','adjustments-other-credits','cash-to-close','k-total','sale-price',
    'personal-property','closing-costs-paid-at-closing','borrower-hoa-dues','l-total','borrower-deposit','loan-amount',
    'existing-loans','seller-credit','title-rebate','borrower-city-taxes','total-due-from-borrower','total-paid-for-borrower',
    'borrower-cash-to-close','m-total','seller-sale-price','seller-personal-property','seller-hoa-dues','n-total',
    'excess-deposit','seller-closing-costs','first-mortgage-payoff','second-mortgage-payoff','seller-credit-debit',
    'seller-city-taxes','total-due-to-seller','total-due-from-seller','cash-to-seller'
  ],
  'cd-4': [
    'assumption','demand-feature','late-payment','negative-amortization','partial-payments','security-interest',
    'escrow-account','escrowed-property-costs','non-escrowed-property-costs','initial-escrow-payment',
    'monthly-escrow-payment','no-escrow','future-escrow-changes'
  ],
  'cd-5': [
    'total-payments','finance-charge','amount-financed','apr','tip','appraisal','contract-details',
    'liability-after-foreclosure','refinance','tax-deductions','questions-cfpb','lender-contact','mortgage-broker-contact',
    'buyer-broker-contact','seller-broker-contact','settlement-agent-contact','confirm-receipt'
  ]
};

for (const [pageId, names] of Object.entries(EXPECTED_TARGETS)) {
  test(`${pageId} has the exact approved teaching inventory`, () => {
    const ids = HOTSPOTS.filter(item => item.pageId === pageId)
      .map(item => item.id.replace(`${pageId.replace('-', '.p')}.`, ''));
    assert.deepEqual(ids, names);
  });
}

test('every learner paragraph is concise and sourced', () => {
  for (const explanation of Object.values(EXPLANATIONS)) {
    const wordCount = explanation.body.trim().split(/\s+/).length;
    assert.ok(wordCount >= 45 && wordCount <= 110, `${explanation.id}: ${wordCount} words`);
    assert.ok(explanation.source?.reference);
    assert.ok(explanation.review?.status);
  }
});
```

- [ ] **Step 2: Run the inventory test to verify it fails**

Run:

```bash
node --test cd-webinar/tests/content-completeness.test.mjs
```

Expected: the eight page inventories fail because only the Interest Rate vertical slice exists.

- [ ] **Step 3: Author all required explanation records**

Add one record in `explanations.js` for every unique concept referenced by the inventory. Reuse an explanation ID only when the concept truly has the same meaning on both forms, such as `interest-rate`, `prepaid-interest`, or `appraisal-fee`. Keep a separate explanation when the CD adds materially different meaning, such as payer columns, final-versus-estimated cash-to-close rows, and transaction-summary debits or credits.

Each final record follows this exact shape:

```js
'prepaid-interest': Object.freeze({
  id: 'prepaid-interest',
  title: 'Prepaid Interest',
  body: 'Prepaid interest covers the interest that accrues from the day the loan is funded through the day before the first full payment period begins. It appears at closing because mortgage payments are generally paid after interest has accrued, so this charge accounts for the partial month between closing and the regular payment cycle. The amount depends on the loan balance, interest rate, and number of days shown on the form.',
  source: Object.freeze({ type: 'CFPB sample and Regulation Z', reference: 'H24B page 2; H25B page 2; 12 CFR 1026.37(g)(2)' }),
  review: Object.freeze({ status: 'pending-msfg', reviewer: '', reviewedOn: '' }),
}),
```

Do not duplicate the printed sample's full explanatory text. Paraphrase primary sources and keep each body between 45 and 110 words.

- [ ] **Step 4: Calibrate LE hotspots on the rendered pages**

For each LE page, place the IDs from `EXPECTED_TARGETS` in printed reading order. Measure one row-wide rectangle that covers the label and displayed amount as one logical target, divide pixel coordinates by `1530` and `1980`, and store values to four decimal places. The rectangle may include whitespace between the label and amount but must not cross into the adjacent printed row.

Use this record shape for every entry:

```js
Object.freeze({
  id: 'le.p2.prepaid-interest',
  documentId: 'le',
  pageId: 'le-2',
  readingOrder: 28,
  bounds: Object.freeze({ x: 0.5471, y: 0.3152, width: 0.4039, height: 0.0268 }),
  fieldLabel: 'Prepaid Interest',
  value: '$262',
  explanationId: 'prepaid-interest',
  accessibleLabel: 'Prepaid Interest, 262 dollars',
}),
```

- [ ] **Step 5: Calibrate CD hotspots on the rendered pages**

Repeat the same normalized-coordinate process for CD Pages 1-5 using `EXPECTED_TARGETS`. On CD Page 2, include the payer-column heading hotspots before Section A in keyboard order. Each fee-line target covers its label, provider when present, and all populated payer amounts for that row so the learner receives one coherent explanation instead of several competing buttons.

- [ ] **Step 6: Verify data completeness and inspect every page**

Run:

```bash
node --test cd-webinar/tests/content-validation.test.mjs cd-webinar/tests/content-completeness.test.mjs
```

Expected: all development-mode validation and nine completeness tests PASS. Release mode continues to report pending MSFG review, which is intentional until Task 8.

Serve the viewer locally and inspect every target at Fit and 2x zoom. Correct any rectangle that covers an adjacent row or misses its displayed amount.

- [ ] **Step 7: Commit the complete educational content**

```bash
git add -- cd-webinar/content cd-webinar/tests/content-completeness.test.mjs
git commit -m 'feat: add complete LE CD teaching content'
```

---

### Task 7: Add the Browser, Responsive, Accessibility, and Failure-State Audit

**Files:**
- Create: `cd-webinar/tests/browser-audit.run.js`
- Create: `cd-webinar/tests/run-browser-audit.sh`
- Modify: `cd-webinar/js/viewer.js`
- Modify: `cd-webinar/css/webinar.css`
- Modify: `cd-webinar/css/responsive.css`

**Interfaces:**
- Produces: one JSON browser-audit result with viewport, interaction, alignment, accessibility, console, network, and failure-state evidence.
- Consumes stable DOM hooks defined in Task 4 and the complete content from Task 6.

- [ ] **Step 1: Write the browser audit before fixing remaining browser defects**

Create `cd-webinar/tests/browser-audit.run.js` as a Playwright `run-code` module that uses the existing `page` object. It must execute this exact matrix:

```js
const viewports = [
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'laptop', width: 1280, height: 720 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'mobile-landscape', width: 844, height: 390 },
];
```

For each viewport:

1. navigate to the base URL and assert `le-1` is current;
2. select `cd-5` directly and assert no intermediate page becomes current;
3. select `cd.p5.apr` and assert the APR title and paragraph are visible;
4. press Escape and assert focus returns to `cd.p5.apr`;
5. select `le-2` and assert the CD explanation is cleared;
6. click Zoom In and assert both page-image and hotspot rectangles grow by the same ratio;
7. click Fit and assert the complete page canvas is inside the document stage;
8. assert every active hotspot is inside the image rectangle by at most one CSS pixel;
9. assert every hotspot has a nonempty accessible name and one tab-order position;
10. on viewports below `900px`, assert the selected explanation uses the bottom-sheet layout and has a visible close button.

The module returns compact JSON:

```js
return JSON.stringify({ status: 'pass', viewports: viewports.map(item => item.name), alignmentFailures: 0, consoleErrors: 0 });
```

- [ ] **Step 2: Create an owned-server Playwright runner**

Create `cd-webinar/tests/run-browser-audit.sh` using the proven lifecycle pattern in `first-time-homebuyer/deck/tests/run-fit-browser-audit.sh`:

- start `python3 -m http.server 4177 --bind 127.0.0.1 --directory "$webinar_dir"` only when no base URL argument is supplied;
- wait for `curl --fail --silent http://127.0.0.1:4177/`;
- use `${PWCLI}` when supplied, otherwise `/Users/zacharyzink/.codex/skills/playwright/scripts/playwright_cli.sh`;
- create a unique session named `le-cd-audit-$$`;
- open the base URL, execute `browser-audit.run.js`, inspect console errors and failed network responses, close the Playwright session, and stop only the server PID the script owns;
- exit nonzero when any browser step, console check, response check, or cleanup check fails.

- [ ] **Step 3: Run the browser audit to identify real failures**

Run:

```bash
cd-webinar/tests/run-browser-audit.sh
```

Expected on the first run: FAIL on any incomplete responsive, focus, alignment, or image-failure behavior. Record each failing assertion before editing the viewer.

- [ ] **Step 4: Implement the verified missing behavior**

Fix only failures demonstrated by the audit. The final viewer must:

- expose `aria-current="page"` on exactly one page button;
- keep page image and hotspot layer in one `data-page-canvas` sized from `fitPage()`;
- set `aria-pressed="true"` on exactly one selected hotspot;
- close on Escape and restore focus;
- hide the entire hotspot layer when the image dispatches `error`;
- replace the document with `This disclosure page is temporarily unavailable.` while leaving all page buttons functional;
- coalesce ResizeObserver rendering through one animation frame;
- disable Zoom In at `2` and Zoom Out/Fit at `1` where applicable; and
- remove nonessential transitions under `prefers-reduced-motion: reduce`.

- [ ] **Step 5: Add and verify the image-failure case**

Extend the browser module to abort `**/cd-page-5.png`, reload CD Page 5, and assert:

```text
fallback message visible
zero active hotspot buttons
LE Page 1 button still changes the page successfully
```

Then remove the route interception and reload before the next viewport.

- [ ] **Step 6: Run the full automated gate**

Run:

```bash
node --test cd-webinar/tests/*.test.mjs
cd-webinar/tests/run-browser-audit.sh
git diff --check -- cd-webinar
```

Expected: every Node test passes, the browser runner returns `status: pass`, there are zero browser console errors, all document requests succeed outside the deliberate failure case, and the whitespace check is clean.

- [ ] **Step 7: Commit the browser-hardened viewer**

```bash
git add -- cd-webinar/js/viewer.js cd-webinar/css/webinar.css cd-webinar/css/responsive.css cd-webinar/tests/browser-audit.run.js cd-webinar/tests/run-browser-audit.sh
git commit -m 'test: verify LE CD viewer interactions and layout'
```

---

### Task 8: Document the Viewer and Enforce the Human Review Gate

**Files:**
- Create: `cd-webinar/README.md`
- Create: `cd-webinar/CONTENT-REVIEW.md`
- Create: `cd-webinar/tests/release-readiness.test.mjs`
- Modify after actual review only: `cd-webinar/content/explanations.js`

**Interfaces:**
- Produces: a self-contained local-run and content-authoring handoff.
- Produces: a release gate that passes only when every explanation has a real reviewer and ISO date.
- Does not publish or deploy the webinar.

- [ ] **Step 1: Write the failing release-readiness test**

Create `cd-webinar/tests/release-readiness.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { DOCUMENTS, EXPLANATIONS, HOTSPOTS } from '../content/index.js';
import { validateContent } from '../js/content-validation.js';

const release = process.env.LE_CD_RELEASE === '1';

test('release content has recorded MSFG review', { skip: !release }, () => {
  assert.deepEqual(validateContent({ DOCUMENTS, EXPLANATIONS, HOTSPOTS, release: true }), []);
  for (const item of Object.values(EXPLANATIONS)) {
    assert.match(item.review.reviewer, /\S+\s+\S+/);
    assert.match(item.review.reviewedOn, /^\d{4}-\d{2}-\d{2}$/);
  }
});
```

- [ ] **Step 2: Run it and verify the human gate is active**

Run:

```bash
LE_CD_RELEASE=1 node --test cd-webinar/tests/release-readiness.test.mjs
```

Expected before compliance review: FAIL with `review status must be approved`. This is an intentional approval checkpoint, not an implementation defect.

- [ ] **Step 3: Write the operational README**

Document these exact commands in `cd-webinar/README.md`:

```bash
python3 -m http.server 4177 --bind 127.0.0.1 --directory cd-webinar
node --test cd-webinar/tests/*.test.mjs
cd-webinar/tests/run-browser-audit.sh
cd-webinar/scripts/render-disclosures.sh
```

Also document the free-exploration interaction model, all module responsibilities, source PDF hashes, page mappings, hotspot coordinate convention, 45-110 word copy rule, keyboard controls, image-failure behavior, educational boundary, and explicit no-deployment boundary.

- [ ] **Step 4: Create the content-review checklist**

In `cd-webinar/CONTENT-REVIEW.md`, provide one signoff table with these columns:

```text
Reviewer | Role | Review date | Pages reviewed | Copy accuracy | Source accuracy | Disclaimer | Decision
```

Require review of all eight pages, every explanation, fictional-sample labeling, absence of borrower-specific advice, and comparison of rendered images to the source PDFs. Record `Approved` only when the named reviewer actually supplies that decision.

- [ ] **Step 5: Stop for real MSFG mortgage/compliance review**

Provide the local preview URL, `CONTENT-REVIEW.md`, and the eight-page target inventory to the reviewer. Do not change `pending-msfg` records while review is pending. If changes are requested, update copy and sources, rerun the development and browser gates, and resubmit the changed records.

- [ ] **Step 6: Record approval and verify the release gate only after signoff**

For every actually approved explanation, set:

```js
review: Object.freeze({ status: 'approved', reviewer: 'Reviewer Full Name', reviewedOn: 'YYYY-MM-DD' })
```

Replace the example name and date with the review record; never commit the literal example values.

Run:

```bash
node --test cd-webinar/tests/*.test.mjs
cd-webinar/tests/run-browser-audit.sh
git diff --check -- cd-webinar
```

Then run the explicit release gate:

```bash
LE_CD_RELEASE=1 node --test cd-webinar/tests/release-readiness.test.mjs
```

Expected: all Node tests, the explicit release readiness test, and browser checks PASS.

- [ ] **Step 7: Commit documentation and genuine review evidence**

Before review, commit the preview documentation without fabricating approval:

```bash
git add -- cd-webinar/README.md cd-webinar/CONTENT-REVIEW.md cd-webinar/tests/release-readiness.test.mjs
git commit -m 'docs: add LE CD viewer review gate'
```

After genuine approval, use a separate commit:

```bash
git add -- cd-webinar/content/explanations.js cd-webinar/CONTENT-REVIEW.md
git commit -m 'docs: record LE CD content approval'
```

If approval has not occurred, the implementation is `local preview ready, compliance review pending`; it is not release-ready.

---

## Final Verification Checklist

Run from the repository root:

```bash
git status --short
node --test cd-webinar/tests/document-assets.test.mjs \
  cd-webinar/tests/content-validation.test.mjs \
  cd-webinar/tests/content-completeness.test.mjs \
  cd-webinar/tests/viewer-state.test.mjs \
  cd-webinar/tests/page-geometry.test.mjs \
  cd-webinar/tests/shell-contract.test.mjs \
  cd-webinar/tests/hotspot-view-model.test.mjs
cd-webinar/tests/run-browser-audit.sh
git diff --check -- cd-webinar
```

Required evidence before calling the local preview complete:

- exact source hashes and all eight `1530x1980` PNG assets;
- exact page-by-page teaching inventory;
- all development-mode Node tests passing;
- browser matrix passing at five viewports;
- direct page selection with no implied order;
- aligned hotspots at Fit, 1.25x, 1.5x, and 2x;
- mouse, touch, keyboard, Escape, and focus-return behavior;
- no always-visible hotspot markers;
- correct mobile bottom sheet;
- safe missing-image state;
- zero unexpected console errors or failed asset requests;
- no files staged outside `cd-webinar/`; and
- explicit status of either `compliance approved` or `compliance review pending`.

Publishing remains a separate user-approved task.
