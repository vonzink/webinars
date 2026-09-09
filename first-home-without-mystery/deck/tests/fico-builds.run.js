async (page) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4199/#credit-report');
  const check = (ok, message) => { if (!ok) throw new Error(message); };
  const count = () => page.locator('#slide-credit-report .fico-slice.is-in').count();
  await page.waitForTimeout(650);
  check(await count() === 0, 'Chart must wait for the first advance');
  for (let step = 1; step <= 5; step++) {
    await page.keyboard.press('ArrowRight');
    check(await count() === step, `Advance ${step} should reveal ${step} slices`);
    check(page.url().endsWith('#credit-report'), 'Build must stay on slide four');
  }
  await page.keyboard.press('ArrowLeft');
  check(await count() === 4, 'Back should remove one slice');
  await page.keyboard.press('Space');
  check(await count() === 5, 'Space should restore the fifth slice');
  await page.keyboard.press('ArrowRight');
  check(page.url().endsWith('#credit-habits'), 'Advance after completion should change slides');
  await page.keyboard.press('ArrowLeft');
  check(await count() === 0, 'Reentering the chart should reset the build');
  await page.locator('[data-nav="next"]').click();
  check(await count() === 1, 'Navigation button should reveal a slice');
  const session = await page.evaluate(() => window.__msfgDeckSessionId);
  await page.evaluate(id => {
    window.ficoTestChannel = new BroadcastChannel(`msfg-deck:first-home-without-mystery:${id}`);
    window.ficoTestChannel.postMessage({ type: 'animation-next' });
  }, session);
  await page.waitForFunction(() => document.querySelectorAll('#slide-credit-report .fico-slice.is-in').length === 2);
  await page.evaluate(() => window.ficoTestChannel.postMessage({ type: 'animation-prev' }));
  await page.waitForFunction(() => document.querySelectorAll('#slide-credit-report .fico-slice.is-in').length === 1);
  await page.evaluate(() => window.ficoTestChannel.close());
  check(errors.length === 0, errors.join('; '));
  return { status: 'pass', checks: 'manual start, five advances, reverse, space, next slide, reentry, nav button, presenter channel', errors };
}
