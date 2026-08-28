# LE/CD Content Review Record

## Current release status

**Local preview ready; compliance review pending.** Every explanation currently remains `pending-msfg`. This file does not record approval, and no pending record may be changed until a real MSFG mortgage/compliance reviewer supplies a decision.

## Reviewer package

Start the local server from the repository root:

```bash
python3 -m http.server 4177 --bind 127.0.0.1 --directory cd-webinar
```

Review [http://127.0.0.1:4177/](http://127.0.0.1:4177/) with the eight-page inventory in [README.md](./README.md#eight-page-teaching-inventory). The viewer targets are LE pages 1–3 and CD pages 1–5. Compare each rendered page with its matching hash-pinned source PDF form page: `loan-estimate-H24B.pdf` PDF pages 2–4 and `closing-disclosure-H25B.pdf` PDF pages 2–6.

The reviewer must inspect every explanation and all eight pages. Confirm that copy accurately describes the printed item and source, all samples remain clearly fictional, no explanation supplies borrower-specific advice, the educational disclaimer remains present, hotspot placement identifies the intended printed field, and rendered images match their source PDFs. Review direct page selection, click/touch activation, keyboard activation, Escape focus return, zoom alignment at Fit/125%/150%/200%, mobile bottom sheet, and the unavailable-image fallback as part of the local-preview review.

| Reviewer | Role | Review date | Pages reviewed | Copy accuracy | Source accuracy | Disclaimer | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| _Pending named MSFG reviewer_ | _Pending_ | _Pending_ | _Pending: LE 1–3; CD 1–5; all explanations_ | _Pending_ | _Pending_ | _Pending_ | _Pending_ |

Record `Approved` only after the named reviewer actually supplies that decision. An approved entry must use a real full name and a real ISO `YYYY-MM-DD` review date; never enter an example value or invent a compliance signoff.

## After a real review

- If changes are requested, revise the affected copy and source references, leave affected records `pending-msfg`, run `node --test cd-webinar/tests/*.test.mjs` and `cd-webinar/tests/run-browser-audit.sh`, then resubmit the changed records.
- When every explanation is genuinely approved, update each corresponding `review` record in `content/explanations.js` to `status: 'approved'` with the reviewer’s real full name and ISO date, update the row above, and run `LE_CD_RELEASE=1 node --test cd-webinar/tests/release-readiness.test.mjs`.
- The release gate passing confirms recorded approval fields and content validation; it does not publish the webinar. Publishing needs separate user approval.
