import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
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
  assert.deepEqual(slugs, ['homebuyers-webinar', 'va', 'le-cd']);
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
    assert.equal(webinars.length, 3);
    for (const slug of ['homebuyers-webinar', 'va']) {
      const deck = join(outRoot, 'webinars', slug);
      for (const file of ['index.html', 'presenter.html', 'css/tokens.css', 'js/deck.js', 'content/slides.js', 'content/presenters.js']) {
        assert.ok(existsSync(join(deck, file)), `${slug} missing ${file}`);
      }
    }
    assert.ok(existsSync(join(outRoot, 'webinars/homebuyers-webinar/downloads/Homebuyers-Playbook.pptx')));
    assert.ok(existsSync(join(outRoot, 'webinars/homebuyers-webinar/downloads/dos-and-donts.pdf')), 'deck-owned downloads must survive');
    assert.ok(existsSync(join(outRoot, 'webinars/va/downloads/Understanding-VA-Loans.pptx')));

    const viewer = join(outRoot, 'webinars/le-cd');
    for (const file of ['index.html', 'js/app.js', 'content/index.js', 'assets/documents/le-page-1.png', 'assets/documents/cd3-page-5.png', 'references/loan-estimate-H24B.pdf']) {
      assert.ok(existsSync(join(viewer, file)), `le-cd missing ${file}`);
    }
  });
});

test('development-only files never reach the artifact', () => {
  withBuild(({ outRoot }) => {
    const names = new Set(walk(outRoot).map(file => file.slice(outRoot.length + 1).split('/')).flat());
    for (const banned of ['.DS_Store', '.playwright-cli', '__pycache__', 'tests', 'scripts', 'output', 'build_pptx.py', 'content.json', 'package.json', 'README.md', 'DEPLOY.md', 'SLIDE_DESIGN_SPEC.md', 'CONTENT-REVIEW.md', 'CONTENT-APPROVAL.json', 'CD Webinar']) {
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
  for (const { slug } of loadManifest().webinars) assert.match(html, new RegExp(`href="/webinars/${slug}/"`));
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
