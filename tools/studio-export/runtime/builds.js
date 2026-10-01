/* Build sequencing for one Studio slide.
   The same reveal the static deck runs: every .build element fades in, in
   document order, on a short stagger. Studio drives it through runtime events
   and hears the result as animation-state. */

const report = (type, payload) => {
  try { window.msfgRuntime.emit(type, payload); } catch { /* shell absent: nothing to tell */ }
};

export function startBuilds() {
  const slide = document.querySelector('.slide');
  const items = slide ? [...slide.querySelectorAll('.build')] : [];
  const total = items.length;
  let revealed = 0;
  let playing = false;
  let timers = [];

  const emitState = () => report('animation-state', { current: revealed, total, playing });

  const clearTimers = () => {
    timers.forEach(timer => clearTimeout(timer));
    timers = [];
  };

  const reveal = count => {
    const next = Math.max(0, Math.min(total, count));
    items.forEach((item, index) => item.classList.toggle('is-in', index < next));
    revealed = next;
    emitState();
  };

  const pause = () => {
    clearTimers();
    playing = false;
    emitState();
  };

  const step = delta => {
    clearTimers();
    playing = false;
    reveal(revealed + delta);
  };

  const play = () => {
    clearTimers();
    if (!total) {
      playing = false;
      emitState();
      return;
    }
    if (revealed >= total) reveal(0);

    const start = revealed;
    playing = true;
    emitState();
    items.slice(start).forEach((item, offset) => {
      const target = start + offset + 1;
      timers.push(setTimeout(() => {
        if (!playing) return;
        item.classList.add('is-in');
        revealed = target;
        if (target === total) {
          playing = false;
          timers = [];
        }
        emitState();
      }, 60 + Math.min(offset, 6) * 90));
    });
  };

  const run = () => {
    clearTimers();
    revealed = 0;
    playing = false;
    items.forEach(item => item.classList.remove('is-in'));
    play();
  };

  window.addEventListener('msfg:slide-enter', run);
  window.addEventListener('msfg:slide-exit', clearTimers);
  window.addEventListener('msfg:animation-forward', () => step(1));
  window.addEventListener('msfg:animation-back', () => step(-1));
  window.addEventListener('msfg:animation-play', play);
  window.addEventListener('msfg:animation-pause', pause);

  /* The editor preview never sends slide-enter, so start now. An audience
     shell sends slide-enter a moment later, which restarts the same sequence
     before the first item has appeared. */
  run();
}
