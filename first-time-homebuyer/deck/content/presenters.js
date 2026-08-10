/* ============================================================================
   PRESENTER COMPONENT + PLACEHOLDER REGISTER

   Swap the presenter by changing ACTIVE_PRESENTER below. Exactly three things
   change: the footer line, Slide 1, and the final slide. Nothing re-lays-out.
   Text and one image, nothing more.
   ========================================================================= */

/* The company line NEVER changes. */
export const COMPANY = {
  name: 'Mountain State Financial Group LLC',
  nmls: '#1314257',
};

export const PRESENTERS = {
  seth: {
    key: 'seth',
    name: 'Seth Angell',
    title: 'Executive VP',
    nmls: '#912881',
    portrait: './assets/portraits/seth-angell.png',
    email: 'info@msfgmortgage.com',
  },
  robert: {
    key: 'robert',
    name: 'Robert Hoff',
    title: 'President',
    nmls: '#608235',
    portrait: './assets/portraits/robert-hoff.jpg',
    email: 'info@msfgmortgage.com',
  },
  zachary: {
    key: 'zachary',
    name: 'Zachary Zink',
    title: 'Mortgage Broker',
    nmls: '#451924',
    /* PLACEHOLDER 8 — no portrait supplied for Zachary. Renders as a visible
       placeholder block rather than a broken image. */
    portrait: null,
    email: 'info@msfgmortgage.com',
  },
};

/* Ship it set to Seth Angell. */
export const ACTIVE_PRESENTER = 'seth';

/* ---------------------------------------------------------------------------
   PLACEHOLDER REGISTER — all 10 rows from HANDOFF-v6 PART 2.

   Every one of these renders as a VISIBLE placeholder chip. An empty field
   that looks intentional is how a deck ships with a blank on it.

   To fill one in: replace `null` with the real value. The placeholder chip
   disappears automatically and the real value renders in its place.
   ------------------------------------------------------------------------ */
export const PLACEHOLDERS = {
  /* 1 */ phone:          { value: null, label: 'PHONE',                 owner: 'MSFG' },
  /* 2 */ secondaryEmail: { value: null, label: 'SECONDARY EMAIL',       owner: 'MSFG' },
  /* 3 */ website:        { value: null, label: 'WEBSITE URL',           owner: 'MSFG' },
  /* 4 */ applyUrl:       { value: null, label: 'APPLY NOW LINK',        owner: 'MSFG' },
  /* 5 */ bookingUrl:     { value: null, label: 'BOOKING LINK',          owner: 'MSFG' },
  /* 6 */ qrTargetUrl:    { value: null, label: 'QR TARGET URL',         owner: 'MSFG' },
  /* 7 */ socials:        { value: null, label: 'SOCIAL HANDLES',        owner: 'MSFG',
                            note: 'Omit cleanly if none.' },
  /* 8 */ portraits:      { value: 'partial', label: 'PRESENTER PORTRAITS ×3', owner: 'MSFG',
                            note: 'Seth + Robert supplied. Zachary missing.' },
  /* 9 */ processScreenshot: { value: null, label: 'MSFG LOAN-PROCESS SCREENSHOT', owner: 'MSFG',
                            note: 'Process Slide 2 — match step naming EXACTLY.' },
  /* 10 */ brandFonts:    { value: 'Inter', label: 'BRAND FONT FAMILIES', owner: 'MSFG',
                            note: 'Inter until MSFG supplies the brand family.' },
};

/* QR code asset. Points to the apply or booking URL — see placeholder 6.
   Deep Teal on white, never lime: QR scanners need contrast. */
export const QR_ASSET = './assets/brand/qr-seth.png';

/* ---------------------------------------------------------------------------
   COMPLIANCE STRINGS — legal requirements, not design elements.
   These may not be removed or shrunk. They are injected by js/deck.js so no
   slide author can forget one.
   ------------------------------------------------------------------------ */
export const COMPLIANCE = {
  /* Footer, every slide except the emotional beats. */
  footer(presenter) {
    return `${presenter.name} · NMLS ${presenter.nmls} · ${COMPANY.name} · NMLS ${COMPANY.nmls}`;
  },
  equalHousing: '🏠 Equal Housing Lender',

  /* Any slide or popout containing a rate, payment, or cost. 16pt. */
  hypothetical:
    'Hypothetical illustration for education only. Not a quote, offer, or commitment to lend.',

  /* Every loan program popout. */
  generalGuidelines:
    'General guidelines only. Actual eligibility depends on full underwriting, credit, property, and lender overlays.',

  /* Budget Slide 1 — long-term patterns, not a forecast. */
  notAForecast:
    'General long-term patterns, not a forecast or guarantee. Individual results vary by market, property, and time period.',
};

export function activePresenter() {
  return PRESENTERS[ACTIVE_PRESENTER];
}
