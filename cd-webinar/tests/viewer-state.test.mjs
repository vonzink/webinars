import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_STATE, reduceViewerState } from '../js/viewer-state.js';

const pages = new Set(['le-1', 'le-2', 'cd-5']);

test('the default is LE Page 1 with no item selected, Fit zoom, and no magnifier or bubbles', () => {
  assert.deepEqual(DEFAULT_STATE, {
    pageId: 'le-1',
    selectedHotspotId: null,
    zoom: 1,
    magnifier: false,
    openBubbleIds: [],
  });
});

test('selecting a new page closes every bubble and preserves zoom', () => {
  const state = {
    pageId: 'le-1',
    selectedHotspotId: 'le.p1.interest-rate',
    zoom: 1.5,
    magnifier: true,
    openBubbleIds: ['le.p1.loan-amount', 'le.p1.interest-rate'],
  };
  assert.deepEqual(reduceViewerState(state, { type: 'select-page', pageId: 'cd-5' }, pages),
    { pageId: 'cd-5', selectedHotspotId: null, zoom: 1.5, magnifier: true, openBubbleIds: [] });
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

test('selecting hotspots stacks bubbles and re-selecting brings one to the front', () => {
  let state = reduceViewerState(DEFAULT_STATE, { type: 'select-hotspot', hotspotId: 'a' }, pages);
  state = reduceViewerState(state, { type: 'select-hotspot', hotspotId: 'b' }, pages);
  state = reduceViewerState(state, { type: 'select-hotspot', hotspotId: 'c' }, pages);
  assert.deepEqual(state.openBubbleIds, ['a', 'b', 'c']);
  assert.equal(state.selectedHotspotId, 'c');

  state = reduceViewerState(state, { type: 'select-hotspot', hotspotId: 'a' }, pages);
  assert.deepEqual(state.openBubbleIds, ['b', 'c', 'a']);
  assert.equal(state.selectedHotspotId, 'a');
});

test('closing a bubble promotes the next front bubble to the selection', () => {
  let state = reduceViewerState(DEFAULT_STATE, { type: 'select-hotspot', hotspotId: 'a' }, pages);
  state = reduceViewerState(state, { type: 'select-hotspot', hotspotId: 'b' }, pages);

  state = reduceViewerState(state, { type: 'close-bubble', hotspotId: 'b' }, pages);
  assert.deepEqual(state.openBubbleIds, ['a']);
  assert.equal(state.selectedHotspotId, 'a');

  const unchanged = reduceViewerState(state, { type: 'close-bubble', hotspotId: 'missing' }, pages);
  assert.equal(unchanged, state);

  state = reduceViewerState(state, { type: 'close-bubble', hotspotId: 'a' }, pages);
  assert.deepEqual(state.openBubbleIds, []);
  assert.equal(state.selectedHotspotId, null);
});

test('closing a background bubble keeps the front selection', () => {
  let state = reduceViewerState(DEFAULT_STATE, { type: 'select-hotspot', hotspotId: 'a' }, pages);
  state = reduceViewerState(state, { type: 'select-hotspot', hotspotId: 'b' }, pages);
  state = reduceViewerState(state, { type: 'close-bubble', hotspotId: 'a' }, pages);
  assert.deepEqual(state.openBubbleIds, ['b']);
  assert.equal(state.selectedHotspotId, 'b');
});

test('clear-selection pops only the front bubble', () => {
  let state = reduceViewerState(DEFAULT_STATE, { type: 'select-hotspot', hotspotId: 'a' }, pages);
  state = reduceViewerState(state, { type: 'select-hotspot', hotspotId: 'b' }, pages);

  state = reduceViewerState(state, { type: 'clear-selection' }, pages);
  assert.deepEqual(state.openBubbleIds, ['a']);
  assert.equal(state.selectedHotspotId, 'a');

  state = reduceViewerState(state, { type: 'clear-selection' }, pages);
  assert.deepEqual(state.openBubbleIds, []);
  assert.equal(state.selectedHotspotId, null);

  assert.equal(reduceViewerState(state, { type: 'clear-selection' }, pages), state);
});

test('the magnifier toggles on and off without touching the rest of the state', () => {
  const on = reduceViewerState(DEFAULT_STATE, { type: 'toggle-magnifier' }, pages);
  assert.equal(on.magnifier, true);
  assert.equal(on.pageId, DEFAULT_STATE.pageId);
  assert.equal(on.zoom, DEFAULT_STATE.zoom);
  const off = reduceViewerState(on, { type: 'toggle-magnifier' }, pages);
  assert.equal(off.magnifier, false);
});
