/* How this deck's slides are put together, for Slide settings:
   - `logos`: the brand files the Instructions screen links to.
   - `notes(links)`: what the prompt for Claude or ChatGPT says about this deck's
     structure, ready-made classes and footer (the general rules about the
     canvas, CSS and JS are added by js/slide-prompt.js).
   - `interactive`: a selector for built-in parts whose click handlers are lost
     once a slide's HTML is edited. Cards, help buttons, document cards and
     figures are NOT listed: they open by their data-modal / data-media
     attribute and keep working. What is left is the graphics menu and the
     diagram slot, which no slide in this deck uses today. */

import { COMPANY } from './presenters.js';

export function footerHtml(links) {
  return [
    '<div class="slide-footer">',
    `  <div class="footer-logo"><img src="${links.logo}" alt="Mountain State Financial Group"></div>`,
    '  <div class="footer-meta">',
    '    <div class="footer-lines">',
    `      <div>${COMPANY.name} · ${COMPANY.nmls} · ${COMPANY.site}</div>`,
    `      <div>${COMPANY.licenses}</div>`,
    '    </div>',
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
  interactive: '.slide-graphics, .web-slot',
  notes: links => [
    'THIS DECK\'S LAYOUT',
    '- The slide is a flex column with padding 90px top and 96px left and right. The footer is pinned to the bottom of the slide (position: absolute), and the slide keeps 150px clear at the bottom for it. Text is #404041 on light slides and near-white on dark slides (data-bg="dark").',
    '- Keep this order: header, body, footer. The body grows to fill the space between the header and the footer.',
    '',
    'HTML TO FOLLOW',
    '```html',
    '<div class="slide-header">',
    '  <span class="eyebrow">Short label above the title</span>',
    '  <h2 class="headline">Slide title</h2>',
    '  <div class="accent-bar"></div>',
    '  <p class="subhead" style="margin-top:26px">Optional one-line lead-in.</p>',
    '</div>',
    '<div class="slide-body" style="justify-content:center">',
    '  <!-- the body of the slide goes here -->',
    '</div>',
    footerHtml(links),
    '```',
    '',
    'THE FOOTER',
    'Every slide ends with the footer exactly as shown above: the MSFG logo, the two company lines, and the Equal Housing Lender logo. Do not restyle it. On a dark slide use the white logo.',
    `- MSFG logo (light slides): ${links.logo}`,
    `- MSFG logo (dark slides, white version): ${links.logoOnDark}`,
    `- Equal Housing Lender logo: ${links.equalHousing}`,
    '- Small print: if the slide I have open ends with <p class="disclaimer">...</p> after the footer, keep it there (it sits just above the footer). Do not add one to a slide that has none; there is no room reserved for it.',
    '',
    'READY-MADE CLASSES (already styled by the deck; use these before writing new CSS)',
    '- eyebrow: the small all-caps label (23px). headline: the slide title (Montserrat 800, 72px; add is-long for a title over about 34 characters, 60px). accent-bar: the short green rule under it. subhead: a lead-in line (30px).',
    '- slide-body: the body area, a flex column; style="justify-content:center" centers it vertically.',
    '- points: <ul class="points"> with one <li> per bullet (30px, green dots).',
    '- callout: a green bar for one takeaway sentence (32px).',
    '- two-col: two equal columns. Each is <div class="col"> holding <p class="col-head col-head--lock">Heading</p> (or col-head--move) and <ul class="mini-list"> with <li> items.',
    '- card-grid with data-cols="2", "3" or "4": a grid of cards. Each card is <button type="button" class="card"> holding <span class="card-title">, and optionally <span class="card-meta"> and <span class="card-stat">.',
    '- marker-list: <ul class="marker-list">, each <li> holding <span class="marker" data-tone="do">+</span> (or data-tone="dont" with ✕) and a <span> of text.',
    '- qa-list: a column of <div class="qa"> rows, each with <div class="qa-num">1</div> and a <div> holding <p class="qa-q">Question</p> and <p class="qa-a">Answer</p>.',
    '',
    'CLICKABLE PARTS',
    '- An element with data-modal="some-id" opens that pop-out when clicked, and one with data-media="some-id" opens that graphic. If the slide I have open has these attributes, keep them exactly as they are on the same elements. Do not invent new ids.',
  ],
});
