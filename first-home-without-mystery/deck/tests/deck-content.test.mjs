import test from 'node:test';
import assert from 'node:assert/strict';

import { SLIDES, TARGET_RUNTIME_SECONDS } from '../content/slides.js';
import { MODALS, MODAL_COUNT } from '../content/modals.js';
import { ACTIVE_PRESENTER, PRESENTERS } from '../content/presenters.js';

const expectedIds = [
  'opening',
  'confident-number',
  'three-questions',
  'credit-report',
  'credit-habits',
  'loan-programs',
  'low-down-payment',
  'cash-ingredients',
  'cash-example',
  'costs-vs-prepaids',
  'complete-payment',
  'protect-preapproval',
  'document-story',
  'five-step-plan',
  'wrap',
];

test('the beginner workshop is a 15-slide learning progression', () => {
  assert.equal(SLIDES.length, 15);
  assert.deepEqual(SLIDES.map(slide => slide.id), expectedIds);
  assert.ok(TARGET_RUNTIME_SECONDS >= 25 * 60);
  assert.ok(TARGET_RUNTIME_SECONDS <= 35 * 60);
});

test('the opening and closing resolve the same promise', () => {
  assert.equal(SLIDES[0].headline, 'Your first home, without the mystery.');
  assert.match(SLIDES[1].headline, /confident number/i);
  assert.match(SLIDES.at(-1).headline, /plan is no longer a mystery/i);
});

test('the three-key roadmap anchors credit, loan choice, and cash', () => {
  const roadmap = SLIDES.find(slide => slide.id === 'three-questions');
  assert.equal(roadmap.layout, 'keys');
  assert.deepEqual(
    roadmap.keys.map(key => key.label),
    ['Credit', 'Loan choice', 'Cash to close'],
  );
});

test('loan cards connect to four current program popouts', () => {
  const programs = SLIDES.find(slide => slide.id === 'loan-programs');
  const modalIds = programs.cards.map(card => card.modal);

  assert.deepEqual(modalIds, ['prog-conventional', 'prog-fha', 'prog-va', 'prog-usda']);
  assert.equal(MODAL_COUNT, 4);
  for (const modalId of modalIds) assert.ok(MODALS[modalId], `${modalId} must exist`);
});

test('the worked example opens the cash-to-close calculator', () => {
  const example = SLIDES.find(slide => slide.id === 'cash-example');
  assert.equal(example.layout, 'cashExample');
  assert.equal(example.calc, 'cashToClose');
  assert.equal(example.hasNumbers, true);
});

test('claim-bearing slides retain source blocks in presenter notes', () => {
  const sourced = [
    'credit-report',
    'credit-habits',
    'loan-programs',
    'cash-ingredients',
    'costs-vs-prepaids',
    'complete-payment',
  ];

  for (const id of sourced) {
    const notes = SLIDES.find(slide => slide.id === id)?.notes || '';
    assert.match(notes, /\[Sources\][\s\S]+\[\/Sources\]/, `${id} needs a source block`);
  }
});

test('Seth Angell remains the active presenter', () => {
  assert.equal(ACTIVE_PRESENTER, 'seth');
  assert.equal(PRESENTERS[ACTIVE_PRESENTER].name, 'Seth Angell');
  assert.equal(PRESENTERS[ACTIVE_PRESENTER].nmls, 'NMLS# 912881');
});
