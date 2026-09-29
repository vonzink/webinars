async (page) => {
  const baseUrl = `${page.url().replace(/[?#].*$/, '').replace(/\/$/, '')}/`;
  const outputDir = '/Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck/output/playwright';
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`${baseUrl}#opening`);
  const slides = await page.evaluate(async () => (await import('./content/slides.js')).SLIDES.map(slide => slide.id));
  const paths = [];

  for (let index = 0; index < slides.length; index += 1) {
    const id = slides[index];
    await page.evaluate(slideId => { location.hash = slideId; }, id);
    await page.waitForTimeout(900);
    const path = `${outputDir}/slide-${String(index + 1).padStart(2, '0')}-${id}.png`;
    await page.screenshot({ path, fullPage: false });
    paths.push(path);
  }

  await page.evaluate(slideId => { location.hash = slideId; }, 'cash-example');
  await page.getByRole('button', { name: 'Open cash-to-close calculator' }).click();
  await page.waitForTimeout(120);
  const calculatorPath = `${outputDir}/cash-to-close-calculator.png`;
  await page.screenshot({ path: calculatorPath, fullPage: false });
  paths.push(calculatorPath);
  await page.getByRole('button', { name: 'Close cash-to-close calculator' }).click();

  await page.evaluate(async () => (await import('./js/modal.js')).openModal('prog-conventional'));
  await page.waitForTimeout(180);
  const popoutPath = `${outputDir}/program-popout.png`;
  await page.screenshot({ path: popoutPath, fullPage: false });
  paths.push(popoutPath);

  const presenter = await page.context().newPage();
  await presenter.setViewportSize({ width: 1280, height: 800 });
  await presenter.goto(`${baseUrl}presenter.html`);
  await presenter.waitForTimeout(700);
  const presenterPath = `${outputDir}/presenter-view.png`;
  await presenter.screenshot({ path: presenterPath, fullPage: false });
  paths.push(presenterPath);
  await presenter.close();

  return { status: 'pass', paths };
}
