/* ============================================================================
   NOTES STORE — presenter notes persisted in the MSFG webinar API (Postgres),
   keyed by webinar slug + loan-officer id + slide. Replaces per-browser storage
   so an LO's notes follow them to any device. A localStorage mirror is kept as
   an offline cache / fallback when the network is unavailable.
   ========================================================================= */
import { WEBINAR } from '../content/webinar-config.js';

const cacheKey = loId => `msfg-notes-cache:${WEBINAR.slug}:${loId}`;

function writeCache(loId, notes) {
  try { localStorage.setItem(cacheKey(loId), JSON.stringify(notes)); } catch { /* ignore */ }
}
function readCache(loId) {
  try { return JSON.parse(localStorage.getItem(cacheKey(loId))) || []; } catch { return []; }
}

const writeHeaders = () => ({ 'Content-Type': 'application/json', 'x-webinar-key': WEBINAR.writeKey });

/* Returns all notes for a presenter: [{ id, slide_id, body, updated_at }]. */
export async function listNotes(loId) {
  try {
    const url = `${WEBINAR.apiBase}/notes?webinar=${encodeURIComponent(WEBINAR.slug)}&lo=${encodeURIComponent(loId)}`;
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error(`list ${res.status}`);
    const { notes = [] } = await res.json();
    writeCache(loId, notes);
    return { notes, offline: false };
  } catch (e) {
    console.warn('[notes] offline, using cache:', e.message);
    return { notes: readCache(loId), offline: true };
  }
}

export async function addNote(loId, slideId, body) {
  const res = await fetch(`${WEBINAR.apiBase}/notes`, {
    method: 'POST', mode: 'cors', headers: writeHeaders(),
    body: JSON.stringify({ webinar: WEBINAR.slug, lo: loId, slide: slideId, body }),
  });
  if (!res.ok) throw new Error(`add ${res.status}`);
  return (await res.json()).note;
}

export async function editNote(id, body) {
  const res = await fetch(`${WEBINAR.apiBase}/notes/${encodeURIComponent(id)}`, {
    method: 'PUT', mode: 'cors', headers: writeHeaders(), body: JSON.stringify({ body }),
  });
  if (!res.ok) throw new Error(`edit ${res.status}`);
  return (await res.json()).note;
}

export async function deleteNote(id) {
  const res = await fetch(`${WEBINAR.apiBase}/notes/${encodeURIComponent(id)}`, {
    method: 'DELETE', mode: 'cors', headers: writeHeaders(),
  });
  if (!res.ok) throw new Error(`delete ${res.status}`);
  return true;
}
