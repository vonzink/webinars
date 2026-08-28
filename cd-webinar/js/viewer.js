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

          const pageLabel = createElement('span', 'page-button-label', `Page ${page.number}`);
          const shortLabel = createElement('span', 'page-button-document', document.shortLabel);
          shortLabel.setAttribute('aria-hidden', 'true');
          button.append(pageLabel, shortLabel);
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
      viewerTools.append(label, ...controls, zoom);
    }

    for (const [action] of actions) {
      const button = viewerTools.querySelector(`[data-action="${action}"]`);
      button.setAttribute('aria-pressed', String(action === 'fit' && state.zoom === 1));
      button.setAttribute('aria-disabled', String(
        ((action === 'fit' || action === 'zoom-out') && state.zoom === 1)
        || (action === 'zoom-in' && state.zoom === 2),
      ));
    }
    viewerTools.querySelector('.viewer-zoom').textContent = `${Math.round(state.zoom * 100)}%`;
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
    renderExplanation();
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
    },
  };
}
