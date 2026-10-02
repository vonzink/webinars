/* ============================================================================
   WEBINAR STUDIO — home.html.
   Lists every webinar (the ones made here and the ones built into the site),
   opens them to present or to edit, and starts new ones. A new webinar is just
   a name and a title saved on the server; its slides are then made in Slide
   settings on the shared deck pages (index.html?w=<name>).
   ========================================================================= */

import { WEBINAR } from '../content/webinar-config.js';
import { RESERVED_SLUGS, SITE_WEBINARS } from '../content/site-webinars.js';
import { WEBINAR_ID, createSlideEditClient, rememberEditPassword, rememberedEditPassword } from './slide-edits.js';

const $ = selector => document.querySelector(selector);

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
      empty.textContent = 'None yet. Give your webinar a title above to start one.';
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

  passwordBox.value = rememberedEditPassword();
  passwordBox.addEventListener('input', () => rememberEditPassword(passwordBox.value));
  $('#s-create').addEventListener('submit', createWebinar);
  renderSite();
  load();
}
