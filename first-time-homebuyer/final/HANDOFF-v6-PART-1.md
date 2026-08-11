===== HANDOFF v6 · PART 1 OF 2 · 2026-07-30 =====
SUPERSEDES v5 ENTIRELY. Leadership redirect. Do not build from any earlier file.

# FIRST-TIME HOMEBUYER WEBINAR — v6

**Mountain State Financial Group LLC · NMLS #1314257**
Presenter: **Seth Angell · Executive VP · NMLS #912881**

---

## WHAT CHANGED FROM v5

| | v5 | **v6** |
|---|---|---|
| Style | Number-driven, one canonical example throughout | **Bullet-driven, conversation-focused** |
| Slides | 47 dense | **~22 main slides**, one concept each |
| Detail | On the slide | **Inside popouts** (HTML) / **extra slides** (PPT) |
| Calculators | 3 live demos | **Removed** — they invite viewers to run their own math |
| Numbers | A full worked household scenario throughout | **Comparison numbers only.** No personal scenario. |
| Sections | 8 | **7 new** — Myths, Budget, Programs, Process, Mistakes, Questions, Wrap |
| "Your Next Step" | Present | **REMOVED** |

**The governing rule:** every slide teaches **ONE** concept. If a slide has two, it's
two slides. The presenter does the talking; the slide reinforces, never competes.

## 🔴 THE NUMBERS RULE — read this before building anything

**The concern is not numbers. It's arithmetic.** Leadership's worry is that a viewer
handed a full worked scenario stops listening and starts running *their own* numbers —
they're doing math instead of learning the concept. That's the thing to prevent.

**So the test is: does this number ask the viewer to CALCULATE, or to COMPARE?**

✅ **COMPARISON NUMBERS — use them. They teach.**
The viewer reads the *gap between two things*, not a value to apply to themselves.
- **Breakeven** — two loans, where the crossing point is the lesson
- **Rate vs. APR** — the gap between them is the entire point
- **Average rent trend vs. a fixed mortgage payment** — two lines diverging
- **Closing costs vs. cash to close** — the difference is the teaching
- **Program percentages** — 3%, 3.5%, 0%. These are *rules*, not examples

✅ **Popouts** — the natural home for anything more detailed. Opt-in by definition.

❌ **PERSONAL-SCENARIO NUMBERS — avoid on main slides.**
A full worked example — income, debts, DTI, a specific home price — invites every
viewer to substitute their own figures and stop listening. That's the failure mode.

❌ **LIVE CALCULATORS — removed.** Same reason, amplified.

**Rule of thumb:** if the number's job is to make a **relationship visible**, keep it.
If its job is to model **one household's situation**, cut it or move it to a popout.

**Label comparison diagrams clearly.** Two lines crossing, two bars of visibly different
length, a trend stepping up beside one holding flat. The shape carries the lesson; the
numbers confirm it.

---

## GLOBAL DESIGN RULES

**Palette — unchanged from v5, verified.**

| Role | Hex | Always means |
|---|---|---|
| **Deep Teal** | `#104547` | Primary · headlines · dark fields · principal |
| **Green** | `#4b7b4d` | Secondary · positive · "do" · taxes |
| **Lime** | `#8cc63E` | **ACCENT — fill/shape only** · mortgage insurance |
| **Charcoal** | `#2E3532` | Negatives · "don't" · interest · money spent |
| Dark Gray | `#3D4650` | Body text |
| Mid Gray | `#8A9099` | Secondary text · source lines · legal |
| White / Off-white | `#FFFFFF` / `#F5F7F5` | Backgrounds |
| Near-black | `#0B1210` | Emotional beats only |

🔴 **THE LIME RULE.** `#8cc63E` is **2.1:1 on white — it FAILS contrast.**
The accent is a **LIME SHAPE**; text stays **DEEP TEAL**. A lime bar under a heading,
a lime card fill with teal text on it, a lime underline, a lime chart segment.
**Never lime type on a light ground.** One accent element per slide.
*(The logo wordmark sets lime on white — logotypes are WCAG-exempt. Don't "fix" it,
don't read it as permission.)*

**No red in the palette.** Charcoal carries all negatives. For DON'Ts and warnings use
**Charcoal + an ✗ shape**, never colour alone.

**Visual language — the five-band triangle.** The MSFG mark is a banded triangle, lime
apex → deep teal base, hard edges. Use that banding in every diagram: the payment
stack, the budget waterfall, the process timeline. **Banded fills, never soft
gradients.** This is what makes it read as MSFG's rather than a template.

**Type.** Inter or MSFG brand family. **Tabular figures on any number.**
Headline 54–64pt · body 28–32pt · **28pt floor** · legal 16pt.
Watched at ~40% viewport — everything is larger than presentation instinct suggests.
Bold for emphasis, never italic.

**Layout.** 16:9. **Upper-right reserved for webcam** — nothing critical there, ever.
Lots of whitespace. Large typography. Strong hierarchy.

**Animation.** Purposeful, 200–300ms ease-out, max 5 elements per build.
No spins, bounces, flips, 3D. Modals fade + scale from 0.96 → 1.0 in 200ms.

**Section titles.** Large title in the **UPPER LEFT**. **No large numerals** — the "01"
styling is removed everywhere.

---

## POPOUT ARCHITECTURE

**HTML:** clickable card → modal. Dim the background to 60%, scale-fade in, close on
✗ / Esc / backdrop click. Focus trapped, focus returned on close. Keyboard reachable.

**PowerPoint:** each popout becomes **a separate slide**, hyperlinked from the card,
with a "← Back" action returning to the parent.

**Build ONE modal component and one card component.** Every popout in this deck uses
them. No duplication.

**Standard modal structure** — same skeleton every time:
```
TITLE
[optional one-line subhead]
Body — bulleted, max 6 bullets per section
Section headers where the content calls for them
```

---

## ACCESSIBILITY

WCAG AA contrast · 28pt content floor · never colour alone — every coded element also
carries a label, icon, or position · modals keyboard-operable with trapped focus ·
`aria-label` on every clickable card · smooth animation, `prefers-reduced-motion`
respected · **preserve all existing responsiveness.**

---

## COMPLIANCE — not optional, not decorative

- **Footer, every slide except the emotional beats:**
  `Seth Angell · NMLS #912881 · Mountain State Financial Group LLC · NMLS #1314257 · 🏠 Equal Housing Lender`
- Any slide or popout containing a rate, payment, or cost carries at 16pt:
  *"Hypothetical illustration for education only. Not a quote, offer, or commitment to lend."*
- **Program details are general guidelines, never eligibility determinations.**
  Every program popout carries: *"General guidelines only. Actual eligibility depends
  on full underwriting, credit, property, and lender overlays."*
- No rate quotes. No rate forecasts. No urgency, scarcity, or countdowns.

---
---

# SLIDE 1 — OPENING

**ONE CONCEPT:** who is speaking, and how to reach them.

**LAYOUT:** Portrait left third. Text right two-thirds on Off-white. Clean, generous
whitespace. No logo wall, no credential badges.

**ON SLIDE:**
```
First-Time Homebuyer Webinar
Mountain State Financial Group

Seth Angell
Executive VP · NMLS #912881

📞  [PHONE — placeholder]
✉️  info@msfgmortgage.com
✉️  [SECONDARY EMAIL — placeholder]
```

**VISUAL:** Portrait is a swappable image component *(three presenters share this
deck — see PRESENTER COMPONENT below)*. Contact block set at **32pt minimum** —
readable on a replay.

**ANIMATION:** Name fades in, then contact block, 200ms stagger.

**PRESENTER NOTES:** Introduce yourself in under 20 seconds. Name, role, and that the
next 40 minutes are education, not a sales pitch. Two promises: *"I won't quote you a
rate, and I won't tell you where rates are going — nobody knows."*

**TIME:** 0:45

---
---

# SECTION — BUYING MYTHS

### SECTION TITLE SLIDE
**LAYOUT:** Full-bleed Deep Teal. **Title upper-left, large.** No numeral.
**ON SLIDE:** `Buying Myths`
**VISUAL:** White knockout logo, small, bottom-right. Banded-triangle motif bleeding
off the right edge at low opacity.
**TIME:** 0:10

---

## MYTH SLIDE 1 — The Five Myths

**ONE CONCEPT:** most of what you've been told about buying is outdated.

**HEADLINE:** What everybody told you
**SUBHEAD:** Click any one.

**LAYOUT:** Five cards in a responsive grid — 3 across on desktop, 2 on tablet,
1 stacked on mobile. Generous gutters. Each card: short myth text, a subtle lime
underline, and a clear affordance that it opens.

**THE FIVE CARDS:**
1. You need 20% down
2. FHA is only for first-time buyers
3. You need perfect credit
4. Renting is always cheaper
5. Always choose the lowest interest rate

**ANIMATION:** Cards stagger in 60ms apart. Hover lifts 2px + lime underline extends.

**PRESENTER NOTES:** Don't read the cards — the audience can read. Ask which one they
believed. Open the two the room reacts to. You do not have to open all five.

**TIME:** 1:30 + popouts

---

### POPOUT STRUCTURE — every myth uses these five headers

```
WHY PEOPLE BELIEVE IT
THE REALITY
PROS
CONS
WHAT YOU SHOULD ACTUALLY KNOW
```

---

### MODAL 1.1 — "You need 20% down"

**WHY PEOPLE BELIEVE IT**
- It's what their parents did, and it was closer to true a generation ago
- 20% genuinely does avoid monthly mortgage insurance — so the number isn't invented
- "Avoids one specific fee" quietly became "required"

**THE REALITY**
- Conventional loans go as low as 3% down
- FHA as low as 3.5%
- VA and USDA can be 0% down for those who qualify
- The median first-time buyer puts down far less than 20%, and has for a long time

**PROS of putting 20% down**
- No monthly mortgage insurance
- Lower payment · smaller loan · more instant equity
- A stronger-looking offer in a competitive situation

**CONS**
- Saving to 20% takes years, and the target moves as prices move
- Years of rent paid while saving builds no equity
- Drains the cash reserve you'll want *after* closing

**WHAT YOU SHOULD ACTUALLY KNOW**
- Mortgage insurance on a conventional loan is **removable** — it's a phase, not a sentence
- Waiting can be the right call. It should be a **decision**, not a default
- Run the comparison before you commit to years of saving

---

### MODAL 1.2 — "FHA is only for first-time buyers"

**WHY PEOPLE BELIEVE IT**
- FHA is marketed heavily to first-time buyers
- The two get mentioned together constantly

**THE REALITY**
- **FHA has no first-time buyer requirement.** Anyone eligible can use it
- It's a primary-residence program, not a first-timer program
- Separately: most "first-time buyer" programs define it as *no ownership interest in a
  primary residence for three years* — so you can have owned before and still qualify

**PROS**
- More forgiving on credit history and past derogatory events
- Higher debt-to-income tolerance in many scenarios
- Assumable by a qualified buyer — genuinely valuable on a below-market rate

**CONS**
- On most FHA loans with less than 10% down, mortgage insurance lasts the **life of the loan**
- Upfront mortgage insurance premium is added to the balance
- Property condition standards can complicate some purchases

**WHAT YOU SHOULD ACTUALLY KNOW**
- FHA isn't "worse" — it's **different**. Run it against conventional both ways
- For many buyers the plan is *FHA to get in, refinance later.* That's legitimate —
  just know the exit depends on future rates nobody can promise

---

### MODAL 1.3 — "You need perfect credit"

**WHY PEOPLE BELIEVE IT**
- Advertised rates are footnoted "assumes excellent credit"
- Being declined feels like a character judgment, so people don't ask

**THE REALITY**
- Pricing moves in **tiers**, not smoothly. Small moves near a tier edge matter; large
  moves inside a tier often don't
- FHA and VA reach meaningfully lower than conventional
- Lender overlays vary — the same borrower gets different answers at different lenders

**PROS of a higher score**
- Better pricing · lower mortgage insurance · more program options · more flexibility

**CONS of waiting for "perfect"**
- Chasing a top-tier score can delay a purchase for no real benefit
- Meanwhile prices and rents keep moving

**WHAT YOU SHOULD ACTUALLY KNOW**
- The score in your banking app usually isn't your **mortgage** score — different model,
  three bureaus, and the **middle** score is used
- Two borrowers? Generally the **lower** of the two middles drives pricing
- **Utilization is roughly 30% of the score and can move in one billing cycle** — the
  fastest legitimate lever there is
- **Don't close old cards.** It shortens history and raises utilization

---

### MODAL 1.4 — "Renting is always cheaper"

**WHY PEOPLE BELIEVE IT**
- Month one, it often *is* — no maintenance, no taxes, no surprise repairs
- The comparison usually stops at the payment

**THE REALITY**
- Rent generally rises over time. A fixed-rate principal-and-interest payment doesn't
- Ownership builds equity; rent doesn't
- But ownership carries costs renting doesn't: maintenance, taxes, insurance, and the
  transaction costs of buying and selling

**PROS of renting**
- Flexibility · capped, predictable monthly cost · no maintenance risk · no transaction costs

**CONS of renting**
- No equity · no fixed housing cost · no control over increases or whether you can stay

**WHAT YOU SHOULD ACTUALLY KNOW**
- Over **short** horizons, renting frequently wins — transaction costs alone can exceed
  the equity built
- Over **long** horizons, ownership usually wins
- **"Renting is throwing money away" is a sales line, not an analysis.** If there's a
  real chance you move within a couple of years, renting may genuinely be correct

---

### MODAL 1.5 — "Always choose the lowest interest rate"

**WHY PEOPLE BELIEVE IT**
- The rate is the only number anybody advertises
- It's the easiest thing to compare, so it becomes the only thing compared

**THE REALITY**
- A lower rate is often **bought** with points paid at closing
- Two loans at the same rate can differ substantially in lender fees
- The lowest rate and the lowest cost are frequently **not the same loan**

**PROS of a lower rate**
- Lower monthly payment · less interest over a long hold · more buying power

**CONS**
- Points are cash out of pocket today
- If you sell or refinance before the breakeven, that money is simply gone
- Chasing rate can hide high origination charges entirely

**WHAT YOU SHOULD ACTUALLY KNOW**
- Ask for **rate AND total cost**, not rate alone
- Compare **origination charges** between lenders — that's where they actually differ
- Compare Loan Estimates issued the **same day**; rates move
- **Getting more than one quote does not hurt your score** — mortgage inquiries inside a
  shopping window count as one

---

## MYTH SLIDE 2 — Lowest Rate vs Lowest Cost

**ONE CONCEPT:** the cheapest rate is often not the cheapest loan.
**✅ COMPARISON NUMBERS BELONG HERE** — this is the exact use case they're good for.

**HEADLINE:** Lowest rate ≠ lowest cost
**SUBHEAD:** They're different questions.

**LAYOUT:** Two loan cards side by side — same loan amount, same day, two lenders:

| | **Loan A** | **Loan B** |
|---|---|---|
| Rate | 6.750% | **6.250%** |
| Points | none | 2.00 points |
| Monthly payment | higher | **lower** |

*Ask the room which is better. Almost everyone says B. Then show the diagram.*

Below, a **breakeven diagram** — two cumulative-cost lines over a time axis. Loan B
starts higher *(points paid up front)* and rises more slowly. They **cross**.

> ### Breakeven: about 5 years
> #### Cost of the points ÷ the monthly saving

Left of the crossing: **"Sold or refinanced — the points were wasted."**
Right of the crossing: **"Stayed — the points paid off."**

**Time axis:** `Move in` → `3 years` → `5 years` → `Long term`

🔴 Rates shown are **hypothetical illustrations, not quotes.** Label on-slide.

**AROUND THE DIAGRAM, six labelled chips** *(each clickable → popout)*:
`Interest Rate` · `APR` · `Closing Costs` · `Lender Credits` · `Discount Points` · `Breakeven`

**ANIMATION:** Cards in. *(Pause — take the room's answer.)* Line A draws. Line B draws.
Crossing point pulses with a lime dot. Zone labels last. ~2 seconds — let it land.

**PRESENTER NOTES:**
> "Which one's better? …Almost everyone says B — lower rate, lower payment, both things
> you've been trained to shop for. And B might be right. But you can't tell yet, because
> nobody's told you the one thing that decides it."
>
> *(reveal the diagram)*
>
> "B's lower rate was **bought.** Two points, paid in cash at closing. Roughly five years
> to earn it back. Keep the loan longer and B wins. Sell or refinance sooner and you lit
> that money on fire for a better-looking number on a piece of paper."
>
> "And it's the **loan**, not the house — refinancing ends the loan even if you never
> move. Most first-time buyers badly overestimate how long they'll keep one."

**Chip popouts — one screen each, no numbers:**
- **Interest Rate** — what the payment is calculated from. Not the whole cost.
- **APR** — rate plus certain lender costs, spread over the full term. A comparison
  tool, not your payment rate. It assumes you keep the loan the entire term — most
  people don't, which is where it misleads.
- **Closing Costs** — what you pay to get the loan and transfer the property. Some are
  shoppable, some aren't. Origination charges are where lenders genuinely differ.
- **Lender Credits** — the trade in reverse. Take a higher rate, the lender covers some
  costs. **Frequently right for a cash-tight buyer, and rarely volunteered. Ask.**
- **Discount Points** — prepaid interest to permanently lower the rate. A bet on how
  long you keep this exact loan.
- **Breakeven** — cost of the points divided by the monthly saving. If you won't clearly
  pass it, don't pay them.

**TIME:** 3:00

---
---

# SECTION — BUDGET

### SECTION TITLE SLIDE
**ON SLIDE:** `Budget` — upper-left, large, no numeral. Full-bleed Deep Teal.
**TIME:** 0:10

---

## BUDGET SLIDE 1 — Rent vs Buying

**ONE CONCEPT:** waiting usually makes ownership more expensive, but buying is a
stepping stone — not a forever decision.
**✅ TREND COMPARISON BELONGS HERE.** Average rent rising against a fixed principal-and-
interest payment holding flat is exactly the kind of number that teaches. Show the two
lines with real directional data and a source line. **Avoid a personal worked scenario.**

**HEADLINE:** Renting isn't wrong. Waiting is expensive.

**LAYOUT:** A timeline running left to right across the slide, labelled in words:
`Today` → `A few years` → `Later`.

**Three elements:**
- **Average rent** (Charcoal) — steps upward at each renewal. Cite a real source, 18pt
- **A fixed principal-and-interest payment** (Deep Teal) — a **flat line.** The contrast
  between the stepping line and the flat line is the whole slide
- **Home values** (lime banding) — a longer, generally rising line

⚠️ The flat line is **principal and interest only** — say out loud that taxes, insurance,
and HOA still move. Do not imply the total payment is fixed.

**Beneath, an equity bar** that visibly grows along the same timeline while the rent
line simply resets higher.

**FIVE BULLETS, right side:**
- Rent has generally trended upward over time
- Home values generally appreciate over long periods
- Equity compounds — rent doesn't
- Most people buy a **starter home**, not a forever home
- Buying is a **stepping stone**, not a life sentence

**ANIMATION:** Timeline draws. Rent steps up one increment at a time. Value line draws.
Equity bar fills last.

**PRESENTER NOTES:**
> "Two things move at once. Rent tends to go up, and home values tend to go up over
> time. Which means waiting isn't neutral — it usually costs something. But I want to
> take the pressure off the other side too: **almost nobody's first house is their last
> house.** You are not choosing where you'll die. You're choosing where you start."

🔴 **Compliance:** general long-term patterns, **not a forecast or guarantee.** Do not
imply values always rise or that any specific outcome is assured. No urgency framing.
Any rent or appreciation figure carries a **visible source and year** at 18pt — and it
must be verified before delivery, not estimated.

**TIME:** 2:30

---

## BUDGET SLIDE 2 — How a Mortgage Payment Works

**ONE CONCEPT:** what's in the payment, and which parts can change.
**🔴 NO DOLLAR FIGURES. Proportional stack only.**

**HEADLINE:** What you're actually paying

**LAYOUT:** A **horizontal banded stack** — the deck's signature graphic, echoing the
logo's five bands. Segments sized proportionally but **unlabelled by amount**:

`Principal` · `Interest` · `Taxes` · `Insurance` · `Mortgage Insurance` · `HOA`

Semantic colours locked: Principal Deep Teal · Interest Charcoal · Taxes Green ·
Insurance Mid Gray · **MI Lime** · HOA Charcoal.

**Beneath the stack, two columns:**

| ✓ **What cannot change** | ⚠ **What can** |
|---|---|
| Your interest rate *(on a fixed-rate loan)* | Property taxes |
| Your principal & interest payment | Insurance premiums |
| Your loan term | Mortgage insurance *(it can come off)* |
| | HOA dues |
| | Special assessments |

**Two clickable chips below:** `Escrow` · `Amortization`

**ANIMATION:** Segments build one at a time. Then the two columns fade in. The
"can change" items get a subtle pulse.

**PRESENTER NOTES:**
> "The single most misunderstood thing in this business: **fixed rate does not mean
> fixed payment.** Your rate is fixed. Your taxes and insurance are not, and your
> lender collects those monthly and pays them for you. When they go up, your payment
> goes up. That's not a fee and nobody's taking advantage of you — but it surprises
> people every single year."

**MODAL — Escrow**
- An account your lender manages on your behalf
- They collect roughly a twelfth of your annual taxes and insurance each month
- They pay those bills when due
- **It is not a fee, and it is not their money** — it's yours, collected early
- Reviewed annually. If taxes or insurance rise, your monthly payment rises
- A shortfall can mean both a higher payment **and** a one-time catch-up bill

**MODAL — Amortization**
- Early payments are mostly **interest**; later payments are mostly **principal**
- It shifts gradually — the crossover takes many years on a 30-year loan
- **Extra principal payments early have outsized effect** — they remove interest that
  would have compounded for decades
- ⚠️ **Refinancing restarts the schedule.** A new 30-year loan puts you back at the
  interest-heavy beginning, even at a lower rate. That doesn't make refinancing wrong —
  it makes it a calculation
- Confirm your servicer applies extra payments to **principal**, not to next month

**VISUAL for the amortization modal:** a two-band area chart — interest shrinking,
principal growing, crossing partway through. **No axis values.**

**TIME:** 3:00

---

## BUDGET SLIDE 3 — Budgeting

**ONE CONCEPT:** don't become house poor.
**🔴 NO SPREADSHEETS. Icons and a waterfall.**

**HEADLINE:** The house is not the whole life
**SUBHEAD:** Where the money actually goes.

**LAYOUT:** A vertical **waterfall**, each step in a banded block descending the slide,
each with an icon:

```
💵  INCOME
     ↓
🏠  HOUSING PAYMENT
     ↓
🛒  LIVING EXPENSES
     ↓
🛟  EMERGENCY SAVINGS
     ↓
✨  DISPOSABLE INCOME
```

Each block visibly narrower than the one above — the funnel *is* the message. The final
block, **Disposable Income**, gets the lime accent.

**FIVE BULLETS, right side:**
- Avoid becoming house poor
- Quality of life is part of the math
- Leave room for emergencies — the furnace doesn't schedule itself
- Payments can increase after you close
- **Builder incentives can sometimes create negative equity** ← clickable

**ANIMATION:** Blocks cascade top to bottom, 150ms apart. Disposable Income lands last.

**PRESENTER NOTES:**
> "A lender's job is to determine whether you'll repay. That's the only question the
> guidelines ask. It is **not** 'will you be okay.' Nobody in your transaction is asking
> that one — so you have to. The number you can technically qualify for and the number
> you can comfortably live with are usually not the same number, and the gap between
> them is bigger than most people expect."

**MODAL — Why builder incentives can create negative equity**
- Builders often prefer giving **incentives** over cutting price — a price cut sets a
  comparable sale that lowers value for every other home in the subdivision
- A large incentive can mean you paid closer to full price for a home whose resale value
  reflects the neighbourhood, not the incentive
- Selling in the first few years can mean owing more than the home brings
- **This is riskiest for first-time buyers**, who move sooner than they expect and have
  the least equity cushion
- Ask what the incentive is **worth in cash**, and ask whether a **price reduction** is
  available instead. A price reduction is permanent

**TIME:** 2:30

---

**→ CONTINUED IN PART 2:** Loan Programs · The Process · Mistakes to Avoid ·
Questions · Wrap Up · Presenter Component · Placeholder Register · Slide Count
