# Webinar Studio: Authenticated Presenter, Live Code Editor, and Shared Assets

Date: 2026-09-03

Status: Approved for implementation planning

## Objective

Turn the existing webinar presenter into an authenticated Webinar Studio where an assigned MSFG user can present and edit a webinar slide by slide. Administrators can access every webinar. Public visitors can view the current live presentation but cannot access presenter controls, private notes, user settings, ownership tools, revisions, or source-management screens.

The Studio must provide:

1. one primary owner per webinar, selected from existing active MSFG users;
2. administrator access to every webinar;
3. account-wide presenter shortcuts and preferences backed by Cognito identity;
4. user-specific presenter notes stored by webinar and stable slide ID;
5. a master HTML wrapper and master CSS shared by every slide in a webinar;
6. one editable slide block per slide, with HTML, CSS, and JavaScript;
7. add, duplicate, reorder, and remove slide operations;
8. immediate live saves without a separate publish step;
9. complete, restorable revision history; and
10. a shared asset library for images, SVGs, fonts, video, and audio.

## Approved Product Decisions

- Reuse the existing `dashboard.msfgco.com` Cognito login and user directory. Do not create another webinar login or user store.
- Give each webinar exactly one primary owner. Users with the active `admin` role can access every webinar.
- Store a user's presenter settings once and apply them across every webinar.
- Keep presenter notes private to the authenticated user and keyed to the webinar and slide.
- Put the private presenter and editor inside `dashboard.msfgco.com`.
- Keep the audience presentation on `msfgmortgage.com`.
- Make every successful **Save Live** immediately authoritative for new public page loads. Do not add a draft/publish workflow.
- Keep audience availability separate from content saving. Administrators can enable or disable the public read endpoint for staged migration and rollback; when enabled, every successful **Save Live** is still immediately live.
- Keep already-open audience sessions pinned to the version they loaded until refreshed.
- Run custom slide JavaScript inside a slide-only sandbox.
- Use Master HTML as the shared wrapper and Master CSS as the shared style layer for every slide.
- Represent each slide as one editor box with HTML, CSS, and JavaScript tabs.
- Make uploaded assets reusable across all webinars.
- Support all approved presentation media in the first release: raster images, sanitized SVG, fonts, video, and audio.

## Existing Baseline and Constraints

The live webinar is currently a static, data-driven deck. Slide content, styling, presenter controls, notes, and shortcut settings are split across HTML, CSS, and JavaScript files. The presenter and audience windows currently communicate through a same-origin browser channel.

The standalone webinar API currently stores presenter notes and shortcut settings in Postgres. It identifies presenters with loan-officer IDs and protects writes with a shared `x-webinar-key` sent by the browser. That credential model is not sufficient for a private editor and must not be extended to ownership, code, assets, or revisions.

The Dashboard already provides:

- Cognito JWT verification;
- mapping from Cognito identity to the canonical MySQL `users` row;
- validated active-role handling;
- administrator and owner-or-admin authorization helpers;
- an authenticated active-user directory; and
- S3 upload and retrieval patterns.

The new feature is additive. Existing Dashboard modules, the existing public webinar, and the old webinar API remain operational until their replacements pass migration and production verification.

## Approaches Considered

### Selected: Dashboard editor with a database-driven public viewer

The authenticated Dashboard owns editing, presenting, access control, user settings, notes, revisions, and asset management. A small static audience shell on `msfgmortgage.com` requests only the current public webinar bundle from a read-only endpoint. Routine slide saves do not trigger an Amplify deployment.

This provides the clearest security boundary, reuses Cognito and the canonical user directory, supports immediate saves, and avoids turning every edit into a site deployment.

### Rejected: generate and deploy static files after every save

This preserves the current static source format but makes editing dependent on a deployment pipeline. It is slower, more failure-prone during active design, and does not meet the goal of immediate updates.

### Rejected: keep the authenticated editor on the public mortgage domain

This changes less of the current presenter but spreads Cognito session handling into the public site and weakens the boundary between public viewing and private authoring.

## System Boundaries

### Dashboard repository

`/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com` owns:

- the authenticated Webinar Studio UI;
- Cognito login and user resolution;
- owner/admin authorization;
- private webinar CRUD APIs;
- presenter settings and notes APIs;
- revision creation and restoration;
- asset upload, catalog, and archive APIs;
- the public live-bundle read API; and
- the new MySQL schema.

### Webinars repository and public host

`/Users/zacharyzink/MSFG/Webinars` owns:

- the static audience shell deployed under `msfgmortgage.com/webinars/`;
- the sandboxed slide runtime;
- audience navigation, overlays, annotations, calculations, and responsive fitting;
- the authenticated-presenter message bridge; and
- migration and browser-regression fixtures for existing decks.

### Existing standalone webinar API

`/Users/zacharyzink/MSFG/Webinars/webinar-api` remains unchanged while the new Dashboard-backed paths are built. Its existing Postgres note and settings data is a migration source. After migration and cutover, its browser write key and private-data endpoints are retired. Source rows are retained for rollback until production verification and a separately approved cleanup.

### Data authority

The Dashboard MySQL `users` table remains the only local authority for internal users. New webinar tables reference `users.id`; they do not copy names, emails, roles, Cognito groups, or credentials into another user table. Cognito proves identity, the Dashboard maps that identity to `users.id`, and all per-user webinar data uses that mapped ID.

## Authentication and Authorization

Every private Webinar Studio request uses the existing Dashboard JWT middleware and requires a mapped, active, non-external database user.

For a webinar record:

- `admin` can view, edit, present, restore, assign ownership, and archive;
- the primary owner can view, edit, present, restore, upload assets, and use shared assets;
- another authenticated MSFG user receives `403`;
- an unmapped, inactive, external, expired, or unauthenticated identity receives `401` or `403` as appropriate.

The backend enforces access on every request. The interface may hide unavailable controls, but hidden controls are never the authorization boundary.

Only an administrator can assign or replace a webinar's primary owner. The owner selector uses the existing authenticated active-user directory. If an owner is deactivated, the webinar remains available to administrators until an administrator assigns a new active owner.

The public live-bundle endpoint requires no login because the presentation is public. Its response is a strict allow-list and never includes user IDs, owner details, notes, settings, revision history, audit records, asset storage keys, editor metadata, or Cognito data.

## Webinar Studio Experience

The private Studio keeps the existing presenter experience and adds an editor inside Settings. Settings contains five areas.

### Presenter

- Configure shortcut keys with sensible defaults.
- Configure other presenter preferences introduced by the existing presenter.
- Save preferences to the authenticated user's account, once for all webinars.
- Suppress shortcut handling while focus is inside any code, note, form, or editable field.

### Users & Access

- Display the primary owner.
- Allow administrators to search active MSFG users and replace the owner.
- Explain that administrators retain access automatically.
- Do not create webinar-only users or invitation flows.

### Code

The Code area starts with a Global Code card.

#### Master HTML

- Supplies the shared document wrapper for every slide.
- Contains shared font and stylesheet links and reusable logo, header, and footer markup.
- Contains exactly one `{{SLIDE_CONTENT}}` mounting token.
- Rejects `<script>` elements and inline event-handler attributes. Executable behavior belongs in the JavaScript editor.
- Allows HTTPS stylesheet and font references permitted by the slide content-security policy. External script references remain forbidden.

#### Master CSS

- Supplies webinar-wide colors, typography, layout helpers, shared components, and reusable animation classes.
- Loads before the selected slide's CSS so slide-specific CSS can intentionally override shared rules.

#### Slide boxes

Each slide is one expandable editor box containing:

- a stable internal ID that never changes when the slide moves;
- an editable title;
- a unique URL anchor;
- an editable target duration and shared speaker-notes field;
- a thumbnail or live preview;
- one code editor with HTML, CSS, and JavaScript tabs;
- **Save Live**, duplicate, reorder, and delete controls; and
- visible validation, unsaved-change, live-version, and conflict states.

**Add slide** creates a new stable slide ID and appends a blank slide box. Reordering changes only the position value. Duplicate creates a new ID and copies the selected slide's code and title with a unique anchor. Delete removes the slide from the current live deck only after confirmation; the prior version remains recoverable through History.

The preview refreshes locally while typing. It uses the same sandbox renderer and content-security policy as the public viewer. Typing does not change the public webinar. **Save Live** is the only operation that updates the live version.

### Assets

The Assets area provides shared upload, search, filtering, preview, usage, archive, and insertion controls as specified below.

### History

- List every complete live revision by version, change summary, editor, and timestamp without loading source into the list response.
- Preview metadata before restoring.
- Restore a selected revision as a new live version after confirmation.
- Keep the prior and restored revision rows append-only.

## Rendering and Slide Sandbox

The audience shell owns navigation, presentation state, annotations, timers, presenter synchronization, and the fixed control state for supported overlays/calculators. It never inserts webinar-authored markup. Webinar-specific overlay and calculator markup/behavior render inside the same sandboxed slide iframe as the rest of that slide, and the shell only routes their validated fixed state messages.

Each active slide is composed in this order:

1. the validated Master HTML wrapper;
2. the required `{{SLIDE_CONTENT}}` replacement with the slide HTML;
3. Master CSS;
4. slide CSS; and
5. slide JavaScript wrapped by the controlled slide runtime.

The composed document runs in a sandboxed iframe with scripts enabled but without same-origin, top-navigation, popup, download, form-submission, pointer-lock, or storage privileges. The sandbox content-security policy blocks network connections from JavaScript, allows HTTPS stylesheet and font resources, and limits webinar images and media to the MSFG asset CDN and explicitly required inline or generated sources. External scripts remain blocked. Asset and external-resource policy must be identical in editor preview and public rendering.

The slide runtime exposes a narrow event surface for existing presenter behavior. It can deliver slide-enter, slide-exit, animation-back, animation-forward, animation-play, animation-pause, supported-overlay-state, and supported-calculator-state events to the active slide. Overlay and calculator identifiers are bounded scalar action IDs validated against the active slide; they are not selectors, URLs, or executable strings. The trusted audience shell owns synchronization while slide code renders the corresponding in-slide interface. Slide code can react inside its own document but cannot alter presenter controls, read authentication data, request Dashboard APIs, or send arbitrary commands to the audience shell.

Runtime errors are captured and shown in the private editor. Public rendering records a non-sensitive error code and continues to provide navigation or a safe slide-error state; it never displays stack traces or source data to the audience.

## Cross-Domain Presenter Control

Moving the presenter to `dashboard.msfgco.com` means the current same-origin `BroadcastChannel` cannot be the cross-domain control mechanism.

In the first release, the authenticated Dashboard presenter opens the audience window and retains its browser `WindowProxy`. The two windows perform a versioned `postMessage` handshake using:

- exact allowed origins for Dashboard and mortgage-site production and approved local development origins;
- exact source-window matching;
- a cryptographically random per-launch session nonce; and
- a fixed schema of recognized message types and validated payloads.

Allowed control messages cover the existing presenter contract: slide navigation, animation back/forward/play/pause, annotation state, supported overlay or calculator actions, and audience-state acknowledgements. Arbitrary code, HTML, URLs, selectors, and executable strings are never accepted as control messages.

If the audience window closes, reloads without completing the handshake, or stops acknowledging commands, the presenter shows a disconnected state and offers **Reconnect audience**. The presenter itself remains usable. Multi-device remote presenting is not part of the first release.

The old public `presenter.html` route contains no presenter implementation. It redirects to the authenticated Dashboard Webinar Studio location. Authentication and authorization still occur in the Dashboard after the redirect.

## Data Model

The schema is added through a new, additive Dashboard migration after reconfirming the next available migration number. Previously applied migrations are never edited.

### `webinar_presentations`

- `id`
- `slug`, unique and stable
- `title`
- `primary_owner_user_id`, foreign key to `users.id`
- `master_html`
- `master_css`
- `live_version`
- `audience_enabled`, administrator-controlled and false by default
- `created_by_user_id`
- `updated_by_user_id`
- `created_at`
- `updated_at`
- `archived_at`, nullable

### `webinar_slides`

- `id`, stable UUID
- `webinar_id`
- `position`, nullable only while the slide is archived
- `anchor`, unique within the webinar
- `title`
- `target_seconds`
- `speaker_notes`, shared presenter guidance distinct from each user's private notes
- `html`
- `css`
- `javascript`
- `created_by_user_id`
- `updated_by_user_id`
- `created_at`
- `updated_at`
- `archived_at`, nullable

The database enforces unique `(webinar_id, anchor)` and `(webinar_id, position)` values. Deleting a live slide archives its row and sets its position to `NULL`, preserving its stable ID and notes for revision restoration. Restoring a revision reactivates the required rows and applies the snapshot order in one transaction.

### `webinar_revisions`

- `id`
- `webinar_id`
- `version`, unique and increasing within the webinar
- `snapshot`, a complete JSON snapshot of the master fields and ordered slide records
- `change_type`
- `change_summary`
- `created_by_user_id`
- `created_at`

A complete snapshot is stored on every successful webinar-content mutation, including Master changes and slide add, edit, duplicate, reorder, delete, and restore. Restoring a revision creates a new version; history is append-only. The first release does not automatically prune revision history.

### `webinar_presenter_settings`

- `user_id`, primary key and foreign key to `users.id`
- `shortcuts`, JSON
- `preferences`, JSON
- `created_at`
- `updated_at`

### `webinar_presenter_notes`

- `id`
- `user_id`
- `webinar_id`
- `slide_id`, foreign key to the stable slide UUID
- `body`
- `source_system` and `source_record_id`, nullable migration provenance used only for idempotent legacy import
- `created_at`
- `updated_at`

Multiple notes per user and slide remain supported.
Normal Studio-created notes leave migration provenance null. The database enforces uniqueness for non-null legacy source identities so rerunning an approved migration cannot duplicate a source note.

### `webinar_assets`

- `id`, stable asset-family UUID and primary key
- `display_name`
- `description`, nullable
- `created_by_user_id`
- `created_at`
- `archived_at`, nullable

### `webinar_asset_versions`

- `id`, immutable asset-version UUID and primary key
- `asset_id`, foreign key to `webinar_assets.id`
- `version_number`
- `media_type`
- `mime_type`
- `byte_size`
- `sha256`
- `s3_key`
- `width`, `height`, and `duration_ms` where applicable
- `status`: `processing`, `available`, `rejected`, or `archived`
- `uploaded_by_user_id`
- `created_at`
- `archived_at`, nullable

An `(asset_id, version_number)` pair is unique. Storage keys and public delivery paths are immutable per version.

### `webinar_asset_references`

- `webinar_id`
- `slide_id`, nullable for Master HTML or Master CSS
- `asset_version_id`
- `surface`: `master_html`, `master_css`, `slide_html`, `slide_css`, or `slide_javascript`
- `created_at`

Live references are rebuilt transactionally from validated asset tokens whenever affected code is saved. They support current usage display and live archive protection.

### `webinar_revision_asset_references`

- `revision_id`, foreign key to the append-only revision
- `asset_version_id`
- `created_at`

Revision references are inserted once with each complete revision and never rewritten. Asset usage and archive protection check both live and historical references so an older revision cannot lose an immutable dependency and every revision remains restorable with its exact asset versions.

### `webinar_audit_events`

- `id`
- `webinar_id`, nullable for library-wide asset events
- `actor_user_id`
- `event_type`
- `target_type`
- `target_id`
- `metadata`, restricted JSON without source code, credentials, or note bodies
- `created_at`

## Private API Surface

All routes below use the existing Dashboard authentication and non-external-user middleware. Webinar-specific write routes additionally enforce owner-or-admin access.

- `GET /api/webinars` — assigned webinars for a user; all webinars for administrators
- `GET /api/webinars/:id` — private Studio document
- `POST /api/webinars` — administrator creates a webinar and assigns an owner
- `DELETE /api/webinars/:id` — administrator soft-archives a webinar and disables audience access without deleting history
- `PUT /api/webinars/:id/master` — validate and save Master HTML/CSS live
- `POST /api/webinars/:id/slides` — add or duplicate a slide live
- `PUT /api/webinars/:id/slides/:slideId` — validate and save one slide live
- `PUT /api/webinars/:id/slides/order` — save a complete validated order live
- `DELETE /api/webinars/:id/slides/:slideId` — delete one slide live after confirmation
- `GET /api/webinars/:id/history` — list revision metadata
- `POST /api/webinars/:id/history/:revisionId/restore` — restore as a new live version
- `PUT /api/webinars/:id/owner` — administrator-only ownership change
- `PUT /api/webinars/:id/audience-access` — administrator-only public-read enable or disable; this is not a content publish action
- `GET /api/webinars/:id/notes` — current user's notes for the webinar
- `POST /api/webinars/:id/slides/:slideId/notes` — add a current-user note
- `PUT /api/webinars/:id/notes/:noteId` — update a current-user note
- `DELETE /api/webinars/:id/notes/:noteId` — delete a current-user note
- `GET /api/webinar-presenter-settings/me`
- `PUT /api/webinar-presenter-settings/me`
- `GET /api/webinar-assets` — shared available asset catalog
- `POST /api/webinar-assets/upload-intents` — authenticated, constrained upload intent
- `POST /api/webinar-assets/upload-intents/:id/confirm` — server validation and catalog entry
- `POST /api/webinar-assets/:assetId/versions` — begin a new immutable version upload
- `PATCH /api/webinar-assets/:assetId` — update allowed family-level labels or archive an unused family
- `PATCH /api/webinar-assets/:assetId/versions/:versionId` — archive an allowed unreferenced version
- `GET /api/webinar-assets/:versionId/usage`

Webinar content mutations and revision restores carry an expected webinar version. A stale expected version receives `409 Conflict` with current version metadata. It never silently overwrites newer work. Creation, owner/audience administration, personal settings/notes, and asset-catalog writes use their route-specific validation and authorization contracts rather than pretending to advance the webinar content version.

## Public API Surface

`GET /api/public/webinars/:slug/live` returns only:

- public webinar ID, slug, title, and live version;
- validated Master HTML and Master CSS;
- ordered public slide IDs, anchors, titles, HTML, CSS, and JavaScript; and
- resolved immutable asset URLs required by that version; and
- a public resource policy containing only the exact asset-CDN, HTTPS stylesheet, and HTTPS font origins allowed by validation and sandbox CSP.

The public endpoint returns `404` when the webinar is archived or `audience_enabled` is false. Toggling audience access does not create or select a content revision and does not alter **Save Live** semantics.

`POST /api/public/webinars/:slug/runtime-events` accepts only an allow-listed runtime error code, live-version integer, and stable slide UUID from the allowed mortgage-site/local-development origins. It is separately rate-limited, rejects extra/source-bearing fields, writes only a structured non-sensitive operational event, and never mutates webinar content.

The response supports `ETag` revalidation. Normal responses require revalidation so a new page load observes the latest successful save. Edge configuration may serve a stale last-known-good response only when the origin is unavailable. The audience shell loads the bundle once and pins that version for its session.

The public endpoint permits cross-origin reads only from the production mortgage site and explicitly configured local-development origins. Private Dashboard endpoints use the Dashboard's existing authenticated-origin policy.

Public presentation source is inherently inspectable by a browser and is not treated as confidential. Private notes, settings, ownership, audit, storage, and revision information remain excluded.

Shared speaker notes and target timing are presenter-only fields in the private Studio document and complete revision snapshot. They are excluded from the public bundle. User-specific **My Notes** remain separate rows in `webinar_presenter_notes`.

## Save Live, Validation, and Revisions

Typing affects only the private preview. The Studio attempts to compose and boot the candidate in its local sandbox before enabling **Save Live**. That preview check catches common startup failures but is never treated as a server-side security boundary.

A live save proceeds in this order:

1. authenticate and map the user;
2. authorize owner-or-admin access;
3. compare the supplied expected version with the current live version;
4. enforce code-size and request-size limits;
5. parse and validate Master HTML, slide HTML, CSS, and JavaScript without executing the JavaScript;
6. reject syntax, structure, forbidden-element, forbidden-attribute, content-policy, and asset-token errors;
7. verify every asset token exists and is available;
8. create the complete revision snapshot, update the normalized live records, update asset references, archive or reactivate slide rows as needed, and increment the live version in one transaction; and
9. return the new live version and validation result for the editor to render through the normal sandbox.

Initial code limits are:

- Master HTML: 250 KB
- Master CSS: 500 KB
- each slide's HTML: 250 KB
- each slide's CSS: 250 KB
- each slide's JavaScript: 500 KB
- complete private save request: 2 MB

The API never executes slide JavaScript. Validation cannot prove that arbitrary custom behavior is logically correct, and a structurally valid save can still contain a runtime or design bug. History is therefore always available, and restoring the previous complete version is a single explicit action.

If an API, database, asset, or server-validation step fails, the transaction does not advance the live version. The editor retains the unsaved text in memory and clearly identifies the failing surface. The current public version remains unchanged.

## Shared Asset Library

### Storage and delivery

The database stores asset metadata and references, not media bytes. Files are uploaded to a dedicated, environment-configured S3 bucket or prefix through short-lived presigned requests. The bucket remains private and does not allow listing. Publicly used asset versions are delivered through immutable CloudFront paths protected by origin access control.

The asset CDN supplies correct MIME types, range requests for audio/video, cross-origin headers for fonts, and long-lived immutable caching. S3 keys are never returned by the public webinar API.

### Supported types and initial limits

- PNG, JPEG, WebP, and GIF: 20 MB each
- sanitized SVG: 5 MB each
- WOFF and WOFF2: 10 MB each
- MP3 and WAV: 100 MB each
- MP4 and WebM: 500 MB each

The server verifies magic bytes, container/type consistency, declared MIME type, file size, and SHA-256. SVG is sanitized before it becomes available. Every upload passes malware scanning. HTML, JavaScript, executables, archives, PDFs, office documents, and disguised or unsupported formats are rejected.

### Catalog behavior

The shared library includes:

- thumbnail or media preview;
- name and description;
- search and media-type filters;
- uploader, size, version, and upload time;
- usage by webinar and code surface;
- **Copy reference**, **Copy HTML/CSS snippet**, and **Insert into editor**;
- upload progress, processing, available, rejected, and archived states; and
- upload-new-version behavior.

Code references assets with a version-specific token such as `{{ASSET:<version-id>}}`. The save validator resolves tokens to immutable CDN URLs in the public bundle. Using tokens rather than raw storage paths allows exact dependency tracking and environment-safe delivery.

Uploading a replacement creates a new version and does not rewrite existing webinar code. Owners can upload and use shared assets. Owners can archive an unreferenced asset version they uploaded. Administrators can archive any unreferenced version. Referenced versions cannot be archived or deleted until every live reference is removed. Permanent binary deletion is an administrator-only maintenance operation outside the first-release Studio interface.

Checksum matching avoids duplicate byte storage while allowing separate display labels when useful.

## Implementation Decomposition

This is one cohesive product design, but it is too large for a single undifferentiated implementation pass. The implementation plan must divide it into five approval-gated work packages:

1. **Identity and data foundation:** additive MySQL schema, owner/admin authorization, private API contracts, Cognito-to-user mapping, notes, settings, revisions, and audit events.
2. **Shared assets:** presigned staging uploads, validation and scanning, immutable asset families and versions, CloudFront delivery, catalog UI, tokens, and reference protection.
3. **Renderer and public bundle:** code composition, validation, sandbox runtime, public allow-listed bundle, asset resolution, and last-known-good delivery.
4. **Private Studio and presenter bridge:** Presenter, Users & Access, Code, and Assets interfaces; one-box-per-slide editing; history; and cross-domain presenter/audience control.
5. **Migration and cutover:** current-deck import, note/settings mapping, visual and behavioral parity, owner enablement, public-route switch, old presenter redirect, credential retirement, and rollback rehearsal.

Each package receives its own tests and review before the next package changes live behavior. Database deployment, asset infrastructure, data migration, public cutover, and old-credential retirement remain separately approved operational actions even when the implementation plan describes them.

## Notes and Settings Migration

Existing presenter settings and notes are migrated from the standalone Postgres service into Dashboard MySQL.

The migration must:

1. map each existing loan-officer identifier to exactly one active Dashboard `users.id`;
2. emit a review report for missing or ambiguous mappings;
3. import only confirmed mappings;
4. preserve timestamps when available;
5. map notes to the imported webinar and stable slide UUIDs;
6. preserve the Postgres source rows unchanged; and
7. compare source and target counts before any frontend cutover.

Unmapped records remain in the source and are reported; they are not assigned by email guessing or silently dropped.

After the authenticated frontend has used the new paths successfully in production, remove the browser's `x-webinar-key`, disable the old private write routes, and rotate or remove the server credential. Public loan-officer data remains a separate decision and is not changed by this feature.

## Current Deck Migration

The first migration target is **Your first home, without the mystery.** The import must preserve:

- all fifteen slides and their stable anchors;
- visual layout and responsive fit;
- presenter notes and speaker information;
- animation stepping and play/pause behavior;
- navigation and presenter timing;
- calculator, overlays, popouts, graphics, annotations, and fullscreen behavior;
- accessible labels and keyboard handling;
- all current brand assets; and
- existing public URL behavior.

Shared structure moves into Master HTML and Master CSS. Each slide's unique rendered content and behavior moves into its own HTML/CSS/JavaScript block. Existing local brand files are imported into the shared asset library and code is updated to use version-specific asset tokens.

Until cutover, repository files remain the live source of truth. After cutover, the database live version becomes authoritative for the public presentation. The repository retains the pre-cutover static deck and export artifacts as rollback material; it must not silently continue as a competing editable live source.

## Failure Handling

- Structurally invalid code: reject the save, identify the editor surface and location, retain unsaved text, keep the live version unchanged.
- Local preview startup timeout: keep **Save Live** disabled in the normal Studio flow, retain unsaved text, and preserve the live version.
- Stale edit: return `409`, show who changed the webinar and when, and require reload or explicit reconciliation.
- Database failure: roll back the whole save and show a retryable error.
- Asset upload or scan failure: keep the asset unavailable and show the reason without exposing infrastructure details.
- Missing or archived asset token: reject the webinar save.
- Public API origin failure: serve a cached last-known-good bundle when available; never serve a partial database state.
- Audience bridge failure: show disconnected presenter state and permit reconnection; do not fall back to accepting messages from an untrusted origin.
- Deactivated owner: deny owner access and retain administrator access for reassignment.

## Security Requirements

- Never place Cognito tokens, write keys, database credentials, S3 credentials, or private storage paths in public HTML, public bundles, slide code, logs, or asset metadata returned to the audience.
- Validate active role against Cognito groups through the existing Dashboard logic; do not trust a client-supplied role by itself.
- Authorize every object by resolved database user and webinar ownership.
- Use parameterized SQL and transactional writes.
- Apply request-rate limits to editor saves, notes, settings, history restores, and asset upload intents.
- Apply content limits before parsing or composing code.
- Sanitize SVG and Master/slide HTML according to the approved separation of HTML and JavaScript.
- Use a sandbox without `allow-same-origin` and a restrictive content-security policy.
- Use exact origin and source checks for every cross-window message.
- Never evaluate code in the Dashboard document, API process, or audience-shell document.
- Keep audit metadata free of code bodies, note bodies, tokens, and credentials.
- Use immutable asset paths and private object storage behind CloudFront origin access control.

## Observability and Audit

The backend records structured, non-sensitive events for:

- webinar creation, owner changes, and archival;
- successful live saves and their revision numbers;
- rejected saves by category, without source code;
- revision restores;
- asset upload, rejection, versioning, and archival;
- authorization denials; and
- public bundle failures and stale-fallback use.

Metrics distinguish validation failures, conflicts, authorization failures, database failures, asset-processing failures, sandbox startup failures, and public delivery failures. Alerts target repeated public delivery failure, asset scanner failure, and unusual authorization-denial volume.

## Rollout and Rollback

1. Reconfirm both repositories' current branches, dirty files, database ownership, next migration number, deployment workflows, and production configuration.
2. Add new MySQL tables and authenticated APIs without routing any live user to them.
3. Add the private Studio behind an administrator-only feature flag.
4. Add asset storage, scanning, immutable delivery, and the shared catalog.
5. Import the current deck, assets, notes, and settings into a non-public record.
6. Run automated and human visual comparisons against the existing static deck.
7. Assign the primary owner and enable Studio access for that owner and administrators.
8. Exercise live saves and restores against a non-production public route.
9. Switch the existing public URL to the database-driven viewer while retaining the static deck and complete hosting bundle for rollback.
10. Verify the live public route, private authorization, presenter/audience bridge, assets, notes, settings, revisions, and sibling webinar routes.
11. Redirect the old public presenter route to the Dashboard.
12. Disable the old private write paths and browser key only after the new production paths are verified.

Rollback restores the previous complete Amplify bundle and routes the public webinar back to the static deck. It does not delete new MySQL rows, Postgres source rows, S3 asset versions, or audit events. Database cleanup, asset deletion, and old-service removal require separate approval.

## Verification

### Authentication and authorization

- An active primary owner can open, present, edit, save, view history, restore, manage their notes/settings, upload assets, and use shared assets.
- An administrator can perform those operations on every webinar and can change ownership.
- Another internal user, external user, deactivated user, unmapped Cognito identity, expired token, and anonymous visitor cannot access private routes.
- Direct API calls enforce the same rules as the UI.

### Public-data boundary

- Public responses contain only the allow-listed live bundle.
- Public responses and deployed source contain no private notes, user preferences, owner details, audit data, write credentials, Cognito tokens, or S3 keys.
- The old public presenter route contains no presenter application.

### Editing and revisions

- Master HTML requires exactly one slide-content token and rejects executable HTML.
- Preview and public render use the same composition order, sandbox, and policy.
- Valid Master and slide saves become visible on a new public load without a deployment.
- Saves rejected by server syntax, policy, structure, asset, or version validation never advance the live version.
- Add, duplicate, reorder, and delete preserve stable IDs and correct note associations.
- Simultaneous stale saves return a conflict rather than overwriting.
- Restoring every sampled prior revision reproduces its complete ordered deck and asset versions.

### Sandbox and bridge

- Slide code cannot read parent DOM, Dashboard data, Cognito data, cookies, local storage, session storage, or arbitrary network endpoints.
- Slide code cannot navigate the top window, open popups, submit forms, or download files.
- Allowed animation events continue to work.
- Messages from the wrong origin, wrong source window, wrong nonce, unknown type, or invalid payload are ignored and recorded safely.
- Navigation, animations, annotations, overlays, calculators, and audience acknowledgements remain synchronized in the launched two-window presentation flow.

### Assets

- Every approved type succeeds within its size limit and renders through the CDN with correct MIME and cross-origin behavior.
- Oversized, mislabeled, malformed, malicious, executable, and unsupported files are rejected.
- Sanitized SVG cannot execute code.
- Video and audio range playback works.
- Existing references do not change when a new asset version is uploaded.
- Referenced assets cannot be archived or removed.
- Restored revisions resolve their exact historical asset versions.

### Regression and presentation quality

- Preserve the existing Node contract suites and browser audit matrix.
- Add API tests for every permission, validation, conflict, transaction, revision, migration, and public-response rule.
- Add browser tests for Studio editing, one-box-per-slide behavior, responsive layout, owner assignment, settings, notes, history, assets, and error states.
- Run full desktop and mobile visual comparisons across all migrated slides, popouts, calculators, and presenter surfaces.
- Require zero unexpected console errors, failed network requests, clipping, or internal scrollbars at supported viewports.
- Verify all existing sibling webinar and homepage routes after public deployment.

## Acceptance Criteria

The feature is ready for production only when:

1. the current public webinar remains visually and behaviorally equivalent after migration;
2. only the primary owner and administrators can access its private Studio;
3. Cognito identity correctly retrieves account-wide shortcuts and user-specific slide notes from any supported device;
4. a valid **Save Live** is visible on a fresh public load without an Amplify deployment;
5. a structurally invalid, policy-invalid, asset-invalid, or stale save cannot advance or overwrite the live webinar;
6. every live version can be restored with its exact slide order and asset versions;
7. custom slide code cannot escape its sandbox or access authentication and Dashboard data;
8. shared assets support all approved formats and cannot be unexpectedly changed or deleted while referenced;
9. the old public presenter implementation is removed or redirected; and
10. rollback to the complete static deployment has been rehearsed and documented.

## Non-goals

- Multiple co-owners or non-admin collaborators
- Webinar-only user accounts or invitations
- A draft/review/publish workflow
- Automatic public changes on every keystroke
- Live mutation of an already-open audience session
- Multi-device or internet-relayed remote presenting
- A general-purpose website builder outside webinar slides
- Server-side execution of slide JavaScript
- Arbitrary executable, document, archive, or office-file uploads
- Permanent asset deletion from the first-release Studio interface
- Deleting the old Postgres data or static rollback deck as part of the initial cutover
- Changing mortgage, compliance, or educational content during the platform migration

## Delivery Boundary

This document defines architecture only. Implementation begins only after the user reviews and approves this written specification and a separate implementation plan is prepared and approved.

Implementation will span the Dashboard and Webinars repositories. Each repository must be re-baselined before work begins, and unrelated dirty or concurrent changes must remain untouched. Database migrations are additive and immutable. Production deployment, data migration, credential retirement, and destructive cleanup remain separate, explicit approval gates.
