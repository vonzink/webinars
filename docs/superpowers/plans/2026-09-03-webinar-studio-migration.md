# Webinar Studio Migration and Cutover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Import **Your first home, without the mystery.** into Webinar Studio with all 15 slides, assets, notes, settings, and behavior intact, then prepare a reversible production cutover that removes the public presenter and retires the browser write key only after verified replacement paths are live.

**Architecture:** Deterministic export tools capture the current static deck into reviewed source and asset manifests, then Dashboard-side import services create an audience-disabled webinar through the same validation/revision/asset rules used by Studio. A separate dry-run-first migration maps legacy Postgres loan-officer identifiers to exactly one active Dashboard user before importing personal data. The public site is built as a complete Git-tracked Amplify tree with a rollback commit; operational migration, deployment, access enablement, cutover, and credential retirement remain separately approved gates.

**Tech Stack:** Existing browser-rendered deck, Node.js migration CLIs, Playwright CLI, JSON/JSON Schema, PostgreSQL `pg`, MySQL `mysql2`, Dashboard services, SHA-256 manifests, `pixelmatch`/`pngjs`, Git-based AWS Amplify static hosting, Dashboard S3/CloudFront deploy script

**Spec:** `/Users/zacharyzink/MSFG/Webinars/docs/superpowers/specs/2026-09-03-webinar-studio-design.md`

## Global Constraints

- Complete and review the foundation, shared-assets, renderer, and private-Studio packages before this package.
- Do not change mortgage, compliance, speaker, or educational content during platform migration.
- Preserve all 15 slides, stable anchors, brand assets, Seth Angell presenter content, speaker notes, timing, animation stepping/play/pause, navigation, responsive fit, calculator, overlays, popouts, graphics, annotations, fullscreen, accessibility labels, and keyboard behavior.
- Shared structure moves to Master HTML/CSS; slide-specific output moves to each slide's HTML/CSS/JavaScript block.
- The exporter must capture the current out-of-slide `#modal-root` and cash-to-close calculator behavior explicitly; rendered `.slide` inner HTML alone is not a complete migration source.
- Existing asset files enter the shared asset library and code uses concrete version-specific tokens such as `{{ASSET:11111111-1111-4111-8111-111111111111}}`.
- Import the webinar with `audience_enabled = false`; Save Live remains immediate inside the hidden record.
- Legacy note/settings mapping must resolve each source `lo_id` to exactly one active Dashboard user. Missing or ambiguous rows remain unmigrated and are reported.
- Preserve legacy timestamps when available, source Postgres rows unchanged, and compare source/target counts before frontend cutover.
- The repository static deck, current complete hosting bundle, and Postgres rows remain rollback material after cutover.
- The public presenter path must contain only an authenticated Dashboard redirect after cutover; no presenter implementation, notes, settings, users, or write key may remain in the public bundle.
- Disable legacy private reads/writes and rotate/remove `WEBINAR_WRITE_KEY` only after the replacement production paths are verified.
- Bundle-host deployments replace complete published trees. Preserve and regression-test the homepage and every sibling webinar route.
- Production database migration, asset infrastructure activation, deck import, personal-data import, Dashboard backend deployment, Dashboard frontend deployment, public-site cutover, and credential retirement are separate explicit approval gates.
- Do not combine an approval for one operational gate with any later gate.
- Never delete production rows, asset versions, rollback bundles, or legacy Postgres data in this plan.
- Preserve unrelated dirty work in the Webinars root and the nested public-site repository; stop if an overlapping target changes.

---

## Package Boundary and File Map

Webinars source repository:

- `first-home-without-mystery/deck/scripts/export-studio-bundle.mjs` — deterministic current-deck export orchestrator.
- `first-home-without-mystery/deck/tests/export-studio-bundle.run.js` — browser-side slide HTML capture.
- `first-home-without-mystery/migration/source-bundle.json` — reviewed Master/slide source with stable UUIDs and local asset references.
- `first-home-without-mystery/migration/asset-manifest.json` — local asset paths, MIME, byte size, and SHA-256.
- `first-home-without-mystery/migration/source-checksums.sha256` — input integrity record.
- `webinar-api/` — tracked legacy source plus a tested private-data decommission switch.
- Migration parity/browser tests and validation report.

Dashboard repository:

- `backend/scripts/importWebinarBundle.js` and `backend/services/webinars/importBundle.js` — dry-run/apply deck and asset importer.
- `backend/scripts/migrateLegacyWebinarPersonalData.js` and `backend/services/webinars/legacyMigration.js` — report-first Postgres-to-MySQL note/settings migration.
- Unit/integration tests and generated report schemas.
- `js/webinar-studio.js` — authenticated deep-link handling for the old presenter redirect.

Nested public-site repository:

- `scripts/build-first-home-studio-route.mjs` — deterministic allow-list copy from the reviewed runtime.
- `webinars/first-home-without-mystery/` — generated viewer/runtime/assets needed for the live route.
- `webinars/first-home-without-mystery/presenter.html` — static redirect only.
- `webinars/tests/first-home-studio-route.test.mjs` — bundle allow-list/private-data checks and sibling-route contract.
- `README.md` — current route and rollback documentation.

Before any edits, record all three Git states and run existing tests:

```bash
git -C /Users/zacharyzink/MSFG/Webinars status --short
git -C /Users/zacharyzink/MSFG/Webinars log --oneline -8
git -C /Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com status --short
git -C /Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com log --oneline -8
git -C /Users/zacharyzink/MSFG/Webinars/Homebuyers-Webinar/Export/msfgmortgage-site-amplify-v1.0 status --short
git -C /Users/zacharyzink/MSFG/Webinars/Homebuyers-Webinar/Export/msfgmortgage-site-amplify-v1.0 log --oneline -8
npm --prefix /Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend test
npm --prefix /Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck test
npm --prefix /Users/zacharyzink/MSFG/Webinars/webinar-api test
```

Expected: reviewed package commits are present, suites pass, and current dirty paths are explicitly recorded. Do not stash, reset, clean, or stage unrelated files.

### Task 1: Put the legacy API under a clean source-control boundary

**Files:**
- Add existing source: `/Users/zacharyzink/MSFG/Webinars/webinar-api/`
- Create: `/Users/zacharyzink/MSFG/Webinars/docs/superpowers/validation/2026-09-03-webinar-api-static-baseline.md`

**Interfaces:**
- Consumes: the already tracked current deck from the renderer package and the currently deployed/local standalone webinar API source.
- Produces: a reviewable Git baseline containing the legacy API source/tests/config example but excluding `node_modules`, runtime credentials, and local environment files.

- [ ] **Step 1: Verify the renderer baseline and ignore boundary**

```bash
git ls-files --error-unmatch first-home-without-mystery/deck/index.html
git check-ignore webinar-api/node_modules/.package-lock.json
git check-ignore first-home-without-mystery/deck/.playwright-cli
```

Expected: the deck entry point is tracked and dependency/browser artifacts are ignored. If not, stop and complete Renderer Task 0 first.

- [ ] **Step 2: Run baseline tests and browser audits before staging**

```bash
npm --prefix webinar-api test
```

Expected: the existing legacy API tests pass. Record exact counts.

- [ ] **Step 3: Record the baseline inventory and checksums**

The validation document lists the exact test command/result, current production API prefix, route inventory, source Git state, and SHA-256 for every source/config/test file under `webinar-api`. It records that reads are currently open and writes use `x-webinar-key`, without recording the key. It states that this is source checkpointing, not a deployment.

- [ ] **Step 4: Stage only source boundaries and inspect the index**

```bash
git add webinar-api docs/superpowers/validation/2026-09-03-webinar-api-static-baseline.md
git diff --cached --stat
git diff --cached --name-only | rg 'node_modules|\.playwright-cli|output/playwright|\.DS_Store|\.env$' && exit 1 || true
```

Expected: legacy API source/tests/config example are staged; dependency trees, secrets, and unrelated root files are absent.

- [ ] **Step 5: Commit the static rollback source**

```bash
git commit -m "chore(webinars): checkpoint legacy webinar API"
```

### Task 2: Export a deterministic 15-slide Studio source bundle

**Files:**
- Create: `/Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck/scripts/export-studio-bundle.mjs`
- Create: `/Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck/tests/export-studio-bundle.run.js`
- Create: `/Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck/tests/export-studio-bundle.test.mjs`
- Create: `/Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/migration/source-bundle.json`
- Create: `/Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/migration/asset-manifest.json`
- Create: `/Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/migration/source-checksums.sha256`

**Interfaces:**
- Consumes: current deck at a localhost URL, `SLIDES`, `MODALS`, cash-to-close markup/math, rendered `.slide` elements, CSS files in canonical order, brand/media files, UUID v5 URL namespace.
- Produces: `captureRenderedDeck(url)`, `appendInteractiveTemplates(slide,modalDefinitions,cashToCloseDefinition)`, `selectSupportedSlideBehavior(actionIds,options)`, `replaceLocalAssets(source,assetManifest)`, and `writeCanonicalJson(path,value)`; schema-version-1 source bundle with deterministic slide UUIDs, one Master HTML mount token plus shared interaction hosts, Master CSS, per-slide HTML/CSS/JavaScript, per-slide `speakerNotes`/`targetSeconds`, and a complete asset manifest.

- [ ] **Step 1: Write the failing export contract**

```js
assert.equal(bundle.schemaVersion, 1);
assert.equal(bundle.webinar.slug, 'first-home-without-mystery');
assert.equal(bundle.slides.length, 15);
assert.deepEqual(bundle.slides.map(slide => slide.anchor), expectedAnchors);
assert.equal((bundle.master.html.match(/{{SLIDE_CONTENT}}/g) || []).length, 1);
assert.equal(new Set(bundle.slides.map(slide => slide.id)).size, 15);
assert.ok(bundle.slides.every(slide => /^[0-9a-f-]{36}$/.test(slide.id)));
assert.ok(assetManifest.assets.every(asset => /^[a-f0-9]{64}$/.test(asset.sha256)));
```

Assert a second export is byte-for-byte identical and every referenced local asset appears exactly once in the asset manifest.

Assert Master CSS follows the five stylesheets actually loaded by the current audience page (`tokens.css`, `base.css`, `components.css`, `slides.css`, `cash-to-close.css`), Master HTML has one slide mount plus stable modal/calculator hosts, the four `prog-*` definitions are serialized into the loan-program slide, and the cash-to-close slide contains its calculator markup, approved `$350,000`/`$30,000` teaching-state behavior, and runtime control adapter. No modal or calculator data may be inferred from the rendered slide subtree alone.

- [ ] **Step 2: Run the test and verify missing artifacts**

```bash
node --test first-home-without-mystery/deck/tests/export-studio-bundle.test.mjs
```

Expected: FAIL because the exporter and generated manifests are missing.

- [ ] **Step 3: Implement deterministic browser capture and transformation**

Use the well-known URL UUID-v5 namespace `6ba7b811-9dad-11d1-80b4-00c04fd430c8` and the JavaScript name expression `` `https://msfgmortgage.com/webinars/first-home-without-mystery#${anchor}` ``. The browser runner returns each fully rendered active slide's inner HTML, anchor, title, notes, time, and supported action IDs. The Node orchestrator:

1. starts a localhost server on an available loopback port;
2. invokes the existing Playwright CLI with `export-studio-bundle.run.js`;
3. concatenates `tokens.css`, `base.css`, `components.css`, `slides.css`, and `cash-to-close.css` in the exact order currently loaded by `index.html` for Master CSS;
4. uses `<div class="slide" data-studio-slide>{{SLIDE_CONTENT}}</div><div id="modal-root" class="modal-root"></div><div id="cash-to-close-root"></div>` as Master HTML;
5. converts local asset URLs to deterministic logical tokens such as `{{LOCAL_ASSET:logo-horizontal}}` for import;
6. embeds the four reviewed loan-program popout definitions as inert slide-local data/templates on the slide that references them, embeds cash-to-close markup/state on the calculator slide, and includes only the JavaScript necessary for that slide's builds/actions plus fixed `msfg:supported-overlay-state` and `msfg:supported-calculator-state` adapters;
7. writes JSON with stable key ordering and a trailing newline; and
8. writes SHA-256 over every input file and generated JSON.

Generated slide source must not contain `x-webinar-key`, legacy API URLs, presenter notes, or local absolute paths.

```js
const master = {
  html: '<div class="slide" data-studio-slide>{{SLIDE_CONTENT}}</div><div id="modal-root" class="modal-root"></div><div id="cash-to-close-root"></div>',
  css: CSS_FILES.map(file => fs.readFileSync(file, 'utf8')).join('\n'),
};
const slides = captured.map((slide, position) => ({
  id: uuidv5(`https://msfgmortgage.com/webinars/first-home-without-mystery#${slide.anchor}`, UUID_V5_URL_NAMESPACE),
  position,
  anchor: slide.anchor,
  title: slide.title,
  targetSeconds: slide.targetSeconds,
  speakerNotes: slide.speakerNotes,
  html: replaceLocalAssets(appendInteractiveTemplates(slide, modalDefinitions, cashToCloseDefinition), assetManifest),
  css: slide.css,
  javascript: selectSupportedSlideBehavior(slide.actionIds, { overlayEvents: true, calculatorEvents: true }),
}));
writeCanonicalJson(bundlePath, { schemaVersion: 1, webinar, master, slides });
```

- [ ] **Step 4: Run export twice and verify determinism/content**

```bash
node first-home-without-mystery/deck/scripts/export-studio-bundle.mjs
shasum -a 256 first-home-without-mystery/migration/source-bundle.json first-home-without-mystery/migration/asset-manifest.json
node first-home-without-mystery/deck/scripts/export-studio-bundle.mjs
node --test first-home-without-mystery/deck/tests/export-studio-bundle.test.mjs
```

Expected: both exports produce identical checksums and all 15 slide/asset/private-data rules pass.

- [ ] **Step 5: Commit the exporter and reviewed manifests**

```bash
git add first-home-without-mystery/deck/scripts/export-studio-bundle.mjs first-home-without-mystery/deck/tests/export-studio-bundle.run.js first-home-without-mystery/deck/tests/export-studio-bundle.test.mjs first-home-without-mystery/migration/source-bundle.json first-home-without-mystery/migration/asset-manifest.json first-home-without-mystery/migration/source-checksums.sha256
git commit -m "feat(webinars): export first-home studio bundle"
```

### Task 3: Add a dry-run-first Dashboard deck and asset importer

**Files:**
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/services/webinars/importBundle.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/scripts/importWebinarBundle.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/tests/services/webinars/importBundle.test.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/tests/scripts/importWebinarBundle.test.js`

**Interfaces:**
- Consumes: source/asset manifests, exact owner email `seth.angell@msfg.us`, exact migration actor email `zachary.zink@msfg.us`, asset quarantine/confirmation services, webinar mutation/revision services.
- Produces: `validateImportBundle(input)`, `planImport(input)`, `applyImport(input)`; CLI modes that write or consume `/Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/migration/runtime/deck-import-plan.json`; machine-readable report without storage keys.

- [ ] **Step 1: Write failing import-plan and idempotency tests**

Assert dry-run performs no writes; owner/actor emails must each match exactly one active `users` row; all 15 stable UUIDs/anchors validate; local asset keys all resolve; existing slug or partial asset release stops apply; apply creates one audience-disabled webinar at live version 1 and one complete revision; rerun returns `IMPORT_ALREADY_APPLIED` without changes.

```js
const plan = await planImport({ bundle, assets, ownerEmail: 'seth.angell@msfg.us', actorEmail: 'zachary.zink@msfg.us' });
expect(plan.summary).toMatchObject({ slides: 15, ownerMatches: 1, actorMatches: 1, audienceEnabled: false });
expect(plan.planSha256).toMatch(/^[a-f0-9]{64}$/);
```

- [ ] **Step 2: Run focused tests and verify missing modules**

```bash
npx vitest run tests/services/webinars/importBundle.test.js tests/scripts/importWebinarBundle.test.js
```

Expected: FAIL because importer service/CLI are missing.

- [ ] **Step 3: Implement dry-run hash binding and same-service imports**

The CLI requires absolute manifest paths, resolves exact active users by email, validates checksums, and writes canonical JSON plus its SHA-256 to `/Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/migration/runtime/deck-import-plan.json`. Apply accepts that exact plan path, recalculates its hash and all source checksums, and refuses drift. Upload each local asset through quarantine and normal GuardDuty confirmation; do not bypass scanning. Replace each concrete local token such as `{{LOCAL_ASSET:logo-horizontal}}` only after receiving an available asset-version UUID. Create the webinar and its first complete revision through an import transaction with `audience_enabled = false`.

```js
async function applyImport({ planPath, expectedPlanSha256 }) {
  const planBytes = await fs.readFile(planPath);
  if (sha256(planBytes) !== expectedPlanSha256) throw new ImportError('IMPORT_PLAN_DRIFT');
  const plan = JSON.parse(planBytes);
  await verifyInputChecksums(plan.inputs);
  const released = await releasePlannedAssets(plan.assets);
  const candidate = replaceLocalAssetTokens(plan.bundle, released);
  return createImportedWebinarTransaction(Object.assign({}, candidate, { audienceEnabled: false, liveVersion: 1 }));
}
```

- [ ] **Step 4: Run unit tests and a disposable integration**

```bash
npx vitest run tests/services/webinars/importBundle.test.js tests/scripts/importWebinarBundle.test.js
npm test
```

Then run `--dry-run` only against the reviewed source manifests and a disposable MySQL/S3 test environment. Expected: 15 slides, one owner, one actor, every asset accounted for, no write, and a printed plan hash. Do not run `--apply` against production in this task.

Use this exact dry-run command from Dashboard `backend/`:

```bash
node scripts/importWebinarBundle.js --dry-run --bundle /Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/migration/source-bundle.json --assets /Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/migration/asset-manifest.json --owner-email seth.angell@msfg.us --actor-email zachary.zink@msfg.us --plan-out /Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/migration/runtime/deck-import-plan.json
```

- [ ] **Step 5: Commit the importer**

```bash
git add backend/services/webinars/importBundle.js backend/scripts/importWebinarBundle.js backend/tests/services/webinars/importBundle.test.js backend/tests/scripts/importWebinarBundle.test.js
git commit -m "feat(webinars): import reviewed studio bundles"
```

### Task 4: Add report-first legacy notes and settings migration

**Files:**
- Modify: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/package.json`
- Modify: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/package-lock.json`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/services/webinars/legacyMigration.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/scripts/migrateLegacyWebinarPersonalData.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/tests/services/webinars/legacyMigration.test.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/tests/scripts/migrateLegacyWebinarPersonalData.test.js`

**Interfaces:**
- Consumes: read-only legacy `DATABASE_URL`, Dashboard MySQL, imported webinar slug/stable anchor map, active Dashboard user directory.
- Produces: `discoverMappings()`, `buildMigrationPlan()`, `applyMigration()`; report path `/Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/migration/runtime/legacy-mapping-report.json`, reviewed mapping path `legacy-lo-user-map.json`, and bound apply plan path `legacy-personal-data-plan.json` in the same runtime directory.

- [ ] **Step 1: Write failing mapping/safety tests**

Use fake Postgres/MySQL sources. Assert the report lists source `lo_id`, available name/email evidence, note/settings counts, exact/ambiguous/missing active-user candidates; apply imports only explicit confirmed mappings; timestamps are preserved; slide anchors map to exact stable UUIDs; source rows are never updated/deleted; rerun is idempotent; source/target counts and row hashes appear in the report.

```js
expect(plan.unmapped).toEqual([{ loId: 'unknown', reason: 'NO_CONFIRMED_USER', notes: 3, settings: 0 }]);
expect(plan.imports[0]).toMatchObject({ loId: 'seth', userId: 42, notes: 8, settings: 1 });
```

- [ ] **Step 2: Run focused tests and verify missing migration code**

```bash
npx vitest run tests/services/webinars/legacyMigration.test.js tests/scripts/migrateLegacyWebinarPersonalData.test.js
```

Expected: FAIL because the migration service/CLI do not exist.

- [ ] **Step 3: Install Postgres client and implement immutable-source migration**

```bash
npm install pg@8
```

The report mode performs only SELECTs. A reviewed mapping JSON contains entries `{ "loId": "source-id", "dashboardUserId": 42 }`; IDs must exist and be active at apply time. Dry-run calculates a plan hash from source primary keys/content hashes, mappings, target webinar/slide IDs, and target existing rows. Apply consumes the exact bound plan file, uses a MySQL transaction, upserts settings by user, inserts notes with `source_system = 'legacy-webinar-api'` and `source_record_id = String(presenter_notes.id)` for database-enforced idempotency, preserves timestamps, and never issues a Postgres mutation.

- [ ] **Step 4: Run unit and disposable dual-database integration tests**

```bash
npx vitest run tests/services/webinars/legacyMigration.test.js tests/scripts/migrateLegacyWebinarPersonalData.test.js
npm test
```

Expected: all unit tests pass. In disposable Postgres/MySQL, report/dry-run/apply/rerun preserves source row hashes and produces equal confirmed source/target counts. Production report/apply remain unperformed pending separate approvals.

Use these exact report and dry-run command forms from Dashboard `backend/`:

```bash
node scripts/migrateLegacyWebinarPersonalData.js --report --webinar first-home-without-mystery --out /Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/migration/runtime/legacy-mapping-report.json
node scripts/migrateLegacyWebinarPersonalData.js --dry-run --webinar first-home-without-mystery --mapping /Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/migration/runtime/legacy-lo-user-map.json --plan-out /Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/migration/runtime/legacy-personal-data-plan.json
```

- [ ] **Step 5: Commit personal-data migration tooling**

```bash
git add backend/package.json backend/package-lock.json backend/services/webinars/legacyMigration.js backend/scripts/migrateLegacyWebinarPersonalData.js backend/tests/services/webinars/legacyMigration.test.js backend/tests/scripts/migrateLegacyWebinarPersonalData.test.js
git commit -m "feat(webinars): migrate legacy presenter data safely"
```

### Task 5: Prove visual and behavioral parity against the static deck

**Files:**
- Modify: `/Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck/package.json`
- Create or modify lockfile: `/Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck/package-lock.json`
- Create: `/Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck/tests/compare-studio-parity.mjs`
- Create: `/Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck/tests/studio-migration-parity.run.js`
- Create: `/Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck/tests/run-studio-migration-parity.sh`
- Create: `/Users/zacharyzink/MSFG/Webinars/docs/superpowers/validation/2026-09-03-first-home-studio-parity.md`

**Interfaces:**
- Consumes: current static deck, imported private document/public bundle fixture, existing screenshot/audit scripts.
- Produces: matched static/new screenshots, per-slide pixel/geometry metrics, functional matrix, and human-review montage.

- [ ] **Step 1: Add deterministic visual comparison dependencies and tests**

```bash
npm install --save-dev pixelmatch@7 pngjs@7
```

Test `compare-studio-parity.mjs` on identical, allowed-antialias, and deliberately shifted fixtures. A comparison passes only when changed pixels above RGB delta 20 are at most 0.75% and the fitted slide bounds differ by at most 1 CSS pixel per edge.

- [ ] **Step 2: Capture all static and database-rendered surfaces**

At 1920×1080, 1366×768, 1024×768, 390×844, and 844×390, capture all 15 slides, four program popouts, cash-to-close calculator open/closed, presenter surface, annotations, animation 0/mid/all, and fullscreen/nav states. Freeze motion, fonts, time, and intercepted network data.

```js
for (const viewport of VIEWPORTS) {
  await page.setViewportSize(viewport);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const anchor of expectedAnchors) {
    await capturePair({ anchor, viewport, state: 'animation-0' });
    await capturePair({ anchor, viewport, state: 'animation-all' });
  }
}
```

- [ ] **Step 3: Exercise functional parity**

The Playwright run verifies exact anchors/order, Back/Next/Home/End/keyboard handling, presenter timing, animation back/forward/play/pause, popouts, calculator math, graphics, annotations/undo/redo/clear, fullscreen, audience reconnect, accessible names, and zero unexpected console/network errors.

```js
await assertAnchorOrder(staticPage, studioPage, expectedAnchors);
await assertKeyboardNavigation(studioPage, ['ArrowLeft', 'ArrowRight', 'Home', 'End']);
await assertAnimationControls(studioPage, ['back', 'forward', 'play', 'pause']);
await assertCalculatorResult(studioPage, { price: 350000, downPaymentPercent: 5, expectedCashToClose: 30000 });
expect(consoleErrors).toEqual([]);
expect(failedRequests).toEqual([]);
```

- [ ] **Step 4: Run parity gates and record every exception**

```bash
npm test
./tests/run-studio-migration-parity.sh
```

Expected: all source contracts and browser actions pass; every slide meets pixel/geometry thresholds or has an individually documented, user-reviewed rendering difference with before/after images. No blanket exception is allowed.

- [ ] **Step 5: Commit parity tooling and report**

```bash
git add first-home-without-mystery/deck/package.json first-home-without-mystery/deck/package-lock.json first-home-without-mystery/deck/tests/compare-studio-parity.mjs first-home-without-mystery/deck/tests/studio-migration-parity.run.js first-home-without-mystery/deck/tests/run-studio-migration-parity.sh docs/superpowers/validation/2026-09-03-first-home-studio-parity.md
git commit -m "test(webinars): prove first-home migration parity"
```

### Task 6: Build a complete Amplify route and public presenter redirect

**Files:**
- Create: `/Users/zacharyzink/MSFG/Webinars/Homebuyers-Webinar/Export/msfgmortgage-site-amplify-v1.0/scripts/build-first-home-studio-route.mjs`
- Create generated route: `/Users/zacharyzink/MSFG/Webinars/Homebuyers-Webinar/Export/msfgmortgage-site-amplify-v1.0/webinars/first-home-without-mystery/index.html`
- Create generated route: `/Users/zacharyzink/MSFG/Webinars/Homebuyers-Webinar/Export/msfgmortgage-site-amplify-v1.0/webinars/first-home-without-mystery/presenter.html`
- Create generated runtime: `/Users/zacharyzink/MSFG/Webinars/Homebuyers-Webinar/Export/msfgmortgage-site-amplify-v1.0/webinars/first-home-without-mystery/css/studio-viewer.css`
- Create generated runtime: `/Users/zacharyzink/MSFG/Webinars/Homebuyers-Webinar/Export/msfgmortgage-site-amplify-v1.0/webinars/first-home-without-mystery/js/studio/`
- Create: `/Users/zacharyzink/MSFG/Webinars/Homebuyers-Webinar/Export/msfgmortgage-site-amplify-v1.0/webinars/tests/first-home-studio-route.test.mjs`
- Modify: `/Users/zacharyzink/MSFG/Webinars/Homebuyers-Webinar/Export/msfgmortgage-site-amplify-v1.0/README.md`
- Modify: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/js/webinar-studio.js`
- Modify: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/tests/frontend/webinarStudioShell.test.js`

**Interfaces:**
- Consumes: reviewed Webinars runtime commit and Dashboard authenticated Studio route.
- Produces: deterministic complete public route; `presenter.html` redirect to `https://dashboard.msfgco.com/?tool=webinar-studio&webinar=first-home-without-mystery&mode=presenter`; Dashboard deep-link open behavior.

- [ ] **Step 1: Write failing allow-list and redirect tests**

Assert the build script copies only viewer HTML/CSS/runtime, no private presenter modules or source manifests; generated `index.html` requests slug `first-home-without-mystery`; `presenter.html` has a meta refresh and JS `location.replace` to the exact Dashboard URL plus a visible login link; and no generated file contains `x-webinar-key`, legacy notes/settings endpoints, Cognito token names, S3 keys, speaker notes, or private source metadata.

```js
assert.deepEqual(copiedFiles.sort(), PUBLIC_ROUTE_ALLOWLIST.slice().sort());
assert.match(indexHtml, /first-home-without-mystery/);
assert.match(presenterHtml, /https:\/\/dashboard\.msfgco\.com\/\?tool=webinar-studio&webinar=first-home-without-mystery&mode=presenter/);
for (const source of generatedSources) assert.doesNotMatch(source, /x-webinar-key|presenter-settings|speakerNotes|s3_key|cognito/i);
```

- [ ] **Step 2: Add Dashboard deep-link test**

Assert `?tool=webinar-studio&webinar=first-home-without-mystery&mode=presenter` opens Studio only after normal authentication/feature access, selects the slug, and enters presenter mode. A denied/unassigned user sees the server's access error and no webinar content.

```js
history.replaceState({}, '', '/?tool=webinar-studio&webinar=first-home-without-mystery&mode=presenter');
await WebinarStudio.init();
expect(api.listWebinars).toHaveBeenCalled();
expect(api.getWebinar).toHaveBeenCalledWith(12);
expect(WebinarStudio.currentMode()).toBe('presenter');
api.listWebinars.mockRejectedValueOnce({ status: 403 });
await expect(WebinarStudio.init()).resolves.toBeUndefined();
expect(document.body.textContent).not.toContain('Your first home');
```

- [ ] **Step 3: Implement deterministic route build and deep-link handling**

The site script accepts an explicit `--source` absolute directory, copies a hard-coded allow-list, and refuses an output path outside `webinars/first-home-without-mystery`. It writes no data fetched from the private API. Dashboard deep-link parsing accepts only known tool/mode values and a slug matching `^[a-z0-9]+(?:-[a-z0-9]+)*$`; backend authorization remains decisive.

```js
const PUBLIC_ROUTE_ALLOWLIST = Object.freeze([
  'studio-viewer.html',
  'css/studio-viewer.css',
  'js/surface-fit.js',
  'js/studio/runtime-protocol.js',
  'js/studio/composition.js',
  'js/studio/bundle-loader.js',
  'js/studio/slide-frame.js',
  'js/studio/audience-controller.js',
  'js/studio/control-protocol.js',
  'js/studio/presenter-bridge.js',
]);
if (!outputDir.endsWith('/webinars/first-home-without-mystery')) throw new Error('OUTPUT_BOUNDARY');
```

- [ ] **Step 4: Build and verify the complete site tree locally**

```bash
node scripts/build-first-home-studio-route.mjs --source /Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck
node --test webinars/tests/first-home-studio-route.test.mjs
python3 -m http.server 4218 --bind 127.0.0.1
```

Use the browser audit on `/`, `/webinars/`, every existing sibling webinar route, the new viewer, and presenter redirect. Expected: all routes return 200 or their intentional redirect, assets load, and no unrelated site file changes. Stop the server after verification.

- [ ] **Step 5: Commit the two repositories separately**

Public site:

```bash
git add scripts/build-first-home-studio-route.mjs webinars/first-home-without-mystery webinars/tests/first-home-studio-route.test.mjs README.md
git diff --cached --stat
git commit -m "feat(webinars): prepare database-driven first-home route"
```

Dashboard:

```bash
git add js/webinar-studio.js backend/tests/frontend/webinarStudioShell.test.js
git commit -m "feat(webinars): open studio from presenter redirect"
```

These commits prepare deployment only; do not push or deploy in this task.

### Task 7: Add a tested legacy private-data decommission switch

**Files:**
- Modify: `/Users/zacharyzink/MSFG/Webinars/webinar-api/app.js`
- Modify: `/Users/zacharyzink/MSFG/Webinars/webinar-api/server.js`
- Modify: `/Users/zacharyzink/MSFG/Webinars/webinar-api/.env.example`
- Create: `/Users/zacharyzink/MSFG/Webinars/webinar-api/tests/private-data-retirement.test.js`

**Interfaces:**
- Consumes: `LEGACY_PRIVATE_DATA_ENABLED` environment flag and existing `createApp` dependency injection.
- Produces: private note/settings routes return `410 Gone` when disabled; health and separately approved public loan-officer read behavior remain unchanged.

- [ ] **Step 1: Write failing retirement tests**

```js
const app = createApp({ pool, writeKey: 'test', allowedOrigins: ['https://msfgmortgage.com'], legacyPrivateDataEnabled: false });
for (const request of privateNoteAndSettingsRequests) {
  const response = await request(app, request);
  assert.equal(response.status, 410);
  assert.deepEqual(response.body, { error: 'private_webinar_data_moved' });
}
assert.equal((await get(app, '/health')).status, 200);
assert.equal((await get(app, '/loan-officers')).status, 200);
```

Assert no Postgres query occurs for a retired route and the CORS allow-header no longer advertises `x-webinar-key` when disabled.

- [ ] **Step 2: Run the legacy API suite and verify the new test fails**

```bash
npm test
```

Expected: the retirement test fails because the flag is not implemented.

- [ ] **Step 3: Implement an explicit compatibility flag**

`server.js` parses `LEGACY_PRIVATE_DATA_ENABLED` as true only for the exact string `true` and passes it into `createApp`. To preserve current behavior until an approved retirement deployment, `.env.example` documents `LEGACY_PRIVATE_DATA_ENABLED=true`. `app.js` returns 410 before validation/querying for every `/notes` and `/presenter-settings` method when false. When false, CORS allowed headers contain only `Content-Type`.

```js
const legacyPrivateDataEnabled = process.env.LEGACY_PRIVATE_DATA_ENABLED === 'true';

function requireLegacyPrivateData(req, res, next) {
  if (legacyPrivateDataEnabled) return next();
  return res.status(410).json({ error: 'private_webinar_data_moved' });
}

app.use(['/notes', '/presenter-settings'], requireLegacyPrivateData);
```

- [ ] **Step 4: Run tests and a source scan**

```bash
npm test
rg -n "x-webinar-key|WEBINAR_WRITE_KEY" . --glob '!node_modules/**'
```

Expected: tests pass; remaining key references exist only in the gated legacy implementation/tests/config, not in the new public route.

- [ ] **Step 5: Commit the retirement switch**

```bash
git add webinar-api/app.js webinar-api/server.js webinar-api/.env.example webinar-api/tests/private-data-retirement.test.js
git commit -m "feat(webinars): gate legacy private data routes"
```

### Task 8: Write the production runbook and rehearse rollback locally

**Files:**
- Create: `/Users/zacharyzink/MSFG/Webinars/docs/webinar-studio/production-cutover-runbook.md`
- Create: `/Users/zacharyzink/MSFG/Webinars/docs/webinar-studio/production-verification-checklist.md`
- Create: `/Users/zacharyzink/MSFG/Webinars/scripts/verify-webinar-studio-release.sh`

**Interfaces:**
- Consumes: reviewed commit SHAs from all packages, current production Git/AWS states, Dashboard `deploy.sh`, public-site Amplify main branch, migration CLIs, static rollback commit/bundle.
- Produces: exact sequential approval gates, read-only preflights, release verification, rollback decision points, and an automated non-mutating verifier.

- [ ] **Step 1: Implement the non-mutating release verifier**

The script accepts explicit Dashboard API, Dashboard UI, mortgage-site, and asset-CDN base URLs; performs only GET/HEAD; checks health, Cognito redirect behavior, public bundle allow-list, ETag/304, asset MIME/CORS/range/cache headers, current/sibling public routes, presenter redirect, and secret strings in downloaded public files. It exits nonzero on any failure and never accepts a `--fix` or mutation flag.

```bash
case " ${*} " in *" --fix "*|*" --apply "*) echo 'Mutation flags are forbidden' >&2; exit 64;; esac
test "$(curl -fsS -o /dev/null -w '%{http_code}' "$DASHBOARD_API_BASE/health")" = "200"
etag=$(curl -fsSI "$DASHBOARD_API_BASE/api/public/webinars/first-home-without-mystery/live" | awk -F': ' 'tolower($1)=="etag" {gsub("\\r", "", $2); print $2}')
test "$(curl -fsS -o /dev/null -w '%{http_code}' -H "If-None-Match: $etag" "$DASHBOARD_API_BASE/api/public/webinars/first-home-without-mystery/live")" = "304"
```

- [ ] **Step 2: Write exact operational approval sequence**

The runbook separates these gates and requires an explicit yes before each:

1. provision/verify private S3, GuardDuty tagging, CloudFront OAC, IAM, and environment configuration;
2. snapshot/backup Dashboard MySQL and approve migrations 091/092;
3. deploy Dashboard backend from an exact reviewed commit, knowing startup applies additive migrations;
4. verify backend privately with `WEBINAR_STUDIO_ACCESS=admins` and no audience-enabled records;
5. deploy Dashboard frontend from an exact reviewed commit and verify admin-only Studio;
6. run deck/asset importer `--dry-run`, review plan hash, then separately approve `--apply` with that exact hash;
7. run legacy personal-data `--report`, approve mappings, run `--dry-run`, compare counts/hashes, then separately approve `--apply` with that exact plan hash;
8. run full private preview/parity and a public-API check while the old static page still serves the audience URL;
9. enable `audience_enabled` for the production webinar;
10. push the exact public-site commit to the Amplify-connected `main` branch and wait for a successful job;
11. verify homepage, library, all sibling webinars, new viewer, presenter redirect, bridge, assets, settings, notes, revisions, and a test Save Live/restore;
12. deploy the legacy API with `LEGACY_PRIVATE_DATA_ENABLED=false`, remove/rotate `WEBINAR_WRITE_KEY`, and verify 410 responses only after the new private paths pass.

No gate may be inferred from the approval of a previous gate.

The public live-bundle CloudFront behavior is reviewed with minimum TTL 0, default TTL 0, maximum TTL at least 300 seconds, GET/HEAD/OPTIONS only, query strings/cookies excluded from the cache key, and conditional revalidation headers forwarded according to the origin request policy. The response must preserve `max-age=0, must-revalidate, stale-if-error=300`, ETag, `Vary: Origin`, and the exact CORS header. A pre-cutover test warms one version, forces an approved staging-origin 503, and proves the edge serves only the last complete cached bundle for at most 300 seconds.

The runbook also defines CloudWatch Logs metric filters over the backend's structured `event` field: `WebinarPublicDeliveryFailure` for `webinar.public_delivery_failure`, `WebinarAssetScannerFailure` for `webinar.asset_scanner_failure`, and `WebinarAuthorizationDenied` for `webinar.authorization_denied`. Alarm thresholds are respectively 3 events in 5 minutes, 1 event in 5 minutes, and 20 events in 5 minutes, each treating missing data as not breaching. The operator must resolve and review the existing production log-group and notification-topic identifiers before creating them; alarm creation remains part of the separately approved infrastructure gate.

- [ ] **Step 3: Document and rehearse rollback without touching production**

The local rehearsal checks out the exact pre-cutover public-site commit in a temporary directory created by `mktemp -d`, serves it, runs the sibling-route/static-deck audit, then removes only that validated temporary directory. Production rollback is documented as: disable `audience_enabled`, revert or redeploy the exact pre-cutover complete Amplify commit/bundle, verify all routes, keep MySQL/Postgres/S3/audit rows, and re-enable legacy private routes/key only if explicitly approved and required for presenter continuity.

- [ ] **Step 4: Run all local release gates**

```bash
npm --prefix /Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend test
npm --prefix /Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend run lint
node /Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/build.js
npm --prefix /Users/zacharyzink/MSFG/Webinars/first-home-without-mystery/deck test
npm --prefix /Users/zacharyzink/MSFG/Webinars/webinar-api test
node --test /Users/zacharyzink/MSFG/Webinars/Homebuyers-Webinar/Export/msfgmortgage-site-amplify-v1.0/webinars/tests/first-home-studio-route.test.mjs
```

Expected: all local gates pass and the verification checklist records exact test counts and commit SHAs. It states that production operations remain unperformed.

- [ ] **Step 5: Commit cutover documentation and verifier**

```bash
git add docs/webinar-studio/production-cutover-runbook.md docs/webinar-studio/production-verification-checklist.md scripts/verify-webinar-studio-release.sh
git commit -m "docs(webinars): add reversible studio cutover runbook"
```

## Package Exit Gate

Local implementation is complete only when:

- current static source and legacy API source are tracked without generated/secrets content;
- deterministic export/import tooling passes and produces a 15-slide audience-disabled record in disposable infrastructure;
- personal-data migration proves exact mapping, idempotency, timestamp preservation, immutable source rows, and count/hash reconciliation;
- every visual/behavioral parity surface passes or has an individually approved difference;
- the public Amplify route and presenter redirect are complete-bundle tested without deployment;
- the legacy service has a tested but not-yet-activated decommission switch;
- rollback has been rehearsed locally; and
- every production operation remains explicitly pending its own approval.
