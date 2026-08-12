# Presenter Mortgage Calculator Implementation Plan

> **For Codex:** Execute this plan inline with the executing-plans workflow. Preserve all unrelated dirty files and commit only isolated documentation artifacts; the calculator implementation overlaps approved uncommitted webinar work and must not be committed without a separate user request.

**Goal:** Add a presenter-controlled, persistent, draggable, resizable mortgage payment calculator to the shared webinar deck and deploy the verified deck to production without changing protected sibling routes or downloads.

**Architecture:** A pure calculator-math module feeds a deck-native calculator dialog module. The shared audience deck owns visibility, while the presenter window sends visibility requests and renders authoritative state broadcasts. Deployment starts from the latest successful Amplify artifact and replaces only an explicit allowlist under `/webinars/homebuyers-webinar/`.

**Tech Stack:** Browser-native ES modules, HTML/CSS, Node's built-in test runner, Playwright browser verification, Python static server, AWS Amplify manual deployments.

---

## Task 1: Establish the clean test baseline

**Files:**
- Inspect: `first-time-homebuyer/deck/tests/*.test.mjs`
- Inspect: `first-time-homebuyer/deck/js/deck.js`
- Inspect: `first-time-homebuyer/deck/js/presenter.js`

**Step 1: Run the current deck tests**

Run: `node --test tests/*.test.mjs`

Expected: all existing tests pass before calculator work begins.

**Step 2: Record syntax baseline**

Run: `node --check js/deck.js && node --check js/presenter.js`

Expected: both modules parse successfully.

## Task 2: Implement calculator math test-first

**Files:**
- Create: `first-time-homebuyer/deck/tests/calculator-math.test.mjs`
- Create: `first-time-homebuyer/deck/js/calculator-math.js`

**Step 1: Write failing unit tests**

Cover the approved defaults and calculation rules:

```js
test('approved defaults calculate the expected monthly payment', () => {
  const result = calculatePayment(DEFAULT_CALCULATOR_STATE);
  assert.equal(result.loanAmount, 436500);
  assert.equal(formatMoney(result.monthlyTotal), '$3,372');
});
```

Also test zero interest, down-payment clamping, the 20 percent mortgage-insurance threshold, invalid values becoming zero, and U.S. whole-dollar formatting.

**Step 2: Verify the tests fail**

Run: `node --test tests/calculator-math.test.mjs`

Expected: FAIL because `calculator-math.js` does not exist.

**Step 3: Implement the pure math module**

Export:

```js
export const DEFAULT_CALCULATOR_STATE = { /* approved values */ };
export function parseNonNegative(value) { /* invalid -> 0 */ }
export function calculatePayment(state) { /* amortization and line items */ }
export function formatMoney(value) { /* rounded USD */ }
```

Keep all DOM behavior out of this module.

**Step 4: Verify the math tests pass**

Run: `node --test tests/calculator-math.test.mjs`

Expected: PASS.

## Task 3: Implement the calculator dialog contract test-first

**Files:**
- Create: `first-time-homebuyer/deck/tests/calculator-contract.test.mjs`
- Create: `first-time-homebuyer/deck/js/calculator.js`
- Create: `first-time-homebuyer/deck/css/calculator.css`
- Modify: `first-time-homebuyer/deck/index.html`

**Step 1: Write failing source-contract tests**

Assert that the audience entry point loads the calculator stylesheet, the calculator module exports the approved three-function interface, the markup uses `role="dialog"`, the real Equal Housing Lender asset, a close control, a visible resize handle, and no CTA or Google Fonts dependency.

**Step 2: Verify the tests fail**

Run: `node --test tests/calculator-contract.test.mjs`

Expected: FAIL while the component files and stylesheet link are absent.

**Step 3: Build the dialog module**

Implement:

```js
initCalculator({ onVisibilityChange })
setCalculatorVisible(visible, opener)
isCalculatorVisible()
```

The module creates its hidden DOM directly under `body`, preserves field values for the browser session, recalculates on input, traps focus, closes on Escape/backdrop/X, recenters at the approved default size when reopened, and supports pointer drag/resize with viewport clamping.

**Step 4: Style desktop and narrow-screen behavior**

Use the deck palette and local font stack. Enforce the 420-by-420 desktop minimum, eight-pixel viewport margin, internally scrolling body, and viewport-fitted non-draggable layout at 560 pixels and below.

**Step 5: Verify contract and math tests**

Run: `node --test tests/calculator-math.test.mjs tests/calculator-contract.test.mjs`

Expected: PASS.

## Task 4: Wire authoritative presenter synchronization test-first

**Files:**
- Modify: `first-time-homebuyer/deck/presenter.html`
- Modify: `first-time-homebuyer/deck/js/presenter.js`
- Modify: `first-time-homebuyer/deck/js/deck.js`
- Modify: `first-time-homebuyer/deck/tests/calculator-contract.test.mjs`

**Step 1: Add failing integration contracts**

Assert:

- persistent presenter button `#p-calculator`;
- labels `Show calculator` and `Hide calculator`;
- request message `calculator-visibility`;
- state message `calculator-state`;
- calculator initialization in the audience deck;
- presenter `hello` receives current calculator visibility.

**Step 2: Verify the integration contract fails**

Run: `node --test tests/calculator-contract.test.mjs`

Expected: FAIL until both windows are wired.

**Step 3: Wire the shared deck**

Initialize the calculator once, handle validated boolean visibility requests, broadcast resulting state, include state in `hello`, and broadcast audience-side closes. Do not call the calculator from `show()`, so it persists across slide changes.

**Step 4: Wire the presenter**

Add the persistent button to the existing tool area, send visibility requests, and render only the authoritative state returned from the deck.

**Step 5: Verify all source tests and syntax**

Run: `node --test tests/*.test.mjs`

Run: `node --check js/calculator-math.js && node --check js/calculator.js && node --check js/deck.js && node --check js/presenter.js`

Expected: all tests and syntax checks pass.

## Task 5: Verify the complete local two-window workflow

**Files:**
- Verify: `first-time-homebuyer/deck/index.html`
- Verify: `first-time-homebuyer/deck/presenter.html`

**Step 1: Start the local deck**

Run: `python3 -m http.server 4173`

**Step 2: Exercise the presenter and audience windows**

With Playwright, verify:

- the presenter button is present on every slide and absent from audience navigation;
- opening shows approved default values and `$3,372` total;
- inputs and term selection recalculate;
- calculator remains visible through next/previous slide navigation;
- desktop drag and resize work and respect minimum/viewport limits;
- audience close synchronizes presenter label;
- reopening preserves values but restores centered default dimensions;
- presenter hide closes the audience calculator;
- Escape, backdrop close, focus trap, and focus restoration work;
- graph and educational popouts still close on slide changes while the calculator remains visible;
- no browser console errors or external font/network dependency is introduced.

**Step 3: Visually inspect responsive layouts**

Capture and inspect the calculator at 1280-by-720, 1920-by-1080, and a narrow viewport at or below 560 pixels.

**Step 4: Run final local quality gates**

Run: `node --test tests/*.test.mjs`

Run: `git diff --check`

Expected: all tests pass and no whitespace errors exist.

## Task 6: Build a protected production deployment bundle

**Files:**
- Read from: latest successful Amplify production artifact
- Stage: an exact temporary directory created with `mktemp -d`
- Deploy: `/webinars/homebuyers-webinar/` allowlist only

**Step 1: Reconfirm deployment identity and latest successful job**

Run AWS read-only checks for account `116981808374`, app `d1u9vaaso8yrd4`, branch `main`, region `us-east-1`, then resolve the newest job with status `SUCCEED`.

**Step 2: Download and preserve the live base**

Download that job's artifact into a fresh temporary directory. Compute SHA-256 hashes for the production root page, `/webinars/` page, and both PowerPoint files.

**Step 3: Replace only the deck allowlist**

Stage current verified versions of:

- `index.html` and `presenter.html`;
- `css/*.css`;
- `js/*.js`;
- `content/*.js`;
- only referenced brand assets and presenter portraits;
- all registered slide 2 and slide 3 presenter PNGs;
- the unchanged production `downloads/` directory.

Exclude source, tests, docs, build scripts, local artifacts, metadata files, and unrelated portraits.

**Step 4: Verify the bundle before upload**

Confirm protected hashes are unchanged, all referenced local assets resolve, and `unzip -t` reports archive integrity.

## Task 7: Deploy and verify production

**Files:**
- Upload: verified full-site ZIP
- Retain: exact previous successful artifact for rollback until completion

**Step 1: Create, upload, and start the Amplify deployment**

Use `aws amplify create-deployment`, upload the exact ZIP to the returned URL, and start the job. Poll until a terminal status without waits longer than 60 seconds.

Expected: deployment status `SUCCEED`.

**Step 2: Verify HTTP routes and byte preservation**

Verify HTTP 200 on both the custom and Amplify domains for the root, webinar listing, audience deck, presenter, and downloads. Recompute protected hashes and confirm exact matches with the downloaded live base.

**Step 3: Verify deployed calculator file hashes**

Fetch deployed calculator JavaScript, math module, stylesheet, deck integration, and presenter integration and compare them to the verified local files.

**Step 4: Run deployed browser acceptance**

Repeat the core two-window show, calculate, slide-persistence, resize, audience-close sync, and presenter-hide workflow against `https://msfgmortgage.com/webinars/homebuyers-webinar/`.

**Step 5: Roll back if any protected or functional check fails**

Upload the exact retained previous artifact as a new Amplify deployment and verify restoration before reporting failure.

**Step 6: Clean exact temporary paths**

Delete only the validated temporary staging directories after every production check passes. Preserve the dirty working tree and all unrelated user files.

