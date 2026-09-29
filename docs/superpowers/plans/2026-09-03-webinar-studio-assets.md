# Webinar Studio Shared Assets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reusable, versioned asset library whose authenticated uploads are quarantined, scanned, validated, and made available through immutable CDN URLs that Webinar Studio code references by stable version token.

**Architecture:** Asset families provide reusable catalog identity while immutable versions carry bytes and validation status. Browsers upload only to a quarantined S3 prefix through short-lived presigned PUT requests; the backend releases an asset version only after GuardDuty tagging, magic-byte/container verification, size validation, SHA-256 calculation, metadata extraction, and SVG sanitization. Live webinar saves transactionally replace version-token references and reject any missing, non-available, or archived version.

**Tech Stack:** Node.js CommonJS, Express 4, MySQL 8, AWS SDK v3 for S3, S3 GuardDuty Malware Protection tags, private S3 plus CloudFront origin access control, Zod 4, `file-type`, `sharp`, `sanitize-html`, `ffprobe-static`, Vitest 4

**Spec:** `/Users/zacharyzink/MSFG/Webinars/docs/superpowers/specs/2026-09-03-webinar-studio-design.md`

## Global Constraints

- Complete the foundation package first; this plan consumes its webinar tables, owner/admin authorization, validation, audit, and mutation transaction interfaces.
- Asset bytes stay in private S3. The API and public bundle never return S3 keys.
- Asset references use exact immutable tokens such as `{{ASSET:11111111-1111-4111-8111-111111111111}}`.
- Supported uploads are PNG, JPEG, WebP, GIF up to 20 MB; sanitized SVG up to 5 MB; WOFF/WOFF2 up to 10 MB; MP3/WAV up to 100 MB; and MP4/WebM up to 500 MB.
- Reject HTML, JavaScript, executables, archives, PDFs, office documents, unsupported content, mismatched MIME declarations, and malformed containers.
- Every new upload begins in `processing` and remains unavailable until malware status is exactly `NO_THREATS_FOUND` and server validation succeeds.
- Treat `THREATS_FOUND`, `UNSUPPORTED`, `ACCESS_DENIED`, and `FAILED` as rejected release outcomes and preserve a non-sensitive reason code.
- The GuardDuty plan and managed object tagging must be active before any production upload; application code must not infer clean status from a missing tag.
- Sanitized SVG output, not the quarantined original, becomes the available immutable object.
- Existing asset-version references never change when a new family version is uploaded.
- Versions referenced by current live source or any append-only revision cannot be archived. The first-release Studio has no permanent-delete operation.
- Owners can upload shared assets and archive an unreferenced version they uploaded; administrators can archive any unreferenced version.
- Audit metadata excludes storage keys, source code, note bodies, credentials, and upload URLs.
- Database changes are additive and use a new migration after a fresh migration-number preflight.
- Do not provision or reconfigure production S3, GuardDuty, CloudFront, IAM, DNS, or database resources without separate explicit approval.
- Preserve unrelated dirty or concurrent work and commit only files listed by each task.

---

## Package Boundary and File Map

Implementation repository: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com`.

- `backend/db/migrations/092_webinar_studio_assets.sql` — asset families, immutable versions, live references, append-only revision references, and status constraints.
- `backend/services/webinarAssets/config.js` — environment parsing, CDN URL construction, prefixes, limits, and accepted types.
- `backend/services/webinarAssets/tokens.js` — strict token extraction/replacement and surface reference sets.
- `backend/services/webinarAssets/inspection.js` — stream limits, magic-byte/container verification, hashes, dimensions/duration, and SVG sanitization.
- `backend/services/webinarAssets/storage.js` — quarantine presigns, scan-tag reads, quarantine reads, immutable writes, and object existence.
- `backend/services/webinarAssets/catalog.js` — family/version creation, confirmation, list, usage, archive, authorization, and deduplication.
- `backend/services/webinarAssets/references.js` — transaction-scoped validation and reference replacement consumed by webinar mutations.
- `backend/validation/schemas/webinarAssets.js` — upload, confirm, metadata, and archive inputs.
- `backend/routes/webinarAssets.js` — authenticated catalog and upload API.
- `backend/server.js` — authenticated route mount and per-user asset write limiter.
- Tests live under matching `backend/tests/services/webinarAssets/`, `backend/tests/routes/`, `backend/tests/validation/`, and `backend/tests/db/` paths.
- `docs/webinar-studio/assets-runbook.md` — exact non-production and production prerequisites, verification, and rollback; commands are documented but not run against production in this package.

Preflight from the Dashboard repository:

```bash
git status --short
git log --oneline -5
test -e backend/db/migrations/091_webinar_studio_foundation.sql
test ! -e backend/db/migrations/092_webinar_studio_assets.sql
npm --prefix backend test
```

Expected: the reviewed foundation commit is present, 092 is unused, and tests pass. If 092 exists or any overlapping file differs from the reviewed foundation, stop and re-baseline before editing.

### Task 1: Add immutable asset schema and strict token grammar

**Files:**
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/db/migrations/092_webinar_studio_assets.sql`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/tests/db/webinarStudioAssetsMigration.test.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/services/webinarAssets/tokens.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/tests/services/webinarAssets/tokens.test.js`

**Interfaces:**
- Consumes: `webinar_presentations(id)`, `webinar_slides(id)`, and `users(id)` from migration 091.
- Produces: `webinar_assets`, `webinar_asset_versions`, `webinar_asset_references`, `webinar_revision_asset_references`; `ASSET_TOKEN_PATTERN`; `extractAssetVersionIds(source): string[]`; `replaceAssetTokens(source, urlsByVersionId): string`; `collectSurfaceTokens(candidate): Array<{slideId, surface, assetVersionId}>`.

- [ ] **Step 1: Write failing schema and token tests**

```js
expect(extractAssetVersionIds(`url('{{ASSET:11111111-1111-4111-8111-111111111111}}')`))
  .toEqual(['11111111-1111-4111-8111-111111111111']);
expect(() => replaceAssetTokens('{{ASSET:not-a-uuid}}', new Map())).toThrowError(
  expect.objectContaining({ code: 'ASSET_TOKEN_FORMAT' })
);
expect(() => replaceAssetTokens('{{ASSET:11111111-1111-4111-8111-111111111111}}', new Map())).toThrowError(
  expect.objectContaining({ code: 'ASSET_TOKEN_UNRESOLVED' })
);
```

The migration test must assert family/version uniqueness, the four status values, the five live-reference surfaces, revision/version foreign keys, a composite primary key preventing duplicate historical dependencies, and a unique live key preventing duplicate surface references.

- [ ] **Step 2: Run focused tests and verify missing-file failures**

```bash
npx vitest run tests/db/webinarStudioAssetsMigration.test.js tests/services/webinarAssets/tokens.test.js
```

Expected: FAIL because migration 092 and `tokens.js` do not exist.

- [ ] **Step 3: Create exact schema and token parser**

Use these table contracts:

```sql
CREATE TABLE IF NOT EXISTS webinar_assets (
    id CHAR(36) NOT NULL PRIMARY KEY,
    display_name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    created_by_user_id INT NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    archived_at DATETIME(3) NULL,
    CONSTRAINT fk_webinar_asset_creator FOREIGN KEY (created_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS webinar_asset_versions (
    id CHAR(36) NOT NULL PRIMARY KEY,
    asset_id CHAR(36) NOT NULL,
    version_number INT UNSIGNED NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    media_type ENUM('image','svg','font','audio','video') NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    byte_size BIGINT UNSIGNED NOT NULL,
    sha256 CHAR(64) NULL,
    s3_key VARCHAR(1024) NOT NULL,
    width INT UNSIGNED NULL,
    height INT UNSIGNED NULL,
    duration_ms BIGINT UNSIGNED NULL,
    status ENUM('processing','available','rejected','archived') NOT NULL DEFAULT 'processing',
    rejection_code VARCHAR(64) NULL,
    uploaded_by_user_id INT NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    archived_at DATETIME(3) NULL,
    UNIQUE KEY uq_webinar_asset_version (asset_id, version_number),
    KEY idx_webinar_asset_hash (sha256, status),
    CONSTRAINT fk_webinar_asset_version_family FOREIGN KEY (asset_id) REFERENCES webinar_assets(id),
    CONSTRAINT fk_webinar_asset_uploader FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS webinar_asset_references (
    webinar_id BIGINT UNSIGNED NOT NULL,
    slide_id CHAR(36) NULL,
    asset_version_id CHAR(36) NOT NULL,
    surface ENUM('master_html','master_css','slide_html','slide_css','slide_javascript') NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE KEY uq_webinar_asset_reference (webinar_id, slide_id, asset_version_id, surface),
    KEY idx_webinar_asset_reference_version (asset_version_id),
    CONSTRAINT fk_webinar_asset_reference_webinar FOREIGN KEY (webinar_id) REFERENCES webinar_presentations(id),
    CONSTRAINT fk_webinar_asset_reference_slide FOREIGN KEY (slide_id) REFERENCES webinar_slides(id),
    CONSTRAINT fk_webinar_asset_reference_version FOREIGN KEY (asset_version_id) REFERENCES webinar_asset_versions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS webinar_revision_asset_references (
    revision_id BIGINT UNSIGNED NOT NULL,
    asset_version_id CHAR(36) NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (revision_id, asset_version_id),
    KEY idx_webinar_revision_asset_version (asset_version_id),
    CONSTRAINT fk_webinar_revision_asset_revision FOREIGN KEY (revision_id) REFERENCES webinar_revisions(id),
    CONSTRAINT fk_webinar_revision_asset_version FOREIGN KEY (asset_version_id) REFERENCES webinar_asset_versions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

Because MySQL unique indexes allow multiple `NULL` values, `collectSurfaceTokens` deduplicates Master references before insert and references are always rebuilt by delete-plus-insert within the webinar mutation transaction. Token parsing must reject malformed lookalikes beginning with `{{ASSET:` rather than leaving them in live source.

- [ ] **Step 4: Run focused and full tests**

```bash
npx vitest run tests/db/webinarStudioAssetsMigration.test.js tests/services/webinarAssets/tokens.test.js
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit schema and token grammar**

```bash
git add backend/db/migrations/092_webinar_studio_assets.sql backend/tests/db/webinarStudioAssetsMigration.test.js backend/services/webinarAssets/tokens.js backend/tests/services/webinarAssets/tokens.test.js
git commit -m "feat(webinars): add immutable asset schema"
```

### Task 2: Define asset configuration, supported media, and quarantine storage

**Files:**
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/services/webinarAssets/config.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/services/webinarAssets/storage.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/tests/services/webinarAssets/config.test.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/tests/services/webinarAssets/storage.test.js`

**Interfaces:**
- Consumes: `WEBINAR_ASSET_BUCKET`, `WEBINAR_ASSET_CDN_BASE_URL`, optional `WEBINAR_ASSET_QUARANTINE_PREFIX`, S3 client/presigner, and GuardDuty managed tags.
- Produces: `MEDIA_RULES`, `loadAssetConfig(env)`, `makeQuarantineKey(versionId, filename)`, `makeApprovedKey(sha256, filename)`, `makePublicUrl(config, approvedKey)`, `createUploadUrl(input)`, `headQuarantineObject(input)`, `readScanStatus(input)`, `readQuarantineObject(input)`, `putApprovedObject(input)`, and `copyApprovedObject(input)`.

- [ ] **Step 1: Write failing config and AWS-command tests**

Assert exact byte limits and environment failures:

```js
expect(MEDIA_RULES['image/png'].maxBytes).toBe(20 * 1024 * 1024);
expect(MEDIA_RULES['image/svg+xml'].maxBytes).toBe(5 * 1024 * 1024);
expect(MEDIA_RULES['video/mp4'].maxBytes).toBe(500 * 1024 * 1024);
expect(() => loadAssetConfig({})).toThrowError(expect.objectContaining({ code: 'ASSET_CONFIG_MISSING' }));
expect(makeQuarantineKey(versionId, '../../logo.png')).toBe(`quarantine/${versionId}/logo.png`);
```

Stub the AWS SDK through `require.cache`, following `tests/services/userFiles.test.js`, and assert the presigned PUT includes exact `ContentType`, declared byte length metadata, a 10-minute expiration, and a quarantine-only key. Assert `readScanStatus` returns only the value of `GuardDutyMalwareScanStatus` and returns `null` when absent.

- [ ] **Step 2: Run focused tests and verify missing-module failures**

```bash
npx vitest run tests/services/webinarAssets/config.test.js tests/services/webinarAssets/storage.test.js
```

Expected: FAIL because both modules are missing.

- [ ] **Step 3: Implement fail-closed configuration and S3 operations**

`loadAssetConfig` trims a trailing slash from the HTTPS CDN base URL, rejects a non-HTTPS production CDN URL, and defaults the quarantine prefix to `quarantine/`. Approved keys are content-addressed:

```js
function makeApprovedKey(sha256, filename) {
  return `approved/sha256/${sha256}/${sanitizeFilename(filename)}`;
}

function makePublicUrl(config, approvedKey) {
  return `${config.cdnBaseUrl}/${approvedKey.split('/').map(encodeURIComponent).join('/')}`;
}
```

Never create a public URL for a quarantine key. `readScanStatus` uses `GetObjectTaggingCommand`; the application treats missing status as still processing, never clean.

- [ ] **Step 4: Run focused and full tests**

```bash
npx vitest run tests/services/webinarAssets/config.test.js tests/services/webinarAssets/storage.test.js
npm test
```

Expected: all tests pass without touching AWS.

- [ ] **Step 5: Commit configuration and storage**

```bash
git add backend/services/webinarAssets/config.js backend/services/webinarAssets/storage.js backend/tests/services/webinarAssets/config.test.js backend/tests/services/webinarAssets/storage.test.js
git commit -m "feat(webinars): quarantine asset uploads"
```

### Task 3: Inspect, hash, sanitize, and release approved media

**Files:**
- Modify: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/package.json`
- Modify: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/package-lock.json`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/services/webinarAssets/inspection.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/tests/services/webinarAssets/inspection.test.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/tests/fixtures/webinar-assets/clean.svg`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/tests/fixtures/webinar-assets/active.svg`

**Interfaces:**
- Consumes: a Node readable stream plus `{ declaredMimeType, declaredBytes, filename }` and `MEDIA_RULES`.
- Produces: `inspectAsset(input): Promise<{mediaType,mimeType,byteSize,sha256,width,height,durationMs,approvedBody}>`; `sanitizeSvg(source): Buffer`; deterministic `AssetInspectionError` codes.

- [ ] **Step 1: Write failing fixture-driven inspection tests**

Assert a valid PNG is identified by bytes, an `.mp4` containing text is rejected, declared/actual MIME mismatch is rejected, streaming stops at the declared type's limit, SHA-256 is deterministic, and an SVG loses scripts, event handlers, `foreignObject`, external references, `javascript:` URLs, and animation elements:

```js
const result = await inspectAsset({ stream: from(svgFixture), declaredMimeType: 'image/svg+xml', declaredBytes: svgFixture.length, filename: 'mark.svg' });
expect(result.mimeType).toBe('image/svg+xml');
expect(result.approvedBody.toString()).not.toMatch(/script|onload|foreignObject|javascript:/i);
expect(result.sha256).toMatch(/^[a-f0-9]{64}$/);
```

For audio/video, stub `ffprobe` and assert duration milliseconds are normalized from seconds. For raster images, assert width/height from `sharp` metadata.

- [ ] **Step 2: Run focused tests and verify missing dependencies/modules**

```bash
npx vitest run tests/services/webinarAssets/inspection.test.js
```

Expected: FAIL because `inspection.js` and fixtures are missing.

- [ ] **Step 3: Install media inspection dependencies and implement fail-closed inspection**

```bash
npm install file-type@20 sharp@0.34 sanitize-html@2 ffprobe-static@3
```

Use dynamic `import('file-type')` from CommonJS. Buffer only up to the applicable maximum plus one byte; reject excess immediately. For SVG, normalize declared type from XML bytes, sanitize through an SVG-specific allow-list, parse the result again, and hash the sanitized approved body. For other formats, hash original bytes. Invoke `ffprobe-static.path` only with `execFile`, a generated local temporary filename, a timeout, and no shell. Always remove only that explicit temporary file in `finally`.

- [ ] **Step 4: Run inspection and full tests**

```bash
npx vitest run tests/services/webinarAssets/inspection.test.js
npm test
npm run lint
```

Expected: all accepted formats and rejection cases pass; lint reports no new errors.

- [ ] **Step 5: Commit media inspection**

```bash
git add backend/package.json backend/package-lock.json backend/services/webinarAssets/inspection.js backend/tests/services/webinarAssets/inspection.test.js backend/tests/fixtures/webinar-assets/clean.svg backend/tests/fixtures/webinar-assets/active.svg
git commit -m "feat(webinars): validate uploaded presentation media"
```

### Task 4: Implement catalog lifecycle, scan confirmation, and archive protection

**Files:**
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/services/webinarAssets/catalog.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/tests/services/webinarAssets/catalog.test.js`

**Interfaces:**
- Consumes: authenticated actor ID/role, storage operations, `inspectAsset`, audit/observability services, DB transactions.
- Produces: `assertAssetContributor({actorUserId,isAdmin})`, `listCatalog(filters)`, `createUploadIntent(input)`, `createVersionIntent(input)`, `confirmUpload(input)`, `updateFamily(input)`, `archiveVersion(input)`, and `getUsage(versionId)`.

- [ ] **Step 1: Write failing lifecycle tests**

Cover exact state transitions:

```js
await expect(confirmUpload({ versionId, actorUserId: 7 })).resolves.toMatchObject({ status: 'processing' });
scanStatus.mockResolvedValue('NO_THREATS_FOUND');
await expect(confirmUpload({ versionId, actorUserId: 7 })).resolves.toMatchObject({ status: 'available', sha256 });
scanStatus.mockResolvedValue('THREATS_FOUND');
await expect(confirmUpload({ versionId, actorUserId: 7 })).resolves.toMatchObject({ status: 'rejected', rejectionCode: 'MALWARE_DETECTED' });
await expect(archiveVersion({ versionId: referencedId, actorUserId: 7, isAdmin: false }))
  .rejects.toMatchObject({ status: 409, code: 'ASSET_IN_USE' });
```

Also assert an actor must be an administrator or the primary owner of at least one active webinar, uploader-only owner archive, admin override, archive denial for either live or revision-only use, live/history usage classification without source code, deduplication by SHA-256 approved key, sequential family version numbers under row lock, no re-confirm after terminal status, and no S3 key/upload URL in catalog results.

- [ ] **Step 2: Run focused tests and verify the missing service**

```bash
npx vitest run tests/services/webinarAssets/catalog.test.js
```

Expected: FAIL because `catalog.js` is missing.

- [ ] **Step 3: Implement transaction-safe lifecycle**

`createUploadIntent` creates a family UUID and version UUID, writes a `processing` row with quarantine key, and returns `{ assetId, versionId, uploadUrl, expiresInSeconds: 600 }`. `confirmUpload` performs:

```js
const scanStatus = await storage.readScanStatus({ key: version.s3Key });
if (!scanStatus) return { status: 'processing' };
if (scanStatus !== 'NO_THREATS_FOUND') return rejectVersion(mapScanFailure(scanStatus));
const inspected = await inspection.inspectAsset(await storage.readQuarantineObject(version.s3Key));
const approvedKey = storage.makeApprovedKey(inspected.sha256, version.originalFilename);
await storage.putOrReuseApprovedObject({ approvedKey, inspected });
await markAvailable({ versionId, approvedKey, inspected });
```

`assertAssetContributor` permits an active administrator or a user returned by `SELECT 1 FROM webinar_presentations WHERE primary_owner_user_id = ? AND archived_at IS NULL LIMIT 1`; every catalog/upload route calls it before reading or mutating shared asset data. Before an archive transition, query both `webinar_asset_references` and `webinar_revision_asset_references`; any row blocks archive. Usage output separates current webinar/surface use from historical revision/version use but never returns stored source or revision snapshots. Use a conditional SQL update from `processing` so duplicate GuardDuty/EventBridge deliveries or repeated confirm calls are idempotent. Emit fixed safe operational names `webinar.asset_scan_pending`, `webinar.asset_scan_rejected`, `webinar.asset_inspection_rejected`, `webinar.asset_available`, and `webinar.asset_scanner_failure`; never log object keys, filenames, upload URLs, or source bytes. `listCatalog` returns family metadata and available/processing/rejected/archived version summaries with `publicUrl` only for available versions. Never return `s3_key`.

- [ ] **Step 4: Run focused and full tests**

```bash
npx vitest run tests/services/webinarAssets/catalog.test.js
npm test
```

Expected: all lifecycle, permission, reference-protection, idempotency, and existing tests pass.

- [ ] **Step 5: Commit the catalog lifecycle**

```bash
git add backend/services/webinarAssets/catalog.js backend/tests/services/webinarAssets/catalog.test.js
git commit -m "feat(webinars): manage shared asset versions"
```

### Task 5: Integrate asset references with every live revision transaction

**Files:**
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/services/webinarAssets/references.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/tests/services/webinarAssets/references.test.js`
- Modify: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/services/webinars/mutations.js`
- Modify: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/services/webinars/revisions.js`
- Modify: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/tests/services/webinars/mutations.test.js`
- Modify: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/tests/services/webinars/revisions.test.js`

**Interfaces:**
- Consumes: `collectSurfaceTokens(candidate)`, the transaction connection already owned by `mutations.js`, available version rows, and complete revision candidates.
- Produces: `validateAndReplaceReferences(connection, candidate): Promise<{urlsByVersionId: Map<string,string>,assetVersionIds: string[]}>` and `recordRevisionAssetReferences(connection, revisionId, assetVersionIds): Promise<void>`; webinar mutations validate/replace the complete live set before snapshot insertion, then record the immutable revision dependency set before commit.

- [ ] **Step 1: Write failing reference-integrity tests**

```js
await expect(validateAndReplaceReferences(connection, candidateWithMissingToken))
  .rejects.toMatchObject({ status: 422, code: 'ASSET_NOT_FOUND' });
await expect(validateAndReplaceReferences(connection, candidateWithProcessingToken))
  .rejects.toMatchObject({ status: 422, code: 'ASSET_NOT_AVAILABLE' });
await validateAndReplaceReferences(connection, candidateWithRepeatedToken);
expect(insertsFor(versionId, 'slide_html')).toHaveLength(1);
```

Assert a failed reference validation leaves normalized webinar rows, reference rows, live version, and revision rows unchanged. Assert restore validates all historical version IDs and rebuilds references to those exact versions.

```js
const revisionId = await insertRevision(connection, revision);
await recordRevisionAssetReferences(connection, revisionId, [versionId]);
expect(revisionReferenceInserts).toEqual([{ revisionId, assetVersionId: versionId }]);
await expect(archiveVersion({ versionId, actorUserId: 1, isAdmin: true }))
  .rejects.toMatchObject({ status: 409, code: 'ASSET_IN_USE_BY_REVISION' });
```

- [ ] **Step 2: Run focused mutation/reference tests and verify failure**

```bash
npx vitest run tests/services/webinarAssets/references.test.js tests/services/webinars/mutations.test.js
```

Expected: FAIL because references are not integrated and the foundation fallback rejects all tokens.

- [ ] **Step 3: Implement transaction-scoped reference replacement**

Select all unique version IDs in one parameterized `IN` query, require `status = 'available'` and no `archived_at`, then delete/reinsert only the affected webinar's live reference set on the same connection. Do not resolve URLs into stored source or revision snapshots; snapshots retain immutable tokens. After the revision row is inserted, insert one deduplicated `(revision_id, asset_version_id)` row per dependency on the same connection. Historical reference rows are append-only. Remove the foundation `ASSET_LIBRARY_NOT_READY` fallbacks and require both functions for create/save/add/duplicate/reorder/delete/restore.

```js
async function validateAndReplaceReferences(connection, candidate) {
  const references = collectSurfaceTokens(candidate);
  const ids = Array.from(new Set(references.map(reference => reference.assetVersionId)));
  const versions = ids.length ? await selectAvailableVersions(connection, ids) : [];
  if (versions.length !== ids.length) throw new AssetReferenceError('ASSET_VERSION_UNAVAILABLE');
  await replaceWebinarReferences(connection, candidate.webinarId, references);
  return {
    urlsByVersionId: new Map(versions.map(version => [version.id, makePublicUrl(config, version.approvedKey)])),
    assetVersionIds: ids.sort(),
  };
}

async function recordRevisionAssetReferences(connection, revisionId, assetVersionIds) {
  for (const assetVersionId of assetVersionIds) {
    await connection.query('INSERT INTO webinar_revision_asset_references (revision_id, asset_version_id) VALUES (?, ?)', [revisionId, assetVersionId]);
  }
}
```

- [ ] **Step 4: Run focused and full tests**

```bash
npx vitest run tests/services/webinarAssets/references.test.js tests/services/webinars/mutations.test.js
npm test
```

Expected: asset tokens save only when available, conflicts/validation roll back, and exact restored references pass.

- [ ] **Step 5: Commit reference integration**

```bash
git add backend/services/webinarAssets/references.js backend/tests/services/webinarAssets/references.test.js backend/services/webinars/mutations.js backend/services/webinars/revisions.js backend/tests/services/webinars/mutations.test.js backend/tests/services/webinars/revisions.test.js
git commit -m "feat(webinars): bind live revisions to asset versions"
```

### Task 6: Expose the authenticated asset API with constrained rate limits

**Files:**
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/validation/schemas/webinarAssets.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/routes/webinarAssets.js`
- Modify: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/server.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/tests/validation/webinarAssets.schema.test.js`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/tests/routes/webinarAssets.test.js`

**Interfaces:**
- Consumes: Cognito `authenticate`, `requireDbUser`, `requireActiveDbUser`, `requireNonExternal`, `getUserId`, `isAdmin`, catalog lifecycle, Zod.
- Produces: all `/api/webinar-assets` routes in the approved specification; a per-user limiter allowing 300 asset mutation requests per 15 minutes.

- [ ] **Step 1: Write failing route and schema tests**

Assert declared type/size/name inputs, UUID params, actor identity, 202 processing, 201 intent, 200 available/rejected, 403 archive denial, 409 referenced archive, and response redaction:

```js
const response = await request(ownerApp, 'POST', '/api/webinar-assets/upload-intents', {
  displayName: 'Closing timeline', filename: 'timeline.svg', contentType: 'image/svg+xml', byteSize: 4096,
});
expect(response.status).toBe(201);
expect(response.json).toEqual(expect.objectContaining({ assetId: expect.any(String), versionId: expect.any(String), uploadUrl: expect.stringMatching(/^https:/) }));
expect(JSON.stringify(response.json)).not.toMatch(/s3Key|quarantine/i);
```

- [ ] **Step 2: Run focused tests and verify missing-router failures**

```bash
npx vitest run tests/validation/webinarAssets.schema.test.js tests/routes/webinarAssets.test.js
```

Expected: FAIL because schemas and router are missing.

- [ ] **Step 3: Implement thin routes and an identity-keyed limiter**

Mount only after authentication:

```js
app.use('/api/webinar-assets', authenticate, requireDbUser, requireActiveDbUser, requireNonExternal, webinarAssetWriteLimiter, webinarAssetsRoutes);
```

The limiter skips GET/HEAD/OPTIONS and keys on `req.user.db.id`. Route responses never include S3 keys, scan infrastructure, or raw inspection errors. Confirm returns `202` while the scan tag is absent and `200` for terminal available/rejected results.

- [ ] **Step 4: Run focused, full, and lint gates**

```bash
npx vitest run tests/validation/webinarAssets.schema.test.js tests/routes/webinarAssets.test.js
npm test
npm run lint
```

Expected: all tests pass; lint reports no new errors.

- [ ] **Step 5: Commit the asset API**

```bash
git add backend/validation/schemas/webinarAssets.js backend/routes/webinarAssets.js backend/server.js backend/tests/validation/webinarAssets.schema.test.js backend/tests/routes/webinarAssets.test.js
git commit -m "feat(webinars): expose shared asset catalog API"
```

### Task 7: Document and verify infrastructure without provisioning production

**Files:**
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/docs/webinar-studio/assets-runbook.md`
- Create: `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/backend/tests/integration/webinarAssets.integration.test.js`

**Interfaces:**
- Consumes: a disposable bucket or LocalStack for S3 behavior; production prerequisites from AWS GuardDuty documentation.
- Produces: an operator checklist that resolves real resource identifiers at execution time and proves the application remains fail-closed until the scanner and CDN are ready.

- [ ] **Step 1: Write a gated asset integration test**

Skip unless `WEBINAR_ASSET_TEST_BUCKET` and `WEBINAR_ASSET_TEST_CDN_BASE_URL` exist. Upload a safe fixture to quarantine, verify missing scan tag returns processing, set a test-only `NO_THREATS_FOUND` tag in the disposable bucket, confirm, and assert the approved key is content-addressed and catalog output contains only the CDN URL. Add a malicious-tag fixture and assert it never reaches approved storage.

```js
const describeAssetIntegration = process.env.WEBINAR_ASSET_TEST_BUCKET && process.env.WEBINAR_ASSET_TEST_CDN_BASE_URL
  ? describe
  : describe.skip;

describeAssetIntegration('webinar asset release', () => {
  it('releases only explicitly clean objects', async () => {
    const version = await uploadFixture('safe.png');
    await expect(catalog.confirm(version.id)).resolves.toMatchObject({ status: 'processing' });
    await tagFixture(version, 'NO_THREATS_FOUND');
    await expect(catalog.confirm(version.id)).resolves.toMatchObject({ status: 'available', url: expect.stringContaining('/approved/sha256/') });
  });
});
```

- [ ] **Step 2: Write the exact runbook gates**

The runbook must require operators to verify:

1. a private bucket/prefix protected before upload by an active GuardDuty Malware Protection for S3 plan;
2. managed tagging enabled with key `GuardDutyMalwareScanStatus`;
3. bucket policy denying non-GuardDuty principals from overwriting that tag and denying reads of non-clean quarantine objects;
4. CloudFront origin access control serving only `approved/`;
5. immutable cache headers, byte-range support, MIME preservation, image/media CORS, and font CORS;
6. backend role permissions limited to presign quarantine writes, scan-tag reads, quarantine reads, and approved writes;
7. `WEBINAR_ASSET_BUCKET` and `WEBINAR_ASSET_CDN_BASE_URL` configured only after the above checks pass; and
8. rollback by disabling upload routes and audience references without deleting stored versions.

Include the exact read-only verification commands `aws guardduty list-malware-protection-plans`, `aws s3api get-bucket-policy`, `aws s3api get-object-tagging`, `aws cloudfront get-distribution-config`, and `curl -I` against an approved test object, but require resolved, explicitly reviewed IDs rather than shell globs or broad variables.

- [ ] **Step 3: Run unit gates and the disposable integration when configured**

```bash
npm test
npx vitest run --config vitest.webinar-integration.config.js tests/integration/webinarAssets.integration.test.js
```

Expected: unit tests pass; the integration test either passes against the explicitly configured disposable resources or reports a deliberate skip. No production resource is modified.

- [ ] **Step 4: Record current evidence and unresolved operational approval**

Add exact test counts and commit SHAs to the runbook. Mark production GuardDuty/S3/CloudFront provisioning and production migration 092 as not performed pending approval.

- [ ] **Step 5: Commit package verification**

```bash
git add docs/webinar-studio/assets-runbook.md backend/tests/integration/webinarAssets.integration.test.js
git commit -m "docs(webinars): add asset release runbook"
```

## Package Exit Gate

Before the renderer package begins, review that:

- all accepted/rejected media cases and permission rules pass;
- no missing or unsafe scan state can become available;
- no API response leaks S3 keys or quarantine details;
- every saved/restored asset token resolves to an immutable available version;
- referenced versions cannot be archived;
- production asset infrastructure and migration remain unperformed until separately approved.
