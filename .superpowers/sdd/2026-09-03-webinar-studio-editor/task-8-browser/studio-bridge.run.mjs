/* Task 8 real-browser check for the two-window presenter/audience bridge.
   Build the harness first:
     DASHBOARD_ROOT=<dashboard checkout> DECK_ROOT=<deck dir> PRESENTER_ORIGIN=http://127.0.0.1:4311 ./build-harness.sh
   Then: node studio-bridge.run.mjs   (needs `playwright` resolvable from the working directory)

   The audience window is the real studio-viewer.html running the real audience
   controller against the deck's live-bundle fixture (fulfilled by Playwright at the
   production API URL). The presenter window loads the real Dashboard bridge.js.
   The two are served from different local origins so exact-origin messaging is
   exercised for real. Override HARNESS_DIR to point at a harness built elsewhere. */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const HARNESS = process.env.HARNESS_DIR || join(here, 'harness');
const AUDIENCE_PORT = Number(process.env.AUDIENCE_PORT || 4310);
const PRESENTER_PORT = Number(process.env.PRESENTER_PORT || 4311);
const AUDIENCE_ORIGIN = `http://127.0.0.1:${AUDIENCE_PORT}`;
const PRESENTER_ORIGIN = `http://127.0.0.1:${PRESENTER_PORT}`;
const AUDIENCE_URL = `${AUDIENCE_ORIGIN}/studio-viewer.html`;
const LIVE_URL = 'https://api.msfgco.com/api/public/webinars/first-home-without-mystery/live';
const EVENTS_URL = 'https://api.msfgco.com/api/public/webinars/first-home-without-mystery/runtime-events';

const servers = [
  spawn('python3', ['-m', 'http.server', String(AUDIENCE_PORT), '--bind', '127.0.0.1', '--directory', join(HARNESS, 'audience')], { stdio: 'ignore' }),
  spawn('python3', ['-m', 'http.server', String(PRESENTER_PORT), '--bind', '127.0.0.1', '--directory', join(HARNESS, 'presenter')], { stdio: 'ignore' }),
];
const fixture = JSON.parse(await readFile(join(HARNESS, 'audience', 'tests', 'fixtures', 'studio-live-bundle.json'), 'utf8'));
await new Promise(resolve => setTimeout(resolve, 700));

const results = [];
const check = (name, ok, detail = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? '  ' + detail : ''}`); };
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });

async function scenario(name, run) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const pageErrors = [];
  const unexpectedRequests = [];
  context.on('page', page => {
    page.on('pageerror', error => pageErrors.push(`${page.url()}: ${error.message}`));
  });
  await context.route('**/*', async route => {
    const request = route.request();
    const url = request.url();
    if (url.startsWith(`${AUDIENCE_ORIGIN}/`) || url.startsWith(`${PRESENTER_ORIGIN}/`)) { await route.continue(); return; }
    const cors = {
      'access-control-allow-origin': AUDIENCE_ORIGIN,
      'access-control-allow-methods': 'GET, HEAD, POST, OPTIONS',
      'access-control-allow-headers': 'Content-Type, Accept',
      'cross-origin-resource-policy': 'cross-origin',
      vary: 'Origin',
    };
    if (url === LIVE_URL && request.method() === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json; charset=utf-8', headers: { ...cors, etag: '"1111"' }, body: JSON.stringify(fixture) });
      return;
    }
    if (url === EVENTS_URL) { await route.fulfill({ status: request.method() === 'OPTIONS' ? 204 : 200, headers: cors, contentType: 'application/json', body: '{}' }); return; }
    // The fixture's containment slide deliberately exposes one download link to
    // evil.example; the renderer browser audit owns that probe. Anything else
    // leaving the two local origins is a failure here.
    if (url === 'https://evil.example/download' && request.method() === 'GET') { await route.fulfill({ status: 204 }); return; }
    unexpectedRequests.push(`${request.method()} ${url}`);
    await route.abort('blockedbyclient');
  });
  const presenter = await context.newPage();
  await presenter.goto(`${PRESENTER_ORIGIN}/presenter.html`);
  try {
    await run({ context, presenter, pageErrors, unexpectedRequests });
  } catch (error) {
    check(`${name}: scenario completed`, false, error.stack || String(error));
  }
  check(`${name}: no page errors in either window`, pageErrors.length === 0, pageErrors.join(' | '));
  check(`${name}: no unexpected network requests`, unexpectedRequests.length === 0, unexpectedRequests.join(' | '));
  await context.close();
}

const harness = (page, expr) => page.evaluate(expr);
const lastStatus = page => harness(page, () => window.__harness.statuses.at(-1) ?? null);
const stateTypes = page => harness(page, () => window.__harness.states.map(s => s.type));
const stateOf = (page, type) => page.evaluate(t => window.__harness.states.filter(s => s.type === t).at(-1) ?? null, type);
const waitStatus = (page, status, timeout = 8000) => page.waitForFunction(s => window.__harness.bridge && window.__harness.bridge.status() === s, status, { timeout });

async function connect(context, presenter, options = {}) {
  const popup = context.waitForEvent('page', { timeout: 8000 });
  const started = await presenter.evaluate(([url, origin, opts]) => window.__harness.connect(url, origin, opts), [AUDIENCE_URL, AUDIENCE_ORIGIN, options]);
  const audience = await popup;
  return { started, audience };
}

await scenario('handshake and control', async ({ context, presenter }) => {
  const { started, audience } = await connect(context, presenter, { pingIntervalMs: 300 });
  check('connect() opened the named audience window', started === true && audience.url().startsWith(AUDIENCE_URL), audience.url());
  await audience.waitForSelector('[data-audience-shell]:not([hidden])', { timeout: 8000 });
  await waitStatus(presenter, 'connected');
  check('bridge reached connected after presenter-init and audience-ready', await lastStatus(presenter) === 'connected');
  const ready = await stateOf(presenter, 'audience-ready');
  check('audience-ready carried the real slide count', ready?.payload?.index === 0 && ready?.payload?.total === fixture.slides.length, JSON.stringify(ready));

  await presenter.evaluate(() => window.__harness.bridge.sendControl('next', {}));
  await presenter.waitForFunction(() => window.__harness.states.some(s => s.type === 'slide-state' && s.payload.index === 1), null, { timeout: 4000 });
  check('next moved the audience to slide 2 and acknowledged slide-state', (await audience.evaluate(() => location.hash)) === `#${fixture.slides[1].anchor}`
    && (await audience.locator('[data-slide-count]').textContent()).trim() === `2 / ${fixture.slides.length}`);

  await presenter.evaluate(() => window.__harness.bridge.sendControl('goto', { index: 3 }));
  await presenter.waitForFunction(() => window.__harness.states.some(s => s.type === 'slide-state' && s.payload.index === 3), null, { timeout: 4000 });
  check('goto jumped straight to the requested index', (await audience.evaluate(() => location.hash)) === `#${fixture.slides[3].anchor}`);

  await presenter.evaluate(() => window.__harness.bridge.sendControl('previous', {}));
  await presenter.waitForFunction(() => window.__harness.states.filter(s => s.type === 'slide-state').at(-1)?.payload.index === 2, null, { timeout: 4000 });
  check('previous stepped back one slide', (await audience.evaluate(() => location.hash)) === `#${fixture.slides[2].anchor}`);

  await presenter.evaluate(() => window.__harness.bridge.sendControl('nav-visibility', { hidden: true }));
  await presenter.waitForFunction(() => window.__harness.states.some(s => s.type === 'nav-state' && s.payload.hidden === true), null, { timeout: 4000 });
  check('nav-visibility hid the audience dock and acknowledged nav-state', await audience.evaluate(() => document.querySelector('[data-nav-dock]').hidden === true));
  await presenter.evaluate(() => window.__harness.bridge.sendControl('nav-visibility', { hidden: false }));
  await presenter.waitForFunction(() => window.__harness.states.some(s => s.type === 'nav-state' && s.payload.hidden === false), null, { timeout: 4000 });
  check('nav-visibility restored the dock', await audience.evaluate(() => document.querySelector('[data-nav-dock]').hidden === false));

  await presenter.evaluate(() => window.__harness.bridge.sendControl('annotation-command', { on: true, tool: 'pen', color: 'red' }));
  await presenter.waitForFunction(() => window.__harness.states.some(s => s.type === 'annotation-state' && s.payload.on === true), null, { timeout: 4000 });
  check('annotation-command turned the real pen on and the audience acknowledged annotation-state on', await audience.evaluate(() => document.querySelector('[data-annotation-toggle]').getAttribute('aria-pressed') === 'true'));
  await presenter.evaluate(() => window.__harness.bridge.sendControl('annotation-command', { on: false }));
  await presenter.waitForFunction(() => window.__harness.states.filter(s => s.type === 'annotation-state').at(-1)?.payload.on === false, null, { timeout: 4000 });
  check('annotation-command turned the pen off again', await audience.evaluate(() => document.querySelector('[data-annotation-toggle]').getAttribute('aria-pressed') === 'false'));

  await presenter.evaluate(() => window.__harness.bridge.sendControl('goto', { index: 0 }));
  await presenter.waitForFunction(() => window.__harness.states.filter(s => s.type === 'slide-state').at(-1)?.payload.index === 0, null, { timeout: 4000 });
  // The slide runtime reports its animation state once it has started; the
  // shell only forwards animation controls after that.
  await audience.waitForFunction(() => document.querySelector('[data-animation="forward"]').disabled === false, null, { timeout: 6000 });
  await presenter.evaluate(() => window.__harness.bridge.sendControl('animation-forward', {}));
  await presenter.waitForFunction(() => window.__harness.states.some(s => s.type === 'animation-state' && s.payload.current === 1), null, { timeout: 4000 });
  const animation = await stateOf(presenter, 'animation-state');
  check('animation-forward advanced the real slide animation and came back as animation-state', animation?.payload?.current === 1 && animation?.payload?.total === 3, JSON.stringify(animation));

  await presenter.evaluate(() => window.__harness.bridge.sendControl('fullscreen-request', { on: true }));
  await presenter.waitForFunction(() => window.__harness.states.some(s => (s.type === 'fullscreen-state' && s.payload.on === true) || (s.type === 'audience-error' && s.payload.code === 'FULLSCREEN_DENIED')), null, { timeout: 4000 });
  const fullscreen = await presenter.evaluate(() => window.__harness.states.filter(s => s.type === 'fullscreen-state' || s.type === 'audience-error').at(-1));
  check('fullscreen-request was either honoured or reported as FULLSCREEN_DENIED, never left ambiguous', Boolean(fullscreen), JSON.stringify(fullscreen));

  // Audience-driven navigation is acknowledged too.
  await audience.locator('[data-nav="next"]').click();
  await presenter.waitForFunction(() => window.__harness.states.filter(s => s.type === 'slide-state').at(-1)?.payload.index === 1, null, { timeout: 4000 });
  check('a click in the audience window itself is acknowledged as slide-state', true);

  const rejected = await presenter.evaluate(() => [
    window.__harness.bridge.sendControl('goto', { index: -1 }),
    window.__harness.bridge.sendControl('goto', { index: 'two' }),
    window.__harness.bridge.sendControl('eval', { code: '1' }),
    window.__harness.bridge.sendControl('annotation-command', { tool: 'script' }),
  ]);
  check('malformed or unknown controls are refused before posting', rejected.every(value => value === false), JSON.stringify(rejected));

  await sleep(1200);
  check('heartbeat pings kept the connection alive across several intervals', await lastStatus(presenter) === 'connected');
  const raw = await harness(presenter, () => window.__harness.raw);
  check('every message that reached the presenter window came from the audience origin', raw.length > 0 && raw.every(m => m.origin === AUDIENCE_ORIGIN), JSON.stringify(raw.slice(0, 3)));
  const ignored = await harness(presenter, () => window.__harness.ignored);
  check('the presenter ignored nothing during a clean session', ignored.length === 0, JSON.stringify(ignored));
  check('acknowledgements never carried slide source', !JSON.stringify(await harness(presenter, () => window.__harness.states)).includes('<section'));
  const types = new Set(await stateTypes(presenter));
  check('acknowledgement types stayed within the fixed audience set', [...types].every(t => ['audience-ready', 'slide-state', 'animation-state', 'annotation-state', 'supported-overlay-state', 'supported-calculator-state', 'fullscreen-state', 'nav-state', 'audience-error'].includes(t)), [...types].join(','));
});

await scenario('forged and stale messages', async ({ context, presenter }) => {
  const { audience } = await connect(context, presenter, { pingIntervalMs: 300 });
  await audience.waitForSelector('[data-audience-shell]:not([hidden])', { timeout: 8000 });
  await waitStatus(presenter, 'connected');
  const before = await audience.evaluate(() => location.hash);
  // A stranger window on a third origin cannot drive the audience: it is not window.opener.
  const stranger = await context.newPage();
  await stranger.goto(`${PRESENTER_ORIGIN}/presenter.html`);
  await stranger.evaluate(([url, name]) => {
    const target = window.open('', name); // the named audience window, without being its opener
    target.postMessage({ v: 1, nonce: 'aaaaaaaaaaaaaaaaaaaaaaaa', type: 'presenter-init', payload: {} }, '*');
    target.postMessage({ v: 1, nonce: 'aaaaaaaaaaaaaaaaaaaaaaaa', type: 'next', payload: {} }, '*');
  }, [AUDIENCE_URL, 'MSFGWebinarAudience']);
  await sleep(500);
  check('a same-origin stranger that is not window.opener cannot re-initialize or drive the audience', (await audience.evaluate(() => location.hash)) === before && await lastStatus(presenter) === 'connected');
  // The real presenter posting with a wrong nonce is ignored on the audience side.
  await presenter.evaluate(([origin]) => {
    window.__harness.audienceWindow = window.open('', 'MSFGWebinarAudience');
    window.__harness.audienceWindow.postMessage({ v: 1, nonce: 'bbbbbbbbbbbbbbbbbbbbbbbb', type: 'next', payload: {} }, origin);
    window.__harness.audienceWindow.postMessage({ v: 2, nonce: 'bbbbbbbbbbbbbbbbbbbbbbbb', type: 'next', payload: {} }, origin);
    window.__harness.audienceWindow.postMessage('next', origin);
  }, [AUDIENCE_ORIGIN]);
  await sleep(400);
  check('wrong-nonce, wrong-version, and non-object controls from the real opener are ignored', (await audience.evaluate(() => location.hash)) === before);
  // A third window on the audience origin (right origin, wrong source) forges
  // acknowledgements to the presenter, which opened it and is its opener.
  const strangerOnAudienceOrigin = context.waitForEvent('page', { timeout: 8000 });
  await presenter.evaluate(url => { window.__harness.strangerWindow = window.open(url, 'StrangerOnAudienceOrigin'); }, `${AUDIENCE_ORIGIN}/stranger.html`);
  const forger = await strangerOnAudienceOrigin;
  await forger.waitForFunction(() => Boolean(window.__stranger));
  const liveNonce = await audience.evaluate(() => null); // the nonce is never exposed by the audience page
  await forger.evaluate(nonce => window.__stranger.forgeAck(nonce || 'guessed-nonce-guessed-nonce'), liveNonce);
  await sleep(300);
  const forged = await presenter.evaluate(() => window.__harness.states.some(s => s.payload && s.payload.index === 99));
  const ignored = await harness(presenter, () => window.__harness.ignored);
  check('a forged acknowledgement from another window on the audience origin is dropped as SOURCE_OR_ORIGIN', !forged && ignored.includes('SOURCE_OR_ORIGIN') && await lastStatus(presenter) === 'connected', JSON.stringify(ignored));
  // An opener on a non-Dashboard origin cannot drive an audience it opened itself.
  const strangerAudience = context.waitForEvent('page', { timeout: 8000 });
  await forger.evaluate(url => window.__stranger.openOwnAudience(url), AUDIENCE_URL);
  const hijacked = await strangerAudience;
  await hijacked.waitForSelector('[data-audience-shell]:not([hidden])', { timeout: 8000 });
  const hijackedBefore = await hijacked.evaluate(() => location.hash);
  await forger.evaluate(() => window.__stranger.driveOwnAudience());
  await sleep(500);
  check('an opener on a non-Dashboard origin is rejected: presenter-init and next from it change nothing', (await hijacked.evaluate(() => location.hash)) === hijackedBefore);
  await hijacked.close();
  await forger.close();
  await stranger.close();
});

await scenario('reconnect while the audience is still open', async ({ context, presenter }) => {
  const { audience } = await connect(context, presenter, { pingIntervalMs: 300 });
  await audience.waitForSelector('[data-audience-shell]:not([hidden])', { timeout: 8000 });
  await waitStatus(presenter, 'connected');
  await presenter.evaluate(() => window.__harness.bridge.sendControl('next', {}));
  await presenter.waitForFunction(() => window.__harness.states.filter(s => s.type === 'slide-state').at(-1)?.payload.index === 1, null, { timeout: 4000 });
  // The audience navigates away (a foreign page in the named window); pongs stop.
  await audience.goto(`${AUDIENCE_ORIGIN}/stranger.html`);
  await waitStatus(presenter, 'disconnected', 8000);
  check('a navigated-away audience window is detected as disconnected', await lastStatus(presenter) === 'disconnected');
  const reconnected = await presenter.evaluate(() => window.__harness.bridge.reconnect());
  await audience.waitForSelector('[data-audience-shell]:not([hidden])', { timeout: 8000 });
  await waitStatus(presenter, 'connected');
  check('reconnect re-navigates the same named window back to the audience page and completes a fresh handshake', reconnected === true && audience.url().startsWith(AUDIENCE_URL) && await lastStatus(presenter) === 'connected');
  const ready = await stateOf(presenter, 'audience-ready');
  check('the re-navigated audience starts from its own state under the new nonce', ready?.payload?.total === fixture.slides.length, JSON.stringify(ready));
});

await scenario('audience closed and reconnect', async ({ context, presenter }) => {
  const { audience } = await connect(context, presenter, { pingIntervalMs: 200, maxMissedPongs: 2 });
  await audience.waitForSelector('[data-audience-shell]:not([hidden])', { timeout: 8000 });
  await waitStatus(presenter, 'connected');
  await audience.close();
  await waitStatus(presenter, 'disconnected', 5000);
  check('closing the audience window disconnects the bridge within the heartbeat budget', await lastStatus(presenter) === 'disconnected');
  const popup = context.waitForEvent('page', { timeout: 8000 });
  const reconnected = await presenter.evaluate(() => window.__harness.bridge.reconnect());
  const reopened = await popup;
  await reopened.waitForSelector('[data-audience-shell]:not([hidden])', { timeout: 8000 });
  await waitStatus(presenter, 'connected');
  check('reconnect reopens the audience window and completes a fresh handshake', reconnected === true && await lastStatus(presenter) === 'connected');
  await presenter.evaluate(() => window.__harness.bridge.sendControl('next', {}));
  await presenter.waitForFunction(() => window.__harness.states.filter(s => s.type === 'slide-state').at(-1)?.payload.index === 1, null, { timeout: 4000 });
  check('the reopened audience follows controls under the new nonce', (await reopened.evaluate(() => location.hash)) === `#${fixture.slides[1].anchor}`);
  await presenter.evaluate(() => window.__harness.bridge.destroy());
  await sleep(300);
  const afterDestroy = await presenter.evaluate(() => [window.__harness.bridge.status(), window.__harness.bridge.sendControl('next', {}), window.__harness.bridge.connect()]);
  check('destroy stops the bridge: no further controls or connects', afterDestroy[1] === false && afterDestroy[2] === false, JSON.stringify(afterDestroy));
});

await browser.close();
for (const server of servers) server.kill();
const passed = results.filter(Boolean).length;
console.log(`\n${passed}/${results.length} checks passed`);
process.exit(passed === results.length ? 0 : 1);
