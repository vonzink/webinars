/* ============================================================================
   WEBINAR BACKEND CONFIG — the reusable MSFG webinar/funnel API.
   `slug` namespaces this webinar's presenter notes. `writeKey` is a soft guard
   (it ships in the public bundle by design), not strong auth — rotate anytime.
   ========================================================================= */
export const WEBINAR = Object.freeze({
  apiBase: 'https://api.msfgco.com/webinar',
  slug: 'homebuyers',
  writeKey: 'c6459413de59e5632e040d550c35ff32c437f22efd35f01f',
});
