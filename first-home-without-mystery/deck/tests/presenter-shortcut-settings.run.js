async (page) => {
  page.setDefaultTimeout(5000);
  const failures = [];
  const pageErrors = [];
  const check = (condition, message) => {
    if (!condition) failures.push(message);
  };
  const checkpoint = async (label, promise) => {
    try { return await promise; }
    catch (error) { throw new Error(`${label}: ${error.message}`); }
  };
  let storedSettings = null;
  let savedPayload = null;
  let settingsOffline = false;

  page.on('pageerror', error => pageErrors.push(`deck: ${error.message}`));
  await page.context().route('https://api.msfgco.com/webinar/**', async route => {
    const request = route.request();
    const requestUrl = request.url();
    const pathname = requestUrl.split('?')[0];
    const method = request.method();
    if (pathname.endsWith('/loan-officers')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ loanOfficers: [] }) });
    }
    if (pathname.endsWith('/notes')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ notes: [] }) });
    }
    if (pathname.endsWith('/presenter-settings') && method === 'GET') {
      if (settingsOffline) return route.abort('failed');
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ settings: storedSettings }),
      });
    }
    if (pathname.includes('/presenter-settings/') && method === 'PUT') {
      savedPayload = request.postDataJSON();
      storedSettings = {
        lo_id: decodeURIComponent(pathname.split('/').pop()),
        shortcuts: savedPayload.shortcuts,
        updated_at: '2026-09-02T20:05:00Z',
      };
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ settings: storedSettings }) });
    }
    return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'not_found' }) });
  });

  await page.goto('http://127.0.0.1:4206/#opening');
  await page.waitForTimeout(500);
  const presenterPromise = page.waitForEvent('popup');
  await page.locator('[data-nav="presenter"]').click();
  const presenter = await presenterPromise;
  presenter.on('pageerror', error => pageErrors.push(`presenter: ${error.message}`));
  await presenter.setViewportSize({ width: 1280, height: 800 });
  await presenter.waitForLoadState('domcontentloaded');
  const pressPresenter = (code, key) => presenter.evaluate(({ eventCode, eventKey }) => {
    document.body.dispatchEvent(new KeyboardEvent('keydown', {
      code: eventCode,
      key: eventKey,
      bubbles: true,
      cancelable: true,
    }));
  }, { eventCode: code, eventKey: key });

  const settingsButton = presenter.getByRole('button', { name: 'Keyboard shortcut settings' });
  check(await settingsButton.count() === 1, 'presenter must expose one keyboard settings button');
  if (failures.length) throw new Error(JSON.stringify({ status: 'fail', failures, pageErrors }));
  await settingsButton.click();
  const dialog = presenter.getByRole('dialog', { name: 'Keyboard shortcuts' });
  check(await dialog.isVisible(), 'keyboard settings must open as a visible dialog');
  check(await dialog.locator('.p-shortcut-row').count() === 7, 'settings must list all seven presenter actions');

  const nextKeys = dialog.locator('[data-shortcut-action="nextSlide"] .p-key-capture');
  check(await nextKeys.count() === 2, 'next slide must preserve Right Arrow and Space defaults');
  check((await nextKeys.nth(0).textContent()).trim() === '→', 'next slide primary default must be Right Arrow');
  check((await nextKeys.nth(1).textContent()).trim() === 'Space', 'next slide alternate default must be Space');

  const previousKey = dialog.locator('[data-shortcut-action="previousSlide"] .p-key-capture').first();
  await previousKey.click();
  await previousKey.press('a');
  check((await previousKey.textContent()).trim() === 'A', 'a shortcut must be changeable before resetting');
  await dialog.getByRole('button', { name: 'Reset defaults' }).click();
  check((await previousKey.textContent()).trim() === '←', 'Reset defaults must restore the original presenter keys');
  if (failures.length) throw new Error(JSON.stringify({ status: 'fail', failures, pageErrors }));

  await nextKeys.nth(0).click();
  await nextKeys.nth(0).press('x');
  check((await nextKeys.nth(0).textContent()).trim() === 'X', 'captured keys must update their visible assignment');
  if (!page.url().endsWith('#opening')) throw new Error(`capturing a shortcut navigated the deck: ${page.url()}`);

  const drawKey = dialog.locator('[data-shortcut-action="toggleDrawing"] .p-key-capture').first();
  await drawKey.click();
  await drawKey.press('x');
  check((await dialog.locator('#p-shortcut-status').textContent()).includes('KeyX is already assigned to Next slide.'),
    'duplicate shortcuts must explain the conflict');
  check((await drawKey.textContent()).trim() === 'D', 'a rejected duplicate must not replace the existing assignment');

  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await checkpoint('saved confirmation', presenter.waitForFunction(() => (
    document.querySelector('#p-shortcut-status')?.textContent.includes('Saved for Seth Angell.')
  )));
  check(savedPayload?.shortcuts?.nextSlide?.[0] === 'KeyX', 'save must persist the customized key through the presenter API');
  check(savedPayload?.shortcuts?.nextSlide?.[1] === 'Space', 'save must preserve the alternate Space shortcut');
  await dialog.getByRole('button', { name: 'Close keyboard shortcuts' }).click();
  await presenter.locator('body').click({ position: { x: 6, y: 100 } });
  if (!page.url().endsWith('#opening')) throw new Error(`settings interactions navigated the deck: ${page.url()}`);

  await pressPresenter('ArrowRight', 'ArrowRight');
  await presenter.waitForTimeout(100);
  check(page.url().endsWith('#opening'), 'replaced shortcuts must stop invoking the old primary key');
  await pressPresenter('KeyX', 'x');
  await checkpoint('custom next slide', page.waitForFunction(() => location.hash === '#confident-number'));

  await pressPresenter('ArrowLeft', 'ArrowLeft');
  await checkpoint('return to opening', page.waitForFunction(() => location.hash === '#opening'));
  await presenter.locator('#p-note-input').focus();
  await presenter.locator('#p-note-input').press('x');
  await presenter.waitForTimeout(80);
  check(page.url().endsWith('#opening'), 'shortcuts must be ignored while the presenter is typing a note');
  check(await presenter.locator('#p-note-input').inputValue() === 'x', 'typing must continue normally in the note field');
  await presenter.locator('#p-note-input').fill('');
  await presenter.locator('body').click({ position: { x: 5, y: 5 } });

  await pressPresenter('KeyX', 'x');
  await checkpoint('navigate to animation slide', page.waitForFunction(() => location.hash === '#confident-number'));
  await checkpoint('automatic animations complete', page.waitForFunction(() => {
    const active = document.querySelector('.slide.is-active');
    return active && active.querySelectorAll('.build').length > 0 &&
      active.querySelectorAll('.build.is-in').length === active.querySelectorAll('.build').length;
  }));
  const animationTotal = await page.locator('.slide.is-active .build').count();
  await pressPresenter('KeyJ', 'j');
  await checkpoint('J moves animation backward', page.waitForFunction(expected => (
    document.querySelectorAll('.slide.is-active .build.is-in').length === expected
  ), animationTotal - 1));
  await pressPresenter('KeyL', 'l');
  await checkpoint('L moves animation forward', page.waitForFunction(expected => (
    document.querySelectorAll('.slide.is-active .build.is-in').length === expected
  ), animationTotal));

  settingsOffline = true;
  await presenter.reload();
  await checkpoint('presenter reload', presenter.waitForFunction(() => document.querySelector('#p-who')?.textContent.includes('Seth Angell')));
  await pressPresenter('ArrowLeft', 'ArrowLeft');
  await pressPresenter('ArrowLeft', 'ArrowLeft');
  await checkpoint('offline return to opening', page.waitForFunction(() => location.hash === '#opening'));
  await pressPresenter('KeyX', 'x');
  await checkpoint('offline cached shortcut', page.waitForFunction(() => location.hash === '#confident-number'));
  await presenter.getByRole('button', { name: 'Keyboard shortcut settings' }).click();
  check((await presenter.locator('#p-shortcut-status').textContent()).includes('Offline'),
    'offline settings must identify the browser-cache fallback');

  await presenter.screenshot({
    path: '/Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck/output/playwright/presenter-shortcut-settings.png',
    fullPage: false,
  });
  check(pageErrors.length === 0, `page errors: ${pageErrors.join(' | ')}`);
  await presenter.close();

  const result = { status: failures.length ? 'fail' : 'pass', failures, pageErrors };
  if (failures.length) throw new Error(JSON.stringify(result));
  return result;
}
