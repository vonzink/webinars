# Presenter Overlay Fit and Notes Refinement

Date: 2026-08-12
Status: Approved design, pending written-specification review

## Objective

Refine the private presenter window and its audience overlays so graphs, educational popouts, and the mortgage calculator always remain fully visible and resize proportionally. The same change makes the presenter controls more compact and turns personal notes into an unobtrusive extension of the slide's speaker notes.

This specification overrides only the affected presentation details in:

- `2026-08-12-presenter-graph-library-design.md`;
- `2026-08-12-slide-3-presenter-graphs-design.md`;
- `2026-08-12-presenter-mortgage-calculator-design.md`.

All previously approved content, synchronization, accessibility, recovery, calculator arithmetic, graph ownership, and deployment boundaries remain in force unless explicitly changed below.

## Approved Presenter Layout

### Popouts and graphs

- Place the educational-popout list and graph list inside one presenter-only two-column tool region.
- Educational popouts occupy the left column.
- Graphs occupy the right column.
- Both columns use the same compact button height, spacing, and heading scale.
- When the current slide has no graphs, hide the empty graph column and let the popout column use the available width.
- When the current slide has graphs but no educational popouts, retain the left/right ordering and show the existing concise empty state in the left column.
- At narrow presenter widths, stack the columns with educational popouts first and graphs second. The audience window is unaffected.

### Calculator control

- Replace the visible `Show calculator` / `Hide calculator` text button with one persistent icon-only calculator button.
- Use an inline local icon; do not add an icon library or network request.
- The shared deck remains the authority for calculator visibility.
- Hidden state uses `aria-pressed="false"`, `aria-label="Show calculator"`, and matching `title` text.
- Visible state uses `aria-pressed="true"`, `aria-label="Hide calculator"`, matching `title` text, and the existing active green treatment.
- The icon remains available on every slide and never appears in the audience navigation.

## Shared Proportional-Fit Model

Graphs, educational popouts, and the calculator use one geometry contract even though graphs and educational popouts share `modal.js` while the calculator remains an independent module.

Each overlay has:

- an intrinsic content width and height;
- one current scale factor;
- one aspect ratio derived from its current intrinsic dimensions;
- a `16px` viewport safety margin;
- a centered initial position;
- a nominal minimum scale of `0.35` that yields to the fit scale when a smaller viewport requires it for full visibility.

The fit calculation is:

```text
availableWidth  = viewportWidth  - (2 × safetyMargin)
availableHeight = viewportHeight - (2 × safetyMargin)
fitScale        = min(1, availableWidth / intrinsicWidth, availableHeight / intrinsicHeight)
renderedWidth   = intrinsicWidth  × fitScale
renderedHeight  = intrinsicHeight × fitScale
```

Opening an overlay chooses the largest scale at or below `1` that keeps the complete overlay inside the viewport. No overlay opens larger than its authored size merely because the viewport is large.

### Manual resizing

- Resizing from the bottom-right handle changes a single scale value, not width and height independently.
- Pointer movement is projected onto the overlay's current aspect ratio so the rendered width and height always change proportionally.
- Resize bounds are calculated from the overlay's current top-left position and the viewport safety margin.
- The overlay never becomes larger than the remaining viewport or smaller than its minimum usable scale.
- Dragging changes position without changing scale.
- Dragging and resizing clamp the complete rendered rectangle inside the viewport, keeping close and resize controls reachable.
- A browser resize recomputes the maximum valid scale and position. An overlay shrinks automatically when required; it does not crop or add internal scrollbars.

### Content interaction while scaled

- Scale the complete visual canvas, including typography, form controls, buttons, disclosures, and graphics.
- Preserve pointer, keyboard, focus, and form-input behavior at every supported scale.
- Focus outlines and close/resize controls must remain visible.
- Do not use browser zoom or change the audience slide's own scale.
- Do not introduce content-specific scroll regions as a fallback for an undersized overlay.

## Graph Popouts

- Derive a graph's intrinsic aspect ratio from the decoded image's `naturalWidth` and `naturalHeight`.
- Do not show the current `Presenter graph` eyebrow, large title, accent bar, footer, or padded white content card.
- The decoded graph fills the intrinsic canvas with `object-fit: contain`; the graph is never cropped or distorted.
- Give the dialog an accessible name from the graph registry without relying on a visible heading.
- Place a small high-contrast close icon over the top-right corner and the existing green proportional resize affordance over the bottom-right corner; each control keeps at least a `36px × 36px` hit target.
- Allow dragging from the graph surface except when the pointer originates on the close or resize control. Disable native image dragging.
- Keep a quiet background only where the graph's aspect ratio leaves unavoidable space.
- If image decoding fails, replace the canvas content with the existing accessible `Graph unavailable` state using the same fitted geometry.
- Advancing away from the graph's owning slide continues to close it.

## Educational Popouts

- Preserve their approved content, Ridgeline header, close control, comparison tables, section hierarchy, and modal behavior.
- Use the existing authored width as the intrinsic width: `1200px` for a standard popout and `1500px` for a wide comparison popout.
- Measure the complete rendered popout at that authored width, including header, body, notes, tables, and footer, before calculating its intrinsic height.
- Fit and scale the entire popout as one canvas so the header and last line of content are simultaneously visible.
- Remove internal vertical scrolling from the fitted presentation state.
- Preserve the authored content aspect ratio during manual resizing.
- If content changes before a popout opens, measure the current rendered content rather than relying on a hard-coded height.

## Mortgage Calculator

- Preserve the approved calculator fields, defaults, calculations, disclosure, company identity, accessibility semantics, and presenter/audience synchronization.
- Treat the complete calculator as one proportional canvas rather than a resizable panel with an internally scrolling body.
- Its intrinsic width remains `560px`; intrinsic height is measured from the complete current content.
- The initial fit must show the calculator title, all currently expanded fields, result, disclosure, company identity, and Equal Housing Lender mark at the same time.
- Expanding or collapsing `Taxes, insurance, HOA & MI` remeasures the intrinsic height, preserves the top-left location when possible, and refits the calculator inside the viewport.
- Manual resizing keeps the current intrinsic aspect ratio.
- Reopening continues to preserve entered values and recent expanded/collapsed state while returning to a centered fitted size.
- At narrow widths, use the same scale-to-fit behavior. Do not switch to the previous scrolling sheet treatment.

## Presenter Notes

### Reference-first structure

- Replace the separate `Speaker notes` and `My notes — this slide` management blocks with one `Notes for this slide` reference area.
- Render the authored speaker notes first using their existing readable presentation typography.
- Render the presenter's saved notes immediately below as additional note paragraphs rather than large cards.
- Preserve the current per-slide `localStorage` model and key format, `msfg-notes:${slideId}`. Do not add a backend, synchronization service, user account, timestamps, or author metadata.
- A slide with no saved personal notes simply shows the authored speaker notes; do not give the empty state the visual weight of a content card.

### Compact actions

- Each saved note has a small trailing pencil icon and trash icon.
- Both controls are icon-only, keyboard reachable, and provide explicit `aria-label` and `title` text that includes the action.
- The calculator, pencil, and trash icon buttons use a minimum `32px × 32px` pointer target without growing into text-style controls.
- Edit changes only the selected personal note. An empty saved edit removes that note, preserving the current behavior.
- Delete remains scoped to the selected personal note.
- Use an unobtrusive compact add-note row below the reference notes. The input and save action must not compete visually with the notes being read during the presentation.
- Keep the existing browser-local persistence and immediate rendering after add, edit, or delete.

## Architecture and File Boundaries

- Add a small shared geometry module under `first-time-homebuyer/deck/js/` for pure fit, resize, and clamp calculations.
- `modal.js` consumes the geometry module for graph and educational-popout fitting but continues to own modal content, focus management, opening, and closing.
- `calculator.js` consumes the same geometry module while retaining independent visibility, values, calculations, focus trap, and channel synchronization.
- `components.css` owns the educational and graph visual canvases and their scaled-shell treatments.
- `calculator.css` owns calculator-specific intrinsic layout and scaled-shell treatment.
- `presenter.html` owns presenter layout and compact-control styling.
- `presenter.js` continues to render slide-specific controls and local notes, with state-dependent accessible labels for icon actions.
- Do not move presenter styles into the audience stylesheet or add a framework, build step, third-party resize package, icon library, or remote asset.

## Error and Recovery Behavior

- Invalid or non-finite geometry input falls back to a centered fit using the overlay's known authored dimensions; it must not produce `NaN`, negative sizes, or an unreachable panel.
- A viewport too small for the nominal minimum scale uses the largest scale that fits the safety margins. Full visibility takes priority over the nominal minimum.
- A failed graph retains its accessible error state and close control.
- An expanded calculator always refits; it never pushes the footer or close control off screen.
- Corrupted or unavailable personal-note storage falls back to an empty personal-note list without hiding the authored speaker notes.
- Existing Escape, backdrop-close, focus restoration, unknown-media rejection, and calculator-state recovery continue to work.

## Verification

Use test-first implementation plus real two-window browser checks.

1. Add unit tests for fit scale, proportional resize, viewport clamping, intrinsic-size changes, invalid input, and viewports smaller than the nominal minimum.
2. Update presenter contract tests to require an icon-only calculator button with synchronized `aria-label`, `title`, `aria-pressed`, and active state.
3. Add presenter contract tests for the left popout/right graph wrapper, responsive stacking rule, unified notes region, and icon-only edit/delete actions.
4. Add modal contracts that graph popouts omit the large visible header and expose an accessible dialog name.
5. Verify every registered graph decodes, opens at its natural aspect ratio, remains fully visible, resizes proportionally, drags within bounds, and closes correctly.
6. Verify representative short, long, and comparison educational popouts show their first and last content simultaneously with no internal scrollbar at `1920×1080`, `1280×720`, and `1024×768`.
7. Verify the calculator is fully visible in collapsed and expanded states, remains interactive when scaled, preserves values, and resizes proportionally at the same viewports plus a `390×844` narrow viewport.
8. Resize the audience browser while each overlay is open and assert its full bounding rectangle remains inside the safety margins.
9. Verify Tab order, focus trap, Escape, backdrop close, focus restoration, pointer input, and visible focus at scaled sizes.
10. Verify the presenter shows educational popouts on the left and graphs on the right at desktop width, then stacks them in that order at narrow width.
11. Verify authored and personal notes read as one reference area while add, pencil, and trash controls remain accessible and per-slide persistence is unchanged.
12. Run the complete deck test suite, JavaScript syntax checks, `git diff --check`, and console-error review.

## Delivery Boundary

- Implement and verify in the current local webinar source only after the written specification and implementation plan are approved.
- Use subagent-driven development with a fresh implementer and independent review for each implementation task.
- Preserve all unrelated dirty files and the user's ongoing graph, calculator, slide, presenter, and asset changes.
- Do not rebuild the PowerPoint or deploy production as part of this refinement unless the user separately approves deployment after the verified local preview.

## Non-goals

- No change to slide content, graph image content, calculator formulas, presenter identities, annotations, clocks, navigation, or fullscreen behavior.
- No simultaneous display of multiple audience overlays; “side by side” applies to the private presenter control lists.
- No graph title card, graph carousel, thumbnail browser, note sharing, note export, or PowerPoint speaker-note integration.
- No freeform width/height resizing that distorts an overlay.
- No internal scrollbar as the normal presentation treatment for graphs, popouts, or the calculator.
