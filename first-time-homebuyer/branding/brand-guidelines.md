# Brand Guidelines — Page Two

Deck-level design system. Colors: `colors.md` · Type: `fonts.md`

---

## The design thesis

The content's premise is **honesty over polish**. The design has to match, or it
undercuts the script.

That means: **restraint over decoration.** Every visual flourish that doesn't teach
something makes the deck look more like marketing and less like a class. A slide
with one enormous number and nothing else reads as confident. The same number
inside a gradient card with a drop shadow and an icon reads as a sales deck.

**When in doubt, remove something.**

---

## Slide archetypes

Every slide in this deck is one of six types. If a slide doesn't fit an archetype,
question whether it should exist.

### 1. Section title
Full-bleed Summit Navy. Module number, module name, and the buyer question it
answers. Progress indicator in the footer showing position in the 9-stage journey
line from slide 007.

### 2. Statement
One claim, large, centered, on Snow or navy. Nothing else. Used for the reveals and
the portable rules.

### 3. Data
One table or one chart. Maximum 5 rows / 4 columns. Source line at the bottom in
Stone at 18pt. Accent on the one figure that matters.

### 4. Story
Full-bleed photograph with a navy scrim. The story's **number** appears large over
the image at the turn. Minimal text — the story is spoken, not read.

### 5. Build
Progressive reveal, maximum 5 elements. Used for the payment stack, the process
map, the decision tree.

### 6. Emotional beat
**Near-black `#0B1218`. One line of white text. No logo, no footer, no branding, no
progress indicator.** Used exactly three times: slides 001, 019, and 069.

> The absence of branding on the emotional beats is deliberate. A logo in the
> corner of slide 069 would turn the webinar's most sincere moment into an ad.

---

## Recurring graphics — must be pixel-identical every appearance

These carry the canonical example and recur throughout. Any variation between
appearances reads as a *new* graphic and costs the audience a beat to re-parse.

| Graphic | First appears | Recurs |
|---|---|---|
| **The 9-stage process map** | 010 | Footer progress indicator, all section slides |
| **The payment stack** (6 segments, $3,183) | 022 | 023, 025, 029, 059 |
| **The two-loan comparison cards** | 045 | 047, 049 |
| **The amortization curve** | 051 | — |
| **The Loan Estimate page-2 layout** | 056 | 057, 060 |

Build each once. Reuse the asset. Do not rebuild.

---

## Footer

Present on every slide **except** the three emotional beats.

```
[Progress indicator — position in the 9-stage journey]     [Zach Zink · NMLS #____ · Mountain State Financial Group · NMLS #____ · 🏠 Equal Housing Lender]
```

Stone, 16pt. Quiet. Persistent. It satisfies the identification requirement without
occupying attention.

---

## Compliance labeling

**Any slide containing a rate, payment, or cost carries this on-slide:**

> *Hypothetical illustration for education only. Not a quote, offer, or commitment
> to lend. Actual terms depend on credit, property, program, and market conditions.*

16pt Stone, bottom of the content area, above the footer.

**This is not decoration and it may not be removed to clean up a layout.** It is
the mechanism that keeps illustrative figures from reading as advertised terms.
See `prompts/05-compliance-review.md`.

---

## Photography

**Real over stock.** The webinar's premise is that everyone else is selling and
this isn't. Stock photography of a beaming couple holding oversized keys undermines
that in half a second, before a word is spoken.

**Do use:** unposed moments · people looking at documents, laptops, spreadsheets ·
empty rooms · actual Colorado — foothills, Front Range neighborhoods, real streets ·
natural and imperfect light · a range of ages, household types, and backgrounds
reflecting the actual buyer population

**Never use:** sold signs with thumbs up · giant novelty keys · people leaping ·
handshakes in front of houses · anything with a visible watermark · anything
suggesting a single household type is the default buyer

Shot lists per theme: `images/*/README.md`

---

## Animation

- **Purposeful only.** Every build reveals *information*, never movement for its own
  sake.
- Maximum 5 elements per build.
- Duration 200–300ms. Ease-out.
- **No spins, bounces, flips, or 3D.**
- Transitions between slides: cut, or a 150ms crossfade. Nothing else.
- **The reveals** (slide 032's poll-vs-reality, slide 049's breakeven crossover,
  slide 051's $100 line) get a deliberate beat of held silence before they animate.
  The pause is the design.

---

## Accessibility

- WCAG AA contrast minimum, verified in `colors.md`
- No information by color alone — every coded element also has a label, pattern, or
  position
- 28pt content floor
- Numbers spoken aloud in the script, not only shown
- Chapter markers at every module boundary for the replay
- The deck must be followable with the audio off, and the script must be
  followable with the video off. Both, independently.

---

## What this deck deliberately does not have

Listed so nobody helpfully adds them later:

- ❌ Icons on every bullet — decoration, not information
- ❌ Gradient cards and drop shadows — reads as marketing
- ❌ Stock photography of celebrating homeowners
- ❌ A logo on every slide *(the footer handles identification)*
- ❌ Progress percentages *(the 9-stage map handles orientation)*
- ❌ Slide numbers visible to the audience
- ❌ Any animation that doesn't reveal information
- ❌ Branding on the emotional beat slides
