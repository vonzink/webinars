async (opening) => {
  opening.setDefaultTimeout(5000);
  const failures = [];
  const pageErrors = [];
  const check = (condition, message) => {
    if (!condition) failures.push(message);
  };

  opening.on('pageerror', error => pageErrors.push(`opening: ${error.message}`));
  await opening.context().route('https://api.msfgco.com/webinar/**', async route => {
    const url = route.request().url();
    const body = url.includes('/loan-officers')
      ? { loanOfficers: [] }
      : url.includes('/presenter-settings')
        ? { settings: null }
        : { notes: [] };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });

  await opening.goto('http://127.0.0.1:4214/#opening');
  const stale = await opening.context().newPage();
  stale.on('pageerror', error => pageErrors.push(`stale: ${error.message}`));
  await stale.goto('http://127.0.0.1:4214/#confident-number');

  const presenterPromise = opening.waitForEvent('popup');
  await opening.locator('[data-nav="presenter"]').click();
  const presenter = await presenterPromise;
  presenter.on('pageerror', error => pageErrors.push(`presenter: ${error.message}`));
  await presenter.waitForLoadState('domcontentloaded');
  await presenter.waitForTimeout(700);

  check((await presenter.locator('#p-position').textContent())?.trim() === '1 / 15',
    'presenter must stay paired to the opening deck instead of adopting a stale tab');

  await presenter.locator('#p-next-btn').click();
  await opening.waitForFunction(() => location.hash === '#confident-number');
  await presenter.waitForTimeout(250);
  check(stale.url().endsWith('#confident-number'),
    'presenter navigation must not advance another open deck tab');
  check((await presenter.locator('#p-position').textContent())?.trim() === '2 / 15',
    'presenter must remain synchronized with the deck that opened it');

  check(pageErrors.length === 0, `page errors: ${pageErrors.join(' | ')}`);
  await presenter.close();
  await stale.close();

  const result = { status: failures.length ? 'fail' : 'pass', failures, pageErrors };
  if (failures.length) throw new Error(JSON.stringify(result));
  return result;
}
