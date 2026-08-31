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

export function initViewer({ root, documents, explanations, hotspots }) {
  if (!root) throw new TypeError('viewer root is required');

  const pages = documents.flatMap(document => document.pages.map(page => ({ ...page, document })));
  const pageIds = new Set(pages.map(page => page.id));
  const pageNav = root.querySelector('[data-page-nav]');
  const viewerTools = root.querySelector('[data-viewer-tools]');
  const documentStage = root.querySelector('[data-document-stage]');
  const explanationPanel = root.querySelector('[data-explanation-panel]');
  const viewerDocument = root.ownerDocument;
  let state = { ...DEFAULT_STATE };
  let animationFrame = 0;

  const bubbleLayer = createElement('div', 'bubble-layer');
  bubbleLayer.dataset.bubbleLayer = '';
  documentStage.parentElement.append(bubbleLayer);
  const bubblePositions = new Map();
  let bubbleSpawnCount = 0;

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

          const caption = createElement('span', 'page-button-caption');
          const pageLabel = createElement('span', 'page-button-label', `Page ${page.number}`);
          const shortLabel = createElement('span', 'page-button-document', document.shortLabel);
          shortLabel.setAttribute('aria-hidden', 'true');
          caption.append(pageLabel, shortLabel);
          button.append(thumb, caption);
          button.addEventListener('click', () => dispatch({ type: 'select-page', pageId: page.id }));
          buttons.append(button);
        }
        group.append(buttons);
        pageNav.append(group);
      }
    }

    for (const button of pageNav.querySelectorAll('[data-page-button]')) {
      if (button.dataset.pageId === state.pageId) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    }
  };

  const renderTools = () => {
    const actions = [
      ['fit', 'Fit'],
      ['zoom-out', 'Zoom out'],
      ['zoom-in', 'Zoom in'],
    ];
    if (!viewerTools.querySelector('[data-action]')) {
      const label = createElement('span', 'viewer-tools-label', 'View');
      const controls = actions.map(([action, text]) => {
        const button = createElement('button', 'viewer-tool', text);
        button.type = 'button';
        button.dataset.action = action;
        button.addEventListener('click', () => {
          if (button.getAttribute('aria-disabled') === 'true') return;
          dispatch({ type: action });
        });
        return button;
      });
      const zoom = createElement('output', 'viewer-zoom');
      zoom.setAttribute('aria-label', 'Current zoom');
      const magnifier = createElement('button', 'viewer-tool viewer-tool-magnifier', 'Magnifier');
      magnifier.type = 'button';
      magnifier.dataset.magnifierToggle = '';
      magnifier.setAttribute('title', 'Follow the pointer with a magnifying lens');
      magnifier.addEventListener('click', () => dispatch({ type: 'toggle-magnifier' }));
      const fieldSelector = createElement('section', 'mobile-field-selector');
      fieldSelector.dataset.mobileFieldSelector = '';
      fieldSelector.setAttribute('aria-label', 'Fields on this page');
      const fieldLabel = createElement('p', 'mobile-field-label', 'Fields on this page');
      const fieldList = createElement('div', 'mobile-field-list');
      fieldList.dataset.mobileFieldList = '';
      fieldSelector.append(fieldLabel, fieldList);
      viewerTools.append(label, ...controls, zoom, magnifier, fieldSelector);
    }

    viewerTools.querySelector('[data-magnifier-toggle]')
      .setAttribute('aria-pressed', String(state.magnifier));

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
        button.setAttribute('aria-pressed', String(state.openBubbleIds.includes(button.dataset.hotspotId)));
      }
      currentCanvas.classList.toggle('magnifier-on', state.magnifier);
      if (!state.magnifier) {
        const lens = currentCanvas.querySelector('[data-magnifier-lens]');
        if (lens) lens.hidden = true;
      }
      renderPageGeometry();
      return;
    }

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
      button.setAttribute('aria-pressed', String(state.openBubbleIds.includes(model.id)));
      Object.assign(button.style, model.style);
      button.addEventListener('click', () => dispatch({ type: 'select-hotspot', hotspotId: model.id }));
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

    const lens = createElement('div', 'magnifier-lens');
    lens.dataset.magnifierLens = '';
    lens.setAttribute('aria-hidden', 'true');
    lens.hidden = true;
    lens.style.backgroundImage = `url("${page.image}")`;

    const MAGNIFICATION = 2.4;
    const positionLens = event => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const lensSize = lens.offsetWidth || 200;
      lens.style.left = `${x - lensSize / 2}px`;
      lens.style.top = `${y - lensSize / 2}px`;
      lens.style.backgroundSize = `${rect.width * MAGNIFICATION}px ${rect.height * MAGNIFICATION}px`;
      lens.style.backgroundPosition = `${lensSize / 2 - x * MAGNIFICATION}px ${lensSize / 2 - y * MAGNIFICATION}px`;
    };
    canvas.addEventListener('pointermove', event => {
      if (!state.magnifier) return;
      lens.hidden = false;
      positionLens(event);
    });
    canvas.addEventListener('pointerleave', () => { lens.hidden = true; });
    canvas.classList.toggle('magnifier-on', state.magnifier);

    canvas.append(pageHeading, image, hotspotLayer, lens);
    documentStage.replaceChildren(canvas);
    renderPageGeometry();
    image.src = page.image;
  };

  const renderBubbles = () => {
    const region = bubbleLayer.parentElement;
    for (const bubble of bubbleLayer.querySelectorAll('[data-bubble-id]')) {
      if (!state.openBubbleIds.includes(bubble.dataset.bubbleId)) {
        bubblePositions.delete(bubble.dataset.bubbleId);
        bubble.remove();
      }
    }

    state.openBubbleIds.forEach((hotspotId, index) => {
      let bubble = bubbleLayer.querySelector(`[data-bubble-id="${CSS.escape(hotspotId)}"]`);
      if (!bubble) {
        const hotspot = hotspots.find(candidate => candidate.id === hotspotId);
        if (!hotspot) return;
        const model = createHotspotViewModel(hotspot, explanations[hotspot.explanationId]);

        bubble = createElement('article', 'explanation-bubble');
        bubble.dataset.bubbleId = hotspotId;
        bubble.setAttribute('role', 'note');
        bubble.setAttribute('aria-label', model.title);

        const header = createElement('div', 'bubble-header');
        const kicker = createElement('p', 'explanation-kicker', 'Selected item');
        const close = createElement('button', 'bubble-close', '×');
        close.type = 'button';
        close.setAttribute('aria-label', `Close ${model.title}`);
        close.addEventListener('click', () => dispatch({ type: 'close-bubble', hotspotId }));
        header.append(kicker, close);

        const title = createElement('h2', 'bubble-title', model.title);
        const body = createElement('p', 'explanation-body bubble-body', model.body);
        bubble.append(header, title, body);
        if (model.learnerQuestion) {
          bubble.append(createElement('p', 'explanation-question', model.learnerQuestion));
        }

        if (!bubblePositions.has(hotspotId)) {
          const cascade = bubbleSpawnCount % 6;
          bubbleSpawnCount += 1;
          const regionWidth = region.clientWidth || 900;
          bubblePositions.set(hotspotId, {
            x: Math.max(16, regionWidth - 396 - cascade * 30),
            y: 76 + cascade * 34,
          });
        }

        header.addEventListener('pointerdown', event => {
          if (event.target === close) return;
          event.preventDefault();
          const start = bubblePositions.get(hotspotId);
          const originX = event.clientX;
          const originY = event.clientY;
          let lastX = originX;
          bubble.classList.add('is-dragging');
          dispatch({ type: 'select-hotspot', hotspotId });
          const move = moveEvent => {
            const tilt = Math.max(-4, Math.min(4, (moveEvent.clientX - lastX) * 0.6));
            lastX = moveEvent.clientX;
            const next = {
              x: Math.max(8, Math.min(region.clientWidth - 96, start.x + moveEvent.clientX - originX)),
              y: Math.max(8, Math.min(region.clientHeight - 56, start.y + moveEvent.clientY - originY)),
            };
            bubblePositions.set(hotspotId, next);
            bubble.style.left = `${next.x}px`;
            bubble.style.top = `${next.y}px`;
            bubble.style.setProperty('--bubble-tilt', `${tilt}deg`);
          };
          const stop = () => {
            bubble.classList.remove('is-dragging');
            bubble.style.setProperty('--bubble-tilt', '0deg');
            viewerDocument.removeEventListener('pointermove', move);
            viewerDocument.removeEventListener('pointerup', stop);
          };
          viewerDocument.addEventListener('pointermove', move);
          viewerDocument.addEventListener('pointerup', stop);
        });

        bubble.addEventListener('pointerdown', () => {
          if (state.selectedHotspotId !== hotspotId) dispatch({ type: 'select-hotspot', hotspotId });
        });

        bubbleLayer.append(bubble);
      }

      const position = bubblePositions.get(hotspotId);
      bubble.style.left = `${position.x}px`;
      bubble.style.top = `${position.y}px`;
      bubble.style.zIndex = String(20 + index);
      bubble.classList.toggle('is-front', index === state.openBubbleIds.length - 1);
    });
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
        content.append(createElement('p', 'explanation-question', model.learnerQuestion));
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
    renderBubbles();
    renderExplanation();
  };

  const dispatch = action => {
    const selectedBefore = state.selectedHotspotId;
    const pageChanged = action.type === 'select-page'
      && action.pageId !== state.pageId
      && pageIds.has(action.pageId);
    state = reduceViewerState(state, action, pageIds);
    render();

    if ((action.type === 'clear-selection' && selectedBefore)
      || (action.type === 'close-bubble' && action.hotspotId)) {
      const closedId = action.type === 'close-bubble' ? action.hotspotId : selectedBefore;
      const selectedButton = [...root.querySelectorAll('[data-hotspot-id]')]
        .find(button => button.dataset.hotspotId === closedId);
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
      bubbleLayer.remove();
    },
  };
}
