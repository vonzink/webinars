/* ============================================================================
   SLIDE SETTINGS — editor.html.
   Left: the Master CSS and every slide. Middle: the selected slide, live; its
   text can be changed right on the slide. Right: the slide's HTML, its own CSS
   and its own JS (or the Master CSS). Save stores the change for everyone.
   The view is this deck in an iframe; the editor drives its slides directly.
   ========================================================================= */

import { SLIDES } from '../content/slides.js';
import { WEBINAR } from '../content/webinar-config.js';
import { createSlideEditClient, MASTER_ID } from './slide-edits.js';

const PASSWORD_KEY = 'msfg-slide-edit-password';
const PREVIEW_DELAY_MS = 200;
const $ = selector => document.querySelector(selector);
const titleOf = slide => slide.headline || slide.eyebrow || slide.id;
const isSlide = id => id !== MASTER_ID;

export function initSlideEditor() {
  const client = createSlideEditClient({ base: WEBINAR.slideEditsApi, slug: WEBINAR.slug });
  const frame = $('#e-preview');
  const boxes = { html: $('#e-html'), css: $('#e-css'), js: $('#e-js'), master: $('#e-master') };
  const saveButton = $('#e-save');
  const discardButton = $('#e-discard');
  const resetButton = $('#e-reset');
  const passwordBox = $('#e-password');
  const status = $('#e-status');

  let stage = null;                 // the embedded deck's slide stage
  let selected = null;              // a slide id, or MASTER_ID
  let viewed = SLIDES[0].id;        // the slide on show in the view
  const tabs = { slide: 'html', master: 'master' };
  const drafts = new Map();         // id -> unsaved { html, css, js } (Master: { css })
  const sources = new Map();        // slide id -> what the deck holds for it
  let previewTimer = null;
  let confirmReset = false;
  let busy = false;

  const setStatus = (message, state = '') => { status.textContent = message; status.dataset.state = state; };
  const remembered = () => { try { return sessionStorage.getItem(PASSWORD_KEY) || ''; } catch { return ''; } };
  const remember = password => {
    try { password ? sessionStorage.setItem(PASSWORD_KEY, password) : sessionStorage.removeItem(PASSWORD_KEY); } catch { /* ignore */ }
  };

  function source(id) {
    if (!sources.has(id)) sources.set(id, stage.source(id));
    return sources.get(id);
  }
  const baseline = id => (isSlide(id)
    ? { html: source(id).html, css: source(id).css, js: source(id).js }
    : { css: stage.masterSource().css });
  const fields = id => drafts.get(id) || baseline(id);
  const same = (a, b) => Object.keys(a).every(key => a[key] === b[key]);

  /* ---- list ---- */
  function buildList() {
    const list = $('#e-list');
    const item = (id, number, title) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'e-item';
      button.dataset.id = id;
      button.innerHTML = '<span class="e-item-head"><span class="e-item-number"></span><span class="e-item-title"></span><span class="e-badge" hidden></span></span>';
      button.querySelector('.e-item-number').textContent = number;
      button.querySelector('.e-item-title').textContent = title;
      button.addEventListener('click', () => select(id));
      list.appendChild(button);
      return button;
    };
    const master = item(MASTER_ID, '◆', 'Master CSS');
    const note = document.createElement('span');
    note.className = 'e-item-note';
    note.textContent = 'Styles for every slide';
    master.appendChild(note);
    SLIDES.forEach((slide, index) => {
      const button = item(slide.id, String(index + 1), titleOf(slide));
      const thumb = document.createElement('span');
      thumb.className = 'e-thumb';
      const preview = document.createElement('iframe');
      preview.loading = 'lazy';
      preview.tabIndex = -1;
      preview.title = `Slide ${index + 1} preview`;
      preview.src = `./index.html?preview#${slide.id}`;
      thumb.appendChild(preview);
      button.appendChild(thumb);
    });
  }

  function refreshThumbs(id) {
    document.querySelectorAll('.e-item iframe').forEach(preview => {
      if (id && preview.closest('.e-item').dataset.id !== id) return;
      try { preview.contentWindow.location.reload(); } catch { /* not loaded yet */ }
    });
  }

  function refreshState() {
    document.querySelectorAll('.e-item').forEach(button => {
      const { id } = button.dataset;
      const badge = button.querySelector('.e-badge');
      const kind = drafts.has(id) ? 'unsaved' : stage.isEdited(id) ? 'edited' : '';
      badge.hidden = !kind;
      badge.dataset.kind = kind;
      badge.textContent = kind === 'unsaved' ? 'Unsaved' : 'Edited';
      if (id === selected) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
    const dirty = drafts.has(selected);
    saveButton.disabled = busy || !dirty;
    discardButton.disabled = busy || !dirty;
    resetButton.disabled = busy || !stage.isEdited(selected);
    resetButton.textContent = confirmReset ? 'Click again to reset' : 'Reset to original';
  }

  /* ---- tabs ---- */
  function showTab(name) {
    const mode = isSlide(selected) ? 'slide' : 'master';
    if (name) tabs[mode] = name;
    document.querySelectorAll('#e-tabs button').forEach(button => {
      button.hidden = button.dataset.for !== mode;
      button.setAttribute('aria-selected', String(button.dataset.tab === tabs[mode]));
    });
    document.querySelectorAll('.e-pane').forEach(pane => { pane.hidden = pane.dataset.pane !== tabs[mode]; });
    if (tabs[mode] === 'builtin') loadBuiltIn();
  }

  let builtInLoaded = false;
  async function loadBuiltIn() {
    if (builtInLoaded) return;
    builtInLoaded = true;
    const links = [...frame.contentDocument.querySelectorAll('link[rel="stylesheet"]')]
      .filter(link => new URL(link.href).origin === location.origin);
    const parts = await Promise.all(links.map(async link => {
      const name = link.getAttribute('href');
      try { return `/* ===== ${name} ===== */\n${await (await fetch(link.href)).text()}`; }
      catch { return `/* ===== ${name} could not be loaded ===== */`; }
    }));
    $('#e-builtin').textContent = parts.join('\n\n');
  }

  /* ---- selection ---- */
  function fill() {
    const values = fields(selected);
    if (isSlide(selected)) {
      boxes.html.value = values.html;
      boxes.css.value = values.css;
      boxes.js.value = values.js;
      $('#e-reference').textContent = source(selected).reference || 'No deck styles found for this slide.';
    } else {
      boxes.master.value = values.css;
    }
  }

  function describe() {
    if (drafts.has(selected)) return setStatus('Not saved yet.');
    if (!stage.isEdited(selected)) return setStatus(isSlide(selected) ? 'This is the original slide.' : 'No Master CSS saved yet.');
    return setStatus(isSlide(selected)
      ? 'This slide has a saved edit. Reset brings back the original.'
      : 'A Master CSS is saved. Reset removes it.');
  }

  function select(id) {
    selected = id;
    confirmReset = false;
    if (isSlide(id)) {
      viewed = id;
      frame.contentWindow.location.hash = id;
      const index = SLIDES.findIndex(slide => slide.id === id);
      $('#e-kicker').textContent = `Slide ${index + 1} of ${SLIDES.length}`;
      $('#e-title').textContent = titleOf(SLIDES[index]);
      history.replaceState(null, '', `#${id}`);
    } else {
      $('#e-kicker').textContent = 'Every slide';
      $('#e-title').textContent = 'Master CSS';
    }
    fill();
    showTab();
    describe();
    refreshState();
  }

  /* ---- drafts ---- */
  function keepDraft(id, values) {
    if (same(values, baseline(id))) drafts.delete(id);
    else drafts.set(id, values);
    confirmReset = false;
    refreshState();
  }

  function typed() {
    const id = selected;
    const values = isSlide(id)
      ? { html: boxes.html.value, css: boxes.css.value, js: boxes.js.value }
      : { css: boxes.master.value };
    keepDraft(id, values);
    setStatus(drafts.has(id) ? 'Not saved yet.' : '');
    clearTimeout(previewTimer);
    previewTimer = setTimeout(() => {
      if (!isSlide(id)) return stage.previewMaster(values.css);
      const error = stage.preview(id, values);
      if (error && selected === id) setStatus(`Slide JS error: ${error}`, 'error');
      return null;
    }, PREVIEW_DELAY_MS);
  }

  /* Text typed straight onto the slide in the view. */
  function typedOnSlide() {
    if (selected !== viewed) select(viewed);
    const id = viewed;
    boxes.html.value = stage.currentHtml(id);
    keepDraft(id, { html: boxes.html.value, css: boxes.css.value, js: boxes.js.value });
    setStatus('Not saved yet.');
  }

  function discard() {
    const id = selected;
    clearTimeout(previewTimer);
    drafts.delete(id);
    if (isSlide(id)) stage.revert(id); else stage.revertMaster();
    select(id);
  }

  /* ---- save / reset ---- */
  function password() {
    if (passwordBox.value) return passwordBox.value;
    setStatus('Enter the edit password first.', 'error');
    passwordBox.focus();
    return null;
  }

  async function send(work) {
    busy = true;
    refreshState();
    const result = await work();
    busy = false;
    if (result.ok) remember(passwordBox.value);
    else {
      if (result.wrongPassword) remember('');
      setStatus(result.message, 'error');
    }
    refreshState();
    return result.ok;
  }

  function afterChange(id, message) {
    clearTimeout(previewTimer);
    drafts.delete(id);
    sources.delete(id);
    refreshThumbs(isSlide(id) ? id : null);
    select(id);
    setStatus(message, 'saved');
  }

  async function remove(id, pass) {
    setStatus('Resetting…');
    if (!await send(() => client.reset(id, pass))) return;
    if (isSlide(id)) stage.commit(id, null); else stage.commitMaster('');
    afterChange(id, isSlide(id) ? 'Reset. Everyone sees the original slide again.' : 'Reset. The Master CSS is removed.');
  }

  async function save() {
    const id = selected;
    if (!drafts.has(id) || busy) return;
    const pass = password();
    if (!pass) return;
    const values = fields(id);
    /* HTML left as the original is not stored, so the slide keeps following the deck. */
    const edit = isSlide(id)
      ? { html: values.html === source(id).originalHtml ? '' : values.html, css: values.css, js: values.js }
      : { html: '', css: values.css, js: '' };
    if (![edit.html, edit.css, edit.js].some(value => value.trim())) {
      if (stage.isEdited(id)) await remove(id, pass);
      else discard();
      return;
    }
    setStatus('Saving…');
    if (!await send(() => client.save(id, edit, pass))) return;
    if (isSlide(id)) stage.commit(id, edit); else stage.commitMaster(edit.css);
    afterChange(id, isSlide(id)
      ? 'Saved. Everyone who opens this webinar now sees this slide.'
      : 'Saved. The Master CSS now applies for everyone.');
  }

  async function reset() {
    const id = selected;
    if (!stage.isEdited(id) || busy) return;
    if (!confirmReset) {
      confirmReset = true;
      refreshState();
      setStatus(isSlide(id)
        ? 'Reset removes the saved edit for everyone and brings back the original slide.'
        : 'Reset removes the saved Master CSS for everyone.');
      return;
    }
    confirmReset = false;
    const pass = password();
    if (pass) await remove(id, pass);
    else refreshState();
  }

  function saveShortcut(event) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') { event.preventDefault(); save(); }
  }

  /* ---- the view ---- */
  function fitView() {
    const box = $('#e-frame');
    const scale = box.clientWidth / 1280;
    box.style.height = `${720 * scale}px`;
    frame.style.transform = `scale(${scale})`;
  }

  async function connect() {
    const deck = frame.contentWindow;
    stage = deck.__deckSlideEdits;
    await stage.ready;
    /* The deck's preview mode ignores the pointer; here the slide is the editor. */
    const style = deck.document.createElement('style');
    style.textContent = 'body.is-preview { pointer-events: auto; } .slide { cursor: text; } .slide:focus { outline: none; }';
    deck.document.head.appendChild(style);
    deck.document.querySelectorAll('.slide').forEach(slide => {
      /* Plain text keeps the slide's markup clean; older browsers only know "true". */
      try { slide.contentEditable = 'plaintext-only'; } catch { slide.contentEditable = 'true'; }
      slide.spellcheck = false;
    });
    deck.document.addEventListener('input', typedOnSlide);
    deck.document.addEventListener('keydown', saveShortcut);
    deck.document.addEventListener('click', event => { if (event.target.closest('a')) event.preventDefault(); });

    const wanted = location.hash.slice(1);
    select(SLIDES.some(slide => slide.id === wanted) ? wanted : SLIDES[0].id);
    const row = document.querySelector('.e-item[aria-current="true"]');
    if (row) row.scrollIntoView({ block: 'nearest' });
  }

  buildList();
  passwordBox.value = remembered();
  Object.values(boxes).forEach(box => box.addEventListener('input', typed));
  document.querySelectorAll('#e-tabs button').forEach(button => {
    button.addEventListener('click', () => showTab(button.dataset.tab));
  });
  saveButton.addEventListener('click', save);
  discardButton.addEventListener('click', discard);
  resetButton.addEventListener('click', reset);
  document.addEventListener('keydown', saveShortcut);
  window.addEventListener('beforeunload', event => { if (drafts.size) event.preventDefault(); });
  new ResizeObserver(fitView).observe($('#e-frame'));
  fitView();

  const wanted = location.hash.slice(1);
  frame.addEventListener('load', function loaded() {
    if (!frame.contentWindow.__deckSlideEdits) return;      // the blank page before the deck
    frame.removeEventListener('load', loaded);
    connect();
  });
  frame.src = `./index.html?preview#${SLIDES.some(slide => slide.id === wanted) ? wanted : SLIDES[0].id}`;
}
