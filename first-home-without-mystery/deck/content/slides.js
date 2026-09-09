/* ============================================================================
   SLIDE CONTENT — Your first home, without the mystery.
   Beginner workshop adapted from the supplied PowerPoint into Ridgeline.
   ============================================================================ */

export const SLIDES = [
  {
    id: 'opening', layout: 'opening', bg: 'dark', footer: true,
    eyebrow: 'Beginner workshop · Credit · Loan choice · Cash to close',
    headline: 'Your first home, without the mystery.',
    time: 120,
    notes: `Welcome everyone and set expectations: this is education, not a pop quiz. Opening line: Buying a house has more acronyms than a government group chat—but by the end, FHA, DTI, and LE will feel manageable.

Ask for a show of hands: who thinks the down payment is the entire cash-to-close number? Tell them we will fix that myth today.`,
  },
  {
    id: 'confident-number', layout: 'statement', bg: 'dark', footer: true,
    eyebrow: 'Start here',
    headline: 'Your first step is not finding a house. It is building a confident number.',
    prompts: ['Comfortable payment', 'Cash target', 'Loan option'],
    time: 75,
    notes: `Use this as the opening tension. Before browsing listings, a buyer needs three grounded numbers: a comfortable payment, a realistic cash target, and a loan option that fits.

Ask: Which of those three feels least clear today?`,
  },
  {
    id: 'three-questions', layout: 'keys', bg: 'white', footer: true,
    eyebrow: 'The clarity line',
    headline: 'Three questions.\nOne homebuying plan.',
    subhead: 'Start with credit. Find your loan.\nKnow your cash target.',
    keys: [
      { label: 'Credit', question: 'What will a lender see?', note: 'Your credit profile' },
      { label: 'Loan choice', question: 'Which loan\nfits me?', note: 'Down payment and tradeoffs' },
      { label: 'Cash to close', question: 'How much cash will I need?', note: 'Down payment, costs, and credits' },
    ],
    time: 90,
    notes: `Preview the roadmap. All three questions connect: loan type changes mortgage insurance and cash; credit can change pricing; and cash reserves can change which choice feels comfortable.

Humor line: Think of this as the homebuying version of assembling IKEA furniture—we are going to look at the instructions before discovering three leftover screws.`,
  },
  {
    id: 'credit-report', layout: 'ficoPie', bg: 'white', footer: true,
    manualBuild: true,
    eyebrow: 'Key one · Credit',
    headline: 'What makes up your FICO® Score?',
    subhead: 'Five factors. Each one adds to the picture.',
    factors: [
      { label: 'Payment history', percent: 35, detail: 'How you have paid your accounts.', color: '#14494B', side: '#0C3335', ink: '#FFFFFF' },
      { label: 'Amounts owed', percent: 30, detail: 'Balances and available credit used.', color: '#4B7B4D', side: '#345737', ink: '#FFFFFF' },
      { label: 'Length of credit history', percent: 15, detail: 'How long you have used credit.', color: '#8CC63E', side: '#628E28', ink: '#0C3335' },
      { label: 'New credit', percent: 10, detail: 'Recent accounts and applications.', color: '#B8CEC0', side: '#81998B', ink: '#0C3335' },
      { label: 'Credit mix', percent: 10, detail: 'The types of credit you have.', color: '#719D90', side: '#4B7166', ink: '#0C3335' },
    ],
    time: 135,
    notes: `Advance once for each slice: payment history 35%, amounts owed 30%, length of credit history 15%, new credit 10%, and credit mix 10%. The next advance after all five moves to the next slide. Back removes the most recent slice.

These are general FICO category weights. Their importance can vary by credit profile. A mortgage score may differ from a consumer app because different scoring models and report data can be used. Avoid promising a score requirement before reviewing the actual program and lender.

[Sources]
- https://www.myfico.com/credit-education/whats-in-your-credit-score
- https://www.consumerfinance.gov/ask-cfpb/what-is-a-credit-score-en-315/
[/Sources]`,
  },
  {
    id: 'credit-habits', layout: 'creditActions', bg: 'white', footer: true,
    manualBuild: true,
    eyebrow: 'Key one · Credit',
    headline: 'Five habits help before you apply.',
    actions: [
      { title: 'Pay every bill on time.', icon: 'calendar' },
      { title: 'Keep revolving-card balances as low as practical.', icon: 'balance' },
      { title: 'Avoid opening accounts you do not need.', icon: 'pause' },
      { title: 'Review all three credit reports for accurate information.', icon: 'reports' },
      { title: 'Call your lender before moving money or changing debt.', icon: 'conversation' },
    ],
    time: 135,
    notes: `Make this practical. Buyers can review reports through the federally authorized source, AnnualCreditReport.com. Encourage disputes only for information that is truly inaccurate and explain that updates can take time.

Humor line: The week before closing is not the time to finance a bass boat, a sectional, or—somehow—the bass boat sitting on the sectional.

[Sources]
- https://www.annualcreditreport.com/
- https://www.consumerfinance.gov/ask-cfpb/how-do-i-get-a-copy-of-my-credit-reports-en-5/
[/Sources]`,
  },
  {
    id: 'loan-programs', layout: 'grid', bg: 'white', footer: true, cols: 2,
    eyebrow: 'Key two · Loan choice',
    headline: 'Four program families cover many first-home scenarios.',
    subhead: 'Tap a program to see what makes it different.',
    compliance: 'generalGuidelines',
    cards: [
      { modal: 'prog-conventional', title: 'Conventional', meta: 'Broad property flexibility', stat: 'As low as 3%*' },
      { modal: 'prog-fha', title: 'FHA', meta: 'Flexible qualifying profile', stat: 'As low as 3.5%*' },
      { modal: 'prog-va', title: 'VA', meta: 'For eligible service members and veterans', stat: 'Often 0%*' },
      { modal: 'prog-usda', title: 'USDA', meta: 'Income- and location-dependent', stat: 'Often 0%*' },
    ],
    time: 165,
    notes: `Introduce the major program families as starting points, not promises. Exact eligibility, pricing, mortgage insurance, occupancy, and property rules vary.

For VA, eligibility generally begins with qualifying service and a Certificate of Eligibility. USDA depends on household income and property location.

[Sources]
- https://singlefamily.fanniemae.com/originating-underwriting/mortgage-products/97-loan-value-options
- https://www.hud.gov/helping-americans/loans
- https://www.va.gov/housing-assistance/home-loans/loan-types/purchase-loan/
- https://www.rd.usda.gov/programs-services/single-family-housing-programs/single-family-housing-guaranteed-loan-program
[/Sources]`,
  },
  {
    id: 'low-down-payment', layout: 'compare', bg: 'dark', footer: true, footerTheme: 'split',
    eyebrow: 'Key two · Loan choice',
    left: {
      label: 'Low down payment',
      items: [
        'Some conventional options begin at 3% for eligible borrowers.',
        'FHA may begin at 3.5% for qualifying borrowers.',
        'VA and USDA may offer no-down-payment financing when eligible.',
      ],
    },
    right: {
      label: 'Prepared buyer',
      items: [
        'Plans for closing costs and prepaid expenses.',
        'Keeps money available for inspections, moving, and repairs.',
        'Protects an emergency reserve after closing.',
      ],
    },
    callout: 'A smaller down payment can be a strategy—not a shortcut.',
    compliance: 'generalGuidelines',
    time: 90,
    notes: `Normalize low-down-payment options while stressing reserves and payment comfort. Down payment assistance may be available depending on income, location, and program; review repayment, pricing, or second-lien terms carefully.

Humor line: A 20% down payment is not a Hogwarts letter—you do not have to wait for it to arrive before asking questions.

[Sources]
- https://singlefamily.fanniemae.com/originating-underwriting/mortgage-products/97-loan-value-options
- https://www.hud.gov/helping-americans/loans
- https://www.va.gov/housing-assistance/home-loans/loan-types/purchase-loan/
- https://www.rd.usda.gov/programs-services/single-family-housing-programs/single-family-housing-guaranteed-loan-program
[/Sources]`,
  },
  {
    id: 'cash-ingredients', layout: 'ingredients', bg: 'dark', footer: true,
    eyebrow: 'Key three · Cash to close',
    headline: 'Cash to close has four main ingredients.',
    helpModal: 'cash-help',
    helpLabel: 'Would you like to learn how closing costs and prepaids may be covered by someone else?',
    ingredients: [
      { label: 'Down payment', body: 'Your equity contribution.' },
      { label: 'Closing costs', body: 'Loan and transaction charges.' },
      { label: 'Prepaids + escrows', body: 'Ownership expenses funded ahead.' },
      { label: 'Credits + deposits', body: 'Amounts that reduce what remains due.' },
    ],
    callout: 'Earnest money is credited back into the calculation when properly documented.',
    time: 120,
    notes: `Define each category. Cash to close is estimated on the Loan Estimate and reconciled on the Closing Disclosure. Earnest money is not an extra charge if it is properly credited—it is money already paid toward the transaction.

Clarify that reserves are usually funds remaining after closing when required, not another closing charge.

[Sources]
- https://www.consumerfinance.gov/owning-a-home/loan-estimate/
- https://www.consumerfinance.gov/owning-a-home/closing-disclosure/
[/Sources]`,
  },
  {
    id: 'cash-example', layout: 'cashExample', bg: 'white', footer: true,
    eyebrow: 'Key three · Cash to close',
    headline: 'A $350,000 purchase: build the estimate.',
    hasNumbers: true,
    calc: 'cashToClose',
    example: {
      purchasePrice: 350000,
      rows: [
        { label: '5% down payment', amount: 17500, tone: 'add' },
        { label: 'Closing costs · 3% assumption', amount: 10500, tone: 'add' },
        { label: 'Prepaids · 2% assumption', amount: 7000, tone: 'add' },
        { label: 'Earnest money already paid', amount: -5000, tone: 'subtract' },
      ],
      total: 30000,
    },
    time: 180,
    notes: `Walk slowly through the math and ask the room to calculate before revealing $30,000. The 3% closing-cost and 2% prepaid figures are teaching assumptions, not quotes. Seller or lender credits could reduce the number; points or other costs could increase it.

Humor line: This is the slide where the down payment realizes it was not the only guest invited.

[Sources]
- https://www.consumerfinance.gov/owning-a-home/loan-estimate/
- https://www.consumerfinance.gov/owning-a-home/closing-disclosure/
[/Sources]`,
  },
  {
    id: 'costs-vs-prepaids', layout: 'compare', bg: 'white', footer: true, footerTheme: 'split',
    eyebrow: 'Key three · Cash to close',
    left: {
      label: 'Closing costs',
      items: [
        'Origination and underwriting charges',
        'Appraisal, title, and settlement services',
        'Taxes and government recording fees',
        'Optional discount points, when chosen',
      ],
    },
    right: {
      label: 'Prepaids + escrows',
      items: [
        'Prepaid interest through the end of the month',
        'Homeowners insurance paid in advance',
        'Initial property-tax and insurance escrow deposits',
      ],
    },
    callout: 'Different buckets. Both can affect cash to close.',
    time: 120,
    notes: `Explain the difference between transaction charges and amounts collected for immediate or future ownership expenses. Points are an upfront charge paid in exchange for a lower interest rate when that option is selected.

The Loan Estimate helps compare expected terms and costs. The Closing Disclosure shows the final transaction details before closing.

[Sources]
- https://www.consumerfinance.gov/owning-a-home/loan-estimate/
- https://www.consumerfinance.gov/owning-a-home/closing-disclosure/
[/Sources]`,
  },
  {
    id: 'protect-preapproval', layout: 'markers', bg: 'mist', footer: true, tone: 'dont', cols: 1,
    manualBuild: true, sideCallout: true,
    eyebrow: 'After preapproval',
    headline: 'Protect the version of you we approved.',
    subhead: 'Before making a financial change, call your lender first.',
    items: [
      'Open new credit or co-sign for someone else.',
      'Buy or lease a vehicle.',
      'Finance furniture or appliances.',
      'Move large, unexplained deposits between accounts.',
      'Change jobs, pay off debt, or close accounts without checking first.',
    ],
    time: 120,
    notes: `Give quick examples: furniture financing, an auto purchase, cash deposits, a job change, or co-signing. None is automatically fatal, but each can change the information used to qualify the borrower and must be reviewed.

Suggested line: The lender does not hate sofas. The lender hates surprise monthly payments attached to sofas.`,
  },
  {
    id: 'document-story', layout: 'documentStory', bg: 'white', footer: true,
    eyebrow: 'Prepare',
    headline: 'Bring the documents that tell your financial story.',
    groups: [
      { label: 'Income', modal: 'docs-income', items: ['Paystubs', 'W-2s or tax returns', 'Employment history'] },
      { label: 'Assets', modal: 'docs-assets', items: ['Bank statements', 'Investment or retirement funds', 'Gift-fund details'] },
      { label: 'Identity + property', modal: 'docs-identity', items: ['Photo identification', 'Housing history', 'Purchase contract when available'] },
    ],
    callout: 'Self-employment, variable income, gifts, and assistance may require additional documentation.',
    time: 90,
    notes: `Keep this high-level so it does not become a document lecture. Mention that self-employed borrowers, variable income, gifts, and down payment assistance may require additional documentation.

Humor line: Underwriting does not ask for documents because it is building a scrapbook. Every page answers a risk question.`,
  },
  {
    id: 'five-step-plan', layout: 'stepper', bg: 'dark', footer: true, manualBuild: true,
    eyebrow: 'Your plan',
    headline: 'Your homebuying plan fits on one line.',
    steps: [
      { label: 'Review', note: 'Credit + goals', detail: 'Review your credit and talk through your goals. Start with the payment and cash target that feel comfortable for you.' },
      { label: 'Choose', note: 'Loan + budget', detail: 'Compare loan options, down payment, and the full monthly payment. Choose a program and budget that fit your situation.' },
      { label: 'Prepare', note: 'Cash + documents', detail: 'Gather your income, asset, and property documents. Confirm where your closing funds will come from and review your preapproval with your lender.' },
      { label: 'Shop', note: 'With a real range', detail: 'Use your reviewed budget and preapproval to guide your home search. Check the property costs and proposed terms with your lender before committing.' },
      { label: 'Close', note: 'Review + sign', detail: 'Review your Closing Disclosure and ask about anything that changed. Confirm closing instructions with your lender and settlement team before signing or sending funds.' },
    ],
    time: 90,
    notes: `Recap the sequence. Buyers do not need to solve everything before the first conversation. Encourage a document-supported preapproval before serious shopping, based on company practice.

Bring the room back to the three keys: credit, loan choice, and cash to close.`,
  },
  {
    id: 'wrap', layout: 'closePlan', bg: 'dark', footer: true,
    eyebrow: 'Questions',
    headline: 'Your plan is no longer a mystery.',
    questions: [
      'What payment feels comfortable?',
      'What cash target feels realistic?',
      'Which loan option should we compare first?',
    ],
    time: 120,
    notes: `Resolve the opening: the audience now knows what appears on credit, how loan types differ, and how to assemble cash to close.

Invite questions and offer a no-pressure personal planning conversation. If time is short, use the three closing questions as the takeaway.`,
  },
];

export const TARGET_RUNTIME_SECONDS = SLIDES.reduce((total, slide) => total + (slide.time || 0), 0);
