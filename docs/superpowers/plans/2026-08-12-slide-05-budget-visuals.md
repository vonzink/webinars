# Slide 5 Budget Visuals Implementation Plan

> **For Codex:** Execute this plan inline with the executing-plans workflow. Preserve all unrelated dirty files and commit only isolated documentation artifacts; the webinar implementation paths already contain approved uncommitted work and must not be committed without a separate user request.

**Goal:** Update the current fifth audience slide, `budget-comfort`, by removing its builder-incentive point, adding the two supplied presenter-only visuals, generalizing the presenter media heading, and locking the approved `You need 20% down` note.

**Architecture:** Keep audience copy in the existing `SLIDES` data model and mirror it in `build_pptx.py`. Extend the immutable presenter-media registry with two entries owned by the stable `budget-comfort` slide ID, reusing the existing presenter button renderer and draggable/resizable audience media window. Treat the myth wording as an exact content contract because the current source and deployed presenter already contain the approved final sentence.

**Tech Stack:** Browser-native ES modules, Node's built-in test runner and standard library, existing BroadcastChannel presenter flow, Python and python-pptx for isolated PowerPoint verification, Playwright for the two-window browser check.

## Global Constraints

- Keep the Slide 5 eyebrow, title, subtitle, and three approved audience bullets unchanged.
- Remove only the Slide 5 builder-incentive bullet and its matching speaker-note explanation.
- Preserve the separate later mistakes card `The builder's incentive is free money` and its popout.
- Copy `/Users/zacharyzink/Desktop/budget.png` and `/Users/zacharyzink/Desktop/DTI.png` byte-for-byte; do not edit, crop, recompress, or regenerate them.
- Expose the images only in the presenter for `budget-comfort`; do not embed or preload them in the audience slide and do not add them to the PowerPoint.
- Keep Slide 2's five media entries and Slide 3's two media entries unchanged.
- The media heading must read `Optional visuals` on every slide that has registered presenter media.
- Keep the `myth-20-down` note exactly `Mortgage insurance on a conventional loan is removable.` in both runtime content representations. The removed phrase must not return to runtime content.
- Historical handoff notes, planning files, scripts, and archived slides are out of scope.
- Do not deploy production in this phase. Deployment requires a separate request after local review.
- Preserve unrelated dirty worktree changes. Do not commit overlapping implementation files; use explicit status and verification checkpoints.

---

### Task 1: Establish the current baseline and asset identity

**Files:**
- Inspect: `first-time-homebuyer/deck/content/slides.js`
- Inspect: `first-time-homebuyer/deck/content/modals.js`
- Inspect: `first-time-homebuyer/deck/content/presenter-media.js`
- Inspect: `first-time-homebuyer/deck/build_pptx.py`
- Inspect: `first-time-homebuyer/deck/tests/*.test.mjs`
- Inspect: `/Users/zacharyzink/Desktop/budget.png`
- Inspect: `/Users/zacharyzink/Desktop/DTI.png`

- [ ] **Step 1: Reconfirm the dirty-path baseline**

Run:

```bash
git status --short
git diff -- first-time-homebuyer/deck/content/slides.js first-time-homebuyer/deck/content/modals.js first-time-homebuyer/deck/content/presenter-media.js first-time-homebuyer/deck/build_pptx.py first-time-homebuyer/deck/presenter.html first-time-homebuyer/deck/tests
```

Expected: existing approved webinar work remains present. If any requested path changed since this plan was written, re-read and adapt to the latest source rather than restoring an older version.

- [ ] **Step 2: Run the current automated baseline**

From `first-time-homebuyer/deck`, run:

```bash
node --no-warnings --test tests/*.test.mjs
node --check content/slides.js
node --check content/modals.js
node --check content/presenter-media.js
PYTHONDONTWRITEBYTECODE=1 python3 -m py_compile build_pptx.py
```

Expected: the existing suite and syntax checks pass before new assertions are introduced.

- [ ] **Step 3: Verify the supplied PNG identities**

Run:

```bash
shasum -a 256 "/Users/zacharyzink/Desktop/budget.png" "/Users/zacharyzink/Desktop/DTI.png"
sips -g pixelWidth -g pixelHeight "/Users/zacharyzink/Desktop/budget.png" "/Users/zacharyzink/Desktop/DTI.png"
```

Expected:

```text
0128267ab6f1be348598dc10726280f9527a72f8f4bce57d4905ff0857ef09f7  /Users/zacharyzink/Desktop/budget.png
6936b636540652a68dcb9edca99c6cf573ffa2f40c1d009e06d6e19bb5e62dcf  /Users/zacharyzink/Desktop/DTI.png
budget.png: 1536 x 1024
DTI.png: 1122 x 1402
```

### Task 2: Update Slide 5 copy and lock the myth note test-first

**Files:**
- Modify: `first-time-homebuyer/deck/tests/content-emphasis.test.mjs`
- Modify: `first-time-homebuyer/deck/content/slides.js`
- Modify: `first-time-homebuyer/deck/build_pptx.py`
- Verify: `first-time-homebuyer/deck/content/modals.js`

**Interfaces:**
- Consumes: `SLIDES` entry `budget-comfort` and `MODALS['myth-20-down']`.
- Produces: three exact Slide 5 bullets, a focused speaker note, and matching future PowerPoint content.

- [ ] **Step 1: Add the failing Slide 5 contract and explicit myth regression**

Extend `content-emphasis.test.mjs` with:

```js
test('Slide 5 keeps the approved comfort-zone content', () => {
  const slide = SLIDES.find(item => item.id === 'budget-comfort');
  assert.ok(slide, 'Slide 5 must exist');
  assert.deepEqual(slide.points, [
    "Don't become house poor — the guidelines ask if you'll repay, not if you'll be okay",
    'Protect quality of life — leave room for disposable income and emergencies',
    'The payment can change after you close',
  ]);
  assert.doesNotMatch(slide.notes, /builder incentives?/i);

  const mistakes = SLIDES.find(item => item.id === 'mistakes-assumptions');
  assert.ok(mistakes.cards.some(card => card.modal === 'assume-builder'));
});
```

Strengthen the existing first-popout assertion:

```js
const note = MODALS['myth-20-down'].sections.at(-1).note;
assert.equal(note, 'Mortgage insurance on a conventional loan is removable.');
assert.doesNotMatch(note, /phase, not a sentence/i);
```

- [ ] **Step 2: Run the content test and verify RED for Slide 5**

Run:

```bash
node --no-warnings --test first-time-homebuyer/deck/tests/content-emphasis.test.mjs
```

Expected: FAIL because `budget-comfort` still contains four points and its notes still discuss builder incentives. The myth regression already passes, confirming that the requested phrase is absent from current runtime content.

- [ ] **Step 3: Make the minimal HTML content change**

In `content/slides.js`:

- remove only the fourth `budget-comfort` point;
- shorten its notes to the existing qualification-versus-comfort explanation, ending after `So you have to.`;
- do not change the later `mistakes-assumptions` card or `assume-builder` modal.

No edit to `content/modals.js` is needed if the exact approved myth note is still present.

- [ ] **Step 4: Mirror Slide 5 in the PowerPoint builder**

In the `budget-comfort` entry in `build_pptx.py`, keep exactly these points:

```python
points=[
  "Don’t become house poor — the guidelines ask if you’ll repay, not if you’ll be okay",
  'Protect quality of life — leave room for disposable income and emergencies',
  'The payment can change after you close',
]
```

Preserve the existing exact myth note `Mortgage insurance on a conventional loan is removable.` and the later builder-assumption card.

- [ ] **Step 5: Verify GREEN and source parity**

Run:

```bash
node --no-warnings --test first-time-homebuyer/deck/tests/content-emphasis.test.mjs
node --check first-time-homebuyer/deck/content/slides.js
node --check first-time-homebuyer/deck/content/modals.js
PYTHONDONTWRITEBYTECODE=1 python3 -m py_compile first-time-homebuyer/deck/build_pptx.py
rg -n "phase, not a sentence" first-time-homebuyer/deck/content first-time-homebuyer/deck/build_pptx.py
```

Expected: tests and syntax checks pass; the final `rg` returns no runtime-content matches. Do not treat matches in archival documents outside these runtime paths as failures.

### Task 3: Add the two presenter-only visuals test-first

**Files:**
- Modify: `first-time-homebuyer/deck/tests/presenter-media-registry.test.mjs`
- Modify: `first-time-homebuyer/deck/content/presenter-media.js`
- Create: `first-time-homebuyer/deck/assets/presenter/slide-05/budget-smart.png`
- Create: `first-time-homebuyer/deck/assets/presenter/slide-05/debt-to-income.png`

**Interfaces:**
- Consumes: `mediaForSlide(slideId)` and `mediaById(id)`.
- Produces: two immutable media entries owned by `budget-comfort`.

- [ ] **Step 1: Add the failing Slide 5 registry and asset-integrity assertions**

Add:

```js
const expectedSlide5 = [
  ['budget-smart', 'Budget Smart', './assets/presenter/slide-05/budget-smart.png'],
  ['debt-to-income', 'Debt-to-Income (DTI)', './assets/presenter/slide-05/debt-to-income.png'],
];
```

Update the registry test to require:

```js
assert.deepEqual(project(registry.mediaForSlide('budget-comfort')), expectedSlide5);
```

Allow the stable slide IDs `myths`, `budget-rent-buy`, and `budget-comfort`. Use Node's `readFileSync` and `createHash('sha256')` to assert the two new assets match the approved hashes. Also verify the PNG signature and IHDR dimensions directly from each copied file.

- [ ] **Step 2: Run the registry test and verify RED**

Run:

```bash
node --no-warnings --test first-time-homebuyer/deck/tests/presenter-media-registry.test.mjs
```

Expected: FAIL because `mediaForSlide('budget-comfort')` is empty and the copied assets do not exist.

- [ ] **Step 3: Copy the exact supplied files**

Run:

```bash
mkdir -p first-time-homebuyer/deck/assets/presenter/slide-05
cp "/Users/zacharyzink/Desktop/budget.png" first-time-homebuyer/deck/assets/presenter/slide-05/budget-smart.png
cp "/Users/zacharyzink/Desktop/DTI.png" first-time-homebuyer/deck/assets/presenter/slide-05/debt-to-income.png
cmp "/Users/zacharyzink/Desktop/budget.png" first-time-homebuyer/deck/assets/presenter/slide-05/budget-smart.png
cmp "/Users/zacharyzink/Desktop/DTI.png" first-time-homebuyer/deck/assets/presenter/slide-05/debt-to-income.png
```

Expected: both `cmp` commands exit 0 without output.

- [ ] **Step 4: Register the two visuals**

Append to `content/presenter-media.js`:

```js
{
  id: 'budget-smart', slideId: 'budget-comfort', title: 'Budget Smart',
  src: './assets/presenter/slide-05/budget-smart.png',
  alt: 'Budget comparison between a comfortable housing payment and maximum mortgage qualification.',
},
{
  id: 'debt-to-income', slideId: 'budget-comfort', title: 'Debt-to-Income (DTI)',
  src: './assets/presenter/slide-05/debt-to-income.png',
  alt: 'Guide showing how a mortgage debt-to-income ratio is calculated and which obligations count.',
},
```

- [ ] **Step 5: Run the registry test and verify GREEN**

Run:

```bash
node --no-warnings --test first-time-homebuyer/deck/tests/presenter-media-registry.test.mjs
```

Expected: all registry, existence, image-format, dimension, and hash assertions pass; Slide 2 and Slide 3 expectations remain unchanged.

### Task 4: Generalize the presenter media heading test-first

**Files:**
- Modify: `first-time-homebuyer/deck/tests/presenter-media-registry.test.mjs`
- Modify: `first-time-homebuyer/deck/presenter.html`

- [ ] **Step 1: Add the failing heading contract**

Read `presenter.html` from the test and assert:

```js
assert.match(source, /Optional visuals \(<span id="p-media-count">0<\/span>\)/);
assert.doesNotMatch(source, /Slide 2 graphs/);
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
node --no-warnings --test first-time-homebuyer/deck/tests/presenter-media-registry.test.mjs
```

Expected: FAIL because the presenter still labels the section `Slide 2 graphs`.

- [ ] **Step 3: Update only the heading text**

In `presenter.html`, change the heading to:

```html
<div class="p-h">Optional visuals (<span id="p-media-count">0</span>)</div>
```

Do not change the section ID, count ID, list ID, hidden state, or renderer behavior.

- [ ] **Step 4: Verify GREEN**

Run:

```bash
node --no-warnings --test first-time-homebuyer/deck/tests/presenter-media-registry.test.mjs
node --check first-time-homebuyer/deck/js/presenter.js
```

Expected: all assertions pass without a presenter JavaScript change.

### Task 5: Verify the PowerPoint mirror and full automated suite

**Files:**
- Verify: `first-time-homebuyer/deck/build_pptx.py`
- Verify: `first-time-homebuyer/deck/content/*.js`
- Verify: `first-time-homebuyer/deck/js/*.js`
- Verify: `first-time-homebuyer/deck/tests/*.test.mjs`

- [ ] **Step 1: Run the complete local quality gates**

From `first-time-homebuyer/deck`, run:

```bash
node --no-warnings --test tests/*.test.mjs
for file in content/*.js js/*.js; do node --check "$file"; done
PYTHONDONTWRITEBYTECODE=1 python3 -m py_compile build_pptx.py
git diff --check
```

Expected: every test passes, all JavaScript and Python sources parse, and no whitespace errors are reported.

- [ ] **Step 2: Build the future PowerPoint in an isolated temporary copy**

Create an exact temporary directory with `mktemp -d`, copy `first-time-homebuyer/deck` into it, load the bundled workspace Python environment, run `build_pptx.py`, and inspect the generated deck with python-pptx.

Expected:

- `MODALS: 30`
- `SLIDES: 16`
- the main `budget-comfort` slide contains exactly the three approved bullets;
- no generated Slide 5 content includes the removed builder-incentive point;
- the `You need 20% down` companion slide contains the exact approved mortgage-insurance note;
- the later builder-incentive mistakes content remains;
- neither Slide 5 PNG is embedded in the PowerPoint.

Remove only the exact temporary directory after inspection. Do not replace the repository's downloadable PowerPoint.

- [ ] **Step 3: Record the intended implementation scope without committing it**

Run:

```bash
git status --short -- first-time-homebuyer/deck/content/slides.js first-time-homebuyer/deck/content/modals.js first-time-homebuyer/deck/content/presenter-media.js first-time-homebuyer/deck/build_pptx.py first-time-homebuyer/deck/presenter.html first-time-homebuyer/deck/assets/presenter/slide-05 first-time-homebuyer/deck/tests
```

Expected: only the intended working paths appear in addition to their already-dirty baseline. Do not stage or commit these overlapping implementation files.

### Task 6: Verify the real presenter and audience workflow

**Files:**
- Verify: `first-time-homebuyer/deck/index.html`
- Verify: `first-time-homebuyer/deck/presenter.html`
- Verify: `first-time-homebuyer/deck/assets/presenter/slide-05/*.png`

- [ ] **Step 1: Serve the deck locally**

From `first-time-homebuyer/deck`, run:

```bash
python3 -m http.server 4173
```

- [ ] **Step 2: Exercise Slide 5 in the two-window workflow**

Use Playwright to:

1. Open the audience deck and presenter.
2. Navigate to `#budget-comfort` and confirm the exact three bullets and absence of the builder-incentive sentence.
3. Confirm the presenter heading is `Optional visuals (2)` and lists exactly `Budget Smart` and `Debt-to-Income (DTI)`.
4. Confirm neither new PNG has been requested by the audience before presenter selection.
5. Open each presenter visual and wait for the audience image to decode with `naturalWidth > 0`.
6. Confirm the existing media window remains draggable and resizable and preserves each image's aspect ratio with containment.
7. Advance to another slide and confirm the media window closes through the existing behavior.
8. Return to Slide 2 and Slide 3 and confirm their media counts and memberships remain five and two.
9. Open `You need 20% down` and confirm the visible note is exactly `Mortgage insurance on a conventional loan is removable.`
10. Confirm the later builder-incentive mistakes card and popout still work.

- [ ] **Step 3: Review console and network evidence**

Expected: no product errors or warnings; the deck still reports `16 slides · 30 popouts · 39 min ✓`; the new PNG requests occur only after their presenter buttons are selected.

- [ ] **Step 4: Stop cleanly and preserve the deployment boundary**

Stop the local server and close the test browser session. Leave the working tree intact and do not start an Amplify deployment.

## Completion Report

Report:

- exact Slide 5 bullets and note change;
- exact presenter labels, asset paths, dimensions, and hashes;
- myth-note regression result;
- Slide 2 and Slide 3 preservation result;
- automated test count and browser verification result;
- explicit statement that production was not deployed.
