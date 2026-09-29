# Editor Task 8 report — exact two-window presenter/audience bridge

## Outcome

The presenter in the Dashboard can drive a separately opened audience window
on the mortgage site through a fixed, versioned, nonce-bound message contract.
Two commits, one per repository, reviewed separately:

| Repository | Commit | Purpose |
| --- | --- | --- |
| Dashboard `codex/webinar-studio-complete` | `7001dbf` | `js/webinar-studio/bridge.js`: `createAudienceBridge` with `connect`, `reconnect`, `sendControl`, `status`, `destroy` |
| Webinars `codex/webinar-studio` | `83b532f` | `control-protocol.js`, `presenter-bridge.js`, audience-controller state publishing and commands, viewer wiring |

Nothing was pushed to a production branch, deployed, migrated, or
flag-changed. The coordinator does not consume the bridge yet; that is Task 9.

## Contract (protocol version 1)

Envelope: `{ v: 1, nonce, type, payload }`. The presenter opens one named
window (`MSFGWebinarAudience`) at the audience URL on the configured origin and
keeps that exact window reference. It posts `presenter-init` with a fresh
in-memory nonce until the audience answers `audience-ready`, retrying every
500 ms up to 40 times. From then on every control carries that nonce.

Controls (presenter to audience): `goto{index}`, `next`, `previous`,
`animation-back`, `animation-forward`, `animation-play`, `animation-pause`,
`annotation-command{on|tool|color|autoOff|toolbar|undo|redo|clear}`,
`supported-overlay-state{id,visible}`, `supported-calculator-state{id,visible}`,
`fullscreen-request{on}`, `nav-visibility{hidden}`, `ping`.

Acknowledgements (audience to presenter): `audience-ready{index,total}`,
`slide-state{index,total}`, `animation-state{current,total,playing}`,
`annotation-state{on}`, `supported-overlay-state{id,visible}`,
`supported-calculator-state{id,visible}`, `fullscreen-state{on}`,
`nav-state{hidden}`, `pong`, `audience-error{code}`.

Both sides validate structurally: plain data objects only, exact key sets,
bounded integers, fixed enumerations, and a nonce pattern. Rejections are
reported to observers by reason (`SOURCE_OR_ORIGIN`, `INVALID_MESSAGE`,
`WRONG_VERSION`, `WRONG_NONCE`, `UNKNOWN_TYPE`, `INVALID_PAYLOAD`,
`NOT_INITIALIZED`) and never change state.

Trust boundaries:

- The audience accepts a message only when `event.source` is exactly
  `window.opener` and `event.origin` is one of the configured Dashboard
  origins; the viewer page configures `https://dashboard.msfgco.com` only.
- The presenter accepts a message only when `event.source` is exactly the
  window it opened and `event.origin` is the configured audience origin.
- Every post names the exact target origin; nothing is posted to `*`.
- The audience returns scalars only; slide source never crosses the boundary.
- Heartbeat: the presenter pings every 5 s; three missed pongs, or a closed
  window, mark the link disconnected until an explicit reconnect, which
  reopens the window if needed and starts a fresh nonce.
- Neither side reads storage, tokens, or anything beyond the audience
  controller's public surface.

## Verification evidence

Dashboard:

| Gate | Result |
| --- | --- |
| `webinarStudioBridge.test.js` | 9 passed |
| Studio suites | 150 passed across 9 files |
| `TZ=UTC npm test` | 1,490 passed, 2 failed: only the accepted `calendarSyncUi.test.js` pair |
| `node ../build.js`, ESLint on the bridge test, `node --check`, `git diff --check` | clean |
| Source scan of `bridge.js` for storage, `innerHTML`, `eval` | no matches |

Webinars deck (`first-home-without-mystery/deck`):

| Gate | Result |
| --- | --- |
| `studio-control-protocol.test.mjs` | 5 passed |
| `studio-presenter-bridge.test.mjs` | 7 passed, including the viewer-page wiring pin |
| `studio-audience-controller.test.mjs` | 14 passed |
| `npm test` (full deck suite) | 126 passed |
| Source scan of `js/studio` for `x-webinar-key`, `Authorization`, `cognito`, storage | no matches |
| `git diff --check`, `node --check` on the three modules | clean |
| Production `index.html` and `presenter.html` | untouched |

The audience page's restricted-surface test now judges the markup the
audience sees and pins the page's imports to the three audience-side modules,
because the bridge module's name contains "presenter" while carrying no
presenter UI.

## Real-browser verification

`task-8-browser/` holds a two-window Chromium harness: the real
`studio-viewer.html`, audience controller, and slide runtime served on one
local origin (with the Dashboard origin rewritten to the local presenter
origin so the exact-origin check can pass locally), and a presenter page
loading the real `bridge.js` on a second local origin. The live bundle is the
deck's renderer fixture, fulfilled by Playwright at the production API URL.

`studio-bridge.run.mjs`: 38 of 38 checks after the review follow-ups below
(29 of 29 at the time of the first review).

- `connect()` opens the named window; presenter-init and audience-ready
  complete a real cross-origin handshake; `audience-ready` carries the real
  slide count.
- `next`, `goto`, and `previous` move the real viewer (hash and counter) and
  come back as `slide-state`; `nav-visibility` hides and restores the dock
  with `nav-state`; annotation and animation controls round-trip;
  `audience-error` flows for the fixture's error slides.
- Malformed or unknown controls are refused before posting.
- Heartbeat pings keep the link connected across several intervals; every
  message reaching the presenter window came from the audience origin; the
  presenter ignored nothing during a clean session; no acknowledgement
  carried slide source; acknowledgement types stayed within the fixed set.
- A same-origin stranger that is not `window.opener` cannot re-initialize or
  drive the audience; wrong-nonce, wrong-version, and non-object controls
  from the real opener are ignored; a forged acknowledgement to the
  presenter is dropped as `SOURCE_OR_ORIGIN`.
- Closing the audience window disconnects within the heartbeat budget;
  `reconnect()` reopens it and completes a fresh handshake under a new nonce;
  `destroy()` stops further controls and connects.
- Added after review: the pen is really turned on and off through
  `annotation-command` (the audience toggle reports pressed);
  `animation-forward` advances the real slide animation and returns
  `animation-state`; `fullscreen-request` is either honoured or reported as
  `FULLSCREEN_DENIED`; a click inside the audience window is acknowledged as
  `slide-state`; a third window on the audience origin (right origin, wrong
  source) forging acknowledgements to its opener is dropped as
  `SOURCE_OR_ORIGIN`; an opener on a non-Dashboard origin cannot initialize
  or drive an audience it opened itself; an audience window navigated to a
  foreign page is detected as disconnected and `reconnect()` re-navigates the
  same named window back to the audience page under a fresh nonce.
- No page errors in either window; no requests left the two local origins
  apart from the fixture's own containment probe.

Still not covered in a browser: a blocked popup, a Dashboard tab reload while
the named audience window stays open, production timings (the harness shortens
the heartbeat), and the production `https` origins themselves (the harness
rewrites them to local `http` origins; the unit tests pin the production
values).

## Independent review, Dashboard: APPROVE

A fresh reviewer examined `7001dbf` against the audience-side protocol. The
schema was found semantically identical to `control-protocol.js`; exact-origin
posting, exact-window and nonce acceptance, fresh nonces per launch, observer
isolation, message ordering (`connected` before `audience-ready` reaches
`onState`), heartbeat and retry timings, and the absence of storage, tokens,
`innerHTML`, and `eval` were all confirmed. Two should-fix findings:

1. An open but foreign audience window (reloaded, navigated away, error page)
   was unrecoverable: `reconnect()` only reopened a closed window, so it
   posted `presenter-init` into the wrong page for 40 retries. Initialization
   also kept retrying against a window that had closed.
2. `sendControl` returned `true` to a window that had already closed, so the
   presenter advanced its local state believing delivery succeeded.

Nits: `connect()` could throw when no nonce source exists; a blocked popup
reported `idle` twice; a late `audience-ready` after the retry budget was
dropped silently; the tests did not pin the enumerations, bounds, nonce
pattern, or data-only record rule they claimed to share with the audience.

### Dashboard follow-up (`db807d1`)

Each finding got a failing test first. `reconnect()` reopened the fixed
window name, which re-navigates any page in that window back to the audience
URL (the final package review later showed this binds to the outgoing
document when the page is merely reloaded; Dashboard `7ea9d79` handshakes in
place first and re-navigates only after the in-place attempts lapse);
`scheduleInit` disconnects as soon as the window closes; `sendControl`
refuses and disconnects on a closed window; a missing nonce source leaves the
bridge idle and returns `false`; a blocked popup is reported once; a late
`audience-ready` for the current launch is accepted because its nonce is
bound to that launch. New tests pin tool and color enumerations, index and
animation bounds, the nonce pattern, accessor, prototype-key, class-instance,
symbol-key, and extra-key rejection, observer exceptions, reconnect while
connected, and duplicate ready handling. Bridge suite: 18 passed.

## Independent review, Webinars: APPROVE

A fresh reviewer examined `83b532f`. The trust boundary (opener identity plus
exact origin plus nonce, scalar-only acknowledgements to the init origin) was
confirmed, along with the unchanged inner slide sandbox, the untouched
production deck files, the clean storage and token scan, and the exact
agreement of the two protocol definitions. Three should-fix findings:

1. Supported overlay and calculator control could not round-trip
   deterministically: the runtime channel is id-only, the shell treated each
   report as a visibility flip, and the presenter's requested visibility was
   discarded, so a hide request could open a surface.
2. `setNavigationHidden` acknowledged `hidden: true` when the page had no
   dock to hide, and the unit harness pinned that misreport.
3. The annotation test asserted the pen stayed off after asking for on,
   because the fake annotation API lacked the command methods.

Nits: a refused fullscreen request surfaced only as a `fullscreen-state`
flip; the import pin missed `src` scripts and dynamic imports; `toolbar` is a
silent no-op on the audience page; the 20 s connect budget can lapse on a
slow bundle load (reconnect recovers; noted for the runbook).

### Webinars follow-up (`c0d8a61`)

Each finding got a failing test first. `sendSupportedState(kind, id, visible)`
requires the wanted visibility and is a no-op when the shell's inferred
visibility already matches, with the runtime contract documented at the
report handler; `setNavigationHidden` returns `false` without a dock and the
harness now carries one; a refused fullscreen request emits
`audience-error { code: 'FULLSCREEN_DENIED' }`; the annotation fake records
`enable`, `setTool`, and `setColor` and the test asserts them; the page test
pins one inline script with no `src` and no dynamic import; the `toolbar`
no-op is noted in the protocol. Deck suite: 129 passed.
