/* Plain-English decoder copy for every taught field, reworked in the voice of the
   user-supplied "Loan Document Decoder Redesign" handoff (docdata.js) and
   accuracy-checked against TRID before approval. Each body = punchy definition +
   where-it-lives context + the shared fictional-sample note. `ASKS` feeds the
   decoder card's "Ask your lender" callout. Source references are unchanged from
   the previously reviewed corpus. */

const GROUPS = Object.freeze({
  'form-general-information': Object.freeze({
    why: 'It sits in General Information near the top of both forms so the paperwork can be matched to the right property and transaction.',
    reference: 'H24B page 1; H25B page 1; CFPB Guide to Forms v2.1 §§ 2.2.1 and 3.2.1; 12 CFR 1026.37(a)(4), (6)–(7), 1026.38(a)(3)(i), (vi)–(vii)',
  }),
  'le-general-information': Object.freeze({
    why: 'It sits in the Loan Estimate’s General Information so the estimate can be matched to the people applying.',
    reference: 'H24B page 1; CFPB Guide to Forms v2.1 § 2.2.1; 12 CFR 1026.37(a)(5)',
  }),
  'cd-general-information': Object.freeze({
    why: 'It sits in the Closing Disclosure’s General Information so the final paperwork can be matched to the parties and the closing file.',
    reference: 'H25B page 1; CFPB Guide to Forms v2.1 § 3.2.1; 12 CFR 1026.38(a)(3)(ii)–(v), (4), (5)(vi)',
  }),
  'loan-information': Object.freeze({
    why: 'It sits in General Information at the top of the form so you can identify the exact loan before digging into its terms.',
    reference: 'H24B page 1; H25B page 1; CFPB Guide to Forms v2.1 §§ 2.2.1 and 3.2.1; 12 CFR 1026.37(a)(8)–(12), 1026.38(a)(5)(i)–(v)',
  }),
  'le-rate-lock': Object.freeze({
    why: 'It sits in the Loan Estimate’s General Information and states whether the quoted rate is protected and until when.',
    reference: 'H24B page 1; CFPB Guide to Forms v2.1 § 2.2.1; 12 CFR 1026.37(a)(13)',
  }),
  'loan-terms': Object.freeze({
    why: 'It sits in the Loan Terms section on both forms — the table to compare line by line against the other document.',
    reference: 'H24B page 1; H25B page 1; CFPB Guide to Forms v2.1 §§ 2.2.2 and 3.2.2; 12 CFR 1026.37(b), 1026.38(b)',
  }),
  'projected-payments': Object.freeze({
    why: 'It sits in the Projected Payments table, which shows how your monthly housing cost is built and when it can change.',
    reference: 'H24B page 1; H25B page 1; CFPB Guide to Forms v2.1 §§ 2.2.3 and 3.2.3; 12 CFR 1026.37(c), 1026.38(c)',
  }),
  'le-costs-at-closing': Object.freeze({
    why: 'It sits in the Loan Estimate’s Costs at Closing summary, with the line-by-line detail on page 2.',
    reference: 'H24B page 1; CFPB Guide to Forms v2.1 § 2.2.4; 12 CFR 1026.37(d)',
  }),
  'cd-costs-at-closing': Object.freeze({
    why: 'It sits in the Closing Disclosure’s Costs at Closing summary, with the final line-by-line detail on page 2.',
    reference: 'H25B page 1; CFPB Guide to Forms v2.1 § 3.2.4; 12 CFR 1026.38(d)',
  }),
  'cost-item': Object.freeze({
    why: 'It sits in Closing Cost Details, the page-2 breakdown of every charge, credit, and service in the transaction.',
    reference: 'H24B page 2; H25B page 2; CFPB Guide to Forms v2.1 §§ 2.3.1–2.3.2 and 3.3.1–3.3.2; 12 CFR 1026.37(f)–(g), 1026.38(f)–(h)',
  }),
  'le-cost-total': Object.freeze({
    why: 'It sits on the Loan Estimate’s page 2 as a subtotal, showing how estimated charges group before they roll into cash to close.',
    reference: 'H24B page 2; CFPB Guide to Forms v2.1 §§ 2.3.1–2.3.3; 12 CFR 1026.37(f)–(h)',
  }),
  'cd-cost-total': Object.freeze({
    why: 'It sits on the Closing Disclosure’s page 2 as a subtotal, so you can trace final charges and who paid them.',
    reference: 'H25B page 2; CFPB Guide to Forms v2.1 §§ 3.3.1–3.3.2; 12 CFR 1026.38(f)–(h)',
  }),
  'payer-column': Object.freeze({
    why: 'It heads a column in Closing Cost Details — the layout that shows who paid each charge and when.',
    reference: 'H25B page 2; CFPB Guide to Forms v2.1 §§ 3.3.1–3.3.2; 12 CFR 1026.38(f)–(h)',
  }),
  'le-cash': Object.freeze({
    why: 'It sits in the Loan Estimate’s Calculating Cash to Close table, which builds up the money expected at closing.',
    reference: 'H24B page 2; CFPB Guide to Forms v2.1 § 2.3.3; 12 CFR 1026.37(h)',
  }),
  'cd-cash': Object.freeze({
    why: 'It sits in the Closing Disclosure’s Calculating Cash to Close table, which compares the estimate to the final figure line by line.',
    reference: 'H25B page 3; CFPB Guide to Forms v2.1 § 3.4.1; 12 CFR 1026.38(i)',
  }),
  'le-cash-total': Object.freeze({
    why: 'It appears twice — in the Costs at Closing summary and as the bottom line of Calculating Cash to Close — so you can trace how it was built.',
    reference: 'H24B pages 1–2; CFPB Guide to Forms v2.1 §§ 2.2.4 and 2.3.3; 12 CFR 1026.37(d), 1026.37(h)',
  }),
  'cd-cash-total': Object.freeze({
    why: 'It appears twice — in the Costs at Closing summary and as the bottom line of Calculating Cash to Close — so you can trace how it was built.',
    reference: 'H25B pages 1 and 3; CFPB Guide to Forms v2.1 §§ 3.2.4 and 3.4.1; 12 CFR 1026.38(d), 1026.38(i)',
  }),
  'le-comparison': Object.freeze({
    why: 'It sits in the Loan Estimate’s Comparisons section, built for lining up offers from different lenders.',
    reference: 'H24B page 3; CFPB Guide to Forms v2.1 § 2.4.2; 12 CFR 1026.37(l)',
  }),
  'shared-cost-measure': Object.freeze({
    why: 'It sits in the Loan Estimate’s Comparisons and the Closing Disclosure’s Loan Calculations, standard yardsticks for comparing loans.',
    reference: 'H24B page 3; H25B page 5; CFPB Guide to Forms v2.1 §§ 2.4.2 and 3.6.1; 12 CFR 1026.37(l), 1026.38(o)',
  }),
  'shared-loan-disclosure': Object.freeze({
    why: 'It sits in Other Considerations on the Loan Estimate and Loan Disclosures on the Closing Disclosure, because it can matter long after closing.',
    reference: 'H24B page 3; H25B page 4; CFPB Guide to Forms v2.1 §§ 2.4.3 and 3.5.1; 12 CFR 1026.37(m), 1026.38(l)',
  }),
  'shared-other-disclosure': Object.freeze({
    why: 'It sits in Other Considerations on the Loan Estimate and Other Disclosures on the Closing Disclosure, describing a right or future option you keep.',
    reference: 'H24B page 3; H25B page 5; CFPB Guide to Forms v2.1 §§ 2.4.3 and 3.6.2; 12 CFR 1026.37(m), 1026.38(p)',
  }),
  'le-other-consideration': Object.freeze({
    why: 'It sits in the Loan Estimate’s Other Considerations — policies worth understanding before you commit.',
    reference: 'H24B page 3; CFPB Guide to Forms v2.1 § 2.4.3; 12 CFR 1026.37(m)',
  }),
  'cd-loan-disclosure': Object.freeze({
    why: 'It sits in the Closing Disclosure’s Loan Disclosures — final contractual features of the mortgage you are signing.',
    reference: 'H25B page 4; CFPB Guide to Forms v2.1 § 3.5.1; 12 CFR 1026.38(l)',
  }),
  'le-contact': Object.freeze({
    why: 'It sits in the Loan Estimate’s Contact Information so you know exactly who is handling your application.',
    reference: 'H24B page 3; CFPB Guide to Forms v2.1 § 2.4.1; 12 CFR 1026.37(k)',
  }),
  'shared-lender-contact': Object.freeze({
    why: 'It sits in Contact Information on both forms so you can identify and reach the creditor behind the loan.',
    reference: 'H24B page 3; H25B page 5; CFPB Guide to Forms v2.1 §§ 2.4.1 and 3.6.3; 12 CFR 1026.37(k), 1026.38(r)',
  }),
  'cd-contact': Object.freeze({
    why: 'It sits in the Closing Disclosure’s Contact Information, listing every professional in the transaction with their license numbers.',
    reference: 'H25B page 5; CFPB Guide to Forms v2.1 § 3.6.3; 12 CFR 1026.38(r)',
  }),
  receipt: Object.freeze({
    why: 'It sits at the end of the form, and it documents delivery only — signing is not acceptance of the loan.',
    reference: 'H24B page 3; H25B page 5; CFPB Guide to Forms v2.1 §§ 2.4.5 and 3.6.4; 12 CFR 1026.37(n), 1026.38(s)',
  }),
  'borrower-transaction': Object.freeze({
    why: 'It sits in the borrower’s transaction summary on page 3, the ledger of everything you owe and everything already credited to you.',
    reference: 'H25B page 3; CFPB Guide to Forms v2.1 §§ 3.4.3–3.4.4; 12 CFR 1026.38(j)',
  }),
  'seller-transaction': Object.freeze({
    why: 'It sits in the seller’s transaction summary on page 3, the ledger that works out the seller’s proceeds from the sale.',
    reference: 'H25B page 3; CFPB Guide to Forms v2.1 §§ 3.4.3 and 3.4.5; 12 CFR 1026.38(k)',
  }),
  escrow: Object.freeze({
    why: 'It sits in the Escrow Account disclosure, which spells out how property costs are paid through — or outside — escrow.',
    reference: 'H25B page 4; CFPB Guide to Forms v2.1 § 3.5.3; 12 CFR 1026.38(l)(7)',
  }),
  'loan-calculation': Object.freeze({
    why: 'It sits in Loan Calculations, the federally defined cost measures computed from your final loan terms.',
    reference: 'H25B page 5; CFPB Guide to Forms v2.1 § 3.6.1; 12 CFR 1026.38(o)',
  }),
  'other-disclosure': Object.freeze({
    why: 'It sits in Other Disclosures, pointing you to important documents, legal consequences, and post-closing considerations.',
    reference: 'H25B page 5; CFPB Guide to Forms v2.1 § 3.6.2; 12 CFR 1026.38(p)',
  }),
  questions: Object.freeze({
    why: 'It sits on the Closing Disclosure so you know where to take questions and where to find CFPB help or file a complaint.',
    reference: 'H25B page 5; CFPB Guide to Forms v2.1 § 3.6; 12 CFR 1026.38(q)',
  }),
});

const SAMPLE_NOTE = 'This fictional sample shows one transaction — your own numbers, terms, and providers will differ, so walk through your actual form with your lender or settlement professional.';

/* "Ask your lender" prompts, adapted from the user-supplied handoff copy. */
const ASKS = Object.freeze({
  'date-issued': 'How long are these terms good for, and when does my Closing Disclosure three-day review window start?',
  applicants: 'Is everyone listed here who should be on the loan?',
  property: 'Is the full legal address correct?',
  'sale-price': 'Does this match my purchase contract?',
  'loan-term': 'Would a shorter term make sense for my situation?',
  product: 'Are there other rate structures I should compare?',
  'loan-type': 'Do I qualify for FHA, VA, or other program alternatives?',
  'rate-lock': 'What does it cost to lock my rate today, and until when?',
  'loan-amount': 'Why is this amount different from the sale price?',
  'interest-rate': 'Does this match my rate lock agreement?',
  'monthly-principal-interest': 'What will my total monthly payment be with taxes and insurance?',
  'prepayment-penalty': 'Can I get this loan without a prepayment penalty?',
  'projected-mortgage-insurance': 'When can I drop mortgage insurance?',
  'estimated-escrow': 'Which bills does my escrow account cover?',
  'estimated-total-monthly-payment': 'How could this payment change over time?',
  'estimated-taxes-insurance-assessments': 'How were the tax and insurance estimates made?',
  'estimated-closing-costs': 'Which of these fees can I shop for?',
  'estimated-cash-to-close': 'Could this number change before closing?',
  'closing-costs': 'Which fees changed from my Loan Estimate, and why?',
  'cash-to-close': 'How do I verify your wire instructions by phone before sending money? Wire fraud targets closings.',
  points: 'What would my rate be with zero points?',
  'application-fee': 'Can this fee be reduced or waived?',
  'underwriting-fee': 'What does underwriting include?',
  'appraisal-fee': 'When will I receive my copy of the appraisal?',
  'flood-determination-fee': 'Is this property in a flood zone?',
  'pest-inspection-fee': 'Can I see the list of approved providers for the services I can shop for?',
  'title-insurance-binder': 'Which title company is this estimate assuming?',
  'owners-title-policy': 'What happens if I skip the owner’s title policy?',
  'lender-credits': 'Are any lender credits available to offset my closing costs?',
  'le-j-total': 'Are any lender credits available to bring this total down?',
  'cd-f-total': 'Why are prepaids different from my estimate?',
  'cd-cash-total-closing-costs': 'Can you walk me through each line that changed from the Loan Estimate?',
  'homeowners-insurance-requirement': 'Do you have insurer requirements I should know about?',
  servicing: 'Who will service my loan after closing?',
  'partial-payments': 'What should I do if I ever cannot make a full payment?',
  apr: 'Why is my APR higher than my interest rate?',
});

const groupedItems = [
  ['form-general-information', [
    ['date-issued', 'Date Issued', 'The day the creditor delivered this form or put it in the mail. For a Closing Disclosure, that date matters: you must receive it at least three business days before closing so you have time to review and question everything.'],
    ['property', 'Property', 'The address of the real estate securing the mortgage. Check it against your contract character by character — this is the property the lender can foreclose on if the loan is not repaid.'],
    ['sale-price', 'Sale Price', 'The contract price of the home itself, separate from any personal property priced on its own. It should match your purchase agreement exactly on both forms.'],
  ]],
  ['le-general-information', [
    ['applicants', 'Applicants', 'Everyone applying for the mortgage, with the mailing address tied to the application. Each applicant’s credit and income are considered in the approval.'],
  ]],
  ['cd-general-information', [
    ['closing-date', 'Closing Date', 'The day you sign and become legally obligated on the loan — the moment the rulebook calls consummation.'],
    ['disbursement-date', 'Disbursement Date', 'The day the loan and closing funds are actually expected to be paid out to you, the seller, or other parties. It can fall after the closing date, especially on refinances.'],
    ['settlement-agent', 'Settlement Agent', 'The neutral company running the closing and moving the money between the parties.'],
    ['file-number', 'File Number', 'The settlement agent’s reference number for your closing file. Use it to match documents and conversations to the transaction.'],
    ['borrower', 'Borrower', 'The consumer or consumers legally obligated on the mortgage, with the address the final disclosure associates with them.'],
    ['seller', 'Seller', 'The person or people transferring the property to you, with the address the form associates with them.'],
    ['lender', 'Lender', 'The creditor actually extending the mortgage credit shown on this Closing Disclosure.'],
    ['mic-number', 'Mortgage Insurance Case Number', 'The identifier a mortgage insurer or government insurance program assigns when the loan carries that coverage. Blank when none applies.'],
  ]],
  ['loan-information', [
    ['loan-term', 'Loan Term', 'How long you have to repay — 30 years on this fixed-rate sample. Longer terms mean lower payments but more total interest over the life of the loan.'],
    ['purpose', 'Loan Purpose', 'Why you are borrowing: a purchase, refinance, construction loan, or home-equity transaction.'],
    ['product', 'Loan Product', 'The loan’s rate structure. Fixed Rate means the interest rate never changes; adjustable and step products change how principal or interest is paid over time.'],
    ['loan-type', 'Loan Type', 'The loan program: Conventional means not government-backed, versus FHA, VA, or another listed program with different requirements and costs.'],
    ['loan-id', 'Loan ID', 'The creditor’s identifier for this application. Quote it in every conversation about the loan so nothing gets matched to the wrong file.'],
  ]],
  ['le-rate-lock', [
    ['rate-lock', 'Rate Lock', 'Whether your interest rate is locked. If it says NO, the rate and points can change at any time before you lock; the estimated closing costs themselves are good for ten business days from this form.'],
  ]],
  ['loan-terms', [
    ['loan-amount', 'Loan Amount', 'The principal you are scheduled to repay — before interest and the other costs of getting the mortgage. On the Closing Disclosure it should match your estimate unless you agreed to a change.'],
    ['interest-rate', 'Interest Rate', 'The yearly cost of borrowing as a percentage of the unpaid principal. It does not include fees — that broader number is the APR, so the two are never the same thing.'],
    ['monthly-principal-interest', 'Monthly Principal and Interest', 'Your base monthly payment: repaying the loan plus its interest. Taxes, insurance, and any mortgage insurance come on top of this number.'],
    ['prepayment-penalty', 'Prepayment Penalty', 'A charge for paying the loan off early, during the window stated on the form. Many loans do not have one — this sample does, so it is worth asking whether it can be removed.'],
    ['balloon-payment', 'Balloon Payment', 'A large lump-sum payment due at the end of a loan that does not fully pay itself off through regular payments. Most borrowers are best served being cautious of loans that have one.'],
  ]],
  ['projected-payments', [
    ['projected-principal-interest', 'Projected Principal and Interest', 'The scheduled principal-and-interest portion of each payment for every period the table displays.'],
    ['projected-mortgage-insurance', 'Projected Mortgage Insurance', 'The monthly mortgage-insurance amount, shown with the year range when the table expects it to change or fall away. On conventional loans it can usually be removed once you build enough equity.'],
    ['estimated-escrow', 'Estimated Escrow', 'A monthly set-aside collected with your payment so the servicer can pay selected property costs — typically taxes and insurance — on your behalf.'],
    ['estimated-total-monthly-payment', 'Estimated Total Monthly Payment', 'Your real monthly cost for each period shown: principal, interest, mortgage insurance, and escrow added together.'],
    ['estimated-taxes-insurance-assessments', 'Estimated Taxes, Insurance, and Assessments', 'The estimated monthly total of selected property costs, whether they run through escrow or you pay them directly. Even escrowed amounts can rise year to year.'],
    ['property-taxes-property-cost', 'Property Taxes', 'Charges a state or local taxing authority places on the property. They may be collected through escrow or paid directly, and they can change with assessments.'],
    ['homeowners-insurance-property-cost', 'Homeowner’s Insurance Property Cost', 'The property cost for insurance coverage on the home, collected through escrow or paid directly to your insurer.'],
    ['hoa-dues', 'Homeowner’s Association Dues', 'Recurring charges owed to an association. They can appear here even when they are not part of your escrow account, because you still owe them monthly.'],
  ]],
  ['le-costs-at-closing', [
    ['estimated-closing-costs', 'Estimated Closing Costs', 'The estimated fees due at closing: projected loan costs plus other costs, minus any lender credits. Ask which of these you can shop for — that is where borrowers save real money.'],
  ]],
  ['cd-costs-at-closing', [
    ['closing-costs', 'Closing Costs', 'The final fee total: loan costs plus other costs minus lender credits. Some fees legally cannot increase from the Loan Estimate and others can rise only 10 percent, so compare the two forms.'],
  ]],
  ['payer-column', [
    ['borrower-paid-at-closing', 'Borrower-Paid at Closing', 'Charges you pay out of the funds handled at the closing table.'],
    ['borrower-paid-before-closing', 'Borrower-Paid Before Closing', 'Charges you already paid before closing day — an appraisal charged to your card, for example — so they are not collected again.'],
    ['seller-paid-at-closing', 'Seller-Paid at Closing', 'Charges the seller covers out of the funds handled at closing.'],
    ['seller-paid-before-closing', 'Seller-Paid Before Closing', 'Charges the seller paid before the closing funds are disbursed.'],
    ['paid-by-others', 'Paid by Others', 'Charges covered by someone other than you or the seller — a lender, an agent, or another party.'],
  ]],
  ['cost-item', [
    ['points', 'Points', 'Money paid up front to buy a lower interest rate, disclosed as a percentage of the loan and a dollar amount. Points are optional — a zero-point loan simply carries a somewhat higher rate.'],
    ['application-fee', 'Application Fee', 'The lender’s charge for accepting and processing your application. Because the lender sets it, it is sometimes negotiable.'],
    ['underwriting-fee', 'Underwriting Fee', 'The lender’s charge for evaluating your application, the property, and the loan file against its approval standards.'],
    ['appraisal-fee', 'Appraisal Fee', 'Pays a licensed appraiser to give an independent opinion of the home’s value. The lender picks the appraiser, and you are entitled to a copy of the report.'],
    ['credit-report-fee', 'Credit Report Fee', 'Covers pulling the credit reports and scores used in underwriting. Small pass-through differences from the estimate are normal.'],
    ['flood-determination-fee', 'Flood Determination Fee', 'Covers checking whether the property sits in a mapped flood zone where flood insurance may be required.'],
    ['flood-monitoring-fee', 'Flood Monitoring Fee', 'Pays for ongoing monitoring in case the property’s flood-zone status changes during the life of the loan.'],
    ['tax-monitoring-fee', 'Tax Monitoring Fee', 'Pays a service to watch that property taxes on the home get paid on time.'],
    ['tax-status-research-fee', 'Tax Status Research Fee', 'Covers researching and confirming the property’s tax payment status and history for the transaction.'],
    ['pest-inspection-fee', 'Pest Inspection Fee', 'Pays for an inspection for termites and other wood-destroying organisms. It lives in the shoppable section, where comparing providers can genuinely save money.'],
    ['survey-fee', 'Survey Fee', 'Pays for confirming the property’s boundary lines, improvements, and easements.'],
    ['title-insurance-binder', 'Title Insurance Binder', 'An interim title commitment describing the conditions under which the title policy will be issued. Title services are shoppable — comparing at least two companies is worth it.'],
    ['title-lenders-policy', 'Lender’s Title Policy', 'Title insurance protecting the lender against ownership disputes, up to the policy limits. It is required — and it does not protect you; the optional owner’s policy does that.'],
    ['title-settlement-agent-fee', 'Title Settlement Agent Fee', 'Pays the company that coordinates, documents, and completes your closing.'],
    ['title-search', 'Title Search', 'Research into the property’s ownership history in the public records, hunting for liens, claims, and restrictions before you take title.'],
    ['recording-fees', 'Recording Fees', 'Government charges for entering the deed, mortgage, and related documents into the public land records.'],
    ['transfer-taxes', 'Transfer Taxes', 'State or local government charges tied to transferring the property or recording the change in ownership.'],
    ['homeowners-insurance-premium', 'Homeowner’s Insurance Premium', 'Your first homeowner’s insurance premium, paid in advance at closing for the policy period stated on the form.'],
    ['mortgage-insurance-premium', 'Mortgage Insurance Premium', 'An upfront mortgage-insurance charge collected at closing when the loan’s terms require that coverage.'],
    ['prepaid-interest', 'Prepaid Interest', 'Interest covering the days between closing and the start of your first regular payment period. The exact closing date sets this number, so it commonly shifts from the estimate.'],
    ['prepaid-property-taxes', 'Prepaid Property Taxes', 'Property taxes due at or near closing for a stated period — separate from the deposit that seeds your escrow account.'],
    ['homeowners-insurance-escrow', 'Homeowner’s Insurance Escrow', 'The initial deposit that seeds your escrow account so it can pay future insurance premiums when they come due.'],
    ['mortgage-insurance-escrow', 'Mortgage Insurance Escrow', 'The initial escrow deposit for future mortgage-insurance payments, when the loan collects that amount.'],
    ['property-taxes-escrow', 'Property Taxes Escrow', 'The initial deposit that seeds your escrow account so it can pay property-tax bills when they come due.'],
    ['owners-title-policy', 'Owner’s Title Policy', 'Optional title insurance protecting YOUR ownership of the home, subject to the policy’s terms and limits. It is a one-time cost that many buyers consider worthwhile.'],
    ['lender-credits', 'Lender Credits', 'Money the creditor applies to reduce your closing costs, often in exchange for a somewhat higher rate. A useful lever when cash at closing is tight.'],
    ['aggregate-adjustment', 'Aggregate Adjustment', 'A small calculation that keeps your initial escrow deposit within the legal limit once all the monthly cushions are combined.'],
    ['hoa-capital-contribution', 'HOA Capital Contribution', 'A payment into an association’s reserve or capital fund, charged when the property transfer requires it.'],
    ['hoa-processing-fee', 'HOA Processing Fee', 'The association’s administrative charge for paperwork connected with the ownership transfer.'],
    ['home-inspection-fee', 'Home Inspection Fee', 'Pays for the property-condition inspection you ordered in connection with the purchase.'],
    ['home-warranty-fee', 'Home Warranty Fee', 'Pays for a service contract covering specified home systems or appliances, under the contract’s own terms.'],
    ['seller-broker-commission', 'Seller’s Broker Commission', 'Compensation for the real estate broker on the seller’s side of the transaction, shown here so the full money picture is on one form.'],
    ['buyer-broker-commission', 'Buyer’s Broker Commission', 'Compensation for the real estate broker on the buyer’s side of the transaction, disclosed alongside every other cost in the deal.'],
  ]],
  ['le-cost-total', [
    ['le-a-total', 'Estimated Origination Charges', 'Section A adds up what the lender itself charges to make the loan: points plus its own processing and underwriting fees.'],
    ['le-b-total', 'Estimated Services You Cannot Shop For', 'Section B totals required services where the lender picks the provider — you pay, but you do not choose.'],
    ['le-c-total', 'Estimated Services You Can Shop For', 'Section C totals required services where YOU may pick the provider. Shopping this section is one of the few ways to directly cut closing costs.'],
    ['le-d-total', 'Estimated Total Loan Costs', 'Section D adds origination charges and both service categories into total estimated loan costs.'],
    ['le-e-total', 'Estimated Taxes and Government Fees', 'Section E totals the estimated recording charges, transfer taxes, and other government fees.'],
    ['le-f-total', 'Estimated Prepaids', 'Section F totals amounts paid in advance — your first insurance premium, prepaid interest, and taxes due around closing.'],
    ['le-g-total', 'Estimated Initial Escrow Payment', 'Section G totals the deposits collected at closing to open your escrow account and give it a starting balance.'],
    ['le-h-total', 'Estimated Other Costs', 'Section H totals transaction costs that do not fit the tax, prepaid, or escrow categories — like an optional owner’s title policy.'],
    ['le-i-total', 'Estimated Total Other Costs', 'Section I adds government fees, prepaids, the initial escrow deposit, and other costs into one number.'],
    ['le-j-total', 'Estimated Total Closing Costs', 'Section J is the headline: loan costs plus other costs, minus general lender credits. Compare this line across Loan Estimates from different lenders.'],
    ['le-d-plus-i', 'Estimated D plus I', 'The D + I line shows loan costs plus other costs before lender credits are subtracted — the raw fee total.'],
  ]],
  ['cd-cost-total', [
    ['cd-a-total', 'Final Origination Charges', 'Section A totals the final points and lender charges. Origination charges legally cannot increase from your Loan Estimate.'],
    ['cd-b-total', 'Final Services Borrower Did Not Shop For', 'Section B totals final charges for required services where the lender chose the provider.'],
    ['cd-c-total', 'Final Services Borrower Did Shop For', 'Section C totals final charges for required services where you chose — or could have chosen — the provider. Fees you shopped for can change freely from the estimate.'],
    ['cd-d-total', 'Final Total Loan Costs', 'Section D totals the final borrower-paid origination and service charges from Sections A, B, and C.'],
    ['cd-loan-costs-subtotals', 'Loan Costs Subtotals', 'This line spreads the final loan costs across the borrower-paid timing columns before the total is shown.'],
    ['cd-e-total', 'Final Taxes and Government Fees', 'Section E totals the final recording charges, transfer taxes, and other government fees.'],
    ['cd-f-total', 'Final Prepaids', 'Section F totals the final prepaid amounts. These often move from the estimate because the exact closing date sets the prepaid interest.'],
    ['cd-g-total', 'Final Initial Escrow Payment', 'Section G totals the final deposits collected to open your escrow account.'],
    ['cd-h-total', 'Final Other Costs', 'Section H totals the final costs outside the tax, prepaid, and escrow categories — including any optional owner’s title policy you elected.'],
    ['cd-i-total', 'Final Total Other Costs', 'Section I totals the final borrower-paid government fees, prepaids, escrow deposit, and other costs.'],
    ['cd-other-costs-subtotals', 'Other Costs Subtotals', 'This line spreads the final other costs across the payer and timing columns before the borrower-paid total is shown.'],
    ['cd-j-total', 'Final Total Closing Costs', 'Section J is the final all-in total: borrower-paid loan costs and other costs after lender credits. Page 3 compares each category back to your estimate.'],
    ['cd-closing-costs-subtotals', 'Closing Costs Subtotals', 'This line spreads every final closing cost across the borrower, seller, timing, and paid-by-others columns.'],
  ]],
  ['le-cash', [
    ['le-cash-total-closing-costs', 'Estimated Total Closing Costs in Cash Table', 'This row carries the Section J fee total into the math that produces your estimated cash to close.'],
    ['closing-costs-financed', 'Estimated Closing Costs Financed', 'Closing costs expected to be rolled into the loan amount instead of paid from your own funds — you borrow them rather than bring them.'],
    ['down-payment', 'Estimated Down Payment or Funds from Borrower', 'The part of the purchase you pay yourself — essentially the sale price minus the loan amount.'],
    ['deposit', 'Estimated Deposit', 'The earnest money you already paid with your offer. It is subtracted here because it already counts toward what you owe.'],
    ['funds-for-borrower', 'Estimated Funds for Borrower', 'Loan or transaction funds expected to be paid out to you rather than into the purchase.'],
    ['seller-credits', 'Estimated Seller Credits', 'Money the seller has agreed to put toward your costs — often negotiated after inspections. Credits here directly reduce your cash to close.'],
    ['adjustments-other-credits', 'Estimated Adjustments and Other Credits', 'The catch-all row for other additions or credits that change how much cash you need at closing.'],
  ]],
  ['le-cash-total', [
    ['estimated-cash-to-close', 'Estimated Cash to Close', 'The bottom line of the estimate: what you are projected to bring to — or in some cases receive from — closing once every component is combined.'],
  ]],
  ['cd-cash', [
    ['cd-cash-total-closing-costs', 'Final Total Closing Costs Comparison', 'The heart of page 3: the estimated fee total next to the final one, with a flag for whether it changed and a pointer to the detail if it did.'],
    ['closing-costs-paid-before-closing', 'Closing Costs Paid Before Closing', 'Subtracts the closing costs you already paid before closing day, compared against what the estimate assumed.'],
    ['cd-closing-costs-financed', 'Final Closing Costs Financed', 'Compares the estimated and final closing costs rolled into the loan amount instead of paid in cash.'],
    ['cd-down-payment', 'Final Down Payment or Funds from Borrower', 'Compares the estimated and final down payment or other funds you are putting into the transaction.'],
    ['cd-deposit', 'Final Deposit', 'Compares the estimated and final earnest-money credit and subtracts it from the cash you must bring.'],
    ['cd-funds-for-borrower', 'Final Funds for Borrower', 'Compares the estimated and final amounts expected to be disbursed to you rather than into the purchase.'],
    ['cd-seller-credits', 'Final Seller Credits', 'Compares estimated and final seller contributions. Credits often appear or grow after inspections, and they lower your cash to close.'],
    ['cd-adjustments-other-credits', 'Final Adjustments and Other Credits', 'Compares the other estimated and final additions or credits affecting your closing amount.'],
  ]],
  ['cd-cash-total', [
    ['cash-to-close', 'Final Cash to Close', 'The exact amount to bring to closing — usually by wire or cashier’s check — once every final component is combined. Verify payment instructions independently before sending anything.'],
  ]],
  ['le-comparison', [
    ['five-year-total-paid', 'Total Paid in Five Years', 'Everything you are scheduled to pay in the first five years — principal, interest, mortgage insurance, and loan costs. A strong yardstick for comparing offers with different rates and fees.'],
    ['five-year-principal-paid', 'Principal Paid in Five Years', 'How much of the loan itself you will have paid down after five years. Early payments are mostly interest, so this number is smaller than most people expect.'],
  ]],
  ['shared-cost-measure', [
    ['apr', 'Annual Percentage Rate', 'Your cost of borrowing including certain fees, expressed as a yearly rate. It runs higher than the note rate because it counts loan costs — which is why offers are compared on APR, not rate alone.'],
    ['tip', 'Total Interest Percentage', 'The total interest you would pay over the full term, as a percentage of the loan amount. Around 69 percent here — roughly 69 cents of interest per borrowed dollar if the loan runs its whole course.'],
  ]],
  ['shared-other-disclosure', [
    ['appraisal', 'Appraisal', 'Your right to the appraisal: the lender must promptly give you a copy of the valuation report, even if the loan never closes.'],
    ['refinance', 'Refinance', 'A plain reminder that refinancing later is never guaranteed — it depends on your finances, the property’s value, and market conditions at that time.'],
  ]],
  ['shared-loan-disclosure', [
    ['assumption', 'Assumption', 'Whether a future buyer of your home could take over this loan on its original terms. Most conventional loans, including this sample, do not allow it.'],
    ['late-payment', 'Late Payment', 'The grace period and the formula for the late charge — here, a fee after a payment is more than fifteen days late, as set by the loan terms.'],
  ]],
  ['le-other-consideration', [
    ['homeowners-insurance-requirement', 'Homeowner’s Insurance Requirement', 'You must keep the property insured, but you may choose any insurer the lender reasonably accepts. Shopping that coverage each year is one of the easiest recurring savings in homeownership.'],
    ['servicing', 'Servicing', 'Who you will actually send payments to. Loans are routinely transferred to a servicer after closing — and your loan’s terms do not change when that happens.'],
  ]],
  ['cd-loan-disclosure', [
    ['demand-feature', 'Demand Feature', 'Whether the lender may demand full repayment early under conditions in the loan documents. “Does not have” is the answer most borrowers want to see.'],
    ['negative-amortization', 'Negative Amortization', 'When scheduled payments do not cover the interest due, so the unpaid interest is added to your balance and the loan grows while you pay. Approach any loan that has this with real caution.'],
    ['partial-payments', 'Partial Payments', 'What happens if you pay less than the full amount due. On this sample the servicer may hold partial payments unapplied until a full payment exists.'],
    ['security-interest', 'Security Interest', 'Identifies the property securing repayment — and warns plainly that failing to meet the loan obligations can put that property at risk.'],
  ]],
  ['le-contact', [
    ['loan-officer-contact', 'Loan Officer Contact', 'The individual handling your application, with their license number, email, and phone. This is your first call for every question on the form.'],
  ]],
  ['shared-lender-contact', [
    ['lender-contact', 'Lender Contact', 'The creditor’s name with its address, license numbers, representative, email, and phone. Verify contact details independently before wiring or sending anything.'],
  ]],
  ['cd-contact', [
    ['mortgage-broker-contact', 'Mortgage Broker Contact', 'The Mortgage Broker column stays visible, but its detail cells are blank in this rendered sample — no broker company or representative is provided here.'],
    ['buyer-broker-contact', 'Buyer’s Real Estate Broker Contact', 'The business and representative details for the real estate broker working the buyer’s side.'],
    ['seller-broker-contact', 'Seller’s Real Estate Broker Contact', 'The business and representative details for the real estate broker working the seller’s side.'],
    ['settlement-agent-contact', 'Settlement Agent Contact', 'The closing company’s business and representative details — the people to call with settlement questions.'],
  ]],
  ['receipt', [
    ['confirm-receipt', 'Confirm Receipt', 'Signing here only confirms you RECEIVED the form. It does not accept the loan, and it does not obligate you to close.'],
  ]],
  ['borrower-transaction', [
    ['cd-k-total', 'Due from Borrower at Closing', 'Section K totals everything you owe: the purchase price, your closing costs, and other amounts charged to you at closing.'],
    ['borrower-transaction-sale-price', 'Borrower Transaction Sale Price', 'The contract price of the home, entered on your side of the ledger as the largest amount you owe.'],
    ['borrower-personal-property', 'Borrower Transaction Personal Property', 'Any separately agreed price for tangible personal property — appliances, furniture — included in the sale.'],
    ['borrower-closing-costs-paid-at-closing', 'Borrower Closing Costs Paid at Closing', 'Carries your borrower-paid-at-closing costs from Section J into the transaction ledger.'],
    ['borrower-hoa-dues', 'Borrower HOA Dues Adjustment', 'Splits association dues for the stated period fairly between you and the seller, based on the closing date.'],
    ['cd-l-total', 'Paid Already by or on Behalf of Borrower', 'Section L totals everything already credited to you: your deposit, the loan amount, seller credits, and other amounts paid on your behalf.'],
    ['borrower-deposit', 'Borrower Deposit', 'Your earnest money, already paid with the offer, now credited against what you owe.'],
    ['borrower-transaction-loan-amount', 'Loan Amount Applied for Borrower', 'The mortgage principal itself, applied as a credit toward everything due at closing.'],
    ['borrower-existing-loans', 'Existing Loans Assumed by Borrower', 'The balance of an existing loan you are assuming or taking subject to, credited on your side when that applies.'],
    ['borrower-seller-credit', 'Seller Credit to Borrower', 'The seller’s agreed contribution, credited to you and reducing the cash you must bring.'],
    ['title-rebate', 'Title Company Rebate', 'A rebate from the named title company, applied as an other credit in your ledger.'],
    ['borrower-city-taxes', 'Borrower City or Town Taxes Adjustment', 'Credits or charges city or town taxes for the stated period so each party pays only for the days they own the home.'],
    ['total-due-from-borrower', 'Total Due from Borrower', 'Repeats the Section K total — everything you owe before your credits in Section L are subtracted.'],
    ['total-paid-for-borrower', 'Total Paid for Borrower', 'Repeats the Section L total — the credits subtracted from what you owe.'],
    ['borrower-cash-to-close', 'Borrower Cash to Close', 'The difference between what you owe and what is already credited, labeled to show whether cash comes from you or goes to you.'],
  ]],
  ['seller-transaction', [
    ['cd-m-total', 'Due to Seller at Closing', 'Section M totals what the seller is owed: the property price plus other amounts credited to the seller.'],
    ['seller-sale-price', 'Seller Transaction Sale Price', 'The contract price of the home, entered on the seller’s side as the largest amount owed to them.'],
    ['seller-personal-property', 'Seller Transaction Personal Property', 'Any separately agreed price for personal property included in the sale, credited to the seller.'],
    ['seller-hoa-dues', 'Seller HOA Dues Adjustment', 'Splits association dues for the stated period between the seller and buyer, based on the closing date.'],
    ['cd-n-total', 'Due from Seller at Closing', 'Section N totals what the seller owes: their closing costs, mortgage payoffs, credits to you, and other charges.'],
    ['excess-deposit', 'Excess Deposit', 'The part of a buyer deposit beyond what the ledger already accounts for, due back from the seller when it applies.'],
    ['seller-closing-costs', 'Seller Closing Costs', 'Carries the seller-paid-at-closing costs from Section J into the seller’s side of the ledger.'],
    ['first-mortgage-payoff', 'First Mortgage Payoff', 'The amount used at closing to pay off the seller’s first mortgage so you receive clear title.'],
    ['second-mortgage-payoff', 'Second Mortgage Payoff', 'The amount used at closing to satisfy a second mortgage on the property, when one exists.'],
    ['seller-credit-debit', 'Seller Credit Charged to Seller', 'The seller contribution charged on the seller’s side — the same credit that appears on your side of the ledger.'],
    ['seller-city-taxes', 'Seller City or Town Taxes Adjustment', 'Allocates city or town taxes for the stated period to the seller’s side of the ledger.'],
    ['total-due-to-seller', 'Total Due to Seller', 'Repeats the Section M total credited to the seller before their charges are subtracted.'],
    ['total-due-from-seller', 'Total Due from Seller', 'Repeats the Section N total subtracted from what the seller is owed.'],
    ['cash-to-seller', 'Cash to Seller', 'The seller’s bottom line: credits minus charges, labeled to show whether cash goes to or comes from the seller.'],
  ]],
  ['escrow', [
    ['escrow-account', 'Escrow Account', 'Confirms the loan will have an escrow account: part of each payment is held so the servicer can pay listed property costs for you when they come due.'],
    ['escrowed-property-costs', 'Escrowed Property Costs', 'The estimated first-year costs — typically taxes and insurance — that the escrow account is expected to pay on your behalf.'],
    ['non-escrowed-property-costs', 'Non-Escrowed Property Costs', 'Estimated first-year property expenses you must pay directly, because the escrow account does not cover them.'],
    ['initial-escrow-payment', 'Initial Escrow Payment', 'The amount collected at closing to open the account and give it a starting balance, including any allowed cushion.'],
    ['monthly-escrow-payment', 'Monthly Escrow Payment', 'The slice of your regular mortgage payment that goes into escrow for property costs.'],
    ['no-escrow', 'No Escrow', 'When a loan has no escrow account, this area explains your direct-payment responsibilities and any fee for waiving escrow.'],
    ['future-escrow-changes', 'Future Escrow Changes', 'A heads-up that property costs — and therefore escrow payments — can change, plus the consequences of canceling escrow or missing property-cost bills.'],
  ]],
  ['loan-calculation', [
    ['total-payments', 'Total of Payments', 'Everything you are scheduled to pay over the full term: principal, interest, mortgage insurance, and borrower-paid loan costs combined.'],
    ['finance-charge', 'Finance Charge', 'The total dollar cost of the credit under Regulation Z’s finance-charge rules — all the interest plus the counted loan fees over the full term.'],
    ['amount-financed', 'Amount Financed', 'The loan amount available after subtracting the upfront finance charges — the figure federal APR math is built on, not necessarily the cash you see.'],
  ]],
  ['other-disclosure', [
    ['contract-details', 'Contract Details', 'Points you to your note and security instrument for the rules on default, acceleration, foreclosure, and early repayment.'],
    ['liability-after-foreclosure', 'Liability after Foreclosure', 'Whether state law may protect you from owing a remaining balance after a foreclosure — protections differ meaningfully from state to state.'],
    ['tax-deductions', 'Tax Deductions', 'A caution that interest on debt above the property’s value may not be federally deductible, with a pointer to consult a tax advisor about your situation.'],
  ]],
  ['questions', [
    ['questions-cfpb', 'Questions and CFPB Contact', 'Directs questions about the loan’s terms or costs to the listed contacts, and gives the CFPB’s mortgage-closing resources and complaint line.'],
  ]],
];

const items = groupedItems.flatMap(([group, entries]) => entries.map(entry => [...entry, group]));

export const EXPLANATIONS = Object.freeze(Object.fromEntries(items.map(([id, title, what, groupName]) => {
  const group = GROUPS[groupName];
  const record = {
    id,
    title,
    body: `${what} ${group.why} ${SAMPLE_NOTE}`,
    source: Object.freeze({
      type: 'CFPB samples, Guide to Forms v2.1, and Regulation Z',
      reference: group.reference,
    }),
    review: Object.freeze({ status: 'approved', reviewer: 'Zachary Zink', reviewedOn: '2026-08-31' }),
  };
  if (ASKS[id]) record.learnerQuestion = ASKS[id];
  return [id, Object.freeze(record)];
})));
