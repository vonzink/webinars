# Presenter Graph Library and Slide Copy Cleanup

Date: 2026-08-12
Status: Approved design, pending implementation

## Objective

Give the private presenter window access to five supporting graphs for Slide 2 without adding graph controls to the audience-facing slide. A presenter can open any graph over the shared slide in the existing draggable and resizable popout system. The same change adds a private navigation-visibility control and applies the requested copy and bullet-emphasis corrections.

## Scope

### Presenter-only Slide 2 graph library

- Copy the five supplied PNG files into `first-time-homebuyer/deck/assets/presenter/slide-02/` using web-safe filenames:
  - `fha-buyers.png`
  - `down-payment-ranges.png`
  - `credit-score.png`
  - `rent-vs-buy.png`
  - `lowest-rate.png`
- Add a small data registry that maps the Slide 2 ID (`myths`) to these images, titles, and descriptive alternative text.
- Show a `Slide 2 graphs` section in `presenter.html` only while Slide 2 is current.
- Do not place graph buttons, thumbnails, or other graph affordances on the shared slide.
- Clicking a presenter graph button sends an `open-media` message to the shared deck.
- The shared deck opens the graph in the existing modal root with:
  - a title bar;
  - a close button;
  - drag support through the title bar;
  - resize support through the existing corner handle;
  - aspect-ratio-preserving `object-fit: contain` image display;
  - accessible dialog and image labels.
- The graph closes when its audience-window close button is used or the presenter advances away from Slide 2.
- Existing educational popouts continue to render and behave as they do now.

### Private navigation visibility control

- Add a presenter-only toggle labeled `Slide navigation: Shown` or `Slide navigation: Hidden`.
- The toggle hides only the audience deck's bottom navigation bar. It does not hide the progress indicator, slide content, annotations, or modal controls.
- The main deck owns the visibility state and broadcasts the resulting state back to the presenter so the label remains accurate.
- Navigation must restore automatically when the presenter window closes.
- Recovery uses three layers:
  1. the presenter sends an explicit restore message during `pagehide` and `beforeunload`;
  2. the presenter calls a same-origin restore function on `window.opener` when available;
  3. while navigation is hidden, the main deck checks its retained presenter-window reference every 500 milliseconds and restores navigation as soon as `presenterWindow.closed` becomes true.
- Pressing `P` in the shared deck remains available even while navigation is hidden.

### Copy and emphasis corrections

- In the first `You need 20% down` popout, change the note to:
  - `Mortgage insurance on a conventional loan is removable.`
- Change:
  - `The lowest rate and the lowest cost are frequently not the same loan`
  - to `The lowest rate and the lowest cost are never the same loan`.
- Add this item to `Pros of a lower rate` without inline bold styling:
  - `The benefit of a lower Rate is lower payment.`
- Remove `<strong>` emphasis from all rendered bullet sentences in:
  - main-slide `points` lists;
  - comparison-panel item lists;
  - modal section item lists.
- Keep slide titles, card titles, modal titles, and modal section headings bold through their existing CSS classes.
- Do not remove intentional emphasis from non-bullet comparison-table values unless it is necessary to satisfy the rendered bullet rule.
- Mirror the copy and bullet-emphasis changes in `build_pptx.py` so a future PowerPoint regeneration does not restore the superseded wording. Do not rebuild the PowerPoint in this task.

## Architecture

### Data

Create a focused presenter-media registry rather than embedding file paths in presenter event handlers. The registry is the source of truth for media ID, owning slide ID, title, source path, and alternative text.

### Presenter window

`presenter.js` renders graph buttons from the registry for the current slide. It sends only stable media IDs over the existing `BroadcastChannel`. It also owns the user-facing navigation toggle, while treating the main deck's broadcast state as authoritative.

### Shared deck

`deck.js` validates media IDs against the registry, opens the corresponding media popout, owns navigation visibility, and performs close-window recovery. The existing modal module owns graph presentation, focus management, dragging, resizing, and closing.

### Styling

Reuse the Ridgeline modal colors, square geometry, title treatment, and green resize affordance. The media body is a quiet white canvas so the supplied graphs remain the visual focus. No new decorative design language is introduced.

## Error and Recovery Behavior

- An unknown media ID is ignored with a console warning; no arbitrary path is rendered.
- A failed image load shows a plain `Graph unavailable` message inside the popout rather than a broken-image icon.
- Closing or reloading the presenter restores the audience navigation bar.
- If the presenter closes while a graph is open, navigation restores but the graph remains visible until the audience closes it or the slide changes. This avoids unexpectedly removing material the audience is currently discussing.
- Advancing away from Slide 2 closes a Slide 2 graph.

## Verification

Use red-green browser assertions against the real two-window workflow:

1. Before implementation, verify that Slide 2 has no presenter graph controls, media messages do not open a graph, and no navigation-visibility control exists.
2. After implementation, open the presenter through the shared deck and verify all five Slide 2 buttons exist only in the presenter.
3. Open each graph and verify the shared deck displays the correct decoded PNG in an accessible dialog.
4. Drag and resize at least one graph and verify its bounding box changes while remaining usable.
5. Advance away from Slide 2 and verify the graph closes.
6. Hide navigation, close the presenter, and verify navigation reappears automatically.
7. Verify rendered bullet lists contain no descendant `<strong>` elements while titles and section headings remain bold.
8. Verify the three requested text changes exactly.
9. Run JavaScript syntax checks, SVG/XML checks for existing changed assets, `git diff --check`, and browser console review.
10. Visually inspect the presenter and graph popout at laptop and 1920x1080 presentation sizes.

## Non-goals

- No graph access from cards or controls on the audience slide.
- No graph editor, upload UI, slideshow carousel, or persistent graph positioning.
- No deployment, PowerPoint rebuild, or unrelated slide redesign.
- No reconstruction of the user's ongoing Slide 3 removal.
