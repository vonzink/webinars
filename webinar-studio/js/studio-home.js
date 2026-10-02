/* ============================================================================
   WEBINAR SUITE (Webinar Studio's home) — home.html.
   Lists every webinar (the ones made here and the ones built into the site),
   opens them to present or to edit, and starts new ones:
   - Create with AI: a prompt for ChatGPT or Claude, whose one JSON response
     becomes the whole presentation (title, Master CSS, every slide). It is
     checked, previewed in the real deck pages, and only saved on Create.
   - Start with a blank webinar: a name and a title saved on the server; its
     slides are then made in Slide settings (index.html?w=<name>).
   ========================================================================= */

import { WEBINAR } from '../content/webinar-config.js';
import { RESERVED_SLUGS, SITE_WEBINARS } from '../content/site-webinars.js';
import { SLIDES } from '../content/slides.js';
import { SLIDE_FORMAT } from '../content/slide-format.js';
import {
  WEBINAR_ID, createSlideEditClient, headingOf, planFeed, planPresentation, rememberEditPassword, rememberedEditPassword, savePlan,
} from './slide-edits.js';
import { brandLinks, buildPresentationPrompt, footerSpec, normalizeFooter, parsePresentation, presenterData } from './slide-prompt.js';
import { loadPresenterOptions } from './presenter-options.js';

const $ = selector => document.querySelector(selector);

/* The starter slide new slides are framed like: the plain light content slide. */
export function frameSlideId(starters) {
  const plain = slide => (slide.sourceLayout?.kind || 'standard') === 'standard' && slide.bg !== 'dark' && !slide.manualBuild;
  return (starters.find(plain) || starters[0]).id;
}

/* Read an AI response into everything a new presentation needs: checked,
   every slide given the presenter's footer, and the records to save.
   Returns { presentation, slug, plan } or { error, errors }. Saves nothing. */
export function preparePresentation(answer, { presenter = null, links, taken = [], starters = SLIDES, format = SLIDE_FORMAT, newId } = {}) {
  const read = parsePresentation(answer, { headingOf });
  if (read.error) return read;
  const who = presenter ? presenterData(presenter) : null;
  const footer = footerSpec(format, links, who || undefined);
  const presentation = {
    ...read.presentation,
    slides: read.presentation.slides.map(slide => ({ ...slide, html: normalizeFooter(slide.html, footer, { required: true }).html })),
  };
  const slug = slugFor(presentation.title, taken);
  const stamp = Date.now().toString(36);
  const plan = planPresentation(presentation, {
    starters,
    frame: frameSlideId(starters),
    presenter: who,
    newId: newId || (index => `ai-${stamp}-${index + 1}`),
  });
  return { presentation, slug, plan };
}

/* "Down payment help in Colorado!" -> "down-payment-help-in-colorado" */
export function slugFor(title, taken = []) {
  const base = String(title).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/g, '') || 'webinar';
  const used = new Set([...taken, ...RESERVED_SLUGS]);
  if (!used.has(base)) return base;
  let n = 2;
  while (used.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

export function initStudioHome() {
  const passwordBox = $('#s-password');
  const status = $('#s-status');
  const setStatus = (message, state = '') => { status.textContent = message; status.dataset.state = state; };
  const api = slug => createSlideEditClient({ base: WEBINAR.slideEditsApi, slug });
  let made = [];
  let confirmDelete = '';

  const link = (label, href, extra = '') => {
    const a = document.createElement('a');
    a.className = `s-button ${extra}`.trim();
    a.href = href;
    a.textContent = label;
    return a;
  };

  function row({ title, meta, actions }) {
    const el = document.createElement('div');
    el.className = 's-row';
    const text = document.createElement('div');
    text.className = 's-row-text';
    const name = document.createElement('div');
    name.className = 's-row-title';
    name.textContent = title;
    const detail = document.createElement('div');
    detail.className = 's-row-meta';
    detail.textContent = meta;
    text.append(name, detail);
    const buttons = document.createElement('div');
    buttons.className = 's-row-actions';
    buttons.append(...actions);
    el.append(text, buttons);
    return el;
  }

  function password() {
    if (passwordBox.value) return passwordBox.value;
    setStatus('Enter the edit password first (top right).', 'error');
    passwordBox.focus();
    return null;
  }

  function failed(result) {
    if (result.wrongPassword) rememberEditPassword('');
    setStatus(result.message, 'error');
  }

  function renderMade() {
    const list = $('#s-made');
    list.textContent = '';
    if (!made.length) {
      const empty = document.createElement('div');
      empty.className = 's-empty';
      empty.textContent = 'None yet. Create one with AI above, or start a blank one.';
      list.appendChild(empty);
      return;
    }
    made.forEach(webinar => {
      const address = new URL(`./index.html?w=${webinar.slug}`, location.href).href;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 's-danger';
      remove.dataset.delete = webinar.slug;
      remove.textContent = confirmDelete === webinar.slug ? 'Click again to delete' : 'Delete';
      remove.addEventListener('click', () => deleteWebinar(webinar));
      const copy = document.createElement('button');
      copy.type = 'button';
      copy.textContent = 'Copy link';
      copy.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(address); setStatus(`Link to "${webinar.title}" copied.`, 'saved'); }
        catch { setStatus(address); }
      });
      list.appendChild(row({
        title: webinar.title,
        meta: `Created ${new Date(webinar.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })} · ${address}`,
        actions: [
          link('Open', `./index.html?w=${webinar.slug}`, 's-primary'),
          link('Edit slides', `./editor.html?w=${webinar.slug}`),
          copy,
          remove,
        ],
      }));
    });
  }

  function renderSite() {
    const list = $('#s-site');
    list.textContent = '';
    SITE_WEBINARS.forEach(webinar => {
      list.appendChild(row({
        title: webinar.title,
        meta: webinar.editor ? `msfgmortgage.com${webinar.url}` : `msfgmortgage.com${webinar.url} · slide editing has not been added to this one yet`,
        actions: [
          link('Open', webinar.url, 's-primary'),
          ...(webinar.editor ? [link('Edit slides', webinar.editor)] : []),
        ],
      }));
    });
  }

  async function load() {
    try {
      const response = await fetch(WEBINAR.slideEditsApi, { credentials: 'omit', cache: 'no-store' });
      const data = response.ok ? await response.json() : null;
      made = Array.isArray(data?.webinars) ? data.webinars.filter(w => w && typeof w.slug === 'string') : [];
      if (!response.ok) setStatus('The list of webinars could not be loaded. Reload to try again.', 'error');
    } catch {
      made = [];
      setStatus('The list of webinars could not be loaded. Check your connection and reload.', 'error');
    }
    renderMade();
  }

  async function createWebinar(event) {
    event.preventDefault();
    const title = $('#s-new-title').value.replace(/\s+/g, ' ').trim();
    if (!title) {
      setStatus('Give the webinar a title first.', 'error');
      $('#s-new-title').focus();
      return;
    }
    const pass = password();
    if (!pass) return;
    const slug = slugFor(title, made.map(webinar => webinar.slug));
    $('#s-new-create').disabled = true;
    setStatus('Creating…');
    const result = await api(slug).save(WEBINAR_ID, { html: JSON.stringify({ title }) }, pass);
    $('#s-new-create').disabled = false;
    if (!result.ok) return failed(result);
    rememberEditPassword(pass);
    location.href = `./editor.html?w=${slug}`;
  }

  async function deleteWebinar(webinar) {
    if (confirmDelete !== webinar.slug) {
      confirmDelete = webinar.slug;
      renderMade();
      setStatus(`Delete takes "${webinar.title}" off this list for everyone, and its link stops showing its slides.`);
      return;
    }
    confirmDelete = '';
    const pass = password();
    if (!pass) { renderMade(); return; }
    setStatus('Deleting…');
    /* Its slides, order and Master CSS go too, so the name starts clean if reused. */
    const saved = await api(webinar.slug).list();
    for (const edit of [...saved.filter(e => e.slideId !== WEBINAR_ID), { slideId: WEBINAR_ID }]) {
      const result = await api(webinar.slug).reset(edit.slideId, pass);
      if (!result.ok) { renderMade(); return failed(result); }
    }
    rememberEditPassword(pass);
    setStatus(`"${webinar.title}" was deleted.`, 'saved');
    await load();
  }

  /* ---- Create with AI ---- */
  const links = brandLinks(new URL('./index.html', location.href).href, SLIDE_FORMAT.logos);
  const note = (selector, message, state = '') => { $(selector).textContent = message; $(selector).dataset.state = state; };
  const frame = $('#s-ai-frame');
  let presenters = [];
  let prepared = null;              // what Preview read; Create saves exactly this, and so does a retry
  let place = 0;
  const chosenPresenter = () => presenters.find(person => person.id === $('#s-ai-presenter').value) || null;
  /* The preview is the real deck pages, given the prepared presentation as if
     it were saved. Nothing is sent to the server for it. */
  window.__slideEditsFeed = from => Promise.resolve(prepared && from === frame.contentWindow ? planFeed(prepared.plan) : []);

  const prompt = () => buildPresentationPrompt({
    links, format: SLIDE_FORMAT, presenter: chosenPresenter(), request: $('#s-ai-request').value,
  });

  function showErrors(list = []) {
    const box = $('#s-ai-errors');
    box.textContent = '';
    list.forEach(message => {
      const item = document.createElement('li');
      item.textContent = message;
      box.appendChild(item);
    });
    box.hidden = !list.length;
  }

  function clearPreview() {
    prepared = null;
    showErrors();
    $('#s-ai-review').hidden = true;
    frame.src = 'about:blank';
    note('#s-ai-saving', '');
  }

  function fitFrame() {
    frame.style.transform = `scale(${$('#s-ai-box').clientWidth / 1280})`;
  }

  function showPlace() {
    const slide = prepared.plan.slides[place];
    $('#s-ai-place').textContent = `Slide ${place + 1} of ${prepared.plan.slides.length}: ${slide.title}`;
    $('#s-ai-prev').disabled = place === 0;
    $('#s-ai-next').disabled = place >= prepared.plan.slides.length - 1;
    try { frame.contentWindow.location.hash = slide.id; } catch { /* still loading */ }
  }

  async function copyPrompt() {
    const text = prompt();
    $('#s-ai-prompt').value = text;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      $('#s-ai-prompt').closest('details').open = true;
      $('#s-ai-prompt').select();
      document.execCommand('copy');
    }
    note('#s-ai-copied', 'Copied. Paste it into ChatGPT or Claude.');
  }

  function preview() {
    clearPreview();
    const result = preparePresentation($('#s-ai-answer').value, {
      presenter: chosenPresenter(), links, taken: made.map(webinar => webinar.slug),
    });
    if (result.error) {
      note('#s-ai-status', 'That response cannot be used yet:', 'error');
      return showErrors(result.errors);
    }
    prepared = result;
    const count = result.plan.slides.length;
    $('#s-ai-summary').textContent = `${result.presentation.title} · ${count} ${count === 1 ? 'slide' : 'slides'}`;
    note('#s-ai-status', 'Ready. Check each slide below, then create the presentation.');
    $('#s-ai-review').hidden = false;
    place = 0;
    frame.src = `./index.html?w=${result.slug}&preview&ai=${Date.now().toString(36)}#${result.plan.slides[0].id}`;
    fitFrame();
    return showPlace();
  }

  async function createFromAi() {
    if (!prepared) return null;
    const pass = passwordBox.value;
    if (!pass) {
      passwordBox.focus();
      return note('#s-ai-saving', 'Enter the edit password at the top right first.', 'error');
    }
    const { slug, plan } = prepared;
    const client = api(slug);
    $('#s-ai-create').disabled = true;
    note('#s-ai-saving', 'Checking the name…');
    /* Never write over a webinar that already exists under this name. Records
       left by an attempt that did not finish are fine: this writes them again. */
    const existing = await client.list();
    if (existing.some(edit => edit.slideId === WEBINAR_ID)) {
      $('#s-ai-create').disabled = false;
      return note('#s-ai-saving', 'A webinar with this name was just created elsewhere. Reload the page and preview again.', 'error');
    }
    const result = await savePlan(client, plan, pass, (index, total) => note('#s-ai-saving', `Creating… ${index + 1} of ${total}`));
    $('#s-ai-create').disabled = false;
    if (!result.ok) {
      if (result.wrongPassword) rememberEditPassword('');
      return note('#s-ai-saving', `${result.message} The presentation was not created and does not appear in Webinar Suite. Press Create presentation to try again.`, 'error');
    }
    rememberEditPassword(pass);
    note('#s-ai-saving', 'Created. Opening Slide settings…', 'saved');
    location.href = `./editor.html?w=${slug}`;
    return null;
  }

  async function loadPresenters() {
    presenters = await loadPresenterOptions();
    const select = $('#s-ai-presenter');
    select.textContent = '';
    presenters.forEach(person => {
      const option = document.createElement('option');
      option.value = person.id;
      option.textContent = [person.name, person.title].filter(Boolean).join(', ');
      select.appendChild(option);
    });
    $('#s-ai-prompt').value = prompt();
  }

  $('#s-ai-request').addEventListener('input', () => { $('#s-ai-prompt').value = prompt(); });
  $('#s-ai-presenter').addEventListener('change', () => { clearPreview(); $('#s-ai-prompt').value = prompt(); });
  $('#s-ai-answer').addEventListener('input', clearPreview);
  $('#s-ai-copy').addEventListener('click', copyPrompt);
  $('#s-ai-preview').addEventListener('click', preview);
  $('#s-ai-prev').addEventListener('click', () => { place = Math.max(0, place - 1); showPlace(); });
  $('#s-ai-next').addEventListener('click', () => { place = Math.min(prepared.plan.slides.length - 1, place + 1); showPlace(); });
  frame.addEventListener('load', () => { if (prepared) showPlace(); });
  $('#s-ai-create').addEventListener('click', createFromAi);
  new ResizeObserver(fitFrame).observe($('#s-ai-box'));
  loadPresenters();

  passwordBox.value = rememberedEditPassword();
  passwordBox.addEventListener('input', () => rememberEditPassword(passwordBox.value));
  $('#s-create').addEventListener('submit', createWebinar);
  renderSite();
  load();
}
