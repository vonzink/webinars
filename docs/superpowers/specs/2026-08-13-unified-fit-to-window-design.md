# Unified Fit-to-Window Rendering Design

**Status:** Approved design, awaiting written-spec review

**Date:** 2026-08-13

**Scope:** `first-time-homebuyer/deck`

## Purpose

Every slide, calculator, educational popout, presenter graphic, and other
presentation-style panel must remain visible as one complete visual composition.
When available space shrinks, the composition scales down uniformly. Its internal
layout does not wrap, reflow, scroll, or crop merely because the viewport is
smaller.

The governing rule is:

> Full picture first. Scale to fit. No internal scrollbars. No accidental wrapping.

## Rendering Contract

Each composed surface has:

1. a viewport shell that owns available screen space and clips nothing required
   by the composition;
2. an intrinsic design surface with stable authored width and height; and
3. one uniform scale calculated as:

```text
scale = min(
  availableWidth / designWidth,
  availableHeight / designHeight,
  1
)
```

The scale applies to the complete surface. Fonts, buttons, inputs, borders,
spacing, images, and decoration scale together. The implementation does not
upscale above the authored size.

The rendered surface is centered by default. Dragging may change its position,
but clamping must keep the complete scaled rectangle inside the viewport margin.
Manual resize changes only the uniform scale. It must not assign an independent
width and height or trigger internal reflow.

## Included Surfaces

The contract applies to all current composed surfaces:

- the base 1920 by 1080 webinar slide;
- the mortgage payment calculator in collapsed and expanded states;
- all 30 educational modal popouts;
- all nine presenter graphics;
- comparison/table popouts if table content is added later;
- future calculator, diagram, or presentation-style panels registered through
  the same overlay system.

Normal presenter-control page scrolling is outside this contract. The presenter
dashboard is an application workspace, not a single composed visual surface.

## Architecture

### Shared fit engine

`overlay-geometry.js` remains the single geometry authority and is generalized
into a shared fit engine. It receives intrinsic dimensions, available dimensions,
viewport margins, prior position, and an optional requested scale. It returns:

- intrinsic width and height;
- uniform scale;
- rendered width and height; and
- clamped screen-space left and top coordinates.

The fit engine has no knowledge of calculator fields, modal content, or images.
It only enforces geometry invariants.

### Surface controller

Each surface controller supplies a stable intrinsic size and applies the returned
geometry to a shell and design surface:

```text
viewport shell
  -> positioned rendered bounds
     -> fixed-size design surface
        -> transform: scale(uniformScale)
```

The shell represents the scaled screen-space rectangle. The design surface keeps
its authored dimensions. This separates transformed visual size from layout size
and makes drag, focus, hit testing, and resize calculations predictable.

A `ResizeObserver` watches the relevant viewport shell. Window resize remains a
fallback. Updates are coalesced through one animation frame so measurement and
style application do not loop.

### Stable authored dimensions

Intrinsic dimensions are explicit rather than derived from a layout that has
already wrapped to the current viewport.

- Base slide: 1920 by 1080.
- Calculator: fixed width plus one explicit collapsed height and one explicit
  expanded height. Toggling advanced fields changes the authored state, then
  refits the complete new surface.
- Educational popouts: a standard authored canvas and a wide authored canvas.
  Content is laid out inside that canvas at desktop proportions.
- Graphics: native decoded image dimensions define the design surface.

If a future surface cannot fit its authored content at scale 1, that is a content
or design defect. Internal scrolling is not an accepted fallback.

## Base Slide Behavior

The existing under-900px flowing mobile layout is removed. The stage remains a
fixed viewport on every screen size, and the 1920 by 1080 slide always uses the
same contain calculation.

All slide internals retain their authored desktop layout. Navigation, annotation,
modal opening, presenter synchronization, and fullscreen behavior remain intact.
No slide breakpoint may convert the composition into a vertically flowing page.

## Calculator Behavior

The calculator remains draggable, resizable, interactive, focus-trapped, and
synchronized with the presenter window.

- The complete drag bar, form, result, footer, close control, and resize control
  remain visible.
- Collapsed and expanded modes each use an explicit authored height.
- Opening or toggling advanced fields performs a fresh contain fit.
- Input values and calculation logic are unchanged.
- The two-column field layout and term row remain stable on narrow screens.
- No internal element uses `overflow: auto`, `overflow: scroll`, or viewport-based
  wrapping as a fit strategy.
- Manual resize projects pointer movement onto one scale value and preserves the
  authored aspect ratio for the active calculator state.

## Educational Popout Behavior

Educational modal content is wrapped in a fixed-size design surface. Header,
body, footer, close control, and resize control participate in the same visual
composition and scale together.

- Standard popouts use one standard design canvas.
- Any dense or tabular popout uses the wide design canvas.
- The existing mobile typography and padding overrides are removed for popouts.
- Modal bodies and table wrappers do not scroll internally.
- Text wrapping is determined by the authored canvas width, not by viewport width.
- Content remains draggable and resizable through uniform scaling.
- Escape, backdrop close, focus trap, and focus return remain unchanged.

The title treatment may stay visually compact, but its size is part of the
authored surface rather than a responsive exception.

## Graphic Behavior

Each graphic uses its decoded native dimensions as the intrinsic surface. The
image and its complete pixels are rendered as one object with contain behavior.
No header or body region is allowed to consume enough space to crop the image.

The close and resize controls remain available and are included in the composed
surface contract. The graphic never gains an internal scrollbar. Failure to
decode an image shows a fixed authored error surface that follows the same fit
rules.

## Interaction and Accessibility

Scaling must not replace or duplicate interactive DOM. Inputs and buttons remain
real focusable elements inside the transformed surface.

- Focus order follows DOM order.
- Visible focus indicators scale with the surface.
- Close controls remain keyboard accessible.
- Drag handles do not start a drag from interactive descendants.
- Resize handles are buttons with accessible labels.
- Escape closes the active surface.
- Tab remains trapped within modal and calculator dialogs.
- Focus returns to the opener after close.
- Reduced-motion preference removes decorative transitions but does not alter
  geometry or visibility.

At very small viewports the surface may become visually small. Complete visibility
has priority over minimum rendered font size until a separately designed mobile
composition is explicitly approved.

## Overflow Rules

Composed viewport shells and design surfaces must not expose horizontal or
vertical scrollbars as a size fallback.

Forbidden inside covered surfaces:

- `overflow: auto`;
- `overflow: scroll`;
- a fixed or viewport-relative shell height paired with a scrolling body;
- independent width and height resize that changes proportions;
- responsive stacking or wrapping triggered only by viewport width;
- clipping or cropping required content.

`overflow: hidden` is allowed only on a viewport shell or design surface after
tests prove the scaled content fits fully within it. It must not hide content that
exceeds the authored surface.

## Error Handling

- Invalid or missing intrinsic dimensions use an explicit per-surface fallback.
- A surface without valid intrinsic dimensions or fallback does not open and logs
  a clear warning.
- Image decode failure switches to the fixed error surface.
- ResizeObserver callbacks are ignored after close and stale animation-frame work
  is token-guarded.
- Geometry never produces `NaN`, infinity, negative dimensions, or a scale above
  1.

## Verification

Automated geometry tests must prove:

- exact contain scaling by width and by height;
- no upscaling;
- tiny viewports can scale below the nominal manual-resize minimum;
- dragged surfaces are clamped fully into view;
- manual resize preserves one scale and the authored aspect ratio;
- invalid dimensions follow the declared fallback behavior.

Contract tests must prove:

- the under-900px slide reflow path is absent;
- no covered component contains `overflow: auto` or `overflow: scroll`;
- calculator collapsed and expanded authored dimensions are explicit;
- educational modal and graphic surfaces use the shared fit engine;
- no mobile breakpoint changes covered internal layouts;
- close and resize controls remain accessible;
- existing presenter synchronization messages remain unchanged.

Real-browser verification must exercise at minimum:

- 1920 by 1080 and 1280 by 720 desktop viewports;
- 480 by 800 portrait mobile;
- 800 by 480 short landscape;
- a narrower and shorter viewport than every intrinsic surface;
- the base slide, collapsed calculator, expanded calculator, every educational
  popout, all nine graphics, drag, manual resize, fullscreen, and presenter-opened
  surfaces.

For every covered surface, validation records:

- rendered rectangle is fully inside the available viewport margin;
- `scrollWidth <= clientWidth` and `scrollHeight <= clientHeight` for the viewport
  shell and design surface, with a one-pixel rounding tolerance;
- no descendant creates an internal scroll container;
- the complete visual content remains visible in screenshots;
- console contains no errors or unhandled promise rejections.

## Preservation Boundary

This work changes only fit and responsive behavior. It preserves:

- webinar wording, ordering, branding, and slide content;
- calculator formulas, defaults, values, and result rendering;
- presenter controls and two-column library;
- drawing shortcuts and annotation behavior;
- BroadcastChannel payloads;
- drag, resize, close, focus, navigation, and fullscreen behavior;
- all current graphics and downloadable files.

Deployment remains a separate, explicitly approved step after implementation and
browser verification.
