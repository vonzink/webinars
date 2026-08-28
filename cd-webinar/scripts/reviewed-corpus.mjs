import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { DOCUMENTS, EXPLANATIONS, HOTSPOTS } from '../content/index.js';
import { validateContent, validateDocumentCatalog } from '../js/content-validation.js';

const defaultWebinarRoot = new URL('../', import.meta.url);
const fullName = value => typeof value === 'string' && /\S+\s+\S+/.test(value.trim());
const sha256 = value => createHash('sha256').update(value).digest('hex');

const canonicalize = value => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value)
      .filter(key => value[key] !== undefined)
      .sort()
      .map(key => [key, canonicalize(value[key])]));
  }
  return value;
};

export const canonicalStringify = value => JSON.stringify(canonicalize(value));
export const digestReviewedCorpus = corpus => sha256(canonicalStringify(corpus));

export function isValidIsoCalendarDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

export async function buildReviewedCorpus({
  webinarRoot = defaultWebinarRoot,
  documents = DOCUMENTS,
  explanations = EXPLANATIONS,
  hotspots = HOTSPOTS,
} = {}) {
  const sourceManifest = JSON.parse(await readFile(new URL('references/source-manifest.json', webinarRoot), 'utf8'));
  const sourcePaths = sourceManifest.documents
    .map(document => `references/${document.file}`)
    .sort();
  const sourceDocuments = await Promise.all(sourcePaths.map(async path => ({
    path,
    sha256: sha256(await readFile(new URL(path, webinarRoot))),
  })));
  const brandAssets = await Promise.all(['assets/brand/logo-horizontal.svg'].map(async path => ({
    path,
    sha256: sha256(await readFile(new URL(path, webinarRoot))),
  })));
  const renderedPaths = documents.flatMap(document => document.pages.map(page => page.image.replace(/^\.\//, '')))
    .sort();
  const renderedImages = await Promise.all(renderedPaths.map(async path => ({
    path,
    sha256: sha256(await readFile(new URL(path, webinarRoot))),
  })));
  const reviewedExplanations = Object.values(explanations)
    .map(explanation => {
      const { review: _reviewEvidence, ...reviewedContent } = explanation;
      return reviewedContent;
    })
    .sort((a, b) => a.id.localeCompare(b.id));
  const reviewedHotspots = hotspots
    .map(hotspot => structuredClone(hotspot))
    .sort((a, b) => a.id.localeCompare(b.id));
  const documentCatalog = documents
    .map(document => structuredClone(document))
    .sort((a, b) => a.id.localeCompare(b.id));

  return {
    schemaVersion: 1,
    documentCatalog,
    explanations: reviewedExplanations,
    hotspots: reviewedHotspots,
    sourceManifest,
    sourceDocuments,
    brandAssets,
    renderedImages,
  };
}

export async function getReleaseReadinessErrors({
  documents = DOCUMENTS,
  explanations = EXPLANATIONS,
  hotspots = HOTSPOTS,
  approval,
  webinarRoot = defaultWebinarRoot,
}) {
  const errors = [];
  const catalogErrors = validateDocumentCatalog(documents);
  errors.push(...catalogErrors);
  if (catalogErrors.length === 0) {
    errors.push(...validateContent({
      DOCUMENTS: documents,
      EXPLANATIONS: explanations,
      HOTSPOTS: hotspots,
      release: false,
    }));
  }

  const reviewRecords = Object.values(explanations).map(explanation => explanation.review ?? {});
  const pendingRecords = reviewRecords.filter(review => review.status !== 'approved');
  if (pendingRecords.length) {
    errors.push(`real MSFG explanation approval is pending: ${pendingRecords.length} records`);
  } else {
    const invalidReviewers = reviewRecords.filter(review => !fullName(review.reviewer));
    const invalidDates = reviewRecords.filter(review => !isValidIsoCalendarDate(review.reviewedOn));
    if (invalidReviewers.length) {
      errors.push(`approved explanation reviewer evidence is invalid: ${invalidReviewers.length} records`);
    }
    if (invalidDates.length) {
      errors.push(`approved explanation review date is invalid: ${invalidDates.length} records`);
    }
  }

  if (approval?.status !== 'approved') errors.push('reviewed corpus approval status must be approved');
  if (!fullName(approval?.reviewer)) errors.push('reviewed corpus reviewer must contain a real full name');
  if (!isValidIsoCalendarDate(approval?.reviewedOn)) {
    errors.push('reviewed corpus review date must be a real ISO calendar date');
  }
  const recordedDigest = approval?.reviewedCorpusSha256;
  if (typeof recordedDigest !== 'string' || !/^[a-f0-9]{64}$/.test(recordedDigest)) {
    errors.push('reviewed corpus digest must be a SHA-256 value');
  } else if (errors.length === 0) {
    const corpus = await buildReviewedCorpus({ webinarRoot, documents, explanations, hotspots });
    if (recordedDigest !== digestReviewedCorpus(corpus)) {
      errors.push('reviewed corpus digest does not match the exact current reviewed bytes');
    }
  }
  return [...new Set(errors)];
}

if (import.meta.main) {
  if (process.argv[2] !== '--print-digest') {
    console.error('Usage: node cd-webinar/scripts/reviewed-corpus.mjs --print-digest');
    process.exitCode = 2;
  } else {
    const corpus = await buildReviewedCorpus();
    console.log(digestReviewedCorpus(corpus));
  }
}
