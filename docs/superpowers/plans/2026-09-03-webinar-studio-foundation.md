# Webinar Studio Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the authenticated Webinar Studio data model and private APIs for owner/admin access, live versioned edits, revision restore, account-wide presenter settings, user-specific notes, audience availability, and non-sensitive audit events.

**Architecture:** The Dashboard backend remains the identity and data authority. Thin Express routes call focused validation, authorization, repository, mutation, notes, settings, and audit services; every content mutation locks one webinar row and writes normalized live state plus a complete revision snapshot in one MySQL transaction. This package is additive and exposes no new Dashboard navigation or public viewer.

**Tech Stack:** Node.js CommonJS, Express 4, MySQL 8 through `mysql2`, Cognito-backed Dashboard middleware, Zod 4, `htmlparser2`, PostCSS 8, Acorn 8, Vitest 4

**Spec:** `/Users/zacharyzink/MSFG/Webinars/docs/superpowers/specs/2026-09-03-webinar-studio-design.md`

## Global Constraints

- Reuse the existing `dashboard.msfgco.com` Cognito login and canonical MySQL `users` rows; do not create a webinar user table or accept a user ID from the browser for current-user settings and notes.
- Exactly one primary owner is assigned to each webinar; an active Cognito-backed `admin` can access every webinar.
- An external, inactive, unmapped, expired, unauthenticated, or unassigned user must not read private Studio data.
- Every successful **Save Live** becomes the new authoritative version for fresh public loads; typing alone never writes live data.
- A stale `expectedVersion` returns `409 Conflict` and never overwrites a newer version.
- Master HTML is limited to 250 KB, Master CSS to 500 KB, slide HTML and CSS to 250 KB each, slide JavaScript to 500 KB, and a complete private save request to 2 MB.
- Shared speaker notes are limited to 100 KB per slide and target duration is an integer from 0 through 7,200 seconds.
- Master HTML contains exactly one `{{SLIDE_CONTENT}}`, no scripts, and no inline event handlers.
- The API parses and validates slide JavaScript but never executes it.
- Complete revision history is append-only; restore creates a new revision.
- Deleting a live slide archives it and sets `position` to `NULL`; it does not delete the stable UUID or associated notes.
- `audience_enabled` is administrator-controlled, false by default, and separate from content revision/publish semantics.
- Audit metadata must never contain code bodies, note bodies, credentials, tokens, or storage keys.
- Database changes are additive. Never edit an applied migration.
- Re-baseline both repositories before execution and preserve unrelated dirty or concurrent work.
- Do not run a production migration, deploy a backend, migrate user data, cut over a public route, or retire a credential without a separate explicit approval.
- Implement test-first and commit only the files listed by each task.

---

## Package Boundary and File Map

Implementation repository: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com`.

- `backend/db/migrations/091_webinar_studio_foundation.sql` — presentation, slide, revision, settings, notes, and audit tables.
- `backend/services/webinars/contentPolicy.js` — size, HTML structure, CSS syntax, JavaScript syntax, and anchor validation.
- `backend/services/webinars/authorization.js` — owner/admin predicates and authorization errors.
- `backend/services/webinars/repository.js` — parameterized reads and normalized result mapping.
- `backend/services/webinars/revisions.js` — complete snapshot creation and snapshot validation.
- `backend/services/webinars/mutations.js` — transactional create/save/add/duplicate/reorder/archive/restore/owner/audience operations.
- `backend/services/webinars/notes.js` — current-user note CRUD.
- `backend/services/webinars/settings.js` — current-user account-wide settings get/upsert.
- `backend/services/webinars/audit.js` — allow-listed, non-sensitive audit records.
- `backend/services/webinars/observability.js` — fixed structured operational event names and safe fields.
- `backend/validation/schemas/webinars.js` — Zod request schemas and exact input limits.
- `backend/routes/webinars.js` — authenticated webinar, slide, revision, ownership, audience-access, and note routes.
- `backend/routes/webinarPresenterSettings.js` — authenticated current-user settings routes outside the `/:id` namespace.
- `backend/server.js` — mounts the two private routers after Cognito and non-external middleware.
- `backend/package.json`, `backend/package-lock.json` — parser dependencies.
- Tests mirror each service under `backend/tests/services/webinars/`, routes under `backend/tests/routes/`, validation under `backend/tests/validation/`, and migration structure under `backend/tests/db/`.

The executor must start with these read-only checks from the Dashboard repository:

```bash
git status --short
git branch --show-current
test ! -e backend/db/migrations/091_webinar_studio_foundation.sql
npm --prefix backend test
```

Expected: the baseline is recorded, the migration path is unused, and the existing Vitest suite passes. If the path exists or overlapping files changed since this plan was written, stop before editing and re-baseline the plan; do not renumber or merge migration content silently.

### Task 1: Add the additive Webinar Studio schema

**Files:**
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/db/migrations/091_webinar_studio_foundation.sql`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/tests/db/webinarStudioFoundationMigration.test.js`

**Interfaces:**
- Consumes: existing `users(id)` table and lexicographically ordered SQL migration runner.
- Produces: `webinar_presentations`, `webinar_slides`, `webinar_revisions`, `webinar_presenter_settings`, `webinar_presenter_notes`, and `webinar_audit_events` with the columns and constraints consumed by later tasks.

- [ ] **Step 1: Write the failing schema-contract test**

Read the migration as text and assert all tables, unique keys, foreign keys, UUID widths, JSON columns, and archive behavior are represented:

```js
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = fs.readFileSync(
  path.resolve(import.meta.dirname, '../../db/migrations/091_webinar_studio_foundation.sql'),
  'utf8'
);

describe('091 webinar studio foundation migration', () => {
  it.each([
    'webinar_presentations',
    'webinar_slides',
    'webinar_revisions',
    'webinar_presenter_settings',
    'webinar_presenter_notes',
    'webinar_audit_events',
  ])('creates %s', table => {
    expect(migration).toMatch(new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
  });

  it('keeps slide identity stable and archived positions nullable', () => {
    expect(migration).toMatch(/id CHAR\(36\) NOT NULL PRIMARY KEY/);
    expect(migration).toMatch(/position INT UNSIGNED NULL/);
    expect(migration).toMatch(/UNIQUE KEY uq_webinar_slide_anchor \(webinar_id, anchor\)/);
    expect(migration).toMatch(/UNIQUE KEY uq_webinar_slide_position \(webinar_id, position\)/);
  });

  it('keys settings and notes to canonical users', () => {
    expect(migration).toMatch(/PRIMARY KEY \(user_id\)/);
    expect(migration).toMatch(/CONSTRAINT fk_webinar_settings_user FOREIGN KEY \(user_id\) REFERENCES users\(id\)/);
    expect(migration).toMatch(/CONSTRAINT fk_webinar_note_slide FOREIGN KEY \(slide_id\) REFERENCES webinar_slides\(id\)/);
  });
});
```

- [ ] **Step 2: Run the test and verify the missing file failure**

Run from `backend/`:

```bash
npx vitest run tests/db/webinarStudioFoundationMigration.test.js
```

Expected: FAIL with `ENOENT` for `091_webinar_studio_foundation.sql`.

- [ ] **Step 3: Create the migration with exact constraints**

Use MySQL 8 types and names consistently:

```sql
CREATE TABLE IF NOT EXISTS webinar_presentations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(190) NOT NULL,
    title VARCHAR(255) NOT NULL,
    primary_owner_user_id INT NOT NULL,
    master_html MEDIUMTEXT NOT NULL,
    master_css MEDIUMTEXT NOT NULL,
    live_version BIGINT UNSIGNED NOT NULL DEFAULT 0,
    audience_enabled TINYINT(1) NOT NULL DEFAULT 0,
    created_by_user_id INT NOT NULL,
    updated_by_user_id INT NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    archived_at DATETIME(3) NULL,
    UNIQUE KEY uq_webinar_slug (slug),
    CONSTRAINT fk_webinar_owner FOREIGN KEY (primary_owner_user_id) REFERENCES users(id),
    CONSTRAINT fk_webinar_created_by FOREIGN KEY (created_by_user_id) REFERENCES users(id),
    CONSTRAINT fk_webinar_updated_by FOREIGN KEY (updated_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS webinar_slides (
    id CHAR(36) NOT NULL PRIMARY KEY,
    webinar_id BIGINT UNSIGNED NOT NULL,
    position INT UNSIGNED NULL,
    anchor VARCHAR(190) NOT NULL,
    title VARCHAR(255) NOT NULL,
    target_seconds INT UNSIGNED NOT NULL DEFAULT 0,
    speaker_notes MEDIUMTEXT NOT NULL,
    html MEDIUMTEXT NOT NULL,
    css MEDIUMTEXT NOT NULL,
    javascript MEDIUMTEXT NOT NULL,
    created_by_user_id INT NOT NULL,
    updated_by_user_id INT NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    archived_at DATETIME(3) NULL,
    UNIQUE KEY uq_webinar_slide_anchor (webinar_id, anchor),
    UNIQUE KEY uq_webinar_slide_position (webinar_id, position),
    CONSTRAINT fk_webinar_slide_webinar FOREIGN KEY (webinar_id) REFERENCES webinar_presentations(id),
    CONSTRAINT fk_webinar_slide_created_by FOREIGN KEY (created_by_user_id) REFERENCES users(id),
    CONSTRAINT fk_webinar_slide_updated_by FOREIGN KEY (updated_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS webinar_revisions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    webinar_id BIGINT UNSIGNED NOT NULL,
    version BIGINT UNSIGNED NOT NULL,
    snapshot JSON NOT NULL,
    change_type VARCHAR(40) NOT NULL,
    change_summary VARCHAR(255) NOT NULL,
    created_by_user_id INT NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE KEY uq_webinar_revision_version (webinar_id, version),
    CONSTRAINT fk_webinar_revision_webinar FOREIGN KEY (webinar_id) REFERENCES webinar_presentations(id),
    CONSTRAINT fk_webinar_revision_user FOREIGN KEY (created_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS webinar_presenter_settings (
    user_id INT NOT NULL,
    shortcuts JSON NOT NULL,
    preferences JSON NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (user_id),
    CONSTRAINT fk_webinar_settings_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS webinar_presenter_notes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    webinar_id BIGINT UNSIGNED NOT NULL,
    slide_id CHAR(36) NOT NULL,
    body TEXT NOT NULL,
    source_system VARCHAR(40) NULL,
    source_record_id VARCHAR(190) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    KEY idx_webinar_notes_owner_slide (user_id, webinar_id, slide_id),
    UNIQUE KEY uq_webinar_note_legacy_source (source_system, source_record_id),
    CONSTRAINT fk_webinar_note_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_webinar_note_webinar FOREIGN KEY (webinar_id) REFERENCES webinar_presentations(id),
    CONSTRAINT fk_webinar_note_slide FOREIGN KEY (slide_id) REFERENCES webinar_slides(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS webinar_audit_events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    webinar_id BIGINT UNSIGNED NULL,
    actor_user_id INT NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    target_type VARCHAR(40) NOT NULL,
    target_id VARCHAR(190) NULL,
    metadata JSON NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    KEY idx_webinar_audit_webinar_time (webinar_id, created_at),
    CONSTRAINT fk_webinar_audit_webinar FOREIGN KEY (webinar_id) REFERENCES webinar_presentations(id),
    CONSTRAINT fk_webinar_audit_actor FOREIGN KEY (actor_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

Do not put semicolons in SQL comments because the current migration runner splits on semicolons before removing comments.

- [ ] **Step 4: Run the migration contract and full backend tests**

```bash
npx vitest run tests/db/webinarStudioFoundationMigration.test.js
npm test
```

Expected: the migration contract passes and the pre-existing suite remains green.

- [ ] **Step 5: Commit the schema slice**

```bash
git add backend/db/migrations/091_webinar_studio_foundation.sql backend/tests/db/webinarStudioFoundationMigration.test.js
git commit -m "feat(webinars): add studio foundation schema"
```

### Task 2: Add request schemas and executable-content policy validation

**Files:**
- Modify: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/package.json`
- Modify: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/package-lock.json`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/validation/schemas/webinars.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/services/webinars/contentPolicy.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/tests/validation/webinars.schema.test.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/tests/services/webinars/contentPolicy.test.js`

**Interfaces:**
- Consumes: Zod request parsing and UTF-8 JavaScript strings.
- Produces: `schemas.createWebinar`, `schemas.saveMaster`, `schemas.addSlide`, `schemas.saveSlide`, `schemas.reorderSlides`, `schemas.restoreRevision`, `schemas.changeOwner`, `schemas.changeAudienceAccess`, `schemas.writeNote`, `schemas.writeSettings`; `loadResourcePolicy(env)`, `validateMasterHtml(source, resourcePolicy)`, `validateSlideHtml(source, resourcePolicy)`, `validateCss(source, surface, resourcePolicy)`, `validateJavascript(source)`, `validateAnchor(anchor)`, and `assertCandidateWithinLimits(candidate)`.

- [ ] **Step 1: Write failing unit tests for exact policy boundaries**

Cover exactly one mount token, scripts and inline handlers, CSS/JS syntax, anchors, and byte limits:

```js
expect(validateMasterHtml('<main>{{SLIDE_CONTENT}}</main>').issues).toEqual([]);
expect(validateMasterHtml('{{SLIDE_CONTENT}}{{SLIDE_CONTENT}}').issues[0].code).toBe('MASTER_TOKEN_COUNT');
expect(validateMasterHtml('<script>alert(1)</script>{{SLIDE_CONTENT}}').issues[0].code).toBe('FORBIDDEN_HTML');
expect(validateMasterHtml('<main onclick="go()">{{SLIDE_CONTENT}}</main>').issues[0].code).toBe('FORBIDDEN_ATTRIBUTE');
expect(validateMasterHtml('<link rel="stylesheet" href="https://fonts.example/theme.css">{{SLIDE_CONTENT}}', policy).issues).toEqual([]);
expect(validateMasterHtml('<link rel="stylesheet" href="https://evil.example/theme.css">{{SLIDE_CONTENT}}', policy).issues[0].code).toBe('RESOURCE_ORIGIN_FORBIDDEN');
expect(validateSlideHtml('<section><img src="{{ASSET:11111111-1111-4111-8111-111111111111}}"></section>', policy).issues).toEqual([]);
expect(validateSlideHtml('<section onload="go()"></section>', policy).issues[0].code).toBe('FORBIDDEN_ATTRIBUTE');
expect(validateSlideHtml('<script>go()</script>', policy).issues[0].code).toBe('FORBIDDEN_HTML');
expect(validateCss('.slide { color: red;', 'slide_css').issues[0].surface).toBe('slide_css');
expect(validateJavascript('const = 1').issues[0].code).toBe('JAVASCRIPT_SYNTAX');
expect(validateJavascript('window.parent.document.body')).toEqual({ issues: [] });
expect(validateAnchor('confident-number')).toEqual({ issues: [] });
expect(validateAnchor('Not valid')).toEqual({ issues: [{ code: 'ANCHOR_FORMAT', surface: 'anchor' }] });
```

The `window.parent` string is intentionally syntax-valid: containment is enforced by the iframe sandbox, not by a brittle source-text blacklist.

- [ ] **Step 2: Run focused tests and verify missing-module failures**

```bash
npx vitest run tests/validation/webinars.schema.test.js tests/services/webinars/contentPolicy.test.js
```

Expected: FAIL because the schemas and content-policy module do not exist.

- [ ] **Step 3: Install parsers and implement schemas and validators**

Run from `backend/`:

```bash
npm install htmlparser2@10 postcss@8 acorn@8
```

Implement parsers without evaluating JavaScript:

```js
const { parseDocument } = require('htmlparser2');
const postcss = require('postcss');
const acorn = require('acorn');

const LIMITS = Object.freeze({
  master_html: 250 * 1024,
  master_css: 500 * 1024,
  slide_html: 250 * 1024,
  slide_css: 250 * 1024,
  slide_javascript: 500 * 1024,
  request: 2 * 1024 * 1024,
});

function validateJavascript(source) {
  try {
    acorn.parse(source, { ecmaVersion: 'latest', sourceType: 'script', allowAwaitOutsideFunction: false });
    return { issues: [] };
  } catch (error) {
    return { issues: [{ code: 'JAVASCRIPT_SYNTAX', surface: 'slide_javascript', line: error.loc?.line || null, column: error.loc?.column || null }] };
  }
}
```

`loadResourcePolicy` parses `WEBINAR_ASSET_CDN_BASE_URL` plus comma-separated `WEBINAR_EXTERNAL_STYLE_ORIGINS` and `WEBINAR_EXTERNAL_FONT_ORIGINS`, keeps only exact HTTPS origins, rejects credentials/paths/query/fragments, and returns `{ assetOrigin, stylesheetOrigins, fontOrigins }` with frozen arrays. `assetOrigin` is the exact origin of the configured CDN base URL and may be `null` only before the assets package is configured; any candidate containing an asset token fails closed while it is null. Walk the parsed HTML nodes through one shared policy walker and emit deterministic issues for `script`, `iframe`, `object`, `embed`, `form`, `base`, `meta[http-equiv]`, any attribute beginning with `on`, `srcdoc`, non-HTTPS external resources, executable URL schemes, and resource origins outside that policy. `validateMasterHtml` additionally requires exactly one literal mount token; `validateSlideHtml` must not apply that Master-only rule. Accept a syntactically valid immutable asset token as a deferred resource value; Task 5 of the asset plan proves that the version is available. Parse CSS declarations and `@import` rules, allowing only asset tokens and the exact stylesheet/font origins while rejecting all other network URLs. Use `Buffer.byteLength(source, 'utf8')` for every limit.

- [ ] **Step 4: Run focused and full tests**

```bash
npx vitest run tests/validation/webinars.schema.test.js tests/services/webinars/contentPolicy.test.js
npm test
```

Expected: all tests pass; no source is evaluated during the test or implementation.

- [ ] **Step 5: Commit the validation slice**

```bash
git add backend/package.json backend/package-lock.json backend/validation/schemas/webinars.js backend/services/webinars/contentPolicy.js backend/tests/validation/webinars.schema.test.js backend/tests/services/webinars/contentPolicy.test.js
git commit -m "feat(webinars): validate studio source safely"
```

### Task 3: Implement owner/admin authorization and private reads

**Files:**
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/services/webinars/authorization.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/services/webinars/repository.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/tests/services/webinars/authorization.test.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/tests/services/webinars/repository.test.js`

**Interfaces:**
- Consumes: `getUserId(req)`, `isAdmin(req)`, and `db.query(sql, params)`.
- Produces: `canReadWebinar(req, webinar): boolean`, `canEditWebinar(req, webinar): boolean`, `assertCanEdit(req, webinar): void`, `listForRequest(req): Promise<WebinarSummary[]>`, `getPrivateDocument(id): Promise<WebinarDocument|null>`, and `getLiveSlides(webinarId): Promise<Slide[]>`.

- [ ] **Step 1: Write failing authorization and query-shape tests**

```js
expect(canEditWebinar(adminReq, { primary_owner_user_id: 9 })).toBe(true);
expect(canEditWebinar(ownerReq, { primary_owner_user_id: 7 })).toBe(true);
expect(canEditWebinar(otherReq, { primary_owner_user_id: 7 })).toBe(false);
expect(() => assertCanEdit(otherReq, webinar)).toThrowError(expect.objectContaining({ status: 403 }));

await repository.listForRequest(ownerReq);
expect(db.query).toHaveBeenCalledWith(expect.stringContaining('primary_owner_user_id = ?'), [7]);
await repository.listForRequest(adminReq);
expect(db.query).toHaveBeenLastCalledWith(expect.not.stringContaining('primary_owner_user_id = ?'), []);
```

Also assert `getPrivateDocument` returns ordered, non-archived slides and never selects notes, settings, or audit rows.

- [ ] **Step 2: Run focused tests and verify missing-module failures**

```bash
npx vitest run tests/services/webinars/authorization.test.js tests/services/webinars/repository.test.js
```

Expected: FAIL because both service modules are missing.

- [ ] **Step 3: Implement focused authorization and repository modules**

Define one safe application error type locally:

```js
class WebinarAccessError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function canEditWebinar(req, webinar) {
  return isAdmin(req) || Number(webinar?.primary_owner_user_id) === Number(getUserId(req));
}
```

Use parameterized SQL. Map JSON columns when the MySQL driver returns strings. Return private webinar objects with `id`, `slug`, `title`, `primaryOwnerUserId`, `liveVersion`, `audienceEnabled`, `masterHtml`, `masterCss`, the server-owned public `resourcePolicy`, and ordered slide objects including target timing and shared speaker notes; do not expose raw SQL names to route callers.

- [ ] **Step 4: Run focused and full tests**

```bash
npx vitest run tests/services/webinars/authorization.test.js tests/services/webinars/repository.test.js
npm test
```

Expected: all tests pass, including non-owner denial and admin listing.

- [ ] **Step 5: Commit the authorization/read slice**

```bash
git add backend/services/webinars/authorization.js backend/services/webinars/repository.js backend/tests/services/webinars/authorization.test.js backend/tests/services/webinars/repository.test.js
git commit -m "feat(webinars): enforce studio ownership reads"
```

### Task 4: Implement atomic live mutations and append-only revisions

**Files:**
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/services/webinars/revisions.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/services/webinars/mutations.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/services/webinars/audit.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/services/webinars/observability.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/tests/services/webinars/revisions.test.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/tests/services/webinars/mutations.test.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/tests/services/webinars/audit.test.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/tests/services/webinars/observability.test.js`

**Interfaces:**
- Consumes: content-policy validators, repository row mappers, `db.getConnection()`, stable UUIDs from `node:crypto.randomUUID()`, an injected `syncAssetReferences(connection, candidate)` function whose foundation default returns `{ assetVersionIds: [] }` when no token exists and otherwise rejects with `ASSET_LIBRARY_NOT_READY`, and an injected `recordRevisionAssetReferences(connection, revisionId, assetVersionIds)` whose foundation default requires an empty ID set and otherwise rejects with the same code.
- Produces: `listHistory(webinarId): Promise<RevisionSummary[]>`, `getRevisionForRestore(webinarId, revisionId): Promise<RevisionSnapshot|null>`, `createWebinar(input)`, `archiveWebinar(input)`, `saveMaster(input)`, `addSlide(input)`, `saveSlide(input)`, `reorderSlides(input)`, `archiveSlide(input)`, `restoreRevision(input)`, `changeOwner(input)`, and `changeAudienceAccess(input)`, all returning `{ webinarId, liveVersion, updatedAt }` except webinar archive, ownership, and audience changes, which return current metadata without incrementing `liveVersion`; `recordOperationalEvent(name, fields)` with a closed event/field allow-list.

- [ ] **Step 1: Write transaction-first failing tests**

Use a fake connection recording `beginTransaction`, the webinar row-lock query, normalized writes, revision insert, `commit`, and `rollback`. Assert:

```js
await expect(saveMaster({ webinarId: 2, actorUserId: 7, expectedVersion: 4, masterHtml, masterCss }))
  .resolves.toMatchObject({ webinarId: 2, liveVersion: 5 });
expect(calls).toEqual(expect.arrayContaining(['beginTransaction', 'lock:2', 'revision:5', 'commit']));

await expect(saveMaster({ webinarId: 2, actorUserId: 7, expectedVersion: 3, masterHtml, masterCss }))
  .rejects.toMatchObject({ status: 409, code: 'VERSION_CONFLICT', currentVersion: 4, updatedBy: { id: 8, name: 'Another Editor' } });
expect(calls).not.toContain('commit');

await archiveSlide({ webinarId: 2, slideId: stableId, actorUserId: 7, expectedVersion: 4 });
expect(sqlCalls).toContainEqual(expect.objectContaining({ sql: expect.stringContaining('position = NULL, archived_at = CURRENT_TIMESTAMP(3)') }));
```

Also assert `listHistory` returns version/change summary/creator name/time but never snapshot/code, `getRevisionForRestore` scopes by both webinar/revision ID, duplicate generates a new UUID and unique anchor, reorder requires the complete active ID set, restore reactivates archived IDs and creates version `current + 1`, and administrator archive sets both `archived_at` and `audience_enabled = 0` without deleting rows. Assert `createWebinar` accepts an exact active owner, creates an audience-disabled presentation, one stable blank slide at position 0/anchor `opening`, a safe Master wrapper, and a complete initial revision at live version 1 in one transaction. Validation failure must occur before writes, and any write failure must roll back without a revision.

- [ ] **Step 2: Run focused tests and verify missing-module failures**

```bash
npx vitest run tests/services/webinars/revisions.test.js tests/services/webinars/mutations.test.js tests/services/webinars/audit.test.js tests/services/webinars/observability.test.js
```

Expected: FAIL because the transaction services are missing.

- [ ] **Step 3: Implement snapshot and mutation transactions**

Every content mutation must use this ordering:

```js
await connection.beginTransaction();
const webinar = await lockWebinar(connection, webinarId);
assertExpectedVersion(webinar, expectedVersion);
const candidate = await buildCandidateState(connection, webinarId, mutation);
validateCandidate(candidate);
const { assetVersionIds } = await syncAssetReferences(connection, candidate);
await applyNormalizedMutation(connection, candidate, actorUserId);
const snapshot = await buildCompleteSnapshot(connection, webinarId);
const liveVersion = Number(webinar.live_version) + 1;
const revisionId = await insertRevision(connection, { webinarId, liveVersion, snapshot, changeType, changeSummary, actorUserId });
await recordRevisionAssetReferences(connection, revisionId, assetVersionIds);
await setLiveVersion(connection, { webinarId, liveVersion, actorUserId });
await connection.commit();
```

The row-lock read joins the current updater's private `users.id` and `users.name` so a conflict error contains `currentVersion`, `updatedAt`, and `updatedBy: {id,name}` for the authenticated Studio only. On any error, call `rollback()` and rethrow. `buildCompleteSnapshot` returns exactly:

```js
{
  schemaVersion: 1,
  webinar: { slug, title, masterHtml, masterCss },
  slides: [{ id, position, anchor, title, targetSeconds, speakerNotes, html, css, javascript }],
}
```

`changeOwner` verifies an active `users` row and writes an audit event but does not change `live_version`. `changeAudienceAccess` writes a boolean and audit event but does not create or select a content revision. The audit service accepts only allow-listed scalar metadata keys and rejects `source`, `html`, `css`, `javascript`, `body`, `token`, `credential`, and `s3Key` keys. `observability.js` emits only fixed names `webinar.save_succeeded`, `webinar.validation_rejected`, `webinar.version_conflict`, `webinar.authorization_denied`, `webinar.database_failure`, `webinar.restore_succeeded`, `webinar.public_delivery_failure`, `webinar.public_runtime_error`, `webinar.asset_scan_pending`, `webinar.asset_scan_rejected`, `webinar.asset_inspection_rejected`, `webinar.asset_available`, and `webinar.asset_scanner_failure` with allow-listed IDs, version numbers, reason codes, status codes, and durations; it drops all unrecognized fields before passing a record to Pino.

`createWebinar` is administrator-only at the route layer and uses its own transaction: validate the exact active owner, insert the audience-disabled presentation with `<main class="webinar-slide">{{SLIDE_CONTENT}}</main>` and empty Master CSS, insert one UUID slide titled `Opening` at position 0 with anchor `opening` and empty timing/notes/code, build the complete snapshot, insert revision 1, set `live_version = 1`, record the creation audit event, and commit. Any failure rolls back the presentation, slide, revision, and audit rows together.

- [ ] **Step 4: Run focused and full tests**

```bash
npx vitest run tests/services/webinars/revisions.test.js tests/services/webinars/mutations.test.js tests/services/webinars/audit.test.js tests/services/webinars/observability.test.js
npm test
```

Expected: all transaction, conflict, restore, archive, audit-redaction, and existing tests pass.

- [ ] **Step 5: Commit the live-mutation slice**

```bash
git add backend/services/webinars/revisions.js backend/services/webinars/mutations.js backend/services/webinars/audit.js backend/services/webinars/observability.js backend/tests/services/webinars/revisions.test.js backend/tests/services/webinars/mutations.test.js backend/tests/services/webinars/audit.test.js backend/tests/services/webinars/observability.test.js
git commit -m "feat(webinars): add atomic live revisions"
```

### Task 5: Add current-user notes and account-wide settings services

**Files:**
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/services/webinars/notes.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/services/webinars/settings.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/tests/services/webinars/notes.test.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/tests/services/webinars/settings.test.js`

**Interfaces:**
- Consumes: authenticated `req.user.db.id`, authorized webinar, stable slide IDs, parameterized DB queries.
- Produces: `listNotes({ userId, webinarId })`, `addNote({ userId, webinarId, slideId, body })`, `updateNote({ userId, webinarId, noteId, body })`, `deleteNote({ userId, webinarId, noteId })`, `getSettings(userId)`, and `upsertSettings({ userId, shortcuts, preferences })`.

- [ ] **Step 1: Write failing isolation and upsert tests**

```js
await notes.updateNote({ userId: 7, webinarId: 2, noteId: 11, body: 'Mine' });
expect(db.query).toHaveBeenCalledWith(
  expect.stringMatching(/WHERE id = \? AND user_id = \? AND webinar_id = \?/),
  ['Mine', 11, 7, 2]
);

await settings.upsertSettings({ userId: 7, shortcuts, preferences });
expect(db.query).toHaveBeenCalledWith(
  expect.stringContaining('ON DUPLICATE KEY UPDATE'),
  [7, JSON.stringify(shortcuts), JSON.stringify(preferences)]
);
```

Assert a note slide must belong to the webinar, other users cannot update/delete it, the body is trimmed and limited to 10,000 UTF-8 bytes, and settings reject unknown shortcut action names and duplicate key bindings.

- [ ] **Step 2: Run focused tests and verify missing-module failures**

```bash
npx vitest run tests/services/webinars/notes.test.js tests/services/webinars/settings.test.js
```

Expected: FAIL because the services are missing.

- [ ] **Step 3: Implement identity-derived persistence**

Never accept `userId` from an HTTP body or URL. Route code supplies it from `getUserId(req)`. Settings JSON is normalized to these action keys:

```js
const SHORTCUT_ACTIONS = Object.freeze([
  'previousSlide', 'nextSlide', 'animationPrevious', 'animationNext',
  'animationPlay', 'animationPause', 'toggleDrawing', 'toggleFullscreen',
]);
```

Preferences accept only defined boolean/string keys introduced by the presenter. Preserve multiple notes per user and slide. Normal UI-created notes write `source_system = NULL` and `source_record_id = NULL`. Return `404` for a missing current-user note rather than revealing whether another user's note exists.

- [ ] **Step 4: Run focused and full tests**

```bash
npx vitest run tests/services/webinars/notes.test.js tests/services/webinars/settings.test.js
npm test
```

Expected: all tests pass and note/settings writes are scoped to the authenticated user.

- [ ] **Step 5: Commit the personal-data slice**

```bash
git add backend/services/webinars/notes.js backend/services/webinars/settings.js backend/tests/services/webinars/notes.test.js backend/tests/services/webinars/settings.test.js
git commit -m "feat(webinars): persist personal presenter data"
```

### Task 6: Expose the private API through existing Cognito middleware

**Files:**
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/routes/webinars.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/routes/webinarPresenterSettings.js`
- Modify: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/middleware/auth.js`
- Modify: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/middleware/userContext.js`
- Modify: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/server.js`
- Modify: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/tests/middleware/userContext.test.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/tests/routes/webinars.test.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/tests/routes/webinarPresenterSettings.test.js`

**Interfaces:**
- Consumes: `authenticate`, `requireDbUser`, new `requireActiveDbUser`, `requireNonExternal`, `requireAdmin`, authorization/services from Tasks 3–5, and request schemas from Task 2.
- Produces: the exact private API routes in the approved specification under `/api/webinars` and `/api/webinar-presenter-settings/me`; an identity-keyed `webinarWriteLimiter` allowing 300 private webinar mutations per 15 minutes while skipping GET/HEAD/OPTIONS.

- [ ] **Step 1: Write failing Express route tests**

Mount the routers in a test app with injected `req.user`. Assert representative boundaries plus every status contract:

```js
expect((await request(ownerApp, 'GET', '/api/webinars/2')).status).toBe(200);
expect((await request(otherApp, 'GET', '/api/webinars/2')).status).toBe(403);
expect((await request(adminApp, 'PUT', '/api/webinars/2/owner', { primaryOwnerUserId: 8 })).status).toBe(200);
expect((await request(ownerApp, 'PUT', '/api/webinars/2/owner', { primaryOwnerUserId: 8 })).status).toBe(403);
expect((await request(ownerApp, 'PUT', '/api/webinars/2/master', staleBody)).status).toBe(409);
expect(settingsService.upsertSettings).toHaveBeenCalledWith(expect.objectContaining({ userId: 7 }));
expect(runActiveGate({ db: { id: 7, is_active: 0 } })).toMatchObject({ status: 403 });
```

Add table-driven tests for every specified verb/path, malformed UUIDs, oversized requests, archived webinars, missing slides, restore, audience access, and note ownership. Extend the user-context test to require `is_active === 1`, and assert both DB lookup queries in `auth.js` select `is_active` without otherwise changing global authentication behavior.

- [ ] **Step 2: Run route tests and verify missing-router failures**

```bash
npx vitest run tests/routes/webinars.test.js tests/routes/webinarPresenterSettings.test.js
```

Expected: FAIL because the routers are missing.

- [ ] **Step 3: Implement thin routers and mounts**

Use an async wrapper that passes errors to Express. Mount after the current-user endpoint and before unrelated private routes:

```js
app.use('/api/webinars', authenticate, requireDbUser, requireActiveDbUser, requireNonExternal, webinarsRoutes);
app.use('/api/webinar-presenter-settings', authenticate, requireDbUser, requireActiveDbUser, requireNonExternal, webinarPresenterSettingsRoutes);
```

Before the existing global 10 MB JSON parser, add `rejectOversizedWebinarRequest` that checks `Content-Length` for mutating `/api/webinars` and `/api/webinar-presenter-settings` requests and returns 413 above 2 MB; after parsing, `assertCandidateWithinLimits` recalculates actual UTF-8 sizes so chunked requests cannot bypass the limit. Add `is_active` to the selected DB-user columns in both email and Cognito-sub lookup branches. Implement `requireActiveDbUser` in `userContext.js` as a webinar-scoped reusable middleware that returns `403 { error: 'Active employee access required' }` unless `Number(req.user.db.is_active) === 1`; do not mount it on unrelated existing routes. Add `webinarWriteLimiter` after authentication so its key is `String(req.user.db.id)`, and mount it on private webinar/settings mutations. Register literal paths such as `/presenter-settings` nowhere under `/:id`. Parse body and params with Zod, load the webinar, authorize on every webinar route, and pass `getUserId(req)` to services. Return `201` for create/add/note creation, `200` for reads/updates/restore, `204` for successful note deletion, and structured `{ error, code, issues, currentVersion, updatedAt, updatedBy }` responses for controlled failures; updater identity appears only on authenticated version conflicts. Record authorization, validation, conflict, database, successful-save, and restore events through the safe audit/observability interfaces without request bodies.

- [ ] **Step 4: Run route, full test, and lint gates**

```bash
npx vitest run tests/routes/webinars.test.js tests/routes/webinarPresenterSettings.test.js
npm test
npm run lint
```

Expected: all tests pass; lint reports no new errors.

- [ ] **Step 5: Commit the private API slice**

```bash
git add backend/routes/webinars.js backend/routes/webinarPresenterSettings.js backend/middleware/auth.js backend/middleware/userContext.js backend/server.js backend/tests/middleware/userContext.test.js backend/tests/routes/webinars.test.js backend/tests/routes/webinarPresenterSettings.test.js
git commit -m "feat(webinars): expose authenticated studio API"
```

### Task 7: Verify the package without changing production state

**Files:**
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/vitest.webinar-integration.config.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/tests/integration/webinarStudioFoundation.integration.test.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/docs/webinar-studio/foundation-verification.md`

**Interfaces:**
- Consumes: complete package API and migration; a disposable MySQL 8 instance supplied only to the integration test through `WEBINAR_TEST_DATABASE_URL`.
- Produces: repeatable local evidence for schema constraints, owner/admin access, version conflict, rollback, note isolation, settings identity, and revision restore.

- [ ] **Step 1: Write a gated integration test**

Create an integration-only Vitest config whose `include` is `tests/integration/webinar*.integration.test.js` and whose environment is `node`. The test must skip unless `WEBINAR_TEST_DATABASE_URL` is present and must create/drop only a uniquely named test database. Exercise migration 091, seed three test users, create a webinar, perform two saves, force a stale save, archive/restore one stable slide ID, and verify another user's note cannot be read or mutated.

```js
const describeWithMysql = process.env.WEBINAR_TEST_DATABASE_URL ? describe : describe.skip;

describeWithMysql('webinar studio foundation', () => {
  it('preserves revisions and isolates notes', async () => {
    const created = await fixture.createWebinar({ ownerUserId: owner.id });
    const saved = await fixture.saveMaster(created.id, 1, validMaster);
    await expect(fixture.saveMaster(created.id, 1, validMaster)).rejects.toMatchObject({ code: 'VERSION_CONFLICT' });
    await expect(fixture.readNoteAs(other.id, created.id, ownerNote.id)).resolves.toBeNull();
    expect(saved.liveVersion).toBe(2);
  });
});
```

- [ ] **Step 2: Run the default suite and confirm integration isolation**

```bash
npm test
```

Expected: unit tests pass and `tests/integration/**` is excluded by the existing Vitest configuration.

- [ ] **Step 3: Run the integration test against disposable MySQL**

Start a disposable local container:

```bash
docker run --rm --name msfg-webinar-mysql -e MYSQL_ROOT_PASSWORD=local-only -p 33079:3306 -d mysql:8.0
```

After it reports healthy, run:

```bash
WEBINAR_TEST_DATABASE_URL='mysql://root:local-only@127.0.0.1:33079/mysql' npx vitest run --config vitest.webinar-integration.config.js tests/integration/webinarStudioFoundation.integration.test.js
```

Expected: PASS with all rows confined to the unique test database. Stop the container with `docker stop msfg-webinar-mysql`.

- [ ] **Step 4: Record verification and operational hold points**

Document the exact commands, test counts, local commit SHAs, and these unperformed actions: production migration, backend deployment, data migration, public cutover, and credential retirement. Do not record passwords, tokens, or connection strings.

- [ ] **Step 5: Commit package verification**

```bash
git add backend/vitest.webinar-integration.config.js backend/tests/integration/webinarStudioFoundation.integration.test.js docs/webinar-studio/foundation-verification.md
git commit -m "test(webinars): verify studio foundation"
```

## Package Exit Gate

Before starting the shared-assets package, obtain review that:

- all unit and disposable-MySQL integration tests pass;
- no private route can be accessed by a non-owner/non-admin;
- content mutations are atomic and conflict-safe;
- settings and notes derive identity from Cognito mapping;
- the migration has not been applied to production; and
- the Dashboard working tree contains no unrelated staged files.
