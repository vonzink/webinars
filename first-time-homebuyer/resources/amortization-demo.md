# DEMO 3 — Amortization Calculator

**Slide 051 · 23:45 · 45 seconds · Module 5**
**Fallback:** `slides/051-fallback.md`

---

## What this demo has to prove

Two things, in this order, and **the order is the whole design**:

1. **The scary truth** — $545,000 of interest on a $427,500 loan. First payment is
   83% interest. Principal doesn't exceed interest until month 218.
2. **The lever** — $100/month saves ~$64,300 and ~3 years.

> **Never show #1 without immediately showing #2.** Fear without agency is what
> makes people avoid this topic entirely, and this webinar's whole job is the
> opposite. The scary number exists *only* to make the lever feel valuable.

This is the most-remembered moment in the webinar. Give it its 45 seconds.

---

## The setup

1. Pre-loaded: $427,500 · 6.500% · 30-year fixed
2. Amortization curve view (interest vs. principal over time)
3. **Extra payment field: $0** ← starts at zero
4. Zoom 150%
5. First-payment breakdown visible

**One field gets typed on stage: `100`.**

---

## The run — 45 seconds

**[0:00] Share. The curve is up.**

> "This is Maya and Dev's loan. Payment one of three hundred sixty."

*(Point at the first-payment split.)*

> "**Twenty-seven hundred and two dollars.** Of that, **twenty-three fifteen is
> interest.** Three eighty-seven is principal. Eighty-three percent of your first
> payment is rent on money."

**[0:14] The crossover.**

> "And it doesn't flip fast. See where the lines cross? That's **month 218.**
> Year eighteen. That's when you finally start paying more toward the house than
> toward the bank."

**[0:24] The scary number. Then STOP.**

> "Total interest over thirty years on this loan: about **five hundred forty-five
> thousand dollars.**"

*(**Pause. Two full seconds. Do not fill it.** This silence is doing work.)*

**[0:30] The turn.**

> "Okay. Now here's the lever, and it's the reason I don't mind showing you the
> scary number."

**Type `100` in the extra payment field.**

> "One hundred dollars a month. From day one."

*(Curve redraws. Tail collapses.)*

**[0:38] The payoff.**

> "Paid off in about **twenty-seven years** instead of thirty. Total interest drops
> to about **four hundred eighty-one thousand.** That is **sixty-four thousand
> three hundred dollars** back in your pocket, for a hundred bucks a month."

> "And unlike almost everything else we've talked about today — no lender, no
> approval, no market. **That one's entirely yours.**"

**[0:45] Out.** → Module 6.

---

## The two cautions — say them, they're 10 seconds and they matter

> "Two things. Confirm your servicer applies the extra to **principal** — some
> apply it to next month's payment instead, which does nothing. And don't do this
> before you have an emergency fund. Money in the house is hard to get back out."

*(Deliver these on the way out. Don't let them dilute the payoff — but don't skip
them. Sending someone's emergency fund into their mortgage is a real harm.)*

---

## Rules

- **The pause at 0:24 is scripted.** Two seconds. It is the most important silence
  in the webinar. Do not fill it, do not shorten it, do not laugh through it.
- Say every number aloud. Especially $545,000 and $64,300.
- Don't apologize for the big number or soften it. It's true. The honesty is why
  the lever is credible.
- Don't editorialize about banks. The moment this becomes "look how they get you,"
  it stops being education and starts being resentment — and the audience came for
  competence, not grievance.

---

## Failure plan

**Bridge line:**
> "Not loading. Doesn't matter — these are the numbers, and they're the ones I want
> you to remember anyway."

`slides/051-fallback.md`: the static curve with the crossover marked, the
first-payment split, and a side-by-side of the two scenarios.

| | No extra | +$100/mo |
|---|---|---|
| Payoff | 30 years | **~27 years** |
| Total interest | ~$545,200 | **~$480,900** |
| Difference | — | **~$64,300** |

The fallback works nearly as well here — the numbers *are* the moment. Deliver it
with the same pacing and the same pause.

---

## Pre-flight

- [ ] Loan pre-loaded with canonical figures
- [ ] First-payment split displays and matches ($2,315 / $387)
- [ ] Crossover at month 218 is visible on the curve
- [ ] Extra payment field accepts $100 and redraws
- [ ] Output matches `knowledge/examples.md` § Example 6
- [ ] Fallback slide populated and current
- [ ] Rehearsed **with the two-second pause** — twice
