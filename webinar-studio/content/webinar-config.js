/* WEBINAR STUDIO — one set of deck pages serves every webinar made in the
   Studio. Which webinar is in the address: index.html?w=<name>. Its slides,
   title and order are stored by the Dashboard API under that name. */
import { RESERVED_SLUGS } from './site-webinars.js';

const LOCAL = ['localhost', '127.0.0.1'].includes(globalThis.location?.hostname);
const requested = new URLSearchParams(globalThis.location?.search || '').get('w') || '';
const usable = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(requested) && requested.length <= 80 && !RESERVED_SLUGS.includes(requested);
const slug = usable ? requested : '';

/* With no webinar named, the deck pages have nothing to show: go to the list. */
if (!slug && globalThis.location && !/\/home\.html$/.test(globalThis.location.pathname)) {
  globalThis.location.replace('./home.html');
}

export const WEBINAR = Object.freeze({
  slug: slug || 'webinar',
  title: 'Webinar',
  created: true,               // made in Webinar Studio: its title comes from the server
  storage: 'local',
  slideEditsApi: `${LOCAL ? 'http://localhost:8080' : 'https://api.msfgco.com'}/api/public/webinar-slide-edits`,
  query: slug ? `w=${slug}` : '',
  studio: './home.html',
});
