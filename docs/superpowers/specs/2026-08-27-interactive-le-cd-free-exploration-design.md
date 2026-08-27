# Interactive Loan Estimate and Closing Disclosure Free-Exploration Webinar

Date: 2026-08-27
Status: Approved design; ready for implementation planning
Target: `cd-webinar/`

## Decision Record

This specification supersedes the experience and implementation direction in
`2026-08-12-decoding-le-cd-webinar-design.md` for the first release of the
LE/CD webinar. The earlier document proposed reconstructed forms, scenario
controls, calculated variants, and guided previous/next teaching paths. The
approved first release is intentionally smaller: it presents one matched pair
of official CFPB sample disclosures and lets the learner freely choose any page
and click any available item in any order.

The experience is educational. It is not a loan quote, calculator, compliance
determination, or individualized legal, tax, or financial advice.

## Objective

Build an interactive webinar-style document viewer that helps a borrower
understand a Loan Estimate (LE) and Closing Disclosure (CD). The learner can
open any of the three LE pages or five CD pages, then click a fee, label, amount,
or other important field to read approximately one paragraph explaining what
it means and why it is needed in the mortgage process.

The disclosure is the primary visual subject. The interface should feel like a
quiet educational layer around a real form, not like a slide course or a form
that the learner is expected to complete.

## Source Documents

The first release uses the supplied, matched CFPB fixed-rate purchase samples:

- Loan Estimate: `cd-webinar/CD Webinar/201403_cfpb_loan-estimate_fixed-rate-loan-sample-H24B.pdf`
- Closing Disclosure: `cd-webinar/CD Webinar/201403_cfpb_closing-disclosure_cover-H25B.pdf`

These documents use the same fictional Ficus Bank transaction and therefore
provide a coherent LE-to-CD teaching example. The PDF cover sheets are source
context, not learner-facing disclosure pages. The viewer exposes the three
actual LE form pages and five actual CD form pages.

The implementation renders each disclosure page as a high-resolution image
derived from the supplied PDF. It does not rebuild or restyle the standardized
form as HTML. This preserves the real form's proportions, typography, labels,
and sample amounts while allowing a separate accessible interaction layer.

## Approved Experience

### Free exploration

The learner may select any LE or CD page directly and in any order. There is no
required sequence, completion percentage, locked content, previous/next lesson
flow, or presenter-controlled progression.

The default state opens Loan Estimate Page 1 with no field selected. Selecting
a page replaces the center document immediately. Switching pages clears the
current field selection so an explanation from the old page is never shown
beside a different page.

### Page layout

On desktop and presentation-sized screens, the experience contains:

1. a compact header identifying the webinar and current document;
2. a left navigator listing Loan Estimate Pages 1-3 and Closing Disclosure
   Pages 1-5, with direct access to every page;
3. a center document stage containing the selected disclosure page; and
4. a right explanation panel for the selected item.

The disclosure remains clean by default. Interactive regions do not receive
always-visible dots, pins, badges, or colored boxes. A region receives a soft
MSFG-green outline only while it is hovered, keyboard-focused, or selected.
The selected state also receives a non-color indicator so meaning does not rely
on color alone.

### Item interaction

Every populated fee line and every important teaching field should be
selectable. When a label and its displayed amount represent the same item, both
activate the same explanation. Examples include Interest Rate, Loan Amount,
Estimated Total Payment, Origination Charges, Appraisal Fee, Prepaids, Initial
Escrow Payment, Lender Credits, Cash to Close, and the CD's final loan and cost
figures.

Hovering or focusing previews the region with a restrained outline. Clicking,
tapping, or pressing Enter/Space selects it and opens its explanation. Selecting
a different item replaces the current explanation; explanations do not stack.
Escape closes the explanation and returns keyboard focus to the selected
region.

Each learner-facing explanation contains:

- the form label as its title;
- approximately one plain-English paragraph describing what the item is, why
  it appears in the loan process, and what the borrower should understand;
- an optional short comparison or borrower question only when it adds material
  teaching value; and
- no individualized judgment about whether the sample amount is appropriate.

Internal source links, reviewer notes, and approval status belong in the content
data but do not clutter the learner-facing paragraph.

## Rendering Architecture

### Exact page imagery

Each learner-facing form page is exported from its source PDF at sufficient
resolution to remain sharp at the maximum supported zoom. The source PDF stays
in the repository as the visual authority. Generated page images are treated as
build assets and must retain a traceable mapping to the PDF and page number.

### Coordinate-based hotspots

An interaction layer sits directly above the image. Each hotspot stores its
bounds as page-relative normalized coordinates rather than fixed screen pixels:

```text
x, y, width, height in the range 0 through 1
```

The image and hotspot layer share one scaling and positioning container. Fit,
zoom, and responsive resizing therefore transform them together and prevent
coordinate drift.

Hotspot definitions are data, not individually hard-coded DOM behavior. Each
record includes at minimum:

```text
id
document type
page number
reading-order index
normalized bounds
visible field value, when applicable
explanation content ID
accessible label
source/review metadata
```

Stable IDs may map corresponding LE and CD concepts for future comparison, but
the first release does not require an automated comparison workflow.

### Content separation

Page metadata, hotspot coordinates, and educational copy remain separate from
the viewer and interaction code. Updating an explanation or adjusting one
hotspot must not require editing navigation or rendering logic.

The first release is a static client-side experience inside `cd-webinar/`. It
does not require a backend, database, login, account, upload flow, analytics,
cookies, or persistence.

## Component Responsibilities

### Document catalog

Defines the two documents, their page images, page titles, thumbnails, source
PDF references, and optional short page-topic summaries.

### Page navigator

Shows all eight form pages and the current selection. It changes pages directly
without implying order or completion.

### Page viewer

Displays one exact form page, maintains fit and zoom state, and provides the
common coordinate space used by the image and hotspot layer.

### Hotspot registry

Provides the normalized position, reading order, accessible label, and content
mapping for each interactive field on each page.

### Interaction layer

Creates real button targets from the active page's hotspot data. It controls
hover, focus, selection, keyboard activation, and dismissal without modifying
the underlying disclosure image.

### Explanation panel

Displays the selected item's title and approved paragraph. It is a stable right
panel on wider screens and a dismissible bottom sheet on narrow screens.

## Responsive and Zoom Behavior

On wide screens, the navigator, document, and explanation panel remain visible
as three coordinated regions. The document scales to the available stage
without cropping.

On narrow screens:

- the page navigator becomes a compact drawer or horizontal page selector;
- the disclosure fits the available width;
- the explanation appears as a viewport-safe bottom sheet; and
- zoomed pages may pan within their document stage without moving the
  explanation or page navigation off screen.

Fit, Zoom In, and Zoom Out are available. The image and hotspots always share
the same transform. The interface must not introduce tiny nested scrolling
regions or make the learner horizontally scroll the entire application.

## Accessibility Contract

- Every hotspot is a semantic button even though its visual background is
  transparent.
- Its accessible name includes the document field name and displayed value when
  the value is helpful, such as `Interest Rate, 3.875 percent`.
- Hotspot tab order follows the form's logical reading order, not arbitrary DOM
  or coordinate order.
- Enter and Space open an explanation; Escape closes it and restores focus.
- Hover, focus, and selection states remain visually distinct, and focus is
  always visible.
- Selection is communicated by more than color alone.
- Opening an explanation announces its title and content without trapping
  keyboard focus.
- Touch targets remain usable even where the printed form text is small; target
  enlargement must not cause adjacent fields to overlap unpredictably.
- Reduced-motion preferences remove nonessential transitions.
- The page image has a concise alternative description; the interactive field
  buttons and explanation content provide the meaningful detailed access.

## Error and Recovery Behavior

- If a page image fails to load, the viewer shows a page-specific unavailable
  message, keeps the navigator usable, and does not render hotspots over an
  empty or incorrectly sized stage.
- If one hotspot is malformed, the viewer skips that hotspot and reports its ID
  during development; the rest of the page remains usable.
- Missing explanation content is a validation failure. Development builds may
  show `Explanation unavailable`, but release verification must fail.
- Coordinate values outside the normalized page bounds are rejected.
- Duplicate hotspot IDs or reading-order values are reported before release.
- Refresh returns to the approved default state. No selected item or learner
  behavior is persisted.

## Educational and Compliance Boundaries

The interface identifies the documents as fictional CFPB samples. A visible,
plain-language disclaimer states that the experience is educational, does not
describe a specific borrower's loan, and is not legal, tax, or financial advice.

Explanations should describe the purpose and normal loan-process role of a field
without promising that every lender, loan program, or transaction will use the
same charge or amount. Time-sensitive program rules should not be introduced
unless sourced, dated, and approved.

Before publication, an MSFG mortgage/compliance owner reviews all explanations
against current primary guidance and records approval in the content metadata.

## Validation and Verification

### Data completeness

Automated checks verify that:

- all three LE pages and five CD pages are registered;
- every page image has a source PDF and source page mapping;
- all hotspot IDs are unique;
- normalized coordinates remain between 0 and 1;
- every hotspot has an accessible label, reading-order value, and explanation;
- every explanation has source and review metadata; and
- no content record is orphaned from the viewer.

### Interaction verification

Test direct page selection, mouse hover and click, touch activation, sequential
keyboard navigation, Enter/Space activation, Escape dismissal, focus return,
item replacement, page-switch clearing, and all zoom controls.

### Visual verification

Inspect all eight pages at minimum at 1920x1080, 1280x720, a tablet viewport,
390x844 mobile portrait, and mobile landscape. At every viewport and supported
zoom level, confirm that hotspot outlines remain aligned to their intended form
fields, the document is not clipped unintentionally, and the explanation is
fully readable.

Also verify the missing-image state, a deliberately invalid hotspot fixture,
reduced-motion behavior, browser-console cleanliness, and successful loading of
every static asset.

### Content review

Review every explanation for plain language, accuracy, consistency, and the
promised paragraph-sized scope. Confirm that no copy treats a fictional CFPB
sample figure as a live MSFG quote or offers a transaction-specific compliance
conclusion.

## Release Acceptance Criteria

The first release is ready for preview when:

1. the user can open any of the eight disclosure pages directly;
2. every approved important field and populated fee can be selected by label or
   amount without following a lesson sequence;
3. each selection produces the correct reviewed explanation;
4. the unselected form remains visually identical to the rendered CFPB sample;
5. hotspots stay aligned through responsive resizing and zoom;
6. mouse, touch, and keyboard workflows pass;
7. automated data validation passes;
8. the complete visual and content review passes; and
9. the local preview is approved before any publishing work begins.

## Explicit Non-Goals for the First Release

- No previous/next lesson or teaching-target controls.
- No required order, progress tracking, quiz, completion state, or certificate.
- No scenario selector, FHA/VA variants, refinance variant, or fee calculator.
- No HTML reconstruction or editable version of the standardized forms.
- No user-uploaded LE or CD and no real borrower or production loan data.
- No automated tolerance analysis or legal/compliance conclusion.
- No backend, authentication, saved session, analytics, or database.
- No public deployment without a separate reviewed-preview approval.
