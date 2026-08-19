/* ============================================================================
   PRESENTER VIEW — second window. Share the main window; keep this one private.
   Speaker notes · pace clocks · popouts · live mini next-slide preview ·
   annotation controls (drive the shared slide) · save/edit/delete notes.
   ========================================================================= */

import { SLIDES, TARGET_RUNTIME_SECONDS } from '../content/slides.js';
import { MODALS } from '../content/modals.js';
import { mediaForSlide } from '../content/presenter-media.js';
import { COMPANY } from '../content/presenters.js';
import { fetchPresenters, findPresenter, DEFAULT_PRESENTER } from './roster.js';
import { listNotes, addNote as apiAddNote, editNote as apiEditNote, deleteNote as apiDeleteNote } from './notes-store.js';

const channel = new BroadcastChannel('msfg-deck');
const ACTIVE_LO_KEY = 'msfg-active-lo';
let presenters = [DEFAULT_PRESENTER];
let activeLo = DEFAULT_PRESENTER;
let notesCache = [];        // [{ id, slide_id, body, updated_at }] for the active presenter
let notesOffline = false;
let index = 0, startedAt = null, slideAt = null, tick = null;
let annOn = false, barOn = false, navHidden = false, calculatorVisible = false, buydownVisible = false;
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

  const media = mediaForSlide(cur.id);
  const library = $('#p-library-grid');
  const section = $('#p-media-section');
  const mediaList = $('#p-media-list');
  section.hidden = media.length === 0;
  library.classList.toggle('is-single', media.length === 0);
  mediaList.innerHTML = '';
  media.forEach(item => {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = item.title;
    button.addEventListener('click', () => channel.postMessage({ type: 'open-media', id: item.id }));
    li.appendChild(button);
    mediaList.appendChild(li);
  });
  $('#p-media-count').textContent = String(media.length);

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

/* ---- my notes — persisted per presenter (loan officer) via the webinar API ---- */
async function reloadNotes() {
  const { notes, offline } = await listNotes(activeLo.id);
  notesCache = notes; notesOffline = offline;
  renderNotes();
}
const notesForSlide = slideId => notesCache.filter(n => n.slide_id === slideId);

function renderNotes() {
  const slideId = SLIDES[index].id;
  const rows = notesForSlide(slideId);
  const wrap = $('#p-note-list');
  wrap.innerHTML = '';
  if (notesOffline) {
    const w = document.createElement('div'); w.className = 'p-note-none';
    w.textContent = 'Offline — showing cached notes. Reconnect to save changes.';
    wrap.appendChild(w);
  }
  if (!rows.length) {
    const none = document.createElement('div'); none.className = 'p-note-none';
    none.textContent = 'No notes yet for this slide.';
    wrap.appendChild(none);
    return;
  }
  rows.forEach(n => {
    const d = document.createElement('div'); d.className = 'p-note';
    const t = document.createElement('div'); t.textContent = n.body;
    const row = document.createElement('div'); row.className = 'row';
    const edit = document.createElement('button'); edit.textContent = 'Edit';
    const del = document.createElement('button'); del.textContent = 'Delete';
    edit.addEventListener('click', async () => {
      const v = prompt('Edit note', n.body); if (v === null) return;
      const body = v.trim();
      try {
        if (!body) { await apiDeleteNote(n.id); notesCache = notesCache.filter(x => x.id !== n.id); }
        else {
          const updated = await apiEditNote(n.id, body);
          const i = notesCache.findIndex(x => x.id === n.id); if (i >= 0) notesCache[i] = updated;
        }
        renderNotes();
      } catch { alert('Could not save the edit — check your connection.'); }
    });
    del.addEventListener('click', async () => {
      try { await apiDeleteNote(n.id); notesCache = notesCache.filter(x => x.id !== n.id); renderNotes(); }
      catch { alert('Could not delete the note — check your connection.'); }
    });
    row.append(edit, del); d.append(t, row); wrap.appendChild(d);
  });
}

async function addNote() {
  const inp = $('#p-note-input'), v = inp.value.trim(); if (!v) return;
  const slideId = SLIDES[index].id, save = $('#p-note-save');
  save.disabled = true;
  try {
    const note = await apiAddNote(activeLo.id, slideId, v);
    notesCache.push(note); inp.value = ''; renderNotes();
  } catch { alert('Could not save the note — check your connection.'); }
  finally { save.disabled = false; }
}

/* ---- presenter picker (roster: Seth default + presentation-ready LOs) ---- */
function presenterToPlain(p) {
  return { id: p.id, name: p.name, title: p.title, nmls: p.nmls, phone: p.phone,
    email: p.email, email2: p.email2, portrait: p.portrait, scheduleUrl: p.scheduleUrl,
    city: p.city, state: p.state };
}
function renderWho() {
  $('#p-who').textContent = [activeLo.name, activeLo.title, activeLo.nmls].filter(Boolean).join(' · ');
}
function selectPresenter(id, { broadcast = true } = {}) {
  activeLo = findPresenter(presenters, id);
  try { localStorage.setItem(ACTIVE_LO_KEY, activeLo.id); } catch { /* ignore */ }
  const sel = $('#p-presenter'); if (sel) sel.value = activeLo.id;
  renderWho();
  if (broadcast) channel.postMessage({ type: 'set-presenter', presenter: presenterToPlain(activeLo) });
  reloadNotes();
}
async function initPresenterPicker() {
  presenters = await fetchPresenters();
  const sel = $('#p-presenter');
  if (sel) {
    sel.innerHTML = presenters
      .map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  }
  let saved = DEFAULT_PRESENTER.id;
  try { saved = localStorage.getItem(ACTIVE_LO_KEY) || saved; } catch { /* ignore */ }
  selectPresenter(saved);
}

/* ---- annotation controls (drive the shared slide) ---- */
function ann(msg) { channel.postMessage({ type: 'annotate', ...msg }); }
function renderAnnState(on) {
  annOn = Boolean(on);
  const button = $('#p-annon');
  $('#p-ann-state').textContent = annOn ? 'On' : 'Off';
  button.classList.toggle('on', annOn);
  button.setAttribute('aria-pressed', String(annOn));
}

function setAnnOn(on) {
  renderAnnState(on);
  ann({ on: annOn });
  if (!annOn) {
    barOn = false;
    const toolbar = $('#p-anntoolbar');
    if (toolbar) {
      toolbar.textContent = 'On-slide tools: Off';
      toolbar.classList.remove('on');
    }
  }
}

function renderNavState(hidden) {
  navHidden = Boolean(hidden);
  const button = $('#p-nav-visibility');
  button.textContent = `Slide navigation: ${navHidden ? 'Hidden' : 'Shown'}`;
  button.classList.toggle('on', navHidden);
}

function renderCalculatorState(nextVisible) {
  calculatorVisible = Boolean(nextVisible);
  const button = $('#p-calculator');
  const label = calculatorVisible ? 'Hide mortgage calculator' : 'Show mortgage calculator';
  button.classList.toggle('on', calculatorVisible);
  button.setAttribute('aria-label', label);
  button.setAttribute('title', label);
  button.setAttribute('aria-pressed', String(calculatorVisible));
}

function renderBuydownState(nextVisible) {
  buydownVisible = Boolean(nextVisible);
  const button = $('#p-buydown');
  const label = buydownVisible ? 'Hide buydown calculator' : 'Show 2-1 buydown calculator';
  button.classList.toggle('on', buydownVisible);
  button.setAttribute('aria-label', label);
  button.setAttribute('title', label);
  button.setAttribute('aria-pressed', String(buydownVisible));
}

function restoreNavigation() {
  channel.postMessage({ type: 'presenter-exit' });
  if (window.opener && !window.opener.closed && window.opener.__deckSetNavigationHidden) {
    window.opener.__deckSetNavigationHidden(false);
  }
}

function isTextEntryTarget(target) {
  return target instanceof Element && (
    target.matches('input, textarea, select') ||
    target.isContentEditable ||
    Boolean(target.closest('[contenteditable="true"]'))
  );
}

function isDrawShortcut(event) {
  return event.key.toLowerCase() === 'd' &&
    !event.repeat &&
    !event.ctrlKey &&
    !event.altKey &&
    !event.metaKey &&
    !isTextEntryTarget(event.target);
}

export function initPresenter() {
  renderWho();
  $('#p-company').textContent = `${COMPANY.name} · ${COMPANY.nmls}`;
  $('#p-total').textContent = fmt(TARGET_RUNTIME_SECONDS);
  const presenterSelect = $('#p-presenter');
  if (presenterSelect) presenterSelect.addEventListener('change', e => selectPresenter(e.target.value));

  let fsOn = false;
  channel.onmessage = e => {
    if (e.data.type === 'slide') setIndex(e.data.index);
    if (e.data.type === 'annstate') renderAnnState(e.data.on);
    if (e.data.type === 'fsstate') {    // slide window entered/left fullscreen
      fsOn = e.data.on;
      $('#p-fs').textContent = `⛶ Fullscreen slide: ${fsOn ? 'On' : 'Off'}`;
      $('#p-fs').classList.toggle('on', fsOn);
    }
    if (e.data.type === 'navstate') renderNavState(e.data.hidden);
    if (e.data.type === 'calculator-state') renderCalculatorState(e.data.visible);
    if (e.data.type === 'buydown-state') renderBuydownState(e.data.visible);
  };
  channel.postMessage({ type: 'hello' });

  $('#p-fs').addEventListener('click', () => {
    const target = !fsOn;
    /* Prefer a direct call into the opener (runs inside this click gesture);
       fall back to the channel if there's no opener reference. */
    if (window.opener && !window.opener.closed && window.opener.__deckFullscreen) {
      window.opener.__deckFullscreen(target);
    } else {
      channel.postMessage({ type: 'fullscreen', on: target });
    }
  });
  $('#p-nav-visibility').addEventListener('click', () => {
    channel.postMessage({ type: 'nav-visibility', hidden: !navHidden });
  });
  $('#p-calculator').addEventListener('click', () => {
    channel.postMessage({ type: 'calculator-visibility', visible: !calculatorVisible });
  });
  $('#p-buydown').addEventListener('click', () => {
    channel.postMessage({ type: 'buydown-visibility', visible: !buydownVisible });
  });

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
    else if (b.hasAttribute('data-annundo')) ann({ undo: true });
    else if (b.hasAttribute('data-annredo')) ann({ redo: true });
    else if (b.hasAttribute('data-annclear')) ann({ clear: true });
  });

  document.addEventListener('keydown', e => {
    if (isDrawShortcut(e)) {
      e.preventDefault();
      setAnnOn(!annOn);
      return;
    }
    if (e.target instanceof Element &&
        (e.target.matches('button, textarea, input, select') || e.target.isContentEditable)) return;
    if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault();
      channel.postMessage({ type: 'next' });
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      channel.postMessage({ type: 'prev' });
    }
  });

  window.addEventListener('pagehide', restoreNavigation);
  window.addEventListener('beforeunload', restoreNavigation);

  render();
  initPresenterPicker();   // loads roster, restores selection, syncs the deck + notes
}
