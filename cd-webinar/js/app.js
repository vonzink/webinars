import { DOCUMENTS, EXPLANATIONS, HOTSPOTS } from '../content/index.js';
import {
  getRenderableHotspots,
  validateContent,
  validateDocumentCatalog,
} from './content-validation.js';
import { initViewer } from './viewer.js';

export function startWebinar({
  root,
  documents,
  explanations,
  hotspots,
  logError = message => console.error(message),
  initialize = initViewer,
}) {
  const catalogErrors = validateDocumentCatalog(documents);
  if (catalogErrors.length) {
    logError(`Unusable webinar document catalog:\n${catalogErrors.join('\n')}`);
    return { started: false, errors: catalogErrors, viewer: null };
  }

  const errors = validateContent({
    DOCUMENTS: documents,
    EXPLANATIONS: explanations,
    HOTSPOTS: hotspots,
    release: false,
  });
  if (errors.length) logError(`Recoverable webinar hotspot errors:\n${errors.join('\n')}`);

  const renderableHotspots = getRenderableHotspots({
    DOCUMENTS: documents,
    EXPLANATIONS: explanations,
    HOTSPOTS: hotspots,
  });
  const viewer = initialize({
    root,
    documents,
    explanations,
    hotspots: renderableHotspots,
  });
  return { started: true, errors, viewer };
}

if (typeof document !== 'undefined') {
  startWebinar({
    root: document.querySelector('[data-viewer-root]'),
    documents: DOCUMENTS,
    explanations: EXPLANATIONS,
    hotspots: HOTSPOTS,
  });
}
