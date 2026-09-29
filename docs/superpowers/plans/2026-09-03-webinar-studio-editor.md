# Webinar Studio Editor and Presenter Bridge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the private Dashboard Webinar Studio with one expandable editor box per slide, Master HTML/CSS, shared assets, history, owner assignment, personal notes/settings, presenter controls, and a secure two-window bridge to the public audience shell.

**Architecture:** A focused Dashboard modal is composed from small global browser modules that use the existing authenticated `ServerAPI`; pure state/reducer helpers are dual-exported for Vitest. Candidate code is never evaluated in the Dashboard: an exact-origin preview host on the public renderer receives candidate source and boots it through the canonical slide sandbox. The Dashboard presenter opens and controls one audience window through a fixed, versioned `postMessage` protocol bound to exact origins, exact `WindowProxy` objects, and an in-memory random launch nonce.

**Tech Stack:** Existing Dashboard HTML/CSS/global JavaScript architecture, `ServerAPI`, Font Awesome already bundled by Dashboard, native `<dialog>`/modal patterns, native code `<textarea>` controls, browser ES modules on the audience host, Web Crypto, `postMessage`, Vitest VM tests, Playwright browser verification

**Spec:** `/Users/zacharyzink/MSFG/Webinars/docs/superpowers/specs/2026-09-03-webinar-studio-design.md`

## Global Constraints

- Complete and review the foundation, asset, and renderer packages before this package.
- Private Studio requests continue to use existing Cognito authentication, database-user mapping, non-external enforcement, and owner/admin authorization.
- The initial production feature gate is administrator-only; enabling assigned owners is a later explicit configuration action after admin verification.
- Use existing active MSFG users for ownership; do not add invitations, webinar accounts, copied user profiles, or client-trusted role checks.
- A webinar has one primary owner; only an administrator can replace that owner; active administrators retain access to every webinar.
- Presenter shortcuts/preferences belong to the authenticated user across every webinar. Notes belong to the authenticated user plus webinar plus stable slide ID.
- Master HTML and Master CSS are shared. Each slide is one expandable box with title, unique anchor, target duration, shared speaker notes, preview, and HTML/CSS/JavaScript tabs.
- Add, duplicate, reorder, and delete preserve stable IDs and version semantics; delete requires confirmation and remains restorable.
- Typing changes only local unsaved state and sandbox preview. **Save Live** is the only code operation that updates the live version.
- Do not add Monaco, CodeMirror, a framework, or an unreviewed third-party editor dependency; accessible monospace textareas with tab insertion meet the first-release requirement.
- Candidate source never enters `innerHTML` in the Dashboard and never executes in the Dashboard document.
- Preview uses the exact public composition module, CSP, iframe sandbox, and runtime protocol from the renderer package.
- Cross-window controls accept only exact allowed origins, exact source windows, matching random nonces, protocol version 1, known message types, and validated scalar payloads.
- Never send arbitrary source, HTML, CSS, JavaScript, URLs, selectors, Cognito tokens, or Dashboard data over the presenter/audience control bridge.
- The old public presenter remains unchanged in this package; redirect occurs only in migration/cutover.
- Do not deploy Dashboard/public frontend, enable owner access, enable audience access, migrate data, cut over URLs, or retire credentials without separate explicit approval.
- Preserve unrelated work in both repositories and commit per repository with only listed files staged.

---

## Package Boundary and File Map

Dashboard repository:

- `js/webinar-studio/api.js` — `ServerAPI` adapter for webinars, notes, settings, users, history, and assets.
- `js/webinar-studio/state.js` — pure normalized state, dirty tracking, conflict handling, and stable slide operations.
- `js/webinar-studio/editor.js` — Master editors, slide boxes/tabs, local validation display, and Save Live handlers.
- `js/webinar-studio/preview.js` — exact-origin candidate preview handshake.
- `js/webinar-studio/assets.js` — shared catalog, uploads, polling, snippets, and editor insertion.
- `js/webinar-studio/presenter.js` — presenter clocks, notes, settings, animation/navigation controls, and audience connection state.
- `js/webinar-studio/bridge.js` — fixed cross-domain presenter protocol and window lifecycle.
- `js/webinar-studio/access-history.js` — active-user owner selector and revision history/restore.
- `js/webinar-studio.js` — small lifecycle coordinator and `WebinarStudio` global.
- `css/webinar-studio.css` — scoped responsive Studio layout.
- `index.html` — Tools entry, modal shell, stylesheet/script tags.
- `js/action-dispatcher.js` — `open-webinar-studio` action.
- Backend frontend-unit tests under `backend/tests/frontend/`.

Webinars repository:

- `first-home-without-mystery/deck/js/studio/preview-host.js` — candidate preview input boundary.
- `first-home-without-mystery/deck/js/studio/presenter-bridge.js` — audience side of the two-window control contract.
- `first-home-without-mystery/deck/js/studio/control-protocol.js` — fixed cross-domain schema shared by tests.
- `first-home-without-mystery/deck/studio-viewer.html` and `js/studio/audience-controller.js` — add preview/presenter modes without changing the default unauthenticated audience surface.
- Node and browser tests under the existing deck test tree.

Preflight:

```bash
git -C /Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com status --short
git -C /Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com log --oneline -8
git -C /Users/zacharyzink/MSFG/Webinars status --short
git -C /Users/zacharyzink/MSFG/Webinars log --oneline -8
npm --prefix /Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend test
npm --prefix /Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck test
```

Expected: all three prerequisite packages are reviewed, tests are green, and exact dirty baselines are recorded. Stop if any target path contains overlapping unreviewed work.

### Task 1: Add the admin-first feature gate and Studio API adapter

**Files:**
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/middleware/webinarStudioAccess.js`
- Modify: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/server.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/tests/middleware/webinarStudioAccess.test.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/js/webinar-studio/api.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/tests/frontend/webinarStudioApi.test.js`

**Interfaces:**
- Consumes: `WEBINAR_STUDIO_ACCESS` environment value, `isAdmin(req)`, existing route mounts, and global `ServerAPI` methods.
- Produces: `requireWebinarStudioAccess(req,res,next)` with modes `disabled`, `admins`, `assigned`; global `WebinarStudioAPI` methods `listWebinars`, `getWebinar`, `createWebinar`, `archiveWebinar`, `saveMaster`, `addSlide`, `saveSlide`, `reorderSlides`, `archiveSlide`, `getHistory`, `restoreRevision`, `changeOwner`, `changeAudienceAccess`, `listNotes`, `addNote`, `updateNote`, `deleteNote`, `getSettings`, `saveSettings`, `listUsers`, `listAssets`, `createUploadIntent`, `confirmUpload`, `createAssetVersionIntent`, `updateAsset`, `updateAssetVersion`, and `getAssetUsage`.

- [ ] **Step 1: Write failing gate and API-path tests**

```js
expect(runGate('disabled', adminReq)).toMatchObject({ status: 404 });
expect(runGate('admins', adminReq)).toBe('next');
expect(runGate('admins', ownerReq)).toMatchObject({ status: 403 });
expect(runGate('assigned', ownerReq)).toBe('next');

await WebinarStudioAPI.saveSlide(12, slideId, { expectedVersion: 7, title: 'Cash', anchor: 'cash', html: '', css: '', javascript: '' });
expect(ServerAPI.put).toHaveBeenCalledWith(`/webinars/12/slides/${slideId}`, expect.objectContaining({ expectedVersion: 7 }));
await WebinarStudioAPI.getSettings();
expect(ServerAPI.get).toHaveBeenCalledWith('/webinar-presenter-settings/me');
```

Assert the public route is never wrapped by this gate and all private webinar/assets/settings mounts are gated.

- [ ] **Step 2: Run focused tests and verify missing modules**

```bash
npx vitest run tests/middleware/webinarStudioAccess.test.js tests/frontend/webinarStudioApi.test.js
```

Expected: FAIL because the feature middleware and API adapter do not exist.

- [ ] **Step 3: Implement a fail-closed gate and exact API adapter**

`WEBINAR_STUDIO_ACCESS` defaults to `disabled`. `admins` calls `isAdmin`; `assigned` permits an administrator or a user returned by `SELECT 1 FROM webinar_presentations WHERE primary_owner_user_id = ? AND archived_at IS NULL LIMIT 1`. Object-level owner/admin checks still apply after the feature gate. Unknown values behave as `disabled` and log one configuration error without request data.

The API adapter wraps only `ServerAPI.get/post/put/patch/delete` and exports named methods for every private spec route; it does not accept arbitrary path fragments from editor fields.

```js
function requireWebinarStudioAccess(req, res, next) {
  const mode = process.env.WEBINAR_STUDIO_ACCESS || 'disabled';
  if (mode === 'admins' && isAdmin(req)) return next();
  if (mode === 'assigned' && isAdmin(req)) return next();
  if (mode === 'assigned') return hasActiveAssignment(req.user.db.id).then(ok => ok ? next() : res.status(403).json({ error: 'Webinar Studio access required' })).catch(next);
  return res.status(mode === 'disabled' ? 404 : 403).json({ error: 'Webinar Studio unavailable' });
}

const WebinarStudioAPI = Object.freeze({
  getWebinar: id => ServerAPI.get(`/webinars/${encodeURIComponent(id)}`),
  saveSlide: (id, slideId, body) => ServerAPI.put(`/webinars/${encodeURIComponent(id)}/slides/${encodeURIComponent(slideId)}`, body),
  getSettings: () => ServerAPI.get('/webinar-presenter-settings/me'),
});
```

- [ ] **Step 4: Run focused/full tests and lint**

```bash
npx vitest run tests/middleware/webinarStudioAccess.test.js tests/frontend/webinarStudioApi.test.js
npm test
npm run lint
```

Expected: access modes, route scoping, adapter paths, and existing tests pass.

- [ ] **Step 5: Commit the gate and adapter**

```bash
git add backend/middleware/webinarStudioAccess.js backend/server.js backend/tests/middleware/webinarStudioAccess.test.js js/webinar-studio/api.js backend/tests/frontend/webinarStudioApi.test.js
git commit -m "feat(webinars): gate private studio access"
```

### Task 2: Implement normalized editor state and conflict-safe dirty tracking

**Files:**
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/js/webinar-studio/state.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/tests/frontend/webinarStudioState.test.js`

**Interfaces:**
- Consumes: private webinar document from `WebinarStudioAPI.getWebinar(id)` and successful mutation responses `{liveVersion,updatedAt}`.
- Produces: dual-exported `createStudioState(document)`, `updateMaster(state,field,value)`, `updateSlide(state,id,field,value)`, `appendServerSlide(state,slide,response)`, `removeServerSlide(state,id,response)`, `applyOrder(state,ids,response)`, `markSurfaceSaved(state,surface,response)`, `applyConflict(state,error)`, `hasUnsavedChanges(state)`, and `canNavigateAway(state)`.

- [ ] **Step 1: Write failing pure-state tests**

```js
const state = createStudioState(fixture);
const edited = updateSlide(state, slideId, 'html', '<h1>Changed</h1>');
expect(edited.slidesById[slideId].dirtyFields).toEqual(['html']);
expect(edited.liveVersion).toBe(7);

const conflicted = applyConflict(edited, { currentVersion: 8, updatedAt: '2026-09-03T12:00:00Z', updatedBy: { id: 8, name: 'Another Editor' } });
expect(conflicted.conflict).toEqual({ currentVersion: 8, updatedAt: '2026-09-03T12:00:00Z', updatedBy: { id: 8, name: 'Another Editor' } });
expect(conflicted.slidesById[slideId].html).toBe('<h1>Changed</h1>');
```

Assert stable IDs/order survive title/anchor/code edits, server success clears only the saved surface, restore reload replaces live state only after confirmation, and duplicate/add waits for a server-issued stable ID.

- [ ] **Step 2: Run the focused test and verify missing module**

```bash
npx vitest run tests/frontend/webinarStudioState.test.js
```

Expected: FAIL because `state.js` is missing.

- [ ] **Step 3: Implement immutable pure state helpers**

Use this top-level shape:

```js
{
  webinar: { id, slug, title, primaryOwnerUserId, audienceEnabled },
  liveVersion,
  master: { html, css, dirtyFields: [] },
  slideOrder: [slideId],
  slidesById: { [slideId]: { id, title, anchor, targetSeconds, speakerNotes, html, css, javascript, dirtyFields: [] } },
  selectedSlideId,
  conflict: null,
}
```

Do not store notes, settings, or asset upload URLs inside the serializable webinar state. Attach helpers to `window.WebinarStudioState` and `module.exports` for existing frontend-test conventions.

- [ ] **Step 4: Run focused and full Dashboard tests**

```bash
npx vitest run tests/frontend/webinarStudioState.test.js
npm test
```

Expected: all state-transition and existing tests pass.

- [ ] **Step 5: Commit the state layer**

```bash
git add js/webinar-studio/state.js backend/tests/frontend/webinarStudioState.test.js
git commit -m "feat(webinars): model conflict-safe studio state"
```

### Task 3: Add the Studio shell, deck picker, and responsive layout

**Files:**
- Modify: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/index.html`
- Modify: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/js/action-dispatcher.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/css/webinar-studio.css`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/js/webinar-studio.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/tests/frontend/webinarStudioShell.test.js`

**Interfaces:**
- Consumes: feature-gated `WebinarStudioAPI.listWebinars/getWebinar`, state helpers, existing modal/Tools menu patterns.
- Produces: global `WebinarStudio.init()`, `open()`, `close()`, `selectWebinar(id)`, `render()`, and scoped `#webinarStudioModal` interface.

- [ ] **Step 1: Write failing DOM/source contract tests**

Read `index.html`, CSS, dispatcher, and lifecycle module and assert:

```js
expect(html).toContain('data-action="open-webinar-studio"');
expect(html).toContain('id="webinarStudioModal"');
expect(html).toContain('id="wsDeckList"');
expect(html).toContain('id="wsWorkspace"');
expect(dispatcher).toContain("'open-webinar-studio'");
expect(css).toContain('#webinarStudioModal');
expect(css).not.toMatch(/(^|[\s,{])\.modal\s*[,{]/);
```

VM-test `open()` loading, 403/404 feature states, empty assigned list, deck selection, close with unsaved changes confirmation, and focus restoration to the launch button.

- [ ] **Step 2: Run focused test and verify missing shell failures**

```bash
npx vitest run tests/frontend/webinarStudioShell.test.js
```

Expected: FAIL on absent action/modal/styles/module.

- [ ] **Step 3: Implement a scoped content-hugging Studio modal**

Add one Tools menu entry visible only after the Studio API returns access. The modal contains a narrow webinar list, an administrator-only **New webinar** action, main workspace, top status/version bar, audience/presenter launch buttons, and a settings drawer with tabs `Presenter`, `Users & Access`, `Code`, `Assets`, and `History`. New webinar creation requires title, unique slug, and one active owner; the API returns the audience-disabled safe default Master wrapper, one blank `opening` slide, and initial live revision 1, which the shell selects without manufacturing client-only IDs. On screens below 900px, the deck list becomes a top selector and the drawer becomes a full-width panel; avoid nested page-level scrollbars by letting only the slide-list/editor region scroll.

Load scripts after `js/api-server.js` and before final initialization. Keep `webinar-studio.js` a coordinator; rendering detail belongs to later modules.

```html
<section id="webinarStudioModal" role="dialog" aria-modal="true" aria-labelledby="wsTitle" hidden>
  <header><h2 id="wsTitle">Webinar Studio</h2><button type="button" data-action="close-webinar-studio" aria-label="Close"></button></header>
  <div class="ws-layout"><nav id="wsDeckList" aria-label="Webinars"></nav><main id="wsWorkspace"></main></div>
</section>
```

```js
async function open() {
  launchButton = document.activeElement;
  modal.hidden = false;
  webinars = await WebinarStudioAPI.listWebinars();
  render();
}
```

- [ ] **Step 4: Run focused/full tests and the Dashboard build**

```bash
npx vitest run tests/frontend/webinarStudioShell.test.js
npm test
node ../build.js
```

Expected: tests pass and `dist/manifest.json` contains hashed Webinar Studio JS/CSS references. Do not stage `dist/` unless the repository's current deployment convention explicitly tracks it; the current build output is verification only.

- [ ] **Step 5: Commit the shell**

```bash
git add index.html js/action-dispatcher.js css/webinar-studio.css js/webinar-studio.js backend/tests/frontend/webinarStudioShell.test.js
git commit -m "feat(webinars): add private studio shell"
```

### Task 4: Add canonical sandbox preview and one-box-per-slide code editing

**Files:**
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/js/webinar-studio/preview.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/js/webinar-studio/editor.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/tests/frontend/webinarStudioPreview.test.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/tests/frontend/webinarStudioEditor.test.js`
- Create: `/Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck/js/studio/preview-host.js`
- Modify: `/Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck/studio-viewer.html`
- Create: `/Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck/tests/studio-preview-host.test.mjs`

**Interfaces:**
- Consumes: Dashboard state/API, public renderer `composeSlideDocument/createSlideFrame`, `WEBINAR_PREVIEW_ORIGIN`, exact iframe `contentWindow`.
- Produces: Dashboard `createPreviewController({iframe,allowedOrigin,onState})` with `boot(candidate)` and `destroy()`; public `initPreviewHost({allowedDashboardOrigins})`; `WebinarStudioEditor.render(state)` and mutation handlers.

- [ ] **Step 1: Write failing preview-boundary and editor tests**

Assert preview ignores wrong origin/source/nonce/unknown type, only accepts a candidate with Master plus one slide, never calls `eval`/`Function`, and returns structured ready/error state. Editor tests assert one `.ws-slide-box` per stable ID, exactly three code tabs, Master HTML/CSS fields, title/anchor/target-duration/shared-speaker-notes fields, dirty/live/conflict badges, and all operations carry current `expectedVersion`.

```js
await editor.saveSlide(slideId);
expect(api.saveSlide).toHaveBeenCalledWith(webinarId, slideId, expect.objectContaining({ expectedVersion: 7 }));
expect(api.saveSlide.mock.calls[0][2]).toEqual(expect.objectContaining({ targetSeconds, speakerNotes, html, css, javascript }));
```

- [ ] **Step 2: Run focused Dashboard and webinar tests**

```bash
npx vitest run tests/frontend/webinarStudioPreview.test.js tests/frontend/webinarStudioEditor.test.js
node --test tests/studio-preview-host.test.mjs
```

Expected: FAIL because preview/editor modules do not exist.

- [ ] **Step 3: Implement exact-origin preview mode and editors**

Dashboard creates a random preview nonce in memory and sends only:

```js
{ v: 1, nonce, type: 'preview-candidate', payload: { master: { html, css }, slide: { id, anchor, title, html, css, javascript }, assets: { [assetVersionId]: immutableCdnUrl }, resourcePolicy: { assetOrigin, stylesheetOrigins, fontOrigins } } }
```

The public preview host accepts initial setup only from its embedding `window.parent` and an exact configured Dashboard origin, resolves the supplied version-to-CDN map through the canonical composition module, then renders through `slide-frame.js`. It never forwards candidate code or asset mappings to any control bridge or API.

The editor uses native textareas with `spellcheck="false"`, accessible tab buttons, Tab-key indentation, debounced 300 ms local preview, and no automatic live save. **Save Live** remains disabled until local policy validation and the current preview startup both succeed; a preview timeout or runtime startup error retains source and identifies the failing surface. Add/duplicate/reorder/delete call their exact APIs; delete uses a modal confirmation naming the slide and explaining History recovery. On 409, retain unsaved text and show the updater's name/time plus Reload/Copy changes actions; never silently retry against the new version. On database/network failure, retain unsaved text and show a retryable error without changing the displayed live version.

- [ ] **Step 4: Run focused/full tests and source-evaluation scan**

```bash
npx vitest run tests/frontend/webinarStudioPreview.test.js tests/frontend/webinarStudioEditor.test.js
node --test tests/studio-preview-host.test.mjs
npm --prefix /Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend test
npm --prefix /Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck test
rg -n "\beval\s*\(|new Function\s*\(" /Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/js/webinar-studio /Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck/js/studio
```

Expected: tests pass and the source scan returns no matches.

- [ ] **Step 5: Commit each repository separately**

Dashboard:

```bash
git add js/webinar-studio/preview.js js/webinar-studio/editor.js backend/tests/frontend/webinarStudioPreview.test.js backend/tests/frontend/webinarStudioEditor.test.js
git commit -m "feat(webinars): edit and preview live slide source"
```

Webinars:

```bash
git add first-home-without-mystery/deck/js/studio/preview-host.js first-home-without-mystery/deck/studio-viewer.html first-home-without-mystery/deck/tests/studio-preview-host.test.mjs
git commit -m "feat(webinars): host canonical studio previews"
```

### Task 5: Add owner assignment, audience access, and revision history

**Files:**
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/js/webinar-studio/access-history.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/tests/frontend/webinarStudioAccessHistory.test.js`
- Modify: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/js/webinar-studio.js`

**Interfaces:**
- Consumes: `WebinarStudioAPI.listUsers/changeOwner/changeAudienceAccess/getHistory/restoreRevision`, current role returned by `/api/me`, state reload/dirty guard.
- Produces: `renderAccessPanel(context)`, `renderHistoryPanel(context)`, `changeOwner(userId)`, `setAudienceEnabled(enabled)`, and `restoreRevision(revisionId)`.

- [ ] **Step 1: Write failing role and restore tests**

Assert owners see current owner/admin explanation but no assignment or archive control; admins can search only active directory rows, change owner, and soft-archive a webinar after confirmation; audience access control is admin-only; history shows version/change/actor-time metadata without code; restore requires confirmation and refuses while unsaved changes exist unless the user explicitly discards them.

```js
await restoreRevision(21);
expect(api.restoreRevision).toHaveBeenCalledWith(webinarId, 21, { expectedVersion: 7 });
expect(context.reload).toHaveBeenCalledTimes(1);
```

- [ ] **Step 2: Run the focused test and verify missing module**

```bash
npx vitest run tests/frontend/webinarStudioAccessHistory.test.js
```

Expected: FAIL because `access-history.js` is missing.

- [ ] **Step 3: Implement server-authoritative access/history UI**

Never infer admin access from a selectable DOM value. Use `/api/me` only for display/visibility; backend remains authoritative. Owner search matches name/email locally over the authenticated directory. Audience toggle copy must state that it controls public availability but does not publish a draft. Restore reloads the entire private document after the new live revision succeeds.

```js
async function restoreRevision(revisionId) {
  if (context.hasUnsavedChanges() && !await context.confirmDiscard()) return;
  await WebinarStudioAPI.restoreRevision(context.webinarId, revisionId, { expectedVersion: context.state.liveVersion });
  await context.reload();
}

async function setAudienceEnabled(enabled) {
  await WebinarStudioAPI.changeAudienceAccess(context.webinarId, { enabled: Boolean(enabled) });
  await context.reload();
}
```

- [ ] **Step 4: Run focused/full tests and build**

```bash
npx vitest run tests/frontend/webinarStudioAccessHistory.test.js
npm test
node ../build.js
```

Expected: tests and build pass.

- [ ] **Step 5: Commit access/history UI**

```bash
git add js/webinar-studio/access-history.js js/webinar-studio.js backend/tests/frontend/webinarStudioAccessHistory.test.js
git commit -m "feat(webinars): manage owners and revision history"
```

### Task 6: Add the shared asset catalog, upload flow, and code insertion

**Files:**
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/js/webinar-studio/assets.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/tests/frontend/webinarStudioAssets.test.js`
- Modify: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/js/webinar-studio.js`

**Interfaces:**
- Consumes: asset API adapter methods, current editor field/cursor, browser `fetch` for presigned PUT only.
- Produces: `renderAssetCatalog(context)`, `uploadAsset(file,metadata)`, `pollVersion(versionId)`, `copyReference(version)`, `copySnippet(version,kind)`, and `insertReference(version,targetEditor)`.

- [ ] **Step 1: Write failing catalog/upload tests**

Cover search/media filters, thumbnails/media previews, family name/description editing, status chips, usage display, Copy reference, HTML/CSS snippets, cursor insertion, upload progress, 202 polling with capped backoff, rejection reason, new-version upload, uploader/admin version archive controls, administrator unused-family archive, and 409 in-use archive state.

```js
await uploadAsset(file, { displayName: 'Front porch' });
expect(api.createUploadIntent).toHaveBeenCalledWith(expect.objectContaining({ filename: 'porch.webp', contentType: 'image/webp', byteSize: file.size }));
expect(fetch).toHaveBeenCalledWith(uploadUrl, expect.objectContaining({ method: 'PUT', body: file }));
expect(api.confirmUpload).toHaveBeenCalledWith(versionId);
```

- [ ] **Step 2: Run the focused test and verify missing module**

```bash
npx vitest run tests/frontend/webinarStudioAssets.test.js
```

Expected: FAIL because `assets.js` is missing.

- [ ] **Step 3: Implement catalog and insertion behavior**

Validate file type/size in the browser for immediate feedback, while treating server checks as authoritative. Presigned PUT sends the exact `Content-Type`. Poll confirmation at 1, 2, 4, then 8-second intervals, capped at 8 seconds and stopped when the modal closes; `processing` remains visible and can be refreshed later. Insert only a concrete version token such as `{{ASSET:11111111-1111-4111-8111-111111111111}}` or an escaped predefined snippet that contains the selected version's concrete token. Never insert the presigned upload URL or S3 key.

```js
async function uploadAsset(file, metadata) {
  assertBrowserMediaLimit(file);
  const intent = await WebinarStudioAPI.createUploadIntent(Object.assign({}, metadata, { filename: file.name, contentType: file.type, byteSize: file.size }));
  await fetch(intent.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
  return pollVersion(intent.versionId);
}

function insertReference(version, targetEditor) {
  targetEditor.setRangeText(`{{ASSET:${version.id}}}`, targetEditor.selectionStart, targetEditor.selectionEnd, 'end');
}
```

- [ ] **Step 4: Run focused/full tests and build**

```bash
npx vitest run tests/frontend/webinarStudioAssets.test.js
npm test
node ../build.js
```

Expected: asset UI tests, existing tests, and build pass.

- [ ] **Step 5: Commit the asset UI**

```bash
git add js/webinar-studio/assets.js js/webinar-studio.js backend/tests/frontend/webinarStudioAssets.test.js
git commit -m "feat(webinars): add reusable asset library UI"
```

### Task 7: Add personal notes, shortcuts, clocks, and presenter controls

**Files:**
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/js/webinar-studio/presenter.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/tests/frontend/webinarStudioPresenter.test.js`
- Modify: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/js/webinar-studio.js`

**Interfaces:**
- Consumes: notes/settings API, current slide/order, canonical sandbox preview controller for the up-next thumbnail, existing sensible shortcut defaults from `first-home-without-mystery/deck/js/presenter-shortcuts.js`, and bridge `sendControl` supplied in Task 8.
- Produces: `createPresenterController(context)` with `startTimer`, `resetTimer`, `goNext`, `goPrevious`, `animationBack`, `animationForward`, `animationPlay`, `animationPause`, `loadNotes`, `addNote`, `editNote`, `deleteNote`, `loadSettings`, and `saveSettings`.

- [ ] **Step 1: Write failing presenter behavior tests**

Assert the four compact animation controls sit immediately above Back/Next/Start timer, the up-next thumbnail renders the next slide through the canonical sandbox preview, note Save/Edit/Delete icons are compact and upper-right, edit updates the chosen note, notes reload by stable slide ID, shortcuts save once for the authenticated account, duplicate shortcut keys are rejected, and key handling is suppressed for `input`, `textarea`, `select`, `button`, `[contenteditable]`, and modal/dialog controls.

```js
await controller.addNote('Remember cash example');
expect(api.addNote).toHaveBeenCalledWith(webinarId, slideId, { body: 'Remember cash example' });
await controller.saveSettings(shortcuts, preferences);
expect(api.saveSettings).toHaveBeenCalledWith({ shortcuts, preferences });
```

- [ ] **Step 2: Run focused test and verify missing module**

```bash
npx vitest run tests/frontend/webinarStudioPresenter.test.js
```

Expected: FAIL because `presenter.js` is missing.

- [ ] **Step 3: Implement authenticated presenter state**

Use the current authenticated account only; remove the public loan-officer selector and browser write key path from the new presenter. Preserve current timing calculations, canonical sandboxed up-next preview, animation state display, annotations, overlays/calculators, fullscreen state, compact note actions, and shortcut capture behavior. Keep local unsaved shortcut edits in memory on API failure and report an error; do not fall back to a public unauthenticated write.

```js
async function saveSettings(shortcuts, preferences) {
  assertUniqueShortcutKeys(shortcuts);
  try {
    return await WebinarStudioAPI.saveSettings({ shortcuts, preferences });
  } catch (error) {
    context.retainUnsavedSettings({ shortcuts, preferences });
    context.showError('Settings were not saved. Your changes are still here.');
    throw error;
  }
}
```

- [ ] **Step 4: Run focused/full tests and build**

```bash
npx vitest run tests/frontend/webinarStudioPresenter.test.js
npm test
node ../build.js
```

Expected: presenter UI contract, existing tests, and build pass.

- [ ] **Step 5: Commit private presenter UI**

```bash
git add js/webinar-studio/presenter.js js/webinar-studio.js backend/tests/frontend/webinarStudioPresenter.test.js
git commit -m "feat(webinars): add authenticated presenter controls"
```

### Task 8: Implement the exact-source cross-domain presenter bridge

**Files:**
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/js/webinar-studio/bridge.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/tests/frontend/webinarStudioBridge.test.js`
- Create: `/Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck/js/studio/control-protocol.js`
- Create: `/Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck/js/studio/presenter-bridge.js`
- Modify: `/Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck/js/studio/audience-controller.js`
- Modify: `/Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck/studio-viewer.html`
- Create: `/Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck/tests/studio-control-protocol.test.mjs`
- Create: `/Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck/tests/studio-presenter-bridge.test.mjs`

**Interfaces:**
- Consumes: exact Dashboard/audience origins, `window.open`, public audience controller, Web Crypto.
- Produces: Dashboard `createAudienceBridge({audienceUrl,allowedOrigin,onState})` with `connect`, `reconnect`, `sendControl`, `destroy`; audience `initPresenterBridge({controller,allowedDashboardOrigins})`; protocol version 1 schemas.

- [ ] **Step 1: Write failing bidirectional protocol tests**

Allow exact control types: `goto`, `next`, `previous`, `animation-back`, `animation-forward`, `animation-play`, `animation-pause`, `annotation-command`, `supported-overlay-state`, `supported-calculator-state`, `fullscreen-request`, `nav-visibility`, `ping`. Allow acknowledgements: `audience-ready`, `slide-state`, `animation-state`, `annotation-state`, `supported-overlay-state`, `supported-calculator-state`, `fullscreen-state`, `nav-state`, `pong`, `audience-error`.

Assert wrong origin, wrong `event.source`, wrong nonce, wrong version, unknown type, extra executable fields, URLs/selectors/code strings, and invalid index/boolean/enum payloads are ignored. Assert only ignored-message reason codes—not payloads—are logged.

```js
const accepted = validateControlMessage({ v: 1, nonce, type: 'goto', payload: { index: 4 } }, nonce);
assert.deepEqual(accepted, { v: 1, nonce, type: 'goto', payload: { index: 4 } });
assert.equal(validateControlMessage({ v: 1, nonce: 'wrong', type: 'next', payload: {} }, nonce), null);
assert.equal(validateControlMessage({ v: 1, nonce, type: 'goto', payload: { url: 'https://evil.example' } }, nonce), null);
expect(onIgnored).toHaveBeenCalledWith('INVALID_PAYLOAD');
expect(onIgnored.mock.calls.flat().join(' ')).not.toContain('evil.example');
```

- [ ] **Step 2: Run Dashboard and webinar bridge tests**

```bash
npx vitest run tests/frontend/webinarStudioBridge.test.js
node --test tests/studio-control-protocol.test.mjs tests/studio-presenter-bridge.test.mjs
```

Expected: FAIL because bridge/protocol modules are missing.

- [ ] **Step 3: Implement handshake, heartbeats, and reconnect**

Dashboard opens one named window and retains its exact `WindowProxy`. After load it sends an initialization message only to the configured audience origin. Audience accepts initialization only from exact `window.opener` and allowed Dashboard origin, stores the nonce in memory, and replies `audience-ready`. Subsequent messages require `{v:1,nonce,type,payload}` and exact source/origin. Send ping every 5 seconds while connected; after three missed acknowledgements show disconnected and stop sending controls until reconnect. Closing/reloading the audience window never weakens origin checks.

```js
function onAudienceMessage(event) {
  if (event.origin !== allowedOrigin || event.source !== audienceWindow) return ignore('SOURCE_OR_ORIGIN');
  const message = validateAudienceMessage(event.data, nonce);
  if (!message) return ignore('INVALID_MESSAGE');
  if (message.type === 'pong') missedPongs = 0;
  onState(message);
}

function sendControl(type, payload = {}) {
  if (!connected || missedPongs >= 3) return false;
  audienceWindow.postMessage({ v: 1, nonce, type, payload }, allowedOrigin);
  return true;
}
```

- [ ] **Step 4: Run focused/full tests and secret/source scans**

```bash
npx vitest run tests/frontend/webinarStudioBridge.test.js
node --test tests/studio-control-protocol.test.mjs tests/studio-presenter-bridge.test.mjs
npm --prefix /Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend test
npm --prefix /Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck test
rg -n "x-webinar-key|Authorization|cognito|localStorage|sessionStorage" /Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck/js/studio
```

Expected: all tests pass; the public Studio runtime contains no credentials/Cognito access or browser storage.

- [ ] **Step 5: Commit each repository separately**

Dashboard:

```bash
git add js/webinar-studio/bridge.js backend/tests/frontend/webinarStudioBridge.test.js
git commit -m "feat(webinars): control audience from private studio"
```

Webinars:

```bash
git add first-home-without-mystery/deck/js/studio/control-protocol.js first-home-without-mystery/deck/js/studio/presenter-bridge.js first-home-without-mystery/deck/js/studio/audience-controller.js first-home-without-mystery/deck/studio-viewer.html first-home-without-mystery/deck/tests/studio-control-protocol.test.mjs first-home-without-mystery/deck/tests/studio-presenter-bridge.test.mjs
git commit -m "feat(webinars): accept trusted presenter controls"
```

### Task 9: Run private Studio browser acceptance without deployment

**Files:**
- Create: `/Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck/tests/webinar-studio-browser.run.js`
- Create: `/Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck/tests/run-webinar-studio-browser-audit.sh`
- Create: `/Users/zacharyzink/MSFG/Webinars/docs/superpowers/validation/2026-09-03-webinar-studio-editor.md`

**Interfaces:**
- Consumes: local Dashboard static server, local audience static server, intercepted/auth-stubbed API fixtures for admin/owner/other user, and Playwright multi-page support.
- Produces: one repeatable browser audit covering Studio UI, sandbox preview, assets, notes/settings, access/history, and presenter bridge.

- [ ] **Step 1: Write a browser audit with deterministic API fixtures**

Exercise admin list/open, one-box-per-slide rendering, Master/slide edit preview, local validation, successful Save Live version increment, stale 409 text preservation, add/duplicate/reorder/delete, history restore, active-user owner replacement, audience toggle, asset upload processing/available/rejected/insert, note add/edit/delete, shortcut persistence, and key suppression in textareas.

```js
await page.goto(`${dashboardBase}/?tool=webinar-studio`);
await expect(page.locator('.ws-slide-box')).toHaveCount(15);
await page.locator('.ws-slide-box[data-anchor="opening"] textarea[data-field="html"]').fill('<h1>Unsaved change</h1>');
await page.route('**/api/webinars/*/slides/*', route => route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify(conflictFixture) }));
await page.getByRole('button', { name: 'Save Live' }).click();
await expect(page.locator('.ws-slide-box[data-anchor="opening"] textarea[data-field="html"]')).toHaveValue('<h1>Unsaved change</h1>');
```

- [ ] **Step 2: Add two-window security and lifecycle cases**

Launch the audience from the Dashboard presenter, verify navigation/animations/annotations/overlays/calculator/fullscreen acknowledgements, close and reconnect, inject wrong-origin/source/nonce messages, and confirm none changes state. Verify the audience DOM/source contains no private notes, settings, ownership, history, or tokens.

```js
const audiencePromise = context.waitForEvent('page');
await page.getByRole('button', { name: 'Launch audience' }).click();
const audience = await audiencePromise;
await page.getByRole('button', { name: 'Next' }).click();
await expect(audience.locator('[data-slide-count]')).toHaveText('2 / 15');
await audience.evaluate(() => window.postMessage({ v: 1, nonce: 'wrong', type: 'next', payload: {} }, '*'));
await expect(audience.locator('[data-slide-count]')).toHaveText('2 / 15');
expect(await audience.content()).not.toMatch(/speakerNotes|primaryOwnerUserId|x-webinar-key/);
```

- [ ] **Step 3: Run at supported responsive sizes**

```bash
./tests/run-webinar-studio-browser-audit.sh
```

Expected: PASS at 1440×900, 1024×768, 390×844, and 844×390 with zero unexpected console errors, failed requests, horizontal clipping, hidden critical controls, or page-level nested-scroll traps.

- [ ] **Step 4: Run complete package gates and record evidence**

```bash
npm --prefix /Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend test
npm --prefix /Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend run lint
node /Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/build.js
npm --prefix /Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck test
./tests/run-webinar-studio-browser-audit.sh
```

Expected: all unit, lint, build, existing deck, and browser gates pass. Record exact counts, screenshots, commit SHAs, and the fact that nothing was deployed and owner access remained disabled in production.

- [ ] **Step 5: Commit Studio verification**

```bash
git add first-home-without-mystery/deck/tests/webinar-studio-browser.run.js first-home-without-mystery/deck/tests/run-webinar-studio-browser-audit.sh docs/superpowers/validation/2026-09-03-webinar-studio-editor.md
git commit -m "test(webinars): verify private studio workflows"
```

## Package Exit Gate

Before migration/cutover, review that:

- admin-only feature gating works and object-level owner/admin checks remain server-enforced;
- every editor surface preserves unsaved data on validation/API/conflict failure;
- preview and audience use the canonical sandbox path;
- assets, history, owner assignment, audience access, personal notes, and settings work through authenticated APIs;
- bridge attacks and disconnection cases are covered in a real browser;
- the old public presenter and current production deck remain unchanged; and
- neither frontend has been deployed and no production access flag has been changed without separate approval.
