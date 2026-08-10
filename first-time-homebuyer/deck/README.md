# First-Time Homebuyer Webinar — HTML Deck

Built to **HANDOFF v6** (`../final/HANDOFF-v6-PART-1.md`, `-PART-2.md`,
`DESIGN-PROMPT-v6.md`), which supersedes v5 entirely.

**22 main slides · 53 popouts · ~38 min taught + open Q&A · 16:9.**

## Run it

```bash
cd first-time-homebuyer/deck && python3 -m http.server 4173
```

Open <http://localhost:4173/index.html>. It's static — any web server works, or
open `index.html` over `file://` (the ES-module imports need a server in most
browsers, so a local server is recommended).

## Controls

| Key | Action |
|---|---|
| → / Space / PageDown | Next slide |
| ← / PageUp | Previous slide |
| Home / End | First / last slide |
| **P** | Open presenter view (second window) |
| **F** | Fullscreen |
| **G** | Toggle layout guides (shows the webcam safe area) |
| Esc | Close a popout |

Cards and chips open popouts on click; every popout traps focus and closes on
✕ / Esc / backdrop click.

## Presenter view

Press **P** (or the ▤ button). A second window opens with the current slide's
speaker notes, the one-concept line, next-slide preview, the popouts available on
this slide, and four clocks: time on this slide, the slide's target, **pace**
(how far ahead/behind the spec's run of show you are), and total elapsed.

**Share the main window; keep the presenter window on your own screen.** The two
sync over `BroadcastChannel` — arrow keys and the popout buttons work from either.

## How it's built

Content is **data**, rendered by exactly two components — this is what makes "all
53 popouts use the same two components, no duplication" actually true.

```
index.html          shell + nav + modal root
presenter.html      the second window
css/
  tokens.css        palette, type scale, semantic colour lock, the lime rule
  base.css          reset, the 1600×900 stage, compliance furniture, responsive
  components.css     the card and the modal — the only two components
  slides.css        per-layout styling
js/
  deck.js           renders slides from data, injects compliance, nav, scaling
  modal.js          ONE modal: focus trap, Esc, backdrop, scale-fade
  card.js           ONE card: aria-label, hover lift, opens a modal
  figures.js        8 inline-SVG diagrams, banded, semantic-locked
  presenter.js      presenter view + sync
content/
  slides.js         the 22 main slides
  modals.js         the 53 popouts (text verbatim from the spec)
  presenters.js     presenter component + placeholder register + compliance strings
assets/
  brand/            logos (SVG), MSFG QR
  portraits/        Seth, Robert (Zachary portrait is a visible placeholder)
```

### Guardrails wired into the code, not left to discipline

- **The lime rule.** There is no lime *text* token in `tokens.css` — lime exists
  only as `--fill-accent` and the band ramp. You can't accidentally set lime type
  on a light ground because the token doesn't exist.
- **Semantic colour lock.** Principal is `--sem-principal` everywhere — the same
  teal in the payment stack and the amortization chart, by construction.
- **Compliance can't be forgotten.** The footer + NMLS render on every slide
  (except the emotional-beat section titles) from the presenter component. Any
  slide or popout whose data carries `hasNumbers` / a program flag gets the 16pt
  hypothetical or general-guidelines disclaimer automatically.
- **Spec conformance check.** The console logs `22 slides · 53 popouts` and flags
  a mismatch. It also warns on any unreachable popout or any card pointing at a
  missing popout.

## Swapping the presenter

Edit `ACTIVE_PRESENTER` in `content/presenters.js` (`'seth'` | `'robert'` |
`'zachary'`). Only three things change: the footer line, Slide 1, and the final
slide. Nothing re-lays-out. Ships set to **Seth Angell**.

## Placeholders — fill these before delivery

All 10 render as **visible** dashed chips so the deck can't ship with a silent
blank. Fill each by replacing `null` with the real value in
`content/presenters.js` → `PLACEHOLDERS`; the chip disappears automatically.

| # | Placeholder | Where |
|---|---|---|
| 1 | Seth's phone | Slide 1, final slide |
| 2 | Secondary email | Slide 1 |
| 3 | Website URL | Final slide |
| 4 | Apply Now link | Final slide |
| 5 | Booking link | Final slide |
| 6 | QR target URL | Final slide (`QR_ASSET` also points here) |
| 7 | Social handles | Final slide (omit cleanly if none) |
| 8 | Presenter portraits ×3 | Slide 1 — **Zachary's is missing** |
| 9 | MSFG loan-process screenshot | Process Slide 2 — **match step naming exactly** |
| 10 | Brand fonts | Global — Inter until MSFG supplies the family |

## Pre-flight before delivery

Per the spec's own checklist:

- [ ] Verify the rent/appreciation **source + year** on Budget Slide 1 on the
      date of delivery — it is a placeholder source line right now.
- [ ] Confirm the LE (3 business days) and CD (3 business days before signing)
      timing against `../research/loan-estimate.md`.
- [ ] Confirm down-payment-assistance program status the day you present.
- [ ] Fill placeholders 1–9.
- [ ] Match Process Slide 2 step names to the MSFG website screenshot exactly.

## Known deviations from source docs

- **Calculators are absent** — this is correct. v6 removed the three live
  calculators deliberately (the numbers rule). `PROJECT_GOALS.md` predates that
  redirect and still lists them; it was not updated.
- **`branding/colors.md` and `fonts.md` are two generations stale** — they still
  describe the v4 "Summit Navy / Alpenglow" placeholder palette. The live palette
  is the v6 Deep Teal / Green / Lime / Charcoal system, encoded in
  `css/tokens.css`. Treat tokens.css as the source of truth, not those files.
- **Slide count:** the spec's count table totals "23 main," but its rows sum to
  22 and PART 1 says "~22 main slides." This deck has 22.

## PowerPoint

Not built yet. The spec calls for a ~76-slide `.pptx` (every popout becomes a
linked slide with a "← Back"). Worth doing as a separate pass once this HTML is
signed off — building both now means maintaining two decks through every revision.
