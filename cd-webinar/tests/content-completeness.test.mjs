import test from 'node:test';
import assert from 'node:assert/strict';
import { EXPLANATIONS, HOTSPOTS } from '../content/index.js';

const EXPECTED_TARGETS = {
  'le-1': [
    'date-issued', 'applicants', 'property', 'sale-price', 'loan-term', 'purpose', 'product', 'loan-type', 'loan-id', 'rate-lock',
    'loan-amount', 'interest-rate', 'monthly-principal-interest', 'prepayment-penalty', 'balloon-payment',
    'projected-principal-interest', 'mortgage-insurance', 'estimated-escrow', 'estimated-total-monthly-payment',
    'estimated-taxes-insurance-assessments', 'property-taxes', 'homeowners-insurance', 'estimated-closing-costs', 'estimated-cash-to-close',
  ],
  'le-2': [
    'a-total', 'points', 'application-fee', 'underwriting-fee', 'b-total', 'appraisal-fee', 'credit-report-fee',
    'flood-determination-fee', 'flood-monitoring-fee', 'tax-monitoring-fee', 'tax-status-research-fee', 'c-total',
    'pest-inspection-fee', 'survey-fee', 'title-insurance-binder', 'title-lenders-policy', 'title-settlement-agent-fee',
    'title-search', 'd-total', 'e-total', 'recording-fees', 'transfer-taxes', 'f-total', 'homeowners-insurance-premium',
    'mortgage-insurance-premium', 'prepaid-interest', 'prepaid-property-taxes', 'g-total', 'homeowners-insurance-escrow',
    'mortgage-insurance-escrow', 'property-taxes-escrow', 'h-total', 'owners-title-policy', 'i-total', 'j-total', 'd-plus-i',
    'lender-credits', 'cash-total-closing-costs', 'closing-costs-financed', 'down-payment', 'deposit', 'funds-for-borrower',
    'seller-credits', 'adjustments-other-credits', 'estimated-cash-to-close',
  ],
  'le-3': [
    'lender-contact', 'loan-officer-contact', 'five-year-total-paid', 'five-year-principal-paid', 'apr', 'tip', 'appraisal',
    'assumption', 'homeowners-insurance', 'late-payment', 'refinance', 'servicing', 'confirm-receipt',
  ],
  'cd-1': [
    'date-issued', 'closing-date', 'disbursement-date', 'settlement-agent', 'file-number', 'property', 'sale-price', 'borrower',
    'seller', 'lender', 'loan-term', 'purpose', 'product', 'loan-type', 'loan-id', 'mic-number', 'loan-amount', 'interest-rate',
    'monthly-principal-interest', 'prepayment-penalty', 'balloon-payment', 'projected-principal-interest', 'mortgage-insurance',
    'estimated-escrow', 'estimated-total-monthly-payment', 'estimated-taxes-insurance-assessments', 'property-taxes',
    'homeowners-insurance', 'hoa-dues', 'closing-costs', 'cash-to-close',
  ],
  'cd-2': [
    'borrower-paid-at-closing', 'borrower-paid-before-closing', 'seller-paid-at-closing', 'seller-paid-before-closing',
    'paid-by-others', 'a-total', 'points', 'application-fee', 'underwriting-fee', 'b-total', 'appraisal-fee', 'credit-report-fee',
    'flood-determination-fee', 'flood-monitoring-fee', 'tax-monitoring-fee', 'tax-status-research-fee', 'c-total',
    'pest-inspection-fee', 'survey-fee', 'title-insurance-binder', 'title-lenders-policy', 'title-settlement-agent-fee',
    'title-search', 'd-total', 'loan-costs-subtotals', 'e-total', 'recording-fees', 'transfer-tax', 'f-total',
    'homeowners-insurance-premium', 'mortgage-insurance-premium', 'prepaid-interest', 'prepaid-property-taxes', 'g-total',
    'homeowners-insurance-escrow', 'mortgage-insurance-escrow', 'property-taxes-escrow', 'aggregate-adjustment', 'h-total',
    'hoa-capital-contribution', 'hoa-processing-fee', 'home-inspection-fee', 'home-warranty-fee', 'seller-broker-commission',
    'buyer-broker-commission', 'owners-title-policy', 'i-total', 'other-costs-subtotals', 'j-total', 'closing-costs-subtotals',
    'lender-credits',
  ],
  'cd-3': [
    'cash-total-closing-costs', 'closing-costs-paid-before-closing', 'closing-costs-financed', 'down-payment', 'deposit',
    'funds-for-borrower', 'seller-credits', 'adjustments-other-credits', 'cash-to-close', 'k-total', 'sale-price',
    'personal-property', 'closing-costs-paid-at-closing', 'borrower-hoa-dues', 'l-total', 'borrower-deposit', 'loan-amount',
    'existing-loans', 'seller-credit', 'title-rebate', 'borrower-city-taxes', 'total-due-from-borrower', 'total-paid-for-borrower',
    'borrower-cash-to-close', 'm-total', 'seller-sale-price', 'seller-personal-property', 'seller-hoa-dues', 'n-total',
    'excess-deposit', 'seller-closing-costs', 'first-mortgage-payoff', 'second-mortgage-payoff', 'seller-credit-debit',
    'seller-city-taxes', 'total-due-to-seller', 'total-due-from-seller', 'cash-to-seller',
  ],
  'cd-4': [
    'assumption', 'demand-feature', 'late-payment', 'negative-amortization', 'partial-payments', 'security-interest',
    'escrow-account', 'escrowed-property-costs', 'non-escrowed-property-costs', 'initial-escrow-payment',
    'monthly-escrow-payment', 'no-escrow', 'future-escrow-changes',
  ],
  'cd-5': [
    'total-payments', 'finance-charge', 'amount-financed', 'apr', 'tip', 'appraisal', 'contract-details',
    'liability-after-foreclosure', 'refinance', 'tax-deductions', 'questions-cfpb', 'lender-contact', 'mortgage-broker-contact',
    'buyer-broker-contact', 'seller-broker-contact', 'settlement-agent-contact', 'confirm-receipt',
  ],
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
    assert.equal(explanation.review?.status, 'pending-msfg');
  }
});

test('complete inventory retains exact explanation linkage', () => {
  const explanationIds = Object.keys(EXPLANATIONS);
  const usedExplanationIds = new Set(HOTSPOTS.map(item => item.explanationId));

  assert.equal(HOTSPOTS.length, 232);
  assert.equal(explanationIds.length, 176);
  assert.equal(usedExplanationIds.size, 176);
  assert.deepEqual(explanationIds.filter(id => !usedExplanationIds.has(id)), []);
  assert.deepEqual([...usedExplanationIds].filter(id => !EXPLANATIONS[id]), []);
});

test('LE loan ID announces only the value visible in the rendered page', () => {
  const loanId = HOTSPOTS.find(item => item.id === 'le.p1.loan-id');
  assert.ok(loanId);
  assert.equal(loanId.value, '123456789');
  assert.equal(loanId.accessibleLabel, 'Loan ID, 123456789');
});

test('blank CD mortgage broker column does not announce source-PDF-only data', () => {
  const broker = HOTSPOTS.find(item => item.id === 'cd.p5.mortgage-broker-contact');
  assert.ok(broker);
  assert.equal(broker.value, 'Not provided in this sample');
  assert.equal(broker.accessibleLabel, 'Mortgage Broker Contact, Not provided in this sample');
  assert.match(EXPLANATIONS[broker.explanationId].body, /not provided|blank/i);
  assert.doesNotMatch(
    `${broker.value} ${broker.accessibleLabel} ${EXPLANATIONS[broker.explanationId].body}`,
    /Friendly Mortgage|Jim Taylor|333-444-5555/i,
  );
});

test('CD commission rows preserve printed Alpha then Omega order with correct roles', () => {
  const commissions = HOTSPOTS.filter(item => item.pageId === 'cd-2' && item.id.endsWith('-broker-commission'))
    .map(item => ({ id: item.id, fieldLabel: item.fieldLabel, value: item.value }));

  assert.deepEqual(commissions, [
    {
      id: 'cd.p2.seller-broker-commission',
      fieldLabel: 'Seller’s Real Estate Broker Commission',
      value: 'Alpha Real Estate Broker; $5,700.00 seller-paid at closing',
    },
    {
      id: 'cd.p2.buyer-broker-commission',
      fieldLabel: 'Buyer’s Real Estate Broker Commission',
      value: 'Omega Real Estate Broker; $5,700.00 seller-paid at closing',
    },
  ]);

  assert.equal(EXPLANATIONS['seller-broker-commission'].title, 'Seller’s Broker Commission');
  assert.match(EXPLANATIONS['seller-broker-commission'].body, /seller’s side of the transaction/i);
  assert.equal(EXPLANATIONS['buyer-broker-commission'].title, 'Buyer’s Broker Commission');
  assert.match(EXPLANATIONS['buyer-broker-commission'].body, /buyer’s side of the transaction/i);
});

test('CD general-information explanations do not describe themselves as Loan Estimate fields', () => {
  const generalInformationIds = [
    'date-issued', 'closing-date', 'disbursement-date', 'settlement-agent', 'file-number', 'property', 'sale-price',
    'borrower', 'seller', 'lender', 'loan-term', 'purpose', 'product', 'loan-type', 'loan-id', 'mic-number',
  ];

  for (const id of generalInformationIds) {
    const hotspot = HOTSPOTS.find(item => item.id === `cd.p1.${id}`);
    assert.ok(hotspot, id);
    assert.doesNotMatch(EXPLANATIONS[hotspot.explanationId].body, /appears in the Loan Estimate(?:’s|'s)?/i, id);
  }
});

test('loan-information and Loan Terms records use their actual section source families', () => {
  for (const id of ['loan-term', 'purpose', 'product', 'loan-type', 'loan-id']) {
    const explanation = EXPLANATIONS[id];
    assert.match(explanation.body, /General Information/i, id);
    assert.doesNotMatch(explanation.body, /appears in the Loan Terms section/i, id);
    assert.match(explanation.source.reference, /1026\.37\(a\).*1026\.38\(a\)/, id);
    assert.doesNotMatch(explanation.source.reference, /1026\.37\(b\)|1026\.38\(b\)/, id);
  }

  assert.match(EXPLANATIONS['rate-lock'].body, /General Information/i);
  assert.match(EXPLANATIONS['rate-lock'].source.reference, /1026\.37\(a\)\(13\)/);
  assert.match(EXPLANATIONS['loan-amount'].body, /Loan Terms section/i);
  assert.match(EXPLANATIONS['loan-amount'].source.reference, /1026\.37\(b\).*1026\.38\(b\)/);
});

test('closing summaries use Costs at Closing and cash totals name both printed contexts', () => {
  const estimatedCosts = EXPLANATIONS['estimated-closing-costs'];
  assert.match(estimatedCosts.body, /Costs at Closing/i);
  assert.doesNotMatch(estimatedCosts.body, /appears in the Projected Payments table/i);
  assert.match(estimatedCosts.source.reference, /1026\.37\(d\)/);

  const finalCosts = EXPLANATIONS['closing-costs'];
  assert.match(finalCosts.body, /Costs at Closing/i);
  assert.doesNotMatch(finalCosts.body, /appears in the Projected Payments table/i);
  assert.match(finalCosts.source.reference, /1026\.38\(d\)/);

  assert.match(EXPLANATIONS['estimated-cash-to-close'].body, /Costs at Closing.*Calculating Cash to Close/is);
  assert.match(EXPLANATIONS['estimated-cash-to-close'].source.reference, /1026\.37\(d\).*1026\.37\(h\)/);
  assert.match(EXPLANATIONS['cash-to-close'].body, /Costs at Closing.*Calculating Cash to Close/is);
  assert.match(EXPLANATIONS['cash-to-close'].source.reference, /1026\.38\(d\).*1026\.38\(i\)/);
});

test('loan officer contact uses Contact Information context and source family', () => {
  const explanation = EXPLANATIONS['loan-officer-contact'];
  assert.match(explanation.body, /Contact Information/i);
  assert.match(explanation.source.reference, /1026\.37\(k\)/);
  assert.doesNotMatch(explanation.source.reference, /1026\.37\(a\)/);
  assert.doesNotMatch(explanation.source.reference, /H25B|1026\.38\(r\)/);
});

test('form-specific contact and additional-disclosure records avoid unrelated source families', () => {
  assert.match(EXPLANATIONS['mortgage-broker-contact'].source.reference, /H25B page 5.*1026\.38\(r\)/);
  assert.doesNotMatch(EXPLANATIONS['mortgage-broker-contact'].source.reference, /H24B|1026\.37\(k\)/);

  assert.match(EXPLANATIONS.servicing.source.reference, /H24B page 3.*1026\.37\(m\)/);
  assert.doesNotMatch(EXPLANATIONS.servicing.source.reference, /H25B|1026\.38/);

  assert.match(EXPLANATIONS['demand-feature'].source.reference, /H25B page 4.*1026\.38\(m\)/);
  assert.doesNotMatch(EXPLANATIONS['demand-feature'].source.reference, /H24B|1026\.37/);

  assert.match(EXPLANATIONS.assumption.source.reference, /1026\.37\(m\).*1026\.38\(m\)/);
  assert.match(EXPLANATIONS.appraisal.source.reference, /1026\.37\(m\).*1026\.38\(p\)/);
  assert.match(EXPLANATIONS['lender-credits'].source.reference, /1026\.38\(f\)–\(h\)/);
});
