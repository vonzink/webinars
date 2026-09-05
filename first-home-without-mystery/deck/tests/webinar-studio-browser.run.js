/* Private Webinar Studio browser acceptance (Editor Task 9).
   Run through tests/run-webinar-studio-browser-audit.sh, which builds the harness
   (tests/webinar-studio-harness/build-harness.sh), serves the Dashboard harness and
   this deck on two loopback origins, opens the Dashboard harness page, and hands it
   to this function as `page`.

   Everything real: the Studio modules and markup from the Dashboard checkout, this
   deck's studio-viewer.html as the exact-origin preview host and as the audience
   window, the slide sandbox, and the two-window bridge. Only the authenticated
   ServerAPI is an in-memory fixture (harness-tail.html), and the public live bundle
   and asset transport are fulfilled by Playwright routes. Nothing is deployed. */
async (page) => {
  page.setDefaultTimeout(15000);
  const context = page.context();
  const dashboardOrigin = page.url().match(/^https?:\/\/[^/]+/)[0];
  const failures = [];
  const checks = [];
  const pageErrors = [];
  const unexpectedRequests = [];
  const screenshots = [];
  const transportPuts = [];
  const check = (name, ok, detail = '') => { checks.push({ name, ok, detail }); if (!ok) failures.push(detail ? `${name} — ${detail}` : name); };
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const P = '#wsSettingsPanel ';
  const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAD0lEQVQIW2NkYGD4z8DAAAAEAwEA1u6bnwAAAABJRU5ErkJggg==', 'base64');

  const fixture = await (await page.request.get(`${dashboardOrigin}/fixture.js`)).text();
  const bundle = JSON.parse(fixture.replace(/^window\.__liveBundle = /, '').replace(/;\s*$/, ''));
  const harnessConfig = await page.evaluate(() => window.__harnessConfig);
  const audienceOrigin = harnessConfig.audienceOrigin;
  const SLIDE = harnessConfig.firstSlideId;
  const SECOND = harnessConfig.secondSlideId;
  const TOTAL = harnessConfig.slideCount;

  context.on('page', opened => {
    opened.on('pageerror', error => pageErrors.push(`${opened.url()}: ${error.message}`));
    opened.on('dialog', dialog => dialog.accept());
  });
  page.on('pageerror', error => pageErrors.push(`dashboard: ${error.message}`));
  page.on('dialog', dialog => dialog.accept());
  // The fixture's containment slide deliberately probes evil.example from inside
  // the slide sandbox; the resulting CSP and sandbox refusals are the sandbox
  // working and are owned by the renderer browser audit, not this acceptance.
  const sandboxNoise = text => /evil\.example|Content Security Policy|sandboxed|allow-forms|allow-top-navigation/.test(text);
  page.on('console', message => { if (message.type() === 'error' && !/Failed to load resource/.test(message.text()) && !sandboxNoise(message.text())) pageErrors.push(`console: ${message.text()}`); });

  const cors = {
    'access-control-allow-origin': audienceOrigin,
    'access-control-allow-methods': 'GET, HEAD, POST, OPTIONS',
    'access-control-allow-headers': 'Content-Type, Accept',
    'cross-origin-resource-policy': 'cross-origin',
    vary: 'Origin',
  };
  await context.route('**/*', async route => {
    const request = route.request();
    const url = request.url();
    if (url === `${audienceOrigin}/api/public/webinars/first-home-without-mystery/live` && request.method() === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json; charset=utf-8', headers: { ...cors, etag: '"8888"' }, body: JSON.stringify(bundle) });
      return;
    }
    if (url === `${audienceOrigin}/api/public/webinars/first-home-without-mystery/runtime-events`) {
      await route.fulfill({ status: request.method() === 'OPTIONS' ? 204 : 200, headers: cors, contentType: 'application/json', body: '{}' });
      return;
    }
    if (url.startsWith(`${dashboardOrigin}/`) || url.startsWith(`${audienceOrigin}/`)) { await route.continue(); return; }
    if (url.startsWith('https://uploads.example/put/') && request.method() === 'PUT') { transportPuts.push(url); await route.fulfill({ status: 200, headers: { 'access-control-allow-origin': dashboardOrigin, 'access-control-allow-methods': 'PUT, OPTIONS', 'access-control-allow-headers': 'Content-Type' } }); return; }
    if (url.startsWith('https://uploads.example/put/') && request.method() === 'OPTIONS') { await route.fulfill({ status: 204, headers: { 'access-control-allow-origin': dashboardOrigin, 'access-control-allow-methods': 'PUT, OPTIONS', 'access-control-allow-headers': 'Content-Type' } }); return; }
    if (url.startsWith('https://assets.example/')) { await route.fulfill({ status: 200, contentType: 'image/png', headers: { 'access-control-allow-origin': '*', 'cross-origin-resource-policy': 'cross-origin' }, body: PNG }); return; }
    if (url === 'https://evil.example/download' && request.method() === 'GET') { await route.fulfill({ status: 204 }); return; }
    if (/fonts\.(googleapis|gstatic)\.com/.test(url)) { await route.fulfill({ status: 204 }); return; }
    unexpectedRequests.push(`${request.method()} ${url}`);
    await route.abort('blockedbyclient');
  });

  async function openStudio(viewport) {
    await page.setViewportSize(viewport);
    await page.goto(`${dashboardOrigin}/studio.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.WebinarStudio && !document.getElementById('webinarStudioLauncher').disabled);
    // The real Dashboard confirm dialog is a DOM overlay. Accept it
    // automatically like a user pressing the primary action, except where a
    // check takes manual control of it.
    await page.evaluate(() => {
      window.__autoConfirm = true;
      const accept = () => { if (!window.__autoConfirm) return; const ok = document.querySelector('#msfgConfirmOverlay .confirm-ok'); if (ok) ok.click(); };
      new MutationObserver(accept).observe(document.body, { childList: true });
    });
    await page.evaluate(() => window.WebinarStudio.open());
    await page.waitForSelector(P + '[data-presenter-panel]');
  }
  const manualConfirm = on => page.evaluate(flag => { window.__autoConfirm = !flag; }, on);
  const tab = name => page.click(`#wsSettings [data-ws-tab="${name}"]`);
  const codeField = (field, slide = SLIDE) => `${P}textarea[data-code-field="${field}"][data-slide-id="${slide}"]`;
  const previewStatus = slide => page.locator(`${P}[data-preview-status][data-surface="${slide}"]`);
  const liveVersion = async () => (await page.locator(P + '[data-live-version]').textContent()).trim();
  const requestCount = predicate => page.evaluate(source => window.__requests.filter(new Function('r', `return ${source}`)).length, predicate);

  async function run() {
  /* ---------------- 1. Access, list, open, layout ---------------- */
  await openStudio({ width: 1440, height: 900 });
  check('admin sees both webinars in the deck list', await page.locator('#wsDeckList [data-ws-webinar-id]').count() === 2);
  check('the first webinar is selected with its live version and audience state in the status line', /Live version 8 · Audience enabled/.test(await page.locator('#wsStatus').textContent()));
  check('the Presenter tab is the default and the audience is not connected yet', /not connected/i.test(await page.locator(P + '[data-audience-status]').textContent()));
  await page.waitForFunction(() => document.querySelector('#wsPreviewHost') && !document.querySelector('#wsPreviewHost').hidden, null, { timeout: 20000 }).catch(() => {});
  check('the preview host shows once the real exact-origin host frame answers the up-next boot', await page.evaluate(() => !document.querySelector('#wsPreviewHost').hidden));
  check('the preview host frame is un-sandboxed and points at the configured preview host', await page.evaluate(origin => { const f = document.querySelector('#wsPreviewHost iframe'); return f && f.getAttribute('sandbox') === null && f.src.startsWith(origin + '/webinars/first-home-without-mystery/studio-viewer.html'); }, audienceOrigin));
  check('the inner slide frame inside the host is sandboxed with exactly allow-scripts', await page.frames().some(frame => frame.url().includes('mode=preview')) && await page.frames().find(frame => frame.url().includes('mode=preview')).evaluate(() => { const inner = document.querySelector('[data-preview-frame] iframe'); return inner && inner.getAttribute('sandbox') === 'allow-scripts'; }));
  check('no candidate HTML leaked into the Dashboard document', !(await page.content()).includes('fixture-card'));

  /* ---------------- 2. Code editing, preview, Save Live, validation, conflict ---------------- */
  await tab('code');
  await page.waitForSelector(codeField('html'));
  check('one editor box per live slide plus the Master box', await page.locator(P + 'details.ws-slide-box').count() === TOTAL && await page.locator(P + 'details.ws-master-box').count() === 1);
  const saveSlide = page.locator(`${P}[data-save-slide][data-slide-id="${SLIDE}"]`);
  check('Save Live starts disabled until a preview is ready', await saveSlide.isDisabled());
  await page.fill(codeField('html'), '<section class="fixture-card"><h1>Edited in the browser</h1></section>');
  await page.waitForFunction(id => /ready/i.test(document.querySelector(`#wsSettingsPanel [data-preview-status][data-surface="${id}"]`)?.textContent || ''), SLIDE, { timeout: 20000 });
  check('editing a slide boots the candidate through the real sandbox host and reports ready', /ready/i.test(await previewStatus(SLIDE).textContent()));
  check('the Unsaved badge marks the edited slide', (await page.locator(`${P}[data-dirty-surface="${SLIDE}"]`).textContent()).trim() === 'Unsaved');
  check('Save Live enables after a ready preview', !(await saveSlide.isDisabled()));
  await saveSlide.click();
  await page.waitForFunction(() => /Live version 9/.test(document.querySelector('#wsSettingsPanel [data-live-version]')?.textContent || ''));
  check('Save Live increments the live version exactly once and marks the slide Live', await liveVersion() === 'Live version 9' && (await page.locator(`${P}[data-dirty-surface="${SLIDE}"]`).textContent()).trim() === 'Live');
  check('Save Live sent exactly one slide write with the expected version', await requestCount(`r.method === 'PUT' && r.path === '/webinars/12/slides/${SLIDE}' && r.body.expectedVersion === 8`) === 1);
  check('the status line follows the new live version', /Live version 9/.test(await page.locator('#wsStatus').textContent()));

  // Master edit through the same path.
  await page.fill(P + 'textarea[data-master-field="css"]', bundle.master.css + '\n.fixture-card{outline:2px solid #8cc63e}');
  await page.waitForFunction(() => /ready/i.test(document.querySelector('#wsSettingsPanel [data-preview-status][data-surface="master"]')?.textContent || ''), null, { timeout: 20000 });
  await page.click(P + '[data-save-master]');
  await page.waitForFunction(() => /Live version 10/.test(document.querySelector('#wsSettingsPanel [data-live-version]')?.textContent || ''));
  check('Master Save Live advances the version', await liveVersion() === 'Live version 10');

  // Local validation blocks saving.
  await page.fill(`${P}input[data-slide-field="anchor"][data-slide-id="${SLIDE}"]`, 'Bad Anchor!');
  await page.waitForFunction(id => /canonical lowercase/i.test(document.querySelector(`#wsSettingsPanel [data-preview-status][data-surface="${id}"]`)?.textContent || ''), SLIDE);
  check('an invalid anchor is refused locally with guidance and Save Live disabled', await saveSlide.isDisabled() && /canonical lowercase/i.test(await previewStatus(SLIDE).textContent()));
  await page.fill(`${P}input[data-slide-field="anchor"][data-slide-id="${SLIDE}"]`, bundle.slides[0].anchor);
  await page.waitForFunction(id => /ready/i.test(document.querySelector(`#wsSettingsPanel [data-preview-status][data-surface="${id}"]`)?.textContent || ''), SLIDE, { timeout: 20000 });

  // Stale 409: the fixture bumps the version underneath us.
  await page.evaluate(() => { window.__harness.forceConflict = true; });
  await page.fill(codeField('html'), '<section class="fixture-card"><h1>Unsaved change</h1></section>');
  await page.waitForFunction(id => /ready/i.test(document.querySelector(`#wsSettingsPanel [data-preview-status][data-surface="${id}"]`)?.textContent || ''), SLIDE, { timeout: 20000 });
  await saveSlide.click();
  await page.waitForSelector(P + '[data-conflict]');
  check('a stale Save Live shows the conflict with the other editor named and keeps the unsaved text', /Sam Successor/.test(await page.locator(P + '[data-conflict]').textContent())
    && (await page.locator(codeField('html')).inputValue()) === '<section class="fixture-card"><h1>Unsaved change</h1></section>'
    && /not overwritten/i.test(await page.locator(P + '[data-editor-error]').textContent()));
  check('the conflict offers reload and copy, not overwrite', await page.locator(P + '[data-reload-conflict]').count() === 1 && await page.locator(P + '[data-copy-conflict]').count() === 1);
  await page.click(P + '[data-reload-conflict]');
  await page.waitForFunction(() => /Live version 11/.test(document.querySelector('#wsSettingsPanel [data-live-version]')?.textContent || ''));
  check('reloading the live version resolves the conflict on the server version', await liveVersion() === 'Live version 11');

  // Add, duplicate, reorder, delete.
  await page.click(P + '[data-add-slide]');
  await page.waitForFunction(n => document.querySelectorAll('#wsSettingsPanel details.ws-slide-box').length === n, TOTAL + 1);
  const openBox = async id => { const box = page.locator(`${P}details[data-slide-id="${id}"]`); if (!(await box.evaluate(el => el.open))) await box.locator('summary').click(); };
  await openBox(SECOND);
  await page.click(`${P}[data-duplicate-slide][data-slide-id="${SECOND}"]`);
  await page.waitForFunction(n => document.querySelectorAll('#wsSettingsPanel details.ws-slide-box').length === n, TOTAL + 2);
  check('add and duplicate append server-created slides', await page.locator(P + 'details.ws-slide-box').count() === TOTAL + 2);
  const orderBefore = await page.evaluate(() => [...document.querySelectorAll('#wsSettingsPanel details.ws-slide-box')].map(box => box.dataset.slideId));
  await openBox(SLIDE);
  await page.click(`${P}[data-slide-down][data-slide-id="${SLIDE}"]`);
  await page.waitForFunction(id => document.querySelectorAll('#wsSettingsPanel details.ws-slide-box')[1]?.dataset.slideId === id, SLIDE);
  const orderAfter = await page.evaluate(() => [...document.querySelectorAll('#wsSettingsPanel details.ws-slide-box')].map(box => box.dataset.slideId));
  check('Move down reorders through the server and the boxes follow', orderAfter[1] === SLIDE && orderAfter[0] === orderBefore[1]);
  const duplicateId = orderAfter.at(-1);
  await openBox(duplicateId);
  await page.click(`${P}[data-delete-slide][data-slide-id="${duplicateId}"]`);
  await page.waitForFunction(n => document.querySelectorAll('#wsSettingsPanel details.ws-slide-box').length === n, TOTAL + 1);
  check('Delete removes the slide after confirmation', await page.locator(P + 'details.ws-slide-box').count() === TOTAL + 1);
  check('every mutation advanced the live version exactly once', await liveVersion() === 'Live version 15');

  /* ---------------- 3. History restore ---------------- */
  await tab('history');
  await page.waitForSelector(P + '[data-restore-revision]');
  check('history lists the saved revisions with actor and summary only', await page.locator(P + '[data-revision-id]').count() >= 8 && !(await page.locator(P).innerHTML()).includes('fixture-card'));
  // The oldest revision is the baseline: restoring it must bring back the original slide set.
  await page.click(P + '.ws-history-list li:last-child [data-restore-revision]');
  await page.waitForFunction(() => /Live version 16/.test(document.querySelector('#wsStatus')?.textContent || ''));
  check('restoring a revision reloads the webinar on the new live version', /Live version 16/.test(await page.locator('#wsStatus').textContent()));
  await tab('code');
  await page.waitForSelector(P + 'details.ws-slide-box');
  check('the restored revision brought back its slide set', await page.locator(P + 'details.ws-slide-box').count() === TOTAL);

  /* ---------------- 4. Users & Access ---------------- */
  await tab('access');
  await page.waitForSelector(P + '[data-change-owner="8"]');
  check('the owner directory offers only active users', await page.locator(P + '[data-change-owner="9"]').count() === 0);
  await page.click(P + '[data-change-owner="8"]');
  await page.waitForFunction(() => /Sam Successor/.test(document.querySelector('#wsSettingsPanel .ws-owner-summary')?.textContent || ''));
  check('replacing the primary owner reloads and shows the new owner', /Primary owner: Sam Successor/.test(await page.locator(P + '.ws-owner-summary').textContent()));
  await page.click(P + '[data-audience-toggle]');
  await page.waitForFunction(() => /Audience off/.test(document.querySelector('#wsStatus')?.textContent || ''));
  check('turning audience access off updates the status line and disables the audience launch', /Audience off/.test(await page.locator('#wsStatus').textContent()) && await page.locator('#wsLaunchAudience').isDisabled());
  await tab('presenter');
  await page.waitForSelector(P + '[data-audience-connect]');
  await page.click(P + '[data-audience-connect]');
  check('the presenter cannot launch an audience while access is off, and the status line says why', /audience access is off/i.test(await page.locator('#wsStatus').textContent()));
  await tab('access');
  await page.waitForSelector(P + '[data-audience-toggle]');
  await page.click(P + '[data-audience-toggle]');
  await page.waitForFunction(() => /Audience enabled/.test(document.querySelector('#wsStatus')?.textContent || ''));
  check('turning audience access back on re-enables the launch', !(await page.locator('#wsLaunchAudience').isDisabled()));

  /* ---------------- 5. Assets: upload processing, available, rejected, insert ---------------- */
  await tab('code');
  await page.waitForSelector(`${P}details[data-slide-id="${SLIDE}"]`);
  await openBox(SLIDE);
  await page.waitForSelector(codeField('html'));
  const html = page.locator(codeField('html'));
  await html.click();
  await html.evaluate(el => { el.focus(); el.setSelectionRange(0, 0); el.dispatchEvent(new Event('select', { bubbles: true })); });
  await tab('assets');
  await page.waitForSelector(P + '[data-upload-file]');
  await page.fill(P + '[data-upload-display-name]', 'Browser upload');
  await page.setInputFiles(P + '[data-upload-file]', { name: 'porch.png', mimeType: 'image/png', buffer: PNG });
  await page.click(P + 'form[data-asset-upload-form] button[type="submit"]');
  await page.waitForFunction(() => /processing is still running/i.test(document.querySelector('#wsSettingsPanel [data-asset-activity]')?.textContent || ''), null, { timeout: 10000 });
  const intentUrl = await page.evaluate(() => window.__requests.filter(r => r.method === 'POST' && r.path === '/webinar-assets/upload-intents').length === 1 ? window.__harness.lastIntent?.uploadUrl : null);
  check('the file went out as exactly one PUT to the intent upload URL before processing was reported', transportPuts.length === 1 && transportPuts[0] === intentUrl, JSON.stringify({ transportPuts, intentUrl }));
  await page.waitForFunction(() => /approved and ready/i.test(document.querySelector('#wsSettingsPanel [data-asset-activity]')?.textContent || ''), null, { timeout: 10000 });
  const uploadedVersion = await page.evaluate(() => window.__harness.families[0].versions[0].id);
  check('the processed upload appears as an available version', await page.locator(`${P}[data-asset-version="${uploadedVersion}"] .ws-asset-status-available`).count() === 1);
  check('one upload intent was created for the upload', await requestCount(`r.method === 'POST' && r.path === '/webinar-assets/upload-intents'`) === 1);
  await page.setInputFiles(P + '[data-upload-file]', { name: 'reject.png', mimeType: 'image/png', buffer: PNG });
  await page.fill(P + '[data-upload-display-name]', 'Rejected upload');
  await page.click(P + 'form[data-asset-upload-form] button[type="submit"]');
  await page.waitForFunction(() => /rejected: UNSUPPORTED_CONTENT/i.test(document.querySelector('#wsSettingsPanel [data-asset-activity]')?.textContent || ''), null, { timeout: 10000 });
  check('a rejected upload reports its server code', true);
  const insert = page.locator(`${P}[data-insert-asset-reference="${uploadedVersion}"]`);
  await insert.waitFor();
  check('Insert at cursor is enabled for the Code field chosen before opening Assets', !(await insert.isDisabled()));
  await insert.click();
  await tab('code');
  await page.waitForSelector(`${P}details[data-slide-id="${SLIDE}"]`);
  await openBox(SLIDE);
  check('the canonical asset token was inserted at the caret', (await page.locator(codeField('html')).inputValue()).startsWith(`{{ASSET:${uploadedVersion}}}`));

  /* ---------------- 6. Presenter: notes, shortcuts, key suppression ---------------- */
  await tab('presenter');
  await page.waitForSelector(P + '[data-presenter-panel]');
  await page.waitForFunction(() => /ready/i.test(document.querySelector('#wsSettingsPanel [data-up-next-status]')?.textContent || ''), null, { timeout: 20000 }).catch(() => {});
  check('the up-next preview settles on ready after returning to the presenter tab', /ready/i.test(await page.locator(P + '[data-up-next-status]').textContent()), await page.locator(P + '[data-up-next-status]').textContent());
  await page.waitForSelector(P + '[data-note-id="5"]');
  await page.fill(P + '[data-note-input]', 'Added in the acceptance run');
  await page.click(P + '[data-note-save]');
  await page.waitForFunction(() => document.querySelectorAll('#wsSettingsPanel [data-note-id]').length === 2);
  await page.click(P + '[data-note-id="5"] [data-note-edit]');
  await page.fill(P + '[data-note-id="5"] [data-note-editor]', 'Mention the cash example first');
  await page.click(P + '[data-note-id="5"] [data-note-editor-save]');
  await page.waitForFunction(() => /first/.test(document.querySelector('#wsSettingsPanel [data-note-id="5"] [data-note-body]')?.textContent || ''));
  const newNoteId = await page.evaluate(() => [...document.querySelectorAll('#wsSettingsPanel [data-note-id]')].map(n => n.dataset.noteId).find(id => id !== '5'));
  await page.click(`${P}[data-note-id="${newNoteId}"] [data-note-delete]`);
  await page.waitForFunction(() => document.querySelectorAll('#wsSettingsPanel [data-note-id]').length === 1);
  check('notes add, edit, and delete round-trip through the authenticated API', await requestCount(`r.method === 'POST' && /\\/notes$/.test(r.path)`) === 1 && await requestCount(`r.method === 'DELETE' && /\\/notes\\/\\d+$/.test(r.path)`) === 1);
  await page.locator(P + '[data-shortcut-settings] summary').click();
  await page.click(P + '[data-shortcut-capture="toggleDrawing"]');
  await page.keyboard.press('m');
  await page.click(P + '[data-shortcut-save]');
  await page.waitForFunction(() => /Saved/.test(document.querySelector('#wsSettingsPanel [data-shortcut-status]')?.textContent || ''));
  check('shortcuts persist once for the account', await page.evaluate(() => window.__harness.settings.shortcuts.toggleDrawing === 'KeyM') && await requestCount(`r.method === 'PUT' && r.path === '/webinar-presenter-settings/me'`) === 1);
  await page.locator('#wsClose').focus();
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction(() => /^2 \//.test(document.querySelector('#wsSettingsPanel [data-position]')?.textContent.trim() || ''));
  await page.focus(P + '[data-note-input]');
  await page.keyboard.press('ArrowLeft');
  await sleep(150);
  check('ArrowRight navigates locally in rehearsal and is suppressed inside the note textarea', /^2 \//.test((await page.locator(P + '[data-position]').textContent()).trim()));

  /* ---------------- 7. Two windows: launch, control, attacks, reconnect, privacy ---------------- */
  const liveWrites = `(r.method === 'PUT' || r.method === 'POST' || r.method === 'DELETE') && /\\/webinars\\/\\d+\\/(master|slides|history)/.test(r.path) && !/\\/notes/.test(r.path)`;
  const liveWritesBefore = await requestCount(liveWrites);
  const popup = context.waitForEvent('page', { timeout: 15000 });
  await page.click('#wsLaunchAudience');
  const audience = await popup;
  await audience.waitForSelector('[data-audience-shell]:not([hidden])', { timeout: 15000 });
  await page.waitForFunction(() => /connected\./i.test(document.querySelector('#wsSettingsPanel [data-audience-status]')?.textContent || ''), null, { timeout: 15000 });
  check('Launch audience opens the audience window on the audience origin and the presenter reports connected', audience.url().startsWith(`${audienceOrigin}/webinars/first-home-without-mystery/studio-viewer.html`) && /connected\./i.test(await page.locator(P + '[data-audience-status]').textContent()));
  check('the audience window was opened with an opener reference, not noopener, so the bridge can address it', await audience.evaluate(() => window.opener !== null));
  const countSel = '[data-slide-count]';
  await page.click(P + '[data-nav="next"]');
  await audience.waitForFunction(n => document.querySelector('[data-slide-count]')?.textContent.trim() === `2 / ${n}`, TOTAL);
  check('presenter Next advances the audience', (await audience.locator(countSel).textContent()).trim() === `2 / ${TOTAL}`);
  await page.click(P + '[data-nav="previous"]');
  await audience.waitForFunction(n => document.querySelector('[data-slide-count]')?.textContent.trim() === `1 / ${n}`, TOTAL);
  await audience.waitForFunction(() => document.querySelector('[data-animation="forward"]')?.disabled === false);
  await page.click(P + '[data-animation="forward"]');
  await page.waitForFunction(() => /1 \/ 3/.test(document.querySelector('#wsSettingsPanel [data-animation-status]')?.textContent || ''));
  check('animation forward runs the real slide animation and the presenter shows the acknowledged state', true);
  await page.click(P + '[data-annotation-toggle]');
  await audience.waitForFunction(() => document.querySelector('[data-annotation-toggle]')?.getAttribute('aria-pressed') === 'true');
  check('drawing toggles the audience pen and the presenter reflects the acknowledgement', await page.evaluate(() => document.querySelector('#wsSettingsPanel [data-annotation-toggle]')?.getAttribute('aria-pressed') === 'true'));
  await page.click(P + '[data-annotation-toggle]');
  await audience.waitForFunction(() => document.querySelector('[data-annotation-toggle]')?.getAttribute('aria-pressed') === 'false');
  await page.click(P + '[data-nav-visibility]');
  await audience.waitForFunction(() => document.querySelector('[data-nav-dock]')?.hidden === true);
  check('navigation visibility hides the audience dock', true);
  await page.click(P + '[data-nav-visibility]');
  await audience.waitForFunction(() => document.querySelector('[data-nav-dock]')?.hidden === false);
  await page.click(P + '[data-fullscreen-toggle]');
  await sleep(500);
  check('fullscreen request is honoured or explicitly denied, never ambiguous', await page.evaluate(() => document.querySelector('#wsSettingsPanel [data-fullscreen-toggle]')?.getAttribute('aria-pressed') === 'true' || /FULLSCREEN_DENIED/.test(document.querySelector('#wsSettingsPanel [data-presenter-status]')?.textContent || '')));

  // Attacks: wrong source (the audience window itself and its inner slide frame
  // posting presenter-init and controls), and a wrong nonce from the real opener.
  // A presenter-init from the real opener is a legitimate reconnect by design,
  // so it is not part of this set.
  const before = (await audience.locator(countSel).textContent()).trim();
  await audience.evaluate(() => {
    window.postMessage({ v: 1, nonce: 'wrongwrongwrongwrongwrong', type: 'presenter-init', payload: {} }, '*');
    window.postMessage({ v: 1, nonce: 'wrongwrongwrongwrongwrong', type: 'next', payload: {} }, '*');
  });
  // The sandboxed slide frame is the surface an attacker actually controls.
  const slideFrame = audience.frames().find(frame => frame !== audience.mainFrame());
  check('the audience page hosts exactly one inner slide frame to attack from', Boolean(slideFrame) && audience.frames().length === 2);
  await slideFrame.evaluate(() => {
    parent.postMessage({ v: 1, nonce: 'wrongwrongwrongwrongwrong', type: 'presenter-init', payload: {} }, '*');
    parent.postMessage({ v: 1, nonce: 'wrongwrongwrongwrongwrong', type: 'next', payload: {} }, '*');
    parent.postMessage({ v: 1, nonce: 'wrongwrongwrongwrongwrong', type: 'goto', payload: { index: 3 } }, '*');
  });
  await page.evaluate(origin => { const target = window.open('', 'MSFGWebinarAudience'); target.postMessage({ v: 1, nonce: 'wrongwrongwrongwrongwrong', type: 'next', payload: {} }, origin); target.postMessage({ v: 2, nonce: 'wrongwrongwrongwrongwrong', type: 'next', payload: {} }, origin); target.postMessage('next', origin); }, audienceOrigin);
  await sleep(400);
  check('controls from the audience window itself, from its sandboxed slide frame, and with a wrong nonce from the opener change nothing', (await audience.locator(countSel).textContent()).trim() === before);
  await page.click(P + '[data-nav="next"]');
  await audience.waitForFunction(n => document.querySelector('[data-slide-count]')?.textContent.trim() === `2 / ${n}`, TOTAL);
  check('the real presenter still drives the audience after the attacks', true);

  // Privacy: nothing private in the audience document or its source.
  const audienceContent = await audience.content();
  const audienceSource = await (await audience.request.get(audience.url())).text();
  check('the audience DOM carries no notes, ownership, history, settings, or keys', !/speakerNotes|primaryOwnerUserId|x-webinar-key|Mention the cash example|Shared note for|Sam Successor|KeyM/.test(audienceContent));
  check('the audience page source ships no presenter surfaces', !/speaker\s+note|owner|audit|history|code\s+editor|private|x-webinar-key|cognito/i.test(audienceSource.replace(/<script[\s\S]*?<\/script>/g, '')));

  // Escape while connected asks through the real Dashboard dialog; a second
  // Escape must reach that dialog, not spawn another; Stay keeps the link.
  check('the real Dashboard confirm dialog is in use, not the native fallback', await page.evaluate(() => typeof window.Utils?.confirm === 'function'));
  await manualConfirm(true);
  // The editor still holds the unsaved asset insertion, so Escape asks about
  // unsaved changes first; leaving them is confirmed, then the audience prompt follows.
  const overlayText = () => page.locator('#msfgConfirmOverlay').textContent();
  await page.keyboard.press('Escape');
  await page.waitForSelector('#msfgConfirmOverlay', { timeout: 5000 });
  check('Escape with unsaved edits asks about them first', /unsaved changes/i.test(await overlayText()));
  await page.click('#msfgConfirmOverlay .confirm-ok');
  await page.waitForFunction(() => /audience window is connected/i.test(document.querySelector('#msfgConfirmOverlay')?.textContent || ''), null, { timeout: 5000 });
  check('Escape while the audience is connected then asks before disconnecting', true);
  await page.keyboard.press('Escape');
  await sleep(400);
  check('a second Escape dismisses the prompt instead of spawning another, and the Studio stays open and connected', await page.evaluate(() => document.querySelectorAll('#msfgConfirmOverlay').length === 0 && !document.getElementById('webinarStudioModal').hidden) && /connected\./i.test(await page.locator(P + '[data-audience-status]').textContent()));
  await page.keyboard.press('Escape');
  await page.waitForSelector('#msfgConfirmOverlay', { timeout: 5000 });
  await page.click('#msfgConfirmOverlay .confirm-ok');
  await page.waitForFunction(() => /audience window is connected/i.test(document.querySelector('#msfgConfirmOverlay')?.textContent || ''), null, { timeout: 5000 });
  await page.click('#msfgConfirmOverlay .confirm-cancel');
  await sleep(300);
  check('choosing to stay keeps the Studio open and the audience connected', await page.evaluate(() => !document.getElementById('webinarStudioModal').hidden) && /connected\./i.test(await page.locator(P + '[data-audience-status]').textContent()));
  await manualConfirm(false);
  await page.click(P + '[data-nav="previous"]');
  await audience.waitForFunction(n => document.querySelector('[data-slide-count]')?.textContent.trim() === `1 / ${n}`, TOTAL);
  await page.click(P + '[data-nav="next"]');
  await audience.waitForFunction(n => document.querySelector('[data-slide-count]')?.textContent.trim() === `2 / ${n}`, TOTAL);
  check('controls still reach the audience after the declined close', true);

  // Close and reconnect.
  await page.evaluate(() => { window.__statusLog = []; const target = document.querySelector('#wsSettingsPanel [data-audience-status]'); const log = () => window.__statusLog.push([Date.now(), document.querySelector('#wsSettingsPanel [data-audience-status]')?.textContent]); log(); new MutationObserver(log).observe(document.getElementById('wsSettingsPanel'), { childList: true, subtree: true, characterData: true }); void target; });
  const closedAt = Date.now();
  await audience.close();
  // Interval polling: animation-frame polling stalls while the browser refocuses after the popup closes.
  await page.waitForFunction(() => /disconnected/i.test(document.querySelector('#wsSettingsPanel [data-audience-status]')?.textContent || ''), null, { timeout: 30000, polling: 250 });
  check('closing the audience window is detected as disconnected within the heartbeat budget', Date.now() - closedAt < 25000, `${Date.now() - closedAt} ms; log ${JSON.stringify(await page.evaluate(() => window.__statusLog.map(([t, text]) => [t, text]).slice(-6)))}`);
  const reopened = context.waitForEvent('page', { timeout: 15000 });
  await page.click(P + '[data-audience-reconnect]');
  const audience2 = await reopened;
  await audience2.waitForSelector('[data-audience-shell]:not([hidden])', { timeout: 15000 });
  await page.waitForFunction(() => /connected\./i.test(document.querySelector('#wsSettingsPanel [data-audience-status]')?.textContent || ''), null, { timeout: 15000, polling: 250 });
  // The relaunched window opened at slide 1; the presenter, still on slide 2, sends it there.
  await audience2.waitForFunction(n => document.querySelector('[data-slide-count]')?.textContent.trim() === `2 / ${n}`, TOTAL, { timeout: 8000 });
  check('a relaunched audience is brought to the presenter\'s current slide instead of resetting the presenter', (await page.locator(P + '[data-position]').textContent()).trim() === `2 / ${TOTAL}`);
  await page.click(P + '[data-nav="next"]');
  await audience2.waitForFunction(n => document.querySelector('[data-slide-count]')?.textContent.trim() === `3 / ${n}`, TOTAL);
  check('reconnect reopens the audience and controls resume after a fresh handshake', (await audience2.locator(countSel).textContent()).trim() === `3 / ${TOTAL}`);
  check('no live content was written by presenter or bridge activity', await requestCount(liveWrites) === liveWritesBefore, `${liveWritesBefore} before, ${await requestCount(liveWrites)} after`);
  await audience2.close();

  /* ---------------- 8. Responsive sizes ---------------- */
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1024, height: 768 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
    const label = `${viewport.width}x${viewport.height}`;
    await openStudio(viewport);
    // Measure the steady state: after the preview host has inflated the workspace.
    await page.waitForFunction(() => document.querySelector('#wsPreviewHost') && !document.querySelector('#wsPreviewHost').hidden, null, { timeout: 20000, polling: 250 }).catch(() => {});
    check(`${label}: the preview host is showing before the layout is measured`, await page.evaluate(() => !document.querySelector('#wsPreviewHost').hidden));
    const layout = await page.evaluate(() => {
      const doc = document.documentElement;
      const within = el => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.left >= 0 && r.top >= 0 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1; };
      const scrollers = [...document.querySelectorAll('#webinarStudioModal *')].filter(el => { const s = getComputedStyle(el); return /(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight; });
      const nested = scrollers.filter(el => scrollers.some(other => other !== el && other.contains(el)));
      return {
        horizontalOverflow: doc.scrollWidth > doc.clientWidth + 1,
        bodyLocked: getComputedStyle(document.body).overflow === 'hidden',
        shellFits: (() => { const r = document.querySelector('#webinarStudioModal .ws-shell').getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight + 1; })(),
        close: within(document.getElementById('wsClose')),
        launchPresenter: within(document.getElementById('wsLaunchPresenter')),
        launchAudience: within(document.getElementById('wsLaunchAudience')),
        tabs: [...document.querySelectorAll('#wsSettings [data-ws-tab]')].every(within),
        nestedScrollers: nested.length,
      };
    });
    check(`${label}: no horizontal overflow, the page is locked behind the Studio, and the shell fits the viewport`, !layout.horizontalOverflow && layout.bodyLocked && layout.shellFits, JSON.stringify(layout));
    check(`${label}: close, launch buttons, and every settings tab are visible without scrolling`, layout.close && layout.launchPresenter && layout.launchAudience && layout.tabs, JSON.stringify(layout));
    check(`${label}: no nested scroll regions inside the Studio`, layout.nestedScrollers === 0, JSON.stringify(layout));
    await page.locator(P + '[data-nav="next"]').scrollIntoViewIfNeeded();
    check(`${label}: presenter navigation is reachable`, await page.locator(P + '[data-nav="next"]').isVisible());
    await tab('code');
    await page.waitForSelector(codeField('html'));
    await page.locator(codeField('html')).scrollIntoViewIfNeeded();
    check(`${label}: the code editor is reachable`, await page.locator(codeField('html')).isVisible());
    const shot = `output/playwright/webinar-studio/studio-${label}.png`;
    try { await page.screenshot({ path: shot, fullPage: false }); screenshots.push(shot); } catch { /* screenshots are evidence, not a gate */ }
  }

  }

  try {
    await run();
  } catch (error) {
    const state = await page.evaluate(() => ({
      status: document.querySelector('#wsStatus')?.textContent,
      panel: document.querySelector('#wsSettingsPanel')?.innerText?.slice(0, 800),
    })).catch(() => null);
    failures.push(`run aborted: ${error.stack || error.message}\n${JSON.stringify(state)}`);
  }
  check('no page errors in the Dashboard or audience windows', pageErrors.length === 0, pageErrors.join(' | '));
  check('no requests left the two local origins except the fulfilled fixtures', unexpectedRequests.length === 0, unexpectedRequests.join(' | '));
  return {
    status: failures.length ? 'fail' : 'pass',
    passed: checks.filter(c => c.ok).length,
    total: checks.length,
    failures,
    checks: checks.map(c => `${c.ok ? 'PASS' : 'FAIL'} ${c.name}`),
    screenshots,
  };
}
