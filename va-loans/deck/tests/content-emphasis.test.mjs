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

test('requested first-popout and lowest-rate wording is exact', () => {
  const down = MODALS['myth-20-down'];
  const note = down.sections.at(-1).note;
  assert.equal(note, 'Mortgage insurance on a conventional loan is removable.');
  assert.doesNotMatch(note, /phase, not a sentence/i);

  const rate = MODALS['myth-lowest-rate'];
  const reality = rate.sections.find(section => section.head === 'The reality');
  const pros = rate.sections.find(section => section.head === 'Pros of a lower rate');
  assert.ok(reality.items.includes('The lowest rate and the lowest cost are never the same loan'));
  assert.ok(pros.items.includes('The benefit of a lower Rate is lower payment.'));
});

test('Slide 5 keeps the approved comfort-zone content', () => {
  const slide = SLIDES.find(item => item.id === 'budget-comfort');
  assert.ok(slide, 'Slide 5 must exist');
  assert.deepEqual(slide.points, [
    "Don't become house poor — the guidelines ask if you'll repay, not if you'll be okay",
    'Protect quality of life — leave room for disposable income and emergencies',
    'The payment can change after you close',
  ]);
  assert.doesNotMatch(slide.notes, /builder incentives?/i);

  const mistakes = SLIDES.find(item => item.id === 'mistakes-assumptions');
  assert.ok(mistakes.cards.some(card => card.modal === 'assume-builder'));
});

test('Slide 3 uses the approved renting and buying copy', () => {
  const slide = SLIDES.find(item => item.id === 'budget-rent-buy');
  assert.ok(slide, 'Slide 3 must exist');
  assert.ok(slide.left.items.includes('The longer you wait, the more expensive buying becomes.'));
  assert.ok(slide.right.items.includes('You can personalize the home to fit your style and needs.'));
  assert.equal(slide.right.items.length, 4);
});
