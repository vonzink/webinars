/* ============================================================================
   SLIDE SETTINGS — editor.html.
   Left: the Master CSS and every slide. Middle: the selected slide, live; its
   text can be changed right on the slide. Right: the slide's HTML, its own CSS
   and its own JS (or the Master CSS). Save stores the change for everyone.
   Slides can be added (a copy of the current one) and deleted. The bars between
   the three sections drag to resize them.
   The view is this deck in an iframe; the editor drives its slides directly.
   ========================================================================= */

import { WEBINAR } from '../content/webinar-config.js';
import {
  MASTER_ID, SLIDE_LIST_ID, createSlideEditClient, listAfterAdd, listAfterMove, listAfterRemove, listAfterRestore,
  listWithTitle, rememberEditPassword, rememberedEditPassword,
} from './slide-edits.js';
import { brandLinks, buildProjectPrompt, buildSlidePrompt, parseSlideProject } from './slide-prompt.js';

const COLUMNS_KEY = 'msfg-slide-settings-columns';
const PREVIEW_DELAY_MS = 200;
const $ = selector => document.querySelector(selector);
const isSlide = id => id !== MASTER_ID;

export function initSlideEditor() {
  const client = createSlideEditClient({ base: WEBINAR.slideEditsApi, slug: WEBINAR.slug });
  const frame = $('#e-preview');
  const boxes = { html: $('#e-html'), css: $('#e-css'), js: $('#e-js'), master: $('#e-master') };
  const saveButton = $('#e-save');
  const discardButton = $('#e-discard');
  const resetButton = $('#e-reset');
  const addButton = $('#e-add');
  const deleteButton = $('#e-delete');
  const passwordBox = $('#e-password');
  const status = $('#e-status');

  let deck = null;                  // the embedded deck's window
  let stage = null;                 // ...its slide stage (paints edits)
  let slides = null;                // ...its slide list (add / delete)
  let selected = null;              // a slide id, or MASTER_ID
  let viewed = null;                // the slide on show in the view
  const tabs = { slide: 'html', master: 'master' };
  const drafts = new Map();         // id -> unsaved { html, css, js } (Master: { css })
  const sources = new Map();        // slide id -> what the deck holds for it
  let previewTimer = null;
  let confirming = '';              // 'reset' or 'delete' while waiting for the second click
  let busy = false;

  /* One copy of the saved edits for the view and every preview in the list
     (the embedded decks ask for it instead of loading their own). It is read
     again after each change that is saved. */
  let feed = client.list();
  window.__slideEditsFeed = () => feed;
  const refreshFeed = () => { feed = client.list(); };

  const setStatus = (message, state = '') => { status.textContent = message; status.dataset.state = state; };
  const shown = () => slides.shown();
  const titleOf = id => shown().find(slide => slide.id === id)?.title || id;

  function source(id) {
    if (!sources.has(id)) sources.set(id, stage.source(id));
    return sources.get(id);
  }
  const baseline = id => (isSlide(id)
    ? { html: source(id).html, css: source(id).css, js: source(id).js }
    : { css: stage.masterSource().css });
  const fields = id => drafts.get(id) || baseline(id);
  const same = (a, b) => Object.keys(a).every(key => a[key] === b[key]);
  /* HTML left as the original is not stored, so the slide keeps following the deck. */
  const editOf = id => {
    const values = fields(id);
    return { html: values.html === source(id).originalHtml ? '' : values.html, css: values.css, js: values.js };
  };
  const hasContent = edit => [edit.html, edit.css, edit.js].some(value => value.trim());

  /* ---- list ---- */
  function buildList() {
    const list = $('#e-list');
    list.textContent = '';
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
    shown().forEach((slide, index) => {
      const button = item(slide.id, String(index + 1), slide.title);
      const thumb = document.createElement('span');
      thumb.className = 'e-thumb';
      const preview = document.createElement('iframe');
      preview.loading = 'lazy';
      preview.tabIndex = -1;
      preview.title = `Slide ${index + 1} preview`;
      preview.src = `./index.html?preview#${slide.id}`;
      thumb.appendChild(preview);
      button.appendChild(thumb);
      button.title = 'Drag to change the order';
      makeDraggable(button, slide.id);
    });

    const here = new Set(shown().map(slide => slide.id));
    const deleted = slides.deck().filter(slide => !here.has(slide.id));
    if (deleted.length) {
      const section = document.createElement('div');
      section.className = 'e-deleted';
      section.innerHTML = '<div class="e-deleted-title">Deleted slides</div>';
      deleted.forEach(slide => {
        const row = document.createElement('div');
        row.className = 'e-deleted-row';
        const name = document.createElement('span');
        name.textContent = slide.title;
        const restore = document.createElement('button');
        restore.type = 'button';
        restore.dataset.restore = slide.id;
        restore.textContent = 'Bring back';
        restore.addEventListener('click', () => restoreSlide(slide.id));
        row.append(name, restore);
        section.appendChild(row);
      });
      list.appendChild(section);
    }
    fitThumbs();
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
    const onSlide = isSlide(selected);
    saveButton.disabled = busy || !dirty;
    discardButton.disabled = busy || !dirty;
    resetButton.disabled = busy || !stage.isEdited(selected);
    resetButton.textContent = confirming === 'reset' ? 'Click again to reset' : 'Reset to original';
    addButton.disabled = busy;
    deleteButton.disabled = busy || !onSlide || shown().length < 2;
    deleteButton.textContent = confirming === 'delete' ? 'Click again to delete' : 'Delete this slide';
    const place = shown().findIndex(slide => slide.id === selected);
    $('#e-move-up').disabled = busy || !onSlide || place <= 0;
    $('#e-move-down').disabled = busy || !onSlide || place < 0 || place >= shown().length - 1;
    document.querySelectorAll('[data-restore]').forEach(button => { button.disabled = busy; });
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
    const links = [...deck.document.querySelectorAll('link[rel="stylesheet"]')]
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
      $('#e-wrapper').textContent = source(selected).wrapper;
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
    confirming = '';
    if (isSlide(id)) {
      viewed = id;
      deck.location.hash = id;
      const index = shown().findIndex(slide => slide.id === id);
      $('#e-kicker').textContent = `Slide ${index + 1} of ${shown().length}`;
      $('#e-title').textContent = titleOf(id);
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
    confirming = '';
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

  /* ---- talking to the server ---- */
  function password() {
    if (passwordBox.value) return passwordBox.value;
    setStatus('Enter the edit password first (top right).', 'error');
    passwordBox.focus();
    return null;
  }

  async function send(work) {
    busy = true;
    refreshState();
    const result = await work();
    busy = false;
    if (result.ok) {
      rememberEditPassword(passwordBox.value);
      refreshFeed();
    } else {
      if (result.wrongPassword) rememberEditPassword('');
      setStatus(result.message, 'error');
    }
    refreshState();
    return result.ok;
  }

  const saveList = (list, pass) => send(() => client.save(SLIDE_LIST_ID, { html: JSON.stringify(list) }, pass));

  /* ---- save / reset ---- */
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

  /* An added slide is listed under its own heading once that has been saved. */
  async function followHeading(id, pass) {
    const heading = deck.document.querySelector(`#slide-${id} h1, #slide-${id} h2`)?.textContent.replace(/\s+/g, ' ').trim();
    if (!slides.list().added[id] || !heading || heading === titleOf(id)) return;
    const list = listWithTitle(slides.list(), id, heading);
    if (!await saveList(list, pass)) return;
    slides.apply(list);
    makeEditable();
    buildList();
  }

  async function save() {
    const id = selected;
    if (!drafts.has(id) || busy) return;
    const pass = password();
    if (!pass) return;
    const edit = isSlide(id) ? editOf(id) : { html: '', css: fields(id).css, js: '' };
    if (!hasContent(edit)) {
      if (stage.isEdited(id)) await remove(id, pass);
      else discard();
      return;
    }
    setStatus('Saving…');
    if (!await send(() => client.save(id, edit, pass))) return;
    if (isSlide(id)) stage.commit(id, edit); else stage.commitMaster(edit.css);
    if (isSlide(id)) await followHeading(id, pass);
    afterChange(id, isSlide(id)
      ? 'Saved. Everyone who opens this webinar now sees this slide.'
      : 'Saved. The Master CSS now applies for everyone.');
  }

  async function reset() {
    const id = selected;
    if (!stage.isEdited(id) || busy) return;
    if (confirming !== 'reset') {
      confirming = 'reset';
      refreshState();
      setStatus(isSlide(id)
        ? 'Reset removes the saved edit for everyone and brings back the original slide.'
        : 'Reset removes the saved Master CSS for everyone.');
      return;
    }
    confirming = '';
    const pass = password();
    if (pass) await remove(id, pass);
    else refreshState();
  }

  /* ---- add / delete / bring back (each is saved straight away) ---- */
  function applyList(list, goTo, message, newSlides = []) {
    slides.apply(list);
    newSlides.forEach(slide => stage.commit(slide.id, slide.edit));
    makeEditable();
    buildList();
    select(goTo);
    document.querySelector('.e-item[aria-current="true"]')?.scrollIntoView({ block: 'nearest' });
    setStatus(message, 'saved');
  }

  async function addSlide() {
    if (busy) return;
    const pass = password();
    if (!pass) return;
    const after = isSlide(selected) ? selected : viewed;
    const id = `added-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
    const copy = editOf(after);                    // the new slide starts as this one, drafts included
    const list = listAfterAdd(slides.deck(), slides.list(), after, id, `${titleOf(after)} (copy)`);
    setStatus('Adding a slide…');
    if (hasContent(copy) && !await send(() => client.save(id, copy, pass))) return;
    if (!await saveList(list, pass)) return;
    applyList(list, id, 'Slide added. It starts as a copy; change it and save.', hasContent(copy) ? [{ id, edit: copy }] : []);
  }

  async function deleteSlide() {
    const id = selected;
    if (busy || !isSlide(id) || shown().length < 2) return;
    const added = Boolean(slides.list().added[id]);
    if (confirming !== 'delete') {
      confirming = 'delete';
      refreshState();
      setStatus(added
        ? 'Delete removes this added slide for everyone. It cannot be brought back.'
        : 'Delete takes this slide out of the deck for everyone. You can bring it back from the bottom of the list.');
      return;
    }
    confirming = '';
    const pass = password();
    if (!pass) { refreshState(); return; }
    const left = shown().map(slide => slide.id).filter(other => other !== id);
    const next = left[Math.min(shown().findIndex(slide => slide.id === id), left.length - 1)];
    const list = listAfterRemove(slides.deck(), slides.list(), id);
    setStatus('Deleting…');
    if (!await saveList(list, pass)) return;
    if (added && stage.isEdited(id)) await client.reset(id, pass);   // its content is no longer used
    clearTimeout(previewTimer);
    drafts.delete(id);
    sources.delete(id);
    applyList(list, next, added ? 'Slide deleted.' : 'Slide deleted. It is under Deleted slides at the bottom of the list.');
  }

  /* Reorder: drag a slide in the list, or use Move up / Move down. */
  async function moveSlide(id, position) {
    const from = shown().findIndex(slide => slide.id === id);
    const to = Math.max(0, Math.min(shown().length - 1, position));
    if (busy || from < 0 || from === to) return;
    const pass = password();
    if (!pass) return;
    const list = listAfterMove(slides.deck(), slides.list(), id, to);
    setStatus('Moving…');
    if (!await saveList(list, pass)) return;
    applyList(list, id, `Slide moved to position ${to + 1}.`);
  }

  const nudge = step => {
    if (isSlide(selected)) moveSlide(selected, shown().findIndex(slide => slide.id === selected) + step);
  };

  let dragged = null;
  const clearDrop = () => document.querySelectorAll('.e-item').forEach(item => item.classList.remove('is-drop-before', 'is-drop-after', 'is-dragged'));
  function makeDraggable(button, id) {
    const after = event => {
      const box = button.getBoundingClientRect();
      return event.clientY > box.top + box.height / 2;
    };
    button.draggable = true;
    button.addEventListener('dragstart', event => {
      dragged = id;
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', id);
      button.classList.add('is-dragged');
    });
    button.addEventListener('dragover', event => {
      if (!dragged || dragged === id) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      clearDrop();
      button.classList.add(after(event) ? 'is-drop-after' : 'is-drop-before');
    });
    button.addEventListener('drop', event => {
      if (!dragged || dragged === id) return;
      event.preventDefault();
      const rest = shown().map(slide => slide.id).filter(other => other !== dragged);
      const moving = dragged;
      moveSlide(moving, rest.indexOf(id) + (after(event) ? 1 : 0));
    });
    button.addEventListener('dragend', () => { dragged = null; clearDrop(); });
  }

  async function restoreSlide(id) {
    if (busy) return;
    const pass = password();
    if (!pass) return;
    const list = listAfterRestore(slides.deck(), slides.list(), id);
    setStatus('Bringing the slide back…');
    if (!await saveList(list, pass)) return;
    sources.delete(id);
    applyList(list, id, 'The slide is back in the deck.');
  }

  function saveShortcut(event) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') { event.preventDefault(); save(); }
  }

  /* ---- instructions: how to edit, plus prompts for Claude or ChatGPT ---- */
  const deckTitle = document.title.split('—').pop().trim();
  const links = brandLinks(new URL('./index.html', location.href).href);
  const note = (selector, message, state = '') => { $(selector).textContent = message; $(selector).dataset.state = state; };

  function openHelp() {
    const id = isSlide(selected) ? selected : viewed;
    const values = fields(id);
    $('#e-help-prompt').value = buildSlidePrompt({
      deckTitle,
      links,
      slide: { title: titleOf(id), wrapper: source(id).wrapper, html: values.html, css: values.css, js: values.js },
    });
    [['#e-help-logo', links.logo], ['#e-help-logo-dark', links.logoOnDark], ['#e-help-housing', links.equalHousing]]
      .forEach(([selector, href]) => { $(selector).href = href; $(selector).textContent = href; });
    note('#e-help-copied', '');
    note('#e-project-copied', '');
    note('#e-project-status', '');
    $('#e-help').showModal();
  }

  async function copy(value, selector) {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const box = $('#e-help-prompt');
      const kept = box.value;
      box.value = value;
      box.select();
      document.execCommand('copy');
      box.value = kept;
    }
    note(selector, 'Copied. Paste it into Claude or ChatGPT.');
  }

  /* Several slides from one pasted answer: each becomes a new slide after the
     one that is open, saved for everyone straight away. */
  async function addProject() {
    if (busy) return;
    const project = parseSlideProject($('#e-project-answer').value);
    if (project.error) return note('#e-project-status', project.error, 'error');
    const pass = passwordBox.value;
    if (!pass) return note('#e-project-status', 'Close this, enter the edit password at the top right, then try again.', 'error');

    const after = isSlide(selected) ? selected : viewed;
    let list = slides.list();
    let previous = after;
    const added = project.slides.map((slide, index) => {
      const id = `added-${Date.now().toString(36)}${index.toString(36)}${Math.random().toString(36).slice(2, 5)}`;
      list = listAfterAdd(slides.deck(), list, previous, id, slide.title, slides.plain());
      previous = id;
      return { id, edit: { html: slide.html, css: slide.css, js: slide.js } };
    });

    busy = true;
    refreshState();
    $('#e-project-add').disabled = true;
    let failure = null;
    for (const [index, slide] of added.entries()) {
      note('#e-project-status', `Saving slide ${index + 1} of ${added.length}…`);
      const result = await client.save(slide.id, slide.edit, pass);
      if (!result.ok) { failure = result; break; }
    }
    if (!failure) {
      const result = await client.save(SLIDE_LIST_ID, { html: JSON.stringify(list) }, pass);
      if (!result.ok) failure = result;
    }
    busy = false;
    $('#e-project-add').disabled = false;
    if (failure) {
      if (failure.wrongPassword) rememberEditPassword('');
      refreshState();
      return note('#e-project-status', `${failure.message} No slides were added.`, 'error');
    }
    rememberEditPassword(pass);
    refreshFeed();
    $('#e-project-answer').value = '';
    $('#e-help').close();
    return applyList(list, added[0].id, `${added.length} ${added.length === 1 ? 'slide' : 'slides'} added after "${titleOf(after)}".`, added);
  }

  /* ---- the three sections: drag the bars between them ---- */
  function fitView() {
    const box = $('#e-frame');
    const scale = box.clientWidth / 1280;
    box.style.height = `${720 * scale}px`;
    frame.style.transform = `scale(${scale})`;
  }
  function fitThumbs() {
    const thumb = document.querySelector('.e-thumb');
    if (thumb) $('#e-list').style.setProperty('--e-thumb-scale', String(thumb.clientWidth / 1280));
  }

  function initColumns() {
    const main = $('.e-main');
    const LIMITS = { left: [180, 520], right: [320, 1400], middle: 280 };
    const widths = () => ({ left: $('#e-list').offsetWidth, right: $('.e-code').offsetWidth });
    const apply = ({ left, right }) => {
      const room = main.clientWidth - 18 - LIMITS.middle;
      const l = Math.max(LIMITS.left[0], Math.min(LIMITS.left[1], left, room - LIMITS.right[0]));
      const r = Math.max(LIMITS.right[0], Math.min(LIMITS.right[1], right, room - l));
      main.style.setProperty('--e-left', `${l}px`);
      main.style.setProperty('--e-right', `${r}px`);
    };
    const remember = () => { try { localStorage.setItem(COLUMNS_KEY, JSON.stringify(widths())); } catch { /* ignore */ } };
    const forget = () => {
      main.style.removeProperty('--e-left');
      main.style.removeProperty('--e-right');
      try { localStorage.removeItem(COLUMNS_KEY); } catch { /* ignore */ }
    };
    try {
      const saved = JSON.parse(localStorage.getItem(COLUMNS_KEY));
      if (saved && Number.isFinite(saved.left) && Number.isFinite(saved.right)) apply(saved);
    } catch { /* ignore */ }

    [['#e-split-left', 'left', 1], ['#e-split-right', 'right', -1]].forEach(([selector, side, direction]) => {
      const bar = $(selector);
      bar.addEventListener('pointerdown', event => {
        event.preventDefault();
        const start = { x: event.clientX, ...widths() };
        bar.setPointerCapture(event.pointerId);
        bar.classList.add('is-dragging');
        document.body.classList.add('is-resizing');
        const move = e => apply({ ...start, [side]: start[side] + direction * (e.clientX - start.x) });
        const stop = () => {
          bar.removeEventListener('pointermove', move);
          bar.classList.remove('is-dragging');
          document.body.classList.remove('is-resizing');
          remember();
        };
        bar.addEventListener('pointermove', move);
        bar.addEventListener('pointerup', stop, { once: true });
        bar.addEventListener('pointercancel', stop, { once: true });
      });
      bar.addEventListener('keydown', event => {
        const step = { ArrowLeft: -24, ArrowRight: 24 }[event.key];
        if (!step) return;
        event.preventDefault();
        apply({ ...widths(), [side]: widths()[side] + direction * step });
        remember();
      });
      bar.addEventListener('dblclick', forget);
    });
  }

  /* ---- the view ---- */
  function makeEditable() {
    deck.document.querySelectorAll('.slide').forEach(slide => {
      /* Plain text keeps the slide's markup clean; older browsers only know "true". */
      try { slide.contentEditable = 'plaintext-only'; } catch { slide.contentEditable = 'true'; }
      slide.spellcheck = false;
    });
  }

  async function connect() {
    deck = frame.contentWindow;
    stage = deck.__deckSlideEdits;
    slides = deck.__deckSlides;
    await stage.ready;
    /* The deck's preview mode ignores the pointer; here the slide is the editor. */
    const style = deck.document.createElement('style');
    style.textContent = 'body.is-preview { pointer-events: auto; } .slide { cursor: text; } .slide:focus { outline: none; }';
    deck.document.head.appendChild(style);
    makeEditable();
    deck.document.addEventListener('input', typedOnSlide);
    deck.document.addEventListener('keydown', saveShortcut);
    deck.document.addEventListener('click', event => { if (event.target.closest('a')) event.preventDefault(); });

    buildList();
    const wanted = location.hash.slice(1);
    select(shown().some(slide => slide.id === wanted) ? wanted : shown()[0].id);
    document.querySelector('.e-item[aria-current="true"]')?.scrollIntoView({ block: 'nearest' });
  }

  passwordBox.value = rememberedEditPassword();
  Object.values(boxes).forEach(box => box.addEventListener('input', typed));
  document.querySelectorAll('#e-tabs button').forEach(button => {
    button.addEventListener('click', () => showTab(button.dataset.tab));
  });
  saveButton.addEventListener('click', save);
  discardButton.addEventListener('click', discard);
  resetButton.addEventListener('click', reset);
  addButton.addEventListener('click', addSlide);
  deleteButton.addEventListener('click', deleteSlide);
  $('#e-move-up').addEventListener('click', () => nudge(-1));
  $('#e-move-down').addEventListener('click', () => nudge(1));
  $('#e-help-open').addEventListener('click', openHelp);
  $('#e-help-close').addEventListener('click', () => $('#e-help').close());
  $('#e-help-copy').addEventListener('click', () => copy($('#e-help-prompt').value, '#e-help-copied'));
  $('#e-project-copy').addEventListener('click', () => copy(buildProjectPrompt({ deckTitle, links }), '#e-project-copied'));
  $('#e-project-add').addEventListener('click', addProject);
  document.addEventListener('keydown', saveShortcut);
  window.addEventListener('beforeunload', event => { if (drafts.size) event.preventDefault(); });
  initColumns();
  new ResizeObserver(fitView).observe($('#e-frame'));
  new ResizeObserver(fitThumbs).observe($('#e-list'));
  fitView();

  frame.addEventListener('load', function loaded() {
    if (!frame.contentWindow.__deckSlideEdits) return;      // the blank page before the deck
    frame.removeEventListener('load', loaded);
    connect();
  });
  frame.src = `./index.html?preview${location.hash}`;
}
