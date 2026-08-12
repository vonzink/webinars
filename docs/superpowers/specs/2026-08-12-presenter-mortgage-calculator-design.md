# Presenter-Controlled Mortgage Payment Calculator

Date: 2026-08-12
Status: Approved design, pending specification review

## Objective

Add an always-available calculator control to the private presenter window. The presenter can show or hide a branded mortgage payment calculator on the shared audience screen from any slide. The calculator remains visible across slide changes until the presenter or an audience-window user closes it.

## User Experience

### Presenter window

- Add a compact calculator icon/button to the presenter's persistent tool area so it is available on every slide.
- The button label reflects the audience state:
  - `Show calculator` while hidden;
  - `Hide calculator` while visible.
- Clicking the button sends a visibility request to the shared deck.
- The shared deck owns calculator visibility and broadcasts the resulting state so the presenter label stays synchronized.
- Closing the calculator from the audience window immediately returns the presenter button to `Show calculator`.

### Audience window

- The calculator is absent from the audience slide until the presenter opens it.
- It opens centered in a separate overlay above the current slide.
- It remains open while the presenter changes slides.
- It can be moved by dragging its title bar.
- It can be resized in both dimensions using a visible bottom-right resize handle.
- It can be hidden with its close button, Escape, or a backdrop click.
- Reopening starts centered at the default size but preserves the values entered during the current browser session.
- On narrow screens at or below 560 pixels, it becomes a viewport-fitted sheet and disables drag and resize controls.

## Calculator Content

Adapt the supplied single-file example into the webinar's module and stylesheet structure. Retain these controls and defaults:

- Home price: `$485,000`
- Down payment: `10%`
- Interest rate: `6.375%`
- Term choices: `30`, `25`, `20`, and `15` years, defaulting to `30`
- Property tax: `$4,200 / year`
- Homeowners insurance: `$1,400 / year`
- HOA: `$0 / month`
- Mortgage insurance: `0.5% / year of the loan balance`
- Collapsible `Taxes, insurance, HOA & MI` section
- Estimated monthly total and a line-item breakdown
- Down-payment dollars and estimated loan amount helper text
- The disclosure `Indicative only. Not a commitment to lend.`
- Mountain State Financial Group, LLC and NMLS# 1314257
- The actual Equal Housing Lender image already stored in the deck's brand assets

Remove the example's `Get my real rate` link and do not add another call-to-action.

## Calculation Rules

- Parse each field as a nonnegative decimal value; invalid or empty values behave as zero.
- Clamp the down-payment percentage to the range `0` through `100` for calculation.
- Loan amount equals home price minus the calculated down-payment amount.
- Principal and interest use the standard fixed-rate amortization formula over the selected term.
- A zero interest rate divides the loan balance evenly across the selected monthly term.
- Property tax and homeowners insurance annual values are divided by 12.
- HOA is treated as a monthly value.
- Mortgage insurance equals the entered annual percentage of the loan balance, divided by 12, and appears only when the down payment is below 20%.
- The monthly total is principal and interest plus property tax, homeowners insurance, HOA, and applicable mortgage insurance.
- Display dollar values rounded to the nearest whole dollar with U.S. thousands separators.
- The calculator is illustrative only and must not describe its result as a quote, approval, offer, or commitment.

## Architecture

### Calculator module

Create a focused calculator module separate from `modal.js`. It owns:

- hidden calculator DOM creation;
- calculation state and rendering;
- open, close, drag, resize, centering, and viewport clamping;
- keyboard and focus behavior;
- an `onVisibilityChange(visible)` callback used by the deck channel.

The module exposes a small interface:

```js
initCalculator({ onVisibilityChange })
setCalculatorVisible(visible, opener?)
isCalculatorVisible()
```

The calculator stays independent of the educational modal root. Therefore `show()` continues closing graph and educational popouts on slide changes without closing the calculator.

### Shared deck

`deck.js` initializes the calculator and owns the authoritative visibility state. It handles:

- presenter messages of type `calculator-visibility` with a boolean `visible` value;
- presenter `hello` messages by returning the current calculator state;
- audience-side close callbacks by broadcasting `calculator-state`.

Calculator state is independent of navigation-bar visibility. Closing the presenter restores hidden navigation as before but does not automatically close a calculator already being shown to the audience.

### Presenter window

`presenter.js` adds the persistent show/hide control, sends `calculator-visibility`, and renders `calculator-state`. The presenter's local value is a display cache only; the shared deck remains authoritative.

### Styling

- Create a calculator-specific stylesheet rather than pasting the supplied global embed CSS into `presenter.html` or `index.html`.
- Reuse the deck's existing local Montserrat/Open Sans font setup and Ridgeline color tokens; do not request Google Fonts.
- Use the existing forest, green, white, charcoal, and border palette.
- Default panel width is 560 pixels and its height is limited to the viewport with an internally scrolling body.
- Desktop resizing clamps to a minimum size of 420 by 420 pixels and a maximum that leaves an 8-pixel viewport margin.
- Dragging and resizing must keep the close control reachable.
- The bottom-right resize handle uses the same green visual cue as graph popouts.

## Accessibility and Recovery

- Use `role="dialog"`, `aria-modal="true"`, and a labeled title.
- Move focus to the close button when opened and return focus to the triggering audience element when one exists.
- Trap Tab and Shift+Tab within the open calculator.
- The estimated total uses `aria-live="polite"`.
- Term buttons expose accurate `aria-pressed` values.
- The advanced-fields control exposes `aria-expanded` and `aria-controls`.
- Escape closes the calculator.
- A resize event clamps the panel into the viewport; mobile layout changes clear desktop drag and resize offsets.
- Unknown or malformed presenter messages do not alter calculator state.

## Overlay Interaction

- The calculator may coexist with an educational or graph popout because it is a separate global tool.
- A subsequently opened educational popout appears above the calculator so the most recent presenter action is visible.
- Opening or closing an educational popout does not erase calculator values.
- The presenter can hide the calculator while another popout is open.

## Verification

Use test-first implementation and real two-window browser verification:

1. Add failing unit tests for payment math, zero interest, mortgage-insurance threshold, input clamping, and money formatting.
2. Add failing contract tests for the persistent presenter control and calculator message names.
3. Implement only enough calculator state and rendering to make each test pass.
4. Verify the presenter control appears on every slide and is absent from the audience controls.
5. Open the calculator from the presenter and verify the audience dialog shows the approved default values and total breakdown.
6. Change inputs and terms and verify calculated values update.
7. Advance and reverse slides while the calculator remains visible.
8. Drag and resize the calculator, including shrinking to the 420-by-420 minimum and expanding toward viewport limits.
9. Close from the audience and verify the presenter button synchronizes to `Show calculator`.
10. Reopen and verify the previously entered values remain.
11. Hide from the presenter and verify the audience overlay closes.
12. Verify Escape, backdrop closing, focus trapping, and focus restoration.
13. Verify ordinary graph and educational popouts still close on slide changes while the calculator remains open.
14. Run the full deck test suite, JavaScript syntax checks, `git diff --check`, and browser console review.
15. Visually inspect the calculator at 1280-by-720 and 1920-by-1080 audience sizes.

## Non-goals

- No CTA, lead form, rate quote, amortization schedule, affordability approval, or data submission.
- No network requests or external font dependencies.
- No persistence across a browser refresh or separate webinar session.
- No PowerPoint version of the interactive calculator.
- No deployment or replacement of production webinar assets.
- No redesign of existing slides, graphs, educational popouts, or presenter annotation tools.
