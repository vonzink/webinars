# Editor Task 4 report — canonical preview and one-box-per-slide editor

## Outcome

Implemented the canonical candidate-preview boundary and native slide-source
editor across the isolated Dashboard and Webinars worktrees.

The Dashboard now provides an in-memory, cryptographic-nonce-bound preview
controller. It validates and clones the exact version-1 Master-plus-one-slide
candidate contract, posts only to the configured origin and the exact iframe
`contentWindow`, accepts only exact-source/origin/nonce response envelopes, and
returns bounded pending/ready/error state. Candidate HTML, CSS, and JavaScript
are never evaluated or inserted through an HTML sink in the Dashboard.

The editor renders Master HTML/CSS plus one expandable box for every stable
server slide ID. Each slide includes title, canonical unique anchor, target
duration, shared speaker notes, and accessible HTML/CSS/JavaScript tabs. Native
textareas support two-space Tab insertion. Input updates only in-memory dirty
state and starts a 300 ms preview debounce; Save Live is the only live-code
mutation and remains disabled until local validation and the current preview
startup succeed. Live-version, dirty, preview, and conflict state are explicit.

Add, duplicate, reorder, and delete always submit the current
`expectedVersion`. Add and duplicate append only the committed server-returned
slide object. Delete names the slide, explains History recovery, and refuses to
delete the final active slide. Version conflicts retain unsaved source and the
displayed live version while showing only bounded updater/time/version metadata
and Reload/Copy actions. Network, database, and preview failures retain source
and avoid reflecting raw error text.

The public preview host accepts only its exact parent, the exact production
Dashboard origin, protocol version 1, a validated nonce/type, and the exact
candidate record. It renders through the existing canonical `createSlideFrame`
and composition path, replaces stale frames, ignores stale runtime callbacks,
and exposes only fixed ready/runtime error messages. It has no API, token,
storage, or presenter-control bridge.

No push, deployment, feature-gate change, audience enablement, migration,
database mutation, or production API request was performed. The pre-existing
untracked `webinar-api/` directory was not read, staged, or modified.

## Test-first evidence

Initial RED covered all affected boundaries:

```text
Dashboard preview suite: failed because preview.js did not exist
Dashboard editor suite: failed because editor.js did not exist
Dashboard mutation contract: failed because addResult.slide was undefined
Dashboard transport metadata: 2 failed because 409 metadata was discarded
Webinars preview-host suite: failed because preview-host.js did not exist
```

Additional RED/GREEN regressions caught during implementation:

```text
editor teardown: 1 failed until delegated listeners were removed
dirty/live badges: 1 failed until active fields updated status in place
full deck: 1 failed when a second live region was introduced; removed
real browser smoke: timed out before the host listener was registered
production origin contract: 1 failed until localhost origins were removed
```

The browser timeout root cause was a top-level-await dynamic import in
`studio-viewer.html`: Chromium could fire the iframe `load` event before the
asynchronous module finished and called `initPreviewHost`, allowing the
Dashboard's one-shot candidate to arrive too early. A source regression now
requires static module imports and forbids `await import()` in this entry. With
static imports the listener is registered before iframe load completes.

Final focused GREEN:

```text
Dashboard preview/editor/API/mutation/route suites: 214 passed, 0 failed
Webinars preview-host suite: 4 passed, 0 failed
```

## Authorized narrow transport and response-contract extension

Task 2 identified that add/duplicate did not return a server-created stable
slide. The mutation transaction now returns the exact privacy-safe slide object
captured from the validated candidate and exposes it only after the transaction
commits. The implementation performs no follow-up list request and does not
infer or manufacture an ID in the client.

With root authorization, `js/api-server.js` received the smallest transport
extension needed for conflict-safe Studio behavior. Existing Error message
behavior remains intact. Only bounded own metadata is copied: HTTP status,
validated server code, positive `currentVersion`, bounded `updatedAt`, and an
exact `updatedBy` object containing only `{id,name}`. Raw response data,
headers, bodies, source, tokens, secrets, email, and arbitrary fields are not
attached. Tests cover the normal 409 response and exclusion of malformed,
oversized, secret, and extra fields.

## Browser verification

A clean Playwright smoke used separate local origins for the Dashboard parent
and public preview viewer. The local origin was injected only into the test
host instance; the checked-in viewer continues to trust only
`https://dashboard.msfgco.com`.

```text
controller state: pending -> ready
frame tree: parent -> studio viewer -> canonical about:blank slide sandbox
rendered text: Canonical preview ready
browser console: 0 errors, 0 warnings
```

## Final verification

```text
Dashboard focused Task 4 suites: 214 passed, 0 failed
TZ=UTC full Dashboard: 1,387 passed, 2 accepted Calendar failures, 1,389 total
full Webinars deck: 113 passed, 0 failed
Dashboard build: passed; 75 hashed assets, editor.js and preview.js in manifest
changed JavaScript syntax checks: passed
changed-file diff checks: passed
candidate execution/innerHTML/storage/token scans: no matches
targeted backend lint: 0 errors, 2 pre-existing unused-argument warnings
repository Dashboard lint: unchanged baseline, 12 errors and 55 warnings
```

The accepted full-Dashboard failures remain the unrelated Calendar baseline:

```text
calendar sync health and privacy labels > renders sync health indicators for synced calendar filter chips
calendar side panels > renders bulk controls only for eligible synced Outlook entries
```

Production entry hashes remain unchanged:

```text
b51288fee7f6c9c7efe655ed4144b8e868d5328a0565290ed94df33e70ad8148  first-home-without-mystery/deck/index.html
f9994c8b3bb1f361ca9182006b729cabd13c42728fd90485ffd5bdf2b8b2fd42  first-home-without-mystery/deck/presenter.html
```

## Commits

Dashboard:

```text
def121ef61d6b2c959460e2a8e3658f31329f4b5
feat(webinars): edit and preview live slide source
```

Webinars source, tests, and this report are committed separately in the
Webinars repository; its exact commit is recorded in the task handoff.

## Residual follow-up

- Task 4 intentionally does not wire editor/preview modules into the Task 3
  coordinator; later package tasks integrate the focused modules with assets,
  access/history, presenter, and bridge surfaces.
- The production preview URL/origin must be supplied by that coordinator. The
  controller fails closed on a missing, malformed, or mismatched origin.
- The feature remains unavailable until separately approved frontend
  publication and feature-gate enablement.
