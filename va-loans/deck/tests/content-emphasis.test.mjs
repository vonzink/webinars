import test from 'node:test';
import assert from 'node:assert/strict';
import { SLIDES } from '../content/slides.js';
import { MODALS } from '../content/modals.js';

const slideBullets = SLIDES.flatMap(slide => [
  ...(slide.points || []),
  ...(slide.left?.items || []),
  ...(slide.right?.items || []),
]);
const modalBullets = Object.values(MODALS)
  .flatMap(modal => (modal.sections || []).flatMap(section => section.items || []));

test('rendered bullet strings contain no strong markup', () => {
  for (const bullet of [...slideBullets, ...modalBullets]) {
    assert.doesNotMatch(bullet, /<\/?strong>/i, bullet);
  }
});

test('every modal referenced by a slide card exists', () => {
  for (const slide of SLIDES) {
    for (const card of slide.cards || []) {
      if (card.modal) assert.ok(MODALS[card.modal], `${slide.id}: missing modal '${card.modal}'`);
    }
  }
});
