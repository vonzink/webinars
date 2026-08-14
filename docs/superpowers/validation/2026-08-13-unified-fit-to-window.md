# Unified Fit-to-Window Validation

## Baseline

- Branch: `codex/unified-fit-to-window`
- Runtime commit tested: `9fafd7c8331fff7c641a89a12b63e995ca76a87a` (`feat: fit complete presenter graphics`)
- Task 6 adds only the reusable browser-audit module and this report. No runtime source was changed during validation.
- Protected content hashes:

```text
5e2551038a8c075103a5dc33f6084b9bf2380f0fd56f26a3f8e2d394e0b1b1ab  first-time-homebuyer/deck/js/calculator-math.js
0a2296b2380564f84b2f7fdbf722550f7a03a0739a04d2878723dd9eddd9e8ab  first-time-homebuyer/deck/content/slides.js
8aa72a8ead27ed94fe60eef0ae41e59241bbc0dd5b7ba2972865bf425e745ce8  first-time-homebuyer/deck/content/modals.js
ecb3871668addda146aa4078c66b1c2d6f78b02639936efa683bedf602e104f2  first-time-homebuyer/deck/content/presenter-media.js
b37970d546648801beee3a0ea1d9fd422a3929fff237ec1e3f7b3c48cc917bd4  first-time-homebuyer/deck/js/presenter.js
```

All five hashes match the approved plan.

## Static gate

Pre-browser commands:

```bash
git diff --check
for file in first-time-homebuyer/deck/content/*.js first-time-homebuyer/deck/js/*.js first-time-homebuyer/deck/tests/fit-browser-audit.js; do node --check "$file"; done
node --no-warnings --test first-time-homebuyer/deck/tests/*.test.mjs
shasum -a 256 \
  first-time-homebuyer/deck/js/calculator-math.js \
  first-time-homebuyer/deck/content/slides.js \
  first-time-homebuyer/deck/content/modals.js \
  first-time-homebuyer/deck/content/presenter-media.js \
  first-time-homebuyer/deck/js/presenter.js
```

Result: `git diff --check` passed, all JavaScript syntax checks passed, and the Node suite passed 50 of 50 tests with 0 failures, 0 skipped, and 0 cancelled.

The reusable real-browser assertions live in `first-time-homebuyer/deck/tests/fit-browser-audit.js`. One-off Playwright orchestration stayed in `/tmp` and was not committed:

```bash
PWCLI=/Users/zacharyzink/.codex/skills/playwright/scripts/playwright_cli.sh
"$PWCLI" --session fit-final run-code --filename=/tmp/msfg-fit-full-audit.js
"$PWCLI" --session fit-final run-code --filename=/tmp/msfg-fit-interactions.js
"$PWCLI" --session fit-final run-code --filename=/tmp/msfg-fit-screenshots.js
```

The final matrix run returned `errors: []`. It made 215 independent composed-surface audit invocations: 5 base-slide, 5 collapsed-calculator, 5 expanded-calculator, 5 expanded-calculator with nonzero HOA, 150 educational-popout, and 45 graphic audits.

## Browser matrix

Every cell below passed containment, uniform-scale, no-upscale, authored-ratio, shell/surface overflow, descendant scroll-container, and no-reflow checks with a one-pixel containment/overflow tolerance and `0.001` ratio tolerance.

| Viewport | Base slide | Calculator collapsed | Calculator expanded | Nonzero HOA | 30 popouts | 9 graphics |
|---|---:|---:|---:|---:|---:|---:|
| 1920×1080 | 1/1 pass | 1/1 pass | 1/1 pass | 1/1 pass; 5 rows | 30/30 pass | 9/9 pass |
| 1280×720 | 1/1 pass | 1/1 pass | 1/1 pass | 1/1 pass; 5 rows | 30/30 pass | 9/9 pass |
| 480×800 | 1/1 pass | 1/1 pass | 1/1 pass | 1/1 pass; 5 rows | 30/30 pass | 9/9 pass |
| 800×480 | 1/1 pass | 1/1 pass | 1/1 pass | 1/1 pass; 5 rows | 30/30 pass | 9/9 pass |
| 240×180 | 1/1 pass | 1/1 pass | 1/1 pass | 1/1 pass; 5 rows | 30/30 pass | 9/9 pass |
| **Total** | **5/5** | **5/5** | **5/5** | **5/5** | **150/150** | **45/45** |

Additional measured invariants:

- Base slide stayed exactly 1920×1080 in layout and 16:9 when rendered at every viewport.
- Calculator stayed 560×820 collapsed and 560×982 expanded. The two-column grid never stacked. The nonzero `$250` HOA case rendered all five result rows inside the result panel and authored canvas.
- All 30 popouts retained the same authored width and measured height across all five viewports. Every one used the 52px design-size strip and 20px title, with no overlay eyebrow, accent underline, viewport-dependent wrap, or internal scrolling.
- All nine graphics retained stable decoded native dimensions across all five viewports. All 45 opens had `complete === true`, positive natural dimensions, native image-area ratio, `object-fit: contain`, zero body padding, and the image directly beneath the 52px/20px strip. No inset mat or duplicate title block appeared.

## Interaction preservation

- Drag and resize: 20 calculator checks and 20 `myth-lowest-rate` checks covered top-left clamp, bottom-right clamp, shrink, and grow at all five viewports. Sixteen equivalent checks covered portrait `debt-to-income` and landscape `budget-smart` graphics at 480×800 and 800×480. All 56 operations stayed inside the viewport, preserved one scale/aspect ratio, and never upscaled.
- Focus and close: calculator and modal forward/backward focus wrapping passed; close returned focus to the external opener. Escape and backdrop close both passed.
- Races: calculator toggle-then-close stayed closed after queued animation frames. Modal close-during-open resolved the stale open `false`; content-to-content and media-to-content replacement resolved the stale request `false`, the replacement `true`, and displayed the replacement title.
- Presenter synchronization: the 36×36 icon-only calculator utility opened/closed the audience calculator and synchronized its label/state. Presenter popout and graphic buttons opened the matching audience titles.
- Presenter library: on `#myths`, five popouts and five graphics rendered as two separated columns. The responsive dashboard retained scroll-capable overflow; at 1280×480 the page scrolled from `0` to `322`px.
- Shortcuts: presenter `D` toggled drawing on the audience window and back off. With the notes textarea focused, `d` entered text and did not toggle drawing. Arrow Right and Space advanced the audience from `2 / 16` to `3 / 16` to `4 / 16`; Arrow Right and Space were guarded while typing.
- Presenter preview and controls: the iframe rendered a complete active 1280×720, 16:9 slide. Fullscreen entered and exited through the presenter control. The presenter window then closed normally.

## Overflow audit

- Covered audit invocations: 215.
- Failed `insideViewport` checks: 0.
- Failed `surfaceFitsLayout` checks: 0.
- Covered internal `overflow: auto`/`scroll` containers with actual overflow: 0.
- Shell or design-surface `scrollWidth/clientWidth` or `scrollHeight/clientHeight` violations beyond one pixel: 0.
- Ratio deviations beyond `0.001`: 0.
- Viewport-dependent authored-dimension changes: 0 across 30 popouts and 9 graphics.

The presenter dashboard's normal application-page scrolling is intentionally outside the composed-surface prohibition and remained operational.

## Visual evidence

The four approval images were captured only after geometry, staged slide builds, and extra paint frames were ready. Each was opened at original resolution and visually inspected. Screenshot files are evidence only and were not staged.

| Screenshot | SHA-256 | Visual inspection |
|---|---|---|
| `first-time-homebuyer/deck/output/playwright/fit-slide-480x800.png` | `e7c8aa398898b937fc78b6d39a04a15cc69abd67b1601db0d1057af8bcfa11b9` | Complete centered 16:9 slide; all five cards, footer, and branding visible; no crop or reflow. |
| `first-time-homebuyer/deck/output/playwright/fit-calculator-expanded-800x480.png` | `aff6cc061baed2a31140bac65102d412154e6c02c03bd6b3f37c0ce1e89976e9` | Full drag bar, fields, five payment rows, footer, close, and resize control visible as one uniformly scaled composition. |
| `first-time-homebuyer/deck/output/playwright/fit-popout-480x800.png` | `0d6310ac6a033100bc09525f1cf0bf42d74f765c6adaef24e459d49296d529f5` | Entire educational body and controls visible; compact strip present; no oversized duplicate heading, underline, crop, or scrollbar. |
| `first-time-homebuyer/deck/output/playwright/fit-graphic-800x480.png` | `4d535beb267eeac1f7b72735ac1d55d23b8857979eb1a480f5e80f9a4bff2c44` | Entire Budget Smart PNG and compact strip visible; no cropped pixels, inset mat, duplicate title block, or scrollbar. |

## Deferred minor characterization

These are pre-existing review minors from Tasks 3 and 5. The plan did not require them to be fixed in Task 6, and none blocks the full-picture rendering contract.

1. **Calculator resize-handle focus outline remains clipped.** At 800×480 the focused handle was flush with the canvas's right and bottom edges. Its 3px focus outline projected 3px beyond both edges while `.calculator-canvas` computed to `overflow: hidden`; the projected right edge was `555.97` versus canvas `552.97`, and projected bottom was `467` versus canvas `464`. Keyboard focus and focus trapping still passed, but the outer part of the visual outline is clipped.
2. **The controls-inside-canvas contract regex depends on a production comment.** `calculator-contract.test.mjs` uses a non-greedy match ending at `</div>\s*</section>`. The `<!-- /calculator-breakdown -->` comment after the inner breakdown div prevents that regex from stopping at the result section before the close/resize controls. Removing the comment can produce a false test failure even when DOM nesting is unchanged. This is test brittleness, not a browser behavior failure.
3. **`openMedia` still resolves one paint frame before screenshot-stable pixels.** The immediate diagnostic reported `opened: true`, decoded 1536×1024 pixels, and a visible root in `12.7ms`, but its screenshot hash was `741dfe3254eb6efd22a27c04b8f514bb261a40b0dc0fde57f9da0123e1ebd048`. After one `requestAnimationFrame`, the hash was `4d535beb267eeac1f7b72735ac1d55d23b8857979eb1a480f5e80f9a4bff2c44`, exactly matching the later paint-ready approval image. All visual inspection used the paint-ready image, not the immediate diagnostic.

## Console, network, and cleanup

Browser evidence commands:

```bash
PWCLI=/Users/zacharyzink/.codex/skills/playwright/scripts/playwright_cli.sh
"$PWCLI" --session fit-final console warning
"$PWCLI" --session fit-final requests --static
"$PWCLI" --session fit-final close
kill "$(cat /tmp/msfg-fit-http.pid)"
lsof -nP -iTCP:4196 -sTCP:LISTEN
```

- Console: 1 informational deck message, 0 errors, 0 warnings, and 0 unhandled promise rejections.
- Network: all 86 recorded static requests returned HTTP 200, including every local JavaScript, CSS, brand asset, portrait, and all nine presenter PNGs.
- Session: `fit-final` closed successfully.
- Server: owned PID terminated with exit 143 after `SIGTERM`; final listener check found no process on `127.0.0.1:4196`.

## Final controller gate

Commands:

```bash
git diff --check
for file in first-time-homebuyer/deck/content/*.js first-time-homebuyer/deck/js/*.js first-time-homebuyer/deck/tests/fit-browser-audit.js; do node --check "$file"; done
node --no-warnings --test first-time-homebuyer/deck/tests/*.test.mjs
git status --short
```

Result: `git diff --check` and every syntax check passed; the fresh Node run passed 50 of 50 tests with 0 failures, 0 skipped, and 0 cancelled. `git status --short` showed only the intended audit/report plus the pre-existing `.playwright-cli/` and uncommitted screenshot evidence under `first-time-homebuyer/deck/output/`; neither artifact directory is a commit candidate.

## Deployment status

Not deployed. Push, full-site packaging, and Amplify upload each require separate user authorization.
