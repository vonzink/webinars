import assert from 'node:assert/strict';
import test from 'node:test';

import {
  BundleLoadError,
  createBundleLoader,
} from '../js/studio/bundle-loader.js';

const SLIDE_ID = '11111111-1111-4111-8111-111111111111';
const ASSET_ID = '22222222-2222-4222-8222-222222222222';

function liveBundle(overrides = {}) {
  return {
    schemaVersion: 1,
    webinar: {
      id: 12,
      slug: 'first-home-without-mystery',
      title: 'Your first home, without the mystery.',
      liveVersion: 8,
    },
    master: {
      html: '<main>{{SLIDE_CONTENT}}</main>',
      css: ':root{--green:#8cc63e}',
    },
    slides: [{
      id: SLIDE_ID,
      position: 0,
      anchor: 'opening',
      title: 'Opening',
      html: `<img src="{{ASSET:${ASSET_ID}}}" alt="">`,
      css: '',
      javascript: '',
    }],
    assets: {
      [ASSET_ID]: `https://assets.example/approved/${'a'.repeat(64)}/image.png`,
    },
    resourcePolicy: {
      assetOrigin: 'https://assets.example',
      stylesheetOrigins: ['https://fonts.example'],
      fontOrigins: ['https://fonts.example'],
    },
    ...overrides,
  };
}

function responseFor(bundle, {
  status = 200,
  contentType = 'application/json; charset=utf-8',
  etag = `"${'a'.repeat(64)}"`,
} = {}) {
  let textReads = 0;
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: {
      get(name) {
        if (name.toLowerCase() === 'content-type') return contentType;
        if (name.toLowerCase() === 'etag') return etag;
        return null;
      },
    },
    async json() { return bundle; },
    async text() {
      textReads += 1;
      return 'PRIVATE RESPONSE BODY';
    },
    get textReads() { return textReads; },
  };
}

function expectSafeLoadError(error, code) {
  assert.ok(error instanceof BundleLoadError);
  assert.equal(error.name, 'BundleLoadError');
  assert.equal(error.message, 'Unable to load webinar');
  assert.equal(error.code, code);
  assert.doesNotMatch(String(error), /PRIVATE|first-home|opening|assets\.example/i);
  return true;
}

test('pins the first validated bundle and performs exactly one fetch per loader instance', async () => {
  const serverBundle = liveBundle();
  const calls = [];
  const response = responseFor(serverBundle);
  const loader = createBundleLoader({
    apiBase: 'https://dashboard.example/',
    fetchImpl: async (...args) => {
      calls.push(args);
      return response;
    },
  });

  const first = await loader.loadOnce('first-home-without-mystery');
  serverBundle.webinar.liveVersion = 9;
  const second = await loader.loadOnce('first-home-without-mystery');

  assert.equal(second, first);
  assert.equal(first.webinar.liveVersion, 8);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'https://dashboard.example/api/public/webinars/first-home-without-mystery/live');
  assert.deepEqual(calls[0][1], {
    credentials: 'omit',
    headers: { Accept: 'application/json' },
    method: 'GET',
    mode: 'cors',
    redirect: 'error',
  });
  assert.equal(response.textReads, 0);
});
test('concurrent callers share one pending request and a loader pins only one slug', async () => {
  let resolveFetch;
  let calls = 0;
  const loader = createBundleLoader({
    apiBase: 'https://dashboard.example',
    fetchImpl: () => {
      calls += 1;
      return new Promise(resolve => { resolveFetch = resolve; });
    },
  });

  const first = loader.loadOnce('first-home-without-mystery');
  const second = loader.loadOnce('first-home-without-mystery');
  await assert.rejects(
    loader.loadOnce('another-webinar'),
    error => expectSafeLoadError(error, 'BUNDLE_SESSION_SLUG_MISMATCH'),
  );
  resolveFetch(responseFor(liveBundle()));

  assert.equal(await first, await second);
  assert.equal(calls, 1);
});

test('a failed initial load stays failed until explicit resetForTest or a new loader', async () => {
  const responses = [responseFor({}, { status: 503 }), responseFor(liveBundle())];
  let calls = 0;
  const loader = createBundleLoader({
    apiBase: 'https://dashboard.example',
    fetchImpl: async () => responses[calls++],
  });

  await assert.rejects(loader.loadOnce('first-home-without-mystery'), error => (
    expectSafeLoadError(error, 'BUNDLE_HTTP_ERROR')
  ));
  await assert.rejects(loader.loadOnce('first-home-without-mystery'), error => (
    expectSafeLoadError(error, 'BUNDLE_HTTP_ERROR')
  ));
  assert.equal(calls, 1);
  assert.equal(responses[0].textReads, 0);

  loader.resetForTest();
  assert.equal((await loader.loadOnce('first-home-without-mystery')).webinar.liveVersion, 8);
  assert.equal(calls, 2);
});

test('rejects invalid status, content type, JSON, slug, and schema with fixed safe errors', async () => {
  const cases = [
    [responseFor(liveBundle(), { status: 304 }), 'BUNDLE_HTTP_ERROR'],
    [responseFor(liveBundle(), { contentType: 'text/html' }), 'BUNDLE_CONTENT_TYPE_INVALID'],
    [{ ...responseFor(liveBundle()), json: async () => { throw new SyntaxError('PRIVATE'); } }, 'BUNDLE_JSON_INVALID'],
    [responseFor(liveBundle({ schemaVersion: 2 })), 'BUNDLE_SCHEMA_INVALID'],
    [responseFor(liveBundle({ slides: [] })), 'BUNDLE_SCHEMA_INVALID'],
    [responseFor(liveBundle({ master: { html: '<main></main>', css: '' } })), 'BUNDLE_SCHEMA_INVALID'],
    [responseFor(liveBundle({ slides: [
      { ...liveBundle().slides[0], position: 1 },
    ] })), 'BUNDLE_SCHEMA_INVALID'],
  ];

  for (const [response, code] of cases) {
    const loader = createBundleLoader({
      apiBase: 'https://dashboard.example',
      fetchImpl: async () => response,
    });
    await assert.rejects(loader.loadOnce('first-home-without-mystery'), error => (
      expectSafeLoadError(error, code)
    ));
    assert.equal(response.textReads, 0);
  }

  const loader = createBundleLoader({
    apiBase: 'https://dashboard.example',
    fetchImpl: async () => assert.fail('invalid slug must not fetch'),
  });
  await assert.rejects(loader.loadOnce('../private'), error => (
    expectSafeLoadError(error, 'BUNDLE_SLUG_INVALID')
  ));
});

test('matches the server 190-character slug and anchor boundary', async () => {
  for (const length of [129, 190]) {
    const identifier = 'a'.repeat(length);
    const bundle = liveBundle({
      webinar: { ...liveBundle().webinar, slug: identifier },
      slides: [{ ...liveBundle().slides[0], anchor: identifier }],
    });
    const loader = createBundleLoader({
      apiBase: 'https://dashboard.example',
      fetchImpl: async () => responseFor(bundle),
    });

    const loaded = await loader.loadOnce(identifier);
    assert.equal(loaded.webinar.slug.length, length);
    assert.equal(loaded.slides[0].anchor.length, length);
  }

  const overlongSlugLoader = createBundleLoader({
    apiBase: 'https://dashboard.example',
    fetchImpl: async () => assert.fail('an overlong slug must not fetch'),
  });
  await assert.rejects(overlongSlugLoader.loadOnce('a'.repeat(191)), error => (
    expectSafeLoadError(error, 'BUNDLE_SLUG_INVALID')
  ));

  const overlongAnchorLoader = createBundleLoader({
    apiBase: 'https://dashboard.example',
    fetchImpl: async () => responseFor(liveBundle({
      slides: [{ ...liveBundle().slides[0], anchor: 'a'.repeat(191) }],
    })),
  });
  await assert.rejects(
    overlongAnchorLoader.loadOnce('first-home-without-mystery'),
    error => expectSafeLoadError(error, 'BUNDLE_SCHEMA_INVALID'),
  );
});

test('rejects duplicate identities, non-contiguous order, bad assets, and policy mismatches', async () => {
  const base = liveBundle();
  const secondSlide = {
    ...base.slides[0],
    position: 1,
    anchor: 'second',
  };
  const variants = [
    liveBundle({ slides: [base.slides[0], secondSlide] }),
    liveBundle({
      assets: { [ASSET_ID]: 'http://assets.example/insecure.png' },
    }),
    liveBundle({
      resourcePolicy: { ...base.resourcePolicy, assetOrigin: 'https://other.example' },
    }),
    liveBundle({
      slides: [{ ...base.slides[0], html: '{{ASSET:33333333-3333-4333-8333-333333333333}}' }],
    }),
  ];

  for (const variant of variants) {
    const loader = createBundleLoader({
      apiBase: 'https://dashboard.example',
      fetchImpl: async () => responseFor(variant),
    });
    await assert.rejects(loader.loadOnce('first-home-without-mystery'), error => (
      expectSafeLoadError(error, 'BUNDLE_SCHEMA_INVALID')
    ));
  }
});
