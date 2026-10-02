export const DEFAULT_CALCULATOR_STATE = Object.freeze({
  homePrice: 485_000,
  downPaymentPercent: 10,
  interestRate: 6.375,
  termYears: 30,
  propertyTaxAnnual: 4_200,
  insuranceAnnual: 1_400,
  hoaMonthly: 0,
  mortgageInsurancePercent: 0.5,
});

export function parseNonNegative(value) {
  if (value === null || value === undefined || String(value).trim() === '') return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function calculatePayment(state = {}) {
  const homePrice = parseNonNegative(state.homePrice);
  const downPaymentPercent = Math.min(100, parseNonNegative(state.downPaymentPercent));
  const interestRate = parseNonNegative(state.interestRate);
  const termYears = parseNonNegative(state.termYears);
  const propertyTaxAnnual = parseNonNegative(state.propertyTaxAnnual);
  const insuranceAnnual = parseNonNegative(state.insuranceAnnual);
  const hoaMonthly = parseNonNegative(state.hoaMonthly);
  const mortgageInsurancePercent = parseNonNegative(state.mortgageInsurancePercent);

  const downPayment = homePrice * downPaymentPercent / 100;
  const loanAmount = Math.max(0, homePrice - downPayment);
  const paymentCount = termYears * 12;
  const monthlyRate = interestRate / 100 / 12;

  let principalAndInterest = 0;
  if (loanAmount > 0 && paymentCount > 0) {
    principalAndInterest = monthlyRate === 0
      ? loanAmount / paymentCount
      : loanAmount * monthlyRate * (1 + monthlyRate) ** paymentCount
        / ((1 + monthlyRate) ** paymentCount - 1);
  }

  const propertyTax = propertyTaxAnnual / 12;
  const insurance = insuranceAnnual / 12;
  const mortgageInsurance = downPaymentPercent < 20
    ? loanAmount * (mortgageInsurancePercent / 100) / 12
    : 0;
  const monthlyTotal = principalAndInterest + propertyTax + insurance + hoaMonthly + mortgageInsurance;

  return {
    homePrice,
    downPaymentPercent,
    downPayment,
    loanAmount,
    principalAndInterest,
    propertyTax,
    insurance,
    hoa: hoaMonthly,
    mortgageInsurance,
    monthlyTotal,
  };
}

const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatMoney(value) {
  return USD.format(parseNonNegative(value));
}
