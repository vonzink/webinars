/* ============================================================================
   CARD — the one clickable affordance. Every popout in the deck opens from it.

   Variants are presentational only (chip / quote / row); they are the SAME
   component. If a popout seems to need a different card, the popout is wrong.

   Every card carries an aria-label and is keyboard reachable, because a card
   that only works with a mouse is a popout half the audience can't open.
   ========================================================================= */

import { openModal } from './modal.js';

/**
 * @param {object} spec
 *   modal   modal id to open (required)
 *   title   card title
 *   meta    optional one-line "who it's for"
 *   stat    optional figure (percentages only — program rules, not examples)
 *   icon    optional emoji/glyph
 *   variant 'default' | 'chip' | 'quote' | 'row'
 *   index   1-based number, used by the row variant
 */
export function makeCard(spec) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'card';
  if (spec.variant === 'chip')  el.classList.add('card--chip');
  if (spec.variant === 'quote') el.classList.add('card--quote');
  if (spec.variant === 'row')   el.classList.add('card--row');

  el.dataset.modal = spec.modal;

  /* Strip markup for the accessible name. */
  const plain = String(spec.title).replace(/<[^>]+>/g, '');
  el.setAttribute('aria-label', `${plain} — open details`);

  const parts = [];

  if (spec.variant === 'row' && spec.index != null) {
    parts.push(`<span class="card-index" aria-hidden="true">${spec.index}</span>`);
  }
  if (spec.icon && spec.variant !== 'row') {
    parts.push(`<span class="card-icon" aria-hidden="true">${spec.icon}</span>`);
  }

  parts.push(`<span class="card-title">${spec.title}</span>`);
  if (spec.meta) parts.push(`<span class="card-meta">${spec.meta}</span>`);
  if (spec.stat) parts.push(`<span class="card-stat">${spec.stat}</span>`);

  /* The affordance that it opens — a position, not a colour. */
  if (spec.variant !== 'row') {
    parts.push(`<span class="card-open" aria-hidden="true">+</span>`);
  }

  el.innerHTML = parts.join('');
  el.addEventListener('click', () => openModal(spec.modal, el));
  return el;
}

/** Build a grid of cards. */
export function makeCardGrid(cards, { cols = 3, variant = 'default' } = {}) {
  const grid = document.createElement('div');
  grid.className = 'card-grid';
  grid.dataset.cols = String(cols);
  cards.forEach((c, i) => {
    grid.appendChild(makeCard({ ...c, variant, index: i + 1 }));
  });
  return grid;
}

/** Build a row of chips. */
export function makeChipRow(chips) {
  const row = document.createElement('div');
  row.className = 'chip-row';
  chips.forEach(c => row.appendChild(makeCard({ ...c, variant: 'chip' })));
  return row;
}
