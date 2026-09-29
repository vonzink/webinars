const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const ASSET_TOKEN = /\{\{ASSET:([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\}\}/g;
const ASSET_LIKE = /\{\{\s*asset\b/i;
const MASTER_TOKEN = '{{SLIDE_CONTENT}}';
const JSON_CONTENT_TYPE = /^application\/json(?:\s*;\s*charset\s*=\s*utf-8)?\s*$/i;
const MAX_SLIDES = 1_000;
const MAX_ASSETS = 10_000;
const MAX_TEXT = 1_000_000;
const MAX_ORIGINS = 64;
const MAX_PUBLIC_IDENTIFIER = 190;

export class BundleLoadError extends Error {
  constructor(code) {
    super('Unable to load webinar');
    this.name = 'BundleLoadError';
    this.code = code;
  }
}
function fail(code) {
  throw new BundleLoadError(code);
}

function dataRecord(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || Object.getPrototypeOf(value) !== Object.prototype) return null;
  const keys = Reflect.ownKeys(value);
  if (keys.some(key => typeof key !== 'string')) return null;
  const descriptors = Object.getOwnPropertyDescriptors(value);
  for (const key of keys) {
    const descriptor = descriptors[key];
    if (!descriptor || !descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return null;
  }
  return { descriptors, keys };
}

function exactRecord(value, keys) {
  const data = dataRecord(value);
  if (!data || data.keys.length !== keys.length
    || data.keys.some(key => !keys.includes(key))
    || keys.some(key => !Object.hasOwn(data.descriptors, key))) return null;
  return data.descriptors;
}

function exactArray(value, maxLength) {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype
    || value.length > maxLength) return null;
  const keys = Reflect.ownKeys(value);
  const expected = Array.from({ length: value.length }, (_unused, index) => String(index));
  if (keys.length !== expected.length + 1 || keys.at(-1) !== 'length'
    || expected.some((key, index) => keys[index] !== key)) return null;
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const values = [];
  for (const key of expected) {
    const descriptor = descriptors[key];
    if (!descriptor || !descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return null;
    values.push(descriptor.value);
  }
  return values;
}

function boundedString(value, { min = 0, max = MAX_TEXT, pattern = null } = {}) {
  return typeof value === 'string' && value.length >= min && value.length <= max
    && (!pattern || pattern.test(value));
}

function canonicalOrigin(value) {
  if (!boundedString(value, { min: 1, max: 4_096 }) || value !== value.trim()
    || value.includes('*')) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/'
      || url.search || url.hash || url.origin !== value) return null;
    return url.origin;
  } catch {
    return null;
  }
}

function canonicalAssetUrl(value) {
  if (!boundedString(value, { min: 1, max: 4_096 }) || value !== value.trim()
    || value.includes('*')) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash
      || url.href !== value) return null;
    return url;
  } catch {
    return null;
  }
}

function normalizeOriginList(value) {
  const values = exactArray(value, MAX_ORIGINS);
  if (!values) fail('BUNDLE_SCHEMA_INVALID');
  const origins = values.map(canonicalOrigin);
  if (origins.some(origin => !origin) || new Set(origins).size !== origins.length) {
    fail('BUNDLE_SCHEMA_INVALID');
  }
  return Object.freeze(origins);
}

function collectAssetTokens(source, referenced) {
  if (!boundedString(source)) fail('BUNDLE_SCHEMA_INVALID');
  ASSET_TOKEN.lastIndex = 0;
  let match;
  while ((match = ASSET_TOKEN.exec(source))) referenced.add(match[1]);
  ASSET_TOKEN.lastIndex = 0;
  const withoutValidTokens = source.replace(ASSET_TOKEN, '');
  ASSET_TOKEN.lastIndex = 0;
  if (ASSET_LIKE.test(withoutValidTokens)) fail('BUNDLE_SCHEMA_INVALID');
}

function normalizeBundle(value, requestedSlug) {
  const root = exactRecord(value, [
    'schemaVersion',
    'webinar',
    'master',
    'slides',
    'assets',
    'resourcePolicy',
  ]);
  if (!root || root.schemaVersion.value !== 1) fail('BUNDLE_SCHEMA_INVALID');

  const webinar = exactRecord(root.webinar.value, ['id', 'slug', 'title', 'liveVersion']);
  if (!webinar || !Number.isSafeInteger(webinar.id.value) || webinar.id.value < 1
    || webinar.slug.value !== requestedSlug
    || !boundedString(webinar.slug.value, { min: 1, max: MAX_PUBLIC_IDENTIFIER, pattern: SLUG })
    || !boundedString(webinar.title.value, { min: 1, max: 512 })
    || !Number.isSafeInteger(webinar.liveVersion.value) || webinar.liveVersion.value < 1) {
    fail('BUNDLE_SCHEMA_INVALID');
  }

  const master = exactRecord(root.master.value, ['html', 'css']);
  if (!master || !boundedString(master.html.value) || !boundedString(master.css.value)) {
    fail('BUNDLE_SCHEMA_INVALID');
  }
  const firstToken = master.html.value.indexOf(MASTER_TOKEN);
  if (firstToken < 0 || firstToken !== master.html.value.lastIndexOf(MASTER_TOKEN)) {
    fail('BUNDLE_SCHEMA_INVALID');
  }

  const policy = exactRecord(root.resourcePolicy.value, [
    'assetOrigin',
    'stylesheetOrigins',
    'fontOrigins',
  ]);
  if (!policy) fail('BUNDLE_SCHEMA_INVALID');
  const assetOrigin = canonicalOrigin(policy.assetOrigin.value);
  if (!assetOrigin) fail('BUNDLE_SCHEMA_INVALID');
  const resourcePolicy = Object.freeze({
    assetOrigin,
    stylesheetOrigins: normalizeOriginList(policy.stylesheetOrigins.value),
    fontOrigins: normalizeOriginList(policy.fontOrigins.value),
  });

  const assetData = dataRecord(root.assets.value);
  if (!assetData || assetData.keys.length > MAX_ASSETS) fail('BUNDLE_SCHEMA_INVALID');
  const assets = {};
  for (const versionId of assetData.keys) {
    const url = canonicalAssetUrl(assetData.descriptors[versionId].value);
    if (!UUID.test(versionId) || !url || url.origin !== assetOrigin) fail('BUNDLE_SCHEMA_INVALID');
    assets[versionId] = url.href;
  }
  Object.freeze(assets);

  const rawSlides = exactArray(root.slides.value, MAX_SLIDES);
  if (!rawSlides || rawSlides.length === 0) fail('BUNDLE_SCHEMA_INVALID');
  const ids = new Set();
  const anchors = new Set();
  const referenced = new Set();
  collectAssetTokens(master.html.value, referenced);
  collectAssetTokens(master.css.value, referenced);
  const slides = rawSlides.map((rawSlide, index) => {
    const slide = exactRecord(rawSlide, [
      'id',
      'position',
      'anchor',
      'title',
      'html',
      'css',
      'javascript',
    ]);
    if (!slide || !UUID.test(slide.id.value) || ids.has(slide.id.value)
      || slide.position.value !== index
      || !boundedString(slide.anchor.value, { min: 1, max: MAX_PUBLIC_IDENTIFIER, pattern: SLUG })
      || anchors.has(slide.anchor.value)
      || !boundedString(slide.title.value, { min: 1, max: 512 })
      || !boundedString(slide.html.value) || !boundedString(slide.css.value)
      || !boundedString(slide.javascript.value)) fail('BUNDLE_SCHEMA_INVALID');
    ids.add(slide.id.value);
    anchors.add(slide.anchor.value);
    collectAssetTokens(slide.html.value, referenced);
    collectAssetTokens(slide.css.value, referenced);
    collectAssetTokens(slide.javascript.value, referenced);
    return Object.freeze({
      id: slide.id.value,
      position: index,
      anchor: slide.anchor.value,
      title: slide.title.value,
      html: slide.html.value,
      css: slide.css.value,
      javascript: slide.javascript.value,
    });
  });
  if ([...referenced].some(versionId => !Object.hasOwn(assets, versionId))) {
    fail('BUNDLE_SCHEMA_INVALID');
  }

  return Object.freeze({
    schemaVersion: 1,
    webinar: Object.freeze({
      id: webinar.id.value,
      slug: webinar.slug.value,
      title: webinar.title.value,
      liveVersion: webinar.liveVersion.value,
    }),
    master: Object.freeze({ html: master.html.value, css: master.css.value }),
    slides: Object.freeze(slides),
    assets,
    resourcePolicy,
  });
}

function normalizeApiBase(value) {
  if (!boundedString(value, { min: 1, max: 2_048 }) || value !== value.trim()) {
    fail('BUNDLE_CONFIGURATION_INVALID');
  }
  try {
    const url = new URL(value);
    const localHttp = url.protocol === 'http:' && (url.hostname === 'localhost'
      || url.hostname === '127.0.0.1' || url.hostname === '[::1]');
    if ((url.protocol !== 'https:' && !localHttp) || url.username || url.password
      || url.search || url.hash || (url.pathname !== '/' && url.pathname !== '')) {
      fail('BUNDLE_CONFIGURATION_INVALID');
    }
    return url.origin;
  } catch (error) {
    if (error instanceof BundleLoadError) throw error;
    fail('BUNDLE_CONFIGURATION_INVALID');
  }
}

async function fetchBundle(fetchImpl, apiBase, slug, captureEtag) {
  let response;
  try {
    response = await fetchImpl(
      `${apiBase}/api/public/webinars/${encodeURIComponent(slug)}/live`,
      {
        credentials: 'omit',
        headers: { Accept: 'application/json' },
        method: 'GET',
        mode: 'cors',
        redirect: 'error',
      },
    );
  } catch {
    fail('BUNDLE_NETWORK_ERROR');
  }

  try {
    if (!response || response.status !== 200 || response.ok !== true) fail('BUNDLE_HTTP_ERROR');
    const contentType = response.headers?.get?.('content-type');
    if (typeof contentType !== 'string' || !JSON_CONTENT_TYPE.test(contentType)) {
      fail('BUNDLE_CONTENT_TYPE_INVALID');
    }
    const etag = response.headers?.get?.('etag');
    if (typeof etag === 'string' && /^"[0-9a-f]{64}"$/.test(etag)) captureEtag(etag);
  } catch (error) {
    if (error instanceof BundleLoadError) throw error;
    fail('BUNDLE_HTTP_ERROR');
  }

  let body;
  try {
    body = await response.json();
  } catch {
    fail('BUNDLE_JSON_INVALID');
  }
  return normalizeBundle(body, slug);
}

export function createBundleLoader({ fetchImpl, apiBase }) {
  if (typeof fetchImpl !== 'function') fail('BUNDLE_CONFIGURATION_INVALID');
  const normalizedApiBase = normalizeApiBase(apiBase);
  let bundlePromise = null;
  let pinnedSlug = null;
  let etag = null;

  return Object.freeze({
    loadOnce(slug) {
      if (!boundedString(slug, { min: 1, max: MAX_PUBLIC_IDENTIFIER, pattern: SLUG })) {
        return Promise.reject(new BundleLoadError('BUNDLE_SLUG_INVALID'));
      }
      if (pinnedSlug !== null && slug !== pinnedSlug) {
        return Promise.reject(new BundleLoadError('BUNDLE_SESSION_SLUG_MISMATCH'));
      }
      if (!bundlePromise) {
        pinnedSlug = slug;
        bundlePromise = fetchBundle(fetchImpl, normalizedApiBase, slug, value => { etag = value; });
      }
      return bundlePromise;
    },
    resetForTest() {
      bundlePromise = null;
      pinnedSlug = null;
      etag = null;
    },
    getDiagnostics() {
      return Object.freeze({ etag, slug: pinnedSlug });
    },
  });
}
