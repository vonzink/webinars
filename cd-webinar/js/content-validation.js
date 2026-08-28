const insideUnitInterval = value => Number.isFinite(value) && value >= 0 && value <= 1;
const isHotspotRecord = hotspot => hotspot !== null && typeof hotspot === 'object' && !Array.isArray(hotspot);
const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export function validateDocumentCatalog(DOCUMENTS) {
  if (!Array.isArray(DOCUMENTS) || DOCUMENTS.length === 0) {
    return ['document catalog must contain at least one document'];
  }

  const errors = [];
  const documentIds = new Set();
  const pageIds = new Set();
  for (const document of DOCUMENTS) {
    if (!isRecord(document)) {
      errors.push(`malformed document record: ${String(document)}`);
      continue;
    }
    if (!document.id?.trim()) errors.push('document is missing an id');
    else if (documentIds.has(document.id)) errors.push(`duplicate document id: ${document.id}`);
    else documentIds.add(document.id);

    if (!Array.isArray(document.pages) || document.pages.length === 0) {
      errors.push(`document pages must contain at least one page: ${document.id || '(missing id)'}`);
      continue;
    }

    for (const page of document.pages) {
      if (!isRecord(page)) {
        errors.push(`malformed page record in document: ${document.id || '(missing id)'}`);
        continue;
      }
      if (!page.id?.trim()) errors.push(`page is missing an id in document: ${document.id || '(missing id)'}`);
      else if (pageIds.has(page.id)) errors.push(`duplicate page id: ${page.id}`);
      else pageIds.add(page.id);
      if (!page.image?.trim()) errors.push(`page is missing an image: ${page.id || '(missing id)'}`);
      if (!Number.isFinite(page.width) || page.width <= 0 || !Number.isFinite(page.height) || page.height <= 0) {
        errors.push(`page has invalid dimensions: ${page.id || '(missing id)'}`);
      }
    }
  }
  return [...new Set(errors)];
}

export function validateContent({ DOCUMENTS, EXPLANATIONS, HOTSPOTS, release = false }) {
  const errors = [];
  const pageIds = new Set(DOCUMENTS.flatMap(document => document.pages.map(page => page.id)));
  const hotspotIds = new Set();
  const readingKeys = new Set();

  for (const hotspot of HOTSPOTS) {
    if (!isHotspotRecord(hotspot)) {
      errors.push(`malformed hotspot record: ${String(hotspot)}`);
      continue;
    }
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
    if (!isHotspotRecord(hotspot)) return false;
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
