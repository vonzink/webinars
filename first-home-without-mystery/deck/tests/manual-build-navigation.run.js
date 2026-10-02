async (page) => {
  const failures = [];
  const pageErrors = [];
  const check = (condition, message) => { if (!condition) failures.push(message); };
  const buildState = () => page.evaluate(() => ({
    anchor: location.hash,
    total: document.querySelectorAll('.slide.is-active .build-step').length,
    revealed: document.querySelectorAll('.slide.is-active .build-step.is-in').length,
  }));

  page.on('pageerror', error => pageErrors.push(`deck: ${error.message}`));
  await page.context().route('https://api.msfgco.com/webinar/**', async route => {
    const body = route.request().url().includes('/loan-officers')
      ? { loanOfficers: [] }
      : { notes: [] };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });

  await page.goto('http://127.0.0.1:4205/#credit-report');
  await page.waitForTimeout(500);
  let state = await buildState();
  check(state.total === 3 && state.revealed === 0, 'credit slide must begin with three hidden manual builds');

  await page.keyboard.press('ArrowRight');
  state = await buildState();
  check(state.anchor === '#credit-report' && state.revealed === 1, 'right arrow must reveal one build');

  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowLeft');
  state = await buildState();
  check(state.anchor === '#credit-report' && state.revealed === 1, 'left arrow must hide one build before changing slides');

  const presenterPromise = page.waitForEvent('popup');
  await page.locator('[data-nav="presenter"]').click();
  const presenter = await presenterPromise;
  presenter.on('pageerror', error => pageErrors.push(`presenter: ${error.message}`));
  await presenter.waitForLoadState('domcontentloaded');
  await presenter.waitForTimeout(500);

  await presenter.getByRole('button', { name: 'Next animation build' }).click();
  state = await buildState();
  check(state.anchor === '#credit-report' && state.revealed === 2, 'presenter animation forward must reveal one build');

  await presenter.locator('#p-next-btn').click();
  await page.waitForFunction(() => location.hash === '#loan-programs');
  state = await buildState();
  check(state.anchor === '#loan-programs' && state.revealed === 0, 'presenter Next must change slides without exhausting builds');
  check(state.total === 5, 'loan slide must expose four program builds followed by the market snapshot');

  const preview = await page.context().newPage();
  await preview.goto('http://127.0.0.1:4205/?preview#loan-programs');
  await preview.waitForTimeout(250);
  const previewState = await preview.evaluate(() => ({
    total: document.querySelectorAll('.slide.is-active .build-step').length,
    revealed: document.querySelectorAll('.slide.is-active .build-step.is-in').length,
  }));
  check(previewState.total === 5 && previewState.revealed === 5,
    'presenter previews must render every manual build instead of a blank slide');
  await preview.close();

  await presenter.close();
  check(pageErrors.length === 0, `page errors: ${pageErrors.join(' | ')}`);
  const result = { status: failures.length ? 'fail' : 'pass', failures, pageErrors };
  if (failures.length) throw new Error(JSON.stringify(result));
  return result;
}
