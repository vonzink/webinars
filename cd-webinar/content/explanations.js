const GROUPS = Object.freeze({
  'form-general-information': Object.freeze({
    why: 'It appears in General Information near the top of both forms so the disclosure can be matched to the property and proposed or final transaction.',
    reference: 'H24B page 1; H25B page 1; CFPB Guide to Forms v2.1 §§ 2.2.1 and 3.2.1; 12 CFR 1026.37(a)(4), (6)–(7), 1026.38(a)(3)(i), (vi)–(vii)',
  }),
  'le-general-information': Object.freeze({
    why: 'It appears in the Loan Estimate’s General Information so the disclosure can be matched to the people applying for the proposed mortgage.',
    reference: 'H24B page 1; CFPB Guide to Forms v2.1 § 2.2.1; 12 CFR 1026.37(a)(5)',
  }),
  'cd-general-information': Object.freeze({
    why: 'It appears in the Closing Disclosure’s General Information so the final form can be matched to the parties, closing file, and transaction.',
    reference: 'H25B page 1; CFPB Guide to Forms v2.1 § 3.2.1; 12 CFR 1026.38(a)(3)(ii)–(v), (4), (5)(vi)',
  }),
  'loan-information': Object.freeze({
    why: 'It appears in General Information at the top of the form so the borrower can identify the mortgage being estimated or finalized before reviewing its detailed terms.',
    reference: 'H24B page 1; H25B page 1; CFPB Guide to Forms v2.1 §§ 2.2.1 and 3.2.1; 12 CFR 1026.37(a)(8)–(12), 1026.38(a)(5)(i)–(v)',
  }),
  'le-rate-lock': Object.freeze({
    why: 'It appears in the Loan Estimate’s General Information to state whether the quoted rate is locked and when the lock and estimated-cost availability expire.',
    reference: 'H24B page 1; CFPB Guide to Forms v2.1 § 2.2.1; 12 CFR 1026.37(a)(13)',
  }),
  'loan-terms': Object.freeze({
    why: 'It appears in the Loan Terms section so a borrower can identify a key feature of the proposed or final legal obligation and compare the two forms.',
    reference: 'H24B page 1; H25B page 1; CFPB Guide to Forms v2.1 §§ 2.2.2 and 3.2.2; 12 CFR 1026.37(b), 1026.38(b)',
  }),
  'projected-payments': Object.freeze({
    why: 'It appears in the Projected Payments table to show how scheduled payment components and selected property costs contribute to the monthly housing amount over time.',
    reference: 'H24B page 1; H25B page 1; CFPB Guide to Forms v2.1 §§ 2.2.3 and 3.2.3; 12 CFR 1026.37(c), 1026.38(c)',
  }),
  'le-costs-at-closing': Object.freeze({
    why: 'It appears in the Loan Estimate’s Costs at Closing summary so the borrower can see the estimated total and follow the reference to detailed costs on page 2.',
    reference: 'H24B page 1; CFPB Guide to Forms v2.1 § 2.2.4; 12 CFR 1026.37(d)',
  }),
  'cd-costs-at-closing': Object.freeze({
    why: 'It appears in the Closing Disclosure’s Costs at Closing summary so the borrower can see the final total and follow the reference to detailed costs on page 2.',
    reference: 'H25B page 1; CFPB Guide to Forms v2.1 § 3.2.4; 12 CFR 1026.38(d)',
  }),
  'cost-item': Object.freeze({
    why: 'It appears in Closing Cost Details to identify a charge, credit, service, or government amount that contributes to the estimated or final cost of the transaction.',
    reference: 'H24B page 2; H25B page 2; CFPB Guide to Forms v2.1 §§ 2.3.1–2.3.2 and 3.3.1–3.3.2; 12 CFR 1026.37(f)–(g), 1026.38(f)–(h)',
  }),
  'le-cost-total': Object.freeze({
    why: 'It appears as a Loan Estimate subtotal so the borrower can see how estimated charges are grouped before they flow into total closing costs and estimated cash to close.',
    reference: 'H24B page 2; CFPB Guide to Forms v2.1 §§ 2.3.1–2.3.3; 12 CFR 1026.37(f)–(h)',
  }),
  'cd-cost-total': Object.freeze({
    why: 'It appears as a Closing Disclosure subtotal so the borrower can trace final charges and payer allocations into total closing costs and final cash to close.',
    reference: 'H25B page 2; CFPB Guide to Forms v2.1 §§ 3.3.1–3.3.2; 12 CFR 1026.38(f)–(h)',
  }),
  'payer-column': Object.freeze({
    why: 'It appears above the Closing Cost Details columns to identify which party paid a charge and whether that payment occurred at or before closing.',
    reference: 'H25B page 2; CFPB Guide to Forms v2.1 §§ 3.3.1–3.3.2; 12 CFR 1026.38(f)–(h)',
  }),
  'le-cash': Object.freeze({
    why: 'It appears in the Loan Estimate’s Calculating Cash to Close table to show how estimated costs, funds, deposits, and credits combine into the amount expected at closing.',
    reference: 'H24B page 2; CFPB Guide to Forms v2.1 § 2.3.3; 12 CFR 1026.37(h)',
  }),
  'cd-cash': Object.freeze({
    why: 'It appears in the Closing Disclosure’s Calculating Cash to Close table to compare the latest estimate with final figures and show how the closing amount is derived.',
    reference: 'H25B page 3; CFPB Guide to Forms v2.1 § 3.4.1; 12 CFR 1026.38(i)',
  }),
  'le-cash-total': Object.freeze({
    why: 'It appears in the Loan Estimate’s Costs at Closing summary and again as the total in Calculating Cash to Close so the borrower can trace the estimated amount to its calculation.',
    reference: 'H24B pages 1–2; CFPB Guide to Forms v2.1 §§ 2.2.4 and 2.3.3; 12 CFR 1026.37(d), 1026.37(h)',
  }),
  'cd-cash-total': Object.freeze({
    why: 'It appears in the Closing Disclosure’s Costs at Closing summary and again as the total in Calculating Cash to Close so the borrower can trace the final amount to its calculation.',
    reference: 'H25B pages 1 and 3; CFPB Guide to Forms v2.1 §§ 3.2.4 and 3.4.1; 12 CFR 1026.38(d), 1026.38(i)',
  }),
  'le-comparison': Object.freeze({
    why: 'It appears in the Loan Estimate’s Comparisons section so a borrower can evaluate scheduled cost and principal reduction over the first five years.',
    reference: 'H24B page 3; CFPB Guide to Forms v2.1 § 2.4.2; 12 CFR 1026.37(l)',
  }),
  'shared-cost-measure': Object.freeze({
    why: 'It appears in Loan Estimate Comparisons and Closing Disclosure Loan Calculations so a borrower can compare a defined cost measure with the note rate, payment, and other loan information.',
    reference: 'H24B page 3; H25B page 5; CFPB Guide to Forms v2.1 §§ 2.4.2 and 3.6.1; 12 CFR 1026.37(l), 1026.38(o)',
  }),
  'shared-loan-disclosure': Object.freeze({
    why: 'It appears in Loan Estimate Other Considerations and Closing Disclosure Loan Disclosures because it describes a contractual policy or consequence that may matter after closing.',
    reference: 'H24B page 3; H25B page 4; CFPB Guide to Forms v2.1 §§ 2.4.3 and 3.5.1; 12 CFR 1026.37(m), 1026.38(m)',
  }),
  'shared-other-disclosure': Object.freeze({
    why: 'It appears in Loan Estimate Other Considerations and Closing Disclosure Other Disclosures because it describes a borrower right or future option tied to the mortgage process.',
    reference: 'H24B page 3; H25B page 5; CFPB Guide to Forms v2.1 §§ 2.4.3 and 3.6.2; 12 CFR 1026.37(m), 1026.38(p)',
  }),
  'le-other-consideration': Object.freeze({
    why: 'It appears in the Loan Estimate’s Other Considerations because it describes an estimated policy or requirement the borrower should understand before proceeding.',
    reference: 'H24B page 3; CFPB Guide to Forms v2.1 § 2.4.3; 12 CFR 1026.37(m)',
  }),
  'cd-loan-disclosure': Object.freeze({
    why: 'It appears in the Closing Disclosure’s Loan Disclosures because it describes a final contractual feature, payment policy, or security consequence of the mortgage.',
    reference: 'H25B page 4; CFPB Guide to Forms v2.1 § 3.5.1; 12 CFR 1026.38(m)',
  }),
  'le-contact': Object.freeze({
    why: 'It appears in Loan Estimate Contact Information so the borrower can identify and reach the individual handling the application.',
    reference: 'H24B page 3; CFPB Guide to Forms v2.1 § 2.4.1; 12 CFR 1026.37(k)',
  }),
  'shared-lender-contact': Object.freeze({
    why: 'It appears in Contact Information on both forms so the borrower can identify and reach the creditor connected with the proposed and final loan.',
    reference: 'H24B page 3; H25B page 5; CFPB Guide to Forms v2.1 §§ 2.4.1 and 3.6.3; 12 CFR 1026.37(k), 1026.38(r)',
  }),
  'cd-contact': Object.freeze({
    why: 'It appears in Closing Disclosure Contact Information so the borrower can identify a participating closing professional or recognize when a role is not provided in the sample.',
    reference: 'H25B page 5; CFPB Guide to Forms v2.1 § 3.6.3; 12 CFR 1026.38(r)',
  }),
  receipt: Object.freeze({
    why: 'It appears at the end of the form to document receipt of the disclosure without converting the signature into acceptance of the loan terms.',
    reference: 'H24B page 3; H25B page 5; CFPB Guide to Forms v2.1 §§ 2.4.5 and 3.6.4; 12 CFR 1026.37(n), 1026.38(s)',
  }),
  'borrower-transaction': Object.freeze({
    why: 'It appears in the borrower’s transaction summary to account for an amount due from the borrower or already paid by or on the borrower’s behalf at closing.',
    reference: 'H25B page 3; CFPB Guide to Forms v2.1 §§ 3.4.3–3.4.4; 12 CFR 1026.38(j)',
  }),
  'seller-transaction': Object.freeze({
    why: 'It appears in the seller’s transaction summary to account for an amount due to or from the seller and to calculate the seller’s closing proceeds.',
    reference: 'H25B page 3; CFPB Guide to Forms v2.1 §§ 3.4.3 and 3.4.5; 12 CFR 1026.38(k)',
  }),
  escrow: Object.freeze({
    why: 'It appears in the Escrow Account disclosure to explain which property costs are handled through escrow, which are paid directly, and how those amounts affect closing and monthly payments.',
    reference: 'H25B page 4; CFPB Guide to Forms v2.1 § 3.5.3; 12 CFR 1026.38(l)',
  }),
  'loan-calculation': Object.freeze({
    why: 'It appears in Loan Calculations to summarize a federally defined cost or payment measure using the final loan terms and applicable finance-charge rules.',
    reference: 'H25B page 5; CFPB Guide to Forms v2.1 § 3.6.1; 12 CFR 1026.38(o)',
  }),
  'other-disclosure': Object.freeze({
    why: 'It appears in Other Disclosures to direct the borrower to an important document, legal consequence, professional resource, or post-closing consideration.',
    reference: 'H25B page 5; CFPB Guide to Forms v2.1 § 3.6.2; 12 CFR 1026.38(p)',
  }),
  questions: Object.freeze({
    why: 'It appears on the Closing Disclosure so a borrower knows where to ask about the form and where to find CFPB information or make a complaint.',
    reference: 'H25B page 5; CFPB Guide to Forms v2.1 § 3.6; 12 CFR 1026.38(q)',
  }),
});

const BORROWER_GUIDANCE = 'Borrowers should read the label and displayed value with the surrounding section, ask the lender or settlement professional about anything unexpected, and remember that this sample illustrates one transaction rather than a rule that every mortgage uses the same amount, provider, feature, or treatment.';

const groupedItems = [
  ['form-general-information', [
    ['date-issued', 'Date Issued', 'The date issued is the day the creditor delivers or places the Loan Estimate or Closing Disclosure in the mail.'],
    ['property', 'Property', 'Property identifies the real estate expected to secure the mortgage, using its address or another location description when needed.'],
    ['sale-price', 'Sale Price', 'Sale price is the contract price for the real property in this purchase transaction, separate from any separately priced personal property.'],
  ]],
  ['le-general-information', [
    ['applicants', 'Applicants', 'Applicants identifies the consumers applying for the mortgage and gives the mailing address associated with the Loan Estimate.'],
  ]],
  ['cd-general-information', [
    ['closing-date', 'Closing Date', 'Closing date is the date the borrower becomes contractually obligated on the credit transaction, commonly called consummation.'],
    ['disbursement-date', 'Disbursement Date', 'Disbursement date is when the disclosed loan or closing funds are expected to be paid to the borrower, seller, or another party.'],
    ['settlement-agent', 'Settlement Agent', 'Settlement agent identifies the company conducting the closing and coordinating the settlement information shown on the form.'],
    ['file-number', 'File Number', 'File number is the settlement agent’s identifier for the closing file and helps the parties match documents and communications to the transaction.'],
    ['borrower', 'Borrower', 'Borrower identifies the consumer or consumers obligated on the mortgage and lists the address associated with them on the final disclosure.'],
    ['seller', 'Seller', 'Seller identifies the person or people transferring the property in the purchase transaction and lists the address associated with them.'],
    ['lender', 'Lender', 'Lender identifies the creditor extending the mortgage credit shown on the Closing Disclosure.'],
    ['mic-number', 'Mortgage Insurance Case Number', 'The mortgage insurance case number is the identifier assigned by a mortgage insurer or government insurance program when one applies.'],
  ]],
  ['loan-information', [
    ['loan-term', 'Loan Term', 'Loan term states the scheduled length of the mortgage, such as the 30-year period printed on this fixed-rate sample.'],
    ['purpose', 'Loan Purpose', 'Purpose classifies why the mortgage credit is being obtained, such as a purchase, refinance, construction, or home-equity transaction.'],
    ['product', 'Loan Product', 'Product describes the loan’s rate structure and any feature that changes how principal or interest is paid.'],
    ['loan-type', 'Loan Type', 'Loan type identifies whether the mortgage is conventional or connected to a listed government loan program.'],
    ['loan-id', 'Loan ID', 'Loan ID is the creditor’s identifier for this mortgage application or account and helps match the disclosure to other loan records.'],
  ]],
  ['le-rate-lock', [
    ['rate-lock', 'Rate Lock', 'Rate lock shows whether the interest rate is locked and, when it is, the date and time the protection expires.'],
  ]],
  ['loan-terms', [
    ['loan-amount', 'Loan Amount', 'Loan amount is the principal the borrower is scheduled to repay, before interest and other costs of obtaining the mortgage.'],
    ['interest-rate', 'Interest Rate', 'The interest rate is the percentage used to calculate interest on the unpaid principal balance and is not the same as the annual percentage rate.'],
    ['monthly-principal-interest', 'Monthly Principal and Interest', 'Monthly principal and interest is the scheduled payment portion that reduces principal and pays interest, excluding other monthly housing costs.'],
    ['prepayment-penalty', 'Prepayment Penalty', 'A prepayment penalty is a charge that may apply if the borrower pays off all or part of the loan during the period stated on the form.'],
    ['balloon-payment', 'Balloon Payment', 'A balloon payment is a final scheduled payment substantially larger than the regular periodic payments when the loan does not fully amortize beforehand.'],
  ]],
  ['projected-payments', [
    ['projected-principal-interest', 'Projected Principal and Interest', 'Projected principal and interest shows the scheduled principal-and-interest amount for each payment period displayed in the table.'],
    ['projected-mortgage-insurance', 'Projected Mortgage Insurance', 'Projected mortgage insurance shows the monthly mortgage-insurance amount and when the table expects that component to change or end.'],
    ['estimated-escrow', 'Estimated Escrow', 'Estimated escrow is the monthly amount collected with the payment for selected property costs that the servicer expects to pay.'],
    ['estimated-total-monthly-payment', 'Estimated Total Monthly Payment', 'Estimated total monthly payment combines the displayed principal, interest, mortgage insurance, and escrow components for each payment period.'],
    ['estimated-taxes-insurance-assessments', 'Estimated Taxes, Insurance, and Assessments', 'This estimate totals selected monthly property costs whether they are paid through escrow or paid directly by the borrower.'],
    ['property-taxes-property-cost', 'Property Taxes', 'Property taxes are charges imposed by a state or local taxing authority on the property and may be collected through escrow or paid directly.'],
    ['homeowners-insurance-property-cost', 'Homeowner’s Insurance Property Cost', 'Homeowner’s insurance is a property cost for coverage on the home and may be collected through escrow or paid directly.'],
    ['hoa-dues', 'Homeowner’s Association Dues', 'Homeowner’s association dues are recurring charges owed to an association and may be listed even when they are not included in escrow.'],
  ]],
  ['le-costs-at-closing', [
    ['estimated-closing-costs', 'Estimated Closing Costs', 'Estimated closing costs combine the Loan Estimate’s projected loan costs and other costs after subtracting any lender credits.'],
  ]],
  ['cd-costs-at-closing', [
    ['closing-costs', 'Closing Costs', 'Closing costs state the final disclosed loan costs and other costs after subtracting lender credits, with detailed amounts on page 2.'],
  ]],
  ['payer-column', [
    ['borrower-paid-at-closing', 'Borrower-Paid at Closing', 'This payer column contains charges the borrower will pay from funds handled at closing.'],
    ['borrower-paid-before-closing', 'Borrower-Paid Before Closing', 'This payer column contains charges the borrower paid before the closing funds are disbursed.'],
    ['seller-paid-at-closing', 'Seller-Paid at Closing', 'This payer column contains charges the seller will pay from funds handled at closing.'],
    ['seller-paid-before-closing', 'Seller-Paid Before Closing', 'This payer column contains charges the seller paid before the closing funds are disbursed.'],
    ['paid-by-others', 'Paid by Others', 'This payer column contains charges paid by a party other than the borrower or seller.'],
  ]],
  ['cost-item', [
    ['points', 'Points', 'Points are upfront charges calculated as a percentage of the loan amount and disclosed with the percentage and dollar amount.'],
    ['application-fee', 'Application Fee', 'An application fee is a charge for accepting or processing a mortgage application when the creditor imposes one.'],
    ['underwriting-fee', 'Underwriting Fee', 'An underwriting fee is a charge for evaluating the application, property, and loan information under the creditor’s approval standards.'],
    ['appraisal-fee', 'Appraisal Fee', 'An appraisal fee pays for a valuation professional to develop an opinion of the property’s value for the mortgage process.'],
    ['credit-report-fee', 'Credit Report Fee', 'A credit report fee covers the report used to review credit history and other credit information during underwriting.'],
    ['flood-determination-fee', 'Flood Determination Fee', 'A flood determination fee covers checking whether the property lies in an area where flood-insurance requirements may apply.'],
    ['flood-monitoring-fee', 'Flood Monitoring Fee', 'A flood monitoring fee covers later monitoring for changes to the property’s mapped flood-zone status.'],
    ['tax-monitoring-fee', 'Tax Monitoring Fee', 'A tax monitoring fee covers tracking property-tax payment or delinquency information connected with the mortgaged property.'],
    ['tax-status-research-fee', 'Tax Status Research Fee', 'A tax status research fee covers obtaining or confirming current property-tax status information for the transaction.'],
    ['pest-inspection-fee', 'Pest Inspection Fee', 'A pest inspection fee pays for an inspection for termites or other wood-destroying organisms when that service is obtained.'],
    ['survey-fee', 'Survey Fee', 'A survey fee pays for work identifying property boundaries, improvements, easements, or other location information.'],
    ['title-insurance-binder', 'Title Insurance Binder', 'A title insurance binder is an interim commitment describing the conditions under which a title policy is expected to be issued.'],
    ['title-lenders-policy', 'Lender’s Title Policy', 'A lender’s title policy protects the lender against covered title defects up to the policy limits and does not substitute for owner’s coverage.'],
    ['title-settlement-agent-fee', 'Title Settlement Agent Fee', 'A title settlement agent fee covers services involved in coordinating, documenting, and completing the real estate settlement.'],
    ['title-search', 'Title Search', 'A title search examines public records for ownership, liens, restrictions, and other matters affecting title to the property.'],
    ['recording-fees', 'Recording Fees', 'Recording fees are government charges for placing deeds, mortgages, and related documents in the public land records.'],
    ['transfer-taxes', 'Transfer Taxes', 'Transfer taxes are state or local government charges tied to transferring the property or recording the change in ownership.'],
    ['homeowners-insurance-premium', 'Homeowner’s Insurance Premium', 'The homeowner’s insurance premium is coverage paid in advance at closing for the policy period stated on the form.'],
    ['mortgage-insurance-premium', 'Mortgage Insurance Premium', 'A mortgage insurance premium is an upfront charge for mortgage insurance when the loan terms require that coverage.'],
    ['prepaid-interest', 'Prepaid Interest', 'Prepaid interest covers interest accruing from disbursement through the day before the first regular payment period begins.'],
    ['prepaid-property-taxes', 'Prepaid Property Taxes', 'Prepaid property taxes are taxes due at or near closing for a stated period, separate from an initial escrow deposit.'],
    ['homeowners-insurance-escrow', 'Homeowner’s Insurance Escrow', 'Homeowner’s insurance escrow is the initial deposit collected at closing to help fund later insurance payments from the escrow account.'],
    ['mortgage-insurance-escrow', 'Mortgage Insurance Escrow', 'Mortgage insurance escrow is the initial deposit for later mortgage-insurance payments when such an amount applies.'],
    ['property-taxes-escrow', 'Property Taxes Escrow', 'Property taxes escrow is the initial deposit collected at closing to help fund later tax payments from the escrow account.'],
    ['owners-title-policy', 'Owner’s Title Policy', 'An owner’s title policy is optional coverage protecting the owner against covered title defects, subject to the policy terms and limits.'],
    ['lender-credits', 'Lender Credits', 'Lender credits are amounts the creditor applies to reduce the borrower’s closing costs, often in exchange for other loan pricing.'],
    ['aggregate-adjustment', 'Aggregate Adjustment', 'The aggregate adjustment is a calculation used to keep the initial escrow deposit within applicable limits when individual cushion amounts are combined.'],
    ['hoa-capital-contribution', 'HOA Capital Contribution', 'An HOA capital contribution is a payment to an association’s reserve or capital fund when required for the property transfer.'],
    ['hoa-processing-fee', 'HOA Processing Fee', 'An HOA processing fee is a charge for association administrative work connected with the ownership transfer or closing.'],
    ['home-inspection-fee', 'Home Inspection Fee', 'A home inspection fee pays for a property-condition inspection obtained in connection with the purchase.'],
    ['home-warranty-fee', 'Home Warranty Fee', 'A home warranty fee pays for a service contract covering specified home systems or appliances under its terms.'],
    ['seller-broker-commission', 'Seller’s Broker Commission', 'The seller’s broker commission is compensation shown for the real estate broker associated with the seller’s side of the transaction.'],
    ['buyer-broker-commission', 'Buyer’s Broker Commission', 'The buyer’s broker commission is compensation shown for the real estate broker associated with the buyer’s side of the transaction.'],
  ]],
  ['le-cost-total', [
    ['le-a-total', 'Estimated Origination Charges', 'Section A totals the estimated points and other charges paid to the creditor or mortgage broker for originating the loan.'],
    ['le-b-total', 'Estimated Services You Cannot Shop For', 'Section B totals estimated required services for which the creditor does not permit the borrower to choose the provider.'],
    ['le-c-total', 'Estimated Services You Can Shop For', 'Section C totals estimated required services for which the borrower may select a provider under the applicable process.'],
    ['le-d-total', 'Estimated Total Loan Costs', 'Section D adds estimated origination charges and the two service categories to produce total estimated loan costs.'],
    ['le-e-total', 'Estimated Taxes and Government Fees', 'Section E totals estimated recording charges, transfer taxes, and other listed government fees.'],
    ['le-f-total', 'Estimated Prepaids', 'Section F totals estimated amounts paid in advance for interest, insurance, taxes, or other listed prepaid items.'],
    ['le-g-total', 'Estimated Initial Escrow Payment', 'Section G totals estimated deposits collected at closing to establish the escrow account for listed property costs.'],
    ['le-h-total', 'Estimated Other Costs', 'Section H totals estimated transaction costs that do not belong in the preceding taxes, prepaids, or escrow categories.'],
    ['le-i-total', 'Estimated Total Other Costs', 'Section I adds the estimated government fees, prepaids, initial escrow deposit, and other costs.'],
    ['le-j-total', 'Estimated Total Closing Costs', 'Section J combines estimated loan costs and other costs, then accounts for any general lender credits.'],
    ['le-d-plus-i', 'Estimated D plus I', 'The D plus I line shows estimated loan costs plus estimated other costs before subtracting lender credits.'],
  ]],
  ['cd-cost-total', [
    ['cd-a-total', 'Final Origination Charges', 'Section A totals final points and other charges paid to the creditor or mortgage broker for originating the loan.'],
    ['cd-b-total', 'Final Services Borrower Did Not Shop For', 'Section B totals final required service charges for which the borrower did not select the provider.'],
    ['cd-c-total', 'Final Services Borrower Did Shop For', 'Section C totals final required service charges for which the borrower selected or could select the provider.'],
    ['cd-d-total', 'Final Total Loan Costs', 'Section D totals the final borrower-paid origination and service charges in Sections A, B, and C.'],
    ['cd-loan-costs-subtotals', 'Loan Costs Subtotals', 'This line distributes final loan costs across the borrower-paid timing columns before the borrower-paid total is shown.'],
    ['cd-e-total', 'Final Taxes and Government Fees', 'Section E totals final recording charges, transfer taxes, and other listed government fees.'],
    ['cd-f-total', 'Final Prepaids', 'Section F totals final amounts paid in advance for interest, insurance, taxes, or other listed prepaid items.'],
    ['cd-g-total', 'Final Initial Escrow Payment', 'Section G totals final deposits collected at closing to establish the escrow account for listed property costs.'],
    ['cd-h-total', 'Final Other Costs', 'Section H totals final transaction costs that do not belong in the preceding taxes, prepaids, or escrow categories.'],
    ['cd-i-total', 'Final Total Other Costs', 'Section I totals the final borrower-paid government fees, prepaids, initial escrow deposit, and other costs.'],
    ['cd-other-costs-subtotals', 'Other Costs Subtotals', 'This line distributes final other costs across the payer and timing columns before the borrower-paid total is shown.'],
    ['cd-j-total', 'Final Total Closing Costs', 'Section J combines final borrower-paid loan costs and other costs after lender credits.'],
    ['cd-closing-costs-subtotals', 'Closing Costs Subtotals', 'This line distributes all final closing costs across borrower, seller, timing, and paid-by-others columns.'],
  ]],
  ['le-cash', [
    ['le-cash-total-closing-costs', 'Estimated Total Closing Costs in Cash Table', 'This row carries estimated total closing costs from Section J into the calculation of estimated cash to close.'],
    ['closing-costs-financed', 'Estimated Closing Costs Financed', 'This row shows estimated closing costs expected to be paid from the loan amount instead of separate borrower funds.'],
    ['down-payment', 'Estimated Down Payment or Funds from Borrower', 'This row shows the estimated down payment or other borrower funds contributing to the purchase and closing.'],
    ['deposit', 'Estimated Deposit', 'This row subtracts the borrower’s deposit already paid toward the purchase from the amount still needed at closing.'],
    ['funds-for-borrower', 'Estimated Funds for Borrower', 'This row shows estimated loan or transaction funds expected to be disbursed to the borrower.'],
    ['seller-credits', 'Estimated Seller Credits', 'This row subtracts estimated seller contributions applied toward the borrower’s costs or other disclosed amounts.'],
    ['adjustments-other-credits', 'Estimated Adjustments and Other Credits', 'This row captures other estimated additions or credits affecting the borrower’s cash requirement.'],
  ]],
  ['le-cash-total', [
    ['estimated-cash-to-close', 'Estimated Cash to Close', 'Estimated cash to close is the projected amount the borrower will need to bring to or receive from closing after the listed components are combined.'],
  ]],
  ['cd-cash', [
    ['cd-cash-total-closing-costs', 'Final Total Closing Costs Comparison', 'This row compares estimated and final total closing costs and points to the detailed sections when the amount changed.'],
    ['closing-costs-paid-before-closing', 'Closing Costs Paid Before Closing', 'This row subtracts final closing costs the borrower already paid before closing and compares them with the estimate.'],
    ['cd-closing-costs-financed', 'Final Closing Costs Financed', 'This row compares estimated and final closing costs paid from the loan amount rather than separate borrower funds.'],
    ['cd-down-payment', 'Final Down Payment or Funds from Borrower', 'This row compares estimated and final down payment or other borrower funds used in the transaction.'],
    ['cd-deposit', 'Final Deposit', 'This row compares the estimated and final deposit already paid and subtracts it from the cash calculation.'],
    ['cd-funds-for-borrower', 'Final Funds for Borrower', 'This row compares estimated and final funds expected to be disbursed to the borrower.'],
    ['cd-seller-credits', 'Final Seller Credits', 'This row compares estimated and final seller contributions and points to the transaction summary when the amount changed.'],
    ['cd-adjustments-other-credits', 'Final Adjustments and Other Credits', 'This row compares other estimated and final additions or credits affecting the borrower’s closing amount.'],
  ]],
  ['cd-cash-total', [
    ['cash-to-close', 'Final Cash to Close', 'Final cash to close is the amount the borrower must bring to or receive from closing after the final listed components are combined.'],
  ]],
  ['le-comparison', [
    ['five-year-total-paid', 'Total Paid in Five Years', 'The five-year total is the amount scheduled to be paid in principal, interest, mortgage insurance, and loan costs during the first five years.'],
    ['five-year-principal-paid', 'Principal Paid in Five Years', 'The five-year principal figure is the portion of scheduled payments expected to reduce the loan balance during the first five years.'],
  ]],
  ['shared-cost-measure', [
    ['apr', 'Annual Percentage Rate', 'Annual percentage rate expresses the loan’s cost as a rate using the interest rate and certain charges, so it can differ from the note rate.'],
    ['tip', 'Total Interest Percentage', 'Total interest percentage is the total scheduled interest over the loan term expressed as a percentage of the loan amount.'],
  ]],
  ['shared-other-disclosure', [
    ['appraisal', 'Appraisal', 'An appraisal is an independent opinion of property value, and the disclosure explains when the lender may order one and the borrower’s right to a copy.'],
    ['refinance', 'Refinance', 'The refinance disclosure explains that future refinancing depends on the borrower’s circumstances, property value, and market conditions and is not guaranteed.'],
  ]],
  ['shared-loan-disclosure', [
    ['assumption', 'Assumption', 'Assumption describes whether a later buyer may take over the loan on its original terms if the property is sold or transferred.'],
    ['late-payment', 'Late Payment', 'The late-payment disclosure states the timing and formula for a late charge under the loan terms.'],
  ]],
  ['le-other-consideration', [
    ['homeowners-insurance-requirement', 'Homeowner’s Insurance Requirement', 'This disclosure states whether property insurance is required and explains that the borrower may obtain coverage from an acceptable insurer.'],
    ['servicing', 'Servicing', 'Servicing identifies whether the creditor expects to collect payments itself or transfer that responsibility to another servicer.'],
  ]],
  ['cd-loan-disclosure', [
    ['demand-feature', 'Demand Feature', 'A demand feature would permit the lender to require early repayment under the conditions in the loan documents.'],
    ['negative-amortization', 'Negative Amortization', 'Negative amortization occurs when scheduled payments do not cover all interest due and the unpaid interest increases the loan balance.'],
    ['partial-payments', 'Partial Payments', 'Partial payments describes whether the lender may apply, hold, or decline payments that are less than the full amount due.'],
    ['security-interest', 'Security Interest', 'The security-interest disclosure identifies the property securing repayment and warns that failure to meet loan obligations may put the property at risk.'],
  ]],
  ['le-contact', [
    ['loan-officer-contact', 'Loan Officer Contact', 'Loan officer contact identifies the individual handling the application and provides available licensing, email, and telephone information.'],
  ]],
  ['shared-lender-contact', [
    ['lender-contact', 'Lender Contact', 'Lender contact provides the creditor’s name and the available address, licensing, representative, email, and telephone details.'],
  ]],
  ['cd-contact', [
    ['mortgage-broker-contact', 'Mortgage Broker Contact', 'The Mortgage Broker column remains visible, but its detail cells are blank in this rendered sample, so no broker company or representative is provided.'],
    ['buyer-broker-contact', 'Buyer’s Real Estate Broker Contact', 'Buyer’s broker contact provides the business and representative information for the real estate broker associated with the buyer.'],
    ['seller-broker-contact', 'Seller’s Real Estate Broker Contact', 'Seller’s broker contact provides the business and representative information for the real estate broker associated with the seller.'],
    ['settlement-agent-contact', 'Settlement Agent Contact', 'Settlement agent contact provides the closing company’s business and representative information for settlement questions.'],
  ]],
  ['receipt', [
    ['confirm-receipt', 'Confirm Receipt', 'Confirm Receipt explains that signing acknowledges delivery of the form but does not require the borrower to accept the loan.'],
  ]],
  ['borrower-transaction', [
    ['cd-k-total', 'Due from Borrower at Closing', 'Section K totals the purchase price, borrower-paid closing costs, and other amounts charged to the borrower at closing.'],
    ['borrower-transaction-sale-price', 'Borrower Transaction Sale Price', 'This borrower-side debit is the contract price of the real property being purchased.'],
    ['borrower-personal-property', 'Borrower Transaction Personal Property', 'This borrower-side debit is any separately agreed price for tangible personal property included in the sale.'],
    ['borrower-closing-costs-paid-at-closing', 'Borrower Closing Costs Paid at Closing', 'This borrower-side debit carries the borrower-paid-at-closing portion of Section J into the transaction summary.'],
    ['borrower-hoa-dues', 'Borrower HOA Dues Adjustment', 'This borrower-side adjustment allocates association dues for the stated period between buyer and seller.'],
    ['cd-l-total', 'Paid Already by or on Behalf of Borrower', 'Section L totals deposits, loan proceeds, seller credits, and other amounts already paid for the borrower.'],
    ['borrower-deposit', 'Borrower Deposit', 'This borrower-side credit is the earnest-money or other purchase deposit already paid.'],
    ['borrower-transaction-loan-amount', 'Loan Amount Applied for Borrower', 'This borrower-side credit is the mortgage principal being applied toward amounts due at closing.'],
    ['borrower-existing-loans', 'Existing Loans Assumed by Borrower', 'This borrower-side credit is the balance of an existing loan the borrower assumes or takes subject to, when applicable.'],
    ['borrower-seller-credit', 'Seller Credit to Borrower', 'This borrower-side credit is an agreed contribution from the seller that reduces the borrower’s amount due.'],
    ['title-rebate', 'Title Company Rebate', 'This borrower-side other credit is a rebate from the named title company applied in the transaction summary.'],
    ['borrower-city-taxes', 'Borrower City or Town Taxes Adjustment', 'This borrower-side adjustment credits or charges taxes for the stated period that were unpaid by the seller.'],
    ['total-due-from-borrower', 'Total Due from Borrower', 'This calculation repeats the total of Section K before borrower-side credits in Section L are subtracted.'],
    ['total-paid-for-borrower', 'Total Paid for Borrower', 'This calculation repeats the Section L total that is subtracted from the amount due from the borrower.'],
    ['borrower-cash-to-close', 'Borrower Cash to Close', 'Borrower cash to close is the difference between amounts due and amounts already paid, labeled to show whether cash is from or to the borrower.'],
  ]],
  ['seller-transaction', [
    ['cd-m-total', 'Due to Seller at Closing', 'Section M totals the property price and other amounts credited to the seller at closing.'],
    ['seller-sale-price', 'Seller Transaction Sale Price', 'This seller-side credit is the contract price of the real property being transferred.'],
    ['seller-personal-property', 'Seller Transaction Personal Property', 'This seller-side credit is any separately agreed price for tangible personal property included in the sale.'],
    ['seller-hoa-dues', 'Seller HOA Dues Adjustment', 'This seller-side adjustment allocates association dues for the stated period between seller and buyer.'],
    ['cd-n-total', 'Due from Seller at Closing', 'Section N totals seller-paid closing costs, mortgage payoffs, credits, and other amounts charged to the seller.'],
    ['excess-deposit', 'Excess Deposit', 'Excess deposit is the portion of a buyer deposit exceeding the amount already accounted for that is due from the seller when applicable.'],
    ['seller-closing-costs', 'Seller Closing Costs', 'This seller-side debit carries seller-paid-at-closing costs from Section J into the transaction summary.'],
    ['first-mortgage-payoff', 'First Mortgage Payoff', 'This seller-side debit is the amount used at closing to satisfy the seller’s first mortgage lien.'],
    ['second-mortgage-payoff', 'Second Mortgage Payoff', 'This seller-side debit is the amount used at closing to satisfy a second mortgage lien when one applies.'],
    ['seller-credit-debit', 'Seller Credit Charged to Seller', 'This seller-side debit is the seller contribution that appears as a credit on the borrower’s side.'],
    ['seller-city-taxes', 'Seller City or Town Taxes Adjustment', 'This seller-side debit or credit allocates city or town taxes for the stated period.'],
    ['total-due-to-seller', 'Total Due to Seller', 'This calculation repeats the Section M total credited to the seller before seller-side charges are subtracted.'],
    ['total-due-from-seller', 'Total Due from Seller', 'This calculation repeats the Section N total subtracted from amounts due to the seller.'],
    ['cash-to-seller', 'Cash to Seller', 'Cash to seller is the difference between the seller’s credits and charges, labeled to show whether cash is from or to the seller.'],
  ]],
  ['escrow', [
    ['escrow-account', 'Escrow Account', 'An escrow account holds portions of mortgage payments so the servicer can pay listed property costs when due.'],
    ['escrowed-property-costs', 'Escrowed Property Costs', 'Escrowed property costs are the estimated first-year taxes, insurance, or other listed costs the escrow account is expected to pay.'],
    ['non-escrowed-property-costs', 'Non-Escrowed Property Costs', 'Non-escrowed property costs are estimated first-year expenses the borrower must pay directly rather than through the escrow account.'],
    ['initial-escrow-payment', 'Initial Escrow Payment', 'The initial escrow payment is the amount collected at closing to establish the account and provide its starting balance or cushion.'],
    ['monthly-escrow-payment', 'Monthly Escrow Payment', 'The monthly escrow payment is the amount included in the regular mortgage payment for escrowed property costs.'],
    ['no-escrow', 'No Escrow', 'The No Escrow area explains direct-payment responsibilities and any waiver fee when the loan will not have an escrow account.'],
    ['future-escrow-changes', 'Future Escrow Changes', 'Future escrow changes explains that property costs and escrow payments can change and describes consequences of canceling escrow or not paying property costs.'],
  ]],
  ['loan-calculation', [
    ['total-payments', 'Total of Payments', 'Total of payments is the scheduled principal, interest, mortgage insurance, and borrower-paid loan costs over the full loan term.'],
    ['finance-charge', 'Finance Charge', 'Finance charge is the dollar amount the credit is expected to cost under the Regulation Z finance-charge rules.'],
    ['amount-financed', 'Amount Financed', 'Amount financed is the loan amount available after subtracting applicable upfront finance charges, not necessarily the cash delivered to the borrower.'],
  ]],
  ['other-disclosure', [
    ['contract-details', 'Contract Details', 'Contract Details directs the borrower to the note and security instrument for default, acceleration, and early-payment rules.'],
    ['liability-after-foreclosure', 'Liability after Foreclosure', 'This disclosure describes whether state law may protect the borrower from liability for a balance remaining after foreclosure.'],
    ['tax-deductions', 'Tax Deductions', 'The tax-deduction disclosure warns that interest on debt above property value may not be federally deductible and directs the borrower to a tax advisor.'],
  ]],
  ['questions', [
    ['questions-cfpb', 'Questions and CFPB Contact', 'This area directs questions about loan terms or costs to the listed contacts and gives the CFPB mortgage-closing information and complaint resource.'],
  ]],
];

const items = groupedItems.flatMap(([group, entries]) => entries.map(entry => [...entry, group]));

export const EXPLANATIONS = Object.freeze(Object.fromEntries(items.map(([id, title, what, groupName]) => {
  const group = GROUPS[groupName];
  return [id, Object.freeze({
    id,
    title,
    body: `${what} ${group.why} ${BORROWER_GUIDANCE}`,
    source: Object.freeze({
      type: 'CFPB samples, Guide to Forms v2.1, and Regulation Z',
      reference: group.reference,
    }),
    review: Object.freeze({ status: 'pending-msfg', reviewer: '', reviewedOn: '' }),
  })];
})));
