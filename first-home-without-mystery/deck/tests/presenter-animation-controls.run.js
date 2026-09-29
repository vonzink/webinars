async (page) => {
  const failures = [];
  const pageErrors = [];
  const check = (condition, message) => {
    if (!condition) failures.push(message);
  };

  page.on('pageerror', error => pageErrors.push(`deck: ${error.message}`));
  await page.context().route('https://api.msfgco.com/webinar/**', async route => {
    const body = route.request().url().includes('/loan-officers')
      ? { loanOfficers: [] }
      : { notes: [] };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });

  await page.goto('http://127.0.0.1:4202/#confident-number');
  await page.waitForTimeout(900);

  const presenterPromise = page.waitForEvent('popup');
  await page.locator('[data-nav="presenter"]').click();
  const presenter = await presenterPromise;
  presenter.on('pageerror', error => pageErrors.push(`presenter: ${error.message}`));
  await presenter.setViewportSize({ width: 1280, height: 800 });
  await presenter.waitForLoadState('domcontentloaded');
  await presenter.waitForTimeout(700);

  const previous = presenter.getByRole('button', { name: 'Previous animation build' });
  const play = presenter.getByRole('button', { name: 'Play animations' });
  const pause = presenter.getByRole('button', { name: 'Pause animations' });
  const next = presenter.getByRole('button', { name: 'Next animation build' });

  check(await previous.count() === 1, 'previous animation control must exist');
  check(await play.count() === 1, 'play animation control must exist');
  check(await pause.count() === 1, 'pause animation control must exist');
  check(await next.count() === 1, 'next animation control must exist');

  if (failures.length === 0) {
    const initial = await page.evaluate(() => {
      const active = document.querySelector('.slide.is-active');
      return {
        total: active.querySelectorAll('.build').length,
        revealed: active.querySelectorAll('.build.is-in').length,
      };
    });
    check(initial.total >= 4, 'test slide must expose several animation builds');
    check(initial.revealed === initial.total, 'automatic slide animation must still finish normally');
    check((await presenter.locator('#p-animation-status').textContent())?.trim() === `${initial.total} / ${initial.total}`,
      'presenter must report the completed automatic animation state');

    const geometry = await presenter.evaluate(() => {
      const row = document.querySelector('.p-animation-row').getBoundingClientRect();
      const nav = document.querySelector('.p-controls').getBoundingClientRect();
      const buttons = Array.from(document.querySelectorAll('.p-animation-tools button'), button => {
        const rect = button.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      });
      return { row, nav, buttons };
    });
    check(geometry.row.bottom <= geometry.nav.top && geometry.nav.top - geometry.row.bottom <= 14,
      'animation controls must sit directly above slide navigation');
    check(geometry.buttons.every(({ width, height }) => width <= 34 && height <= 32),
      'animation controls must remain annotation-icon sized');

    await previous.click();
    await page.waitForFunction(expected => (
      document.querySelectorAll('.slide.is-active .build.is-in').length === expected
    ), initial.total - 1);
    check((await presenter.locator('#p-animation-status').textContent())?.trim() === `${initial.total - 1} / ${initial.total}`,
      'previous animation must update presenter progress');

    await next.click();
    await page.waitForFunction(expected => (
      document.querySelectorAll('.slide.is-active .build.is-in').length === expected
    ), initial.total);

    await previous.click();
    await previous.click();
    await previous.click();
    await page.waitForFunction(expected => (
      document.querySelectorAll('.slide.is-active .build.is-in').length === expected
    ), initial.total - 3);
    await play.click();
    await page.waitForTimeout(80);
    await pause.click();
    const pausedCount = await page.locator('.slide.is-active .build.is-in').count();
    await page.waitForTimeout(450);
    check(await page.locator('.slide.is-active .build.is-in').count() === pausedCount,
      'pause must hold the shared slide at the current animation build');

    await play.click();
    await page.waitForFunction(expected => (
      document.querySelectorAll('.slide.is-active .build.is-in').length === expected
    ), initial.total);
    check(await pause.isDisabled(), 'pause must disable when playback completes');

    await play.click();
    await page.waitForTimeout(20);
    check(await page.locator('.slide.is-active .build.is-in').count() === 0,
      'play at the end must replay animations from the beginning');
    await pause.click();

    await presenter.locator('#p-next-btn').click();
    await page.waitForFunction(() => location.hash === '#three-questions');
    check((await presenter.locator('#p-position').textContent())?.trim() === '3 / 15',
      'slide navigation must remain separate and synchronized');
  }

  check(pageErrors.length === 0, `page errors: ${pageErrors.join(' | ')}`);
  await presenter.screenshot({
    path: '/Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck/output/playwright/presenter-animation-controls.png',
    fullPage: false,
  });
  await presenter.close();

  const result = {
    status: failures.length ? 'fail' : 'pass',
    failures,
    pageErrors,
  };
  if (failures.length) throw new Error(JSON.stringify(result));
  return result;
}
