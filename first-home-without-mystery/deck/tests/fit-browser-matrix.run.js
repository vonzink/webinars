async (page) => {
  const deckUrl = `${page.url().replace(/[?#].*$/, '').replace(/\/$/, '')}/`;
  const viewports = [
    { width: 1920, height: 1080 },
    { width: 1280, height: 720 },
    { width: 480, height: 800 },
    { width: 800, height: 480 },
    { width: 240, height: 180 },
  ];
  const errors = [];
  const pageErrors = [];
  const matrix = [];
  const stableModalSizes = new Map();
  page.on('pageerror', error => pageErrors.push(error.message));

  const waitFrames = count => page.evaluate(frames => new Promise(resolve => {
    const step = () => frames-- > 0 ? requestAnimationFrame(step) : resolve();
    requestAnimationFrame(step);
  }), count);

  await page.goto(`${deckUrl}tests/fit-browser-audit-fixture.html`);
  const fixtures = await page.evaluate(async () => {
    const { inspectComposedSurface, assertComposedSurface } = await import('./fit-browser-audit.js');
    const inspect = id => {
      const shell = document.querySelector(id);
      return inspectComposedSurface({ shell, surface: shell.querySelector('.surface') });
    };
    const clipped = inspect('#clipped-case');
    const transformed = inspect('#transformed-case');
    const selfClippedText = inspect('#self-clipped-text-case');
    let clippedRejected = false;
    let textRejected = false;
    try { assertComposedSurface(clipped, 'clipped fixture'); } catch { clippedRejected = true; }
    try { assertComposedSurface(selfClippedText, 'text fixture'); } catch { textRejected = true; }
    assertComposedSurface(transformed, 'transformed fixture');
    return { clippedRejected, textRejected, transformedAccepted: true };
  });
  if (!Object.values(fixtures).every(Boolean)) errors.push('fit-audit fixtures did not validate the checker');

  await page.goto(`${deckUrl}#opening`);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const slideIds = await page.evaluate(async () => (await import('./content/slides.js')).SLIDES.map(slide => slide.id));

  for (const viewport of viewports) {
    const label = `${viewport.width}x${viewport.height}`;
    await page.setViewportSize(viewport);
    await waitFrames(2);
    let slideAudits = 0;

    for (const id of slideIds) {
      await page.evaluate(slideId => { location.hash = slideId; }, id);
      await waitFrames(2);
      const result = await page.evaluate(async ({ id, label }) => {
        const { inspectComposedSurface, assertComposedSurface } = await import('./tests/fit-browser-audit.js');
        const failures = [];
        const shell = document.querySelector('.slide-fit-shell');
        const surface = document.querySelector('.slide-scaler');
        const active = document.querySelector('.slide.is-active');
        if (!active || active.id !== `slide-${id}`) failures.push(`${label} ${id}: active slide mismatch`);
        try { assertComposedSurface(inspectComposedSurface({ shell, surface }), `${label} ${id}`); }
        catch (error) { failures.push(error.message); }
        if (shell.scrollWidth > shell.clientWidth + 1 || shell.scrollHeight > shell.clientHeight + 1) {
          failures.push(`${label} ${id}: fitted shell overflow`);
        }
        if (active && (active.scrollWidth > active.clientWidth + 1 || active.scrollHeight > active.clientHeight + 1)) {
          failures.push(`${label} ${id}: authored slide overflow`);
        }
        const rect = shell.getBoundingClientRect();
        if (Math.abs(rect.width / rect.height - 16 / 9) > .001) failures.push(`${label} ${id}: slide ratio changed`);
        return failures;
      }, { id, label });
      errors.push(...result);
      slideAudits += 1;
    }

    const overlayResult = await page.evaluate(async label => {
      const { inspectComposedSurface, assertComposedSurface } = await import('./tests/fit-browser-audit.js');
      const cash = await import('./js/cash-to-close-calculator.js');
      const modal = await import('./js/modal.js');
      const { MODALS } = await import('./content/modals.js');
      const failures = [];
      const opener = document.querySelector('[data-nav="presenter"]');
      const audit = (shell, surface, name) => {
        try { assertComposedSurface(inspectComposedSurface({ shell, surface }), name); }
        catch (error) { failures.push(error.message); }
        if (shell.scrollWidth > shell.clientWidth + 1 || shell.scrollHeight > shell.clientHeight + 1) {
          failures.push(`${name}: shell overflow`);
        }
      };

      opener.focus();
      cash.setCashToCloseVisible(true, opener);
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const cashShell = document.querySelector('.cash-builder-shell');
      const cashSurface = document.querySelector('.cash-builder-surface');
      audit(cashShell, cashSurface, `${label} cash builder`);
      if (cashSurface.clientWidth !== 720 || cashSurface.clientHeight !== 900) {
        failures.push(`${label} cash builder: authored size changed`);
      }
      document.querySelector('.cash-builder-close').click();
      if (document.activeElement !== opener) failures.push(`${label} cash builder: focus did not return`);

      const modalSizes = {};
      for (const id of Object.keys(MODALS)) {
        const opened = await modal.openModal(id, opener);
        if (!opened) failures.push(`${label} ${id}: popout did not open`);
        const modalShell = document.querySelector('.modal-shell');
        const modalSurface = document.querySelector('.modal');
        audit(modalShell, modalSurface, `${label} ${id}`);
        modalSizes[id] = [modalSurface.clientWidth, modalSurface.clientHeight];
        modal.closeModal();
      }
      return { failures, modalSizes, popoutAudits: Object.keys(MODALS).length };
    }, label);

    errors.push(...overlayResult.failures);
    for (const [id, size] of Object.entries(overlayResult.modalSizes)) {
      if (!stableModalSizes.has(id)) stableModalSizes.set(id, size.join('x'));
      else if (stableModalSizes.get(id) !== size.join('x')) errors.push(`${label} ${id}: popout reflowed`);
    }
    matrix.push({ viewport: label, slideAudits, cashBuilderAudits: 1, popoutAudits: overlayResult.popoutAudits });
  }

  errors.push(...pageErrors.map(error => `page error: ${error}`));
  const result = {
    status: errors.length ? 'fail' : 'pass',
    errors,
    fixtures,
    matrix,
    totals: {
      slideAudits: matrix.reduce((sum, row) => sum + row.slideAudits, 0),
      cashBuilderAudits: matrix.reduce((sum, row) => sum + row.cashBuilderAudits, 0),
      popoutAudits: matrix.reduce((sum, row) => sum + row.popoutAudits, 0),
    },
  };
  if (errors.length) throw new Error(JSON.stringify(result));
  return result;
}
