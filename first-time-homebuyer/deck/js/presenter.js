/* ============================================================================
   PRESENTER VIEW

   A second window. Share the MAIN window; keep this one on your own screen.

   Shows: current slide, next slide, the spec's presenter notes verbatim,
   an elapsed timer, and pacing against the per-slide target times from the
   spec — so you can see you're 40 seconds long on Budget 2 while there's
   still time to do something about it.
   ========================================================================= */

import { SLIDES, TARGET_RUNTIME_SECONDS } from '../content/slides.js';
import { MODALS } from '../content/modals.js';
import { activePresenter, COMPANY } from '../content/presenters.js';

const channel = new BroadcastChannel('msfg-deck');
const presenter = activePresenter();

let index = 0;
let startedAt = null;
let slideEnteredAt = null;
let tick = null;

const $ = s => document.querySelector(s);

function fmt(sec) {
  const s = Math.max(0, Math.round(sec));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/* Cumulative target time at the START of slide i — what the clock should
   read when you arrive. */
function targetAt(i) {
  return SLIDES.slice(0, i).reduce((a, s) => a + (s.time || 0), 0);
}

function render() {
  const cur  = SLIDES[index];
  const next = SLIDES[index + 1];

  $('#p-position').textContent = `${index + 1} / ${SLIDES.length}`;
  $('#p-section').textContent  = cur.section;
  $('#p-headline').textContent = cur.headline || cur.title || cur.section;
  $('#p-concept').textContent  = cur.concept || '';
  $('#p-concept').hidden = !cur.concept;

  $('#p-notes').innerHTML = (cur.notes || '—')
    .split('\n\n')
    .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('');

  $('#p-next').textContent = next
    ? `${next.headline || next.title || next.section}`
    : 'End of deck — open Q&A';

  $('#p-slide-target').textContent = fmt(cur.time || 0);

  /* Popouts available on this slide — so you know what you can open without
     hunting for it mid-sentence. */
  const ids = [
    ...(cur.cards || []).map(c => c.modal),
    ...(cur.chips || []).map(c => c.modal),
    ...(cur.steps || []).map(c => c.modal),
    ...(cur.bulletCard ? [cur.bulletCard.modal] : []),
  ];
  const list = $('#p-popouts');
  list.innerHTML = '';
  if (!ids.length) {
    list.innerHTML = '<li class="p-none">No popouts on this slide</li>';
  } else {
    ids.forEach(id => {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = MODALS[id] ? MODALS[id].title : id;
      b.addEventListener('click', () => channel.postMessage({ type: 'open', id }));
      li.appendChild(b);
      list.appendChild(li);
    });
  }
  $('#p-popout-count').textContent = ids.length ? `${ids.length}` : '0';
}

function updateClock() {
  if (!startedAt) return;
  const elapsed = (Date.now() - startedAt) / 1000;
  $('#p-elapsed').textContent = fmt(elapsed);

  const onSlide = slideEnteredAt ? (Date.now() - slideEnteredAt) / 1000 : 0;
  $('#p-slide-elapsed').textContent = fmt(onSlide);

  /* Pacing: where the clock should read vs where it does. */
  const should = targetAt(index) + (SLIDES[index].time || 0);
  const drift = elapsed - should;
  const el = $('#p-drift');
  el.textContent = `${drift >= 0 ? '+' : '−'}${fmt(Math.abs(drift))}`;
  el.dataset.state = drift > 60 ? 'behind' : drift < -60 ? 'ahead' : 'ok';

  const overSlide = onSlide > (SLIDES[index].time || 0);
  $('#p-slide-elapsed').dataset.state = overSlide ? 'behind' : 'ok';
}

function setIndex(i) {
  index = Math.max(0, Math.min(SLIDES.length - 1, i));
  slideEnteredAt = Date.now();
  render();
  updateClock();
}

function startClock() {
  startedAt = Date.now();
  slideEnteredAt = Date.now();
  $('#p-start').textContent = 'Restart timer';
  if (tick) clearInterval(tick);
  tick = setInterval(updateClock, 500);
  updateClock();
}

export function initPresenter() {
  $('#p-presenter').textContent = `${presenter.name} · ${presenter.title} · NMLS ${presenter.nmls}`;
  $('#p-company').textContent = `${COMPANY.name} · NMLS ${COMPANY.nmls}`;
  $('#p-total').textContent = fmt(TARGET_RUNTIME_SECONDS);

  channel.onmessage = (e) => {
    if (e.data.type === 'slide') setIndex(e.data.index);
  };
  channel.postMessage({ type: 'hello' });

  $('#p-prev').addEventListener('click',  () => channel.postMessage({ type: 'prev' }));
  $('#p-next-btn').addEventListener('click', () => channel.postMessage({ type: 'next' }));
  $('#p-start').addEventListener('click', startClock);

  document.addEventListener('keydown', (e) => {
    if (e.target instanceof Element && e.target.matches('button')) return;
    if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault(); channel.postMessage({ type: 'next' });
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault(); channel.postMessage({ type: 'prev' });
    }
  });

  render();
}
