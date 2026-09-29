/* ============================================================================
   PRESENTER ROSTER — the built-in default (Seth) plus presentation-ready loan
   officers pulled live from the webinar API. "Ready" = has a headshot, so the
   public deck never shows half-populated / placeholder rows.
   ========================================================================= */
import { WEBINAR } from '../content/webinar-config.js';
import { PRESENTERS } from '../content/presenters.js';

/* Seth is the built-in default and always first. Stable id so his notes persist
   even though he isn't a loan_officers row. */
export const DEFAULT_PRESENTER = Object.freeze({
  ...PRESENTERS.seth,
  id: 'seth-angell',
  scheduleUrl: null,
  source: 'builtin',
});

function mapLoanOfficer(lo) {
  return {
    id: lo.id,
    name: lo.name,
    title: 'Loan Officer',
    nmls: lo.nmls ? `NMLS# ${lo.nmls}` : '',
    phone: null,           // not in loan_officers
    email: null,
    email2: null,
    portrait: lo.photo_url || null,
    scheduleUrl: lo.schedule_url || null,
    city: lo.city || null,
    state: lo.state || null,
    source: 'db',
  };
}

/* Returns the presenter roster with Seth always first. Loan officers come from
   the API (only those with a headshot). Seth is deduped against his own DB row
   and always keeps his phone/email/title, which aren't stored in loan_officers.
   Falls back to just Seth if the API is unreachable. */
export async function fetchPresenters() {
  let dbList = [];
  try {
    const res = await fetch(`${WEBINAR.apiBase}/loan-officers`, { mode: 'cors' });
    if (!res.ok) throw new Error(`roster ${res.status}`);
    const { loanOfficers = [] } = await res.json();
    dbList = loanOfficers.filter(lo => lo.photo_url).map(mapLoanOfficer);
  } catch (e) {
    console.warn('[roster] using default presenter only:', e.message);
  }
  const byId = new Map(dbList.map(p => [p.id, p]));
  const sethDb = byId.get(DEFAULT_PRESENTER.id);
  byId.delete(DEFAULT_PRESENTER.id);
  const seth = {
    ...DEFAULT_PRESENTER,
    ...(sethDb || {}),                 // DB headshot etc. override where present…
    id: DEFAULT_PRESENTER.id,
    title: DEFAULT_PRESENTER.title,    // …but his contact always comes from the default
    phone: DEFAULT_PRESENTER.phone,
    email: DEFAULT_PRESENTER.email,
    email2: DEFAULT_PRESENTER.email2,
  };
  return [seth, ...byId.values()];
}

export function findPresenter(list, id) {
  return list.find(p => p.id === id) || list[0] || DEFAULT_PRESENTER;
}
