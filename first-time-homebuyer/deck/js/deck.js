/* ============================================================================
   DECK ENGINE

   Renders the 22 main slides from content/slides.js, injects compliance
   furniture from data, runs navigation and builds, and broadcasts state to
   the presenter view.

   Compliance is injected HERE, from slide data — never typed per slide.
   That is deliberate: a footer you have to remember is a footer that ships
   missing.
   ========================================================================= */

import { SLIDES, TARGET_RUNTIME_SECONDS } from '../content/slides.js';
import { MODALS, MODAL_COUNT } from '../content/modals.js';
import { activePresenter, COMPANY, COMPLIANCE, PLACEHOLDERS, QR_ASSET } from '../content/presenters.js';
import { initModal, openModal, closeModal, isModalOpen } from './modal.js';
import { makeCard, makeCardGrid, makeChipRow } from './card.js';
import { FIGURES } from './figures.js';

const presenter = activePresenter();
let current = 0;
let scaler, stage, channel;

/* ---------------------------------------------------------------------------
   PLACEHOLDERS — render visible, on purpose.
   ------------------------------------------------------------------------ */
function ph(key) {
  const p = PLACEHOLDERS[key];
  if (!p) return '';
  if (p.value && p.value !== 'partial') return p.value;
  return `<span class="placeholder">${p.label}</span>`;
}

/* ---------------------------------------------------------------------------
   SLIDE SHELL
   ------------------------------------------------------------------------ */
function slideShell(data, i) {
  const el = document.createElement('section');
  el.className = 'slide';
  el.id = `slide-${data.id}`;
  el.dataset.index = String(i);
  el.setAttribute('role', 'group');
  el.setAttribute('aria-roledescription', 'slide');
  el.setAttribute('aria-label', `${i + 1} of ${SLIDES.length}: ${data.headline || data.title || data.section}`);

  if (data.layout === 'section') el.dataset.surface = 'dark';
  if (data.layout === 'wrap')    el.dataset.surface = 'dark';
  if (data.layout === 'opening') el.dataset.surface = 'white';

  /* Webcam safe area — reserved on every slide, always. */
  const safe = document.createElement('div');
  safe.className = 'webcam-safe';
  el.appendChild(safe);

  return el;
}

function header(data) {
  if (!data.headline) return '';
  const long = data.headline.length > 42 ? ' is-long' : '';
  return `
    <div class="slide-header">
      <h2 class="slide-headline${long} build">${data.headline}</h2>
      ${data.subhead ? `<p class="slide-subhead build">${data.subhead}</p>` : ''}
    </div>`;
}

/* Compliance furniture — footer + disclaimers, from data. */
function furniture(el, data) {
  /* Section title slides are the deck's emotional beats — the spec exempts
     them from the footer so the break lands clean. Everything else carries it. */
  const exempt = data.layout === 'section';
  if (!exempt) {
    const f = document.createElement('div');
    f.className = 'slide-footer';
    f.innerHTML = `
      <span class="footer-text">${COMPLIANCE.footer(presenter)}</span>
      <span class="eh-mark">${COMPLIANCE.equalHousing}</span>`;
    el.appendChild(f);
  }

  const lines = [];
  if (data.hasNumbers) lines.push(COMPLIANCE.hypothetical);
  (data.extraCompliance || []).forEach(k => lines.push(COMPLIANCE[k]));
  if (lines.length) {
    const d = document.createElement('p');
    d.className = 'disclaimer';
    d.textContent = lines.join(' ');
    el.appendChild(d);
    /* Reserves the extra bottom padding so content can't run under it. */
    el.dataset.disclaimer = 'true';
  }
}

/* ---------------------------------------------------------------------------
   LAYOUTS
   ------------------------------------------------------------------------ */
const layouts = {

  opening(el, data) {
    const portrait = presenter.portrait
      ? `<img src="${presenter.portrait}" alt="${presenter.name}" class="opening-portrait">`
      : `<div class="opening-portrait opening-portrait--missing">
           <span class="placeholder">PORTRAIT — ${presenter.name}</span>
         </div>`;

    el.innerHTML = `
      <div class="split opening-split" data-ratio="1-2">
        <div class="build">${portrait}</div>
        <div class="opening-copy">
          <p class="opening-kicker build">First-Time Homebuyer Webinar</p>
          <h1 class="opening-company build">${COMPANY.name.replace(' LLC', '')}</h1>
          <div class="opening-presenter build">
            <p class="opening-name">${presenter.name}</p>
            <p class="opening-title">${presenter.title} · NMLS ${presenter.nmls}</p>
          </div>
          <ul class="opening-contact build">
            <li><span aria-hidden="true">📞</span> ${ph('phone')}</li>
            <li><span aria-hidden="true">✉️</span> ${presenter.email}</li>
            <li><span aria-hidden="true">✉️</span> ${ph('secondaryEmail')}</li>
          </ul>
        </div>
      </div>`;
  },

  section(el, data) {
    el.classList.add('section-title');
    el.innerHTML = `
      <div class="section-motif">${FIGURES.triangleMotif()}</div>
      <h2 class="section-title-text build">${data.title}</h2>
      <img class="section-logo" src="./assets/brand/logo-horizontal-knockout.svg"
           alt="Mountain State Financial Group">`;
  },

  cards(el, data) {
    el.innerHTML = header(data) + `<div class="slide-body"></div>`;
    const body = el.querySelector('.slide-body');
    const grid = makeCardGrid(data.cards, {
      cols: data.cols || 3,
      variant: data.cardVariant || 'default',
    });
    grid.querySelectorAll('.card').forEach(c => c.classList.add('build'));
    body.appendChild(grid);
  },

  rows(el, data) {
    el.innerHTML = header(data) + `<div class="slide-body"></div>`;
    const body = el.querySelector('.slide-body');
    const wrap = document.createElement('div');
    wrap.className = 'row-stack';
    data.cards.forEach((c, i) => {
      const card = makeCard({ ...c, variant: 'row', index: i + 1 });
      card.classList.add('build');
      wrap.appendChild(card);
    });
    body.appendChild(wrap);
  },

  'figure-bullets'(el, data) {
    const fig = FIGURES[data.figure](data.figureOpts || {});
    el.innerHTML = header(data) + `
      <div class="slide-body">
        <div class="split" data-ratio="${data.ratio || '3-2'}">
          <div class="figure-wrap build">${fig}
            ${data.source ? `<p class="source-line">${data.source}</p>` : ''}
          </div>
          <div class="build">
            <ul class="slide-bullets">
              ${data.bullets.map(b => `<li>${b}</li>`).join('')}
            </ul>
            ${data.pullQuote ? `<p class="pull-quote">${data.pullQuote}</p>` : ''}
            <div class="bullet-card-slot"></div>
          </div>
        </div>
      </div>`;

    if (data.bulletCard) {
      const slot = el.querySelector('.bullet-card-slot');
      const c = makeCard({ modal: data.bulletCard.modal, title: data.bulletCard.text });
      c.classList.add('build');
      slot.appendChild(c);
    }
  },

  'stack-compare'(el, data) {
    el.innerHTML = header(data) + `
      <div class="slide-body">
        <div class="figure-wrap build stack-figure">${FIGURES[data.figure]()}</div>
        <div class="compare build">
          ${compareCol(data.compare.yes, 'yes', '✓')}
          ${compareCol(data.compare.no, 'no', '⚠')}
        </div>
        <div class="chip-slot build"></div>
      </div>`;
    if (data.chips) el.querySelector('.chip-slot').appendChild(makeChipRow(data.chips));
  },

  'figure-compare'(el, data) {
    el.innerHTML = header(data) + `
      <div class="slide-body">
        <div class="split" data-ratio="3-2">
          <div class="figure-wrap build">${FIGURES[data.figure]()}</div>
          <div class="build">
            <div class="compare compare--stacked">
              ${compareCol(data.compare.yes, 'yes', '✓')}
              ${compareCol(data.compare.no, 'no', '✗')}
            </div>
            <div class="chip-slot"></div>
          </div>
        </div>
      </div>`;
    if (data.chips) el.querySelector('.chip-slot').appendChild(makeChipRow(data.chips));
  },

  'cards-figure'(el, data) {
    el.innerHTML = header(data) + `
      <div class="slide-body">
        <div class="split" data-ratio="1-1">
          <div class="card-slot build"></div>
          <div class="figure-wrap build">${FIGURES[data.figure]()}</div>
        </div>
      </div>`;
    const grid = makeCardGrid(data.cards, { cols: 2 });
    el.querySelector('.card-slot').appendChild(grid);
  },

  breakeven(el, data) {
    /* Spec layout: two loan cards SIDE BY SIDE on top, the breakeven diagram
       BELOW, six chips around it. Cards read as a direct A-vs-B comparison. */
    el.innerHTML = header(data) + `
      <div class="slide-body breakeven-body">
        <div class="loan-cards-row build">
          ${data.loans.map(l => `
            <div class="loan-card${l.emphasis ? ' is-emphasis' : ''}">
              <p class="loan-name">${l.name}</p>
              <dl class="loan-rows">
                <div><dt>Rate</dt><dd>${l.rate}</dd></div>
                <div><dt>Points</dt><dd>${l.points}</dd></div>
                <div><dt>Monthly payment</dt><dd>${l.payment}</dd></div>
              </dl>
            </div>`).join('')}
        </div>
        <div class="breakeven-lower">
          <div class="figure-wrap build">${FIGURES.breakeven()}</div>
          <div class="chip-slot build"></div>
        </div>
      </div>`;
    el.querySelector('.chip-slot').appendChild(makeChipRow(data.chips));
  },

  timeline(el, data) {
    el.innerHTML = header(data) + `
      <div class="slide-body">
        <div class="figure-wrap build">${FIGURES.processTimeline(data.steps)}</div>
        <div class="timeline-nodes build"></div>
      </div>`;
    const nodes = el.querySelector('.timeline-nodes');
    data.steps.forEach(s => {
      const c = makeCard({ modal: s.modal, title: s.label, variant: 'chip' });
      nodes.appendChild(c);
    });
  },

  markers(el, data) {
    const half = Math.ceil(data.items.length / 2);
    const cols = data.cols === 2
      ? [data.items.slice(0, half), data.items.slice(half)]
      : [data.items];

    el.innerHTML = header(data) + `
      <div class="slide-body marker-body">
        <span class="accent-bar" data-tone="${data.tone}"></span>
        <div class="marker-cols" data-cols="${cols.length}">
          ${cols.map(group => `
            <ul class="marker-list">
              ${group.map(item => `
                <li class="build">
                  <span class="marker" data-tone="${data.tone}" aria-hidden="true">${data.tone === 'do' ? '✓' : '✗'}</span>
                  <span>${item}</span>
                </li>`).join('')}
            </ul>`).join('')}
        </div>
      </div>`;
  },

  wrap(el, data) {
    const socials = PLACEHOLDERS.socials.value
      ? `<p class="wrap-socials">${PLACEHOLDERS.socials.value}</p>`
      : `<p class="wrap-socials">${ph('socials')}</p>`;

    el.innerHTML = `
      <div class="split wrap-split" data-ratio="3-2">
        <div>
          <h2 class="wrap-headline build">Thank you</h2>
          <div class="wrap-presenter build">
            <p class="wrap-name">${presenter.name}</p>
            <p class="wrap-title">${presenter.title} · NMLS ${presenter.nmls}</p>
            <p class="wrap-company">${COMPANY.name} · NMLS ${COMPANY.nmls}</p>
          </div>
          <ul class="wrap-contact build">
            <li><span aria-hidden="true">📞</span> ${ph('phone')}</li>
            <li><span aria-hidden="true">✉️</span> ${presenter.email}</li>
            <li><span aria-hidden="true">🌐</span> ${ph('website')}</li>
          </ul>
          <div class="wrap-actions build">
            ${actionButton('APPLY NOW', 'applyUrl', 'primary')}
            ${actionButton('SCHEDULE A CONSULTATION', 'bookingUrl', 'ghost')}
          </div>
        </div>
        <div class="wrap-qr build">
          <img src="${QR_ASSET}" alt="QR code linking to apply and booking" class="qr-img">
          <p class="wrap-qr-target">${ph('qrTargetUrl')}</p>
          ${socials}
        </div>
      </div>
      <div class="wrap-close build">
        <p><strong>Thank you for spending your time with us.</strong></p>
        <p>Ask anything. That's what we're here for.</p>
      </div>`;
  },
};

function compareCol(col, tone, glyph) {
  return `
    <div class="compare-col" data-tone="${tone}">
      <p class="compare-col-head"><span aria-hidden="true">${glyph}</span> ${col.head}</p>
      <ul>${col.items.map(i => `<li>${i}</li>`).join('')}</ul>
    </div>`;
}

function actionButton(label, phKey, variant) {
  const p = PLACEHOLDERS[phKey];
  const live = p.value;
  if (live) {
    return `<a class="btn btn--${variant}" href="${live}" target="_blank" rel="noopener">${label}</a>`;
  }
  /* No link yet — render the button with a visible placeholder rather than a
     dead href that looks real. */
  return `<span class="btn btn--${variant} btn--placeholder" role="link"
                aria-disabled="true">${label}<small>${p.label} needed</small></span>`;
}

/* ---------------------------------------------------------------------------
   BUILD + NAVIGATION
   ------------------------------------------------------------------------ */
function runBuild(el) {
  const items = [...el.querySelectorAll('.build')];
  items.forEach(n => n.classList.remove('is-in'));
  /* Max 5 elements per build per the spec; anything past 5 lands with the 5th
     rather than extending the sequence indefinitely. */
  items.forEach((n, i) => {
    const step = Math.min(i, 5);
    setTimeout(() => n.classList.add('is-in'), 60 + step * 90);
  });
}

function show(i) {
  if (isModalOpen()) closeModal();
  current = Math.max(0, Math.min(SLIDES.length - 1, i));

  document.querySelectorAll('.slide').forEach((s, idx) => {
    s.classList.toggle('is-active', idx === current);
  });

  const active = document.querySelectorAll('.slide')[current];
  runBuild(active);

  document.querySelector('.nav-count').textContent = `${current + 1} / ${SLIDES.length}`;
  document.querySelector('.deck-progress').style.width =
    `${((current + 1) / SLIDES.length) * 100}%`;

  location.hash = SLIDES[current].id;
  broadcast();
}

const next = () => show(current + 1);
const prev = () => show(current - 1);

/* ---------------------------------------------------------------------------
   SCALING — keep the 1600x900 canvas whole so the type scale is honest.
   ------------------------------------------------------------------------ */
function fit() {
  if (window.matchMedia('(max-width: 900px)').matches) {
    scaler.style.transform = '';
    return;
  }
  const sx = stage.clientWidth / 1600;
  const sy = stage.clientHeight / 900;
  scaler.style.transform = `translate(-50%, -50%) scale(${Math.min(sx, sy)})`;
}

/* ---------------------------------------------------------------------------
   PRESENTER SYNC
   ------------------------------------------------------------------------ */
function broadcast() {
  if (!channel) return;
  channel.postMessage({ type: 'slide', index: current });
}

function initChannel() {
  if (!('BroadcastChannel' in window)) return;
  channel = new BroadcastChannel('msfg-deck');
  channel.onmessage = (e) => {
    const m = e.data;
    if (m.type === 'goto')  show(m.index);
    if (m.type === 'next')  next();
    if (m.type === 'prev')  prev();
    if (m.type === 'hello') broadcast();
    if (m.type === 'open')  openModal(m.id);
  };
}

/* ---------------------------------------------------------------------------
   BOOT
   ------------------------------------------------------------------------ */
export function initDeck() {
  stage  = document.querySelector('.stage');
  scaler = document.querySelector('.slide-scaler');

  initModal();

  SLIDES.forEach((data, i) => {
    const el = slideShell(data, i);
    (layouts[data.layout] || layouts.cards)(el, data);
    furniture(el, data);
    scaler.appendChild(el);
  });

  document.querySelector('[data-nav="next"]').addEventListener('click', next);
  document.querySelector('[data-nav="prev"]').addEventListener('click', prev);
  document.querySelector('[data-nav="presenter"]').addEventListener('click', () => {
    window.open('./presenter.html', 'msfg-presenter', 'width=1280,height=800');
  });

  document.addEventListener('keydown', (e) => {
    if (isModalOpen()) return;
    /* e.target can be `document` (no .matches), so test for an Element first. */
    if (e.target instanceof Element && e.target.matches('input, textarea, button')) return;
    switch (e.key) {
      case 'ArrowRight': case 'PageDown': case ' ': e.preventDefault(); next(); break;
      case 'ArrowLeft':  case 'PageUp':          e.preventDefault(); prev(); break;
      case 'Home': show(0); break;
      case 'End':  show(SLIDES.length - 1); break;
      case 'p': case 'P':
        window.open('./presenter.html', 'msfg-presenter', 'width=1280,height=800'); break;
      case 'g': case 'G':
        document.body.classList.toggle('show-guides'); break;
      case 'f': case 'F':
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen(); break;
    }
  });

  window.addEventListener('resize', fit);
  fit();
  initChannel();

  /* Deep link by slide id. */
  const fromHash = SLIDES.findIndex(s => s.id === location.hash.slice(1));
  show(fromHash >= 0 ? fromHash : 0);

  /* Spec conformance check, visible in the console at load. */
  const expected = { slides: 22, modals: 53 };
  const got = { slides: SLIDES.length, modals: MODAL_COUNT };
  const ok = got.slides === expected.slides && got.modals === expected.modals;
  console.log(
    `%c MSFG Homebuyer Webinar v6 %c ${got.slides} slides · ${got.modals} popouts · ` +
    `${Math.round(TARGET_RUNTIME_SECONDS / 60)} min ${ok ? '✓ matches spec' : '✗ SPEC MISMATCH'}`,
    'background:#104547;color:#8cc63E;font-weight:700;padding:2px 6px;border-radius:3px',
    'color:#104547'
  );
  if (!ok) console.warn('[deck] expected', expected, 'got', got);

  /* Orphan check — a popout nobody can open is a popout that doesn't exist. */
  const referenced = new Set();
  SLIDES.forEach(s => {
    (s.cards  || []).forEach(c => referenced.add(c.modal));
    (s.chips  || []).forEach(c => referenced.add(c.modal));
    (s.steps  || []).forEach(c => referenced.add(c.modal));
    if (s.bulletCard) referenced.add(s.bulletCard.modal);
  });
  const orphans = Object.keys(MODALS).filter(id => !referenced.has(id));
  const missing = [...referenced].filter(id => !MODALS[id]);
  if (orphans.length) console.warn('[deck] unreachable popouts:', orphans);
  if (missing.length) console.error('[deck] cards referencing missing popouts:', missing);
}

export { show, next, prev, SLIDES };
