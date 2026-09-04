import {
  DEFAULT_SHORTCUTS,
  SHORTCUT_ACTIONS,
  descriptorFromEvent,
  formatDescriptor,
  resolveShortcuts,
  validateDescriptor,
  validateShortcuts,
} from './presenter-shortcuts.js';

const clone = shortcuts => Object.fromEntries(
  SHORTCUT_ACTIONS.map(({ id }) => [id, [...shortcuts[id]]]),
);

export function createShortcutPanel({ dialog, list, status, saveButton, onSave, presenterName }) {
  let saved = resolveShortcuts(null);
  let draft = clone(saved);
  let capture = null;
  let offline = false;

  function setStatus(message, state = '') {
    status.textContent = message;
    status.dataset.state = state;
  }

  function render() {
    list.replaceChildren();
    SHORTCUT_ACTIONS.forEach(({ id, label }) => {
      const row = document.createElement('div');
      row.className = 'p-shortcut-row';
      row.dataset.shortcutAction = id;

      const name = document.createElement('div');
      name.className = 'p-shortcut-name';
      name.textContent = label;

      const bindings = document.createElement('div');
      bindings.className = 'p-key-bindings';
      draft[id].forEach((descriptor, index) => {
        const group = document.createElement('span');
        group.className = 'p-key-binding';
        if (draft[id].length === 1) group.classList.add('is-single');

        const key = document.createElement('button');
        key.type = 'button';
        key.className = 'p-key-capture';
        key.dataset.action = id;
        key.dataset.index = String(index);
        key.setAttribute('aria-label', `Change ${label} shortcut ${index + 1}`);
        key.textContent = formatDescriptor(descriptor);

        group.appendChild(key);
        if (draft[id].length > 1) {
          const remove = document.createElement('button');
          remove.type = 'button';
          remove.className = 'p-key-remove';
          remove.dataset.removeAction = id;
          remove.dataset.removeIndex = String(index);
          remove.setAttribute('aria-label', `Remove ${formatDescriptor(descriptor)} from ${label}`);
          remove.textContent = '×';
          group.appendChild(remove);
        }
        bindings.appendChild(group);
      });

      if (draft[id].length < 2) {
        const add = document.createElement('button');
        add.type = 'button';
        add.className = 'p-key-add';
        add.dataset.addAction = id;
        add.setAttribute('aria-label', `Add another shortcut for ${label}`);
        add.textContent = '+';
        bindings.appendChild(add);
      }

      row.append(name, bindings);
      list.appendChild(row);
    });
  }

  function beginCapture(action, index, trigger) {
    capture = { action, index };
    list.querySelectorAll('.p-key-capture, .p-key-add').forEach(button => button.classList.remove('is-listening'));
    trigger.classList.add('is-listening');
    trigger.textContent = '…';
    setStatus(`Press a key for ${SHORTCUT_ACTIONS.find(item => item.id === action).label}.`, 'listening');
  }

  list.addEventListener('click', event => {
    const key = event.target.closest('.p-key-capture');
    if (key) {
      beginCapture(key.dataset.action, Number(key.dataset.index), key);
      return;
    }
    const add = event.target.closest('.p-key-add');
    if (add) {
      beginCapture(add.dataset.addAction, draft[add.dataset.addAction].length, add);
      return;
    }
    const remove = event.target.closest('.p-key-remove');
    if (remove) {
      draft[remove.dataset.removeAction].splice(Number(remove.dataset.removeIndex), 1);
      capture = null;
      render();
      setStatus('Shortcut removed. Save changes to keep it.');
    }
  });

  dialog.addEventListener('keydown', event => {
    if (!capture) return;
    event.preventDefault();
    event.stopPropagation();
    const descriptor = descriptorFromEvent(event);
    if (!descriptor) return;
    const descriptorResult = validateDescriptor(descriptor);
    if (!descriptorResult.ok) {
      capture = null;
      render();
      setStatus(descriptorResult.error, 'error');
      return;
    }
    const candidate = clone(draft);
    if (capture.index === candidate[capture.action].length) candidate[capture.action].push(descriptor);
    else candidate[capture.action][capture.index] = descriptor;
    const profileResult = validateShortcuts(candidate);
    capture = null;
    if (!profileResult.ok) {
      render();
      setStatus(profileResult.error, 'error');
      return;
    }
    draft = candidate;
    render();
    setStatus('Shortcut updated. Save changes to keep it.');
  });

  dialog.querySelector('#p-shortcut-reset').addEventListener('click', () => {
    draft = clone(DEFAULT_SHORTCUTS);
    capture = null;
    render();
    setStatus('Common-sense defaults restored. Save changes to keep them.');
  });

  dialog.querySelector('#p-shortcut-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('cancel', () => { capture = null; });

  saveButton.addEventListener('click', async () => {
    const result = validateShortcuts(draft);
    if (!result.ok) {
      setStatus(result.error, 'error');
      return;
    }
    saveButton.disabled = true;
    setStatus('Saving to the presenter database…', 'saving');
    try {
      saved = resolveShortcuts(await onSave(clone(draft)));
      draft = clone(saved);
      offline = false;
      render();
      setStatus(`Saved for ${presenterName()}.`, 'saved');
    } catch {
      setStatus('Settings were not saved. Check your connection and try again.', 'error');
    } finally {
      saveButton.disabled = false;
    }
  });

  function open() {
    draft = clone(saved);
    capture = null;
    render();
    setStatus(
      offline
        ? 'Offline — using saved shortcuts from this browser.'
        : `These shortcuts follow ${presenterName()} across every webinar.`,
      offline ? 'offline' : '',
    );
    dialog.showModal();
  }

  function setProfile(shortcuts, state = {}) {
    saved = resolveShortcuts(shortcuts);
    offline = Boolean(state.offline);
    if (!dialog.open) draft = clone(saved);
  }

  return { open, setProfile, isOpen: () => dialog.open };
}
