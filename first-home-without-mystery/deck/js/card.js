/* ============================================================================
   CARD — the one clickable affordance. No emoji, no icon fonts.
   The "open" cue is a green corner tick.
   ========================================================================= */

import { openModal } from './modal.js';

export function makeCard(spec) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'card';
  if (spec.dense) el.classList.add('card--dense');
  if (spec.variant === 'quote') el.classList.add('card--quote');
  if (spec.variant === 'row') el.classList.add('card--row');
  if (spec.accent === 'sage')  el.classList.add('card--accent-sage');
  if (spec.accent === 'green') el.classList.add('card--accent-green');
  el.dataset.modal = spec.modal;

  const plain = String(spec.title).replace(/<[^>]+>/g, '');
  el.setAttribute('aria-label', `${plain} — open details`);

  const parts = [];
  if (spec.variant === 'row' && spec.index != null)
    parts.push(`<span class="card-index" aria-hidden="true">${spec.index}</span>`);
  parts.push(`<span class="card-title">${spec.title}</span>`);
  if (spec.meta) parts.push(`<span class="card-meta">${spec.meta}</span>`);
  if (spec.stat) parts.push(`<span class="card-stat">${spec.stat}</span>`);
  /* No "+" cue — the whole block is clickable (or drive it from Presenter View). */

  el.innerHTML = parts.join('');
  el.addEventListener('click', () => openModal(spec.modal, el));
  return el;
}

export function makeCardGrid(cards, { cols = 3, variant = 'default', dense = false } = {}) {
  const grid = document.createElement('div');
  grid.className = 'card-grid';
  grid.dataset.cols = String(cols);
  cards.forEach((c, i) => grid.appendChild(makeCard({ ...c, variant, dense, index: i + 1 })));
  return grid;
}
