/* Saved slide edits (Presenter View → Edit the slides → Slide settings) are
   stored by the Dashboard API. A deck served from this computer talks to a
   backend on this computer.
   `slug` is the name saved edits are stored under. Presenter notes in this deck
   are kept in the browser under their own `msfg-notes:<slide id>` keys and do
   not use it. */
const LOCAL = ['localhost', '127.0.0.1'].includes(globalThis.location?.hostname);

export const WEBINAR = Object.freeze({
  slug: 'va',
  title: 'Understanding VA Loans',
  slideEditsApi: `${LOCAL ? 'http://localhost:8080' : 'https://api.msfgco.com'}/api/public/webinar-slide-edits`,
  query: '',                 // carried on links between this deck's pages (see js/pages.js)
  studio: '../studio/home.html',   // Webinar Studio's list of every webinar, on the published site
});
