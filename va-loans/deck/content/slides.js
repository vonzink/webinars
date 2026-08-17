/* ============================================================================
   SLIDE CONTENT — Understanding VA Loans.
   Ridgeline visual system. One green accent per slide; talking points, not
   worked numbers. `footer:true` renders the compliance footer (§6).
   VA is a guideline program — program/eligibility slides carry the general
   disclaimer; any fee/rate illustration carries the hypothetical disclaimer.
   ========================================================================= */

export const SLIDES = [

  /* 1 — OPENING */
  {
    id: 'opening', layout: 'opening', bg: 'dark', footer: true,
    eyebrow: 'Understanding VA Loans',
    headline: 'The VA loan, actually explained.',
    time: 45,
    notes: 'Under 20 seconds. Thank them for their service. The next 40 minutes are education, not a pitch. Two promises: I won\'t quote you a rate, and I won\'t tell you where rates are going — nobody knows.',
  },

  /* 2 — MYTHS */
  {
    id: 'myths', layout: 'grid', bg: 'white', footer: true, cols: 3,
    headline: 'Myths',
    subhead: 'What veterans get told about their own benefit. Tap any one.',
    cards: [
      { modal: 'myth-once',   title: 'You can only use it once' },
      { modal: 'myth-slow',   title: 'VA loans are slow and sellers hate them' },
      { modal: 'myth-credit', title: 'You need a high credit score' },
      { modal: 'myth-limit',  title: 'There\'s a hard limit on what you can borrow' },
      { modal: 'myth-pmi',    title: 'VA loans have monthly mortgage insurance' },
    ],
    time: 120,
    notes: 'Don\'t read the cards. Ask which they\'ve heard. The one that costs veterans the most is "use it once" — it\'s reusable and restorable. Open the two the room reacts to.',
  },

  /* 3 — THE VA ADVANTAGE (two-panel compare) */
  {
    id: 'advantage', layout: 'compare', bg: 'dark',
    eyebrow: 'The benefit',
    left: { label: 'What you get', items: [
      '$0 down on a primary residence',
      'No monthly mortgage insurance — ever',
      'Competitive rates and no prepayment penalty',
      'A benefit you can reuse, and even pass on (assumable)',
    ]},
    right: { label: 'What you skip', items: [
      'A down payment',
      'Monthly PMI or MIP',
      'A "first-time buyer only" restriction',
      'The 20%-down math everyone else is stuck with',
    ]},
    callout: 'This isn\'t a favor. It\'s a benefit you earned.',
    time: 150,
    notes: 'Frame it as earned, not given. The two that move people: no monthly MI (a real monthly savings vs FHA/conventional) and reusability. Say "reusable" out loud — most think it\'s once.',
  },

  /* 4 — WHO QUALIFIES */
  {
    id: 'eligibility', layout: 'grid', bg: 'white', footer: true, cols: 3,
    headline: 'Who qualifies',
    subhead: 'Eligibility is broader than most people assume. Tap any one.',
    compliance: 'va',
    cards: [
      { modal: 'elig-active',  title: 'Active duty & veterans', meta: 'Wartime and peacetime service' },
      { modal: 'elig-guard',   title: 'Guard & Reserve',        meta: 'You may qualify too' },
      { modal: 'elig-spouse',  title: 'Surviving spouses',      meta: 'A benefit that can transfer' },
      { modal: 'elig-coe',     title: 'Certificate of Eligibility', meta: 'How you prove it' },
      { modal: 'elig-again',   title: 'Using it again',         meta: 'Restore and reuse' },
    ],
    time: 150,
    notes: 'People rule themselves out wrongly — short enlistments, Guard, Reserve, spouses. Always say: if anyone in the household served, ask. The COE is easy; we can often pull it in minutes.',
  },

  /* 5 — ENTITLEMENT */
  {
    id: 'entitlement', layout: 'points', bg: 'dark',
    eyebrow: 'Entitlement',
    headline: 'Entitlement, in plain English',
    subhead: 'It\'s what backs your loan — and why "how much can I borrow?" surprises people.',
    points: [
      'Entitlement is the VA\'s guarantee to the lender — it\'s what replaces your down payment',
      'With full entitlement there is no VA loan limit — you can borrow what you qualify for, still $0 down',
      'Buy again before selling? Second-tier entitlement can let you keep both',
      'Sold and paid off? You can restore entitlement and reuse the benefit',
    ],
    time: 150,
    notes: 'Since 2020, full-entitlement borrowers have no county loan limit — a huge, little-known change. "Bonus" / second-tier entitlement lets some keep a first home and buy again. Restoration resets the benefit after a sale.',
  },

  /* 6 — VA vs CONVENTIONAL vs FHA */
  {
    id: 'compare-programs', layout: 'grid', bg: 'white', footer: true, cols: 2,
    headline: 'VA vs Conventional vs FHA',
    subhead: 'Same buyer, three doors. Tap a program, or see them side by side.',
    compliance: 'va',
    cards: [
      { modal: 'compare-loans', title: 'See them side by side', meta: 'Down payment, MI, fees, APR' },
      { modal: 'prog-va',           title: 'VA',          meta: 'If you served, start here', stat: '0% down' },
      { modal: 'prog-conventional', title: 'Conventional', meta: 'The default for most buyers', stat: '3% down' },
      { modal: 'prog-fha',          title: 'FHA',          meta: 'Built for credit flexibility', stat: '3.5% down' },
    ],
    time: 180,
    notes: 'Lead with the table. The headline: VA usually wins on monthly cost because there\'s no MI — even when the rate looks similar. FHA\'s lower rate can carry a higher APR once MI is folded in.',
  },

  /* 7 — WHAT'S IN A VA PAYMENT */
  {
    id: 'va-payment', layout: 'payment', bg: 'white', footer: true,
    eyebrow: 'The payment',
    headline: 'What\'s actually in a VA payment',
    subhead: 'Notice what\'s missing — there is no monthly mortgage insurance line.',
    fixed: ['Your interest rate', 'Your principal & interest', 'Your loan term'],
    moves: ['Property taxes', 'Insurance premiums', 'HOA dues', 'A special assessment'],
    points: [
      'No monthly mortgage insurance — that line simply doesn\'t exist on a VA loan',
      'Escrow collects a slice of taxes and insurance each month and pays them for you — not a fee',
      'The funding fee is a one-time cost (usually financed), not a monthly charge',
    ],
    time: 180,
    notes: 'Point at the stack: FHA and conventional add a monthly MI band here — VA doesn\'t. That gap is real money every month. Fixed rate still doesn\'t mean fixed payment: taxes and insurance move.',
  },

  /* 8 — THE FUNDING FEE */
  {
    id: 'funding-fee', layout: 'points', bg: 'dark', hasNumbers: true,
    eyebrow: 'The funding fee',
    headline: 'The funding fee, without the fear',
    subhead: 'One cost, one time — and it\'s how the program stays $0-down for the next veteran.',
    points: [
      'A one-time fee, not monthly — and it can be rolled into the loan',
      'First use costs less than later uses; putting some money down lowers it further',
      'Waived entirely for veterans receiving compensation for a service-connected disability',
      'It replaces mortgage insurance — pay once instead of every month for years',
    ],
    callout: 'Waived for many disabled veterans. Always worth checking your status first.',
    time: 150,
    notes: 'De-fang it: it\'s one-time and financeable, and it\'s WHY there\'s no monthly MI. The disability waiver is the single most valuable thing to check — it can erase the fee entirely. Exact percentages change; don\'t quote them.',
  },

  /* 9 — CASH TO CLOSE, VA-STYLE */
  {
    id: 'cash-to-close', layout: 'grid', bg: 'white', footer: true, cols: 3,
    headline: 'Cash to close, VA-style',
    subhead: 'Often close to zero — and it doesn\'t all have to be yours. Tap any source.',
    compliance: 'va',
    cards: [
      { modal: 'cash-nodown',      title: 'No down payment' },
      { modal: 'cash-seller',      title: 'Seller concessions' },
      { modal: 'cash-gift',        title: 'Gift funds' },
      { modal: 'cash-credits',     title: 'Lender & agent credits' },
      { modal: 'cash-nonallowable',title: 'Fees you can\'t be charged' },
      { modal: 'cash-earnest',     title: 'Earnest money' },
    ],
    time: 180,
    notes: 'VA buyers often bring very little. The seller can cover a lot (concession cap), gifts are allowed, and VA even limits which fees the veteran may pay. Earnest money still comes back at closing.',
  },

  /* 10 — PROPERTY & APPRAISAL */
  {
    id: 'property', layout: 'grid', bg: 'dark', footer: true, cols: 3,
    headline: 'The property & the appraisal',
    subhead: 'VA protects the buyer here more than any other loan. Tap any one.',
    compliance: 'va',
    cards: [
      { modal: 'appr-appraisal', title: 'The VA appraisal' },
      { modal: 'appr-mpr',       title: 'Minimum Property Requirements' },
      { modal: 'appr-nov',       title: 'Notice of Value' },
      { modal: 'appr-tidewater', title: 'Tidewater' },
      { modal: 'appr-occupancy', title: 'Occupancy' },
      { modal: 'appr-condo',     title: 'Condos & what won\'t qualify' },
    ],
    time: 180,
    notes: 'The VA appraisal does two jobs: value AND a safety/livability check (MPRs). It protects the veteran. Tidewater gives a chance to support value before a low number lands. Occupancy: primary residence, generally within 60 days.',
  },

  /* 11 — MEET THE PLAYERS */
  {
    id: 'process-players', layout: 'grid', bg: 'white', footer: true, cols: 3,
    headline: 'Meet the players',
    subhead: 'Who does what — and who actually works for you. Tap anyone.',
    cards: [
      { modal: 'role-lender',      title: 'Lender' },
      { modal: 'role-realtor',     title: 'Realtor' },
      { modal: 'role-appraiser',   title: 'VA Appraiser' },
      { modal: 'role-underwriter', title: 'Underwriter' },
      { modal: 'role-title',       title: 'Title' },
      { modal: 'role-closer',      title: 'Closer' },
    ],
    time: 150,
    notes: 'The VA appraiser is assigned by the VA — not chosen by the lender. Underwriter makes the call. The most useful question you can ask anyone in the deal: who pays you, and how?',
  },

  /* 12 — THE PROCESS */
  {
    id: 'process-steps', layout: 'stepper', bg: 'dark', footer: true,
    eyebrow: 'The process',
    headline: 'From COE to keys',
    steps: [
      { label: 'Pre-Approval',   note: 'COE + 1–2 days' },
      { label: 'Application',    note: 'Same day' },
      { label: 'Processing',    note: '1–2 weeks' },
      { label: 'VA Appraisal',  note: 'Ordered early' },
      { label: 'Underwriting',  note: 'Days–1 week' },
      { label: 'Clear to Close', note: 'A few days' },
      { label: 'Closed',        note: 'About an hour' },
      { label: 'Funded',        note: 'Same / next day' },
    ],
    time: 150,
    notes: 'Two VA-specific touchpoints: the COE up front (we can usually pull it fast) and the VA appraisal, which we order early because it\'s VA-assigned and can take a little longer. Otherwise it looks like any other loan.',
  },

  /* 13 — MISTAKES: Don't */
  {
    id: 'mistakes-donts', layout: 'markers', bg: 'white', footer: true, tone: 'dont', cols: 2,
    eyebrow: 'Mistakes to avoid',
    headline: "Don't",
    subhead: 'From application to closing, your financial life is a museum exhibit — look, don\'t touch.',
    items: [
      'Apply for or take out any new loans',
      'Let your Certificate of Eligibility wait until the last minute',
      'Assume the funding fee applies before checking a disability waiver',
      'Pay off collections or debt unless your lender says to',
      'Make large deposits other than payroll — no cash',
      'Change jobs or leave service without telling your loan officer',
      'Dispute items on your credit report mid-loan',
      'Use cash for earnest money — check or wire only',
    ],
    time: 120,
    notes: 'One rule: from application to keys, look but don\'t touch. VA-specific — get the COE early, and always check the disability waiver before assuming a funding fee. If anything must change, call first.',
  },

  /* 14 — MISTAKES: Do */
  {
    id: 'mistakes-dos', layout: 'markers', bg: 'mist', footer: true, tone: 'do', cols: 1,
    eyebrow: 'Mistakes to avoid',
    headline: 'Do',
    subhead: 'The short list that keeps a VA file moving.',
    items: [
      'Get your Certificate of Eligibility early — we can usually help',
      'Confirm any service-connected disability rating (it can waive the fee)',
      'Make all your payments on time',
      'Tell your lender if anything about your job or service is changing',
      'Return everything your lender asks for quickly',
    ],
    time: 90,
    notes: 'Five, and the last does the most work. Same-day document return beats a perfect file. The disability check is unique to VA and can save thousands — do it first.',
  },

  /* 15 — USING YOUR BENEFIT AGAIN */
  {
    id: 'using-again', layout: 'points', bg: 'dark',
    eyebrow: 'For life',
    headline: 'It\'s a benefit for life, not one purchase',
    subhead: 'The ways veterans keep using what they earned.',
    points: [
      'IRRRL — the VA streamline refinance: lower your rate with minimal paperwork and no new appraisal in most cases',
      'Cash-out refinance — tap equity, or bring a non-VA loan onto VA terms',
      'Assumable — a qualified buyer can take over your loan and low rate (mind your entitlement)',
      'Restore entitlement after a sale and buy again — there\'s no once-in-a-lifetime limit',
    ],
    time: 120,
    notes: 'The benefit doesn\'t end at the first house. IRRRL is genuinely easy. Assumability is a hidden asset on a low-rate loan — but the seller\'s entitlement can stay tied up unless the buyer is also VA-eligible. Restoration lets people reuse it again and again.',
  },

  /* 16 — QUESTIONS */
  {
    id: 'questions', layout: 'questions', bg: 'dark', footer: true,
    eyebrow: 'Questions',
    headline: 'The questions everyone asks',
    items: [
      { q: 'Do I really put nothing down?', a: 'On a primary residence, yes — $0 down with full entitlement. You\'ll still have some closing costs, though sellers, gifts, and credits can cover much of it.' },
      { q: 'What credit score do I need?', a: 'There\'s no VA-set minimum; lenders set overlays. VA reaches lower than conventional, and you\'re probably closer than you think.' },
      { q: 'How does VA decide I can afford it?', a: 'Beyond debt-to-income, VA uses residual income — the money left after your bills. It\'s a more forgiving, real-life test.' },
      { q: 'How much is the funding fee?', a: 'It varies by use and down payment, it\'s one-time and financeable, and it\'s waived for many disabled veterans. We\'ll check your status first.' },
      { q: 'Can I use it more than once?', a: 'Yes. You can restore and reuse it, and in some cases hold two VA loans at once with second-tier entitlement.' },
    ],
    time: 180,
    notes: 'Open the floor. The residual-income answer surprises people — it\'s why VA approvals feel more human. Re-emphasize reuse.',
  },

  /* 17 — WRAP */
  {
    id: 'wrap', layout: 'wrap', bg: 'dark', footer: true,
    headline: 'Let\'s use what you earned.',
    time: 90,
    notes: 'Thank them for their service again. Say the phone number and email out loud. Leave this up during Q&A — it\'s the only way replay viewers reach you.',
  },
];

export const TARGET_RUNTIME_SECONDS = SLIDES.reduce((a, s) => a + (s.time || 0), 0);
