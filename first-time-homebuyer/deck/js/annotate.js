/* ============================================================================
   ANNOTATE — draw over the live deck: pen, box, text, laser pointer.
   Toggle + tool + colour + clear, driven locally (on-screen toolbar / keyboard)
   or remotely from the presenter view (via deck.js channel handler).
   Marks clear automatically on slide change.
   ========================================================================= */

const NS = 'http://www.w3.org/2000/svg';
/* Fluorescent, high-visibility set. Red is now a bright fluorescent. */
const COLORS = {
  green:  '#8cc63E',
  red:    '#FF1744',   // brighter fluorescent red
  yellow: '#FFEA00',
  blue:   '#2979FF',
  black:  '#111111',
  white:  '#FFFFFF',
};
const HILITE = { yellow: '#FFF200', green: '#B6FF3C', blue: '#59D5FF', red: '#FF6E7F' };

let layer, svg, toolbar, laserDot, laserTrail = [];
let mode = false, tool = 'pen', color = COLORS.green;
let drawing = false, cur = null, start = null;
let autoOff = false, onState = null;

function elNS(t) { return document.createElementNS(NS, t); }
function pt(e) { return { x: e.clientX, y: e.clientY }; }

function strokeAttrs(n, w) {
  n.setAttribute('stroke', color);
  n.setAttribute('stroke-width', w);
  n.setAttribute('fill', 'none');
  n.setAttribute('stroke-linecap', 'round');
  n.setAttribute('stroke-linejoin', 'round');
}
/* Highlighter: wide, translucent, multiply-blended so it reads over text. */
function hiliteAttrs(n) {
  const c = HILITE[colorName()] || color;
  n.setAttribute('stroke', c);
  n.setAttribute('stroke-width', 26);
  n.setAttribute('fill', 'none');
  n.setAttribute('stroke-linecap', 'round');
  n.setAttribute('stroke-linejoin', 'round');
  n.setAttribute('opacity', '0.4');
  n.style.mixBlendMode = 'multiply';
}
function colorName() { return Object.keys(COLORS).find(k => COLORS[k] === color); }

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
  if (tool === 'text') { addText(pt(e)); afterStroke(); return; }
  if (tool === 'laser') return;
  drawing = true; start = pt(e);
  try { layer.setPointerCapture(e.pointerId); } catch {}   // reliable drags
  if (tool === 'pen') {
    cur = elNS('path'); cur.setAttribute('d', `M ${start.x} ${start.y}`); strokeAttrs(cur, 5);
  } else if (tool === 'highlight') {
    cur = elNS('path'); cur.setAttribute('d', `M ${start.x} ${start.y}`); hiliteAttrs(cur);
  } else if (tool === 'box') {
    cur = elNS('rect'); cur.setAttribute('x', start.x); cur.setAttribute('y', start.y);
    cur.setAttribute('width', 0); cur.setAttribute('height', 0); strokeAttrs(cur, 4);
  }
  if (cur) svg.appendChild(cur);
}
function mv(e) {
  if (!mode) return;
  if (tool === 'laser') { laser(pt(e)); return; }
  if (!drawing || !cur) return;
  const p = pt(e);
  if (tool === 'pen' || tool === 'highlight')
    cur.setAttribute('d', cur.getAttribute('d') + ` L ${p.x} ${p.y}`);
  else if (tool === 'box') {
    cur.setAttribute('x', Math.min(p.x, start.x)); cur.setAttribute('y', Math.min(p.y, start.y));
    cur.setAttribute('width', Math.abs(p.x - start.x)); cur.setAttribute('height', Math.abs(p.y - start.y));
  }
}
function up() { if (!drawing) return; drawing = false; cur = null; afterStroke(); }

/* Auto-off: after finishing one mark, drop out of drawing so clicks work. */
function afterStroke() { if (autoOff) { enable(false); if (onState) onState(false); } }

/* Laser: fluorescent dot with a fading motion tail. */
function laser(p) {
  laserDot.hidden = false;
  laserDot.style.left = p.x + 'px'; laserDot.style.top = p.y + 'px';
  laserDot.style.setProperty('--laser', color);
  laserTrail.push({ x: p.x, y: p.y, t: performance.now ? 0 : 0 });
  if (laserTrail.length > 10) laserTrail.shift();
  renderTrail();
}
function renderTrail() {
  let g = svg.querySelector('#laser-trail');
  if (!g) { g = elNS('g'); g.setAttribute('id', 'laser-trail'); svg.appendChild(g); }
  g.innerHTML = '';
  for (let i = 1; i < laserTrail.length; i++) {
    const a = laserTrail[i - 1], b = laserTrail[i];
    const ln = elNS('line');
    ln.setAttribute('x1', a.x); ln.setAttribute('y1', a.y);
    ln.setAttribute('x2', b.x); ln.setAttribute('y2', b.y);
    ln.setAttribute('stroke', color);
    ln.setAttribute('stroke-width', 6 * (i / laserTrail.length));
    ln.setAttribute('stroke-linecap', 'round');
    ln.setAttribute('opacity', (i / laserTrail.length) * 0.55);
    g.appendChild(ln);
  }
}

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
  const tools = [['pen', '✎'], ['highlight', '▤'], ['box', '▢'], ['text', 'T'], ['laser', '◉']];
  const cols = [['green', COLORS.green], ['yellow', COLORS.yellow], ['blue', COLORS.blue],
                ['red', COLORS.red], ['black', COLORS.black], ['white', COLORS.white]];
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

let decayTimer = null;
function startDecay() {
  stopDecay();
  decayTimer = setInterval(() => {
    if (laserTrail.length) { laserTrail.shift(); renderTrail(); }
  }, 45);
}
function stopDecay() { if (decayTimer) { clearInterval(decayTimer); decayTimer = null; } laserTrail = []; }

/* ---- public API ----
   The on-screen toolbar is HIDDEN by default so it never shows on the shared
   slide. Tools are driven from the presenter view; showToolbar() opts it back
   in for solo use. */
export function enable(on) {
  mode = on;
  layer.classList.toggle('is-on', on);
  if (!on) { laserDot.hidden = true; stopDecay(); const g = svg.querySelector('#laser-trail'); if (g) g.remove(); showToolbar(false); }
}
export function toggle() { enable(!mode); }
export function showToolbar(on) { toolbar.hidden = !on; }
export function setTool(t) {
  tool = t; syncToolbar();
  if (tool === 'laser') startDecay();
  else { laserDot.hidden = true; stopDecay(); const g = svg.querySelector('#laser-trail'); if (g) g.remove(); }
}
export function setColor(c) { color = COLORS[c] || c; syncToolbar(); }
export function setAutoOff(on) { autoOff = on; }
export function onStateChange(fn) { onState = fn; }
export function clear() {
  [...svg.childNodes].forEach(n => n.remove());
  layer.querySelectorAll('.annotate-text').forEach(n => n.remove());
  laserTrail = [];
}
export function isOn() { return mode; }
