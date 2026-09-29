# Audit blockers fix round (2026-09-29)

A read-only code audit of the Studio package on 2026-09-07 found four
blockers after the final package review had approved. This round fixes all
four on the two open PR branches.

## Blockers and fixes

1. **Blank live preview** (`vonzink/webinars`). In `?mode=preview` the fit
   shell was never sized, so the 1920×1080 sandbox sat inside a 0×0 clipped
   box. `js/studio/preview-host.js` now sizes the stage through the shared
   `createSurfaceController` exactly as the audience page does; the viewer
   page carries `data-preview-stage`, `data-preview-fit-shell`, and
   `data-preview-fit-surface`; the preview shell takes one grid row. The
   acceptance now measures the inner frame's rendered box (non-zero, 16:9
   within 1%, inside the stage).
2. **"Copy my changes" no-op** (`vonzink/dashboard.msfgco.com`). The editor's
   `copyText` defaulted to a no-op and the bootstrap supplied none. The
   default is now the browser clipboard, failure is reported in a
   `[data-conflict-status]` line inside the conflict banner, success is
   confirmed there, and a reload that lands mid-copy discards the result.
3. **Silent backend 500s** (`vonzink/dashboard.msfgco.com`). The four Studio
   routers log `{ err, requestId, method, path }` on every generic 500/503
   before emitting the whitelisted operational event; `server.js` passes
   `errorLogger`. The public route logs the route path without the query
   string. Response bodies are unchanged.
4. **Deck not published** (`vonzink/webinars`). `site/webinars.json` lists
   `first-home-without-mystery` with a hub card; the build ships the deck
   (55 files) including `studio-viewer.html` and `js/studio/`. `node_modules`
   and `package-lock.json` are now excluded from every deck.

## Gates

| Gate | Result |
| --- | --- |
| Dashboard `TZ=UTC npx vitest run` (full) | 1555 passed, 2 failed: the accepted `calendarSyncUi.test.js` baselines |
| Dashboard touched suites (editor, four route files) | 326 passed |
| Dashboard ESLint on touched files, `node --check`, `node build.js`, `git diff --check` | clean |
| Deck `npm test` | 131 passed |
| `node --test site/tests/build.test.mjs`, `node site/build.mjs --no-zip` | 8 passed; 4 webinars built |
| Studio acceptance (real Chromium, both origins) | 91/91 |

## Independent review

Verdict: **APPROVE**. Findings folded in before commit: public-route log
uses the route path, not `originalUrl`; the editor ignores a copy result
after the conflict has cleared; `node_modules` and `package-lock.json`
are excluded from the artifact; the webinars route test pins `requestId`;
manifest churn, a double blank line, and the aspect-ratio assertion.
Noted for follow-up, out of this round's scope: `js/webinar-studio/assets.js`
still has a silent clipboard default; the 1920×1080 design size is
declared in both hosts.
