import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_CALCULATOR_STATE,
  calculatePayment,
  formatMoney,
  parseNonNegative,
} from '../js/calculator-math.js';

test('approved defaults calculate the expected monthly payment', () => {
  const result = calculatePayment(DEFAULT_CALCULATOR_STATE);

  assert.equal(result.downPayment, 48_500);
  assert.equal(result.loanAmount, 436_500);
  assert.ok(Math.abs(result.principalAndInterest - 2_723.192108) < 0.000001);
  assert.equal(result.mortgageInsurance, 181.875);
  assert.equal(formatMoney(result.monthlyTotal), '$3,372');
});

test('zero interest divides principal evenly across the selected term', () => {
  const result = calculatePayment({
    homePrice: 120_000,
    downPaymentPercent: 20,
    interestRate: 0,
    termYears: 20,
    propertyTaxAnnual: 0,
    insuranceAnnual: 0,
    hoaMonthly: 0,
    mortgageInsurancePercent: 0.5,
  });

  assert.equal(result.loanAmount, 96_000);
  assert.equal(result.principalAndInterest, 400);
  assert.equal(result.mortgageInsurance, 0);
  assert.equal(result.monthlyTotal, 400);
});

test('down payment is clamped between zero and one hundred percent', () => {
  const below = calculatePayment({ ...DEFAULT_CALCULATOR_STATE, downPaymentPercent: -5 });
  const above = calculatePayment({ ...DEFAULT_CALCULATOR_STATE, downPaymentPercent: 150 });

  assert.equal(below.downPaymentPercent, 0);
  assert.equal(below.loanAmount, DEFAULT_CALCULATOR_STATE.homePrice);
  assert.equal(above.downPaymentPercent, 100);
  assert.equal(above.loanAmount, 0);
});

test('mortgage insurance appears below twenty percent and stops at twenty percent', () => {
  const below = calculatePayment({ ...DEFAULT_CALCULATOR_STATE, downPaymentPercent: 19.99 });
  const threshold = calculatePayment({ ...DEFAULT_CALCULATOR_STATE, downPaymentPercent: 20 });

  assert.ok(below.mortgageInsurance > 0);
  assert.equal(threshold.mortgageInsurance, 0);
});

test('invalid, empty, and negative values parse as zero', () => {
  assert.equal(parseNonNegative(''), 0);
  assert.equal(parseNonNegative('not-a-number'), 0);
  assert.equal(parseNonNegative(-12), 0);
  assert.equal(parseNonNegative('45.75'), 45.75);
});

test('money formatting rounds to whole U.S. dollars', () => {
  assert.equal(formatMoney(3371.733775), '$3,372');
  assert.equal(formatMoney(0), '$0');
});
