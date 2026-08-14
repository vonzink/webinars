const SCROLLING = /^(auto|scroll)$/;

export function inspectComposedSurface({ shell, surface, tolerance = 1 }) {
  const rect = shell.getBoundingClientRect();
  const viewport = { width: innerWidth, height: innerHeight };
  const descendants = [surface, ...surface.querySelectorAll('*')];
  const scrollContainers = descendants.filter(element => {
    const style = getComputedStyle(element);
    const scrollMode = SCROLLING.test(style.overflowX) || SCROLLING.test(style.overflowY);
    const hasOverflow = element.scrollWidth > element.clientWidth + tolerance
      || element.scrollHeight > element.clientHeight + tolerance;
    return scrollMode && hasOverflow;
  }).map(element => element.className || element.tagName);

  return {
    rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom },
    viewport,
    insideViewport: rect.left >= -tolerance
      && rect.top >= -tolerance
      && rect.right <= viewport.width + tolerance
      && rect.bottom <= viewport.height + tolerance,
    surfaceFitsLayout: surface.scrollWidth <= surface.clientWidth + tolerance
      && surface.scrollHeight <= surface.clientHeight + tolerance,
    scrollContainers,
  };
}

export function assertComposedSurface(result, label) {
  const failures = [];
  if (!result.insideViewport) failures.push('rendered rectangle leaves viewport');
  if (!result.surfaceFitsLayout) failures.push('design surface clips authored layout');
  if (result.scrollContainers.length) failures.push(`internal scroll containers: ${result.scrollContainers.join(', ')}`);
  if (failures.length) throw new Error(`${label}: ${failures.join('; ')}`);
}
