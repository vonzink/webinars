/* ============================================================================
   MODAL — the one popout component. All 53 popouts use it.

   Backdrop dims to 60%. Fades and scales 0.96 -> 1.0 over 200ms.
   Closes on ✗, Esc, and backdrop click.
   Focus is trapped while open and RETURNED to the opener on close.
   ========================================================================= */

import { MODALS } from '../content/modals.js';
import { COMPLIANCE } from '../content/presenters.js';
import { FIGURES } from './figures.js';

const FOCUSABLE = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled])',
  'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])',
].join(',');

let root, backdrop, panel, titleEl, subheadEl, bodyEl, footEl, closeBtn;
let lastFocused = null;
let isOpen = false;
let onCloseCallback = null;

export function initModal() {
  root = document.getElementById('modal-root');
  root.innerHTML = `
    <div class="modal-backdrop" data-close></div>
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <button class="modal-close" data-close aria-label="Close">✕</button>
      <div class="modal-head">
        <h2 class="modal-title" id="modal-title"></h2>
        <p class="modal-subhead" hidden></p>
      </div>
      <div class="modal-body"></div>
      <div class="modal-foot" hidden></div>
    </div>`;

  backdrop  = root.querySelector('.modal-backdrop');
  panel     = root.querySelector('.modal');
  titleEl   = root.querySelector('.modal-title');
  subheadEl = root.querySelector('.modal-subhead');
  bodyEl    = root.querySelector('.modal-body');
  footEl    = root.querySelector('.modal-foot');
  closeBtn  = root.querySelector('.modal-close');

  root.addEventListener('click', (e) => {
    if (e.target.hasAttribute('data-close')) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (!isOpen) return;
    if (e.key === 'Escape') { e.stopPropagation(); closeModal(); return; }
    if (e.key === 'Tab') trapFocus(e);
  }, true);
}

function trapFocus(e) {
  const nodes = [...panel.querySelectorAll(FOCUSABLE)].filter(n => n.offsetParent !== null);
  if (!nodes.length) return;
  const first = nodes[0], last = nodes[nodes.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

function renderSection(sec) {
  const tone = sec.tone ? ` data-tone="${sec.tone}"` : '';
  const items = sec.items.map(i => `<li>${i}</li>`).join('');
  const note = sec.note ? `<div class="modal-note">${sec.note}</div>` : '';
  return `
    <div class="modal-section"${tone}>
      <div class="modal-section-head">${sec.head}</div>
      <ul class="modal-list">${items}</ul>
      ${note}
    </div>`;
}

export function openModal(id, opener) {
  const data = MODALS[id];
  if (!data) { console.warn(`[deck] no modal content for "${id}"`); return; }

  lastFocused = opener || document.activeElement;

  titleEl.textContent = data.title;

  if (data.subhead) { subheadEl.textContent = data.subhead; subheadEl.hidden = false; }
  else subheadEl.hidden = true;

  const figure = data.figure && FIGURES[data.figure]
    ? `<div class="modal-figure">${FIGURES[data.figure]()}</div>`
    : '';

  bodyEl.innerHTML = data.sections.map(renderSection).join('') + figure;
  bodyEl.scrollTop = 0;

  /* Compliance is attached from data, never typed per-modal. */
  const lines = (data.compliance || []).map(key => `<p>${COMPLIANCE[key]}</p>`).join('');
  if (lines) { footEl.innerHTML = lines; footEl.hidden = false; }
  else footEl.hidden = true;

  root.classList.add('is-open');
  /* next frame so the transition actually runs */
  requestAnimationFrame(() => {
    root.classList.add('is-visible');
    closeBtn.focus();
  });
  isOpen = true;
  document.body.classList.add('modal-open');
}

export function closeModal() {
  if (!isOpen) return;
  isOpen = false;
  root.classList.remove('is-visible');
  document.body.classList.remove('modal-open');

  const done = () => {
    root.classList.remove('is-open');
    if (lastFocused && document.contains(lastFocused)) lastFocused.focus();
    lastFocused = null;
    if (onCloseCallback) { onCloseCallback(); onCloseCallback = null; }
  };

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) done();
  else setTimeout(done, 200);
}

export function isModalOpen() { return isOpen; }
export function onModalClose(fn) { onCloseCallback = fn; }
