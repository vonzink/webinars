# final/

**Delivery-ready exports only.** If it isn't cleared to present or publish, it
doesn't go here.

## Expected contents

```
final/
  Mortgage-Decoded-Deck-vN.pdf        Presentation deck, exported
  Mortgage-Decoded-Deck-vN.key/.pptx  Presentation file for live delivery
  downloads/                          The 5 PDFs, built from ../downloads/*.html
    First Time Buyer Checklist.pdf
    Closing Cost Worksheet.pdf
    Loan Estimate Cheat Sheet.pdf
    Questions To Ask A Builder.pdf
    Mortgage Glossary.pdf
  speaker-script-vN.pdf               Printed script for the second screen
  replay/                             Recorded webinar + chapter markers
```

---

## Nothing enters this folder until all four pass

| Gate | Run | Owner |
|---|---|---|
| **Fact check** | `../prompts/06-fact-check.md` | Presenter |
| **Compliance** | `../prompts/05-compliance-review.md` | Compliance |
| **Design** | `../prompts/04-design-review.md` | Designer |
| **Rehearsal** | Full run against a stopwatch, all 6 checkpoints ±20s | Presenter |

## Hard blockers

- [ ] `[NMLS #______]` placeholders filled — individual **and** company, on the deck
      **and** on all five downloads
- [ ] Equal Housing Lender mark present where required
- [ ] Official MSFG logo replacing `../branding/logo.svg`
- [ ] All 🔴 VERIFY flags in `../research/` cleared for this delivery date
- [ ] CHFA / DPA program status confirmed **on the delivery date**
- [ ] Sample Loan Estimates use fabricated data, watermarked SAMPLE
- [ ] All three demo fallback slides match current calculator output

---

## Versioning

`Mortgage-Decoded-Deck-v4.pdf`, `-v4.1`, etc. **Never overwrite a delivered
version** — if a number changes between deliveries, you need to know which audience
saw which figure.

Log each delivery's verification to `../statistics/verified-YYYY-MM-DD.md`.

## Replay

- Chapter markers at every module boundary (see `../outline/00-master-outline.md`)
- Downloads linked in the description, **ungated**
- Replay-specific CTA — chat links don't work on a recording, which is why the
  email address is spoken aloud on slide 070
