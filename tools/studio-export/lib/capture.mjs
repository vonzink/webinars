import { chromium } from 'playwright-core';
import { serveDirectory } from './static-server.mjs';

/* Runs inside the deck page. It reads the deck's own slide data, then returns
   each rendered slide as Studio-ready markup: builds reset to their hidden
   start, local images as logical asset tokens, links made inert (the Studio
   sandbox cannot navigate), and the triggers that the deck wires up with
   closures tagged so the slide runtime can find them again. */
async function captureInPage({ slidesModule }) {
  const { SLIDES } = await import(slidesModule);

  /* Keep in step with assetKey() in lib/assets.mjs. */
  const assetKey = deckPath => deckPath
    .replace(/^\.?\//, '')
    .replace(/^assets\//, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const deckPathOf = reference => {
    let url;
    try { url = new URL(reference, location.href); } catch { return null; }
    if (url.origin !== location.origin) return null;
    return decodeURIComponent(url.pathname).replace(/^\//, '');
  };

  const plainText = html => {
    const holder = document.createElement('div');
    holder.innerHTML = html;
    return holder.textContent.replace(/\s+/g, ' ').trim();
  };

  const stylesheets = [...document.querySelectorAll('link[rel~="stylesheet"]')].map(link => {
    const raw = link.getAttribute('href');
    const deckPath = deckPathOf(raw);
    return deckPath ? { local: true, path: deckPath } : { local: false, href: raw };
  });

  const slides = SLIDES.map((data, index) => {
    const live = document.getElementById(`slide-${data.id}`);
    if (!live) throw new Error(`Slide was not rendered: ${data.id}`);

    /* Tag closure-bound triggers on the live node so the clone carries them. */
    if (data.compareModal) live.querySelectorAll('.compare-cta').forEach(node => { node.dataset.modal = data.compareModal; });
    if (data.media) live.querySelectorAll('.prepaid-figure').forEach(node => { node.dataset.media = data.media; });
    const mediaActions = (data.actions || []).filter(action => !action.href && action.media);
    live.querySelectorAll('.slide-actions button').forEach((node, position) => {
      if (mediaActions[position]) node.dataset.media = mediaActions[position].media;
    });

    const slide = live.cloneNode(true);
    slide.classList.add('is-active');
    slide.querySelectorAll('.is-in').forEach(node => node.classList.remove('is-in'));
    slide.querySelectorAll('[class=""]').forEach(node => node.removeAttribute('class'));

    const assetPaths = [];
    const unresolved = [];
    for (const node of slide.querySelectorAll('[src], [poster]')) {
      for (const attribute of ['src', 'poster']) {
        if (!node.hasAttribute(attribute)) continue;
        const raw = node.getAttribute(attribute);
        const deckPath = deckPathOf(raw);
        if (!deckPath) { unresolved.push(raw); continue; }
        assetPaths.push(deckPath);
        node.setAttribute(attribute, `{{LOCAL_ASSET:${assetKey(deckPath)}}}`);
      }
    }

    const links = [];
    for (const anchor of slide.querySelectorAll('a[href]')) {
      links.push({ text: anchor.textContent.replace(/\s+/g, ' ').trim(), href: anchor.getAttribute('href') });
      for (const attribute of ['href', 'target', 'rel', 'download']) anchor.removeAttribute(attribute);
    }

    const ids = selector => [...new Set([...slide.querySelectorAll(selector)]
      .map(node => node.getAttribute(selector.slice(1, -1))).filter(Boolean))];

    return {
      position: index,
      anchor: data.id,
      title: plainText(data.headline || data.eyebrow || data.id),
      targetSeconds: Number.isInteger(data.time) ? data.time : 0,
      speakerNotes: typeof data.notes === 'string' ? data.notes : '',
      html: slide.outerHTML,
      calculator: slide.querySelector('.slide-calc') ? (data.calc || null) : null,
      modalIds: ids('[data-modal]'),
      mediaIds: ids('[data-media]'),
      hasGraphicsMenu: Boolean(slide.querySelector('.slide-graphics')),
      assetPaths,
      unresolved,
      links,
    };
  });

  return { stylesheets, slides };
}

/* Loads the deck from a loopback server in a real browser and captures it.
   Every request that leaves the loopback origin is blocked, so the capture
   never depends on fonts, APIs, or anything else on the network. */
export async function captureRenderedDeck({ deckDir, slidesModule = '/content/slides.js', expectedSlides }) {
  const server = await serveDirectory(deckDir);
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await context.newPage();
    const blocked = [];
    const pageErrors = [];
    await page.route('**/*', route => {
      const url = route.request().url();
      if (url.startsWith(server.origin) || url.startsWith('data:')) return route.continue();
      blocked.push(url);
      return route.abort();
    });
    page.on('pageerror', error => pageErrors.push(error.message));

    await page.goto(`${server.origin}/index.html`, { waitUntil: 'load' });
    await page.waitForFunction(count => document.querySelectorAll('.slide').length === count, expectedSlides);
    await page.waitForLoadState('networkidle');

    const captured = await page.evaluate(captureInPage, { slidesModule });
    if (pageErrors.length) throw new Error(`The deck raised errors while rendering: ${pageErrors.join('; ')}`);
    return { ...captured, blockedRequests: [...new Set(blocked)].sort() };
  } finally {
    await browser.close();
    await server.close();
  }
}
