import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { LOCAL_ASSET_TOKEN } from './assets.mjs';
import { uuidv5 } from './uuid.mjs';

/* The production resource policy. An import must be validated under the same
   origins the server uses, because the policy is frozen into each revision. */
export const PRODUCTION_POLICY_ENV = Object.freeze({
  WEBINAR_ASSET_CDN_BASE_URL: 'https://webinar-assets.msfgco.com',
  WEBINAR_EXTERNAL_STYLE_ORIGINS: 'https://fonts.googleapis.com',
  WEBINAR_EXTERNAL_FONT_ORIGINS: 'https://fonts.gstatic.com',
});

/* Local tokens stand in for asset versions that do not exist until upload.
   For validation each becomes a well-formed Studio token with a stable id. */
export function withPlaceholderAssetTokens(source) {
  return String(source).replace(LOCAL_ASSET_TOKEN, (_token, key) => `{{ASSET:${uuidv5(`local-asset:${key}`)}}}`);
}

export function loadDashboardPolicy(dashboardRoot) {
  const file = path.join(dashboardRoot, 'backend', 'services', 'webinars', 'contentPolicy.js');
  if (!fs.existsSync(file)) throw new Error(`Dashboard content policy not found at ${file}`);
  return createRequire(file)(file);
}

/* Runs the Dashboard's own admission checks, the same sequence its save path
   uses, and returns every issue instead of stopping at the first. */
export function validateBundle(bundle, dashboardRoot, env = PRODUCTION_POLICY_ENV) {
  const policyModule = loadDashboardPolicy(dashboardRoot);
  const policy = policyModule.loadResourcePolicy(env);
  const issues = [];
  const add = (where, result) => result.issues.forEach(found => issues.push({ where, ...found }));

  const candidate = {
    masterHtml: withPlaceholderAssetTokens(bundle.master.html),
    masterCss: withPlaceholderAssetTokens(bundle.master.css),
    slides: bundle.slides.map(slide => ({
      anchor: slide.anchor,
      targetSeconds: slide.targetSeconds,
      html: withPlaceholderAssetTokens(slide.html),
      css: withPlaceholderAssetTokens(slide.css),
      javascript: withPlaceholderAssetTokens(slide.javascript),
    })),
  };

  add('master', policyModule.validateMasterHtml(candidate.masterHtml, policy));
  add('master', policyModule.validateCss(candidate.masterCss, 'master_css', policy));
  for (const slide of candidate.slides) {
    add(slide.anchor, policyModule.validateAnchor(slide.anchor));
    add(slide.anchor, policyModule.validateSlideHtml(slide.html, policy));
    add(slide.anchor, policyModule.validateCss(slide.css, 'slide_css', policy));
    add(slide.anchor, policyModule.validateJavascript(slide.javascript));
    if (!Number.isInteger(slide.targetSeconds) || slide.targetSeconds < 0 || slide.targetSeconds > 7200) {
      issues.push({ where: slide.anchor, code: 'TARGET_SECONDS_RANGE', surface: 'target_seconds' });
    }
  }
  try {
    policyModule.assertCandidateWithinLimits(candidate, policy);
  } catch (error) {
    (error.issues || [{ code: error.code }]).forEach(found => issues.push({ where: 'limits', ...found }));
  }

  for (const slide of bundle.slides) {
    if (Buffer.byteLength(slide.speakerNotes, 'utf8') > policyModule.LIMITS.speaker_notes) {
      issues.push({ where: slide.anchor, code: 'CONTENT_LIMIT_EXCEEDED', surface: 'speaker_notes' });
    }
    if (!slide.title.trim() || slide.title.length > 255) {
      issues.push({ where: slide.anchor, code: 'TITLE_INVALID', surface: 'title' });
    }
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(bundle.webinar.slug) || bundle.webinar.slug.length > 190) {
    issues.push({ where: 'webinar', code: 'SLUG_INVALID', surface: 'slug' });
  }
  return issues;
}
