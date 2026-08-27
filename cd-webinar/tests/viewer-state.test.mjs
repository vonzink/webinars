import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_STATE, reduceViewerState } from '../js/viewer-state.js';

const pages = new Set(['le-1', 'le-2', 'cd-5']);

test('the default is LE Page 1 with no item selected and Fit zoom', () => {
  assert.deepEqual(DEFAULT_STATE, { pageId: 'le-1', selectedHotspotId: null, zoom: 1 });
});

test('selecting a new page clears the explanation and preserves zoom', () => {
  const state = { pageId: 'le-1', selectedHotspotId: 'le.p1.interest-rate', zoom: 1.5 };
  assert.deepEqual(reduceViewerState(state, { type: 'select-page', pageId: 'cd-5' }, pages),
    { pageId: 'cd-5', selectedHotspotId: null, zoom: 1.5 });
});

test('invalid pages leave state unchanged', () => {
  assert.equal(reduceViewerState(DEFAULT_STATE, { type: 'select-page', pageId: 'missing' }, pages), DEFAULT_STATE);
});

test('zoom actions use the fixed 1, 1.25, 1.5, 2 scale', () => {
  let state = reduceViewerState(DEFAULT_STATE, { type: 'zoom-in' }, pages);
  assert.equal(state.zoom, 1.25);
  state = reduceViewerState(state, { type: 'zoom-in' }, pages);
  state = reduceViewerState(state, { type: 'zoom-in' }, pages);
  state = reduceViewerState(state, { type: 'zoom-in' }, pages);
  assert.equal(state.zoom, 2);
  assert.equal(reduceViewerState(state, { type: 'fit' }, pages).zoom, 1);
});
