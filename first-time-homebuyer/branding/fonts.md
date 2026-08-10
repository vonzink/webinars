# Typography

> ℹ️ **The v6 deck's live type scale lives in `../deck/css/tokens.css`** (Inter
> until MSFG supplies the brand family — placeholder #10). The rules below still
> hold; tokens.css is where they're actually applied.

Placeholder system pending official MSFG brand fonts. **Replace the families; keep
the scale and the rules.** The scale is calibrated for webinar viewing, which is a
different problem than print or in-room presentation.

---

## Families

| Role | Font | Fallback |
|---|---|---|
| Headlines | **Inter** (or MSFG brand display) | Helvetica Neue, Arial |
| Body | **Inter** | Helvetica Neue, Arial |
| Numbers / data | **Inter Tight** or a tabular-figure variant | Any monospaced fallback |

Single-family systems read as more considered than mixed-family ones, and they
survive compression better. If MSFG's brand requires two families, use the display
face for headlines only and keep all data in the body face.

---

## ⭐ Tabular figures — mandatory for all numbers

Enable `font-feature-settings: "tnum"` (or the equivalent) everywhere a number
appears in a table, a build, or an animated value.

Without it, digits have different widths, and columns of currency visibly shimmy
as they animate. On a deck built around one canonical example that recurs across
thirty slides, this is not a nitpick — it's the difference between looking precise
and looking sloppy.

---

## Scale — calibrated for laptops and phones, not a conference room

Assume a 1920×1080 slide viewed at 40–60% of a laptop screen, or on a phone.
**This is roughly half the effective size of an in-room presentation.** Everything
is bigger than presentation-design instinct suggests.

| Element | Size | Weight | Notes |
|---|---|---|---|
| Hero number | 180–240pt | 700 | $3,183 · $31,760 · 61 months |
| Slide headline | 54–64pt | 600 | Two lines maximum |
| Subhead | 36–40pt | 500 | |
| Body | 28–32pt | 400 | **28pt is the floor. Nothing smaller carries content.** |
| Table content | 26–28pt | 400 | Tabular figures |
| Table header | 24pt | 600 | Uppercase, +0.05em tracking |
| Labels / captions | 22pt | 500 | |
| Source line | 18pt | 400 | Stone. Bottom of slide. |
| Legal / disclaimer | 16pt | 400 | Stone. Must remain legible — do not shrink to fit. |

**Absolute minimum on any slide: 16pt**, and only for disclaimers. If content
doesn't fit at 28pt, the slide has too much on it. That's a content problem, not a
type problem — do not solve it by shrinking type.

---

## Line and spacing

- Headline line-height: **1.1**
- Body line-height: **1.4**
- Max line length: **~50 characters.** Long measures are unreadable on a shared
  screen where the viewer can't control the window.
- Paragraph spacing: 0.75em
- Never justify. Ragged right, always.

---

## Rules

1. **Headlines are claims, not labels.** "APR isn't your interest rate" beats
   "Understanding APR." Written as sentences, sentence case, and they may end
   without punctuation.
2. **Two lines maximum for a headline.** Three lines means it's a paragraph.
3. **Bold for emphasis; never italic.** Italics disappear at streaming compression.
4. **Never underline.** It reads as a link.
5. **ALL CAPS only for table headers and short labels.** Never for a sentence — it
   reduces reading speed and reads as shouting.
6. **Currency is always formatted identically:** `$3,183` — no cents unless cents
   are the point. `$450,000` not `$450K`.
7. **Percentages to one decimal when precision matters** (`33.5%`, `6.500%`),
   whole numbers when it doesn't (`30%`).
8. **Rates always to three decimals** — `6.500%`, not `6.5%`. It signals precision
   and matches how rates are actually quoted.

---

## The two-second rule

**A headline must be readable in two seconds while the presenter keeps talking.**

Reading and listening compete for the same channel. If the audience has to stop
listening to read the slide, the slide is working against the script.

Test: read the headline out loud at normal pace. If it takes more than two seconds,
it's too long.

---

## Handoff

When MSFG brand fonts arrive: swap the families, keep the scale, and **re-test at
40% viewport.** The scale is the part that's calibrated to the medium — it's more
important than the family.
