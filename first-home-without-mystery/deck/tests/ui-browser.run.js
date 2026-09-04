async (page) => {
  const failures = [];
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto('http://127.0.0.1:4197/#three-questions');
  await page.waitForTimeout(400);

  const check = (condition, message) => {
    if (!condition) failures.push(message);
  };

  check(await page.locator('.slide').count() === 15, 'all 15 slides must render');
  check(await page.locator('#slide-three-questions .clarity-keys').count() === 1,
    'the three-key clarity line must render');
  check(await page.locator('#slide-credit-report .credit-layers').count() === 1,
    'the credit-report layers must render');

  await page.goto('http://127.0.0.1:4197/#cash-example');
  await page.waitForTimeout(200);
  check(await page.locator('#slide-cash-example .cash-example').count() === 1,
    'the worked cash-to-close example must render');

  const openButton = page.getByRole('button', { name: 'Open cash-to-close calculator' });
  check(await openButton.count() === 1, 'the cash-to-close calculator control must be available');
  if (await openButton.count()) {
    await openButton.click();
    const dialog = page.getByRole('dialog', { name: 'Cash-to-close builder' });
    check(await dialog.isVisible(), 'the cash-to-close calculator must open as a dialog');
    check((await page.locator('[data-cash-total]').textContent())?.trim() === '$30,000',
      'the default calculator total must be $30,000');

    await page.locator('#cash-purchase-price').fill('400000');
    check((await page.locator('[data-cash-total]').textContent())?.trim() === '$35,000',
      'editing the purchase price must recalculate the total');

    await page.getByRole('button', { name: 'Close cash-to-close calculator' }).click();
    check(!(await dialog.isVisible()), 'the cash-to-close calculator must close');
  }

  await page.goto('http://127.0.0.1:4197/#low-down-payment');
  await page.waitForTimeout(200);
  const splitFooter = await page.evaluate(() => {
    const slide = document.querySelector('#slide-low-down-payment');
    const logo = slide.querySelector('.footer-logo img');
    return {
      theme: slide.dataset.footerTheme,
      logo: logo.getAttribute('src'),
      footerColor: getComputedStyle(slide.querySelector('.footer-lines')).color,
    };
  });
  check(splitFooter.theme === 'split', 'split comparison slides must identify their footer theme');
  check(splitFooter.logo.endsWith('logo-horizontal.svg'), 'split comparison slides need the full-color logo on white');
  check(splitFooter.footerColor.includes('255, 255, 255'), 'split comparison footer text must remain light on the dark half');

  check(pageErrors.length === 0, `page errors: ${pageErrors.join(' | ')}`);
  const result = {
    status: failures.length ? 'fail' : 'pass',
    failures,
    pageErrors,
  };
  if (failures.length) throw new Error(JSON.stringify(result));
  return result;
}
