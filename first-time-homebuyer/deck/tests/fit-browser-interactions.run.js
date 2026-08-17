async (page) => {
  const deckUrl = `${page.url().replace(/[?#].*$/, '').replace(/\/$/, '')}/`;
  const errors = [];
  const evidence = {
    calculatorInteractions: 0,
    popoutInteractions: 0,
    graphicInteractions: 0,
    focusAndRaceChecks: 0,
    presenterChecks: {},
    deferredMinors: {},
  };
  const check = (condition, label) => { if (!condition) errors.push(label); };
  const waitFrames = (target, count = 2) => target.evaluate(frames => new Promise(resolve => {
    const step = () => frames-- > 0 ? requestAnimationFrame(step) : resolve();
    requestAnimationFrame(step);
  }), count);
  const currentAudit = async label => page.evaluate(async label => {
    const { inspectComposedSurface, assertComposedSurface } = await import('./tests/fit-browser-audit.js');
    const shell = document.querySelector('.modal-root.is-open .modal-shell, [data-calculator-overlay]:not([hidden]) .calculator-panel');
    const surface = document.querySelector('.modal-root.is-open .modal, [data-calculator-overlay]:not([hidden]) .calculator-canvas');
    if (!shell || !surface) return { error: `${label}: active surface missing` };
    const result = inspectComposedSurface({ shell, surface });
    try { assertComposedSurface(result, label); }
    catch (error) { return { error: error.message } };
    const rect = shell.getBoundingClientRect();
    return {
      ratio: rect.width / rect.height,
      rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height },
      viewport: { width: innerWidth, height: innerHeight },
      scaleX: rect.width / surface.clientWidth,
      scaleY: rect.height / surface.clientHeight,
      shellFits: shell.scrollWidth <= shell.clientWidth + 1 && shell.scrollHeight <= shell.clientHeight + 1,
    };
  }, label);
  const dragBy = async (selector, dx, dy) => {
    const box = await page.locator(selector).boundingBox();
    if (!box) return false;
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + dx, y + dy, { steps: 6 });
    await page.mouse.up();
    await waitFrames(page, 1);
    return true;
  };
  const verifyInteraction = async (label, expectedRatio) => {
    const audit = await currentAudit(label);
    if (audit.error) { errors.push(audit.error); return null; }
    check(audit.shellFits, `${label}: shell layout overflow`);
    check(audit.scaleX > 0 && audit.scaleX <= 1.000001, `${label}: invalid/upscaled scale ${audit.scaleX}`);
    check(Math.abs(audit.scaleX - audit.scaleY) <= 0.001, `${label}: nonuniform scale ${audit.scaleX}/${audit.scaleY}`);
    check(Math.abs(audit.ratio - expectedRatio) <= 0.001, `${label}: ratio changed ${expectedRatio} -> ${audit.ratio}`);
    return audit;
  };
  const closeActiveModal = () => page.evaluate(async () => (await import('./js/modal.js')).closeModal());
  const openModal = (kind, id) => page.evaluate(async ({ kind, id }) => {
    const modal = await import('./js/modal.js');
    const opener = document.querySelector('[data-nav="presenter"]');
    return kind === 'content' ? modal.openModal(id, opener) : modal.openMedia(id, opener);
  }, { kind, id });

  await page.goto(`${deckUrl}#myths`);
  await page.emulateMedia({ reducedMotion: 'reduce' });

  const viewports = [
    { width: 1920, height: 1080 },
    { width: 1280, height: 720 },
    { width: 480, height: 800 },
    { width: 800, height: 480 },
    { width: 240, height: 180 },
  ];

  for (const viewport of viewports) {
    const vp = `${viewport.width}x${viewport.height}`;
    await page.setViewportSize(viewport);
    await waitFrames(page);

    await page.evaluate(async () => {
      const calculator = await import('./js/calculator.js');
      const opener = document.querySelector('[data-nav="presenter"]');
      calculator.setCalculatorVisible(true, opener);
      const toggle = document.querySelector('[data-calculator-toggle]');
      if (toggle.getAttribute('aria-expanded') === 'true') toggle.click();
    });
    await waitFrames(page);
    let audit = await currentAudit(`${vp} calculator start`);
    if (audit.error) errors.push(audit.error);
    else {
      const ratio = audit.ratio;
      check(await dragBy('.calculator-dragbar', -viewport.width * 2, -viewport.height * 2), `${vp} calculator drag handle missing`);
      await verifyInteraction(`${vp} calculator top-left drag`, ratio);
      check(await dragBy('.calculator-dragbar', viewport.width * 4, viewport.height * 4), `${vp} calculator second drag handle missing`);
      await verifyInteraction(`${vp} calculator bottom-right drag`, ratio);
      await page.locator('.calculator-close').click();

      await page.evaluate(async () => {
        const calculator = await import('./js/calculator.js');
        calculator.setCalculatorVisible(true, document.querySelector('[data-nav="presenter"]'));
      });
      await waitFrames(page);
      audit = await currentAudit(`${vp} calculator resize start`);
      const resizeRatio = audit.error ? ratio : audit.ratio;
      check(await dragBy('.calculator-resize-handle', -Math.max(24, viewport.width * 0.2), -Math.max(24, viewport.height * 0.2)),
        `${vp} calculator resize handle missing`);
      await verifyInteraction(`${vp} calculator shrink`, resizeRatio);
      check(await dragBy('.calculator-resize-handle', Math.max(48, viewport.width * 0.4), Math.max(48, viewport.height * 0.4)),
        `${vp} calculator resize grow handle missing`);
      await verifyInteraction(`${vp} calculator grow`, resizeRatio);
      await page.locator('.calculator-close').click();
      evidence.calculatorInteractions += 4;
    }

    check(await openModal('content', 'myth-lowest-rate'), `${vp} interaction popout failed to open`);
    await waitFrames(page);
    audit = await currentAudit(`${vp} popout start`);
    if (audit.error) errors.push(audit.error);
    else {
      const ratio = audit.ratio;
      check(await dragBy('.modal-head', -viewport.width * 2, -viewport.height * 2), `${vp} popout drag handle missing`);
      await verifyInteraction(`${vp} popout top-left drag`, ratio);
      check(await dragBy('.modal-head', viewport.width * 4, viewport.height * 4), `${vp} popout second drag handle missing`);
      await verifyInteraction(`${vp} popout bottom-right drag`, ratio);
      await closeActiveModal();

      check(await openModal('content', 'myth-lowest-rate'), `${vp} resize popout failed to reopen`);
      await waitFrames(page);
      audit = await currentAudit(`${vp} popout resize start`);
      const resizeRatio = audit.error ? ratio : audit.ratio;
      check(await dragBy('.modal-resize', -Math.max(24, viewport.width * 0.2), -Math.max(24, viewport.height * 0.2)),
        `${vp} popout resize handle missing`);
      await verifyInteraction(`${vp} popout shrink`, resizeRatio);
      check(await dragBy('.modal-resize', Math.max(48, viewport.width * 0.4), Math.max(48, viewport.height * 0.4)),
        `${vp} popout resize grow handle missing`);
      await verifyInteraction(`${vp} popout grow`, resizeRatio);
      await closeActiveModal();
      evidence.popoutInteractions += 4;
    }
  }

  for (const viewport of [{ width: 480, height: 800 }, { width: 800, height: 480 }]) {
    const vp = `${viewport.width}x${viewport.height}`;
    await page.setViewportSize(viewport);
    for (const id of ['debt-to-income', 'budget-smart']) {
      check(await openModal('media', id), `${vp} ${id} graphic failed to open`);
      await waitFrames(page);
      let audit = await currentAudit(`${vp} ${id} start`);
      if (audit.error) { errors.push(audit.error); await closeActiveModal(); continue; }
      const ratio = audit.ratio;
      check(await dragBy('.modal-head', -viewport.width * 2, -viewport.height * 2), `${vp} ${id} drag handle missing`);
      await verifyInteraction(`${vp} ${id} top-left drag`, ratio);
      check(await dragBy('.modal-head', viewport.width * 4, viewport.height * 4), `${vp} ${id} second drag handle missing`);
      await verifyInteraction(`${vp} ${id} bottom-right drag`, ratio);
      await closeActiveModal();

      check(await openModal('media', id), `${vp} ${id} resize reopen failed`);
      await waitFrames(page);
      audit = await currentAudit(`${vp} ${id} resize start`);
      const resizeRatio = audit.error ? ratio : audit.ratio;
      check(await dragBy('.modal-resize', -Math.max(24, viewport.width * 0.2), -Math.max(24, viewport.height * 0.2)),
        `${vp} ${id} resize handle missing`);
      await verifyInteraction(`${vp} ${id} shrink`, resizeRatio);
      check(await dragBy('.modal-resize', Math.max(48, viewport.width * 0.4), Math.max(48, viewport.height * 0.4)),
        `${vp} ${id} resize grow handle missing`);
      await verifyInteraction(`${vp} ${id} grow`, resizeRatio);
      await closeActiveModal();
      evidence.graphicInteractions += 4;
    }
  }

  await page.setViewportSize({ width: 800, height: 480 });
  const focusRace = await page.evaluate(async () => {
    const calculator = await import('./js/calculator.js');
    const modal = await import('./js/modal.js');
    const frames = count => new Promise(resolve => {
      const step = () => count-- > 0 ? requestAnimationFrame(step) : resolve();
      requestAnimationFrame(step);
    });
    const opener = document.querySelector('[data-nav="presenter"]');
    const result = {};

    opener.focus();
    calculator.setCalculatorVisible(true, opener);
    const toggle = document.querySelector('[data-calculator-toggle]');
    if (toggle.getAttribute('aria-expanded') === 'true') toggle.click();
    const resize = document.querySelector('.calculator-resize-handle');
    const first = document.querySelector('#calculator-homePrice');
    resize.focus();
    resize.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
    result.calculatorWrapForward = document.activeElement === first;
    first.focus();
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }));
    result.calculatorWrapBackward = document.activeElement === resize;
    document.querySelector('.calculator-close').click();
    result.calculatorFocusReturn = document.activeElement === opener;

    calculator.setCalculatorVisible(true, opener);
    toggle.click();
    document.querySelector('.calculator-close').click();
    await frames(2);
    result.calculatorQueuedCloseStayedClosed = document.querySelector('[data-calculator-overlay]').hidden;

    await modal.openModal('myth-lowest-rate', opener);
    const close = document.querySelector('.modal-close');
    const modalResize = document.querySelector('.modal-resize');
    result.modalInitialFocus = document.activeElement === close;
    close.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }));
    result.modalWrapBackward = document.activeElement === modalResize;
    modalResize.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
    result.modalWrapForward = document.activeElement === close;
    modal.closeModal();
    result.modalFocusReturn = document.activeElement === opener;

    const closePending = modal.openModal('myth-fha-first', opener);
    modal.closeModal();
    result.closeRacePromise = await closePending;
    await frames(2);
    result.closeRaceStayedClosed = !document.getElementById('modal-root').classList.contains('is-open');

    const firstPending = modal.openModal('myth-perfect-credit', opener);
    const replacement = modal.openModal('myth-renting', opener);
    result.replaceFirstPromise = await firstPending;
    result.replaceSecondPromise = await replacement;
    result.replaceTitle = document.querySelector('.modal-title').textContent;
    modal.closeModal();

    const mediaPending = modal.openMedia('budget-smart', opener);
    const contentReplacement = modal.openModal('myth-lowest-rate', opener);
    result.mediaReplaceFirstPromise = await mediaPending;
    result.mediaReplaceSecondPromise = await contentReplacement;
    result.mediaReplaceTitle = document.querySelector('.modal-title').textContent;
    modal.closeModal();

    await modal.openModal('myth-lowest-rate', opener);
    document.querySelector('.modal-close').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    result.escapeClosed = !document.getElementById('modal-root').classList.contains('is-open');

    await modal.openModal('myth-lowest-rate', opener);
    document.querySelector('.modal-backdrop').click();
    result.backdropClosed = !document.getElementById('modal-root').classList.contains('is-open');

    calculator.setCalculatorVisible(true, opener);
    const handle = document.querySelector('.calculator-resize-handle');
    handle.focus();
    const handleRect = handle.getBoundingClientRect();
    const canvas = document.querySelector('.calculator-canvas');
    const canvasRect = canvas.getBoundingClientRect();
    const style = getComputedStyle(handle);
    const outlineWidth = parseFloat(style.outlineWidth) || 0;
    const outlineOffset = parseFloat(style.outlineOffset) || 0;
    result.resizeFocusMinor = {
      canvasOverflow: getComputedStyle(canvas).overflow,
      handleFlushRight: Math.abs(handleRect.right - canvasRect.right) <= 1,
      handleFlushBottom: Math.abs(handleRect.bottom - canvasRect.bottom) <= 1,
      outlineWidth,
      outlineOffset,
      projectedRight: handleRect.right + outlineWidth + outlineOffset,
      canvasRight: canvasRect.right,
      projectedBottom: handleRect.bottom + outlineWidth + outlineOffset,
      canvasBottom: canvasRect.bottom,
    };
    document.querySelector('.calculator-close').click();
    return result;
  });

  for (const [name, value] of Object.entries({
    calculatorWrapForward: focusRace.calculatorWrapForward,
    calculatorWrapBackward: focusRace.calculatorWrapBackward,
    calculatorFocusReturn: focusRace.calculatorFocusReturn,
    calculatorQueuedCloseStayedClosed: focusRace.calculatorQueuedCloseStayedClosed,
    modalInitialFocus: focusRace.modalInitialFocus,
    modalWrapBackward: focusRace.modalWrapBackward,
    modalWrapForward: focusRace.modalWrapForward,
    modalFocusReturn: focusRace.modalFocusReturn,
    closeRaceReturnedFalse: focusRace.closeRacePromise === false,
    closeRaceStayedClosed: focusRace.closeRaceStayedClosed,
    replacedOpenReturnedFalse: focusRace.replaceFirstPromise === false,
    replacementReturnedTrue: focusRace.replaceSecondPromise === true,
    replacementTitleCorrect: focusRace.replaceTitle === 'Renting is cheaper',
    mediaReplaceReturnedFalse: focusRace.mediaReplaceFirstPromise === false,
    contentReplacementReturnedTrue: focusRace.mediaReplaceSecondPromise === true,
    mediaReplacementTitleCorrect: focusRace.mediaReplaceTitle === 'The lowest rate is the best deal',
    escapeClosed: focusRace.escapeClosed,
    backdropClosed: focusRace.backdropClosed,
  })) {
    check(value, `focus/race check failed: ${name}`);
    evidence.focusAndRaceChecks += 1;
  }
  evidence.deferredMinors.calculatorResizeFocus = focusRace.resizeFocusMinor;

  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`${deckUrl}#myths`);
  await waitFrames(page);
  const popupPromise = page.waitForEvent('popup');
  await page.locator('[data-nav="presenter"]').click();
  const presenter = await popupPromise;
  await presenter.waitForLoadState('domcontentloaded');
  await presenter.setViewportSize({ width: 1280, height: 800 });
  await waitFrames(presenter, 3);

  const presenterInitial = await presenter.evaluate(() => {
    const grid = document.querySelector('#p-library-grid');
    const popouts = document.querySelector('#p-popout-section').getBoundingClientRect();
    const graphics = document.querySelector('#p-media-section').getBoundingClientRect();
    const icon = document.querySelector('#p-calculator');
    const right = document.querySelector('.p-right');
    return {
      calculatorIsLast: icon === document.querySelector('.p-bar').lastElementChild,
      calculatorHasSvg: Boolean(icon.querySelector('svg')),
      calculatorSize: [icon.getBoundingClientRect().width, icon.getBoundingClientRect().height],
      popoutCount: document.querySelector('#p-popout-count').textContent,
      graphicCount: document.querySelector('#p-media-count').textContent,
      graphicsVisible: !document.querySelector('#p-media-section').hidden,
      gridColumns: getComputedStyle(grid).gridTemplateColumns.split(' ').length,
      columnsSeparated: popouts.right <= graphics.left + 1,
      rightOverflowY: getComputedStyle(right).overflowY,
      rightScrollable: right.scrollHeight > right.clientHeight,
      position: document.querySelector('#p-position').textContent,
    };
  });
  check(presenterInitial.calculatorIsLast && presenterInitial.calculatorHasSvg, 'presenter calculator is not the final icon utility');
  check(Math.abs(presenterInitial.calculatorSize[0] - 36) <= 1 && Math.abs(presenterInitial.calculatorSize[1] - 36) <= 1,
    `presenter calculator icon size ${presenterInitial.calculatorSize.join('x')}`);
  check(presenterInitial.popoutCount === '5' && presenterInitial.graphicCount === '5' && presenterInitial.graphicsVisible,
    `presenter myths library counts ${presenterInitial.popoutCount}/${presenterInitial.graphicCount}`);
  check(presenterInitial.gridColumns === 2 && presenterInitial.columnsSeparated, 'presenter popout/graphics library is not two columns');
  check(/^(auto|scroll)$/.test(presenterInitial.rightOverflowY),
    'presenter dashboard does not retain scroll-capable overflow');

  await presenter.locator('#p-calculator').click();
  await page.waitForFunction(() => !document.querySelector('[data-calculator-overlay]').hidden);
  check(await presenter.locator('#p-calculator').getAttribute('aria-label') === 'Hide calculator', 'presenter calculator open state did not synchronize');
  await presenter.locator('#p-calculator').click();
  await page.waitForFunction(() => document.querySelector('[data-calculator-overlay]').hidden);
  check(await presenter.locator('#p-calculator').getAttribute('aria-label') === 'Show calculator', 'presenter calculator close state did not synchronize');
  evidence.presenterChecks.calculatorOpenClose = true;

  const popoutButton = presenter.locator('#p-popouts button').first();
  const popoutLabel = await popoutButton.textContent();
  await popoutButton.click();
  await page.waitForFunction(() => document.getElementById('modal-root').classList.contains('is-visible'));
  check(await page.locator('.modal-title').textContent() === popoutLabel, 'presenter popout opened wrong audience surface');
  await closeActiveModal();
  const graphicButton = presenter.locator('#p-media-list button').first();
  const graphicLabel = await graphicButton.textContent();
  await graphicButton.click();
  await page.waitForFunction(() => document.getElementById('modal-root').classList.contains('is-visible'));
  check(await page.locator('.modal-title').textContent() === graphicLabel, 'presenter graphic opened wrong audience surface');
  await closeActiveModal();
  evidence.presenterChecks.surfaceButtons = true;

  await presenter.evaluate(() => document.activeElement?.blur());
  await presenter.keyboard.press('d');
  await presenter.waitForFunction(() => document.querySelector('#p-ann-state').textContent === 'On');
  await page.waitForFunction(() => document.querySelector('#annotate-layer').classList.contains('is-on'));
  await presenter.keyboard.press('d');
  await presenter.waitForFunction(() => document.querySelector('#p-ann-state').textContent === 'Off');
  await page.waitForFunction(() => !document.querySelector('#annotate-layer').classList.contains('is-on'));
  const beforeGuard = await presenter.locator('#p-ann-state').textContent();
  await presenter.locator('#p-note-input').fill('');
  await presenter.locator('#p-note-input').press('d');
  check(await presenter.locator('#p-ann-state').textContent() === beforeGuard, 'D toggled drawing while typing in presenter notes');
  check(await presenter.locator('#p-note-input').inputValue() === 'd', 'D shortcut guard swallowed note input');
  evidence.presenterChecks.drawingShortcutAndGuard = true;

  await presenter.evaluate(() => document.activeElement?.blur());
  const navBefore = await page.locator('.nav-count').textContent();
  await presenter.keyboard.press('ArrowRight');
  await page.waitForFunction(before => document.querySelector('.nav-count').textContent !== before, navBefore);
  const navAfterArrow = await page.locator('.nav-count').textContent();
  await presenter.keyboard.press('Space');
  await page.waitForFunction(before => document.querySelector('.nav-count').textContent !== before, navAfterArrow);
  const navAfterSpace = await page.locator('.nav-count').textContent();
  check(navBefore !== navAfterArrow && navAfterArrow !== navAfterSpace, `presenter navigation did not advance ${navBefore}/${navAfterArrow}/${navAfterSpace}`);
  const guardedNav = await page.locator('.nav-count').textContent();
  await presenter.locator('#p-note-input').press('ArrowRight');
  await presenter.locator('#p-note-input').press('Space');
  await page.waitForTimeout(80);
  check(await page.locator('.nav-count').textContent() === guardedNav, 'presenter navigation fired while typing in notes');
  evidence.presenterChecks.arrowSpaceAndGuards = { navBefore, navAfterArrow, navAfterSpace };

  await presenter.setViewportSize({ width: 1280, height: 480 });
  await waitFrames(presenter, 2);
  const scrollEvidence = await presenter.evaluate(() => {
    const right = document.querySelector('.p-right');
    const before = scrollY;
    scrollTo(0, document.documentElement.scrollHeight);
    return {
      before,
      after: scrollY,
      max: document.documentElement.scrollHeight - innerHeight,
      rightOverflowY: getComputedStyle(right).overflowY,
    };
  });
  check(scrollEvidence.after > scrollEvidence.before && scrollEvidence.after > 0, 'presenter right column did not scroll');
  evidence.presenterChecks.dashboardScroll = scrollEvidence;

  const previewFrame = presenter.frames().find(frame => frame !== presenter.mainFrame());
  check(Boolean(previewFrame), 'presenter preview iframe missing');
  if (previewFrame) {
    await previewFrame.waitForLoadState('domcontentloaded');
    await waitFrames(previewFrame, 2);
    const previewAudit = await previewFrame.evaluate(async () => {
      const { inspectComposedSurface, assertComposedSurface } = await import('./tests/fit-browser-audit.js');
      const shell = document.querySelector('.slide-fit-shell');
      const surface = document.querySelector('.slide-scaler');
      const result = inspectComposedSurface({ shell, surface });
      try { assertComposedSurface(result, 'presenter preview'); }
      catch (error) { return { error: error.message } };
      const rect = shell.getBoundingClientRect();
      return { ratio: rect.width / rect.height, active: Boolean(surface.querySelector('.slide.is-active')), rect, viewport: [innerWidth, innerHeight] };
    });
    check(!previewAudit.error, previewAudit.error || 'presenter preview audit error');
    check(previewAudit.active && Math.abs(previewAudit.ratio - 16 / 9) <= 0.001, 'presenter preview is not a complete 16:9 slide');
    evidence.presenterChecks.preview = previewAudit;
  }

  let fullscreenEntered = false;
  let fullscreenExited = false;
  try {
    await presenter.locator('#p-fs').click();
    await page.waitForFunction(() => Boolean(document.fullscreenElement), null, { timeout: 3000 });
    fullscreenEntered = await page.evaluate(() => Boolean(document.fullscreenElement));
    await presenter.locator('#p-fs').click();
    await page.waitForFunction(() => !document.fullscreenElement, null, { timeout: 3000 });
    fullscreenExited = await page.evaluate(() => !document.fullscreenElement);
  } catch (error) {
    errors.push(`fullscreen interaction failed: ${error.message}`);
  }
  check(fullscreenEntered && fullscreenExited, `fullscreen state ${fullscreenEntered}/${fullscreenExited}`);
  evidence.presenterChecks.fullscreen = { entered: fullscreenEntered, exited: fullscreenExited };

  await presenter.close();
  evidence.presenterChecks.presenterClosed = true;
  const result = { status: errors.length ? 'fail' : 'pass', errors, evidence, focusRace, presenterInitial };
  if (errors.length) throw new Error(JSON.stringify(result));
  return result;
}
