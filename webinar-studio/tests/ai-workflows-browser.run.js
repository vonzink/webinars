async page => {
  /* The three AI workflows in the built site, against an in-memory stand-in for
     the saved-edits API (nothing reaches a real server). Run by
     run-ai-workflows-browser.sh, which serves the build and opens this session
     from the repository root (screenshot paths are relative to it). */
  const SITE = 'http://127.0.0.1:4300';
  const API = 'http://localhost:8080/api/public/webinar-slide-edits';
  const SHOTS = 'webinar-studio/output/playwright';
  const failures = [];
  const check = (ok, message) => { if (!ok) failures.push(message); };
  const store = new Map();                       // slug -> Map(slideId -> { html, css, js })
  const writes = [];                             // every PUT / DELETE: [method, slug, slideId]
  let failOn = null;                             // a slideId whose save answers 503
  const slugStore = slug => { if (!store.has(slug)) store.set(slug, new Map()); return store.get(slug); };
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type, x-webinar-edit-password', 'access-control-allow-methods': 'GET, PUT, DELETE, OPTIONS' };
  const json = (route, status, body) => route.fulfill({ status, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify(body) });

  await page.route(`${API}**`, async route => {
    const request = route.request();
    const parts = new URL(request.url()).pathname.replace('/api/public/webinar-slide-edits', '').split('/').filter(Boolean).map(decodeURIComponent);
    const [slug, slideId] = parts;
    const method = request.method();
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    if (method === 'GET' && !slug) {
      const webinars = [...store.entries()].filter(([, edits]) => edits.has('_webinar'))
        .map(([name, edits]) => ({ slug: name, title: JSON.parse(edits.get('_webinar').html).title, createdAt: new Date().toISOString() }));
      return json(route, 200, { webinars });
    }
    if (method === 'GET') return json(route, 200, { edits: [...slugStore(slug).entries()].map(([id, edit]) => ({ slideId: id, ...edit })) });
    writes.push([method, slug, slideId]);
    if (request.headers()['x-webinar-edit-password'] !== 'pw') return json(route, 401, { error: 'no' });
    if (failOn && slideId === failOn) return json(route, 503, { error: 'down' });
    if (method === 'PUT') { slugStore(slug).set(slideId, JSON.parse(request.postData())); return json(route, 200, { ok: true }); }
    if (method === 'DELETE') { slugStore(slug).delete(slideId); return json(route, 200, { ok: true }); }
    return json(route, 405, {});
  });

  const footer = '<footer class="source-footer"><p>AI-made footer, wrong</p></footer>';
  const aiSlide = (title, extra = '') => `<header class="source-header"><h2 class="source-title x-title">${title}</h2><div class="accent-bar"></div></header>\n<div class="source-content"><p class="source-lead">${title}: one clear idea.</p>${extra}</div>`;
  const PRESENTATION = {
    title: 'AI Browser Check',
    masterCss: '.slide { --x-accent: #8cc63E; }\n.slide .x-title { color: rgb(20, 73, 75); }\n.slide .x-card { padding: 24px; border-top: 6px solid var(--x-accent); }',
    slides: [
      { title: 'Welcome', html: aiSlide('Welcome'), css: '', js: '' },
      { title: 'Who qualifies', html: `${aiSlide('Who qualifies', '<div class="x-card">Card</div>')}\n${footer}`, css: '', js: '' },
      { title: 'Questions?', html: aiSlide('Questions?'), css: '& { background: #0C3335; }', js: 'slide.dataset.ran = "yes";' },
    ],
  };

  /* ---------- 1. Webinar Suite: Create with AI ---------- */
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${SITE}/webinars/studio/home.html`);
  check(await page.title() === 'Webinar Suite — Mountain State Financial Group', `home title: ${await page.title()}`);
  await page.waitForFunction(() => document.querySelectorAll('#s-ai-presenter option').length === 3);
  await page.fill('#s-ai-request', 'A three-slide check of the AI workflow.');
  await page.selectOption('#s-ai-presenter', 'robert');
  await page.click('#s-ai-copy');
  const homePrompt = await page.inputValue('#s-ai-prompt');
  check(homePrompt.includes('Name: Robert Hoff') && homePrompt.includes('A three-slide check of the AI workflow.') && !homePrompt.includes('Seth Angell'),
    'presentation prompt carries the request and Robert, not Seth');

  await page.fill('#s-ai-answer', `Option A:\n${JSON.stringify(PRESENTATION)}\nOption B:\n${JSON.stringify(PRESENTATION)}`);
  await page.click('#s-ai-preview');
  check(/more than one block of JSON/.test(await page.textContent('#s-ai-errors')), 'two JSON answers are refused');
  check(await page.isHidden('#s-ai-review'), 'no preview for a refused response');

  /* a straight copy-paste of the whole response, sentences and all */
  await page.fill('#s-ai-answer', `Sure! Here is your presentation:\n\n\`\`\`json\n${JSON.stringify(PRESENTATION, null, 2)}\n\`\`\`\n\nLet me know if you want changes.`);
  await page.click('#s-ai-preview');
  await page.waitForSelector('#s-ai-review', { state: 'visible' });
  const preview = page.frameLocator('#s-ai-frame');
  await preview.locator('.slide.is-active .x-title').first().waitFor();
  const first = await preview.locator('.slide.is-active').first().evaluate(el => ({
    footers: el.querySelectorAll('.source-footer').length,
    footer: el.querySelector('.source-footer')?.textContent || '',
    color: getComputedStyle(el.querySelector('.x-title')).color,
  }));
  check(first.footers === 1 && first.footer.includes('Robert Hoff') && !first.footer.includes('Seth'), `preview slide 1 footer: ${JSON.stringify(first)}`);
  check(first.color === 'rgb(20, 73, 75)', `the previewed Master CSS applies: ${first.color}`);
  await page.locator('#s-ai-review').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${SHOTS}/1-suite-preview.png` });
  await page.click('#s-ai-next');
  await page.waitForTimeout(250);
  const second = await preview.locator('.slide.is-active').first().evaluate(el => ({
    title: el.querySelector('h2')?.textContent, footers: el.querySelectorAll('.source-footer').length, wrong: el.textContent.includes('AI-made footer'),
  }));
  check(second.title === 'Who qualifies' && second.footers === 1 && !second.wrong, `preview slide 2: ${JSON.stringify(second)}`);
  check(writes.length === 0, `preview wrote to the server: ${JSON.stringify(writes)}`);

  /* a failure part-way: nothing appears in Webinar Suite */
  await page.fill('#s-password', 'pw');
  failOn = '_slides';
  await page.click('#s-ai-create');
  await page.waitForFunction(() => /was not created/.test(document.querySelector('#s-ai-saving').textContent));
  check(!slugStore('ai-browser-check').has('_webinar'), 'a failed creation wrote _webinar');
  check(writes.at(-1)[2] === '_slides', `stopped at the failure: ${JSON.stringify(writes.map(w => w[2]))}`);
  await page.locator('#s-ai-saving').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${SHOTS}/2-suite-create-failed.png` });

  /* trying again finishes it */
  failOn = null;
  const before = writes.length;
  await page.click('#s-ai-create');
  await page.waitForURL(/editor\.html\?w=ai-browser-check/);
  const retried = writes.slice(before).map(w => w[2]);
  check(retried.at(-1) === '_webinar' && retried.at(-2) === '_slides' && retried.at(-3) === '_master', `save order: ${retried.join(', ')}`);
  const saved = slugStore('ai-browser-check');
  check(saved.get('_master').css === PRESENTATION.masterCss, 'the saved Master CSS is the previewed one');
  const savedSlides = [...saved.keys()].filter(id => id.startsWith('ai-'));
  check(savedSlides.length === 3, `three generated slides saved, not duplicated by the retry: ${savedSlides}`);

  /* ---------- 2. Slide settings on the new presentation ---------- */
  await page.waitForFunction(() => document.querySelectorAll('#e-list .e-item').length === 4);
  const suite = await page.locator('#e-studio').evaluate(a => ({ text: a.textContent, href: a.href, hidden: a.hidden }));
  check(suite.text === 'Webinar Suite' && !suite.hidden && suite.href.endsWith('/webinars/studio/home.html'), `Webinar Suite link: ${JSON.stringify(suite)}`);
  const titles = await page.locator('#e-list .e-item-title').allTextContents();
  check(JSON.stringify(titles) === JSON.stringify(['Master CSS', 'Welcome', 'Who qualifies', 'Questions?']), `slide list: ${titles}`);
  check(await page.locator('.e-deleted').count() === 0, 'the starter slides are not shown as deleted slides');
  await page.screenshot({ path: `${SHOTS}/3-editor-created.png` });

  /* add several slides */
  await page.click('#e-list .e-item:nth-child(3)');       // "Who qualifies"
  await page.click('#e-ai-many-open');
  await page.fill('#e-ai-many-request', 'Two slides on fees.');
  const manyPrompt = await page.inputValue('#e-ai-many-prompt');
  check(manyPrompt.includes('2. Who qualifies   <- the new slides go right after this one'), 'multi-slide prompt has the outline and insertion point');
  check(manyPrompt.includes('DESIGN SYSTEM') && manyPrompt.includes('.x-card'), 'multi-slide prompt has the design-system summary');
  check(manyPrompt.includes('Robert Hoff • NMLS #608235') && !manyPrompt.includes('Seth Angell'), 'multi-slide prompt uses the webinar\'s own presenter footer');
  const writesBeforeAdd = writes.length;
  await page.fill('#e-ai-many-answer', JSON.stringify({ slides: [{ title: 'Fees', html: aiSlide('Fees') }, { title: 'Closing costs', html: aiSlide('Closing costs') }] }));
  await page.click('#e-ai-many-preview');
  await page.waitForSelector('#e-ai-many-review', { state: 'visible' });
  await page.frameLocator('#e-ai-many-frame').locator('.slide.is-active h2').first().waitFor();
  const addPreview = await page.frameLocator('#e-ai-many-frame').locator('.slide.is-active').first().evaluate(el => ({
    title: el.querySelector('h2').textContent, footers: el.querySelectorAll('.source-footer').length, robert: el.textContent.includes('Robert Hoff'),
  }));
  check(addPreview.title === 'Fees' && addPreview.footers === 1 && addPreview.robert, `add preview: ${JSON.stringify(addPreview)}`);
  check(writes.length === writesBeforeAdd, 'the multi-slide preview wrote nothing');
  await page.screenshot({ path: `${SHOTS}/4-editor-add-preview.png` });
  await page.click('#e-ai-many-apply');
  await page.waitForFunction(() => document.querySelectorAll('#e-list .e-item').length === 6);
  const afterAdd = await page.locator('#e-list .e-item-title').allTextContents();
  check(JSON.stringify(afterAdd.slice(1)) === JSON.stringify(['Welcome', 'Who qualifies', 'Fees', 'Closing costs', 'Questions?']), `after add: ${afterAdd}`);

  /* change one chosen slide */
  const ids = await page.locator('#e-list .e-item').evaluateAll(items => items.map(item => item.dataset.id));
  const chosen = ids[2];                                     // "Who qualifies"
  await page.click(`#e-list .e-item[data-id="${chosen}"]`);
  const snapshot = JSON.stringify([...saved.entries()].filter(([id]) => id !== chosen));
  await page.click('#e-ai-many-open');
  await page.check('input[name="e-ai-mode"][value="replace"]');
  check(await page.isChecked(`#e-ai-pick input[value="${chosen}"]`), 'the open slide is chosen to change');
  const replacePrompt = await page.inputValue('#e-ai-many-prompt');
  check(replacePrompt.includes(`id "${chosen}"`) && replacePrompt.includes('"id": "the id of the slide'), 'replace prompt gives the slide id');
  await page.fill('#e-ai-many-answer', JSON.stringify({ slides: [{ id: ids[1], html: aiSlide('Sneaky') }] }));
  await page.click('#e-ai-many-preview');
  check(/not one of the slides chosen/.test(await page.textContent('#e-ai-many-errors')), 'an unchosen slide cannot be changed');
  await page.screenshot({ path: `${SHOTS}/5-editor-replace-refused.png` });
  await page.fill('#e-ai-many-answer', JSON.stringify({ slides: [{ id: chosen, title: 'Who qualifies (short)', html: aiSlide('Who qualifies (short)') }] }));
  await page.click('#e-ai-many-preview');
  await page.waitForSelector('#e-ai-many-review', { state: 'visible' });
  await page.click('#e-ai-many-apply');
  await page.waitForFunction(() => !document.querySelector('#e-ai-many').open);
  const changed = saved.get(chosen);
  check(changed.html.includes('Who qualifies (short)') && changed.html.split('class="source-footer"').length === 2, 'the chosen slide was replaced, with one footer');
  check(JSON.stringify([...saved.entries()].filter(([id]) => id !== chosen)) === snapshot, 'nothing else was changed');
  const order = await page.locator('#e-list .e-item').evaluateAll(items => items.map(item => item.dataset.id));
  check(JSON.stringify(order) === JSON.stringify(ids), 'the replaced slide kept its place');

  /* edit this slide with AI: a draft until saved */
  const writesBeforeOne = writes.length;
  await page.click('#e-ai-slide-open');
  await page.fill('#e-ai-slide-request', 'Make the title shorter.');
  check((await page.inputValue('#e-ai-slide-prompt')).includes('WHAT I WANT\nMake the title shorter.'), 'single-slide prompt carries the request');
  check((await page.inputValue('#e-ai-slide-prompt')).includes('THE PRESENTATION\'S MASTER CSS'), 'single-slide prompt carries the Master CSS');
  await page.fill('#e-ai-slide-answer', 'Here:\n```html\n<h2 class="source-title">Who qualifies?</h2>\n```\n```css\n\n```\n```js\n\n```\nDone.');
  await page.click('#e-ai-slide-preview');
  const html = await page.inputValue('#e-html');
  check(html.includes('Who qualifies?') && html.split('class="source-footer"').length === 2, 'the slide got its footer back');
  check(/Not saved yet/.test(await page.textContent('#e-status')) && writes.length === writesBeforeOne, 'the one-slide preview saved nothing');
  await page.screenshot({ path: `${SHOTS}/6-editor-one-slide-draft.png` });
  await page.click('#e-save');
  await page.waitForFunction(() => /Saved/.test(document.querySelector('#e-status').textContent));
  check(writes.length === writesBeforeOne + 1, 'Save for everyone saved it');

  /* add / move / delete still work */
  await page.click('#e-add');
  await page.waitForFunction(() => document.querySelectorAll('#e-list .e-item').length === 7);
  await page.click('#e-move-up');
  await page.waitForFunction(() => /moved/.test(document.querySelector('#e-status').textContent));
  await page.click('#e-delete');
  await page.click('#e-delete');
  await page.waitForFunction(() => document.querySelectorAll('#e-list .e-item').length === 6);

  /* ---------- 3. A built-in deck keeps its saved edits and links to Webinar Suite ---------- */
  slugStore('reverse-mortgages').set('what-is-hecm', { html: '<h2 class="source-title">Seeded saved edit</h2>', css: '', js: '' });
  await page.goto(`${SITE}/webinars/reverse-mortgages/editor.html#what-is-hecm`);
  await page.waitForFunction(() => document.querySelectorAll('#e-list .e-item').length > 10);
  const seeded = await page.frameLocator('#e-preview').locator('#slide-what-is-hecm h2').first().textContent();
  check(seeded === 'Seeded saved edit', `saved edit shown: ${seeded}`);
  const reverseSuite = await page.locator('#e-studio').evaluate(a => ({ text: a.textContent, href: a.href }));
  check(reverseSuite.text === 'Webinar Suite' && reverseSuite.href === `${SITE}/webinars/studio/home.html`, `reverse link: ${JSON.stringify(reverseSuite)}`);
  const reached = await page.evaluate(async href => (await fetch(href)).status, reverseSuite.href);
  check(reached === 200, `Webinar Suite link resolves: ${reached}`);
  await page.click('#e-ai-slide-open');
  const reversePrompt = await page.inputValue('#e-ai-slide-prompt');
  check(reversePrompt.includes('Seth Angell • NMLS #912881'), 'Reverse Mortgages keeps its Seth footer');
  await page.screenshot({ path: `${SHOTS}/7-reverse-one-slide-dialog.png` });

  return { status: failures.length ? 'fail' : 'pass', failures, writes: writes.length };
}
