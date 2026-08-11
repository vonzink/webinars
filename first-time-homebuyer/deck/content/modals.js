/* ============================================================================
   POPOUT CONTENT — clean and simple. Major pros, major cons, main points.
   This is a presentation, not a reference guide: 2–4 bullets per section.

   Shape:
     id, title, eyebrow?, sections: [{ head, tone?('pros'|'cons'), items[], note? }]
     compliance?: ['generalGuidelines' | 'hypothetical']
   ========================================================================= */

export const MODALS = {

  /* ---- BUYING MYTHS ---------------------------------------------------- */
  'myth-20-down': {
    eyebrow: 'The myth', title: 'You need 20% down',
    sections: [
      { head: 'The reality', items: [
        'Conventional goes as low as <strong>3%</strong>, FHA <strong>3.5%</strong>, VA and USDA <strong>0%</strong>',
        'The median first-time buyer puts down far less than 20%',
      ]},
      { head: 'Pros of 20% down', tone: 'pros', items: [
        'No monthly mortgage insurance',
        'Lower payment and more instant equity',
      ]},
      { head: 'Cons', tone: 'cons', items: [
        'Years of saving while rent builds no equity',
        'Drains the cash reserve you want after closing',
      ]},
      { head: '', items: [], note: 'Mortgage insurance on a conventional loan is <strong>removable</strong> — it\'s a phase, not a sentence.' },
    ],
  },
  'myth-fha-first': {
    eyebrow: 'The myth', title: 'FHA is only for first-time buyers',
    sections: [
      { head: 'The reality', items: [
        '<strong>FHA has no first-time buyer requirement</strong> — anyone eligible can use it',
        'It\'s a primary-residence program, not a first-timer program',
      ]},
      { head: 'Pros', tone: 'pros', items: [
        'More forgiving on credit and past events',
        'Higher debt-to-income tolerance · assumable',
      ]},
      { head: 'Cons', tone: 'cons', items: [
        'MI often lasts the life of the loan under 10% down',
        'Upfront premium added to the balance',
      ]},
    ],
  },
  'myth-perfect-credit': {
    eyebrow: 'The myth', title: 'You need perfect credit',
    sections: [
      { head: 'The reality', items: [
        'Pricing moves in <strong>tiers</strong> — near an edge matters, mid-tier often doesn\'t',
        'FHA and VA reach meaningfully lower than conventional',
      ]},
      { head: 'Pros of a higher score', tone: 'pros', items: [
        'Better pricing, lower MI, more program options',
      ]},
      { head: 'Cons of waiting for "perfect"', tone: 'cons', items: [
        'Prices and rents keep moving while you chase a number',
      ]},
      { head: '', items: [], note: '<strong>Utilization</strong> is ~30% of the score and can move in one cycle. Don\'t close old cards — it shortens history.' },
    ],
  },
  'myth-renting': {
    eyebrow: 'The myth', title: 'Renting is always cheaper',
    sections: [
      { head: 'The reality', items: [
        'Rent generally rises; a fixed principal & interest payment doesn\'t',
        'Ownership builds equity — rent doesn\'t',
      ]},
      { head: 'Pros of renting', tone: 'pros', items: [
        'Flexibility, no maintenance, no transaction costs',
      ]},
      { head: 'Cons of renting', tone: 'cons', items: [
        'No equity, no fixed housing cost, no control over increases',
      ]},
      { head: '', items: [], note: 'Over a <strong>short</strong> horizon renting can win; over a <strong>long</strong> one, ownership usually does.' },
    ],
  },
  'myth-lowest-rate': {
    eyebrow: 'The myth', title: 'The lowest rate is the best deal',
    sections: [
      { head: 'The reality', items: [
        'A lower rate is often <strong>bought</strong> with points paid at closing',
        'The lowest rate and the lowest cost are frequently not the same loan',
      ]},
      { head: 'Pros of a lower rate', tone: 'pros', items: [
        'Lower payment and less interest over a long hold',
      ]},
      { head: 'Cons', tone: 'cons', items: [
        'Points are cash today — gone if you sell or refinance early',
        'Chasing rate can hide high lender fees',
      ]},
      { head: '', items: [], note: 'Ask for <strong>rate AND total cost</strong>, and compare Loan Estimates from the same day.' },
    ],
  },

  'compare-loans': {
    eyebrow: 'Compare', title: 'Conventional vs FHA vs VA',
    intro: 'Same borrower, same price — the rate is only part of the story. APR folds in mortgage insurance and fees, so the lowest rate isn\'t always the lowest APR.',
    table: {
      columns: ['Conventional', 'FHA', 'VA'],
      rows: [
        { label: 'Minimum down',       cells: ['3%', '3.5%', '0%'] },
        { label: 'Mortgage insurance', cells: ['Removable', 'Often life of loan', 'None'] },
        { label: 'Illustrative rate',  cells: ['6.75%', '6.50%', '6.25%'] },
        { label: 'Illustrative APR',   cells: ['<strong>6.90%</strong>', '<strong>7.40%</strong>', '<strong>6.45%</strong>'] },
        { label: 'Best for',           cells: ['Strong credit', 'Credit flexibility', 'Eligible veterans'] },
      ],
    },
    compliance: ['hypothetical'],
    sections: [
      { head: 'The takeaway', items: [
        'FHA\'s lower rate can carry a <strong>higher APR</strong> — upfront and monthly MI',
        'VA often wins on APR — no monthly MI',
        'Ask for <strong>rate AND APR</strong> on every quote',
      ]},
    ],
  },

  /* ---- LOAN PROGRAMS --------------------------------------------------- */
  'prog-conventional': {
    eyebrow: 'Loan program', title: 'Conventional', compliance: ['generalGuidelines'],
    sections: [
      { head: 'Who it fits', items: ['Solid credit, steady documented income · as low as 3% down'] },
      { head: 'Pros', tone: 'pros', items: ['MI comes off', 'Best pricing at strong credit', 'Widest property flexibility'] },
      { head: 'Cons', tone: 'cons', items: ['Least forgiving on credit', 'Less tolerant of recent derogatory history'] },
    ],
  },
  'prog-fha': {
    eyebrow: 'Loan program', title: 'FHA', compliance: ['generalGuidelines'],
    sections: [
      { head: 'Who it fits', items: ['Rebuilding credit or a higher debt load · 3.5% down'] },
      { head: 'Pros', tone: 'pros', items: ['Lower credit thresholds', 'Higher DTI tolerance', 'Assumable'] },
      { head: 'Cons', tone: 'cons', items: ['MI usually lasts the life of the loan', 'Upfront premium added to the balance'] },
    ],
  },
  'prog-va': {
    eyebrow: 'Loan program', title: 'VA', compliance: ['generalGuidelines'],
    sections: [
      { head: 'Who it fits', items: ['Eligible service members, veterans, and certain spouses · 0% down'] },
      { head: 'Pros', tone: 'pros', items: ['No down payment', 'No monthly MI', 'Reusable — not once per lifetime'] },
      { head: 'Cons', tone: 'cons', items: ['A funding fee applies (financeable; waived for some)', 'Stricter property standards'] },
      { head: '', items: [], note: 'If anyone in the household served — including a spouse — <strong>ask.</strong> People assume it doesn\'t count. It usually does.' },
    ],
  },
  'prog-usda': {
    eyebrow: 'Loan program', title: 'USDA', compliance: ['generalGuidelines'],
    sections: [
      { head: 'Who it fits', items: ['Eligible area, under the household income limit · 0% down'] },
      { head: 'Pros', tone: 'pros', items: ['No down payment', 'Annual fee often lower than FHA'] },
      { head: 'Cons', tone: 'cons', items: ['Geography decides — check the map', 'Income limits count everyone in the home'] },
    ],
  },
  'prog-jumbo': {
    eyebrow: 'Loan program', title: 'Jumbo', compliance: ['generalGuidelines'],
    sections: [
      { head: 'Who it fits', items: ['Loan amount above the conforming limit for the county'] },
      { head: 'Pros', tone: 'pros', items: ['Finances higher-priced homes', 'Flexible structures available'] },
      { head: 'Cons', tone: 'cons', items: ['Strongest credit and reserves expected', 'Rules vary a lot by investor — shop it'] },
    ],
  },

  /* ---- CASH TO CLOSE — SOURCES (Fannie rules, simplified) -------------- */
  'src-savings': {
    eyebrow: 'Where it comes from', title: 'Savings',
    sections: [{ head: 'The rules', items: [
      'Must be <strong>seasoned</strong> — sitting in your account, documented',
      '<strong>No undocumented cash.</strong> Cash deposits without a trail can\'t be used',
      'Large non-payroll deposits must be sourced and explained',
    ], note: 'Move money <strong>before</strong> you apply, not during.' }],
  },
  'src-gift': {
    eyebrow: 'Where it comes from', title: 'Gift Funds',
    sections: [{ head: 'The rules', items: [
      '<strong>Gift letter required</strong> — stating it is not a loan',
      'Generally must come from <strong>family</strong>',
      'The donor\'s funds must be <strong>sourced</strong>, and the transfer documented',
    ], note: 'Tell your lender <strong>before</strong> the money moves.' }],
  },
  'src-seller': {
    eyebrow: 'Where it comes from', title: 'Seller Credits',
    sections: [{ head: 'The rules', items: [
      'The seller contributes toward your closing costs',
      '<strong>Concession caps apply</strong> by program and down payment',
      'Cannot pay your down payment or exceed your actual costs',
    ], note: 'You have to <strong>negotiate</strong> for it — ask your agent to ask.' }],
  },
  'src-buydown': {
    eyebrow: 'Where it comes from', title: '2-1 Buydowns', compliance: ['hypothetical'],
    sections: [
      { head: 'How it works', items: [
        'A <strong>temporary</strong> payment reduction for the first two years',
        'Usually paid by the <strong>seller or builder</strong>, not you',
      ]},
      { head: 'The catch', tone: 'cons', items: [
        'You qualify at the <strong>real rate</strong> — full payment in year three',
        'A plan to refinance first depends on rates nobody controls',
      ]},
    ],
  },
  'src-agent': {
    eyebrow: 'Where it comes from', title: 'Agent Credits',
    sections: [{ head: 'The rules', items: [
      'An agent may contribute part of their commission',
      'Must be <strong>disclosed</strong> and appear on closing documents',
      'Counts toward overall contribution limits',
    ], note: 'Ask early — it can\'t be added at the closing table.' }],
  },
  'src-assistance': {
    eyebrow: 'Where it comes from', title: 'Down Payment Assistance',
    sections: [
      { head: 'What it is', items: ['Grants or second mortgages that reduce cash to close'] },
      { head: 'The trade-offs', tone: 'cons', items: [
        '<strong>Complicates the process</strong> — extra underwriting and timelines',
        'Often makes your offer <strong>less attractive</strong> to sellers',
        'Usually comes with a <strong>higher rate</strong>, caps, and fine print',
      ]},
      { head: '', items: [], note: 'Sometimes it clearly wins. Run it against the higher rate before deciding.' },
    ],
  },

  /* ---- THE PROCESS — MEET THE PLAYERS ---------------------------------- */
  'role-lender': {
    eyebrow: 'Your team', title: 'Lender / Loan Officer',
    sections: [{ head: 'What they do', items: [
      'Structures your financing and guides you from pre-approval to closing',
      'Packages the file and advocates for it',
    ], note: 'We don\'t approve the loan — <strong>the underwriter does.</strong>' }],
  },
  'role-realtor': {
    eyebrow: 'Your team', title: 'Realtor',
    sections: [{ head: 'What they do', items: [
      'Finds homes, writes and negotiates your offer, manages deadlines',
    ], note: 'The listing agent works for the <strong>seller</strong>. Yours works for you — ask how they\'re paid.' }],
  },
  'role-seller': {
    eyebrow: 'Your team', title: 'Seller',
    sections: [{ head: 'What they do', items: [
      'Owns the home; their motivation shapes what\'s negotiable',
      'You almost never deal with them directly — it runs through agents',
    ], note: 'Sometimes <strong>timing or certainty</strong> matters to them more than top price.' }],
  },
  'role-underwriter': {
    eyebrow: 'Your team', title: 'Underwriter',
    sections: [{ head: 'What they do', items: [
      'Makes the actual decision against program guidelines',
      'You\'ll <strong>never deal with them directly</strong>',
    ], note: 'They\'re not looking for a reason to say no — they\'re documenting a reason to say yes.' }],
  },
  'role-title': {
    eyebrow: 'Your team', title: 'Title Company',
    sections: [{ head: 'What they do', items: [
      'Researches ownership, clears liens, issues title insurance, holds funds',
      'Neutral to both sides',
    ], note: 'You can often <strong>shop</strong> for them — most people never do.' }],
  },
  'role-closer': {
    eyebrow: 'Your team', title: 'Closer',
    sections: [{ head: 'What they do', items: [
      'Runs the signing, walks you through documents, moves the funds',
    ], note: 'Budget an hour. Read what you sign and ask about anything unclear.' }],
  },
  'role-insurance': {
    eyebrow: 'Your team', title: 'Insurance Agent',
    sections: [{ head: 'What they do', items: [
      'Places your homeowners policy, required before closing',
    ], note: '<strong>Start early.</strong> Premiums vary widely and a high one can affect qualifying.' }],
  },
  'role-processor': {
    eyebrow: 'Your team', title: 'Processor',
    sections: [{ head: 'What they do', items: [
      'Collects your documents, orders appraisal and title, preps the file',
    ], note: 'Being asked twice isn\'t a lost document — <strong>send it again same-day</strong> and it\'s a non-event.' }],
  },

  /* ---- MISTAKES — SMALL ASSUMPTIONS ------------------------------------ */
  'assume-preapproval': {
    eyebrow: 'Small assumption', title: '"I\'ll get pre-approved once I find a house"',
    sections: [
      { head: 'What actually happens', items: ['The house goes under contract while you\'re getting a letter'] },
      { head: 'Do instead', tone: 'pros', items: ['Pre-approval <strong>first</strong> — it\'s free and nothing is committed'] },
    ],
  },
  'assume-one-lender': {
    eyebrow: 'Small assumption', title: '"They\'re all about the same, I\'ll use one lender"',
    sections: [
      { head: 'What actually happens', items: ['Lender fees vary by thousands at the identical rate'] },
      { head: 'Do instead', tone: 'pros', items: ['Get more than one Loan Estimate the <strong>same day</strong> and compare fees', 'Shopping inside the window counts as one credit pull'] },
    ],
  },
  'assume-closing-costs': {
    eyebrow: 'Small assumption', title: '"Closing costs are what I need at closing"',
    sections: [
      { head: 'What actually happens', items: ['You arrive short — cash to close also has the down payment, prepaids, escrows, reserves'] },
      { head: 'Do instead', tone: 'pros', items: ['Plan around <strong>Cash to Close</strong> on page one, not closing costs'] },
    ],
  },
  'assume-approved': {
    eyebrow: 'Small assumption', title: '"I\'m approved, so I\'m done"',
    sections: [
      { head: 'What actually happens', items: ['Lenders <strong>re-pull credit before closing</strong> — new debt can break the file'] },
      { head: 'Do instead', tone: 'pros', items: ['Change nothing until you have keys. If something must change, call first'] },
    ],
  },
  'assume-wait-20': {
    eyebrow: 'Small assumption', title: '"I\'ll wait until I have twenty percent"',
    sections: [
      { head: 'What actually happens', items: ['The target rises while you save — and you pay rent the whole time'] },
      { head: 'Do instead', tone: 'pros', items: ['Run the comparison. Waiting should be a <strong>decision</strong>, not a default'] },
    ],
  },
  'assume-builder': {
    eyebrow: 'Small assumption', title: '"The builder\'s incentive is free money"',
    sections: [
      { head: 'What actually happens', items: ['It may be funded by a higher rate, higher fees, or a price set to pay for it'] },
      { head: 'Do instead', tone: 'pros', items: ['Take the builder\'s Loan Estimate, get one from outside, and compare fees'] },
    ],
  },
};

export const MODAL_COUNT = Object.keys(MODALS).length;
