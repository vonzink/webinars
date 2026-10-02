/* ============================================================================
   SLIDE EDITS — what the Slide settings screen saves.
   Per slide: its HTML, CSS for that slide only, and JS that runs when the slide
   is shown. Deck-wide: one Master CSS. A saved edit applies for everyone who
   opens the deck; resetting removes it and the original returns.
   Edits live on the server, keyed by this deck's slug and the slide's id.
   ========================================================================= */

export const MASTER_ID = '_master';      // the server's name for the Master CSS

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
   `onChange(slideElement)` runs after a slide's markup is replaced. */
export function createSlideEditStage({ document, onChange = () => {} }) {
  const originals = new Map();
  const saved = new Map();          // slide id -> { html, css, js }
  const painted = new Map();        // slide id -> the js now in effect
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
    el.innerHTML = edit.html && edit.html.trim() ? edit.html : originals.get(id);
    styleEl(id).textContent = scopeCss(id, edit.css);
    painted.set(id, text(edit.js));
    onChange(el);
    return el.classList.contains('is-active') ? run(id) : null;
  }

  function render(id) {
    if (!originals.has(id)) return null;
    return paint(id, saved.get(id) || { html: '', css: '', js: '' });
  }

  /* The deck's own rules that touch this slide, for reference beside the editor. */
  function reference(el) {
    const matches = selector => {
      const plain = selector.replace(/::[\w-]+(\([^)]*\))?/g, '').trim();
      if (!plain) return false;
      try { return el.matches(plain) || Boolean(el.querySelector(plain)); } catch { return false; }
    };
    const collect = rules => {
      const lines = [];
      for (const rule of rules) {
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
    const blocks = [];
    for (const sheet of document.styleSheets) {
      if (sheet.ownerNode?.dataset?.slideEdit) continue;
      try { blocks.push(...collect(sheet.cssRules)); } catch { /* cross-origin sheet (fonts) */ }
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
    previewMaster(css) { styleEl(MASTER_ID).textContent = text(css); },
    commitMaster(css) {
      savedMaster = text(css);
      styleEl(MASTER_ID).textContent = savedMaster;
    },
    revertMaster() { styleEl(MASTER_ID).textContent = savedMaster; },
  };
}
