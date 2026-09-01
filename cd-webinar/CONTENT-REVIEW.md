# LE/CD Content Review Record

## Current release status

**Approved for release on 2026-08-31 (second review — reworked copy).** At Zachary Zink's direction, all 176 explanation bodies were rewritten in the plain-English voice of the MSFG-supplied "Loan Document Decoder Redesign" handoff (its docdata.js copy, which he provided), and 36 records gained an "Ask your lender" prompt shown in the decoder card. Regulation citations were carried over unchanged from the first approved corpus. The adaptation corrected handoff inaccuracies before approval: the rate-lock copy no longer implies unlocked terms hold for 10 business days (the rate can change any time until locked; the estimated closing costs are what stand for 10 business days), prescriptive lines were reframed as educational cautions, and the wire-fraud warning became a verification question. Zachary Zink approved the reworked corpus in the same working session; the digest below is computed from the exact approved bytes.

*First review, same day:* Zachary Zink approved the original 176-explanation corpus after an assisted pass corrected 12 CFR 1026.38(m) → 1026.38(l) citations (verified against the eCFR); its digest was a56162a9f123affb55624fc4baf9e460fe0a5002746e4cd14e15252cfe002a09.

The horizontal logo requirement is satisfied: `assets/brand/logo-horizontal.svg` is byte-identical to the official vector at `first-time-homebuyer/deck/assets/brand/logo-horizontal.svg` used on the live production decks (an earlier revision of this file described a reconstructed placeholder, which had already been replaced).

## Reviewer package

Start the local server from the repository root:

```bash
python3 -m http.server 4177 --bind 127.0.0.1 --directory cd-webinar
```

Review [http://127.0.0.1:4177/](http://127.0.0.1:4177/) with the eight-page inventory in [README.md](./README.md#eight-page-teaching-inventory). The viewer targets are LE pages 1–3 and CD pages 1–5. Compare each rendered page with its matching hash-pinned source PDF form page: `loan-estimate-H24B.pdf` PDF pages 2–4 and `closing-disclosure-H25B.pdf` PDF pages 2–6.

The reviewer must inspect every explanation and all eight pages. Confirm that copy accurately describes the printed item and source, all samples remain clearly fictional, no explanation supplies borrower-specific advice, the educational disclaimer remains present, hotspot placement identifies the intended printed field, and rendered images match their source PDFs. Review direct page selection, click/touch activation, keyboard activation, Escape focus return, zoom alignment at Fit/125%/150%/200%, the mobile field list and bottom sheet, and the unavailable-image fallback as part of the local-preview review.

After the reviewed files and official logo are final, run `node cd-webinar/scripts/reviewed-corpus.mjs --print-digest`. The reviewer’s decision must identify that exact SHA-256 value. Do not record a digest before the named reviewer actually approves those bytes.

| Reviewer | Role | Review date | Pages reviewed | Reviewed corpus SHA-256 | Copy accuracy | Source accuracy | Disclaimer | Official logo | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Zachary Zink | Mortgage Broker, NMLS #451924 | 2026-08-31 | LE 1–3; CD 1–5; all 176 explanations | a56162a9f123affb55624fc4baf9e460fe0a5002746e4cd14e15252cfe002a09 | Confirmed | Confirmed (one citation corrected pre-approval) | Present | Official vector confirmed | Approved |
| Zachary Zink | Mortgage Broker, NMLS #451924 | 2026-08-31 | LE 1–3; CD 1–5; all 176 reworked explanations + 36 asks | e9dd4d1fdc32e771883e3da96b4e7f3b114016e0ccdfd8b376330ce1c2198990 | Confirmed (handoff voice, accuracy-corrected) | Unchanged citations | Present | Official vector confirmed | Approved |
| Zachary Zink | Mortgage Broker, NMLS #451924 | 2026-08-31 | Same corpus re-bound: each record's approved sentences re-exposed as three flip cards (`cards` field); zero wording changes | c5aeda5c61bdc1b13ba440fa5ddb1a2c4302f23363cfdcaec4711524c5787bbf | Unchanged wording | Unchanged citations | Present | Official vector confirmed | Approved |

Record `Approved` only after the named reviewer actually supplies that decision. An approved entry must use a real full name and a real ISO `YYYY-MM-DD` review date; never enter an example value or invent a compliance signoff.

## After a real review

- If changes are requested, revise the affected copy and source references, leave affected records `pending-msfg`, run `node --test cd-webinar/tests/*.test.mjs` and `cd-webinar/tests/run-browser-audit.sh`, then resubmit the changed records.
- When every explanation and the official logo are genuinely approved, update each corresponding `review` record in `content/explanations.js` to `status: 'approved'` with the reviewer’s real full name and real ISO calendar date. Rerun the Node/browser/render checks, print the final digest, then enter that exact digest and the same genuine reviewer/date in `CONTENT-APPROVAL.json` and the signoff row above.
- Run `LE_CD_RELEASE=1 node --test cd-webinar/tests/release-readiness.test.mjs`. It validates the exact digest match, full-name evidence, real calendar date, every explanation approval, and all ordinary content contracts.
- The release gate passing confirms recorded approval fields and reviewed bytes; it does not publish the webinar. Publishing needs separate user approval.
