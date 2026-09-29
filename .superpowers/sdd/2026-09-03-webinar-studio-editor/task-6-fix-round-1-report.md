# Editor Task 6 Fix Round 1 report — asset insertion target

## Outcome

The rejected end-to-end defect is fixed and proven at three levels: editor unit,
coordinator lifecycle, and real Chromium through the actual Studio UI path.

Rejected defect: after a user focuses a Code textarea and opens Assets,
`document.activeElement` is the Assets tab, so **Insert at cursor** had no
editor target, and the unit test hid this with a detached textarea.

The fix (Dashboard `4a0d466`, committed from the previously uncommitted five-file
diff without changes) makes the editor own a logical insertion bookmark keyed by
webinar ID, coordinator context generation, Master or slide surface, stable
slide ID, field, and selection range. The bookmark is captured on focus,
selection, key-up, mouse-up, input, and Tab inside Code textareas only.
Insertion re-reads the current value from Studio state at insert time, writes
through the normal editor update path, so the surface becomes dirty and the
300 ms preview debounce fires, and the caret and focus are restored when the
Code panel re-renders. The Assets button reads `Choose a Code field` and is
disabled when no valid target exists. The coordinator invalidates the bookmark
on webinar selection, live-version reload, archive refresh, new-webinar flow,
close, and destroy, and the editor drops it when its slide is deleted.

Task 6 is complete pending the independent re-review recorded below.

## Commits

Dashboard `codex/webinar-studio-complete`:

| Commit | Purpose |
| --- | --- |
| `d9cbc73` | Base Task 6 asset library UI (previously reviewed, rejected on insertion) |
| `4a0d466` | The five-file insertion fix, committed verbatim from the handoff's uncommitted diff |
| `e08dd59` | Coordinator lifecycle tests proving bookmarks never insert into the wrong deck, slide, surface, or a detached editor |
| review round 2 (see below) | Preview built from the published module, Tab guard, loading withdrawal, collapsed-box restore, legacy path removal |

Nothing was pushed to a production branch, deployed, migrated, or
flag-changed.

## Coordinator lifecycle coverage added

`backend/tests/frontend/webinarStudioAssets.test.js` now drives the real
coordinator, editor, and asset library together through the fake DOM:

- focus Code, open Assets (focus lands on the tab), insert, return: exact token,
  caret after the token, focus restored, `Unsaved`, 300 ms preview scheduled;
- Master CSS target through the same path, slide HTML untouched;
- a target captured in webinar 12 cannot insert after selecting webinar 13:
  the held target object returns `false`, the button is disabled, clicking it
  shows guidance, and webinar 13's source and dirty state are unchanged;
- reloading the live version invalidates the target, and choosing a field again
  restores insertion into the correct slide only;
- deleting the bookmarked slide disables insertion, while a bookmark on a
  different slide survives the deletion and inserts exactly there;
- closing and reopening the Studio clears the target and a held target returns
  `false`;
- destroying the Studio detaches every target and schedules nothing.

The fake element gained `hasAttribute` so editor action buttons work through
the coordinator.

## Verification evidence

Run on the Dashboard worktree at `e08dd59`, Node 22, `TZ=UTC` for the full suite.

| Gate | Result |
| --- | --- |
| `npx vitest run tests/frontend/webinarStudio*.test.js` | 95 passed, 0 failed (7 files) |
| `webinarStudioAssets.test.js` | 19 passed |
| `webinarStudioEditor.test.js` | 16 passed |
| `TZ=UTC npm test` | 1,435 passed, 2 failed: only the two accepted `calendarSyncUi.test.js` baseline failures |
| `node ../build.js` | 77 hashed assets, 23 HTML files rewritten |
| `npx eslint` on the two changed test files | clean |
| `node --check` on `webinar-studio.js`, `assets.js`, `editor.js` | clean |
| `git diff --check` | clean |
| Disclosure scan for `x-webinar-key`, `Authorization`, `cognito`, `localStorage`, `sessionStorage`, HTML sinks in `js/webinar-studio*` | no matches |

ESLint's flat config lives in `backend/` and does not cover the root `js/`
tree, so the three production files were syntax-checked with `node --check`
instead. That is the pre-existing repository layout, not a change here.

## Real-browser verification

Chromium via Playwright at 1440×900 and 390×844 against a harness that runs the
real `api.js`, `state.js`, `access-history.js`, `assets.js`, `editor.js`, and
`webinar-studio.js` with the real `#webinarStudioModal` markup and
`css/webinar-studio.css`. The harness stubs exactly three things, all in
`task-6-fix-round-1-browser/harness-tail.html`: `CONFIG.currentUser` (admin),
`ServerAPI` (deterministic fixtures for list, get, assets, users, archive
slide), and a recording preview object with `boot` and `destroy`. The Studio is
opened with `WebinarStudio.open()`, which is what the Tools action dispatches.

26 of 26 checks passed:

1. Slide HTML: click into the textarea, select characters 16–21, open Assets.
   `document.activeElement` is the Assets tab. Insert is enabled. After Insert
   and returning to Code the value is `<section>before {{ASSET:…}}</section>`,
   the caret is at 16 plus the token length with the textarea focused, the box
   shows `Unsaved`, and exactly one preview boot carried the token about 330 ms
   after the click. Status reads `Slide preview is ready.`
2. Master CSS via mouse selection: token replaces `gap`, slide HTML untouched.
3. No target: Insert is disabled, labelled `Choose a Code field`, its title
   explains the fix, a forced click inserts nothing.
4. Switch webinar after choosing a field: Insert is disabled and the new
   webinar's source is unchanged.
5. Delete the bookmarked slide (native confirm accepted): Insert is disabled.
6. 390×844: choose a field, insert at caret 0, token lands at position 0.

Zero page errors or console errors across all scenarios. Two harness-only
resource failures are excluded by name: the favicon the harness does not ship,
and the fixture thumbnail at `assets.example`, which the sandbox cannot reach.

Reproduce: `task-6-fix-round-1-browser/build-harness.sh` then
`node task-6-fix-round-1-browser/studio-insert.run.mjs`.

## Independent re-review, round 1: REJECT

A fresh read-only reviewer examined `d9cbc73..e08dd59` against the original
rejection. It confirmed the logical-bookmark design resolves the
`activeElement` defect and that every invalidation path holds, then rejected
the round on one blocker and three should-fix findings:

1. **Blocker.** The coordinator read `root.WebinarStudioEditorPreview`, a
   global no module defines, and required `.boot`. `preview.js` publishes
   `root.WebinarStudioPreview` exposing only `createPreviewController`, so in a
   real page the editor was never constructed and the fix worked only under the
   test stub.
2. Two-space Tab insertion intercepted every textarea under the shared
   settings panel, trapping Tab in the asset description and edit fields.
3. While another webinar loaded, the previous webinar's editor stayed
   rendered, so a ready Save Live could still publish to the deck being left.
4. Focus restore after insertion was a no-op when the bookmarked slide's box
   was collapsed.

Plus nits: an unreachable direct-textarea insert path kept alive by the old
detached-textarea test, and the editor's context lagging after a failed reload.

## Round 2 fixes

Each finding got a failing test before the change:

- `webinar-studio.js` builds the canonical preview controller from
  `WebinarStudioPreview.createPreviewController` using
  `CONFIG.webinarStudio.preview` (`url`, `origin`). It creates one
  `sandbox="allow-scripts"` iframe inside `#wsPreviewHost`, refuses a URL whose
  origin is not exactly the configured origin, and shows "The slide preview
  host is not configured for this environment" on the Code tab when no
  configuration exists. An explicit `editorPreview` controller dependency still
  wins, which is what the fake-DOM harnesses use.
- `editor.js` intercepts Tab only when the target is a Code textarea.
- `renderSettings` treats a loading webinar as no selection: placeholder copy,
  controllers deactivated, launch buttons disabled.
- `renderSlide` opens a box whose slide is the pending insertion restore.
- `assets.js` accepts only logical `insertText` targets; the `setRangeText`
  branch and its detached-textarea test are gone.
- `invalidateEditorContext` also pushes the new generation into the editor.
- `index.html` loads `access-history.js`, `assets.js`, `preview.js`, and
  `editor.js` before the coordinator, wraps workspace copy in
  `#wsWorkspaceContent`, and adds `#wsPreviewHost`; `css/webinar-studio.css`
  sizes the preview frame.

Round 2 evidence on the Dashboard worktree at the round 2 commit:

| Gate | Result |
| --- | --- |
| Studio suites (excluding the in-progress Task 7 presenter suite) | 102 passed, 0 failed |
| `TZ=UTC npm test` excluding the Task 7 suite | 1,442 passed, 2 failed: only the accepted `calendarSyncUi.test.js` pair |
| `node ../build.js` | clean |
| ESLint on the three changed test files, `node --check` on the three production files, `git diff --check` | clean |
| Chromium harness | 27 of 27, now including: the coordinator built exactly one preview controller with `allowedOrigin` `https://msfgmortgage.com`, a `sandbox="allow-scripts"` iframe that was attached to the document, and a `src` on the configured origin |

The harness now uses a recording `WebinarStudioPreview.createPreviewController`
and a `CONFIG.webinarStudio.preview` fixture, so the real factory path runs.
The iframe's own request for the configured preview host is excluded from the
error check because the host is not deployed and not reachable from the
sandbox; reachability is verified in Task 9.

## Still deferred to Task 9

- `CONFIG.webinarStudio.preview` is not yet set in `js/config.js`; production
  values are supplied there without adding localhost to the allow-list.
- The editor renders inside the narrow settings column while the workspace
  shows the preview frame under placeholder copy. Final layout is Task 9.

## Independent re-review, round 2: REJECT

A fresh reviewer examined `d9cbc73..eceb9be`. It confirmed round-1 findings
2, 4, 5, and 7 resolved and 3 resolved for loading, then rejected on:

1. **Blocker.** The outer preview iframe carried `sandbox="allow-scripts"`,
   which gives it an opaque origin. `postMessage` to the configured origin is
   silently dropped and any reply arrives with origin `null`, so the preview
   handshake could never complete and Save Live stayed disabled. The
   "exactly `allow-scripts`" constraint belongs to the inner slide frame the
   renderer creates, not to the trusted host page.
2. **Blocker.** The preview-host stylesheet rules had been spliced into an
   existing four-selector rule, stripping `display: flex` from the Studio
   header, deck heading, and launch actions.
3. **Blocker.** No `CONFIG.webinarStudio.preview` existed, so production still
   never built the editor; it only said so.
4. The preview frame was created on every Dashboard load before any access
   check, and the host box showed in every workspace state.
5. Editor preview readiness, tab choice, and errors were not reset across
   webinars, so a ready Save Live from one deck could enable on another.
6. The frame kept showing the previous webinar's last candidate.
7. The preview wiring test mocked the factory and its final assertion was
   vacuous.

Plus nits: leftover iframe when the factory throws, a misleading "not
configured" message for invalid configuration, `http://localhost` rejected
for local development, no frame removal on destroy, stale workspace copy, and
the new-webinar form not withdrawing the previous editor.

## Round 3 fixes (Dashboard `30b69ce`)

Each finding got a failing test first.

- The outer frame is un-sandboxed, with `referrerpolicy="no-referrer"`. A
  comment in the coordinator and the shell test explain why.
- `js/config.js` carries `webinarStudio.preview` with the production URL and
  origin only; a shell test parses it and asserts the URL sits on that HTTPS
  origin with no localhost.
- The stylesheet group is restored, the preview rules stand alone, a test pins
  the flex group, and `index.html` bumps the stylesheet cache key.
- The preview controller, editor, and presenter are built once in `open()`
  after access succeeds. `init()` creates nothing. The host is hidden until
  the current webinar reports a ready preview, and while loading, creating,
  or switching. Invalid configuration reports as invalid. The frame is removed
  if the factory throws and on destroy. The origin rule matches `preview.js`.
- `editor.js` clears preview states, active tabs, the debounce timer, and the
  error when the webinar id changes.
- Creating a webinar withdraws the editor and launch buttons like loading.
- The wiring test asserts the Code tab is not the fallback copy and that the
  panel received a rendered fragment; a second case runs the real
  `preview.js` factory through the coordinator's arguments.
- Workspace copy now describes the live preview.

Round 3 evidence:

| Gate | Result |
| --- | --- |
| Studio suites | 123 passed across 8 files |
| `TZ=UTC npm test` | 1,463 passed, 2 failed: only the accepted `calendarSyncUi.test.js` pair |
| `node ../build.js`, ESLint on changed tests, `node --check`, `git diff --check` | clean |
| Chromium insertion harness | 27 of 27; the factory received an attached host frame with no `sandbox` attribute on the configured origin |
| Chromium presenter harness | 32 of 32, now including a check that the Studio header is a flex row with the close button on the right |

The harness stubs the preview factory, so the real cross-origin handshake is
still unverified until the preview host is deployed; Task 9 covers that.

## Independent re-review, round 3: REJECT

A fresh reviewer examined `d9cbc73..30b69ce`. It confirmed all three round-2
blockers genuinely fixed, the security constraints intact (no `innerHTML`,
`srcdoc`, or `eval` in the Studio modules, candidate HTML never enters the
Dashboard document, only `{{ASSET:<uuid>}}` is inserted, no tokens or web
storage, Save Live still the only publish path), then rejected on:

1. **Should-fix.** A `ready` reply from the old deck was attributed to the
   new deck: `onState` stamped `previewReadyFor` with whatever deck was
   selected when the message arrived, so a reply answered during the next
   deck's fetch showed the previous deck's slide under the new workspace.
2. **Should-fix.** Settings-tab clicks bypassed the loading, creating, and
   no-selection guards: the Presenter tab could attach key handlers and boot
   the old deck mid-switch, the Code tab could resurrect the previous editor
   with Save Live enabled while the Create form was open, and an empty or
   errored state threw from the click handler.
3. **Should-fix.** The first boot raced the host frame's own load: the
   candidate was posted while the frame was still `about:blank`, producing a
   10 s startup timeout, and the presenter pinned the failed up-next slide so
   it never retried.
4. Nit: `invalidateEditorContext()` on switch passed the old webinar id.
5. Nit: a destroyed injected preview was re-adopted on the next `open()`.
6. Nit: concurrent `open()` calls both fetch the first webinar (pre-existing).
7. Nit: `previewOrigin` duplicates `preview.js`'s `exactOrigin`.
8. Nit: the hide/show test never fired `ready` during a switch.

## Round 4 fixes (Dashboard `c6a1e7a`)

Each finding got a failing test first.

- `bindPreview()` wraps every controller the editor and presenter receive.
  Each boot records the deck selected when it started and marks the host
  ready only if that same deck is still selected when the reply arrives.
  `onState` no longer touches readiness. A test fires `ready` while the next
  deck's fetch is pending and asserts the host stays hidden after it loads.
- `activateSettingsTab` goes through `renderSettings()`, and
  `renderSettingsTab` withdraws to the loading, creating, or select-a-webinar
  copy via `settingsSelectionWithdrawn()` before touching `studioState`.
  Tests click each tab while a fetch is pending and assert no controller
  render, and click with no selection and assert no throw.
- The first boot awaits a one-shot frame `load` gate. The gate is bounded at
  10 s so a host that never loads falls through to the preview controller's
  own `PREVIEW_STARTUP_TIMEOUT` instead of hanging the editor and presenter
  forever. A late `load` after the gate opened cannot boot twice. Tests cover
  the wait, the timeout, and the timer clear.
- The presenter clears `previewedSlideId` on a non-ready result so the next
  render retries.
- `invalidateEditorContext({ switching: true })` passes a null webinar id.
- A destroyed injected preview is not re-adopted after `destroy()`.
- Nits 6 and 7 are left as-is: the double fetch is pre-existing and harmless,
  and the origin rule is pinned by test to match `preview.js`.

Round 4 evidence:

| Gate | Result |
| --- | --- |
| Studio suites | 97 passed across the shell, assets, editor, presenter, and bridge files (bridge is Task 8 work, uncommitted) |
| `TZ=UTC npm test` | 1,486 passed, 2 failed: only the accepted `calendarSyncUi.test.js` pair |
| `node ../build.js`, ESLint on changed tests, `node --check`, `git diff --check` | clean |
| Chromium insertion harness | 27 of 27 |
| Chromium presenter harness | 32 of 32; the driver now waits for the deferred first boot because the coordinator posts only after the frame's load gate |

## Independent re-review, round 4: APPROVE

A fresh reviewer examined `d9cbc73..c6a1e7a`. Every round-3 finding is
confirmed resolved with tests that exercise the actual race, the bounded load
gate is double-resolve-safe and cannot re-boot or post after `destroy()` or a
late `load`, and the security constraints hold (static or escaped `innerHTML`
only, no `srcdoc`/`eval`, un-sandboxed exact-origin host frame, Save Live the
only publish path, client role gates UI only, no web storage). Studio suites:
137 tests across 8 files, all passing. Four nits were noted:

1. Readiness is bound to a deck id, not a selection generation, so a
   same-deck round-trip (A, discard, B, back to A) can surface a candidate of
   the discarded edits in the host while Save Live correctly stays disabled.
2. The load-gate timer is not cancellable and outlives `destroy()`; harmless,
   and the worst case for a dead host is the gate's 10 s plus the
   controller's 10 s in sequence.
3. Unpinning on every non-ready result re-boots a deterministically broken
   slide on every presenter render; unpin only for transient failures.
4. A `load` fired for the initial `about:blank` would reopen the race;
   ignore a load whose same-origin document is still `about:blank`.

## Round 4 nit follow-up (Dashboard `2fa4117`)

All four nits were taken, each with a failing test first: readiness is bound
to a selection generation that advances on every select, refresh, and
new-webinar flow; the load gate returns a cancel that `destroy()` and the
factory-throw path call; a `load` whose same-origin document is still
`about:blank` is ignored; and the presenter pins slide-content failure codes
(`PREVIEW_CANDIDATE_INVALID`, `PREVIEW_COMPOSITION_FAILED`,
`SLIDE_RUNTIME_ERROR`, `SLIDE_STARTUP_TIMEOUT`) until the up-next slide
changes while still retrying transient ones. Gates: Studio suites 150 passed
across 9 files (including the Task 8 bridge file), full suite 1,490 passed
with only the two accepted Calendar failures, build, ESLint, `node --check`,
and `git diff --check` clean, Chromium insertion 27 of 27 and presenter 32 of
32. This commit is covered by the final package review.
