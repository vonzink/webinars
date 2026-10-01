import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { REPO_ROOT } from './export-deck.mjs';
import { serveDirectory } from './static-server.mjs';
import { PRODUCTION_POLICY_ENV, withPlaceholderAssetTokens } from './validate.mjs';
import { uuidv5 } from './uuid.mjs';

const ASSET_ORIGIN = PRODUCTION_POLICY_ENV.WEBINAR_ASSET_CDN_BASE_URL;
/* The Studio renderer lives with the first deck that was built for it; every
   deck is checked against that one implementation. */
const RENDERER_DIR = path.join(REPO_ROOT, 'first-home-without-mystery', 'deck', 'js', 'studio');
const SETTLE_MS = 700;                 // longer than the deck's build transition
const CHANNEL_TOLERANCE = 24;          // per-channel difference that counts as a changed pixel

/* The page that hosts the real Studio slide frame: the same composition,
   sandbox, CSP, and runtime bootstrap the audience viewer uses, without the
   viewer's navigation chrome, so the slide renders at exactly 1920×1080. */
const HOST_PAGE = `<!doctype html><meta charset="utf-8">
<style>html,body{margin:0;background:#000}#frame,#frame iframe{display:block;width:1920px;height:1080px;border:0}</style>
<div id="frame"></div>
<script type="module">
  import { createSlideFrame } from './__studio/slide-frame.js';
  window.__studio = {
    states: [],
    init(bundle) {
      this.bundle = bundle;
      this.frame = createSlideFrame({
        container: document.getElementById('frame'),
        bundle,
        policy: bundle.resourcePolicy,
        onRuntimeState: state => {
          this.states.push(state);
          if (state.type === 'ready') this.frame.send('slide-enter');
        },
      });
    },
    show(index) { this.states = []; this.frame.showSlide(this.bundle.slides[index]); },
    send(type, payload) { return this.frame.send(type, payload); },
  };
  window.__studioReady = true;
</script>`;

/* The shape the public live-bundle endpoint returns, built from an export. */
export function toPublicBundle(bundle, assetManifest) {
  const assets = Object.fromEntries(assetManifest.assets.map(asset => [
    uuidv5(`local-asset:${asset.key}`),
    `${ASSET_ORIGIN}/approved/sha256/${asset.sha256}/asset`,
  ]));
  return {
    schemaVersion: 1,
    webinar: { id: 1, slug: bundle.webinar.slug, title: bundle.webinar.title, liveVersion: 1 },
    master: {
      html: withPlaceholderAssetTokens(bundle.master.html),
      css: withPlaceholderAssetTokens(bundle.master.css),
    },
    slides: bundle.slides.map(slide => ({
      id: slide.id,
      position: slide.position,
      anchor: slide.anchor,
      title: slide.title,
      html: withPlaceholderAssetTokens(slide.html),
      css: withPlaceholderAssetTokens(slide.css),
      javascript: withPlaceholderAssetTokens(slide.javascript),
    })),
    assets,
    resourcePolicy: {
      assetOrigin: ASSET_ORIGIN,
      stylesheetOrigins: PRODUCTION_POLICY_ENV.WEBINAR_EXTERNAL_STYLE_ORIGINS.split(','),
      fontOrigins: PRODUCTION_POLICY_ENV.WEBINAR_EXTERNAL_FONT_ORIGINS.split(','),
    },
  };
}

/* Counts pixels that differ between two same-size PNGs, in the browser. */
async function comparePngs(page, first, second) {
  return page.evaluate(async ({ a, b, tolerance }) => {
    const load = async base64 => {
      const image = new Image();
      image.src = `data:image/png;base64,${base64}`;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0);
      return context.getImageData(0, 0, canvas.width, canvas.height);
    };
    const [left, right] = [await load(a), await load(b)];
    if (left.width !== right.width || left.height !== right.height) return { sameSize: false, changed: -1, ratio: 1 };
    let changed = 0;
    for (let i = 0; i < left.data.length; i += 4) {
      if (Math.abs(left.data[i] - right.data[i]) > tolerance
        || Math.abs(left.data[i + 1] - right.data[i + 1]) > tolerance
        || Math.abs(left.data[i + 2] - right.data[i + 2]) > tolerance) changed += 1;
    }
    return { sameSize: true, changed, ratio: changed / (left.width * left.height) };
  }, { a: first.toString('base64'), b: second.toString('base64'), tolerance: CHANNEL_TOLERANCE });
}

const settled = page => page.waitForTimeout(SETTLE_MS);

async function waitForStudioBuilds(page) {
  await page.waitForFunction(() => {
    const states = window.__studio.states;
    if (states.some(state => state.type === 'error')) return true;
    const animation = states.filter(state => state.type === 'animation-state').at(-1);
    return Boolean(animation) && animation.current === animation.total && !animation.playing;
  });
  const states = await page.evaluate(() => window.__studio.states);
  if (states.some(state => state.type === 'error')) throw new Error('The Studio slide reported a runtime error');
  await settled(page);
  return states;
}

/* Renders every slide twice — in the static deck and in the real Studio slide
   frame from the exported bundle — and reports how far apart they are. Also
   opens each popout and calculator both ways. */
export async function runParity(deck, { saveImages = true, liveBundlePath = null, approvedDir = null } = {}) {
  const deckDir = path.join(REPO_ROOT, deck.deckDir);
  const outDir = path.join(REPO_ROOT, deck.outDir);
  const exported = JSON.parse(fs.readFileSync(path.join(outDir, 'source-bundle.json'), 'utf8'));
  const assetManifest = JSON.parse(fs.readFileSync(path.join(outDir, 'asset-manifest.json'), 'utf8'));
  const report = JSON.parse(fs.readFileSync(path.join(outDir, 'export-report.json'), 'utf8'));
  /* By default the export is rendered directly. Given a live bundle — the
     JSON the backend's public endpoint serves after an import — that is
     rendered instead, with assets as the library approved them. */
  const publicBundle = liveBundlePath
    ? JSON.parse(fs.readFileSync(liveBundlePath, 'utf8'))
    : toPublicBundle(exported, assetManifest);
  const bundle = publicBundle;
  const imageDir = path.join(deckDir, 'output', 'playwright', liveBundlePath ? 'studio-parity-live' : 'studio-parity');
  if (saveImages) fs.mkdirSync(imageDir, { recursive: true });

  const server = await serveDirectory(deckDir);
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const results = { slides: [], popouts: [], calculators: [], pageErrors: [] };
  try {
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    const bySha = new Map(assetManifest.assets.map(asset => [asset.sha256, asset]));
    await context.route(`${ASSET_ORIGIN}/**`, route => {
      const sha = new URL(route.request().url()).pathname.split('/')[3];
      if (approvedDir) {
        const file = path.join(approvedDir, sha);
        if (!/^[a-f0-9]{64}$/.test(sha) || !fs.existsSync(file)) return route.fulfill({ status: 403, body: 'AccessDenied' });
        const body = fs.readFileSync(file);
        const head = body.subarray(0, 256).toString('latin1');
        const contentType = /<svg[\s>]/.test(head) ? 'image/svg+xml'
          : head.startsWith('\x89PNG') ? 'image/png'
            : head.startsWith('\xff\xd8') ? 'image/jpeg' : 'application/octet-stream';
        return route.fulfill({ status: 200, contentType, headers: { 'Access-Control-Allow-Origin': '*' }, body });
      }
      const asset = bySha.get(sha);
      if (!asset) return route.fulfill({ status: 403, body: 'AccessDenied' });
      return route.fulfill({
        status: 200,
        contentType: asset.mimeType,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: fs.readFileSync(path.join(deckDir, asset.path)),
      });
    });
    await context.route(`${server.origin}/__studio/*.js`, route => {
      const file = path.join(RENDERER_DIR, path.basename(new URL(route.request().url()).pathname));
      if (!fs.existsSync(file)) return route.fulfill({ status: 404, body: 'Not found' });
      return route.fulfill({ status: 200, contentType: 'text/javascript; charset=utf-8', body: fs.readFileSync(file) });
    });
    await context.route(`${server.origin}/__studio-parity.html`, route => route.fulfill({
      status: 200, contentType: 'text/html; charset=utf-8', body: HOST_PAGE,
    }));

    const staticPage = await context.newPage();
    const studioPage = await context.newPage();
    const differ = await context.newPage();
    for (const [name, page] of [['static', staticPage], ['studio', studioPage]]) {
      page.on('pageerror', error => results.pageErrors.push(`${name}: ${error.message}`));
    }

    await staticPage.goto(`${server.origin}/index.html#${bundle.slides[0].anchor}`, { waitUntil: 'load' });
    await staticPage.addStyleTag({ content: '.deck-nav,.deck-progress,#deck-toast{display:none !important}' });
    await studioPage.goto(`${server.origin}/__studio-parity.html`, { waitUntil: 'load' });
    await studioPage.waitForFunction(() => window.__studioReady === true);
    await studioPage.evaluate(value => window.__studio.init(value), publicBundle);

    const save = (name, buffer) => { if (saveImages) fs.writeFileSync(path.join(imageDir, name), buffer); };
    const shoot = async (label, kind) => {
      const [left, right] = [await staticPage.screenshot(), await studioPage.screenshot()];
      save(`${label}.static.png`, left);
      save(`${label}.studio.png`, right);
      return { label, kind, ...(await comparePngs(differ, left, right)) };
    };
    const studioFrame = () => studioPage.frames().find(frame => frame !== studioPage.mainFrame());

    for (const slide of bundle.slides) {
      const features = report.slides.find(entry => entry.anchor === slide.anchor);

      /* Park the pointer so a hover left over from the last click cannot
         colour one render and not the other. */
      await staticPage.mouse.move(1, 1);
      await studioPage.mouse.move(1, 1);
      await staticPage.evaluate(anchor => { location.hash = anchor; }, slide.anchor);
      await staticPage.waitForFunction(anchor => {
        const active = document.querySelector('.slide.is-active');
        return active && active.id === `slide-${anchor}` && !active.querySelector('.build:not(.is-in)');
      }, slide.anchor);
      await settled(staticPage);

      await studioPage.evaluate(index => window.__studio.show(index), slide.position);
      const states = await waitForStudioBuilds(studioPage);
      const animation = states.filter(state => state.type === 'animation-state').at(-1);
      results.slides.push({
        ...(await shoot(`${String(slide.position + 1).padStart(2, '0')}-${slide.anchor}`, 'slide')),
        builds: animation.total,
      });

      /* Click the same trigger both ways; graphics sit inside the slide's
         graphics menu, which has to be opened first. */
      const trigger = async (target, scope, attribute, id) => {
        const selector = `${scope}[${attribute}="${id}"]`;
        const inMenu = await target.evaluate(
          value => Boolean(document.querySelector(value)?.closest('.sg-menu')), selector,
        );
        if (inMenu) await target.click(`${scope}.slide-graphics .sg-btn`);
        await target.click(selector);
        await target.waitForSelector('#modal-root.is-visible');
        await target.waitForFunction(() => [...document.querySelectorAll('#modal-root img')].every(image => image.complete));
      };
      const overlays = [
        ...features.popouts.map(id => ({ id, attribute: 'data-modal', kind: 'popout' })),
        ...(features.graphics || []).map(id => ({ id, attribute: 'data-media', kind: 'graphic' })),
      ];

      for (const { id, attribute, kind } of overlays) {
        await trigger(staticPage, '.slide.is-active ', attribute, id);
        await trigger(studioFrame(), '', attribute, id);
        await settled(staticPage);
        await settled(studioPage);
        const opened = await shoot(`${String(slide.position + 1).padStart(2, '0')}-${slide.anchor}--${id}`, kind);

        /* The shell hears one report when the popout opens and one when it closes. */
        const reports = async () => (await studioPage.evaluate(() => window.__studio.states))
          .filter(state => state.type === 'supported-overlay-state' && state.actionId === id).length;
        const openReports = await reports();
        await staticPage.keyboard.press('Escape');
        await studioFrame().press('body', 'Escape');
        await staticPage.waitForSelector('#modal-root:not(.is-open)', { state: 'attached' });
        await studioFrame().waitForSelector('#modal-root:not(.is-open)', { state: 'attached' });
        const closeReports = await reports();

        /* A presenter toggle from the shell opens the same popout. */
        await studioPage.evaluate(actionId => window.__studio.send('supported-overlay-state', { actionId }), id);
        await studioFrame().waitForSelector('#modal-root.is-visible');
        await studioPage.evaluate(actionId => window.__studio.send('supported-overlay-state', { actionId }), id);
        await studioFrame().waitForSelector('#modal-root:not(.is-open)', { state: 'attached' });

        results.popouts.push({ ...opened, id, reportedOpen: openReports === 1, reportedClose: closeReports === 2, shellToggle: true });
      }

      if (features.calculator) {
        await staticPage.click('.slide.is-active .slide-calc');
        await studioFrame().click('.slide-calc');
        await settled(staticPage);
        await settled(studioPage);
        const opened = await shoot(`${String(slide.position + 1).padStart(2, '0')}-${slide.anchor}--calculator`, 'calculator');
        const reports = async () => (await studioPage.evaluate(() => window.__studio.states))
          .filter(state => state.type === 'supported-calculator-state').length;
        const openReports = await reports();
        /* The static deck is one page, so an open calculator would cover every
           later slide: close it the way a viewer would, and prove it closed. */
        const OVERLAY = '[data-calculator-overlay], [data-cash-builder-overlay]';
        for (const target of [staticPage, studioFrame()]) {
          await target.click(`:is(${OVERLAY}) button[class*="close"]`);
          await target.waitForFunction(selector => [...document.querySelectorAll(selector)].every(node => node.hidden), OVERLAY);
        }
        results.calculators.push({
          ...opened,
          calculator: features.calculator,
          reportedOpen: openReports === 1,
          reportedClose: (await reports()) === 2,
        });
      }
    }
    return results;
  } finally {
    await browser.close();
    await server.close();
  }
}
