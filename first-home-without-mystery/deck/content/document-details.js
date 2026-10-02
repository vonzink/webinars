/* Educational checklists. The lender confirms the exact documents and periods. */
const income = { label: 'Fannie Mae: income documentation', url: 'https://selling-guide.fanniemae.com/sel/b3-3.2-01/standards-employment-and-income-documentation' };
const assets = { label: 'Fannie Mae: asset documentation', url: 'https://selling-guide.fanniemae.com/sel/b3-4.2-01/verification-deposits-and-assets' };
const requests = { label: 'CFPB: document requests', url: 'https://www.consumerfinance.gov/owning-a-home/close/submit-documents-and-answer-requests-from-the-lender/' };
const gift = { label: 'Fannie Mae: personal gifts', url: 'https://guide-selling.fanniemae.com/sel/b3-4.3-04/personal-gifts' };
const contract = { label: 'Fannie Mae: purchase contract', url: 'https://selling-guide.fanniemae.com/sel/b4-1.1-05/disclosure-information-appraisers' };
const tab = (label, intro, include, prepare, note, sources) => ({
  label, intro, sections: [
    { head: 'What to include', tone: 'pros', items: include },
    { head: 'Before you send it', items: prepare },
  ], note, sources,
});
const popup = (title, tabs) => ({title, tabs, compliance:['generalGuidelines']});
export const DOCUMENT_MODALS = {
  'docs-income': popup('Income documents', [
    tab('Paystubs', 'Show who pays you, what you earn, and when you earned it.', [
      'Your name, employer, pay date, and the pay-period dates',
      'Gross pay, deductions, and year-to-date earnings',
      'Hours and pay rate when shown; bonus or overtime earnings if applicable',
    ], [
      'Send a complete, readable payroll document with all edges visible',
      'Use the recent pay periods requested by your lender',
      'Tell your lender about a recent pay change or missing year-to-date information',
    ], 'Your lender will confirm how many paystubs are needed. A deposit in your bank account does not replace a paystub.', [income]),
    tab('W-2s or tax returns', 'Provide the tax documents that match the income you are using to qualify.', [
      'W-2s: employee and employer identification, tax year, and wage information',
      'Tax returns when requested: the complete filed return and applicable schedules',
      'Business returns, K-1s, or other supporting forms if your lender requests them',
    ], [
      'Confirm the required tax years; do not assume everyone needs two years of returns',
      'Include all requested pages, not only the first page or an e-file acceptance notice',
      'Tell your lender about extensions or amended returns; sign or authorize transcripts as requested',
    ], 'W-2s and tax returns are not interchangeable. Self-employment, rental income, and other income types can need different documentation.', [income, requests]),
    tab('Employment history', 'Give your lender a clear timeline and a way to verify your employment.', [
      'Employer names, contact information, job titles, and start/end dates for the requested period',
      'Your current employment and any additional jobs used to qualify',
      'Details of gaps, job changes, or a change in how you are paid',
    ], [
      'Provide HR or payroll contact information when requested',
      'Keep offer letters or contracts available if the lender requests them',
      'Notify your lender before a job change during the loan process',
    ], 'The lender handles employment verification. Your employment history does not automatically require two years with the same employer.', [income, requests]),
  ]),
  'docs-assets': popup('Asset documents', [
    tab('Bank statements', 'Document the funds you plan to use for closing.', [
      'Institution name, account-holder name, and at least the last four account digits',
      'Statement dates, ending balance, and deposit and withdrawal activity',
      'Complete statements for the period your lender requests',
    ], [
      'Download the statement PDF; a balance screenshot may omit required information',
      'Keep records that explain large deposits and transfers between accounts',
      'Ask before redacting or omitting information',
    ], 'Your lender may offer secure electronic asset verification instead. Confirm what is needed for your loan.', [assets, requests]),
    tab('Investment / retirement', 'Show ownership, value, and access to the funds.', [
      'Recent statements identifying the institution, owner, account, and balance',
      'Investment holdings and purchase/sale activity, when applicable',
      'For retirement funds: vested amount and withdrawal or loan terms',
    ], [
      'Provide liquidation or transfer evidence if the lender requires it',
      'Ask about taxes, penalties, and timing before taking money out',
      'Do not assume the entire displayed balance is available for closing',
    ], 'Funds used for closing and funds used as reserves may have different documentation requirements.', [assets]),
    tab('Gift-fund details', 'Document a permitted gift and how it reaches the transaction.', [
      'A signed gift letter with the amount, donor information, relationship, and no-repayment statement',
      'Evidence of the donor’s funds and transfer, as required by the lender',
      'The receiving-account or closing-agent record for the transfer',
    ], [
      'Confirm that the donor is acceptable for your loan program',
      'Ask for the lender’s gift-letter form before moving the money',
      'Keep the transfer trail; disclose any expectation of repayment',
    ], 'A repayable family loan is not a gift. Your lender must approve the donor and documentation.', [gift]),
  ]),
  'docs-identity': popup('Identity + property documents', [
    tab('Photo identification', 'Provide the identification your lender and closing agent accept.', [
      'A clear copy of accepted government-issued photo ID, such as a driver’s license or passport',
      'Readable name, photograph, identifying information, and expiration date',
      'Both sides when requested for a two-sided ID',
    ], [
      'Avoid glare, cropped edges, or unreadable images',
      'Flag expired identification or a name difference on your application',
      'Use the lender’s secure upload method and confirm what to bring to closing',
    ], 'Accepted identification and any additional verification depend on the lender and closing requirements.', [requests]),
    tab('Housing history', 'Provide the address and payment history your lender requests.', [
      'Current and previous addresses and move-in/move-out dates for the requested period',
      'Whether you rent, own, or live without a housing payment',
      'Landlord or mortgage-servicer details and payment amount, when requested',
    ], [
      'Keep your lease or mortgage statements available',
      'Provide payment records if the lender asks for them',
      'Explain gaps or an address difference on other documents',
    ], 'Not every borrower needs the same rental-payment verification. Follow your lender’s document request.', [requests]),
    tab('Purchase contract', 'Once you are under contract, provide the complete signed agreement.', [
      'All pages of the agreement signed by the required parties',
      'Property address, price, earnest money, financing terms, and closing date',
      'All addenda, counteroffers, amendments, and agreed seller credits',
    ], [
      'Ask your agent to send the complete executed contract',
      'Send subsequent changes promptly, including price or credit changes',
      'Keep the earnest-money receipt and proof of payment available',
    ], 'You can discuss preapproval before selecting a home. Provide the contract when available so your lender can review the transaction.', [contract]),
  ]),
};
