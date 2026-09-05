import test from 'node:test';
import assert from 'node:assert/strict';

import { localBuildAction } from '../js/build-navigation.js';

test('forward reveals each manual build before advancing the slide', () => {
  assert.deepEqual(localBuildAction({ direction: 1, manual: true, revealed: 0, total: 3 }), {
    type: 'build', count: 1,
  });
  assert.deepEqual(localBuildAction({ direction: 1, manual: true, revealed: 2, total: 3 }), {
    type: 'build', count: 3,
  });
  assert.deepEqual(localBuildAction({ direction: 1, manual: true, revealed: 3, total: 3 }), {
    type: 'slide', delta: 1,
  });
});

test('backward hides manual builds before returning to the prior slide', () => {
  assert.deepEqual(localBuildAction({ direction: -1, manual: true, revealed: 3, total: 3 }), {
    type: 'build', count: 2,
  });
  assert.deepEqual(localBuildAction({ direction: -1, manual: true, revealed: 1, total: 3 }), {
    type: 'build', count: 0,
  });
  assert.deepEqual(localBuildAction({ direction: -1, manual: true, revealed: 0, total: 3 }), {
    type: 'slide', delta: -1,
  });
});

test('ordinary slides and empty build lists retain direct slide navigation', () => {
  assert.deepEqual(localBuildAction({ direction: 1, manual: false, revealed: 0, total: 4 }), {
    type: 'slide', delta: 1,
  });
  assert.deepEqual(localBuildAction({ direction: -1, manual: true, revealed: 0, total: 0 }), {
    type: 'slide', delta: -1,
  });
});
