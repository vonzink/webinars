import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assetKey, normalizeDeckPath, tokensIn } from '../lib/assets.mjs';
import { canonicalJson } from '../lib/canonical-json.mjs';
import { decodeCssStringEscapes, rewriteCssUrls } from '../lib/css.mjs';
import { slideId, uuidv5 } from '../lib/uuid.mjs';

test('uuidv5 matches the published reference vector', () => {
  const DNS_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
  assert.equal(uuidv5('python.org', DNS_NAMESPACE), '886313e1-3b8a-5372-9b90-0c9aee199e5d');
});

test('slide ids are stable per webinar and anchor', () => {
  const id = slideId('first-home-without-mystery', 'opening');
  assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.equal(id, slideId('first-home-without-mystery', 'opening'));
  assert.notEqual(id, slideId('va', 'opening'));
});

test('canonical JSON sorts keys and ends with one newline', () => {
  assert.equal(canonicalJson({ b: 1, a: [{ d: 1, c: 2 }] }), '{\n  "a": [\n    {\n      "c": 2,\n      "d": 1\n    }\n  ],\n  "b": 1\n}\n');
});

test('CSS string escapes become literal characters', () => {
  assert.equal(decodeCssStringEscapes('a::before { content: "\\2013"; }'), 'a::before { content: "–"; }');
  assert.equal(decodeCssStringEscapes("a::after { content: '\\2713 ok'; }"), "a::after { content: '✓ok'; }");
});

test('CSS comments are left alone, apostrophes included', () => {
  const css = "/* don't touch \\2013 url(./x.png) */\na { color: red; }";
  assert.equal(decodeCssStringEscapes(css), css);
  assert.equal(rewriteCssUrls(css, () => 'CHANGED'), css);
});

test('an escape that would need re-escaping is kept for the policy check to report', () => {
  assert.equal(decodeCssStringEscapes('a { content: "\\22"; }'), 'a { content: "\\22"; }');
});

test('local CSS urls are rewritten and external ones are not', () => {
  const css = 'a{background:url("../assets/a b.png")} b{background:url(https://x.test/y.png)} c{fill:url(#g)}';
  const seen = [];
  const out = rewriteCssUrls(css, reference => { seen.push(reference); return '{{LOCAL_ASSET:a-b-png}}'; });
  assert.deepEqual(seen, ['../assets/a b.png']);
  assert.equal(out, 'a{background:url({{LOCAL_ASSET:a-b-png}})} b{background:url(https://x.test/y.png)} c{fill:url(#g)}');
});

test('asset keys are lowercase slugs of the path under assets/', () => {
  assert.equal(assetKey('assets/brand/EQUAL HOUSING LENDER.png'), 'brand-equal-housing-lender-png');
  assert.equal(assetKey('./assets/portraits/seth-angell.png'), 'portraits-seth-angell-png');
});

test('deck paths are decoded and may not leave the deck', () => {
  assert.equal(normalizeDeckPath('./assets/brand/EQUAL%20HOUSING%20LENDER.png'), 'assets/brand/EQUAL HOUSING LENDER.png');
  assert.equal(normalizeDeckPath('../secrets.png'), null);
  assert.equal(normalizeDeckPath('/etc/passwd'), null);
});

test('local asset tokens are found in any source', () => {
  assert.deepEqual(tokensIn('<img src="{{LOCAL_ASSET:a-png}}"> url({{LOCAL_ASSET:b-svg}})'), ['a-png', 'b-svg']);
});
