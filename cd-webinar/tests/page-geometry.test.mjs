import test from 'node:test';
import assert from 'node:assert/strict';
import { fitPage, hotspotPercentStyle } from '../js/page-geometry.js';

test('Fit contains a letter page inside the available stage', () => {
  assert.deepEqual(fitPage({ intrinsicWidth: 1530, intrinsicHeight: 1980, availableWidth: 900, availableHeight: 900, zoom: 1 }),
    { width: 695.4545454545455, height: 900, scale: 0.45454545454545453 });
});

test('zoom multiplies the common image and hotspot canvas', () => {
  const fit = fitPage({ intrinsicWidth: 1530, intrinsicHeight: 1980, availableWidth: 900, availableHeight: 900, zoom: 2 });
  assert.equal(fit.height, 1800);
  assert.equal(fit.width, 1390.909090909091);
});

test('normalized hotspot bounds become percentage styles', () => {
  assert.deepEqual(hotspotPercentStyle({ x: 0.1, y: 0.2, width: 0.3, height: 0.04 }),
    { left: '10%', top: '20%', width: '30%', height: '4%' });
});

test('invalid dimensions and bounds throw', () => {
  assert.throws(() => fitPage({ intrinsicWidth: 0, intrinsicHeight: 1980, availableWidth: 900, availableHeight: 900, zoom: 1 }), RangeError);
  assert.throws(() => hotspotPercentStyle({ x: 0.9, y: 0, width: 0.2, height: 0.1 }), RangeError);
});
