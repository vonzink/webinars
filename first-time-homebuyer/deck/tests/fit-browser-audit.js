const SCROLLING = /^(auto|scroll)$/;
const CLIPPING = /^(hidden|clip)$/;
const REQUIRED_ELEMENT = 'img,svg,canvas,video,iframe,button,input,select,textarea,table,th,td,a[href],[role="img"]';
const ALLOW_CLIP = '[data-audit-allow-clip]';

const nameOf = element => {
  const classes = typeof element.className === 'string'
    ? element.className.trim().split(/\s+/).filter(Boolean).join('.')
    : '';
  return `${element.tagName}${classes ? `.${classes}` : ''}`;
};

const hiddenFromAudit = element => {
  for (let current = element; current; current = current.parentElement) {
    if (current.matches?.(ALLOW_CLIP)) return true;
    if (current.getAttribute?.('aria-hidden') === 'true') return true;
  }
  return false;
};

function requiredVisualRects(element) {
  if (hiddenFromAudit(element) || element.getClientRects().length === 0) return [];
  const rects = [];
  if (element.matches(REQUIRED_ELEMENT)) {
    rects.push({
      rect: element.getBoundingClientRect(),
      firstClippingAncestor: element.parentElement,
      directText: false,
    });
  }

  if (typeof document !== 'undefined' && document.createRange) {
    for (const node of element.childNodes) {
      if (node.nodeType !== 3 || !node.textContent.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      rects.push(...[...range.getClientRects()].map(rect => ({
        rect,
        firstClippingAncestor: element,
        directText: true,
      })));
      range.detach?.();
    }
  }
  return rects.filter(({ rect }) => rect.width > 0 && rect.height > 0);
}

const clippedAxes = (contentRect, ancestor, tolerance, requireLayoutOverflow = false) => {
  const style = getComputedStyle(ancestor);
  const ancestorRect = ancestor.getBoundingClientRect();
  const layoutTolerance = requireLayoutOverflow ? Math.max(tolerance, 2) : tolerance;
  const axes = [];
  if (CLIPPING.test(style.overflowX)
      && (!requireLayoutOverflow || ancestor.scrollWidth > ancestor.clientWidth + layoutTolerance)
      && (contentRect.left < ancestorRect.left - tolerance
        || contentRect.right > ancestorRect.right + tolerance)) axes.push('x');
  if (CLIPPING.test(style.overflowY)
      && (!requireLayoutOverflow || ancestor.scrollHeight > ancestor.clientHeight + layoutTolerance)
      && (contentRect.top < ancestorRect.top - tolerance
        || contentRect.bottom > ancestorRect.bottom + tolerance)) axes.push('y');
  return axes;
};

export function inspectComposedSurface({ shell, surface, tolerance = 1 }) {
  const rect = shell.getBoundingClientRect();
  const viewport = { width: innerWidth, height: innerHeight };
  const descendants = [surface, ...surface.querySelectorAll('*')];
  const covered = [shell, ...descendants];
  const coveredSet = new Set(covered);
  const scrollContainers = covered.filter(element => {
    const style = getComputedStyle(element);
    const scrollMode = SCROLLING.test(style.overflowX) || SCROLLING.test(style.overflowY);
    const hasOverflow = element.scrollWidth > element.clientWidth + tolerance
      || element.scrollHeight > element.clientHeight + tolerance;
    return scrollMode && hasOverflow;
  }).map(nameOf);

  const clippedContent = [];
  for (const element of descendants) {
    const visualRects = requiredVisualRects(element);
    for (const { rect: contentRect, firstClippingAncestor, directText } of visualRects) {
      // Element border boxes begin at their parent. Direct text ranges begin at
      // their owner because that element can clip its own text content.
      for (let ancestor = firstClippingAncestor; ancestor && coveredSet.has(ancestor); ancestor = ancestor.parentElement) {
        const axes = clippedAxes(
          contentRect,
          ancestor,
          tolerance,
          directText && ancestor === element,
        );
        if (axes.length) {
          clippedContent.push(`${nameOf(element)} clipped by ${nameOf(ancestor)} (${axes.join('+')})`);
          break;
        }
      }
    }
  }

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
    clippedContent: [...new Set(clippedContent)],
  };
}

export function assertComposedSurface(result, label) {
  const failures = [];
  if (!result.insideViewport) failures.push('rendered rectangle leaves viewport');
  if (!result.surfaceFitsLayout) failures.push('design surface clips authored layout');
  if (result.scrollContainers.length) failures.push(`internal scroll containers: ${result.scrollContainers.join(', ')}`);
  if (result.clippedContent.length) failures.push(`clipped required content: ${result.clippedContent.join(', ')}`);
  if (failures.length) throw new Error(`${label}: ${failures.join('; ')}`);
}
