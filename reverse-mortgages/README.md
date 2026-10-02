# Reverse Mortgages

Turning home equity into financial flexibility. A practical guide to FHA-insured HECMs.

[Webinar library](https://msfgmortgage.com/webinars/) · [Open webinar](https://msfgmortgage.com/webinars/reverse-mortgages/)

Revised and published September 29, 2026 with Seth’s requested edits in Amplify deployment 59. Second review applied using current page numbers. Release record: `output/reverse-seth-round2/release.json`. Rollback baseline: deployment 58.

This version preserves the supplied PowerPoint except for Seth’s September 29 edits: 20 audience slides, HECM first after the opening, three myths upfront, and the original pacing appendix in Presenter View. See [SOURCE-CHECK.md](SOURCE-CHECK.md) for the slide mapping and preservation checks.

## Presenting

Open the webinar and press **P** for the connected presenter window. Share the main slide window in Zoom and keep Presenter View private. Opening `presenter.html` directly will not connect it to another open deck session.

Right and left arrows advance or reverse reveals on the myths, eligibility, scenarios, balance, equity, repayment examples, fit, process and questions slides. Other slides navigate normally. **F** toggles fullscreen. The presenter window includes notes, clocks, annotation tools and the original pacing guide. `?preview` shows every build for review.

Personal notes and shortcuts save in the current browser only. They do not sync with the webinar database. Internet is used for Google Fonts, with fallback fonts if unavailable.

## Local review

From `/Users/zacharyzink/MSFG/Webinars`:

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

Browser checks are in `deck/tests`. Screenshots are under `deck/output/playwright`. Release records are under `output/reverse-seth-round2` at the workspace root.

The closing slide links to the existing MSFG booking calendar at `https://info.msfgmortgage.com/widget/booking/g5PgWvOtMFIP7b8Py4C7`. Available Mountain Time slots were verified without submitting an appointment. This is the calendar already embedded on the MSFG consultation page; its staff routing was not changed.
