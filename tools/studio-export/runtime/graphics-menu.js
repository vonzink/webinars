/* The slide's graphics menu: the small top-right button that lists the
   graphics available on this slide. Choosing one is handled by the popout
   wiring through the item's data-media id; this only opens and closes the list. */

export function startGraphicsMenu() {
  const wrap = document.querySelector('.slide-graphics');
  if (!wrap) return;
  const button = wrap.querySelector('.sg-btn');
  const menu = wrap.querySelector('.sg-menu');
  if (!button || !menu) return;

  const setOpen = open => {
    menu.hidden = !open;
    wrap.classList.toggle('is-open', open);
    button.setAttribute('aria-expanded', String(open));
  };

  button.addEventListener('click', event => {
    event.stopPropagation();
    setOpen(menu.hidden);
  });
  menu.addEventListener('click', event => {
    if (event.target instanceof Element && event.target.closest('[data-media]')) setOpen(false);
  });
  document.addEventListener('click', event => {
    if (!wrap.contains(event.target)) setOpen(false);
  });
}
