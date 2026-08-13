import test from 'node:test';
import assert from 'node:assert/strict';
import {
  OVERLAY_MARGIN,
  OVERLAY_MIN_SCALE,
  fitOverlay,
  resizeOverlay,
  clampOverlay,
} from '../js/overlay-geometry.js';

const near = (actual, expected) => {
  assert.ok(Math.abs(actual - expected) <= 0.000001, `${actual} != ${expected}`);
};

test('constants are fixed', () => {
  assert.equal(OVERLAY_MARGIN, 16);
  assert.equal(OVERLAY_MIN_SCALE, 0.35);
});

test('1200 by 900 fits inside 1280 by 720', () => {
  const geometry = fitOverlay({
    intrinsicWidth: 1200,
    intrinsicHeight: 900,
    viewportWidth: 1280,
    viewportHeight: 720,
  });
  near(geometry.scale, 688 / 900);
  near(geometry.height, 688);
  near(geometry.left, (1280 - geometry.width) / 2);
  near(geometry.top, 16);
});

test('initial fit does not upscale', () => {
  assert.deepEqual(
    fitOverlay({ intrinsicWidth: 560, intrinsicHeight: 700, viewportWidth: 1920, viewportHeight: 1080 }),
    { intrinsicWidth: 560, intrinsicHeight: 700, scale: 1, width: 560, height: 700, left: 680, top: 190 },
  );
});

test('invalid intrinsic size uses explicit fallback', () => {
  const geometry = fitOverlay({
    intrinsicWidth: Number.NaN,
    intrinsicHeight: -1,
    fallbackWidth: 560,
    fallbackHeight: 700,
    viewportWidth: 1920,
    viewportHeight: 1080,
  });
  assert.equal(geometry.intrinsicWidth, 560);
  assert.equal(geometry.intrinsicHeight, 700);
  assert.ok(Object.values(geometry).every(Number.isFinite));
});

test('invalid intrinsic size without an authored fallback is rejected', () => {
  assert.throws(
    () => fitOverlay({ intrinsicWidth: Number.NaN, intrinsicHeight: 0, viewportWidth: 1920, viewportHeight: 1080 }),
    RangeError,
  );
});

test('tiny viewport overrides nominal minimum for full visibility', () => {
  const geometry = fitOverlay({ intrinsicWidth: 560, intrinsicHeight: 700, viewportWidth: 200, viewportHeight: 160 });
  near(geometry.scale, 128 / 700);
  assert.ok(geometry.scale < 0.35);
  near(geometry.top, 16);
});

test('resize projects both pointer deltas onto one scale', () => {
  const geometry = resizeOverlay({
    intrinsicWidth: 1000,
    intrinsicHeight: 500,
    startScale: 0.5,
    deltaX: 100,
    deltaY: 50,
    left: 16,
    top: 16,
    viewportWidth: 1600,
    viewportHeight: 1000,
  });
  near(geometry.scale, 0.6);
  near(geometry.width / geometry.height, 2);
});

test('manual shrink stops at nominal minimum when it fits', () => {
  const geometry = resizeOverlay({
    intrinsicWidth: 1000,
    intrinsicHeight: 500,
    startScale: 0.5,
    deltaX: -1000,
    deltaY: -1000,
    left: 16,
    top: 16,
    viewportWidth: 1600,
    viewportHeight: 1000,
  });
  assert.equal(geometry.scale, 0.35);
});

test('clamp shrinks and repositions after viewport loss', () => {
  const geometry = clampOverlay({
    intrinsicWidth: 1000,
    intrinsicHeight: 800,
    scale: 1,
    left: 50,
    top: 50,
    viewportWidth: 600,
    viewportHeight: 500,
  });
  near(geometry.scale, 568 / 1000);
  near(geometry.left, 16);
  near(geometry.top, 500 - 16 - geometry.height);
  assert.ok(geometry.left + geometry.width <= 584.000001);
  assert.ok(geometry.top + geometry.height <= 484.000001);
});
