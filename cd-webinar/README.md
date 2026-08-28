# Understand Your LE and CD

This is a local, educational interactive viewer for the fictional Consumer Financial Protection Bureau (CFPB) Loan Estimate (LE) and Closing Disclosure (CD) samples. It is not a loan quote and does not provide borrower-specific legal, tax, financial, or mortgage advice. Publishing or deploying this viewer is a separate, user-approved task; this directory contains no deployment procedure.

## Local preview and verification

From the repository root, start the viewer with this exact command, then open [http://127.0.0.1:4177/](http://127.0.0.1:4177/) in a browser:

```bash
python3 -m http.server 4177 --bind 127.0.0.1 --directory cd-webinar
```

Run the ordinary development suite (the release gate is skipped unless `LE_CD_RELEASE=1`):

```bash
node --test cd-webinar/tests/*.test.mjs
```

Run the browser audit, which owns its temporary local server when no URL is supplied:

```bash
cd-webinar/tests/run-browser-audit.sh
```

Re-render the eight image assets only when the pinned source PDFs are intentionally changed and revalidated:

```bash
cd-webinar/scripts/render-disclosures.sh
```

The release-only human-review check is intentionally not a routine development command. After every explanation has an actual recorded approval, run `LE_CD_RELEASE=1 node --test cd-webinar/tests/release-readiness.test.mjs`. Until then it must fail with `review status must be approved`; that failure is the compliance checkpoint, not a defect to bypass.

## Viewer behavior

The viewer begins on LE page 1, but pages are independently selectable; no lesson order, previous/next sequence, or progress is implied. Choose an LE or CD page, then click or tap a highlighted field to open its explanation. The Fit, Zoom out, and Zoom in controls use 100%, 125%, 150%, and 200% views.

Each hotspot is a native button: Tab reaches it, Enter or Space activates it, and Escape closes an open explanation and restores focus to the selected field. Changing the page clears the selection and moves focus to the selected page heading. Hotspot outlines are not always visible; they appear for hover, keyboard focus, or selection. On narrow screens, a selected explanation is a bottom sheet with a Close control. If a page image cannot load, the viewer hides every hotspot on that page, announces that the page is temporarily unavailable, and leaves page navigation usable.

## Source and image contract

The pinned source PDFs and their rendered form pages are:

| Form | Source PDF | SHA-256 | PDF-to-viewer mapping |
| --- | --- | --- | --- |
| LE | `loan-estimate-H24B.pdf` | `243551dbce6362e616328924eaf5b1818b734883d43ec91a73c160e5da52b385` | PDF 2 → LE 1; 3 → LE 2; 4 → LE 3 |
| CD | `closing-disclosure-H25B.pdf` | `606a93c8baaca815439822df5cf8c78cbb2dcf6cc4af5aa291a459c7917e4173` | PDF 2 → CD 1; 3 → CD 2; 4 → CD 3; 5 → CD 4; 6 → CD 5 |

All eight files in `assets/documents/` are 1530 × 1980 PNGs rendered at 180 DPI. The source manifest is the authority for those hashes and mappings. Compare rendered images against the corresponding source PDF form page during review; do not treat an image filename as source evidence.

Hotspot `bounds` are normalized fractions of the rendered image: `{ x, y, width, height }`, with `(0, 0)` at the image’s top-left and `(1, 1)` at its bottom-right. Bounds must stay within the unit page rectangle and are converted to percentage positioning, so the field remains aligned at Fit, 125%, 150%, and 200%.

## Content authoring and review

`content/explanations.js` is the explanation authority. Each learner `body` must be 45–110 words, explain the printed field in educational language, cite its source reference, identify the fictional-sample context where relevant, and avoid borrower-specific recommendations. Keep the page label, field label, displayed value, source reference, and hotspot location consistent with the rendered image.

New or changed explanations must keep `review` at `pending-msfg` with empty reviewer and date until an MSFG mortgage/compliance reviewer actually approves them. Do not use a placeholder name or date. After a real decision, change only the approved records to `status: 'approved'` with the reviewer’s real full name and ISO `YYYY-MM-DD` review date, update [CONTENT-REVIEW.md](./CONTENT-REVIEW.md), rerun the development and browser checks, and resubmit any changed records for review.

The complete handoff checklist and the only signoff table are in [CONTENT-REVIEW.md](./CONTENT-REVIEW.md). Provide it, the local URL, and the eight-page inventory below to the reviewer.

## Eight-page teaching inventory

The inventory is intentionally page-specific; it is the target set that must be reviewed in addition to the source-render comparison.

| Viewer page | Teaching targets |
| --- | --- |
| LE 1 | Date Issued; Applicants; Property; Sale Price; Loan Term; Loan Purpose; Loan Product; Loan Type; Loan ID; Rate Lock; Loan Amount; Interest Rate; Monthly Principal and Interest; Prepayment Penalty; Balloon Payment; Projected Principal and Interest; Projected Mortgage Insurance; Estimated Escrow; Estimated Total Monthly Payment; Estimated Taxes, Insurance, and Assessments; Property Taxes; Homeowner’s Insurance; Estimated Closing Costs; Estimated Cash to Close |
| LE 2 | A–J totals; points; application, underwriting, appraisal, credit report, flood determination, flood monitoring, tax monitoring, tax status research, pest inspection, survey, title binder, lender title policy, settlement-agent, recording, transfer-tax, homeowner’s insurance, mortgage-insurance, prepaid-interest, prepaid-property-tax, escrow, owner’s-title-policy, lender-credit, and cash-to-close calculation rows, including the displayed payer/timing and D + I totals |
| LE 3 | Lender and loan-officer contact; five-year total paid and principal paid; APR; TIP; appraisal; assumption; homeowner’s insurance; late payment; refinance; servicing; confirm receipt |
| CD 1 | Date Issued; Closing Date; Disbursement Date; Settlement Agent; File Number; Property; Sale Price; Borrower; Seller; Lender; Loan Term; Loan Purpose; Loan Product; Loan Type; Loan ID; Mortgage Insurance Case Number; Loan Amount; Interest Rate; Monthly Principal and Interest; Prepayment Penalty; Balloon Payment; projected payment and property-cost fields; HOA dues; Closing Costs; Cash to Close |
| CD 2 | All borrower/seller/other payer columns; A–J and subtotals; points; required-service, tax, insurance, escrow, title, HOA, inspection, warranty, commission, government-fee, lender-credit, and closing-cost detail fields |
| CD 3 | Closing-cost and cash-to-close calculation rows; K–N transaction-summary totals; buyer and seller price, deposit, credit, payoff, property, tax, adjustment, and cash-to-close/cash-to-seller rows |
| CD 4 | Assumption; demand feature; late payment; negative amortization; partial payments; security interest; escrow account; escrowed and non-escrowed costs; initial and monthly escrow; no escrow; future escrow changes |
| CD 5 | Total of Payments; Finance Charge; Amount Financed; APR; TIP; appraisal; contract details; liability after foreclosure; refinance; tax deductions; CFPB questions; lender, mortgage-broker, buyer-broker, seller-broker, and settlement-agent contacts; confirm receipt |

The automated completeness suite contains the identifier-level inventory (232 hotspots connected to 176 explanations). It is a regression check, not a substitute for the human review.

## Module responsibilities

| Area | Responsibility |
| --- | --- |
| `index.html` | Static accessible shell, viewer landmarks, module entry point, and educational disclaimer. |
| `content/documents.js` | The two document records, eight page records, image dimensions, and PDF-page mappings. |
| `content/hotspots/le.js`, `content/hotspots/cd.js` | Page-specific teaching fields, normalized bounds, reading order, displayed values, accessible labels, and explanation links. |
| `content/explanations.js` | Explanation copy, citations, and per-record human-review status. |
| `content/index.js` | Public composition of documents, explanations, and both hotspot sets. |
| `js/content-validation.js` | Validates page, hotspot, copy-link, accessibility, bounds, and release-review contracts; filters invalid runtime hotspots. |
| `js/viewer-state.js` | Page selection, selection clearing, and fixed zoom-state transitions. |
| `js/page-geometry.js` | Fit sizing and normalized-to-percent hotspot geometry. |
| `js/viewer.js` | Navigation, image rendering, interaction, focus handling, responsive explanation UI, and missing-image fallback. |
| `js/app.js` | Validates preview content and initializes the viewer only when it is renderable. |
| `css/` | Tokens, base styling, desktop layout, responsive bottom sheet, and reduced-motion behavior. |
| `references/` and `scripts/render-disclosures.sh` | Hash-pinned PDF sources, manifest, and reproducible image rendering. |
| `tests/` | Node contracts, browser matrix, and the explicitly opt-in release-readiness gate. |

Before a handoff, run the ordinary Node suite, browser audit, and `git diff --check -- cd-webinar`; confirm the ordinary suite passes while the explicit release test remains intentionally failing until a real MSFG signoff exists.
