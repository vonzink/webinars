async (page) => {
  const deckUrl = `${page.url().replace(/[?#].*$/, '').replace(/\/$/, '')}/`;
  const paintReady = (count = 3) => page.evaluate(frames => new Promise(resolve => {
    const step = () => frames-- > 0 ? requestAnimationFrame(step) : resolve();
    requestAnimationFrame(step);
  }), count);
  const audit = label => page.evaluate(async label => {
    const { inspectComposedSurface, assertComposedSurface } = await import('./tests/fit-browser-audit.js');
    const isModal = document.getElementById('modal-root').classList.contains('is-open');
    const isCalculator = !document.querySelector('[data-calculator-overlay]').hidden;
    const shell = isModal ? document.querySelector('.modal-shell')
      : isCalculator ? document.querySelector('.calculator-panel')
      : document.querySelector('.slide-fit-shell');
    const surface = isModal ? document.querySelector('.modal')
      : isCalculator ? document.querySelector('.calculator-canvas')
      : document.querySelector('.slide-scaler');
    const result = inspectComposedSurface({ shell, surface });
    assertComposedSurface(result, label);
    return result;
  }, label);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`${deckUrl}#myths`);
  await page.setViewportSize({ width: 480, height: 800 });
  await page.waitForTimeout(1000);
  await paintReady();
  const slideAudit = await audit('paint-ready slide');
  await page.screenshot({ path: 'first-time-homebuyer/deck/output/playwright/fit-slide-480x800.png', fullPage: true });

  await page.setViewportSize({ width: 800, height: 480 });
  await page.evaluate(async () => {
    const calculator = await import('./js/calculator.js');
    calculator.setCalculatorVisible(true, document.querySelector('[data-nav="presenter"]'));
    const toggle = document.querySelector('[data-calculator-toggle]');
    if (toggle.getAttribute('aria-expanded') !== 'true') toggle.click();
    const hoa = document.querySelector('[data-calculator-field="hoaMonthly"]');
    hoa.value = '250';
    hoa.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await paintReady();
  const calculatorAudit = await audit('paint-ready calculator');
  await page.screenshot({ path: 'first-time-homebuyer/deck/output/playwright/fit-calculator-expanded-800x480.png', fullPage: true });
  await page.locator('.calculator-close').click();

  await page.setViewportSize({ width: 480, height: 800 });
  await page.evaluate(async () => {
    const modal = await import('./js/modal.js');
    await modal.openModal('myth-lowest-rate', document.querySelector('[data-nav="presenter"]'));
  });
  await paintReady();
  const popoutAudit = await audit('paint-ready popout');
  await page.screenshot({ path: 'first-time-homebuyer/deck/output/playwright/fit-popout-480x800.png', fullPage: true });
  await page.evaluate(async () => (await import('./js/modal.js')).closeModal());

  await page.setViewportSize({ width: 800, height: 480 });
  const immediate = await page.evaluate(async () => {
    const modal = await import('./js/modal.js');
    const started = performance.now();
    const opened = await modal.openMedia('budget-smart', document.querySelector('[data-nav="presenter"]'));
    const image = document.querySelector('.modal-media-frame img');
    return {
      opened,
      elapsedMs: performance.now() - started,
      decoded: image.complete && image.naturalWidth > 0 && image.naturalHeight > 0,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      rootVisible: document.getElementById('modal-root').classList.contains('is-visible'),
    };
  });
  await page.screenshot({ path: 'first-time-homebuyer/deck/output/playwright/fit-graphic-immediate-800x480.png', fullPage: true });
  await paintReady(1);
  await page.screenshot({ path: 'first-time-homebuyer/deck/output/playwright/fit-graphic-after-one-frame-800x480.png', fullPage: true });
  await paintReady(2);
  const graphicAudit = await audit('paint-ready graphic');
  await page.screenshot({ path: 'first-time-homebuyer/deck/output/playwright/fit-graphic-800x480.png', fullPage: true });
  await page.evaluate(async () => (await import('./js/modal.js')).closeModal());

  return { status: 'pass', screenshots: 6, slideAudit, calculatorAudit, popoutAudit, graphicAudit, immediate };
}
