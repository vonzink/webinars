import {
  RUNTIME_INBOUND_TYPES,
  RUNTIME_PROTOCOL_VERSION,
} from './runtime-protocol.js';

const ASSET_VERSION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const ASSET_TOKEN = /\{\{ASSET:([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\}\}/g;
const ASSET_LIKE = /\{\{\s*asset\b/i;
const MASTER_SLIDE_TOKEN = '{{SLIDE_CONTENT}}';
const RESERVED_MOUNT_ATTRIBUTE = 'data-slide-mount';
const RAW_TEXT_ELEMENTS = new Set([
  'iframe',
  'noembed',
  'noframes',
  'noscript',
  'script',
  'style',
  'xmp',
]);
const RCDATA_ELEMENTS = new Set(['textarea', 'title']);
const NONCE = /^[A-Za-z0-9_-]{16,128}$/;
const MAX_ASSETS = 10_000;
const MAX_ORIGINS = 64;
const MAX_URL_LENGTH = 4_096;

class SlideCompositionError extends Error {
  constructor(code) {
    super('Slide composition failed');
    this.name = 'SlideCompositionError';
    this.code = code;
  }
}

function fail(code) {
  throw new SlideCompositionError(code);
}

function plainDataProperties(value, code) {
  try {
    if (!value || typeof value !== 'object' || Array.isArray(value)
      || Object.getPrototypeOf(value) !== Object.prototype) fail(code);
    const keys = Reflect.ownKeys(value);
    if (keys.some(key => typeof key !== 'string')) fail(code);
    const descriptors = Object.getOwnPropertyDescriptors(value);
    for (const key of keys) {
      const descriptor = descriptors[key];
      if (!descriptor || !descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) fail(code);
    }
    return { descriptors, keys };
  } catch (error) {
    if (error instanceof SlideCompositionError) throw error;
    fail(code);
  }
}

function ownDataString(record, key) {
  const value = rootValue(record, key);
  if (typeof value !== 'string') fail('COMPOSITION_INPUT_INVALID');
  return value;
}

function rootValue(record, key) {
  try {
    if (!record || typeof record !== 'object' || Array.isArray(record)
      || Object.getPrototypeOf(record) !== Object.prototype) fail('COMPOSITION_INPUT_INVALID');
    const descriptor = Object.getOwnPropertyDescriptor(record, key);
    if (!descriptor || !descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) {
      fail('COMPOSITION_INPUT_INVALID');
    }
    return descriptor.value;
  } catch (error) {
    if (error instanceof SlideCompositionError) throw error;
    fail('COMPOSITION_INPUT_INVALID');
  }
}

function exactHttpsOrigin(value) {
  if (typeof value !== 'string' || !value || value.length > MAX_URL_LENGTH
    || value !== value.trim() || value.includes('*')) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password
      || parsed.pathname !== '/' || parsed.search || parsed.hash || parsed.origin !== value) return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

function normalizedOriginArray(value) {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype
    || value.length > MAX_ORIGINS) fail('RESOURCE_POLICY_INVALID');
  const keys = Reflect.ownKeys(value);
  const expectedKeys = [...Array(value.length).keys()].map(String);
  if (keys.length !== expectedKeys.length + 1 || keys.at(-1) !== 'length'
    || expectedKeys.some((key, index) => keys[index] !== key)) fail('RESOURCE_POLICY_INVALID');

  const descriptors = Object.getOwnPropertyDescriptors(value);
  const origins = expectedKeys.map(key => {
    const descriptor = descriptors[key];
    if (!descriptor || !descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) {
      fail('RESOURCE_POLICY_INVALID');
    }
    const origin = exactHttpsOrigin(descriptor.value);
    if (!origin) fail('RESOURCE_POLICY_INVALID');
    return origin;
  });
  return [...new Set(origins)].sort();
}

function normalizePolicy(policy) {
  const data = plainDataProperties(policy, 'RESOURCE_POLICY_INVALID');
  const expectedKeys = ['assetOrigin', 'fontOrigins', 'stylesheetOrigins'];
  if (data.keys.length !== expectedKeys.length
    || data.keys.some(key => !expectedKeys.includes(key))
    || expectedKeys.some(key => !Object.hasOwn(data.descriptors, key))) fail('RESOURCE_POLICY_INVALID');

  const assetOrigin = exactHttpsOrigin(data.descriptors.assetOrigin.value);
  if (!assetOrigin) fail('RESOURCE_POLICY_INVALID');
  return {
    assetOrigin,
    stylesheetOrigins: normalizedOriginArray(data.descriptors.stylesheetOrigins.value),
    fontOrigins: normalizedOriginArray(data.descriptors.fontOrigins.value),
  };
}

function canonicalAssetUrl(value) {
  if (typeof value !== 'string' || !value || value.length > MAX_URL_LENGTH
    || value !== value.trim() || value.includes('*')) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password
      || parsed.search || parsed.hash || parsed.href !== value) return null;
    return parsed;
  } catch {
    return null;
  }
}

function normalizeAssetMap(assets) {
  const data = plainDataProperties(assets, 'ASSET_MAP_INVALID');
  if (data.keys.length > MAX_ASSETS) fail('ASSET_MAP_INVALID');
  const normalized = new Map();
  for (const versionId of data.keys) {
    if (!ASSET_VERSION_ID.test(versionId)) fail('ASSET_MAP_INVALID');
    const url = data.descriptors[versionId].value;
    const parsed = canonicalAssetUrl(url);
    if (!parsed) fail('ASSET_URL_INVALID');
    normalized.set(versionId, { url, origin: parsed.origin });
  }
  return normalized;
}

function replaceTokensWithMap(source, assetMap) {
  if (typeof source !== 'string') fail('COMPOSITION_INPUT_INVALID');
  ASSET_TOKEN.lastIndex = 0;
  const resolved = source.replace(ASSET_TOKEN, (_token, versionId) => {
    const asset = assetMap.get(versionId);
    if (!asset) fail('ASSET_TOKEN_UNKNOWN');
    return asset.url;
  });
  ASSET_TOKEN.lastIndex = 0;
  if (ASSET_LIKE.test(resolved)) fail('ASSET_TOKEN_INVALID');
  return resolved;
}

export function replaceAssetTokens(source, assets) {
  return replaceTokensWithMap(source, normalizeAssetMap(assets));
}

export function buildSlideCsp(policy) {
  const normalized = normalizePolicy(policy);
  return [
    "default-src 'none'",
    "connect-src 'none'",
    "script-src 'unsafe-inline'",
    ["style-src 'unsafe-inline'", ...normalized.stylesheetOrigins].join(' '),
    `img-src ${normalized.assetOrigin} data: blob:`,
    `media-src ${normalized.assetOrigin} blob:`,
    ['font-src', normalized.assetOrigin, ...normalized.fontOrigins]
      .filter((value, index, values) => values.indexOf(value) === index)
      .join(' '),
    "form-action 'none'",
    "base-uri 'none'",
    "object-src 'none'",
    "worker-src 'none'",
    "child-src 'none'",
  ].join('; ');
}

function scriptSafeJson(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
    .replace(/\$\{/g, '\\u0024{');
}

function escapeHtmlAttribute(value) {
  return value.replace(/[&<>"]/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
  })[character]);
}

function escapeStyleText(value) {
  return value.replace(/</g, '\\3c ');
}

function containsScriptElement(value) {
  return /<\s*\/?\s*script\b/i.test(value);
}

function isHtmlSpace(character) {
  return character === ' ' || character === '\t' || character === '\n'
    || character === '\f' || character === '\r';
}

function isAsciiAlpha(character) {
  if (!character) return false;
  const code = character.charCodeAt(0);
  return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}

function asciiLowercase(value) {
  return value.replace(/[A-Z]/g, character => String.fromCharCode(character.charCodeAt(0) + 32));
}

function startsAsciiCaseInsensitive(source, index, expected) {
  if (index + expected.length > source.length) return false;
  return asciiLowercase(source.slice(index, index + expected.length)) === expected;
}

function isTagNameBoundary(character) {
  return character === undefined || isHtmlSpace(character) || character === '/' || character === '>';
}

function skipTagTail(source, index) {
  let quote = null;
  for (let cursor = index; cursor < source.length; cursor += 1) {
    const character = source[cursor];
    if (quote) {
      if (character === quote) quote = null;
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === '>') {
      return cursor + 1;
    }
  }
  return source.length;
}

function skipHtmlComment(source, index) {
  if (source[index] === '>') return index + 1;
  if (source[index] === '-' && source[index + 1] === '>') return index + 2;
  for (let cursor = index; cursor < source.length; cursor += 1) {
    if (source.startsWith('-->', cursor)) return cursor + 3;
    if (source.startsWith('--!>', cursor)) return cursor + 4;
  }
  return source.length;
}

function skipBogusComment(source, index) {
  const end = source.indexOf('>', index);
  return end < 0 ? source.length : end + 1;
}

function skipRawText(source, index, tagName) {
  let cursor = index;
  while (cursor < source.length) {
    const closingTag = source.indexOf('</', cursor);
    if (closingTag < 0) return source.length;
    const nameStart = closingTag + 2;
    const nameEnd = nameStart + tagName.length;
    if (startsAsciiCaseInsensitive(source, nameStart, tagName)
      && isTagNameBoundary(source[nameEnd])) {
      return skipTagTail(source, nameEnd);
    }
    cursor = closingTag + 2;
  }
  return source.length;
}

function scanStartTag(source, index) {
  let cursor = index + 1;
  const tagNameStart = cursor;
  while (cursor < source.length && !isHtmlSpace(source[cursor])
    && source[cursor] !== '/' && source[cursor] !== '>') cursor += 1;
  const tagName = asciiLowercase(source.slice(tagNameStart, cursor));

  while (cursor < source.length) {
    while (isHtmlSpace(source[cursor])) cursor += 1;
    if (source[cursor] === '>') return { end: cursor + 1, tagName };
    if (source[cursor] === '/') {
      if (source[cursor + 1] === '>') return { end: cursor + 2, tagName };
      cursor += 1;
      continue;
    }

    const attributeStart = cursor;
    while (cursor < source.length && !isHtmlSpace(source[cursor])
      && source[cursor] !== '/' && source[cursor] !== '>' && source[cursor] !== '=') {
      cursor += 1;
    }
    if (cursor === attributeStart) {
      cursor += 1;
      continue;
    }
    if (asciiLowercase(source.slice(attributeStart, cursor)) === RESERVED_MOUNT_ATTRIBUTE) {
      return { end: cursor, reservedMount: true, tagName };
    }

    while (isHtmlSpace(source[cursor])) cursor += 1;
    if (source[cursor] !== '=') continue;
    cursor += 1;
    while (isHtmlSpace(source[cursor])) cursor += 1;
    const quote = source[cursor] === '"' || source[cursor] === "'" ? source[cursor] : null;
    if (quote) {
      cursor += 1;
      while (cursor < source.length && source[cursor] !== quote) cursor += 1;
      if (cursor < source.length) cursor += 1;
    } else {
      while (cursor < source.length && !isHtmlSpace(source[cursor]) && source[cursor] !== '>') {
        cursor += 1;
      }
    }
  }
  return { end: source.length, tagName };
}

function containsReservedMountAttribute(source) {
  let cursor = 0;
  while (cursor < source.length) {
    const tagOpen = source.indexOf('<', cursor);
    if (tagOpen < 0) return false;
    if (source.startsWith('<!--', tagOpen)) {
      cursor = skipHtmlComment(source, tagOpen + 4);
      continue;
    }
    if (source[tagOpen + 1] === '!' || source[tagOpen + 1] === '?') {
      cursor = skipBogusComment(source, tagOpen + 2);
      continue;
    }
    if (source[tagOpen + 1] === '/') {
      cursor = skipTagTail(source, tagOpen + 2);
      continue;
    }
    if (!isAsciiAlpha(source[tagOpen + 1])) {
      cursor = tagOpen + 1;
      continue;
    }

    const tag = scanStartTag(source, tagOpen);
    if (tag.reservedMount) return true;
    cursor = tag.end;
    if (tag.tagName === 'plaintext') return false;
    if (RAW_TEXT_ELEMENTS.has(tag.tagName) || RCDATA_ELEMENTS.has(tag.tagName)) {
      cursor = skipRawText(source, cursor, tag.tagName);
    }
  }
  return false;
}

function sandboxRuntimeBootstrap(config) {
  'use strict';

  var ACTION_ID = /^[a-z][a-z0-9-]{0,63}$/;
  var EMPTY_TYPES = new Set([
    'slide-enter',
    'slide-exit',
    'animation-back',
    'animation-forward',
    'animation-play',
    'animation-pause',
  ]);
  var INBOUND_TYPES = new Set(config.inboundTypes);
  var MAX_ANIMATION_ITEMS = 10000;
  var MAX_SOURCE_LOCATION = 1000000;

  function dataProperties(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    if (Object.getPrototypeOf(value) !== Object.prototype) return null;
    var keys = Reflect.ownKeys(value);
    if (keys.some(function hasSymbol(key) { return typeof key !== 'string'; })) return null;
    var descriptors = Object.getOwnPropertyDescriptors(value);
    for (var index = 0; index < keys.length; index += 1) {
      var descriptor = descriptors[keys[index]];
      if (!descriptor || !descriptor.enumerable
        || !Object.prototype.hasOwnProperty.call(descriptor, 'value')) return null;
    }
    return { descriptors: descriptors, keys: keys };
  }

  function exactProperties(value, required, optional) {
    var data = dataProperties(value);
    if (!data) return null;
    var allowed = required.concat(optional || []);
    if (data.keys.some(function isExtra(key) { return !allowed.includes(key); })) return null;
    if (required.some(function isMissing(key) {
      return !Object.prototype.hasOwnProperty.call(data.descriptors, key);
    })) return null;
    return data.descriptors;
  }

  function emptyPayload(value) {
    if (value === undefined) return {};
    return exactProperties(value, [], []) ? {} : null;
  }

  function actionPayload(value) {
    var descriptors = exactProperties(value, ['actionId'], []);
    if (!descriptors) return null;
    var actionId = descriptors.actionId.value;
    return typeof actionId === 'string' && ACTION_ID.test(actionId) ? { actionId: actionId } : null;
  }

  function animationPayload(value) {
    var descriptors = exactProperties(value, ['current', 'total', 'playing'], []);
    if (!descriptors) return null;
    var current = descriptors.current.value;
    var total = descriptors.total.value;
    var playing = descriptors.playing.value;
    if (!Number.isSafeInteger(current) || !Number.isSafeInteger(total)
      || current < 0 || total < 0 || current > total || total > MAX_ANIMATION_ITEMS
      || typeof playing !== 'boolean') return null;
    return { current: current, total: total, playing: playing };
  }

  function normalizeInbound(data) {
    var descriptors = exactProperties(data, ['v', 'nonce', 'type'], ['payload']);
    if (!descriptors) return null;
    var type = descriptors.type.value;
    if (descriptors.v.value !== config.version || descriptors.nonce.value !== config.nonce
      || typeof type !== 'string' || !INBOUND_TYPES.has(type)) return null;
    var rawPayload = Object.prototype.hasOwnProperty.call(descriptors, 'payload')
      ? descriptors.payload.value
      : undefined;
    var payload = EMPTY_TYPES.has(type) ? emptyPayload(rawPayload) : actionPayload(rawPayload);
    return payload ? { v: config.version, nonce: config.nonce, type: type, payload: payload } : null;
  }

  function normalizeEmitted(type, payload) {
    if (type === 'animation-state') return animationPayload(payload);
    if (type === 'supported-overlay-state' || type === 'supported-calculator-state') {
      return actionPayload(payload);
    }
    return null;
  }

  function postFixed(type, payload) {
    parent.postMessage({
      v: config.version,
      nonce: config.nonce,
      type: type,
      payload: payload,
    }, '*');
  }

  function emit(type, payload) {
    var normalized = normalizeEmitted(type, payload);
    if (!normalized) return false;
    postFixed(type, normalized);
    return true;
  }

  function reportRuntimeError(event) {
    var payload = { code: 'SLIDE_RUNTIME_ERROR' };
    var line = event && event.lineno;
    var column = event && event.colno;
    if (config.previewMode && Number.isSafeInteger(line) && line >= 1 && line <= MAX_SOURCE_LOCATION
      && Number.isSafeInteger(column) && column >= 0 && column <= MAX_SOURCE_LOCATION) {
      payload.line = line;
      payload.column = column;
    }
    postFixed('runtime-error', payload);
  }

  window.addEventListener('message', function receiveParentMessage(event) {
    if (event.source !== parent) return;
    var message = normalizeInbound(event.data);
    if (!message) return;
    window.dispatchEvent(new CustomEvent('msfg:' + message.type, { detail: message.payload }));
  });

  window.addEventListener('error', function captureRuntimeError(event) {
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    reportRuntimeError(event);
  });

  window.addEventListener('unhandledrejection', function captureRuntimeRejection(event) {
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    reportRuntimeError(null);
  });

  window.addEventListener('msfg:runtime-source-ready', function announceReady() {
    postFixed('runtime-ready', {});
  });

  Object.defineProperty(window, 'msfgRuntime', {
    value: Object.freeze({ emit: emit }),
    configurable: false,
    enumerable: false,
    writable: false,
  });

  var slideScript = document.createElement('script');
  slideScript.textContent = config.source
    + '\nwindow.dispatchEvent(new Event("msfg:runtime-source-ready"));';
  try {
    document.body.appendChild(slideScript);
  } catch (_error) {
    reportRuntimeError(null);
  }
}

export function composeSlideDocument(input) {
  const master = rootValue(input, 'master');
  const slide = rootValue(input, 'slide');
  const assets = rootValue(input, 'assets');
  const policy = rootValue(input, 'policy');
  const nonce = rootValue(input, 'nonce');
  const previewMode = rootValue(input, 'previewMode');
  if (typeof nonce !== 'string' || !NONCE.test(nonce) || typeof previewMode !== 'boolean') {
    fail('COMPOSITION_INPUT_INVALID');
  }

  const masterHtml = ownDataString(master, 'html');
  const masterCss = ownDataString(master, 'css');
  const slideHtml = ownDataString(slide, 'html');
  const slideCss = ownDataString(slide, 'css');
  const slideJavascript = ownDataString(slide, 'javascript');
  const firstMount = masterHtml.indexOf(MASTER_SLIDE_TOKEN);
  if (firstMount < 0 || firstMount !== masterHtml.lastIndexOf(MASTER_SLIDE_TOKEN)) {
    fail('MASTER_SLIDE_TOKEN_INVALID');
  }
  if (containsReservedMountAttribute(masterHtml) || containsReservedMountAttribute(slideHtml)) {
    fail('RESERVED_MOUNT_ATTRIBUTE');
  }
  if (containsScriptElement(masterHtml) || containsScriptElement(slideHtml)) {
    fail('HTML_SCRIPT_FORBIDDEN');
  }

  const normalizedPolicy = normalizePolicy(policy);
  const assetMap = normalizeAssetMap(assets);
  for (const asset of assetMap.values()) {
    if (asset.origin !== normalizedPolicy.assetOrigin) fail('ASSET_ORIGIN_MISMATCH');
  }

  const resolvedMasterHtml = replaceTokensWithMap(masterHtml, assetMap);
  const resolvedSlideHtml = replaceTokensWithMap(slideHtml, assetMap);
  const resolvedMount = resolvedMasterHtml.indexOf(MASTER_SLIDE_TOKEN);
  const composedHtml = resolvedMasterHtml.slice(0, resolvedMount)
    + resolvedSlideHtml
    + resolvedMasterHtml.slice(resolvedMount + MASTER_SLIDE_TOKEN.length);
  const resolvedMasterCss = replaceTokensWithMap(masterCss, assetMap);
  const resolvedSlideCss = replaceTokensWithMap(slideCss, assetMap);
  const resolvedSlideJavascript = replaceTokensWithMap(slideJavascript, assetMap);
  const csp = buildSlideCsp(normalizedPolicy);
  const bootstrapData = scriptSafeJson({
    version: RUNTIME_PROTOCOL_VERSION,
    nonce,
    previewMode,
    inboundTypes: RUNTIME_INBOUND_TYPES,
    source: resolvedSlideJavascript,
  });
  const bootstrap = `/* sandbox-runtime-bootstrap */\n(${sandboxRuntimeBootstrap.toString()})(${bootstrapData});`;

  return [
    '<!doctype html>',
    '<html><head>',
    '<meta charset="utf-8">',
    '<meta name="referrer" content="no-referrer">',
    `<meta http-equiv="Content-Security-Policy" content="${escapeHtmlAttribute(csp)}">`,
    `<style data-studio-master-css>${escapeStyleText(resolvedMasterCss)}</style>`,
    `<style data-studio-slide-css>${escapeStyleText(resolvedSlideCss)}</style>`,
    '</head><body>',
    `<div data-slide-mount>${composedHtml}</div>`,
    `<script>${bootstrap}</script>`,
    '</body></html>',
  ].join('');
}
