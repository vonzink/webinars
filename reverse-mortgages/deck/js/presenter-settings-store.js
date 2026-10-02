import { WEBINAR } from '../content/webinar-config.js';
import { resolveShortcuts } from './presenter-shortcuts.js';
const key = id => `msfg-local-shortcuts:${WEBINAR.slug}:${id}`;
export async function loadPresenterShortcuts(id) {
  const saved = JSON.parse(localStorage.getItem(key(id)) || 'null');
  return { shortcuts: resolveShortcuts(saved), offline: false, hasSaved: Boolean(saved) };
}
export async function savePresenterShortcuts(id, shortcuts) {
  const saved = resolveShortcuts(shortcuts); localStorage.setItem(key(id), JSON.stringify(saved)); return saved;
}
