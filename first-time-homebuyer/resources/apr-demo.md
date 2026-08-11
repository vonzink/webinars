# DEMO 2 — APR Calculator

**Slide 047 · 21:30 · 35 seconds · Module 5**
**Fallback:** `slides/047-fallback.md`

---

## What this demo has to prove

The audience has just been shown two loans (slide 045) and asked which is better.
Almost everyone said B — lower rate, lower payment. They've been sitting with that
answer for a full minute.

This demo does one thing:

> **Change the hold period, and the winner flips.**

The payload is that the deciding variable — *how long you keep the loan* — **appears
on neither Loan Estimate.** The most important input isn't on the document.

---

## The setup

1. Both loans pre-entered before going live:

| | Loan A | Loan B |
|---|---|---|
| Loan amount | $427,500 | $427,500 |
| Rate | 6.750% | 6.250% |
| Points | 0 | 2.00 ($8,550) |
| Other lender fees | $1,400 | $1,400 |

2. **Hold period slider set to 30 years** (the default APR assumption)
3. Total-cost comparison view visible
4. Zoom 150%

**Nothing gets typed on stage.** You move one slider. That's the entire demo.

---

## The run — 35 seconds

**[0:00] Share. Both loans already on screen.**

> "Here are the two loans, already loaded. And here are the APRs — which, notice,
> tell a different story than the rates did."

*(Point at the APRs.)*

> "Loan B still looks better here. Because APR assumes you keep this loan for the
> full thirty years."

**[0:12] The move. Drag the hold period to 3 years.**

> "Now watch what happens when I change one thing — how long you actually keep it."

*(Drag: 30 → 7 → 5 → 3. Slowly. Let each land.)*

**[0:22] The flip.**

> "There. At three years, **Loan A wins.** At five, it's basically a tie. At seven,
> B pulls ahead. Same two loans. The winner changes based on a number that appears
> on neither Loan Estimate."

**[0:32] The payload.**

> "So when a lender asks how long you plan to stay, that's not small talk. That's
> the most important input in the entire calculation, and it's the one nobody
> writes down."

**[0:35] Out.** → slide 048, points.

---

## Rules

- **Drag slowly.** The flip is the whole demo. If it happens fast, it doesn't land.
- **Say each number out loud** as the slider moves — this is the single most
  replay-hostile moment in the deck if you go silent.
- Don't re-explain APR. That was slides 044–046. This is the payoff, not a recap.
- Resist explaining the arithmetic. The breakeven math is slide 049, ninety seconds
  from now. Let it build.

---

## Failure plan

**Bridge line:**
> "Not loading — no problem. Here's the output, and honestly the number I want you
> to remember is on the next slide anyway."

Advance to `slides/047-fallback.md`: a static table showing total cost at 3 / 5 / 7
/ 30 years, with the winner highlighted per row. **Same argument, same payload.**

| Hold | Loan A | Loan B | Winner |
|---|---|---|---|
| 3 years | — | — | **A** |
| 5 years | — | — | ~tie |
| 7 years | — | — | **B** |
| 30 years | — | — | **B** |

*(Populate from `knowledge/examples.md` § Example 5.)*

---

## Pre-flight

- [ ] Both loans pre-entered and saved
- [ ] Hold-period control works and updates the comparison live
- [ ] The flip is visible at 3 years — **verify this specifically**; if the tool
      doesn't produce a flip, the demo has no payload and must be re-scoped
- [ ] APR figures match `references/canonical-example.md`
- [ ] Fallback table populated with current numbers
- [ ] Rehearsed under 35 seconds
