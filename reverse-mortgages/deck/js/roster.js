import { PRESENTERS } from '../content/presenters.js';
export const DEFAULT_PRESENTER = Object.freeze({ ...PRESENTERS.seth, id: 'seth-angell', scheduleUrl: null, source: 'builtin' });
export async function fetchPresenters() { return [DEFAULT_PRESENTER]; }
export function findPresenter(list, id) { return list.find(p => p.id === id) || DEFAULT_PRESENTER; }
