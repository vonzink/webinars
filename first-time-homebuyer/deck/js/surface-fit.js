import {
  OVERLAY_MARGIN,
  fitOverlay,
  clampOverlay,
  resizeOverlay,
} from './overlay-geometry.js';

const finiteSize = (value, fallback) => Number.isFinite(value) && value > 0 ? value : fallback;

export function createSurfaceController({
  viewport,
  shell,
  surface,
  getDesignSize,
  margin = OVERLAY_MARGIN,
}) {
  let active = false;
  let geometry = null;
  let preferredScale = 1;
  let userPositioned = false;
  let frame = 0;
  let destroyed = false;
  let generation = 0;

  const viewportSize = () => ({
    viewportWidth: finiteSize(viewport.clientWidth, document.documentElement.clientWidth),
    viewportHeight: finiteSize(viewport.clientHeight, document.documentElement.clientHeight),
  });

  const dimensions = () => {
    const { width, height } = getDesignSize();
    return {
      intrinsicWidth: width,
      intrinsicHeight: height,
      fallbackWidth: width,
      fallbackHeight: height,
      margin,
      ...viewportSize(),
    };
  };

  const apply = next => {
    geometry = next;
    Object.assign(shell.style, {
      width: `${next.width}px`,
      height: `${next.height}px`,
      left: `${next.left}px`,
      top: `${next.top}px`,
    });
    Object.assign(surface.style, {
      width: `${next.intrinsicWidth}px`,
      height: `${next.intrinsicHeight}px`,
      transformOrigin: 'top left',
      transform: `scale(${next.scale})`,
    });
    return next;
  };

  const fit = () => {
    if (destroyed || !active) return geometry;
    const options = dimensions();
    if (!geometry || !userPositioned) {
      return apply(fitOverlay({ ...options, maxScale: preferredScale }));
    }
    return apply(clampOverlay({
      ...options,
      scale: preferredScale,
      left: geometry.left,
      top: geometry.top,
    }));
  };

  const scheduleFit = () => {
    if (destroyed || !active) return;
    cancelAnimationFrame(frame);
    const token = ++generation;
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (!destroyed && active && token === generation) fit();
    });
  };

  const reset = () => {
    generation += 1;
    cancelAnimationFrame(frame);
    frame = 0;
    preferredScale = 1;
    userPositioned = false;
    geometry = null;
  };

  const moveFrom = (start, deltaX, deltaY) => {
    if (destroyed || !active || !start) return geometry;
    userPositioned = true;
    return apply(clampOverlay({
      ...dimensions(),
      scale: preferredScale,
      left: start.left + deltaX,
      top: start.top + deltaY,
    }));
  };

  const resizeFrom = (start, deltaX, deltaY) => {
    if (destroyed || !active || !start) return geometry;
    const next = resizeOverlay({
      ...dimensions(),
      startScale: start.scale,
      left: start.left,
      top: start.top,
      deltaX,
      deltaY,
    });
    preferredScale = next.scale;
    userPositioned = true;
    return apply(next);
  };

  const observer = new ResizeObserver(scheduleFit);
  observer.observe(viewport);
  window.addEventListener('resize', scheduleFit);

  return {
    setActive(next) {
      if (destroyed) return;
      active = Boolean(next);
      generation += 1;
      cancelAnimationFrame(frame);
      frame = 0;
      if (active) scheduleFit();
    },
    fit,
    reset,
    moveFrom,
    resizeFrom,
    scheduleFit,
    getGeometry: () => geometry,
    destroy() {
      destroyed = true;
      active = false;
      generation += 1;
      cancelAnimationFrame(frame);
      frame = 0;
      observer.disconnect();
      window.removeEventListener('resize', scheduleFit);
    },
  };
}
