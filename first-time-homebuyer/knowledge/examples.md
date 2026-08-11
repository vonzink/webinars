# Worked Examples

Every calculation used in the webinar, shown fully so it can be checked, rebuilt,
or re-derived if the canonical example ever changes.

**All figures hypothetical. Not quotes, offers, or commitments to lend.**
Source of truth: `references/canonical-example.md`.

---

## Example 1 — The payment stack

$450,000 purchase · 5% down ($22,500) · **$427,500 loan** · 30-yr fixed · 6.500%

**Principal & interest**

```
M = P × [ r(1+r)^n ] / [ (1+r)^n − 1 ]

P = 427,500 · r = 0.065/12 = 0.00541667 · n = 360
(1+r)^n  = 6.99209
M = 427,500 × (0.00541667 × 6.99209) / (6.99209 − 1)
M = $2,702
```

**The rest**

| Component | Basis | Monthly |
|---|---|---|
| P&I | above | $2,702 |
| Taxes | $450,000 × 0.55% ÷ 12 | $206 |
| Insurance | $1,800/yr ÷ 12 | $150 |
| MI | $427,500 × 0.35% ÷ 12 | $125 |
| HOA | — | $0 |
| **Total** | | **$3,183** |

*(HOA variant: +$250 → $3,433.)*

---

## Example 2 — The hidden five

| Item | Monthly |
|---|---|
| Maintenance reserve (~1% of value/yr, amortized) | $375 |
| Utility delta vs. apartment | $150 |
| Furnishing (amortized over year one) | $150 |
| Commute change | $0–200 |
| Tax/insurance escalation reserve | $75 |
| **Planning figure used on slide 023** | **~$450** |

All-in: **$3,183 + $450 = $3,633**
Payment shock vs. $2,150 rent = **$1,483/month**
Payment-Shock Test over 3 months = **$4,449 saved**

---

## Example 3 — DTI: approved at the ceiling

Income **$8,800/mo** gross. Debts: car $415 + student $290 + cards $75 = **$780**.

```
Back-end = (3,183 + 780) / 8,800 = 45.03%  →  45.0%
```

**They qualify — right at the line commonly used on conventional loans.** A lender
runs this file and says yes.

> **Front-end (36.2%) is deliberately not taught.** Only back-end governs. v4 spent
> 25 seconds installing a term the audience never uses again.

---

## Example 3b — ⭐⭐ THE $105,000 GAP

**Price factor** — total PITI+MI per $1 of purchase price (95% LTV, 6.500%,
CO taxes ~0.55%, insurance ~0.4%/yr, MI 0.35%):

```
0.95 × 0.0063205  (P&I)       = 0.00600448
        0.00045833 (taxes)     = 0.00045833
        0.00033333 (insurance) = 0.00033333
0.95 × 0.00029167 (MI)         = 0.00027708
                        TOTAL   = 0.00707340 per $1 of price
```

Verify: $450,000 × 0.00707340 = **$3,182.80** ✓

**Comfortable target:** PITI+MI of **$2,450** → back-end (2,450+780)/8,800 = **36.7%**,
all-in ≈ $2,850, a **+$700** step up from $2,150 rent instead of +$1,483.

```
2,450 / 0.00707340 = $346,368  →  stated as $345,000 (rounded down)
450,000 − 345,000  = $105,000
```

> **The bank says $450,000. The honest number is $345,000. A $105,000 gap.**

*Rounding note: the unrounded figure is $346,368. It is rounded **down** to
$345,000 — the conservative direction for an affordability number — which makes the
gap exactly $105,000.*

---

## Example 3c — ⭐⭐ CLOSING THE GAP

Every **$1/month** of debt removed converts to purchase price at
**1 ÷ 0.00707340 = $141.37**, i.e. **≈ $141 of house per $1/month.**

```
Car payment      $415 / 0.00707340 = $58,671  →  ≈ $59,000
Student loan     $290 / 0.00707340 = $40,999  →  ≈ $41,000
Both             $705 / 0.00707340 = $99,670  →  ≈ $100,000
```

> **"Your car payment is worth $59,000 of house."**

**Both debts ≈ $100,000 of the $105,000 gap.** Same income, same credit, same
everything.

**Say the tradeoff out loud (slide 014):** for many buyers the cash that would pay
off the car *is* the down payment. That is a real trade — the point is that it is
now a trade they can evaluate, not advice to follow blindly.

---

## Example 4 — Rate sensitivity

$427,500, 30-year fixed, P&I only:

| Rate | P&I | Δ |
|---|---|---|
| 5.500% | $2,427 | −$275 |
| 6.000% | $2,563 | −$139 |
| **6.500%** | **$2,702** | — |
| 7.000% | $2,844 | +$142 |
| 7.500% | $2,990 | +$288 |

**Deriving the portable rule:**
0.5% ≈ **$140/month**. At 6.5%, $140/mo buys 140 ÷ 0.0063205 ≈ **$22,150** of
loan ≈ **~$23,000 of purchase price** at 95% LTV.

> **Half a point of rate ≈ $140/month ≈ $23,000 of house.**

---

## Example 5 — Points and breakeven ⭐

Same $427,500 loan, two lenders, same day:

| | Loan A | Loan B |
|---|---|---|
| Rate | 6.750% | 6.250% |
| Points | 0 | 2.00 = $8,550 |
| Other lender fees | $1,400 | $1,400 |
| P&I | $2,773 | $2,632 |
| Monthly difference | — | **$141** |

```
Breakeven = 8,550 / 141 = 60.6 months ≈ 5 years 1 month
```

| Hold period | Better loan | Why |
|---|---|---|
| 3 years | **A** | Only $5,076 recovered of $8,550 |
| 5 years | ~even | $8,460 recovered — essentially the line |
| 7 years | **B** | $11,844 recovered, ahead by ~$3,294 |
| 30 years | **B** | ~$42,000 ahead |

---

## Example 6 — Amortization ⭐

$427,500 @ 6.500%, 30-year.

**Payment 1 of 360:**
```
Interest  = 427,500 × 0.00541667 = $2,315
Principal = 2,702 − 2,315        = $387
```
83% of payment one is rent on money.

**Lifetime:** 2,702 × 360 − 427,500 = **≈ $545,200 interest**
**Crossover** (principal first exceeds interest): **month 218**, year 18.

**The $100 experiment** — payment becomes $2,802:
```
n = −ln(1 − P·r/PMT) / ln(1+r)
  = −ln(1 − 2,315.63/2,802) / ln(1.00541667)
  = 1.751128 / 0.005402046
  = 324.2 months ≈ 27.0 years

Interest = 2,802 × 324.2 − 427,500 ≈ $480,900
```
**Saves ≈ $64,300 and ~3 years.**

---

## Example 7 — Cash to close ⭐

| Item | Amount |
|---|---|
| Down payment | $22,500 |
| Closing costs (Sections A+B+C+E) | $5,400 |
| Prepaid interest — 15 days × $76.14 | $1,142 |
| Homeowners insurance, 12 months | $1,800 |
| Escrow reserves — 3 mo tax ($618) + 2 mo ins ($300) | $918 |
| **Cash to Close** | **$31,760** |
| Less earnest money | −$5,000 |
| **Due at the table** | **$26,760** |

Daily interest = 427,500 × 0.065 ÷ 365 = **$76.14**

**The closing-date lever:** closing on the 28th vs. the 3rd moves roughly
**$1,900** of cash to close. It doesn't reduce total interest owed — but if cash at
the table is the binding constraint, it's real.

---

## Example 8 — Builder incentive math ⭐

$15,000 credit if the buyer uses the builder's lender.

| | Builder's lender | Outside lender |
|---|---|---|
| Rate | 6.750% | 6.500% |
| Section A | ~$4,400 | ~$1,400 |
| Credit | $15,000 | $0 |

```
Rate difference ≈ $70/month
Over 7 years (expected hold)     = $5,880
Extra Section A                  = $3,000
Total extra cost                 = $8,880
Net value of the $15,000 credit  = $6,120
```

**The builder's lender wins by ~$6,100 — and he was told to take it.**
The lesson is the ten minutes of arithmetic, not the answer.

---

## Example 9 — MI removal

| Threshold | Value | Loan balance needed | Paydown from $427,500 |
|---|---|---|---|
| Request removal | 80% LTV | $360,000 | $67,500 |
| Automatic termination | 78% LTV | $351,000 | $76,500 |

At the scheduled amortization pace, 80% arrives in roughly year 9–10 on payments
alone. Appreciation can accelerate it materially — but appreciation-based removal
is **servicer and investor discretion**, including seasoning requirements. Not an
entitlement. Call and ask for the policy in writing.

---

## Verification

Recompute all of the above whenever the canonical example changes. Rounding: P&I to
the nearest dollar; percentages to one decimal. Independently re-derived during
`prompts/06-fact-check.md`.
