import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { HOTSPOTS } from '../content/index.js';

const fixtureUrl = new URL('./fixtures/hotspot-fidelity.json', import.meta.url);

test('every hotspot matches the independently locked semantic and geometry fixture', async () => {
  const expected = JSON.parse(await readFile(fixtureUrl, 'utf8'));
  const actual = HOTSPOTS.map(hotspot => ({
    pageId: hotspot.pageId,
    id: hotspot.id,
    fieldLabel: hotspot.fieldLabel,
    value: hotspot.value,
    explanationId: hotspot.explanationId,
    bounds: hotspot.bounds,
  }));

  assert.equal(expected.length, 502);
  assert.deepEqual(actual, expected);
});
