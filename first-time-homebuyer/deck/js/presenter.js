/* ============================================================================
   PRESENTER VIEW — second window. Share the main window; keep this one private.
   Speaker notes · pace clocks · popouts · live mini next-slide preview ·
   annotation controls (drive the shared slide) · save/edit/delete notes.
   ========================================================================= */

import { SLIDES, TARGET_RUNTIME_SECONDS } from '../content/slides.js';
import { MODALS } from '../content/modals.js';
import { activePresenter, COMPANY } from '../content/presenters.js';

const channel = new BroadcastChannel('msfg-deck');
const P = activePresenter();
let index = 0, startedAt = null, slideAt = null, tick = null, annOn = false, barOn = false;
const $ = s => document.querySelector(s);
const fmt = sec => { const s = Math.max(0, Math.round(sec));
  return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`; };
const targetAt = i => SLIDES.slice(0, i).reduce((a, s) => a + (s.time || 0), 0);

/* ---- render current slide ---- */
function render() {
  const cur = SLIDES[index], nxt = SLIDES[index + 1];
  $('#p-position').textContent = `${index + 1} / ${SLIDES.length}`;
  $('#p-eyebrow').textContent = cur.eyebrow || '';
  $('#p-headline').textContent = cur.headline || cur.eyebrow || cur.id;
  $('#p-notes').innerHTML = (cur.notes || '—').split('\n\n').map(p => `<p>${p}</p>`).join('');
  $('#p-next').textContent = nxt ? (nxt.headline || nxt.eyebrow || nxt.id) : 'End — open Q&A';
  $('#p-slide-target').textContent = fmt(cur.time || 0);

  // mini preview -> next slide (or current on the last slide)
  const previewId = (nxt || cur).id;
  const frame = $('#p-preview-frame');
  try { if (frame.contentWindow) frame.contentWindow.location.hash = previewId; }
  catch (e) { frame.src = `./index.html?preview#${previewId}`; }

  const ids = (cur.cards || []).map(c => c.modal).concat(cur.compareModal ? [cur.compareModal] : []);
  const list = $('#p-popouts');
  list.innerHTML = ids.length ? '' : '<li class="p-none">No popouts on this slide</li>';
  ids.forEach(id => {
    const li = document.createElement('li'); const b = document.createElement('button');
    b.type = 'button'; b.textContent = MODALS[id] ? MODALS[id].title : id;
    b.addEventListener('click', () => channel.postMessage({ type: 'open', id }));
    li.appendChild(b); list.appendChild(li);
  });
  $('#p-popout-count').textContent = ids.length;

  renderNotes();
}

/* ---- clocks ---- */
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
  startedAt = Date.now(); slideAt = Date.now(); $('#p-start').textContent = 'Restart timer';
  if (tick) clearInterval(tick); tick = setInterval(updateClock, 500); updateClock();
}

/* ---- my notes (persisted per slide) ---- */
const notesKey = id => `msfg-notes:${id}`;
function loadNotes(id) { try { return JSON.parse(localStorage.getItem(notesKey(id))) || []; } catch { return []; } }
function saveNotes(id, arr) { localStorage.setItem(notesKey(id), JSON.stringify(arr)); }
function renderNotes() {
  const id = SLIDES[index].id, arr = loadNotes(id), wrap = $('#p-note-list');
  wrap.innerHTML = arr.length ? '' : '<div class="p-note-none">No notes yet for this slide.</div>';
  arr.forEach((n, i) => {
    const d = document.createElement('div'); d.className = 'p-note';
    const t = document.createElement('div'); t.textContent = n;
    const row = document.createElement('div'); row.className = 'row';
    const edit = document.createElement('button'); edit.textContent = 'Edit';
    const del = document.createElement('button'); del.textContent = 'Delete';
    edit.addEventListener('click', () => {
      const v = prompt('Edit note', n); if (v !== null) { arr[i] = v.trim(); if (!arr[i]) arr.splice(i,1); saveNotes(id, arr); renderNotes(); }
    });
    del.addEventListener('click', () => { arr.splice(i, 1); saveNotes(id, arr); renderNotes(); });
    row.append(edit, del); d.append(t, row); wrap.appendChild(d);
  });
}
function addNote() {
  const inp = $('#p-note-input'), v = inp.value.trim(); if (!v) return;
  const id = SLIDES[index].id, arr = loadNotes(id); arr.push(v); saveNotes(id, arr);
  inp.value = ''; renderNotes();
}

/* ---- annotation controls (drive the shared slide) ---- */
function ann(msg) { channel.postMessage({ type: 'annotate', ...msg }); }
function setAnnOn(on) {
  annOn = on; $('#p-annon').textContent = `Draw: ${on ? 'On' : 'Off'}`;
  $('#p-annon').classList.toggle('on', on); ann({ on });
  if (!on) { barOn = false; const t = $('#p-anntoolbar');
    if (t) { t.textContent = 'On-slide tools: Off'; t.classList.remove('on'); } }
}

export function initPresenter() {
  $('#p-who').textContent = `${P.name} · ${P.title} · ${P.nmls}`;
  $('#p-company').textContent = `${COMPANY.name} · ${COMPANY.nmls}`;
  $('#p-total').textContent = fmt(TARGET_RUNTIME_SECONDS);

  channel.onmessage = e => {
    if (e.data.type === 'slide') setIndex(e.data.index);
    if (e.data.type === 'annstate') {   // auto-off flipped drawing off on the shared slide
      annOn = e.data.on;
      $('#p-annon').textContent = `Draw: ${annOn ? 'On' : 'Off'}`;
      $('#p-annon').classList.toggle('on', annOn);
    }
  };
  channel.postMessage({ type: 'hello' });

  $('#p-prev').addEventListener('click', () => channel.postMessage({ type: 'prev' }));
  $('#p-next-btn').addEventListener('click', () => channel.postMessage({ type: 'next' }));
  $('#p-start').addEventListener('click', startClock);
  $('#p-note-save').addEventListener('click', addNote);

  $('#p-annon').addEventListener('click', () => setAnnOn(!annOn));
  let autoOff = false;
  $('#p-autooff').addEventListener('click', () => {
    autoOff = !autoOff;
    $('#p-autooff').textContent = `Auto-off: ${autoOff ? 'On' : 'Off'}`;
    $('#p-autooff').classList.toggle('on', autoOff);
    ann({ autoOff });
  });
  $('#p-anntoolbar').addEventListener('click', () => {
    barOn = !barOn; if (barOn && !annOn) setAnnOn(true);
    $('#p-anntoolbar').textContent = `On-slide tools: ${barOn ? 'On' : 'Off'}`;
    $('#p-anntoolbar').classList.toggle('on', barOn);
    ann({ toolbar: barOn });
  });
  document.querySelector('.p-right').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || !b.closest('.p-tools')) return;
    if (b.dataset.tool) { if (!annOn) setAnnOn(true); ann({ tool: b.dataset.tool });
      document.querySelectorAll('[data-tool]').forEach(x => x.classList.toggle('on', x === b)); }
    else if (b.dataset.color) { ann({ color: b.dataset.color });
      document.querySelectorAll('.csw').forEach(x => x.classList.toggle('on', x === b)); }
    else if (b.hasAttribute('data-annclear')) ann({ clear: true });
  });

  document.addEventListener('keydown', e => {
    if (e.target instanceof Element && e.target.matches('button, textarea, input')) return;
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); channel.postMessage({ type: 'next' }); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); channel.postMessage({ type: 'prev' }); }
  });

  render();
}
