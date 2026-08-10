# Colors

> ⚠️ **SUPERSEDED for the v6 deck.** The Summit Navy / Alpenglow palette below is
> the old v4 placeholder system. The live v6 palette (Deep Teal `#104547` · Green
> `#4b7b4d` · Lime `#8cc63E` · Charcoal `#2E3532`) and its semantic locks live in
> `../deck/css/tokens.css` — treat that file as the source of truth. See
> `../final/HANDOFF-v6-PART-1.md` → GLOBAL DESIGN RULES.

Placeholder system pending official Mountain State Financial Group brand assets.
**Replace the hex values with MSFG's actual palette; keep the semantic roles.**
The roles are what make the deck consistent, not the specific hues.

---

## Core palette

| Role | Name | Hex | Use |
|---|---|---|---|
| Primary | Summit Navy | `#12233A` | Headlines, dark backgrounds, section titles |
| Primary light | Ridge Blue | `#2C4A6E` | Secondary headers, chart baselines |
| Accent | Alpenglow | `#E8703A` | **The one thing on the slide that matters.** Use sparingly. |
| Support | Aspen Gold | `#E8B33A` | Highlights, callouts, warmth |
| Positive | Pine | `#2F7D5C` | Savings, good outcomes, "yes" |
| Caution | Clay | `#C4482F` | Costs, warnings, "no" |
| Neutral dark | Slate | `#3D4650` | Body text on light |
| Neutral mid | Stone | `#8A9099` | Secondary text, labels, sources |
| Neutral light | Snow | `#F4F6F8` | Light backgrounds |
| Pure | White | `#FFFFFF` | Text on dark |

---

## ⭐ Semantic color assignments — the rule that keeps the deck coherent

**The same idea is always the same color, in every graphic, all 40 minutes.** This
is the single highest-leverage design rule in the deck, because the canonical
example's components recur constantly. If principal is navy in the payment stack
and blue in the amortization chart, the audience pays a beat to reconcile them —
every single time.

| Concept | Color | Appears in |
|---|---|---|
| **Principal** | Summit Navy `#12233A` | Payment stack, amortization chart |
| **Interest** | Clay `#C4482F` | Payment stack, amortization chart |
| **Taxes** | Ridge Blue `#2C4A6E` | Payment stack |
| **Insurance** | Stone `#8A9099` | Payment stack |
| **Mortgage insurance** | Aspen Gold `#E8B33A` | Payment stack, MI removal chart |
| **HOA** | Slate `#3D4650` | Payment stack (variant) |
| **The hidden five** | Alpenglow @ 40% | Slide 023's ghost segments |
| **Money you keep / save** | Pine `#2F7D5C` | $100 experiment, savings |
| **Money you spend** | Clay `#C4482F` | Closing costs |
| **Money that's still yours** | Ridge Blue | Prepaids and escrows (slide 058) |
| **The point of the slide** | Alpenglow `#E8703A` | One element per slide. Never two. |

---

## Accent discipline

**Alpenglow appears exactly once per slide.** It marks the single thing the eye
should hit first. Two accents means no accent — the eye has nowhere to go and the
slide loses its point.

If a slide seems to need two accents, it's two slides.

---

## Backgrounds

| Type | Background | Text |
|---|---|---|
| Section titles | Summit Navy | White |
| Content | Snow `#F4F6F8` | Slate |
| Data / hero numbers | White | Slate, accent on the number |
| Emotional beats (001, 019, 069) | **Near-black** `#0B1218` | White, nothing else |
| Photo slides | Full-bleed with a navy gradient scrim at 60%+ for text contrast |

---

## Contrast — WCAG AA minimum, no exceptions

| Combination | Ratio | Pass |
|---|---|---|
| Summit Navy on White | ~14.9:1 | ✅ AAA |
| White on Summit Navy | ~14.9:1 | ✅ AAA |
| Slate on Snow | ~9.1:1 | ✅ AAA |
| Alpenglow on Summit Navy | ~5.2:1 | ✅ AA |
| Alpenglow on White | ~3.3:1 | ⚠️ **Large text only (24pt+). Never body copy.** |
| Aspen Gold on White | ~1.9:1 | ❌ **Never. Fill/accent only, never text.** |
| Stone on Snow | ~3.4:1 | ⚠️ Large text and source lines only |

**Never convey information by color alone.** Every color-coded element also carries
a label, a pattern, or a position. Someone with color vision deficiency, and anyone
watching a compressed replay stream, must be able to follow it.

---

## Dark mode / replay

The deck is designed light with dark section breaks. Replay platforms compress
aggressively — **large flat areas of saturated color band badly.** Prefer solid
fields and avoid subtle gradients in anything that carries meaning.

## Handoff note

When MSFG's official palette lands: keep the table structure and the semantic
assignments, swap the hex values, and **re-run the contrast table.** Contrast
compliance does not survive a palette swap automatically.
