import {
  DEFAULT_CALCULATOR_STATE,
  calculatePayment,
  formatMoney,
} from './calculator-math.js';
import { createSurfaceController } from './surface-fit.js';

const CALCULATOR_WIDTH = 560;
const CALCULATOR_COLLAPSED_HEIGHT = 820;
const CALCULATOR_EXPANDED_HEIGHT = 982;

let root;
let panel;
let canvas;
let closeButton;
let resizeHandle;
let dragbar;
let fitController;
let visible = false;
let initialized = false;
let onVisibilityChange = () => {};
let lastOpener = null;
let state = { ...DEFAULT_CALCULATOR_STATE, showMore: false };

const fieldNames = {
  homePrice: 'homePrice',
  downPaymentPercent: 'downPaymentPercent',
  interestRate: 'interestRate',
  propertyTaxAnnual: 'propertyTaxAnnual',
  insuranceAnnual: 'insuranceAnnual',
  hoaMonthly: 'hoaMonthly',
  mortgageInsurancePercent: 'mortgageInsurancePercent',
};

function markup() {
  return `
    <div class="calculator-overlay" data-calculator-overlay hidden>
      <section class="calculator-panel" data-fit-shell>
        <div class="calculator-canvas" data-fit-surface role="dialog" aria-modal="true" aria-labelledby="calculator-title">
          <header class="calculator-dragbar" data-calculator-dragbar>
            <span class="calculator-grip" aria-hidden="true"><i></i><i></i><i></i></span>
            <span class="calculator-drag-label">Mortgage payment calculator</span>
          </header>
          <div class="calculator-scroll">
            <div class="calculator-card">
              <h1 id="calculator-title">Estimate your payment</h1>
              <p class="calculator-disclosure">Indicative only. Not a commitment to lend.</p>

              <div class="calculator-grid">
                ${inputMarkup('homePrice', 'Home price', '$', '', true)}
                ${inputMarkup('downPaymentPercent', 'Down payment', '', '%')}
                ${inputMarkup('interestRate', 'Interest rate', '', '%')}
                <div class="calculator-group calculator-span-two">
                  <span class="calculator-label" id="calculator-term-label">Term</span>
                  <div class="calculator-terms" role="group" aria-labelledby="calculator-term-label">
                    ${[30, 25, 20, 15].map(years => `<button type="button" data-calculator-term="${years}" aria-pressed="false">${years} yr</button>`).join('')}
                  </div>
                </div>
                <p class="calculator-help calculator-span-two" data-calculator-loan-help></p>
              </div>

              <button class="calculator-toggle" type="button" aria-expanded="false" aria-controls="calculator-advanced" data-calculator-toggle>
                <span>Taxes, insurance, HOA &amp; MI</span><span aria-hidden="true">＋</span>
              </button>
              <div class="calculator-grid calculator-advanced" id="calculator-advanced" hidden>
                ${inputMarkup('propertyTaxAnnual', 'Property tax / yr', '$')}
                ${inputMarkup('insuranceAnnual', 'Homeowners insurance / yr', '$')}
                ${inputMarkup('hoaMonthly', 'HOA / mo', '$')}
                ${inputMarkup('mortgageInsurancePercent', 'Mortgage insurance / yr of loan', '', '%')}
              </div>

              <section class="calculator-result" aria-label="Estimated payment breakdown">
                <p class="calculator-result-label">Estimated monthly payment</p>
                <p class="calculator-total" data-calculator-total aria-live="polite">$0</p>
                <div class="calculator-breakdown" data-calculator-breakdown></div><!-- /calculator-breakdown -->
              </section>
            </div>

            <footer class="calculator-footer">
              <img src="./assets/brand/EQUAL%20HOUSING%20LENDER.png" alt="Equal Housing Lender">
              <p>Mountain State Financial Group, LLC · NMLS# 1314257<br>Estimates are for illustration only and not a commitment to lend.</p>
            </footer>
          </div>
          <button class="calculator-close" type="button" aria-label="Close calculator">&times;</button>
          <button class="calculator-resize-handle" type="button" data-calculator-resize aria-label="Resize calculator"></button>
        </div>
      </section>
    </div>`;
}

function inputMarkup(name, label, prefix = '', suffix = '', spanTwo = false) {
  return `
    <label class="calculator-group${spanTwo ? ' calculator-span-two' : ''}" for="calculator-${name}">
      <span class="calculator-label">${label}</span>
      <span class="calculator-field">
        ${prefix ? `<span aria-hidden="true">${prefix}</span>` : ''}
        <input id="calculator-${name}" type="text" inputmode="decimal" autocomplete="off" data-calculator-field="${name}">
        ${suffix ? `<span aria-hidden="true">${suffix}</span>` : ''}
      </span>
    </label>`;
}

function render() {
  const result = calculatePayment(state);
  root.querySelector('[data-calculator-total]').textContent = formatMoney(result.monthlyTotal);
  root.querySelector('[data-calculator-loan-help]').textContent =
    `${formatMoney(result.downPayment)} down · ${formatMoney(result.loanAmount)} estimated loan`;

  const rows = [
    ['Principal & interest', result.principalAndInterest, true],
    ['Property taxes', result.propertyTax, result.propertyTax > 0],
    ['Homeowners insurance', result.insurance, result.insurance > 0],
    ['HOA dues', result.hoa, result.hoa > 0],
    ['Mortgage insurance', result.mortgageInsurance, result.mortgageInsurance > 0],
  ];
  root.querySelector('[data-calculator-breakdown]').innerHTML = rows
    .filter(([, , show]) => show)
    .map(([label, value]) => `<div><span>${label}</span><strong>${formatMoney(value)}</strong></div>`)
    .join('');

  root.querySelectorAll('[data-calculator-term]').forEach(button => {
    const selected = Number(button.dataset.calculatorTerm) === Number(state.termYears);
    button.classList.toggle('is-selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
}

function calculatorDesignSize() {
  return {
    width: CALCULATOR_WIDTH,
    height: state.showMore ? CALCULATOR_EXPANDED_HEIGHT : CALCULATOR_COLLAPSED_HEIGHT,
  };
}

function focusables() {
  return [...panel.querySelectorAll('button:not([hidden]), input:not([hidden]), [href], [tabindex]:not([tabindex="-1"])')]
    .filter(element => !element.disabled && element.getClientRects().length > 0);
}

function closeFromAudience() {
  setCalculatorVisible(false);
}

function handleKeydown(event) {
  if (!visible) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    closeFromAudience();
    return;
  }
  if (event.key !== 'Tab') return;
  const items = focusables();
  if (!items.length) return;
  const first = items[0];
  const last = items.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function startPointerAction(event, mode) {
  if (!visible || event.button !== 0) return;
  if (mode === 'drag' && event.target.closest('button')) return;
  event.preventDefault();
  const start = { x: event.clientX, y: event.clientY, geometry: fitController.getGeometry() };
  const target = event.currentTarget;
  target.setPointerCapture(event.pointerId);

  const move = moveEvent => {
    const dx = moveEvent.clientX - start.x;
    const dy = moveEvent.clientY - start.y;
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

export function initCalculator(options = {}) {
  if (initialized) {
    if (typeof options.onVisibilityChange === 'function') onVisibilityChange = options.onVisibilityChange;
    return;
  }
  initialized = true;
  onVisibilityChange = typeof options.onVisibilityChange === 'function' ? options.onVisibilityChange : () => {};
  document.body.insertAdjacentHTML('beforeend', markup());
  root = document.querySelector('[data-calculator-overlay]');
  panel = root.querySelector('.calculator-panel');
  canvas = panel.querySelector('.calculator-canvas');
  closeButton = root.querySelector('.calculator-close');
  resizeHandle = root.querySelector('[data-calculator-resize]');
  dragbar = root.querySelector('[data-calculator-dragbar]');
  fitController = createSurfaceController({
    viewport: root,
    shell: panel,
    surface: canvas,
    getDesignSize: calculatorDesignSize,
  });

  root.querySelectorAll('[data-calculator-field]').forEach(input => {
    const stateName = fieldNames[input.dataset.calculatorField];
    input.value = state[stateName];
    input.addEventListener('input', () => {
      state[stateName] = input.value;
      render();
    });
  });
  root.querySelectorAll('[data-calculator-term]').forEach(button => {
    button.addEventListener('click', () => {
      state.termYears = Number(button.dataset.calculatorTerm);
      render();
    });
  });
  root.querySelector('[data-calculator-toggle]').addEventListener('click', event => {
    state.showMore = !state.showMore;
    event.currentTarget.setAttribute('aria-expanded', String(state.showMore));
    root.querySelector('#calculator-advanced').hidden = !state.showMore;
    requestAnimationFrame(() => {
      if (visible) fitController.fit();
    });
  });
  closeButton.addEventListener('click', closeFromAudience);
  root.addEventListener('pointerdown', event => {
    if (event.target === root) closeFromAudience();
  });
  dragbar.addEventListener('pointerdown', event => startPointerAction(event, 'drag'));
  resizeHandle.addEventListener('pointerdown', event => startPointerAction(event, 'resize'));
  document.addEventListener('keydown', handleKeydown);
  render();
}

export function setCalculatorVisible(nextVisible, opener = null) {
  if (!initialized) initCalculator();
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

export function isCalculatorVisible() {
  return visible;
}
