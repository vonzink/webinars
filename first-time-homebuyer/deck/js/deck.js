/* ============================================================================
   DECK ENGINE — Ridgeline
   Renders slides from data, injects the §6 footer/compliance, runs nav and
   the 1920×1080 scaling, and broadcasts to the presenter view.
   ========================================================================= */

import { SLIDES, TARGET_RUNTIME_SECONDS } from '../content/slides.js';
import { MODALS, MODAL_COUNT } from '../content/modals.js';
import {
  activePresenter, COMPANY, COMPLIANCE, LINKS, LOGO,
} from '../content/presenters.js';
import { initModal, openModal, openMedia, closeModal, isModalOpen } from './modal.js';
import { initCalculator, setCalculatorVisible, isCalculatorVisible } from './calculator.js';
import { makeCard, makeCardGrid } from './card.js';
import { FIGURES } from './figures.js';
import * as annotate from './annotate.js';
import { createSurfaceController } from './surface-fit.js';

const P = activePresenter();
const PREVIEW = new URLSearchParams(location.search).has('preview');
let current = 0, scaler, stage, slideFit, channel;
let presenterWindow = null, presenterClosedWatch = null, navHidden = false;

/* ---- helpers -------------------------------------------------------------- */
const ph = (val, label) => val ? esc(val) : `<span class="ph">${label}</span>`;
function esc(s){ return String(s).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }

function photo(label, dir = 'v', src = null, wash = true) {
  const w = wash ? `<div class="wash" data-dir="${dir}"></div>` : '';
  if (src) return `<div class="photo"><img src="${src}" alt="">${w}</div>`;
  return `<div class="photo"><div class="photo-placeholder"><span>${label}</span></div>${w}</div>`;
}

function header(d) {
  const long = d.headline && d.headline.length > 34 ? ' is-long' : '';
  return `
    <div class="slide-header">
      ${d.eyebrow ? `<span class="eyebrow">${d.eyebrow}</span>` : ''}
      ${d.headline ? `<h2 class="headline${long}">${d.headline}</h2>` : ''}
      <div class="accent-bar"></div>
      ${d.subhead ? `<p class="subhead" style="margin-top:26px">${d.subhead}</p>` : ''}
    </div>`;
}

function furniture(el, d) {
  if (d.footer) {
    const [l1, l2] = COMPLIANCE.footerLines(P);
    const dark = d.bg === 'dark';
    const f = document.createElement('div');
    f.className = 'slide-footer';
    f.innerHTML = `
      <div class="footer-logo"><img src="${dark ? LOGO.onDark : LOGO.onLight}" alt="Mountain State Financial Group"></div>
      <div class="footer-meta">
        <div class="footer-lines"><div>${l1}</div><div>${l2}</div></div>
        <img class="equal-housing-logo" src="${LOGO.equalHousing}" alt="Equal Housing Lender">
      </div>`;
    el.appendChild(f);
    el.dataset.footer = 'true';
  }
  const lines = [];
  if (d.hasNumbers) lines.push(COMPLIANCE.hypothetical);
  if (d.compliance) lines.push(COMPLIANCE[d.compliance]);
  if (d.extraCompliance) lines.push(COMPLIANCE[d.extraCompliance]);
  if (lines.length) {
    const p = document.createElement('p');
    p.className = 'disclaimer';
    p.textContent = lines.join('  ');
    el.appendChild(p);
    el.dataset.disclaimer = 'true';
  }
}

/* ---- layouts -------------------------------------------------------------- */
const layouts = {

  opening(el, d) {
    el.innerHTML = `
      <div class="split" data-ratio="photo-right" style="flex:1 1 auto">
        <div class="split-copy">
          <span class="eyebrow build">${d.eyebrow}</span>
          <h1 class="headline build" style="font-size:96px;line-height:.95;margin-top:22px">${d.headline}</h1>
          <div class="accent-bar build" style="margin:34px 0"></div>
          <p class="build" style="font-family:var(--font-display);font-weight:800;font-size:46px;color:#fff">${P.name}</p>
          <p class="build" style="font-size:28px;color:var(--text-body-dark);margin-top:4px">${P.title} · ${P.nmls}</p>
          <ul class="contact build" style="margin-top:36px">
            <li><span class="c-label">Call</span> ${ph(P.phone, 'PHONE')}</li>
            <li><span class="c-label">Email</span> ${ph(P.email, 'EMAIL')}</li>
            <li><span class="c-label">Also</span> ${ph(P.email2, 'SECONDARY EMAIL')}</li>
          </ul>
        </div>
        <div class="split-photo build">${photo('Presenter portrait', 'h', P.portrait, false)}</div>
      </div>`;
  },

  grid(el, d) {
    el.innerHTML = header(d) + `<div class="slide-body"><div class="grid-slot"></div></div>`;
    const grid = makeCardGrid(d.cards, {
      cols: d.cols || 3, variant: d.cardVariant || 'default', dense: !!d.dense,
    });
    grid.querySelectorAll('.card').forEach(c => c.classList.add('build'));
    el.querySelector('.grid-slot').appendChild(grid);
  },

  points(el, d) {
    el.innerHTML = header(d) + `
      <div class="slide-body" style="justify-content:center">
        <ul class="points build measure" style="max-width:1300px">
          ${d.points.map(p => `<li>${p}</li>`).join('')}
        </ul>
        ${d.callout ? `<div class="callout build" style="margin-top:44px;align-self:flex-start">${d.callout}</div>` : ''}
      </div>`;
    if (d.compareModal) {
      const b = document.createElement('button');
      b.className = 'compare-cta build';
      b.innerHTML = 'Compare loans: Conventional · FHA · VA <span aria-hidden="true">→</span>';
      b.addEventListener('click', () => openModal(d.compareModal, b));
      el.querySelector('.slide-body').appendChild(b);
    }
  },

  compare(el, d) {
    el.dataset.bleed = 'true';
    el.innerHTML = `
      <div class="compare-panels">
        <div class="compare-panel" data-side="light">
          <span class="eyebrow build" style="margin-bottom:24px">${d.eyebrow}</span>
          <p class="panel-label build">${d.left.label}</p>
          <ul class="panel-list">${d.left.items.map(i => `<li class="build">${i}</li>`).join('')}</ul>
        </div>
        <div class="compare-panel" data-side="dark">
          <p class="panel-label build" style="margin-top:64px">${d.right.label}</p>
          <ul class="panel-list">${d.right.items.map(i => `<li class="build">${i}</li>`).join('')}</ul>
        </div>
      </div>
      ${d.callout ? `<div class="callout build" style="position:absolute;left:50%;bottom:70px;transform:translateX(-50%);z-index:4;text-align:center">${d.callout}</div>` : ''}`;
  },

  payment(el, d) {
    el.innerHTML = header(d) + `
      <div class="slide-body" style="gap:34px;justify-content:center">
        <div class="build" style="width:100%">
          <div class="pay-bar">${FIGURES.paymentBands()}</div>
          ${FIGURES.paymentLegend()}
        </div>
        <div class="two-col build">
          <div class="col">
            <p class="col-head col-head--lock">What's locked</p>
            <ul class="mini-list">${d.fixed.map(i => `<li>${i}</li>`).join('')}</ul>
          </div>
          <div class="col">
            <p class="col-head col-head--move">What can still move</p>
            <ul class="mini-list">${d.moves.map(i => `<li>${i}</li>`).join('')}</ul>
          </div>
        </div>
        <ul class="points build" style="gap:16px">${d.points.map(p => `<li>${p}</li>`).join('')}</ul>
      </div>`;
  },

  cashmakeup(el, d) {
    el.innerHTML = header(d) + `
      <div class="slide-body" style="gap:40px;justify-content:center">
        <div class="two-col build">
          <div class="col">
            <p class="col-head col-head--lock">Credits CAN pay</p>
            <ul class="mini-list">${d.canPay.map(i => `<li>${i}</li>`).join('')}</ul>
          </div>
          <div class="col">
            <p class="col-head col-head--move">Credits CANNOT pay</p>
            <ul class="mini-list">${d.cannotPay.map(i => `<li>${i}</li>`).join('')}</ul>
          </div>
        </div>
        <ul class="points build" style="gap:18px">${d.points.map(p => `<li>${p}</li>`).join('')}</ul>
      </div>`;
  },

  stepper(el, d) {
    el.innerHTML = header(d) + `
      <div class="slide-body" style="justify-content:center">
        <div class="figure-wrap build" style="width:100%">${FIGURES.processStepper(d.steps)}</div>
      </div>`;
  },

  markers(el, d) {
    const items = d.items.map(i => `
      <li class="build"><span class="marker" data-tone="${d.tone}">${d.tone === 'do' ? '+' : '✕'}</span><span>${i}</span></li>`);
    let inner;
    if (d.cols === 2) {
      const half = Math.ceil(items.length / 2);
      inner = `<div class="marker-cols">
        <ul class="marker-list">${items.slice(0, half).join('')}</ul>
        <ul class="marker-list">${items.slice(half).join('')}</ul></div>`;
    } else {
      inner = `<ul class="marker-list" style="max-width:1300px">${items.join('')}</ul>`;
    }
    el.innerHTML = header(d) + `<div class="slide-body" style="justify-content:center">${inner}</div>`;
  },

  questions(el, d) {
    el.innerHTML = header(d) + `
      <div class="slide-body" style="justify-content:center">
        <div class="qa-list">
          ${d.items.map((it, i) => `
            <div class="qa build">
              <div class="qa-num">${i + 1}</div>
              <div><p class="qa-q">${it.q}</p><p class="qa-a">${it.a}</p></div>
            </div>`).join('')}
        </div>
      </div>`;
  },

  wrap(el, d) {
    el.innerHTML = `
      <div class="split" data-ratio="1-1" style="flex:1 1 auto">
        <div class="split-copy">
          <h1 class="headline build" style="font-size:92px">${d.headline}</h1>
          <div class="accent-bar build" style="margin:34px 0"></div>
          <p class="build" style="font-family:var(--font-display);font-weight:800;font-size:42px;color:#fff">${P.name}</p>
          <p class="build" style="font-size:26px;color:var(--text-body-dark);margin-top:4px">${P.title} · ${P.nmls}</p>
          <ul class="contact build" style="margin-top:30px">
            <li><span class="c-label">Call</span> ${ph(P.phone, 'PHONE')}</li>
            <li><span class="c-label">Email</span> ${ph(P.email, 'EMAIL')}</li>
            <li><span class="c-label">Web</span> ${ph(LINKS.website, 'WEBSITE')}</li>
          </ul>
          <div class="btn-row build" style="margin-top:40px">
            ${btn('Apply Now', LINKS.applyUrl, 'primary')}
            ${btn('Schedule a Consultation', LINKS.bookingUrl, 'ghost')}
          </div>
        </div>
        <div class="wrap-qr build">
          ${photo('QR code', 'v', LINKS.qrAsset)}
        </div>
      </div>`;
  },
};

function btn(label, url, variant) {
  /* A real link renders; a not-yet-supplied link is omitted so no placeholder
     shows on the public site. It reappears automatically once the URL is set. */
  if (url) return `<a class="btn btn--${variant}" href="${url}" target="_blank" rel="noopener">${label}</a>`;
  return '';
}

/* ---- build sequencing ----------------------------------------------------- */
function runBuild(el) {
  const items = [...el.querySelectorAll('.build')];
  items.forEach(n => n.classList.remove('is-in'));
  items.forEach((n, i) => setTimeout(() => n.classList.add('is-in'), 60 + Math.min(i, 6) * 90));
}

function shell(d, i) {
  const el = document.createElement('section');
  el.className = 'slide';
  el.id = `slide-${d.id}`;
  el.dataset.index = String(i);
  el.dataset.bg = d.bg || 'mist';
  el.setAttribute('role', 'group');
  el.setAttribute('aria-roledescription', 'slide');
  el.setAttribute('aria-label', `${i + 1} of ${SLIDES.length}: ${d.headline || d.eyebrow || d.id}`);
  return el;
}

function show(i) {
  if (isModalOpen()) closeModal();
  if (!PREVIEW) annotate.clear();               // marks don't carry to the next slide
  current = Math.max(0, Math.min(SLIDES.length - 1, i));
  const slides = document.querySelectorAll('.slide');
  slides.forEach((s, idx) => s.classList.toggle('is-active', idx === current));
  runBuild(slides[current]);
  const nav = document.querySelector('.nav-count');
  if (nav) nav.textContent = `${current + 1} / ${SLIDES.length}`;
  const prog = document.querySelector('.deck-progress');
  if (prog) prog.style.width = `${((current + 1) / SLIDES.length) * 100}%`;
  if (location.hash.slice(1) !== SLIDES[current].id) location.hash = SLIDES[current].id;
  broadcast();
}
const next = () => show(current + 1);
const prev = () => show(current - 1);

function fit() {
  slideFit.fit();
}

function broadcast() { if (channel) channel.postMessage({ type: 'slide', index: current }); }
function broadcastCalculatorState() {
  if (channel) channel.postMessage({ type: 'calculator-state', visible: isCalculatorVisible() });
}
function initChannel() {
  if (!('BroadcastChannel' in window) || PREVIEW) return;   // preview instance stays silent
  channel = new BroadcastChannel('msfg-deck');
  channel.onmessage = e => {
    const m = e.data;
    if (m.type === 'goto') show(m.index);
    if (m.type === 'next') next();
    if (m.type === 'prev') prev();
    if (m.type === 'open') openModal(m.id);
    if (m.type === 'open-media') openMedia(m.id);
    if (m.type === 'calculator-visibility' && typeof m.visible === 'boolean') {
      setCalculatorVisible(m.visible);
    }
    if (m.type === 'hello') {
      broadcast();
      channel.postMessage({ type: 'navstate', hidden: navHidden });
      broadcastCalculatorState();
    }
    if (m.type === 'annotate') handleAnnotate(m);
    if (m.type === 'fullscreen') setFullscreen(m.on);
    if (m.type === 'nav-visibility') setNavigationHidden(m.hidden);
    if (m.type === 'presenter-exit') setNavigationHidden(false);
  };
}

function setNavigationHidden(hidden) {
  navHidden = Boolean(hidden);
  document.body.classList.toggle('deck-nav-hidden', navHidden);
  if (channel) channel.postMessage({ type: 'navstate', hidden: navHidden });
  clearInterval(presenterClosedWatch);
  presenterClosedWatch = null;
  if (navHidden && presenterWindow) {
    presenterClosedWatch = setInterval(() => {
      if (presenterWindow.closed) setNavigationHidden(false);
    }, 500);
  }
}
window.__deckSetNavigationHidden = setNavigationHidden;

/* Fullscreen the shared slide window. Entering needs a user gesture in THIS
   window, so a remote (presenter) request can be blocked — we surface a hint if
   so. Exiting always works. State is broadcast back so the presenter stays synced. */
function setFullscreen(on) {
  if (on) {
    const p = document.documentElement.requestFullscreen();
    if (p && p.catch) p.catch(() => toast('Click the slide, then press F for fullscreen'));
  } else if (document.fullscreenElement) {
    document.exitFullscreen();
  }
}
window.__deckFullscreen = setFullscreen;   // direct path for the presenter's opener

function toast(msg) {
  let t = document.getElementById('deck-toast');
  if (!t) { t = document.createElement('div'); t.id = 'deck-toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2600);
}

function handleAnnotate(m) {
  if (m.on !== undefined) annotate.enable(m.on);
  if (m.toggle) annotate.toggle();
  if (m.tool) annotate.setTool(m.tool);
  if (m.color) annotate.setColor(m.color);
  if (m.autoOff !== undefined) annotate.setAutoOff(m.autoOff);
  if (m.toolbar !== undefined) annotate.showToolbar(m.toolbar);
  if (m.undo) annotate.undo();
  if (m.redo) annotate.redo();
  if (m.clear) annotate.clear();
}

export function initDeck() {
  stage = document.querySelector('.stage');
  scaler = document.querySelector('.slide-scaler');
  const slideShell = document.querySelector('.slide-fit-shell');
  slideFit = createSurfaceController({
    viewport: stage,
    shell: slideShell,
    surface: scaler,
    getDesignSize: () => ({ width: 1920, height: 1080 }),
    margin: 0,
  });
  slideFit.setActive(true);
  if (PREVIEW) document.body.classList.add('is-preview');
  initModal();
  if (!PREVIEW) {
    initCalculator({ onVisibilityChange: broadcastCalculatorState });
    annotate.initAnnotate();
    /* When auto-off flips drawing off after a stroke, tell the presenter view. */
    annotate.onStateChange(on => { if (channel) channel.postMessage({ type: 'annstate', on }); });
  }

  SLIDES.forEach((d, i) => {
    const el = shell(d, i);
    (layouts[d.layout] || layouts.grid)(el, d);
    furniture(el, d);
    scaler.appendChild(el);
  });

  if (!PREVIEW) {
    document.querySelector('[data-nav="next"]').addEventListener('click', next);
    document.querySelector('[data-nav="prev"]').addEventListener('click', prev);
    document.querySelector('[data-nav="presenter"]').addEventListener('click', openPresenter);
    const fsBtn = document.querySelector('[data-nav="fullscreen"]');
    if (fsBtn) fsBtn.addEventListener('click', () => setFullscreen(!document.fullscreenElement));
    document.addEventListener('fullscreenchange', () => {
      if (channel) channel.postMessage({ type: 'fsstate', on: !!document.fullscreenElement });
    });

    document.addEventListener('keydown', e => {
      if (isModalOpen()) return;
      if (e.target instanceof Element && e.target.matches('input, textarea, button, [contenteditable="true"]')) return;
      switch (e.key) {
        case 'ArrowRight': case 'PageDown': case ' ': e.preventDefault(); next(); break;
        case 'ArrowLeft':  case 'PageUp': e.preventDefault(); prev(); break;
        case 'Home': show(0); break;
        case 'End': show(SLIDES.length - 1); break;
        case 'p': case 'P': openPresenter(); break;
        case 'a': case 'A': annotate.toggle(); break;
        case 'z': case 'Z':
          if (e.metaKey || e.ctrlKey) { e.preventDefault(); e.shiftKey ? annotate.redo() : annotate.undo(); } break;
        case 'y': case 'Y':
          if (e.metaKey || e.ctrlKey) { e.preventDefault(); annotate.redo(); } break;
        case 'g': case 'G': document.body.classList.toggle('show-guides'); break;
        case 'f': case 'F': setFullscreen(!document.fullscreenElement); break;
      }
    });
  }

  /* The preview iframe is driven by its URL hash. */
  window.addEventListener('hashchange', () => {
    const i = SLIDES.findIndex(s => s.id === location.hash.slice(1));
    if (i >= 0 && i !== current) show(i);
  });

  fit();
  initChannel();

  const fromHash = SLIDES.findIndex(s => s.id === location.hash.slice(1));
  show(fromHash >= 0 ? fromHash : 0);

  const ok = SLIDES.length === 16 && MODAL_COUNT === 30;
  console.log(
    `%c Homebuyer's Playbook · Ridgeline %c ${SLIDES.length} slides · ${MODAL_COUNT} popouts · ` +
    `${Math.round(TARGET_RUNTIME_SECONDS / 60)} min ${ok ? '✓' : '✗ count check'}`,
    'background:#0C3335;color:#8cc63E;font-weight:700;padding:2px 6px', 'color:#0C3335');

  const referenced = new Set();
  SLIDES.forEach(s => (s.cards || []).forEach(c => referenced.add(c.modal)));
  const missing = [...referenced].filter(id => !MODALS[id]);
  const orphans = Object.keys(MODALS).filter(id => !referenced.has(id));
  if (missing.length) console.error('[deck] cards → missing popouts:', missing);
  if (orphans.length) console.warn('[deck] unreachable popouts:', orphans);
}

function openPresenter() {
  presenterWindow = window.open('./presenter.html', 'msfg-presenter', 'width=1280,height=800');
}

export { show, next, prev, SLIDES };
