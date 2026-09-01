/* H-25(E): CFPB refinance Closing Disclosure sample — the final disclosure for
   the H-24(D) refinance estimate. Shared-template fields reuse the H-25(B)
   grid; refinance-only regions (no-seller General Information, page-2 section
   positions, Payoffs and Payments, alternative Calculating Cash to Close, and
   the three-column contact table) use bounds measured from the source PDF. */

const speak = value => value
  .replace(/\$([\d,]+(?:\.\d{2})?)/g, '$1 dollars')
  .replace(/%/g, ' percent');

const pageHotspots = (pageNumber, entries) => entries.map((entry, index) => Object.freeze({
  id: `cd2.p${pageNumber}.${entry[0]}`,
  documentId: 'cd',
  pageId: `cd2-${pageNumber}`,
  readingOrder: index + 1,
  bounds: Object.freeze({ x: entry[1][0], y: entry[1][1], width: entry[1][2], height: entry[1][3] }),
  fieldLabel: entry[2],
  value: entry[3],
  explanationId: entry[4] ?? entry[0],
  accessibleLabel: `${entry[2]}${entry[3] ? `, ${speak(entry[3])}` : ''}`,
}));

const CD2_PAGE_1 = pageHotspots(1, [
  ['date-issued', [0.0588, 0.1206, 0.2516, 0.0177], 'Date Issued', '4/15/2013'],
  ['closing-date', [0.0588, 0.1345, 0.2516, 0.0177], 'Closing Date', '4/15/2013'],
  ['disbursement-date', [0.0588, 0.1484, 0.2516, 0.0177], 'Disbursement Date', '4/15/2013'],
  ['settlement-agent', [0.0588, 0.1622, 0.2516, 0.0177], 'Settlement Agent', 'Zeta Title'],
  ['file-number', [0.0588, 0.1761, 0.2516, 0.0177], 'File Number', '12-3456'],
  ['property', [0.0588, 0.1900, 0.2516, 0.0316], 'Property', '123 Anywhere Street, Anytown, ST 12345'],
  ['appraised-prop-value', [0.0588, 0.2184, 0.2516, 0.0189], 'Appraised Property Value', '$180,000', 'appraised-prop-value'],
  ['borrower', [0.3725, 0.1206, 0.3039, 0.0442], 'Borrower', 'Michael Jones and Mary Stone; 123 Anywhere Street, Anytown, ST 12345'],
  ['lender', [0.3725, 0.1640, 0.3039, 0.0189], 'Lender', 'Ficus Bank'],
  ['loan-term', [0.7059, 0.1206, 0.2353, 0.0177], 'Loan Term', '30 years'],
  ['purpose', [0.7059, 0.1345, 0.2353, 0.0177], 'Purpose', 'Refinance'],
  ['product', [0.7059, 0.1484, 0.2353, 0.0177], 'Product', 'Fixed Rate'],
  ['loan-type', [0.7059, 0.1755, 0.2353, 0.0328], 'Loan Type', 'Conventional'],
  ['loan-id', [0.7059, 0.2045, 0.2353, 0.0177], 'Loan ID', '123456789'],
  ['mic-number', [0.7059, 0.2184, 0.2353, 0.0189], 'Mortgage Insurance Case Number', '009874513'],
  ['loan-amount', [0.0686, 0.2816, 0.4510, 0.0253], 'Loan Amount', '$150,000'],
  ['interest-rate', [0.0686, 0.3131, 0.4510, 0.0253], 'Interest Rate', '4.25%'],
  ['monthly-principal-interest', [0.0686, 0.3434, 0.4510, 0.0543], 'Monthly Principal and Interest', '$737.91'],
  ['prepayment-penalty', [0.0686, 0.4280, 0.4510, 0.0341], 'Prepayment Penalty', 'No'],
  ['balloon-payment', [0.0686, 0.4660, 0.4510, 0.0239], 'Balloon Payment', 'No'],
  ['projected-principal-interest', [0.0792, 0.5745, 0.7353, 0.0239], 'Projected Principal and Interest', '$737.91 in years 1–4 and years 5–30'],
  ['mortgage-insurance', [0.0792, 0.6086, 0.7353, 0.0202], 'Projected Mortgage Insurance', '$82.35 in years 1–4; none in years 5–30', 'projected-mortgage-insurance'],
  ['estimated-escrow', [0.0792, 0.6326, 0.7353, 0.0316], 'Estimated Escrow', '$206.13 in both payment periods'],
  ['estimated-total-monthly-payment', [0.0792, 0.6705, 0.7353, 0.0328], 'Estimated Total Monthly Payment', '$1,026.39 in years 1–4; $944.04 in years 5–30'],
  ['estimated-taxes-insurance-assessments', [0.0686, 0.7260, 0.3317, 0.0492], 'Estimated Taxes, Insurance, and Assessments', '$356.13 a month'],
  ['property-taxes', [0.4706, 0.7260, 0.3382, 0.0215], 'Property Taxes', 'Included in escrow', 'property-taxes-property-cost'],
  ['homeowners-insurance', [0.4706, 0.7412, 0.3382, 0.0215], 'Homeowner’s Insurance', 'Included in escrow', 'homeowners-insurance-property-cost'],
  ['hoa-dues', [0.4706, 0.7563, 0.3382, 0.0215], 'Homeowner’s Association Dues', 'Not in escrow'],
  ['closing-costs', [0.0686, 0.8554, 0.8235, 0.0379], 'Closing Costs', '$5,757.57'],
  ['cash-to-close', [0.0686, 0.9009, 0.8235, 0.0265], 'Cash to Close', '$29,677.43 to borrower'],
]);

const CD2_PAGE_2 = pageHotspots(2, [
  ['a-total', [0.0637, 0.0840, 0.8742, 0.0164], 'A. Origination Charges', '$1,950.00 borrower-paid', 'cd-a-total'],
  ['b-total', [0.0637, 0.2000, 0.8742, 0.0177], 'B. Services Borrower Did Not Shop For', '$610.00 borrower-paid', 'cd-b-total'],
  ['c-total', [0.0637, 0.3414, 0.8742, 0.0177], 'C. Services Borrower Did Shop For', '$935.50 borrower-paid', 'cd-c-total'],
  ['d-total', [0.0637, 0.4575, 0.8742, 0.0177], 'D. Total Loan Costs', '$3,495.50 borrower-paid', 'cd-d-total'],
  ['loan-costs-subtotals', [0.0637, 0.4726, 0.8742, 0.0177], 'Loan Costs Subtotals', '$3,060.50 at closing; $435.00 before closing', 'cd-loan-costs-subtotals'],
  ['e-total', [0.0637, 0.5200, 0.8742, 0.0177], 'E. Taxes and Other Government Fees', '$60.00 borrower-paid at closing', 'cd-e-total'],
  ['f-total', [0.0637, 0.5604, 0.8742, 0.0177], 'F. Prepaids', '$2,125.12 borrower-paid at closing', 'cd-f-total'],
  ['g-total', [0.0637, 0.6387, 0.8742, 0.0177], 'G. Initial Escrow Payment at Closing', '$576.95 borrower-paid at closing', 'cd-g-total'],
  ['h-total', [0.0637, 0.7549, 0.8742, 0.0177], 'H. Other', 'No amount shown', 'cd-h-total'],
  ['i-total', [0.0637, 0.8711, 0.8742, 0.0177], 'I. Total Other Costs', '$2,762.07 borrower-paid', 'cd-i-total'],
  ['j-total', [0.0637, 0.9173, 0.8742, 0.0177], 'J. Total Closing Costs', '$5,757.57 borrower-paid', 'cd-j-total'],
  ['lender-credits', [0.0637, 0.9438, 0.8742, 0.0164], 'Lender Credits', 'minus $500.00'],
]);

const CD2_PAGE_3 = pageHotspots(3, [
  ['payoffs-section', [0.0637, 0.0510, 0.8760, 0.0290], 'Payoffs and Payments', 'A summary of payoffs and payments to others from the loan amount', 'payoffs-and-payments'],
  ['payoff-existing-loan', [0.0637, 0.0990, 0.8760, 0.0177], 'Payoff of Existing Loan', 'Rho Servicing; $115,000.00', 'payoffs-and-payments'],
  ['k-total', [0.0637, 0.6595, 0.8760, 0.0189], 'K. Total Payoffs and Payments', '$115,000.00', 'total-payoffs-payments'],
  ['alt-loan-amount', [0.0637, 0.7659, 0.8760, 0.0177], 'Loan Amount', 'Loan Estimate and final $150,000.00; no change', 'loan-amount'],
  ['cash-total-closing-costs', [0.0637, 0.7861, 0.8760, 0.0177], 'Total Closing Costs', 'Loan Estimate minus $5,099.00; final minus $5,757.57; changed', 'cd-cash-total-closing-costs'],
  ['closing-costs-paid-before-closing', [0.0637, 0.8063, 0.8760, 0.0177], 'Closing Costs Paid Before Closing', 'Loan Estimate $0; final $435.00; changed'],
  ['total-payoffs-payments', [0.0637, 0.8266, 0.8760, 0.0177], 'Total Payoffs and Payments', 'Loan Estimate minus $120,000.00; final minus $115,000.00; changed', 'total-payoffs-payments'],
  ['cash-to-close', [0.0637, 0.8442, 0.8760, 0.0189], 'Cash to Close', 'Loan Estimate $24,901.00 to borrower; final $29,677.43 to borrower'],
  ['closing-costs-financed', [0.0637, 0.8707, 0.8760, 0.0177], 'Closing Costs Financed', '$5,322.57 paid from the loan amount', 'cd-closing-costs-financed'],
]);

const CD2_PAGE_4 = pageHotspots(4, [
  ['assumption', [0.0588, 0.1111, 0.4183, 0.0758], 'Assumption', 'The sample loan will not allow assumption on the original terms'],
  ['demand-feature', [0.0588, 0.1957, 0.4183, 0.0783], 'Demand Feature', 'The sample loan does not have a demand feature'],
  ['late-payment', [0.0588, 0.2828, 0.4183, 0.0442], 'Late Payment', 'After 15 days, 5% of monthly principal and interest'],
  ['negative-amortization', [0.0588, 0.3359, 0.4183, 0.1843], 'Negative Amortization', 'The sample loan does not have this feature'],
  ['partial-payments', [0.0588, 0.5290, 0.4248, 0.1237], 'Partial Payments', 'The lender may accept and apply partial payments'],
  ['security-interest', [0.0588, 0.6616, 0.4248, 0.1010], 'Security Interest', '123 Anywhere Street, Anytown, ST 12345'],
  ['escrow-account', [0.5147, 0.1111, 0.4265, 0.0997], 'Escrow Account', 'The sample loan will have an escrow account'],
  ['escrowed-property-costs', [0.5212, 0.2247, 0.4167, 0.0682], 'Escrowed Property Costs over Year 1', '$2,473.56; property taxes and homeowner’s insurance'],
  ['non-escrowed-property-costs', [0.5212, 0.3043, 0.4167, 0.0631], 'Non-Escrowed Property Costs over Year 1', '$1,800.00; homeowner’s association dues'],
  ['initial-escrow-payment', [0.5212, 0.3712, 0.4167, 0.0290], 'Initial Escrow Payment', '$576.95'],
  ['monthly-escrow-payment', [0.5212, 0.4167, 0.4167, 0.0290], 'Monthly Escrow Payment', '$206.13'],
  ['no-escrow', [0.5147, 0.4672, 0.4265, 0.1389], 'No Escrow', 'Alternative disclosure is not selected on this sample'],
  ['future-escrow-changes', [0.5147, 0.6149, 0.4265, 0.1490], 'Future Escrow Changes', 'Property costs and escrow payments may change'],
]);

const CD2_PAGE_5 = pageHotspots(5, [
  ['total-payments', [0.0650, 0.0745, 0.4134, 0.0442], 'Total of Payments', '$273,214.50'],
  ['finance-charge', [0.0650, 0.1313, 0.4134, 0.0316], 'Finance Charge', '$121,029.00'],
  ['amount-financed', [0.0650, 0.1755, 0.4134, 0.0316], 'Amount Financed', '$148,241.94'],
  ['apr', [0.0650, 0.2197, 0.4134, 0.0442], 'Annual Percentage Rate', '4.543%'],
  ['tip', [0.0650, 0.2753, 0.4134, 0.0442], 'Total Interest Percentage', '77.29%'],
  ['appraisal', [0.5098, 0.0745, 0.4314, 0.0732], 'Appraisal', 'Copy due at no additional cost when the property was appraised'],
  ['contract-details', [0.5098, 0.1553, 0.4314, 0.0985], 'Contract Details', 'See the note and security instrument'],
  ['liability-after-foreclosure', [0.5098, 0.2601, 0.4314, 0.1174], 'Liability after Foreclosure', 'Sample indicates state law may protect the borrower'],
  ['refinance', [0.5098, 0.3889, 0.4314, 0.0568], 'Refinance', 'Future refinancing is not guaranteed'],
  ['tax-deductions', [0.5098, 0.4558, 0.4314, 0.0719], 'Tax Deductions', 'Consult a tax advisor'],
  ['questions-cfpb', [0.0830, 0.3586, 0.3791, 0.1162], 'Questions and CFPB Contact', 'consumerfinance.gov/mortgage-closing'],
  ['lender-contact', [0.2660, 0.5700, 0.2200, 0.2600], 'Lender Contact', 'Ficus Bank; Joe Smith; 123-456-7890'],
  ['mortgage-broker-contact', [0.4915, 0.5700, 0.2200, 0.2600], 'Mortgage Broker Contact', 'Not provided in this sample'],
  ['settlement-agent-contact', [0.7170, 0.5700, 0.2200, 0.2600], 'Settlement Agent Contact', 'Zeta Title; Joan Taylor; 555-321-9876'],
  ['confirm-receipt', [0.0588, 0.8422, 0.8824, 0.0568], 'Confirm Receipt', 'A signature confirms receipt, not acceptance'],
]);

export const CD2_HOTSPOTS = Object.freeze([
  ...CD2_PAGE_1,
  ...CD2_PAGE_2,
  ...CD2_PAGE_3,
  ...CD2_PAGE_4,
  ...CD2_PAGE_5,
]);
