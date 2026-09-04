async (page) => {
  const failures = [];
  const pageErrors = [];
  const check = (condition, message) => {
    if (!condition) failures.push(message);
  };
  const notes = [{
    id: 'note-1',
    slide_id: 'opening',
    body: 'Pause here and ask who is buying in the next twelve months.',
    updated_at: '2026-09-02T18:00:00Z',
  }];

  page.on('pageerror', error => pageErrors.push(error.message));
  await page.context().route('https://api.msfgco.com/webinar/**', async route => {
    const request = route.request();
    const requestUrl = request.url();
    const pathname = requestUrl.split('?')[0];
    const method = request.method();
    let body;

    if (pathname.endsWith('/loan-officers')) {
      body = { loanOfficers: [] };
    } else if (method === 'GET') {
      body = { notes };
    } else if (method === 'POST') {
      const data = request.postDataJSON();
      const note = {
        id: 'note-2',
        slide_id: data.slide,
        body: data.body,
        updated_at: '2026-09-02T18:01:00Z',
      };
      notes.push(note);
      body = { note };
    } else if (method === 'PUT') {
      const id = pathname.split('/').pop();
      const note = notes.find(item => item.id === id);
      note.body = request.postDataJSON().body;
      body = { note };
    } else if (method === 'DELETE') {
      const id = pathname.split('/').pop();
      const noteIndex = notes.findIndex(item => item.id === id);
      if (noteIndex >= 0) notes.splice(noteIndex, 1);
      body = { ok: true };
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('http://127.0.0.1:4204/presenter.html');
  await page.waitForFunction(() => document.querySelectorAll('.p-note').length === 1);

  const save = page.getByRole('button', { name: 'Save note' });
  check(await save.count() === 1, 'save note control must remain accessible by name');
  if (await save.count()) {
    check((await save.textContent()).trim() === '', 'save note must be icon-only');
    const geometry = await page.evaluate(() => {
      const composer = document.querySelector('.p-note-add').getBoundingClientRect();
      const button = document.querySelector('#p-note-save').getBoundingClientRect();
      return {
        width: button.width,
        height: button.height,
        topGap: button.top - composer.top,
        rightGap: composer.right - button.right,
      };
    });
    check(geometry.width <= 32 && geometry.height <= 32, 'save note must be annotation-icon sized');
    check(geometry.topGap <= 12 && geometry.rightGap <= 12,
      'save note must sit in the composer upper-right corner');
  }

  await page.locator('#p-note-input').fill('Bring the conversation back to the three questions.');
  await save.click();
  await page.waitForFunction(() => document.querySelectorAll('.p-note').length === 2);

  const cards = page.locator('.p-note');
  for (let index = 0; index < await cards.count(); index += 1) {
    const card = cards.nth(index);
    const edit = card.getByRole('button', { name: 'Edit note' });
    const remove = card.getByRole('button', { name: 'Delete note' });
    check(await edit.count() === 1, `note ${index + 1} must have an accessible edit icon`);
    check(await remove.count() === 1, `note ${index + 1} must have an accessible delete icon`);
    if (await edit.count() && await remove.count()) {
      check((await edit.textContent()).trim() === '', `note ${index + 1} edit control must be icon-only`);
      check((await remove.textContent()).trim() === '', `note ${index + 1} delete control must be icon-only`);
      const geometry = await card.evaluate(cardElement => {
        const cardRect = cardElement.getBoundingClientRect();
        const actionsElement = cardElement.querySelector('.p-note-actions');
        const actionsRect = actionsElement.getBoundingClientRect();
        const buttons = Array.from(actionsElement.querySelectorAll('button'), button => {
          const rect = button.getBoundingClientRect();
          return { width: rect.width, height: rect.height };
        });
        return {
          topGap: actionsRect.top - cardRect.top,
          rightGap: cardRect.right - actionsRect.right,
          buttons,
        };
      });
      check(geometry.topGap <= 10 && geometry.rightGap <= 10,
        `note ${index + 1} actions must sit in the upper-right corner`);
      check(geometry.buttons.every(({ width, height }) => width <= 30 && height <= 30),
        `note ${index + 1} action icons must remain compact`);
    }
  }

  await page.screenshot({
    path: '/Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck/output/playwright/presenter-note-controls.png',
    fullPage: false,
  });

  const firstCard = page.locator('[data-note-id="note-1"]');
  if (await firstCard.count()) {
    await page.evaluate(() => {
      window.prompt = () => 'Ask for a quick show of hands before continuing.';
    });
    await firstCard.getByRole('button', { name: 'Edit note' }).click();
    await page.waitForFunction(() => (
      document.querySelector('[data-note-id="note-1"] .p-note-body')?.textContent ===
      'Ask for a quick show of hands before continuing.'
    ));
  }

  const secondCard = page.locator('[data-note-id="note-2"]');
  if (await secondCard.count()) {
    await secondCard.getByRole('button', { name: 'Delete note' }).click();
    await page.waitForFunction(() => !document.querySelector('[data-note-id="note-2"]'));
  }
  check(await page.locator('.p-note .row').count() === 0,
    'notes must no longer reserve a lower action row');
  check(pageErrors.length === 0, `page errors: ${pageErrors.join(' | ')}`);

  const result = {
    status: failures.length ? 'fail' : 'pass',
    failures,
    pageErrors,
  };
  if (failures.length) throw new Error(JSON.stringify(result));
  return result;
}
