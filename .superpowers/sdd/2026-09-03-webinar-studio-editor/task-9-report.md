# Editor Task 9 report — private Studio browser acceptance

## Outcome

The complete private Studio was exercised in a real browser without any
deployment, and the coordinator gained the last piece of the package: the
presenter launches and controls the audience through the reviewed bridge.

| Repository | Commit | Purpose |
| --- | --- | --- |
| Dashboard `codex/webinar-studio-complete` | `c766d80` | Coordinator wires the audience bridge per webinar, header launch buttons, live-version and notice hygiene, preview caption, phone layout fixes |
| Webinars `codex/webinar-studio` | `b5e7110` | `tests/webinar-studio-browser.run.js`, `tests/run-webinar-studio-browser-audit.sh`, `tests/webinar-studio-harness/`, `docs/superpowers/validation/2026-09-03-webinar-studio-editor.md` |

Nothing was pushed to a production branch, deployed, migrated, or
flag-changed. `WEBINAR_STUDIO_ACCESS` stays disabled by default.

## Coordinator changes (Dashboard `c766d80`)

- The presenter receives one bridge facade for its lifetime. The real
  `createAudienceBridge` instance is built lazily, per webinar, on the first
  launch, with the audience URL derived from `CONFIG.webinarStudio.audience`
  (`https://msfgmortgage.com`) and the webinar slug. Acknowledgements reach
  the presenter only while that webinar is still selected; the bridge is
  dropped on selection change, new-webinar flow, close, and destroy.
- Launch is refused with a status-line notice while audience access is off
  or the audience host is not configured. The notice clears on selection
  change and on any reload of the webinar.
- The header's Presenter button activates the presenter tab; the header's
  audience button launches through the bridge. The old `openWindow` path
  with `noopener` is gone, so no code path opens the audience outside the
  contract.
- The status line and deck list follow the live version the editor saves.
- `index.html` ships `bridge.js` before the coordinator; the preview host
  carries a caption; `js/config.js` gains the audience origin.
- Phone layout: the settings drawer no longer overflows the viewport (its
  100% width plus padding did), tabs wrap instead of scrolling sideways, the
  workspace yields height so the drawer stays on screen, and short landscape
  viewports get a compact header and picker.

Shell suite additions: bridge wiring (lazy build, refusal copy, config
validation, switch and destroy lifecycle, header buttons, reconnect), the
stale-notice reload case, the live-version summary sync, and CSS pins for
the phone rules.

## Acceptance (Webinars `b5e7110`)

`tests/run-webinar-studio-browser-audit.sh` builds the harness, serves the
Dashboard page and this deck on two loopback origins, and runs
`tests/webinar-studio-browser.run.js` through the Playwright CLI. The full
scope and result are in
`docs/superpowers/validation/2026-09-03-webinar-studio-editor.md`.

Result: **78 of 78** checks at 1440×900, 1024×768, 390×844, and 844×390;
zero page errors; zero requests outside the fulfilled fixtures. The real
exact-origin preview host and slide sandbox, the real audience window, and
the real bridge were all exercised; only the authenticated API was an
in-memory fixture.

Defects the acceptance found and `c766d80` fixed: the status line did not
follow editor saves; a launch notice outlived the reload that made it
false; the phone drawer clipped its launch buttons and tabs on the right;
short landscape sizes hid the drawer below the fold.

## Verification evidence

Dashboard:

| Gate | Result |
| --- | --- |
| Studio suites | 167 passed across 9 files |
| `TZ=UTC npm test` | 1,508 passed, 2 failed: only the accepted `calendarSyncUi.test.js` pair |
| `node ../build.js`, ESLint on changed tests, `node --check`, `git diff --check` | clean |
| Chromium insertion harness (Task 6) | 27 of 27 against the final tree |
| Chromium presenter harness (Task 7) | 32 of 32 against the final tree |
| Chromium bridge harness (Task 8) | 38 of 38 against the final tree |

Webinars deck:

| Gate | Result |
| --- | --- |
| `npm test` | 129 passed |
| `node --check` on the run script, `bash -n` on the runner and build script, `git diff --check` | clean |
| Studio acceptance | 78 of 78 |

## Independent review, Task 9, round 1: REJECT

A fresh reviewer examined Dashboard `c766d80` and Webinars `b5e7110`, ran
the unit suites and the acceptance twice (once instrumented), and confirmed
the security contract: `bridge.js` before the coordinator, production
config `https` only, audience URL exactly origin plus slug, no storage or
tokens, the feature flag defaulting to disabled, the client role UI-only,
and the phone CSS confined to the sub-900px blocks. It rejected on:

1. **Should-fix.** `openNewWebinar` dropped the audience bridge before the
   discard prompt, so cancelling New webinar severed a live audience and a
   relaunch restarted the deck in front of viewers.
2. **Should-fix.** `close()` (Escape, backdrop, Close) dropped a connected
   bridge without asking.
3. **Should-fix.** Turning audience access off did not drop a connected
   bridge, so presenter controls kept driving the open audience window.
4. Nit: an archived webinar's bridge survived when no webinars remained.
5. Nit: bridge callbacks were guarded by webinar id, not bridge identity,
   and `onStatus` lacked the selected-webinar clause.
6. Nit: `syncSelectedSummary` rebuilt the deck list on every keystroke.
7. Nit: the header Presenter button is now cosmetic on desktop.
8. **Should-fix.** The acceptance's "no live content written" check counted
   a note POST and passed on a coincidental total.
9. **Should-fix.** The upload checks did not observe the transport PUT.
10. **Should-fix.** The advertised inner-slide-frame attack was never sent.
11. **Should-fix.** The built harness viewer still pointed at the production
    API base when opened by hand.
12. Nits: two check names overstated their assertions; `pageScrolls` was
    true by construction and the responsive pass measured before the preview
    host inflated the workspace; the confirm fixture returned a fuller shape
    than the real route; the build script's `awk` extraction had no guard;
    the validation notes cited an uncommitted harness.

Run counts reported: Studio suites 168, full suite 1,508 passed with the
two accepted Calendar failures, deck 129, acceptance 78 of 78.

## Round 2 fixes (Dashboard `b4af0bf`, Webinars `c6c09ee`)

Each product finding got a failing test first. New webinar drops the bridge
only after the discard prompt is confirmed; `close()` asks before
disconnecting a connected or connecting audience and keeps the link when
declined; a reload that shows audience access off drops the bridge;
archiving drops it; callbacks are accepted only from the bridge instance
currently held (a per-instance token plus the selected-webinar clause on
both callbacks); the deck list is rebuilt only when the summary changed.
Finding 7 is left as-is: the button is the phone layout's way to reach the
presenter tab and is harmless on desktop.

The acceptance now snapshots live-content write counts (master, slides,
history, excluding notes) before section 7 and asserts equality after;
records the single transport PUT and matches it to the intent's upload URL;
posts controls from the sandboxed slide frame; renames the two overstated
checks; measures the responsive pass once the preview host is showing and
asserts the shell fits the viewport; rewrites the harness viewer's API base
to the loopback origin and fails the build if any production host remains or
the modal fragment is empty; answers confirm with the real minimal shape;
and the validation notes point at the committed Task 8 harness.

Round 2 evidence: Studio suites 176 passed across 9 files; full Dashboard
suite 1,516 passed with only the two accepted Calendar failures; build,
ESLint, `node --check`, `git diff --check` clean; deck 129; Chromium
insertion 27 of 27, presenter 32 of 32, bridge 38 of 38; acceptance
**83 of 83**.

## Independent review, Task 9, round 2: REJECT

A fresh reviewer confirmed every round-1 finding genuinely resolved (with
the inner-frame attack shown to be a real probe: the forged nonce passes the
format rule, so only the source and origin check stops it) and the security
contract intact, then rejected on one new should-fix: the "Audience
connected" prompt added to `close()` re-spawned on every Escape, because the
Studio's Escape handler re-entered `close()` before the dialog's own handler
could resolve it. Nits: a test name claimed a status case it did not fire;
the acceptance ran on the native `window.confirm` fallback so the prompt was
invisible to it; the Task 9 report edit was uncommitted. Run counts: Studio
176, full suite 1,516 with the two accepted failures, deck 129, acceptance
83 of 83.

## Final package review, round 1: REJECT

The package reviewer judged every exit-gate item PASS on evidence
(server-enforced owner and admin checks, unsaved data retained on every
failure path, the canonical sandbox path, authenticated APIs, browser-covered
bridge attacks, untouched production deck, nothing deployed and the flag
disabled) and found the two protocol copies identical across 76,140
classifications, but rejected on three bridge-lifecycle findings:

1. **Should-fix.** `reconnect()` re-navigated an open window, and the
   outgoing document answered `presenter-init` before unloading, so a
   reloaded audience left the presenter bound to a dying page.
2. **Should-fix.** Deck switch and New webinar still severed a connected
   audience silently when the editor was clean.
3. **Should-fix.** Every reconnect restarted the audience at slide 1 and
   pulled the presenter to 1 of N.

Nits: ledger wording overstated what the `db807d1` reconnect covered; the
validation baseline table named non-final commits; the attribution trailers
are a repository policy question before merge; a server-side family-archive
rule is looser than the UI (asset package, out of range); a pre-existing
`localhost` URL exists elsewhere in `config.js`.

## Round 3 fixes (Dashboard `7ea9d79`, Webinars `e7c75f8`)

Each finding got a failing test first. `reconnect()` handshakes with the
page already in the window first and re-navigates once only after the
in-place attempts lapse (`inPlaceInitAttempts`, default 4), so a reloaded
audience is recovered in place and a foreign page is still replaced
promptly. The presenter adopts the audience position on the first launch
only; after that, an `audience-ready` at a different index sends `goto` to
the presenter's current slide. Deck switch and New webinar go through the
same "Audience connected" prompt as closing, awaited only while a link is
active so selection timing is unchanged otherwise. `close()` carries a
re-entrancy guard, so a second Escape reaches the prompt. The replaced-bridge
test now fires status while the other webinar is selected.

The acceptance harness loads the Dashboard's real confirm dialog and
styles, accepts it automatically except where a check drives it, and proves
the unsaved-changes prompt, the connected-audience prompt, the second
Escape dismissing rather than re-spawning, staying connected after
declining, and a relaunched audience being brought to the presenter's
slide. The Task 8 harness gains audience reload then reconnect in place.

Round 3 evidence: Studio suites 180 passed across 9 files; full Dashboard
suite 1,520 passed with only the two accepted Calendar failures; build,
ESLint, `node --check`, `git diff --check` clean; deck 129; Chromium
insertion 27 of 27, presenter 32 of 32, bridge 44 of 44; acceptance
**90 of 90**.

## Final package review, round 2: REJECT

The package reviewer confirmed the three round-1 lifecycle findings
resolved and browser-proven (the reload-then-reconnect scenario, the
disconnect prompts on deck switch and New webinar, the relaunch position
push), re-judged every exit-gate item PASS, and re-confirmed the
non-negotiables, then rejected on one new blocker introduced by the
position push: the "adopt on first ready" flag was reset only when the
presenter panel rendered a different webinar, so a deck switched while
another tab was open launched the new deck's audience and pushed the
previous deck's slide onto it. Also noted: a second prompt spawned during
`close()` could strand the guard (the shared `Utils.confirm` replaces an
open dialog without resolving it); the header's audience button never
re-navigated a foreign page while disconnected; the reconnect push was
gated on the presenter's own slide range; a Reconnect pressed during an
in-flight audience reload can bind briefly to the outgoing page (runbook
note). Run counts: Studio 180, full suite 1,520 with the two accepted
failures, deck 129, acceptance 90 of 90, bridge harness 44 of 44.

## Round 4 fixes (Dashboard `893bcbb`)

Each finding got a failing test first. Adoption is keyed to the webinar id
the state belongs to (`audienceReadyFor`), so a newly selected webinar
adopts its first ready even when the panel was deactivated during the
switch, and a later ready for the same webinar pushes the presenter's slide
regardless of the presenter's own range. The header's audience button uses
reconnect when the link is disconnected. `close()` observes the request
generation without invalidating in-flight loads and abandons itself when a
newer selection overtook its prompt. The shared `Utils.confirm` dialog was
left unchanged: it sits outside the Studio package and has no unit harness,
so the stranded-prompt edge is mitigated on the Studio side only and noted
for the Dashboard maintainers. The Reconnect-during-reload note is in the
validation document.

Round 4 evidence: Studio suites 184 passed across 9 files; full Dashboard
suite 1,524 passed with only the two accepted Calendar failures; build,
ESLint, `node --check`, `git diff --check` clean; deck 129; Chromium
insertion 27 of 27, presenter 32 of 32, bridge 44 of 44; acceptance
90 of 90.

## Final package review, round 3: APPROVE

The package reviewer confirmed the round-2 blocker fixed and browser-proven
(an independent probe against the real presenter module reproduced the
deck-switch-off-tab scenario and showed it clean), the header relaunch,
the abandoned close, and the runbook note all resolved, re-judged every
exit-gate item PASS with evidence, and re-confirmed the non-negotiables.
Verdict: **APPROVE**, with two should-fixes to land before the feature flag
is enabled rather than before merge:

1. When the very first ready arrives before the presenter panel has ever
   rendered, the adoption key was `null`, so the next ready for the same
   webinar was adopted instead of pushed.
2. A close prompt replaced by another prompt (the shared `Utils.confirm`
   replaces an open dialog without resolving it) could strand the close
   guard until reload.

Nits: an abandoned close gives no feedback; the header's reconnect path
re-navigates a merely slow audience after the in-place attempts (documented
in the validation notes). Run counts: Studio 184, full suite 1,524 with the
two accepted failures, deck 129, acceptance 90 of 90, bridge harness 44 of
44.

## Post-approval follow-up (Dashboard `885dcc8`)

Both should-fixes were landed with failing tests first: the coordinator
forwards every ready with the webinar it belongs to and the presenter
prefers that id, and Studio prompts are serialized so a newer prompt
resolves the one still open as declined. Studio suites 187 passed across 9
files; full suite 1,527 passed with only the two accepted Calendar
failures; build, ESLint, `node --check`, `git diff --check` clean;
Chromium insertion 27 of 27, presenter 32 of 32, bridge 44 of 44;
acceptance 90 of 90. This commit landed after the approving review; a
focused independent review of it ran while the branches were pushed and
returned **APPROVE**: both should-fixes correctly and minimally addressed,
every overlapping-prompt path resolving to a side-effect-free decline, and
the webinar forwarding guarded by the coordinator. Three nits, none
requiring a change before merge: a ready adopted before the panel's first
render cannot carry the audience's slide (unreachable in the real app,
where a bridge exists only after the rendered panel launches it); the
serialization covers Studio prompts only, with the root cure being a
one-line resolve in the shared `js/utils.js` confirm before it removes an
existing overlay; and that shared dialog leaves its keydown listener
attached when replaced, which this commit makes strictly safer rather than
worse.

