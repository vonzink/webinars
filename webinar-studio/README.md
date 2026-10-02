# Webinar Studio (Webinar Suite)

Webinar Studio is where staff present, edit and create webinars on msfgmortgage.com. Its home page is called **Webinar Suite** on screen, and Slide settings and Presenter View link back to it under that name. It is published at `/webinars/studio/` and linked from the Dashboard (Marketing → Webinar Studio). It has no card on the public library page.

## What is here

This folder is not a deck of its own. The site build takes the Reverse Mortgages deck (`reverse-mortgages/deck`: its pages, styles and engine) and lays this folder over it, so there is one copy of the deck engine and the editor.

- `home.html`, `js/studio-home.js`: Webinar Suite: the list of webinars, **Create with AI**, and **Start with a blank webinar**.
- `js/presenter-options.js`: who can present a new presentation. Today the deck's built-in list (`content/presenters.js`); this is the one place to change when the list comes from the Dashboard's `/loan-officers` roster.
- `content/webinar-config.js`: reads which webinar to show from the address (`index.html?w=<name>`). With no name it sends the visitor to `home.html`.
- `content/slides.js`: the three starter slides every blank webinar begins with (title, content, questions).
- `content/site-webinars.js`: the webinars that are built into the site, listed in the Studio beside the created ones. Add a deck here when it gets Slide settings.
- `tests/`: a browser check of the AI workflows (below). Not shipped.

## Create with AI

1. Describe the presentation and choose the presenter.
2. **Copy prompt**, paste it into ChatGPT or Claude, and copy its whole response back.
3. **Preview** reads the response, checks it, and shows every slide in the real deck pages. Nothing is saved.
4. **Create presentation** saves it and opens Slide settings.

The response is one JSON object: `{ "title", "masterCss", "slides": [{ "title", "html", "css", "js" }] }`, at most 60 slides. It must be the JSON alone or inside one code block; text around it is refused. Every Master CSS selector must start with `.slide` (no `:root`, `html`, `body`, `@import` or `@font-face`), because the Master CSS applies to the whole page the slides sit in. Every slide is given the deck's footer for the chosen presenter, replacing whatever footer the AI wrote.

How it is stored: there is no stand-alone slide in the saved-edits model; an added slide is always a copy of one of the deck's own slides with its content saved on top. Each generated slide is therefore an added slide framed like the plain `content` starter slide, holding the full HTML, CSS and JS from the response, and the three starter slides are left out of the list. Saving is one request per record, in this order: every slide, the Master CSS (`_master`), the slide list (`_slides`), and the webinar's details (`_webinar`: title, presenter, `madeWithAi`) last. `_webinar` is what makes a webinar show up in Webinar Suite, so a creation that fails part-way does not appear there; pressing **Create presentation** again writes the same records again and finishes it.

## How a created webinar works

A webinar made in the Studio is a name and a title saved in the Dashboard API (`/api/public/webinar-slide-edits/<name>/_webinar`). Its slides are made in Slide settings on the shared pages and stored under the same name: edited starter slides, added slides, their order, and the Master CSS. Nothing is deployed when a webinar is created or changed.

- Present: `/webinars/studio/index.html?w=<name>` (press **P** for Presenter View).
- Edit: `/webinars/studio/editor.html?w=<name>`.

Creating, editing and deleting ask for the shared edit password (the server's `WEBINAR_EDIT_PASSWORD`). Opening and presenting do not.

## Running it locally

The overlay only exists in the built site, so build first and serve the result:

```sh
node site/build.mjs --no-zip --out /tmp/msfg-site
python3 -m http.server 4200 --bind 127.0.0.1 --directory /tmp/msfg-site/site
```

Open <http://localhost:4200/webinars/studio/>. Saving needs the Dashboard backend running on port 8080 with `http://localhost:4200` allowed in `PUBLIC_WEBINAR_ORIGINS`.

## Tests

- `site/tests/build.test.mjs`: the Studio as built, and the engine shared file for file.
- `site/tests/ai-workflows.test.mjs`: prompts, strict JSON reading, Master CSS checks, footers in every deck, replace-by-id, save order and retry.
- `webinar-studio/tests/run-ai-workflows-browser.sh`: builds the site and drives Create with AI and Slide settings in a browser against an in-memory stand-in for the saved-edits API, including a save that fails part-way. Screenshots go to `webinar-studio/output/playwright/`.
- The engine's own tests are in `reverse-mortgages/deck/tests`.
