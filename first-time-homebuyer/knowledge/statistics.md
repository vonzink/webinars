# Statistics Register

> **HARD RULE: no statistic goes on a slide until its `VERIFY` flag is cleared for
> the current delivery.** A number without a source and a date is how educational
> content quietly becomes wrong — and this deck will be presented repeatedly over
> months.

Status key:
- 🔴 `VERIFY` — must be checked against the primary source before delivery
- 🟡 `DIRECTIONAL` — the *shape* is reliable; do not state a precise figure
- 🟢 `STABLE` — structural/definitional; changes only by rule change (still confirm annually)

Confidence is about **how the claim should be spoken**, not about whether it's
true. When in doubt, speak the directional version. A cut statistic costs nothing.
A wrong one costs the whole webinar's credibility.

---

## Tier 1 — Load-bearing (the argument depends on these)

| # | Claim | Where | Primary source | Status |
|---|---|---|---|---|
| 1 | Median first-time buyer down payment is well below 20% | Slide 032 | NAR *Profile of Home Buyers and Sellers*, annual | 🔴 |
| 2 | Typical first-time buyer age has trended upward over the past decade | Optional, 018 | NAR *Profile*, annual | 🟡 |
| 3 | Median tenure in a home is well under 30 years | Slide 049 | NAR *Profile* / Census AHS | 🟡 |
| 4 | Most buyers do not shop multiple lenders | Slide 053 | CFPB origination/shopping research | 🔴 |
| 5 | Meaningful savings are available to borrowers who obtain multiple quotes | Slide 053 | CFPB / Freddie Mac shopping studies | 🔴 |

**How to speak Tier 1 if unverified at delivery time:**

- #1 → *"The median first-time buyer puts down far less than twenty percent — and
  has for a long time."* (No figure.)
- #3 → *"Most people don't keep a mortgage anywhere near thirty years. They move,
  or they refinance."* (No figure. The breakeven lesson works without one.)
- #4/#5 → *"A large share of buyers get exactly one quote. The savings available to
  people who get more than one are well documented and they are not small."*

The directional versions are honest and lose almost nothing. **Prefer them over a
risky precise number.**

---

## Tier 2 — Supporting

| # | Claim | Where | Source | Status |
|---|---|---|---|---|
| 6 | Contract-to-close commonly runs 30–45 days | Slide 014 | ICE/industry origination-insight reports | 🟡 |
| 7 | Down payment is the most-cited barrier for renters who want to buy | Slide 032 | NAR / Fannie Mae NHS | 🟡 |
| 8 | Homeowners insurance costs have risen notably in Colorado (wildfire/hail) | Slide 023 | CO Division of Insurance; III | 🔴 |
| 9 | Property tax rates in Colorado are low relative to national averages | Slide 022 | Tax Foundation; CO DOLA | 🟡 |
| 10 | Annual maintenance commonly planned at 1–2% of home value | Slide 023 | Widely used planning heuristic — **not a study** | 🟢* |

\* #10 is a **rule of thumb, not a finding.** Say "the common planning rule is" —
never "studies show."

---

## Tier 3 — Structural / rule-based

Not statistics — program rules. They change by policy, not by survey, so they get
confirmed against the primary guideline rather than a data source.

| # | Claim | Where | Source | Status |
|---|---|---|---|---|
| 11 | Conventional minimum down 3% (Conv 97 / HomeReady / Home Possible) | 032, 034 | Fannie Selling Guide; Freddie Guide | 🟢 |
| 12 | FHA minimum down 3.5% at 580+ | 032, 035 | HUD 4000.1 | 🟢 |
| 13 | FHA annual MIP generally lasts the life of the loan at <10% down | 035, 039 | HUD 4000.1 | 🔴 |
| 14 | VA allows 0% down, no monthly MI; funding fee applies and varies | 032, 036 | VA Lenders Handbook | 🔴 |
| 15 | VA funding fee waived for service-connected disability compensation | 036 | VA Lenders Handbook | 🟢 |
| 16 | USDA 0% down in eligible areas, with household income limits | 032, 037 | USDA HB-1-3555 | 🟢 |
| 17 | PMI: request removal at 80% LTV, automatic termination at 78% | 039 | Homeowners Protection Act | 🟢 |
| 18 | Loan Estimate due within 3 business days of application | 054 | TILA-RESPA (TRID) | 🟢 |
| 19 | Closing Disclosure due at least 3 business days before consummation | 014, 054 | TRID | 🟢 |
| 20 | Rate-shopping window commonly described as 14–45 days by model | 064 | FICO / VantageScore documentation | 🟡 |
| 21 | First-time buyer = no primary-residence ownership interest in 3 years | 034, FAQ | Program guidelines | 🟢 |
| 22 | Conventional DTI commonly to ~45%, can stretch to ~50% with AUS | 025 | Fannie Selling Guide; DU findings | 🟡 |
| 23 | CHFA offers first mortgages + DPA with income/price limits by county | 038 | CHFA program materials | 🔴 |

**#13, #14, #23 are the highest-risk items in the deck.** FHA MIP duration and VA
funding fee percentages are policy-set and have changed. CHFA terms and funding
availability change *within* a year. Verify all three before every delivery.

---

## Statistics deliberately NOT used

Cut on purpose. Do not reintroduce without a source.

| Rejected | Why |
|---|---|
| "X% of buyers regret their purchase" | Survey-dependent, wildly variable, and it's fear-selling |
| Any home price appreciation forecast | Nobody knows. Violates slide 005. |
| Any interest rate forecast | Same. |
| "Homeowners have Nx the net worth of renters" | True in aggregate and deeply confounded by selection. Presenting it as causal is dishonest. |
| "The average American moves every N years" | Conflates all moves with homeowner tenure |
| Any "you're losing $X/month by renting" figure | Ignores maintenance, taxes, transaction costs, and opportunity cost. Manipulative. |

---

## Verification procedure

Run `prompts/06-fact-check.md` at **T-7 days** before each delivery.

For each entry:
1. Open the **primary source**, not an article about it
2. Record the figure, the publication date, and the URL in `statistics/`
3. Update the status flag
4. If it cannot be verified → **use the directional phrasing or cut it**

**Never** cite a real estate blog, a lender's marketing page, or a news summary as
the source. Go to NAR, CFPB, HUD, VA, USDA, Fannie, Freddie, CHFA, or Census.

## Slide-level rule

Any slide displaying a statistic shows the **source and year in the footer.** If
there's no room for the citation, the slide has too much on it.
