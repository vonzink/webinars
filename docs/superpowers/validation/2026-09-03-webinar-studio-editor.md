# Webinar Studio Editor — Private Browser Acceptance

Date: 2026-09-05
Scope: verification only, in a real browser, with nothing deployed. The
Studio ran from the Dashboard checkout and the audience and preview host from
this deck, both on loopback origins.

## Baseline

| Repository | Branch | Commit under test |
| --- | --- | --- |
| dashboard.msfgco.com | `codex/webinar-studio-complete` | `c766d80` (`feat(webinars): launch and control the audience from the Studio`) |
| Webinars | `codex/webinar-studio` | `c0d8a61` (`fix(webinars): make audience surface control honest and idempotent`) plus this validation commit |

Production feature flag `WEBINAR_STUDIO_ACCESS` remained disabled by default.
No assigned-owner or audience access was enabled anywhere. Neither frontend
was deployed. No AWS, S3, CloudFront, CORS, or DNS setting was changed. The
production deck files `first-home-without-mystery/deck/index.html` and
`presenter.html` are untouched.

## How the audit runs

```bash
# On your Mac, from the Webinars checkout (replace the Dashboard path if yours differs):
cd first-home-without-mystery/deck
DASHBOARD_ROOT=/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com ./tests/run-webinar-studio-browser-audit.sh
```

`tests/webinar-studio-harness/build-harness.sh` assembles the page: the real
`#webinarStudioModal` markup from the Dashboard's `index.html`, the Studio
modules in the Dashboard's own script order, and an in-memory stand-in for the
authenticated `ServerAPI` (`harness-tail.html`). This deck's
`studio-viewer.html` is served at `/webinars/first-home-without-mystery/` on a
second loopback origin and acts as both the exact-origin preview host and the
audience window, with its Dashboard origin rewritten to the local one so the
exact-origin checks can pass off production. Playwright fulfils the public
live bundle from `tests/fixtures/studio-live-bundle.json` at the production
API URL, the asset upload transport, and the approved asset origin. Nothing
else may leave the two loopback origins; the audit fails if it does.

`tests/webinar-studio-browser.run.js` is the Playwright CLI `run-code`
function. It returns `{ status, passed, total, failures, checks, screenshots }`
and writes screenshots to `output/playwright/webinar-studio/`.

## Result

`78 of 78` checks passed at 1440×900, then the responsive pass at 1440×900,
1024×768, 390×844, and 844×390. Zero page errors in the Dashboard or audience
windows; zero requests outside the fulfilled fixtures.

Covered, in order:

1. Admin access: both webinars listed, first selected, status line shows the
   live version and audience state. The preview host appears only once the
   real exact-origin host frame answers the up-next boot; the host frame is
   un-sandboxed on the configured preview origin; the inner slide frame it
   creates carries exactly `sandbox="allow-scripts"`; no candidate HTML
   appears in the Dashboard document.
2. Code: one box per live slide plus Master; Save Live disabled until a
   ready preview; editing boots through the real sandbox host and reports
   ready; Save Live advances the version exactly once with the expected
   version in the request; the status line follows; Master saves the same
   way; an invalid anchor is refused locally with guidance; a stale save
   shows the conflict naming the other editor, keeps the unsaved text,
   offers reload or copy, and reload lands on the server version; add,
   duplicate, move down, and delete each advance the version once.
3. History: revisions list actor and summary only; restoring the baseline
   reloads on a new version and brings back the original slide set.
4. Users & Access: only active users offered; owner replacement reloads and
   shows the new owner; audience off updates the status line and disables
   the audience launch; the presenter's Launch audience is refused with the
   reason in the status line; audience on re-enables the launch.
5. Assets: upload reports processing after the transport PUT, then
   available; a rejected upload shows its server code; Insert at cursor is
   enabled for the Code field chosen before opening Assets and inserts the
   canonical token at the caret.
6. Presenter: up-next preview settles on ready; notes add, edit, delete
   round-trip; shortcuts persist once for the account; ArrowRight navigates
   locally in rehearsal and is suppressed inside the note textarea.
7. Two windows: Launch audience opens the audience on the audience origin
   and the presenter reports connected; Next and Previous drive the real
   viewer; animation forward runs the real slide animation; drawing toggles
   the audience pen; navigation visibility hides and restores the dock;
   fullscreen is honoured or explicitly denied; wrong-source and wrong-nonce
   controls change nothing; the real presenter still drives the audience
   afterwards; the audience DOM and source carry no notes, ownership,
   history, settings, or keys; closing the audience is detected as
   disconnected within the heartbeat budget; reconnect reopens it and
   controls resume under the new nonce; presenter and bridge activity wrote
   no live content.
8. Responsive: no horizontal overflow, the page does not scroll behind the
   Studio, close, both launch buttons, and all five tabs are visible without
   scrolling, no nested scroll regions, presenter navigation and the code
   editor reachable, at every size.

## Defects found by this audit and fixed in `c766d80`

- The status line and deck list did not follow the live version after an
  editor save.
- A launch refused while audience access was off left its notice in the
  status line after access was turned back on and the webinar reloaded.
- On phones the settings drawer was wider than the viewport (100% width plus
  padding), so the launch buttons and tabs were clipped on the right, and
  the five tabs never wrapped.
- At short landscape sizes the workspace's 280px minimum pushed the drawer
  below the fold with no way to scroll to it.

## Known limits of this run

- The audience window loads the fixture bundle once; a Save Live in the
  Studio does not republish to that window in the harness.
- Production `https` origins are rewritten to loopback `http` origins; the
  unit tests pin the production values.
- The heartbeat runs at production timing here; the earlier Task 8 harness
  covers the shortened-timing and foreign-window cases.
- Delivery of the real preview host and audience page to
  `msfgmortgage.com/webinars/first-home-without-mystery/` is a deployment
  prerequisite that this audit does not perform.
