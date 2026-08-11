# The Homebuyer's Playbook — HTML Deck ("Ridgeline")

Built to **`SLIDE_DESIGN_SPEC.md`** (the "Ridgeline" visual system) with content
realigned to the client's actual presentation.

**17 main slides · 30 popouts · ~40 min + Q&A · 1920×1080.**

## Run it

```bash
cd first-time-homebuyer/deck && python3 -m http.server 4173
```

Open <http://localhost:4173/index.html>. Static ES modules — needs a local
server (don't open over `file://`).

## Controls

| Key | Action |
|---|---|
| → / Space | Next · ← Previous · Home/End first/last |
| **P** | Presenter view (second window) |
| **F** | Fullscreen · **G** layout guides · **Esc** close popout |

Cards open popouts on click; each traps focus and closes on ✕ / Esc / backdrop.

## The deck

| # | Slide | Popouts |
|---|---|---|
| 1 | Opening — Seth + contact | — |
| 2 | **Myths** (grid) | 5 myths → pros/cons |
| 3 | The lowest rate myth → closing costs & APR | — |
| 4 | Rent vs buy / cost of waiting (two-panel) | — |
| 5 | What's in the payment (combined) | — |
| 6 | Keep the payment in your comfort zone | — |
| 7 | **Most Common Loan Programs** (grid) | 5 programs → pros/cons |
| 8 | Cash to close: where it comes from (grid) | 6 sources → Fannie rules |
| 9 | Closing costs vs cash to close | — |
| 10 | Meet the players (grid) | 8 roles → what they do |
| 11 | The loan process (stepper) | — |
| 12 | **Don't** (mistakes) | — |
| 13 | **Do** (mistakes) | — |
| 14 | Don't assume the lowest rate wins | — |
| 15 | The most expensive mistakes are small assumptions (grid) | 6 → details |
| 16 | The questions everyone asks (5) | — |
| 17 | Wrap — contact + apply links | — |

"Your Next Step" removed. In the PowerPoint version, each popout becomes a linked
slide with a "← Back" (not built yet — see below).

## Design system (Ridgeline)

Encoded in `css/tokens.css` — the source of truth:

- **Two backgrounds:** Deep Forest `#0C3335` and White/Mist `#F5F7F4`, alternating.
- **One green accent** (`#8cc63E`) per slide — a shape, never body text.
- **Montserrat** (display) + **Open Sans** (body). Nothing below 21px.
- Squared geometry, no drop shadows, **no emoji**.
- Footer (logo on white plate + NMLS + license line) on titled slides, from data.
- Photography = **labeled drop-placeholders** until real images are supplied.

Guardrails wired into code, not discipline:
- No green-text token exists (the accent can't become body text).
- The footer + any disclaimer inject from slide data — can't be forgotten.
- Console logs `17 slides · 30 popouts` and flags any unreachable/missing popout.

## Architecture (unchanged engine)

```
content/  slides.js · modals.js · presenters.js      ← all copy lives here
js/       deck.js · modal.js · card.js · figures.js · presenter.js
css/      tokens · base · components · slides
```

One card component + one modal component render everything. Two diagrams only,
both number-free: `paymentBands()` and `processStepper()` in `figures.js`.

## Swapping the presenter

`ACTIVE_PRESENTER` in `content/presenters.js` (`seth` | `robert` | `zachary`).
Only the footer, Slide 1, and the final slide change. Ships as **Seth**.

## Fill before delivery (visible placeholders)

In `content/presenters.js`: Seth's `phone`, `email2`; `LINKS.applyUrl`,
`bookingUrl`, `qrTargetUrl`. Zachary has no portrait yet. Photo drop-zones on the
opening and any hero. Confirm the process step names match the MSFG website.

## Not built yet

- **PowerPoint** (~47 slides — 17 main + 30 popout slides with "← Back").
- **Real photography** — placeholders are wired; drop images into `assets/`.
