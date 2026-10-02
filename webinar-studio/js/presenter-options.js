/* ============================================================================
   WEBINAR SUITE — who can present a new presentation.
   For now the deck's built-in list (content/presenters.js). This is the one
   place to change when the list comes from the Dashboard's /loan-officers
   roster instead: everything else takes the presenter as data
   ({ id, name, title, nmls, phone, email }, see presenterData).
   ========================================================================= */

import { PRESENTERS } from '../content/presenters.js';
import { presenterData } from './slide-prompt.js';

export async function loadPresenterOptions() {
  return Object.values(PRESENTERS).map(presenterData).filter(presenter => presenter.id && presenter.name);
}
