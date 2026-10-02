// Local review: notes stay in this browser and never contact the live webinar API.
import { WEBINAR } from '../content/webinar-config.js';
const KEY = `msfg-local-notes:${WEBINAR.slug}`;
function read() { const value = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(value) ? value : []; }
function write(notes) { localStorage.setItem(KEY, JSON.stringify(notes)); }
export async function listNotes(loId) { return { notes: read().filter(n => n.lo_id === loId), offline: false }; }
export async function addNote(loId, slideId, body) {
  const note = { id: crypto.randomUUID(), lo_id: loId, slide_id: slideId, body, updated_at: new Date().toISOString() };
  write([...read(), note]); return note;
}
export async function editNote(id, body) {
  const notes = read(); const note = notes.find(n => n.id === id);
  if (!note) throw new Error('Note not found');
  note.body = body; note.updated_at = new Date().toISOString(); write(notes); return note;
}
export async function deleteNote(id) { write(read().filter(n => n.id !== id)); return true; }
