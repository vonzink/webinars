# Studio export

Turns a static webinar deck into a Webinar Studio source bundle: Master HTML and
CSS, every slide with its own HTML, CSS and JavaScript, speaker notes and target
times, and a manifest of the media the deck uses.

Decks covered: `first-home-without-mystery`, `homebuyers-webinar`, `va`. Each has
a small config in `decks/`. The LE/CD webinar is a document viewer, not a slide
deck, and is not exported.

## Commands

Run from the repository root.

```bash
npm --prefix tools/studio-export ci          # once: esbuild and playwright-core
node tools/studio-export/export.mjs <slug>   # writes <deck>/migration/
node tools/studio-export/parity.mjs <slug>   # static deck vs Studio render
DASHBOARD_ROOT=/path/to/dashboard.msfgco.com npm --prefix tools/studio-export test
```

The export and the parity check drive the installed Google Chrome. Neither
uploads anything or touches another repository.

## What the export writes

In the deck's `migration/` folder:

| File | Contents |
|---|---|
| `source-bundle.json` | The Studio bundle: `webinar`, `master`, `slides`. |
| `asset-manifest.json` | Each referenced media file: key, path, type, size, SHA-256, where it is used. |
| `export-report.json` | Per slide: popouts, graphics, calculator, build count. Also links made inert, requests blocked during capture, and features left in the static deck. |
| `source-checksums.sha256` | SHA-256 of every input file and of the bundle and manifest. |

Two exports of an unchanged deck are byte-for-byte identical. The test suite
fails if a committed export is out of date, so re-export and commit after
editing a deck.

## What changes on the way into Studio

Studio runs each slide alone in a sandboxed frame, so some things are rewritten:

- **Media** becomes logical tokens, `{{LOCAL_ASSET:<key>}}`. The importer swaps
  them for real asset ids after each file passes the malware scan.
- **Links** lose their `href`. The sandbox cannot navigate, and Studio's content
  rules reject links to other sites. Every one is listed in the report.
- **Builds** are driven by Studio's animation events. They still play on their
  own when a slide opens.
- **Popouts, slide graphics and calculators** use the deck's own modules,
  bundled into the slide that opens them, and report to Studio when they open
  and close so the presenter view can drive them.
- **CSS string escapes** such as `"\2013"` become the literal character; Studio
  rejects backslashes in CSS values.

Slide ids are UUID v5 of `https://msfgmortgage.com/webinars/<slug>#<anchor>`, so
a slide keeps its id across re-exports.

## Checks

- `tests/export.test.mjs` exports every deck and checks the bundle's shape, that
  nothing private (write key, legacy API URL, local paths, speaker notes in
  code) leaks into it, that every asset is referenced and hashed, and, with
  `DASHBOARD_ROOT` set, that it passes the Dashboard's own content policy.
- `parity.mjs` renders each slide, popout, graphic and calculator twice, in the
  static deck and in the real Studio slide frame, and compares the screenshots.
  With `--live-bundle` and `--approved-dir` it renders what the backend serves
  after an import instead of the export.

## Importing

The import runs from the Dashboard repository:
`backend/scripts/importWebinarBundle.js`, described in
`docs/webinar-studio/import-runbook.md` there.
