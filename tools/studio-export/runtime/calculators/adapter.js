/* Shared wiring for a slide calculator: opened from the slide's calculator
   button, toggled by the Studio shell, and reported to it on every change. */

export function startCalculatorAdapter({ actionId, init, setVisible, isVisible }) {
  init({
    onVisibilityChange() {
      try {
        window.msfgRuntime.emit('supported-calculator-state', { actionId });
      } catch { /* shell absent */ }
    },
  });

  document.addEventListener('click', event => {
    const trigger = event.target instanceof Element ? event.target.closest('.slide-calc') : null;
    if (trigger) setVisible(true, trigger);
  });

  window.addEventListener('msfg:supported-calculator-state', event => {
    if (event.detail && event.detail.actionId === actionId) setVisible(!isVisible());
  });

  window.addEventListener('msfg:slide-exit', () => setVisible(false));
}
