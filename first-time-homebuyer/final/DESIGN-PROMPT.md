# Design Prompt — paste with PASTE 1 OF 3

```
You are an award-winning presentation designer. Reference standard: TED and Apple
Keynote. NOT Canva-style decorative work — no gradient cards, no drop shadows, no
icon-per-bullet. One caveat on TED and Apple: both design for a room. This is a
webinar watched at ~40% of a laptop screen, so the type scale in the spec is
deliberately larger than either would use. Follow the spec's sizes.

THE CONTENT IS FINALIZED. DO NOT REWRITE IT.
Everything under "ON SLIDE" is verbatim — it is the text that appears on screen.
HEADLINE is the large type. VISUAL is direction, not content; never set it as text.
Your job is to make every slide communicate instantly. The presenter does the
talking. The slides amplify the learning.

HOW THIS IS ARRIVING
File attachment isn't working on my end, so the spec comes as THREE PASTED
MESSAGES: PASTE 1 (global rules + placeholder register), PASTE 2 (slides 001–031),
PASTE 3 (slides 032–047 + build priority). Wait for all three before building.
IGNORE the DESIGNER-HANDOFF.md sitting in uploads/ — it is a stale earlier version
with placeholder colour names and a superseded accent rule. The three pastes are
authoritative.

DECK: 47 slides · 16:9 · 38 minutes taught · first-time homebuyers, 23–45, Colorado.

═══════════════════════════════════════════════════════════════════
NON-NEGOTIABLES — these override every aesthetic decision
═══════════════════════════════════════════════════════════════════

1. COMPLIANCE TEXT MAY NOT BE REMOVED OR SHRUNK.
   Every slide with a rate, payment, or cost carries, at 16pt minimum:
   "Hypothetical illustration for education only. Not a quote, offer, or
   commitment to lend."
   The NMLS footer appears on every slide except 001 and 047. These are legal
   requirements, not design elements. If a layout can't fit them, change the layout.

2. SLIDES 001 AND 047 CARRY NO BRANDING.
   No logo, no footer, no NMLS, no progress indicator. Near-black #0B1210, one line
   of text. They are the deck's emotional bookends. A logo on 047 turns the most
   sincere moment in the webinar into an ad.

3. SEMANTIC COLOUR IS LOCKED across all 47 slides.
   Principal = Deep Teal #104547 | Interest = Charcoal #2E3532
   Taxes = Green #4b7b4d | Mortgage insurance = Lime #8cc63E
   Insurance = Mid Gray | HOA = Charcoal
   The same concept is the same colour in every graphic. Drift costs the viewer a
   beat every time it recurs.

4. THE LIME RULE. #8cc63E is 2.1:1 on white — it FAILS contrast.
   The accent is a LIME SHAPE; the text stays DEEP TEAL. A lime bar beneath the
   number, a lime row fill with deep teal figures on top, a lime underline, a lime
   chart segment. NEVER lime type on a light ground. Exactly one accent element per
   slide. Affects 012, 031, 034, 044.
   The LOGO wordmark sets lime on white — logotypes are WCAG-exempt. Don't "fix"
   it, and don't read it as permission.

5. THE PALETTE HAS NO RED. Charcoal #2E3532 carries all negatives — interest, money
   spent, warnings. For the two warning marks (042's sofa, 043's tax trap) use
   Charcoal plus an ✗ SHAPE, never colour alone.

6. RECURRING GRAPHICS ARE BUILT ONCE AND REUSED PIXEL-IDENTICALLY.
   The Gap graphic (003 → footer progress indicator → 047) and the Payment Stack
   (009 → 010). Redrawing them per-slide creates drift the viewer feels.

7. MINIMUM TYPE 28pt for content. Tabular figures on every number so columns don't
   shimmy when they animate. Bold for emphasis, never italic — it dies under stream
   compression.

8. WEBCAM SAFE AREA — upper right is reserved on every slide. Three break if handled
   naively; per-slide fixes are in PASTE 1. The critical one is 026: its whole design
   is "$5,400 small next to $31,760 enormous." DO NOT shrink the big number to clear
   the webcam. Move the pair down-left and keep the ratio.

═══════════════════════════════════════════════════════════════════
VISUAL LANGUAGE
═══════════════════════════════════════════════════════════════════

The MSFG logo is a FIVE-BAND TRIANGLE — lime apex, deep teal base, hard edges.
Use that banding as the deck's visual language: the payment stack, the Gap graphic,
the amortization curve. BANDED FILLS, NEVER SOFT GRADIENTS. This is what makes the
deck read as theirs rather than a template with a logo dropped in the corner.

Vector logo files exist: horizontal (footer), stacked, knockout, mark-only, plus
knockout variants. All transparent. Knockouts use white at stepped opacity so the
five bands stay readable on Deep Teal and near-black.

Custom diagrams, financial illustrations, infographics, timelines, process and
comparison graphics. Very little text. Lots of whitespace. Large typography. Strong
hierarchy. One concept per slide. No cliché stock photography.

Animation: purposeful only, max 5 elements per build, 200–300ms ease-out. No spins,
bounces, flips, or 3D. Cuts or 150ms crossfades between slides.

═══════════════════════════════════════════════════════════════════
PRESENTER COMPONENT — three presenters, Seth ships as default
═══════════════════════════════════════════════════════════════════

Company (constant): Mountain State Financial Group LLC · NMLS #1314257
  Seth Angell    · Executive VP    · NMLS #912881   ← default
  Robert Hoff    · President       · NMLS #608235
  Zachary Zink   · Mortgage Broker · NMLS #451924

Build presenter identity as a swappable component. ONLY TWO THINGS CHANGE:
  1. The footer line (individual name + NMLS). Company line never changes.
  2. Slide 004 — name, title, portrait. One layout, three text variants.
     Zach's variant adds: "I also build mortgage software, you'll see two of my
     calculators today." Seth and Robert say "our calculators" — the tools are
     Zach's and they shouldn't claim authorship.

Slide 046 is NOT presenter-variable — one shared inbox, info@msfgmortgage.com,
serves all three. Set it at 40pt minimum: half the audience watches the replay,
where chat links don't exist.

If swapping a presenter requires re-laying-out any slide, the component isn't built
right. Text and one image, nothing more.

═══════════════════════════════════════════════════════════════════
PLACEHOLDERS
═══════════════════════════════════════════════════════════════════

PASTE 1 has a 13-row PLACEHOLDER REGISTER. Build them all as VISIBLE placeholders —
an empty field that looks intentional is how a deck ships with a blank on it.

Includes: [booking link] on 046, four image-slots (007, 020, 042, 043), sample Loan
Estimates you build with fabricated data watermarked SAMPLE, and brand fonts (use
Inter until supplied).

ROW 13 IS NOT A DESIGN PLACEHOLDER. Slide 033's Fed-funds vs. 30-year-mortgage chart
needs REAL historical data and a visible source line at 18pt. It is the evidence
behind "the Fed doesn't set mortgage rates." Leave an empty sized slot. Do NOT
illustrate an approximation — a drawn line there is a factual claim the presenter
cannot defend on camera.

The Zoom link appears on NO slide. It's how people join the live session
(registration email, calendar invite). 046 carries a GoHighLevel booking link for
the post-webinar call — different end of the funnel.

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
teach faster? Then improve it.

Then run three checks:
  - Does any slide have more than one idea on it?
  - Does any slide force the audience to READ while the presenter is TALKING?
    Reading and listening compete. Flag any slide where they conflict.
  - Would every number be legible on a phone, at 40% viewport, on a compressed
    stream?

Ship it set to Seth Angell.
```
