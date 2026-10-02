/* How this deck's slides are put together, for Slide settings:
   - `logos`: the brand files the Instructions screen links to.
   - `notes(links)`: what the prompt for Claude or ChatGPT says about this deck's
     structure, ready-made classes and footer (the general rules about the
     canvas, CSS and JS are added by js/slide-prompt.js).
   - `interactive`: a selector for built-in parts whose click handlers are lost
     once a slide's HTML is edited. This deck has none.
   - `footer`: the footer every imported slide is given (js/slide-prompt.js,
     normalizeFooter). Webinar Suite uses this format too, with the presenter
     chosen for each new presentation. */

import { COMPANY } from './presenters.js';

/* This deck's own footer line, as it has always read. */
const FOOTER_TEXT = 'Mountain State Financial Group, LLC • NMLS #1314257  |  Seth Angell • NMLS #912881  |  (303) 883-8519  |  <a href="https://www.msfg.us/" target="_blank" rel="noopener noreferrer">www.msfg.us</a>';

const escapeHtml = value => String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const nmls = value => String(value || '').replace(/^NMLS#\s*/i, 'NMLS #');
const phone = value => {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length === 10 ? `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}` : String(value || '').trim();
};

/* The footer line for a presenter ({ name, nmls, phone }, from presenters.js
   or, later, the roster). Without one, the deck's own line. */
export function footerText(presenter) {
  if (!presenter) return FOOTER_TEXT;
  const site = String(COMPANY.site || '').replace(/^https?:\/\//, '');
  return [
    `${escapeHtml(COMPANY.name)} • ${escapeHtml(nmls(COMPANY.nmls))}`,
    presenter.name ? `${escapeHtml(presenter.name)}${presenter.nmls ? ` • ${escapeHtml(nmls(presenter.nmls))}` : ''}` : '',
    escapeHtml(phone(presenter.phone)),
    site ? `<a href="https://${escapeHtml(site)}/" target="_blank" rel="noopener noreferrer">${escapeHtml(site)}</a>` : '',
  ].filter(Boolean).join('  |  ');
}

export function footerHtml(links, presenter) {
  return [
    '<footer class="source-footer">',
    `  <img src="${links.logo}" alt="Mountain State Financial Group">`,
    `  <p class="source-footer-copy">${footerText(presenter)}</p>`,
    '  <span class="source-page">1</span>',
    `  <img class="source-housing" src="${links.equalHousing}" alt="Equal Housing Lender">`,
    '</footer>',
  ].join('\n');
}

export const SLIDE_FORMAT = Object.freeze({
  logos: Object.freeze({
    logo: './assets/brand/logo-horizontal.svg',
    logoOnDark: './assets/brand/logo-horizontal-knockout.svg',
    equalHousing: './assets/brand/EQUAL%20HOUSING%20LENDER.png',
  }),
  interactive: '',
  footer: Object.freeze({ className: 'source-footer', html: (links, presenter) => footerHtml(links, presenter) }),
  notes: (links, presenter) => [
    'THIS DECK\'S LAYOUT',
    '- The slide is a flex column with padding 58px top, 86px left and right, 24px bottom, and a 20px gap. Unless told otherwise, text is #404041 on a white background.',
    '- Keep this order: header, content, optional disclaimer, footer. The content block grows to fill the space, which keeps the footer at the bottom.',
    '',
    'HTML TO FOLLOW',
    '```html',
    '<header class="source-header">',
    '  <h2 class="source-title">Slide title</h2>',
    '  <div class="accent-bar"></div>',
    '</header>',
    '<div class="source-content">',
    '  <!-- the body of the slide goes here -->',
    '</div>',
    '<p class="source-disclaimer">Optional small-print line.</p>',
    footerHtml(links, presenter),
    '```',
    '',
    'THE FOOTER',
    'Every slide ends with the footer exactly as shown above: the MSFG logo, the company line, the page number, and the Equal Housing Lender logo. Do not restyle it. The page number is filled in automatically, so leave the 1.',
    `- MSFG logo (light slides): ${links.logo}`,
    `- MSFG logo (dark slides, white version): ${links.logoOnDark}`,
    `- Equal Housing Lender logo: ${links.equalHousing}`,
    '',
    'READY-MADE CLASSES (already styled by the deck; use these before writing new CSS)',
    '- source-title: the slide title (Montserrat 800, 56px, dark green). accent-bar: the short green rule under it.',
    '- source-content: the body area; a flex column, vertically centered, 26px gap.',
    '- source-lead: one or more intro paragraphs (29px).',
    '- source-bullets: a paragraph of bullets, one per line, each line starting with "• " (30px). Line breaks inside it are kept.',
    '- source-groups with style="--source-cols:3": a row of equal cards. Each card is <article class="source-group"> holding <h3 class="source-label">Label</h3> and <p class="source-copy">Text</p>.',
    '- source-callouts: a row of <aside class="source-callout"> boxes, each with an <h3> and a <p>.',
    '- source-after: closing paragraphs under the cards (29px).',
    '- source-stat: a dark green box for one big number; put source-label and source-copy inside it.',
    '- source-disclaimer: small print above the footer (19px).',
  ],
});
