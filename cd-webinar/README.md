# Understand Your LE and CD

An interactive decoder for the Consumer Financial Protection Bureau (CFPB) sample Loan Estimate (LE) and Closing Disclosure (CD) forms. Learners pick a document and an example, hover any highlighted field to magnify it, and click to pin a plain-English explanation. Every sample is fictional. This is not a loan quote and gives no borrower-specific legal, tax, financial, or mortgage advice.

The viewer ships at `/webinars/le-cd/` inside the whole-site artifact built by `site/build.mjs`. See [`site/README.md`](../site/README.md) for build and deploy. Publishing a new version is still a separate, user-approved step; nothing in this folder deploys on its own.

## Local preview and verification

Local, from the repository root, nothing to replace. Then open http://127.0.0.1:4177/ in a browser:

```bash
python3 -m http.server 4177 --bind 127.0.0.1 --directory cd-webinar
```

Run the ordinary development suite. The release gate is skipped unless `LE_CD_RELEASE=1`, and the render-reproducibility test needs Poppler's `pdftoppm` on the machine:

```bash
node --test cd-webinar/tests/*.test.mjs
```

Run the browser audit. It needs the Playwright CLI, found through `PWCLI`, `playwright_cli.sh` on `PATH`, or the historical local install path. It starts its own temporary server when no URL is supplied:

```bash
cd-webinar/tests/run-browser-audit.sh
```

Re-render the 24 page images only when a pinned source PDF is intentionally changed and revalidated:

```bash
cd-webinar/scripts/render-disclosures.sh
```

Print the deterministic digest for the exact reviewed corpus:

```bash
node cd-webinar/scripts/reviewed-corpus.mjs --print-digest
```

The digest covers the document catalog, every explanation's reviewed content, every hotspot's semantics and normalized geometry, the complete source manifest, the SHA-256 of all six source PDFs, the shell logo, and all 24 rendered images. It deliberately excludes approval metadata so a reviewer can approve the digest and then record that evidence without changing the reviewed bytes.

The release-only human-review check is not a routine development command. When every explanation has a recorded approval and `CONTENT-APPROVAL.json` carries the same digest with the real reviewer and date, run `LE_CD_RELEASE=1 node --test cd-webinar/tests/release-readiness.test.mjs`. Until then it fails only on missing approval and digest evidence; that failure is the compliance checkpoint, not a defect to bypass.

## Viewer behavior

- **Documents and examples.** The header switch chooses LE or CD. Each document has three examples: LE Purchase (H-24(B)), LE Refinance (H-24(D)), LE blank model form (H-24(A)); CD Purchase (H-25(B)), CD Refinance (H-25(E)), and CD Refinance with cash due from the borrower (H-25(G)). The example bar and page thumbnails select any of the 24 pages directly; no lesson order or progress is implied. The viewer opens on LE Purchase page 1.
- **Hotspots.** Every taught field is a native button aligned over the rendered page. Hovering shows a magnifier lens over the printed line. Clicking or pressing Enter or Space pins the decoder card; selecting the same field again unpins it. Escape closes the card and returns focus to the field. Changing the page clears the selection and moves focus to the page heading. Outlines appear only for hover, keyboard focus, or selection.
- **Decoder card.** The card flips through four panes: Quick definition, In practice, Interesting fact, and Source guide. Records that carry a learner question show an "Ask your lender" callout. The card can float, dock to the side, resize, and close.
- **Presenter notes.** A fifth pane holds free-text notes and a link per field. Notes live only in that browser's localStorage under the `lecd-presenter-notes:` prefix. They never leave the machine and do not sync between devices.
- **Zoom.** Fit, Zoom out, and Zoom in step through 100%, 125%, 150%, and 200%. Hotspots stay aligned at every level because bounds are percentages of the image.
- **Narrow screens.** A non-overlapping field list exposes the same fields as touch targets of at least 44 × 44 CSS pixels and opens a viewport-safe bottom sheet.
- **Missing image.** If a page image fails to load, the viewer replaces the page with a status message, hides every hotspot on that page, and leaves navigation usable.

## Source and image contract

The six source PDFs are hash-pinned in `references/source-manifest.json`, which is the authority for hashes and page mappings. Compare rendered images against the source PDF form page during review; never treat an image filename as evidence.

| Example | Source PDF | SHA-256 | PDF page → viewer page |
| --- | --- | --- | --- |
| LE Purchase (`le`) | `loan-estimate-H24B.pdf` | `243551db…52b385` | 2 → 1, 3 → 2, 4 → 3 |
| LE Refinance (`le2`) | `loan-estimate-refinance-H24D.pdf` | `baadbe3d…be1560` | 2 → 1, 3 → 2, 4 → 3 |
| LE blank form (`le3`) | `loan-estimate-model-H24A.pdf` | `15713c03…6e610b` | 2 → 1, 4 → 2, 8 → 3 |
| CD Purchase (`cd`) | `closing-disclosure-H25B.pdf` | `606a93c8…7e4173` | 2 → 1, 3 → 2, 4 → 3, 5 → 4, 6 → 5 |
| CD Refinance (`cd2`) | `closing-disclosure-refinance-H25E.pdf` | `6c05ffba…aa341a` | 2 → 1, 3 → 2, 4 → 3, 5 → 4, 6 → 5 |
| CD Refi, cash due (`cd3`) | `closing-disclosure-refinance-cash-H25G.pdf` | `06386504…c3789c` | 2 → 1, 3 → 2, 4 → 3, 5 → 4, 6 → 5 |

Full hashes are in the manifest. All 24 files in `assets/documents/` are 1530 × 1980 PNGs rendered at 180 DPI, named `<example>-page-<n>.png`. The raw CFPB downloads in `CD Webinar/` are reference material only and do not ship.

Hotspot `bounds` are normalized fractions of the rendered image: `{ x, y, width, height }` with `(0, 0)` at the top-left and `(1, 1)` at the bottom-right. Bounds must stay inside the unit rectangle.

## Content authoring and review

`content/explanations.js` is the explanation authority. Each record has a learner `body` of 45 to 120 words that explains the printed field in educational language, the four `cards` panes, a `source` citation, an optional `learnerQuestion`, and a `review` record. Keep the page label, field label, displayed value, source reference, and hotspot location consistent with the rendered image.

Hotspots live in `content/hotspots/`, one file per example (`le.js`, `le2.js`, `le3.js`, `cd.js`, `cd2.js`, `cd3.js`). The refinance and blank-form examples reuse the purchase explanations wherever the printed field is the same and add four records the purchase forms do not have: estimated and appraised property value, payoffs and payments, and total payoffs and payments.

New or changed explanations must keep `review` at `pending-msfg` with an empty reviewer and date until an MSFG mortgage or compliance reviewer actually approves them. Never use a placeholder name or date. After a real decision, set only the approved records to `status: 'approved'` with the reviewer's real full name and a real ISO `YYYY-MM-DD` date, rerun all gates, print the digest, and record that digest with the same reviewer and date in [CONTENT-APPROVAL.json](./CONTENT-APPROVAL.json) and [CONTENT-REVIEW.md](./CONTENT-REVIEW.md). Any later change to copy, hotspots, manifest, catalog, or images invalidates the digest and requires a renewed review.

The handoff checklist and the only signoff table are in [CONTENT-REVIEW.md](./CONTENT-REVIEW.md).

## Teaching inventory

The purchase examples carry the page-by-page inventory below. The automated completeness suite locks the full identifier-level inventory: 502 hotspots across 24 pages connected to 180 explanations, 38 of which carry a learner question. It is a regression check, not a substitute for human review.

| Viewer page | Teaching targets |
| --- | --- |
| LE 1 | Date Issued; Applicants; Property; Sale Price; Loan Term; Loan Purpose; Loan Product; Loan Type; Loan ID; Rate Lock; Loan Amount; Interest Rate; Monthly Principal and Interest; Prepayment Penalty; Balloon Payment; Projected Principal and Interest; Projected Mortgage Insurance; Estimated Escrow; Estimated Total Monthly Payment; Estimated Taxes, Insurance, and Assessments; Property Taxes; Homeowner's Insurance; Estimated Closing Costs; Estimated Cash to Close |
| LE 2 | A–J totals; points; application, underwriting, appraisal, credit report, flood determination, flood monitoring, tax monitoring, tax status research, pest inspection, survey, title binder, lender title policy, settlement-agent, recording, transfer-tax, homeowner's insurance, mortgage-insurance, prepaid-interest, prepaid-property-tax, escrow, owner's-title-policy, lender-credit, and cash-to-close calculation rows, including the displayed payer/timing and D + I totals |
| LE 3 | Lender and loan-officer contact; five-year total paid and principal paid; APR; TIP; appraisal; assumption; homeowner's insurance; late payment; refinance; servicing; confirm receipt |
| CD 1 | Date Issued; Closing Date; Disbursement Date; Settlement Agent; File Number; Property; Sale Price; Borrower; Seller; Lender; Loan Term; Loan Purpose; Loan Product; Loan Type; Loan ID; Mortgage Insurance Case Number; Loan Amount; Interest Rate; Monthly Principal and Interest; Prepayment Penalty; Balloon Payment; projected payment and property-cost fields; HOA dues; Closing Costs; Cash to Close |
| CD 2 | All borrower/seller/other payer columns; A–J and subtotals; points; required-service, tax, insurance, escrow, title, HOA, inspection, warranty, commission, government-fee, lender-credit, and closing-cost detail fields |
| CD 3 | Closing-cost and cash-to-close calculation rows; K–N transaction-summary totals; buyer and seller price, deposit, credit, payoff, property, tax, adjustment, and cash-to-close/cash-to-seller rows |
| CD 4 | Assumption; demand feature; late payment; negative amortization; partial payments; security interest; escrow account; escrowed and non-escrowed costs; initial and monthly escrow; no escrow; future escrow changes |
| CD 5 | Total of Payments; Finance Charge; Amount Financed; APR; TIP; appraisal; contract details; liability after foreclosure; refinance; tax deductions; CFPB questions; lender, mortgage-broker, buyer-broker, seller-broker, and settlement-agent contacts; confirm receipt |

## Module responsibilities

| Area | Responsibility |
| --- | --- |
| `index.html` | Static accessible shell, document switch, zoom tools, page navigation, document stage, explanation panel, and the educational disclaimer. |
| `content/documents.js` | Two documents, six examples, 24 page records, image dimensions, source PDFs, and PDF-page mappings. |
| `content/hotspots/*.js` | Per-example teaching fields, normalized bounds, reading order, displayed values, accessible labels, and explanation links. |
| `content/explanations.js` | Explanation copy, card panes, learner questions, citations, and per-record human-review status. |
| `content/index.js` | Public composition of documents, explanations, and all hotspot sets. |
| `CONTENT-APPROVAL.json` | Reviewer and date evidence bound to one exact reviewed-corpus SHA-256 digest. |
| `CONTENT-REVIEW.md` | Reviewer package, signoff table, and the after-review procedure. |
| `js/content-validation.js` | Validates page, hotspot, copy-link, accessibility, bounds, and release-review contracts; filters invalid runtime hotspots. |
| `js/viewer-state.js` | Page selection, selection clearing, and fixed zoom-state transitions. |
| `js/page-geometry.js` | Fit sizing and normalized-to-percent hotspot geometry. |
| `js/viewer.js` | Document and example switching, page rendering, magnifier lens, decoder card, presenter notes, focus handling, responsive field list, and missing-image fallback. |
| `js/app.js` | Validates preview content and initializes the viewer only when it is renderable. |
| `css/` | Tokens, base styling, desktop layout, responsive bottom sheet, and reduced-motion behavior. |
| `references/` and `scripts/render-disclosures.sh` | Hash-pinned PDF sources, manifest, and reproducible image rendering. |
| `scripts/reviewed-corpus.mjs` | Canonical reviewed-corpus serialization, digest generation, real-date validation, and release evidence checks. |
| `tests/` | Node contracts, the 502-row fidelity fixture, byte-identical render check, browser audit, and the opt-in release-readiness gate. |

## Test coverage, honestly

- The Node suite locks content, geometry, state, assets, and the review lifecycle for all 24 pages.
- The browser audit exercises the eight purchase pages across five viewports and four zoom levels (160 alignment checks), plus keyboard, touch, responsive, and missing-image behavior. The refinance and blank-form pages are covered by the fidelity fixture and completeness suite, not by the browser matrix.
- The audit ignores requests the browser cancels during a reload (`ERR_ABORTED`), because the thumbnail rail is usually still fetching page images when a viewport changes. Any other failed request, console error, or misaligned hotspot fails the audit.

Before a handoff, run the Node suite, the browser audit, and `git diff --check -- cd-webinar`.
