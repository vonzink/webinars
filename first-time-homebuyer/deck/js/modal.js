/* ============================================================================
   MODAL — the one popout. Deep Forest header band, green accent bar.
   Backdrop, fade+scale, close on ✕ / Esc / backdrop, focus trapped + returned.
   ========================================================================= */

import { MODALS } from '../content/modals.js';
import { COMPLIANCE } from '../content/presenters.js';

const FOCUSABLE = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';
let root, panel, closeBtn, headEl, bodyEl, footEl, lastFocused = null, isOpen = false;

export function initModal() {
  root = document.getElementById('modal-root');
  root.innerHTML = `
    <div class="modal-backdrop" data-close></div>
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <button class="modal-close" data-close aria-label="Close">✕</button>
      <div class="modal-head"></div>
      <div class="modal-body"></div>
      <div class="modal-foot" hidden></div>
    </div>`;
  panel = root.querySelector('.modal');
  closeBtn = root.querySelector('.modal-close');
  headEl = root.querySelector('.modal-head');
  bodyEl = root.querySelector('.modal-body');
  footEl = root.querySelector('.modal-foot');

  root.addEventListener('click', e => { if (e.target.hasAttribute('data-close')) closeModal(); });
  document.addEventListener('keydown', e => {
    if (!isOpen) return;
    if (e.key === 'Escape') { e.stopPropagation(); closeModal(); return; }
    if (e.key === 'Tab') trap(e);
  }, true);
}

function trap(e) {
  const nodes = [...panel.querySelectorAll(FOCUSABLE)].filter(n => n.offsetParent !== null);
  if (!nodes.length) return;
  const first = nodes[0], last = nodes[nodes.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

function section(s) {
  const tone = s.tone ? ` data-tone="${s.tone}"` : '';
  const head = s.head ? `<div class="modal-section-head">${s.head}</div>` : '';
  const list = (s.items && s.items.length)
    ? `<ul class="modal-list">${s.items.map(i => `<li>${i}</li>`).join('')}</ul>` : '';
  const note = s.note ? `<div class="modal-note">${s.note}</div>` : '';
  return `<div class="modal-section"${tone}>${head}${list}${note}</div>`;
}

export function openModal(id, opener) {
  const d = MODALS[id];
  if (!d) { console.warn(`[deck] no popout "${id}"`); return; }
  lastFocused = opener || document.activeElement;

  headEl.innerHTML = `
    ${d.eyebrow ? `<div class="modal-eyebrow">${d.eyebrow}</div>` : ''}
    <h2 class="modal-title" id="modal-title">${d.title}</h2>
    <div class="modal-title-bar"></div>`;
  bodyEl.innerHTML = d.sections.map(section).join('');
  bodyEl.scrollTop = 0;

  const lines = (d.compliance || []).map(k => COMPLIANCE[k]).filter(Boolean);
  if (lines.length) { footEl.textContent = lines.join('  '); footEl.hidden = false; }
  else footEl.hidden = true;

  root.classList.add('is-open');
  requestAnimationFrame(() => { root.classList.add('is-visible'); closeBtn.focus(); });
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
  };
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) done();
  else setTimeout(done, 200);
}

export function isModalOpen() { return isOpen; }
