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
column: the edit password (kept in that browser) and **Open Slide settings**,
which opens `editor.html` on the slide being presented. The list on the left
has the **Master CSS** and every slide; the selected slide is shown in the
middle, where its text can be changed on the slide itself; the boxes on the
right hold the slide's HTML, its own CSS and its own JS.

**Save for everyone** stores the change, and every visitor's deck applies it on
load. **Reset to original** removes the saved edit and the slide in this
repository comes back. **Discard changes** drops a draft that has not been
saved. Slides can also be added (a copy of the open slide), deleted (a deck
slide waits under "Deleted slides" and can be brought back) and reordered;
those are saved straight away. **Instructions** gives a prompt for Claude or
ChatGPT that describes this deck's slide format (`content/slide-format.js`).

Saved edits live in the Dashboard API (`/api/public/webinar-slide-edits`, set in
`content/webinar-config.js`), stored under `va` and the slide id (`_master` for
the Master CSS, `_slides` for the list of added, deleted and reordered slides).
A deck opened on `localhost` talks to a backend on `localhost:8080` instead.
The password is the server's `WEBINAR_EDIT_PASSWORD` setting and is never
stored in this repository. A slide whose HTML was edited no longer follows
later changes to that slide in `content/slides.js` until it is reset; a CSS-only
or JS-only edit keeps following them.

Built-in clickable parts: the cards and the compare button open their pop-outs
through a `data-modal="<pop-out id>"` attribute, handled by one listener in
`js/deck.js`, so they keep working after a slide's HTML is edited as long as
that attribute stays in the HTML. No built-in part of this deck stops working
when a slide's HTML is edited. The payment calculator is not part of any slide
and is not affected.

Tests: `node --test tests/*.test.mjs` from this folder.

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
