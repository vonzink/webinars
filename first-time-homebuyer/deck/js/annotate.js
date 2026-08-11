/* ============================================================================
   ANNOTATE — draw over the live deck: pen, box, text, laser pointer.
   Toggle + tool + colour + clear, driven locally (on-screen toolbar / keyboard)
   or remotely from the presenter view (via deck.js channel handler).
   Marks clear automatically on slide change.
   ========================================================================= */

const NS = 'http://www.w3.org/2000/svg';
const COLORS = { green: '#8cc63E', red: '#C0392B', white: '#FFFFFF', teal: '#0C3335' };

let layer, svg, toolbar, laserDot;
let mode = false, tool = 'pen', color = COLORS.green;
let drawing = false, cur = null, start = null;

function elNS(t) { return document.createElementNS(NS, t); }
function pt(e) { return { x: e.clientX, y: e.clientY }; }

function strokeAttrs(n, w) {
  n.setAttribute('stroke', color);
  n.setAttribute('stroke-width', w);
  n.setAttribute('fill', 'none');
  n.setAttribute('stroke-linecap', 'round');
  n.setAttribute('stroke-linejoin', 'round');
}

export function initAnnotate() {
  layer = document.createElement('div');
  layer.id = 'annotate-layer';
  svg = elNS('svg');
  svg.setAttribute('width', '100%'); svg.setAttribute('height', '100%');
  layer.appendChild(svg);
  laserDot = document.createElement('div'); laserDot.className = 'laser-dot'; laserDot.hidden = true;
  layer.appendChild(laserDot);
  document.body.appendChild(layer);
  buildToolbar();

  layer.addEventListener('pointerdown', down);
  layer.addEventListener('pointermove', mv);
  window.addEventListener('pointerup', up);
}

function down(e) {
  if (!mode) return;
  if (tool === 'text') { addText(pt(e)); return; }
  if (tool === 'laser') return;
  drawing = true; start = pt(e);
  try { layer.setPointerCapture(e.pointerId); } catch {}   // reliable drags
  if (tool === 'pen') {
    cur = elNS('path'); cur.setAttribute('d', `M ${start.x} ${start.y}`); strokeAttrs(cur, 5);
  } else if (tool === 'box') {
    cur = elNS('rect'); cur.setAttribute('x', start.x); cur.setAttribute('y', start.y);
    cur.setAttribute('width', 0); cur.setAttribute('height', 0); strokeAttrs(cur, 4);
  }
  if (cur) svg.appendChild(cur);
}
function mv(e) {
  if (!mode) return;
  if (tool === 'laser') { const p = pt(e); laserDot.hidden = false;
    laserDot.style.left = p.x + 'px'; laserDot.style.top = p.y + 'px';
    laserDot.style.background = color; return; }
  if (!drawing || !cur) return;
  const p = pt(e);
  if (tool === 'pen') cur.setAttribute('d', cur.getAttribute('d') + ` L ${p.x} ${p.y}`);
  else if (tool === 'box') {
    cur.setAttribute('x', Math.min(p.x, start.x)); cur.setAttribute('y', Math.min(p.y, start.y));
    cur.setAttribute('width', Math.abs(p.x - start.x)); cur.setAttribute('height', Math.abs(p.y - start.y));
  }
}
function up() { drawing = false; cur = null; }

function addText(p) {
  const box = document.createElement('div');
  box.className = 'annotate-text';
  box.contentEditable = 'true';
  box.style.left = p.x + 'px'; box.style.top = p.y + 'px'; box.style.color = color;
  layer.appendChild(box);
  requestAnimationFrame(() => {
    box.focus();
    const r = document.createRange(); r.selectNodeContents(box); r.collapse(false);
    const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
  });
  box.addEventListener('blur', () => { if (!box.textContent.trim()) box.remove(); });
}

/* ---- toolbar (on-screen, appears while annotating) ---- */
function buildToolbar() {
  toolbar = document.createElement('div');
  toolbar.id = 'annotate-bar'; toolbar.hidden = true;
  const tools = [['pen', '✎'], ['box', '▢'], ['text', 'T'], ['laser', '•']];
  const cols = [['green', COLORS.green], ['red', COLORS.red], ['white', COLORS.white], ['teal', COLORS.teal]];
  toolbar.innerHTML =
    tools.map(([t, g]) => `<button data-tool="${t}" title="${t}">${g}</button>`).join('') +
    `<span class="sep"></span>` +
    cols.map(([n, c]) => `<button class="col" data-color="${n}" style="background:${c}" title="${n}"></button>`).join('') +
    `<span class="sep"></span>` +
    `<button data-act="clear">Clear</button><button data-act="off">Done</button>`;
  document.body.appendChild(toolbar);
  toolbar.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.tool) setTool(b.dataset.tool);
    else if (b.dataset.color) setColor(COLORS[b.dataset.color]);
    else if (b.dataset.act === 'clear') clear();
    else if (b.dataset.act === 'off') enable(false);
  });
  syncToolbar();
}
function syncToolbar() {
  if (!toolbar) return;
  toolbar.querySelectorAll('[data-tool]').forEach(b =>
    b.classList.toggle('is-active', b.dataset.tool === tool));
  toolbar.querySelectorAll('[data-color]').forEach(b =>
    b.classList.toggle('is-active', COLORS[b.dataset.color] === color));
}

/* ---- public API ----
   The on-screen toolbar is HIDDEN by default so it never shows on the shared
   slide. Tools are driven from the presenter view; showToolbar() opts it back
   in for solo use. */
export function enable(on) {
  mode = on;
  layer.classList.toggle('is-on', on);
  if (!on) { laserDot.hidden = true; showToolbar(false); }
}
export function toggle() { enable(!mode); }
export function showToolbar(on) { toolbar.hidden = !on; }
export function setTool(t) { tool = t; syncToolbar(); if (tool !== 'laser') laserDot.hidden = true; }
export function setColor(c) { color = COLORS[c] || c; syncToolbar(); }
export function clear() { [...svg.childNodes].forEach(n => n.remove());
  layer.querySelectorAll('.annotate-text').forEach(n => n.remove()); }
export function isOn() { return mode; }
