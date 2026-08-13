export const OVERLAY_MARGIN = 16;
export const OVERLAY_MIN_SCALE = 0.35;

const positive = (value, fallback) => Number.isFinite(value) && value > 0 ? value : fallback;
const requiredDimension = (value, fallback, name) => {
  const resolved = positive(value, fallback);
  if (!Number.isFinite(resolved) || resolved <= 0) throw new RangeError(`Invalid ${name}`);
  return resolved;
};
const between = (value, low, high) => Math.min(Math.max(value, low), high);
const size = o => {
  const margin = Math.max(0, Number.isFinite(o.margin) ? o.margin : OVERLAY_MARGIN);
  const intrinsicWidth = requiredDimension(o.intrinsicWidth, o.fallbackWidth, 'intrinsic width');
  const intrinsicHeight = requiredDimension(o.intrinsicHeight, o.fallbackHeight, 'intrinsic height');
  return {
    intrinsicWidth, intrinsicHeight, margin,
    viewportWidth: positive(o.viewportWidth, intrinsicWidth + 2 * margin),
    viewportHeight: positive(o.viewportHeight, intrinsicHeight + 2 * margin),
  };
};
const result = (d, scale, left, top) => ({
  intrinsicWidth: d.intrinsicWidth, intrinsicHeight: d.intrinsicHeight,
  scale, width: d.intrinsicWidth * scale, height: d.intrinsicHeight * scale,
  left, top,
});

export function fitOverlay(options) {
  const d = size(options);
  const scale = Math.min(1, Math.max(1, d.viewportWidth - 2 * d.margin) / d.intrinsicWidth, Math.max(1, d.viewportHeight - 2 * d.margin) / d.intrinsicHeight);
  const width = d.intrinsicWidth * scale, height = d.intrinsicHeight * scale;
  return result(d, scale, Math.max(d.margin, (d.viewportWidth - width) / 2), Math.max(d.margin, (d.viewportHeight - height) / 2));
}

export function clampOverlay(options) {
  const d = size(options);
  const scale = Math.min(positive(options.scale, 1), Math.max(1, d.viewportWidth - 2 * d.margin) / d.intrinsicWidth, Math.max(1, d.viewportHeight - 2 * d.margin) / d.intrinsicHeight);
  const width = d.intrinsicWidth * scale, height = d.intrinsicHeight * scale;
  return result(d, scale,
    between(Number.isFinite(options.left) ? options.left : d.margin, d.margin, d.viewportWidth - d.margin - width),
    between(Number.isFinite(options.top) ? options.top : d.margin, d.margin, d.viewportHeight - d.margin - height));
}

export function resizeOverlay(options) {
  const d = size(options);
  const left = Math.max(d.margin, Number.isFinite(options.left) ? options.left : d.margin);
  const top = Math.max(d.margin, Number.isFinite(options.top) ? options.top : d.margin);
  const dx = Number.isFinite(options.deltaX) ? options.deltaX : 0;
  const dy = Number.isFinite(options.deltaY) ? options.deltaY : 0;
  const delta = (dx * d.intrinsicWidth + dy * d.intrinsicHeight) / (d.intrinsicWidth ** 2 + d.intrinsicHeight ** 2);
  const maximum = Math.min(Math.max(1, d.viewportWidth - d.margin - left) / d.intrinsicWidth, Math.max(1, d.viewportHeight - d.margin - top) / d.intrinsicHeight);
  const scale = between(positive(options.startScale, 1) + delta, Math.min(OVERLAY_MIN_SCALE, maximum), maximum);
  return result(d, scale, left, top);
}
