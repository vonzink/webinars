/* ============================================================================
   2-1 BUYDOWN CALCULATOR — a focused companion to the mortgage calculator.
   Reuses the .calculator-* visual language; its own DOM root + state so the two
   never collide. A 2-1 buydown lowers the rate 2% in year one, 1% in year two,
   then settles at the note rate. The cost is the sum of those savings, usually
   funded upfront (seller or builder) and held in escrow.
   ========================================================================= */
import { parseNonNegative, formatMoney } from './calculator-math.js';
import { createSurfaceController } from './surface-fit.js';

const WIDTH = 560;
const HEIGHT = 726;

let root, panel, canvas, closeButton, resizeHandle, dragbar, fitController;
let visible = false, initialized = false, lastOpener = null;
let onVisibilityChange = () => {};
let state = { loanAmount: 436_500, noteRate: 6.375, termYears: 30 };

const fields = { loanAmount: 'loanAmount', noteRate: 'noteRate' };

function pi(loan, ratePct, termYears) {
  const n = termYears * 12;
  const r = ratePct / 100 / 12;
  if (loan <= 0 || n <= 0) return 0;
  return r === 0 ? loan / n : loan * r * (1 + r) ** n / ((1 + r) ** n - 1);
}

function compute() {
  const loan = parseNonNegative(state.loanAmount);
  const note = parseNonNegative(state.noteRate);
  const term = parseNonNegative(state.termYears) || 30;
  const base = pi(loan, note, term);
  const y1 = pi(loan, Math.max(0, note - 2), term);
  const y2 = pi(loan, Math.max(0, note - 1), term);
  const save1 = Math.max(0, base - y1);
  const save2 = Math.max(0, base - y2);
  return { note, base, y1, y2, save1, save2, totalCost: (save1 + save2) * 12 };
}

function inputMarkup(name, label, prefix = '', suffix = '') {
  return `
    <label class="calculator-group calculator-span-two" for="buydown-${name}">
      <span class="calculator-label">${label}</span>
      <span class="calculator-field">
        ${prefix ? `<span aria-hidden="true">${prefix}</span>` : ''}
        <input id="buydown-${name}" type="text" inputmode="decimal" autocomplete="off" data-buydown-field="${name}">
        ${suffix ? `<span aria-hidden="true">${suffix}</span>` : ''}
      </span>
    </label>`;
}

function markup() {
  return `
    <div class="calculator-overlay" data-buydown-overlay hidden>
      <section class="calculator-panel" data-fit-shell>
        <div class="calculator-canvas" data-fit-surface role="dialog" aria-modal="true" aria-labelledby="buydown-title">
          <header class="calculator-dragbar" data-buydown-dragbar>
            <span class="calculator-grip" aria-hidden="true"><i></i><i></i><i></i></span>
            <span class="calculator-drag-label">2-1 Buydown calculator</span>
          </header>
          <div class="calculator-scroll">
            <div class="calculator-card">
              <h1 id="buydown-title">A 2-1 buydown</h1>
              <p class="calculator-disclosure">Illustrative only. Not a commitment to lend.</p>

              <div class="calculator-grid">
                ${inputMarkup('loanAmount', 'Loan amount', '$')}
                ${inputMarkup('noteRate', 'Note (final) rate', '', '%')}
                <div class="calculator-group calculator-span-two">
                  <span class="calculator-label" id="buydown-term-label">Term</span>
                  <div class="calculator-terms" role="group" aria-labelledby="buydown-term-label">
                    ${[30, 25, 20, 15].map(y => `<button type="button" data-buydown-term="${y}" aria-pressed="false">${y} yr</button>`).join('')}
                  </div>
                </div>
              </div>

              <section class="calculator-result" aria-label="Buydown breakdown">
                <p class="calculator-result-label" data-buydown-headline>Year 1 payment · 2% below your rate</p>
                <p class="calculator-total" data-buydown-total aria-live="polite">$0</p>
                <div class="calculator-breakdown" data-buydown-breakdown></div>
              </section>

              <p class="calculator-help" style="margin-top:14px" data-buydown-note></p>
            </div>

            <footer class="calculator-footer">
              <img src="./assets/brand/EQUAL%20HOUSING%20LENDER.png" alt="Equal Housing Lender">
              <p>Mountain State Financial Group, LLC · NMLS# 1314257<br>Estimates are for illustration only and not a commitment to lend.</p>
            </footer>
          </div>
          <button class="calculator-close" type="button" aria-label="Close buydown calculator">&times;</button>
          <button class="calculator-resize-handle" type="button" data-buydown-resize aria-label="Resize calculator"></button>
        </div>
      </section>
    </div>`;
}

function render() {
  const r = compute();
  root.querySelector('[data-buydown-total]').textContent = formatMoney(r.y1);
  root.querySelector('[data-buydown-breakdown]').innerHTML = [
    ['Year 2 payment · 1% below', formatMoney(r.y2)],
    [`Year 3+ payment · your ${r.note}% rate`, formatMoney(r.base)],
    ['Total buydown cost', formatMoney(r.totalCost)],
  ].map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join('');
  root.querySelector('[data-buydown-note]').textContent =
    `You save ${formatMoney(r.save1)}/mo in year one and ${formatMoney(r.save2)}/mo in year two. The ${formatMoney(r.totalCost)} cost is usually funded upfront — often by the seller or builder — and held in escrow.`;
  root.querySelectorAll('[data-buydown-term]').forEach(button => {
    const selected = Number(button.dataset.buydownTerm) === Number(state.termYears);
    button.classList.toggle('is-selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
}

function designSize() { return { width: WIDTH, height: HEIGHT }; }

function focusables() {
  return [...panel.querySelectorAll('button:not([hidden]), input:not([hidden]), [href], [tabindex]:not([tabindex="-1"])')]
    .filter(el => !el.disabled && el.getClientRects().length > 0);
}

function handleKeydown(event) {
  if (!visible) return;
  if (event.key === 'Escape') { event.preventDefault(); setBuydownVisible(false); return; }
  if (event.key !== 'Tab') return;
  const items = focusables();
  if (!items.length) return;
  const first = items[0], last = items.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}

function startPointerAction(event, mode) {
  if (!visible || event.button !== 0) return;
  if (mode === 'drag' && event.target.closest('button')) return;
  event.preventDefault();
  const start = { x: event.clientX, y: event.clientY, geometry: fitController.getGeometry() };
  const target = event.currentTarget;
  target.setPointerCapture(event.pointerId);
  const move = e => {
    const dx = e.clientX - start.x, dy = e.clientY - start.y;
    if (mode === 'drag') fitController.moveFrom(start.geometry, dx, dy);
    else fitController.resizeFrom(start.geometry, dx, dy);
  };
  const end = () => {
    target.removeEventListener('pointermove', move);
    target.removeEventListener('pointerup', end);
    target.removeEventListener('pointercancel', end);
  };
  target.addEventListener('pointermove', move);
  target.addEventListener('pointerup', end);
  target.addEventListener('pointercancel', end);
}

export function initBuydown(options = {}) {
  if (initialized) {
    if (typeof options.onVisibilityChange === 'function') onVisibilityChange = options.onVisibilityChange;
    return;
  }
  initialized = true;
  onVisibilityChange = typeof options.onVisibilityChange === 'function' ? options.onVisibilityChange : () => {};
  document.body.insertAdjacentHTML('beforeend', markup());
  root = document.querySelector('[data-buydown-overlay]');
  panel = root.querySelector('.calculator-panel');
  canvas = panel.querySelector('.calculator-canvas');
  closeButton = root.querySelector('.calculator-close');
  resizeHandle = root.querySelector('[data-buydown-resize]');
  dragbar = root.querySelector('[data-buydown-dragbar]');
  fitController = createSurfaceController({ viewport: root, shell: panel, surface: canvas, getDesignSize: designSize });

  root.querySelectorAll('[data-buydown-field]').forEach(input => {
    const key = fields[input.dataset.buydownField];
    input.value = state[key];
    input.addEventListener('input', () => { state[key] = input.value; render(); });
  });
  root.querySelectorAll('[data-buydown-term]').forEach(button => {
    button.addEventListener('click', () => { state.termYears = Number(button.dataset.buydownTerm); render(); });
  });
  closeButton.addEventListener('click', () => setBuydownVisible(false));
  root.addEventListener('pointerdown', event => { if (event.target === root) setBuydownVisible(false); });
  dragbar.addEventListener('pointerdown', event => startPointerAction(event, 'drag'));
  resizeHandle.addEventListener('pointerdown', event => startPointerAction(event, 'resize'));
  document.addEventListener('keydown', handleKeydown);
  render();
}

export function setBuydownVisible(nextVisible, opener = null) {
  if (!initialized) initBuydown();
  const next = Boolean(nextVisible);
  if (next === visible) return;
  visible = next;
  if (visible) {
    lastOpener = opener instanceof HTMLElement ? opener : document.activeElement;
    root.hidden = false;
    render();
    fitController.reset();
    fitController.setActive(true);
    fitController.fit();
    closeButton.focus({ preventScroll: true });
  } else {
    fitController.setActive(false);
    root.hidden = true;
    if (lastOpener instanceof HTMLElement && lastOpener.isConnected) lastOpener.focus({ preventScroll: true });
    lastOpener = null;
  }
  onVisibilityChange(visible);
}

export function isBuydownVisible() { return visible; }
