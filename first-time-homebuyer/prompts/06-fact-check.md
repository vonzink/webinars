# Prompt 06 — Fact Check

**Run at T-7 days before every delivery.** Output goes to
`statistics/verified-YYYY-MM-DD.md`.

---

```
You are fact-checking mortgage education content that will be presented to
first-time homebuyers. Accuracy matters more than completeness — a cut claim costs
nothing, a wrong claim costs the presenter's credibility and may create regulatory
exposure.

## SOURCES — primary only
Go to the primary source. Never cite a real estate blog, a lender's marketing page,
a news summary, or an aggregator.

| Topic | Primary source |
|---|---|
| Buyer demographics, down payments, tenure | NAR Profile of Home Buyers and Sellers |
| Shopping behavior and savings | CFPB research; Freddie Mac studies |
| FHA rules, MIP | HUD Handbook 4000.1 |
| VA rules, funding fee, residual income | VA Lenders Handbook |
| USDA eligibility, limits, fees | USDA HB-1-3555 + USDA eligibility site |
| Conventional, DTI, Conv 97, HomeReady | Fannie Mae Selling Guide |
| Home Possible | Freddie Mac Seller/Servicer Guide |
| PMI cancellation | Homeowners Protection Act |
| Loan Estimate / Closing Disclosure | CFPB TRID rules |
| Credit scoring, shopping window | FICO / VantageScore documentation |
| Colorado assistance | CHFA + county/municipal program pages |
| Colorado insurance and tax trends | CO Division of Insurance; CO DOLA |

## FOR EACH CLAIM, REPORT
1. The claim, quoted exactly as it appears in the content
2. Slide number(s)
3. What the primary source actually says
4. Publication date of the source
5. URL
6. VERDICT:
   - ✅ CONFIRMED — matches, cite with year
   - ⚠️ DIRECTIONAL — the shape is right, the precise figure isn't supportable.
        Supply directional replacement language.
   - 🔄 CHANGED — the figure moved. Give the new one and list affected slides.
   - ❌ UNSUPPORTED — cannot verify. Recommend cut or directional phrasing.

## PRIORITY ORDER — check these first
1. FHA annual MIP duration rules (<10% vs ≥10% down)
2. VA funding fee percentages and the disability waiver
3. CHFA and Colorado DPA program terms, income limits, AND FUNDING AVAILABILITY
4. USDA income limits and eligibility map changes for target areas
5. HomeReady / Home Possible income limits
6. Conforming and FHA loan limits for target Colorado counties
7. Mortgage credit scoring model requirements (subject to ongoing transition)
8. Credit shopping window ranges by scoring model
9. Colorado property tax assessment practice, especially new construction
10. Loan Estimate form layout — does it still match the slide graphics?

## ALSO VERIFY — the arithmetic
Independently recompute every figure in the canonical example. Do not trust the
stated results; re-derive them:
- Principal and interest at each rate shown
- Total PITI + MI
- Front-end and back-end DTI
- Total cash to close, and daily interest
- Points breakeven in months
- Amortization: first payment split, crossover month, lifetime interest, and the
  $100-extra-payment scenario
Report any discrepancy, however small — one wrong number in a deck built on a
single canonical example propagates to dozens of slides.

## FINALLY
List every slide that must be edited before delivery, and every claim that should
be CUT rather than corrected. State plainly whether the content is factually
cleared to deliver.
```

---

## Why the arithmetic re-derivation is in here

This deck's design decision — one canonical example throughout — is its greatest
strength and its single point of failure. A wrong P&I figure doesn't affect one
slide; it affects the payment stack, the DTI calculation, the cash to close, the
rate sensitivity table, the breakeven, and the amortization demo.

**Re-derive, don't spot-check.**

## Output location

`statistics/verified-YYYY-MM-DD.md` — never overwrite a prior verification. The
history is how you notice a number drifting across deliveries.
