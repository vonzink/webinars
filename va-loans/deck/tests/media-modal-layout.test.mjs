import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../css/components.css', import.meta.url), 'utf8');

test('media modal allocates a bounded flex box so portrait and landscape images can contain after resize', () => {
  const mediaBody = css.match(/\.modal--media \.modal-body\s*\{([^}]*)\}/)?.[1] || '';
  const mediaFrame = css.match(/\.modal-media-frame\s*\{([^}]*)\}/)?.[1] || '';
  const mediaImage = css.match(/\.modal-media-frame img\s*\{([^}]*)\}/)?.[1] || '';

  assert.match(mediaBody, /flex:\s*1\s+1\s+0/,
    'the media body needs a definite flex-basis so it cannot expand to portrait content');
  assert.match(mediaFrame, /min-height:\s*0/,
    'the media frame must be allowed to shrink to the body height after a resize');
  assert.match(mediaFrame, /max-height:\s*100%/,
    'the media frame must not exceed the body height');
  assert.match(mediaFrame, /position:\s*absolute/,
    'the media frame needs a definite containing block rather than an unresolved grid percentage height');
  assert.match(mediaFrame, /inset:\s*24px/,
    'the media frame must stay within the media body padding on every resize');
  assert.match(mediaImage, /[\s;]width:\s*auto/,
    'the image box must retain its intrinsic aspect ratio instead of stretching to the frame width');
  assert.match(mediaImage, /[\s;]height:\s*auto/,
    'the image box must retain its intrinsic aspect ratio instead of stretching to the frame height');
  assert.match(mediaImage, /position:\s*absolute/,
    'the image must size against the definite media frame rather than grid intrinsic dimensions');
  assert.match(mediaImage, /inset:\s*0/,
    'the image box must be pinned to every edge of the bounded media frame');
  assert.match(mediaImage, /margin:\s*auto/,
    'the constrained image must stay centered within the media frame');
  assert.match(mediaImage, /max-width:\s*100%/,
    'the image must remain within the available media width');
  assert.match(mediaImage, /max-height:\s*100%/,
    'the image must remain within the available media height');
  assert.match(mediaImage, /object-fit:\s*contain/,
    'the image must preserve its intrinsic aspect ratio while contained');
});
