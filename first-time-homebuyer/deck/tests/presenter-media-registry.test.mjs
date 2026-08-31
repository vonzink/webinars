import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { SLIDES } from '../content/slides.js';

const expectedSlide2 = [
  ['fha-buyers', 'FHA Buyers', './assets/presenter/slide-02/fha-buyers.png'],
  ['down-payment-ranges', 'Down Payment Ranges', './assets/presenter/slide-02/down-payment-ranges.png'],
  ['credit-score', 'Credit Scores', './assets/presenter/slide-02/credit-score.png'],
  ['rent-vs-buy', 'Rent vs. Buy', './assets/presenter/slide-02/rent-vs-buy.png'],
  ['lowest-rate', 'The Lowest Rate', './assets/presenter/slide-02/lowest-rate.png'],
];

const expectedSlide3 = [
  ['denver-rent-trends', 'Denver Rent Trends', './assets/presenter/slide-03/denver-rent-trends.png'],
  ['renting-vs-buying-wealth', 'Renting vs. Buying Wealth', './assets/presenter/slide-03/renting-vs-buying-wealth.png'],
];

const expectedSlide5 = [
  ['budget-smart', 'Budget Smart', './assets/presenter/slide-05/budget-smart.png'],
  ['debt-to-income', 'Debt-to-Income (DTI)', './assets/presenter/slide-05/debt-to-income.png'],
];

const expectedSlide5Assets = [
  {
    src: './assets/presenter/slide-05/budget-smart.png',
    sha256: '0128267ab6f1be348598dc10726280f9527a72f8f4bce57d4905ff0857ef09f7',
    width: 1536,
    height: 1024,
  },
  {
    src: './assets/presenter/slide-05/debt-to-income.png',
    sha256: '6936b636540652a68dcb9edca99c6cf573ffa2f40c1d009e06d6e19bb5e62dcf',
    width: 1122,
    height: 1402,
  },
];

test('Slide 2 keeps its five graphs, Slide 3 exposes its two approved graphs, and Slide 5 owns both budget visuals', async () => {
  const registry = await import('../content/presenter-media.js').catch(() => null);
  assert.ok(registry, 'presenter media registry must exist');
  const project = items => items.map(({ id, title, src }) => [id, title, src]);
  assert.deepEqual(project(registry.mediaForSlide('myths')), expectedSlide2);
  assert.deepEqual(project(registry.mediaForSlide('budget-rent-buy')), expectedSlide3);
  assert.deepEqual(project(registry.mediaForSlide('budget-comfort')), expectedSlide5);
  assert.deepEqual(registry.mediaForSlide('opening'), []);
});

test('every registered graph resolves to a copied local PNG', async () => {
  const registry = await import('../content/presenter-media.js').catch(() => null);
  assert.ok(registry, 'presenter media registry must exist');
  for (const item of registry.PRESENTER_MEDIA) {
    assert.ok(SLIDES.some(slide => slide.id === item.slideId), `${item.id} has an unknown slide '${item.slideId}'`);
    assert.ok(item.alt.length >= 20, `${item.id} needs descriptive alt text`);
    const assetUrl = new URL(`../${item.src.replace('./', '')}`, import.meta.url);
    assert.ok(existsSync(fileURLToPath(assetUrl)), `${item.src} must exist`);
    assert.equal(registry.mediaById(item.id), item);
  }
  assert.equal(registry.mediaById('unknown'), null);
});

test('Slide 5 copied visuals retain their approved PNG bytes and dimensions', () => {
  for (const expected of expectedSlide5Assets) {
    const assetUrl = new URL(`../${expected.src.replace('./', '')}`, import.meta.url);
    const bytes = readFileSync(fileURLToPath(assetUrl));
    assert.deepEqual(bytes.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), `${expected.src} must have a PNG signature`);
    assert.equal(bytes.toString('ascii', 12, 16), 'IHDR', `${expected.src} must contain IHDR first`);
    assert.equal(bytes.readUInt32BE(16), expected.width, `${expected.src} width must match approval`);
    assert.equal(bytes.readUInt32BE(20), expected.height, `${expected.src} height must match approval`);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), expected.sha256, `${expected.src} SHA-256 must match approval`);
  }
});

test('presenter labels registered media as graphics in the shared action library', () => {
  const source = readFileSync(new URL('../presenter.html', import.meta.url), 'utf8');
  assert.match(source, /Graphics \(<span id="p-media-count">0<\/span>\)/);
  assert.doesNotMatch(source, /Slide 2 graphs|Optional visuals/);
});
