const items = [
  {
    id: 'worksheet', slideId: 'prepaid', title: 'Itemized fee worksheet',
    src: './assets/john-doe-worksheet.png',
    alt: 'Example itemized fee worksheet for a sample borrower (John Doe): origination charges, services, prepaids, and total estimated funds needed to close.',
  },
  {
    id: 'fha-buyers', slideId: 'myths', title: 'FHA Buyers',
    src: './assets/presenter/slide-02/fha-buyers.png',
    alt: 'Chart showing the percentage of FHA purchase loans made to first-time homebuyers.',
  },
  {
    id: 'down-payment-ranges', slideId: 'myths', title: 'Down Payment Ranges',
    src: './assets/presenter/slide-02/down-payment-ranges.png',
    alt: 'Pie chart showing down payment ranges among first-time homebuyers.',
  },
  {
    id: 'credit-score', slideId: 'myths', title: 'Credit Scores',
    src: './assets/presenter/slide-02/credit-score.png',
    alt: 'Bar chart comparing borrower credit score ranges across conventional, FHA, and VA loans.',
  },
  {
    id: 'rent-vs-buy', slideId: 'myths', title: 'Rent vs. Buy',
    src: './assets/presenter/slide-02/rent-vs-buy.png',
    alt: 'Colorado ten-year comparison of cumulative renting costs and homeowner equity.',
  },
  {
    id: 'lowest-rate', slideId: 'myths', title: 'The Lowest Rate',
    src: './assets/presenter/slide-02/lowest-rate.png',
    alt: 'Loan comparison showing how lower rates can require higher upfront costs.',
  },
  {
    id: 'denver-rent-trends', slideId: 'budget-rent-buy', title: 'Denver Rent Trends',
    src: './assets/presenter/slide-03/denver-rent-trends.png',
    alt: 'Line chart comparing Denver and United States average asking rent trends through July 2026.',
  },
  {
    id: 'renting-vs-buying-wealth', slideId: 'budget-rent-buy', title: 'Renting vs. Buying Wealth',
    src: './assets/presenter/slide-03/renting-vs-buying-wealth.png',
    alt: 'Colorado ten-year comparison of cumulative rent payments, homeowner cash paid, and homeowner equity.',
  },
  {
    id: 'denver-loan-mix', slideId: 'programs', title: 'What Denver Metro Buyers Use',
    src: './assets/presenter/slide-06/denver-loan-mix.svg',
    alt: '2024 HMDA purchase-loan shares for the Denver metro area: Conventional 71.6%, FHA 18.6%, VA 8.9%, USDA 0.9%.',
  },
  {
    id: 'moving-money', slideId: 'cash-sources', title: 'Moving Money During Your Loan',
    src: './assets/presenter/slide-07/moving-money-dos-donts.svg',
    alt: 'Do and Don\'t guide for moving money during a mortgage: keep every statement, season funds 60+ days, source large deposits, get a gift letter, and move money before applying; never make undocumented cash deposits, shuffle money between accounts, use unsourced funds, deposit a gift without a letter, or empty a disclosed account.',
  },
  {
    id: 'process-calendar', slideId: 'process-steps', title: 'A Sample 30–45 Day Timeline',
    src: './assets/presenter/slide-10/process-calendar.svg',
    alt: 'A sample purchase timeline: Day 0 apply and sign disclosures, Days 1-3 Loan Estimate, Week 1 documents to processor and appraisal ordered, Week 2 appraisal received, Week 3 underwriting and conditions, Week 4 Closing Disclosure issued, then closing day sign and fund. The Closing Disclosure must be acknowledged at least three business days before signing.',
  },
  {
    id: 'budget-smart', slideId: 'budget-comfort', title: 'Budget Smart',
    src: './assets/presenter/slide-05/budget-smart.png',
    alt: 'Budget comparison between a comfortable housing payment and maximum mortgage qualification.',
  },
  {
    id: 'debt-to-income', slideId: 'budget-comfort', title: 'Debt-to-Income (DTI)',
    src: './assets/presenter/slide-05/debt-to-income.png',
    alt: 'Guide showing how a mortgage debt-to-income ratio is calculated and which obligations count.',
  },
];

export const PRESENTER_MEDIA = Object.freeze(items.map(item => Object.freeze(item)));
const byId = new Map(PRESENTER_MEDIA.map(item => [item.id, item]));
export const mediaForSlide = slideId => PRESENTER_MEDIA.filter(item => item.slideId === slideId);
export const mediaById = id => byId.get(id) || null;
