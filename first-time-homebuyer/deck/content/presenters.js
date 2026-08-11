/* ============================================================================
   PRESENTER + COMPLIANCE + PLACEHOLDERS  (Ridgeline)
   ========================================================================= */

export const COMPANY = {
  name: 'Mountain State Financial Group, LLC',
  nmls: 'NMLS# 1314257',
  site: 'msfg.us',
  licenses: 'Licensed in CO, ND, SD, MN, MI, IL, TX · Equal Housing Lender',
};

export const PRESENTERS = {
  seth: {
    key: 'seth', name: 'Seth Angell', title: 'Executive VP', nmls: 'NMLS# 912881',
    portrait: './assets/portraits/seth-angell.png',
    phone: '303-883-8519',
    email: 'Seth.angell@msfg.us',
    email2: 'info@msfgmortgage.com',
  },
  robert: {
    key: 'robert', name: 'Robert Hoff', title: 'President', nmls: 'NMLS# 608235',
    portrait: './assets/portraits/robert-hoff.jpg',
    phone: null, email: 'info@msfgmortgage.com', email2: null,
  },
  zachary: {
    key: 'zachary', name: 'Zachary Zink', title: 'Mortgage Broker', nmls: 'NMLS# 451924',
    portrait: null, phone: null, email: 'info@msfgmortgage.com', email2: null,
  },
};

export const ACTIVE_PRESENTER = 'seth';
export function activePresenter() { return PRESENTERS[ACTIVE_PRESENTER]; }

/* Links / assets — fill before delivery. null renders a visible placeholder. */
export const LINKS = {
  applyUrl: 'https://www.blink.mortgage/app/signup/p/mountainstatefinancialgroupllc/sethangell',
  bookingUrl: null,    // Schedule a consultation — pending from client
  website: 'msfg.us',
  qrAsset: './assets/brand/qr-seth.png',
  qrTargetUrl: null,
};

/* Compliance strings — rendered from data so no slide can omit them. */
export const COMPLIANCE = {
  footerLines(p) {
    return [
      `${COMPANY.name} · ${COMPANY.nmls} · ${COMPANY.site}`,
      COMPANY.licenses,
    ];
  },
  presenterLine(p) { return `${p.name} · ${p.title} · ${p.nmls}`; },
  hypothetical: 'Hypothetical illustration for education only. Not a quote, offer, or commitment to lend.',
  generalGuidelines: 'General guidelines only. Actual eligibility depends on full underwriting, credit, property, and lender overlays.',
  notAForecast: 'General long-term patterns, not a forecast or guarantee. Individual results vary by market and time period.',
};

/* Logo — vector, transparent, no plate. Knockout (light) on dark backgrounds,
   full-colour on light. */
export const LOGO = {
  onDark:  './assets/brand/logo-horizontal-knockout.svg',
  onLight: './assets/brand/logo-horizontal.svg',
};
