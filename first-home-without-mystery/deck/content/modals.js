/* ============================================================================
   LOAN PROGRAM POPOUTS — beginner-level distinctions, not qualification quotes.
   ============================================================================ */

import { DOCUMENT_MODALS } from './document-details.js';

export const MODALS = {
  ...DOCUMENT_MODALS,
  'cash-help': {
    title: 'Ways to reduce cash to close',
    compliance: ['generalGuidelines'],
    tabs: [
      {
        label: 'Seller concessions',
        intro: 'A negotiated seller credit can help pay eligible buyer expenses at closing.',
        sections: [
          { head: 'What they can cover', tone: 'pros', items: [
            'Eligible closing costs, such as lender, title, and settlement fees',
            'Allowable prepaids and escrow funding',
            'Approved discount points or rate buydowns, within program limits',
          ] },
          { head: 'What they cannot replace', items: [
            'Your required down payment or minimum borrower contribution',
            'Required financial reserves under conventional Fannie Mae rules',
            'Unused credit is not extra spending cash for the buyer',
          ] },
        ],
        note: 'The seller must agree. Limits and eligible expenses depend on the loan program, occupancy, and down payment. Have your lender review the credit before writing the offer.',
        sources: [{ label: 'Fannie Mae: seller contributions', url: 'https://selling-guide.fanniemae.com/sel/b3-4.1-02/interested-party-contributions-ipcs' }],
      },
      {
        label: 'Down payment assistance',
        intro: 'Assistance may be a grant or a second loan. The repayment terms matter.',
        sections: [
          { head: 'Pros', tone: 'pros', items: [
            'Can reduce the savings needed for an eligible down payment or closing costs',
            'May let you keep more savings available after closing',
            'Some options are grants; others defer repayment or offer conditional forgiveness',
          ] },
          { head: 'Cons and tradeoffs', items: [
            'A second loan may need repayment when you sell, refinance, or move out',
            'Income, property, education, and participating-lender requirements may apply',
            'Compare the rate, fees, payment, and total cost with and without assistance',
          ] },
        ],
        note: 'Ask: Is it a grant or a loan? When is repayment due? What must I do to qualify for any forgiveness? Assistance is not automatically free money.',
        sources: [
          { label: 'CFPB: special loan programs', url: 'https://www.consumerfinance.gov/owning-a-home/special-loan-programs/' },
          { label: 'CHFA: assistance options', url: 'https://www.chfainfo.com/homeownership' },
          { label: 'Freddie Mac: Affordable Seconds', url: 'https://guide.freddiemac.com/app/servicing/section/4204.2' },
        ],
      },
      {
        label: 'Gift funds',
        intro: 'A gift must be a genuine gift, with no expectation of repayment.',
        sections: [
          { head: 'Who and what can qualify', tone: 'pros', items: [
            'Use a donor allowed by your loan program, such as an eligible family member',
            'Gifts may help with a down payment and closing costs when permitted',
            'Reserve eligibility and any required personal contribution vary by program and property',
          ] },
          { head: 'Document it before closing', items: [
            'Provide a signed gift letter identifying the donor, amount, and no-repayment terms',
            'Provide lender-required evidence of the funds and their transfer',
            'Ask your lender before moving funds; an undocumented deposit can delay approval',
          ] },
        ],
        note: 'Donor eligibility differs by program. A repayable family loan is not a gift. Seller credits and gifts of equity have separate rules.',
        sources: [
          { label: 'Fannie Mae: personal gifts', url: 'https://guide-selling.fanniemae.com/sel/b3-4.3-04/personal-gifts' },
          { label: 'CFPB: down payment sources', url: 'https://www.consumerfinance.gov/ask-cfpb/where-can-i-get-money-for-a-down-payment-on-a-home-en-123/' },
        ],
      },
    ],
  },
  'prog-conventional': {
    eyebrow: 'Loan program',
    purchaseShare: true,
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
    purchaseShare: true,
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
    purchaseShare: true,
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
    purchaseShare: true,
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
