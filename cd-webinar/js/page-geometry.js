const positive = value => Number.isFinite(value) && value > 0;
const percent = value => `${Number((value * 100).toFixed(4))}%`;

export function fitPage({ intrinsicWidth, intrinsicHeight, availableWidth, availableHeight, zoom }) {
  if (![intrinsicWidth, intrinsicHeight, availableWidth, availableHeight, zoom].every(positive)) {
    throw new RangeError('page geometry values must be finite and positive');
  }
  const fitScale = Math.min(availableWidth / intrinsicWidth, availableHeight / intrinsicHeight, 1);
  const scale = fitScale * zoom;
  let width = intrinsicWidth;
  let height = intrinsicHeight;
  if (fitScale < 1) {
    if (availableWidth / intrinsicWidth < availableHeight / intrinsicHeight) {
      width = availableWidth;
      height = (intrinsicHeight * availableWidth) / intrinsicWidth;
    } else {
      width = (intrinsicWidth * availableHeight) / intrinsicHeight;
      height = availableHeight;
    }
  }
  return { width: width * zoom, height: height * zoom, scale };
}

export function hotspotPercentStyle({ x, y, width, height }) {
  const values = [x, y, width, height];
  if (!values.every(value => Number.isFinite(value) && value >= 0 && value <= 1)
      || width === 0 || height === 0 || x + width > 1 || y + height > 1) {
    throw new RangeError('hotspot bounds must fit inside the normalized page');
  }
  return { left: percent(x), top: percent(y), width: percent(width), height: percent(height) };
}
