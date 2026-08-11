# downloads/

The five audience takeaways. **Ungated — no form, no email.** That is a load-bearing
decision, not a marketing oversight (see `PROJECT.md` § success criterion 3).

| File | Given at | Artifact |
|---|---|---|
| `first-time-buyer-checklist.html` | Slide 016 + 070 | #1 The 9-Stage Map · #6 The Do-Not-Do List |
| `closing-cost-worksheet.html` | Slide 059 + 070 | Cash to Close, filled in with their own numbers |
| `loan-estimate-cheat-sheet.html` | Slide 060 + 070 | #5 The 60-Second Lender Comparison |
| `questions-to-ask-a-builder.html` | Slide 067 + 070 | #7 The Builder's 12 Questions |
| `mortgage-glossary.html` | Slide 070 | Every term used in the webinar |

---

## Building the PDFs

**No PDF converter is installed on this machine** (checked: pandoc, weasyprint,
wkhtmltopdf, prince, reportlab — none present). The HTML files are written
print-ready, so the zero-install path is:

1. Open the `.html` file in a browser
2. **Cmd+P** → Destination: **Save as PDF**
3. Margins: **Default** · Background graphics: **ON** · Headers/footers: **OFF**
4. Save as the title-case filename the webinar promises, e.g.
   `First Time Buyer Checklist.pdf`

Each file is styled at US Letter with `@page` margins and page-break control, so
this produces a clean result without further work.

**To automate it later**, install one of:

```bash
brew install --cask wkhtmltopdf
```

then:

```bash
for f in downloads/*.html; do wkhtmltopdf "$f" "${f%.html}.pdf"; done
```

---

## Target filenames

These are what the webinar and follow-up email promise. Keep them exactly:

- `First Time Buyer Checklist.pdf`
- `Closing Cost Worksheet.pdf`
- `Loan Estimate Cheat Sheet.pdf`
- `Questions To Ask A Builder.pdf`
- `Mortgage Glossary.pdf`

---

## Compliance — read before publishing

These documents travel **without** the spoken context that qualified them. Each one
must therefore stand alone:

- [ ] Every figure labeled hypothetical, on the page
- [ ] Name, individual NMLS, company name, company NMLS, Equal Housing Lender on
      **every** file
- [ ] No rate quotes, no offers, no commitment-to-lend language
- [ ] Program details stated as general guidelines, not eligibility determinations
- [ ] `[NMLS #______]` placeholders filled — **this is a BLOCKER**
- [ ] Run `prompts/05-compliance-review.md` against the standalone documents, not
      just the deck

## Presenter swap

These ship set to **Seth Angell** (presents first). Two fields change per presenter —
the footer name/NMLS line, and the contact line on the Loan Estimate Cheat Sheet:

| Presenter | Title | NMLS |
|---|---|---|
| Seth Angell | Executive VP | #912881 |
| Robert Hoff | President | #608235 |
| Zachary Zink | Mortgage Broker | #451924 |

Company name and company NMLS (#1314257) never change.
