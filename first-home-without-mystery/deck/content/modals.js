/* ============================================================================
   LOAN PROGRAM POPOUTS — beginner-level distinctions, not qualification quotes.
   ============================================================================ */

export const MODALS = {
  'prog-conventional': {
    eyebrow: 'Loan program',
    title: 'Conventional',
    compliance: ['generalGuidelines'],
    sections: [
      { head: 'Why buyers consider it', items: [
        'Eligible first-time buyers may have options beginning at 3% down',
        'Broad property and occupancy flexibility across conventional products',
      ] },
      { head: 'Tradeoffs to compare', items: [
        'Pricing and mortgage insurance depend on the full borrower profile',
        'Eligibility and education requirements vary by product',
      ] },
    ],
  },
  'prog-fha': {
    eyebrow: 'Loan program',
    title: 'FHA',
    compliance: ['generalGuidelines'],
    sections: [
      { head: 'Why buyers consider it', items: [
        'Down payment can be as low as 3.5% for qualifying borrowers',
        'Often considered when a borrower needs more flexible qualifying',
      ] },
      { head: 'Tradeoffs to compare', items: [
        'Upfront and annual mortgage insurance apply',
        'Property and occupancy requirements still matter',
      ] },
    ],
  },
  'prog-va': {
    eyebrow: 'Loan program',
    title: 'VA',
    compliance: ['generalGuidelines'],
    sections: [
      { head: 'Why buyers consider it', items: [
        'Eligible borrowers may buy with no down payment when program requirements are met',
        'No monthly private mortgage insurance',
      ] },
      { head: 'Tradeoffs to compare', items: [
        'Certificate of Eligibility, occupancy, credit, and income requirements apply',
        'A funding fee may apply unless the borrower is exempt',
      ] },
    ],
  },
  'prog-usda': {
    eyebrow: 'Loan program',
    title: 'USDA',
    compliance: ['generalGuidelines'],
    sections: [
      { head: 'Why buyers consider it', items: [
        'Qualified buyers in eligible rural areas may receive 100% financing',
        'Designed for qualifying low- and moderate-income households',
      ] },
      { head: 'Tradeoffs to compare', items: [
        'Household income and property-location limits apply',
        'The property must be the borrower’s primary residence',
      ] },
    ],
  },
};

export const MODAL_COUNT = Object.keys(MODALS).length;
