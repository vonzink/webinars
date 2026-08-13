# Presenter Quick Controls

Date: 2026-08-13
Status: Approved for implementation planning

## Objective

Make the private presenter window faster to operate during any webinar by:

1. keeping the mortgage calculator available as a small icon in the top-right corner;
2. presenting slide-specific educational popouts and optional graphics as two adjacent button columns; and
3. assigning `D` as a fast drawing on/off shortcut.

This is a presenter-interface refinement only. It does not change audience slide content, presenter media ownership, popout content, calculator fields or arithmetic, annotation tools, presentation timing, navigation, PowerPoint output, or deployment state.

## Approaches Considered

### Selected: one visible two-column action library

Place Popouts and Graphics in a shared grid and keep their actions visible. This gives the presenter the shortest scan-and-click path and directly matches the requested side-by-side layout.

### Rejected: retain separate stacked sections

This requires more vertical scanning and makes graphics harder to reach on slides with several popouts.

### Rejected: collapsible drawer or tab switcher

This saves space but adds a click and hides available actions, working against the goal of fast selection during a live presentation.

## Layout and Visual Treatment

### Calculator utility

- Move `#p-calculator` out of the preview control row and into the extreme right of `.p-bar`, after the clocks.
- Render it as a local inline SVG calculator icon with no visible `Show calculator` or `Hide calculator` text.
- Use a `36px × 36px` square hit target with the presenter's existing dark translucent button surface, one-pixel light border, and visible green focus outline.
- The normal state remains visually quiet. When the audience calculator is visible, use the existing green active treatment.
- Keep it present on every slide. It remains private to the presenter window and never appears in audience slide navigation.
- The shared audience deck remains authoritative for visibility. The button synchronizes:
  - hidden: `aria-pressed="false"`, `aria-label="Show calculator"`, `title="Show calculator"`;
  - visible: `aria-pressed="true"`, `aria-label="Hide calculator"`, `title="Hide calculator"`, and `.on`.

### Popout and graphic library

- Replace the separate vertical blocks with one `#p-library-grid` in the right presenter column.
- Put `#p-popout-section` on the left and `#p-media-section` on the right.
- Label the columns `Popouts` and `Graphics`; retain their live counts.
- Render every action as a compact full-width button with equal minimum height, left-aligned label, clear hover state, and visible keyboard focus.
- Use the existing forest, white, and MSFG green palette. No new font, icon library, gradient, animation, or remote asset is introduced.
- At normal presenter widths, the grid uses two equal columns with a compact gap.
- If the current slide has no graphics, hide the graphics column and let Popouts use the full grid width.
- If the current slide has graphics but no educational popouts, keep the Popouts column first with the concise `No popouts on this slide` state so the category ordering does not move during a presentation.
- At a narrow right-column width, stack Popouts first and Graphics second. This affects only the private presenter window.
- Buttons continue to send the existing `open` and `open-media` `BroadcastChannel` messages. Only one audience overlay remains open at a time.

### Drawing shortcut

- Use the unmodified `D` key in the private presenter window to toggle drawing on or off.
- The shortcut calls the same `setAnnOn(!annOn)` path as the visible `Draw: On/Off` button so button state, audience state, auto-off behavior, and synchronization stay consistent.
- Show a small `D` keycap inside the visible drawing toggle to make the shortcut discoverable.
- Accept `d` and `D` through `event.key.toLowerCase() === 'd'`.
- Ignore the shortcut when:
  - focus is in an `input`, `textarea`, `select`, or editable element;
  - `Ctrl`, `Alt`, or `Meta` is held; or
  - the event is an auto-repeat.
- The existing Arrow Left, Arrow Right, and Space navigation shortcuts remain unchanged.
- Pressing `D` while another presenter button has focus is allowed; only text-entry contexts suppress it.

## Architecture and File Boundaries

- `first-time-homebuyer/deck/presenter.html`
  - owns the top-right calculator icon markup;
  - owns the two-column library structure and presenter-only CSS;
  - owns the visible `D` keycap.
- `first-time-homebuyer/deck/js/presenter.js`
  - continues rendering current-slide popout and graphic buttons;
  - synchronizes the calculator icon's accessible state;
  - adds the guarded `D` shortcut through the existing drawing state function.
- `first-time-homebuyer/deck/tests/presenter-contract.test.mjs`
  - locks the icon-only calculator contract, library ordering and responsive structure, equal button treatment, and guarded drawing shortcut.

Do not add a framework, build step, remote dependency, or new shared state mechanism.

## Accessibility and Recovery

- All action buttons remain native keyboard-reachable buttons.
- The calculator's visible icon never carries the accessible name by itself; synchronized `aria-label` and `title` text carry the complete action.
- The active calculator and drawing states remain available through text or `aria-pressed`, color is not the only indicator, and focus remains visible.
- The `D` shortcut never captures characters while the presenter is typing a personal note or editing another field.
- If the audience window closes or the channel has no listener, the presenter remains usable; the controls continue using the existing channel behavior without inventing local audience state.

## Verification

1. Add failing presenter contracts before implementation.
2. Confirm the calculator button contains inline SVG but no visible show/hide text and synchronizes `aria-label`, `title`, `aria-pressed`, and `.on` from audience state.
3. Confirm the calculator icon is the last interactive control in the top presenter bar and remains visible on every slide.
4. Confirm Popouts precedes Graphics in one two-column library at desktop width and stacks in that order at narrow width.
5. Confirm slides with no graphics expand Popouts to the available width, while graphics-only slides retain the concise left-column empty state.
6. Confirm every current popout and registered graphic still renders exactly one button and sends its existing message type and identifier.
7. In a real two-window browser check, press `D` to turn drawing on and press it again to turn drawing off; verify the presenter button and audience annotation state agree.
8. Confirm `D` types normally inside the note field and modified or repeated `D` events do not toggle drawing.
9. Confirm Arrow Left, Arrow Right, and Space still navigate as before.
10. Run the full deck test suite, JavaScript syntax checks, `git diff --check`, and a zero-console-error browser review.
11. Capture a presenter screenshot at desktop width showing the top-right calculator icon and two-column library; verify the narrow stacked layout without changing the audience window.

## Delivery Boundary

- Implement only after this written specification is approved and an implementation plan is reviewed.
- Preserve the heavily modified webinar checkout and all unrelated user work; stage and commit only files explicitly owned by this refinement.
- Do not rebuild the PowerPoint or deploy production as part of this design or implementation unless deployment is separately approved after local verification.

## Non-goals

- No calculator formula or sizing changes.
- No audience navigation icon.
- No new popout or graphic content.
- No simultaneous audience overlays.
- No changes to annotation tools beyond the `D` on/off shortcut and its visible hint.
- No redesign of notes, clocks, preview, fullscreen, slide-navigation visibility, or timer controls.
