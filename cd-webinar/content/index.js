import { DOCUMENTS } from './documents.js';
import { EXPLANATIONS } from './explanations.js';
import { LE_HOTSPOTS } from './hotspots/le.js';
import { CD_HOTSPOTS } from './hotspots/cd.js';

export { DOCUMENTS, EXPLANATIONS };
export const HOTSPOTS = Object.freeze([...LE_HOTSPOTS, ...CD_HOTSPOTS]);
