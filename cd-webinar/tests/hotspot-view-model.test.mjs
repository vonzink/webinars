import test from 'node:test';
import assert from 'node:assert/strict';
import { createHotspotViewModel } from '../js/viewer.js';

const hotspot = {
  id: 'le.p1.interest-rate',
  accessibleLabel: 'Interest Rate, 3.875 percent',
  bounds: { x: 0.052, y: 0.257, width: 0.677, height: 0.029 },
};
const explanation = { title: 'Interest Rate', body: 'Body copy.' };

test('hotspot view model keeps geometry and accessible meaning together', () => {
  assert.deepEqual(createHotspotViewModel(hotspot, explanation), {
    id: 'le.p1.interest-rate',
    ariaLabel: 'Interest Rate, 3.875 percent',
    title: 'Interest Rate',
    body: 'Body copy.',
    style: { left: '5.2%', top: '25.7%', width: '67.7%', height: '2.9%' },
  });
});

test('a hotspot without matching content is rejected', () => {
  assert.throws(() => createHotspotViewModel(hotspot, undefined), /missing explanation/i);
});

test('an optional learner question stays in the selected content model', () => {
  assert.deepEqual(createHotspotViewModel(hotspot, {
    ...explanation,
    learnerQuestion: 'What should I compare before locking my rate?',
  }), {
    id: 'le.p1.interest-rate',
    ariaLabel: 'Interest Rate, 3.875 percent',
    title: 'Interest Rate',
    body: 'Body copy.',
    learnerQuestion: 'What should I compare before locking my rate?',
    style: { left: '5.2%', top: '25.7%', width: '67.7%', height: '2.9%' },
  });
});
