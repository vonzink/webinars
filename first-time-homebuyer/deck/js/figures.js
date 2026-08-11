/* ============================================================================
   FIGURES — the two diagrams the deck keeps, both number-free and on-palette.
     paymentBands()   — proportional makeup of a mortgage payment
     processStepper() — the 8 loan-process steps, forest → green
   Squared, banded, no gradients, no emoji.
   ========================================================================= */

export function paymentBands() {
  const segs = [
    { label: 'Principal',          w: 210, fill: 'var(--pay-principal)' },
    { label: 'Interest',           w: 300, fill: 'var(--pay-interest)' },
    { label: 'Taxes',              w: 170, fill: 'var(--pay-taxes)' },
    { label: 'Insurance',          w: 120, fill: 'var(--pay-insurance)' },
    { label: 'Mortgage insurance', w: 110, fill: 'var(--pay-mi)' },
    { label: 'HOA',                w: 90,  fill: 'var(--pay-hoa)' },
  ];
  let x = 0;
  const bars = segs.map(s => { const r =
    `<rect x="${x}" y="0" width="${s.w}" height="120" fill="${s.fill}"/>`; x += s.w; return r; }).join('');
  x = 0;
  const labels = segs.map((s, i) => {
    const cx = x + s.w / 2; const row = i % 2; const y = row ? 210 : 168;
    const out = `
      <line x1="${cx}" y1="128" x2="${cx}" y2="${y - 26}" stroke="#C9D2CC" stroke-width="2"/>
      <rect x="${cx - 8}" y="${y - 20}" width="16" height="16" fill="${s.fill}"/>
      <text x="${cx}" y="${y}" text-anchor="middle" font-family="Montserrat, sans-serif"
            font-weight="700" font-size="22" fill="#404041">${s.label}</text>`;
    x += s.w; return out;
  }).join('');
  return `
  <svg viewBox="0 0 1000 230" role="img"
       aria-label="The parts of a mortgage payment in proportion: principal, interest, taxes, insurance, mortgage insurance, and HOA. No dollar amounts.">
    ${bars}${labels}
  </svg>`;
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

export const FIGURES = { paymentBands, processStepper };
