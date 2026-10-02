# The Homebuyer's Playbook — HTML Deck ("Ridgeline")

Built to **`SLIDE_DESIGN_SPEC.md`** (the "Ridgeline" visual system) with content
realigned to the client's actual presentation.

**16 main slides · 30 popouts · ~40 min + Q&A · 1920×1080.**

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
- Console logs `16 slides · 30 popouts` and flags any unreachable/missing popout.

## Architecture (unchanged engine)

```
content/  slides.js · modals.js · presenters.js      ← all copy lives here
js/       deck.js · modal.js · card.js · figures.js · presenter.js
css/      tokens · base · components · slides
```

One card component + one modal component render everything. Two diagrams only,
both number-free: `paymentBands()` and `processStepper()` in `figures.js`.

## Editing slides

Presenter View has an **Edit the slides** block at the bottom of its right-hand
column: the edit password (kept in that browser), **Open Slide settings**, which
opens `editor.html` on the slide being presented, and a link to Webinar Studio.

Slide settings lists the **Master CSS** and every slide on the left, shows the
selected slide in the middle (its text can be changed right on the slide), and
has the slide's **HTML**, **Slide CSS** (that slide only) and **Slide JS** (runs
each time the slide is shown, with `slide` as the slide's element) on the right.
**Save for everyone** stores the change so every visitor sees it. **Reset to
original** removes the saved edit and the slide from this repository comes back.
**Discard changes** drops a draft. Slides can be added (a copy of the open one),
deleted and reordered; those are saved straight away. **Instructions** gives a
prompt to paste into Claude or ChatGPT so it answers in this deck's format.

Saved edits live in the Dashboard API (`/api/public/webinar-slide-edits`), keyed
by `homebuyers` (the `slug` in `content/webinar-config.js`) and the slide id
(`_master` for the Master CSS, `_slides` for the list of added, deleted and
reordered slides). Nothing is written to this repository. The password is the
server's `WEBINAR_EDIT_PASSWORD` setting and is never stored in the repository.
Anyone with it can put JS on the public deck, so share it accordingly.

What an edit does to the built-in clickable parts:

- **Keep working after a slide's HTML is edited:** cards and any other element
  with `data-modal="<pop-out id>"`, and the worksheet figure or any button with
  `data-media="<graphic id>"`. One click listener on the slides finds them by
  attribute (`initOpeners` in `js/deck.js`), so keep those attributes in the HTML.
- **Stop working once a slide's HTML is edited and saved** (until it is reset):
  the graphics menu at the top right of a slide, the calculator icon on "What's
  actually in the payment", and the "Meet the players" diagram, which is loaded
  into the slide after it is built. Slide settings shows a warning on those
  slides. Slide CSS and Slide JS edits do not affect them. The presenter can
  still open graphics and both calculators from Presenter View.

A slide whose HTML was edited no longer follows later changes to
`content/slides.js` or the presenter picker until it is reset. A copy of a slide
has a new id, so the few rules in `css/slides.css` written for one slide by id
(`#slide-budget-payment`, `#slide-questions`, …) and that slide's graphics menu
do not carry over to the copy.

Files: `editor.html`, `js/slide-edits.js`, `js/slide-editor.js`,
`js/slide-prompt.js` and `js/pages.js` are shared with the other decks and are
copied unchanged from `reverse-mortgages/deck`. This deck's own part is
`content/webinar-config.js`, `content/slide-format.js`, and the Slide settings
parts of `js/deck.js`, `js/presenter.js` and `presenter.html`.

## Swapping the presenter

`ACTIVE_PRESENTER` in `content/presenters.js` (`seth` | `robert` | `zachary`).
Only the footer, Slide 1, and the final slide change. Ships as **Seth**.

## Fill before delivery (visible placeholders)

In `content/presenters.js`: Seth's `phone`, `email2`; `LINKS.applyUrl`,
`bookingUrl`, `qrTargetUrl`. Zachary has no portrait yet. Photo drop-zones on the
opening and any hero. Confirm the process step names match the MSFG website.

## Not built yet

- **PowerPoint** (~46 slides — 16 main + 30 popout slides with "← Back").
- **Real photography** — placeholders are wired; drop images into `assets/`.
