import test from 'node:test';
import assert from 'node:assert/strict';
import { createSurfaceController } from '../js/surface-fit.js';

const near = (actual, expected) => {
  assert.ok(Math.abs(actual - expected) <= 0.000001, `${actual} != ${expected}`);
};

const withFakeDom = run => {
  const globals = ['document', 'window', 'ResizeObserver', 'requestAnimationFrame', 'cancelAnimationFrame'];
  const previous = new Map(globals.map(name => [name, {
    present: Object.prototype.hasOwnProperty.call(globalThis, name),
    value: globalThis[name],
  }]));
  const frames = new Map();
  let nextFrame = 1;
  let observer;
  const viewport = { clientWidth: 1000, clientHeight: 800 };
  const shell = { style: {} };
  const surface = { style: {} };

  globalThis.document = { documentElement: { clientWidth: 1000, clientHeight: 800 } };
  globalThis.window = { addEventListener() {}, removeEventListener() {} };
  globalThis.ResizeObserver = class {
    constructor(callback) { this.callback = callback; observer = this; }
    observe() {}
    disconnect() { this.disconnected = true; }
  };
  globalThis.requestAnimationFrame = callback => {
    const id = nextFrame++;
    frames.set(id, callback);
    return id;
  };
  globalThis.cancelAnimationFrame = id => frames.delete(id);

  const environment = {
    viewport,
    shell,
    surface,
    get observer() { return observer; },
    frameCount: () => frames.size,
    runFrames: () => {
      const queued = [...frames.entries()];
      frames.clear();
      for (const [, callback] of queued) callback();
    },
  };

  try {
    return run(environment);
  } finally {
    for (const [name, saved] of previous) {
      if (saved.present) globalThis[name] = saved.value;
      else delete globalThis[name];
    }
  }
};

test('controller applies scaled contained bounds from the shell top left', () => withFakeDom(({ viewport, shell, surface, runFrames }) => {
  viewport.clientWidth = 800;
  viewport.clientHeight = 600;
  const controller = createSurfaceController({
    viewport,
    shell,
    surface,
    getDesignSize: () => ({ width: 1000, height: 500 }),
  });

  for (const name of ['setActive', 'fit', 'reset', 'moveFrom', 'resizeFrom', 'scheduleFit', 'getGeometry', 'destroy']) {
    assert.equal(typeof controller[name], 'function');
  }

  controller.setActive(true);
  runFrames();

  assert.deepEqual(controller.getGeometry(), {
    intrinsicWidth: 1000,
    intrinsicHeight: 500,
    scale: 0.768,
    width: 768,
    height: 384,
    left: 16,
    top: 108,
  });
  assert.equal(shell.style.width, '768px');
  assert.equal(shell.style.height, '384px');
  assert.equal(surface.style.transformOrigin, 'top left');
  assert.equal(surface.style.transform, 'scale(0.768)');
}));

test('controller restores preferred manual scale after a constrained viewport grows', () => withFakeDom(({ viewport, shell, surface, runFrames }) => {
  viewport.clientWidth = 1600;
  viewport.clientHeight = 1000;
  const controller = createSurfaceController({
    viewport,
    shell,
    surface,
    getDesignSize: () => ({ width: 1000, height: 500 }),
  });

  controller.setActive(true);
  runFrames();
  const initial = controller.getGeometry();
  controller.resizeFrom(initial, -400, -200);
  near(controller.getGeometry().scale, 0.6);

  viewport.clientWidth = 500;
  viewport.clientHeight = 500;
  controller.fit();
  near(controller.getGeometry().scale, 0.468);

  viewport.clientWidth = 1600;
  viewport.clientHeight = 1000;
  controller.fit();
  near(controller.getGeometry().scale, 0.6);
}));

test('controller move and resize remain contained in a tiny viewport', () => withFakeDom(({ viewport, shell, surface, runFrames }) => {
  viewport.clientWidth = 20;
  viewport.clientHeight = 12;
  const controller = createSurfaceController({
    viewport,
    shell,
    surface,
    getDesignSize: () => ({ width: 1000, height: 500 }),
  });

  controller.setActive(true);
  runFrames();
  const start = controller.getGeometry();
  controller.moveFrom(start, 100000, 100000);
  controller.resizeFrom(controller.getGeometry(), 100000, 100000);
  const geometry = controller.getGeometry();

  assert.ok(Object.values(geometry).every(Number.isFinite));
  assert.ok(geometry.scale > 0 && geometry.scale <= 1);
  assert.ok(geometry.left >= -0.000001);
  assert.ok(geometry.top >= -0.000001);
  assert.ok(geometry.left + geometry.width <= 20.000001);
  assert.ok(geometry.top + geometry.height <= 12.000001);
}));

test('inactive, reset, and destroyed controllers ignore stale fit callbacks', () => withFakeDom(environment => {
  const { viewport, shell, surface, frameCount, runFrames } = environment;
  const controller = createSurfaceController({
    viewport,
    shell,
    surface,
    getDesignSize: () => ({ width: 400, height: 200 }),
  });

  controller.setActive(true);
  controller.setActive(false);
  environment.observer.callback();
  assert.equal(frameCount(), 0);

  controller.setActive(true);
  controller.reset();
  runFrames();
  assert.equal(controller.getGeometry(), null);
  assert.deepEqual(shell.style, {});
  assert.deepEqual(surface.style, {});

  controller.setActive(true);
  controller.destroy();
  environment.observer.callback();
  controller.setActive(true);
  assert.equal(frameCount(), 0);
  runFrames();
  assert.equal(controller.getGeometry(), null);
  assert.deepEqual(shell.style, {});
  assert.deepEqual(surface.style, {});
}));
