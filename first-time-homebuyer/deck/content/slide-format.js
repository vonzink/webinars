/* How this deck's slides are put together, for Slide settings:
   - `logos`: the brand files the Instructions screen links to.
   - `notes(links)`: what the prompt for Claude or ChatGPT says about this deck's
     structure, ready-made classes and footer (the general rules about the
     canvas, CSS and JS are added by js/slide-prompt.js).
   - `interactive`: a selector for built-in parts whose click handlers are lost
     once a slide's HTML is edited: the graphics menu (top right of a slide),
     the calculator icon, and the "Meet the players" diagram, which is loaded
     into its slot after the slide is built. Cards, the compare button, the
     worksheet figure and "open graphic" buttons are NOT in this list: they are
     opened by data-modal / data-media and keep working (see initOpeners in
     js/deck.js). */

import { COMPLIANCE, activePresenter } from './presenters.js';

/* The footer exactly as the deck draws it on a light slide (js/deck.js, furniture). */
export function footerHtml(links) {
  const [line1, line2] = COMPLIANCE.footerLines(activePresenter());
  return [
    '<div class="slide-footer">',
    `  <div class="footer-logo"><img src="${links.logo}" alt="Mountain State Financial Group"></div>`,
    '  <div class="footer-meta">',
    `    <div class="footer-lines"><div>${line1}</div><div>${line2}</div></div>`,
    `    <img class="equal-housing-logo" src="${links.equalHousing}" alt="Equal Housing Lender">`,
    '  </div>',
    '</div>',
  ].join('\n');
}

export const SLIDE_FORMAT = Object.freeze({
  /* The footer every imported slide is given (js/slide-prompt.js, normalizeFooter). */
  footer: Object.freeze({ className: 'slide-footer', html: links => footerHtml(links) }),
  logos: Object.freeze({
    logo: './assets/brand/logo-horizontal.svg',
    logoOnDark: './assets/brand/logo-horizontal-knockout.svg',
    equalHousing: './assets/brand/EQUAL%20HOUSING%20LENDER.png',
  }),
  interactive: '.slide-graphics, .slide-calc, .web-slot',
  notes: links => [
    'THIS DECK\'S LAYOUT',
    '- The slide is a flex column with padding 90px top, 96px left and right, and 150px at the bottom (room for the footer). Body text is Open Sans 30px.',
    '- The slide\'s background comes from the wrapper, which you cannot change: data-bg="white" or "mist" is a light slide (text #404041, headline dark green); data-bg="dark" is dark green with light text. The deck\'s classes restyle themselves for a dark slide.',
    '- Keep this order: header, body, footer. The body grows to fill the space. The footer is pinned to the bottom of the slide, 46px up, whatever comes before it.',
    '',
    'HTML TO FOLLOW',
    '```html',
    '<div class="slide-header">',
    '  <span class="eyebrow">Section label</span>',
    '  <h2 class="headline">Slide title</h2>',
    '  <div class="accent-bar"></div>',
    '  <p class="subhead" style="margin-top:26px">Optional one-sentence lead-in.</p>',
    '</div>',
    '<div class="slide-body" style="justify-content:center">',
    '  <!-- the body of the slide goes here -->',
    '</div>',
    footerHtml(links),
    '```',
    '',
    'THE FOOTER',
    'Every slide with a title ends with the footer exactly as shown above: the MSFG logo, the two company lines, and the Equal Housing Lender logo. Do not restyle it or change its text. There is no page number.',
    `- MSFG logo (light slides): ${links.logo}`,
    `- MSFG logo (dark slides, white version; use it in the footer of a data-bg="dark" slide): ${links.logoOnDark}`,
    `- Equal Housing Lender logo: ${links.equalHousing}`,
    '- Small print: <p class="disclaimer">One line.</p> after the footer. It sits just above the footer line (italic, 21px), so keep the body clear of the bottom 50px when you use it.',
    '',
    'READY-MADE CLASSES (already styled by the deck; use these before writing new CSS)',
    '- eyebrow: small uppercase label above the title. headline: the slide title (Montserrat 800, 72px; add is-long for a title over about 34 characters, 60px). accent-bar: the short green rule under it. subhead: one grey lead-in line.',
    '- slide-body: the body area, a flex column; style="justify-content:center" centers it vertically.',
    '- points: <ul class="points"> of <li> bullets (30px, green dot); <strong> for emphasis.',
    '- marker-list: <ul class="marker-list"> of <li><span class="marker" data-tone="do">+</span><span>Text</span></li> (data-tone="dont" with ✕ for a don\'t). Wrap two lists in <div class="marker-cols"> for two columns.',
    '- two-col: two <div class="col"> side by side, each with <p class="col-head col-head--lock">Heading</p> (or col-head--move) and <ul class="mini-list"> of <li>.',
    '- card-grid with data-cols="2", "3" or "4": a grid of <button type="button" class="card"> holding <span class="card-title">, and optionally <span class="card-meta"> and <span class="card-stat"> (one big figure).',
    '- qa-list: rows of <div class="qa"><div class="qa-num">1</div><div><p class="qa-q">Question</p><p class="qa-a">Answer</p></div></div>.',
    '- callout: a green box for the one line to remember.',
    '- btn btn--primary / btn btn--ghost on-light: link buttons, inside <div class="btn-row">.',
    '',
    'POP-OUTS AND GRAPHICS',
    '- An element with data-modal="<id>" opens that pop-out when clicked, and one with data-media="<id>" opens that graphic. Keep these attributes on existing cards and buttons so they keep working; do not invent new ids.',
  ],
});
