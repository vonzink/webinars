/* ============================================================================
   PRESENTER VIEW — second window. Share the main window; keep this one private.
   ========================================================================= */

import { SLIDES, TARGET_RUNTIME_SECONDS } from '../content/slides.js';
import { MODALS } from '../content/modals.js';
import { activePresenter, COMPANY } from '../content/presenters.js';

const channel = new BroadcastChannel('msfg-deck');
const P = activePresenter();
let index = 0, startedAt = null, slideAt = null, tick = null;
const $ = s => document.querySelector(s);

function fmt(sec) {
  const s = Math.max(0, Math.round(sec));
  return `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
}
function targetAt(i) { return SLIDES.slice(0, i).reduce((a, s) => a + (s.time || 0), 0); }

function render() {
  const cur = SLIDES[index], nxt = SLIDES[index + 1];
  $('#p-position').textContent = `${index + 1} / ${SLIDES.length}`;
  $('#p-eyebrow').textContent = cur.eyebrow || '';
  $('#p-headline').textContent = cur.headline || cur.eyebrow || cur.id;
  $('#p-notes').innerHTML = (cur.notes || '—').split('\n\n').map(p => `<p>${p}</p>`).join('');
  $('#p-next').textContent = nxt ? (nxt.headline || nxt.eyebrow || nxt.id) : 'End — open Q&A';
  $('#p-slide-target').textContent = fmt(cur.time || 0);

  const ids = (cur.cards || []).map(c => c.modal);
  const list = $('#p-popouts');
  list.innerHTML = ids.length ? '' : '<li class="p-none">No popouts on this slide</li>';
  ids.forEach(id => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = MODALS[id] ? MODALS[id].title : id;
    b.addEventListener('click', () => channel.postMessage({ type: 'open', id }));
    li.appendChild(b); list.appendChild(li);
  });
  $('#p-popout-count').textContent = ids.length;
}

function updateClock() {
  if (!startedAt) return;
  const elapsed = (Date.now() - startedAt) / 1000;
  $('#p-elapsed').textContent = fmt(elapsed);
  const onSlide = slideAt ? (Date.now() - slideAt) / 1000 : 0;
  $('#p-slide-elapsed').textContent = fmt(onSlide);
  $('#p-slide-elapsed').dataset.state = onSlide > (SLIDES[index].time || 0) ? 'behind' : 'ok';
  const drift = elapsed - (targetAt(index) + (SLIDES[index].time || 0));
  const el = $('#p-drift');
  el.textContent = `${drift >= 0 ? '+' : '−'}${fmt(Math.abs(drift))}`;
  el.dataset.state = drift > 60 ? 'behind' : drift < -60 ? 'ahead' : 'ok';
}

function setIndex(i) { index = Math.max(0, Math.min(SLIDES.length - 1, i)); slideAt = Date.now(); render(); updateClock(); }
function startClock() {
  startedAt = Date.now(); slideAt = Date.now();
  $('#p-start').textContent = 'Restart timer';
  if (tick) clearInterval(tick);
  tick = setInterval(updateClock, 500); updateClock();
}

export function initPresenter() {
  $('#p-who').textContent = `${P.name} · ${P.title} · ${P.nmls}`;
  $('#p-company').textContent = `${COMPANY.name} · ${COMPANY.nmls}`;
  $('#p-total').textContent = fmt(TARGET_RUNTIME_SECONDS);
  channel.onmessage = e => { if (e.data.type === 'slide') setIndex(e.data.index); };
  channel.postMessage({ type: 'hello' });
  $('#p-prev').addEventListener('click', () => channel.postMessage({ type: 'prev' }));
  $('#p-next-btn').addEventListener('click', () => channel.postMessage({ type: 'next' }));
  $('#p-start').addEventListener('click', startClock);
  document.addEventListener('keydown', e => {
    if (e.target instanceof Element && e.target.matches('button')) return;
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); channel.postMessage({ type: 'next' }); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); channel.postMessage({ type: 'prev' }); }
  });
  render();
}
