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
import { loadPresenterShortcuts, savePresenterShortcuts } from './presenter-settings-store.js';
import { actionForEvent, formatDescriptor, resolveShortcuts } from './presenter-shortcuts.js';
import { createShortcutPanel } from './presenter-shortcut-panel.js';

const presenterParams = new URLSearchParams(location.search);
const validSessionId = value => typeof value === 'string' && /^[a-z0-9-]{1,100}$/i.test(value) ? value : '';
let openerSessionId = '';
try { openerSessionId = validSessionId(window.opener?.__msfgDeckSessionId); } catch { /* cross-origin opener */ }
const presenterSessionId = validSessionId(presenterParams.get('deck')) || openerSessionId ||
  `standalone-${globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`}`;
const channel = new BroadcastChannel(`msfg-deck:first-home-without-mystery:${presenterSessionId}`);
const requestedSlide = Number(presenterParams.get('slide'));
const initialSlide = Number.isInteger(requestedSlide)
  ? Math.max(0, Math.min(SLIDES.length - 1, requestedSlide))
  : 0;
const ACTIVE_LO_KEY = 'msfg-active-lo';
let presenters = [DEFAULT_PRESENTER];
let activeLo = DEFAULT_PRESENTER;
let notesCache = [];        // [{ id, slide_id, body, updated_at }] for the active presenter
let notesOffline = false;
let index = initialSlide, startedAt = null, slideAt = null, tick = null;
let annOn = false, barOn = false, navHidden = false, cashToCloseVisible = false;
let animationState = { current: 0, total: 0, playing: false };
let shortcutProfile = resolveShortcuts(null);
let shortcutPanel = null;
let shortcutRevision = 0;
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

function renderShortcutHints() {
  const first = action => formatDescriptor(shortcutProfile[action][0]);
  const draw = $('#p-draw-shortcut');
  if (draw) draw.textContent = first('toggleDrawing');
  $('#p-prev').title = `Previous slide (${first('previousSlide')})`;
  $('#p-next-btn').title = `Next slide (${first('nextSlide')})`;
  $('#p-animation-prev').title = `Previous animation build (${first('previousAnimation')})`;
  $('#p-animation-play').title = `Play animations (${first('toggleAnimationPlayback')})`;
  $('#p-animation-pause').title = `Pause animations (${first('toggleAnimationPlayback')})`;
  $('#p-animation-next').title = `Next animation build (${first('nextAnimation')})`;
  $('#p-fs').title = `Fullscreen the shared slide window (${first('toggleFullscreen')})`;
}

async function reloadShortcutProfile() {
  const presenterId = activeLo.id;
  const revision = ++shortcutRevision;
  const result = await loadPresenterShortcuts(presenterId);
  if (activeLo.id !== presenterId || shortcutRevision !== revision) return;
  shortcutProfile = result.shortcuts;
  shortcutPanel?.setProfile(shortcutProfile, result);
  renderShortcutHints();
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
    d.dataset.noteId = n.id;
    const t = document.createElement('div'); t.className = 'p-note-body'; t.textContent = n.body;
    const actions = document.createElement('div'); actions.className = 'p-note-actions';
    const edit = document.createElement('button');
    edit.type = 'button'; edit.className = 'p-note-icon';
    edit.setAttribute('aria-label', 'Edit note'); edit.setAttribute('title', 'Edit note');
    edit.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4"></path>
    </svg>`;
    const del = document.createElement('button');
    del.type = 'button'; del.className = 'p-note-icon is-delete';
    del.setAttribute('aria-label', 'Delete note'); del.setAttribute('title', 'Delete note');
    del.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"></path>
    </svg>`;
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
    actions.append(edit, del); d.append(t, actions); wrap.appendChild(d);
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
  reloadShortcutProfile();
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

function renderCashToCloseState(nextVisible) {
  cashToCloseVisible = Boolean(nextVisible);
  const button = $('#p-cash-to-close');
  const label = cashToCloseVisible ? 'Hide cash-to-close calculator' : 'Show cash-to-close calculator';
  button.classList.toggle('on', cashToCloseVisible);
  button.setAttribute('aria-label', label);
  button.setAttribute('title', label);
  button.setAttribute('aria-pressed', String(cashToCloseVisible));
}

function renderAnimationState(nextState) {
  const total = Math.max(0, Number(nextState?.total) || 0);
  const current = Math.max(0, Math.min(total, Number(nextState?.current) || 0));
  const playing = Boolean(nextState?.playing) && current < total;
  animationState = { current, total, playing };

  $('#p-animation-status').textContent = `${current} / ${total}`;
  const previous = $('#p-animation-prev');
  const play = $('#p-animation-play');
  const pause = $('#p-animation-pause');
  const next = $('#p-animation-next');
  previous.disabled = total === 0 || current === 0;
  play.disabled = total === 0 || playing;
  pause.disabled = total === 0 || !playing;
  next.disabled = total === 0 || current >= total;
  play.classList.toggle('on', playing);
  pause.classList.toggle('on', total > 0 && !playing && current < total);
}

function animationCommand(type) {
  channel.postMessage({ type: `animation-${type}` });
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

export function initPresenter() {
  renderWho();
  $('#p-company').textContent = `${COMPANY.name} · ${COMPANY.nmls}`;
  $('#p-total').textContent = fmt(TARGET_RUNTIME_SECONDS);
  const presenterSelect = $('#p-presenter');
  if (presenterSelect) presenterSelect.addEventListener('change', e => selectPresenter(e.target.value));

  let fsOn = false;
  const toggleFullscreen = () => {
    const target = !fsOn;
    /* Prefer a direct call into the opener (runs inside the keyboard/click gesture);
       fall back to the channel if there's no opener reference. */
    if (window.opener && !window.opener.closed && window.opener.__deckFullscreen) {
      window.opener.__deckFullscreen(target);
    } else {
      channel.postMessage({ type: 'fullscreen', on: target });
    }
  };

  shortcutPanel = createShortcutPanel({
    dialog: $('#p-shortcut-dialog'),
    list: $('#p-shortcut-list'),
    status: $('#p-shortcut-status'),
    saveButton: $('#p-shortcut-save'),
    presenterName: () => activeLo.name,
    onSave: async shortcuts => {
      const revision = ++shortcutRevision;
      const saved = await savePresenterShortcuts(activeLo.id, shortcuts);
      if (shortcutRevision !== revision) return shortcutProfile;
      shortcutProfile = saved;
      renderShortcutHints();
      return saved;
    },
  });
  shortcutPanel.setProfile(shortcutProfile);
  renderShortcutHints();

  channel.onmessage = e => {
    if (e.data.type === 'slide') setIndex(e.data.index);
    if (e.data.type === 'annstate') renderAnnState(e.data.on);
    if (e.data.type === 'fsstate') {    // slide window entered/left fullscreen
      fsOn = e.data.on;
      $('#p-fs').textContent = `⛶ Fullscreen slide: ${fsOn ? 'On' : 'Off'}`;
      $('#p-fs').classList.toggle('on', fsOn);
    }
    if (e.data.type === 'navstate') renderNavState(e.data.hidden);
    if (e.data.type === 'cash-to-close-state') renderCashToCloseState(e.data.visible);
    if (e.data.type === 'animation-state') renderAnimationState(e.data);
  };
  channel.postMessage({ type: 'hello' });

  $('#p-fs').addEventListener('click', toggleFullscreen);
  $('#p-nav-visibility').addEventListener('click', () => {
    channel.postMessage({ type: 'nav-visibility', hidden: !navHidden });
  });
  $('#p-cash-to-close').addEventListener('click', () => {
    channel.postMessage({ type: 'cash-to-close-visibility', visible: !cashToCloseVisible });
  });
  $('#p-shortcut-settings').addEventListener('click', () => shortcutPanel.open());

  $('#p-animation-prev').addEventListener('click', () => animationCommand('prev'));
  $('#p-animation-play').addEventListener('click', () => animationCommand('play'));
  $('#p-animation-pause').addEventListener('click', () => animationCommand('pause'));
  $('#p-animation-next').addEventListener('click', () => animationCommand('next'));

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
    if (shortcutPanel.isOpen() || e.repeat || isTextEntryTarget(e.target)) return;
    const action = actionForEvent(e, shortcutProfile);
    if (!action) return;
    if (e.target instanceof Element && e.target.matches('select')) return;
    if (e.target instanceof Element && e.target.matches('button') && ['Space', 'Enter'].includes(e.code)) return;
    e.preventDefault();
    if (action === 'previousSlide') channel.postMessage({ type: 'prev' });
    if (action === 'nextSlide') channel.postMessage({ type: 'next' });
    if (action === 'previousAnimation') animationCommand('prev');
    if (action === 'toggleAnimationPlayback') animationCommand(animationState.playing ? 'pause' : 'play');
    if (action === 'nextAnimation') animationCommand('next');
    if (action === 'toggleDrawing') setAnnOn(!annOn);
    if (action === 'toggleFullscreen') toggleFullscreen();
  });

  window.addEventListener('pagehide', restoreNavigation);
  window.addEventListener('beforeunload', restoreNavigation);

  renderAnimationState(animationState);
  render();
  initPresenterPicker();   // loads roster, restores selection, syncs the deck + notes
}
