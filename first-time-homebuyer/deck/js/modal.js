/* ============================================================================
   MODAL — educational popouts and presenter graphics.
   Closes on ✕ / Esc / backdrop. Focus trapped + returned.
   The complete authored surface is DRAGGABLE and uniformly RESIZABLE.
   Supports bulleted sections and an optional comparison table.
   ========================================================================= */

import { MODALS } from '../content/modals.js';
import { COMPLIANCE } from '../content/presenters.js';
import { mediaById } from '../content/presenter-media.js';
import { createSurfaceController } from './surface-fit.js';

const FOCUSABLE = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';
const CONTENT_WIDTH = 1200;
const WIDE_CONTENT_WIDTH = 1500;
const LEGACY_MEDIA_SIZE = Object.freeze({ width: 1600, height: 900 });
const twoFrames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

let root, shell, surface, closeBtn, headEl, bodyEl, footEl, lastFocused = null, isOpen = false;
let activeKind = null;
let currentDesignSize = { width: CONTENT_WIDTH, height: 1 };
let fitController;
let openToken = 0;

export function initModal() {
  root = document.getElementById('modal-root');
  root.innerHTML = `
    <div class="modal-backdrop" data-close></div>
    <div class="modal-shell" data-fit-shell>
      <div class="modal" data-fit-surface role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button class="modal-close" data-close aria-label="Close">✕</button>
        <div class="modal-head" data-drag></div>
        <div class="modal-body"></div>
        <div class="modal-foot" hidden></div>
        <button type="button" class="modal-resize" aria-label="Resize popout"></button>
      </div>
    </div>`;
  shell = root.querySelector('.modal-shell');
  surface = root.querySelector('.modal');
  closeBtn = root.querySelector('.modal-close');
  headEl = root.querySelector('.modal-head');
  bodyEl = root.querySelector('.modal-body');
  footEl = root.querySelector('.modal-foot');

  fitController = createSurfaceController({
    viewport: root,
    shell,
    surface,
    getDesignSize: () => currentDesignSize,
  });

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
  let dragging = false, sx = 0, sy = 0, start = null;
  headEl.addEventListener('pointerdown', e => {
    if (e.target.closest(FOCUSABLE)) return;
    start = fitController.getGeometry();
    if (!start) return;
    dragging = true; sx = e.clientX; sy = e.clientY;
    headEl.setPointerCapture(e.pointerId); headEl.style.cursor = 'grabbing';
  });
  headEl.addEventListener('pointermove', e => {
    if (!dragging) return;
    fitController.moveFrom(start, e.clientX - sx, e.clientY - sy);
  });
  const end = () => { dragging = false; start = null; headEl.style.cursor = ''; };
  headEl.addEventListener('pointerup', end);
  headEl.addEventListener('pointercancel', end);
}

/* ---- resize by corner handle ---- */
function initResize() {
  const handle = root.querySelector('.modal-resize');
  let resizing = false, sx = 0, sy = 0, start = null;
  handle.addEventListener('pointerdown', e => {
    start = fitController.getGeometry();
    if (!start) return;
    resizing = true; sx = e.clientX; sy = e.clientY;
    handle.setPointerCapture(e.pointerId); e.preventDefault();
  });
  handle.addEventListener('pointermove', e => {
    if (!resizing) return;
    fitController.resizeFrom(start, e.clientX - sx, e.clientY - sy);
  });
  const end = () => { resizing = false; start = null; };
  handle.addEventListener('pointerup', end);
  handle.addEventListener('pointercancel', end);
}

function trap(e) {
  const nodes = [...surface.querySelectorAll(FOCUSABLE)].filter(n => n.offsetParent !== null);
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

async function fitEducational(d, token) {
  const width = d.table ? WIDE_CONTENT_WIDTH : CONTENT_WIDTH;
  root.classList.add('is-measuring');
  Object.assign(surface.style, { width: `${width}px`, height: 'auto', transform: 'none' });
  await document.fonts.ready;
  await twoFrames();
  if (!isOpen || token !== openToken || activeKind !== 'content') return false;

  currentDesignSize = { width, height: Math.ceil(surface.scrollHeight) };
  fitController.reset();
  fitController.setActive(true);
  fitController.fit();
  root.classList.remove('is-measuring');
  root.classList.add('is-visible');
  closeBtn.focus({ preventScroll: true });
  return true;
}

export async function openModal(id, opener) {
  const d = MODALS[id];
  if (!d) { console.warn(`[deck] no popout "${id}"`); return false; }
  lastFocused = opener || document.activeElement;

  headEl.innerHTML = `<h2 class="modal-title" id="modal-title">${d.title}</h2>`;

  let body = '';
  if (d.intro) body += `<p class="modal-intro">${d.intro}</p>`;
  if (d.table) body += renderTable(d.table);
  if (d.sections) body += d.sections.map(section).join('');
  bodyEl.innerHTML = body;

  const lines = (d.compliance || []).map(k => COMPLIANCE[k]).filter(Boolean);
  if (lines.length) { footEl.textContent = lines.join('  '); footEl.hidden = false; }
  else footEl.hidden = true;

  fitController.setActive(false);
  surface.classList.remove('modal--media');
  root.classList.remove('is-visible');
  root.classList.add('is-open', 'is-measuring');
  isOpen = true;
  activeKind = 'content';
  const token = ++openToken;
  document.body.classList.add('modal-open');
  return fitEducational(d, token);
}

export function openMedia(id, opener) {
  const item = mediaById(id);
  if (!item) {
    console.warn(`[deck] no presenter media "${id}"`);
    return false;
  }

  lastFocused = opener || document.activeElement;
  headEl.innerHTML = `<h2 class="modal-title" id="modal-title">${item.title}</h2>`;
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

  fitController.setActive(false);
  surface.classList.add('modal--media');
  root.classList.remove('is-visible');
  root.classList.add('is-open', 'is-measuring');
  isOpen = true;
  activeKind = 'media';
  openToken += 1;
  document.body.classList.add('modal-open');

  currentDesignSize = LEGACY_MEDIA_SIZE;
  fitController.reset();
  fitController.setActive(true);
  fitController.fit();
  root.classList.remove('is-measuring');
  root.classList.add('is-visible');
  closeBtn.focus({ preventScroll: true });
  return true;
}

function clearFitGeometry() {
  Object.assign(shell.style, { width: '', height: '', left: '', top: '' });
  Object.assign(surface.style, { width: '', height: '', transform: '', transformOrigin: '' });
}

export function closeModal() {
  if (!isOpen) return;
  isOpen = false;
  const token = ++openToken;
  fitController.setActive(false);
  root.classList.remove('is-visible');
  document.body.classList.remove('modal-open');
  const done = () => {
    if (isOpen || token !== openToken) return;
    root.classList.remove('is-open', 'is-measuring');
    if (lastFocused && document.contains(lastFocused)) lastFocused.focus();
    clearFitGeometry();
    lastFocused = null;
    activeKind = null;
  };
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) done();
  else setTimeout(done, 200);
}

export function isModalOpen() { return isOpen; }
