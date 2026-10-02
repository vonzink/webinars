# Reverse Mortgages

Turning home equity into financial flexibility. A practical guide to FHA-insured HECMs.

[Webinar library](https://msfgmortgage.com/webinars/) · [Open webinar](https://msfgmortgage.com/webinars/reverse-mortgages/)

Revised and published September 29, 2026 with Seth’s requested edits in Amplify deployment 59. Second review applied using current page numbers. Release record: `output/reverse-seth-round2/release.json`. Rollback baseline: deployment 58.

This version preserves the supplied PowerPoint except for Seth’s September 29 edits: 20 audience slides, HECM first after the opening, three myths upfront, and the original pacing appendix in Presenter View. See [SOURCE-CHECK.md](SOURCE-CHECK.md) for the slide mapping and preservation checks.

## Presenting

Open the webinar and press **P** for the connected presenter window. Share the main slide window in Zoom and keep Presenter View private. Opening `presenter.html` directly will not connect it to another open deck session.

Right and left arrows advance or reverse reveals on the myths, eligibility, scenarios, balance, equity, repayment examples, fit, process and questions slides. Other slides navigate normally. **F** toggles fullscreen. The presenter window includes notes, clocks and annotation tools. The original pacing guide appears there on the opening slide only. `?preview` shows every build for review.

Personal notes and shortcuts save in the current browser only. They do not sync with the webinar database. Internet is used for Google Fonts, with fallback fonts if unavailable.

## Editing a slide

In Presenter View, the settings button (the gear) has a **Slide editing** section: the edit password, kept in that browser, and **Open Slide settings**, which opens `editor.html` on the slide being presented. The list on the left has the **Master CSS** and every slide. The selected slide comes up in the view in the middle, where its text can be changed right on the slide. The window on the right holds the slide's **HTML**, **Slide CSS** (that slide only) and **Slide JS** (runs each time the slide is shown, with `slide` as the slide's element). The Master CSS applies to every slide on top of the deck's built-in stylesheets, which are listed beside it for reference.

**Save for everyone** stores the change, so every visitor sees it; it asks for the shared edit password. **Reset to original** removes the saved edit and the slide in this repository comes back. **Discard changes** drops a draft that has not been saved.

Slides can be **added** (a copy of the open slide, placed after it), **deleted** (a deck slide waits under "Deleted slides" and can be brought back; an added slide is gone) and **reordered** (drag in the list, or Move up / Move down). These are saved straight away. Footer page numbers follow each slide's place. The bars between the three sections drag to resize them.

**Edit this slide with AI** and **Add or edit several slides with AI** (under the slide in the middle) walk through the same steps: describe what you want, copy the prompt, paste it into ChatGPT or Claude, paste its response back, and preview. One slide comes back as three code blocks (HTML, CSS, JS) and goes into the boxes as an unsaved change, saved with **Save for everyone**. Several slides come back as one JSON object: new slides placed after the open one, or new versions of slides you choose, matched by their ids. They are shown in a preview of the deck and saved only when you confirm. The prompts carry the deck's format, the Master CSS rules the slide uses, the slide outline and the footer; the code is in `js/slide-prompt.js`. Paste the whole response as it is: the JSON is found whether it is alone, in a code block, or has sentences around it. A response with more than one JSON block, or one that is cut off, is refused with a message. Whatever footer the AI writes, every slide that comes back gets the deck's own footer (`footer` in `content/slide-format.js`), exactly once. The several-slides route never changes the Master CSS.

Saved edits live in the Dashboard API (`/api/public/webinar-slide-edits`, table `webinar_slide_edits`), keyed by `reverse-mortgages` and the slide id (`_master` for the Master CSS, `_slides` for the list of added, deleted and reordered slides). The password is the server's `WEBINAR_EDIT_PASSWORD` setting and is never stored in this repository. A slide whose HTML was edited no longer follows later changes to `content/slides.js` or the presenter picker until it is reset; a slide with only CSS or JS edits still does. Anyone with the password can put JS on the public deck, so share the password only with people who should be able to do that.

## Local review

From `/Users/zacharyzink/MSFG/Webinar-Source`:

```sh
python3 -m http.server 4196 --bind 127.0.0.1
```

Open <http://127.0.0.1:4196/reverse-mortgages/deck/>.

## Source files and tests

- `deck/content/slides.js`: source blocks, approved edits, visible-block mapping, reveal settings and presenter appendix
- `deck/content/source-transcript.json`: text extracted from all 22 PowerPoint slides
- `deck/js/source-slides.js`: layout and rendering
- `deck/css/reverse.css`: visual styling

```sh
npm test --prefix reverse-mortgages/deck
```

Browser checks are in `deck/tests` (and `registration/output/check.run.js`). Open the playwright-cli session from the repository root: their screenshot paths are relative to it. Screenshots are under `deck/output/playwright`. Release records are under `output/reverse-seth-round2` at the workspace root.

The closing slide links to the existing MSFG booking calendar at `https://info.msfgmortgage.com/widget/booking/g5PgWvOtMFIP7b8Py4C7`. Available Mountain Time slots were verified without submitting an appointment. This is the calendar already embedded on the MSFG consultation page; its staff routing was not changed.
