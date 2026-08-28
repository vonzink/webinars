import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const webinarRoot = new URL('../', import.meta.url);

test('the render script reproduces all eight committed PNG bytes', async t => {
  const fixtureRoot = await mkdtemp(join(tmpdir(), 'le-cd-render-'));
  t.after(() => rm(fixtureRoot, { recursive: true, force: true }));
  await mkdir(join(fixtureRoot, 'references'), { recursive: true });
  await mkdir(join(fixtureRoot, 'scripts'), { recursive: true });
  await copyFile(new URL('references/loan-estimate-H24B.pdf', webinarRoot), join(fixtureRoot, 'references/loan-estimate-H24B.pdf'));
  await copyFile(new URL('references/closing-disclosure-H25B.pdf', webinarRoot), join(fixtureRoot, 'references/closing-disclosure-H25B.pdf'));
  await copyFile(new URL('scripts/render-disclosures.sh', webinarRoot), join(fixtureRoot, 'scripts/render-disclosures.sh'));

  const rendered = spawnSync('bash', [join(fixtureRoot, 'scripts/render-disclosures.sh')], {
    encoding: 'utf8',
  });
  assert.equal(rendered.status, 0, rendered.stderr || rendered.stdout);

  for (const [prefix, count] of [['le', 3], ['cd', 5]]) {
    for (let page = 1; page <= count; page += 1) {
      const filename = `${prefix}-page-${page}.png`;
      const actual = await readFile(join(fixtureRoot, 'assets/documents', filename));
      const expected = await readFile(new URL(`assets/documents/${filename}`, webinarRoot));
      assert.deepEqual(actual, expected, filename);
    }
  }
});
