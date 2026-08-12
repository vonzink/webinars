# Decoding Loan Estimates and Closing Disclosures Webinar

Date: 2026-08-12
Status: Approved design, pending written-specification review

## Objective

Build a separate interactive MSFG webinar that teaches borrowers and presenters how to read a Loan Estimate (LE) and Closing Disclosure (CD). The experience must preserve the existing Ridgeline visual system while making the standardized forms themselves interactive at the page, section, and fee-line levels.

The webinar uses fixed fictional scenarios. It is an educational experience, not a loan calculator, loan quote, or source of individualized legal, tax, or financial advice.

## Approved Experience

The experience uses the approved **Document-first classroom** layout:

- the reconstructed LE or CD remains visible on the left;
- a stable teaching panel remains visible on the right;
- scenario controls remain visible above both;
- page and section navigation remain available while a fee is selected;
- selecting a fee highlights its actual line on the form and loads its explanation without covering the form.

The webinar is a new additive experience. It does not replace, refactor, or change the current Homebuyer's Playbook webinar.

## Scenario Controls

Four coordinated controls define the active scenario:

1. **Document:** Loan Estimate or Closing Disclosure
2. **Transaction:** Purchase or rate-and-term refinance
3. **Compensation:** Lender paid or borrower paid
4. **Loan program:** Conventional, FHA, or VA

The controls produce 12 fixed loan scenarios and 24 document states: one LE and one matching CD for every scenario.

The default and reset state is:

- Loan Estimate;
- Purchase;
- Lender paid;
- Conventional;
- Page 1;
- no selected section or fee.

Switching a control preserves the current page, section, or fee when the target exists in the new state. If it does not exist, the interface selects the closest applicable parent section and explains why the line is not present.

## Shared-Assumption Rule

Each transaction family uses one fictional borrower profile and one property. Within a Purchase or Refinance family, these facts remain constant across the three loan programs and two compensation presentations:

- borrower identity;
- property and value or purchase price;
- transaction date assumptions;
- lender, settlement, and service-provider identities;
- taxes, insurance, title, recording, and other non-program charges;
- general market-rate date and disclosure timing.

Only facts that legitimately depend on the selected program or compensation presentation may change. These include loan amount, down payment, mortgage insurance or funding fee, principal and interest, program-specific charges, lender credits, subtotals, and cash to close.

The Purchase conventional baseline is derived from the supplied CFPB H-24(B) and H-25(B) fixed-rate purchase samples. The Refinance baseline is derived from the supplied CFPB H-24(D) and H-25(E) refinance samples, adapted into an unambiguous rate-and-term example. The supplied model, annotated, and citation editions are reference material for form structure and explanations.

All dates, parties, account identifiers, amounts, and contact information presented by the webinar are fictional educational data. No borrower NPI or production loan data is used or logged.

## Compensation Teaching Model

The compensation selector teaches gross closing-cost presentation, not a universal promise about pricing.

### Lender-paid view

- The LE does not show indirect creditor-paid loan-originator compensation as a consumer-paid Section A origination charge.
- If the fixed CD scenario uses a third-party loan originator, compensation paid by the creditor is represented in the applicable paid-by-others treatment rather than as a borrower-paid charge.
- The scenario does not include the equal-and-opposite general lender credit used by the Borrower-paid teaching example.

### Borrower-paid view

- Section A includes the fixed borrower-paid origination or broker-compensation charge.
- Section J includes an equal offsetting general lender credit for this intentionally constructed teaching example.
- Section A, Total Loan Costs, and the pre-credit `D + I` subtotal therefore appear higher.
- Total Closing Costs and Cash to Close are recalculated after applying the negative lender credit.
- Selecting either line highlights both the Section A charge and Section J credit.
- The teaching panel shows the arithmetic as `gross costs - lender credits = net closing costs` and explains that the paired lines must be considered together.

The content must describe this as the behavior of the fixed sample scenario, not as a rule that every borrower-paid or lender-paid transaction must use the same structure.

## Program Variants

### Conventional

- Use conventional financing assumptions.
- Show conventional mortgage insurance only when the fixed scenario's loan-to-value ratio requires it.
- Keep program-independent charges equal to the corresponding FHA and VA scenarios.

### FHA

- Show the FHA base loan amount separately from any financed upfront mortgage insurance premium.
- Show FHA upfront MIP and monthly MIP in their appropriate locations.
- Recalculate the total loan amount, projected payment, and cash to close.
- Explain that the fixed figures are educational assumptions tied to the sample, not a live FHA quote.

### VA

- Show the fixed sample's VA funding-fee treatment and whether it is financed or paid at closing.
- Do not show monthly mortgage insurance.
- Recalculate the loan amount, projected payment, and cash to close.
- State the sample's assumed funding-fee status rather than inferring an attendee's exemption or entitlement.

Program calculations and explanatory copy require current official-source validation and an MSFG compliance review before public deployment.

## Transaction Variants

### Purchase

The Purchase family includes the shared sale price, deposit, down payment or funds from borrower, seller information, seller credits if used by the fixed sample, purchase-specific title charges, and purchase cash-to-close calculation.

### Rate-and-term refinance

The Refinance family does not introduce cash-out proceeds. It replaces purchase-only concepts with:

- appraised property value;
- current mortgage payoff;
- refinance-specific title and recording charges;
- prepaid interest and escrow treatment;
- new loan proceeds applied to the payoff and allowed costs;
- final cash from or to the borrower.

The teaching panel identifies why down payment, deposit, seller information, and seller credits do not appear in the refinance state.

## Interactive Disclosure Rendering

The LE and CD are semantic HTML/CSS reconstructions rather than flattened PDF screenshots. They retain the recognizable hierarchy, labels, sections, tables, page numbering, and black-and-white character of the standardized forms while allowing each value and fee line to update.

The surrounding webinar uses MSFG Ridgeline styling. MSFG colors must not recolor or visually misrepresent the standardized disclosure itself.

Each interactive form element has a stable semantic identifier independent of page coordinates, such as:

- `loan-terms.interest-rate`;
- `costs.a.origination-fee`;
- `costs.b.appraisal-fee`;
- `costs.f.prepaid-interest`;
- `costs.g.initial-escrow`;
- `costs.j.lender-credits`;
- `cash-to-close.total`.

These identifiers connect scenario values, LE/CD comparisons, clickable targets, explanations, automated tests, and focus preservation.

## Page, Section, and Line Teaching

### Page level

- The LE exposes all three pages.
- The CD exposes all five pages.
- Previous and next controls, page indicators, keyboard navigation, zoom, and fullscreen are available.
- Page changes do not reset the scenario controls.

### Section level

Selecting a section highlights its full area and explains:

- the section's purpose;
- which charges or facts belong there;
- who generally controls those entries;
- whether relevant services may be shopped;
- what to compare between the LE and CD;
- how the active transaction, program, or compensation setting affects the section.

### Line level

Every populated fee and every key teaching value is selectable. The teaching panel shows:

- plain-language definition;
- why the item exists;
- who charges or receives it;
- whether the borrower may shop for it;
- when it is normally paid;
- what can cause the amount to change;
- how it behaves in the active scenario;
- matching LE amount;
- matching CD amount;
- dollar difference;
- a practical question the borrower can ask.

Related lines can be selected as a group. The borrower-paid origination charge and its offsetting lender credit are the primary paired-line lesson.

Previous and next teaching-target controls let a presenter move through sections or populated lines in form order. Direct clicking remains available at all times.

## LE-to-CD Relationship

The LE and CD for a scenario share semantic fee identifiers. Switching between documents while an item is selected opens the corresponding item on the other document when it exists.

The panel distinguishes:

- estimated LE amount;
- final CD amount;
- increase or decrease;
- whether the difference is part of the fixed teaching scenario;
- the reason assigned to that change.

The first release uses curated fixed differences. It does not generate arbitrary tolerance determinations or make compliance conclusions from user-entered figures.

## Visual System

The application shell reuses the existing Ridgeline design contract:

- Deep Forest `#0C3335`;
- Forest Mid `#14494B`;
- MSFG Green `#8CC63E`;
- Mist `#F5F7F4` and White;
- Charcoal `#404041`;
- Montserrat for display and labels;
- Open Sans for body content;
- squared geometry;
- no decorative drop shadows;
- existing MSFG identity, NMLS, licensing, and Equal Housing Lender treatment.

The disclosure is the visual subject. The surrounding interface stays quiet, using green for the active teaching target and the current control state.

When a selector changes, affected values briefly receive a restrained highlight. Unchanged values do not animate. Reduced-motion settings replace transitions with an immediate state change.

## Layout and Controls

Desktop and presentation layout:

- top bar: webinar title and four scenario controls;
- left rail: document pages and section navigation;
- center-left: scalable disclosure page;
- right: stable teaching panel;
- utility controls: zoom, fullscreen, previous/next page, previous/next teaching target, and reset.

On narrower displays, the teaching panel moves below the disclosure. The full scenario control set remains available without horizontal page scrolling.

Mouse, keyboard, and touchscreen interactions must be supported. Every clickable target has a visible focus state, accessible name, and sufficient target size. Opening an explanation does not trap focus; keyboard users can move between the selected form line, explanation panel, and navigation controls.

## State and Data Flow

The browser owns a single state object containing:

- document type;
- transaction type;
- compensation type;
- loan program;
- page number;
- selected section or fee ID;
- zoom level;
- fullscreen state.

A state change follows this sequence:

1. Validate the requested selector combination.
2. Load the fixed transaction baseline.
3. Apply the selected program adjustments.
4. Apply the compensation presentation.
5. Calculate all dependent loan terms, subtotals, credits, payments, and cash-to-close figures.
6. Validate calculation invariants.
7. Render the selected LE or CD.
8. Preserve or safely resolve the active teaching target.
9. Highlight only the values changed by the user action.

No backend, authentication, persistence, or editable borrower-input system is included in the first release.

## Code Boundaries

The new webinar should follow the existing deck's separation of content and behavior while remaining independent of the Homebuyer's Playbook files:

- `content/scenarios.js`: fixed Purchase and Refinance baselines;
- `content/fees.js`: reusable fee definitions and teaching questions;
- `content/sections.js`: page and section explanations;
- `content/programs.js`: Conventional, FHA, and VA adjustments;
- `content/compensation.js`: lender-paid and borrower-paid presentation rules;
- `js/calculate.js`: calculations and invariants;
- `js/state.js`: state transitions and target preservation;
- `js/disclosure.js`: semantic LE/CD rendering;
- `js/explainer.js`: teaching-panel behavior;
- `js/viewer.js`: page, section, zoom, fullscreen, and input controls;
- `css/tokens.css`: Ridgeline tokens reused without importing Homebuyer runtime state;
- `css/disclosure.css`: standardized form reconstruction;
- `css/webinar.css`: application shell and responsive layout.

These files live under the new `decoding-le-cd/deck/` source directory. Their responsibilities remain separated; a single monolithic scenario or rendering file is not acceptable.

## Error and Recovery Behavior

- An unknown scenario option is rejected and the last valid state remains visible.
- A missing required scenario value blocks that scenario during development and reports the exact semantic field ID.
- A missing fee definition displays `Explanation unavailable` during development and fails the completeness test.
- A calculation invariant failure prevents an inconsistent document from being presented as valid.
- A fee that does not apply remains absent from the form; selecting it through a retained state resolves to its parent section and explains why it is not applicable.
- Reset restores the approved default without reloading the page.
- Browser refresh returns to the approved default; no partial scenario is persisted.

## Calculation Invariants

At minimum, automated checks enforce:

- each section subtotal equals its populated line items;
- total loan costs equal Sections A + B + C;
- total other costs equal the applicable other-cost sections;
- total closing costs equal loan costs + other costs + lender credits using disclosure sign conventions;
- cash-to-close inputs reconcile to the displayed total;
- the borrower-paid teaching credit exactly offsets its designated compensation charge;
- FHA financed upfront MIP reconciles base and total loan amount;
- VA funding-fee treatment reconciles the amount financed or paid at closing;
- program-independent fees remain equal across program variants within a transaction family;
- each LE and CD pair shares the required semantic fee mappings.

## Verification

Before preview delivery:

1. Test all 12 scenario combinations in both the LE and CD states.
2. Test every calculation invariant and independently spot-check displayed arithmetic.
3. Verify all three LE pages and five CD pages render for every applicable scenario.
4. Verify every populated fee and every key teaching value has a reachable explanation.
5. Verify each selected fee maps correctly between the LE and CD.
6. Verify section-order and line-order guided navigation.
7. Verify the compensation lesson highlights the Section A charge and Section J credit together and states gross and net costs correctly.
8. Verify program-specific items appear or disappear correctly for Conventional, FHA, and VA.
9. Verify Purchase and rate-and-term Refinance retain their distinct transaction logic.
10. Verify keyboard, mouse, touchscreen, focus, reduced-motion, zoom, and fullscreen behavior.
11. Inspect representative screenshots at 1920x1080, laptop, tablet, and phone widths.
12. Verify no runtime dependency or URL overlaps the current Homebuyer's Playbook.
13. Run HTML, CSS, JavaScript, accessibility, link, and browser-console checks.
14. Complete an MSFG compliance review of the fixed disclosure values, compensation example, program assumptions, definitions, citations, and disclaimers before public deployment.

## Source Hierarchy

Content and form behavior use this order of authority:

1. Current CFPB regulations, official interpretations, form guides, and consumer explainers.
2. Current HUD/FHA and VA primary guidance for program-specific items.
3. The supplied CFPB model, annotated, citation, and sample PDFs for example structure and paired scenarios.
4. MSFG-approved educational wording and scenario assumptions.

The implementation must record an `as of` date for program assumptions that can change. Definitions should paraphrase sources in plain language and retain source links for review.

## Delivery and Deployment Boundary

Implementation will begin under the new `decoding-le-cd/deck/` source directory and receive a local preview before any library or production change. The approved public route is `/webinars/decoding-le-cd/`.

Publishing is a separate approval gate. A later deployment may add a new webinar-library card and the new route, but it must preserve every existing production file and link unless a separately approved change requires otherwise.

## Non-goals

- No user-entered loan calculator or freely editable fees.
- No live rates, automated eligibility decisions, underwriting, or program qualification.
- No real borrower data, saved sessions, database, authentication, or backend.
- No automated legal conclusion about whether a changed fee violates a tolerance rule.
- No replacement or redesign of the Homebuyer's Playbook webinar.
- No PowerPoint version in the first implementation phase.
- No production deployment without a reviewed preview and explicit approval.
