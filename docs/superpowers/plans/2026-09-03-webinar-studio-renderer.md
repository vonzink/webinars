# Webinar Studio Renderer and Public Bundle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serve a strict public live bundle and render it in a generic, sandboxed audience shell that preserves session-pinned versions, navigation, responsive fitting, and controlled animation events without exposing private Studio data.

**Architecture:** The Dashboard API compiles normalized live records and immutable asset tokens into an allow-listed JSON bundle with an ETag and revalidation headers. The public host loads that bundle exactly once per audience session, composes each active slide into a unique-origin iframe, and keeps all navigation, fitting, annotations, and presentation state in the trusted outer shell. This package adds a parallel, non-live viewer entry point; the existing production webinar remains unchanged until the migration/cutover package.

**Tech Stack:** Dashboard Node.js/Express/MySQL services, SHA-256 ETags, CloudFront-compatible HTTP caching, browser ES modules, sandboxed iframes with CSP `srcdoc`, Web Crypto nonces, Node test runner, Playwright browser audits

**Spec:** `/Users/zacharyzink/MSFG/Webinars/docs/superpowers/specs/2026-09-03-webinar-studio-design.md`

## Global Constraints

- Complete and review the foundation and shared-assets packages first.
- The public API requires no authentication and returns `404` for an archived or `audience_enabled = false` webinar.
- Public JSON contains only webinar ID, slug, title, live version, validated Master HTML/CSS, ordered slide IDs/anchors/titles/HTML/CSS/JavaScript, and resolved immutable CDN asset URLs.
- Public JSON never contains user IDs, owner details, notes, settings, history, audit data, storage keys, upload data, write credentials, Cognito data, or editor metadata.
- A fresh page load revalidates and sees the latest successful Save Live; an already-open audience session remains pinned to its initially loaded version until refresh.
- Preview and public rendering must use the same composition order, CSP builder, sandbox attributes, message schema, and runtime bootstrap.
- Master HTML contains exactly one `{{SLIDE_CONTENT}}`; source asset tokens are resolved only for delivery and remain tokens in stored revisions.
- Slide JavaScript executes only in a sandboxed iframe with `allow-scripts`; never add `allow-same-origin`, top navigation, popups, downloads, forms, pointer lock, or storage privileges.
- Block JavaScript network connections with `connect-src 'none'`; block external scripts; allow only the approved asset CDN for images/media/fonts plus the explicitly allowed HTTPS stylesheet/font sources.
- The trusted outer shell accepts only fixed runtime messages from the exact active iframe window and matching random nonce.
- Runtime errors expose a non-sensitive code to audiences and detailed source location only to an authenticated Studio preview in the later editor package.
- The static production `index.html` and presenter continue unchanged in this package.
- Do not deploy the public API or viewer, enable audience access, modify CloudFront/Amplify, or cut over a URL without separate explicit approval.
- Preserve unrelated dirty/untracked webinar work; stage only files listed by each task.

---

## Package Boundary and File Map

Dashboard repository files:

- `backend/services/webinars/publicBundle.js` — allow-listed live read, asset resolution, deterministic JSON, ETag.
- `backend/routes/publicWebinars.js` — unauthenticated GET/HEAD, origin policy, cache headers, 304.
- `backend/server.js` — dynamic CORS policy and public route mount.
- Matching service and route tests.

Webinars repository files under `first-home-without-mystery/deck/`:

- `studio-viewer.html` — parallel audience-shell entry point used only in local/staging verification.
- `css/studio-viewer.css` — trusted shell, loading/error states, navigation, progress, and iframe fit.
- `js/studio/runtime-protocol.js` — fixed iframe event names and payload validation.
- `js/studio/composition.js` — asset-token resolution, CSP, and deterministic `srcdoc` composition.
- `js/studio/slide-frame.js` — sandbox iframe lifecycle and runtime error boundary.
- `js/studio/bundle-loader.js` — one-load session pinning, ETag-aware fresh-load fetch.
- `js/studio/audience-controller.js` — slide navigation, anchors, fitting, animation controls, and trusted shell state.
- Node unit tests and a focused Playwright browser audit.

Execution preflight records both repositories independently:

```bash
git -C /Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com status --short
git -C /Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com log --oneline -5
git -C /Users/zacharyzink/MSFG/Webinars status --short
git -C /Users/zacharyzink/MSFG/Webinars log --oneline -5
npm --prefix /Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend test
npm --prefix /Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck test
```

Expected: reviewed foundation/assets commits are present in Dashboard, the existing 45-test webinar contract suite remains green, and the Webinars dirty baseline is recorded. Stop if any listed target file already exists with unrelated work or any existing file to be modified has changed since review.

### Task 0: Checkpoint the current webinar source before extending it

**Files:**
- Modify: `/Users/zacharyzink/MSFG/Webinars/.gitignore`
- Add existing source: `/Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck/`
- Create: `/Users/zacharyzink/MSFG/Webinars/docs/superpowers/validation/2026-09-03-first-home-static-baseline.md`

**Interfaces:**
- Consumes: the current locally verified/deployed webinar source and its 45-test Node suite/browser contracts.
- Produces: a Git-tracked baseline for all renderer/editor work while retaining local browser output and screenshots outside version control.

- [ ] **Step 1: Write ignore rules without deleting local artifacts**

Append exact patterns:

```gitignore
.DS_Store
**/.DS_Store
**/node_modules/
**/.playwright-cli/
**/output/playwright/
**/migration/runtime/
```

Do not remove ignored files; they remain local and recoverable.

- [ ] **Step 2: Run the current source baseline gates**

```bash
npm test
./tests/run-ui-browser-contract.sh
./tests/run-fit-browser-audit.sh
```

Expected: 45 Node tests pass, the UI browser contract passes, and the fit audit passes without console/network errors.

- [ ] **Step 3: Record the exact baseline**

The validation document records all 15 anchors, the four popouts, calculator/annotation/presenter surfaces, exact test results, the live URL, current root/nested-site Git states, and SHA-256 for every non-generated file under `first-home-without-mystery/deck`. It states that this is source checkpointing and not a deployment.

- [ ] **Step 4: Stage only the current source boundary and inspect it**

```bash
git add .gitignore first-home-without-mystery/deck docs/superpowers/validation/2026-09-03-first-home-static-baseline.md
git diff --cached --stat
git diff --cached --name-only | rg 'node_modules|\.playwright-cli|output/playwright|\.DS_Store|\.env$' && exit 1 || true
```

Expected: source/tests/assets are staged; dependencies, browser output, secrets, and unrelated files are absent.

- [ ] **Step 5: Commit the source baseline**

```bash
git commit -m "chore(webinars): checkpoint first-home source baseline"
```

### Task 1: Build an allow-listed public bundle service

**Files:**
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/services/webinars/publicBundle.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/tests/services/webinars/publicBundle.test.js`

**Interfaces:**
- Consumes: `db.query`, `replaceAssetTokens`, immutable available asset-version rows, and audience-enabled live webinar/slide rows.
- Produces: `getLiveBundleBySlug(slug): Promise<{bundle, json, etag}|null>` and `toPublicBundle(rows, assetUrls): PublicWebinarBundle`.

- [ ] **Step 1: Write failing allow-list and deterministic-ETag tests**

```js
const result = await getLiveBundleBySlug('first-home-without-mystery');
expect(result.bundle).toEqual({
  schemaVersion: 1,
  webinar: { id: 12, slug: 'first-home-without-mystery', title: 'Your first home, without the mystery.', liveVersion: 8 },
  master: { html: '<main>{{SLIDE_CONTENT}}</main>', css: ':root{--green:#8cc63e}' },
  slides: [{ id: slideId, position: 0, anchor: 'opening', title: 'Opening', html: `<img src="{{ASSET:${versionId}}}">`, css: '', javascript: '' }],
  assets: { [versionId]: 'https://assets.example/approved/logo.png' },
  resourcePolicy: { assetOrigin: 'https://assets.example', stylesheetOrigins: ['https://fonts.example'], fontOrigins: ['https://fonts.example'] },
});
expect(JSON.stringify(result.bundle)).not.toMatch(/owner|userId|note|setting|history|audit|s3|createdBy|updatedBy/i);
expect(JSON.stringify(result.bundle)).not.toMatch(/speakerNotes|targetSeconds/i);
expect((await getLiveBundleBySlug('first-home-without-mystery')).etag).toBe(result.etag);
```

Assert a title/code change changes the ETag, slide order is numeric, malformed/unavailable token fails closed, and archived/disabled/missing rows return `null`.

- [ ] **Step 2: Run the focused test and verify the missing service**

```bash
npx vitest run tests/services/webinars/publicBundle.test.js
```

Expected: FAIL because `publicBundle.js` is missing.

- [ ] **Step 3: Implement a deterministic public compiler**

Query only required columns, never `SELECT *`. Validate every unique asset token through `webinar_asset_versions.status = 'available'` and construct the referenced-version-to-CDN-URL map through asset config. Include the server-owned public resource policy and keep immutable tokens in the returned source so public and preview composition use the same browser resolver. Serialize with stable object-key and slide-order behavior, then calculate:

```js
const json = JSON.stringify(bundle);
const etag = `"${createHash('sha256').update(json).digest('hex')}"`;
```

Return `null` for disabled/archived/missing webinars. Throw a controlled `PUBLIC_BUNDLE_INVALID` error if normalized live state references an unavailable asset; do not return a partial bundle.

- [ ] **Step 4: Run focused and full Dashboard tests**

```bash
npx vitest run tests/services/webinars/publicBundle.test.js
npm test
```

Expected: all allow-list, token, order, ETag, and existing tests pass.

- [ ] **Step 5: Commit the compiler**

```bash
git add backend/services/webinars/publicBundle.js backend/tests/services/webinars/publicBundle.test.js
git commit -m "feat(webinars): compile public live bundles"
```

### Task 2: Expose public reads and safe runtime-error telemetry

**Files:**
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/routes/publicWebinars.js`
- Modify: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/server.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/tests/routes/publicWebinars.test.js`
- Modify: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/tests/routes/health.test.js`

**Interfaces:**
- Consumes: `getLiveBundleBySlug`, `recordOperationalEvent`, `PUBLIC_WEBINAR_ORIGINS`, existing Dashboard `ALLOWED_ORIGINS` behavior.
- Produces: unauthenticated `GET /api/public/webinars/:slug/live` and equivalent `HEAD`, strong ETag revalidation, `POST /api/public/webinars/:slug/runtime-events`, an IP-keyed 60-events-per-minute limiter, and dynamic CORS that does not broaden private-route origins.

- [ ] **Step 1: Write failing HTTP boundary tests**

Assert exact origin behavior and response headers:

```js
const fresh = await request(app, '/api/public/webinars/first-home-without-mystery/live', {
  headers: { Origin: 'https://msfgmortgage.com' },
});
expect(fresh.status).toBe(200);
expect(fresh.headers.get('access-control-allow-origin')).toBe('https://msfgmortgage.com');
expect(fresh.headers.get('cross-origin-resource-policy')).toBe('cross-origin');
expect(fresh.headers.get('cache-control')).toBe('public, max-age=0, must-revalidate, stale-if-error=300');
expect(fresh.headers.get('etag')).toMatch(/^"[a-f0-9]{64}"$/);

const unchanged = await request(app, path, { headers: { Origin: 'https://msfgmortgage.com', 'If-None-Match': fresh.headers.get('etag') } });
expect(unchanged.status).toBe(304);
expect((await request(app, path, { headers: { Origin: 'https://evil.example' } })).status).toBe(403);
```

Also assert private routes still reject the mortgage origin at CORS, GET/HEAD require no auth, missing/disabled slug is 404, invalid bundle is 503 with no source detail, and `Vary: Origin` is present.

For telemetry, accept only an object with exact keys `liveVersion`, `slideId`, and `code`; `liveVersion` is a positive safe integer, `slideId` is a UUID, and `code` is one of `SLIDE_STARTUP_TIMEOUT` or `SLIDE_RUNTIME_ERROR`. Assert unknown/extra/source-bearing fields return 400, a valid event returns 204, rate excess returns 429, and the logger receives only slug/version/slide ID/code. Bundle-load failure is already recorded by the GET route and has no fabricated slide ID.

- [ ] **Step 2: Run route tests and verify missing-router failures**

```bash
npx vitest run tests/routes/publicWebinars.test.js tests/routes/health.test.js
```

Expected: FAIL because the public route and path-aware CORS configuration are absent.

- [ ] **Step 3: Implement path-aware CORS and the route**

Replace the single static CORS options object with the supported request delegate:

```js
app.use(cors((req, callback) => {
  const isPublicWebinar = req.path.startsWith('/api/public/webinars/');
  callback(null, isPublicWebinar ? publicWebinarCorsOptions(req) : dashboardCorsOptions(req));
}));
```

`PUBLIC_WEBINAR_ORIGINS` defaults to `https://msfgmortgage.com` plus explicit localhost origins only in development. Private route origin rules stay unchanged, and the CORS delegate assigns status 403 to a rejected-origin error before passing it to the common handler. Before the global JSON parser, reject a runtime-events request whose declared body exceeds 2 KB; after parsing, Zod `.strict()` enforces the three-field object. Mount `app.use('/api/public/webinars', publicWebinarRuntimeLimiter, publicWebinarsRoutes)` without `authenticate` and before private `/api/webinars`; the limiter skips GET/HEAD/OPTIONS and allows 60 telemetry writes per IP per minute. Override Helmet's API-wide resource policy only on this public route with `Cross-Origin-Resource-Policy: cross-origin`. Return the service's pre-serialized JSON with `Content-Type: application/json; charset=utf-8`, ETag, revalidation headers, and no cookies. The telemetry route verifies the slug currently names an audience-enabled webinar, emits `webinar.public_runtime_error`, and returns 204 without writing database content/audit rows.

- [ ] **Step 4: Run route, full test, and lint gates**

```bash
npx vitest run tests/routes/publicWebinars.test.js tests/routes/health.test.js
npm test
npm run lint
```

Expected: route tests pass, private CORS behavior remains constrained, and no new lint errors appear.

- [ ] **Step 5: Commit the public endpoint**

```bash
git add backend/routes/publicWebinars.js backend/server.js backend/tests/routes/publicWebinars.test.js backend/tests/routes/health.test.js
git commit -m "feat(webinars): serve public live bundle"
```

### Task 3: Define the sandbox composition and runtime protocol

**Files:**
- Create: `/Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck/js/studio/runtime-protocol.js`
- Create: `/Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck/js/studio/composition.js`
- Create: `/Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck/tests/studio-runtime-protocol.test.mjs`
- Create: `/Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck/tests/studio-composition.test.mjs`

**Interfaces:**
- Consumes: public bundle master/slide strings, asset CDN origin, optional allowed HTTPS style/font origins, random per-frame nonce.
- Produces: `RUNTIME_PROTOCOL_VERSION`, `RUNTIME_INBOUND_TYPES`, `validateRuntimeInbound(data, nonce)`, `validateRuntimeOutbound(data, nonce)`, `replaceAssetTokens(source, assets)`, `buildSlideCsp(policy)`, and `composeSlideDocument({master,slide,assets,policy,nonce,previewMode})`.

- [ ] **Step 1: Write failing protocol and composition tests**

```js
assert.deepEqual(validateRuntimeInbound({ v: 1, nonce, type: 'animation-forward' }, nonce), {
  v: 1, nonce, type: 'animation-forward', payload: {},
});
assert.equal(validateRuntimeInbound({ v: 1, nonce: 'wrong', type: 'animation-forward' }, nonce), null);
assert.equal(validateRuntimeInbound({ v: 1, nonce, type: 'set-html', payload: '<b>x</b>' }, nonce), null);

const srcdoc = composeSlideDocument({ master, slide, assets, policy, nonce, previewMode: false });
assert.equal((srcdoc.match(/data-slide-mount/g) || []).length, 1);
assert.match(srcdoc, /sandbox-runtime-bootstrap/);
assert.match(srcdoc, /connect-src 'none'/);
assert.doesNotMatch(srcdoc, /allow-same-origin/);
assert.doesNotMatch(srcdoc, /\{\{ASSET:/);
```

Assert source is escaped safely inside bootstrap script serialization, external scripts are absent, Master CSS precedes slide CSS, and slide JavaScript follows the controlled bootstrap.

- [ ] **Step 2: Run Node tests and verify missing-module failures**

```bash
node --test tests/studio-runtime-protocol.test.mjs tests/studio-composition.test.mjs
```

Expected: FAIL because both modules are missing.

- [ ] **Step 3: Implement fixed schemas and deterministic composition**

Allow only these parent-to-slide event types:

```js
export const RUNTIME_INBOUND_TYPES = Object.freeze([
  'slide-enter', 'slide-exit', 'animation-back', 'animation-forward', 'animation-play', 'animation-pause',
  'supported-overlay-state', 'supported-calculator-state',
]);
export const RUNTIME_OUTBOUND_TYPES = Object.freeze([
  'runtime-ready', 'runtime-error', 'animation-state', 'supported-overlay-state', 'supported-calculator-state',
]);
```

The CSP must include `default-src 'none'`, `connect-src 'none'`, `script-src 'unsafe-inline'`, `style-src 'unsafe-inline'` plus configured HTTPS style origins, `img-src` and `media-src` limited to the asset CDN plus `data:`/`blob:` only where required, `font-src` limited to the CDN/configured font origins, `form-action 'none'`, `base-uri 'none'`, `object-src 'none'`, `worker-src 'none'`, and `child-src 'none'`. Do not set `frame-ancestors 'none'` on the slide document because the approved viewer must embed it; containment comes from the exact iframe sandbox plus the other CSP directives. Runtime bootstrap listens for versioned nonce-matched events, dispatches `CustomEvent('msfg:<type>')` inside the iframe, catches startup/runtime errors, and posts only fixed outbound messages.

- [ ] **Step 4: Run focused and full webinar tests**

```bash
node --test tests/studio-runtime-protocol.test.mjs tests/studio-composition.test.mjs
npm test
```

Expected: the new contract and all existing webinar tests pass.

- [ ] **Step 5: Commit the sandbox contract**

```bash
git add first-home-without-mystery/deck/js/studio/runtime-protocol.js first-home-without-mystery/deck/js/studio/composition.js first-home-without-mystery/deck/tests/studio-runtime-protocol.test.mjs first-home-without-mystery/deck/tests/studio-composition.test.mjs
git commit -m "feat(webinars): define sandboxed slide runtime"
```

### Task 4: Build the session-pinned bundle loader and slide-frame boundary

**Files:**
- Create: `/Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck/js/studio/bundle-loader.js`
- Create: `/Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck/js/studio/slide-frame.js`
- Create: `/Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck/tests/studio-bundle-loader.test.mjs`
- Create: `/Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck/tests/studio-slide-frame.test.mjs`

**Interfaces:**
- Consumes: public endpoint base URL, slug, Fetch API, `composeSlideDocument`, protocol validators, Web Crypto.
- Produces: `createBundleLoader({fetchImpl,apiBase})` with `loadOnce(slug)` and `resetForTest()`; `createSlideFrame({container,bundle,policy,onRuntimeState})` with `showSlide(slide)`, `send(type,payload)`, and `destroy()`.

- [ ] **Step 1: Write failing session and source-window tests**

```js
const loader = createBundleLoader({ fetchImpl, apiBase });
const first = await loader.loadOnce(slug);
serverBundle.liveVersion = 9;
const second = await loader.loadOnce(slug);
assert.equal(second, first);
assert.equal(fetchImpl.mock.calls.length, 1);
```

For the frame, fake two `contentWindow` objects. Assert only messages from the active frame with matching nonce are accepted, the iframe has exactly `sandbox="allow-scripts"`, switching slides sends `slide-exit` before replacement, destroy removes listeners, and a startup timeout produces `SLIDE_STARTUP_TIMEOUT` without inserting source into the outer document.

- [ ] **Step 2: Run focused tests and verify missing-module failures**

```bash
node --test tests/studio-bundle-loader.test.mjs tests/studio-slide-frame.test.mjs
```

Expected: FAIL because loader and frame modules are missing.

- [ ] **Step 3: Implement one-load pinning and source-bound messaging**

Keep the loaded bundle only in the loader instance; do not use localStorage, sessionStorage, or a background refresh. `showSlide` creates a fresh nonce and iframe, sets `srcdoc`, registers exact source/nonced message validation, and emits trusted state callbacks `{type:'ready'}`, `{type:'error',code}`, or `{type:'animation-state',current,total,playing}`. Send parent events with target origin `'*'` only because a sandbox without `allow-same-origin` has an opaque origin; source-window and nonce checks are mandatory on both sides.

```js
async function loadOnce(slug) {
  if (!bundlePromise) bundlePromise = fetchBundle(fetchImpl, apiBase, slug);
  return bundlePromise;
}

function showSlide(slide) {
  const nonce = crypto.randomUUID();
  const iframe = document.createElement('iframe');
  iframe.setAttribute('sandbox', 'allow-scripts');
  iframe.srcdoc = composeSlideDocument({ master: bundle.master, slide, assets: bundle.assets, policy, nonce, previewMode: false });
  bindActiveFrameMessages(iframe.contentWindow, nonce, onRuntimeState);
  container.replaceChildren(iframe);
}
```

- [ ] **Step 4: Run focused and full webinar tests**

```bash
node --test tests/studio-bundle-loader.test.mjs tests/studio-slide-frame.test.mjs
npm test
```

Expected: one network load per audience session, strict iframe source matching, and the entire existing suite passes.

- [ ] **Step 5: Commit loader and frame boundary**

```bash
git add first-home-without-mystery/deck/js/studio/bundle-loader.js first-home-without-mystery/deck/js/studio/slide-frame.js first-home-without-mystery/deck/tests/studio-bundle-loader.test.mjs first-home-without-mystery/deck/tests/studio-slide-frame.test.mjs
git commit -m "feat(webinars): pin live bundles per audience session"
```

### Task 5: Add the parallel trusted audience shell

**Files:**
- Create: `/Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck/studio-viewer.html`
- Create: `/Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck/css/studio-viewer.css`
- Create: `/Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck/js/studio/audience-controller.js`
- Create: `/Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck/tests/studio-audience-controller.test.mjs`

**Interfaces:**
- Consumes: bundle loader, slide-frame controller, existing `surface-fit.js`, current annotation module where compatible, URL hash.
- Produces: `initStudioAudience({root,slug,apiBase})`, `goToIndex(index)`, `goToAnchor(anchor)`, `next()`, `previous()`, `sendAnimation(type)`, and `reportRuntimeError({liveVersion,slideId,code})`; accessible loading/error/deck shell at `studio-viewer.html`.

- [ ] **Step 1: Write failing navigation/state tests**

Assert initial anchor selection, numeric clamping, progress/count output, arrow/Home/End keys, form/editable target suppression, animation delegation, refresh-only version update, safe bundle-load error, and no presenter/settings/notes controls in the DOM.

```js
controller.goToAnchor('confident-number');
assert.equal(controller.currentSlide.anchor, 'confident-number');
assert.equal(root.querySelector('[data-slide-count]').textContent, '2 / 15');
assert.deepEqual(frame.send.mock.calls.at(-1), ['slide-enter', { index: 1, anchor: 'confident-number' }]);
```

- [ ] **Step 2: Run the focused test and verify missing implementation**

```bash
node --test tests/studio-audience-controller.test.mjs
```

Expected: FAIL because the controller and shell do not exist.

- [ ] **Step 3: Implement the trusted shell and controller**

Use semantic buttons with visible focus states and an `aria-live` status. The iframe consumes the full 1920×1080 design surface inside `surface-fit.js`; the outer shell owns previous/next/fullscreen, count, progress, annotation canvas, and runtime error state. On a slide startup/runtime failure, post only the three-field allow-listed event to the runtime-events endpoint and ignore telemetry transport failure; bundle-load failures are recorded by the GET route itself. Do not reproduce any authenticated presenter, code, owner, history, notes, or settings UI.

```js
async function initStudioAudience({ root, slug, apiBase }) {
  const bundle = await createBundleLoader({ fetchImpl: fetch, apiBase }).loadOnce(slug);
  const frame = createSlideFrame({ container: root.querySelector('[data-slide-frame]'), bundle, policy: bundle.resourcePolicy, onRuntimeState });
  let index = resolveInitialIndex(bundle.slides, location.hash);
  function render() {
    frame.showSlide(bundle.slides[index]);
    root.querySelector('[data-slide-count]').textContent = `${index + 1} / ${bundle.slides.length}`;
  }
  render();
  return { next: () => { index = Math.min(index + 1, bundle.slides.length - 1); render(); } };
}
```

- [ ] **Step 4: Run focused/full tests and a static secret scan**

```bash
node --test tests/studio-audience-controller.test.mjs
npm test
rg -n "x-webinar-key|Authorization|cognito|presenter-settings|speaker notes|s3_key" studio-viewer.html js/studio css/studio-viewer.css
```

Expected: tests pass; the scan finds no public credential/private-data implementation references.

- [ ] **Step 5: Commit the parallel shell**

```bash
git add first-home-without-mystery/deck/studio-viewer.html first-home-without-mystery/deck/css/studio-viewer.css first-home-without-mystery/deck/js/studio/audience-controller.js first-home-without-mystery/deck/tests/studio-audience-controller.test.mjs
git commit -m "feat(webinars): add database-driven audience shell"
```

### Task 6: Verify sandbox containment and responsive rendering in a real browser

**Files:**
- Create: `/Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck/tests/studio-renderer-browser.run.js`
- Create: `/Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck/tests/run-studio-renderer-browser-audit.sh`
- Create: `/Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck/tests/fixtures/studio-live-bundle.json`
- Create: `/Users/zacharyzink/MSFG/Webinars/docs/superpowers/validation/2026-09-03-webinar-studio-renderer.md`

**Interfaces:**
- Consumes: a local static server, intercepted public-bundle response, Playwright runner pattern already used by `presenter-channel-isolation.run.js`.
- Produces: repeatable browser evidence for containment, navigation, runtime errors, session pinning, and fit at supported desktop/mobile viewports.

- [ ] **Step 1: Create a deterministic fixture and failing browser audit**

The fixture contains three slides: a normal animated slide, a slide that attempts `parent.document`, storage, fetch, popup, form submission, and top navigation, and a slide that throws a runtime error. The audit must assert all escape attempts fail, outer navigation survives, only recognized animation state is received, and the runtime-error slide shows the safe audience state.

```js
const containmentSlide = {
  id: '22222222-2222-4222-8222-222222222222',
  anchor: 'containment',
  html: '<form action="https://evil.example"><button>Submit</button></form>',
  css: '',
  javascript: `Promise.allSettled([fetch('https://evil.example'), Promise.resolve(localStorage.length), Promise.resolve(parent.document.title), Promise.resolve(open('https://evil.example'))]).then(results => parent.postMessage({type:'escape-results',results}, '*'));`,
};
await page.goto(`${baseUrl}/studio-viewer.html#containment`);
await expect(page.locator('[data-runtime-status]')).toContainText('Slide unavailable');
expect(unexpectedRequests).toEqual([]);
```

- [ ] **Step 2: Run the browser audit and verify it catches the unhandled fixture cases**

```bash
./tests/run-studio-renderer-browser-audit.sh
```

Expected before final wiring: FAIL with named containment or rendering assertions rather than a timeout.

- [ ] **Step 3: Complete browser-only wiring and viewport assertions**

Test Chromium at 1920×1080, 1366×768, 1024×768, 390×844, and 844×390. At each size assert zero outer-page horizontal overflow, no unexpected internal scrollbars, visible navigation, correct iframe fit, and no unexpected console errors or failed requests. Fetch the fixture once, change the intercepted response version, confirm the open page stays pinned, reload, and confirm the new version appears.

```js
for (const viewport of [{ width: 1920, height: 1080 }, { width: 1366, height: 768 }, { width: 1024, height: 768 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
  await page.setViewportSize(viewport);
  const metrics = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  assert.equal(metrics.width, metrics.client);
  await expect(page.getByRole('button', { name: 'Next' })).toBeVisible();
}
assert.equal(bundleRequestCount, 1);
await page.reload();
await expect(page.locator('[data-live-version]')).toHaveText('9');
```

- [ ] **Step 4: Run all renderer gates and record evidence**

```bash
npm test
./tests/run-studio-renderer-browser-audit.sh
```

Expected: all Node tests pass and the browser script reports PASS for every viewport and containment case. Record exact counts, screenshots, commit SHAs, and that production deployment/cutover were not performed.

- [ ] **Step 5: Commit renderer verification**

```bash
git add first-home-without-mystery/deck/tests/studio-renderer-browser.run.js first-home-without-mystery/deck/tests/run-studio-renderer-browser-audit.sh first-home-without-mystery/deck/tests/fixtures/studio-live-bundle.json docs/superpowers/validation/2026-09-03-webinar-studio-renderer.md
git commit -m "test(webinars): verify sandboxed public renderer"
```

## Package Exit Gate

Before beginning the private Studio package, review that:

- the public response allow-list is proven by service and HTTP tests;
- private-route CORS behavior did not broaden;
- fresh loads revalidate while open sessions remain pinned;
- iframe sandbox/CSP escape attempts fail in a real browser;
- the parallel viewer preserves navigation and fit without exposing private controls;
- the current production `index.html` and presenter remain untouched; and
- no API or public-host deployment has occurred without separate approval.
