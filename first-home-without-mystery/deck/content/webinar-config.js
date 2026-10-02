/* ============================================================================
   WEBINAR BACKEND CONFIG — the reusable MSFG webinar/funnel API.
   `slug` namespaces this webinar's presenter notes, and is the name its saved
   slide edits are stored under. `writeKey` is a soft guard (it ships in the
   public bundle by design), not strong auth — rotate anytime.
   Saved slide edits (Presenter View → Settings → Slide settings) are stored by
   the Dashboard API. A deck served from this computer talks to a backend on
   this computer.
   ========================================================================= */
const LOCAL = ['localhost', '127.0.0.1'].includes(globalThis.location?.hostname);

export const WEBINAR = Object.freeze({
  apiBase: 'https://api.msfgco.com/webinar',
  slug: 'first-home-without-mystery',
  title: 'Your first home, without the mystery.',
  writeKey: 'c6459413de59e5632e040d550c35ff32c437f22efd35f01f',
  slideEditsApi: `${LOCAL ? 'http://localhost:8080' : 'https://api.msfgco.com'}/api/public/webinar-slide-edits`,
  query: '',                 // carried on links between this deck's pages (see js/pages.js)
  studio: '../studio/home.html',   // Webinar Studio's list of every webinar, on the published site
});
