/* ============================================================================
   FIGURES — the two diagrams the deck keeps, both number-free and on-palette.
     paymentBands()   — proportional makeup of a mortgage payment
     processStepper() — the 8 loan-process steps, forest → green
   Squared, banded, no gradients, no emoji.
   ========================================================================= */

export const PAY_SEGMENTS = [
  { label: 'Principal',          w: 21, fill: 'var(--pay-principal)' },
  { label: 'Interest',           w: 30, fill: 'var(--pay-interest)' },
  { label: 'Taxes',              w: 17, fill: 'var(--pay-taxes)' },
  { label: 'Insurance',          w: 12, fill: 'var(--pay-insurance)' },
  { label: 'Mortgage insurance', w: 11, fill: 'var(--pay-mi)' },
  { label: 'HOA',                w: 9,  fill: 'var(--pay-hoa)' },
];

/* Clean stacked bar only — no leader lines, no overlap. The legend is rendered
   separately as HTML chips (see the payment layout in deck.js). */
export function paymentBands() {
  const total = PAY_SEGMENTS.reduce((a, s) => a + s.w, 0);
  let x = 0;
  const bars = PAY_SEGMENTS.map(s => {
    const w = (s.w / total) * 1000;
    const r = `<rect x="${x}" y="0" width="${w}" height="100" fill="${s.fill}"/>`;
    x += w; return r;
  }).join('');
  return `
  <svg viewBox="0 0 1000 100" preserveAspectRatio="none" role="img"
       aria-label="The parts of a mortgage payment in proportion: principal, interest, taxes, insurance, mortgage insurance, and HOA. No dollar amounts.">
    ${bars}
  </svg>`;
}

/* Legend chips as HTML — swatch + label, evenly laid out, no collision. */
export function paymentLegend() {
  return `<div class="pay-legend">` + PAY_SEGMENTS.map(s =>
    `<div class="pay-chip"><span class="pay-sw" style="background:${s.fill}"></span>${s.label}</div>`
  ).join('') + `</div>`;
}

export function processStepper(steps) {
  const n = steps.length;
  const W = 1760, x0 = 130, gap = (W - x0 * 2) / (n - 1);
  const ramp = i => {
    const idx = Math.min(4, Math.round((i / (n - 1)) * 4));
    return ['var(--band-1)','var(--band-2)','var(--band-3)','var(--band-4)','var(--band-5)'][idx];
  };
  const line = `<line x1="${x0}" y1="70" x2="${W - x0}" y2="70" stroke="rgba(255,255,255,0.22)" stroke-width="4"/>`;
  const nodes = steps.map((s, i) => {
    const cx = x0 + i * gap; const fill = ramp(i);
    return `
      <line x1="${cx}" y1="70" x2="${cx}" y2="70" />
      <circle cx="${cx}" cy="70" r="26" fill="${fill}" stroke="#0C3335" stroke-width="4"/>
      <circle cx="${cx}" cy="70" r="9" fill="#0C3335"/>
      <text x="${cx}" y="150" text-anchor="middle" font-family="Montserrat, sans-serif"
            font-weight="800" font-size="${s.label.length > 14 ? 22 : 26}" fill="#FFFFFF">${s.label}</text>
      <text x="${cx}" y="188" text-anchor="middle" font-family="'Open Sans', sans-serif"
            font-size="21" fill="rgba(255,255,255,0.62)">${s.note}</text>`;
  }).join('');
  return `
  <svg viewBox="0 0 1760 210" role="img"
       aria-label="Eight loan-process steps from pre-approval to funded.">
    ${line}${nodes}
  </svg>`;
}

export const FIGURES = { paymentBands, paymentLegend, processStepper };
