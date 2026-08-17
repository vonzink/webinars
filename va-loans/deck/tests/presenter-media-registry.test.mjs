import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { SLIDES } from '../content/slides.js';

const validSlideIds = new Set(SLIDES.map(slide => slide.id));

test('every registered graph belongs to a real VA slide and resolves to a local PNG', async () => {
  const registry = await import('../content/presenter-media.js').catch(() => null);
  assert.ok(registry, 'presenter media registry must exist');
  for (const item of registry.PRESENTER_MEDIA) {
    assert.ok(validSlideIds.has(item.slideId), `${item.id} has an unknown slide '${item.slideId}'`);
    assert.ok(item.alt.length >= 20, `${item.id} needs descriptive alt text`);
    const assetUrl = new URL(`../${item.src.replace('./', '')}`, import.meta.url);
    assert.ok(existsSync(fileURLToPath(assetUrl)), `${item.src} must exist`);
    assert.equal(registry.mediaById(item.id), item);
  }
  assert.equal(registry.mediaById('unknown'), null);
  assert.deepEqual(registry.mediaForSlide('not-a-slide'), []);
});

test('presenter labels registered media as graphics in the shared action library', () => {
  const source = readFileSync(new URL('../presenter.html', import.meta.url), 'utf8');
  assert.match(source, /Graphics \(<span id="p-media-count">0<\/span>\)/);
  assert.doesNotMatch(source, /Slide 2 graphs|Optional visuals/);
});
