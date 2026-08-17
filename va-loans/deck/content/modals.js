/* ============================================================================
   POPOUT CONTENT — Understanding VA Loans. Clean and simple: major points,
   pros, cons. Presentation depth, not a reference guide (2–4 bullets/section).

   Shape:
     id, title, eyebrow?, intro?, table?, sections: [{ head, tone?('pros'|'cons'), items[], note? }]
     compliance?: ['va' | 'generalGuidelines' | 'hypothetical']
   ========================================================================= */

export const MODALS = {

  /* ---- MYTHS ---------------------------------------------------------- */
  'myth-once': {
    eyebrow: 'The myth', title: 'You can only use it once',
    sections: [
      { head: 'The reality', items: [
        'The VA benefit is reusable — not once per lifetime',
        'Sell and pay off the loan, and you can restore full entitlement',
        'You can even hold two VA loans at once with second-tier entitlement',
      ]},
      { head: '', items: [], note: 'This myth costs veterans more than any other. If you used it years ago, you very likely still have it.' },
    ],
  },
  'myth-slow': {
    eyebrow: 'The myth', title: 'VA loans are slow and sellers hate them',
    sections: [
      { head: 'The reality', items: [
        'VA timelines are comparable to conventional when the appraisal is ordered early',
        'A VA buyer is a strong, motivated, low-fall-through buyer',
        'Modern MPRs are reasonable — the "impossible to pass" reputation is outdated',
      ]},
      { head: '', items: [], note: 'Half the battle is an agent who knows VA. A good listing agent sees a VA offer as a serious one.' },
    ],
  },
  'myth-credit': {
    eyebrow: 'The myth', title: 'You need a high credit score',
    sections: [
      { head: 'The reality', items: [
        'The VA sets no minimum score — individual lenders set overlays',
        'VA reaches meaningfully lower than conventional',
        'VA also weighs residual income, not just a credit number',
      ]},
      { head: '', items: [], note: 'You are probably closer than you think. It\'s a five-minute question.' },
    ],
  },
  'myth-limit': {
    eyebrow: 'The myth', title: 'There\'s a hard limit on what you can borrow',
    sections: [
      { head: 'The reality', items: [
        'With full entitlement there is no VA county loan limit (since 2020)',
        'You can borrow what you qualify for — still $0 down',
        'Limits only come back into play if your entitlement is partially used',
      ]},
    ],
  },
  'myth-pmi': {
    eyebrow: 'The myth', title: 'VA loans have monthly mortgage insurance',
    sections: [
      { head: 'The reality', items: [
        'VA loans have no monthly mortgage insurance — ever',
        'A one-time funding fee takes its place (and it\'s financeable)',
        'That missing monthly line is real savings versus FHA or conventional',
      ]},
      { head: '', items: [], note: 'Pay once instead of every month for years — the core financial edge of the benefit.' },
    ],
  },

  /* ---- ELIGIBILITY ---------------------------------------------------- */
  'elig-active': {
    eyebrow: 'Who qualifies', title: 'Active duty & veterans', compliance: ['va'],
    sections: [
      { head: 'Generally eligible', items: [
        'Wartime service: about 90 days of active duty',
        'Peacetime service: about 181 continuous days',
        'Currently serving: typically eligible after ~90 continuous days',
        'Character of discharge matters — generally other than dishonorable',
      ]},
      { head: '', items: [], note: 'Short enlistments often still count. Exact requirements vary by era — when in doubt, let us check.' },
    ],
  },
  'elig-guard': {
    eyebrow: 'Who qualifies', title: 'Guard & Reserve', compliance: ['va'],
    sections: [
      { head: 'You may qualify', items: [
        'Generally six years of service in the Guard or Reserve',
        'Or 90+ days of active-duty service under federal orders',
        'Many Guard/Reserve members wrongly assume they\'re not eligible',
      ]},
      { head: '', items: [], note: 'If you drilled for years, ask — this is the most overlooked eligible group.' },
    ],
  },
  'elig-spouse': {
    eyebrow: 'Who qualifies', title: 'Surviving spouses', compliance: ['va'],
    sections: [
      { head: 'A benefit that can transfer', items: [
        'Spouses of service members who died in service or from a service-connected disability may be eligible',
        'Generally must not have remarried (some exceptions apply)',
        'The funding fee is typically waived entirely',
        'A dedicated COE confirms eligibility',
      ]},
      { head: '', items: [], note: 'This is one of the most overlooked — and most meaningful — parts of the benefit.' },
    ],
  },
  'elig-coe': {
    eyebrow: 'Who qualifies', title: 'Certificate of Eligibility (COE)',
    sections: [
      { head: 'How you prove it', items: [
        'The COE is the VA\'s confirmation that you have the benefit',
        'We can usually pull it for you in minutes through the lender portal',
        'Have your DD-214 (or a Statement of Service if still serving) handy',
      ]},
      { head: '', items: [], note: 'You don\'t have to figure this out alone — getting the COE is step one and it\'s easy.' },
    ],
  },
  'elig-again': {
    eyebrow: 'Who qualifies', title: 'Using it again', compliance: ['va'],
    sections: [
      { head: 'Restore and reuse', items: [
        'Sold the home and paid off the VA loan? Restore full entitlement and reuse it',
        'A one-time restoration is even available in some cases without selling',
        'Second-tier entitlement can let you keep one VA loan and open another',
      ]},
    ],
  },

  /* ---- VA vs CONVENTIONAL vs FHA ------------------------------------- */
  'compare-loans': {
    eyebrow: 'Compare', title: 'VA vs Conventional vs FHA',
    intro: 'Same borrower, same price. VA usually wins on monthly cost because there is no mortgage insurance — even when the rate looks similar.',
    table: {
      columns: ['VA', 'Conventional', 'FHA'],
      rows: [
        { label: 'Minimum down',       cells: ['<strong>0%</strong>', '3%', '3.5%'] },
        { label: 'Monthly MI',         cells: ['<strong>None</strong>', 'Removable', 'Often life of loan'] },
        { label: 'Upfront cost',       cells: ['Funding fee (one-time, financeable, often waived)', 'None', 'Upfront MIP'] },
        { label: 'Credit flexibility', cells: ['Flexible + residual income', 'Least forgiving', 'More forgiving'] },
        { label: 'Reusable benefit',   cells: ['<strong>Yes</strong>', '—', '—'] },
        { label: 'Best for',           cells: ['Eligible veterans', 'Strong credit', 'Rebuilding credit'] },
      ],
    },
    compliance: ['hypothetical'],
    sections: [
      { head: 'The takeaway', items: [
        'No monthly MI is VA\'s biggest edge — real savings every month',
        'The funding fee is one-time and waived for many disabled veterans',
        'Ask for rate AND APR on every quote',
      ]},
    ],
  },
  'prog-va': {
    eyebrow: 'Loan program', title: 'VA', compliance: ['va'],
    sections: [
      { head: 'Who it fits', items: ['Eligible service members, veterans, and certain spouses · 0% down'] },
      { head: 'Pros', tone: 'pros', items: ['No down payment', 'No monthly mortgage insurance', 'Reusable · assumable · no prepayment penalty'] },
      { head: 'Cons', tone: 'cons', items: ['A one-time funding fee (unless waived)', 'Primary residence only', 'VA appraisal + property standards'] },
    ],
  },
  'prog-conventional': {
    eyebrow: 'Loan program', title: 'Conventional', compliance: ['va'],
    sections: [
      { head: 'Who it fits', items: ['Solid credit, steady documented income · as low as 3% down'] },
      { head: 'Pros', tone: 'pros', items: ['MI comes off at 20% equity', 'Best pricing at strong credit', 'Widest property flexibility'] },
      { head: 'Cons', tone: 'cons', items: ['Down payment required', 'Monthly MI until you reach 20%', 'Least forgiving on credit'] },
    ],
  },
  'prog-fha': {
    eyebrow: 'Loan program', title: 'FHA', compliance: ['va'],
    sections: [
      { head: 'Who it fits', items: ['Rebuilding credit or a higher debt load · 3.5% down'] },
      { head: 'Pros', tone: 'pros', items: ['Lower credit thresholds', 'Higher DTI tolerance', 'Assumable'] },
      { head: 'Cons', tone: 'cons', items: ['Down payment required', 'MI often lasts the life of the loan', 'Upfront premium added to the balance'] },
    ],
  },

  /* ---- CASH TO CLOSE -------------------------------------------------- */
  'cash-nodown': {
    eyebrow: 'Where it comes from', title: 'No down payment',
    sections: [
      { head: 'The rules', items: [
        '$0 down on a primary residence with full entitlement',
        'You\'ll still have some closing costs and prepaids',
        'Reserves usually aren\'t required on a primary residence',
      ]},
      { head: '', items: [], note: 'Zero down doesn\'t mean zero cash — but it\'s often far less than buyers expect.' },
    ],
  },
  'cash-seller': {
    eyebrow: 'Where it comes from', title: 'Seller concessions',
    sections: [
      { head: 'The rules', items: [
        'A seller can pay your normal closing costs — and up to 4% of value in concessions on top',
        'Concessions can cover the funding fee, prepaids, even pay down some debt',
        'It\'s negotiated — ask your agent to ask',
      ]},
      { head: '', items: [], note: 'In a balanced market this is where a VA buyer gets to the table with almost nothing.' },
    ],
  },
  'cash-gift': {
    eyebrow: 'Where it comes from', title: 'Gift funds',
    sections: [
      { head: 'The rules', items: [
        'Gift funds are allowed on VA loans',
        'A gift letter is required — stating it is not a loan',
        'Generally from family; the transfer must be documented',
      ]},
      { head: '', items: [], note: 'Tell your lender before the money moves.' },
    ],
  },
  'cash-credits': {
    eyebrow: 'Where it comes from', title: 'Lender & agent credits',
    sections: [
      { head: 'The rules', items: [
        'A lender credit can cover costs in exchange for a slightly higher rate',
        'An agent may contribute part of their commission if disclosed',
        'Both show up on the closing documents',
      ]},
      { head: '', items: [], note: 'Ask early — credits can\'t be added at the closing table.' },
    ],
  },
  'cash-nonallowable': {
    eyebrow: 'Where it comes from', title: 'Fees you can\'t be charged',
    sections: [
      { head: 'The rules', items: [
        'VA limits certain fees the veteran is allowed to pay ("non-allowables")',
        'Those fees must be covered by the seller, the lender, or a credit',
        'It\'s a built-in protection unique to the VA program',
      ]},
      { head: '', items: [], note: 'You are protected here in ways no other loan protects a buyer.' },
    ],
  },
  'cash-earnest': {
    eyebrow: 'Where it comes from', title: 'Earnest money',
    sections: [
      { head: 'The rules', items: [
        'A good-faith deposit that shows the seller you\'re serious',
        'It\'s applied to your costs at closing — or returned within your contingencies',
        'Personal check or wire only — never cash',
      ]},
    ],
  },

  /* ---- PROPERTY & APPRAISAL ------------------------------------------ */
  'appr-appraisal': {
    eyebrow: 'The property', title: 'The VA appraisal', compliance: ['va'],
    sections: [
      { head: 'What it does', items: [
        'Two jobs: confirm value AND check basic safety and livability',
        'The appraiser is assigned by the VA — not chosen by the lender',
        'We order it early because it can take a little longer',
      ]},
      { head: '', items: [], note: 'It\'s not red tape — it\'s a protection that keeps you from overpaying for a problem home.' },
    ],
  },
  'appr-mpr': {
    eyebrow: 'The property', title: 'Minimum Property Requirements', compliance: ['va'],
    sections: [
      { head: 'Safe, sound, sanitary', items: [
        'The home must be safe, structurally sound, and sanitary',
        'Common flags: peeling paint on pre-1978 homes, roof, exposed wiring, no working systems',
        'Most standard homes pass without issue',
      ]},
    ],
  },
  'appr-nov': {
    eyebrow: 'The property', title: 'Notice of Value (NOV)', compliance: ['va'],
    sections: [
      { head: 'The result', items: [
        'The NOV is the VA\'s official value and any conditions',
        'It may list repairs that must be completed before closing',
        'It sets the maximum loan amount the VA will guarantee',
      ]},
    ],
  },
  'appr-tidewater': {
    eyebrow: 'The property', title: 'Tidewater', compliance: ['va'],
    sections: [
      { head: 'A second chance on value', items: [
        'If value may come in low, the appraiser flags it before finalizing',
        'Your agent and lender get a short window to submit supporting comps',
        'It can prevent a low appraisal from derailing the deal',
      ]},
      { head: '', items: [], note: 'A VA-savvy agent who responds fast to Tidewater is worth their weight in gold.' },
    ],
  },
  'appr-occupancy': {
    eyebrow: 'The property', title: 'Occupancy', compliance: ['va'],
    sections: [
      { head: 'The rules', items: [
        'VA loans are for a primary residence you\'ll live in',
        'You generally must move in within about 60 days',
        'Not for pure investment property — but multi-unit is allowed if you occupy one unit',
      ]},
    ],
  },
  'appr-condo': {
    eyebrow: 'The property', title: 'Condos & what won\'t qualify', compliance: ['va'],
    sections: [
      { head: 'Know before you offer', items: [
        'A condo must be in a VA-approved project (approval can sometimes be requested)',
        'Homes that fail MPRs until repaired need work first',
        'Pure investment properties don\'t qualify',
      ]},
    ],
  },

  /* ---- MEET THE PLAYERS ---------------------------------------------- */
  'role-lender': {
    eyebrow: 'Your team', title: 'Lender / Loan Officer',
    sections: [
      { head: 'What they do', items: ['Structures your VA financing, pulls your COE, guides you to closing'] },
      { head: '', items: [], note: 'We don\'t approve the loan — the underwriter does. We package the file and advocate for it.' },
    ],
  },
  'role-realtor': {
    eyebrow: 'Your team', title: 'Realtor',
    sections: [
      { head: 'What they do', items: ['Finds homes, writes and negotiates your offer, manages deadlines'] },
      { head: '', items: [], note: 'Find one who knows VA. The listing agent works for the seller — yours works for you.' },
    ],
  },
  'role-appraiser': {
    eyebrow: 'Your team', title: 'VA Appraiser',
    sections: [
      { head: 'What they do', items: ['Assigned by the VA — independent of the lender', 'Confirms value and checks the home against MPRs'] },
      { head: '', items: [], note: 'Working for the VA, not the lender — which is exactly why it protects you.' },
    ],
  },
  'role-underwriter': {
    eyebrow: 'Your team', title: 'Underwriter',
    sections: [
      { head: 'What they do', items: ['Makes the actual decision against VA and lender guidelines', 'Weighs credit, income, and residual income'] },
      { head: '', items: [], note: 'They\'re documenting a reason to say yes — not hunting for a no.' },
    ],
  },
  'role-title': {
    eyebrow: 'Your team', title: 'Title Company',
    sections: [
      { head: 'What they do', items: ['Clears ownership and liens, issues title insurance, holds and moves funds', 'Neutral to both sides'] },
      { head: '', items: [], note: 'You can often shop for title — most people never do.' },
    ],
  },
  'role-closer': {
    eyebrow: 'Your team', title: 'Closer',
    sections: [
      { head: 'What they do', items: ['Runs the signing, walks you through the documents, makes sure funds move'] },
      { head: '', items: [], note: 'Budget an hour. Read what you sign and ask about anything unclear.' },
    ],
  },
};

export const MODAL_COUNT = Object.keys(MODALS).length;
