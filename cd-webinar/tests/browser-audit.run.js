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
  const selectPage = async pageId => {
    await page.locator(`[data-page-button][data-page-id="${pageId}"]`).click();
    await page.waitForFunction(id => document.querySelector('[data-page-canvas]')?.dataset.pageId === id, pageId);
    await waitForImage();
    await waitFrames();
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

  for (const viewport of viewports) {
    const label = viewport.name;
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(baseUrl);
    await waitForImage();
    await waitFrames();

    check(await currentPage().count() === 1, `${label}: expected exactly one current page`, 'accessibility');
    check(await currentPage().getAttribute('data-page-id') === 'le-1', `${label}: initial page is not le-1`);
    check(await page.getByRole('button', { name: 'Fit', exact: true }).getAttribute('aria-disabled') === 'true',
      `${label}: Fit is not disabled at 100%`, 'accessibility');
    check(await page.getByRole('button', { name: 'Zoom out', exact: true }).getAttribute('aria-disabled') === 'true',
      `${label}: Zoom Out is not disabled at 100%`, 'accessibility');

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
    check(directSelection.every(pageId => pageId === 'cd-5'),
      `${label}: direct cd-5 selection visited ${directSelection.join(', ') || 'no observed page'}`);

    const apr = page.locator('[data-hotspot-id="cd.p5.apr"]');
    await apr.click();
    const explanation = page.locator('[data-selected-explanation]');
    check(await explanation.locator('h2').textContent() === 'Annual Percentage Rate',
      `${label}: APR explanation title is not visible`);
    check(await explanation.locator('.explanation-body').isVisible(), `${label}: APR paragraph is not visible`);
    check((await explanation.locator('.explanation-body').textContent())?.trim().length > 0,
      `${label}: APR paragraph is empty`);
    check(await page.locator('[data-hotspot-id][aria-pressed="true"]').count() === 1,
      `${label}: expected exactly one selected hotspot`, 'accessibility');

    await page.keyboard.press('Escape');
    check(await page.locator('[data-selected-explanation]').count() === 0,
      `${label}: Escape did not close the explanation`);
    check(await page.evaluate(() => document.activeElement?.dataset.hotspotId === 'cd.p5.apr'),
      `${label}: Escape did not restore focus to cd.p5.apr`, 'accessibility');

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
    }
    await page.locator('.explanation-close').click();

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

    await selectPage('cd-5');
    deliberateFailureActive = true;
    await page.route('**/cd-page-5.png', route => route.abort('failed'));
    await page.reload();
    await waitForImage();
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
