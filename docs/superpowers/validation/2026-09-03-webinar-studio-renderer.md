# Webinar Studio renderer validation

Validated locally on 2026-09-04 from the isolated Webinars worktree at the
pre-Task-6 commit `294ae67`. This record covers the parallel
`studio-viewer.html` renderer only. It does not record a push, deployment,
audience cutover, production API check, or production infrastructure change.

## Repeatable gates

The complete deck Node suite was started cleanly twice:

```text
npm test
tests 108
pass 108
fail 0

npm test
tests 108
pass 108
fail 0
```

The focused Chromium audit was also started cleanly twice after GREEN:

```text
./tests/run-studio-renderer-browser-audit.sh
status pass
fixture slides 4
viewports 5
bundle requests 2 (initial load and explicit reload)
runtime telemetry posts 2 (one per failing slide/code)
expected browser policy denials observed and classified
unexpected console warnings/errors 0
unexpected network requests 0
unexpected failed resources 0
unexpected page errors 0
```

Both browser runs returned the same counts and viewport geometry. Each run
used a newly allocated loopback port, a new Playwright session, a local static
fixture server, and route interception for every request. It made no external
network dependency available to authored slide code.

## Browser evidence

The fixture contains a normal animated slide, an aggressive containment
slide, a synchronous failure slide, and an asynchronous rejection slide. The
audit verified:

- exactly `sandbox="allow-scripts"`, no `allow` grant, an opaque iframe origin,
  one composed slide mount, and the reviewed restrictive CSP directives;
- parent DOM isolation, blocked top navigation, popup and form restrictions,
  storage/cookie/IndexedDB denial, worker/service-worker denial, and CSP denial
  for fetch, XHR, WebSocket, EventSource, sendBeacon, external script, style,
  image, audio, video, iframe, and font probes;
- rejection of same-frame wrong-nonce and unknown messages plus a correctly
  shaped message sent from the wrong window;
- mouse and keyboard slide navigation, Home/End, deep-link startup, browser
  hash history, animation back/forward/play/pause, fullscreen rejection, and
  reduced-motion behavior;
- one pinned bundle request during an open session, no hidden refresh after
  the intercepted server advances from live version 8 to 9, and exactly one
  new bundle request/load of version 9 after a full reload;
- a fixed `Slide unavailable` audience state after both sync and async runtime
  failures, still-usable outer navigation, and one deduplicated telemetry event
  per slide/code containing exactly `liveVersion`, `slideId`, and `code`;
- no source, stack, private data, cookie, authorization header, authenticated
  editor surface, or presenter surface crossing the public boundary.

The deliberate external download probe is special: Chromium exposes that
planned request to Playwright before completing its sandbox denial. The audit
recognizes only that exact hostile fixture URL and replaces it with an empty
local no-content response; all other external requests remain failures.
Browser history intentionally reconstructs
the containment slide, so raw probe events are scheduling-dependent; the audit
reports the one unique allowed hostile URL and contains every occurrence. This
proves shell containment and repeatable offline auditing, but production egress controls
remain a deployment review item rather than a claim of this package.

## Responsive matrix

| Viewport | Fitted iframe stage | Result |
| --- | ---: | --- |
| 1920×1080 | 1799.11×1012.00 | pass |
| 1366×768 | 1244.44×700.00 | pass |
| 1024×768 | 1024.00×576.00 | pass |
| 390×844 | 390.00×219.38 | pass |
| 844×390 | 590.22×332.00 | pass |

At every viewport the audit found zero outer horizontal overflow, no document
scrollbar, intentionally hidden fitted-surface overflow, a fully contained
16:9 iframe, visible animation and navigation controls, in-viewport hit
targets, a visible focus ring, and correct `1 / 4` progress state.

Screenshots are local-only ignored artifacts:

```text
/Users/zacharyzink/MSFG/Webinars/.worktrees/webinar-studio/first-home-without-mystery/deck/output/playwright/studio-renderer/1920x1080.png
/Users/zacharyzink/MSFG/Webinars/.worktrees/webinar-studio/first-home-without-mystery/deck/output/playwright/studio-renderer/1366x768.png
/Users/zacharyzink/MSFG/Webinars/.worktrees/webinar-studio/first-home-without-mystery/deck/output/playwright/studio-renderer/1024x768.png
/Users/zacharyzink/MSFG/Webinars/.worktrees/webinar-studio/first-home-without-mystery/deck/output/playwright/studio-renderer/390x844.png
/Users/zacharyzink/MSFG/Webinars/.worktrees/webinar-studio/first-home-without-mystery/deck/output/playwright/studio-renderer/844x390.png
```

## Source integrity

Production entrypoint hashes still equal the source-checkpoint baseline:

```text
b51288fee7f6c9c7efe655ed4144b8e868d5328a0565290ed94df33e70ad8148  first-home-without-mystery/deck/index.html
f9994c8b3bb1f361ca9182006b729cabd13c42728fd90485ffd5bdf2b8b2fd42  first-home-without-mystery/deck/presenter.html
```

Task 6 source hashes before commit:

```text
41ee4ca1f9802e4e6f4c6df168692a16365b6dd7c404541e65c07777813c2c3a  first-home-without-mystery/deck/tests/studio-renderer-browser.run.js
41d566f59a43eb6735e3b03a99f700cd73d7785f77944d5c7f618c8f7316c40c  first-home-without-mystery/deck/tests/run-studio-renderer-browser-audit.sh
d40a2480ed79542a7916fcb160b408807871aa5d8e7edd05536886c81c030790  first-home-without-mystery/deck/tests/fixtures/studio-live-bundle.json
```

`bash -n`, `node --check`, `jq empty`, `git diff --check`, the ignored-output
check, and the public credential/private-data scan all passed. The unrelated
pre-existing untracked `webinar-api/` directory was not read into, modified,
staged, or committed by Task 6.

## Review fix — exact audit allow-lists

The browser harness accepts only the exact bodyless request signature:

```text
GET https://evil.example/download
```

Every other external method, path, query string, or body is appended to the
unexpected-request evidence and aborted. The same exact matcher is used for
failed-resource handling; other expected CSP failures have their own finite
method, URL, and body signatures. Harness negative controls proved that
`POST /download-private`, `GET /download?exfil=secret`, another path on the
same domain, and a body-bearing apparent download do not match either list.

Console handling likewise uses explicit policy categories and exact fixture
URLs. It recognizes only the expected top-navigation, popup, form, connect,
Fetch API, font, script, stylesheet, image, media, frame, worker, and download
signatures. Negative controls proved that a query-bearing URL, an unrelated
same-domain URL, a correct URL under the wrong CSP directive, and a generic
message containing `sandboxed` remain unexpected. The final browser run
observed every required policy category and retained zero unexpected console,
network, failed-resource, or page-error entries.

## Residual deployment boundary

- The parallel viewer and public API are local-only and not enabled at the
  production URL.
- Production CORS, proxy topology, CDN behavior, asset-origin policy, download
  egress behavior, and live database records are not proven by this fixture.
- Production `index.html` and `presenter.html` were not altered or cut over.
