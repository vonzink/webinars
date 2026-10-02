/* ============================================================================
   SLIDE EDITS — what the Slide settings screen saves.
   Per slide: its HTML, CSS for that slide only, and JS that runs when the slide
   is shown. Deck-wide: one Master CSS, and the slide list (slides added to or
   deleted from the deck). A saved edit applies for everyone who opens the
   deck; resetting removes it and the original returns.
   Edits live on the server, keyed by this deck's slug and the slide's id.
   ========================================================================= */

export const MASTER_ID = '_master';      // the server's name for the Master CSS
export const SLIDE_LIST_ID = '_slides';  // ...and for the deck's slide list
export const WEBINAR_ID = '_webinar';    // ...and for a Webinar Studio webinar's details

/* What Webinar Suite saved about a webinar made there: its title, and the
   presenter chosen when it was made with AI ({ name, title, nmls, phone,
   email }), or null. `madeWithAi`: its slides all came from one AI
   response, so the starter slides they are framed on are not slides of its own. Empty for a deck built into the site. */
export function webinarDetails(edits) {
  const saved = edits.find(edit => edit.slideId === WEBINAR_ID);
  let data = null;
  try { data = JSON.parse(saved.html); } catch { /* nothing saved, or not readable */ }
  const title = typeof data?.title === 'string' ? data.title.trim() : '';
  const presenter = data?.presenter && typeof data.presenter === 'object' && typeof data.presenter.name === 'string'
    ? data.presenter : null;
  return { title, presenter, madeWithAi: data?.madeWithAi === true };
}

/* The title a webinar was given in Webinar Suite, if it was made there. */
export function webinarTitle(edits) {
  return webinarDetails(edits).title;
}

/* ---- a new presentation made with AI ----------------------------------------
   The saved-edits model has no stand-alone slide: every added slide is a copy
   of one of the deck's own slides (its frame) with its content saved on top.
   A presentation from Webinar Suite therefore becomes added slides framed like
   the Studio's plain starter slide, each with the full HTML, CSS and JS from
   the AI answer, and the starter slides themselves are left out. */

/* Everything to save for a new presentation, in the order it is saved: each
   slide, then the Master CSS, then the slide list, and the webinar's details
   last, because those are what make it show up in Webinar Suite.
   `starters` are the deck's own slides; `frame` the id of the one new slides
   are framed like; `newId(index)` names each new slide. */
export function planPresentation(presentation, { starters, frame, presenter = null, newId }) {
  const slides = presentation.slides.map((slide, index) => ({
    id: newId(index),
    title: slide.title,
    edit: { html: slide.html, css: slide.css, js: slide.js },
  }));
  const list = {
    order: slides.map(slide => slide.id),
    added: Object.fromEntries(slides.map(slide => [slide.id, { from: frame, title: slide.title }])),
    removed: starters.map(slide => slide.id),
  };
  return {
    title: presentation.title,
    slides,
    records: [
      ...slides.map(slide => ({ slideId: slide.id, edit: slide.edit })),
      { slideId: MASTER_ID, edit: { html: '', css: presentation.masterCss, js: '' } },
      { slideId: SLIDE_LIST_ID, edit: { html: JSON.stringify(list), css: '', js: '' } },
      { slideId: WEBINAR_ID, edit: { html: JSON.stringify({ title: presentation.title, madeWithAi: true, ...(presenter ? { presenter } : {}) }), css: '', js: '' } },
    ],
  };
}

/* The plan as saved edits, so the deck can show it before anything is saved
   (see __slideEditsFeed). */
export const planFeed = plan => plan.records.map(({ slideId, edit }) => ({ slideId, ...edit }));

/* Saved edits with some changed or added ([{ slideId, html, css, js }]). */
export function overlayEdits(edits, changes) {
  const byId = new Map(edits.map(edit => [edit.slideId, edit]));
  changes.forEach(change => byId.set(change.slideId, change));
  return [...byId.values()];
}

/* Save a plan record by record, stopping at the first failure. Nothing is
   saved out of order, so the webinar's details (and with them its place in
   Webinar Suite) are only written once everything else is. Trying again with
   the same plan writes the same records again. */
export async function savePlan(client, plan, password, onProgress = () => {}) {
  for (const [index, record] of plan.records.entries()) {
    onProgress(index, plan.records.length, record.slideId);
    const result = await client.save(record.slideId, record.edit, password);
    if (!result.ok) return { ...result, savedCount: index, failedAt: record.slideId };
  }
  return { ok: true, savedCount: plan.records.length };
}

/* ---- the slide list ------------------------------------------------------
   { order: [slide ids], added: { id: { from, title } }, removed: [slide ids] }
   An added slide is a second copy of the deck slide named in `from`; its own
   content is an ordinary saved edit under its id. A deck slide in `removed` is
   left out. A deck slide the list has never heard of keeps its usual place. */

const isId = value => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);

export function parseSlideList(text) {
  let data = null;
  try { data = JSON.parse(text); } catch { /* no list saved, or not readable */ }
  const added = {};
  if (data && typeof data.added === 'object' && data.added) {
    Object.entries(data.added).forEach(([id, slide]) => {
      if (isId(id) && slide && isId(slide.from)) added[id] = { from: slide.from, title: typeof slide.title === 'string' ? slide.title : '' };
    });
  }
  const ids = value => (Array.isArray(value) ? [...new Set(value.filter(isId))] : []);
  return { order: ids(data?.order), added, removed: ids(data?.removed) };
}

/* The deck's slides (from content/slides.js) arranged as the list says. */
export function arrangeSlides(originals, list) {
  const byId = new Map(originals.map(slide => [slide.id, slide]));
  const removed = new Set(list.removed);
  const out = [];
  list.order.forEach(id => {
    if (out.some(slide => slide.id === id)) return;
    const extra = list.added[id];
    if (byId.has(id)) { if (!removed.has(id)) out.push(byId.get(id)); }
    else if (extra && byId.has(extra.from)) {
      out.push({ ...byId.get(extra.from), id, headline: extra.title || byId.get(extra.from).headline, notes: '', added: true, from: extra.from });
    }
  });
  originals.forEach((slide, index) => {
    if (removed.has(slide.id) || out.includes(slide)) return;
    const before = originals.slice(0, index).reverse().find(earlier => out.includes(earlier));
    out.splice(before ? out.indexOf(before) + 1 : 0, 0, slide);
  });
  return out.length ? out : originals.slice();
}

const idsOf = (originals, list) => arrangeSlides(originals, list).map(slide => slide.id);

/* A new slide right after `afterId`. It is a copy of that slide unless `basedOn`
   names the deck slide whose frame (background, layout family) it should use. */
export function listAfterAdd(originals, list, afterId, id, title, basedOn) {
  const order = idsOf(originals, list);
  const from = basedOn || list.added[afterId]?.from || afterId;
  order.splice(order.indexOf(afterId) + 1, 0, id);
  return { order, added: { ...list.added, [id]: { from, title } }, removed: [...list.removed] };
}

/* Deleting an added slide forgets it; deleting a deck slide only leaves it out. */
export function listAfterRemove(originals, list, id) {
  const order = idsOf(originals, list).filter(other => other !== id);
  const added = { ...list.added };
  const wasAdded = Boolean(added[id]);
  delete added[id];
  return { order, added, removed: wasAdded ? [...list.removed] : [...new Set([...list.removed, id])] };
}

/* A deleted deck slide comes back in its usual place. */
export function listAfterRestore(originals, list, id) {
  const next = { order: idsOf(originals, list), added: { ...list.added }, removed: list.removed.filter(other => other !== id) };
  return { ...next, order: idsOf(originals, next) };
}

/* Move a slide so it sits at `position` (0 = first) among the slides shown. */
export function listAfterMove(originals, list, id, position) {
  const order = idsOf(originals, list).filter(other => other !== id);
  order.splice(Math.max(0, Math.min(order.length, position)), 0, id);
  return { order, added: { ...list.added }, removed: [...list.removed] };
}

/* The title a slide's saved HTML gives it: the text of its first h1 or h2. The
   slide list and Presenter View name an edited slide by it. */
export function headingOf(html) {
  const match = /<h[12]\b[^>]*>([\s\S]*?)<\/h[12]>/i.exec(String(html || ''));
  if (!match) return '';
  const entities = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': '\'', nbsp: ' ' };
  return match[1]
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (_, name) => entities[name])
    .replace(/\s+/g, ' ')
    .trim();
}

const BLOCK_TAGS = new Set([
  'article', 'aside', 'blockquote', 'dd', 'details', 'div', 'dl', 'dt', 'figcaption', 'figure',
  'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'li', 'main', 'nav', 'ol', 'p',
  'section', 'summary', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'ul',
]);
const TOKEN = /<!--[\s\S]*?-->|<\/?[a-zA-Z][^\s>/]*(?:"[^"]*"|'[^']*'|[^>"'])*>|[^<]+|</g;

function tagOf(token) {
  const match = /^<(\/?)([a-zA-Z][^\s>/]*)/.exec(token);
  return match ? { name: match[2].toLowerCase(), closing: match[1] === '/' } : null;
}

/* Put block-level elements on their own indented lines so a slide is readable in
   a text box. Line breaks are only ever added between two block-level tags, so
   no text and no inline spacing changes (several slides keep their own line
   breaks with `white-space: pre-line`): the formatted slide renders exactly
   like the original. */
export function formatHtml(html) {
  const tokens = String(html).match(TOKEN) || [];
  const blockTag = token => {
    const tag = token && tagOf(token);
    return tag && BLOCK_TAGS.has(tag.name) ? tag : null;
  };
  let out = '';
  let depth = 0;
  let previous = null;
  tokens.forEach((token, index) => {
    const tag = tagOf(token);
    if (!tag && !token.trim()) {
      const next = tokens[index + 1];
      if (!previous || !next || (blockTag(previous) && blockTag(next))) return;
    }
    const block = blockTag(token);
    if (block?.closing) depth = Math.max(0, depth - 1);
    const before = blockTag(previous);
    const closesEmpty = block?.closing && before && !before.closing && before.name === block.name;
    if (block && before && !closesEmpty) out += `\n${'  '.repeat(depth)}`;
    out += token;
    if (block && !block.closing) depth += 1;
    previous = token;
  });
  return out;
}

/* A slide's own CSS is nested under the slide's id, so its rules reach only that
   slide and outrank the deck's styles. `&` targets the slide itself. */
export function scopeCss(slideId, css) {
  const body = String(css || '').trim();
  return body ? `#slide-${slideId} {\n${body}\n}` : '';
}

export function formatCssRule(cssText) {
  return String(cssText)
    .replace(/\s*\{\s*/, ' {\n  ')
    .replace(/;\s*(?=\S)(?!\})/g, ';\n  ')
    .replace(/\s*\}\s*$/, '\n}');
}

/* The edit password is typed once (Presenter settings, or Slide settings) and
   kept in this browser. The server is what checks it. */
const PASSWORD_KEY = 'msfg-slide-edit-password';
export function rememberedEditPassword() {
  try { return globalThis.localStorage?.getItem(PASSWORD_KEY) || ''; } catch { return ''; }
}
export function rememberEditPassword(password) {
  try {
    if (password) globalThis.localStorage?.setItem(PASSWORD_KEY, password);
    else globalThis.localStorage?.removeItem(PASSWORD_KEY);
  } catch { /* storage unavailable: it is asked for again next time */ }
}

const text = value => (typeof value === 'string' ? value : '');
const FAILURES = {
  401: 'That password was not accepted.',
  413: 'This is too large to save.',
  429: 'Too many attempts. Wait a few minutes and try again.',
  503: 'Saving is not available on the server right now.',
};

/* Talks to the saved-edits API. Reading never throws: a deck that cannot reach
   the server simply shows its original slides. */
export function createSlideEditClient({ base, slug, fetch = globalThis.fetch }) {
  const url = slideId => `${base}/${encodeURIComponent(slug)}${slideId ? `/${encodeURIComponent(slideId)}` : ''}`;

  async function list() {
    try {
      const response = await fetch(url(), { credentials: 'omit', cache: 'no-store' });
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data?.edits)
        ? data.edits
          .filter(edit => edit && typeof edit.slideId === 'string')
          .map(edit => ({ slideId: edit.slideId, html: text(edit.html), css: text(edit.css), js: text(edit.js) }))
        : [];
    } catch {
      return [];
    }
  }

  async function send(method, slideId, password, body) {
    let response;
    try {
      response = await fetch(url(slideId), {
        method,
        credentials: 'omit',
        headers: {
          'X-Webinar-Edit-Password': password,
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      return { ok: false, status: 0, message: 'Could not reach the server. Check your connection and try again.' };
    }
    if (response.ok) return { ok: true, status: response.status };
    return {
      ok: false,
      status: response.status,
      wrongPassword: response.status === 401,
      message: FAILURES[response.status] || `Could not save (error ${response.status}).`,
    };
  }

  return {
    list,
    save: (slideId, edit, password) => send('PUT', slideId, password, { html: text(edit.html), css: text(edit.css), js: text(edit.js) }),
    reset: (slideId, password) => send('DELETE', slideId, password),
  };
}

/* Holds each slide's original markup and its saved edit, and paints whichever
   applies. An edit with no html keeps the deck's own markup, so a CSS-only or
   JS-only edit still follows later changes to the slide's content.
   `onChange(slideElement)` runs after a slide's markup is replaced.

   A slide the deck built itself may carry click handlers (cards that open
   pop-outs, menus, calculators). Its markup is therefore left alone unless an
   edit actually changes it, and going back to the original is done by
   `restore(id, element)`: the deck building that slide again, handlers and all.
   Without a `restore` the original markup is simply put back. */
export function createSlideEditStage({ document, onChange = () => {}, restore = null }) {
  const originals = new Map();
  const saved = new Map();          // slide id -> { html, css, js }
  const painted = new Map();        // slide id -> the js now in effect
  const changed = new Set();        // slides whose markup is no longer as the deck built it
  let savedMaster = '';
  const slideEl = id => document.getElementById(`slide-${id}`);

  function styleEl(id) {
    let style = document.getElementById(`slide-edit-css-${id}`);
    if (!style) {
      style = document.createElement('style');
      style.id = `slide-edit-css-${id}`;
      style.dataset.slideEdit = id;
      document.head.appendChild(style);
    }
    return style;
  }

  /* A slide's JS runs each time the slide is shown, with `slide` as its element.
     Returns the error message if it throws, so the editor can show it. */
  function run(id) {
    const el = slideEl(id);
    const js = painted.get(id);
    if (!el || !js || !js.trim()) return null;
    changed.add(id);                // the code may alter the slide, so a later change starts from a fresh one
    try {
      new Function('slide', js)(el);
      return null;
    } catch (error) {
      console.error(`[deck] slide "${id}" JS failed:`, error);
      return String(error?.message || error);
    }
  }

  function paint(id, edit) {
    const el = slideEl(id);
    if (!el) return null;
    if (edit.html && edit.html.trim()) {
      el.innerHTML = edit.html;
      changed.add(id);
    } else if (changed.has(id)) {
      if (restore) restore(id, el); else el.innerHTML = originals.get(id);
      changed.delete(id);
    }
    styleEl(id).textContent = scopeCss(id, edit.css);
    painted.set(id, text(edit.js));
    onChange(el);
    return el.classList.contains('is-active') ? run(id) : null;
  }

  function render(id) {
    if (!originals.has(id)) return null;
    return paint(id, saved.get(id) || { html: '', css: '', js: '' });
  }

  /* The rules in `rules` that touch the slide `el`, formatted. */
  function rulesFor(el, rules) {
    const matches = selector => {
      const plain = selector.replace(/::[\w-]+(\([^)]*\))?/g, '').trim();
      if (!plain) return false;
      try { return el.matches(plain) || Boolean(el.querySelector(plain)); } catch { return false; }
    };
    const collect = list => {
      const lines = [];
      for (const rule of list) {
        if (typeof rule.selectorText === 'string') {
          if (rule.selectorText.split(',').some(matches)) lines.push(formatCssRule(rule.cssText));
        } else if (rule.cssRules && rule.conditionText) {
          const inner = collect(rule.cssRules);
          const prelude = rule.cssText.slice(0, rule.cssText.indexOf('{')).trim();
          if (inner.length) lines.push(`${prelude} {\n${inner.join('\n').replace(/^/gm, '  ')}\n}`);
        }
      }
      return lines;
    };
    return collect(rules);
  }

  /* The Master CSS for one slide: the rules that reach it, and the names of
     the classes it defines that the slide does not use yet. */
  function masterReference(id) {
    const el = slideEl(id);
    const sheet = document.getElementById(`slide-edit-css-${MASTER_ID}`)?.sheet;
    if (!el || !sheet) return { rules: '', classes: [] };
    let rules = [];
    const classes = new Set();
    try {
      rules = rulesFor(el, sheet.cssRules);
      const visit = list => {
        for (const rule of list) {
          if (typeof rule.selectorText === 'string') {
            for (const match of rule.selectorText.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) classes.add(match[1]);
          } else if (rule.cssRules) visit(rule.cssRules);
        }
      };
      visit(sheet.cssRules);
    } catch { /* not readable */ }
    const used = new Set([...el.querySelectorAll('[class]'), el].flatMap(node => Array.from(node.classList || [])));
    return { rules: rules.join('\n\n'), classes: [...classes].filter(name => name !== 'slide' && !used.has(name)) };
  }

  /* The deck's own rules that touch this slide, for reference beside the editor. */
  function reference(el) {
    const blocks = [];
    for (const sheet of document.styleSheets) {
      if (sheet.ownerNode?.dataset?.slideEdit) continue;
      try { blocks.push(...rulesFor(el, sheet.cssRules)); } catch { /* cross-origin sheet (fonts) */ }
    }
    return blocks.join('\n\n');
  }

  const normal = edit => ({ html: text(edit?.html), css: text(edit?.css), js: text(edit?.js) });

  return {
    capture(id) {
      const el = slideEl(id);
      if (el) originals.set(id, el.innerHTML);
    },
    /* The deck re-rendered this slide itself (presenter change): keep the fresh
       original, then put a saved edit back on top. */
    rerendered(id) {
      this.capture(id);
      changed.delete(id);           // freshly built by the deck
      if (saved.has(id)) render(id);
    },
    load(edits) {
      edits.forEach(edit => {
        if (edit.slideId === MASTER_ID) {
          savedMaster = text(edit.css);
          styleEl(MASTER_ID).textContent = savedMaster;
        } else if (originals.has(edit.slideId)) {
          saved.set(edit.slideId, normal(edit));
          render(edit.slideId);
        }
      });
    },
    isEdited: id => (id === MASTER_ID ? Boolean(savedMaster.trim()) : saved.has(id)),
    /* The slide was typed on directly (Slide settings): it is no longer as built. */
    touched(id) { changed.add(id); },
    heading: id => headingOf(saved.get(id)?.html),
    shown: run,
    source(id) {
      const el = slideEl(id);
      if (!el || !originals.has(id)) return null;
      const edit = saved.get(id);
      const originalHtml = formatHtml(originals.get(id));
      return {
        slideId: id,
        html: edit?.html.trim() ? edit.html : originalHtml,
        originalHtml,
        css: edit ? edit.css : '',
        js: edit ? edit.js : '',
        edited: Boolean(edit),
        /* The slide's own element, which the HTML sits inside; the deck sets it. */
        wrapper: `<section class="${Array.from(el.classList || []).filter(name => name !== 'is-active').join(' ')}" data-bg="${el.dataset?.bg || ''}">`,
        reference: reference(el),
      };
    },
    /* The slide's markup as it stands now (after typing on the slide itself). */
    currentHtml(id) {
      const el = slideEl(id);
      if (!el) return '';
      const copy = el.cloneNode(true);
      copy.querySelectorAll('.is-in').forEach(node => node.classList.remove('is-in'));
      return formatHtml(copy.innerHTML);
    },
    preview: (id, draft) => (originals.has(id) ? paint(id, normal(draft)) : null),
    commit(id, edit) {
      if (!originals.has(id)) return;
      if (edit) saved.set(id, normal(edit));
      else saved.delete(id);
      render(id);
    },
    revert: render,
    masterSource: () => ({ css: savedMaster, edited: Boolean(savedMaster.trim()) }),
    masterReference,
    previewMaster(css) { styleEl(MASTER_ID).textContent = text(css); },
    commitMaster(css) {
      savedMaster = text(css);
      styleEl(MASTER_ID).textContent = savedMaster;
    },
    revertMaster() { styleEl(MASTER_ID).textContent = savedMaster; },
  };
}
