import * as defaultAnnotationApi from '../annotate.js';
import { createSurfaceController } from '../surface-fit.js';
import { createBundleLoader } from './bundle-loader.js';
import { createSlideFrame } from './slide-frame.js';

const DESIGN_WIDTH = 1920;
const DESIGN_HEIGHT = 1080;
const ANIMATION_ACTIONS = Object.freeze(new Map([
  ['animation-back', 'back'],
  ['animation-forward', 'forward'],
  ['animation-play', 'play'],
  ['animation-pause', 'pause'],
]));
const RUNTIME_ERROR_CODES = Object.freeze(new Set([
  'SLIDE_STARTUP_TIMEOUT',
  'SLIDE_RUNTIME_ERROR',
]));
const EDITABLE_ELEMENTS = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON']);
const FATAL_MESSAGE = 'This presentation is unavailable. Refresh the page to try again.';

function decodeHash(hash) {
  if (typeof hash !== 'string' || hash.length < 2 || hash[0] !== '#') return null;
  try {
    const value = decodeURIComponent(hash.slice(1));
    return value || null;
  } catch {
    return null;
  }
}

function hashIndex(slides, hash) {
  const anchor = decodeHash(hash);
  if (!anchor) return { index: 0, valid: false };
  const index = slides.findIndex(slide => slide.anchor === anchor);
  return index < 0 ? { index: 0, valid: false } : { index, valid: true };
}

function isEditableTarget(target) {
  let node = target;
  while (node && typeof node === 'object') {
    if (EDITABLE_ELEMENTS.has(String(node.tagName || '').toUpperCase())
      || node.isContentEditable === true) return true;
    const contentEditable = node.getAttribute?.('contenteditable');
    if (contentEditable === '' || contentEditable === 'true'
      || contentEditable === 'plaintext-only') return true;
    node = node.parentElement;
  }
  return false;
}

function required(root, selector) {
  const value = root?.querySelector?.(selector);
  if (!value) throw new Error('Audience shell configuration is incomplete');
  return value;
}

function setPressed(button, pressed) {
  button.setAttribute('aria-pressed', pressed ? 'true' : 'false');
}

export async function initStudioAudience({
  root,
  slug,
  apiBase,
  fetchImpl = globalThis.fetch,
  createLoader = createBundleLoader,
  createFrame = createSlideFrame,
  createSurface = createSurfaceController,
  annotationApi = defaultAnnotationApi,
  documentObject = globalThis.document,
  windowObject = globalThis.window,
  locationObject = globalThis.location,
  historyObject = globalThis.history,
} = {}) {
  const loading = required(root, '[data-audience-loading]');
  const fatal = required(root, '[data-audience-fatal]');
  const shell = required(root, '[data-audience-shell]');

  loading.hidden = false;
  fatal.hidden = true;
  shell.hidden = true;

  let bundle;
  let loader;
  try {
    loader = createLoader({ fetchImpl, apiBase });
    bundle = await loader.loadOnce(slug);
  } catch {
    loading.hidden = true;
    fatal.textContent = FATAL_MESSAGE;
    fatal.hidden = false;
    return null;
  }

  const frameContainer = required(root, '[data-slide-frame]');
  const stage = required(root, '[data-stage]');
  const fitShell = required(root, '[data-fit-shell]');
  const fitSurface = required(root, '[data-fit-surface]');
  const unavailable = required(root, '[data-slide-unavailable]');
  const slideCount = required(root, '[data-slide-count]');
  const progress = required(root, '[data-progress]');
  const runtimeStatus = required(root, '[data-runtime-status]');
  const liveVersion = required(root, '[data-live-version]');
  const previousButton = required(root, '[data-nav="previous"]');
  const nextButton = required(root, '[data-nav="next"]');
  const fullscreenButton = required(root, '[data-nav="fullscreen"]');
  const annotationButton = required(root, '[data-annotation-toggle]');
  const animationButtons = Object.freeze(Object.fromEntries(
    [...ANIMATION_ACTIONS.entries()].map(([type, name]) => [
      type,
      required(root, `[data-animation="${name}"]`),
    ]),
  ));
  const eventRemovers = [];
  const reportedErrors = new Set();
  const apiOrigin = new URL(apiBase).origin;
  let index = hashIndex(bundle.slides, locationObject.hash).index;
  let runtimeReady = false;
  let destroyed = false;
  let hasRendered = false;
  let annotationAvailable = false;
  let renderGeneration = 0;
  let installedGeneration = 0;
  let installedSlideIndex = null;
  let frame;

  function listen(target, type, listener) {
    target?.addEventListener?.(type, listener);
    eventRemovers.push(() => target?.removeEventListener?.(type, listener));
  }

  function setRuntimeStatus(message) {
    runtimeStatus.textContent = message;
  }

  function clearAnnotations() {
    if (!annotationAvailable) return;
    try {
      annotationApi.clear?.();
    } catch {
      annotationAvailable = false;
      annotationButton.disabled = true;
    }
  }

  function resetAnimationState() {
    for (const button of Object.values(animationButtons)) button.disabled = true;
  }

  function applyAnimationState(state) {
    if (!Number.isSafeInteger(state.current) || !Number.isSafeInteger(state.total)
      || state.current < 0 || state.total < 0 || state.current > state.total
      || typeof state.playing !== 'boolean') return;
    animationButtons['animation-back'].disabled = state.current === 0;
    animationButtons['animation-forward'].disabled = state.current >= state.total;
    animationButtons['animation-play'].disabled = state.total === 0 || state.playing;
    animationButtons['animation-pause'].disabled = state.total === 0 || !state.playing;
  }

  async function reportRuntimeError(event) {
    if (!event || event.liveVersion !== bundle.webinar.liveVersion
      || !bundle.slides.some(slide => slide.id === event.slideId)
      || !RUNTIME_ERROR_CODES.has(event.code)) return false;
    const dedupeKey = `${event.slideId}:${event.code}`;
    if (reportedErrors.has(dedupeKey)) return false;
    reportedErrors.add(dedupeKey);
    const payload = {
      liveVersion: event.liveVersion,
      slideId: event.slideId,
      code: event.code,
    };
    try {
      const response = await fetchImpl(
        `${apiOrigin}/api/public/webinars/${encodeURIComponent(slug)}/runtime-events`,
        {
          method: 'POST',
          mode: 'cors',
          credentials: 'omit',
          redirect: 'error',
          keepalive: true,
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );
      return response?.ok === true || response?.status === 204;
    } catch {
      return false;
    }
  }

  function showUnavailable(code, slideIndex = index) {
    if (destroyed) return;
    runtimeReady = false;
    resetAnimationState();
    frameContainer.hidden = true;
    unavailable.textContent = 'Slide unavailable';
    unavailable.hidden = false;
    const slide = bundle.slides[slideIndex];
    setRuntimeStatus(`Slide ${slideIndex + 1} unavailable. Use Previous or Next to continue.`);
    void reportRuntimeError({
      liveVersion: bundle.webinar.liveVersion,
      slideId: slide.id,
      code: RUNTIME_ERROR_CODES.has(code) ? code : 'SLIDE_RUNTIME_ERROR',
    });
  }

  function onRuntimeState(state) {
    if (destroyed || !state || typeof state !== 'object'
      || installedGeneration !== renderGeneration || installedSlideIndex === null) return;
    const runtimeSlideIndex = installedSlideIndex;
    if (state.type === 'ready') {
      runtimeReady = true;
      unavailable.hidden = true;
      frame.send('slide-enter');
      const slide = bundle.slides[runtimeSlideIndex];
      setRuntimeStatus(`Slide ${runtimeSlideIndex + 1} of ${bundle.slides.length}: ${slide.title}.`);
      return;
    }
    if (state.type === 'error') {
      showUnavailable(state.code, runtimeSlideIndex);
      return;
    }
    if (state.type === 'animation-state' && runtimeReady) applyAnimationState(state);
  }

  try {
    frame = createFrame({
      container: frameContainer,
      bundle,
      policy: bundle.resourcePolicy,
      onRuntimeState,
    });
  } catch {
    loading.hidden = true;
    fatal.textContent = FATAL_MESSAGE;
    fatal.hidden = false;
    return null;
  }

  const surface = createSurface({
    viewport: stage,
    shell: fitShell,
    surface: fitSurface,
    getDesignSize: () => ({ width: DESIGN_WIDTH, height: DESIGN_HEIGHT }),
    margin: 0,
  });

  function writeHash(anchor, replace = false) {
    const hash = `#${encodeURIComponent(anchor)}`;
    if (replace) historyObject.replaceState(null, '', hash);
    else historyObject.pushState(null, '', hash);
  }

  function render() {
    const slide = bundle.slides[index];
    const generation = renderGeneration + 1;
    renderGeneration = generation;
    installedGeneration = 0;
    installedSlideIndex = null;
    runtimeReady = false;
    frameContainer.hidden = true;
    unavailable.hidden = true;
    resetAnimationState();
    if (hasRendered) clearAnnotations();
    slideCount.textContent = `${index + 1} / ${bundle.slides.length}`;
    progress.max = bundle.slides.length;
    progress.value = index + 1;
    progress.setAttribute('aria-valuetext', `Slide ${index + 1} of ${bundle.slides.length}`);
    previousButton.disabled = index === 0;
    nextButton.disabled = index === bundle.slides.length - 1;
    setRuntimeStatus(`Loading slide ${index + 1} of ${bundle.slides.length}.`);
    try {
      frame.showSlide(slide);
      installedSlideIndex = index;
      installedGeneration = generation;
      frameContainer.hidden = false;
    } catch {
      showUnavailable('SLIDE_RUNTIME_ERROR', index);
    }
    surface.scheduleFit?.();
    hasRendered = true;
  }

  function goToIndex(nextIndex, { updateHash = true } = {}) {
    if (destroyed || typeof nextIndex !== 'number' || !Number.isFinite(nextIndex)) return false;
    const clamped = Math.max(0, Math.min(bundle.slides.length - 1, Math.trunc(nextIndex)));
    if (clamped === index) return false;
    index = clamped;
    if (updateHash) writeHash(bundle.slides[index].anchor);
    render();
    return true;
  }

  function goToAnchor(anchor, options) {
    if (destroyed || typeof anchor !== 'string') return false;
    const nextIndex = bundle.slides.findIndex(slide => slide.anchor === anchor);
    return nextIndex < 0 ? false : goToIndex(nextIndex, options);
  }

  function next() { return goToIndex(index + 1); }
  function previous() { return goToIndex(index - 1); }

  function sendAnimation(type) {
    const button = animationButtons[type];
    if (destroyed || !runtimeReady || !button || button.disabled) return false;
    return frame.send(type) === true;
  }

  function syncFullscreen() {
    const active = documentObject.fullscreenElement === shell;
    setPressed(fullscreenButton, active);
    fullscreenButton.setAttribute('aria-label', active ? 'Exit fullscreen' : 'Enter fullscreen');
  }

  async function toggleFullscreen() {
    try {
      if (documentObject.fullscreenElement === shell) await documentObject.exitFullscreen?.();
      else await shell.requestFullscreen?.();
      syncFullscreen();
    } catch {
      syncFullscreen();
      setRuntimeStatus('Could not enter fullscreen. Presentation controls remain available.');
    }
  }

  function onKeydown(event) {
    if (!event || event.defaultPrevented || event.altKey || event.ctrlKey
      || event.metaKey || event.shiftKey || isEditableTarget(event.target)) return;
    const actions = {
      ArrowLeft: previous,
      PageUp: previous,
      ArrowRight: next,
      PageDown: next,
      Home: () => goToIndex(0),
      End: () => goToIndex(bundle.slides.length - 1),
      ' ': next,
    };
    const action = actions[event.key];
    if (!action) return;
    event.preventDefault?.();
    action();
  }

  function onHashChange() {
    if (destroyed) return;
    const resolved = hashIndex(bundle.slides, locationObject.hash);
    if (!resolved.valid) {
      writeHash(bundle.slides[0].anchor, true);
      goToIndex(0, { updateHash: false });
      return;
    }
    goToIndex(resolved.index, { updateHash: false });
  }

  listen(previousButton, 'click', previous);
  listen(nextButton, 'click', next);
  listen(fullscreenButton, 'click', toggleFullscreen);
  for (const [type, button] of Object.entries(animationButtons)) {
    listen(button, 'click', () => sendAnimation(type));
  }
  listen(annotationButton, 'click', () => {
    if (!annotationAvailable) return;
    try {
      annotationApi.toggle?.();
      setPressed(annotationButton, annotationApi.isOn?.() === true);
    } catch {
      annotationAvailable = false;
      annotationButton.disabled = true;
      setRuntimeStatus('Annotation tools are unavailable.');
    }
  });
  listen(windowObject, 'keydown', onKeydown);
  listen(windowObject, 'hashchange', onHashChange);
  const fullscreenEventTarget = typeof documentObject?.addEventListener === 'function'
    ? documentObject
    : windowObject;
  listen(fullscreenEventTarget, 'fullscreenchange', syncFullscreen);

  try {
    annotationApi.initAnnotate?.();
    annotationAvailable = true;
    for (const id of ['annotate-layer', 'annotate-bar']) {
      const annotationElement = documentObject.getElementById?.(id);
      if (annotationElement) shell.appendChild?.(annotationElement);
    }
    setPressed(annotationButton, false);
  } catch {
    annotationButton.disabled = true;
  }

  const initialHash = hashIndex(bundle.slides, locationObject.hash);
  if (!initialHash.valid) writeHash(bundle.slides[0].anchor, true);
  liveVersion.textContent = `Live version ${bundle.webinar.liveVersion}`;
  loading.hidden = true;
  shell.hidden = false;
  surface.setActive(true);
  syncFullscreen();
  render();

  return Object.freeze({
    get currentSlide() { return bundle.slides[index]; },
    goToIndex,
    goToAnchor,
    next,
    previous,
    sendAnimation,
    reportRuntimeError,
    toggleFullscreen,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      for (const remove of eventRemovers.splice(0)) remove();
      clearAnnotations();
      frame.destroy();
      surface.destroy();
    },
  });
}
