export const DEFAULT_CASH_TO_CLOSE_STATE = Object.freeze({
  purchasePrice: 350_000,
  downPaymentPercent: 5,
  closingCostsPercent: 3,
  prepaidsPercent: 2,
  earnestMoney: 5_000,
  sellerCredits: 0,
  lenderCredits: 0,
});

function nonNegative(value) {
  if (value === null || value === undefined || String(value).trim() === '') return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function calculateCashToClose(state = {}) {
  const purchasePrice = nonNegative(state.purchasePrice);
  const downPaymentPercent = nonNegative(state.downPaymentPercent);
  const closingCostsPercent = nonNegative(state.closingCostsPercent);
  const prepaidsPercent = nonNegative(state.prepaidsPercent);
  const earnestMoney = nonNegative(state.earnestMoney);
  const sellerCredits = nonNegative(state.sellerCredits);
  const lenderCredits = nonNegative(state.lenderCredits);

  const downPayment = purchasePrice * downPaymentPercent / 100;
  const closingCosts = purchasePrice * closingCostsPercent / 100;
  const prepaids = purchasePrice * prepaidsPercent / 100;
  const subtotal = downPayment + closingCosts + prepaids;
  const cashToClose = Math.max(0, subtotal - earnestMoney - sellerCredits - lenderCredits);

  return {
    purchasePrice,
    downPaymentPercent,
    closingCostsPercent,
    prepaidsPercent,
    downPayment,
    closingCosts,
    prepaids,
    subtotal,
    earnestMoney,
    sellerCredits,
    lenderCredits,
    cashToClose,
  };
}

const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatMoney(value) {
  return USD.format(nonNegative(value));
}
