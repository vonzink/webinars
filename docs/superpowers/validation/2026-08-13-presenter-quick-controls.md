# Presenter Quick Controls — Browser Validation

Date: 2026-08-13
Scope: verification only; no runtime or test source was changed.

## Static gate

Executed from `first-time-homebuyer/deck`:

```bash
node --no-warnings --test tests/*.test.mjs
for file in content/*.js js/*.js; do node --check "$file" || exit 1; done
git diff --check
```

Result: PASS. Node reported 34 tests passed, 0 failed, 0 skipped; every
`content/*.js` and `js/*.js` syntax check passed; `git diff --check` passed.
`npx` was present before browser verification.

## Isolated browser workflow

Started only an owned loopback server at `http://127.0.0.1:4181` from the deck
directory (PID `70413`). Opened audience `index.html#myths` and used its
**Open presenter view** control to create the same-origin `presenter.html`
window in the isolated `presenter-quick` Playwright session.

Desktop presenter viewport: `1280 x 800`.

- Calculator was an icon-only `36 x 36` top-bar control at the right edge;
  its text content was empty. Initial state was `Show calculator`,
  `aria-pressed=false`.
- On Slide 2, `Popouts (5)` appeared left of `Graphics (5)` and all entries
  were compact buttons.
- Selecting **You need 20% down** opened the matching educational popout in
  the audience window. After close, selecting **FHA Buyers** opened the
  audience graphic dialog with the selected graphic PNG and its alt text.
- Selecting the calculator opened the audience calculator. Presenter state
  synchronized to `Hide calculator`, `aria-pressed=true`, class `on`, and
  computed green background `rgb(140, 198, 62)`. Closing it in the audience
  returned the presenter to `Show calculator`, `aria-pressed=false`, and no
  active class.
- On Slide 1 (no registered graphics), the Graphics section was absent and
  the Popouts library became single-column.

## Responsive evidence

Narrow presenter viewport: `480 x 800`; the library measured `413px` wide
(at or below the required 420px threshold). Popouts began at `y=410` and
Graphics at `y=661`, both at `x=26`, confirming the required Popouts-above-
Graphics order. Every sampled button had equal `scrollWidth` and `clientWidth`
(409px), so no labels were horizontally clipped. The audience window remained
at `1280 x 800` and on `#myths`.

## Keyboard and navigation

- With focus outside text entry, uppercase `D` changed the presenter control
  to `Draw: On` with `aria-pressed=true`; lowercase `d` returned it to
  `Draw: Off`. The shared audience annotation state echoed back through the
  presenter channel state.
- With the personal-note textarea focused, typing `D` inserted the literal
  character and left drawing Off.
- With a normal presenter button focused, `d` toggled from On back to Off.
  Browser-evaluated `keydown` events for Ctrl+D, Alt+D, Meta+D, and repeated
  `d` all left `Draw: Off` and `aria-pressed=false`.
- With focus on `BODY`, Arrow Right moved the shared audience pair from
  `#myths` (2/16) to `#budget-rent-buy` (3/16); Arrow Left returned it to
  `#myths`; Space advanced it again to `#budget-rent-buy`.

## Console and visual inspection

Console checks for both the presenter and audience windows returned zero
errors and zero warnings (each had one non-warning informational message).

- `first-time-homebuyer/deck/output/playwright/presenter-quick-controls-1280x800.png`:
  inspected; readable desktop presenter layout, small clear calculator icon,
  and side-by-side Popouts/Graphics. No excessive empty presenter canvas.
- `first-time-homebuyer/deck/output/playwright/presenter-quick-controls-narrow.png`:
  inspected; Popouts visibly stack above Graphics and visible button labels
  are not clipped.

## Cleanup and boundaries

Stopped only the owned local-server PID `70413` and the owned
`presenter-quick` Playwright session. No pre-existing service or browser
session was stopped. No deployment occurred and no PowerPoint build ran.

## Final review gate

The final review found no runtime Critical or Important issues. It requested
one optional contract-hardening change: require the calculator to be present
after the clocks and remain the final interactive top-bar control. A
mutation-based RED exposed the former missing-clocks false-positive before the
test was hardened.

After that change, the controller reran:

```bash
node --no-warnings --test first-time-homebuyer/deck/tests/presenter-contract.test.mjs
node --no-warnings --test first-time-homebuyer/deck/tests/*.test.mjs
for file in first-time-homebuyer/deck/content/*.js first-time-homebuyer/deck/js/*.js; do node --check "$file" || exit 1; done
git diff --check
```

Result: presenter contracts `5/5`, full suite `35/35`, all syntax checks, and
the whitespace check passed with no warning output. The scoped re-review
confirmed the original missing-clocks and later-control cases are covered. It
identified one remaining non-blocking test-helper edge case if the calculator
were converted from a button into a noninteractive element while the bar had
no other controls. The current runtime uses a verified native button, so this
is recorded as deferred test hardening rather than a runtime defect.
