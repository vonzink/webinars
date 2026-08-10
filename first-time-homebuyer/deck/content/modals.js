/* ============================================================================
   MODAL CONTENT — all 53 popouts.

   Shape:
     id        unique key, referenced by a card on a main slide
     title     modal title
     subhead   optional one-line subhead
     figure    optional key into js/figures.js
     sections  [{ head, tone?, items[], note? }]   tone: 'pros' | 'cons'
     compliance ['hypothetical' | 'generalGuidelines']  auto-rendered in foot

   Body bullets are capped at 6 per section per the standard modal structure.
   Text is verbatim from HANDOFF-v6. Do not paraphrase it here — the wording
   was compliance-reviewed.
   ========================================================================= */

export const MODALS = {

  /* =========================================================================
     BUYING MYTHS — 5 myths
     Every myth uses the same five headers.
     ====================================================================== */

  'myth-20-down': {
    title: 'You need 20% down',
    sections: [
      { head: 'Why people believe it', items: [
        "It's what their parents did, and it was closer to true a generation ago",
        '20% genuinely does avoid monthly mortgage insurance — so the number isn\'t invented',
        '"Avoids one specific fee" quietly became "required"',
      ]},
      { head: 'The reality', items: [
        'Conventional loans go as low as <strong>3% down</strong>',
        'FHA as low as <strong>3.5%</strong>',
        'VA and USDA can be <strong>0% down</strong> for those who qualify',
        'The median first-time buyer puts down far less than 20%, and has for a long time',
      ]},
      { head: 'Pros of putting 20% down', tone: 'pros', items: [
        'No monthly mortgage insurance',
        'Lower payment · smaller loan · more instant equity',
        'A stronger-looking offer in a competitive situation',
      ]},
      { head: 'Cons', tone: 'cons', items: [
        'Saving to 20% takes years, and the target moves as prices move',
        'Years of rent paid while saving builds no equity',
        'Drains the cash reserve you\'ll want <strong>after</strong> closing',
      ]},
      { head: 'What you should actually know', items: [
        'Mortgage insurance on a conventional loan is <strong>removable</strong> — it\'s a phase, not a sentence',
        'Waiting can be the right call. It should be a <strong>decision</strong>, not a default',
        'Run the comparison before you commit to years of saving',
      ]},
    ],
  },

  'myth-fha-first-time': {
    title: 'FHA is only for first-time buyers',
    sections: [
      { head: 'Why people believe it', items: [
        'FHA is marketed heavily to first-time buyers',
        'The two get mentioned together constantly',
      ]},
      { head: 'The reality', items: [
        '<strong>FHA has no first-time buyer requirement.</strong> Anyone eligible can use it',
        'It\'s a primary-residence program, not a first-timer program',
        'Separately: most "first-time buyer" programs define it as <strong>no ownership interest in a primary residence for three years</strong> — so you can have owned before and still qualify',
      ]},
      { head: 'Pros', tone: 'pros', items: [
        'More forgiving on credit history and past derogatory events',
        'Higher debt-to-income tolerance in many scenarios',
        'Assumable by a qualified buyer — genuinely valuable on a below-market rate',
      ]},
      { head: 'Cons', tone: 'cons', items: [
        'On most FHA loans with less than 10% down, mortgage insurance lasts the <strong>life of the loan</strong>',
        'Upfront mortgage insurance premium is added to the balance',
        'Property condition standards can complicate some purchases',
      ]},
      { head: 'What you should actually know', items: [
        'FHA isn\'t "worse" — it\'s <strong>different</strong>. Run it against conventional both ways',
        'For many buyers the plan is <strong>FHA to get in, refinance later.</strong> That\'s legitimate — just know the exit depends on future rates nobody can promise',
      ]},
    ],
  },

  'myth-perfect-credit': {
    title: 'You need perfect credit',
    sections: [
      { head: 'Why people believe it', items: [
        'Advertised rates are footnoted "assumes excellent credit"',
        'Being declined feels like a character judgment, so people don\'t ask',
      ]},
      { head: 'The reality', items: [
        'Pricing moves in <strong>tiers</strong>, not smoothly. Small moves near a tier edge matter; large moves inside a tier often don\'t',
        'FHA and VA reach meaningfully lower than conventional',
        'Lender overlays vary — the same borrower gets different answers at different lenders',
      ]},
      { head: 'Pros of a higher score', tone: 'pros', items: [
        'Better pricing · lower mortgage insurance · more program options · more flexibility',
      ]},
      { head: 'Cons of waiting for "perfect"', tone: 'cons', items: [
        'Chasing a top-tier score can delay a purchase for no real benefit',
        'Meanwhile prices and rents keep moving',
      ]},
      { head: 'What you should actually know', items: [
        'The score in your banking app usually isn\'t your <strong>mortgage</strong> score — different model, three bureaus, and the <strong>middle</strong> score is used',
        'Two borrowers? Generally the <strong>lower</strong> of the two middles drives pricing',
        '<strong>Utilization is roughly 30% of the score and can move in one billing cycle</strong> — the fastest legitimate lever there is',
        '<strong>Don\'t close old cards.</strong> It shortens history and raises utilization',
      ]},
    ],
  },

  'myth-renting-cheaper': {
    title: 'Renting is always cheaper',
    sections: [
      { head: 'Why people believe it', items: [
        'Month one, it often <strong>is</strong> — no maintenance, no taxes, no surprise repairs',
        'The comparison usually stops at the payment',
      ]},
      { head: 'The reality', items: [
        'Rent generally rises over time. A fixed-rate principal-and-interest payment doesn\'t',
        'Ownership builds equity; rent doesn\'t',
        'But ownership carries costs renting doesn\'t: maintenance, taxes, insurance, and the transaction costs of buying and selling',
      ]},
      { head: 'Pros of renting', tone: 'pros', items: [
        'Flexibility · capped, predictable monthly cost · no maintenance risk · no transaction costs',
      ]},
      { head: 'Cons of renting', tone: 'cons', items: [
        'No equity · no fixed housing cost · no control over increases or whether you can stay',
      ]},
      { head: 'What you should actually know', items: [
        'Over <strong>short</strong> horizons, renting frequently wins — transaction costs alone can exceed the equity built',
        'Over <strong>long</strong> horizons, ownership usually wins',
      ], note: '<strong>"Renting is throwing money away" is a sales line, not an analysis.</strong> If there\'s a real chance you move within a couple of years, renting may genuinely be correct.' },
    ],
  },

  'myth-lowest-rate': {
    title: 'Always choose the lowest interest rate',
    sections: [
      { head: 'Why people believe it', items: [
        'The rate is the only number anybody advertises',
        'It\'s the easiest thing to compare, so it becomes the only thing compared',
      ]},
      { head: 'The reality', items: [
        'A lower rate is often <strong>bought</strong> with points paid at closing',
        'Two loans at the same rate can differ substantially in lender fees',
        'The lowest rate and the lowest cost are frequently <strong>not the same loan</strong>',
      ]},
      { head: 'Pros of a lower rate', tone: 'pros', items: [
        'Lower monthly payment · less interest over a long hold · more buying power',
      ]},
      { head: 'Cons', tone: 'cons', items: [
        'Points are cash out of pocket today',
        'If you sell or refinance before the breakeven, that money is simply gone',
        'Chasing rate can hide high origination charges entirely',
      ]},
      { head: 'What you should actually know', items: [
        'Ask for <strong>rate AND total cost</strong>, not rate alone',
        'Compare <strong>origination charges</strong> between lenders — that\'s where they actually differ',
        'Compare Loan Estimates issued the <strong>same day</strong>; rates move',
        '<strong>Getting more than one quote does not hurt your score</strong> — mortgage inquiries inside a shopping window count as one',
      ]},
    ],
  },

  /* ---- The six rate chips. One screen each, no numbers. ----------------- */

  'chip-interest-rate': {
    title: 'Interest Rate',
    sections: [{ head: 'What it is', items: [
      'What the payment is calculated from',
      '<strong>Not the whole cost.</strong> It is one input, and the one everybody advertises',
    ]}],
  },

  'chip-apr': {
    title: 'APR',
    sections: [{ head: 'What it is', items: [
      'Rate plus certain lender costs, spread over the full term',
      'A <strong>comparison tool</strong>, not your payment rate',
      'It assumes you keep the loan the entire term — <strong>most people don\'t</strong>, which is where it misleads',
    ]}],
  },

  'chip-closing-costs': {
    title: 'Closing Costs',
    sections: [{ head: 'What it is', items: [
      'What you pay to get the loan and transfer the property',
      'Some are shoppable, some aren\'t',
      '<strong>Origination charges are where lenders genuinely differ</strong>',
    ]}],
  },

  'chip-lender-credits': {
    title: 'Lender Credits',
    sections: [{ head: 'What it is', items: [
      'The trade in reverse — take a higher rate, the lender covers some costs',
      '<strong>Frequently right for a cash-tight buyer, and rarely volunteered. Ask.</strong>',
    ]}],
  },

  'chip-discount-points': {
    title: 'Discount Points',
    sections: [{ head: 'What it is', items: [
      'Prepaid interest to permanently lower the rate',
      'A bet on <strong>how long you keep this exact loan</strong>',
    ]}],
  },

  'chip-breakeven': {
    title: 'Breakeven',
    sections: [{ head: 'What it is', items: [
      'Cost of the points divided by the monthly saving',
      '<strong>If you won\'t clearly pass it, don\'t pay them</strong>',
    ]}],
  },

  /* =========================================================================
     BUDGET — 3 popouts
     ====================================================================== */

  'escrow': {
    title: 'Escrow',
    sections: [
      { head: 'What it actually is', items: [
        'An account your lender manages on your behalf',
        'They collect roughly a twelfth of your annual taxes and insurance each month',
        'They pay those bills when due',
        '<strong>It is not a fee, and it is not their money</strong> — it\'s yours, collected early',
      ]},
      { head: 'What surprises people', items: [
        'Reviewed annually. If taxes or insurance rise, your monthly payment rises',
        'A shortfall can mean both a higher payment <strong>and</strong> a one-time catch-up bill',
      ]},
    ],
  },

  'amortization': {
    title: 'Amortization',
    figure: 'amortization',
    sections: [
      { head: 'How it works', items: [
        'Early payments are mostly <strong>interest</strong>; later payments are mostly <strong>principal</strong>',
        'It shifts gradually — the crossover takes many years on a 30-year loan',
        '<strong>Extra principal payments early have outsized effect</strong> — they remove interest that would have compounded for decades',
      ]},
      { head: 'What to watch', items: [
        'Confirm your servicer applies extra payments to <strong>principal</strong>, not to next month',
      ], note: '⚠️ <strong>Refinancing restarts the schedule.</strong> A new 30-year loan puts you back at the interest-heavy beginning, even at a lower rate. That doesn\'t make refinancing wrong — it makes it a calculation.' },
    ],
  },

  'builder-negative-equity': {
    title: 'Why builder incentives can create negative equity',
    sections: [
      { head: 'What\'s happening', items: [
        'Builders often prefer giving <strong>incentives</strong> over cutting price — a price cut sets a comparable sale that lowers value for every other home in the subdivision',
        'A large incentive can mean you paid closer to full price for a home whose resale value reflects the neighbourhood, not the incentive',
        'Selling in the first few years can mean owing more than the home brings',
        '<strong>This is riskiest for first-time buyers</strong>, who move sooner than they expect and have the least equity cushion',
      ]},
      { head: 'What to do', items: [
        'Ask what the incentive is <strong>worth in cash</strong>',
        'Ask whether a <strong>price reduction</strong> is available instead. A price reduction is permanent',
      ]},
    ],
  },

  /* =========================================================================
     MOST COMMON LOAN PROGRAMS — 5 programs + 6 sources + 1
     Every modal in this section carries the general-guidelines disclaimer.
     ====================================================================== */

  'prog-conventional': {
    title: 'Conventional',
    compliance: ['generalGuidelines'],
    sections: [
      { head: 'Typical borrower', items: ['Solid credit, steady documented income'] },
      { head: 'Minimum down', items: ['<strong>3%</strong> on first-time buyer programs; 5% standard'] },
      { head: 'Mortgage insurance', items: ['Required under 20% down — <strong>and removable</strong>'] },
      { head: 'Credit flexibility', items: ['Least forgiving; pricing degrades noticeably at lower scores'] },
      { head: 'Pros', tone: 'pros', items: [
        'MI comes off',
        'Best pricing at strong credit',
        'Widest property flexibility',
        'Income-limited versions offer reduced MI and better pricing',
      ]},
      { head: 'Cons', tone: 'cons', items: [
        'Stricter credit',
        'Less tolerant of recent derogatory history',
      ]},
      { head: 'Best used when', items: [
        'Credit is good and you want mortgage insurance <strong>with an exit</strong>',
      ]},
    ],
  },

  'prog-fha': {
    title: 'FHA',
    compliance: ['generalGuidelines'],
    sections: [
      { head: 'Typical borrower', items: ['Credit that\'s rebuilding, or a higher debt load'] },
      { head: 'Minimum down', items: ['<strong>3.5%</strong>'] },
      { head: 'Mortgage insurance', items: [
        'Upfront <strong>and</strong> monthly',
        'On most loans under 10% down it lasts the <strong>life of the loan</strong>',
      ]},
      { head: 'Credit flexibility', items: ['Significantly more forgiving'] },
      { head: 'Pros', tone: 'pros', items: [
        'Lower credit thresholds',
        'Higher DTI tolerance',
        'Shorter waiting periods after derogatory events',
        '<strong>Assumable</strong>',
      ]},
      { head: 'Cons', tone: 'cons', items: [
        'MI usually doesn\'t come off',
        'Upfront premium added to the balance',
        'Property condition standards',
      ]},
      { head: 'Best used when', items: [
        'Credit or debt load rules out conventional — often with a plan to refinance later <em>(which depends on future rates nobody can promise)</em>',
      ], note: '<strong>No first-time buyer requirement.</strong> Anyone eligible can use it.' },
    ],
  },

  'prog-va': {
    title: 'VA',
    compliance: ['generalGuidelines'],
    sections: [
      { head: 'Typical borrower', items: [
        'Eligible service members, veterans, National Guard, Reserves, and certain surviving spouses',
      ]},
      { head: 'Minimum down', items: ['<strong>0%</strong>'] },
      { head: 'Mortgage insurance', items: ['<strong>None</strong> — no monthly MI at all'] },
      { head: 'Credit flexibility', items: ['No VA-wide minimum score; lender overlays apply'] },
      { head: 'Pros', tone: 'pros', items: [
        'No down payment · no monthly MI · competitive pricing',
        'Qualifies on <strong>residual income</strong> rather than a hard ratio',
        '<strong>Reusable — not once per lifetime</strong>',
        'Assumable',
      ]},
      { head: 'Cons', tone: 'cons', items: [
        'A funding fee applies <em>(financeable, and waived for veterans receiving compensation for a service-connected disability)</em>',
        'Stricter property standards',
      ]},
      { head: 'Best used when', items: [
        'You\'re eligible. <strong>Almost always check this first</strong>',
      ], note: '⭐ <strong>If anyone in the household served — including a spouse — ask.</strong> People assume a short enlistment "doesn\'t count." It usually does.' },
    ],
  },

  'prog-usda': {
    title: 'USDA',
    compliance: ['generalGuidelines'],
    sections: [
      { head: 'Typical borrower', items: ['Buying in an eligible area, under the household income limit'] },
      { head: 'Minimum down', items: ['<strong>0%</strong>'] },
      { head: 'Mortgage insurance', items: ['An upfront guarantee fee plus a smaller annual fee'] },
      { head: 'Credit flexibility', items: ['Moderate'] },
      { head: 'Pros', tone: 'pros', items: [
        'No down payment',
        'Annual fee often lower than FHA\'s',
      ]},
      { head: 'Cons', tone: 'cons', items: [
        '<strong>Geography decides</strong>',
        'Household income limits count everyone in the home, not just borrowers',
        'Property condition standards',
      ]},
      { head: 'Best used when', items: [
        'The address is eligible — <strong>check the map, not the vibe.</strong> Plenty of ordinary-feeling towns qualify',
      ]},
    ],
  },

  'prog-jumbo': {
    title: 'Jumbo',
    compliance: ['generalGuidelines'],
    sections: [
      { head: 'Typical borrower', items: ['Loan amount above the conforming limit for the county'] },
      { head: 'Minimum down', items: ['Varies by investor — generally higher'] },
      { head: 'Mortgage insurance', items: ['Varies; often structured to avoid it'] },
      { head: 'Credit flexibility', items: ['The least — strongest credit and reserves expected'] },
      { head: 'Pros', tone: 'pros', items: [
        'Finances higher-priced homes',
        'Flexible structures available',
      ]},
      { head: 'Cons', tone: 'cons', items: [
        'Stricter everything — reserves, documentation, DTI caps',
        '<strong>Rules vary substantially by investor</strong>',
      ]},
      { head: 'Best used when', items: [
        'The price requires it. <strong>Shop it</strong> — jumbo terms differ far more between lenders than conforming terms do',
      ]},
    ],
  },

  /* ---- Cash to close: six sources -------------------------------------- */

  'src-savings': {
    title: 'Savings',
    sections: [
      { head: 'What underwriting needs', items: [
        'Must be <strong>seasoned</strong> when the program requires it — sitting in your account, documented',
        '<strong>No undocumented cash deposits.</strong> Cash you deposited without a paper trail generally cannot be used',
        'Large deposits outside normal payroll must be <strong>sourced and explained</strong>',
        'Underwriting will ask about deposits that don\'t match your income pattern — that\'s routine, not suspicion',
      ], note: '💡 Move money <strong>before</strong> you apply, not during.' },
    ],
  },

  'src-gift-funds': {
    title: 'Gift Funds',
    sections: [
      { head: 'What\'s required', items: [
        'Allowed on most programs, with conditions',
        '<strong>Gift letter required</strong> — stating the amount, the donor, and that <strong>it is not a loan</strong>',
        '<strong>Eligible donor relationships</strong> vary by program — generally family; some programs allow employers, unions, or charitable and government entities',
        '<strong>Source documentation</strong> — where the donor\'s money came from',
        '<strong>Transfer documentation</strong> — the paper trail from donor\'s account to yours',
      ], note: '⚠️ <strong>Tell your lender before the money moves.</strong> A gift handled correctly is routine; the same gift deposited quietly becomes a two-week problem.' },
    ],
  },

  'src-seller-credits': {
    title: 'Seller Credits',
    sections: [
      { head: 'How they work', items: [
        'The seller contributes toward your closing costs',
        '<strong>Concession limits apply</strong> and vary by loan program and down payment',
        'Can pay allowable closing costs and prepaid items — <strong>cannot</strong> be used for your down payment',
        'Cannot exceed your actual costs — unused credit doesn\'t come back as cash',
      ]},
      { head: 'Negotiation strategy', items: [
        'In a softer market this is often more available than buyers realise',
        'Sometimes easier to obtain than a price reduction — <strong>ask your agent to ask</strong>',
      ]},
    ],
  },

  'src-buydowns': {
    title: '2-1 Buydowns',
    compliance: ['hypothetical'],
    sections: [
      { head: 'How it works', items: [
        '<strong>Temporary</strong> payment reduction — the rate acts lower in year one, less so in year two, then reaches the real rate in year three',
        'The difference is <strong>prefunded into an escrow account</strong> — usually paid by the <strong>seller or builder</strong> as a concession, not by you',
        'If you sell or refinance early, unused funds are generally credited toward your loan',
      ]},
      { head: 'The benefit', tone: 'pros', items: [
        'Real cash-flow relief in the two most expensive years of ownership',
      ]},
      { head: 'The catch', tone: 'cons', items: [
        '⚠️ <strong>You qualify at the real rate, not the reduced one.</strong> You will be paying the full payment in year three',
      ], note: '⚠️ <strong>If the plan depends on refinancing before year three, that plan depends on rates nobody controls.</strong>' },
    ],
  },

  'src-agent-credits': {
    title: 'Agent Credits',
    sections: [
      { head: 'How they work', items: [
        'A real estate agent may contribute part of their commission toward your costs',
        '<strong>When allowed:</strong> permitted by many programs, but it must be <strong>disclosed</strong> and appear on the closing documents',
      ]},
      { head: 'Limitations', tone: 'cons', items: [
        'Counts toward overall contribution limits',
        'Cannot be an undisclosed side arrangement',
        'Brokerage policy varies and some prohibit it entirely',
      ], note: '<strong>Ask early</strong> — it can\'t be added at the closing table.' },
    ],
  },

  'src-dpa': {
    title: 'Down Payment Assistance',
    subhead: 'The least understood source, and often the most valuable.',
    sections: [
      { head: 'What it is', items: [
        'Grants or second mortgages that reduce the cash you need at closing',
        '<strong>Four layers to check:</strong> state · metro/city · county · <strong>employer, union, or profession</strong>',
      ]},
      { head: 'Pros', tone: 'pros', items: [
        'Can dramatically reduce cash needed to close',
        'Sometimes forgivable after a period of occupancy',
        'Opens ownership to buyers who\'d otherwise wait years',
      ]},
      { head: 'Cons', tone: 'cons', items: [
        '<strong>Income limits</strong> and <strong>purchase price limits</strong> apply',
        '<strong>Additional underwriting</strong> and a second set of guidelines to satisfy',
        '<strong>Often a higher interest rate</strong> on the first mortgage — that\'s how the assistance is funded',
        '<strong>More documentation</strong> and longer timelines',
        '<strong>Possible repayment requirements</strong> — some must be repaid on sale or refinance',
        '⚠️ <strong>Assistance can weaken an offer.</strong> Sellers in a competitive market may view a DPA-backed offer as slower or likelier to fall through',
      ]},
      { head: 'What to actually do', items: [
        'Ask a lender to run all four layers for <strong>your county and income</strong>',
        '<strong>Terms, limits, and funding availability change — some programs run out of money mid-year.</strong> Verify on the day you\'re shopping, not months ahead',
        'Compare the assistance against the higher rate. Sometimes it clearly wins. Sometimes it doesn\'t. <strong>Run it.</strong>',
      ]},
    ],
  },

  'prepaids-escrows': {
    title: 'Prepaids and escrows aren\'t fees',
    sections: [
      { head: 'What they are', items: [
        'Prepaid interest, your first year of homeowners insurance, and a few months of taxes and insurance to fund the escrow account',
        '<strong>This is your own money, paid early</strong> — not a charge, not lost',
        'You were always going to pay it. It\'s front-loaded, not additional',
      ], note: '💡 Closing later in the month reduces prepaid interest. It doesn\'t change what you owe overall — but if cash at the table is your constraint, it\'s a real lever.' },
    ],
  },

  /* =========================================================================
     THE PROCESS — 8 team + 8 steps
     ====================================================================== */

  'team-loan-officer': {
    title: 'Loan Officer',
    sections: [
      { head: 'What they do', items: ['Structures your financing, shops lenders, guides you from pre-approval to closing'] },
      { head: 'When you\'ll interact', items: ['Start to finish, most often at the beginning and end'] },
      { head: 'Common misconceptions', items: [
        'That we approve your loan. We don\'t — <strong>the underwriter does.</strong> We package the file and advocate for it',
      ]},
    ],
  },

  'team-realtor': {
    title: 'Realtor',
    sections: [
      { head: 'What they do', items: ['Finds homes, writes and negotiates your offer, manages contract deadlines'] },
      { head: 'When you\'ll interact', items: ['Constantly, from search through closing'] },
      { head: 'Common misconceptions', items: [
        'That the agent showing you a house works for you. <strong>The listing agent works for the seller.</strong> Yours works for you — read your buyer agreement and ask how they\'re paid',
      ]},
    ],
  },

  'team-seller': {
    title: 'Seller',
    sections: [
      { head: 'What they do', items: ['Owns the home. Their motivation shapes what\'s negotiable'] },
      { head: 'When you\'ll interact', items: ['Almost never directly — communication runs through agents'] },
      { head: 'Common misconceptions', items: [
        'That they want the highest price above all. Sometimes <strong>timing, certainty, or a fast close</strong> matters more, and that\'s where a well-prepared buyer wins',
      ]},
    ],
  },

  'team-processor': {
    title: 'Processor',
    sections: [
      { head: 'What they do', items: ['Collects and organises your documentation, orders the appraisal and title, prepares the file for underwriting'] },
      { head: 'When you\'ll interact', items: ['The middle stretch, and they\'ll email you a lot'] },
      { head: 'Common misconceptions', items: [
        'That being asked for something twice means someone lost it. Underwriting is a checklist and the checklist doesn\'t know what you already sent',
        '<strong>Send it again, same day, and it\'s a non-event</strong>',
      ]},
    ],
  },

  'team-underwriter': {
    title: 'Underwriter',
    sections: [
      { head: 'What they do', items: ['Makes the actual decision. Verifies income, assets, credit, and the property against program guidelines'] },
      { head: 'When you\'ll interact', items: ['<strong>Never directly.</strong> They don\'t speak to you'] },
      { head: 'Common misconceptions', items: [
        'That they\'re looking for a reason to say no. <strong>They\'re documenting a reason to say yes</strong>',
      ]},
    ],
  },

  'team-title-company': {
    title: 'Title Company',
    sections: [
      { head: 'What they do', items: ['Researches ownership history, clears liens, issues title insurance, holds and disburses funds. Neutral to both sides'] },
      { head: 'When you\'ll interact', items: ['Mid-process and at closing'] },
      { head: 'Common misconceptions', items: [
        'That they work for the lender. <strong>They\'re neutral.</strong> And you can often shop for them — most people never do',
      ]},
    ],
  },

  'team-closer': {
    title: 'Closer',
    sections: [
      { head: 'What they do', items: ['Runs the signing, walks you through the documents, notarises, and makes sure funds move correctly'] },
      { head: 'When you\'ll interact', items: ['Closing day'] },
      { head: 'Common misconceptions', items: [
        'That closing takes five minutes. <strong>Budget an hour</strong>, read what you sign, and ask about anything unclear — that\'s what they\'re there for',
      ]},
    ],
  },

  'team-insurance-agent': {
    title: 'Insurance Agent',
    sections: [
      { head: 'What they do', items: ['Places your homeowners policy, required before closing'] },
      { head: 'When you\'ll interact', items: ['A few weeks out'] },
      { head: 'Common misconceptions', items: [
        'That it\'s a last-minute formality. <strong>Start early.</strong> Premiums vary widely, some properties are harder to insure than expected, and a high premium can affect qualifying — not just your budget',
      ]},
    ],
  },

  /* ---- The eight steps -------------------------------------------------- */

  'step-pre-approval': {
    title: 'Pre-Approval',
    sections: [
      { head: 'What happens', items: ['Credit reviewed, income and assets examined, you learn what\'s possible'] },
      { head: 'Typical timeline', items: ['1–2 days'] },
      { head: 'Who\'s involved', items: ['You and your loan officer'] },
      { head: 'What to expect', items: [
        'A conversation, not an exam. <strong>Nothing is committed</strong>',
        '"No" is almost never the answer — <strong>"not yet, and here\'s what changes it"</strong> is',
      ]},
    ],
  },

  'step-application': {
    title: 'Application',
    sections: [
      { head: 'What happens', items: ['The formal application once you\'re under contract'] },
      { head: 'Typical timeline', items: ['Same day'] },
      { head: 'Who\'s involved', items: ['You, loan officer'] },
      { head: 'What to expect', items: [
        'A <strong>Loan Estimate within three business days</strong>',
        '<strong>Read page two</strong>',
      ]},
    ],
  },

  'step-processing': {
    title: 'Processing',
    sections: [
      { head: 'What happens', items: ['Documents collected and verified, appraisal and title ordered'] },
      { head: 'Typical timeline', items: ['1–2 weeks'] },
      { head: 'Who\'s involved', items: ['Processor, appraiser, title'] },
      { head: 'What to expect', items: [
        'Document requests, some of which will feel repetitive',
        '<strong>Respond same-day and this stage stays short</strong>',
      ]},
    ],
  },

  'step-underwriting': {
    title: 'Underwriting',
    sections: [
      { head: 'What happens', items: ['The lender\'s decision'] },
      { head: 'Typical timeline', items: ['Several days to a week'] },
      { head: 'Who\'s involved', items: ['The underwriter, whom you\'ll never meet'] },
      { head: 'What to expect', items: [
        '<strong>This is the quiet, anxious part.</strong> It looks like nothing is happening. Something is',
      ]},
    ],
  },

  'step-conditional-approval': {
    title: 'Conditional Approval',
    sections: [
      { head: 'What happens', items: ['Approved, subject to a list of items'] },
      { head: 'Typical timeline', items: ['A few days to clear'] },
      { head: 'Who\'s involved', items: ['You, loan officer, processor'] },
      { head: 'What to expect', items: [
        '<strong>Conditions are normal.</strong> Getting a list is not a rejection — it\'s how nearly every loan is approved',
      ]},
    ],
  },

  'step-clear-to-close': {
    title: 'Clear to Close',
    sections: [
      { head: 'What happens', items: ['Every condition satisfied. Closing gets scheduled'] },
      { head: 'Typical timeline', items: ['Typically a few days before closing'] },
      { head: 'What to expect', items: [
        'Your <strong>Closing Disclosure at least three business days before signing</strong>',
        'Compare it to your Loan Estimate line by line — <strong>that\'s what the three days are for</strong>',
      ]},
    ],
  },

  'step-closed': {
    title: 'Closed',
    sections: [
      { head: 'What happens', items: ['You sign'] },
      { head: 'Typical timeline', items: ['About an hour'] },
      { head: 'Who\'s involved', items: ['You, the closer, sometimes your agent'] },
      { head: 'What to expect', items: ['A lot of signatures. <strong>Read them. Ask questions</strong>'] },
    ],
  },

  'step-funded': {
    title: 'Funded',
    sections: [
      { head: 'What happens', items: ['The loan funds, the deed records, the home is yours'] },
      { head: 'Typical timeline', items: ['Same day or next'] },
      { head: 'What to expect', items: [
        '<strong>Keys.</strong>',
        'Depending on timing and local practice, recording may happen the following business day',
      ]},
    ],
  },

  /* =========================================================================
     MISTAKES — 6 small assumptions
     ====================================================================== */

  'assume-preapproval-last': {
    title: '"I\'ll get pre-approved once I find a house."',
    sections: [
      { head: 'What actually happens', items: [
        'The house you want goes under contract while you\'re getting a letter',
        'Sellers don\'t wait, and in a competitive situation an offer without one often isn\'t presented seriously',
      ]},
      { head: 'What to do instead', items: [
        '<strong>Pre-approval first.</strong> It\'s a conversation, it\'s free, and nothing is committed',
      ]},
    ],
  },

  'assume-one-lender': {
    title: '"They\'re all about the same, so I\'ll just use one lender."',
    sections: [
      { head: 'What actually happens', items: [
        'Lender fees vary far more than people expect — two loans at the identical rate can differ by thousands in origination charges',
      ]},
      { head: 'What to do instead', items: [
        'Get more than one Loan Estimate, <strong>issued the same day</strong>, and compare origination charges',
        'Mortgage inquiries inside a shopping window count as one — <strong>it costs you essentially nothing in score</strong>',
      ]},
    ],
  },

  'assume-closing-costs': {
    title: '"Closing costs are what I need at closing."',
    sections: [
      { head: 'What actually happens', items: [
        'You arrive at the table short, because cash to close also includes the down payment, prepaid items, escrows, and reserves',
      ]},
      { head: 'What to do instead', items: [
        'Plan around <strong>Cash to Close</strong> on page one. Not closing costs',
      ]},
    ],
  },

  'assume-approved-done': {
    title: '"I\'m approved, so I\'m done."',
    sections: [
      { head: 'What actually happens', items: [
        'Lenders <strong>re-pull credit before closing</strong>',
        'New debt taken on after approval can break the file days before you sign',
      ]},
      { head: 'What to do instead', items: [
        'Change nothing until you have keys. <strong>If something must change, call first</strong>',
      ]},
    ],
  },

  'assume-wait-20': {
    title: '"I\'ll wait until I have twenty percent."',
    sections: [
      { head: 'What actually happens', items: [
        'The target is a percentage of a moving number, so it rises while you save — and you pay rent the whole time',
      ]},
      { head: 'What to do instead', items: [
        'Run the comparison. Waiting is sometimes right. <strong>It should be a decision, not a default</strong>',
      ]},
    ],
  },

  'assume-builder-incentive': {
    title: '"The builder\'s incentive is free money."',
    sections: [
      { head: 'What actually happens', items: [
        'The incentive may be partly funded by a higher rate, higher fees, or a price set to pay for it',
      ]},
      { head: 'What to do instead', items: [
        'Take the builder\'s Loan Estimate, get one from outside, compare origination charges, and convert the rate difference into real money over how long you\'ll keep the loan',
      ], note: '<strong>Sometimes the builder genuinely wins — you just have to actually check.</strong>' },
    ],
  },

  /* =========================================================================
     QUESTIONS — 5
     ====================================================================== */

  'q-how-much-money': {
    title: 'How much money do I actually need?',
    compliance: ['generalGuidelines'],
    sections: [
      { head: 'The answer', items: [
        'Less than most people think. Conventional starts at <strong>3%</strong> down, FHA at <strong>3.5%</strong>, and VA and USDA can be <strong>zero</strong>',
        'But budget beyond the down payment — closing costs, prepaid items, and an emergency fund you do <strong>not</strong> spend on the house',
      ], note: '<strong>If buying requires spending your emergency fund, you\'re buying too much house.</strong>' },
    ],
  },

  'q-credit-score': {
    title: 'What credit score do I need?',
    compliance: ['generalGuidelines'],
    sections: [
      { head: 'The answer', items: [
        'There\'s no single number — it depends on the program, and lender overlays vary',
        'FHA and VA reach meaningfully lower than conventional',
        'Pricing moves in <strong>tiers</strong>, so being near a tier edge matters more than being "perfect"',
      ], note: '<strong>You are probably closer than you think. Find out — it\'s a five-minute question.</strong>' },
    ],
  },

  'q-how-long': {
    title: 'How long does the whole thing take?',
    sections: [
      { head: 'The answer', items: [
        'Contract to keys is typically <strong>30–45 days</strong>',
        'The longer part is the house hunt. From a serious start, most people are two to six months out',
        'The single biggest variable is <strong>how fast you return documents</strong>',
      ]},
    ],
  },

  'q-lock-rate': {
    title: 'Should I lock my rate?',
    sections: [
      { head: 'The answer', items: [
        'Generally once you\'re under contract, for a period that covers your closing date with room',
        'Longer locks usually cost more, and extensions aren\'t free',
      ], note: '<strong>Ask about a float-down before you lock</strong> — it\'s free to ask, and it has real value if rates improve.' },
    ],
  },

  'q-after-preapproval': {
    title: 'What happens after pre-approval?',
    sections: [
      { head: 'The answer', items: [
        'You shop with a real budget and a letter in hand',
        'When you find the home, your offer goes in, and pre-approval becomes a formal application',
        'Loan Estimate within three business days, then processing, underwriting, conditions, clear to close, and signing',
      ], note: '<strong>Your pre-approval isn\'t permanent</strong> — it expires, and it can change if your finances do.' },
    ],
  },
};

/* Sanity check available in the console — the spec calls for exactly 53. */
export const MODAL_COUNT = Object.keys(MODALS).length;
