# Webinar Studio Deployment Hardening Plan

**Spec:** `/Users/zacharyzink/MSFG/Webinars/docs/superpowers/specs/2026-09-03-webinar-studio-design.md`

## Objective

Close the three load-bearing findings that block a backend-only Webinar Studio Foundation deployment: credential-safe request URL logging, production-compatible fail-closed migration execution, and collision-free Studio migration numbering. Preserve current Dashboard and Plaud behavior.

## Global Constraints

- Work only in `/Users/zacharyzink/MSFG/WebProjects/dashboard.msfgco.com/.worktrees/webinar-studio` on `codex/webinar-studio`.
- Begin from clean commit `b63f0db5de96bea2b83cebea38e4537a8a675e1c`, which already contains current `origin/main` at `49cb9e4b982215c943d5f28e2c7da68fbe7df5fb`.
- Do not change Plaud source, tests, or migration content.
- Do not modify applied historical migration files. Correct the runner and rename only the unperformed Webinar Studio migrations.
- Do not push, merge to a shared branch, deploy, migrate production, change AWS, touch DNS, cut over public routes, or use production credentials.
- Preserve unrelated dirty and untracked files.
- Tests may use only a uniquely named disposable local MySQL container/database and must remove the container, free the port, and remove temporary secrets even after setup or startup failure.
- Never place real or synthetic credential values in committed verification documentation.
- The accepted repository baseline under `TZ=UTC` is exactly two pre-existing Calendar UI failures; no new failure identity or count is allowed.

## Task 1: Make production logging and migrations deployment-safe

**Owned production surfaces:**

- `backend/lib/httpLogging.js`
- `backend/db/migrations.js`
- the three unperformed Webinar Studio migration files and their collision-free replacements
- related Foundation tests and `docs/webinar-studio/foundation-verification.md`

**Requirements:**

1. Request logging must never serialize raw query strings. Log the pathname and safe structural request metadata only; omit all query parameters rather than maintaining a credential-name denylist. Continue redacting or omitting `authorization`, `cookie`, and response `set-cookie`. Add canary regressions for `api_key`, `token`, OAuth `code`, OAuth `state`, mixed-case names, encoded values, duplicate parameters, and safe-looking query parameters so no query value reaches serialized logs.
2. Rework SQL statement parsing so delimiters inside `--` comments, `#` comments, `/* ... */` comments, quoted strings, escaped quotes, and backtick identifiers never split statements or become executable fragments. Reject unterminated quotes/comments with a stable migration error. Do not add a general SQL error swallow.
3. Keep migration execution fail closed. Admit only exact MySQL idempotency error codes paired with the exact statement form that makes the error expected. Include the historical standalone `CREATE INDEX` rerun form. Unexpected parse, permission, connection, duplicate-data, or malformed-schema errors must abort startup.
4. Exercise the actual production `runMigrations` entry point against the complete real migration directory on a disposable MySQL 8 database for a fresh run and immediate rerun. The test must prove the runner reaches Webinar Studio postflight both times. Add focused parser/context tests for every historical comment/statement pattern that caused or could cause the regression.
5. Resolve migration numbering against current `origin/main`, whose latest migration is `091_plaud_recordings.sql`. Because no Studio migration has been deployed, rename the Studio sequence without compatibility shims to:
   - `092_webinar_studio_foundation.sql`
   - `093_webinar_active_slide_anchors.sql`
   - `094_users_is_active.sql`
   Update all tests, documentation, and verification commands. Assert migration ordinals are unique across the full directory and that no old Studio `091`/`092`/`093` filenames remain.
6. Harden the disposable-container lifecycle so cleanup attempts removal whenever container creation may have occurred, including create-then-start failure. Use a unique validated container name and idempotent cleanup. Prove cleanup behavior with a failure-path regression or a deterministic helper test.
7. Regenerate a complete scoped review artifact for this task and ensure committed verification claims match the actual commands and results.

**Required verification:**

- Focused logging tests.
- Focused migration parser, exact idempotency, schema-postflight, ordinal-collision, and cleanup tests.
- Full real migration corpus, fresh and rerun, on disposable MySQL 8.
- Existing Webinar Studio disposable integration 5/5.
- No-database integration skip behavior.
- Focused Foundation suite.
- `TZ=UTC npm test`, with only the two accepted Calendar failures.
- Focused production lint and `git diff --check`.
- Clean worktree and no remaining disposable container, bound test port, or temporary secret directory.

**Commit/report:**

- Commit only the owned implementation, tests, renamed migration files, and verification documentation.
- Write the full implementation report to the SDD workspace and return only status, commit hashes, concise test results, and concerns.

## Exit Gate

An independent reviewer must approve both spec compliance and code quality, including the real full-corpus fresh/rerun evidence. Any Critical or Important finding enters the normal task fix loop. Production remains blocked until the task review is clean.
