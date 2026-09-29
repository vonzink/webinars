import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_CASH_TO_CLOSE_STATE,
  calculateCashToClose,
  formatMoney,
} from '../js/cash-to-close-math.js';

test('the approved $350,000 teaching example produces $30,000 cash to close', () => {
  const result = calculateCashToClose(DEFAULT_CASH_TO_CLOSE_STATE);

  assert.deepEqual(result, {
    purchasePrice: 350_000,
    downPaymentPercent: 5,
    closingCostsPercent: 3,
    prepaidsPercent: 2,
    downPayment: 17_500,
    closingCosts: 10_500,
    prepaids: 7_000,
    subtotal: 35_000,
    earnestMoney: 5_000,
    sellerCredits: 0,
    lenderCredits: 0,
    cashToClose: 30_000,
  });
});

test('deposits and credits reduce cash to close without creating a negative amount', () => {
  const result = calculateCashToClose({
    purchasePrice: 200_000,
    downPaymentPercent: 3,
    closingCostsPercent: 2,
    prepaidsPercent: 1,
    earnestMoney: 4_000,
    sellerCredits: 5_000,
    lenderCredits: 5_000,
  });

  assert.equal(result.subtotal, 12_000);
  assert.equal(result.cashToClose, 0);
});

test('invalid and negative inputs are treated as zero', () => {
  const result = calculateCashToClose({
    purchasePrice: -1,
    downPaymentPercent: 'not-a-number',
    closingCostsPercent: null,
    prepaidsPercent: undefined,
    earnestMoney: -2,
    sellerCredits: -3,
    lenderCredits: -4,
  });

  assert.equal(result.cashToClose, 0);
  assert.equal(result.purchasePrice, 0);
  assert.equal(formatMoney('bad'), '$0');
});
