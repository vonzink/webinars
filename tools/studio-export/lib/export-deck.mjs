import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAssetRegistry, sha256File, tokensIn } from './assets.mjs';
import { buildSlideJavascript } from './bundle-js.mjs';
import { captureRenderedDeck } from './capture.mjs';
import { writeCanonicalJson } from './canonical-json.mjs';
import { decodeCssStringEscapes, rewriteCssUrls } from './css.mjs';
import { localAssetToken } from './assets.mjs';
import { slideId } from './uuid.mjs';

const TOOL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RUNTIME_DIR = path.join(TOOL_DIR, 'runtime');
export const REPO_ROOT = path.resolve(TOOL_DIR, '..', '..');

const ANCHOR = /^[a-z][a-z0-9-]{0,189}$/;
const ACTION_ID = /^[a-z][a-z0-9-]{0,63}$/;

/* In Studio the slide frame itself is the 1920×1080 stage, so the deck's own
   viewport scaling is switched off and the surface sits at the frame origin. */
const STUDIO_STAGE_CSS = `
/* Webinar Studio: the slide frame is the 1920×1080 stage. */
html, body { width: 1920px; height: 1080px; overflow: hidden; }
.slide-scaler { position: absolute; top: 0; right: auto; bottom: auto; left: 0; width: 1920px; height: 1080px; transform: none; }
`;

const escapeAttribute = value => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

function masterHtml(stylesheets, hasModals) {
  const links = stylesheets
    .filter(sheet => !sheet.local)
    .map(sheet => `<link rel="stylesheet" href="${escapeAttribute(sheet.href)}">`)
    .join('');
  const modalRoot = hasModals ? '<div id="modal-root" class="modal-root"></div>' : '';
  return `${links}<div class="slide-scaler">{{SLIDE_CONTENT}}</div>${modalRoot}`;
}

function masterCss(deckDir, stylesheets, assets) {
  const parts = stylesheets.filter(sheet => sheet.local).map(sheet => {
    const source = fs.readFileSync(path.join(deckDir, sheet.path), 'utf8');
    const urls = rewriteCssUrls(source, reference => (
      localAssetToken(assets.register(path.posix.join(path.posix.dirname(sheet.path), reference)))
    ));
    return decodeCssStringEscapes(urls);
  });
  return `${parts.join('\n')}${STUDIO_STAGE_CSS}`;
}

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(full);
    return entry.name === '.DS_Store' ? [] : [full];
  });
}

/* Captures a deck and returns the Studio source bundle, the asset manifest,
   and a report of everything that changed on the way. Writes nothing. */
export async function exportDeck(deck) {
  const deckDir = path.join(REPO_ROOT, deck.deckDir);
  const captured = await captureRenderedDeck({
    deckDir,
    slidesModule: deck.slidesModule,
    expectedSlides: deck.expectedSlides,
  });
  if (captured.slides.length !== deck.expectedSlides) {
    throw new Error(`Expected ${deck.expectedSlides} slides, captured ${captured.slides.length}`);
  }

  const assets = createAssetRegistry(deckDir);
  const usedBy = new Map();
  const noteUse = (key, where) => usedBy.set(key, [...new Set([...(usedBy.get(key) || []), where])]);

  const css = masterCss(deckDir, captured.stylesheets, assets);
  tokensIn(css).forEach(key => noteUse(key, 'master.css'));
  const hasModals = captured.slides.some(slide => slide.modalIds.length > 0 || slide.mediaIds.length > 0);

  const slides = [];
  const report = { slides: [], inertLinks: [], blockedRequests: captured.blockedRequests, notMigrated: deck.notMigrated || [] };

  for (const slide of captured.slides) {
    if (!ANCHOR.test(slide.anchor)) throw new Error(`Slide anchor is not valid in Studio: ${slide.anchor}`);
    if (slide.unresolved.length) {
      throw new Error(`Slide ${slide.anchor} references media outside the deck: ${slide.unresolved.join(', ')}`);
    }
    for (const id of [...slide.modalIds, ...slide.mediaIds]) {
      if (!ACTION_ID.test(id)) throw new Error(`Popout id is not a valid Studio action id: ${id}`);
    }
    if (slide.mediaIds.length && !deck.media) {
      throw new Error(`Slide ${slide.anchor} opens media popouts, which this deck's config does not handle`);
    }
    const clash = slide.modalIds.filter(id => slide.mediaIds.includes(id));
    if (clash.length) throw new Error(`Slide ${slide.anchor} uses the same id for a popout and a graphic: ${clash.join(', ')}`);

    slide.assetPaths.forEach(reference => assets.register(reference));
    const calculator = slide.calculator ? deck.calculators?.[slide.calculator] : null;
    if (slide.calculator && !calculator) {
      throw new Error(`Slide ${slide.anchor} uses calculator "${slide.calculator}", which has no Studio adapter`);
    }

    const hasOverlays = slide.modalIds.length > 0 || slide.mediaIds.length > 0;
    const javascript = await buildSlideJavascript({
      repoRoot: REPO_ROOT,
      deckDir,
      runtimeDir: RUNTIME_DIR,
      features: {
        overlays: hasOverlays ? {
          module: deck.modal.module,
          modals: slide.modalIds.length ? deck.modal : null,
          media: slide.mediaIds.length ? deck.media : null,
        } : null,
        graphicsMenu: slide.hasGraphicsMenu,
        calculator,
      },
      registerAsset: reference => assets.register(reference),
    });

    for (const key of tokensIn(slide.html)) {
      if (!assets.has(key)) throw new Error(`Slide ${slide.anchor} uses an unregistered asset key: ${key}`);
      noteUse(key, `${slide.anchor}.html`);
    }
    tokensIn(javascript).forEach(key => noteUse(key, `${slide.anchor}.javascript`));

    slides.push({
      id: slideId(deck.slug, slide.anchor),
      position: slide.position,
      anchor: slide.anchor,
      title: slide.title.slice(0, 255),
      targetSeconds: slide.targetSeconds,
      speakerNotes: slide.speakerNotes,
      html: slide.html,
      css: '',
      javascript,
    });
    report.slides.push({
      anchor: slide.anchor,
      popouts: slide.modalIds,
      graphics: slide.mediaIds,
      calculator: slide.calculator,
      builds: (slide.html.match(/class="[^"]*\bbuild\b/g) || []).length,
    });
    slide.links.forEach(link => report.inertLinks.push({ slide: slide.anchor, ...link }));
  }

  if (new Set(slides.map(slide => slide.id)).size !== slides.length) throw new Error('Slide ids are not unique');

  const bundle = {
    schemaVersion: 1,
    webinar: { slug: deck.slug, title: deck.title },
    master: { html: masterHtml(captured.stylesheets, hasModals), css },
    slides,
  };
  const assetManifest = {
    schemaVersion: 1,
    slug: deck.slug,
    root: deck.deckDir,
    assets: assets.list().map(asset => ({ ...asset, usedBy: (usedBy.get(asset.key) || []).sort() })),
  };
  const unused = assetManifest.assets.filter(asset => asset.usedBy.length === 0).map(asset => asset.key);
  if (unused.length) throw new Error(`Assets were registered but never referenced: ${unused.join(', ')}`);

  return { bundle, assetManifest, report };
}

/* Writes the bundle, manifest, report, and the checksum record for one deck. */
export async function writeDeckExport(deck) {
  const { bundle, assetManifest, report } = await exportDeck(deck);
  const outDir = path.join(REPO_ROOT, deck.outDir);
  const files = {
    bundle: path.join(outDir, 'source-bundle.json'),
    assets: path.join(outDir, 'asset-manifest.json'),
    report: path.join(outDir, 'export-report.json'),
    checksums: path.join(outDir, 'source-checksums.sha256'),
  };
  writeCanonicalJson(files.bundle, bundle);
  writeCanonicalJson(files.assets, assetManifest);
  writeCanonicalJson(files.report, report);

  const deckDir = path.join(REPO_ROOT, deck.deckDir);
  const inputs = [
    path.join(deckDir, 'index.html'),
    ...['css', 'js', 'content'].flatMap(folder => listFiles(path.join(deckDir, folder))),
    ...assetManifest.assets.map(asset => path.join(deckDir, asset.path)),
    ...listFiles(RUNTIME_DIR),
    files.bundle,
    files.assets,
  ];
  const lines = [...new Set(inputs)]
    .map(file => path.relative(REPO_ROOT, file).split(path.sep).join('/'))
    .sort()
    .map(relative => `${sha256File(path.join(REPO_ROOT, relative))}  ${relative}`);
  fs.writeFileSync(files.checksums, `${lines.join('\n')}\n`);

  return { bundle, assetManifest, report, files };
}
