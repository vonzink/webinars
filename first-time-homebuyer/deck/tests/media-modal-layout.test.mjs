import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../css/components.css', import.meta.url), 'utf8');

test('media image and compact toolbar form one fixed scaled composition', () => {
  const toolbar = css.match(/\.modal--media \.modal-head\s*\{([^}]*)\}/)?.[1] || '';
  const body = css.match(/\.modal--media \.modal-body\s*\{([^}]*)\}/)?.[1] || '';
  const image = css.match(/\.modal-media-frame img\s*\{([^}]*)\}/)?.[1] || '';
  assert.match(toolbar, /height:\s*52px/);
  assert.match(toolbar, /padding:\s*8px 64px 8px 18px/);
  assert.match(body, /overflow:\s*hidden/);
  assert.match(image, /width:\s*100%/);
  assert.match(image, /height:\s*100%/);
  assert.match(image, /object-fit:\s*contain/);
  assert.doesNotMatch(css, /\.modal--media[^}]*\b(?:max-height|\d+vh)/s);
  assert.doesNotMatch(css, /\.modal--media[\s\S]*?overflow(?:-x|-y)?:\s*(?:auto|scroll)/);
});
