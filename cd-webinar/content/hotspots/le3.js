/* H-24(A): the blank CFPB Loan Estimate model form — the empty template, useful
   for teaching the layout itself. Page 1 and page 3 share the H-24(B) grid;
   page-2 bounds are measured from the model-form PDF (its section boxes sit at
   slightly different template positions than the filled sample). Values are
   empty: the accessible label is the printed field name alone. */

const pageHotspots = (pageNumber, entries) => entries.map((entry, index) => Object.freeze({
  id: `le3.p${pageNumber}.${entry[0]}`,
  documentId: 'le',
  pageId: `le3-${pageNumber}`,
  readingOrder: index + 1,
  bounds: Object.freeze({ x: entry[1][0], y: entry[1][1], width: entry[1][2], height: entry[1][3] }),
  fieldLabel: entry[2],
  value: '',
  explanationId: entry[3] ?? entry[0],
  accessibleLabel: entry[2],
}));

const LE3_PAGE_1 = pageHotspots(1, [
  ['date-issued', [0.0686, 0.1313, 0.3039, 0.0177], 'Date Issued'],
  ['applicants', [0.0686, 0.1484, 0.3039, 0.0467], 'Applicants'],
  ['property', [0.0686, 0.1942, 0.3039, 0.0316], 'Property'],
  ['sale-price', [0.0686, 0.2247, 0.3039, 0.0177], 'Sale Price'],
  ['loan-term', [0.4902, 0.1010, 0.4412, 0.0189], 'Loan Term'],
  ['purpose', [0.4902, 0.1187, 0.4412, 0.0177], 'Purpose'],
  ['product', [0.4902, 0.1326, 0.4412, 0.0177], 'Product'],
  ['loan-type', [0.4902, 0.1477, 0.4412, 0.0177], 'Loan Type'],
  ['loan-id', [0.4902, 0.1629, 0.4412, 0.0177], 'Loan ID'],
  ['rate-lock', [0.4902, 0.1780, 0.4412, 0.0189], 'Rate Lock'],
  ['loan-amount', [0.0784, 0.2816, 0.4412, 0.0253], 'Loan Amount'],
  ['interest-rate', [0.0784, 0.3131, 0.4412, 0.0253], 'Interest Rate'],
  ['monthly-principal-interest', [0.0784, 0.3504, 0.4412, 0.0543], 'Monthly Principal and Interest'],
  ['prepayment-penalty', [0.0784, 0.4432, 0.8400, 0.0341], 'Prepayment Penalty'],
  ['balloon-payment', [0.0784, 0.4811, 0.4412, 0.0239], 'Balloon Payment'],
  ['projected-principal-interest', [0.0866, 0.5808, 0.7206, 0.0239], 'Principal and Interest'],
  ['mortgage-insurance', [0.0866, 0.6149, 0.7206, 0.0202], 'Mortgage Insurance', 'projected-mortgage-insurance'],
  ['estimated-escrow', [0.0866, 0.6389, 0.7206, 0.0316], 'Estimated Escrow'],
  ['estimated-total-monthly-payment', [0.0866, 0.6768, 0.7206, 0.0328], 'Estimated Total Monthly Payment'],
  ['estimated-taxes-insurance-assessments', [0.0784, 0.7424, 0.3056, 0.0442], 'Estimated Taxes, Insurance, and Assessments'],
  ['property-taxes', [0.4706, 0.7323, 0.3382, 0.0215], 'Property Taxes', 'property-taxes-property-cost'],
  ['homeowners-insurance', [0.4706, 0.7475, 0.3382, 0.0215], 'Homeowner’s Insurance', 'homeowners-insurance-property-cost'],
  ['estimated-closing-costs', [0.0784, 0.8561, 0.8121, 0.0379], 'Estimated Closing Costs'],
  ['estimated-cash-to-close', [0.0784, 0.9015, 0.8121, 0.0265], 'Estimated Cash to Close'],
]);

const LE3_PAGE_2 = pageHotspots(2, [
  ['a-total', [0.0752, 0.1162, 0.4020, 0.0189], 'A. Origination Charges', 'le-a-total'],
  ['b-total', [0.0752, 0.3172, 0.4020, 0.0189], 'B. Services You Cannot Shop For', 'le-b-total'],
  ['c-total', [0.0752, 0.5126, 0.4020, 0.0189], 'C. Services You Can Shop For', 'le-c-total'],
  ['d-total', [0.0752, 0.7487, 0.4020, 0.0189], 'D. Total Loan Costs', 'le-d-total'],
  ['e-total', [0.5196, 0.1162, 0.4036, 0.0189], 'E. Taxes and Other Government Fees', 'le-e-total'],
  ['f-total', [0.5196, 0.1673, 0.4036, 0.0189], 'F. Prepaids', 'le-f-total'],
  ['g-total', [0.5196, 0.2812, 0.4036, 0.0189], 'G. Initial Escrow Payment at Closing', 'le-g-total'],
  ['h-total', [0.5196, 0.4101, 0.4036, 0.0189], 'H. Other', 'le-h-total'],
  ['i-total', [0.5196, 0.4969, 0.4036, 0.0189], 'I. Total Other Costs', 'le-i-total'],
  ['j-total', [0.5196, 0.5386, 0.4036, 0.0189], 'J. Total Closing Costs', 'le-j-total'],
  ['lender-credits', [0.5196, 0.5695, 0.4036, 0.0189], 'Lender Credits'],
  ['cash-total-closing-costs', [0.5209, 0.6219, 0.4020, 0.0177], 'Total Closing Costs', 'le-cash-total-closing-costs'],
  ['closing-costs-financed', [0.5209, 0.6392, 0.4020, 0.0177], 'Closing Costs Financed'],
  ['down-payment', [0.5209, 0.6565, 0.4020, 0.0177], 'Down Payment or Funds from Borrower'],
  ['deposit', [0.5209, 0.6738, 0.4020, 0.0177], 'Deposit'],
  ['funds-for-borrower', [0.5209, 0.6911, 0.4020, 0.0177], 'Funds for Borrower'],
  ['seller-credits', [0.5209, 0.7084, 0.4020, 0.0177], 'Seller Credits'],
  ['adjustments-other-credits', [0.5209, 0.7257, 0.4020, 0.0177], 'Adjustments and Other Credits'],
  ['estimated-cash-to-close', [0.5209, 0.7454, 0.4020, 0.0177], 'Estimated Cash to Close'],
]);

const LE3_PAGE_3 = pageHotspots(3, [
  ['lender-contact', [0.0686, 0.1048, 0.4216, 0.0328], 'Lender Contact'],
  ['loan-officer-contact', [0.0686, 0.1351, 0.4216, 0.0631], 'Loan Officer Contact'],
  ['five-year-total-paid', [0.0784, 0.2803, 0.8464, 0.0278], 'Total Paid in Five Years'],
  ['five-year-principal-paid', [0.0784, 0.3043, 0.8464, 0.0253], 'Principal Paid in Five Years'],
  ['apr', [0.0784, 0.3310, 0.8382, 0.0278], 'Annual Percentage Rate'],
  ['tip', [0.0784, 0.3611, 0.8382, 0.0366], 'Total Interest Percentage'],
  ['appraisal', [0.0784, 0.4684, 0.8382, 0.0492], 'Appraisal'],
  ['assumption', [0.0784, 0.5240, 0.8382, 0.0505], 'Assumption'],
  ['homeowners-insurance', [0.0784, 0.5808, 0.8382, 0.0341], 'Homeowner’s Insurance', 'homeowners-insurance-requirement'],
  ['late-payment', [0.0784, 0.6225, 0.8382, 0.0341], 'Late Payment'],
  ['refinance', [0.0784, 0.6641, 0.8382, 0.0341], 'Refinance'],
  ['servicing', [0.0784, 0.7058, 0.8382, 0.0467], 'Servicing'],
  ['confirm-receipt', [0.0686, 0.8333, 0.8268, 0.0576], 'Confirm Receipt'],
]);

export const LE3_HOTSPOTS = Object.freeze([...LE3_PAGE_1, ...LE3_PAGE_2, ...LE3_PAGE_3]);
