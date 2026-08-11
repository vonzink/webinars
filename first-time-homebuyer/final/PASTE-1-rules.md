===== PASTE 1 OF 3 — GLOBAL RULES + PLACEHOLDER REGISTER =====
(HANDOFF v5 · 2026-07-30 · do not build until all 3 parts are in)

# PAGE TWO — Designer Handoff
### What Nobody Explains About Buying Your First Home

> ## HANDOFF v5 · 2026-07-30
> **Stale-file check — do this first.** Confirm all three are true:
> 1. This line reads **HANDOFF v5**
> 2. The palette table names **Deep Teal / Green / Lime / Charcoal**
> 3. Near-black is **`#0B1210`** everywhere (the old value ended in `18`)
>
> If any is false, you have an outdated copy. **Stop and request a re-send** —
> earlier versions used placeholder colour names and a 3.3:1 accent rule that no
> longer applies.

**47 slides · 38 minutes taught · first-time homebuyers, 23–45, Colorado**
**Mountain State Financial Group LLC · NMLS #1314257**

🔴 **THIS DECK HAS THREE PRESENTERS.** Build presenter identity as a **swappable
component**, not baked-in type. **Only two things change per presenter** — the footer line and slide 004. Slide 046
uses a shared inbox and never changes. **Seth Angell presents first.**

| Presenter | Title | NMLS |
|---|---|---|
| **Seth Angell** | Executive VP | **#912881** |
| Robert Hoff | President | **#608235** |
| Zachary Zink | Mortgage Broker | **#451924** |

> **Everything under ON SLIDE is verbatim.** It is the text that appears on screen.
> HEADLINE is the large type. VISUAL is direction, not content — don't set it as text.

---

## GLOBAL RULES

**Type** — Inter (or brand equivalent). **Tabular figures on every number.**
Headline 54–64pt · body 28–32pt · **28pt floor** · source lines 18pt · legal 16pt.
Audience watches on laptops and phones at ~40% viewport — everything is bigger than
presentation instinct suggests. Ragged right, never justified. Bold for emphasis,
never italic (it dies under stream compression).

**Color — Mountain State Financial Group brand palette**

| Role | Hex | Always means |
|---|---|---|
| **Deep Teal** | `#104547` | **Primary.** Headlines · dark backgrounds · section fields · **Principal** |
| **Green** | `#4b7b4d` | Secondary. **Taxes** · "money that's still yours" · positive outcomes |
| **Lime** | `#8cc63E` | **ACCENT — the one thing that matters. Once per slide.** Also **mortgage insurance** *(semantically apt: it's the part that goes away)* |
| **Charcoal** | `#2E3532` | **Interest** · money spent · weight/burden · HOA |
| **Dark Gray** | `#3D4650` | Body text |
| Mid Gray | `#8A9099` | **Insurance** · secondary text · source lines · legal |
| White | `#FFFFFF` | Content background |
| Off-white | `#F5F7F5` | Alternate content background |
| Near-black | `#0B1210` | Emotional beats only (001, 047) |

🔴 **CONTRAST — verified, do not guess:**

| | vs. white | Verdict |
|---|---|---|
| Deep Teal `#104547` | **10.3:1** | ✅ AAA — safe for anything |
| Green `#4b7b4d` | **5.0:1** | ✅ AA — safe for text |
| **Lime `#8cc63E`** | **2.1:1** | ❌ **FAILS. Never text on white.** |

**Lime is a fill and accent color only** — bars, shapes, highlights, chart segments,
underlines. It may carry text **only** when reversed out of Deep Teal or Charcoal.
Any headline set in lime on white is unreadable on a compressed stream.

**THE PATTERN TO USE INSTEAD.** Wherever a slide calls for emphasis, the accent is a
**Lime shape** and the text stays **Deep Teal**:
- a Lime bar beneath or beside the number
- a Lime row/cell fill with Deep Teal figures on top
- a Lime underline, rule, or marker
- a Lime chart segment or silhouette fill
Never Lime type on a light ground. This preserves "one accent per slide" and keeps
every number readable at 40% viewport.

⚠️ **The palette has no red, and this deck needs a negative.** Interest, money spent,
and warnings all read as "burden." Solution: **Charcoal `#2E3532` carries all of it** —
it reads as weight without introducing an off-brand color, and it sits cleanly against
teal. For the two genuine warning marks (the ✗ on slide 042's sofa, the tax-trap flag
on 043), use **Charcoal plus an ✗ shape** rather than a color — which also satisfies
the never-by-color-alone rule.

**Semantic colors are locked.** Principal is Deep Teal in the payment stack *and* in
the amortization chart. Interest is Charcoal in both. Any drift costs the viewer a
beat every single time it recurs.

**The payment stack (009, reused 010):**
P&I = Deep Teal · Taxes = Green · Insurance = Mid Gray · **MI = Lime** · HOA = Charcoal
*(MI in lime is deliberate — slide 023 is "MI is a phase, not a sentence," and the
accent color makes the temporary thing visually temporary.)*

**Footer** — every slide EXCEPT 001, 047. **One editable text component, three variants:**

```
[gap indicator]   Seth Angell · NMLS #912881 · Mountain State Financial Group LLC · NMLS #1314257 · 🏠 Equal Housing Lender
[gap indicator]   Robert Hoff · NMLS #608235 · Mountain State Financial Group LLC · NMLS #1314257 · 🏠 Equal Housing Lender
[gap indicator]   Zachary Zink · NMLS #451924 · Mountain State Financial Group LLC · NMLS #1314257 · 🏠 Equal Housing Lender
```

Mid Gray, 16pt. **Ship the deck set to Seth Angell** — he presents first. The other
two are alternates on the same component. The company name and company NMLS never
change; only the individual line does.

**Compliance line** — required on every slide containing a rate, payment, or cost.
16pt Mid Gray, above the footer. Do not remove it to clean up a layout:
> *Hypothetical illustration for education only. Not a quote, offer, or commitment to lend.*

**LOGO — official mark received.** Full usage rules: `branding/logo-usage.md`.
Headlines: the mark is a **five-band triangle**, lime at the apex → deep teal at the
base, with a two-tone wordmark. It **confirms the palette** — no changes needed.
**Use its hard-edged banding as the deck's visual language** for the payment stack,
the Gap graphic, and the amortization curve — banded fills, never soft gradients.
🔴 The wordmark sets lime type on white at 2.1:1. **Logotypes are WCAG-exempt — do
not "fix" it, and do not read it as permission.** Lime stays a fill colour everywhere
else. **No logo on 001 or 047.**

**Reference set — TED and Apple Keynote only.** Not Canva-style decorative work: no
gradient cards, no drop shadows, no icon-per-bullet. One caveat on TED and Apple —
both design for a *room*. This is a webinar at ~40% viewport, which is why the type
scale below is deliberately larger than either would use.

**Animation** — purposeful only. Max 5 elements per build. 200–300ms ease-out. Cuts
or 150ms crossfades between slides. No spins, bounces, or 3D.

**Photography** — real, unposed, actual Colorado. **Never** sold signs, novelty keys,
handshakes, confetti, or celebrating stock couples. The webinar's premise is that
everyone else is selling; stock imagery breaks it in half a second.

**FIRST-PERSON CONTENT — a note for whoever presents.** The client stories on 002,
013, 020, 026, 042, and 044 are **composites of real patterns, not specific
individuals.** Any of the three presenters can tell them honestly as "a client" —
but each should be able to say "yes, I've seen this happen" first. If a presenter
hasn't, the honest phrasing is *"I've seen this"* rather than *"a client of mine."*
Three people telling the same "my client" story is a credibility risk if anyone ever
compares notes. **No slide text changes — this is a delivery note for the script.**

🔴 **WEBCAM SAFE AREA — upper right is reserved on every slide.** Three slides break
if this is handled naively:

| Slide | Conflict | Required fix |
|---|---|---|
| **001** | Full-bleed sheet of paper; `$6,400` | Composition shifts **left-of-center**. The paper anchors left, `$6,400` sits **lower** than centre. Do not scale the image down to clear the box — reframe it. |
| **026** | `$5,400` small next to `$31,760` **enormous** | ⚠️ **The size ratio IS the slide.** Do **not** shrink `$31,760` to clear the webcam. Move the pair down-left and let the ratio stand at full scale. Shrinking it destroys the only thing the slide does. |
| **047** | Full-bleed near-black, one line of text | Line sits **left-of-center and lower**. No branding, so nothing else competes — just keep the text out of the upper right. |

Every other slide already clears it: headlines start upper-left, and the compliance
line and footer sit along the bottom.

**THE RECURRING GAP GRAPHIC** — introduced on 003, narrows through the deck as the
footer progress indicator, closes completely on 047. Left: one figure, one sheet of
paper. Right: a row of silhouettes and a wall of documents.

---

