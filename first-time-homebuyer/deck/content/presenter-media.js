const items = [
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
