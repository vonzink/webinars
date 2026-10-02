/* Purchase-loan shares transcribed from the supplied reference image.
   Source/year were not supplied; these are not first-time-buyer-specific figures. */
export const PROGRAM_SHARES = [
  { id: 'prog-conventional', label: 'Conventional', share: 71.6 },
  { id: 'prog-fha', label: 'FHA', share: 18.6 },
  { id: 'prog-va', label: 'VA', share: 8.9 },
  { id: 'prog-usda', label: 'USDA', share: 0.9 },
];

export function programShareChart(id) {
  const selected = PROGRAM_SHARES.find(program => program.id === id);
  if (!selected) return '';
  const cx = 280, cy = 170, rx = 245, ry = 140, depth = 34;
  const point = (angle, z = 0) => {
    const radians = angle * Math.PI / 180;
    return `${cx + rx * Math.cos(radians)},${cy + ry * Math.sin(radians) + z}`;
  };
  let angle = -90;
  const walls = [], tops = [];
  for (const program of PROGRAM_SHARES) {
    const start = angle, end = angle += program.share * 3.6;
    const active = program.id === id;
    const first = Math.max(start, 0), last = Math.min(end, 180);
    if (last > first) walls.push(`<path d="M ${point(first)} A ${rx},${ry} 0 0 1 ${point(last)} L ${point(last, depth)} A ${rx},${ry} 0 0 0 ${point(first, depth)} Z" fill="${active ? '#4B7B4D' : '#A8B5B0'}"/>`);
    tops.push(`<path d="M ${cx},${cy} L ${point(start)} A ${rx},${ry} 0 ${end - start > 180 ? 1 : 0} 1 ${point(end)} Z" fill="${active ? '#8CC63E' : '#DEE6E1'}" stroke="white" stroke-width="1.5"/>`);
  }
  return `<figure class="program-share" aria-label="${selected.label}: ${selected.share}% of purchase loans">
    <figcaption>Share of purchase loans</figcaption>
    <div class="program-share-stat">${selected.share.toFixed(1)}<span>%</span></div>
    <p class="program-share-name">${selected.label}${id === 'prog-conventional' ? '<small>Includes conforming &amp; jumbo</small>' : ''}</p>
    <svg viewBox="0 0 560 365" role="img" aria-label="Pie chart highlighting ${selected.label}, ${selected.share}% of purchase loans">
      <ellipse cx="${cx}" cy="${cy + depth + 6}" rx="${rx + 5}" ry="${ry}" fill="#EDF1EE"/>
      ${walls.join('')}${tops.join('')}
    </svg>
    <p class="program-share-source">Source and reporting period to be confirmed.</p>
  </figure>`;
}
