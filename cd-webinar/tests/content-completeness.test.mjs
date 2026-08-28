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
    'hoa-capital-contribution', 'hoa-processing-fee', 'home-inspection-fee', 'home-warranty-fee', 'buyer-broker-commission',
    'seller-broker-commission', 'owners-title-policy', 'i-total', 'other-costs-subtotals', 'j-total', 'closing-costs-subtotals',
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
    assert.ok(explanation.review?.status);
  }
});
