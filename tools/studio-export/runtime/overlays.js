/* Popouts for one Studio slide: educational popouts and slide graphics.
   The deck's own modal module does the rendering; this wires its triggers back
   up after the slide was captured as plain markup, and keeps the Studio shell
   informed. The shell's contract is a toggle: the slide reports an id each time
   that popout's visibility changes, and an inbound id asks to toggle it. */

const report = id => {
  try { window.msfgRuntime.emit('supported-overlay-state', { actionId: id }); } catch { /* shell absent */ }
};

export function startOverlays({ modal, modalIds = [], mediaIds = [] }) {
  const openers = new Map([
    ...modalIds.map(id => [id, modal.openModal]),
    ...mediaIds.map(id => [id, modal.openMedia]),
  ]);
  let openId = null;

  modal.initModal();

  /* The popout closes itself on ✕, Esc, and the backdrop; watch for that. */
  const root = document.getElementById('modal-root');
  new MutationObserver(() => {
    if (!openId || modal.isModalOpen()) return;
    const closed = openId;
    openId = null;
    report(closed);
  }).observe(root, { attributes: true, attributeFilter: ['class'] });

  const open = (id, opener) => {
    const show = openers.get(id);
    if (!show) return;
    if (openId === id && modal.isModalOpen()) return;
    if (openId) report(openId);
    openId = id;
    report(id);
    Promise.resolve(show(id, opener)).catch(() => {});
  };

  document.addEventListener('click', event => {
    const trigger = event.target instanceof Element ? event.target.closest('[data-modal], [data-media]') : null;
    if (trigger) open(trigger.dataset.modal || trigger.dataset.media, trigger);
  });

  window.addEventListener('msfg:supported-overlay-state', event => {
    const id = event.detail && event.detail.actionId;
    if (typeof id !== 'string') return;
    if (openId === id && modal.isModalOpen()) modal.closeModal();
    else open(id);
  });

  window.addEventListener('msfg:slide-exit', () => {
    if (modal.isModalOpen()) modal.closeModal();
  });
}
