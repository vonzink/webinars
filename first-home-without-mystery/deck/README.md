# Your first home, without the mystery. (deck)

A static slide deck: plain HTML, CSS and ES modules, no build step. `index.html` is the deck, `presenter.html` is Presenter View, `editor.html` is Slide settings. Slides are defined in `content/slides.js` and drawn by `js/deck.js`.

```sh
npm test --prefix first-home-without-mystery/deck
```

## Editing slides

In Presenter View, the settings button (the gear) opens **Settings**. Its first section, **Edit the slides**, has the edit password (kept in that browser) and **Open Slide settings**, which opens `editor.html` on the slide being presented.

Slide settings lists the **Master CSS** and every slide on the left. The selected slide shows in the middle, where its text can be changed right on the slide. The boxes on the right hold the slide's **HTML**, **Slide CSS** (that slide only) and **Slide JS** (runs each time the slide is shown, with `slide` as the slide's element). Slides can be added, deleted and reordered. **Instructions** gives a prompt for Claude or ChatGPT that describes this deck's slide format (`content/slide-format.js`).

**Save for everyone** stores the change, and every visitor's deck applies it when it loads. **Reset to original** removes the saved edit and the slide from this repository comes back.

Where things live:

- Saved edits are stored by the Dashboard API (`/api/public/webinar-slide-edits`), under the name `first-home-without-mystery` (`slug` in `content/webinar-config.js`) and the slide's id. `_master` is the Master CSS and `_slides` is the list of added, deleted and reordered slides. A deck served from `localhost` talks to `http://localhost:8080` instead of the live API.
- The password is the server's `WEBINAR_EDIT_PASSWORD` setting. It is never stored in this repository. Anyone who has it can put JS on the public deck.
- `editor.html`, `js/slide-edits.js`, `js/slide-editor.js`, `js/slide-prompt.js` and `js/pages.js` are shared with the other decks and copied unchanged from `reverse-mortgages/deck`. Do not edit them here.

What an edit changes and what it does not:

- A slide with only CSS or JS saved keeps following `content/slides.js` and the presenter picker. A slide whose HTML was saved shows that HTML until it is reset.
- Parts that open something keep working after a slide's HTML is edited, as long as their attribute stays on the element: `data-modal="<pop-out id>"` (loan-program cards, the cash help button, the document cards, a compare button) and `data-media="<graphic id>"` (figures and graphics buttons). One listener in `js/deck.js` handles them all. Remove the attribute and the part stops opening.
- The calculator icon on the cash-to-close example is added by the deck, not by the slide's HTML, so it stays after an edit.
- Step-by-step builds follow whatever carries `class="build"` in the saved HTML.
- These stop working once a slide's HTML is edited, until it is reset: the graphics menu (top-right icon on a slide that has graphics) and a diagram slide (`layout: 'web'`). No slide in this deck uses either today. Slide settings shows a warning on a slide that has one.
- On the five-step plan, the detail panel under the steps is filled in from `content/slides.js` as each step appears. Text typed into that panel in Slide settings is overwritten when the slide is presented.
