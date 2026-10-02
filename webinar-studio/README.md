# Webinar Studio

Webinar Studio is where staff present, edit and create webinars on msfgmortgage.com. It is published at `/webinars/studio/` and linked from the Dashboard (Marketing → Webinar Studio). It has no card on the public library page.

## What is here

This folder is not a deck of its own. The site build takes the Reverse Mortgages deck (`reverse-mortgages/deck`: its pages, styles and engine) and lays this folder over it, so there is one copy of the deck engine and the editor.

- `home.html`, `js/studio-home.js`: the list of webinars, and **Start a new webinar**.
- `content/webinar-config.js`: reads which webinar to show from the address (`index.html?w=<name>`). With no name it sends the visitor to `home.html`.
- `content/slides.js`: the three starter slides every new webinar begins with (title, content, questions).
- `content/site-webinars.js`: the webinars that are built into the site, listed in the Studio beside the created ones. Add a deck here when it gets Slide settings.

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

The Studio's own tests are in `site/tests/build.test.mjs`; the engine's are in `reverse-mortgages/deck/tests`.
