# Decoding Loan Estimates and Closing Disclosures Webinar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish a separate MSFG webinar that lets a presenter switch among matching LE/CD, Purchase/Rate-and-term Refinance, Lender-paid/Borrower-paid, and Conventional/FHA/VA scenarios, then explain every populated fee directly on the reconstructed disclosure.

**Architecture:** A pure scenario engine builds one validated disclosure model from four selector values. Semantic HTML page renderers consume that model, while a small state store preserves the selected page, section, or fee across scenario changes; the document-first UI keeps the form visible beside a stable explanation panel. The first three phases create and verify a new isolated `decoding-le-cd/` source tree; a fourth phase packages it into the current production artifact only after preview and compliance approval.

**Tech Stack:** Static HTML5, CSS, native JavaScript ES modules, Node.js 24 built-in test runner, Python HTTP server, Playwright CLI, Poppler PDF utilities, AWS Amplify manual deployment.

## Global Constraints

- Execute from an isolated worktree created with `superpowers:using-git-worktrees`; treat `/Users/zacharyzink/MSFG/Webinars` as a read-only source for current approved brand assets and patterns.
- Preserve all unrelated dirty files and concurrent work. Never stash, reset, switch, format, stage, or commit files outside the exact task paths.
- Create the webinar under `decoding-le-cd/`; do not modify `first-time-homebuyer/` during Phases 1-3.
- Public route: `/webinars/decoding-le-cd/`.
- Default/reset state: Loan Estimate, Purchase, Lender paid, Conventional, Page 1, no selected teaching target.
- The 12 selector combinations must produce 24 document states: one three-page LE and one five-page CD for each combination.
- Every populated fee and every key teaching value must be selectable and must resolve to a reviewed explanation.
- Purchase and Refinance are separate fixed fictional transaction families; the Refinance family is rate-and-term only and has no cash-out proceeds.
- The Refinance family uses a `$145,000.00` existing payoff against a `$150,000.00` base loan. Its fixed LE requires `$99.00` from the borrower and its fixed CD requires `$757.57` from the borrower; financed FHA/VA program fees do not become available cash proceeds.
- Within a transaction family, borrower, property, date, provider, and non-program fee assumptions stay fixed across program and compensation switches.
- Borrower-paid compensation adds a `$4,500.00` Section A charge and an equal `-$4,500.00` general lender credit in Section J. The panel must distinguish pre-credit `D + I` from post-credit Total Closing Costs and Cash to Close.
- Lender-paid compensation is absent as a consumer-paid Section A item on the LE. On the CD, the fixed third-party-originator example shows `$4,500.00` in the applicable paid-by-others treatment.
- Program assumptions are fixed educational examples as of `2026-08-12`: FHA UFMIP `1.75%`, FHA annual MIP `0.55%` for the selected more-than-15-year/high-LTV examples, VA first-use purchase funding fee `2.15%`, and VA IRRRL funding fee `0.50%`.
- Use the historic CFPB sample rates only to keep paired sample arithmetic coherent: `3.875%` Purchase and `4.250%` Refinance. Label them historic educational sample rates, not current pricing.
- Store money as integer cents and rates as integer thousandths of one percent. Do not use binary floating-point values as persisted money.
- Forms are semantic HTML/CSS reconstructions; do not ship the CFPB PDFs as the browser UI.
- Preserve the disclosure's black-and-white hierarchy. Ridgeline colors belong to the surrounding shell, selection states, and teaching panel.
- Use Deep Forest `#0C3335`, Forest Mid `#14494B`, MSFG Green `#8CC63E`, Mist `#F5F7F4`, White `#FFFFFF`, Charcoal `#404041`, Montserrat display type, Open Sans body type, and squared geometry.
- Use fictional parties and identifiers only. Never copy, log, or request production borrower data.
- No backend, authentication, database, editable loan calculator, live rates, automated eligibility result, tolerance ruling, or PowerPoint in this implementation.
- Each phase ends with the stated evidence and a user approval stop. Do not continue automatically into the next phase.
- Do not publish until the local preview and MSFG compliance checklist are explicitly approved.

---

## File Structure

### Reference and documentation files

- `decoding-le-cd/references/source-manifest.json` — pinned CFPB files, official web sources, hashes, dates, and program assumptions.
- `decoding-le-cd/references/H24B-purchase-loan-estimate.pdf` — pinned CFPB Purchase LE sample; source only.
- `decoding-le-cd/references/H25B-purchase-closing-disclosure.pdf` — pinned CFPB Purchase CD sample; source only.
- `decoding-le-cd/references/H24D-refinance-loan-estimate.pdf` — pinned CFPB Refinance LE sample; source only.
- `decoding-le-cd/references/H25E-refinance-closing-disclosure.pdf` — pinned CFPB Refinance CD sample; source only.
- `decoding-le-cd/README.md` — local preview, controls, architecture, test, and source instructions.
- `decoding-le-cd/VALIDATION.md` — final scenario, arithmetic, interaction, accessibility, visual, and compliance evidence.

### Application content and domain files

- `decoding-le-cd/deck/content/brand.js` — MSFG identity, licensing, educational disclosure, and logo paths.
- `decoding-le-cd/deck/content/scenarios.js` — Purchase and Refinance baseline facts and raw line items.
- `decoding-le-cd/deck/content/programs.js` — Conventional, FHA, and VA transformations and dated assumptions.
- `decoding-le-cd/deck/content/compensation.js` — lender-paid and borrower-paid presentation rules.
- `decoding-le-cd/deck/content/fee-definitions.js` — reusable line-level definitions, questions, and primary sources.
- `decoding-le-cd/deck/content/section-definitions.js` — page and section explanations in form order.
- `decoding-le-cd/deck/domain/contracts.js` — selector enums, money/rate conventions, deep-freeze, and assertions.
- `decoding-le-cd/deck/domain/calculate.js` — payment, section totals, closing-cost totals, cash-to-close, and comparison calculations.
- `decoding-le-cd/deck/domain/build-scenario.js` — baseline + program + compensation orchestration.
- `decoding-le-cd/deck/domain/validate-scenario.js` — invariant and completeness enforcement.
- `decoding-le-cd/deck/domain/targets.js` — stable fee/section IDs, cross-document mapping, and fallback resolution.

### Document renderers

- `decoding-le-cd/deck/documents/shared.js` — escaping, money/rate formatting, field rows, selectable targets, form headers, and page furniture.
- `decoding-le-cd/deck/documents/loan-estimate/page-1.js`
- `decoding-le-cd/deck/documents/loan-estimate/page-2.js`
- `decoding-le-cd/deck/documents/loan-estimate/page-3.js`
- `decoding-le-cd/deck/documents/loan-estimate/index.js` — three-page LE dispatcher.
- `decoding-le-cd/deck/documents/closing-disclosure/page-1.js`
- `decoding-le-cd/deck/documents/closing-disclosure/page-2.js`
- `decoding-le-cd/deck/documents/closing-disclosure/page-3.js`
- `decoding-le-cd/deck/documents/closing-disclosure/page-4.js`
- `decoding-le-cd/deck/documents/closing-disclosure/page-5.js`
- `decoding-le-cd/deck/documents/closing-disclosure/index.js` — five-page CD dispatcher.

### UI and assets

- `decoding-le-cd/deck/index.html` — application shell and static metadata.
- `decoding-le-cd/deck/ui/store.js` — pure reducer and observable state store.
- `decoding-le-cd/deck/ui/controls.js` — selector, page, teaching-target, zoom, fullscreen, and reset controls.
- `decoding-le-cd/deck/ui/disclosure-viewer.js` — renderer selection, focus preservation, and changed-value markers.
- `decoding-le-cd/deck/ui/explainer.js` — section/fee teaching panel and LE/CD comparison.
- `decoding-le-cd/deck/ui/app.js` — initialization and event wiring.
- `decoding-le-cd/deck/css/tokens.css` — copied Ridgeline tokens required by this app.
- `decoding-le-cd/deck/css/disclosure.css` — standardized form layout and selectable rows.
- `decoding-le-cd/deck/css/webinar.css` — application shell, teaching panel, controls, and motion.
- `decoding-le-cd/deck/css/responsive.css` — laptop, tablet, phone, and print behavior.
- `decoding-le-cd/deck/assets/brand/logo-horizontal.svg`
- `decoding-le-cd/deck/assets/brand/logo-horizontal-knockout.svg`
- `decoding-le-cd/deck/assets/brand/equal-housing-lender.png`

### Tests

- `decoding-le-cd/deck/tests/source-manifest.test.mjs`
- `decoding-le-cd/deck/tests/baselines.test.mjs`
- `decoding-le-cd/deck/tests/calculate.test.mjs`
- `decoding-le-cd/deck/tests/scenario-matrix.test.mjs`
- `decoding-le-cd/deck/tests/content-completeness.test.mjs`
- `decoding-le-cd/deck/tests/document-contract.test.mjs`
- `decoding-le-cd/deck/tests/store.test.mjs`
- `decoding-le-cd/deck/tests/a11y-contract.test.mjs`

---

## Phase 1 — Sources and Scenario Engine

### Task 1: Pin the Official Source Set

**Files:**
- Create: `decoding-le-cd/references/source-manifest.json`
- Create: `decoding-le-cd/references/H24B-purchase-loan-estimate.pdf`
- Create: `decoding-le-cd/references/H25B-purchase-closing-disclosure.pdf`
- Create: `decoding-le-cd/references/H24D-refinance-loan-estimate.pdf`
- Create: `decoding-le-cd/references/H25E-refinance-closing-disclosure.pdf`
- Create: `decoding-le-cd/deck/tests/source-manifest.test.mjs`

**Interfaces:**
- Produces: a committed, hash-verified source set consumed by content and compliance tasks.
- Produces: `source-manifest.json` entries with `{ id, url, sha256, bytes, filePages, formPages }`.

- [ ] **Step 1: Create the isolated execution worktree and record the protected baseline**

Use `superpowers:using-git-worktrees`, then record:

```bash
git status --short
git rev-parse HEAD
git diff --name-only
```

Expected: the execution worktree is clean. Save the originating repository's dirty-path list in the execution notes; do not reproduce or discard those changes.

- [ ] **Step 2: Write the failing source-manifest test**

Create `decoding-le-cd/deck/tests/source-manifest.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const expected = new Map([
  ['H24B', ['243551dbce6362e616328924eaf5b1818b734883d43ec91a73c160e5da52b385', 73870, 4, 3]],
  ['H25B', ['606a93c8baaca815439822df5cf8c78cbb2dcf6cc4af5aa291a459c7917e4173', 94194, 6, 5]],
  ['H24D', ['baadbe3d1f1254f422c6ab30b53dac91649be9d5300702cd5068bc1090be1560', 74539, 4, 3]],
  ['H25E', ['6c05ffba10741d55d5bdc6dd946eefc0873fd6088a19c3a24219fb2ed8aa341a', 88531, 6, 5]],
]);

test('CFPB source files match the pinned manifest', async () => {
  const manifest = JSON.parse(await readFile(new URL('../../references/source-manifest.json', import.meta.url)));
  assert.equal(manifest.asOf, '2026-08-12');
  for (const item of manifest.documents) {
    const [sha256, bytes, filePages, formPages] = expected.get(item.id);
    const data = await readFile(new URL(`../../references/${item.file}`, import.meta.url));
    assert.equal(createHash('sha256').update(data).digest('hex'), sha256);
    assert.equal(data.byteLength, bytes);
    assert.deepEqual([item.filePages, item.formPages], [filePages, formPages]);
  }
});
```

- [ ] **Step 3: Run the test and verify RED**

```bash
node --experimental-default-type=module --test decoding-le-cd/deck/tests/source-manifest.test.mjs
```

Expected: FAIL because `source-manifest.json` does not exist.

- [ ] **Step 4: Download the four exact CFPB files**

```bash
mkdir -p decoding-le-cd/references
curl -fsSL 'https://files.consumerfinance.gov/f/201403_cfpb_loan-estimate_fixed-rate-loan-sample-H24B.pdf' -o decoding-le-cd/references/H24B-purchase-loan-estimate.pdf
curl -fsSL 'https://files.consumerfinance.gov/f/201403_cfpb_closing-disclosure_cover-H25B.pdf' -o decoding-le-cd/references/H25B-purchase-closing-disclosure.pdf
curl -fsSL 'https://files.consumerfinance.gov/f/201403_cfpb_loan-estimate_refinance-sample-H24D.pdf' -o decoding-le-cd/references/H24D-refinance-loan-estimate.pdf
curl -fsSL 'https://files.consumerfinance.gov/f/201403_cfpb_closing-disclosure_cover-H25E.pdf' -o decoding-le-cd/references/H25E-refinance-closing-disclosure.pdf
```

- [ ] **Step 5: Create the exact source manifest**

Create `decoding-le-cd/references/source-manifest.json` with the four file records above and these authoritative web sources:

```json
{
  "asOf": "2026-08-12",
  "documents": [
    {"id":"H24B","file":"H24B-purchase-loan-estimate.pdf","url":"https://files.consumerfinance.gov/f/201403_cfpb_loan-estimate_fixed-rate-loan-sample-H24B.pdf","sha256":"243551dbce6362e616328924eaf5b1818b734883d43ec91a73c160e5da52b385","bytes":73870,"filePages":4,"formPages":3},
    {"id":"H25B","file":"H25B-purchase-closing-disclosure.pdf","url":"https://files.consumerfinance.gov/f/201403_cfpb_closing-disclosure_cover-H25B.pdf","sha256":"606a93c8baaca815439822df5cf8c78cbb2dcf6cc4af5aa291a459c7917e4173","bytes":94194,"filePages":6,"formPages":5},
    {"id":"H24D","file":"H24D-refinance-loan-estimate.pdf","url":"https://files.consumerfinance.gov/f/201403_cfpb_loan-estimate_refinance-sample-H24D.pdf","sha256":"baadbe3d1f1254f422c6ab30b53dac91649be9d5300702cd5068bc1090be1560","bytes":74539,"filePages":4,"formPages":3},
    {"id":"H25E","file":"H25E-refinance-closing-disclosure.pdf","url":"https://files.consumerfinance.gov/f/201403_cfpb_closing-disclosure_cover-H25E.pdf","sha256":"6c05ffba10741d55d5bdc6dd946eefc0873fd6088a19c3a24219fb2ed8aa341a","bytes":88531,"filePages":6,"formPages":5}
  ],
  "webSources": {
    "cfpbGuide": "https://files.consumerfinance.gov/f/documents/cfpb_kbyo_guide-to-loan-estimate-and-closing-disclosure-forms_v2.0.pdf",
    "cfpbLoanEstimate": "https://www.consumerfinance.gov/owning-a-home/loan-estimate/",
    "cfpbClosingDisclosure": "https://www.consumerfinance.gov/owning-a-home/closing-disclosure/",
    "cfpbRegulationLE": "https://www.consumerfinance.gov/rules-policy/regulations/1026/37/",
    "cfpbRegulationCD": "https://www.consumerfinance.gov/rules-policy/regulations/1026/38/",
    "hudFhaMip": "https://answers.hud.gov/FHA/s/article/What-is-the-FHA-Mortgage-Insurance-Premium-structure-for-forward-mortgage-loans",
    "vaFundingFee": "https://www.va.gov/housing-assistance/home-loans/funding-fee-and-closing-costs/"
  },
  "programAssumptions": {
    "fhaUpfrontMipPercent": 1.75,
    "fhaAnnualMipPercent": 0.55,
    "vaFirstUsePurchaseFundingFeePercent": 2.15,
    "vaIrrrlFundingFeePercent": 0.50
  }
}
```

- [ ] **Step 6: Verify GREEN and commit**

```bash
node --experimental-default-type=module --test decoding-le-cd/deck/tests/source-manifest.test.mjs
git diff --check -- decoding-le-cd
git add -- decoding-le-cd/references decoding-le-cd/deck/tests/source-manifest.test.mjs
git commit -m 'chore: pin LE and CD webinar sources'
```

Expected: `1` test passes and the commit contains only the source set, manifest, and test.

### Task 2: Define Domain Contracts and Fixed Baselines

**Files:**
- Create: `decoding-le-cd/deck/domain/contracts.js`
- Create: `decoding-le-cd/deck/content/scenarios.js`
- Create: `decoding-le-cd/deck/tests/baselines.test.mjs`

**Interfaces:**
- Produces: `DOCUMENTS`, `TRANSACTIONS`, `COMPENSATION_TYPES`, `PROGRAMS`, and `DEFAULT_SELECTION`.
- Produces: `deepFreeze(value)`, `assertEnum(name, value, allowed)`, and `assertCents(name, value)`.
- Produces: `BASELINES.purchase` and `BASELINES.refinance`.
- Money convention: integer cents. Rate convention: `rateMilliPct`, where `3875` means `3.875%`.
- Fee-line shape: `{ id, section, label, leAmountCents, cdAmountCents, lePaidBy, cdColumn, provider, changeReason, financeCharge }`.

- [ ] **Step 1: Write the failing baseline contract tests**

Create `decoding-le-cd/deck/tests/baselines.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { BASELINES } from '../content/scenarios.js';
import { DEFAULT_SELECTION } from '../domain/contracts.js';

test('default selection is the approved starting state', () => {
  assert.deepEqual(DEFAULT_SELECTION, {
    document: 'le', transaction: 'purchase', compensation: 'lender-paid',
    program: 'conventional', page: 1, targetId: null, zoom: 1,
  });
});

test('purchase baseline retains the paired CFPB H24B and H25B totals', () => {
  const p = BASELINES.purchase;
  assert.equal(p.property.valueCents, 18_000_000);
  assert.deepEqual(p.terms, { baseLoanCents: 16_200_000, rateMilliPct: 3875, termMonths: 360 });
  assert.deepEqual(p.controlTotals, {
    leClosingCostsCents: 805_400,
    leCashToCloseCents: 1_605_400,
    cdClosingCostsCents: 971_210,
    cdCashToCloseCents: 1_414_726,
  });
});

test('refinance baseline is the paired rate-and-term teaching sample', () => {
  const r = BASELINES.refinance;
  assert.equal(r.property.valueCents, 18_000_000);
  assert.deepEqual(r.terms, { baseLoanCents: 15_000_000, rateMilliPct: 4250, termMonths: 360 });
  assert.deepEqual(r.controlTotals, {
    leClosingCostsCents: 509_900,
    leCashToCloseCents: 9_900,
    cdClosingCostsCents: 575_757,
    cdCashToCloseCents: 75_757,
  });
  assert.equal(r.payoffCents, 14_500_000);
  assert.equal(r.cashDirection, 'from-borrower');
  assert.equal(r.cashOutCents, 0);
});
```

- [ ] **Step 2: Run the tests and verify RED**

```bash
node --experimental-default-type=module --test decoding-le-cd/deck/tests/baselines.test.mjs
```

Expected: FAIL because the domain and scenario modules do not exist.

- [ ] **Step 3: Implement the domain constants and assertions**

Create `domain/contracts.js` with these exact public values:

```js
export const DOCUMENTS = Object.freeze(['le', 'cd']);
export const TRANSACTIONS = Object.freeze(['purchase', 'refinance']);
export const COMPENSATION_TYPES = Object.freeze(['lender-paid', 'borrower-paid']);
export const PROGRAMS = Object.freeze(['conventional', 'fha', 'va']);
export const DEFAULT_SELECTION = Object.freeze({
  document: 'le', transaction: 'purchase', compensation: 'lender-paid',
  program: 'conventional', page: 1, targetId: null, zoom: 1,
});
export const deepFreeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};
export function assertEnum(name, value, allowed) {
  if (!allowed.includes(value)) throw new RangeError(`${name}: ${value}`);
  return value;
}
export function assertCents(name, value) {
  if (!Number.isSafeInteger(value)) throw new TypeError(`${name} must be integer cents`);
  return value;
}
```

- [ ] **Step 4: Encode the two exact CFPB-derived baselines**

Create `content/scenarios.js`. Use fictional MSFG-branded parties. Encode every populated fee and control total from H24B/H25B for Purchase. For Refinance, retain the H24D/H25E form structure, loan terms, and fee examples but replace their cash-out payoff facts with the approved `$145,000.00` payoff and from-borrower cash calculation. Preserve these required semantic fee IDs:

```js
export const REQUIRED_FEE_IDS = Object.freeze([
  'costs.a.points', 'costs.a.application-fee', 'costs.a.origination-fee', 'costs.a.underwriting-fee',
  'costs.b.appraisal-fee', 'costs.b.credit-report-fee', 'costs.b.flood-determination-fee',
  'costs.b.flood-monitoring-fee', 'costs.b.tax-monitoring-fee', 'costs.b.tax-status-research-fee',
  'costs.c.pest-inspection-fee', 'costs.c.survey-fee', 'costs.c.title-insurance-binder',
  'costs.c.lenders-title-insurance', 'costs.c.settlement-agent-fee', 'costs.c.title-search-fee',
  'costs.e.recording-fees', 'costs.e.transfer-taxes', 'costs.f.homeowners-insurance-premium',
  'costs.f.mortgage-insurance-premium', 'costs.f.prepaid-interest', 'costs.f.property-taxes',
  'costs.g.initial-escrow-homeowners', 'costs.g.initial-escrow-mortgage-insurance',
  'costs.g.initial-escrow-property-taxes', 'costs.h.hoa-capital-contribution',
  'costs.h.hoa-processing-fee', 'costs.h.home-inspection-fee', 'costs.h.home-warranty-fee',
  'costs.h.owners-title-insurance', 'costs.j.lender-credits', 'payoffs.existing-mortgage',
]);
```

Use `deepFreeze()` on the exported baselines. The Purchase control totals must be `$8,054.00`, `$16,054.00`, `$9,712.10`, and `$14,147.26`; the Refinance control totals must be `$5,099.00`, `$99.00`, `$5,757.57`, and `$757.57` in LE closing costs, LE cash from borrower, CD closing costs, and CD cash from borrower order. The Refinance base loan is `$150,000.00`, the payoff is `$145,000.00`, and cash out is exactly `$0.00`.

- [ ] **Step 5: Run the tests and commit**

```bash
node --experimental-default-type=module --test decoding-le-cd/deck/tests/baselines.test.mjs
git diff --check -- decoding-le-cd
git add -- decoding-le-cd/deck/domain/contracts.js decoding-le-cd/deck/content/scenarios.js decoding-le-cd/deck/tests/baselines.test.mjs
git commit -m 'feat: define disclosure scenario baselines'
```

Expected: `3` tests pass; only the two modules and baseline test are committed.

### Task 3: Implement Calculation and Invariant Functions

**Files:**
- Create: `decoding-le-cd/deck/domain/calculate.js`
- Create: `decoding-le-cd/deck/domain/validate-scenario.js`
- Create: `decoding-le-cd/deck/tests/calculate.test.mjs`

**Interfaces:**
- Produces: `monthlyPrincipalInterest({ principalCents, rateMilliPct, termMonths }): number`.
- Produces: `annualPercentageRate({ amountFinancedCents, scheduledCashFlows }): number` in `rateMilliPct` units.
- Produces: `totalInterestPercentage({ totalInterestCents, loanAmountCents }): number` in `rateMilliPct` units.
- Produces: `sumLines(lines, document, predicate?): number`.
- Produces: `calculateDisclosure(scenario): CalculatedScenario`.
- Produces: `changedTargetIds(previousScenario, nextScenario, document): string[]`.
- Produces: `validateScenario(scenario): true`; throws an error containing the exact invariant name and scenario ID.

- [ ] **Step 1: Write failing arithmetic tests**

Create `tests/calculate.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { monthlyPrincipalInterest, calculateDisclosure } from '../domain/calculate.js';
import { validateScenario } from '../domain/validate-scenario.js';
import { BASELINES } from '../content/scenarios.js';

test('monthly payment matches both CFPB sample controls', () => {
  assert.equal(monthlyPrincipalInterest({ principalCents: 16_200_000, rateMilliPct: 3875, termMonths: 360 }), 76_178);
  assert.equal(monthlyPrincipalInterest({ principalCents: 15_000_000, rateMilliPct: 4250, termMonths: 360 }), 73_791);
});

test('zero rate divides principal evenly and rounds once', () => {
  assert.equal(monthlyPrincipalInterest({ principalCents: 12_000_000, rateMilliPct: 0, termMonths: 360 }), 33_333);
});

test('baseline disclosure totals reconcile to their controls', () => {
  for (const baseline of Object.values(BASELINES)) {
    const result = calculateDisclosure(baseline);
    assert.equal(validateScenario(result), true);
    assert.equal(result.totals.le.totalClosingCostsCents, baseline.controlTotals.leClosingCostsCents);
    assert.equal(result.totals.cd.totalClosingCostsCents, baseline.controlTotals.cdClosingCostsCents);
  }
});

test('regulatory comparison metrics are finite and internally ordered', () => {
  for (const baseline of Object.values(BASELINES)) {
    const result = calculateDisclosure(baseline);
    for (const document of ['le', 'cd']) {
      assert.ok(Number.isInteger(result.metrics[document].aprMilliPct));
      assert.ok(result.metrics[document].aprMilliPct >= result.terms.rateMilliPct);
      assert.ok(result.metrics[document].tipMilliPct > 0);
      assert.ok(result.metrics[document].totalPaymentsCents > result.terms.loanAmountCents);
    }
  }
});
```

- [ ] **Step 2: Run the tests and verify RED**

```bash
node --experimental-default-type=module --test decoding-le-cd/deck/tests/calculate.test.mjs
```

Expected: FAIL because calculation modules do not exist.

- [ ] **Step 3: Implement payment and disclosure arithmetic**

Implement `monthlyPrincipalInterest` with one final cent rounding:

```js
export function monthlyPrincipalInterest({ principalCents, rateMilliPct, termMonths }) {
  assertCents('principalCents', principalCents);
  if (!Number.isInteger(rateMilliPct) || rateMilliPct < 0) throw new RangeError('rateMilliPct');
  if (!Number.isInteger(termMonths) || termMonths <= 0) throw new RangeError('termMonths');
  if (rateMilliPct === 0) return Math.round(principalCents / termMonths);
  const monthlyRate = (rateMilliPct / 1000 / 100) / 12;
  return Math.round(principalCents * monthlyRate / (1 - Math.pow(1 + monthlyRate, -termMonths)));
}
```

`calculateDisclosure` must separately calculate LE and borrower-paid CD section totals, preserve CD paid-by-others amounts outside borrower-paid totals, apply signed lender credits, and derive cash-to-close from transaction-specific components. Do not read rendered text back from the DOM.

For APR, mark finance-charge lines in scenario data, calculate amount financed, then solve the monthly periodic rate by bisection until the present value of scheduled cash flows is within one cent of amount financed; annualize and return integer `rateMilliPct`. TIP is total scheduled interest divided by loan amount. Treat these as fixed educational metrics and include them in the compliance review rather than describing them as a regulatory calculation service.

- [ ] **Step 4: Implement named invariant errors**

`validateScenario` must check at least:

```js
const required = [
  ['LE_D_EQUALS_A_B_C', s.totals.le.dCents === s.totals.le.aCents + s.totals.le.bCents + s.totals.le.cCents],
  ['LE_J_EQUALS_D_I_CREDITS', s.totals.le.totalClosingCostsCents === s.totals.le.dCents + s.totals.le.iCents + s.totals.le.lenderCreditsCents],
  ['CD_D_EQUALS_A_B_C', s.totals.cd.dCents === s.totals.cd.aCents + s.totals.cd.bCents + s.totals.cd.cCents],
  ['CD_J_EQUALS_D_I_CREDITS', s.totals.cd.totalClosingCostsCents === s.totals.cd.dCents + s.totals.cd.iCents + s.totals.cd.lenderCreditsCents],
  ['CASH_TO_CLOSE_RECONCILES', s.cashToClose.le.reconciled && s.cashToClose.cd.reconciled],
  ['REFINANCE_HAS_NO_CASH_OUT', s.transaction !== 'refinance' || (s.cashOutCents === 0 && s.cashDirection === 'from-borrower')],
  ['FINANCED_PROGRAM_FEE_NOT_CASH_PROCEEDS', s.availableProceedsCents === s.terms.baseLoanCents],
  ['APR_IS_FINITE', Number.isInteger(s.metrics.le.aprMilliPct) && Number.isInteger(s.metrics.cd.aprMilliPct)],
  ['TIP_IS_POSITIVE', s.metrics.le.tipMilliPct > 0 && s.metrics.cd.tipMilliPct > 0],
];
for (const [name, pass] of required) if (!pass) throw new Error(`${s.id}:${name}`);
```

- [ ] **Step 5: Run all Phase 1 tests and commit**

```bash
node --experimental-default-type=module --test decoding-le-cd/deck/tests/*.test.mjs
git diff --check -- decoding-le-cd
git add -- decoding-le-cd/deck/domain/calculate.js decoding-le-cd/deck/domain/validate-scenario.js decoding-le-cd/deck/tests/calculate.test.mjs
git commit -m 'feat: calculate and validate disclosure totals'
```

Expected: source, baseline, and calculation tests pass.

### Task 4: Build the 12 Program and Compensation Scenarios

**Files:**
- Create: `decoding-le-cd/deck/content/programs.js`
- Create: `decoding-le-cd/deck/content/compensation.js`
- Create: `decoding-le-cd/deck/domain/build-scenario.js`
- Create: `decoding-le-cd/deck/tests/scenario-matrix.test.mjs`

**Interfaces:**
- Produces: `PROGRAM_RULES[program].apply(baseline): ScenarioDraft`.
- Produces: `COMPENSATION_RULES[type].apply(draft): ScenarioDraft`.
- Produces: `buildScenario({ transaction, program, compensation }): CalculatedScenario`.
- Produces: scenario IDs in the exact form `purchase-conventional-lender-paid`.

- [ ] **Step 1: Write the failing matrix tests**

Create `tests/scenario-matrix.test.mjs` with these exact program controls:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildScenario } from '../domain/build-scenario.js';

const selections = ['purchase', 'refinance'].flatMap(transaction =>
  ['conventional', 'fha', 'va'].flatMap(program =>
    ['lender-paid', 'borrower-paid'].map(compensation => ({ transaction, program, compensation }))));

test('all 12 scenarios build and validate', () => {
  assert.equal(selections.length, 12);
  for (const selection of selections) assert.equal(buildScenario(selection).valid, true);
});

test('purchase program financing uses the approved fixed assumptions', () => {
  const conventional = buildScenario({ transaction: 'purchase', program: 'conventional', compensation: 'lender-paid' });
  const fha = buildScenario({ transaction: 'purchase', program: 'fha', compensation: 'lender-paid' });
  const va = buildScenario({ transaction: 'purchase', program: 'va', compensation: 'lender-paid' });
  assert.deepEqual([conventional.terms.baseLoanCents, conventional.terms.financedProgramFeeCents], [16_200_000, 0]);
  assert.deepEqual([fha.terms.baseLoanCents, fha.terms.financedProgramFeeCents], [17_370_000, 303_975]);
  assert.deepEqual([va.terms.baseLoanCents, va.terms.financedProgramFeeCents], [18_000_000, 387_000]);
  assert.equal(va.payment.monthlyMortgageInsuranceCents, 0);
});

test('refinance program financing is rate-and-term only', () => {
  const fha = buildScenario({ transaction: 'refinance', program: 'fha', compensation: 'lender-paid' });
  const va = buildScenario({ transaction: 'refinance', program: 'va', compensation: 'lender-paid' });
  assert.deepEqual([fha.terms.baseLoanCents, fha.terms.financedProgramFeeCents], [15_000_000, 262_500]);
  assert.deepEqual([va.terms.baseLoanCents, va.terms.financedProgramFeeCents], [15_000_000, 75_000]);
  assert.equal(fha.cashOutCents, 0);
  assert.equal(va.cashOutCents, 0);
});

test('borrower-paid compensation raises gross costs and offsets net costs', () => {
  for (const transaction of ['purchase', 'refinance']) for (const program of ['conventional', 'fha', 'va']) {
    const lender = buildScenario({ transaction, program, compensation: 'lender-paid' });
    const borrower = buildScenario({ transaction, program, compensation: 'borrower-paid' });
    assert.equal(borrower.totals.le.dPlusICents - lender.totals.le.dPlusICents, 450_000);
    assert.equal(borrower.totals.le.lenderCreditsCents - lender.totals.le.lenderCreditsCents, -450_000);
    assert.equal(borrower.totals.le.totalClosingCostsCents, lender.totals.le.totalClosingCostsCents);
    assert.equal(borrower.totals.cd.totalClosingCostsCents, lender.totals.cd.totalClosingCostsCents);
  }
});
```

- [ ] **Step 2: Run the tests and verify RED**

```bash
node --experimental-default-type=module --test decoding-le-cd/deck/tests/scenario-matrix.test.mjs
```

Expected: FAIL because the scenario builder does not exist.

- [ ] **Step 3: Implement program rules as pure transformations**

Use these exact dated assumptions in `content/programs.js`:

```js
export const PROGRAM_ASSUMPTIONS = Object.freeze({
  asOf: '2026-08-12',
  conventional: { purchaseDownPercent: 10, annualMiMilliPct: 610 },
  fha: { purchaseDownPercent: 3.5, upfrontMipMilliPct: 1750, annualMipMilliPct: 550 },
  va: { purchaseDownPercent: 0, firstUsePurchaseFeeMilliPct: 2150, irrrlFeeMilliPct: 500, monthlyMiMilliPct: 0 },
});
```

Each `apply` function must return a new object, set program-specific loan type and mortgage-insurance/funding-fee lines, and leave all non-program lines byte-for-byte equivalent after JSON serialization.

- [ ] **Step 4: Implement compensation rules and orchestration**

Use these exact IDs and values in `content/compensation.js`:

```js
export const COMPENSATION_AMOUNT_CENTS = 450_000;
export const COMPENSATION_FEE_ID = 'costs.a.borrower-paid-compensation';
export const COMPENSATION_CREDIT_ID = 'costs.j.lender-credits';
export const LENDER_PAID_CD_ID = 'costs.a.lender-paid-compensation';
```

`borrower-paid` inserts the Section A charge and adds `-450_000` cents to the existing general lender-credit line in both documents. `lender-paid` omits the consumer-paid LE charge and creates a CD-only `$4,500.00` line in `paid-by-others`. `buildScenario` must assert all three selector enums, apply transformations in baseline → program → compensation order, calculate, validate, deep-freeze, and return `{ ...scenario, valid: true }`.

- [ ] **Step 5: Run the full domain suite and commit**

```bash
node --experimental-default-type=module --test decoding-le-cd/deck/tests/*.test.mjs
git diff --check -- decoding-le-cd
git add -- decoding-le-cd/deck/content/programs.js decoding-le-cd/deck/content/compensation.js decoding-le-cd/deck/domain/build-scenario.js decoding-le-cd/deck/tests/scenario-matrix.test.mjs
git commit -m 'feat: add program and compensation scenario matrix'
```

Expected: all source and domain tests pass for 12 scenarios.

### Phase 1 Approval Gate

Stop. Deliver:

- the 12-row scenario matrix;
- LE/CD closing-cost and cash-to-close totals for each row;
- explicit proof that borrower-paid gross cost increases by `$4,500.00` while the paired credit is `-$4,500.00`;
- source hashes and program-assumption date;
- full Node test output.

Do not begin document rendering until the user approves Phase 1.

---

## Phase 2 — Teaching Content and Disclosure Renderers

### Task 5: Create Complete Section and Fee Explanation Registries

**Files:**
- Create: `decoding-le-cd/deck/content/fee-definitions.js`
- Create: `decoding-le-cd/deck/content/section-definitions.js`
- Create: `decoding-le-cd/deck/domain/targets.js`
- Create: `decoding-le-cd/deck/tests/content-completeness.test.mjs`

**Interfaces:**
- Produces: `FEE_DEFINITIONS: Readonly<Record<string, FeeDefinition>>`.
- Produces: `KEY_VALUE_DEFINITIONS: Readonly<Record<string, FeeDefinition>>` using the same teaching-panel shape.
- Produces: `SECTION_DEFINITIONS: Readonly<Record<string, SectionDefinition>>`.
- `FeeDefinition`: `{ id, label, definition, purpose, recipient, shopping, timing, changeDrivers, borrowerQuestion, sourceKeys }`.
- Produces: `definitionFor(id)`, `targetsFor(document, scenario)`, and `resolveTarget({ document, page, targetId, scenario })`.

- [ ] **Step 1: Write the failing completeness tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildScenario } from '../domain/build-scenario.js';
import { definitionFor, targetsFor } from '../domain/targets.js';

const requiredKeyTargets = [
  'loan-terms.loan-amount', 'loan-terms.interest-rate', 'loan-terms.monthly-principal-interest',
  'loan-terms.prepayment-penalty', 'loan-terms.balloon-payment', 'projected-payments.mortgage-insurance',
  'projected-payments.estimated-escrow', 'projected-payments.estimated-total-payment',
  'costs.d.total-loan-costs', 'costs.i.total-other-costs', 'costs.j.d-plus-i',
  'costs.j.total-closing-costs', 'cash-to-close.total', 'comparisons.apr', 'comparisons.tip',
  'loan-calculations.total-payments', 'loan-calculations.finance-charge', 'loan-calculations.amount-financed',
];

test('every populated fee in every scenario has a complete explanation', () => {
  for (const transaction of ['purchase', 'refinance']) for (const program of ['conventional', 'fha', 'va']) {
    for (const compensation of ['lender-paid', 'borrower-paid']) {
      const scenario = buildScenario({ transaction, program, compensation });
      for (const line of scenario.feeLines.filter(item => item.leAmountCents || item.cdAmountCents)) {
        const d = definitionFor(line.id);
        assert.equal(d.id, line.id);
        for (const key of ['definition', 'purpose', 'recipient', 'shopping', 'timing', 'borrowerQuestion']) {
          assert.ok(d[key]?.length >= 8, `${line.id}.${key}`);
        }
        assert.ok(d.changeDrivers.length >= 1, `${line.id}.changeDrivers`);
        assert.ok(d.sourceKeys.length >= 1, `${line.id}.sourceKeys`);
      }
    }
  }
});

test('every key teaching value has a complete explanation', () => {
  for (const id of requiredKeyTargets) {
    const d = definitionFor(id);
    assert.equal(d.id, id);
    assert.ok(d.definition.length >= 8, `${id}.definition`);
    assert.ok(d.borrowerQuestion.length >= 8, `${id}.borrowerQuestion`);
    assert.ok(d.sourceKeys.length >= 1, `${id}.sourceKeys`);
  }
});

test('target order covers every LE and CD page', () => {
  const s = buildScenario({ transaction: 'purchase', program: 'conventional', compensation: 'borrower-paid' });
  assert.deepEqual(new Set(targetsFor('le', s).map(t => t.page)), new Set([1, 2, 3]));
  assert.deepEqual(new Set(targetsFor('cd', s).map(t => t.page)), new Set([1, 2, 3, 4, 5]));
});
```

- [ ] **Step 2: Run the tests and verify RED**

```bash
node --experimental-default-type=module --test decoding-le-cd/deck/tests/content-completeness.test.mjs
```

Expected: FAIL because definitions and target functions do not exist.

- [ ] **Step 3: Author the section registry in form order**

Create section IDs for every visible form block, including:

```js
export const SECTION_ORDER = Object.freeze({
  le: [
    'le.p1.loan-terms', 'le.p1.projected-payments', 'le.p1.costs-at-closing',
    'le.p2.a', 'le.p2.b', 'le.p2.c', 'le.p2.e', 'le.p2.f', 'le.p2.g', 'le.p2.h', 'le.p2.j', 'le.p2.cash-to-close',
    'le.p3.comparisons', 'le.p3.other-considerations', 'le.p3.contacts',
  ],
  cd: [
    'cd.p1.loan-terms', 'cd.p1.projected-payments', 'cd.p1.costs-at-closing',
    'cd.p2.a', 'cd.p2.b', 'cd.p2.c', 'cd.p2.e', 'cd.p2.f', 'cd.p2.g', 'cd.p2.h', 'cd.p2.j',
    'cd.p3.cash-to-close', 'cd.p3.transaction-summary', 'cd.p3.payoffs',
    'cd.p4.loan-disclosures', 'cd.p4.escrow-account',
    'cd.p5.loan-calculations', 'cd.p5.other-disclosures', 'cd.p5.contacts', 'cd.p5.confirm-receipt',
  ],
});
```

Each section entry contains purpose, comparison guidance, control guidance, and applicable scenario notes. Use plain-language paraphrases and source keys from `source-manifest.json`.

- [ ] **Step 4: Author every fee definition once**

Implement every ID emitted by Task 4. Use this exact shape and tone:

```js
'costs.a.origination-fee': Object.freeze({
  id: 'costs.a.origination-fee',
  label: 'Origination fee',
  definition: 'An upfront charge for the work involved in making the mortgage loan.',
  purpose: 'It compensates the lender or loan originator for origination services.',
  recipient: 'The lender or loan originator shown on the disclosure.',
  shopping: 'No. Compare the complete Section A total across Loan Estimates.',
  timing: 'Disclosed on the LE and finalized on the CD; it is generally paid at or before closing.',
  changeDrivers: Object.freeze(['Pricing structure', 'Loan amount', 'Approved lender or broker compensation']),
  borrowerQuestion: 'What services are included in this charge, and how does the full Section A total compare with my other offers?',
  sourceKeys: Object.freeze(['cfpbGuide', 'cfpbLoanEstimate', 'cfpbClosingDisclosure']),
}),
```

The borrower-paid compensation definition must point readers to the paired lender credit. FHA UFMIP, FHA monthly MIP, VA funding fee, lender credits, mortgage payoff, prepaid interest, and initial escrow must include scenario-specific cautions. Add all `requiredKeyTargets` from the test to `KEY_VALUE_DEFINITIONS`; renderers must use the same IDs so those values are selectable on both forms.

- [ ] **Step 5: Implement target ordering and fallback**

`resolveTarget` follows this exact priority:

```js
if (targetId && targetExistsInDocument(targetId, document, scenario)) return targetById(targetId);
const parent = parentSectionId(targetId);
if (parent && sectionExistsInDocument(parent, document, scenario)) return sectionById(parent);
return firstTargetOnPage(document, page, scenario) || firstTarget(document, scenario);
```

An inapplicable retained fee returns `{ resolvedTarget, notice: '<label> does not apply to this scenario.' }` so the UI can explain the disappearance.

- [ ] **Step 6: Run the content suite and commit**

```bash
node --experimental-default-type=module --test decoding-le-cd/deck/tests/*.test.mjs
git diff --check -- decoding-le-cd
git add -- decoding-le-cd/deck/content/fee-definitions.js decoding-le-cd/deck/content/section-definitions.js decoding-le-cd/deck/domain/targets.js decoding-le-cd/deck/tests/content-completeness.test.mjs
git commit -m 'feat: add disclosure teaching content'
```

### Task 6: Render the Three Loan Estimate Pages

**Files:**
- Create: `decoding-le-cd/deck/documents/shared.js`
- Create: `decoding-le-cd/deck/documents/loan-estimate/page-1.js`
- Create: `decoding-le-cd/deck/documents/loan-estimate/page-2.js`
- Create: `decoding-le-cd/deck/documents/loan-estimate/page-3.js`
- Create: `decoding-le-cd/deck/documents/loan-estimate/index.js`
- Create: `decoding-le-cd/deck/tests/document-contract.test.mjs`

**Interfaces:**
- Produces: `renderLoanEstimatePage({ scenario, page, selectedTargetId, changedIds }): string`.
- Produces: `formatMoney(cents)`, `formatRate(rateMilliPct)`, `targetButton(target)`, and `pageFooter(document, page, pageCount, loanId)`.
- Every selectable element renders `data-target-id`, `data-page`, `aria-label`, and a native `<button type="button">`.

- [ ] **Step 1: Write failing LE renderer contracts**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildScenario } from '../domain/build-scenario.js';
import { renderLoanEstimatePage } from '../documents/loan-estimate/index.js';

test('LE renders exactly three complete pages', () => {
  const scenario = buildScenario({ transaction: 'purchase', program: 'fha', compensation: 'borrower-paid' });
  for (const page of [1, 2, 3]) {
    const html = renderLoanEstimatePage({ scenario, page, selectedTargetId: null, changedIds: [] });
    assert.match(html, new RegExp(`PAGE ${page} OF 3`));
    assert.match(html, /Hypothetical illustration for education only/);
  }
  assert.throws(() => renderLoanEstimatePage({ scenario, page: 4, selectedTargetId: null, changedIds: [] }), /LE page: 4/);
});

test('LE page 2 exposes actual fee rows as semantic targets', () => {
  const scenario = buildScenario({ transaction: 'purchase', program: 'conventional', compensation: 'borrower-paid' });
  const html = renderLoanEstimatePage({ scenario, page: 2, selectedTargetId: 'costs.a.borrower-paid-compensation', changedIds: [] });
  assert.match(html, /data-target-id="costs\.a\.borrower-paid-compensation"/);
  assert.match(html, /data-target-id="costs\.j\.lender-credits"/);
  assert.match(html, /aria-current="true"/);
});
```

- [ ] **Step 2: Run the document test and verify RED**

```bash
node --experimental-default-type=module --test decoding-le-cd/deck/tests/document-contract.test.mjs
```

Expected: FAIL because the renderer does not exist.

- [ ] **Step 3: Implement safe shared primitives**

Use text escaping for every scenario string and preserve negative-number formatting:

```js
export const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);
export const formatMoney = cents => {
  const abs = Math.abs(cents) / 100;
  const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(abs);
  return cents < 0 ? `−${formatted}` : formatted;
};
export const formatRate = milliPct => `${(milliPct / 1000).toFixed(3).replace(/0+$/, '').replace(/\.$/, '')}%`;
```

`targetButton` must use the definition label for its accessible name and must add `aria-current="true"` only to the selected target.

- [ ] **Step 4: Implement LE pages in standardized order**

- Page 1: header facts, Loan Terms, Projected Payments, Estimated Taxes/Insurance/Assessments, Costs at Closing.
- Page 2: sections A-C, D subtotal, sections E-H, I subtotal, J Total Closing Costs, Calculating Cash to Close.
- Page 3: provider contacts, Comparisons, APR/TIP, Other Considerations, Confirm Receipt.

The form labels and section order must follow H24B/H24D. Values come only from `scenario`; renderer files contain no dollar constants.

- [ ] **Step 5: Run the document and full unit suites, then commit**

```bash
node --experimental-default-type=module --test decoding-le-cd/deck/tests/document-contract.test.mjs
node --experimental-default-type=module --test decoding-le-cd/deck/tests/*.test.mjs
git diff --check -- decoding-le-cd
git add -- decoding-le-cd/deck/documents/shared.js decoding-le-cd/deck/documents/loan-estimate decoding-le-cd/deck/tests/document-contract.test.mjs
git commit -m 'feat: render interactive Loan Estimate pages'
```

### Task 7: Render the Five Closing Disclosure Pages

**Files:**
- Create: `decoding-le-cd/deck/documents/closing-disclosure/page-1.js`
- Create: `decoding-le-cd/deck/documents/closing-disclosure/page-2.js`
- Create: `decoding-le-cd/deck/documents/closing-disclosure/page-3.js`
- Create: `decoding-le-cd/deck/documents/closing-disclosure/page-4.js`
- Create: `decoding-le-cd/deck/documents/closing-disclosure/page-5.js`
- Create: `decoding-le-cd/deck/documents/closing-disclosure/index.js`
- Modify: `decoding-le-cd/deck/tests/document-contract.test.mjs`

**Interfaces:**
- Produces: `renderClosingDisclosurePage({ scenario, page, selectedTargetId, changedIds }): string`.
- Consumes shared formatting and target primitives from Task 6.

- [ ] **Step 1: Add failing CD contracts**

Add the CD import beside the existing imports, then append the tests:

```js
import { renderClosingDisclosurePage } from '../documents/closing-disclosure/index.js';

test('CD renders exactly five complete pages', () => {
  const scenario = buildScenario({ transaction: 'refinance', program: 'va', compensation: 'lender-paid' });
  for (const page of [1, 2, 3, 4, 5]) {
    const html = renderClosingDisclosurePage({ scenario, page, selectedTargetId: null, changedIds: [] });
    assert.match(html, new RegExp(`PAGE ${page} OF 5`));
  }
});

test('lender-paid CD compensation is paid by others, not borrower paid', () => {
  const scenario = buildScenario({ transaction: 'purchase', program: 'conventional', compensation: 'lender-paid' });
  const html = renderClosingDisclosurePage({ scenario, page: 2, selectedTargetId: null, changedIds: [] });
  assert.match(html, /data-target-id="costs\.a\.lender-paid-compensation"[^>]*data-paid-column="paid-by-others"/);
  assert.doesNotMatch(html, /data-target-id="costs\.a\.borrower-paid-compensation"/);
});
```

- [ ] **Step 2: Run and verify RED**

Run the Task 6 document command. Expected: FAIL because the CD renderer does not exist.

- [ ] **Step 3: Implement all five CD pages**

- Page 1: closing/transaction/loan information, Loan Terms, Projected Payments, Costs at Closing.
- Page 2: Closing Cost Details with borrower at-closing, borrower before-closing, seller, and paid-by-others columns.
- Page 3 Purchase: Calculating Cash to Close and buyer/seller transaction summaries.
- Page 3 Refinance: Payoffs and Payments plus Calculating Cash to Close; do not render seller columns.
- Page 4: Loan Disclosures and Escrow Account.
- Page 5: Loan Calculations, Other Disclosures, Contact Information, and Confirm Receipt.

Render an empty standardized row only when it is part of the visible form structure; never make an empty row selectable.

- [ ] **Step 4: Verify all 96 rendered pages**

Extend the document test to loop over 12 scenarios × 3 LE pages + 12 scenarios × 5 CD pages and assert:

```js
assert.equal(renderedPageCount, 96);
assert.equal(html.includes('undefined'), false);
assert.equal(html.includes('NaN'), false);
assert.equal(html.includes('[object Object]'), false);
```

- [ ] **Step 5: Run all Phase 2 tests and commit**

```bash
node --experimental-default-type=module --test decoding-le-cd/deck/tests/*.test.mjs
git diff --check -- decoding-le-cd
git add -- decoding-le-cd/deck/documents/closing-disclosure decoding-le-cd/deck/tests/document-contract.test.mjs
git commit -m 'feat: render interactive Closing Disclosure pages'
```

### Phase 2 Approval Gate

Stop. Deliver:

- static rendered captures of all three LE pages and all five CD pages for `purchase-conventional-borrower-paid`;
- CD Page 3 capture for `refinance-va-lender-paid` proving the payoff layout replaces the purchase summary;
- the 96-page render-contract result;
- the complete definition-coverage result;
- a list of any wording held for MSFG compliance review.

Do not build the application shell until the user approves Phase 2.

---

## Phase 3 — Application Shell, Interaction, and Preview

### Task 8: Implement State, Scenario Controls, and Reset

**Files:**
- Create: `decoding-le-cd/deck/ui/store.js`
- Create: `decoding-le-cd/deck/ui/controls.js`
- Create: `decoding-le-cd/deck/index.html`
- Create: `decoding-le-cd/deck/tests/store.test.mjs`

**Interfaces:**
- Produces: `reducer(state, action, scenario): state`.
- Produces: `createStore({ initialState, reduce, derive }): { getState, dispatch, subscribe }`.
- Action types: `SET_DOCUMENT`, `SET_TRANSACTION`, `SET_COMPENSATION`, `SET_PROGRAM`, `SET_PAGE`, `SELECT_TARGET`, `STEP_TARGET`, `SET_ZOOM`, `RESET`.
- Produces: `initControls({ root, store })`.

- [ ] **Step 1: Write failing reducer tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_SELECTION } from '../domain/contracts.js';
import { buildScenario } from '../domain/build-scenario.js';
import { reducer } from '../ui/store.js';

const scenario = buildScenario({ transaction: 'purchase', program: 'fha', compensation: 'lender-paid' });
const vaScenario = buildScenario({ transaction: 'purchase', program: 'va', compensation: 'lender-paid' });

test('document switch preserves a shared fee and clamps page', () => {
  const start = { ...DEFAULT_SELECTION, document: 'le', page: 2, targetId: 'costs.a.origination-fee' };
  const next = reducer(start, { type: 'SET_DOCUMENT', value: 'cd' }, scenario);
  assert.deepEqual([next.document, next.page, next.targetId], ['cd', 2, 'costs.a.origination-fee']);
});

test('inapplicable target resolves to its parent section with a notice', () => {
  const start = { ...DEFAULT_SELECTION, program: 'fha', page: 2, targetId: 'costs.f.upfront-mip' };
  const next = reducer(start, { type: 'SET_PROGRAM', value: 'va' }, vaScenario);
  assert.equal(next.targetId, 'le.p2.f');
  assert.match(next.notice, /does not apply/);
});

test('reset returns the exact approved state', () => {
  assert.deepEqual(reducer({ document: 'cd' }, { type: 'RESET' }, scenario), DEFAULT_SELECTION);
});
```

- [ ] **Step 2: Run and verify RED**

```bash
node --experimental-default-type=module --test decoding-le-cd/deck/tests/store.test.mjs
```

Expected: FAIL because state modules do not exist.

- [ ] **Step 3: Implement the pure reducer and observable store**

The store derives the new scenario before resolving the target. Invalid enum values must throw without notifying subscribers. Store snapshots are frozen. Browser refresh starts from `DEFAULT_SELECTION`; do not use local storage.

- [ ] **Step 4: Build the exact control groups**

`controls.js` renders four radiogroups with these labels:

```js
export const CONTROL_GROUPS = Object.freeze([
  ['document', 'Document', [['le', 'Loan Estimate'], ['cd', 'Closing Disclosure']]],
  ['transaction', 'Transaction', [['purchase', 'Purchase'], ['refinance', 'Rate-and-term refinance']]],
  ['compensation', 'Compensation', [['lender-paid', 'Lender paid'], ['borrower-paid', 'Borrower paid']]],
  ['program', 'Loan program', [['conventional', 'Conventional'], ['fha', 'FHA'], ['va', 'VA']]],
]);
```

Also render Previous/Next Page, Previous/Next Item, Zoom Out/In, Fullscreen, and Reset. Disable a navigation control only at its true boundary.

- [ ] **Step 5: Create the semantic application shell**

`index.html` contains `header.app-header`, `nav.page-rail`, `main.disclosure-stage`, `aside.explainer`, `footer.app-footer`, one polite live region for change summaries, and the existing MSFG Google Fonts request. Load only `./ui/app.js` as a module.

- [ ] **Step 6: Run tests and commit**

```bash
node --experimental-default-type=module --test decoding-le-cd/deck/tests/*.test.mjs
git diff --check -- decoding-le-cd
git add -- decoding-le-cd/deck/ui/store.js decoding-le-cd/deck/ui/controls.js decoding-le-cd/deck/index.html decoding-le-cd/deck/tests/store.test.mjs
git commit -m 'feat: add disclosure webinar state and controls'
```

### Task 9: Implement Viewer, Teaching Panel, and Change Highlighting

**Files:**
- Create: `decoding-le-cd/deck/ui/disclosure-viewer.js`
- Create: `decoding-le-cd/deck/ui/explainer.js`
- Create: `decoding-le-cd/deck/ui/app.js`
- Modify: `decoding-le-cd/deck/ui/controls.js`
- Modify: `decoding-le-cd/deck/tests/store.test.mjs`

**Interfaces:**
- Produces: `renderDisclosure({ root, state, scenario, previousScenario })`.
- Produces: `renderExplainer({ root, state, scenario })`.
- Produces: `changeSummary(previousScenario, nextScenario, document): string`.
- Clicking `[data-target-id]` dispatches `SELECT_TARGET` and retains focus on the same semantic ID after rerender.

- [ ] **Step 1: Add failing behavior tests**

Append these imports and pure-helper assertions to `tests/store.test.mjs`:

```js
import { changedTargetIds } from '../domain/calculate.js';
import { changeSummary } from '../ui/disclosure-viewer.js';

const lenderScenario = buildScenario({ transaction: 'purchase', program: 'conventional', compensation: 'lender-paid' });
const borrowerScenario = buildScenario({ transaction: 'purchase', program: 'conventional', compensation: 'borrower-paid' });

assert.deepEqual(changedTargetIds(lenderScenario, borrowerScenario, 'le').sort(), [
  'costs.a.borrower-paid-compensation', 'costs.a.total-origination-charges', 'costs.d.total-loan-costs',
  'costs.j.d-plus-i', 'costs.j.lender-credits',
].sort());
assert.match(changeSummary(lenderScenario, borrowerScenario, 'le'), /5 values changed/);
```

The list excludes post-credit Total Closing Costs when the equal credit leaves the value unchanged.

- [ ] **Step 2: Run and verify RED**

Run the full Node test command. Expected: the new helper assertions fail.

- [ ] **Step 3: Render and replace the active disclosure page**

`renderDisclosure` chooses the LE or CD dispatcher, replaces only the page container, restores focus by `data-target-id`, and marks changed targets with `data-changed="true"`. Clear visual changed markers after `900ms`; keep the live-region summary available to assistive technology.

- [ ] **Step 4: Render section and fee explanations**

For a fee, render these labeled fields in this order:

```js
const FEE_PANEL_FIELDS = [
  'definition', 'purpose', 'recipient', 'shopping', 'timing',
  'changeDrivers', 'scenarioBehavior', 'leAmount', 'cdAmount', 'difference', 'borrowerQuestion',
];
```

When the compensation fee or lender credit is active, also render the paired arithmetic block: Section A charge, pre-credit `D + I`, Lender Credits, Total Closing Costs, and Cash to Close. Selecting one paired item adds `data-related="true"` to the other line.

- [ ] **Step 5: Wire application initialization**

`app.js` builds the default scenario, initializes the store and controls, subscribes one render cycle, delegates target clicks from the document stage, maps Left/Right to pages only when focus is not in a control, handles fullscreen, and shows fatal development errors in a visible `<pre class="fatal-error">` instead of leaving a blank page.

- [ ] **Step 6: Run unit tests and commit**

```bash
node --experimental-default-type=module --test decoding-le-cd/deck/tests/*.test.mjs
git diff --check -- decoding-le-cd
git add -- decoding-le-cd/deck/ui decoding-le-cd/deck/tests/store.test.mjs
git commit -m 'feat: add interactive disclosure teaching workflow'
```

### Task 10: Apply Ridgeline Styling, Brand Assets, and Accessibility Contracts

**Files:**
- Create: `decoding-le-cd/deck/content/brand.js`
- Create: `decoding-le-cd/deck/css/tokens.css`
- Create: `decoding-le-cd/deck/css/disclosure.css`
- Create: `decoding-le-cd/deck/css/webinar.css`
- Create: `decoding-le-cd/deck/css/responsive.css`
- Create: `decoding-le-cd/deck/assets/brand/logo-horizontal.svg`
- Create: `decoding-le-cd/deck/assets/brand/logo-horizontal-knockout.svg`
- Create: `decoding-le-cd/deck/assets/brand/equal-housing-lender.png`
- Create: `decoding-le-cd/deck/tests/a11y-contract.test.mjs`
- Modify: `decoding-le-cd/deck/index.html`

**Interfaces:**
- Produces: `BRAND`, `COMPLIANCE`, and `ASSETS` exports.
- CSS must support 1920×1080 presentation, 1280×720 laptop, 768px tablet, and 390px phone widths.

- [ ] **Step 1: Write failing brand and accessibility contracts**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildScenario } from '../domain/build-scenario.js';
import { renderLoanEstimatePage } from '../documents/loan-estimate/index.js';
import { CONTROL_GROUPS } from '../ui/controls.js';

function readIndexAndRepresentativePages() {
  const index = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const css = [
    readFileSync(new URL('../css/webinar.css', import.meta.url), 'utf8'),
    readFileSync(new URL('../css/responsive.css', import.meta.url), 'utf8'),
  ].join('\n');
  const scenario = buildScenario({ transaction: 'purchase', program: 'conventional', compensation: 'borrower-paid' });
  return index + css + renderLoanEstimatePage({ scenario, page: 2, selectedTargetId: null, changedIds: [] });
}

test('brand and compliance copy is exact', async () => {
  const { BRAND, COMPLIANCE } = await import('../content/brand.js');
  assert.deepEqual(BRAND, {
    name: 'Mountain State Financial Group, LLC',
    nmls: 'NMLS# 1314257',
    site: 'msfg.us',
    licenses: 'Licensed in CO, IN, MI, MN, ND, SD, TX',
  });
  assert.equal(COMPLIANCE.educational, 'Hypothetical illustration for education only. Not a quote, offer, or commitment to lend.');
});

test('document targets and controls expose keyboard contracts', () => {
  const html = readIndexAndRepresentativePages();
  assert.doesNotMatch(html, /tabindex="[1-9]/);
  assert.match(html, /aria-live="polite"/);
  assert.ok(CONTROL_GROUPS.some(([, label]) => label === 'Loan program'));
  assert.match(html, /prefers-reduced-motion/);
});
```

- [ ] **Step 2: Run and verify RED**

```bash
node --experimental-default-type=module --test decoding-le-cd/deck/tests/a11y-contract.test.mjs
```

Expected: FAIL because brand and styles do not exist.

- [ ] **Step 3: Copy the three current approved brand assets byte-for-byte**

From the read-only source repository, copy:

```bash
mkdir -p decoding-le-cd/deck/assets/brand
cp /Users/zacharyzink/MSFG/Webinars/first-time-homebuyer/deck/assets/brand/logo-horizontal.svg decoding-le-cd/deck/assets/brand/logo-horizontal.svg
cp /Users/zacharyzink/MSFG/Webinars/first-time-homebuyer/deck/assets/brand/logo-horizontal-knockout.svg decoding-le-cd/deck/assets/brand/logo-horizontal-knockout.svg
cp '/Users/zacharyzink/MSFG/Webinars/first-time-homebuyer/deck/assets/brand/EQUAL HOUSING LENDER.png' decoding-le-cd/deck/assets/brand/equal-housing-lender.png
cmp -s /Users/zacharyzink/MSFG/Webinars/first-time-homebuyer/deck/assets/brand/logo-horizontal.svg decoding-le-cd/deck/assets/brand/logo-horizontal.svg
cmp -s /Users/zacharyzink/MSFG/Webinars/first-time-homebuyer/deck/assets/brand/logo-horizontal-knockout.svg decoding-le-cd/deck/assets/brand/logo-horizontal-knockout.svg
cmp -s '/Users/zacharyzink/MSFG/Webinars/first-time-homebuyer/deck/assets/brand/EQUAL HOUSING LENDER.png' decoding-le-cd/deck/assets/brand/equal-housing-lender.png
```

If any source path is absent, stop and resolve the approved asset provenance; do not substitute an icon or reconstructed logo.

- [ ] **Step 4: Encode the independent Ridgeline shell**

Copy only required token values into `tokens.css`; do not import the Homebuyer runtime stylesheet. Use CSS Grid for the desktop shell:

```css
.app-layout {
  display: grid;
  grid-template-columns: 176px minmax(560px, 1fr) minmax(320px, 430px);
  min-height: 0;
}
.disclosure-page { aspect-ratio: 8.5 / 11; background: #fff; color: #111; }
.disclosure-target[aria-current="true"] { outline: 4px solid var(--green); background: rgba(140,198,62,.16); }
@media (max-width: 1100px) { .app-layout { grid-template-columns: 132px 1fr; } .explainer { grid-column: 1 / -1; } }
@media (max-width: 680px) { .app-layout { display: block; } .page-rail { position: static; } }
@media (prefers-reduced-motion: reduce) { *,*::before,*::after { animation-duration: 1ms !important; transition-duration: 1ms !important; } }
```

The form itself uses compact print-like typography; zoom and the stable panel provide readability. The surrounding teaching UI must not use text below 16px at rendered desktop size.

- [ ] **Step 5: Run all tests and commit**

```bash
node --experimental-default-type=module --test decoding-le-cd/deck/tests/*.test.mjs
git diff --check -- decoding-le-cd
git add -- decoding-le-cd/deck/content/brand.js decoding-le-cd/deck/css decoding-le-cd/deck/assets/brand decoding-le-cd/deck/tests/a11y-contract.test.mjs decoding-le-cd/deck/index.html
git commit -m 'feat: apply MSFG disclosure webinar design'
```

### Task 11: Run Real-Browser QA and Prepare the Review Package

**Files:**
- Create: `decoding-le-cd/README.md`
- Create: `decoding-le-cd/VALIDATION.md`
- Modify only if a test proves necessary: files under `decoding-le-cd/deck/`

**Interfaces:**
- Produces: a local preview at `http://127.0.0.1:4174/`.
- Produces: a completed validation record with commands, expected/actual results, screenshots, and compliance review rows.

- [ ] **Step 1: Start a clean local server and open the real browser**

In terminal A, keep the server running:

```bash
python3 -m http.server 4174 --directory decoding-le-cd/deck
```

In terminal B:

```bash
/Users/zacharyzink/.codex/skills/playwright/scripts/playwright_cli.sh -s=decoding-le-cd open 'http://127.0.0.1:4174/' --headed
/Users/zacharyzink/.codex/skills/playwright/scripts/playwright_cli.sh -s=decoding-le-cd snapshot
```

- [ ] **Step 2: Assert all selector states and target preservation**

Use Playwright CLI `eval` to click all 24 LE/CD states and assert after every transition:

```js
() => {
  if (document.querySelector('.fatal-error')) throw new Error(document.querySelector('.fatal-error').textContent);
  if (!document.querySelector('.disclosure-page')) throw new Error('disclosure page missing');
  if (document.body.innerText.includes('undefined') || document.body.innerText.includes('NaN')) throw new Error('invalid rendered value');
  return true;
}
```

Select `costs.a.origination-fee`, switch LE→CD, and assert the same semantic target remains current. Select FHA UFMIP, switch FHA→VA, and assert the panel shows the inapplicable notice and resolves to the correct parent section.

- [ ] **Step 3: Verify the compensation lesson end to end**

In Purchase/Conventional/LE, toggle Lender paid→Borrower paid and assert:

- Section A compensation appears as `$4,500.00`;
- Section J lender credit changes by `−$4,500.00`;
- `D + I` changes by `$4,500.00`;
- Total Closing Costs and Cash to Close retain their net values;
- both paired lines highlight when either is selected;
- the right panel says the gross presentation changed and does not call the credit free money.

Repeat on CD and assert Lender paid uses the paid-by-others column.

- [ ] **Step 4: Verify document, input, and responsive behavior**

Capture and inspect:

- 1920×1080 Purchase/Conventional/Borrower-paid CD Page 2;
- 1280×720 Purchase/FHA LE Page 2;
- 768px Refinance/VA CD Page 3;
- 390px selected-fee layout with the panel below the form.

Verify keyboard page navigation, Tab order, focus restoration, fullscreen, zoom bounds, reset, touch-sized targets, reduced-motion emulation, and no horizontal body overflow.

- [ ] **Step 5: Run the final technical suite**

```bash
node --experimental-default-type=module --test decoding-le-cd/deck/tests/*.test.mjs
find decoding-le-cd/deck -name '*.js' -print0 | xargs -0 -n1 node --check
find decoding-le-cd/deck/assets -type f -name '*.svg' -print0 | xargs -0 -n1 xmllint --noout
git diff --check -- decoding-le-cd
curl -fsS 'http://127.0.0.1:4174/' -o /dev/null
```

Expected: all tests and syntax checks pass; HTTP returns success; browser console has no product error or warning.

- [ ] **Step 6: Write the README and validation record**

`README.md` documents controls, scenario assumptions, local serving, tests, architecture, sources, and educational scope. `VALIDATION.md` records:

- exact commit;
- 12-scenario totals matrix;
- 96-page rendering result;
- definition coverage count;
- accessibility and responsive checks;
- source hashes and assumption date;
- compliance-review rows for compensation, FHA, VA, APR/TIP, disclosures, and licensing;
- `NOT REVIEWED`, `APPROVED`, or `CHANGES REQUIRED` status for each row.

Do not mark a compliance row approved without the named MSFG reviewer and date.

- [ ] **Step 7: Commit the verified preview package**

```bash
git add -- decoding-le-cd
git diff --cached --check
git commit -m 'docs: record disclosure webinar validation'
```

Expected: only `decoding-le-cd/` is committed.

### Phase 3 Approval Gate

Stop. Provide the local preview URL, representative screenshots, full test summary, and `VALIDATION.md`. Ask the user to review the complete interactive experience and route all `NOT REVIEWED` compliance rows to an MSFG reviewer.

Do not create a production bundle or edit the webinar library until the user explicitly approves both the preview and compliance checklist.

---

## Phase 4 — Production Publication

### Task 12: Add the Webinar to the Live Library and Deploy Safely

**Files:**
- Modify in a temporary deployment bundle only: `webinars/index.html`
- Create in the bundle: `webinars/decoding-le-cd/**` from the verified `decoding-le-cd/deck/` allowlist.
- Do not modify the source application's existing webinar files during packaging.

**Interfaces:**
- AWS Amplify app: `d1u9vaaso8yrd4`.
- Branch: `main`.
- Region: `us-east-1`.
- New production route: `https://msfgmortgage.com/webinars/decoding-le-cd/`.
- Library card title: `Decoding Loan Estimates & Closing Disclosures`.
- Library card description: `Explore a sample Loan Estimate and Closing Disclosure line by line across purchase, refinance, Conventional, FHA, and VA scenarios.`
- Library CTA: `Start Interactive Webinar`.

- [ ] **Step 1: Re-baseline production immediately before packaging**

Run the Phase 4 packaging and deployment commands in one shell so `$deployment_workdir` persists:

```bash
deployment_workdir="$(mktemp -d)"
latest_job_id="$(aws amplify list-jobs --app-id d1u9vaaso8yrd4 --branch-name main --region us-east-1 --max-results 10 --query 'jobSummaries[?status==`SUCCEED`]|[0].jobId' --output text)"
test -n "$latest_job_id"
production_artifact_url="$(aws amplify get-job --app-id d1u9vaaso8yrd4 --branch-name main --job-id "$latest_job_id" --region us-east-1 --query 'job.steps[?stepName==`DEPLOY`].artifactsUrl|[0]' --output text)"
test -n "$production_artifact_url"
curl -fsSL "$production_artifact_url" -o "$deployment_workdir/production-artifact.zip"
unzip -t "$deployment_workdir/production-artifact.zip"
mkdir "$deployment_workdir/production-base"
unzip -q "$deployment_workdir/production-artifact.zip" -d "$deployment_workdir/production-base"
curl -fsSL 'https://msfgmortgage.com/' -o "$deployment_workdir/production-root-before.html"
curl -fsSL 'https://msfgmortgage.com/webinars/' -o "$deployment_workdir/production-webinars-before.html"
curl -fsSL 'https://msfgmortgage.com/webinars/homebuyers-webinar/' -o "$deployment_workdir/production-homebuyer-before.html"
shasum -a 256 "$deployment_workdir/production-root-before.html" "$deployment_workdir/production-webinars-before.html" "$deployment_workdir/production-homebuyer-before.html"
```

Do not use a stale local export as the base.

- [ ] **Step 2: Build an allowlisted bundle**

Copy the production base and then add only the approved runtime files:

```bash
cp -R "$deployment_workdir/production-base" "$deployment_workdir/candidate"
mkdir -p "$deployment_workdir/candidate/webinars/decoding-le-cd"
rsync -a --prune-empty-dirs \
  --include='index.html' \
  --include='content/***' \
  --include='domain/***' \
  --include='documents/***' \
  --include='ui/***' \
  --include='css/***' \
  --include='assets/' \
  --include='assets/brand/***' \
  --exclude='*' \
  decoding-le-cd/deck/ "$deployment_workdir/candidate/webinars/decoding-le-cd/"
```

The copied allowlist is exactly:

```text
index.html
content/*.js
domain/*.js
documents/**/*.js
ui/*.js
css/*.css
assets/brand/*
```

Exclude references, tests, docs, `.DS_Store`, `.superpowers`, `.playwright-cli`, screenshots, source PDFs, and validation artifacts. Modify the existing `webinars/index.html` only enough to add the approved card using its current markup and classes.

Insert this exact sibling section after the Homebuyer's Playbook section in the candidate library page:

```html
<section class="webinar" aria-labelledby="decoding-title">
  <div class="webinar-main">
    <div>
      <div class="webinar-label">Loan disclosures</div>
      <h2 id="decoding-title">Decoding Loan Estimates &amp; Closing Disclosures</h2>
      <p>Explore a sample Loan Estimate and Closing Disclosure line by line across purchase, refinance, Conventional, FHA, and VA scenarios.</p>
      <ul class="topic-line" aria-label="Covered topics">
        <li>Loan Estimate</li><li>Closing Disclosure</li><li>Purchase</li>
        <li>Refinance</li><li>Closing costs</li><li>Fee definitions</li>
      </ul>
    </div>
    <div class="actions" aria-label="Disclosure webinar actions">
      <a class="button primary" href="/webinars/decoding-le-cd/">Start Interactive Webinar</a>
    </div>
  </div>
  <aside class="webinar-side" aria-label="Webinar details">
    <div class="meter" aria-hidden="true">
      <div class="meter-row"><span>LE</span><span></span></div>
      <div class="meter-row"><span>CD</span><span></span></div>
      <div class="meter-row"><span>12</span><span></span></div>
    </div>
    <div class="facts">
      <article><span>Format</span><strong>Interactive document lab</strong></article>
      <article><span>Scenarios</span><strong>12 fixed examples · LE + CD</strong></article>
      <article><span>Focus</span><strong>Section-by-section and fee-by-fee</strong></article>
    </div>
  </aside>
</section>
```

Create the complete candidate ZIP from the candidate root:

```bash
(cd "$deployment_workdir/candidate" && zip -qry "$deployment_workdir/site.zip" .)
unzip -t "$deployment_workdir/site.zip"
```

- [ ] **Step 3: Verify protected production content before upload**

Compare the candidate bundle against the downloaded production base. The diff allowlist is exactly:

```text
webinars/index.html
webinars/decoding-le-cd/**
```

Enforce it mechanically:

```bash
diff -qr "$deployment_workdir/production-base" "$deployment_workdir/candidate" > "$deployment_workdir/bundle-diff.txt" || true
if rg -v 'webinars/index\.html|webinars/decoding-le-cd' "$deployment_workdir/bundle-diff.txt"; then
  printf '%s\n' 'Unexpected production-bundle difference' >&2
  exit 1
fi
rg 'webinars/index\.html' "$deployment_workdir/bundle-diff.txt"
rg 'webinars/decoding-le-cd' "$deployment_workdir/bundle-diff.txt"
```

Hash and verify unchanged:

- root page;
- current Homebuyer interactive webinar;
- current Homebuyer main PowerPoint;
- current Homebuyer editable PowerPoint;
- existing scripts, styles, brand assets, and other webinar-library cards.

Validate the ZIP with `unzip -t` and reject any path outside the allowlist.

- [ ] **Step 4: Create and start the manual Amplify deployment**

```bash
deployment_json="$(aws amplify create-deployment --app-id d1u9vaaso8yrd4 --branch-name main --region us-east-1)"
deployment_job_id="$(printf '%s' "$deployment_json" | jq -r '.jobId')"
deployment_upload_url="$(printf '%s' "$deployment_json" | jq -r '.zipUploadUrl')"
test -n "$deployment_job_id"
test "$deployment_job_id" != "null"
curl -fsS --upload-file "$deployment_workdir/site.zip" "$deployment_upload_url"
aws amplify start-deployment --app-id d1u9vaaso8yrd4 --branch-name main --job-id "$deployment_job_id" --region us-east-1
aws amplify get-job --app-id d1u9vaaso8yrd4 --branch-name main --job-id "$deployment_job_id" --region us-east-1
```

Poll `get-job` with `$deployment_job_id` until `SUCCEED` or a terminal failure. Do not reuse an earlier job number.

- [ ] **Step 5: Perform fresh production verification**

Verify both custom and Amplify domains:

- webinar library returns HTTP 200 and contains the new card once;
- new route returns HTTP 200 and loads every required module/style/asset;
- all 24 document states render without product-console errors;
- one fee on every page opens its explanation;
- compensation, FHA, VA, Purchase, and Refinance smoke tests pass;
- the live route contains the same source hashes as the approved local preview;
- protected page and PowerPoint hashes match the predeployment baseline.

- [ ] **Step 6: Roll back on any failed production assertion**

If any required check fails, deploy the untouched artifact downloaded in Step 1 as a new manual deployment. Verify the previous production hashes are restored before reporting the failed release.

- [ ] **Step 7: Record production evidence and stop**

Append deployment job ID, timestamps, bundle SHA-256, live route checks, protected hashes, and rollback disposition to `decoding-le-cd/VALIDATION.md` in a separate documentation commit. Do not make any additional live change.

### Phase 4 Completion Gate

Report the live URL, deployment job status, bundle hash, protected-file verification, and any remaining compliance limitations. Production is complete only when all required checks pass and the previous artifact remains available for rollback.

---

## Plan Self-Review Checklist

- [x] Every approved selector, scenario, document page, section, and fee behavior maps to a task.
- [x] The 12-scenario/24-document/96-page counts agree across tests and gates.
- [x] Money/rate units and function signatures match across all tasks.
- [x] Borrower-paid and lender-paid compensation rules are consistent in data, calculations, renderers, and browser checks.
- [x] Purchase and rate-and-term Refinance remain separate and no cash-out value appears.
- [x] FHA and VA assumptions carry an `as of 2026-08-12` source record.
- [x] Every populated fee must pass the definition-coverage test.
- [x] Existing webinar source files remain untouched before the production-bundle step.
- [x] Preview, compliance, and deployment are separate approval gates.
- [x] The production diff allowlist contains only the webinar library page and the new webinar route.
