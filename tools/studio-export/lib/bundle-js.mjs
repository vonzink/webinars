import path from 'node:path';
import { build } from 'esbuild';
import { localAssetToken } from './assets.mjs';

const ASSET_REFERENCE = /(?:\.\/)?assets\/[^"'`\s()<>]+?\.(?:png|jpe?g|webp|gif|svg|woff2?|mp3|wav|mp4|webm)/gi;

/* Things that must never reach a public slide: the legacy API, its write key,
   and anything that names a path on the machine that ran the export. */
const FORBIDDEN = [
  [/x-webinar-key/i, 'the legacy write-key header'],
  [/writeKey/, 'the legacy write key'],
  [/api\.msfgco\.com/i, 'a legacy API URL'],
  [/\/Users\/|[A-Za-z]:\\\\/, 'an absolute local path'],
];

/* features.overlays: { module, modals: { data, dataExport } | null, media: { data, dataExport } | null } */
function entrySource({ overlays, graphicsMenu, calculator }) {
  const lines = ["import { startBuilds } from '@studio/builds.js';"];
  const calls = ['startBuilds();'];
  if (overlays) {
    const options = ['modal'];
    lines.push(`import * as modal from '@deck/${overlays.module}';`);
    if (overlays.modals) {
      lines.push(`import { ${overlays.modals.dataExport} } from '@deck/${overlays.modals.data}';`);
      options.push(`modalIds: Object.keys(${overlays.modals.dataExport})`);
    }
    if (overlays.media) {
      lines.push(`import { ${overlays.media.dataExport} } from '@deck/${overlays.media.data}';`);
      options.push(`mediaIds: ${overlays.media.dataExport}.map(item => item.id)`);
    }
    lines.push("import { startOverlays } from '@studio/overlays.js';");
    calls.push(`startOverlays({ ${options.join(', ')} });`);
  }
  if (graphicsMenu) {
    lines.push("import { startGraphicsMenu } from '@studio/graphics-menu.js';");
    calls.push('startGraphicsMenu();');
  }
  if (calculator) {
    lines.push(`import { startCalculator } from '@studio/calculators/${calculator}.js';`);
    calls.push('startCalculator();');
  }
  return `${lines.join('\n')}\n\n${calls.join('\n')}\n`;
}

/* Bundles the slide runtime and the deck modules it needs into one classic
   script. Studio runs each slide's JavaScript as a single non-module script in
   a sandboxed frame, so imports cannot survive into the bundle. */
export async function buildSlideJavascript({ repoRoot, deckDir, runtimeDir, features, registerAsset }) {
  const result = await build({
    stdin: {
      contents: entrySource(features),
      resolveDir: runtimeDir,
      sourcefile: 'studio-slide-entry.js',
      loader: 'js',
    },
    absWorkingDir: repoRoot,
    alias: { '@deck': deckDir, '@studio': runtimeDir },
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: ['es2020'],
    charset: 'utf8',
    legalComments: 'none',
    minify: false,
    write: false,
    logLevel: 'silent',
  });
  if (result.warnings.length) {
    throw new Error(`Slide runtime bundle warnings: ${result.warnings.map(warning => warning.text).join('; ')}`);
  }

  const javascript = result.outputFiles[0].text
    .replace(ASSET_REFERENCE, reference => localAssetToken(registerAsset(reference)));

  for (const [pattern, label] of FORBIDDEN) {
    if (pattern.test(javascript)) throw new Error(`Slide JavaScript contains ${label}`);
  }
  if (javascript.includes(path.resolve(repoRoot))) throw new Error('Slide JavaScript contains the repository path');
  return javascript;
}
