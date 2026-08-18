/* ============================================================================
   SLIDE CONTENT — Homebuyer's Playbook, realigned to the client's presentation.
   Ridgeline visual system. One green accent per slide; talking points, not
   worked numbers. `footer:true` renders the compliance footer (§6).
   ========================================================================= */

export const SLIDES = [

  /* 1 — OPENING */
  {
    id: 'opening', layout: 'opening', bg: 'dark', footer: true,
    eyebrow: "The Homebuyer's Playbook",
    headline: 'Buying your first home, explained.',
    time: 45,
    notes: 'Introduce yourself in under 20 seconds. The next 40 minutes are education, not a pitch. Two promises: I won\'t quote you a rate, and I won\'t tell you where rates are going — nobody knows.',
  },

  /* 2 — MYTHS grid */
  {
    id: 'myths', layout: 'grid', bg: 'white', footer: true, cols: 3,
    headline: 'Myths',
    subhead: 'The stories that keep good buyers renting. Tap any one.',
    cards: [
      { modal: 'myth-20-down',        title: 'You need 20% down' },
      { modal: 'myth-fha-first',      title: 'FHA is only for first-time buyers' },
      { modal: 'myth-perfect-credit', title: 'You need perfect credit' },
      { modal: 'myth-renting',        title: 'Renting is cheaper' },
      { modal: 'myth-lowest-rate',    title: 'The lowest rate is the best deal' },
    ],
    time: 120,
    notes: 'Don\'t read the cards. Ask which one they believed and open the two the room reacts to. Each opens to a quick pros/cons. In the PowerPoint these are the slides that follow.',
  },

  /* 4 — BUDGET: rent vs buy / cost of waiting */
  {
    id: 'budget-rent-buy', layout: 'compare', bg: 'dark',
    eyebrow: 'Budget',
    left:  { label: 'Renting', items: [
      'Rent in Denver has trended up, year after year',
      'Flexible — but every payment builds someone else\'s equity',
      'The longer you wait, the more expensive buying becomes.',
    ]},
    right: { label: 'Buying', items: [
      'A fixed payment while home values generally appreciate',
      'Equity builds two ways — paying down principal and appreciation',
      'Most people step up — the first home isn\'t the last',
      'You can personalize the home to fit your style and needs.',
    ]},
    callout: 'Waiting isn\'t neutral. It usually costs something.',
    time: 150,
    notes: 'Two things move at once — rent goes up, home values go up. Waiting has a price. And equity builds two ways at the same time: every payment knocks the principal down while the home appreciates. But take the pressure off: almost nobody\'s first house is their last. You\'re choosing where you START. (No specific dollar figures — talk the trend.)',
  },

  /* 5 — BUDGET: the payment (combined) */
  {
    id: 'budget-payment', layout: 'payment', bg: 'white', footer: true,
    eyebrow: 'Budget',
    headline: 'What\'s actually in the payment',
    subhead: 'On a fixed-rate loan — what\'s locked, and what can still move.',
    fixed:  ['Your interest rate', 'Your principal & interest', 'Your loan term'],
    moves:  ['Property taxes', 'Insurance premiums', 'Mortgage insurance (it can come off)', 'HOA dues', 'A special assessment'],
    points: [
      'Escrow collects a slice of taxes and insurance each month and pays them for you — not a fee, your money held early',
      'Amortization: early payments are mostly interest; it shifts to principal over years',
      'Refinancing resets the clock — a new 30-year loan starts over at the interest-heavy beginning',
    ],
    time: 210,
    notes: 'The most misunderstood thing in the business: fixed rate does NOT mean fixed payment. Rate is fixed; taxes and insurance are not. A tax increase or special assessment raises your payment — that\'s not a fee, it surprises people every year. Refinancing lowers the rate but restarts amortization.',
  },

  /* 6 — BUDGET: comfort zone */
  {
    id: 'budget-comfort', layout: 'points', bg: 'dark',
    eyebrow: 'Budget',
    headline: 'Keep the payment in your comfort zone',
    subhead: 'The number you can qualify for and the number you can live with are rarely the same.',
    points: [
      "Don't become house poor — the guidelines ask if you'll repay, not if you'll be okay",
      'Protect quality of life — leave room for disposable income and emergencies',
      'The payment can change after you close',
    ],
    time: 150,
    notes: 'A lender determines whether you\'ll repay — that\'s the only question the guidelines ask. Nobody in the transaction is asking "will you be okay." So you have to.',
  },

  /* 7 — PROGRAMS grid */
  {
    id: 'programs', layout: 'grid', bg: 'white', footer: true, cols: 2,
    headline: 'Most Common Loan Programs',
    subhead: 'Four doors, different people. Tap any program for pros and cons.',
    compliance: 'generalGuidelines',
    cards: [
      { modal: 'prog-conventional', title: 'Conventional', meta: 'The default for most buyers', stat: '3% down' },
      { modal: 'prog-usda',         title: 'USDA',         meta: 'Eligible areas, income limits', stat: '0% down' },
      { modal: 'prog-fha',          title: 'FHA',          meta: 'Built for credit flexibility', stat: '3.5% down' },
      { modal: 'prog-va',           title: 'VA',           meta: 'If you served, check this first', stat: '0% down' },
    ],
    time: 180,
    notes: 'Don\'t walk all four. Ask which they\'ve heard of and open those. Always mention VA out loud — eligible people routinely don\'t know they qualify. Each card opens to pros/cons; those are the in-between slides in the PowerPoint.',
  },

  /* 8 — CASH TO CLOSE: sources */
  {
    id: 'cash-sources', layout: 'grid', bg: 'dark', footer: true, cols: 3,
    headline: 'Cash to close: where it comes from',
    subhead: 'It doesn\'t all have to sit in one account. Tap any source for the rules.',
    cards: [
      { modal: 'src-savings',    title: 'Checking & Savings' },
      { modal: 'src-investments',title: 'Investment Accounts' },
      { modal: 'src-retirement', title: 'Retirement Accounts' },
      { modal: 'src-gift',       title: 'Gift Funds' },
      { modal: 'src-seller',     title: 'Seller Credits' },
      { modal: 'src-buydown',    title: '2-1 Buydowns' },
      { modal: 'src-assistance', title: 'Down Payment Assistance' },
    ],
    time: 210,
    notes: 'Most buyers count only their checking account and stop there. Brokerage and retirement money counts too — people forget to mention it. Each source has real rules — seasoning, gift letters, concession caps, proof you actually liquidated. Assistance deserves a candid word: it helps some buyers, but it complicates the file and can weaken the offer.',
  },

  /* 9 — CASH TO CLOSE: makeup */
  {
    id: 'cash-makeup', layout: 'cashmakeup', bg: 'white', footer: true, hasNumbers: true,
    eyebrow: 'Cash to close',
    headline: 'Closing costs are not cash to close',
    subhead: 'Closing costs are the fees to set up the loan. Cash to close is the total amount you bring to closing — and it\'s the bigger number.',
    canPay:    ['Allowable closing costs', 'Prepaid items', 'Escrow deposits', 'Points to lower the rate'],
    cannotPay: ['Your down payment', 'More than your actual costs', 'Cash back to you'],
    points: [
      'You can use points to buy down the rate — or credits to cover closing costs',
      'Prepaids (first insurance, some taxes) are your own money paid early, not a fee',
      'Reserves are funds you keep after closing — some programs require them',
    ],
    time: 150,
    notes: 'Two lines on the Loan Estimate get confused. Closing costs are the fees charged to set up the loan. Cash to close is the total amount you have to bring — down payment, closing costs, prepaids, escrows, reserves — minus any credits. It\'s the bigger number, it\'s on page one, and it decides whether you get to the table.',
  },

  /* 10 — PROCESS: meet the players */
  {
    id: 'process-players', layout: 'grid', bg: 'white', footer: true, cols: 4, dense: true,
    headline: 'Meet the players',
    subhead: 'Eight people — and they don\'t all work for you. Tap anyone.',
    cards: [
      { modal: 'role-lender',     title: 'Lender' },
      { modal: 'role-realtor',    title: 'Realtor' },
      { modal: 'role-seller',     title: 'Seller' },
      { modal: 'role-processor',  title: 'Processor' },
      { modal: 'role-underwriter',title: 'Underwriter' },
      { modal: 'role-title',      title: 'Title' },
      { modal: 'role-closer',     title: 'Closer' },
      { modal: 'role-insurance',  title: 'Insurance' },
    ],
    time: 180,
    notes: 'The most useful question in the process is four words: who pays you, and how? Ask everybody. Each card explains what that person actually does.',
  },

  /* 11 — PROCESS: the steps */
  {
    id: 'process-steps', layout: 'stepper', bg: 'dark', footer: true,
    eyebrow: 'The process',
    headline: 'From first call to keys',
    steps: [
      { label: 'Pre-Approval',         note: '1–2 days' },
      { label: 'Application',          note: 'Same day' },
      { label: 'Processing',           note: '1–2 weeks' },
      { label: 'Underwriting',         note: 'Days–1 week' },
      { label: 'Conditional Approval', note: 'A few days' },
      { label: 'Clear to Close',       note: 'Days before' },
      { label: 'Closed',               note: 'About an hour' },
      { label: 'Funded',               note: 'Same / next day' },
    ],
    time: 180,
    notes: 'Print this, put it on the fridge. Most of the anxiety is not knowing which step you\'re on. The hardest stretch is underwriting — the one that looks exactly like nothing happening. Match these names to the ones on our website.',
  },

  /* 12 — MISTAKES: Don't */
  {
    id: 'mistakes-donts', layout: 'markers', bg: 'white', footer: true, tone: 'dont', cols: 2,
    eyebrow: 'Mistakes to avoid',
    headline: "Don't",
    subhead: 'From application to closing, your financial life is a museum exhibit — look, don\'t touch.',
    items: [
      'Apply for or take out any new loans',
      'Pay off collections or debt unless your lender says to',
      'Consolidate debt or close credit cards',
      'Dispute items on your credit report',
      'Make large deposits other than payroll — no cash',
      'Make large purchases with credit or debit',
      'Move money between accounts',
      'Change jobs without talking to your loan officer',
      'Quit or give notice before your loan closes',
      'Use cash for earnest money — check or wire only',
    ],
    time: 120,
    notes: 'One rule covers all of them: from application to keys, look but don\'t touch. The two that surprise people — don\'t pay off collections without asking, and don\'t dispute anything on your credit report. Both feel like cleaning up; both can stall closing. If something must change, call your loan officer FIRST.',
  },

  /* 13 — MISTAKES: Do */
  {
    id: 'mistakes-dos', layout: 'markers', bg: 'mist', footer: true, tone: 'do', cols: 1,
    eyebrow: 'Mistakes to avoid',
    headline: 'Do',
    subhead: 'The short list that keeps a file moving.',
    items: [
      'Make all your payments on time',
      'Tell your lender if you haven\'t filed last year\'s taxes, or owe on them',
      'Tell your lender if anything about your job is changing',
      'Keep homeowners insurance at or under the Loan Estimate amount',
      'Return everything your lender asks for quickly',
    ],
    time: 90,
    notes: 'Five, and the last does the most work. The biggest predictor of a smooth closing isn\'t your score or your down payment — it\'s how fast you send documents back. Same-day beats perfect.',
  },

  /* 14 — MISTAKES: lowest rate */
  {
    id: 'mistakes-rate', layout: 'points', bg: 'dark',
    eyebrow: 'Mistakes to avoid',
    headline: 'Don\'t assume the lowest rate wins',
    points: [
      'Breakeven: a rate bought with points only pays off if you keep the loan long enough',
      'Points are a bet on how long you keep this exact loan — not this house',
      'Refinancing ends the loan early and could restart amortization',
      'Real wealth comes from building equity — payments and time',
    ],
    callout: 'Equity is built by payments and time — not the third decimal of your rate.',
    time: 120,
    notes: 'The mistake isn\'t paying points — sometimes that\'s right. The mistake is paying them without asking the one question that decides it: how long will I keep THIS loan? Most first-timers badly overestimate it. "I don\'t know" is itself an argument against paying.',
  },

  /* 15 — MISTAKES: small assumptions */
  {
    id: 'mistakes-assumptions', layout: 'grid', bg: 'white', footer: true, cols: 3, cardVariant: 'quote',
    eyebrow: 'Mistakes to avoid',
    headline: 'The most expensive mistakes start as small assumptions',
    subhead: 'Tap any one for what actually happens.',
    cards: [
      { modal: 'assume-preapproval',   title: '“I’ll get pre-approved once I find a house.”' },
      { modal: 'assume-my-bank',       title: '“I’ll just use my bank.”' },
      { modal: 'assume-closing-costs', title: '“Closing costs are what I need at closing.”' },
      { modal: 'assume-approved',      title: '“I’m approved, so I’m done.”' },
      { modal: 'assume-wait-20',       title: '“I’ll wait until I have twenty percent.”' },
      { modal: 'assume-builder',       title: '“The builder’s incentive is free money.”' },
    ],
    time: 150,
    notes: 'None of these feel like mistakes when you make them — that\'s what makes them expensive. The one underneath all six: not asking a question because you\'re afraid of looking like you don\'t know. You\'ve done this zero times. You are allowed to not know this.',
  },

  /* 16 — QUESTIONS */
  {
    id: 'questions', layout: 'questions', bg: 'dark', footer: true,
    eyebrow: 'Questions',
    headline: 'The questions everyone asks',
    items: [
      { q: 'How much money do I actually need?', a: 'Less than most think — 3% conventional, 3.5% FHA, 0% VA/USDA — plus closing costs and an emergency fund you don\'t touch.' },
      { q: 'What credit score do I need?', a: 'No single number. It depends on the program, and you\'re probably closer than you think. It\'s a five-minute question.' },
      { q: 'How long does it take?', a: 'Contract to keys is typically 30–45 days. The biggest variable is how fast you return documents.' },
      { q: 'Should I lock my rate?', a: 'Generally once you\'re under contract. A lock holds your rate while the loan is in process — ask how long it lasts and what happens if closing runs past it.' },
      { q: 'What happens after pre-approval?', a: 'You shop with a real budget, make an offer, and it becomes a formal application — Loan Estimate within three business days.' },
    ],
    time: 180,
    notes: 'Open the floor. The questions people ask out loud are better than the ones I pre-wrote.',
  },

  /* 17 — WRAP */
  {
    id: 'wrap', layout: 'wrap', bg: 'dark', footer: true,
    headline: 'Let\'s build your plan.',
    time: 90,
    notes: 'Say the phone number and email out loud. Leave this up during Q&A — it\'s the only way replay viewers reach you.',
  },
];

export const TARGET_RUNTIME_SECONDS = SLIDES.reduce((a, s) => a + (s.time || 0), 0);
