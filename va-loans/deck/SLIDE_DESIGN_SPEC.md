# Homebuyer's Playbook — Slide Design Spec

Direction: **"Ridgeline."** Full-bleed photography under a deep-green wash, heavy Montserrat headlines, a single acid-green accent. 1920×1080 fixed canvas.

This is a restyle spec. Do not change slide content or order — change the visual system only.

---

## 1. Canvas

- Every slide is exactly **1920 × 1080 px**. Fixed pixel canvas, not responsive.
- Every full-bleed slide container gets `box-sizing: border-box`. Padding must live *inside* the 1920×1080 box, never add to it.
- Standard slide padding: **90px top/bottom, 96px left/right**. Full-bleed photo and split slides may go edge-to-edge, but text inside them still respects the 96px gutter.
- No rounded corners on slide-level panels. Squared geometry throughout. Small inner elements may not exceed 4px radius (prefer 0).
- No drop shadows on layout blocks. The only allowed shadow is `text-shadow: 0 4px 40px rgba(0,0,0,0.35)` on headlines sitting over photography.

## 2. Color

| Token | Hex | Use |
|---|---|---|
| Deep Forest | `#0C3335` | Primary dark canvas, photo wash, dark panels |
| Forest Mid | `#14494B` | Secondary dark block, hover/step states |
| Sage | `#4b7b4d` | Eyebrow labels on light slides, secondary accent rules |
| MSFG Green | `#8cc63E` | THE accent. Eyebrows on dark, callout bars, key numbers, active steps |
| Charcoal | `#404041` | Body copy on light backgrounds |
| Mist | `#F5F7F4` | Light neutral slide background |
| White | `#FFFFFF` | Light slide background, headline type on dark |

Rules:
- **Two background colors across the whole deck: Deep Forest and White/Mist.** Nothing else. Alternate them to create rhythm — never three or more backgrounds.
- Green `#8cc63E` is an accent, never a background for a full slide and never a body-text color. Roughly one green element per slide.
- No gradients as decoration. The only permitted gradient is a photo-legibility wash (see §5).
- Text on dark: white at 100% for headlines, `rgba(255,255,255,0.82)` for body, `rgba(255,255,255,0.62)` for footer/meta.

## 3. Typography

Fonts: **Montserrat** (600/700/800/900) for all display and labels. **Open Sans** (400/600) for body copy. Nothing else.

| Role | Font / weight | Size | Notes |
|---|---|---|---|
| Title slide headline | Montserrat 900 | 120–140px | `line-height: 0.9`, `letter-spacing: -0.035em` |
| Section headline | Montserrat 800 | 76–84px | `line-height: 1`, `letter-spacing: -0.02em` |
| Card / item title | Montserrat 700–800 | 40–46px | `line-height: 1.1` |
| Big stat number | Montserrat 900 | 54–88px | `line-height: 1` |
| Eyebrow label | Montserrat 700 | 22–24px | `letter-spacing: 0.2em–0.26em`, ALL CAPS |
| Body copy | Open Sans 400 | 26–34px | `line-height: 1.4–1.5` |
| Footer / legal | Open Sans 400 | 21–24px | `line-height: 1.45` |

Hard rules:
- **Nothing below 21px, anywhere.** Body copy on a content slide should sit at 26px+. If text has to shrink below that to fit, cut words instead.
- Headlines use `text-wrap: balance`; body paragraphs use `text-wrap: pretty`.
- Body paragraphs cap at ~900px measure. Never a full 1728px line of text.
- Sentence case for headlines. ALL CAPS only for eyebrows and button labels.

## 4. Layout system

Use these five archetypes. Every slide in the deck should be one of them — do not invent a sixth.

1. **Full-bleed hero** — photo + wash, eyebrow top-left, headline bottom-left, footer row along the bottom. Title slide and section breaks.
2. **Split 860/1060** — photo on one side edge-to-edge, content on the other. Success story, affordability.
3. **Header + grid** — eyebrow, headline, rule; then a 2×2, 1×4, or 1×5 card grid filling the rest. Myths, mistakes, loan programs, resources.
4. **Two-panel compare** — 50/50 vertical split, one white one Deep Forest. Rent vs. buy.
5. **Statement slide** — centered, one giant line of type on Deep Forest, nothing else. "Questions?"

Grid and spacing:
- Lay out every sibling group with `display: flex` or `display: grid` plus `gap:`. **No margin-based spacing between cards, and no inline-flow spacing.**
- Card grid gaps: 26–36px. Section-to-section vertical gaps: 56–64px.
- Card interior padding: 44–52px.
- Cards on dark slides: `background: rgba(255,255,255,0.07)`. Cards on light slides: `#F5F7F4` or `#FFFFFF` with a `8px` solid left or top border in Deep Forest / Sage / Green.

Accent devices (use sparingly, 1–2 per slide max):
- 96×8px green bar above a headline.
- 8px vertical green rule to the left of a section title.
- Solid green callout bar: `background: #8cc63E; padding: 22px 40px;` with white Montserrat 700 text.
- Small green triangle glyph (CSS borders) before an eyebrow.

## 5. Photography

- Photos are always full-bleed within their container. Never a floating inset image with a border.
- Every photo carries a legibility wash. Vertical: `linear-gradient(180deg, rgba(12,51,53,0.86) 0%, rgba(12,51,53,0.55) 45%, rgba(12,51,53,0.95) 100%)`. Horizontal split: `linear-gradient(90deg, rgba(12,51,53,0.35), rgba(12,51,53,0.85))`.
- The wash element must be `pointer-events: none` and sit between photo and text.
- Subject matter: Colorado landscape, real homes, real people at kitchen tables. No stock handshakes, no house-shaped icons, no illustrated keys.
- Where a photo isn't available yet, leave a labeled drop placeholder — do not ship a gray box with no instruction.

## 6. Footer and compliance

Every title slide, section-closing slide, and the CTA slide carries a footer row:

- Left: MSFG horizontal logo, 62–68px tall. On dark backgrounds it sits on a white plate with 18–20px padding — **never place the logo directly on Deep Forest**.
- Right, right-aligned, 21–24px:
  `Mountain State Financial Group, LLC · NMLS# 1314257 · msfg.us`
  `Licensed in CO, IN, MI, MN, ND, SD, TX · Equal Housing Lender`
- Separated from content by a `2–3px` rule with 30–34px padding above.
- Any slide showing client results carries an italic disclaimer at 21px: "Anonymized client file. Individual results vary."

## 7. Do not

- Rounded card corners, soft drop shadows, glassmorphism, or "SaaS card" styling.
- Emoji or icon fonts. No emoji anywhere in this deck.
- More than two background colors deck-wide.
- Decorative SVG illustrations of houses, keys, or people.
- Body text under 21px, or a card whose text has to shrink to fit — cut copy instead.
- Centered text on content slides. Center only on the statement slide (§4.5).
- Green as a body-text color or a full-slide background.

## 8. Acceptance check

Before handing back, verify per slide:

- [ ] Container measures exactly 1920 × 1080 with `box-sizing: border-box`; nothing clipped at right or bottom.
- [ ] No text smaller than 21px.
- [ ] Background is Deep Forest, White, or Mist — nothing else.
- [ ] Exactly one green accent moment, and it's the most important thing on the slide.
- [ ] All sibling groups spaced with `gap`, not margins.
- [ ] Footer and NMLS line present where §6 requires it.
- [ ] Photos have their wash; headlines over photos remain legible.
