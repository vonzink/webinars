export const SHORTCUT_ACTIONS = Object.freeze([
  Object.freeze({ id: 'previousSlide', label: 'Previous slide' }),
  Object.freeze({ id: 'nextSlide', label: 'Next slide' }),
  Object.freeze({ id: 'previousAnimation', label: 'Previous animation' }),
  Object.freeze({ id: 'toggleAnimationPlayback', label: 'Play / pause animations' }),
  Object.freeze({ id: 'nextAnimation', label: 'Next animation' }),
  Object.freeze({ id: 'toggleDrawing', label: 'Toggle drawing' }),
  Object.freeze({ id: 'toggleFullscreen', label: 'Fullscreen slide' }),
]);

export const DEFAULT_SHORTCUTS = Object.freeze({
  previousSlide: Object.freeze(['ArrowLeft']),
  nextSlide: Object.freeze(['ArrowRight', 'Space']),
  previousAnimation: Object.freeze(['KeyJ']),
  toggleAnimationPlayback: Object.freeze(['KeyK']),
  nextAnimation: Object.freeze(['KeyL']),
  toggleDrawing: Object.freeze(['KeyD']),
  toggleFullscreen: Object.freeze(['KeyF']),
});

const labels = new Map(SHORTCUT_ACTIONS.map(action => [action.id, action.label]));
const modifiers = ['Control', 'Alt', 'Shift', 'Meta'];
const basePattern = /^(?:Key[A-Z]|Digit[0-9]|Arrow(?:Left|Right|Up|Down)|Space|Enter|Backspace|Home|End|PageUp|PageDown)$/;
const browserReserved = /^(?:Control|Meta)(?:\+(?:Alt|Shift))*\+(?:Key[LRNWPT]|Tab)$/;

const cloneShortcuts = value => Object.fromEntries(
  SHORTCUT_ACTIONS.map(({ id }) => [id, [...value[id]]]),
);

export function validateDescriptor(descriptor) {
  if (descriptor === 'Escape') {
    return { ok: false, error: 'Escape is reserved for closing settings.' };
  }
  if (typeof descriptor !== 'string' || !descriptor) {
    return { ok: false, error: 'Press a letter, number, arrow, or navigation key.' };
  }
  const parts = descriptor.split('+');
  const base = parts.pop();
  if (!basePattern.test(base) || parts.some((part, index) => (
    !modifiers.includes(part) || modifiers.indexOf(part) <= modifiers.indexOf(parts[index - 1])
  ))) {
    return { ok: false, error: 'Press a letter, number, arrow, or navigation key.' };
  }
  if (base === 'Tab' || browserReserved.test(descriptor) ||
      ((parts.includes('Alt') || parts.includes('Meta')) && /^Arrow(?:Left|Right)$/.test(base))) {
    return { ok: false, error: 'That shortcut is reserved by the browser.' };
  }
  return { ok: true };
}

export function validateShortcuts(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, error: 'Shortcut settings must be an object.' };
  }
  const seen = new Map();
  for (const { id, label } of SHORTCUT_ACTIONS) {
    const assigned = value[id];
    if (!Array.isArray(assigned) || assigned.length < 1 || assigned.length > 2) {
      return { ok: false, error: `${label} needs one or two shortcuts.` };
    }
    for (const descriptor of assigned) {
      const descriptorResult = validateDescriptor(descriptor);
      if (!descriptorResult.ok) return descriptorResult;
      if (seen.has(descriptor)) {
        return { ok: false, error: `${descriptor} is already assigned to ${seen.get(descriptor)}.` };
      }
      seen.set(descriptor, label);
    }
  }
  return { ok: true };
}

export function resolveShortcuts(value) {
  return cloneShortcuts(validateShortcuts(value).ok ? value : DEFAULT_SHORTCUTS);
}

export function descriptorFromEvent(event) {
  if (['Shift', 'Control', 'Alt', 'Meta'].includes(event.key)) return null;
  const code = event.code || (event.key === ' ' ? 'Space' : event.key);
  if (!code) return null;
  const held = {
    Control: event.ctrlKey,
    Alt: event.altKey,
    Shift: event.shiftKey,
    Meta: event.metaKey,
  };
  const prefix = modifiers.filter(modifier => held[modifier]).join('+');
  return `${prefix ? `${prefix}+` : ''}${code}`;
}

export function actionForEvent(event, value) {
  const descriptor = descriptorFromEvent(event);
  if (!descriptor) return null;
  for (const { id } of SHORTCUT_ACTIONS) {
    if (value[id]?.includes(descriptor)) return id;
  }
  return null;
}

export function formatDescriptor(descriptor) {
  const names = {
    ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓',
    Space: 'Space', Control: 'Ctrl', Meta: 'Cmd', Alt: 'Alt', Shift: 'Shift',
  };
  return descriptor.split('+').map(part => names[part] || part.replace(/^Key/, '').replace(/^Digit/, '')).join(' + ');
}

export function actionLabel(id) {
  return labels.get(id) || id;
}
