import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MASTER_ID, createSlideEditClient, createSlideEditStage, formatCssRule, formatHtml, scopeCss,
} from '../js/slide-edits.js';

const squash = html => html.replace(/\n\s*/g, '');

test('formatting puts block elements on their own indented lines', () => {
  const html = '<header class="source-header"><h2 class="source-title">Title</h2><div class="accent-bar"></div></header><div class="source-content"><p>One</p></div>';
  assert.equal(formatHtml(html), [
    '<header class="source-header">',
    '  <h2 class="source-title">Title</h2>',
    '  <div class="accent-bar"></div>',
    '</header>',
    '<div class="source-content">',
    '  <p>One</p>',
    '</div>',
  ].join('\n'));
});

test('formatting never touches text or the spacing around inline elements', () => {
  const html = '<p class="source-bullets">• One\n• Two <a href="https://www.msfg.us/">www.msfg.us</a></p><div><span>a</span><span>b</span><img src="x.png"></div>';
  assert.equal(formatHtml(html), [
    '<p class="source-bullets">• One\n• Two <a href="https://www.msfg.us/">www.msfg.us</a></p>',
    '<div><span>a</span><span>b</span><img src="x.png"></div>',
  ].join('\n'));
});

test('formatting is stable when applied again, and keeps attribute values intact', () => {
  const html = '<article class="build" style="--x: 1 > 0" data-note="a < b"><h3>Label</h3><p>Copy</p></article><!-- note --><footer><img src="logo.svg" alt="Logo"><p>Line</p></footer>';
  const once = formatHtml(html);
  assert.equal(formatHtml(once), once);
  assert.equal(squash(once), html);
});

test('slide CSS is nested under the slide id; empty CSS produces nothing', () => {
  assert.equal(scopeCss('big-idea', '.source-title { color: red; }'), '#slide-big-idea {\n.source-title { color: red; }\n}');
  assert.equal(scopeCss('big-idea', '  \n'), '');
  assert.equal(scopeCss('big-idea'), '');
});

test('a deck rule is laid out one declaration per line', () => {
  assert.equal(
    formatCssRule('.source-title { color: var(--forest); font: 800 56px / 1.13 var(--font-display); }'),
    '.source-title {\n  color: var(--forest);\n  font: 800 56px / 1.13 var(--font-display);\n}',
  );
});

function fakeFetch(handler) {
  const calls = [];
  const fetch = async (url, options = {}) => {
    calls.push({ url, ...options });
    return handler(url, options);
  };
  return { fetch, calls };
}
const reply = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const base = 'https://api.example/api/public/webinar-slide-edits';

test('reading returns the saved edits and never throws', async () => {
  const good = fakeFetch(() => reply(200, { edits: [
    { slideId: 'opening', html: '<h1>Hi</h1>', css: 'h1 { color: red; }', updatedAt: 'x' },
    { slideId: 'closing', js: 'slide.hidden = false;' },
    { slideId: MASTER_ID, html: '', css: '.source-title { color: red; }', js: '' },
    { slideId: 7, html: '<p>ignored</p>' },
  ] }));
  const client = createSlideEditClient({ base, slug: 'reverse-mortgages', fetch: good.fetch });
  assert.deepEqual(await client.list(), [
    { slideId: 'opening', html: '<h1>Hi</h1>', css: 'h1 { color: red; }', js: '' },
    { slideId: 'closing', html: '', css: '', js: 'slide.hidden = false;' },
    { slideId: MASTER_ID, html: '', css: '.source-title { color: red; }', js: '' },
  ]);
  assert.equal(good.calls[0].url, `${base}/reverse-mortgages`);
  assert.equal(good.calls[0].credentials, 'omit');

  for (const handler of [() => reply(503, {}), () => { throw new Error('offline'); }, () => reply(200, { edits: 'nope' })]) {
    const broken = createSlideEditClient({ base, slug: 'reverse-mortgages', fetch: fakeFetch(handler).fetch });
    assert.deepEqual(await broken.list(), []);
  }
});

test('saving sends the slide and the password header', async () => {
  const { fetch, calls } = fakeFetch(() => reply(200, {}));
  const client = createSlideEditClient({ base, slug: 'reverse-mortgages', fetch });
  const result = await client.save('big-idea', { html: '<p>x</p>', css: '' }, 'secret');
  assert.equal(result.ok, true);
  assert.equal(calls[0].url, `${base}/reverse-mortgages/big-idea`);
  assert.equal(calls[0].method, 'PUT');
  assert.equal(calls[0].headers['X-Webinar-Edit-Password'], 'secret');
  assert.deepEqual(JSON.parse(calls[0].body), { html: '<p>x</p>', css: '', js: '' });
});

test('resetting sends a delete with the password and no body', async () => {
  const { fetch, calls } = fakeFetch(() => reply(204, null));
  const client = createSlideEditClient({ base, slug: 'reverse-mortgages', fetch });
  assert.equal((await client.reset('big-idea', 'secret')).ok, true);
  assert.equal(calls[0].method, 'DELETE');
  assert.equal(calls[0].body, undefined);
  assert.equal(calls[0].headers['X-Webinar-Edit-Password'], 'secret');
});

test('failures come back as plain messages', async () => {
  const cases = [
    [() => reply(401, {}), /password was not accepted/, true],
    [() => reply(413, {}), /too large/, false],
    [() => reply(429, {}), /Too many attempts/, false],
    [() => reply(503, {}), /not available/, false],
    [() => reply(500, {}), /error 500/, false],
    [() => { throw new Error('offline'); }, /Could not reach the server/, false],
  ];
  for (const [handler, message, wrongPassword] of cases) {
    const client = createSlideEditClient({ base, slug: 'reverse-mortgages', fetch: fakeFetch(handler).fetch });
    const result = await client.save('big-idea', { html: '<p>x</p>', css: '' }, 'guess');
    assert.equal(result.ok, false);
    assert.match(result.message, message);
    assert.equal(Boolean(result.wrongPassword), wrongPassword);
  }
});

/* A stand-in for the few document features the slide stage uses. */
function fakeDeck(slides, active) {
  const nodes = new Map();
  const node = (id, html = '') => {
    const el = { id, innerHTML: html, textContent: '', dataset: {}, classList: { contains: name => name === 'is-active' && id === `slide-${active}` } };
    nodes.set(id, el);
    return el;
  };
  Object.entries(slides).forEach(([id, html]) => node(`slide-${id}`, html));
  return {
    styleSheets: [],
    head: { appendChild: el => nodes.set(el.id, el) },
    getElementById: id => nodes.get(id) || null,
    createElement: () => ({ id: '', innerHTML: '', textContent: '', dataset: {} }),
    html: id => nodes.get(`slide-${id}`).innerHTML,
    css: id => nodes.get(`slide-edit-css-${id}`)?.textContent ?? '',
    slide: id => nodes.get(`slide-${id}`),
  };
}

function stageFor(slides, active = Object.keys(slides)[0]) {
  const document = fakeDeck(slides, active);
  const changed = [];
  const stage = createSlideEditStage({ document, onChange: el => changed.push(el.id) });
  Object.keys(slides).forEach(id => stage.capture(id));
  return { document, stage, changed };
}

test('a saved edit replaces the slide, and removing it brings the original back', () => {
  const { document, stage, changed } = stageFor({ opening: '<h1>Original</h1>', closing: '<p>Bye</p>' });
  stage.load([{ slideId: 'opening', html: '<h1>Edited</h1>', css: 'h1 { color: red; }', js: '' }, { slideId: 'gone', html: '<p>x</p>' }]);
  assert.equal(document.html('opening'), '<h1>Edited</h1>');
  assert.equal(document.css('opening'), '#slide-opening {\nh1 { color: red; }\n}');
  assert.equal(document.html('closing'), '<p>Bye</p>');
  assert.equal(stage.isEdited('opening'), true);
  assert.equal(stage.isEdited('closing'), false);
  assert.deepEqual(changed, ['slide-opening']);

  stage.commit('opening', null);
  assert.equal(document.html('opening'), '<h1>Original</h1>');
  assert.equal(document.css('opening'), '');
  assert.equal(stage.isEdited('opening'), false);
});

test('a CSS-only or JS-only edit keeps the deck\'s own markup', () => {
  const { document, stage } = stageFor({ opening: '<h1>Original</h1>' });
  stage.commit('opening', { html: '', css: 'h1 { color: red; }', js: '' });
  assert.equal(document.html('opening'), '<h1>Original</h1>');
  assert.equal(stage.source('opening').html, '<h1>Original</h1>');
  assert.equal(stage.source('opening').edited, true);

  /* the deck re-renders the slide itself (presenter change): the edit stays on top */
  document.slide('opening').innerHTML = '<h1>Original, new presenter</h1>';
  stage.rerendered('opening');
  assert.equal(document.html('opening'), '<h1>Original, new presenter</h1>');
  assert.equal(document.css('opening'), '#slide-opening {\nh1 { color: red; }\n}');
});

test('a slide\'s JS runs when the slide is shown, with the slide as `slide`', () => {
  const { document, stage } = stageFor({ opening: '<h1>One</h1>', closing: '<p>Bye</p>' }, 'opening');
  stage.load([
    { slideId: 'opening', html: '', css: '', js: 'slide.dataset.runs = String(Number(slide.dataset.runs || 0) + 1);' },
    { slideId: 'closing', html: '', css: '', js: 'slide.dataset.runs = "1";' },
  ]);
  assert.equal(document.slide('opening').dataset.runs, '1', 'runs at once on the slide in view');
  assert.equal(document.slide('closing').dataset.runs, undefined, 'waits until its slide is shown');
  stage.shown('closing');
  stage.shown('opening');
  assert.equal(document.slide('closing').dataset.runs, '1');
  assert.equal(document.slide('opening').dataset.runs, '2');
});

test('broken slide JS is reported and never stops the deck', () => {
  const { stage } = stageFor({ opening: '<h1>One</h1>' }, 'opening');
  const original = console.error;
  console.error = () => {};
  try {
    assert.match(stage.preview('opening', { html: '', css: '', js: 'slide.nope.nope = 1;' }), /undefined/);
    assert.match(stage.preview('opening', { html: '', css: '', js: 'this is not javascript' }), /Unexpected|identifier/i);
    assert.equal(stage.preview('opening', { html: '', css: '', js: '' }), null);
    assert.equal(stage.shown('opening'), null);
  } finally {
    console.error = original;
  }
});

test('a draft shows without being kept; revert puts the saved version back', () => {
  const { document, stage } = stageFor({ opening: '<h1>Original</h1>' });
  stage.commit('opening', { html: '<h1>Saved</h1>', css: '', js: '' });
  stage.preview('opening', { html: '<h1>Draft</h1>', css: 'h1 { color: blue; }', js: '' });
  assert.equal(document.html('opening'), '<h1>Draft</h1>');
  assert.equal(stage.source('opening').html, '<h1>Saved</h1>');
  stage.revert('opening');
  assert.equal(document.html('opening'), '<h1>Saved</h1>');
  assert.equal(document.css('opening'), '');
});

test('the Master CSS applies to the whole deck, unscoped', () => {
  const { document, stage } = stageFor({ opening: '<h1>Original</h1>' });
  stage.load([{ slideId: MASTER_ID, html: '', css: '.source-title { color: red; }', js: '' }]);
  assert.equal(document.css(MASTER_ID), '.source-title { color: red; }');
  assert.deepEqual(stage.masterSource(), { css: '.source-title { color: red; }', edited: true });
  assert.equal(document.html('opening'), '<h1>Original</h1>');

  stage.previewMaster('.source-title { color: blue; }');
  assert.equal(document.css(MASTER_ID), '.source-title { color: blue; }');
  stage.revertMaster();
  assert.equal(document.css(MASTER_ID), '.source-title { color: red; }');
  stage.commitMaster('');
  assert.equal(document.css(MASTER_ID), '');
  assert.equal(stage.isEdited(MASTER_ID), false);
});
