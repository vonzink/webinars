/* Saved slide edits (Presenter view → Slide settings) are stored by the
   Dashboard API. A deck served from this computer talks to a backend on this
   computer. */
const LOCAL = ['localhost', '127.0.0.1'].includes(globalThis.location?.hostname);

export const WEBINAR = Object.freeze({
  slug: 'reverse-mortgages',
  title: 'Reverse Mortgages',
  storage: 'local',
  slideEditsApi: `${LOCAL ? 'http://localhost:8080' : 'https://api.msfgco.com'}/api/public/webinar-slide-edits`,
  query: '',                 // carried on links between this deck's pages (see js/pages.js)
  studio: '../studio/home.html',   // Webinar Studio's list of every webinar, on the published site
});
