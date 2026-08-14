async (page) => {
  const deckUrl = `${page.url().replace(/[?#].*$/, '').replace(/\/$/, '')}/`;
  const viewports = [
    { width: 1920, height: 1080 },
    { width: 1280, height: 720 },
    { width: 480, height: 800 },
    { width: 800, height: 480 },
    { width: 240, height: 180 },
  ];
  const waitFrames = count => page.evaluate(frames => new Promise(resolve => {
    const step = () => frames-- > 0 ? requestAnimationFrame(step) : resolve();
    requestAnimationFrame(step);
  }), count);
  const expectedModalDesigns = new Map();
  const expectedMediaDesigns = new Map();
  const errors = [];
  const matrix = [];

  await page.goto(`${deckUrl}tests/fit-browser-audit-fixture.html`);
  await page.waitForFunction(() => [...document.images].every(image => image.complete));
  const auditToolFixtures = await page.evaluate(async () => {
    const { inspectComposedSurface, assertComposedSurface } = await import('./fit-browser-audit.js');
    const inspect = id => {
      const shell = document.querySelector(id);
      return inspectComposedSurface({ shell, surface: shell.querySelector('.surface') });
    };
    const clipped = inspect('#clipped-case');
    const transformed = inspect('#transformed-case');
    const decorative = inspect('#decorative-case');
    const selfClippedText = inspect('#self-clipped-text-case');
    let clippedRejected = false;
    let selfClippedTextRejected = false;
    try { assertComposedSurface(clipped, 'clipped fixture'); }
    catch (error) { clippedRejected = /clipped required content/.test(error.message); }
    try { assertComposedSurface(selfClippedText, 'self-clipped text fixture'); }
    catch (error) { selfClippedTextRejected = /clipped required content/.test(error.message); }
    assertComposedSurface(transformed, 'transformed fixture');
    assertComposedSurface(decorative, 'decorative fixture');
    return {
      clippedDetected: clipped.clippedContent.length === 1,
      clippedRejected,
      transformedAccepted: transformed.clippedContent.length === 0,
      decorativeAccepted: decorative.clippedContent.length === 0,
      selfClippedTextDetected: selfClippedText.clippedContent.length === 1,
      selfClippedTextRejected,
    };
  });
  if (!Object.values(auditToolFixtures).every(Boolean)) {
    throw new Error(JSON.stringify({ status: 'fail', auditToolFixtures }));
  }

  await page.goto(`${deckUrl}#myths`);
  await page.emulateMedia({ reducedMotion: 'reduce' });

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await waitFrames(2);
    const result = await page.evaluate(async viewportLabel => {
      const { inspectComposedSurface, assertComposedSurface } = await import('./tests/fit-browser-audit.js');
      const calculator = await import('./js/calculator.js');
      const modal = await import('./js/modal.js');
      const { MODALS } = await import('./content/modals.js');
      const { PRESENTER_MEDIA } = await import('./content/presenter-media.js');
      const failures = [];
      const near = (actual, expected, tolerance, label) => {
        if (!Number.isFinite(actual) || Math.abs(actual - expected) > tolerance) {
          failures.push(`${label}: expected ${expected}, got ${actual}`);
        }
      };
      const check = (condition, label) => { if (!condition) failures.push(label); };
      const frames = count => new Promise(resolve => {
        const step = () => count-- > 0 ? requestAnimationFrame(step) : resolve();
        requestAnimationFrame(step);
      });
      const audit = (shell, surface, label) => {
        const inspected = inspectComposedSurface({ shell, surface });
        try { assertComposedSurface(inspected, label); }
        catch (error) { failures.push(error.message); }
        check(shell.scrollWidth <= shell.clientWidth + 1, `${label}: shell horizontal overflow ${shell.scrollWidth}/${shell.clientWidth}`);
        check(shell.scrollHeight <= shell.clientHeight + 1, `${label}: shell vertical overflow ${shell.scrollHeight}/${shell.clientHeight}`);
        check(surface.scrollWidth <= surface.clientWidth + 1, `${label}: surface horizontal overflow ${surface.scrollWidth}/${surface.clientWidth}`);
        check(surface.scrollHeight <= surface.clientHeight + 1, `${label}: surface vertical overflow ${surface.scrollHeight}/${surface.clientHeight}`);
        const rect = shell.getBoundingClientRect();
        const scaleX = rect.width / surface.clientWidth;
        const scaleY = rect.height / surface.clientHeight;
        near(scaleX, scaleY, 0.001, `${label}: non-uniform scale`);
        check(scaleX > 0 && scaleX <= 1.000001, `${label}: invalid/upscaled scale ${scaleX}`);
        return { inspected, rect, scale: scaleX };
      };

      const slideShell = document.querySelector('.slide-fit-shell');
      const slideSurface = document.querySelector('.slide-scaler');
      const slideAudit = audit(slideShell, slideSurface, `${viewportLabel} slide`);
      near(slideAudit.rect.width / slideAudit.rect.height, 16 / 9, 0.001, `${viewportLabel} slide ratio`);
      check(slideSurface.clientWidth === 1920 && slideSurface.clientHeight === 1080,
        `${viewportLabel} slide authored size changed to ${slideSurface.clientWidth}x${slideSurface.clientHeight}`);
      const activeSlide = slideSurface.querySelector('.slide.is-active');
      check(Boolean(activeSlide), `${viewportLabel} has no active slide`);
      if (activeSlide) {
        check(activeSlide.scrollWidth <= activeSlide.clientWidth + 1, `${viewportLabel} active slide horizontal crop`);
        check(activeSlide.scrollHeight <= activeSlide.clientHeight + 1, `${viewportLabel} active slide vertical crop`);
      }

      const opener = document.querySelector('[data-nav="presenter"]');
      opener.focus();
      calculator.setCalculatorVisible(true, opener);
      const toggle = document.querySelector('[data-calculator-toggle]');
      if (toggle.getAttribute('aria-expanded') === 'true') toggle.click();
      await frames(2);
      const calcShell = document.querySelector('.calculator-panel');
      const calcSurface = document.querySelector('.calculator-canvas');
      const collapsedAudit = audit(calcShell, calcSurface, `${viewportLabel} calculator collapsed`);
      check(calcSurface.clientWidth === 560 && calcSurface.clientHeight === 820,
        `${viewportLabel} collapsed authored size ${calcSurface.clientWidth}x${calcSurface.clientHeight}`);
      near(collapsedAudit.rect.width / collapsedAudit.rect.height, 560 / 820, 0.001,
        `${viewportLabel} collapsed calculator ratio`);
      check(getComputedStyle(document.querySelector('.calculator-grid')).gridTemplateColumns.split(' ').length === 2,
        `${viewportLabel} calculator grid reflowed`);

      toggle.click();
      await frames(2);
      const expandedAudit = audit(calcShell, calcSurface, `${viewportLabel} calculator expanded`);
      check(calcSurface.clientWidth === 560 && calcSurface.clientHeight === 982,
        `${viewportLabel} expanded authored size ${calcSurface.clientWidth}x${calcSurface.clientHeight}`);
      near(expandedAudit.rect.width / expandedAudit.rect.height, 560 / 982, 0.001,
        `${viewportLabel} expanded calculator ratio`);
      const hoa = document.querySelector('[data-calculator-field="hoaMonthly"]');
      hoa.value = '250';
      hoa.dispatchEvent(new Event('input', { bubbles: true }));
      await frames(1);
      const hoaAudit = audit(calcShell, calcSurface, `${viewportLabel} calculator expanded HOA`);
      check(calcSurface.clientWidth === 560 && calcSurface.clientHeight === 982,
        `${viewportLabel} HOA authored size ${calcSurface.clientWidth}x${calcSurface.clientHeight}`);
      near(hoaAudit.rect.width / hoaAudit.rect.height, 560 / 982, 0.001,
        `${viewportLabel} HOA calculator ratio`);
      const rows = [...document.querySelectorAll('[data-calculator-breakdown] > div')];
      check(rows.length === 5, `${viewportLabel} expected five payment rows, got ${rows.length}`);
      if (rows.at(-1)) {
        const last = rows.at(-1).getBoundingClientRect();
        const resultRect = document.querySelector('.calculator-result').getBoundingClientRect();
        const canvasRect = calcSurface.getBoundingClientRect();
        check(last.right <= resultRect.right + 1 && last.bottom <= resultRect.bottom + 1,
          `${viewportLabel} fifth payment row overflows result`);
        check(last.right <= canvasRect.right + 1 && last.bottom <= canvasRect.bottom + 1,
          `${viewportLabel} fifth payment row overflows canvas`);
      }
      document.querySelector('.calculator-close').click();
      check(document.activeElement === opener, `${viewportLabel} calculator focus did not return to opener`);
      check(document.querySelector('[data-calculator-overlay]').hidden, `${viewportLabel} calculator did not close`);

      const modalDesigns = {};
      for (const id of Object.keys(MODALS)) {
        const opened = await modal.openModal(id, opener);
        check(opened === true, `${viewportLabel} popout ${id} did not open`);
        const shell = document.querySelector('.modal-shell');
        const surface = document.querySelector('.modal');
        audit(shell, surface, `${viewportLabel} popout ${id}`);
        const head = surface.querySelector('.modal-head');
        const title = surface.querySelector('.modal-title');
        const body = surface.querySelector('.modal-body');
        near(parseFloat(getComputedStyle(head).height), 52, 0.01, `${viewportLabel} popout ${id} header height`);
        near(parseFloat(getComputedStyle(title).fontSize), 20, 0.01, `${viewportLabel} popout ${id} title size`);
        check(!surface.querySelector('.modal-eyebrow, .modal-title-bar, .accent-bar'),
          `${viewportLabel} popout ${id} renders duplicate eyebrow/title underline`);
        check(!/^(auto|scroll)$/.test(getComputedStyle(body).overflowX) && !/^(auto|scroll)$/.test(getComputedStyle(body).overflowY),
          `${viewportLabel} popout ${id} body scroll mode`);
        check(body.scrollWidth <= body.clientWidth + 1 && body.scrollHeight <= body.clientHeight + 1,
          `${viewportLabel} popout ${id} body overflow`);
        modalDesigns[id] = [surface.clientWidth, surface.clientHeight];
        modal.closeModal();
        check(!document.getElementById('modal-root').classList.contains('is-open'), `${viewportLabel} popout ${id} did not close immediately`);
      }

      const mediaDesigns = {};
      let immediateDecoded = 0;
      for (const item of PRESENTER_MEDIA) {
        const opened = await modal.openMedia(item.id, opener);
        check(opened === true, `${viewportLabel} graphic ${item.id} did not open`);
        const shell = document.querySelector('.modal-shell');
        const surface = document.querySelector('.modal');
        audit(shell, surface, `${viewportLabel} graphic ${item.id}`);
        const head = surface.querySelector('.modal-head');
        const title = surface.querySelector('.modal-title');
        const body = surface.querySelector('.modal-body');
        const image = surface.querySelector('.modal-media-frame img');
        const headRect = head.getBoundingClientRect();
        const bodyRect = body.getBoundingClientRect();
        const imageRect = image.getBoundingClientRect();
        check(image.complete && image.naturalWidth > 0 && image.naturalHeight > 0,
          `${viewportLabel} graphic ${item.id} is not decoded`);
        if (image.complete && image.naturalWidth > 0) immediateDecoded += 1;
        near(parseFloat(getComputedStyle(head).height), 52, 0.01, `${viewportLabel} graphic ${item.id} header height`);
        near(parseFloat(getComputedStyle(title).fontSize), 20, 0.01, `${viewportLabel} graphic ${item.id} title size`);
        near(imageRect.width / imageRect.height, image.naturalWidth / image.naturalHeight, 0.001,
          `${viewportLabel} graphic ${item.id} decoded image ratio`);
        near(bodyRect.top, headRect.bottom, 1, `${viewportLabel} graphic ${item.id} image starts below strip`);
        near(imageRect.left, bodyRect.left, 1, `${viewportLabel} graphic ${item.id} image left inset`);
        near(imageRect.top, bodyRect.top, 1, `${viewportLabel} graphic ${item.id} image top inset`);
        near(imageRect.right, bodyRect.right, 1, `${viewportLabel} graphic ${item.id} image right inset`);
        near(imageRect.bottom, bodyRect.bottom, 1, `${viewportLabel} graphic ${item.id} image bottom inset`);
        const bodyStyle = getComputedStyle(body);
        check(parseFloat(bodyStyle.paddingTop) === 0 && parseFloat(bodyStyle.paddingRight) === 0
          && parseFloat(bodyStyle.paddingBottom) === 0 && parseFloat(bodyStyle.paddingLeft) === 0,
          `${viewportLabel} graphic ${item.id} has inset body padding`);
        check(getComputedStyle(image).objectFit === 'contain', `${viewportLabel} graphic ${item.id} object-fit is not contain`);
        check(!surface.querySelector('.modal-eyebrow, .modal-title-bar, .accent-bar'),
          `${viewportLabel} graphic ${item.id} renders duplicate eyebrow/title underline`);
        mediaDesigns[item.id] = [surface.clientWidth, surface.clientHeight, image.naturalWidth, image.naturalHeight];
        modal.closeModal();
      }
      check(document.activeElement === opener, `${viewportLabel} modal focus did not return to session opener`);

      return {
        failures,
        slide: 1,
        calculatorCollapsed: 1,
        calculatorExpanded: 1,
        calculatorHoa: 1,
        popouts: Object.keys(MODALS).length,
        graphics: PRESENTER_MEDIA.length,
        immediateDecoded,
        modalDesigns,
        mediaDesigns,
      };
    }, `${viewport.width}x${viewport.height}`);

    errors.push(...result.failures);
    for (const [id, dims] of Object.entries(result.modalDesigns)) {
      if (!expectedModalDesigns.has(id)) expectedModalDesigns.set(id, dims);
      else if (expectedModalDesigns.get(id).join('x') !== dims.join('x')) {
        errors.push(`${viewport.width}x${viewport.height} popout ${id} reflowed from ${expectedModalDesigns.get(id).join('x')} to ${dims.join('x')}`);
      }
    }
    for (const [id, dims] of Object.entries(result.mediaDesigns)) {
      if (!expectedMediaDesigns.has(id)) expectedMediaDesigns.set(id, dims);
      else if (expectedMediaDesigns.get(id).join('x') !== dims.join('x')) {
        errors.push(`${viewport.width}x${viewport.height} graphic ${id} design changed from ${expectedMediaDesigns.get(id).join('x')} to ${dims.join('x')}`);
      }
    }
    matrix.push({
      viewport: `${viewport.width}x${viewport.height}`,
      slide: result.slide,
      calculatorCollapsed: result.calculatorCollapsed,
      calculatorExpanded: result.calculatorExpanded,
      calculatorHoa: result.calculatorHoa,
      popouts: result.popouts,
      graphics: result.graphics,
      immediateDecoded: result.immediateDecoded,
    });
  }

  const result = {
    status: errors.length ? 'fail' : 'pass',
    errors,
    auditToolTests: 4,
    auditToolFixtures,
    matrix,
    totals: {
      slideAudits: matrix.reduce((n, row) => n + row.slide, 0),
      collapsedCalculatorAudits: matrix.reduce((n, row) => n + row.calculatorCollapsed, 0),
      expandedCalculatorAudits: matrix.reduce((n, row) => n + row.calculatorExpanded, 0),
      nonzeroHoaAudits: matrix.reduce((n, row) => n + row.calculatorHoa, 0),
      popoutAudits: matrix.reduce((n, row) => n + row.popouts, 0),
      graphicAudits: matrix.reduce((n, row) => n + row.graphics, 0),
      immediateDecodedGraphics: matrix.reduce((n, row) => n + row.immediateDecoded, 0),
    },
    stableModalDesigns: expectedModalDesigns.size,
    stableMediaDesigns: expectedMediaDesigns.size,
  };
  if (errors.length) throw new Error(JSON.stringify(result));
  return result;
}
