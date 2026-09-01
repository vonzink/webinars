async (page) => {
  const baseUrl = page.url().replace(/[?#].*$/, '');
  const viewports = [
    { name: 'desktop', width: 1920, height: 1080 },
    { name: 'laptop', width: 1280, height: 720 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 390, height: 844 },
    { name: 'mobile-landscape', width: 844, height: 390 },
  ];
  const failures = [];
  const consoleErrors = [];
  const networkFailures = [];
  let deliberateFailureActive = false;
  let alignmentFailures = 0;
  let matrixChecks = 0;
  let touchActivations = 0;
  const fidelityFixture = await page.evaluate(async fixtureUrl => {
    const response = await fetch(fixtureUrl);
    if (!response.ok) throw new Error(`fixture request failed: ${response.status}`);
    return response.json();
  }, `${baseUrl}tests/fixtures/hotspot-fidelity.json`);
  const fixtureByPage = Object.groupBy(fidelityFixture, item => item.pageId);
  const expectedPageIds = ['le-1', 'le-2', 'le-3', 'cd-1', 'cd-2', 'cd-3', 'cd-4', 'cd-5'];
  const zoomLevels = [1, 1.25, 1.5, 2];

  const check = (condition, label, kind = 'interaction') => {
    if (condition) return;
    if (kind === 'alignment') alignmentFailures += 1;
    failures.push(`${kind}: ${label}`);
  };
  const waitFrames = (count = 2) => page.evaluate(frames => new Promise(resolve => {
    const step = () => frames-- > 0 ? requestAnimationFrame(step) : resolve();
    requestAnimationFrame(step);
  }), count);
  const waitForImage = () => page.waitForFunction(() => {
    const image = document.querySelector('[data-page-image]');
    return image?.complete && image.naturalWidth > 0;
  });
  const currentPage = () => page.locator('[data-page-button][aria-current="page"]');
  const revealDoc = async doc => {
    const switchButton = page.locator(`[data-doc-switch-button][data-doc="${doc}"]`);
    if (await switchButton.getAttribute('aria-pressed') !== 'true') await switchButton.click();
  };
  const selectPage = async pageId => {
    await revealDoc(pageId.split('-')[0]);
    await page.locator(`[data-page-button][data-page-id="${pageId}"]`).click();
    await page.waitForFunction(id => document.querySelector('[data-page-canvas]')?.dataset.pageId === id, pageId);
    await waitForImage();
    await waitFrames();
  };
  const touchTap = async locator => {
    await locator.scrollIntoViewIfNeeded();
    const box = await locator.boundingBox();
    if (!box) throw new Error('touch target has no bounding box');
    const client = await page.context().newCDPSession(page);
    const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    await locator.evaluate(element => {
      window.__auditPointerType = '';
      element.addEventListener('pointerup', event => {
        window.__auditPointerType = event.pointerType;
      }, { once: true });
    });
    await client.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ ...point, radiusX: 8, radiusY: 8, force: 1, id: 1 }],
    });
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await client.send('Emulation.setTouchEmulationEnabled', { enabled: false, maxTouchPoints: 1 });
    await client.detach();
  };

  page.on('console', message => {
    if (deliberateFailureActive && message.text() === 'Failed to load resource: net::ERR_FAILED') return;
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('response', response => {
    if (response.status() >= 400) networkFailures.push(`${response.status()} ${response.url()}`);
  });
  page.on('requestfailed', request => {
    const expected = deliberateFailureActive && /\/cd-page-5\.png(?:$|[?#])/.test(request.url());
    if (!expected) networkFailures.push(`FAILED ${request.url()}: ${request.failure()?.errorText ?? 'unknown'}`);
  });

  await page.emulateMedia({ reducedMotion: 'reduce' });

  const bootRegression = await page.evaluate(async () => {
    const [{ DOCUMENTS, EXPLANATIONS, HOTSPOTS }, { startWebinar }] = await Promise.all([
      import('./content/index.js'),
      import('./js/app.js'),
    ]);
    const root = document.createElement('main');
    root.style.cssText = 'position:fixed;left:-10000px;top:0;width:900px;height:700px;';
    root.innerHTML = `
      <nav data-page-nav></nav>
      <div data-viewer-tools></div>
      <div class="document-stage" data-document-stage></div>
      <aside data-explanation-panel></aside>`;
    document.body.append(root);
    const valid = HOTSPOTS.find(item => item.id === 'le.p1.interest-rate');
    const logged = [];
    const result = startWebinar({
      root,
      documents: DOCUMENTS,
      explanations: EXPLANATIONS,
      hotspots: [
        valid,
        null,
        { ...valid },
        { ...valid, id: 'le.p1.browser-outside', readingOrder: 900, bounds: { x: 1, y: 1, width: 0.2, height: 0.2 } },
        { ...valid, id: 'le.p1.browser-missing-copy', readingOrder: 901, explanationId: 'missing-browser-copy' },
      ],
      logError: message => logged.push(message),
    });
    const renderedIds = [...root.querySelectorAll('[data-hotspot-id]')]
      .map(button => button.dataset.hotspotId);
    result.viewer?.destroy();
    root.remove();
    return { started: result.started, renderedIds, logged };
  });
  check(bootRegression.started, 'recoverable-row browser boot did not initialize', 'failure-state');
  check(JSON.stringify(bootRegression.renderedIds) === JSON.stringify(['le.p1.interest-rate']),
    `recoverable-row browser boot rendered ${bootRegression.renderedIds.join(', ')}`, 'failure-state');
  check(/malformed hotspot record: null/.test(bootRegression.logged.join('\n')),
    'recoverable-row browser boot did not log malformed data', 'failure-state');
  check(/duplicate hotspot id/.test(bootRegression.logged.join('\n')),
    'recoverable-row browser boot did not log duplicate data', 'failure-state');
  check(/missing explanation/.test(bootRegression.logged.join('\n')),
    'recoverable-row browser boot did not log missing explanation data', 'failure-state');

  for (const viewport of viewports) {
    const label = viewport.name;
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(baseUrl);
    await waitForImage();
    await waitFrames();

    check(await currentPage().count() === 1, `${label}: expected exactly one current page`, 'accessibility');
    check(await currentPage().getAttribute('data-page-id') === 'le-1', `${label}: initial page is not le-1`);
    check(await page.locator('[data-doc-switch-button]').count() === 2, `${label}: document switch is missing`, 'accessibility');
    check(await page.locator('[data-doc-switch-button][data-doc="le"]').getAttribute('aria-pressed') === 'true',
      `${label}: LE is not the pressed document on load`, 'accessibility');
    check(await page.getByRole('button', { name: 'Fit', exact: true }).getAttribute('aria-disabled') === 'true',
      `${label}: Fit is not disabled at 100%`, 'accessibility');
    check(await page.getByRole('button', { name: 'Zoom out', exact: true }).getAttribute('aria-disabled') === 'true',
      `${label}: Zoom Out is not disabled at 100%`, 'accessibility');
    check(!await page.getByRole('button', { name: 'Zoom out', exact: true }).getAttribute('aria-pressed'),
      `${label}: Zoom Out command exposes toggle semantics`, 'accessibility');
    check(!await page.getByRole('button', { name: 'Zoom in', exact: true }).getAttribute('aria-pressed'),
      `${label}: Zoom In command exposes toggle semantics`, 'accessibility');

    await page.evaluate(() => {
      window.__auditCurrentPages = [];
      const nav = document.querySelector('[data-page-nav]');
      window.__auditCurrentObserver = new MutationObserver(records => {
        for (const record of records) {
          if (record.oldValue === null) window.__auditCurrentPages.push(record.target.dataset.pageId);
        }
      });
      window.__auditCurrentObserver.observe(nav, {
        attributes: true,
        attributeOldValue: true,
        subtree: true,
        attributeFilter: ['aria-current'],
      });
    });
    await selectPage('cd-5');
    const directSelection = await page.evaluate(() => {
      window.__auditCurrentObserver.disconnect();
      return window.__auditCurrentPages;
    });
    check(await currentPage().count() === 1, `${label}: direct selection left multiple current pages`, 'accessibility');
    check(await currentPage().getAttribute('data-page-id') === 'cd-5', `${label}: cd-5 did not become current`);
    check(directSelection.length <= 2 && directSelection.at(-1) === 'cd-5'
      && directSelection.every(pageId => pageId === 'cd-5' || pageId === 'cd-1'),
    `${label}: direct cd-5 selection visited ${directSelection.join(', ') || 'no observed page'} (only the document-switch landing page may precede the target)`);

    const apr = page.locator('[data-hotspot-id="cd.p5.apr"]');
    await apr.hover();
    check(await apr.evaluate(element => parseFloat(getComputedStyle(element).outlineWidth) > 0),
      `${label}: mouse hover does not preview a hotspot`);
    if (viewport.width >= 900) {
      await waitFrames();
      check(await page.locator('[data-magnifier-lens]').isVisible(),
        `${label}: hovering a field does not raise the magnify lens`);
    }
    await apr.click();
    const explanation = page.locator('[data-selected-explanation]');
    check(await explanation.locator('h2').textContent() === 'Annual Percentage Rate',
      `${label}: APR explanation title is not rendered`);
    check((await explanation.locator('.explanation-body').textContent())?.trim().length > 0,
      `${label}: APR paragraph is empty`);
    check(await page.locator('[data-hotspot-id][aria-pressed="true"]').count() === 1,
      `${label}: expected exactly one selected hotspot`, 'accessibility');

    if (viewport.width >= 900) {
      const card = page.locator('[data-decoder-card]');
      check(await card.locator('.decoder-title').textContent() === 'Annual Percentage Rate',
        `${label}: decoder card does not show the pinned APR field`);
      check(await card.locator('.decoder-body').isVisible(), `${label}: decoder card paragraph is not visible`);
      check(await card.locator('.decoder-unpin').isVisible(), `${label}: pinned card has no unpin control`);
      check(await page.locator('[data-magnifier-lens]').isHidden(),
        `${label}: magnify lens stays up while a field is pinned`);

      const beforeDrag = await card.boundingBox();
      const handle = await card.locator('.decoder-tag-row').boundingBox();
      await page.mouse.move(handle.x + 30, handle.y + handle.height / 2);
      await page.mouse.down();
      await page.mouse.move(handle.x - 160, handle.y - 140, { steps: 5 });
      await page.mouse.up();
      const afterDrag = await card.boundingBox();
      check(Math.abs(afterDrag.x - beforeDrag.x) > 40 || Math.abs(afterDrag.y - beforeDrag.y) > 40,
        `${label}: decoder card did not move when dragged by its header`);

      check(await page.locator('[data-decoder-pane]').getAttribute('data-decoder-pane') === '0',
        `${label}: decoder card does not start on the quick definition`);
      await page.locator('[data-decoder-flip-next]').click();
      check(await page.locator('.decoder-pane-heading').textContent() === 'In practice',
        `${label}: second flip card is not the in-practice pane`);
      await page.locator('[data-decoder-flip-next]').click();
      check(await page.locator('.decoder-source').isVisible(),
        `${label}: the detail flip card does not show its source line`);

      const beforeResize = await card.boundingBox();
      await page.mouse.move(beforeResize.x + beforeResize.width - 10, beforeResize.y + beforeResize.height - 10);
      await page.mouse.down();
      await page.mouse.move(beforeResize.x + beforeResize.width + 90, beforeResize.y + beforeResize.height + 50, { steps: 4 });
      await page.mouse.up();
      const afterResize = await card.boundingBox();
      check(afterResize.width > beforeResize.width + 40,
        `${label}: decoder card did not resize from its corner grip`);
      await page.locator('[data-decoder-flip-back]').click();
      const persisted = await card.boundingBox();
      check(Math.abs(persisted.width - afterResize.width) < 6,
        `${label}: resized card size does not persist across flips`);

      await card.locator('.decoder-unpin').click();
      check(await page.locator('[data-selected-explanation]').count() === 0,
        `${label}: unpin chip did not clear the pinned field`);
      await apr.click();
    } else {
      check(await explanation.locator('.explanation-body').isVisible(), `${label}: APR paragraph is not visible`);
    }

    await page.keyboard.press('Escape');
    check(await page.locator('[data-selected-explanation]').count() === 0,
      `${label}: Escape did not close the explanation`);
    check(await page.evaluate(() => document.activeElement?.dataset.hotspotId === 'cd.p5.apr'),
      `${label}: Escape did not restore focus to cd.p5.apr`, 'accessibility');

    const orderedHotspotIds = await page.locator('[data-hotspot-id]').evaluateAll(buttons =>
      buttons.map(button => button.dataset.hotspotId));
    if (orderedHotspotIds.length >= 2) {
      await page.locator(`[data-hotspot-id="${orderedHotspotIds[0]}"]`).focus();
      for (let index = 1; index < orderedHotspotIds.length; index += 1) {
        await page.keyboard.press('Tab');
        check(await page.evaluate(id => document.activeElement?.dataset.hotspotId === id, orderedHotspotIds[index]),
          `${label}: sequential Tab skipped ${orderedHotspotIds[index]}`, 'accessibility');
      }
      await page.locator(`[data-hotspot-id="${orderedHotspotIds[0]}"]`).focus();
      await page.keyboard.press('Enter');
      check(await page.locator('[data-selected-explanation]').count() === 1,
        `${label}: Enter did not activate a hotspot`, 'accessibility');
      await page.keyboard.press('Escape');
      await page.locator(`[data-hotspot-id="${orderedHotspotIds[1]}"]`).focus();
      await page.keyboard.press('Space');
      check(await page.locator('[data-selected-explanation]').count() === 1,
        `${label}: Space did not activate a hotspot`, 'accessibility');
      await page.keyboard.press('Escape');
    }

    await selectPage('le-2');
    check(await page.locator('[data-selected-explanation]').count() === 0,
      `${label}: page selection did not clear the CD explanation`);
    check(await page.locator('[data-hotspot-id][aria-pressed="true"]').count() === 0,
      `${label}: page selection retained a selected hotspot`, 'accessibility');

    const beforeZoom = await page.evaluate(() => {
      const image = document.querySelector('[data-page-image]').getBoundingClientRect();
      const hotspot = document.querySelector('[data-hotspot-id]').getBoundingClientRect();
      return { imageWidth: image.width, imageHeight: image.height, hotspotWidth: hotspot.width, hotspotHeight: hotspot.height };
    });
    await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
    await waitFrames();
    const afterZoom = await page.evaluate(() => {
      const image = document.querySelector('[data-page-image]').getBoundingClientRect();
      const hotspot = document.querySelector('[data-hotspot-id]').getBoundingClientRect();
      return { imageWidth: image.width, imageHeight: image.height, hotspotWidth: hotspot.width, hotspotHeight: hotspot.height };
    });
    const imageRatio = afterZoom.imageWidth / beforeZoom.imageWidth;
    const imageHeightRatio = afterZoom.imageHeight / beforeZoom.imageHeight;
    const hotspotRatio = afterZoom.hotspotWidth / beforeZoom.hotspotWidth;
    const hotspotHeightRatio = afterZoom.hotspotHeight / beforeZoom.hotspotHeight;
    check(imageRatio > 1, `${label}: Zoom In did not grow the page image`, 'alignment');
    check(Math.abs(imageRatio - hotspotRatio) <= 0.01 && Math.abs(imageHeightRatio - hotspotHeightRatio) <= 0.01,
      `${label}: image/hotspot zoom ratios differ (${imageRatio}/${hotspotRatio}, ${imageHeightRatio}/${hotspotHeightRatio})`,
      'alignment');

    await page.getByRole('button', { name: 'Fit', exact: true }).click();
    await waitFrames();
    const geometry = await page.evaluate(() => {
      const stage = document.querySelector('[data-document-stage]').getBoundingClientRect();
      const canvas = document.querySelector('[data-page-canvas]').getBoundingClientRect();
      const image = document.querySelector('[data-page-image]').getBoundingClientRect();
      const hotspots = [...document.querySelectorAll('[data-hotspot-id]')].map(button => {
        const rect = button.getBoundingClientRect();
        return {
          id: button.dataset.hotspotId,
          left: rect.left,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          name: button.getAttribute('aria-label')?.trim() ?? '',
          tabIndex: button.tabIndex,
        };
      });
      return {
        stage: { left: stage.left, top: stage.top, right: stage.right, bottom: stage.bottom },
        canvas: { left: canvas.left, top: canvas.top, right: canvas.right, bottom: canvas.bottom },
        image: { left: image.left, top: image.top, right: image.right, bottom: image.bottom },
        hotspots,
      };
    });
    check(geometry.canvas.left >= geometry.stage.left - 1 && geometry.canvas.top >= geometry.stage.top - 1
      && geometry.canvas.right <= geometry.stage.right + 1 && geometry.canvas.bottom <= geometry.stage.bottom + 1,
    `${label}: Fit left the page canvas outside the document stage`, 'alignment');
    for (const hotspot of geometry.hotspots) {
      check(hotspot.left >= geometry.image.left - 1 && hotspot.top >= geometry.image.top - 1
        && hotspot.right <= geometry.image.right + 1 && hotspot.bottom <= geometry.image.bottom + 1,
      `${label}: ${hotspot.id} is outside the image`, 'alignment');
      check(hotspot.name.length > 0, `${label}: ${hotspot.id} has no accessible name`, 'accessibility');
      check(hotspot.tabIndex === 0, `${label}: ${hotspot.id} is not in one tab-order position`, 'accessibility');
    }

    await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
    await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
    await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
    check(await page.getByRole('button', { name: 'Zoom in', exact: true }).getAttribute('aria-disabled') === 'true',
      `${label}: Zoom In is not disabled at 200%`, 'accessibility');
    check(await page.locator('.viewer-zoom').textContent() === '200%', `${label}: maximum zoom is not 200%`);
    await page.getByRole('button', { name: 'Fit', exact: true }).click();
    await waitFrames();

    const firstHotspot = page.locator('[data-hotspot-id]').first();
    await firstHotspot.click();
    if (viewport.width < 900) {
      const touchTargets = await page.locator('[data-mobile-field-id]').evaluateAll(buttons => buttons.map(button => {
        const rect = button.getBoundingClientRect();
        return {
          id: button.dataset.mobileFieldId,
          left: rect.left,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
        };
      }));
      const activeHotspotIds = await page.locator('[data-hotspot-id]').evaluateAll(buttons =>
        buttons.map(button => button.dataset.hotspotId));
      check(touchTargets.length === activeHotspotIds.length,
        `${label}: mobile field list does not map every active semantic ID`, 'responsive');
      check(touchTargets.every(target => activeHotspotIds.includes(target.id)),
        `${label}: mobile field list contains an unrelated semantic ID`, 'responsive');
      check(touchTargets.every(target => target.width >= 44 && target.height >= 44),
        `${label}: mobile field list contains a target smaller than 44px`, 'responsive');
      const overlappingTargets = touchTargets.some((target, index) => touchTargets.slice(index + 1).some(other =>
        target.left < other.right && target.right > other.left
        && target.top < other.bottom && target.bottom > other.top));
      check(!overlappingTargets, `${label}: mobile field targets overlap`, 'responsive');

      const mobilePanel = await page.evaluate(() => {
        const panel = document.querySelector('[data-explanation-panel]');
        const close = panel.querySelector('.explanation-close');
        return {
          position: getComputedStyle(panel).position,
          bottom: getComputedStyle(panel).bottom,
          closeVisible: Boolean(close && close.getClientRects().length),
        };
      });
      check(mobilePanel.position === 'fixed' && mobilePanel.bottom === '0px',
        `${label}: selected explanation is not a bottom sheet`, 'responsive');
      check(mobilePanel.closeVisible, `${label}: bottom sheet close button is not visible`, 'responsive');
      await page.locator('.explanation-close').click();

      if (touchTargets.length) {
        const touchTarget = page.locator(`[data-mobile-field-id="${touchTargets[0].id}"]`);
        await touchTap(touchTarget);
        await waitFrames();
        check(await page.evaluate(() => window.__auditPointerType) === 'touch',
          `${label}: field selector was not activated by a real touch pointer`, 'accessibility');
        check(await page.locator('[data-selected-explanation]').count() === 1,
          `${label}: touch did not open the linked explanation`, 'interaction');
        check(await page.locator(`[data-hotspot-id="${touchTargets[0].id}"]`).getAttribute('aria-pressed') === 'true',
          `${label}: touch selection did not update the aligned hotspot`, 'interaction');
        touchActivations += 1;
      }
    }
    for (let cleanup = 0; cleanup < 8 && await page.locator('[data-selected-explanation]').count(); cleanup += 1) {
      await page.keyboard.press('Escape');
    }
    check(await page.locator('[data-selected-explanation]').count() === 0,
      `${label}: Escape cleanup left a selection open`);

    const motion = await page.evaluate(() => {
      const query = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const elements = [
        document.querySelector('[data-page-canvas]'),
        document.querySelector('[data-hotspot-id]'),
        document.querySelector('[data-explanation-panel]'),
      ];
      const hasMotion = elements.some(element => {
        const style = getComputedStyle(element);
        const durations = `${style.transitionDuration},${style.animationDuration}`
          .split(',')
          .map(value => parseFloat(value) || 0);
        return durations.some(value => value > 0);
      });
      return { query, hasMotion };
    });
    check(motion.query, `${label}: reduced-motion media emulation is inactive`, 'accessibility');
    check(!motion.hasMotion, `${label}: nonessential motion remains enabled`, 'accessibility');

    for (const pageId of expectedPageIds) {
      await selectPage(pageId);
      const fitButton = page.getByRole('button', { name: 'Fit', exact: true });
      if (await fitButton.getAttribute('aria-disabled') !== 'true') {
        await fitButton.click();
        await waitFrames();
      }

      for (let zoomIndex = 0; zoomIndex < zoomLevels.length; zoomIndex += 1) {
        const expectedZoom = zoomLevels[zoomIndex];
        if (zoomIndex > 0) {
          await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
          await waitFrames();
        }
        const matrixGeometry = await page.evaluate(() => {
          const stage = document.querySelector('[data-document-stage]').getBoundingClientRect();
          const canvas = document.querySelector('[data-page-canvas]').getBoundingClientRect();
          const imageElement = document.querySelector('[data-page-image]');
          const image = imageElement.getBoundingClientRect();
          const hotspots = [...document.querySelectorAll('[data-hotspot-id]')].map(button => {
            const rect = button.getBoundingClientRect();
            return {
              id: button.dataset.hotspotId,
              left: rect.left,
              top: rect.top,
              right: rect.right,
              bottom: rect.bottom,
            };
          });
          return {
            zoomText: document.querySelector('.viewer-zoom').textContent,
            naturalWidth: imageElement.naturalWidth,
            naturalHeight: imageElement.naturalHeight,
            stage: { left: stage.left, top: stage.top, right: stage.right, bottom: stage.bottom },
            canvas: { left: canvas.left, top: canvas.top, right: canvas.right, bottom: canvas.bottom, width: canvas.width, height: canvas.height },
            image: { left: image.left, top: image.top, right: image.right, bottom: image.bottom, width: image.width, height: image.height },
            hotspots,
          };
        });
        const expectedIds = fixtureByPage[pageId].map(item => item.id);
        check(matrixGeometry.zoomText === `${Math.round(expectedZoom * 100)}%`,
          `${label}/${pageId}: expected ${expectedZoom * 100}% but saw ${matrixGeometry.zoomText}`, 'alignment');
        check(matrixGeometry.naturalWidth === 1530 && matrixGeometry.naturalHeight === 1980,
          `${label}/${pageId}/${expectedZoom}: rendered image dimensions changed`, 'alignment');
        check(Math.abs(matrixGeometry.canvas.width - matrixGeometry.image.width) <= 2.1
          && Math.abs(matrixGeometry.canvas.height - matrixGeometry.image.height) <= 2.1,
        `${label}/${pageId}/${expectedZoom}: image and shared canvas differ`, 'alignment');
        check(JSON.stringify(matrixGeometry.hotspots.map(item => item.id)) === JSON.stringify(expectedIds),
          `${label}/${pageId}/${expectedZoom}: active semantic IDs differ from locked fixture`, 'alignment');
        for (const hotspot of matrixGeometry.hotspots) {
          check(hotspot.left >= matrixGeometry.image.left - 1 && hotspot.top >= matrixGeometry.image.top - 1
            && hotspot.right <= matrixGeometry.image.right + 1 && hotspot.bottom <= matrixGeometry.image.bottom + 1,
          `${label}/${pageId}/${expectedZoom}: ${hotspot.id} is outside the image`, 'alignment');
        }
        if (expectedZoom === 1) {
          check(matrixGeometry.canvas.left >= matrixGeometry.stage.left - 1
            && matrixGeometry.canvas.top >= matrixGeometry.stage.top - 1
            && matrixGeometry.canvas.right <= matrixGeometry.stage.right + 1
            && matrixGeometry.canvas.bottom <= matrixGeometry.stage.bottom + 1,
          `${label}/${pageId}: Fit left the page outside the stage`, 'alignment');
          const firstPageHotspot = page.locator('[data-hotspot-id]').first();
          await firstPageHotspot.hover();
          check(await firstPageHotspot.evaluate(element => parseFloat(getComputedStyle(element).outlineWidth) > 0),
            `${label}/${pageId}: hover preview is missing`);
        }
        matrixChecks += 1;
      }
    }

    await selectPage('cd-5');
    deliberateFailureActive = true;
    await page.route('**/cd-page-5.png', route => route.abort('failed'));
    await page.reload();
    await waitForImage();
    await revealDoc('cd');
    await page.locator('[data-page-button][data-page-id="cd-5"]').click();
    await page.locator('[data-page-image]').evaluate(image => {
      if (image.complete) return undefined;
      return new Promise(resolve => {
        image.addEventListener('load', resolve, { once: true });
        image.addEventListener('error', resolve, { once: true });
      });
    });
    await waitFrames();
    check(await page.getByText('This disclosure page is temporarily unavailable.', { exact: true }).isVisible(),
      `${label}: image failure fallback is not visible`, 'failure-state');
    check(await page.locator('[data-hotspot-id]').count() === 0,
      `${label}: image failure left active hotspot buttons`, 'failure-state');
    await revealDoc('le');
    await page.locator('[data-page-button][data-page-id="le-1"]').click();
    await page.waitForFunction(() => document.querySelector('[data-page-canvas]')?.dataset.pageId === 'le-1');
    check(await currentPage().getAttribute('data-page-id') === 'le-1',
      `${label}: page navigation stopped after image failure`, 'failure-state');
    await page.unroute('**/cd-page-5.png');
    deliberateFailureActive = false;
    await page.reload();
    await waitForImage();
  }

  failures.push(...consoleErrors.map(error => `console: ${error}`));
  failures.push(...networkFailures.map(error => `network: ${error}`));
  return JSON.stringify({
    status: failures.length ? 'fail' : 'pass',
    viewports: viewports.map(item => item.name),
    pages: expectedPageIds,
    zoomLevels: zoomLevels.map(level => `${Math.round(level * 100)}%`),
    matrixChecks,
    touchActivations,
    interactionFailures: failures.filter(item => item.startsWith('interaction:')).length,
    responsiveFailures: failures.filter(item => item.startsWith('responsive:')).length,
    accessibilityFailures: failures.filter(item => item.startsWith('accessibility:')).length,
    failureStateFailures: failures.filter(item => item.startsWith('failure-state:')).length,
    alignmentFailures,
    consoleErrors: consoleErrors.length,
    networkFailures: networkFailures.length,
    failures,
  });
}
