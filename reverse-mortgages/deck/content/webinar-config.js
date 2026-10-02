/* Saved slide edits (Presenter view → Edit slide) are stored by the Dashboard
   API. A deck served from this computer talks to a backend on this computer. */
const LOCAL = ['localhost', '127.0.0.1'].includes(globalThis.location?.hostname);

export const WEBINAR = Object.freeze({
  slug: 'reverse-mortgages',
  storage: 'local',
  slideEditsApi: `${LOCAL ? 'http://localhost:8080' : 'https://api.msfgco.com'}/api/public/webinar-slide-edits`,
});
