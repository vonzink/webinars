/* How this deck's slides are put together, for Slide settings:
   - `logos`: the brand files the Instructions screen links to.
   - `notes(links)`: what the prompt for Claude or ChatGPT says about this deck's
     structure, ready-made classes and footer (the general rules about the
     canvas, CSS and JS are added by js/slide-prompt.js).
   - `interactive`: a selector for built-in parts whose click handlers are lost
     once a slide's HTML is edited. This deck has none: cards and the compare
     button open their pop-outs through `data-modal`, which one listener on the
     slides container handles, so they keep working in edited HTML. */

import { activePresenter, COMPLIANCE } from './presenters.js';

/* The footer as the deck writes it into a slide's HTML. */
export function footerHtml(links, { dark = false } = {}) {
  const [line1, line2] = COMPLIANCE.footerLines(activePresenter());
  return [
    '<div class="slide-footer">',
    `  <div class="footer-logo"><img src="${dark ? links.logoOnDark : links.logo}" alt="Mountain State Financial Group"></div>`,
    '  <div class="footer-meta">',
    `    <div class="footer-lines"><div>${line1}</div><div>${line2}</div></div>`,
    `    <img class="equal-housing-logo" src="${links.equalHousing}" alt="Equal Housing Lender">`,
    '  </div>',
    '</div>',
  ].join('\n');
}

export const SLIDE_FORMAT = Object.freeze({
  logos: Object.freeze({
    logo: './assets/brand/logo-horizontal.svg',
    logoOnDark: './assets/brand/logo-horizontal-knockout.svg',
    equalHousing: './assets/brand/EQUAL%20HOUSING%20LENDER.png',
  }),
  interactive: '',
  notes: links => [
    'THIS DECK\'S LAYOUT',
    '- The slide is a flex column with 90px padding top and bottom and 96px left and right. Body text is 30px Open Sans. A light slide (data-bg="white" or "mist") has charcoal text; a dark slide (data-bg="dark") is dark green with light text, and the deck\'s classes switch color by themselves.',
    '- Order: the header block, then one slide-body block that fills the remaining height, then the footer. The footer is pinned to the bottom of the slide and the deck keeps 150px clear for it, so never put content behind it.',
    '',
    'HTML TO FOLLOW',
    '```html',
    '<div class="slide-header">',
    '  <span class="eyebrow">SHORT LABEL</span>',
    '  <h2 class="headline">Slide headline</h2>',
    '  <div class="accent-bar"></div>',
    '  <p class="subhead" style="margin-top:26px">Optional one-line lead-in.</p>',
    '</div>',
    '<div class="slide-body" style="justify-content:center">',
    '  <!-- the body of the slide goes here -->',
    '</div>',
    footerHtml(links),
    '```',
    '- The eyebrow and the subhead are optional. For a headline longer than about 34 characters use class="headline is-long" (60px instead of 72px).',
    '',
    'THE FOOTER',
    'A slide that has the footer ends with it exactly as shown above: the MSFG logo, the two company lines, and the Equal Housing Lender logo. Do not restyle it. If the slide I have open has no footer, do not add one.',
    `- MSFG logo (light slides): ${links.logo}`,
    `- MSFG logo (dark slides, white version): ${links.logoOnDark}`,
    `- Equal Housing Lender logo: ${links.equalHousing}`,
    '- Small print, when a slide needs it, is one <p class="disclaimer">…</p> placed just before the footer (italic, 21px, pinned above the footer). Keep one that is already there; do not add a new one, because the deck only leaves room for it on slides that already have it.',
    '',
    'READY-MADE CLASSES (already styled by the deck; use these before writing new CSS)',
    '- eyebrow: the small ALL-CAPS label. headline: the slide title (Montserrat 800, 72px). accent-bar: the short green rule under it. subhead: the lead-in sentence.',
    '- points: <ul class="points"> with one <li> per talking point (green square bullets).',
    '- callout: <div class="callout">One sentence that matters.</div>, a boxed takeaway under the points.',
    '- card-grid: <div class="card-grid" data-cols="3"> (2, 3 or 4) holding cards. A card is <button type="button" class="card"> with <span class="card-title">, and optionally <span class="card-meta"> and <span class="card-stat">. Add data-modal="pop-out-id" only to open one of the deck\'s existing pop-outs; keep the data-modal values already in the slide.',
    '- two-col: two columns, each <div class="col"> with <p class="col-head col-head--lock"> (or col-head--move) and <ul class="mini-list">.',
    '- marker-list: <ul class="marker-list"> of <li><span class="marker" data-tone="do">+</span><span>Text</span></li>; data-tone="dont" with ✕ for things to avoid. Wrap two lists in <div class="marker-cols"> for two columns.',
    '- qa-list: <div class="qa"> rows, each with <div class="qa-num">1</div> and a <div> holding <p class="qa-q">Question</p> and <p class="qa-a">Answer</p>.',
  ],
});
