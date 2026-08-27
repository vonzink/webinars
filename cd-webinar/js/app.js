import { DOCUMENTS, EXPLANATIONS, HOTSPOTS } from '../content/index.js';
import { getRenderableHotspots, validateContent } from './content-validation.js';
import { initViewer } from './viewer.js';

const errors = validateContent({ DOCUMENTS, EXPLANATIONS, HOTSPOTS, release: false });

if (errors.length) {
  console.error(`Invalid webinar content:\n${errors.join('\n')}`);
} else {
  const renderableHotspots = getRenderableHotspots({ DOCUMENTS, EXPLANATIONS, HOTSPOTS });
  initViewer({
    root: document.querySelector('[data-viewer-root]'),
    documents: DOCUMENTS,
    explanations: EXPLANATIONS,
    hotspots: renderableHotspots,
  });
}
