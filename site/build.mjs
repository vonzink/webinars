#!/usr/bin/env node
/* ============================================================================
   SITE BUILD — assembles the whole msfgmortgage.com Amplify artifact.

   Amplify replaces the entire deployment on every upload, so the artifact must
   always contain the site shell plus every webinar. This script is the single
   source of truth for what ships and where:

     site/shell/          → artifact root (index.html, amplify.yml, webinars/index.html)
     site/webinars.json   → which source folder lands at /webinars/<slug>/

   Usage (repository root):
     node site/build.mjs            # builds dist/site/ and dist/site.zip
     node site/build.mjs --no-zip   # builds dist/site/ only
     node site/build.mjs --out DIR  # writes to DIR instead of dist/

   No dependencies beyond Node 20+ and the `zip` command.
   ========================================================================= */
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join, posix, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const SITE_DIR = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = resolve(SITE_DIR, '..');
const SHELL_DIR = join(SITE_DIR, 'shell');
const MANIFEST_PATH = join(SITE_DIR, 'webinars.json');

export class BuildError extends Error {}

export function loadManifest(path = MANIFEST_PATH) {
  const manifest = JSON.parse(readFileSync(path, 'utf8'));
  if (!Array.isArray(manifest.webinars) || manifest.webinars.length === 0) {
    throw new BuildError('webinars.json must list at least one webinar');
  }
  const slugs = new Set();
  for (const webinar of manifest.webinars) {
    for (const key of ['slug', 'title', 'source']) {
      if (typeof webinar[key] !== 'string' || !webinar[key]) throw new BuildError(`webinar is missing "${key}": ${JSON.stringify(webinar)}`);
    }
    if (!/^[a-z0-9-]+$/.test(webinar.slug)) throw new BuildError(`slug must be lowercase letters, digits, and dashes: "${webinar.slug}"`);
    if (slugs.has(webinar.slug)) throw new BuildError(`duplicate slug "${webinar.slug}"`);
    slugs.add(webinar.slug);
    if (!existsSync(join(REPO_ROOT, webinar.source, 'index.html'))) {
      throw new BuildError(`"${webinar.slug}" source has no index.html: ${webinar.source}`);
    }
    for (const download of webinar.downloads ?? []) {
      if (!existsSync(join(REPO_ROOT, download.from))) throw new BuildError(`"${webinar.slug}" download not found: ${download.from}`);
    }
  }
  return { exclude: manifest.exclude ?? [], webinars: manifest.webinars };
}

/* A file or folder is excluded when any segment of its path (relative to the
   webinar's source folder) matches an excluded name exactly. */
function makeFilter(sourceRoot, excluded) {
  const names = new Set(excluded);
  return path => {
    const rel = relative(sourceRoot, path);
    if (!rel) return true;
    return !rel.split(sep).some(segment => names.has(segment));
  };
}

function copyWebinar(webinar, globalExclude, outRoot) {
  const sourceRoot = join(REPO_ROOT, webinar.source);
  const target = join(outRoot, 'webinars', webinar.slug);
  cpSync(sourceRoot, target, { recursive: true, filter: makeFilter(sourceRoot, [...globalExclude, ...(webinar.exclude ?? [])]) });
  for (const download of webinar.downloads ?? []) {
    const dest = join(target, download.to);
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(join(REPO_ROOT, download.from), dest);
  }
  return target;
}

/* Every root-relative href/src in the shell pages must resolve to a real file
   in the artifact, and every manifest slug must be linked from the hub. */
function verifyShellLinks(outRoot, webinars) {
  const problems = [];
  const pages = ['index.html', posix.join('webinars', 'index.html')];
  const linked = new Set();
  for (const page of pages) {
    const html = readFileSync(join(outRoot, page), 'utf8');
    for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const url = match[1];
      if (!url.startsWith('/')) continue; // data:, https:, relative
      const clean = url.split(/[?#]/)[0];
      const file = clean.endsWith('/') ? join(outRoot, clean, 'index.html') : join(outRoot, clean);
      if (!existsSync(file)) problems.push(`${page} links to ${url} but the artifact has no ${relative(outRoot, file)}`);
      const slugMatch = clean.match(/^\/webinars\/([^/]+)\//);
      if (slugMatch) linked.add(slugMatch[1]);
    }
  }
  for (const webinar of webinars) {
    if (!linked.has(webinar.slug)) problems.push(`webinars/index.html has no card linking to /webinars/${webinar.slug}/`);
  }
  return problems;
}

function walk(dir, list = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    entry.isDirectory() ? walk(full, list) : list.push(full);
  }
  return list;
}

function formatSize(bytes) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;
}

export function buildSite({ outDir = join(REPO_ROOT, 'dist'), zip = true, log = () => {}, manifest = loadManifest() } = {}) {
  const { exclude, webinars } = manifest;
  const outRoot = join(outDir, 'site');
  rmSync(outRoot, { recursive: true, force: true });
  mkdirSync(outRoot, { recursive: true });

  cpSync(SHELL_DIR, outRoot, { recursive: true, filter: makeFilter(SHELL_DIR, ['.DS_Store']) });
  for (const name of ['index.html', 'amplify.yml', posix.join('webinars', 'index.html')]) {
    if (!existsSync(join(outRoot, name))) throw new BuildError(`site/shell is missing ${name}`);
  }

  const summary = [];
  for (const webinar of webinars) {
    const target = copyWebinar(webinar, exclude, outRoot);
    const files = walk(target);
    const bytes = files.reduce((total, file) => total + statSync(file).size, 0);
    summary.push({ slug: webinar.slug, title: webinar.title, files: files.length, bytes });
  }

  const problems = verifyShellLinks(outRoot, webinars);
  if (problems.length) throw new BuildError(`artifact verification failed:\n  - ${problems.join('\n  - ')}`);

  let zipPath = null;
  if (zip) {
    zipPath = join(outDir, 'site.zip');
    rmSync(zipPath, { force: true });
    const result = spawnSync('zip', ['-r', '-X', '-q', zipPath, '.'], { cwd: outRoot, stdio: 'inherit' });
    if (result.error?.code === 'ENOENT') throw new BuildError('the `zip` command is not installed; rerun with --no-zip or install zip');
    if (result.status !== 0) throw new BuildError(`zip exited with status ${result.status}`);
  }

  for (const row of summary) log(`  /webinars/${row.slug}/  ${row.title}  (${row.files} files, ${formatSize(row.bytes)})`);
  if (zipPath) log(`  ${relative(REPO_ROOT, zipPath)}  ${formatSize(statSync(zipPath).size)}`);
  return { outRoot, zipPath, webinars: summary };
}

function parseArgs(argv) {
  const options = { zip: true };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--no-zip') options.zip = false;
    else if (arg === '--out') options.outDir = resolve(argv[++i] ?? '');
    else throw new BuildError(`unknown argument: ${arg}`);
  }
  if (options.outDir === resolve('')) throw new BuildError('--out needs a directory');
  return options;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    console.log('Building msfgmortgage.com artifact');
    const { outRoot } = buildSite({ ...parseArgs(process.argv.slice(2)), log: console.log });
    console.log(`Done: ${relative(REPO_ROOT, outRoot)}/`);
  } catch (error) {
    console.error(error instanceof BuildError ? `Build failed: ${error.message}` : error);
    process.exit(1);
  }
}
