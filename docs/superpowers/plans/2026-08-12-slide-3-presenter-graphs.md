# Slide 3 Presenter Graphs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep all five Slide 2 presenter graphs and add the two approved presenter-only graphs plus updated renting/buying bullets to the new Slide 3.

**Architecture:** Extend the existing immutable presenter-media registry with two entries owned by the stable `budget-rent-buy` slide ID. Reuse the current presenter renderer, `open-media` channel message, and draggable/resizable audience modal without changing their interfaces. Keep the HTML slide data and PowerPoint builder copy synchronized.

**Tech Stack:** ES modules, Node's built-in test runner, BroadcastChannel, existing HTML/CSS modal system, Python and python-pptx for temporary build verification.

## Global Constraints

- Slide 2 retains exactly its existing five presenter graph options.
- Slide 3 exposes exactly `Denver Rent Trends` and `Renting vs. Buying Wealth` in the private presenter.
- Neither graph appears on the audience slide until selected by the presenter.
- Copy each supplied PNG byte-for-byte; do not crop, recompress, recolor, or reconstruct it.
- The Renting bullet is exactly `The longer you wait, the more expensive buying becomes.`
- The new Buying bullet is exactly `You can personalize the home to fit your style and needs.`
- Bullet sentences contain no `<strong>` markup; titles and comparison-column headings keep their CSS bold styling.
- Mirror the bullet copy in `first-time-homebuyer/deck/build_pptx.py` but do not replace the repository's downloadable PowerPoint.
- Preserve unrelated dirty worktree changes. Do not commit implementation files that already contain prior uncommitted work; use explicit verification checkpoints instead.

---

### Task 1: Register and copy the two Slide 3 graphs

**Files:**
- Modify: `first-time-homebuyer/deck/tests/presenter-media-registry.test.mjs`
- Modify: `first-time-homebuyer/deck/content/presenter-media.js`
- Create: `first-time-homebuyer/deck/assets/presenter/slide-03/denver-rent-trends.png`
- Create: `first-time-homebuyer/deck/assets/presenter/slide-03/renting-vs-buying-wealth.png`

**Interfaces:**
- Consumes: `mediaForSlide(slideId: string): PresenterMedia[]` and `mediaById(id: string): PresenterMedia | null`.
- Produces: two immutable registry entries with slide ID `budget-rent-buy` and stable IDs `denver-rent-trends` and `renting-vs-buying-wealth`.

- [ ] **Step 1: Write the failing Slide 3 registry test**

Replace the single `expected` constant with slide-specific expectations and update the tests:

```js
const expectedSlide2 = [
  ['fha-buyers', 'FHA Buyers', './assets/presenter/slide-02/fha-buyers.png'],
  ['down-payment-ranges', 'Down Payment Ranges', './assets/presenter/slide-02/down-payment-ranges.png'],
  ['credit-score', 'Credit Scores', './assets/presenter/slide-02/credit-score.png'],
  ['rent-vs-buy', 'Rent vs. Buy', './assets/presenter/slide-02/rent-vs-buy.png'],
  ['lowest-rate', 'The Lowest Rate', './assets/presenter/slide-02/lowest-rate.png'],
];

const expectedSlide3 = [
  ['denver-rent-trends', 'Denver Rent Trends', './assets/presenter/slide-03/denver-rent-trends.png'],
  ['renting-vs-buying-wealth', 'Renting vs. Buying Wealth', './assets/presenter/slide-03/renting-vs-buying-wealth.png'],
];

test('Slide 2 keeps its five graphs and Slide 3 exposes its two approved graphs', async () => {
  const registry = await import('../content/presenter-media.js').catch(() => null);
  assert.ok(registry, 'presenter media registry must exist');
  const project = items => items.map(({ id, title, src }) => [id, title, src]);
  assert.deepEqual(project(registry.mediaForSlide('myths')), expectedSlide2);
  assert.deepEqual(project(registry.mediaForSlide('budget-rent-buy')), expectedSlide3);
  assert.deepEqual(registry.mediaForSlide('opening'), []);
});
```

In the asset test, replace the Slide 2-only assertion with:

```js
assert.ok(['myths', 'budget-rent-buy'].includes(item.slideId), `${item.id} has an unknown slide`);
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
node --no-warnings --test first-time-homebuyer/deck/tests/presenter-media-registry.test.mjs
```

Expected: FAIL because `mediaForSlide('budget-rent-buy')` returns an empty array.

- [ ] **Step 3: Copy the exact supplied files**

Run:

```bash
mkdir -p first-time-homebuyer/deck/assets/presenter/slide-03
cp "/Users/zacharyzink/Desktop/Denver Housing Market Slide.png" first-time-homebuyer/deck/assets/presenter/slide-03/denver-rent-trends.png
cp "/Users/zacharyzink/Desktop/image4.png" first-time-homebuyer/deck/assets/presenter/slide-03/renting-vs-buying-wealth.png
cmp "/Users/zacharyzink/Desktop/Denver Housing Market Slide.png" first-time-homebuyer/deck/assets/presenter/slide-03/denver-rent-trends.png
cmp "/Users/zacharyzink/Desktop/image4.png" first-time-homebuyer/deck/assets/presenter/slide-03/renting-vs-buying-wealth.png
```

Expected: both `cmp` commands exit 0 with no output.

- [ ] **Step 4: Add the two minimal registry entries**

Append these objects to `items` in `content/presenter-media.js`:

```js
{
  id: 'denver-rent-trends', slideId: 'budget-rent-buy', title: 'Denver Rent Trends',
  src: './assets/presenter/slide-03/denver-rent-trends.png',
  alt: 'Line chart comparing Denver and United States average asking rent trends through July 2026.',
},
{
  id: 'renting-vs-buying-wealth', slideId: 'budget-rent-buy', title: 'Renting vs. Buying Wealth',
  src: './assets/presenter/slide-03/renting-vs-buying-wealth.png',
  alt: 'Colorado ten-year comparison of cumulative rent payments, homeowner cash paid, and homeowner equity.',
},
```

- [ ] **Step 5: Run the registry test and verify GREEN**

Run:

```bash
node --no-warnings --test first-time-homebuyer/deck/tests/presenter-media-registry.test.mjs
```

Expected: both registry tests pass, including local file resolution and media ID lookup.

- [ ] **Step 6: Record the checkpoint without committing overlapping dirty files**

Run:

```bash
git diff --check -- first-time-homebuyer/deck/content/presenter-media.js first-time-homebuyer/deck/tests/presenter-media-registry.test.mjs
git status --short -- first-time-homebuyer/deck/assets/presenter/slide-03 first-time-homebuyer/deck/content/presenter-media.js first-time-homebuyer/deck/tests/presenter-media-registry.test.mjs
```

Expected: no whitespace errors; only the intended registry, tests, and two images are listed.

### Task 2: Update Slide 3 copy and the PowerPoint mirror

**Files:**
- Modify: `first-time-homebuyer/deck/tests/content-emphasis.test.mjs`
- Modify: `first-time-homebuyer/deck/content/slides.js`
- Modify: `first-time-homebuyer/deck/build_pptx.py`

**Interfaces:**
- Consumes: `SLIDES`, using the stable `budget-rent-buy` ID and its `left.items` and `right.items` arrays.
- Produces: exact approved bullet copy in both HTML data and future PowerPoint generation.

- [ ] **Step 1: Write the failing exact-copy test**

Add this test to `content-emphasis.test.mjs`:

```js
test('Slide 3 uses the approved renting and buying copy', () => {
  const slide = SLIDES.find(item => item.id === 'budget-rent-buy');
  assert.ok(slide, 'Slide 3 must exist');
  assert.ok(slide.left.items.includes('The longer you wait, the more expensive buying becomes.'));
  assert.ok(slide.right.items.includes('You can personalize the home to fit your style and needs.'));
  assert.equal(slide.right.items.length, 4);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
node --no-warnings --test first-time-homebuyer/deck/tests/content-emphasis.test.mjs
```

Expected: FAIL because the old Renting sentence remains and Buying has only three bullets.

- [ ] **Step 3: Update the HTML slide data**

In `content/slides.js`, make the comparison arrays exactly:

```js
left: { label: 'Renting', items: [
  'Rent in Denver has trended up, year after year',
  'Flexible — but every payment builds someone else\'s equity',
  'The longer you wait, the more expensive buying becomes.',
]},
right: { label: 'Buying', items: [
  'A fixed payment while home values generally appreciate',
  'Equity compounds; you\'re paying yourself',
  'Most people step up — the first home isn\'t the last',
  'You can personalize the home to fit your style and needs.',
]},
```

- [ ] **Step 4: Mirror the two changes in the PowerPoint builder**

In `build_pptx.py`, set the `budget-rent-buy` arrays to:

```python
left=dict(label='Renting',items=['Rent in Denver has trended up, year after year','Flexible — but every payment builds someone else’s equity','The longer you wait, the more expensive buying becomes.']),
right=dict(label='Buying',items=['A fixed payment while home values generally appreciate','Equity compounds; you’re paying yourself','Most people step up — the first home isn’t the last','You can personalize the home to fit your style and needs.']),
```

- [ ] **Step 5: Run the copy test and syntax checks and verify GREEN**

Run:

```bash
node --no-warnings --test first-time-homebuyer/deck/tests/content-emphasis.test.mjs
node --check first-time-homebuyer/deck/content/slides.js
PYTHONDONTWRITEBYTECODE=1 python3 -m py_compile first-time-homebuyer/deck/build_pptx.py
```

Expected: all content tests pass and both source files compile without output.

- [ ] **Step 6: Record the checkpoint without committing overlapping dirty files**

Run:

```bash
git diff --check -- first-time-homebuyer/deck/content/slides.js first-time-homebuyer/deck/build_pptx.py first-time-homebuyer/deck/tests/content-emphasis.test.mjs
git status --short -- first-time-homebuyer/deck/content/slides.js first-time-homebuyer/deck/build_pptx.py first-time-homebuyer/deck/tests/content-emphasis.test.mjs
```

Expected: no whitespace errors; only the intended existing dirty files and test file are listed.

### Task 3: Verify the real two-window workflow and future PowerPoint build

**Files:**
- Verify: `first-time-homebuyer/deck/index.html`
- Verify: `first-time-homebuyer/deck/presenter.html`
- Verify: `first-time-homebuyer/deck/assets/presenter/slide-03/*.png`
- Verify: `first-time-homebuyer/deck/build_pptx.py`

**Interfaces:**
- Consumes: existing presenter graph rendering and audience `open-media` modal behavior.
- Produces: verification evidence only; no production code.

- [ ] **Step 1: Run the full automated suite**

Run:

```bash
node --no-warnings --test first-time-homebuyer/deck/tests/*.test.mjs
node --check first-time-homebuyer/deck/js/deck.js
node --check first-time-homebuyer/deck/js/modal.js
node --check first-time-homebuyer/deck/js/presenter.js
git diff --check
```

Expected: all tests pass, syntax checks exit 0, and the diff has no whitespace errors.

- [ ] **Step 2: Verify the PowerPoint builder in an isolated temporary directory**

Create a directory with `mktemp -d`, copy `first-time-homebuyer/deck` into it, run `build_pptx.py` with the bundled workspace Python, and inspect the generated file with python-pptx.

Expected output:

```text
MODALS: 30
SLIDES: 16
slides: 46
```

Delete only the exact temporary directory after verification. Do not replace `first-time-homebuyer/Homebuyers-Playbook.pptx` in the repository.

- [ ] **Step 3: Verify presenter graph visibility and loading in a browser**

Serve `first-time-homebuyer/deck` on localhost and use the Playwright CLI to:

```text
1. Open the audience deck and navigate to #myths.
2. Open the presenter and assert Slide 2 still shows five graph buttons.
3. Advance once to #budget-rent-buy.
4. Assert the presenter shows exactly Denver Rent Trends and Renting vs. Buying Wealth.
5. Assert the audience DOM has no graph buttons or image paths before selection.
6. Open each graph and wait for img.complete with naturalWidth > 0.
7. Confirm the existing modal remains draggable and resizable.
8. Confirm the updated Renting and Buying bullets are visible and contain no strong descendants.
```

Expected: both exact PNGs decode in the audience popout only after presenter selection; Slide 2 and Slide 3 graph lists remain isolated by slide ID.

- [ ] **Step 4: Review browser console and preserve the worktree**

Run the Playwright console review at `info` level.

Expected: the deck logs `16 slides · 30 popouts · 39 min ✓` with no product warnings or errors. Stop the local server, close the test browser session, and leave the dirty worktree and branch intact.
