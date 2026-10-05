/* The three AI workflows: a whole new presentation (Webinar Suite), one slide,
   and several slides (Slide settings). The shared code is tested once, in its
   Reverse Mortgages copy (build.test.mjs keeps every deck's copy identical);
   each deck's own footer is tested in that deck; Webinar Suite is tested as
   built, with the Studio content laid over the engine. */
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { buildSite, REPO_ROOT } from '../build.mjs';

const ENGINE = join(REPO_ROOT, 'reverse-mortgages/deck');
const load = path => import(pathToFileURL(path).href);
const prompts = await load(join(ENGINE, 'js/slide-prompt.js'));
const edits = await load(join(ENGINE, 'js/slide-edits.js'));
const reverseFormat = await load(join(ENGINE, 'content/slide-format.js'));
const { PRESENTERS } = await load(join(ENGINE, 'content/presenters.js'));
const {
  MAX_PROJECT_SLIDES, PRESENTATION_SHAPE, PROJECT_SHAPE, REPLACE_SHAPE, brandLinks, buildPresentationPrompt, buildProjectPrompt,
  buildSlidePrompt, checkMasterCss, classNamesIn, footerSpec, normalizeFooter, parsePresentation, parseSlideAnswer, parseSlideProject,
  presenterData,
} = prompts;
const { headingOf } = edits;

const DECKS = ['reverse-mortgages', 'first-time-homebuyer', 'first-home-without-mystery', 'va-loans'];
const linksFor = deck => brandLinks(`https://msfgmortgage.com/webinars/${deck}/index.html`, {
  logo: './assets/brand/logo-horizontal.svg',
  logoOnDark: './assets/brand/logo-horizontal-knockout.svg',
  equalHousing: './assets/brand/EQUAL%20HOUSING%20LENDER.png',
});
const links = linksFor('studio');
const robert = presenterData(PRESENTERS.robert);
const seth = presenterData(PRESENTERS.seth);

const MASTER = `
/* the design system */
.slide { --x-accent: #8cc63E; }
.slide h2.x-title { font: 800 64px/1.05 var(--font-display); color: var(--forest); }
.slide .x-card, .slide .x-stat { padding: 30px; border: 2px solid var(--x-accent); }
.slide .x-quote::before { content: "{ \\"quoted\\" }"; }
@media (min-width: 0) { .slide .x-wide { width: 100%; } }
@keyframes x-fade { from { opacity: 0; } to { opacity: 1; } }
`;
const slide = (title, extra = {}) => ({ title, html: `<header class="source-header"><h2 class="source-title">${title}</h2></header>\n<div class="source-content"><p class="source-lead">${title} body</p></div>`, css: '', js: '', ...extra });
const presentation = (extra = {}) => ({ title: 'Down payment help in Colorado', masterCss: MASTER, slides: [slide('Welcome'), slide('Who qualifies'), slide('Questions?')], ...extra });

/* ---- the new-presentation prompt ---------------------------------------- */

test('the presentation prompt asks for one raw JSON object with title, Master CSS and every slide', () => {
  const text = buildPresentationPrompt({ links, format: reverseFormat.SLIDE_FORMAT, presenter: robert, request: 'Ten slides on down payment help.' });
  for (const expected of [PRESENTATION_SHAPE, 'inside one ```json code block', 'Put the whole answer inside ONE Markdown code block',
    'Its first character is {', 'JSON.parse()', `At most ${MAX_PROJECT_SLIDES} slides`, 'MASTER CSS',
    'Every selector in masterCss must start with .slide', 'Never use :root, html, body', 'No @import', '1920 x 1080',
    'variable named slide', 'Ten slides on down payment help.', '<footer class="source-footer">', links.equalHousing]) {
    assert.ok(text.includes(expected), `missing: ${expected}`);
  }
  assert.ok(!text.includes('[Describe the presentation here'), 'the description replaces the placeholder');
  assert.ok(!/starter|placeholder slide/i.test(text), 'the starter-slide frame is an implementation detail');
});

test('the presenter chosen changes the presentation prompt and its footer; nothing names Seth by default', () => {
  const forRobert = buildPresentationPrompt({ links, format: reverseFormat.SLIDE_FORMAT, presenter: robert });
  assert.ok(forRobert.includes('Name: Robert Hoff') && forRobert.includes('Robert Hoff • NMLS #608235'));
  assert.ok(!forRobert.includes('Seth Angell'), 'no Seth when Robert presents');
  const forSeth = buildPresentationPrompt({ links, format: reverseFormat.SLIDE_FORMAT, presenter: seth });
  assert.ok(forSeth.includes('Seth Angell • NMLS #912881') && forSeth.includes('(303) 883-8519') && !forSeth.includes('Robert Hoff'));
  /* a presenter from another source (the /loan-officers roster, later) works the same way */
  const other = presenterData({ id: 'lo-7', name: 'Pat Example', title: 'Loan Officer', nmls: 'NMLS# 1234', phone: '7205550100' });
  const forOther = buildPresentationPrompt({ links, format: reverseFormat.SLIDE_FORMAT, presenter: other });
  assert.ok(forOther.includes('Pat Example • NMLS #1234  |  (720) 555-0100'));
});

/* ---- reading a new presentation ------------------------------------------ */

test('a presentation is read raw, with whitespace, or in one json or plain fence', () => {
  const json = JSON.stringify(presentation(), null, 2);
  for (const answer of [json, `\n  ${json}  \n`, `\`\`\`json\n${json}\n\`\`\``, `\`\`\`\n${json}\n\`\`\``]) {
    const read = parsePresentation(answer, { headingOf });
    assert.equal(read.error, undefined, read.error);
    assert.equal(read.presentation.title, 'Down payment help in Colorado');
    assert.equal(read.presentation.masterCss, MASTER, 'the Master CSS is imported exactly');
    assert.deepEqual(read.presentation.slides.map(s => s.title), ['Welcome', 'Who qualifies', 'Questions?']);
    assert.equal(read.presentation.slides[0].html, presentation().slides[0].html, 'each slide is imported complete');
  }
});

test('a presentation that is incomplete or malformed is refused with useful errors', () => {
  const bad = data => parsePresentation(JSON.stringify(data));
  const { masterCss, ...noMaster } = presentation();
  assert.match(bad(noMaster).error, /no "masterCss"/);
  assert.match(bad(presentation({ masterCss: '' })).error, /"masterCss" is empty/);
  assert.match(bad(presentation({ masterCss: 12 })).error, /"masterCss" must be text/);
  const { slides, ...noSlides } = presentation();
  assert.match(bad(noSlides).error, /no "slides"/);
  assert.match(bad(presentation({ slides: [] })).error, /"slides" is empty/);
  assert.match(bad(presentation({ slides: 'all of them' })).error, /not a list/);
  assert.match(bad(presentation({ title: '' })).error, /no "title"/);
  assert.match(bad(presentation({ title: ['x'] })).error, /"title" must be text/);
  const fields = bad(presentation({ slides: [slide('A'), { title: 'B', html: '' }, { title: 3, html: '<p>c</p>', js: {} }, null] }));
  assert.deepEqual(fields.errors, ['Slide 2 has no "html".', 'Slide 3: "title" must be text.', 'Slide 3: "js" must be text.', 'Slide 4 is not a slide object.']);
  const many = presentation({ slides: Array.from({ length: MAX_PROJECT_SLIDES + 1 }, (_, i) => slide(`S${i}`)) });
  assert.match(bad(many).error, new RegExp(`${MAX_PROJECT_SLIDES + 1} slides; the most that can be used at once is ${MAX_PROJECT_SLIDES}`));
  assert.equal(bad(presentation({ slides: Array.from({ length: MAX_PROJECT_SLIDES }, (_, i) => slide(`S${i}`)) })).error, undefined);
  assert.match(parsePresentation('{"title": "x", "masterCss": ".slide{}", "slides": [').error, /cut off/);
  assert.match(parsePresentation('').error, /Nothing was pasted/);
  assert.match(parsePresentation(JSON.stringify([slide('A')])).error, /is a list/);
  /* several problems are listed together */
  assert.ok(bad({ slides: [] }).errors.length >= 3);
});

test('a presentation pasted with sentences around it is read as it is', () => {
  const json = JSON.stringify(presentation(), null, 2);
  for (const answer of [`Here is your presentation:\n${json}`, `${json}\n\nLet me know if you want changes!`,
    `Sure!\n\`\`\`json\n${json}\n\`\`\``, `\`\`\`json\n${json}\n\`\`\`\nHope this helps.`]) {
    const read = parsePresentation(answer);
    assert.equal(read.error, undefined, answer.slice(0, 30));
    assert.equal(read.presentation.title, 'Down payment help in Colorado');
  }
  assert.match(parsePresentation(`Version A:\n${json}\nVersion B:\n${json}`).error, /more than one block of JSON/);
});

test('Master CSS that could reach outside the slides is refused; .slide rules are accepted', () => {
  assert.deepEqual(checkMasterCss(MASTER), []);
  assert.deepEqual(checkMasterCss('.slide{}.slide.is-active .x-a,.slide>p{color:red}.slide:is(.a, .b) p{}'), []);
  for (const [css, reason] of [
    ['body { background: red; }', /"body" is not limited to the slides/],
    [':root { --forest: red; }', /":root" is not limited/],
    ['* { margin: 0; }', /"\*" is not limited/],
    ['html, .slide p { color: red; }', /"html" is not limited/],
    ['.slide p, .e-bar { color: red; }', /"\.e-bar" is not limited/],
    ['.slide-footer { display: none; }', /"\.slide-footer" is not limited/],
    ['.slides .x { color: red; }', /"\.slides \.x" is not limited/],
    ['h2 { color: red; }', /"h2" is not limited/],
    ['@media screen { body { color: red; } }', /"body" is not limited/],
    ['@import url("https://example.com/x.css");', /@import/],
    ['@font-face { font-family: X; src: url(x.woff2); }', /@font-face/],
    ['@layer base { .slide { color: red; } }', /@layer/],
    ['.slide { color: red; ', /never closed/],
    ['.slide { color: red; } }', /closes nothing/],
    ['.slide p', /not a complete rule/],
    [`.slide { content: "${'x'.repeat(100 * 1024)}"; }`, /larger than 100 KB/],
  ]) {
    const problems = checkMasterCss(css);
    assert.ok(problems.some(problem => reason.test(problem)), `${css.slice(0, 40)} -> ${problems.join(' | ')}`);
  }
  const read = parsePresentation(JSON.stringify(presentation({ masterCss: `${MASTER}\nbody { margin: 0; }` })));
  assert.match(read.error, /"body" is not limited to the slides/);
});

test('the classes a Master CSS defines are listed for the design-system summary', () => {
  assert.deepEqual(classNamesIn(MASTER).sort(), ['x-card', 'x-quote', 'x-stat', 'x-title', 'x-wide']);
});

/* ---- footers --------------------------------------------------------------- */

for (const deck of DECKS) {
  test(`${deck}: every imported slide ends up with exactly one footer, the deck's own`, async () => {
    const { SLIDE_FORMAT } = await load(join(REPO_ROOT, deck, 'deck/content/slide-format.js'));
    const deckLinks = linksFor(deck);
    const spec = footerSpec(SLIDE_FORMAT, deckLinks);
    const count = html => html.split(`class="${spec.className}"`).length - 1;
    const body = '<header class="h"><h2>Title</h2></header>\n<div class="body"><p>Text & "quotes"</p></div>';

    const added = normalizeFooter(body, spec);
    assert.equal(added.action, 'added');
    assert.ok(added.html.startsWith(body), 'nothing before the footer changes');
    assert.ok(added.html.endsWith(spec.light));
    assert.equal(count(added.html), 1);

    const wrong = `${body}\n<footer class="${spec.className} extra"><img src="https://evil.example/logo.png"><p>Made-up NMLS #000</p><div><span>nested</span></div></footer>\n<p class="disclaimer">Small print.</p>`;
    const replaced = normalizeFooter(wrong, spec);
    assert.equal(replaced.action, 'replaced');
    assert.equal(replaced.html, `${body}\n${spec.light}\n<p class="disclaimer">Small print.</p>`, 'the footer is swapped in place; the rest is untouched');

    const twice = normalizeFooter(`${body}\n${spec.light}\n<div class="${spec.className}">copy</div>`, spec);
    assert.equal(count(twice.html), 1);
    assert.ok(twice.html.startsWith(`${body}\n${spec.light}`));

    const kept = normalizeFooter(`${body}\n${spec.light}`, spec);
    assert.equal(kept.action, 'kept');
    assert.equal(kept.html, `${body}\n${spec.light}`);

    const dark = normalizeFooter(`${body}\n<div class="${spec.className}"><img src="${deckLinks.logoOnDark}"></div>`, spec);
    assert.ok(dark.html.includes(deckLinks.logoOnDark) && dark.html.endsWith(spec.dark), 'a dark slide keeps the white logo');
    /* the deck draws its own dark footers with a relative link, and the AI usually keeps it */
    const drawn = normalizeFooter(`${body}\n<div class="${spec.className}"><img src="./assets/brand/logo-horizontal-knockout.svg"></div>`, spec);
    assert.ok(drawn.html.endsWith(spec.dark), 'a deck-drawn dark footer keeps the white logo');

    const unclosed = normalizeFooter(`${body}\n<footer class="${spec.className}"><p>never closed`, spec);
    assert.equal(unclosed.html, `${body}\n${spec.light}`);

    assert.equal(normalizeFooter(body, spec, { required: false }).html, body, 'a slide without one keeps having none when not required');
    assert.equal(normalizeFooter('<p class="not-the-footer-copy">x</p>', spec).action, 'added', 'a similar class name is not the footer');
  });
}

test('the Reverse Mortgages footer and prompts read exactly as before (Seth Angell)', () => {
  const deckLinks = linksFor('reverse-mortgages');
  const legacy = [
    '<footer class="source-footer">',
    `  <img src="${deckLinks.logo}" alt="Mountain State Financial Group">`,
    '  <p class="source-footer-copy">Mountain State Financial Group, LLC • NMLS #1314257  |  Seth Angell • NMLS #912881  |  (303) 883-8519  |  <a href="https://www.msfg.us/" target="_blank" rel="noopener noreferrer">www.msfg.us</a></p>',
    '  <span class="source-page">1</span>',
    `  <img class="source-housing" src="${deckLinks.equalHousing}" alt="Equal Housing Lender">`,
    '</footer>',
  ].join('\n');
  assert.equal(reverseFormat.footerHtml(deckLinks), legacy);
  assert.equal(reverseFormat.footerHtml(deckLinks, PRESENTERS.seth), legacy, 'Seth as data gives the same footer');
  assert.ok(reverseFormat.SLIDE_FORMAT.notes(deckLinks).join('\n').includes(legacy));
  const single = buildSlidePrompt({ deckTitle: 'Reverse Mortgages', links: deckLinks, format: reverseFormat.SLIDE_FORMAT });
  assert.ok(single.includes(legacy));
  assert.equal(footerSpec(reverseFormat.SLIDE_FORMAT, deckLinks).light, legacy);
  assert.ok(footerSpec(reverseFormat.SLIDE_FORMAT, deckLinks, robert).light.includes('Robert Hoff • NMLS #608235'));
});

/* ---- one slide --------------------------------------------------------------- */

test('the one-slide prompt carries the request and the Master CSS the slide uses, not the whole stylesheet', () => {
  const text = buildSlidePrompt({
    deckTitle: 'Down payment help', links, format: reverseFormat.SLIDE_FORMAT,
    slide: {
      title: 'Who qualifies', wrapper: '<section class="slide" data-bg="white">', html: '<h2 class="x-title">Who qualifies</h2>', css: '', js: '',
      reference: '.source-title {\n  color: var(--forest);\n}',
      master: { rules: '.slide h2.x-title {\n  font-size: 64px;\n}', classes: ['x-card', 'x-stat'] },
    },
    request: 'Make it three cards.',
  });
  for (const expected of ['THE PRESENTATION\'S MASTER CSS', '.slide h2.x-title {\n  font-size: 64px;\n}', 'Other classes it defines, ready to use: .x-card, .x-stat',
    'THE DECK STYLES THIS SLIDE USES NOW', 'WHAT I WANT\nMake it three cards.', 'three code blocks']) {
    assert.ok(text.includes(expected), `missing: ${expected}`);
  }
  assert.ok(!buildSlidePrompt({ links, slide: { title: 'x', html: '<p>x</p>', css: '', js: '' } }).includes('MASTER CSS'), 'no Master CSS section when there is none');
  const long = buildSlidePrompt({ links, slide: { title: 'x', html: '<p>x</p>', css: '', js: '', master: { rules: `.slide p { color: red; }\n${'.slide .x { color: red; }\n'.repeat(1000)}`, classes: [] } } });
  assert.ok(long.length < 12000 && long.includes('more rules not shown'), 'the Master CSS is cut short');
});

test('the one-slide answer fills HTML, CSS and JS from its code blocks', () => {
  const answer = 'Here it is:\n```html\n<h2>Hi</h2>\n```\n```css\n& { color: red; }\n```\n```js\n\n```\nI changed the title.';
  assert.deepEqual(parseSlideAnswer(answer), { html: '<h2>Hi</h2>', css: '& { color: red; }', js: '' });
  assert.deepEqual(parseSlideAnswer('```\n<p>a</p>\n```\n```\np { }\n```'), { html: '<p>a</p>', css: 'p { }', js: '' });
  assert.deepEqual(parseSlideAnswer('```javascript\nslide.x = 1;\n```\n```html\n<p>a</p>\n```'), { html: '<p>a</p>', css: '', js: 'slide.x = 1;' });
  assert.match(parseSlideAnswer('Just text').error, /three code blocks/);
  assert.match(parseSlideAnswer('```css\np {}\n```').error, /No html code block/);
  assert.match(parseSlideAnswer('```html\n\n```').error, /empty/);
  assert.match(parseSlideAnswer('```html\n<p>a</p>\n```\n```css\n@import url(x.css);\n```').error, /@import/);
});

/* ---- several slides ------------------------------------------------------------ */

const outline = [{ id: 'opening', title: 'Welcome' }, { id: 'what', title: 'What it is' }, { id: 'added-x1', title: 'Costs' }, { id: 'closing', title: 'Questions?' }];

test('the multi-slide prompt (add) gives the outline, where the slides go, the design system and the footer', () => {
  const text = buildProjectPrompt({
    deckTitle: 'Reverse Mortgages', links, format: reverseFormat.SLIDE_FORMAT, outline, insertAfter: 'what',
    masterClasses: ['x-card', 'x-stat'], request: 'Two slides on fees.', example: { html: '<h2 class="source-title">Plain</h2>', reference: '' },
  });
  for (const expected of [PROJECT_SHAPE, 'THE PRESENTATION NOW', '1. Welcome', '2. What it is   <- the new slides go right after this one',
    '4. Questions?', 'DESIGN SYSTEM', '.x-card, .x-stat', 'Do not write Master CSS', '<footer class="source-footer">',
    'A SLIDE FROM THIS DECK TO MODEL YOURS ON', 'WHAT I WANT\nTwo slides on fees.', 'Nothing before the block and nothing after it']) {
    assert.ok(text.includes(expected), `missing: ${expected}`);
  }
  assert.ok(!text.includes('"id"'), 'new slides do not need ids');
});

test('the multi-slide prompt (replace) gives the chosen slides with their ids', () => {
  const text = buildProjectPrompt({
    deckTitle: 'Reverse Mortgages', links, format: reverseFormat.SLIDE_FORMAT, mode: 'replace', outline,
    selected: [{ id: 'what', title: 'What it is', html: '<h2>What it is</h2>', css: '.x {}', js: '' }],
  });
  for (const expected of [REPLACE_SHAPE, 'Its "id" must be one of the ids given below', 'THE SLIDES TO CHANGE', 'id "what" ("What it is")',
    '<h2>What it is</h2>', '2. What it is   <- to change (id "what")', 'Do not write Master CSS']) {
    assert.ok(text.includes(expected), `missing: ${expected}`);
  }
  assert.ok(!text.includes('<- to change (id "opening")'));
});

test('replace mode needs a known, unrepeated id for every slide and never reaches an unchosen slide', () => {
  const answer = list => JSON.stringify({ slides: list });
  const chosen = { mode: 'replace', selectedIds: ['what', 'added-x1'] };
  const ok = parseSlideProject(answer([{ id: 'added-x1', title: 'Costs', html: '<p>c</p>' }, { id: 'what', html: '<h2>New</h2>' }]), { ...chosen, headingOf });
  assert.deepEqual(ok.slides.map(s => [s.id, s.title]), [['added-x1', 'Costs'], ['what', 'New']], 'matched by id, not by order');
  assert.match(parseSlideProject(answer([{ html: '<p>a</p>' }]), chosen).error, /has no "id"/);
  assert.match(parseSlideProject(answer([{ id: 'nope', html: '<p>a</p>' }]), chosen).error, /"nope", which is not one of the slides chosen/);
  assert.match(parseSlideProject(answer([{ id: 'opening', html: '<p>a</p>' }]), chosen).error, /"opening", which is not one of the slides chosen/,
    'a slide that exists but was not chosen cannot be changed');
  assert.match(parseSlideProject(answer([{ id: 'what', html: '<p>a</p>' }, { id: 'what', html: '<p>b</p>' }]), chosen).error, /repeats the id "what"/);
  assert.match(parseSlideProject(answer([{ id: 7, html: '<p>a</p>' }]), chosen).error, /"id" must be text/);
  assert.match(parseSlideProject(answer([{ id: 'what', html: '<p>a</p>' }]), { mode: 'replace', selectedIds: [] }).error, /Choose the slides/);
  /* add mode ignores ids, and never takes a Master CSS */
  const added = parseSlideProject(JSON.stringify({ masterCss: 'body{}', slides: [{ id: 'what', html: '<p>a</p>' }] }));
  assert.equal(added.slides[0].id, undefined);
  assert.deepEqual(added.ignored, ['masterCss']);
});

/* ---- saving a new presentation ---------------------------------------------------- */

const STARTERS = [{ id: 'opening', bg: 'dark' }, { id: 'content', bg: 'white' }, { id: 'questions', bg: 'white' }];
const planOf = (data = presentation()) => edits.planPresentation(data, { starters: STARTERS, frame: 'content', presenter: robert, newId: i => `ai-t-${i + 1}` });

/* A stand-in for the saved-edits API that can be told to fail. */
function fakeClient({ failAt = () => false } = {}) {
  const store = new Map();
  const calls = [];
  return {
    store,
    calls,
    async save(slideId, edit) {
      calls.push(slideId);
      if (failAt(slideId, calls.length)) return { ok: false, status: 503, message: 'Saving is not available on the server right now.' };
      store.set(slideId, { ...edit });
      return { ok: true, status: 200 };
    },
  };
}

test('a new presentation is saved slides first, then Master CSS, then the slide list, and its details last', async () => {
  const plan = planOf();
  assert.deepEqual(plan.records.map(r => r.slideId), ['ai-t-1', 'ai-t-2', 'ai-t-3', '_master', '_slides', '_webinar']);
  assert.equal(plan.records[3].edit.css, MASTER, 'the Master CSS saved is the one previewed');
  const list = edits.parseSlideList(plan.records[4].edit.html);
  assert.deepEqual(list.removed, ['opening', 'content', 'questions']);
  assert.deepEqual(edits.arrangeSlides(STARTERS, list).map(s => s.id), ['ai-t-1', 'ai-t-2', 'ai-t-3'], 'only the generated slides are shown');
  assert.ok(Object.values(list.added).every(entry => entry.from === 'content'));
  assert.deepEqual(edits.webinarDetails(edits.planFeed(plan)), { title: 'Down payment help in Colorado', presenter: robert, madeWithAi: true });
  assert.equal(edits.webinarDetails([{ slideId: '_webinar', html: JSON.stringify({ title: 'Blank one' }) }]).madeWithAi, false, 'a blank webinar is not marked');
  assert.equal(edits.webinarTitle(edits.planFeed(plan)), 'Down payment help in Colorado');
  assert.deepEqual(plan.records[0].edit, { html: presentation().slides[0].html, css: '', js: '' });

  const client = fakeClient();
  const result = await edits.savePlan(client, plan, 'pw');
  assert.equal(result.ok, true);
  assert.deepEqual(client.calls, plan.records.map(r => r.slideId));
});

test('a creation that fails part-way never writes _webinar, and trying again finishes it cleanly', async () => {
  const plan = planOf();
  const ids = plan.records.map(r => r.slideId);
  const finished = fakeClient();
  await edits.savePlan(finished, plan, 'pw');
  for (const failing of ids) {
    const client = fakeClient({ failAt: id => id === failing });
    const result = await edits.savePlan(client, plan, 'pw');
    assert.equal(result.ok, false);
    assert.equal(result.failedAt, failing);
    assert.ok(!client.store.has('_webinar'), `failing at ${failing} must not show the presentation in Webinar Suite`);
    assert.deepEqual(client.calls, ids.slice(0, ids.indexOf(failing) + 1), 'it stops at the first failure');
    /* retry with the same plan */
    const retry = fakeClient();
    retry.store = client.store;
    retry.save = async (slideId, edit) => { client.store.set(slideId, { ...edit }); return { ok: true }; };
    assert.equal((await edits.savePlan(retry, plan, 'pw')).ok, true);
    assert.deepEqual([...client.store.entries()].sort(), [...finished.store.entries()].sort(), 'the retry ends exactly where a clean save would');
  }
});

test('saved edits can be overlaid for a preview without changing them', () => {
  const saved = [{ slideId: 'a', html: '1', css: '', js: '' }, { slideId: '_slides', html: '{}', css: '', js: '' }];
  const copy = JSON.parse(JSON.stringify(saved));
  const shown = edits.overlayEdits(saved, [{ slideId: 'a', html: '2', css: '', js: '' }, { slideId: 'b', html: '3', css: '', js: '' }]);
  assert.deepEqual(shown.map(e => [e.slideId, e.html]), [['a', '2'], ['_slides', '{}'], ['b', '3']]);
  assert.deepEqual(saved, copy);
});

/* ---- Webinar Suite, as built --------------------------------------------------------- */

let outDir;
let built;
before(() => {
  outDir = mkdtempSync(join(tmpdir(), 'msfg-ai-'));
  built = buildSite({ outDir, zip: false }).outRoot;
});
after(() => rmSync(outDir, { recursive: true, force: true }));

test('preparing a presentation in Webinar Suite checks it, puts on the presenter\'s footer and saves nothing', async () => {
  const studio = join(built, 'webinars/studio');
  const home = await load(join(studio, 'js/studio-home.js'));
  const { SLIDES } = await load(join(studio, 'content/slides.js'));
  const { loadPresenterOptions } = await load(join(studio, 'js/presenter-options.js'));
  const people = await loadPresenterOptions();
  assert.deepEqual(people.map(p => p.name), ['Seth Angell', 'Robert Hoff', 'Zachary Zink']);

  const fetched = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (...args) => { fetched.push(args); throw new Error('no network in a preview'); };
  try {
    const answer = JSON.stringify(presentation({ slides: [slide('Welcome'), { ...slide('Fees'), html: `${slide('Fees').html}\n<footer class="source-footer"><p>AI footer</p></footer>` }] }));
    const ready = home.preparePresentation(answer, { presenter: people.find(p => p.name === 'Robert Hoff'), links, taken: ['down-payment-help-in-colorado'] });
    assert.equal(ready.error, undefined, ready.error);
    assert.equal(ready.slug, 'down-payment-help-in-colorado-2', 'a name in use is not taken');
    assert.equal(home.frameSlideId(SLIDES), 'content');
    const htmls = ready.plan.slides.map(s => s.edit.html);
    assert.ok(htmls.every(html => html.split('class="source-footer"').length === 2), 'one footer on every slide');
    assert.ok(htmls.every(html => html.includes('Robert Hoff • NMLS #608235') && !html.includes('Seth Angell') && !html.includes('AI footer')));
    assert.deepEqual(edits.webinarDetails(edits.planFeed(ready.plan)).presenter.name, 'Robert Hoff');
    const withSeth = home.preparePresentation(answer, { presenter: people.find(p => p.name === 'Seth Angell'), links });
    assert.ok(withSeth.plan.slides[0].edit.html.includes('Seth Angell • NMLS #912881'));
    assert.equal(home.preparePresentation(`Here you go:\n${answer}\nEnjoy!`, { links }).error, undefined, 'a straight copy-paste works');
  } finally {
    globalThis.fetch = realFetch;
  }
  assert.equal(fetched.length, 0, 'preview sends nothing to the server');
});

test('Slide settings and Presenter View link to Webinar Suite, which is the Studio home', () => {
  const read = (...parts) => readFileSync(join(...parts), 'utf8');
  const home = read(built, 'webinars/studio/home.html');
  assert.match(home, /<title>Webinar Suite — /);
  assert.match(home, /<h1 class="s-title">Webinar Suite<\/h1>/);
  assert.match(home, /Create with AI/);
  for (const slug of ['reverse-mortgages', 'homebuyers-webinar', 'first-home-without-mystery', 'va', 'studio']) {
    const deck = join(built, 'webinars', slug);
    const editor = read(deck, 'editor.html');
    assert.match(editor, /<a class="e-link" id="e-studio" hidden>Webinar Suite<\/a>/, `${slug} editor`);
    assert.doesNotMatch(editor, /All webinars/, `${slug} editor still says All webinars`);
    assert.match(editor, /Edit this slide with AI/);
    assert.match(editor, /Add or edit several slides with AI/);
    assert.match(read(deck, 'presenter.html'), />Webinar Suite ↗</, `${slug} presenter`);
    const config = read(deck, 'content/webinar-config.js');
    const target = /studio: '([^']+)'/.exec(config)[1];
    assert.ok(!/^https?:/.test(target), 'a relative link, not a hard-coded host');
    assert.ok(existsSync(resolve(deck, target)), `${slug}: ${target} does not exist in the built site`);
  }
});

test('the deck pages hand their own window to the edits feed, in every deck', () => {
  for (const deck of DECKS) {
    const source = readFileSync(join(REPO_ROOT, deck, 'deck/js/deck.js'), 'utf8');
    assert.match(source, /window\.parent\.__slideEditsFeed\(window\)/, deck);
  }
});
