# Webinar Studio Editor — Private Browser Acceptance

Date: 2026-09-05
Scope: verification only, in a real browser, with nothing deployed. The
Studio ran from the Dashboard checkout and the audience and preview host from
this deck, both on loopback origins.

## Baseline

| Repository | Branch | Commit under test |
| --- | --- | --- |
| dashboard.msfgco.com | `codex/webinar-studio-complete` | `885dcc8` (`fix(webinars): name the webinar on audience readies and serialize prompts`), the tip after `c766d80` and its review follow-ups |
| Webinars | `codex/webinar-studio` | `c0d8a61` (`fix(webinars): make audience surface control honest and idempotent`) plus the validation commits up to and including this one |

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
modules in the Dashboard's own script order, the Dashboard's `js/utils.js`
(so confirmations use the real dialog, not the native fallback), its
`variables.css` and `components.css`, and an in-memory stand-in for the
authenticated `ServerAPI` (`harness-tail.html`). This deck's
`studio-viewer.html` is served at `/webinars/first-home-without-mystery/` on a
second loopback origin and acts as both the exact-origin preview host and the
audience window, with its Dashboard origin and its public API base rewritten
to the loopback origins so the exact-origin checks can pass off production
and the harness page is inert even without Playwright. Playwright fulfils the
public live bundle from `tests/fixtures/studio-live-bundle.json` at that
rewritten API base, the asset upload transport, and the approved asset
origin. Nothing else may leave the two loopback origins; the audit fails if
it does.

`tests/webinar-studio-browser.run.js` is the Playwright CLI `run-code`
function. It returns `{ status, passed, total, failures, checks, screenshots }`
and writes screenshots to `output/playwright/webinar-studio/`.

## Result

`90 of 90` checks passed at 1440×900, then the responsive pass at 1440×900,
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
5. Assets: the file goes out as exactly one PUT to the intent's upload URL
   before processing is reported, then available; the confirm route answers
   with its real minimal shape; a rejected upload shows its server code;
   Insert at cursor is
   enabled for the Code field chosen before opening Assets and inserts the
   canonical token at the caret.
6. Presenter: up-next preview settles on ready; notes add, edit, delete
   round-trip; shortcuts persist once for the account; ArrowRight navigates
   locally in rehearsal and is suppressed inside the note textarea.
7. Two windows: Launch audience opens the audience on the audience origin
   and the presenter reports connected; Next and Previous drive the real
   viewer; animation forward runs the real slide animation; drawing toggles
   the audience pen; navigation visibility hides and restores the dock;
   fullscreen is honoured or explicitly denied; controls posted by the
   audience window itself, by its sandboxed slide frame (the surface an
   attacker controls), and with a wrong nonce from the opener change nothing
   (a presenter-init from the real opener is the reconnect path by design
   and is inside the Dashboard's own trust boundary, so it is not an
   attack); the real presenter still drives the audience afterwards; the
   audience DOM and source carry no notes, ownership, history, settings, or
   keys; with the audience connected and edits unsaved, Escape asks about
   the unsaved edits first and then about the connected audience, a second
   Escape dismisses that prompt instead of spawning another, and choosing to
   stay keeps the Studio open and the link driving the audience; closing the
   audience is detected as disconnected within the heartbeat budget;
   reconnect reopens the window and brings it to the presenter's current
   slide rather than resetting the presenter, and controls resume after a
   fresh handshake; the count of live-content writes (master, slides,
   history, excluding notes) is identical before and after all presenter and
   bridge activity.
8. Responsive, measured once the preview host is showing: no horizontal
   overflow, the page is locked behind the Studio and the shell fits the
   viewport, close, both launch buttons, and all five tabs are visible
   without scrolling, no nested scroll regions, presenter navigation and the
   code editor reachable, at every size.

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
- The heartbeat runs at production timing here; the Task 8 harness under
  `.superpowers/sdd/2026-09-03-webinar-studio-editor/task-8-browser/` covers
  the shortened-timing, foreign-window, and audience-reload-then-reconnect
  cases (44 of 44).
- The New webinar form (`POST /webinars`) is not exercised here; it is
  covered by the shell unit suite.
- Presenter runbook note: if Reconnect is pressed while the audience's own
  reload is still loading (more than about two seconds), the in-place
  attempts lapse and the window is re-navigated once; if the outgoing page
  answers first, the link binds to it until the heartbeat notices (about
  twenty seconds), then the presenter pushes its slide again. Bounded and
  self-healing; wait for the audience page to finish loading before
  pressing Reconnect. The header's audience button also re-navigates a
  disconnected window after about two seconds of in-place attempts, so a
  merely throttled audience tab that comes back is reloaded and loses any
  on-screen annotations; use the panel only when you know the page is
  alive and just slow.
- Delivery of the real preview host and audience page to
  `msfgmortgage.com/webinars/first-home-without-mystery/` is a deployment
  prerequisite that this audit does not perform.
