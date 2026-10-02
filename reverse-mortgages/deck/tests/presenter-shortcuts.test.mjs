import assert from 'node:assert/strict';
import test from 'node:test';

let shortcuts = {};
try {
  shortcuts = await import('../js/presenter-shortcuts.js');
} catch {
  // RED phase: the implementation does not exist yet.
}

const defaults = {
  previousSlide: ['ArrowLeft'],
  nextSlide: ['ArrowRight', 'Space'],
  previousAnimation: ['KeyJ'],
  toggleAnimationPlayback: ['KeyK'],
  nextAnimation: ['KeyL'],
  toggleDrawing: ['KeyD'],
  toggleFullscreen: ['KeyF'],
};

test('missing presenter settings resolve to the complete default shortcut profile', () => {
  assert.equal(typeof shortcuts.resolveShortcuts, 'function');
  assert.deepEqual(shortcuts.resolveShortcuts(null), defaults);
});

test('a valid saved profile replaces defaults without sharing mutable arrays', () => {
  const saved = {
    previousSlide: ['KeyA'],
    nextSlide: ['KeyX'],
    previousAnimation: ['KeyQ'],
    toggleAnimationPlayback: ['KeyW'],
    nextAnimation: ['KeyE'],
    toggleDrawing: ['KeyG'],
    toggleFullscreen: ['KeyH'],
  };
  const resolved = shortcuts.resolveShortcuts(saved);
  assert.deepEqual(resolved, saved);
  resolved.nextSlide.push('KeyZ');
  assert.deepEqual(saved.nextSlide, ['KeyX']);
});

test('duplicate assignments are rejected across presenter actions', () => {
  const invalid = structuredClone(defaults);
  invalid.toggleDrawing = ['ArrowLeft'];
  assert.deepEqual(shortcuts.validateShortcuts(invalid), {
    ok: false,
    error: 'ArrowLeft is already assigned to Previous slide.',
  });
});

test('browser-reserved and incomplete key presses cannot become shortcuts', () => {
  assert.deepEqual(shortcuts.validateDescriptor('Escape'), {
    ok: false,
    error: 'Escape is reserved for closing settings.',
  });
  assert.deepEqual(shortcuts.validateDescriptor('Meta+KeyR'), {
    ok: false,
    error: 'That shortcut is reserved by the browser.',
  });
  assert.deepEqual(shortcuts.descriptorFromEvent({
    code: 'ShiftLeft', key: 'Shift', shiftKey: true, ctrlKey: false, altKey: false, metaKey: false,
  }), null);
});

test('keyboard events resolve to the configured action using normalized modifiers', () => {
  const configured = structuredClone(defaults);
  configured.nextAnimation = ['Shift+KeyN'];
  const event = {
    code: 'KeyN', key: 'N', shiftKey: true, ctrlKey: false, altKey: false, metaKey: false,
  };
  assert.equal(shortcuts.actionForEvent(event, configured), 'nextAnimation');
  assert.equal(shortcuts.actionForEvent({ ...event, shiftKey: false }, configured), null);
});

test('Control uses the browser ctrlKey event property when capturing a shortcut', () => {
  assert.equal(shortcuts.descriptorFromEvent({
    code: 'KeyG', key: 'g', shiftKey: false, ctrlKey: true, altKey: false, metaKey: false,
  }), 'Control+KeyG');
});

test('shortcut labels are concise and recognizable in the settings panel', () => {
  assert.equal(shortcuts.formatDescriptor('ArrowLeft'), '←');
  assert.equal(shortcuts.formatDescriptor('Space'), 'Space');
  assert.equal(shortcuts.formatDescriptor('Shift+KeyN'), 'Shift + N');
});
