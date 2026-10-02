/* Links between the deck's own pages (slides, Presenter View, Slide settings).
   They carry the deck's query: empty for a deck built into the site, and
   "w=<name>" for a webinar made in Webinar Studio, where one set of pages
   serves every webinar. */
import { WEBINAR } from '../content/webinar-config.js';

export function pageUrl(page, query = '', hash = '') {
  const full = [WEBINAR.query, query].filter(Boolean).join('&');
  return `./${page}${full ? `?${full}` : ''}${hash ? `#${hash}` : ''}`;
}
