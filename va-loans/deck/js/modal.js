/* ============================================================================
   MODAL — the one popout. Deep Forest header band, green accent bar.
   Closes on ✕ / Esc / backdrop. Focus trapped + returned.
   The panel is DRAGGABLE (by its header) and RESIZABLE (corner handle).
   Supports bulleted sections and an optional comparison table.
   ========================================================================= */

import { MODALS } from '../content/modals.js';
import { COMPLIANCE } from '../content/presenters.js';
import { mediaById } from '../content/presenter-media.js';

const FOCUSABLE = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';
let root, panel, closeBtn, headEl, bodyEl, footEl, lastFocused = null, isOpen = false;
let activeKind = null;
let pos = { x: 0, y: 0 };   // drag offset from centre

export function initModal() {
  root = document.getElementById('modal-root');
  root.innerHTML = `
    <div class="modal-backdrop" data-close></div>
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <button class="modal-close" data-close aria-label="Close">✕</button>
      <div class="modal-head" data-drag></div>
      <div class="modal-body"></div>
      <div class="modal-foot" hidden></div>
      <div class="modal-resize" aria-hidden="true"></div>
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

  initDrag();
  initResize();
}

/* ---- drag by header ---- */
function initDrag() {
  let dragging = false, sx = 0, sy = 0, ox = 0, oy = 0;
  headEl.addEventListener('pointerdown', e => {
    if (e.target.closest('.modal-close')) return;
    dragging = true; sx = e.clientX; sy = e.clientY; ox = pos.x; oy = pos.y;
    headEl.setPointerCapture(e.pointerId); headEl.style.cursor = 'grabbing';
  });
  headEl.addEventListener('pointermove', e => {
    if (!dragging) return;
    pos.x = ox + (e.clientX - sx); pos.y = oy + (e.clientY - sy);
    applyPos();
  });
  const end = () => { dragging = false; headEl.style.cursor = ''; };
  headEl.addEventListener('pointerup', end);
  headEl.addEventListener('pointercancel', end);
}
function applyPos() { panel.style.transform = `translate(${pos.x}px, ${pos.y}px)`; }

/* ---- resize by corner handle ---- */
function initResize() {
  const handle = root.querySelector('.modal-resize');
  let resizing = false, sx = 0, sy = 0, sw = 0, sh = 0;
  handle.addEventListener('pointerdown', e => {
    resizing = true; sx = e.clientX; sy = e.clientY;
    const r = panel.getBoundingClientRect(); sw = r.width; sh = r.height;
    handle.setPointerCapture(e.pointerId); e.preventDefault();
  });
  handle.addEventListener('pointermove', e => {
    if (!resizing) return;
    panel.style.width = Math.max(520, sw + (e.clientX - sx)) + 'px';
    panel.style.height = Math.max(300, sh + (e.clientY - sy)) + 'px';
  });
  const end = () => { resizing = false; };
  handle.addEventListener('pointerup', end);
  handle.addEventListener('pointercancel', end);
}

function trap(e) {
  const nodes = [...panel.querySelectorAll(FOCUSABLE)].filter(n => n.offsetParent !== null);
  if (!nodes.length) return;
  const first = nodes[0], last = nodes[nodes.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

function renderTable(t) {
  const head = `<tr><th></th>${t.columns.map(c => `<th>${c}</th>`).join('')}</tr>`;
  const rows = t.rows.map(r =>
    `<tr><th scope="row">${r.label}</th>${r.cells.map(c => `<td>${c}</td>`).join('')}</tr>`).join('');
  return `<div class="modal-table-wrap"><table class="modal-table"><thead>${head}</thead><tbody>${rows}</tbody></table></div>`;
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

  let body = '';
  if (d.intro) body += `<p class="modal-intro">${d.intro}</p>`;
  if (d.table) body += renderTable(d.table);
  if (d.sections) body += d.sections.map(section).join('');
  bodyEl.innerHTML = body;
  bodyEl.scrollTop = 0;

  const lines = (d.compliance || []).map(k => COMPLIANCE[k]).filter(Boolean);
  if (lines.length) { footEl.textContent = lines.join('  '); footEl.hidden = false; }
  else footEl.hidden = true;

  /* reset size + position each open */
  pos = { x: 0, y: 0 };
  panel.style.width = ''; panel.style.height = '';
  panel.classList.remove('modal--media');
  panel.classList.toggle('modal--wide', !!d.table);

  root.classList.add('is-open');
  requestAnimationFrame(() => { root.classList.add('is-visible'); applyPos(); closeBtn.focus(); });
  isOpen = true;
  activeKind = 'content';
  document.body.classList.add('modal-open');
}

export function openMedia(id, opener) {
  const item = mediaById(id);
  if (!item) {
    console.warn(`[deck] no presenter media "${id}"`);
    return false;
  }

  lastFocused = opener || document.activeElement;
  headEl.innerHTML = `
    <div class="modal-eyebrow">Presenter graph</div>
    <h2 class="modal-title" id="modal-title">${item.title}</h2>
    <div class="modal-title-bar"></div>`;
  bodyEl.innerHTML = `
    <div class="modal-media-frame">
      <img src="${item.src}" alt="${item.alt}">
      <p class="modal-media-error" hidden>Graph unavailable</p>
    </div>`;
  const image = bodyEl.querySelector('img');
  const error = bodyEl.querySelector('.modal-media-error');
  image.addEventListener('error', () => {
    image.hidden = true;
    error.hidden = false;
  }, { once: true });
  footEl.hidden = true;

  pos = { x: 0, y: 0 };
  panel.style.width = '';
  panel.style.height = '';
  panel.classList.remove('modal--wide');
  panel.classList.add('modal--media');
  root.classList.add('is-open');
  requestAnimationFrame(() => {
    root.classList.add('is-visible');
    applyPos();
    closeBtn.focus();
  });
  isOpen = true;
  activeKind = 'media';
  document.body.classList.add('modal-open');
  return true;
}

export function closeModal() {
  if (!isOpen) return;
  isOpen = false;
  root.classList.remove('is-visible');
  document.body.classList.remove('modal-open');
  const done = () => {
    root.classList.remove('is-open');
    panel.style.transform = '';
    if (lastFocused && document.contains(lastFocused)) lastFocused.focus();
    lastFocused = null;
    activeKind = null;
  };
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) done();
  else setTimeout(done, 200);
}

export function isModalOpen() { return isOpen; }
