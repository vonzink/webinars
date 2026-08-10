/* ============================================================================
   SLIDE CONTENT — 22 main slides.

   (The spec's count table says "23 main" but its own rows sum to 22, and
   PART 1's change table says "~22 main slides." 22 is correct.)

   Every slide teaches ONE concept. That is the governing rule and it outranks
   every layout preference. The `concept` field is not decoration — if you
   can't state it in one line, the slide is two slides.

   hasNumbers: true automatically attaches the hypothetical-illustration
   disclaimer. Nobody types it per-slide, so nobody can forget it.
   ========================================================================= */

export const SLIDES = [

  /* ======================================================================
     OPENING
     ==================================================================== */
  {
    id: 'opening',
    section: 'Opening',
    layout: 'opening',
    concept: 'Who is speaking, and how to reach them.',
    time: 45,
    noFooterRule: false,
    notes: `Introduce yourself in under 20 seconds. Name, role, and that the next 40 minutes are education, not a sales pitch.

Two promises: "I won't quote you a rate, and I won't tell you where rates are going — nobody knows."`,
  },

  /* ======================================================================
     SECTION — BUYING MYTHS
     ==================================================================== */
  {
    id: 'sec-myths',
    section: 'Buying Myths',
    layout: 'section',
    title: 'Buying Myths',
    time: 10,
    notes: 'Section break. Keep it moving — this is a breath, not a beat.',
  },

  {
    id: 'myth-1',
    section: 'Buying Myths',
    layout: 'cards',
    concept: "Most of what you've been told about buying is outdated.",
    headline: 'What everybody told you',
    subhead: 'Click any one.',
    cols: 3,
    time: 90,
    cards: [
      { modal: 'myth-20-down',          title: 'You need 20% down' },
      { modal: 'myth-fha-first-time',   title: 'FHA is only for first-time buyers' },
      { modal: 'myth-perfect-credit',   title: 'You need perfect credit' },
      { modal: 'myth-renting-cheaper',  title: 'Renting is always cheaper' },
      { modal: 'myth-lowest-rate',      title: 'Always choose the lowest interest rate' },
    ],
    notes: `Don't read the cards — the audience can read.

Ask which one they believed. Open the two the room reacts to. You do not have to open all five.`,
  },

  {
    id: 'myth-2',
    section: 'Buying Myths',
    layout: 'breakeven',
    concept: 'The cheapest rate is often not the cheapest loan.',
    headline: 'Lowest rate ≠ lowest cost',
    subhead: "They're different questions.",
    hasNumbers: true,
    time: 180,
    loans: [
      { name: 'Loan A', rate: '6.750%', points: 'none',       payment: 'higher', emphasis: false },
      { name: 'Loan B', rate: '6.250%', points: '2.00 points', payment: 'lower',  emphasis: true  },
    ],
    chips: [
      { modal: 'chip-interest-rate',   title: 'Interest Rate' },
      { modal: 'chip-apr',             title: 'APR' },
      { modal: 'chip-closing-costs',   title: 'Closing Costs' },
      { modal: 'chip-lender-credits',  title: 'Lender Credits' },
      { modal: 'chip-discount-points', title: 'Discount Points' },
      { modal: 'chip-breakeven',       title: 'Breakeven' },
    ],
    notes: `"Which one's better? …Almost everyone says B — lower rate, lower payment, both things you've been trained to shop for. And B might be right. But you can't tell yet, because nobody's told you the one thing that decides it."

(reveal the diagram)

"B's lower rate was BOUGHT. Two points, paid in cash at closing. Roughly five years to earn it back. Keep the loan longer and B wins. Sell or refinance sooner and you lit that money on fire for a better-looking number on a piece of paper."

"And it's the LOAN, not the house — refinancing ends the loan even if you never move. Most first-time buyers badly overestimate how long they'll keep one."

⚑ PAUSE after the cards. Take the room's answer before revealing.`,
  },

  /* ======================================================================
     SECTION — BUDGET
     ==================================================================== */
  {
    id: 'sec-budget',
    section: 'Budget',
    layout: 'section',
    title: 'Budget',
    time: 10,
    notes: 'Section break.',
  },

  {
    id: 'budget-1',
    section: 'Budget',
    layout: 'figure-bullets',
    concept: 'Waiting usually makes ownership more expensive, but buying is a stepping stone — not a forever decision.',
    headline: "Renting isn't wrong. Waiting is expensive.",
    figure: 'rentVsFixed',
    ratio: '3-2',
    hasNumbers: true,
    extraCompliance: ['notAForecast'],
    source: 'Source + year — VERIFY ON THE DATE OF DELIVERY. See research/.',
    time: 150,
    bullets: [
      'Rent has generally trended upward over time',
      'Home values generally appreciate over long periods',
      "Equity compounds — rent doesn't",
      'Most people buy a <strong>starter home</strong>, not a forever home',
      'Buying is a <strong>stepping stone</strong>, not a life sentence',
    ],
    notes: `"Two things move at once. Rent tends to go up, and home values tend to go up over time. Which means waiting isn't neutral — it usually costs something.

But I want to take the pressure off the other side too: ALMOST NOBODY'S FIRST HOUSE IS THEIR LAST HOUSE. You are not choosing where you'll die. You're choosing where you start."

⚠️ Say out loud that the flat line is principal and interest ONLY — taxes, insurance, and HOA still move. Do not imply the total payment is fixed.

⚑ The rent and appreciation figures must be verified before delivery, not estimated.`,
  },

  {
    id: 'budget-2',
    section: 'Budget',
    layout: 'stack-compare',
    concept: "What's in the payment, and which parts can change.",
    headline: "What you're actually paying",
    figure: 'paymentStack',
    time: 180,
    compare: {
      yes: {
        head: 'What cannot change',
        items: [
          'Your interest rate <small>on a fixed-rate loan</small>',
          'Your principal &amp; interest payment',
          'Your loan term',
        ],
      },
      no: {
        head: 'What can',
        items: [
          'Property taxes',
          'Insurance premiums',
          'Mortgage insurance <small>it can come off</small>',
          'HOA dues',
          'Special assessments',
        ],
      },
    },
    chips: [
      { modal: 'escrow',       title: 'Escrow' },
      { modal: 'amortization', title: 'Amortization' },
    ],
    notes: `"The single most misunderstood thing in this business: FIXED RATE DOES NOT MEAN FIXED PAYMENT.

Your rate is fixed. Your taxes and insurance are not, and your lender collects those monthly and pays them for you. When they go up, your payment goes up.

That's not a fee and nobody's taking advantage of you — but it surprises people every single year."`,
  },

  {
    id: 'budget-3',
    section: 'Budget',
    layout: 'figure-bullets',
    concept: "Don't become house poor.",
    headline: 'The house is not the whole life',
    subhead: 'Where the money actually goes.',
    figure: 'budgetWaterfall',
    ratio: '1-1',
    time: 150,
    bullets: [
      'Avoid becoming house poor',
      'Quality of life is part of the math',
      "Leave room for emergencies — the furnace doesn't schedule itself",
      'Payments can increase after you close',
    ],
    bulletCard: {
      modal: 'builder-negative-equity',
      text: '<strong>Builder incentives can sometimes create negative equity</strong>',
    },
    notes: `"A lender's job is to determine whether you'll repay. That's the only question the guidelines ask.

It is NOT 'will you be okay.' Nobody in your transaction is asking that one — so you have to.

The number you can technically qualify for and the number you can comfortably live with are usually not the same number, and the gap between them is bigger than most people expect."`,
  },

  /* ======================================================================
     SECTION — MOST COMMON LOAN PROGRAMS
     ==================================================================== */
  {
    id: 'sec-programs',
    section: 'Most Common Loan Programs',
    layout: 'section',
    title: 'Most Common Loan Programs',
    time: 10,
    notes: 'Section break.',
  },

  {
    id: 'programs-1',
    section: 'Most Common Loan Programs',
    layout: 'cards',
    concept: 'There is more than one door, and they fit different people.',
    headline: 'Five doors. Different people.',
    subhead: 'Click any program.',
    cols: 3,
    time: 180,
    cards: [
      { modal: 'prog-conventional', title: 'Conventional', meta: 'The default for most buyers',   stat: '3% down' },
      { modal: 'prog-fha',          title: 'FHA',          meta: 'Built for credit flexibility',  stat: '3.5% down' },
      { modal: 'prog-va',           title: 'VA',           meta: 'If you served — check this first', stat: '0% down' },
      { modal: 'prog-usda',         title: 'USDA',         meta: 'Eligible areas, income limits', stat: '0% down' },
      { modal: 'prog-jumbo',        title: 'Jumbo',        meta: 'Above conforming loan limits',  stat: 'Varies' },
    ],
    notes: `Don't walk all five. Ask the room which they've heard of, and open those.

⭐ ALWAYS MENTION VA OUT LOUD even if nobody asks — eligible people routinely don't know they're eligible, and it's the single most valuable thing you can say.`,
  },

  {
    id: 'programs-2',
    section: 'Most Common Loan Programs',
    layout: 'cards-figure',
    concept: "The money doesn't all have to be yours.",
    headline: "It doesn't all have to come from savings",
    subhead: 'Six sources. Click any one.',
    figure: 'tributaries',
    cols: 3,
    time: 210,
    cards: [
      { modal: 'src-savings',        title: 'Savings',                icon: '🏦' },
      { modal: 'src-gift-funds',     title: 'Gift Funds',             icon: '🎁' },
      { modal: 'src-seller-credits', title: 'Seller Credits',         icon: '🤝' },
      { modal: 'src-dpa',            title: 'Down Payment Assistance', icon: '🪜' },
      { modal: 'src-buydowns',       title: '2-1 Buydowns',           icon: '📉' },
      { modal: 'src-agent-credits',  title: 'Agent Credits',          icon: '🔑' },
    ],
    notes: `"Most first-time buyers assume every dollar has to come out of their own savings. It doesn't. There are six places this money can come from, and most buyers use more than one."

Down Payment Assistance gets the longest treatment — it's the least understood. Four layers: state, metro/city, county, and employer/union/profession.`,
  },

  {
    id: 'programs-3',
    section: 'Most Common Loan Programs',
    layout: 'figure-compare',
    concept: 'Closing costs and cash to close are not the same thing.',
    headline: 'Two numbers people confuse',
    subhead: "And they're much further apart than you'd think.",
    figure: 'cashToClose',
    hasNumbers: true,
    time: 150,
    compare: {
      yes: {
        head: 'Credits <strong>can</strong> pay for',
        items: [
          'Allowable closing costs',
          'Prepaid items',
          'Escrow deposits',
          'Discount points <small>program permitting</small>',
        ],
      },
      no: {
        head: 'Credits <strong>cannot</strong> pay for',
        items: [
          'Your down payment',
          'More than your actual costs',
          'Cash back to you',
        ],
      },
    },
    chips: [
      { modal: 'prepaids-escrows', title: "Prepaids and escrows aren't fees" },
    ],
    notes: `"Two lines appear on your Loan Estimate and people plan their life around the wrong one.

CLOSING COSTS is what you pay to get the loan.

CASH TO CLOSE is everything — down payment, closing costs, prepaid items, escrows, reserves — minus any credits.

It is a much bigger number, it's on page one, and it's the one that decides whether you can actually get to the table."`,
  },

  /* ======================================================================
     SECTION — THE PROCESS
     ==================================================================== */
  {
    id: 'sec-process',
    section: 'The Process',
    layout: 'section',
    title: 'The Process',
    time: 10,
    notes: 'Section break.',
  },

  {
    id: 'process-1',
    section: 'The Process',
    layout: 'cards',
    concept: "Eight people, and they don't all work for you.",
    headline: 'Meet your home buying team',
    subhead: 'Click anyone.',
    cols: 4,
    time: 180,
    cards: [
      { modal: 'team-loan-officer',    title: 'Loan Officer',     icon: '📋' },
      { modal: 'team-realtor',         title: 'Realtor',          icon: '🏘️' },
      { modal: 'team-seller',          title: 'Seller',           icon: '🪧' },
      { modal: 'team-processor',       title: 'Processor',        icon: '🗂️' },
      { modal: 'team-underwriter',     title: 'Underwriter',      icon: '⚖️' },
      { modal: 'team-title-company',   title: 'Title Company',    icon: '📜' },
      { modal: 'team-closer',          title: 'Closer',           icon: '✍️' },
      { modal: 'team-insurance-agent', title: 'Insurance Agent',  icon: '🛡️' },
    ],
    notes: `"The most useful question in this entire process is four words: WHO PAYS YOU, AND HOW?

Ask everybody. Nobody good is offended by it — and the ones who are have just told you something."`,
  },

  {
    id: 'process-2',
    section: 'The Process',
    layout: 'timeline',
    concept: 'Eight steps, and you know where you are at all times.',
    headline: 'From first call to keys',
    subhead: 'Click any step.',
    time: 180,
    /* PLACEHOLDER 9 — step naming must match the MSFG website EXACTLY.
       Verify against the screenshot before delivery. */
    steps: [
      { modal: 'step-pre-approval',         label: 'Pre-Approval',         time: '1–2 days' },
      { modal: 'step-application',          label: 'Application',          time: 'Same day' },
      { modal: 'step-processing',           label: 'Processing',           time: '1–2 weeks' },
      { modal: 'step-underwriting',         label: 'Underwriting',         time: 'Days–1 week' },
      { modal: 'step-conditional-approval', label: 'Conditional Approval', time: 'A few days' },
      { modal: 'step-clear-to-close',       label: 'Clear to Close',       time: 'Days before' },
      { modal: 'step-closed',               label: 'Closed',               time: 'About an hour' },
      { modal: 'step-funded',               label: 'Funded',               time: 'Same/next day' },
    ],
    notes: `"Print this. Put it on the fridge.

Ninety percent of the anxiety in this process is not knowing which step you're on — and the hardest stretch is underwriting, because it's the one that looks exactly like nothing happening."`,
  },

  /* ======================================================================
     SECTION — MISTAKES TO AVOID
     ==================================================================== */
  {
    id: 'sec-mistakes',
    section: 'Mistakes to Avoid',
    layout: 'section',
    title: 'Mistakes to Avoid',
    time: 10,
    notes: 'Section break.',
  },

  {
    id: 'mistakes-1a',
    section: 'Mistakes to Avoid',
    layout: 'markers',
    concept: "From application to keys, don't touch anything.",
    headline: "Don't",
    subhead: 'From application to closing.',
    tone: 'dont',
    cols: 2,
    time: 120,
    items: [
      'Apply for any new loans',
      'Take out any new loans',
      'Pay off collections or debt <strong>unless your lender says to</strong>',
      'Consolidate debt or close credit cards',
      'Dispute items on your credit report',
      'Make large deposits other than payroll — <strong>no cash deposits</strong>',
      'Make large purchases with credit or debit',
      'Move money between accounts',
      'Change jobs without talking to your loan officer',
      'Quit or give notice before your loan closes',
      'Use cash for earnest money — <strong>personal check or wire only</strong>',
    ],
    notes: `"One rule that covers all eleven: FROM APPLICATION TO KEYS, YOUR FINANCIAL LIFE IS A MUSEUM EXHIBIT. LOOK, DON'T TOUCH.

And the two that surprise people most — don't pay off collections without asking, and don't dispute anything on your credit report. Both feel like cleaning up. Both can stall your closing."

"If something has to change — a job offer, an inheritance, a car that died — that's fine, life happens. CALL YOUR LOAN OFFICER FIRST. Almost all of these are survivable with warning and fatal as a surprise."`,
  },

  {
    id: 'mistakes-1b',
    section: 'Mistakes to Avoid',
    layout: 'markers',
    concept: 'The five things that keep a file moving.',
    headline: 'Do',
    tone: 'do',
    cols: 1,
    time: 90,
    items: [
      'Make all your payments on time',
      "Tell your lender if you <strong>haven't filed last year's taxes</strong>, or owe on them",
      'Tell your lender if <strong>anything about your job is changing</strong> — new payroll company, base to commission, hours, title',
      'Keep your homeowners insurance <strong>at or under</strong> the amount shown on your Loan Estimate',
      'Return everything your lender asks for <strong>quickly</strong>',
    ],
    notes: `"Only five, and the fifth one does the most work.

The single biggest predictor of a smooth closing isn't your credit score or your down payment — IT'S HOW FAST YOU SEND DOCUMENTS BACK. Same-day beats perfect."

⚑ The visual contrast between the eleven and the five is deliberate. Let them see it.`,
  },

  {
    id: 'mistakes-2',
    section: 'Mistakes to Avoid',
    layout: 'figure-bullets',
    concept: 'People lose money trying to save money on rate.',
    headline: 'How people lose money chasing rates',
    figure: 'breakeven',
    figureOpts: { callback: true },
    ratio: '3-2',
    hasNumbers: true,
    time: 120,
    bullets: [
      "<strong>Lowest rate vs. lowest cost</strong> — a low rate bought with points isn't a low rate",
      "<strong>Breakeven</strong> — cost of the points ÷ the monthly saving. Won't pass it? Don't pay it",
      '<strong>Points</strong> — a bet on how long you keep <strong>this exact loan</strong>, not this house',
      '<strong>Refinancing later</strong> — ends the loan early, and <strong>restarts amortization</strong>',
    ],
    pullQuote: 'Equity is built by payments and time — not by the third decimal place of your rate.',
    notes: `"The mistake isn't paying points. Points are sometimes exactly right.

The mistake is paying them without asking the one question that decides it: HOW LONG WILL I KEEP THIS LOAN? Not this house — this loan. Refinancing ends it even if you never move.

Most first-time buyers dramatically overestimate that number, and 'I don't know' is itself an argument against paying."

⚑ Callback — they've seen this crossing before. It should feel like recognition, not new information.`,
  },

  {
    id: 'mistakes-3',
    section: 'Mistakes to Avoid',
    layout: 'cards',
    concept: "The expensive mistakes don't feel like mistakes.",
    headline: 'The most expensive mistakes start as small assumptions',
    subhead: 'Click any one.',
    cols: 3,
    cardVariant: 'quote',
    time: 150,
    cards: [
      { modal: 'assume-preapproval-last',  title: '“I’ll get pre-approved once I find a house.”' },
      { modal: 'assume-one-lender',        title: '“They’re all about the same, so I’ll just use one lender.”' },
      { modal: 'assume-closing-costs',     title: '“Closing costs are what I need at closing.”' },
      { modal: 'assume-approved-done',     title: '“I’m approved, so I’m done.”' },
      { modal: 'assume-wait-20',           title: '“I’ll wait until I have twenty percent.”' },
      { modal: 'assume-builder-incentive', title: '“The builder’s incentive is free money.”' },
    ],
    notes: `"None of these feel like mistakes when you make them. Every one of them feels reasonable. That's what makes them expensive."

(Then, slowly:)

"And the one underneath all six — NOT ASKING A QUESTION BECAUSE YOU'RE AFRAID OF LOOKING LIKE YOU DON'T KNOW WHAT YOU'RE DOING.

You've done this zero times. Everyone across the table has done it thousands. That's not a flaw, that's arithmetic. YOU ARE ALLOWED TO NOT KNOW THIS."`,
  },

  /* ======================================================================
     QUESTIONS
     ==================================================================== */
  {
    id: 'questions',
    section: 'Questions',
    layout: 'rows',
    concept: "The five things everyone wants to ask and doesn't.",
    headline: 'Most common questions',
    subhead: 'Click to expand.',
    time: 180,
    cards: [
      { modal: 'q-how-much-money',    title: 'How much money do I actually need?' },
      { modal: 'q-credit-score',      title: 'What credit score do I need?' },
      { modal: 'q-how-long',          title: 'How long does the whole thing take?' },
      { modal: 'q-lock-rate',         title: 'Should I lock my rate?' },
      { modal: 'q-after-preapproval', title: 'What happens after pre-approval?' },
    ],
    notes: `Open the ones the room asks for. Don't walk all five.

Then open the floor — THE QUESTIONS PEOPLE ASK OUT LOUD ARE BETTER THAN THE ONES I PRE-WROTE.`,
  },

  /* ======================================================================
     WRAP UP
     ==================================================================== */
  {
    id: 'wrap',
    section: 'Wrap Up',
    layout: 'wrap',
    concept: "Here's how to reach me, and what to do next.",
    headline: 'Thank you',
    time: 90,
    notes: `Say the phone number and email OUT LOUD.

⚑ LEAVE THIS SLIDE UP DURING Q&A — it should be on screen the entire time people are asking questions.`,
  },
];

/* Runtime target from the spec: ~38 minutes taught, plus open Q&A. */
export const TARGET_RUNTIME_SECONDS = SLIDES.reduce((a, s) => a + (s.time || 0), 0);
