/* Presenter settings live in Postgres so each loan officer keeps the same
   shortcuts across webinar decks and devices. The browser copy is offline-only. */
import { WEBINAR } from '../content/webinar-config.js';
import { resolveShortcuts } from './presenter-shortcuts.js';

const cacheKey = loId => `msfg-presenter-settings-cache:${loId}`;
const writeHeaders = () => ({
  'Content-Type': 'application/json',
  'x-webinar-key': WEBINAR.writeKey,
});

function writeCache(loId, shortcuts) {
  try { localStorage.setItem(cacheKey(loId), JSON.stringify(shortcuts)); } catch { /* ignore */ }
}

function readCache(loId) {
  try { return JSON.parse(localStorage.getItem(cacheKey(loId))); } catch { return null; }
}

export async function loadPresenterShortcuts(loId) {
  try {
    const url = `${WEBINAR.apiBase}/presenter-settings?lo=${encodeURIComponent(loId)}`;
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) throw new Error(`list ${response.status}`);
    const { settings } = await response.json();
    const shortcuts = resolveShortcuts(settings?.shortcuts || null);
    writeCache(loId, shortcuts);
    return { shortcuts, offline: false, hasSaved: Boolean(settings) };
  } catch (error) {
    console.warn('[presenter settings] offline, using cache:', error.message);
    return { shortcuts: resolveShortcuts(readCache(loId)), offline: true, hasSaved: false };
  }
}

export async function savePresenterShortcuts(loId, shortcuts) {
  const response = await fetch(`${WEBINAR.apiBase}/presenter-settings/${encodeURIComponent(loId)}`, {
    method: 'PUT',
    mode: 'cors',
    headers: writeHeaders(),
    body: JSON.stringify({ shortcuts }),
  });
  if (!response.ok) throw new Error(`save ${response.status}`);
  const { settings } = await response.json();
  const saved = resolveShortcuts(settings?.shortcuts);
  writeCache(loId, saved);
  return saved;
}
