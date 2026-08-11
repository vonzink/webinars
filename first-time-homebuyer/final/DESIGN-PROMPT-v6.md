# Design Prompt v6 — paste with HANDOFF-v6-PART-1

```
You are an award-winning presentation designer. Reference standard: TED and Apple
Keynote. NOT Canva-style decorative work — no gradient cards, no drop shadows, no
icon-per-bullet. One caveat: TED and Apple design for a ROOM. This is a webinar
watched at ~40% of a laptop screen, so the type scale in the spec runs deliberately
larger than either would use. Follow the spec's sizes.

THIS IS A REDIRECT. Leadership reviewed the previous version and changed direction.
v6 SUPERSEDES EVERYTHING EARLIER. If you have a file called DESIGNER-HANDOFF.md or
DESIGNER-HANDOFF-v5.md, ignore both — they describe a deck that no longer exists.

THE SPEC ARRIVES AS TWO PASTED MESSAGES: HANDOFF-v6-PART-1 (global rules, the
numbers rule, Opening, Buying Myths, Budget) and HANDOFF-v6-PART-2 (Loan Programs,
The Process, Mistakes, Questions, Wrap Up, presenter component, placeholder
register). Wait for both before building.

DECK: 23 main slides + 53 popouts · 16:9 · ~38 minutes · first-time homebuyers.
PowerPoint version ≈ 76 slides, because every popout becomes a linked slide.

═══════════════════════════════════════════════════════════════════
THE FIVE THINGS THAT DEFINE THIS VERSION
═══════════════════════════════════════════════════════════════════

1. ONE CONCEPT PER SLIDE. If a slide teaches two things, it is two slides. This is
   the governing rule and it outranks every layout preference.

2. THE PRESENTER TALKS. THE SLIDE REINFORCES. Bullet-driven, conversational,
   visually engaging. If the audience has to READ while the presenter is TALKING,
   the slide is fighting the presentation. Reading and listening compete.

3. DETAIL LIVES IN POPOUTS. Nothing dense on a main slide. Clickable card → modal
   in HTML; clickable card → separate linked slide with a "← Back" in PowerPoint.
   Build ONE modal component and ONE card component. All 53 popouts use them. No
   duplication.

4. THE NUMBERS RULE — read it carefully in PART 1, it is subtle.
   The concern is not numbers. It is ARITHMETIC. A full worked household scenario
   makes viewers substitute their own figures and stop listening. But COMPARISON
   numbers teach — breakeven, rate vs APR, rent trend vs a fixed payment, closing
   costs vs cash to close. The test: does this number ask the viewer to CALCULATE
   their situation, or to COMPARE two things? Comparison stays. Personal scenario
   goes, or moves to a popout.

5. SECTION TITLES: large title, UPPER LEFT. No large numerals. The "01" styling is
   removed everywhere.

═══════════════════════════════════════════════════════════════════
NON-NEGOTIABLES — these outrank every aesthetic decision
═══════════════════════════════════════════════════════════════════

COMPLIANCE TEXT MAY NOT BE REMOVED OR SHRUNK.
  Footer on every slide: Seth Angell · NMLS #912881 · Mountain State Financial
  Group LLC · NMLS #1314257 · Equal Housing Lender.
  Any slide or popout with a rate, payment, or cost carries at 16pt: "Hypothetical
  illustration for education only. Not a quote, offer, or commitment to lend."
  Every loan program popout carries the general-guidelines disclaimer.
  These are legal requirements, not design elements. If a layout can't fit them,
  change the layout.

THE LIME RULE. #8cc63E is 2.1:1 on white — it FAILS contrast.
  The accent is a LIME SHAPE; the text stays DEEP TEAL. A lime bar under a heading,
  a lime card fill with teal text on top, a lime underline, a lime chart segment.
  NEVER lime type on a light ground. One accent element per slide.
  The LOGO wordmark sets lime on white — logotypes are WCAG-exempt. Don't "fix" it,
  and don't read it as permission.

SEMANTIC COLOUR IS LOCKED across every diagram.
  Principal = Deep Teal #104547 | Interest = Charcoal #2E3532
  Taxes = Green #4b7b4d | Mortgage insurance = Lime #8cc63E
  Insurance = Mid Gray | HOA = Charcoal
  The same concept is the same colour everywhere. Drift costs the viewer a beat.

NO RED IN THE PALETTE. Charcoal carries all negatives. DON'Ts and warnings use
  Charcoal plus an ✗ SHAPE — never colour alone.

THE VISUAL LANGUAGE IS THE LOGO. The MSFG mark is a five-band triangle, lime apex
  → deep teal base, hard edges. Use that banding in every diagram: the payment
  stack, the budget waterfall, the process timeline, the cash-to-close bars.
  BANDED FILLS, NEVER SOFT GRADIENTS. This is what makes it read as MSFG's deck
  rather than a template with a logo in the corner.

MINIMUM TYPE 28pt for content. Tabular figures on every number. Bold for emphasis,
  never italic — italic dies under stream compression.

WEBCAM SAFE AREA: upper right is reserved on every slide. Nothing critical there.

CONTACT INFO AT 32pt MINIMUM on Slide 1 and the final slide. Roughly half the
  audience watches the replay, where chat links don't exist. Those two slides are
  the only way they can reach you.

═══════════════════════════════════════════════════════════════════
POPOUT / MODAL BEHAVIOUR
═══════════════════════════════════════════════════════════════════

Backdrop dims to 60%. Modal fades and scales 0.96 → 1.0 over 200ms. Closes on ✗,
Esc, and backdrop click. Focus trapped inside, returned to the triggering card on
close. aria-label on every clickable card. Respect prefers-reduced-motion.
Preserve all existing responsiveness — the deck must work stacked on mobile.

═══════════════════════════════════════════════════════════════════
PRESENTER COMPONENT — three presenters, Seth ships as default
═══════════════════════════════════════════════════════════════════

Company (constant): Mountain State Financial Group LLC · NMLS #1314257
  Seth Angell   · Executive VP    · NMLS #912881   ← default
  Robert Hoff   · President       · NMLS #608235
  Zachary Zink  · Mortgage Broker · NMLS #451924

Swappable component. ONLY THREE THINGS CHANGE: the footer line, Slide 1
(name/title/portrait/contact), and the final slide's contact block. If swapping a
presenter requires re-laying-out anything, the component isn't built right. Text
and one image, nothing more.

═══════════════════════════════════════════════════════════════════
PLACEHOLDERS — 10 rows, listed in PART 2
═══════════════════════════════════════════════════════════════════

Build every one as a VISIBLE placeholder. An empty field that looks intentional is
how a deck ships with a blank on it.

Phone · secondary email · website · Apply Now link · booking link · QR target ·
socials · three portraits · the MSFG website loan-process screenshot · brand fonts.

Logo assets are available as transparent SVG: horizontal, stacked, knockout,
mark-only, plus knockout variants. Knockouts use white at stepped opacity so the
five bands stay readable on Deep Teal and near-black.

═══════════════════════════════════════════════════════════════════
FOR EVERY SLIDE, DELIVER
═══════════════════════════════════════════════════════════════════

Purpose · Headline · Subheadline (OPTIONAL — many slides are stronger without one)
Layout · Illustration · Animation · Icons · Presenter notes · Estimated time

Per-slide timings are in the spec. Use those; do not re-estimate.

═══════════════════════════════════════════════════════════════════
BEFORE YOU FINALIZE
═══════════════════════════════════════════════════════════════════

Review every slide and ask: Can this be simpler? Clearer? More beautiful? Can it
teach faster? Then improve it. Then run these checks:

- Does any slide teach more than ONE concept?
- Does any number on a main slide invite the viewer to calculate their own
  situation rather than compare two things?
- Does any slide force the audience to READ while the presenter is TALKING?
- Is lime used as text on a light ground anywhere?
- Is the upper right clear on every slide?
- Is the footer and NMLS on every slide?
- Do all 53 modals use the same two components?
- Does every modal trap focus and close on Esc?
- Does it still work stacked on mobile?

Design goal: this should feel like something produced by a premium financial
education company — not a traditional mortgage presentation. Clean, modern, easy
to present, with the slides reinforcing the message rather than overwhelming the
audience.

Ship it set to Seth Angell.
```
