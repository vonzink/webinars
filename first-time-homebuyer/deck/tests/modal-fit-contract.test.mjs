import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('educational popouts measure at authored width and use the shared controller', async () => {
  const [source, css] = await Promise.all([read('js/modal.js'), read('css/components.css')]);
  assert.match(source, /from '\.\/surface-fit\.js'/);
  assert.match(source, /CONTENT_WIDTH\s*=\s*1200/);
  assert.match(source, /WIDE_CONTENT_WIDTH\s*=\s*1500/);
  assert.match(source, /document\.fonts\.ready/);
  assert.match(source, /surface\.scrollHeight/);
  assert.match(source, /createSurfaceController\(/);
  assert.match(source, /data-fit-shell/);
  assert.match(source, /data-fit-surface/);
  assert.match(css, /\.modal\s*\{[^}]*transform-origin:\s*top left/s);
  assert.match(css, /\.modal\s*\{[^}]*transition:\s*none/s);
  assert.match(css, /\.modal-head\s*\{[^}]*height:\s*52px/s);
  assert.match(css, /\.modal-title\s*\{[^}]*font-size:\s*20px/s);
  assert.doesNotMatch(source, /modal-eyebrow|modal-title-bar/);
  assert.doesNotMatch(css, /\.modal-body\s*\{[^}]*overflow-y:\s*(?:auto|scroll)/s);
  assert.doesNotMatch(css, /\.modal-table-wrap\s*\{[^}]*overflow-x:\s*(?:auto|scroll)/s);
  assert.doesNotMatch(css, /max-height:\s*\d+vh|height:\s*min\([^;]*vh/);
});

test('modal controls are part of the scaled design surface', async () => {
  const source = await read('js/modal.js');
  const surfaceMarkup = source.match(/<div class="modal"[\s\S]*?<\/div>\s*<\/div>/)?.[0] || '';
  assert.match(surfaceMarkup, /modal-close/);
  assert.match(surfaceMarkup, /modal-resize/);
  assert.match(source, /aria-label="Resize popout"/);
  assert.doesNotMatch(source, /Math\.max\(520|Math\.max\(300/);
});

test('graphics fit decoded native dimensions plus the compact toolbar', async () => {
  const source = await read('js/modal.js');
  assert.match(source, /MEDIA_TOOLBAR_HEIGHT\s*=\s*52/);
  assert.match(source, /image\.naturalWidth/);
  assert.match(source, /image\.naturalHeight\s*\+\s*MEDIA_TOOLBAR_HEIGHT/);
  assert.match(source, /await image\.decode\(\)/);
  assert.match(source, /width:\s*960,\s*height:\s*592/);
});

test('media decode completion is guarded in both success and failure paths', async () => {
  const source = await read('js/modal.js');
  const openMedia = source.match(/export async function openMedia\(id, opener\)\s*\{([\s\S]*?)\n\}\n\nfunction clearFitGeometry/)?.[1] || '';
  const staleGuard = "if (!isOpen || token !== openToken || activeKind !== 'media') return false;";
  assert.equal(openMedia.split(staleGuard).length - 1, 2,
    'both resolved and rejected decodes must ignore stale media opens');

  const decode = openMedia.indexOf('await image.decode()');
  const successGuard = openMedia.indexOf(staleGuard, decode);
  const nativeSize = openMedia.indexOf('image.naturalWidth', successGuard);
  const catchBranch = openMedia.indexOf('catch', nativeSize);
  const failureGuard = openMedia.indexOf(staleGuard, catchBranch);
  const showError = openMedia.indexOf('error.hidden = false', failureGuard);
  const fallback = openMedia.indexOf('currentDesignSize = MEDIA_FALLBACK', failureGuard);
  assert.ok(decode >= 0 && decode < successGuard && successGuard < nativeSize);
  assert.ok(catchBranch > nativeSize && catchBranch < failureGuard);
  assert.ok(failureGuard < showError && failureGuard < fallback);
});

test('modal reveal waits for visible chrome and traps focus entering from outside', async () => {
  const source = await read('js/modal.js');
  assert.match(source, /async function revealAndFocus\(kind, token\)/);

  const reveal = source.match(/async function revealAndFocus\(kind, token\)\s*\{([\s\S]*?)\n\}/)?.[1] || '';
  const removeMeasuring = reveal.indexOf("root.classList.remove('is-measuring')");
  const waitForFrame = reveal.indexOf('await nextFrame()');
  const staleGuard = reveal.indexOf("activeKind !== kind");
  const visibilityProof = reveal.indexOf('getComputedStyle(shell).visibility');
  const focusClose = reveal.indexOf('closeBtn.focus({ preventScroll: true })');
  assert.ok(removeMeasuring >= 0 && removeMeasuring < waitForFrame);
  assert.ok(waitForFrame < staleGuard && staleGuard < visibilityProof && visibilityProof < focusClose);
  assert.match(reveal, /for \(let frame = 0; frame < 3; frame \+= 1\)/);
  assert.match(reveal, /if \(document\.activeElement === closeBtn\) return true/);

  const trap = source.match(/function trap\(e\)\s*\{([\s\S]*?)\n\}/)?.[1] || '';
  assert.match(trap, /!surface\.contains\(document\.activeElement\)/);
  assert.match(trap, /e\.preventDefault\(\);\s*first\.focus\(\);\s*return/);
});

test('one external opener is preserved for the complete modal session', async () => {
  const source = await read('js/modal.js');
  assert.match(source, /function rememberSessionOpener\(opener\)/);

  const remember = source.match(/function rememberSessionOpener\(opener\)\s*\{([\s\S]*?)\n\}/)?.[1] || '';
  assert.match(remember, /root\.classList\.contains\('is-open'\)/);
  assert.match(remember, /surface\.contains\(candidate\)/);
  assert.match(remember, /lastFocused\s*=\s*candidate/);
  assert.doesNotMatch(source, /lastFocused\s*=\s*opener\s*\|\|\s*document\.activeElement/);
  assert.equal(source.match(/rememberSessionOpener\(opener\);/g)?.length, 2);
});
