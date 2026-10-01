import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

/* The media types the Studio asset library accepts. */
export const MIME_BY_EXTENSION = Object.freeze({
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
});

export const LOCAL_ASSET_TOKEN = /\{\{LOCAL_ASSET:([a-z0-9-]+)\}\}/g;

/* Deck-relative path -> logical key. Must stay in step with the copy that runs
   in the browser during capture (lib/capture.mjs). */
export function assetKey(deckPath) {
  return deckPath
    .replace(/^\.?\//, '')
    .replace(/^assets\//, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function localAssetToken(key) {
  return `{{LOCAL_ASSET:${key}}}`;
}

export function sha256File(file) {
  return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

/* Turn any reference a deck makes (./assets/a%20b.png, assets/a b.png) into a
   clean deck-relative path, or null when it points outside the deck. */
export function normalizeDeckPath(reference) {
  let value = String(reference).split(/[?#]/)[0];
  try { value = decodeURIComponent(value); } catch { return null; }
  const normalized = path.posix.normalize(value.replace(/^\.\//, ''));
  if (normalized.startsWith('..') || path.posix.isAbsolute(normalized)) return null;
  return normalized;
}

export function describeAsset(deckDir, deckPath) {
  const file = path.join(deckDir, deckPath);
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    throw new Error(`Asset is referenced but missing: ${deckPath}`);
  }
  const mimeType = MIME_BY_EXTENSION[path.extname(deckPath).toLowerCase()];
  if (!mimeType) throw new Error(`Asset type is not accepted by Studio: ${deckPath}`);
  return {
    key: assetKey(deckPath),
    path: deckPath,
    mimeType,
    byteSize: fs.statSync(file).size,
    sha256: sha256File(file),
  };
}

/* Collects every asset a bundle references and proves each key is unique. */
export function createAssetRegistry(deckDir) {
  const byKey = new Map();
  return {
    register(reference) {
      const deckPath = normalizeDeckPath(reference);
      if (!deckPath) throw new Error(`Asset reference leaves the deck: ${reference}`);
      const asset = describeAsset(deckDir, deckPath);
      const existing = byKey.get(asset.key);
      if (existing && existing.path !== asset.path) {
        throw new Error(`Two assets share the key ${asset.key}: ${existing.path} and ${asset.path}`);
      }
      byKey.set(asset.key, asset);
      return asset.key;
    },
    has: key => byKey.has(key),
    list: () => [...byKey.values()].sort((a, b) => a.key.localeCompare(b.key)),
  };
}

export function tokensIn(source) {
  return [...String(source).matchAll(LOCAL_ASSET_TOKEN)].map(match => match[1]);
}
