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
  'loan-programs',
  'cash-ingredients',
  'costs-vs-prepaids',
  'cash-example',
  'protect-preapproval',
  'document-story',
  'five-step-plan',
  'wrap',
];

test('the beginner workshop is a 12-slide learning progression', () => {
  assert.equal(SLIDES.length, 12);
  assert.deepEqual(SLIDES.map(slide => slide.id), expectedIds);
  assert.ok(TARGET_RUNTIME_SECONDS >= 25 * 60);
  assert.ok(TARGET_RUNTIME_SECONDS <= 35 * 60);
});

test('the opening and closing resolve the same promise', () => {
  assert.equal(SLIDES[0].headline, 'Your first home, without the mystery.');
  assert.equal(
    SLIDES[1].headline,
    'Your first step is not finding a house. It is finding a monthly payment that keeps you comfortable.',
  );
  assert.equal(
    SLIDES[1].budgetUrl,
    'https://files.consumerfinance.gov/f/documents/cfpb_well-being_monthly-budget.pdf',
  );
  assert.match(SLIDES.at(-1).headline, /plan is no longer a mystery/i);
});

test('the requested redundant slides are removed and costs precede the worked example', () => {
  for (const id of ['credit-habits', 'low-down-payment', 'complete-payment']) {
    assert.equal(SLIDES.some(slide => slide.id === id), false, `${id} should be removed`);
  }
  assert.ok(expectedIds.indexOf('costs-vs-prepaids') < expectedIds.indexOf('cash-example'));
});

test('credit layers reveal history, balances, and activity with habits moved to notes', () => {
  const credit = SLIDES.find(slide => slide.id === 'credit-report');
  assert.equal(credit.manualBuild, true);
  assert.deepEqual(credit.layers.map(layer => layer.label), ['History', 'Balances', 'Activity']);
  assert.match(credit.notes, /pay every bill on time/i);
  assert.match(credit.notes, /wrap into a score/i);
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

  assert.equal(programs.manualBuild, true);
  assert.deepEqual(modalIds, ['prog-conventional', 'prog-fha', 'prog-va', 'prog-usda']);
  assert.deepEqual(programs.marketStats, [
    { label: 'Conventional', value: '74%' },
    { label: 'FHA', value: '19%' },
    { label: 'VA', value: '8%' },
    { label: 'USDA', value: 'Less than 1%' },
  ]);
  assert.equal(MODAL_COUNT, 4);
  for (const modalId of modalIds) assert.ok(MODALS[modalId], `${modalId} must exist`);
});

test('cash ingredients build to the formula and move earnest-money guidance to notes', () => {
  const ingredients = SLIDES.find(slide => slide.id === 'cash-ingredients');
  assert.equal(ingredients.manualBuild, true);
  assert.equal(ingredients.formula, '1 + 2 + 3 − 4 = Cash to close');
  assert.equal(ingredients.callout, undefined);
  assert.match(ingredients.notes, /earnest money is not an extra charge/i);
});

test('the worked example opens the cash-to-close calculator', () => {
  const example = SLIDES.find(slide => slide.id === 'cash-example');
  assert.equal(example.layout, 'cashExample');
  assert.equal(example.calc, 'cashToClose');
  assert.equal(example.hasNumbers, true);
  assert.equal(example.manualBuild, true);
  assert.match(example.teaser, /covered by someone else/i);
  assert.match(example.notes, /seller concessions/i);
});

test('document requirements and final plan reveal sequentially', () => {
  const documents = SLIDES.find(slide => slide.id === 'document-story');
  assert.equal(documents.headline, 'What information do I need to provide?');
  assert.equal(documents.manualBuild, true);
  assert.deepEqual(documents.groups.map(group => group.items), [
    ['Paystubs', 'W-2s or tax returns'],
    ['Bank statements', 'Investment or retirement funds'],
    ['Photo identification', 'Purchase contract when available'],
  ]);
  assert.equal(SLIDES.find(slide => slide.id === 'five-step-plan').manualBuild, true);
});

test('claim-bearing slides retain source blocks in presenter notes', () => {
  const sourced = [
    'credit-report',
    'loan-programs',
    'cash-ingredients',
    'costs-vs-prepaids',
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
