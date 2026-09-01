import { DOCUMENTS } from './documents.js';
import { EXPLANATIONS } from './explanations.js';
import { LE_HOTSPOTS } from './hotspots/le.js';
import { LE2_HOTSPOTS } from './hotspots/le2.js';
import { LE3_HOTSPOTS } from './hotspots/le3.js';
import { CD_HOTSPOTS } from './hotspots/cd.js';
import { CD2_HOTSPOTS } from './hotspots/cd2.js';
import { CD3_HOTSPOTS } from './hotspots/cd3.js';

export { DOCUMENTS, EXPLANATIONS };
export const HOTSPOTS = Object.freeze([
  ...LE_HOTSPOTS,
  ...LE2_HOTSPOTS,
  ...LE3_HOTSPOTS,
  ...CD_HOTSPOTS,
  ...CD2_HOTSPOTS,
  ...CD3_HOTSPOTS,
]);
