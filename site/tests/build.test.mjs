import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { buildSite, loadManifest, REPO_ROOT } from '../build.mjs';

const hasZip = spawnSync('zip', ['-v'], { stdio: 'ignore' }).status === 0;

function walk(dir, list = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    entry.isDirectory() ? walk(full, list) : list.push(full);
  }
  return list;
}

function withBuild(fn, options = {}) {
  const outDir = mkdtempSync(join(tmpdir(), 'msfg-site-'));
  try {
    return fn(buildSite({ outDir, zip: false, ...options }), outDir);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
}

test('the manifest names real sources and downloads with unique slugs', () => {
  const { webinars } = loadManifest();
  const slugs = webinars.map(w => w.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  assert.deepEqual(slugs, ['homebuyers-webinar', 'va', 'le-cd', 'first-home-without-mystery', 'reverse-mortgages', 'studio']);
  for (const webinar of webinars) assert.ok(existsSync(join(REPO_ROOT, webinar.source, 'index.html')), webinar.slug);
});

test('the artifact root is the site shell', () => {
  withBuild(({ outRoot }) => {
    for (const name of ['index.html', 'amplify.yml', 'webinars/index.html']) {
      assert.ok(existsSync(join(outRoot, name)), `missing ${name}`);
    }
    const amplify = readFileSync(join(outRoot, 'amplify.yml'), 'utf8');
    assert.match(amplify, /baseDirectory: \./);
    assert.match(amplify, /webinars\/\*\*\/\*/);
  });
});

test('every webinar lands at /webinars/<slug>/ with its runtime files and downloads', () => {
  withBuild(({ outRoot, webinars }) => {
    assert.equal(webinars.length, 6);
    for (const slug of ['homebuyers-webinar', 'va', 'reverse-mortgages', 'studio']) {
      const deck = join(outRoot, 'webinars', slug);
      for (const file of ['index.html', 'presenter.html', 'css/tokens.css', 'js/deck.js', 'content/slides.js', 'content/presenters.js']) {
        assert.ok(existsSync(join(deck, file)), `${slug} missing ${file}`);
      }
    }
    /* The download names are the ones the library page links to. */
    assert.ok(existsSync(join(outRoot, 'webinars/homebuyers-webinar/downloads/homebuyers-playbook-webinar.pptx')));
    assert.ok(existsSync(join(outRoot, 'webinars/homebuyers-webinar/downloads/homebuyers-playbook-webinar-editable.pptx')));
    assert.ok(existsSync(join(outRoot, 'webinars/homebuyers-webinar/downloads/dos-and-donts.pdf')), 'deck-owned downloads must survive');
    assert.ok(existsSync(join(outRoot, 'webinars/va/downloads/understanding-va-loans.pptx')));

    /* The library page's filter script and card thumbnails ship with the shell. */
    for (const file of ['webinars/library-filter.mjs', 'webinars/assets/thumbnails/reverse-mortgages.png']) {
      assert.ok(existsSync(join(outRoot, file)), `shell missing ${file}`);
    }

    const firstHome = join(outRoot, 'webinars/first-home-without-mystery');
    for (const file of ['index.html', 'css/tokens.css', 'js/deck.js', 'js/surface-fit.js', 'content/slides.js']) {
      assert.ok(existsSync(join(firstHome, file)), `first-home-without-mystery missing ${file}`);
    }

    const viewer = join(outRoot, 'webinars/le-cd');
    for (const file of ['index.html', 'js/app.js', 'content/index.js', 'assets/documents/le-page-1.png', 'assets/documents/cd3-page-5.png', 'references/loan-estimate-H24B.pdf']) {
      assert.ok(existsSync(join(viewer, file)), `le-cd missing ${file}`);
    }
  });
});

test('development-only files never reach the artifact', () => {
  withBuild(({ outRoot }) => {
    const names = new Set(walk(outRoot).map(file => file.slice(outRoot.length + 1).split('/')).flat());
    for (const banned of ['.DS_Store', '.playwright-cli', '__pycache__', 'tests', 'scripts', 'output', 'build_pptx.py', 'content.json', 'package.json', 'package-lock.json', 'node_modules', 'README.md', 'DEPLOY.md', 'SLIDE_DESIGN_SPEC.md', 'CONTENT-REVIEW.md', 'CONTENT-APPROVAL.json', 'CD Webinar']) {
      assert.ok(!names.has(banned), `${banned} shipped`);
    }
  });
});

test('every root-relative link in the shell resolves inside the artifact', () => {
  withBuild(({ outRoot }) => {
    for (const page of ['index.html', 'webinars/index.html']) {
      const html = readFileSync(join(outRoot, page), 'utf8');
      const links = [...html.matchAll(/(?:href|src)="(\/[^"]*)"/g)].map(m => m[1].split(/[?#]/)[0]);
      assert.ok(links.length > 0, `${page} has no root-relative links`);
      for (const link of links) {
        const file = link.endsWith('/') ? join(outRoot, link, 'index.html') : join(outRoot, link);
        assert.ok(existsSync(file), `${page} → ${link}`);
      }
    }
  });
});

test('the hub page links every webinar in the manifest', () => {
  const html = readFileSync(join(REPO_ROOT, 'site/shell/webinars/index.html'), 'utf8');
  for (const { slug, unlisted } of loadManifest().webinars) {
    if (!unlisted) assert.match(html, new RegExp(`href="/webinars/${slug}/"`));
  }
});

test('the build produces a zip whose paths are artifact-root relative', { skip: !hasZip && 'zip is not installed' }, () => {
  withBuild(({ zipPath }) => {
    assert.ok(zipPath && existsSync(zipPath));
    assert.ok(statSync(zipPath).size > 1024 * 1024, 'zip is implausibly small');
    const listing = spawnSync('unzip', ['-Z1', zipPath], { encoding: 'utf8' }).stdout.split('\n').filter(Boolean);
    assert.ok(listing.includes('index.html'));
    assert.ok(listing.includes('amplify.yml'));
    assert.ok(listing.includes('webinars/index.html'));
    assert.ok(listing.includes('webinars/le-cd/index.html'));
    assert.ok(!listing.some(path => path.startsWith('site/') || path.startsWith('dist/')));
  }, { zip: true });
});

test('Webinar Studio is the Reverse Mortgages engine with its own content laid over it', () => {
  withBuild(({ outRoot }) => {
    const studio = join(outRoot, 'webinars/studio');
    const reverse = join(outRoot, 'webinars/reverse-mortgages');
    const read = (root, file) => readFileSync(join(root, file), 'utf8');
    /* the Studio's own pages and content */
    for (const file of ['home.html', 'js/studio-home.js', 'content/site-webinars.js']) {
      assert.ok(existsSync(join(studio, file)), `studio missing ${file}`);
      assert.ok(!existsSync(join(reverse, file)), `${file} leaked into the Reverse Mortgages deck`);
    }
    assert.match(read(studio, 'content/webinar-config.js'), /created: true/);
    assert.match(read(reverse, 'content/webinar-config.js'), /slug: 'reverse-mortgages'/);
    assert.match(read(studio, 'content/slides.js'), /Your webinar title/);
    assert.match(read(reverse, 'content/slides.js'), /What is a HECM\?/);
    /* the engine itself is shared, file for file */
    for (const file of ['index.html', 'presenter.html', 'editor.html', 'js/deck.js', 'js/presenter.js', 'js/slide-editor.js', 'js/slide-edits.js', 'js/pages.js', 'css/reverse.css']) {
      assert.equal(read(studio, file), read(reverse, file), `${file} differs`);
    }
    /* staff reach it from the Dashboard; the public library page does not link to it */
    assert.doesNotMatch(read(outRoot, 'webinars/index.html'), /\/webinars\/studio\//);
  });
});

test('every slide deck ships the same Slide settings code, with its own format notes', () => {
  /* Each deck carries its own copy of the editor. The copies must not drift:
     change the Reverse Mortgages one and copy it to the others. */
  const shared = ['editor.html', 'js/slide-edits.js', 'js/slide-editor.js', 'js/slide-prompt.js', 'js/pages.js'];
  const decks = ['first-home-without-mystery/deck', 'first-time-homebuyer/deck', 'va-loans/deck'];
  const read = (deck, file) => readFileSync(join(REPO_ROOT, deck, file), 'utf8');
  for (const deck of decks) {
    for (const file of shared) {
      assert.equal(read(deck, file), read('reverse-mortgages/deck', file), `${deck}/${file} differs from the Reverse Mortgages copy`);
    }
    assert.match(read(deck, 'content/slide-format.js'), /export const SLIDE_FORMAT/, `${deck} has no slide format`);
    assert.match(read(deck, 'content/webinar-config.js'), /slideEditsApi/, `${deck} is not set up for saved edits`);
  }
});

test('the built Webinar Studio starts new webinars with three starter slides and safe names', async () => {
  const outDir = mkdtempSync(join(tmpdir(), 'msfg-site-'));
  try {
    const { outRoot } = buildSite({ outDir, zip: false });
    const studio = join(outRoot, 'webinars/studio');
    const { SLIDES, SOURCE_APPENDIX } = await import(pathToFileURL(join(studio, 'content/slides.js')).href);
    assert.deepEqual(SLIDES.map(slide => slide.id), ['opening', 'content', 'questions']);
    assert.ok(SLIDES.every(slide => slide.layout === 'sourceFaithful' && slide.sourceBlocks.length && slide.notes));
    assert.deepEqual(SOURCE_APPENDIX.blocks, []);

    const { WEBINAR } = await import(pathToFileURL(join(studio, 'content/webinar-config.js')).href);
    assert.equal(WEBINAR.created, true);
    assert.equal(WEBINAR.query, '', 'no webinar is named outside a browser');

    const { slugFor } = await import(pathToFileURL(join(studio, 'js/studio-home.js')).href);
    assert.equal(slugFor('Down Payment Help in Colorado!'), 'down-payment-help-in-colorado');
    assert.equal(slugFor('  Café & “VA” loans — 2026  '), 'cafe-and-va-loans-2026');
    assert.equal(slugFor('Reverse Mortgages'), 'reverse-mortgages-2', 'a built-in webinar\'s name is never reused');
    assert.equal(slugFor('VA'), 'va-2');
    assert.equal(slugFor('!!!'), 'webinar-2', 'falls back when the title has no letters');
    assert.equal(slugFor('Rates', ['rates', 'rates-2']), 'rates-3');
    assert.ok(slugFor('x'.repeat(200)).length <= 60);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});

test('a webinar without a hub card fails the build instead of shipping unreachable', () => {
  const manifest = loadManifest();
  manifest.webinars.push({ slug: 'orphan', title: 'Orphan', source: 'cd-webinar', downloads: [] });
  const outDir = mkdtempSync(join(tmpdir(), 'msfg-site-'));
  try {
    assert.throws(() => buildSite({ outDir, zip: false, manifest }), /no card linking to \/webinars\/orphan\//);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});
