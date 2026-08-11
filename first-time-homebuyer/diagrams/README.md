> ⚠️ **Slide numbers below are v4.** Content specs remain valid; map to v5 via
> `../versions/v5/hero-slides.md`. New v5-only diagrams are marked **NEW** in the table.

# diagrams/

Build specs for the designer. **Five hero assets carry the deck** — build these five
properly and the rest is layout.

Colors and semantic assignments: `../branding/colors.md`. **The semantic color rule
is not optional** — the same concept must be the same color in every graphic, or the
audience pays a beat reconciling them each time.

---

## HERO 1 — The 9-Stage Process Map
**First: slide 010 · Recurs: footer progress indicator on every section slide · Also: download #1**

Horizontal track, 9 stops, left to right. Stage 3 ("House hunting") in **Alpenglow** —
the whole point of the graphic is that it's third, not first.

**Also produce:** a compressed footer variant (10 dots on a line, current position
lit) and a print variant for the checklist PDF.

*This is the most-reused asset in the project. Build it first, build it well.*

---

## HERO 2 — The Payment Stack
**First: slide 022 · Recurs: 021, 023, 025, 029, 059**

Horizontal stacked bar, six segments, with `$3,183` at 200pt beside it.

| Segment | Value | Color |
|---|---|---|
| Principal & Interest | $2,702 | Summit Navy `#12233A` |
| Taxes | $206 | Ridge Blue `#2C4A6E` |
| Insurance | $150 | Stone `#8A9099` |
| Mortgage Insurance | $125 | Aspen Gold `#E8B33A` |
| HOA | $0 (variant $250) | Slate `#3D4650` |

**Variants required:**
- **021** — four segments only (P, I, T, I), building in
- **023** — the same bar with five translucent Alpenglow "ghost" segments landing on
  top; total recomputes $3,183 → $3,633
- **025** — reused beside the DTI gauges

⚠️ **Pixel-identical across all appearances.** Any drift reads as a new graphic.

---

## HERO 3 — The Two-Loan Comparison
**First: slide 045 · Recurs: 047, 047-fallback, 049**

Two equal-weight cards.

| | Loan A | Loan B |
|---|---|---|
| Rate | 6.750% | 6.250% |
| Points | 0 | 2.00 = $8,550 |
| Other fees | $1,400 | $1,400 |
| P&I | $2,773 | $2,632 |

🔴 **Slide 045 must NOT show APR.** The withholding is the design. APR first appears
in the demo at 047.

**Slide 049 variant:** line chart of cumulative cost, both loans, crossover at
**month 61** marked with a vertical Alpenglow rule and an enormous `61`.

---

## HERO 4 — The Amortization Curve
**Slide 051 / 051-fallback**

Classic curve, 360 months.
- **Interest** in Clay `#C4482F`, **principal** in Summit Navy `#12233A` —
  the same colors as the payment stack. This is what makes it legible instantly.
- Crossover marked at **month 218**
- First-payment callout: $2,315 interest / $387 principal
- **The $100 overlay:** a second line in Pine `#2F7D5C` whose tail vanishes ~3 years
  early. Animate as an overlay on the base curve, not a replacement chart.

---

## HERO 5 — Loan Estimate Page 2
**First: slide 056 · Recurs: 057, 060**

The current CFPB Loan Estimate page 2, **fabricated sample data**, watermarked
**SAMPLE**.

**The entire design idea:** Sections **A and C in full color. Everything else
desaturated to grey.** That single choice teaches the module.

**Variants:**
- **053** — two full LEs, rate circled in Pine (matching), Section A circled in Clay
  (not matching), `$6,400` stamped between
- **057** — two page-2s side by side at readable size, **no highlighting** (they have
  to find it), Section A highlights on timer expiry

🔴 Verify the current form layout before building. The form has been revised since
2015.

---

## Supporting diagrams

| Slide | What |
|---|---|
| 003 | Acronym storm — 12 acronyms overlapping into unreadability, then all clear but "why?" |
| 007 | The 10-stop journey line (source of the footer indicator) |
| 013 | Seven avatars in a ring; each turns to face who it works for |
| 014 | 5-week calendar grid; days 10–25 shaded Clay |
| 024 | Overpacked suitcase on an airport scale, needle in the red |
| 025 → v5 **011** | **One** DTI gauge at **45.0%**, sitting exactly on the 45% redline. Front-end is no longer taught, so there is no second gauge. |
| — → v5 **012** | ⭐⭐ **NEW.** Two house silhouettes: `$450,000` grey with a green ✓ APPROVED, `$345,000` in Alpenglow beneath. **`$105,000` enormous in the space between.** Reuses the slide-003 gap shape. |
| — → v5 **014** | ⭐⭐ **NEW.** A bar representing the $105,000 gap that **visibly shortens** as each of the five levers is named. By the fifth it's nearly gone. The shrinking is the emotional payload. |
| — → v5 **003 / 047** | ⭐ **NEW.** *The Gap* — one figure and one sheet of paper on the left, a row of silhouettes and a wall of documents on the right. Recurs as the progress indicator, narrowing across the deck, and **closes completely on 047.** |
| 032 | **The reveal** — Poll 3 bars left, actual minimums right. The $90,000 bar next to the $13,500 bar is the slide. |
| 033 | Two 6-year timelines; the 20% target line visibly rising each year |
| 034–037 | Program card template — *minimum · who it's for · the tradeoff · the exit* |
| 038 | Colorado map, four DPA layers stacking as translucent overlays |
| 039 | Decision tree + a loan-balance bar draining to the 80%/78% lines |
| 041 | Fed funds vs. 30-yr mortgage rate, two lines, visibly diverging. **Real data, source line required.** |
| 042 | Seven dials around a center rate readout that moves as each turns |
| 044 | Car sticker price vs. out-the-door invoice |
| 048 | Cash → payment bar shrinking; then the arrow reversed for lender credits |
| 050 | Three-year payment bars; years 1–2 shaded "somebody else's money" |
| 058 | Two buckets — "spent" draining vs. "still yours" holding |
| 059 | `$5,400` small next to `$31,760` enormous. The size ratio *is* the slide. |
| 062 | Three bureau cards, middle spotlit; two borrower cards, lower spotlit |
| 063 | Score donut by weight, utilization slice pulsing |
| 064 | 45-day window band, multiple inquiries collapsing into one; then the 8-item card |
| 066 | Two-column comparison where the winner **genuinely alternates** |
| 067 | Balance scale: $15,000 vs. $5,880 + $3,000 — **tips toward the builder** |
| 068–069 | Numbered mistake rows with story thumbnails |
| 070 | Three doors, sized 1 / 3 / 2 — **Door 2 largest** |

---

## Rules

1. **Semantic colors are fixed.** `../branding/colors.md`. Never re-color a recurring
   concept.
2. **Recurring assets are pixel-identical.** Build once, place many.
3. **Tabular figures everywhere.** Numbers must not shimmy when they animate.
4. **Never information by color alone** — always a label, pattern, or position too.
5. **Every chart with real data carries a source line** at 18pt in Stone.
6. **28pt content floor.** If it doesn't fit, the slide has too much on it.
7. **Sample documents: fabricated data, watermarked SAMPLE.** Never a real
   consumer's document, even redacted.
