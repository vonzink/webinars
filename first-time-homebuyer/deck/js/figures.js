/* ============================================================================
   FIGURES — the deck's illustrations, as inline SVG.

   Rules that apply to every figure in this file:
     · Banded fills, hard edges. NEVER a soft gradient. The five-band ramp
       echoes the MSFG mark and is what makes this read as MSFG's deck.
     · Semantic colour is locked — principal is the same teal in the payment
       stack and the amortization chart. Use var(--sem-*), not var(--c-*).
     · Never colour alone. Every coded element also carries a label.
     · Comparison figures show a RELATIONSHIP. No axis values that invite a
       viewer to model their own household.
   ========================================================================= */

const SEM = {
  principal: 'var(--sem-principal)',
  interest:  'var(--sem-interest)',
  taxes:     'var(--sem-taxes)',
  insurance: 'var(--sem-insurance)',
  mi:        'var(--sem-mi)',
  hoa:       'var(--sem-hoa)',
};

const BANDS = ['var(--band-1)','var(--band-2)','var(--band-3)','var(--band-4)','var(--band-5)'];

/* ---------------------------------------------------------------------------
   BANDED TRIANGLE MOTIF — section titles, bleeding off the right edge.
   Same geometry as the mark: lime apex, deep teal base, five hard bands.
   ------------------------------------------------------------------------ */
export function triangleMotif() {
  return `
  <svg viewBox="0 0 400 400" fill="none" aria-hidden="true">
    <polygon points="20,380 220,20 256,72"   fill="${BANDS[0]}"/>
    <polygon points="20,380 256,72  292,124" fill="${BANDS[1]}"/>
    <polygon points="20,380 292,124 328,176" fill="${BANDS[2]}"/>
    <polygon points="20,380 328,176 364,228" fill="${BANDS[3]}"/>
    <polygon points="20,380 364,228 400,380" fill="${BANDS[4]}"/>
  </svg>`;
}

/* ---------------------------------------------------------------------------
   BREAKEVEN — two cumulative-cost lines that CROSS.
   Built once. Used on Myth Slide 2, then reused on Mistakes Slide 2 as a
   callback, where the second appearance should feel like recognition.

   Loan B starts higher (points paid up front) and rises more slowly.
   No dollar axis — the crossing IS the lesson.
   ------------------------------------------------------------------------ */
export function breakeven() {
  /* Plot area x 90..820, leaving the right margin for series labels so they
     never collide with the zone labels. Line A: no points, steeper from the
     origin. Line B: 2 points, starts elevated and rises more slowly. */
  const X0 = 90, X1 = 820, YB = 470;
  const aPath = `M ${X0} ${YB} L 272 380 L 455 306 L 637 224 L ${X1} 142`;
  const bPath = `M ${X0} 352 L 272 316 L 455 288 L 637 244 L ${X1} 208`;
  /* Crossing solved from the two lines: x ≈ 558, y ≈ 260 */
  const cx = 558, cy = 260;
  const leftMid = (X0 + cx) / 2, rightMid = (cx + X1) / 2;

  return `
  <svg viewBox="0 0 1120 580" role="img"
       aria-label="Two cumulative cost lines over time. Loan B starts higher because points were paid up front, but rises more slowly. They cross at about five years.">
    <!-- zone fills: left of the crossing, right of the crossing -->
    <rect x="${X0}" y="76" width="${cx - X0}" height="${YB - 76}" fill="var(--c-charcoal)" opacity=".05"/>
    <rect x="${cx}" y="76" width="${X1 - cx}" height="${YB - 76}" fill="var(--fill-accent)" opacity=".10"/>

    <line x1="${X0}" y1="${YB}" x2="${X1}" y2="${YB}" stroke="var(--border-hairline)" stroke-width="3"/>
    <line x1="${X0}" y1="76"  x2="${X0}" y2="${YB}"  stroke="var(--border-hairline)" stroke-width="3"/>

    <!-- zone labels, pinned to the top of each zone -->
    <text x="${leftMid}" y="108" text-anchor="middle" font-size="21" font-weight="700"
          fill="${SEM.interest}">Sold or refinanced —</text>
    <text x="${leftMid}" y="134" text-anchor="middle" font-size="21" font-weight="700"
          fill="${SEM.interest}">the points were wasted</text>
    <text x="${rightMid}" y="108" text-anchor="middle" font-size="21" font-weight="700"
          fill="${SEM.principal}">Stayed —</text>
    <text x="${rightMid}" y="134" text-anchor="middle" font-size="21" font-weight="700"
          fill="${SEM.principal}">the points paid off</text>

    <!-- vertical marker at the crossing -->
    <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${YB}"
          stroke="var(--fill-accent)" stroke-width="3" stroke-dasharray="8 8"/>

    <path d="${aPath}" fill="none" stroke="${SEM.interest}" stroke-width="7"
          stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${bPath}" fill="none" stroke="${SEM.principal}" stroke-width="7"
          stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="14 9"/>

    <circle cx="${cx}" cy="${cy}" r="13" fill="var(--fill-accent)"/>
    <circle cx="${cx}" cy="${cy}" r="13" fill="none" stroke="var(--c-white)" stroke-width="4"/>

    <!-- series labels sit in the right margin, at each line's end.
         Dash pattern is repeated in the swatch so the series are told apart
         by shape as well as colour. -->
    <line x1="${X1 + 8}" y1="142" x2="${X1 + 40}" y2="142"
          stroke="${SEM.interest}" stroke-width="7" stroke-linecap="round"/>
    <text x="${X1 + 48}" y="136" font-size="22" font-weight="700" fill="${SEM.interest}">Loan A</text>
    <text x="${X1 + 48}" y="160" font-size="19" fill="var(--c-gray-mid)">no points</text>

    <line x1="${X1 + 8}" y1="208" x2="${X1 + 40}" y2="208"
          stroke="${SEM.principal}" stroke-width="7" stroke-linecap="round" stroke-dasharray="12 7"/>
    <text x="${X1 + 48}" y="202" font-size="22" font-weight="700" fill="${SEM.principal}">Loan B</text>
    <text x="${X1 + 48}" y="226" font-size="19" fill="var(--c-gray-mid)">2 points</text>

    <!-- time axis, labelled in words -->
    <text x="${X0}" y="502" font-size="20" fill="var(--c-gray-mid)">Move in</text>
    <text x="455"   y="502" text-anchor="middle" font-size="20" fill="var(--c-gray-mid)">3 years</text>
    <text x="${X1}" y="502" text-anchor="end" font-size="20" fill="var(--c-gray-mid)">Long term</text>

    <!-- breakeven callout -->
    <text x="${cx}" y="544" text-anchor="middle" font-size="26" font-weight="800"
          fill="var(--c-deep-teal)">Breakeven: about 5 years</text>
    <text x="${cx}" y="570" text-anchor="middle" font-size="19"
          fill="var(--c-gray-mid)">Cost of the points ÷ the monthly saving</text>

    <!-- y axis meaning, stated not numbered -->
    <text x="66" y="273" font-size="19" fill="var(--c-gray-mid)"
          transform="rotate(-90 66 273)" text-anchor="middle">Total cost paid so far</text>
  </svg>`;
}

/* ---------------------------------------------------------------------------
   RENT vs FIXED PRINCIPAL-AND-INTEREST — Budget Slide 1.
   Rent STEPS upward at each renewal. P&I holds FLAT. The contrast between
   the stepping line and the flat line is the whole slide.
   The flat line is principal and interest ONLY — labelled as such on-figure,
   because implying the total payment is fixed is the classic error.
   ------------------------------------------------------------------------ */
export function rentVsFixed() {
  return `
  <svg viewBox="0 0 1000 520" role="img"
       aria-label="Average rent steps upward at each renewal while a fixed principal-and-interest payment holds flat. Home values trend gradually upward. Equity grows beneath.">
    <line x1="80" y1="360" x2="940" y2="360" stroke="var(--border-hairline)" stroke-width="3"/>

    <!-- home values — banded, generally rising, longer horizon -->
    <path d="M 80 300 L 366 268 L 653 226 L 940 176"
          fill="none" stroke="${BANDS[2]}" stroke-width="6" stroke-linecap="round" opacity=".85"/>
    <text x="940" y="160" text-anchor="end" font-size="22" font-weight="700"
          fill="${BANDS[2]}">Home values</text>

    <!-- average rent — steps up at each renewal -->
    <path d="M 80 246 L 223 246 L 223 212 L 366 212 L 366 178 L 510 178
             L 510 144 L 653 144 L 653 110 L 796 110 L 796 82 L 940 82"
          fill="none" stroke="${SEM.interest}" stroke-width="7"
          stroke-linejoin="round" stroke-linecap="round"/>
    <text x="940" y="66" text-anchor="end" font-size="23" font-weight="700"
          fill="${SEM.interest}">Average rent</text>

    <!-- fixed principal and interest — FLAT -->
    <line x1="80" y1="322" x2="940" y2="322"
          stroke="${SEM.principal}" stroke-width="8" stroke-linecap="round"/>
    <text x="940" y="348" text-anchor="end" font-size="23" font-weight="700"
          fill="${SEM.principal}">Fixed principal &amp; interest</text>

    <!-- equity bar, growing along the same timeline, banded -->
    <text x="80" y="410" font-size="20" font-weight="700" fill="var(--c-deep-teal)">Equity</text>
    <rect x="80"  y="424" width="143" height="34" fill="${BANDS[0]}"/>
    <rect x="223" y="424" width="143" height="34" fill="${BANDS[1]}"/>
    <rect x="366" y="424" width="144" height="34" fill="${BANDS[2]}"/>
    <rect x="510" y="424" width="143" height="34" fill="${BANDS[3]}"/>
    <rect x="653" y="424" width="287" height="34" fill="${BANDS[4]}"/>
    <text x="944" y="448" text-anchor="end" font-size="19" fill="var(--c-white)"
          font-weight="700">compounds</text>

    <!-- timeline, labelled in words -->
    <text x="80"  y="392" font-size="21" fill="var(--c-gray-mid)">Today</text>
    <text x="510" y="392" text-anchor="middle" font-size="21" fill="var(--c-gray-mid)">A few years</text>
    <text x="940" y="392" text-anchor="end" font-size="21" fill="var(--c-gray-mid)">Later</text>

    <text x="80" y="500" font-size="18" fill="var(--c-gray-mid)">
      Principal &amp; interest only — taxes, insurance, and HOA still move.
    </text>
  </svg>`;
}

/* ---------------------------------------------------------------------------
   PAYMENT STACK — Budget Slide 2. The deck's signature graphic.
   A horizontal banded stack echoing the logo's five bands.
   NO DOLLAR FIGURES. Segments are proportional and unlabelled by amount.
   ------------------------------------------------------------------------ */
export function paymentStack() {
  const segs = [
    { label: 'Principal',          w: 210, fill: SEM.principal, on: 'light' },
    { label: 'Interest',           w: 300, fill: SEM.interest,  on: 'light' },
    { label: 'Taxes',              w: 170, fill: SEM.taxes,     on: 'light' },
    { label: 'Insurance',          w: 120, fill: SEM.insurance, on: 'light' },
    { label: 'Mortgage insurance', w: 110, fill: SEM.mi,        on: 'dark'  },
    { label: 'HOA',                w: 70,  fill: SEM.hoa,       on: 'light' },
  ];
  let x = 40;
  const bars = segs.map(s => {
    const r = `<rect x="${x}" y="40" width="${s.w}" height="120" fill="${s.fill}"/>`;
    x += s.w;
    return r;
  }).join('');

  /* Labels sit BELOW with leader lines — the segments are too narrow to
     letter inside, and shrinking type below the floor is not an option. */
  x = 40;
  const labels = segs.map((s, i) => {
    const cxc = x + s.w / 2;
    const row = i % 2;             /* two rows so long labels don't collide */
    const y = row === 0 ? 200 : 246;
    const out = `
      <line x1="${cxc}" y1="164" x2="${cxc}" y2="${y - 22}"
            stroke="var(--border-hairline)" stroke-width="2"/>
      <rect x="${cxc - 7}" y="${y - 34}" width="14" height="14" fill="${s.fill}"/>
      <text x="${cxc}" y="${y}" text-anchor="middle" font-size="21" font-weight="700"
            fill="var(--c-gray-dark)">${s.label}</text>`;
    x += s.w;
    return out;
  }).join('');

  return `
  <svg viewBox="0 0 1020 280" role="img"
       aria-label="A horizontal stack showing the parts of a mortgage payment in proportion: principal, interest, taxes, insurance, mortgage insurance, and HOA. No dollar amounts.">
    ${bars}
    ${labels}
  </svg>`;
}

/* ---------------------------------------------------------------------------
   BUDGET WATERFALL — Budget Slide 3.
   Each block visibly narrower than the one above. The funnel IS the message.
   Disposable Income lands last and takes the lime accent.
   ------------------------------------------------------------------------ */
export function budgetWaterfall() {
  const steps = [
    { icon: '💵', label: 'Income',            w: 700, fill: BANDS[4], text: 'var(--c-white)' },
    { icon: '🏠', label: 'Housing payment',   w: 580, fill: BANDS[3], text: 'var(--c-white)' },
    { icon: '🛒', label: 'Living expenses',   w: 460, fill: BANDS[2], text: 'var(--c-white)' },
    { icon: '🛟', label: 'Emergency savings', w: 340, fill: BANDS[1], text: 'var(--c-white)' },
    { icon: '✨', label: 'Disposable income', w: 230, fill: BANDS[0], text: 'var(--c-deep-teal)' },
  ];
  let y = 20;
  const blocks = steps.map((s, i) => {
    const x = (760 - s.w) / 2;
    const out = `
      <g class="waterfall-step" data-step="${i}">
        <rect x="${x}" y="${y}" width="${s.w}" height="74" fill="${s.fill}"/>
        <text x="${x + 22}" y="${y + 48}" font-size="30">${s.icon}</text>
        <text x="${x + 68}" y="${y + 47}" font-size="25" font-weight="700"
              fill="${s.text}">${s.label}</text>
      </g>
      ${i < steps.length - 1 ? `
      <path d="M 380 ${y + 78} l 0 12 M 372 ${y + 84} l 8 8 l 8 -8"
            stroke="var(--c-gray-mid)" stroke-width="3" fill="none"
            stroke-linecap="round" stroke-linejoin="round"/>` : ''}`;
    y += 98;
    return out;
  }).join('');

  return `
  <svg viewBox="0 0 760 510" role="img"
       aria-label="A funnel from income down through housing payment, living expenses, and emergency savings to disposable income. Each step is narrower than the one above.">
    ${blocks}
  </svg>`;
}

/* ---------------------------------------------------------------------------
   CASH TO CLOSE — Programs Slide 3.
   Two stacked bars. The second is visibly MUCH longer. The length difference
   is the entire point. Both totals carry the hypothetical label on-slide.
   Component line items are proportional, not itemised in dollars, so it reads
   as a relationship and not as somebody's worksheet.
   ------------------------------------------------------------------------ */
export function cashToClose() {
  const bar1 = [
    { label: 'Lender fees',        w: 96,  fill: SEM.interest },
    { label: 'Appraisal & credit', w: 62,  fill: 'var(--c-gray-dark)' },
    { label: 'Title & settlement', w: 84,  fill: SEM.interest },
    { label: 'Recording',          w: 48,  fill: 'var(--c-gray-dark)' },
  ];
  const bar2 = [
    { label: 'Down payment',  w: 330, fill: SEM.principal },
    { label: 'Closing costs', w: 290, fill: SEM.interest  },
    { label: 'Prepaids',      w: 120, fill: SEM.taxes     },
    { label: 'Escrows',       w: 96,  fill: BANDS[3]      },
    { label: 'Reserves',      w: 74,  fill: BANDS[2]      },
  ];

  const draw = (segs, y, x0) => {
    let x = x0;
    return segs.map(s => {
      const r = `
        <rect x="${x}" y="${y}" width="${s.w}" height="72" fill="${s.fill}"/>
        ${s.w > 78 ? `<text x="${x + s.w / 2}" y="${y + 44}" text-anchor="middle"
              font-size="19" font-weight="700" fill="var(--c-white)">${s.label}</text>` : ''}`;
      x += s.w;
      return r;
    }).join('');
  };

  const b1w = bar1.reduce((a, s) => a + s.w, 0);
  const b2w = bar2.reduce((a, s) => a + s.w, 0);

  return `
  <svg viewBox="0 0 1060 400" role="img"
       aria-label="Two stacked bars. Closing costs is a short bar. Cash to close is a much longer bar containing the down payment, closing costs, prepaid items, escrows, and reserves, minus credits.">
    <!-- Bar 1 — CLOSING COSTS -->
    <text x="40" y="34" font-size="23" font-weight="800" fill="var(--c-deep-teal)">CLOSING COSTS</text>
    <text x="40" y="58" font-size="18" fill="var(--c-gray-mid)">What you pay to get the loan</text>
    ${draw(bar1, 72, 40)}
    <text x="${40 + b1w + 18}" y="118" font-size="26" font-weight="800"
          fill="${SEM.interest}">this much</text>

    <!-- Bar 2 — CASH TO CLOSE -->
    <text x="40" y="212" font-size="23" font-weight="800" fill="var(--c-deep-teal)">CASH TO CLOSE</text>
    <text x="40" y="236" font-size="18" fill="var(--c-gray-mid)">What you actually bring to the table</text>
    ${draw(bar2, 250, 40)}

    <!-- credits deduct, shown as a lime deduction bar -->
    <rect x="${40 + b2w - 150}" y="250" width="150" height="72"
          fill="var(--fill-accent)" opacity=".92"/>
    <text x="${40 + b2w - 75}" y="294" text-anchor="middle" font-size="18" font-weight="800"
          fill="var(--text-on-accent)">− credits</text>

    <text x="40" y="368" font-size="26" font-weight="800" fill="${SEM.principal}">
      Much further apart than you'd think.
    </text>
  </svg>`;
}

/* ---------------------------------------------------------------------------
   TRIBUTARIES — Programs Slide 2.
   Six tributaries flowing into one channel labelled Cash to Close.
   The banded-triangle language applied as flow bands.
   ------------------------------------------------------------------------ */
export function tributaries() {
  const labels = ['Savings','Gift funds','Seller credits','Assistance','Buydowns','Agent credits'];
  const streams = labels.map((label, i) => {
    const y = 30 + i * 62;
    const fill = BANDS[Math.min(i, 4)];
    return `
      <path d="M 20 ${y} L 300 ${y} C 400 ${y}, 430 ${y + (200 - y) * 0.5}, 520 190
               L 520 214 C 430 214, 400 ${y + 24 + (200 - y) * 0.5}, 300 ${y + 24}
               L 20 ${y + 24} Z"
            fill="${fill}" opacity=".9"/>
      <text x="24" y="${y - 8}" font-size="19" font-weight="700"
            fill="var(--c-gray-dark)">${label}</text>`;
  }).join('');

  return `
  <svg viewBox="0 0 900 440" role="img"
       aria-label="Six tributaries — savings, gift funds, seller credits, down payment assistance, buydowns, and agent credits — flowing into a single channel labelled cash to close.">
    ${streams}
    <rect x="520" y="176" width="330" height="52" fill="var(--c-deep-teal)"/>
    <text x="685" y="211" text-anchor="middle" font-size="26" font-weight="800"
          fill="var(--c-white)">CASH TO CLOSE</text>
    <text x="685" y="256" text-anchor="middle" font-size="20"
          fill="var(--c-gray-mid)">Most buyers use more than one.</text>
  </svg>`;
}

/* ---------------------------------------------------------------------------
   PROCESS TIMELINE — Process Slide 2.
   Eight connected steps. Progress bands deepen from lime at the start to
   deep teal at the end, mirroring the logo.
   Step naming must match the MSFG website exactly — see placeholder 9.
   ------------------------------------------------------------------------ */
export function processTimeline(steps) {
  const n = steps.length;
  const w = 1420, x0 = 20, seg = (w - x0 * 2) / n;
  const ramp = i => {
    /* five bands stretched across eight steps */
    const idx = Math.min(4, Math.floor((i / (n - 1)) * 5));
    return BANDS[idx];
  };
  return `
  <svg viewBox="0 0 1460 190" role="img"
       aria-label="An eight-step timeline from pre-approval through application, processing, underwriting, conditional approval, clear to close, closed, and funded.">
    ${steps.map((s, i) => {
      const x = x0 + i * seg;
      return `
      <g>
        <rect x="${x}" y="46" width="${seg - 8}" height="56" fill="${ramp(i)}"/>
        <text x="${x + (seg - 8) / 2}" y="82" text-anchor="middle"
              font-size="${s.label.length > 18 ? 17 : 19}" font-weight="700"
              fill="${i < 3 ? 'var(--c-deep-teal)' : 'var(--c-white)'}">${s.label}</text>
        <text x="${x + (seg - 8) / 2}" y="132" text-anchor="middle" font-size="15"
              fill="var(--c-gray-mid)">${s.time}</text>
      </g>`;
    }).join('')}
  </svg>`;
}

/* ---------------------------------------------------------------------------
   AMORTIZATION — inside the amortization modal.
   Two-band area chart: interest shrinking, principal growing, crossing
   partway through. NO AXIS VALUES.
   ------------------------------------------------------------------------ */
export function amortization() {
  return `
  <svg viewBox="0 0 900 340" role="img"
       aria-label="A two-band area chart. Interest starts as most of the payment and shrinks; principal starts small and grows. They cross partway through the loan term.">
    <!-- principal grows: fills from the bottom -->
    <path d="M 60 300 L 840 60 L 840 300 Z" fill="${SEM.principal}"/>
    <!-- interest shrinks: fills from the top -->
    <path d="M 60 300 L 840 60 L 840 40 L 60 40 Z" fill="${SEM.interest}"/>

    <line x1="60" y1="300" x2="840" y2="300" stroke="var(--border-hairline)" stroke-width="3"/>

    <text x="150" y="96"  font-size="24" font-weight="800" fill="var(--c-white)">Interest</text>
    <text x="640" y="266" font-size="24" font-weight="800" fill="var(--c-white)">Principal</text>

    <text x="60"  y="330" font-size="17" fill="var(--c-gray-mid)">First payment</text>
    <text x="840" y="330" text-anchor="end" font-size="17" fill="var(--c-gray-mid)">Last payment</text>
    <text x="450" y="330" text-anchor="middle" font-size="17" fill="var(--c-gray-mid)">
      The crossover takes many years
    </text>
  </svg>`;
}

export const FIGURES = {
  triangleMotif,
  breakeven,
  rentVsFixed,
  paymentStack,
  budgetWaterfall,
  cashToClose,
  tributaries,
  processTimeline,
  amortization,
};
