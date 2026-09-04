import {
  DEFAULT_CASH_TO_CLOSE_STATE,
  calculateCashToClose,
  formatMoney,
} from './cash-to-close-math.js';
import { createSurfaceController } from './surface-fit.js';

const BUILDER_WIDTH = 720;
const BUILDER_HEIGHT = 900;

let root;
let shell;
let surface;
let closeButton;
let fitController;
let initialized = false;
let visible = false;
let lastOpener = null;
let onVisibilityChange = () => {};
const state = { ...DEFAULT_CASH_TO_CLOSE_STATE };

const fields = [
  ['purchasePrice', 'Purchase price', '$', ''],
  ['downPaymentPercent', 'Down payment', '', '%'],
  ['closingCostsPercent', 'Closing-cost assumption', '', '%'],
  ['prepaidsPercent', 'Prepaid assumption', '', '%'],
  ['earnestMoney', 'Earnest money paid', '$', ''],
  ['sellerCredits', 'Seller credits', '$', ''],
  ['lenderCredits', 'Lender credits', '$', ''],
];

function inputMarkup([name, label, prefix, suffix]) {
  return `
    <label class="cash-builder-field" for="cash-${name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}">
      <span>${label}</span>
      <span class="cash-builder-input">
        ${prefix ? `<b aria-hidden="true">${prefix}</b>` : ''}
        <input id="cash-${name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}" type="text" inputmode="decimal" autocomplete="off" data-cash-field="${name}">
        ${suffix ? `<b aria-hidden="true">${suffix}</b>` : ''}
      </span>
    </label>`;
}

function markup() {
  return `
    <div class="cash-builder-overlay" data-cash-builder-overlay hidden>
      <section class="cash-builder-shell" data-fit-shell>
        <div class="cash-builder-surface" data-fit-surface role="dialog" aria-modal="true" aria-label="Cash-to-close builder">
          <header class="cash-builder-dragbar" data-cash-dragbar>
            <span class="cash-builder-grip" aria-hidden="true"><i></i><i></i><i></i></span>
            <span>Cash-to-close builder</span>
          </header>
          <div class="cash-builder-body">
            <div class="cash-builder-heading">
              <span class="eyebrow">Teaching estimate</span>
              <h1 id="cash-builder-title">Build the number.</h1>
              <p>Change the assumptions and watch each ingredient move.</p>
            </div>
            <div class="cash-builder-grid">
              <div class="cash-builder-fields">${fields.map(inputMarkup).join('')}</div>
              <section class="cash-builder-result" aria-label="Cash-to-close estimate">
                <p class="cash-builder-result-label">Illustrative cash to close</p>
                <p class="cash-builder-total" data-cash-total aria-live="polite">$0</p>
                <div class="cash-builder-breakdown" data-cash-breakdown></div>
              </section>
            </div>
            <p class="cash-builder-disclosure">Teaching assumptions only. Actual costs, prepaids, credits, and eligibility vary. This is not a quote or commitment to lend.</p>
          </div>
          <footer class="cash-builder-footer">
            <img src="./assets/brand/EQUAL%20HOUSING%20LENDER.png" alt="Equal Housing Lender">
            <p>Mountain State Financial Group, LLC · NMLS# 1314257</p>
          </footer>
          <button class="cash-builder-close" type="button" aria-label="Close cash-to-close calculator">&times;</button>
          <button class="cash-builder-resize" type="button" aria-label="Resize cash-to-close calculator" data-cash-resize></button>
        </div>
      </section>
    </div>`;
}

function render() {
  const result = calculateCashToClose(state);
  root.querySelector('[data-cash-total]').textContent = formatMoney(result.cashToClose);
  const rows = [
    ['Down payment', result.downPayment, 'add'],
    ['Closing costs', result.closingCosts, 'add'],
    ['Prepaids + escrows', result.prepaids, 'add'],
    ['Earnest money', result.earnestMoney, 'subtract'],
    ['Seller credits', result.sellerCredits, 'subtract'],
    ['Lender credits', result.lenderCredits, 'subtract'],
  ];
  root.querySelector('[data-cash-breakdown]').innerHTML = rows
    .map(([label, value, tone]) => `
      <div data-tone="${tone}">
        <span>${tone === 'subtract' ? '−' : '+'} ${label}</span>
        <strong>${formatMoney(value)}</strong>
      </div>`)
    .join('');
}

function focusables() {
  return [...surface.querySelectorAll('button, input, [href], [tabindex]:not([tabindex="-1"])')]
    .filter(element => !element.disabled && element.getClientRects().length > 0);
}

function handleKeydown(event) {
  if (!visible) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    setCashToCloseVisible(false);
    return;
  }
  if (event.key !== 'Tab') return;
  const items = focusables();
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

export function initCashToCloseCalculator(options = {}) {
  if (initialized) {
    if (typeof options.onVisibilityChange === 'function') onVisibilityChange = options.onVisibilityChange;
    return;
  }
  initialized = true;
  onVisibilityChange = typeof options.onVisibilityChange === 'function' ? options.onVisibilityChange : () => {};
  document.body.insertAdjacentHTML('beforeend', markup());
  root = document.querySelector('[data-cash-builder-overlay]');
  shell = root.querySelector('.cash-builder-shell');
  surface = root.querySelector('.cash-builder-surface');
  closeButton = root.querySelector('.cash-builder-close');
  fitController = createSurfaceController({
    viewport: root,
    shell,
    surface,
    getDesignSize: () => ({ width: BUILDER_WIDTH, height: BUILDER_HEIGHT }),
  });

  root.querySelectorAll('[data-cash-field]').forEach(input => {
    const name = input.dataset.cashField;
    input.value = state[name];
    input.addEventListener('input', () => {
      state[name] = input.value;
      render();
    });
  });
  closeButton.addEventListener('click', () => setCashToCloseVisible(false));
  root.addEventListener('pointerdown', event => {
    if (event.target === root) setCashToCloseVisible(false);
  });
  root.querySelector('[data-cash-dragbar]').addEventListener('pointerdown', event => startPointerAction(event, 'drag'));
  root.querySelector('[data-cash-resize]').addEventListener('pointerdown', event => startPointerAction(event, 'resize'));
  document.addEventListener('keydown', handleKeydown);
  render();
}

export function setCashToCloseVisible(nextVisible, opener = null) {
  if (!initialized) initCashToCloseCalculator();
  const next = Boolean(nextVisible);
  if (visible === next) return;
  visible = next;
  if (visible) {
    lastOpener = opener instanceof HTMLElement ? opener : document.activeElement;
    root.hidden = false;
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

export function isCashToCloseVisible() {
  return visible;
}
