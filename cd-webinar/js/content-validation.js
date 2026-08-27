const insideUnitInterval = value => Number.isFinite(value) && value >= 0 && value <= 1;

export function validateContent({ DOCUMENTS, EXPLANATIONS, HOTSPOTS, release = false }) {
  const errors = [];
  const pageIds = new Set(DOCUMENTS.flatMap(document => document.pages.map(page => page.id)));
  const hotspotIds = new Set();
  const readingKeys = new Set();

  for (const hotspot of HOTSPOTS) {
    if (hotspotIds.has(hotspot.id)) errors.push(`duplicate hotspot id: ${hotspot.id}`);
    hotspotIds.add(hotspot.id);
    const readingKey = `${hotspot.pageId}:${hotspot.readingOrder}`;
    if (readingKeys.has(readingKey)) errors.push(`duplicate reading order: ${readingKey}`);
    readingKeys.add(readingKey);
    if (!pageIds.has(hotspot.pageId)) errors.push(`unknown page: ${hotspot.pageId}`);
    const { x, y, width, height } = hotspot.bounds ?? {};
    if (![x, y, width, height].every(insideUnitInterval) || x + width > 1 || y + height > 1 || width === 0 || height === 0) {
      errors.push(`hotspot outside page bounds: ${hotspot.id}`);
    }
    if (!hotspot.accessibleLabel?.trim()) errors.push(`missing accessible label: ${hotspot.id}`);
    const explanation = EXPLANATIONS[hotspot.explanationId];
    if (!explanation) errors.push(`missing explanation: ${hotspot.explanationId}`);
    if (release && explanation?.review?.status !== 'approved') {
      errors.push(`review status must be approved: ${hotspot.explanationId}`);
    }
  }
  return [...new Set(errors)];
}

export function getRenderableHotspots({ DOCUMENTS, EXPLANATIONS, HOTSPOTS }) {
  const pageIds = new Set(DOCUMENTS.flatMap(document => document.pages.map(page => page.id)));
  const ids = new Set();
  const readingKeys = new Set();
  return HOTSPOTS.filter(hotspot => {
    const { x, y, width, height } = hotspot.bounds ?? {};
    const readingKey = `${hotspot.pageId}:${hotspot.readingOrder}`;
    const valid = !ids.has(hotspot.id)
      && !readingKeys.has(readingKey)
      && pageIds.has(hotspot.pageId)
      && [x, y, width, height].every(insideUnitInterval)
      && width > 0 && height > 0 && x + width <= 1 && y + height <= 1
      && Boolean(hotspot.accessibleLabel?.trim())
      && Boolean(EXPLANATIONS[hotspot.explanationId]);
    if (valid) {
      ids.add(hotspot.id);
      readingKeys.add(readingKey);
    }
    return valid;
  });
}
