# Slide 3 Renting vs. Buying Presenter Graphs

Date: 2026-08-12
Status: Approved design, pending specification review

## Objective

Add two presenter-only supporting graphs to the new Slide 3, `budget-rent-buy`, while keeping the existing Rent vs. Buy graph available on Slide 2. Update Slide 3's renting and buying bullets without reintroducing inline bold formatting.

## Presenter Graphs

- Preserve all five existing Slide 2 presenter graph options, including `Rent vs. Buy`.
- Copy the two newly supplied PNG files into `first-time-homebuyer/deck/assets/presenter/slide-03/` using web-safe filenames:
  - `denver-rent-trends.png`, copied exactly from `Denver Housing Market Slide.png`;
  - `renting-vs-buying-wealth.png`, copied exactly from `image4.png`.
- Register both images against Slide 3's stable slide ID, `budget-rent-buy`.
- Show these presenter labels while Slide 3 is current:
  - `Denver Rent Trends`;
  - `Renting vs. Buying Wealth`.
- Keep the images inaccessible from the audience slide until the presenter chooses one.
- Reuse the existing `open-media` data flow and draggable, resizable audience-window popout without adding a carousel, thumbnails, or new modal behavior.
- Use descriptive alternative text for both images.

## Slide Copy

Replace the third Renting bullet:

- From: `The longer you wait, the further ahead prices get`
- To: `The longer you wait, the more expensive buying becomes.`

Add this fourth Buying bullet:

- `You can personalize the home to fit your style and needs.`

Both sentences remain plain bullet text with no `<strong>` markup. Existing titles and comparison-column headings retain their CSS-based bold styling.

Mirror the two bullet changes in `first-time-homebuyer/deck/build_pptx.py` so future PowerPoint regeneration uses the current approved copy. The presenter-only graph images remain an HTML presenter feature and are not inserted into the generated PowerPoint.

## Data and File Boundaries

- Extend the existing presenter-media registry rather than adding slide-specific event handlers.
- Use distinct Slide 3 media IDs so Slide 2's existing Rent vs. Buy entry remains unchanged.
- Copy the user's supplied files byte-for-byte; do not recompress, crop, recolor, or reconstruct them.
- Preserve unrelated dirty worktree changes.

## Error Behavior

Existing presenter-media behavior remains authoritative:

- unknown media IDs are rejected;
- a failed image load shows `Graph unavailable`;
- media popouts close when the slide changes;
- closing the presenter restores audience navigation if it was hidden.

## Verification

1. Add a failing registry test proving Slide 2 still has five graphs and Slide 3 requires exactly the two approved graph entries.
2. Add a failing copy test for the exact updated Renting bullet and new Buying bullet.
3. Copy the supplied PNGs and verify each destination is byte-identical to its Desktop source.
4. Run the registry and copy tests green, followed by the full deck test suite and JavaScript syntax checks.
5. Open the real audience and presenter windows, navigate to Slide 3, and verify only the presenter exposes the two graph buttons.
6. Open both graphs and confirm each image decodes in the existing draggable and resizable audience popout.
7. Confirm Slide 2 still exposes its original five graph options.
8. Confirm the new Slide 3 bullet text renders without descendant `<strong>` elements.
9. Run a temporary PowerPoint build and verify it still produces 16 main slides plus 30 educational popouts.
10. Run `git diff --check` and review the browser console for product errors or warnings.

## Non-goals

- Do not remove the Rent vs. Buy graph from Slide 2.
- Do not place either graph directly on Slide 3.
- Do not change the graph-popout interaction or navigation-visibility feature.
- Do not rebuild or publish the repository's downloadable PowerPoint.
- Do not deploy the webinar.
