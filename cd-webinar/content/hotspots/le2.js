/* H-24(D): CFPB refinance Loan Estimate sample. Shared-template fields reuse the
   H-24(B) grid; the refinance-only regions (alternative Calculating Cash to
   Close, page-3 considerations) use bounds measured from the source PDF. */

const speak = value => value
  .replace(/\$([\d,]+(?:\.\d{2})?)/g, '$1 dollars')
  .replace(/%/g, ' percent');

const pageHotspots = (pageNumber, entries) => entries.map((entry, index) => Object.freeze({
  id: `le2.p${pageNumber}.${entry[0]}`,
  documentId: 'le',
  pageId: `le2-${pageNumber}`,
  readingOrder: index + 1,
  bounds: Object.freeze({ x: entry[1][0], y: entry[1][1], width: entry[1][2], height: entry[1][3] }),
  fieldLabel: entry[2],
  value: entry[3],
  explanationId: entry[4] ?? entry[0],
  accessibleLabel: `${entry[2]}${entry[3] ? `, ${speak(entry[3])}` : ''}`,
}));

const LE2_PAGE_1 = pageHotspots(1, [
  ['date-issued', [0.0686, 0.1313, 0.3039, 0.0177], 'Date Issued', '2/15/2013'],
  ['applicants', [0.0686, 0.1484, 0.3039, 0.0467], 'Applicants', 'Michael Jones and Mary Stone; 123 Anywhere Street, Anytown, ST 12345'],
  ['property', [0.0686, 0.1942, 0.3039, 0.0316], 'Property', '123 Anywhere Street, Anytown, ST 12345'],
  ['est-prop-value', [0.0686, 0.2247, 0.3039, 0.0177], 'Estimated Property Value', '$180,000', 'estimated-prop-value'],
  ['loan-term', [0.4902, 0.1010, 0.4412, 0.0189], 'Loan Term', '30 years'],
  ['purpose', [0.4902, 0.1187, 0.4412, 0.0177], 'Purpose', 'Refinance'],
  ['product', [0.4902, 0.1326, 0.4412, 0.0177], 'Product', 'Fixed Rate'],
  ['loan-type', [0.4902, 0.1477, 0.4412, 0.0177], 'Loan Type', 'Conventional'],
  ['loan-id', [0.4902, 0.1629, 0.4412, 0.0177], 'Loan ID', '123456789'],
  ['rate-lock', [0.4902, 0.1780, 0.4412, 0.0189], 'Rate Lock', 'Yes, until 4/16/2013 at 5:00 p.m. EDT'],
  ['loan-amount', [0.0784, 0.2816, 0.4412, 0.0253], 'Loan Amount', '$150,000'],
  ['interest-rate', [0.0784, 0.3131, 0.4412, 0.0253], 'Interest Rate', '4.25%'],
  ['monthly-principal-interest', [0.0784, 0.3504, 0.4412, 0.0543], 'Monthly Principal and Interest', '$737.91'],
  ['prepayment-penalty', [0.0784, 0.4432, 0.4412, 0.0341], 'Prepayment Penalty', 'No'],
  ['balloon-payment', [0.0784, 0.4811, 0.4412, 0.0239], 'Balloon Payment', 'No'],
  ['projected-principal-interest', [0.0866, 0.5808, 0.7206, 0.0239], 'Projected Principal and Interest', '$737.91 in years 1–4 and years 5–30'],
  ['mortgage-insurance', [0.0866, 0.6149, 0.7206, 0.0202], 'Projected Mortgage Insurance', '$82 in years 1–4; none in years 5–30', 'projected-mortgage-insurance'],
  ['estimated-escrow', [0.0866, 0.6389, 0.7206, 0.0316], 'Estimated Escrow', '$206 in both payment periods'],
  ['estimated-total-monthly-payment', [0.0866, 0.6768, 0.7206, 0.0328], 'Estimated Total Monthly Payment', '$1,026 in years 1–4; $944 in years 5–30'],
  ['estimated-taxes-insurance-assessments', [0.0784, 0.7424, 0.3056, 0.0442], 'Estimated Taxes, Insurance, and Assessments', '$206 a month'],
  ['property-taxes', [0.4706, 0.7323, 0.3382, 0.0215], 'Property Taxes', 'Included in escrow', 'property-taxes-property-cost'],
  ['homeowners-insurance', [0.4706, 0.7475, 0.3382, 0.0215], 'Homeowner’s Insurance', 'Included in escrow', 'homeowners-insurance-property-cost'],
  ['estimated-closing-costs', [0.0784, 0.8561, 0.8121, 0.0379], 'Estimated Closing Costs', '$5,099'],
  ['estimated-cash-to-close', [0.0784, 0.9015, 0.8121, 0.0265], 'Estimated Cash to Close', '$24,901 to borrower'],
]);

const LE2_PAGE_2 = pageHotspots(2, [
  ['a-total', [0.0752, 0.1136, 0.4020, 0.0189], 'A. Origination Charges', '$1,950', 'le-a-total'],
  ['points', [0.0752, 0.1307, 0.4020, 0.0189], 'Points', '0.5% of loan amount; $750'],
  ['b-total', [0.0752, 0.3194, 0.4020, 0.0189], 'B. Services You Cannot Shop For', '$635', 'le-b-total'],
  ['c-total', [0.0752, 0.5278, 0.4020, 0.0189], 'C. Services You Can Shop For', '$936', 'le-c-total'],
  ['d-total', [0.0752, 0.7468, 0.4020, 0.0189], 'D. Total Loan Costs', '$3,521', 'le-d-total'],
  ['e-total', [0.5196, 0.1136, 0.4036, 0.0189], 'E. Taxes and Other Government Fees', '$80', 'le-e-total'],
  ['f-total', [0.5196, 0.1654, 0.4036, 0.0189], 'F. Prepaids', '$1,585', 'le-f-total'],
  ['g-total', [0.5196, 0.2797, 0.4036, 0.0189], 'G. Initial Escrow Payment at Closing', '$413', 'le-g-total'],
  ['h-total', [0.5196, 0.4085, 0.4036, 0.0189], 'H. Other', '$0', 'le-h-total'],
  ['i-total', [0.5196, 0.4956, 0.4036, 0.0189], 'I. Total Other Costs', '$2,078', 'le-i-total'],
  ['j-total', [0.5196, 0.5372, 0.4036, 0.0189], 'J. Total Closing Costs', '$5,099', 'le-j-total'],
  ['lender-credits', [0.5196, 0.5694, 0.4036, 0.0189], 'Lender Credits', 'minus $500'],
  ['alt-loan-amount', [0.5209, 0.6220, 0.4020, 0.0177], 'Loan Amount', '$150,000', 'loan-amount'],
  ['cash-total-closing-costs', [0.5209, 0.6393, 0.4020, 0.0177], 'Total Closing Costs', 'minus $5,099', 'le-cash-total-closing-costs'],
  ['total-payoffs-payments', [0.5209, 0.6566, 0.4020, 0.0177], 'Estimated Total Payoffs and Payments', 'minus $120,000', 'total-payoffs-payments'],
  ['estimated-cash-to-close', [0.5209, 0.6771, 0.4020, 0.0177], 'Estimated Cash to Close', '$24,901 to borrower'],
  ['closing-costs-financed', [0.5209, 0.7118, 0.4020, 0.0303], 'Estimated Closing Costs Financed', '$5,099'],
]);

const LE2_PAGE_3 = pageHotspots(3, [
  ['lender-contact', [0.0686, 0.1048, 0.4216, 0.0328], 'Lender Contact', 'Ficus Bank'],
  ['loan-officer-contact', [0.0686, 0.1351, 0.4216, 0.0631], 'Loan Officer Contact', 'Joe Smith; NMLS ID 12345; joesmith@ficusbank.com; 123-456-7890'],
  ['five-year-total-paid', [0.0784, 0.3120, 0.8464, 0.0210], 'Total Paid in Five Years', '$51,932'],
  ['five-year-principal-paid', [0.0784, 0.3330, 0.8464, 0.0210], 'Principal Paid in Five Years', '$13,788'],
  ['apr', [0.0784, 0.3520, 0.8382, 0.0270], 'Annual Percentage Rate', '4.537%'],
  ['tip', [0.0784, 0.3830, 0.8382, 0.0330], 'Total Interest Percentage', '77.28%'],
  ['appraisal', [0.0784, 0.4870, 0.8382, 0.0480], 'Appraisal', 'The lender may order an appraisal'],
  ['assumption', [0.0784, 0.5430, 0.8382, 0.0480], 'Assumption', 'The sample loan will not allow assumption on the original terms'],
  ['homeowners-insurance', [0.0784, 0.5980, 0.8382, 0.0380], 'Homeowner’s Insurance', 'Required; borrower may choose an acceptable insurer', 'homeowners-insurance-requirement'],
  ['late-payment', [0.0784, 0.6400, 0.8382, 0.0380], 'Late Payment', 'After 15 days, 5% of monthly principal and interest'],
  ['liability-after-foreclosure', [0.0784, 0.7230, 0.8382, 0.0480], 'Liability after Foreclosure', 'Refinancing may end state-law protection against liability for the unpaid balance'],
  ['refinance', [0.0784, 0.7790, 0.8382, 0.0380], 'Refinance', 'Future refinancing is not guaranteed'],
  ['servicing', [0.0784, 0.8200, 0.8382, 0.0460], 'Servicing', 'The lender intends to transfer servicing'],
]);

export const LE2_HOTSPOTS = Object.freeze([...LE2_PAGE_1, ...LE2_PAGE_2, ...LE2_PAGE_3]);
