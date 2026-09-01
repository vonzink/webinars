import { fitPage, hotspotPercentStyle } from './page-geometry.js';
import { DEFAULT_STATE, reduceViewerState } from './viewer-state.js';

const createElement = (tagName, className, text) => {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
};

export function createHotspotViewModel(hotspot, explanation) {
  if (!explanation) throw new TypeError(`missing explanation for hotspot: ${hotspot.id}`);

  const model = {
    id: hotspot.id,
    ariaLabel: hotspot.accessibleLabel,
    title: explanation.title,
    body: explanation.body,
    style: hotspotPercentStyle(hotspot.bounds),
  };
  if (explanation.learnerQuestion) model.learnerQuestion = explanation.learnerQuestion;
  return model;
}

const LENS_SIZE = 150;
const LENS_MAGNIFICATION = 1.8;
const LENS_RAISE = 170;

export function initViewer({ root, documents, explanations, hotspots }) {
  if (!root) throw new TypeError('viewer root is required');

  const pages = documents.flatMap(document => document.pages.map(page => ({ ...page, document })));
  const pageIds = new Set(pages.map(page => page.id));
  const pageNav = root.querySelector('[data-page-nav]');
  const viewerTools = root.querySelector('[data-viewer-tools]');
  const documentStage = root.querySelector('[data-document-stage]');
  const explanationPanel = root.querySelector('[data-explanation-panel]');
  const viewerDocument = root.ownerDocument;
  const region = documentStage.parentElement;
  let state = { ...DEFAULT_STATE };
  let animationFrame = 0;
  let hoveredHotspotId = null;

  /* Magnify lens — one region-level element so the page canvas never clips it. */
  const lens = createElement('div', 'magnifier-lens');
  lens.dataset.magnifierLens = '';
  lens.setAttribute('aria-hidden', 'true');
  lens.hidden = true;
  region.append(lens);

  /* Floating decoder card, fixed bottom-right until dragged. */
  const decoderWrap = createElement('div', 'decoder-wrap');
  decoderWrap.dataset.decoderCard = '';
  region.append(decoderWrap);
  let cardOffset = null;

  const hideLens = () => { lens.hidden = true; };

  const positionLens = event => {
    const canvas = documentStage.querySelector('[data-page-canvas]');
    if (!canvas) return hideLens();
    const canvasRect = canvas.getBoundingClientRect();
    const regionRect = region.getBoundingClientRect();
    if (canvasRect.width === 0 || canvasRect.height === 0) return hideLens();

    const cx = event.clientX - canvasRect.left;
    const cy = event.clientY - canvasRect.top;
    const page = pages.find(candidate => candidate.id === state.pageId);
    lens.style.backgroundImage = page ? `url("${page.image}")` : 'none';
    lens.style.left = `${event.clientX - regionRect.left - LENS_SIZE / 2}px`;
    lens.style.top = `${event.clientY - regionRect.top - LENS_RAISE}px`;
    lens.style.backgroundSize = `${canvasRect.width * LENS_MAGNIFICATION}px ${canvasRect.height * LENS_MAGNIFICATION}px`;
    lens.style.backgroundPosition = `${LENS_SIZE / 2 - cx * LENS_MAGNIFICATION}px ${LENS_SIZE / 2 - cy * LENS_MAGNIFICATION}px`;
    lens.hidden = false;
  };

  const modelFor = hotspotId => {
    const hotspot = hotspots.find(candidate => candidate.id === hotspotId);
    return hotspot ? createHotspotViewModel(hotspot, explanations[hotspot.explanationId]) : null;
  };

  const buildAskCallout = question => {
    const callout = createElement('p', 'explanation-question');
    callout.append(createElement('b', '', 'Ask your lender: '), viewerDocument.createTextNode(question));
    return callout;
  };

  const renderDecoderCard = () => {
    const active = modelFor(state.selectedHotspotId) || modelFor(hoveredHotspotId);
    const isPinned = Boolean(state.selectedHotspotId) && active?.id === state.selectedHotspotId;

    if (!active) {
      cardOffset = null;
      decoderWrap.style.left = '';
      decoderWrap.style.top = '';
      decoderWrap.style.right = '';
      decoderWrap.style.bottom = '';
      const empty = createElement('div', 'decoder-empty');
      const lead = createElement('b', '', 'Explore the document.');
      empty.append(lead, viewerDocument.createTextNode(' Point at any highlighted line to magnify it — click to pin the plain-English explanation here.'));
      decoderWrap.replaceChildren(empty);
      return;
    }

    const documentName = pages.find(candidate => candidate.id === state.pageId)?.document.title ?? '';
    const stack = createElement('div', 'decoder-stack');
    const card = createElement('article', 'decoder-card');
    card.setAttribute('aria-label', active.title);

    const tagRow = createElement('div', 'decoder-tag-row');
    tagRow.dataset.decoderDrag = '';
    tagRow.append(createElement('p', 'decoder-tag', `Decoded · ${documentName}`));
    if (isPinned) {
      const unpin = createElement('button', 'decoder-unpin', 'Pinned ✕');
      unpin.type = 'button';
      unpin.setAttribute('aria-label', `Unpin ${active.title}`);
      unpin.addEventListener('click', () => dispatch({ type: 'clear-selection' }));
      tagRow.append(unpin);
    }

    card.append(tagRow, createElement('h2', 'decoder-title', active.title), createElement('p', 'decoder-body', active.body));
    if (active.learnerQuestion) card.append(buildAskCallout(active.learnerQuestion));
    stack.append(card);
    decoderWrap.replaceChildren(stack);
    if (cardOffset) {
      decoderWrap.style.left = `${cardOffset.x}px`;
      decoderWrap.style.top = `${cardOffset.y}px`;
      decoderWrap.style.right = 'auto';
      decoderWrap.style.bottom = 'auto';
    }

    tagRow.addEventListener('pointerdown', event => {
      if (event.target.closest('.decoder-unpin')) return;
      event.preventDefault();
      const rect = decoderWrap.getBoundingClientRect();
      const start = { x: rect.left, y: rect.top };
      const originX = event.clientX;
      const originY = event.clientY;
      decoderWrap.classList.add('is-dragging');
      const move = moveEvent => {
        cardOffset = {
          x: Math.max(8, Math.min(window.innerWidth - 120, start.x + moveEvent.clientX - originX)),
          y: Math.max(8, Math.min(window.innerHeight - 80, start.y + moveEvent.clientY - originY)),
        };
        decoderWrap.style.left = `${cardOffset.x}px`;
        decoderWrap.style.top = `${cardOffset.y}px`;
        decoderWrap.style.right = 'auto';
        decoderWrap.style.bottom = 'auto';
      };
      const stop = () => {
        decoderWrap.classList.remove('is-dragging');
        viewerDocument.removeEventListener('pointermove', move);
        viewerDocument.removeEventListener('pointerup', stop);
      };
      viewerDocument.addEventListener('pointermove', move);
      viewerDocument.addEventListener('pointerup', stop);
    });
  };

  const renderNavigation = () => {
    if (!pageNav.querySelector('[data-page-button]')) {
      const heading = createElement('h2', 'page-nav-heading', 'Disclosure pages');
      pageNav.append(heading);

      for (const document of documents) {
        const group = createElement('section', 'page-nav-group');
        group.setAttribute('aria-labelledby', `${document.id}-page-group`);

        const label = createElement('h3', 'page-nav-label', document.title);
        label.id = `${document.id}-page-group`;
        group.append(label);

        const buttons = createElement('div', 'page-nav-buttons');
        for (const page of document.pages) {
          const button = createElement('button', 'page-button');
          button.type = 'button';
          button.dataset.pageButton = '';
          button.dataset.pageId = page.id;
          button.setAttribute('aria-label', `${document.title}, page ${page.number} of ${document.pages.length}`);

          const thumb = createElement('img', 'page-thumb');
          thumb.src = page.image;
          thumb.alt = '';
          thumb.loading = 'lazy';
          thumb.draggable = false;
          thumb.setAttribute('aria-hidden', 'true');

          const caption = createElement('span', 'page-button-caption', `Page ${page.number}`);
          button.append(thumb, caption);
          button.addEventListener('click', () => dispatch({ type: 'select-page', pageId: page.id }));
          buttons.append(button);
        }
        group.append(buttons);
        pageNav.append(group);
      }

      const footer = createElement('p', 'page-nav-footer');
      footer.append(
        viewerDocument.createTextNode('Mountain State Financial Group, LLC'),
        createElement('br'),
        viewerDocument.createTextNode('NMLS# 1314257 · Equal Housing Lender'),
        createElement('br'),
      );
      footer.append(Object.assign(createElement('span', 'footer-soft', 'Sample forms for education only.'), {}));
      pageNav.append(footer);
    }

    for (const button of pageNav.querySelectorAll('[data-page-button]')) {
      if (button.dataset.pageId === state.pageId) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    }
  };

  const renderTools = () => {
    const actions = [
      ['fit', 'Fit', 'Fit'],
      ['zoom-out', 'Zoom out', '−'],
      ['zoom-in', 'Zoom in', '＋'],
    ];
    if (!viewerTools.querySelector('[data-action]')) {
      const fit = createElement('button', 'viewer-tool', 'Fit');
      fit.type = 'button';
      fit.dataset.action = 'fit';
      const minus = createElement('button', 'viewer-tool', '−');
      minus.type = 'button';
      minus.dataset.action = 'zoom-out';
      minus.setAttribute('aria-label', 'Zoom out');
      const zoom = createElement('output', 'viewer-zoom');
      zoom.setAttribute('aria-label', 'Current zoom');
      const plus = createElement('button', 'viewer-tool', '＋');
      plus.type = 'button';
      plus.dataset.action = 'zoom-in';
      plus.setAttribute('aria-label', 'Zoom in');
      for (const button of [fit, minus, plus]) {
        button.addEventListener('click', () => {
          if (button.getAttribute('aria-disabled') === 'true') return;
          dispatch({ type: button.dataset.action });
        });
      }
      const fieldSelector = createElement('section', 'mobile-field-selector');
      fieldSelector.dataset.mobileFieldSelector = '';
      fieldSelector.setAttribute('aria-label', 'Fields on this page');
      const fieldLabel = createElement('p', 'mobile-field-label', 'Fields on this page');
      const fieldList = createElement('div', 'mobile-field-list');
      fieldList.dataset.mobileFieldList = '';
      fieldSelector.append(fieldLabel, fieldList);
      viewerTools.append(fit, minus, zoom, plus, fieldSelector);
    }

    for (const [action] of actions) {
      const button = viewerTools.querySelector(`[data-action="${action}"]`);
      if (action === 'fit') button.setAttribute('aria-pressed', String(state.zoom === 1));
      else button.removeAttribute('aria-pressed');
      button.setAttribute('aria-disabled', String(
        ((action === 'fit' || action === 'zoom-out') && state.zoom === 1)
        || (action === 'zoom-in' && state.zoom === 2),
      ));
    }
    viewerTools.querySelector('.viewer-zoom').textContent = `${Math.round(state.zoom * 100)}%`;

    const fieldList = viewerTools.querySelector('[data-mobile-field-list]');
    const pageHotspots = hotspots
      .filter(hotspot => hotspot.pageId === state.pageId)
      .sort((a, b) => a.readingOrder - b.readingOrder);
    if (fieldList.dataset.pageId !== state.pageId) {
      const buttons = pageHotspots.map(hotspot => {
        const button = createElement('button', 'mobile-field-button', hotspot.fieldLabel);
        button.type = 'button';
        button.dataset.mobileFieldId = hotspot.id;
        button.setAttribute('aria-label', hotspot.accessibleLabel);
        button.addEventListener('click', () => dispatch({ type: 'select-hotspot', hotspotId: hotspot.id }));
        return button;
      });
      fieldList.replaceChildren(...buttons);
      fieldList.dataset.pageId = state.pageId;
    }
    for (const button of fieldList.querySelectorAll('[data-mobile-field-id]')) {
      button.setAttribute('aria-pressed', String(button.dataset.mobileFieldId === state.selectedHotspotId));
    }
  };

  const renderPageGeometry = () => {
    const page = pages.find(candidate => candidate.id === state.pageId);
    const canvas = documentStage.querySelector('[data-page-canvas]');
    if (!page || !canvas) return;

    const stageStyle = getComputedStyle(documentStage);
    const horizontalInset = parseFloat(stageStyle.paddingLeft) + parseFloat(stageStyle.paddingRight);
    const verticalInset = parseFloat(stageStyle.paddingTop) + parseFloat(stageStyle.paddingBottom);
    const availableWidth = Math.max(1, documentStage.clientWidth - horizontalInset);
    const availableHeight = Math.max(1, documentStage.clientHeight - verticalInset);
    const geometry = fitPage({
      intrinsicWidth: page.width,
      intrinsicHeight: page.height,
      availableWidth,
      availableHeight,
      zoom: state.zoom,
    });
    canvas.style.width = `${geometry.width}px`;
    canvas.style.height = `${geometry.height}px`;
  };

  const renderPage = () => {
    const page = pages.find(candidate => candidate.id === state.pageId);
    if (!page) return;

    const currentCanvas = documentStage.querySelector('[data-page-canvas]');
    if (currentCanvas?.dataset.pageId === page.id) {
      for (const button of currentCanvas.querySelectorAll('[data-hotspot-id]')) {
        button.setAttribute('aria-pressed', String(button.dataset.hotspotId === state.selectedHotspotId));
      }
      renderPageGeometry();
      return;
    }

    hoveredHotspotId = null;
    hideLens();

    const canvas = createElement('div', 'page-canvas');
    canvas.dataset.pageCanvas = '';
    canvas.dataset.pageId = page.id;
    canvas.setAttribute('role', 'group');

    const pageHeading = createElement('h2', 'page-canvas-heading', `${page.document.title}, page ${page.number}`);
    pageHeading.dataset.pageHeading = '';
    pageHeading.id = `${page.id}-heading`;
    pageHeading.tabIndex = -1;
    canvas.setAttribute('aria-labelledby', pageHeading.id);

    const image = createElement('img', 'page-image');
    image.dataset.pageImage = '';
    image.alt = page.alt;
    image.width = page.width;
    image.height = page.height;
    image.draggable = false;

    const hotspotLayer = createElement('div', 'hotspot-layer');
    hotspotLayer.dataset.hotspotLayer = '';
    hotspotLayer.setAttribute('aria-label', 'Interactive disclosure fields');

    const pageHotspots = hotspots
      .filter(hotspot => hotspot.pageId === page.id)
      .sort((a, b) => a.readingOrder - b.readingOrder);
    for (const hotspot of pageHotspots) {
      const model = createHotspotViewModel(hotspot, explanations[hotspot.explanationId]);
      const button = createElement('button', 'hotspot');
      button.type = 'button';
      button.dataset.hotspotId = model.id;
      button.setAttribute('aria-label', model.ariaLabel);
      button.setAttribute('aria-pressed', String(model.id === state.selectedHotspotId));
      Object.assign(button.style, model.style);
      button.addEventListener('click', () => dispatch({ type: 'select-hotspot', hotspotId: model.id }));
      button.addEventListener('pointerenter', event => {
        hoveredHotspotId = model.id;
        if (!state.selectedHotspotId) positionLens(event);
        renderDecoderCard();
      });
      button.addEventListener('pointermove', event => {
        if (hoveredHotspotId === model.id && !state.selectedHotspotId) positionLens(event);
      });
      button.addEventListener('pointerleave', () => {
        if (hoveredHotspotId === model.id) hoveredHotspotId = null;
        hideLens();
        renderDecoderCard();
      });
      hotspotLayer.append(button);
    }

    image.addEventListener('error', () => {
      hotspotLayer.hidden = true;
      if (!canvas.isConnected || documentStage.querySelector('[data-page-canvas]') !== canvas) return;

      const unavailable = createElement(
        'p',
        'page-unavailable',
        'This disclosure page is temporarily unavailable.',
      );
      unavailable.dataset.pageUnavailable = '';
      unavailable.setAttribute('role', 'status');
      documentStage.replaceChildren(unavailable);
    }, { once: true });

    canvas.append(pageHeading, image, hotspotLayer);
    documentStage.replaceChildren(canvas);
    renderPageGeometry();
    image.src = page.image;
  };

  const renderExplanation = () => {
    const hotspot = hotspots.find(candidate => candidate.id === state.selectedHotspotId);
    if (hotspot) {
      const model = createHotspotViewModel(hotspot, explanations[hotspot.explanationId]);
      const content = createElement('div', 'explanation-content');
      content.dataset.selectedExplanation = '';

      const close = createElement('button', 'explanation-close', 'Close');
      close.type = 'button';
      close.setAttribute('aria-label', 'Close explanation');
      close.addEventListener('click', () => dispatch({ type: 'clear-selection' }));

      const kicker = createElement('p', 'explanation-kicker', 'Selected item');
      const title = createElement('h2', '', model.title);
      const body = createElement('p', 'explanation-body', model.body);
      content.append(close, kicker, title, body);

      if (model.learnerQuestion) {
        content.append(buildAskCallout(model.learnerQuestion));
      }

      explanationPanel.replaceChildren(content);
      return;
    }

    const instruction = createElement(
      'p',
      'explanation-instruction',
      'Choose any highlighted item on the document to learn what it means.',
    );
    explanationPanel.replaceChildren(instruction);
  };

  const render = () => {
    renderNavigation();
    renderTools();
    renderPage();
    renderDecoderCard();
    renderExplanation();
    if (state.selectedHotspotId) hideLens();
  };

  const dispatch = action => {
    const selectedBefore = state.selectedHotspotId;
    const pageChanged = action.type === 'select-page'
      && action.pageId !== state.pageId
      && pageIds.has(action.pageId);
    state = reduceViewerState(state, action, pageIds);
    render();

    if (action.type === 'clear-selection' && selectedBefore) {
      const selectedButton = [...root.querySelectorAll('[data-hotspot-id]')]
        .find(button => button.dataset.hotspotId === selectedBefore);
      selectedButton?.focus();
    } else if (pageChanged) {
      documentStage.querySelector('[data-page-heading]')?.focus();
    }
  };

  const handleKeydown = event => {
    if (event.key !== 'Escape' || !state.selectedHotspotId) return;
    event.preventDefault();
    dispatch({ type: 'clear-selection' });
  };

  const resize = () => {
    if (animationFrame) return;
    animationFrame = requestAnimationFrame(() => {
      animationFrame = 0;
      renderPageGeometry();
    });
  };

  const observer = new ResizeObserver(resize);
  observer.observe(documentStage);
  viewerDocument.addEventListener('keydown', handleKeydown);
  render();

  return {
    dispatch,
    destroy: () => {
      observer.disconnect();
      cancelAnimationFrame(animationFrame);
      viewerDocument.removeEventListener('keydown', handleKeydown);
      lens.remove();
      decoderWrap.remove();
    },
  };
}
