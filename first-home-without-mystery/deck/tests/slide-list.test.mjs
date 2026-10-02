import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync } from 'node:fs';
import {
  arrangeSlides, headingOf, listAfterAdd, listAfterMove, listAfterRemove, listAfterRestore, parseSlideList, webinarTitle,
} from '../js/slide-edits.js';
import { MAX_PROJECT_SLIDES, PROJECT_SHAPE, brandLinks, buildProjectPrompt, buildSlidePrompt, parseSlideProject } from '../js/slide-prompt.js';
import { SLIDE_FORMAT, footerHtml } from '../content/slide-format.js';

const deck = [
  { id: 'opening', headline: 'Opening', notes: 'Say hello', manualBuild: false },
  { id: 'what', headline: 'What it is', notes: 'Explain', manualBuild: true },
  { id: 'closing', headline: 'Closing', notes: 'Wrap up', manualBuild: false },
];
const empty = parseSlideList('');
const ids = list => arrangeSlides(deck, list).map(slide => slide.id);

test('with nothing saved, the deck is exactly its own slides', () => {
  assert.deepEqual(empty, { order: [], added: {}, removed: [] });
  assert.deepEqual(arrangeSlides(deck, empty), deck);
  assert.deepEqual(parseSlideList('not json'), empty);
  assert.deepEqual(parseSlideList('{"order":"x","added":[1],"removed":null}'), { order: [], added: {}, removed: [] });
});

test('a saved list is read defensively', () => {
  const list = parseSlideList(JSON.stringify({
    order: ['opening', 'added-a', 'added-a', 'Bad Id', 7],
    added: { 'added-a': { from: 'what', title: 'New' }, 'Bad Id': { from: 'what' }, 'added-b': { from: 'NOPE!' } },
    removed: ['closing', 'closing'],
  }));
  assert.deepEqual(list, { order: ['opening', 'added-a'], added: { 'added-a': { from: 'what', title: 'New' } }, removed: ['closing'] });
});

test('an added slide is a copy of a deck slide, placed right after the chosen one', () => {
  const list = listAfterAdd(deck, empty, 'what', 'added-a', 'What it is (copy)');
  assert.deepEqual(ids(list), ['opening', 'what', 'added-a', 'closing']);
  const added = arrangeSlides(deck, list)[2];
  assert.deepEqual(added, { id: 'added-a', headline: 'What it is (copy)', notes: '', manualBuild: true, added: true, from: 'what' });

  /* a copy of a copy still descends from the deck slide */
  const again = listAfterAdd(deck, list, 'added-a', 'added-b', 'Another');
  assert.deepEqual(ids(again), ['opening', 'what', 'added-a', 'added-b', 'closing']);
  assert.equal(again.added['added-b'].from, 'what');
});

test('deleting a deck slide leaves it out; it can be brought back to its usual place', () => {
  const without = listAfterRemove(deck, empty, 'what');
  assert.deepEqual(ids(without), ['opening', 'closing']);
  assert.deepEqual(without.removed, ['what']);
  const back = listAfterRestore(deck, without, 'what');
  assert.deepEqual(ids(back), ['opening', 'what', 'closing']);
  assert.deepEqual(back.removed, []);

  /* the first slide comes back first, even with added slides around */
  let list = listAfterAdd(deck, empty, 'opening', 'added-a', 'Extra');
  list = listAfterRemove(deck, list, 'opening');
  assert.deepEqual(ids(list), ['added-a', 'what', 'closing']);
  assert.deepEqual(ids(listAfterRestore(deck, list, 'opening')), ['opening', 'added-a', 'what', 'closing']);
});

test('deleting an added slide forgets it, and a copy outlives the slide it came from', () => {
  let list = listAfterAdd(deck, empty, 'what', 'added-a', 'Copy');
  list = listAfterRemove(deck, list, 'what');
  assert.deepEqual(ids(list), ['opening', 'added-a', 'closing']);
  list = listAfterRemove(deck, list, 'added-a');
  assert.deepEqual(ids(list), ['opening', 'closing']);
  assert.deepEqual(list.added, {});
  assert.deepEqual(list.removed, ['what']);
});

test('the deck never ends up empty, and a slide new to the deck files keeps its place', () => {
  const none = { order: [], added: {}, removed: ['opening', 'what', 'closing'] };
  assert.deepEqual(ids(none), ['opening', 'what', 'closing']);
  const older = { order: ['closing', 'opening'], added: {}, removed: [] };   // saved before "what" existed
  assert.deepEqual(ids(older), ['closing', 'opening', 'what']);
});

test('slides can be put in any order, deck slides and added ones alike', () => {
  let list = listAfterAdd(deck, empty, 'what', 'added-a', 'Extra');
  list = listAfterMove(deck, list, 'closing', 0);
  assert.deepEqual(ids(list), ['closing', 'opening', 'what', 'added-a']);
  list = listAfterMove(deck, list, 'added-a', 1);
  assert.deepEqual(ids(list), ['closing', 'added-a', 'opening', 'what']);
  list = listAfterMove(deck, list, 'closing', 99);
  assert.deepEqual(ids(list), ['added-a', 'opening', 'what', 'closing']);
  /* the order survives being saved and read back, and a later delete or restore */
  list = parseSlideList(JSON.stringify(list));
  assert.deepEqual(ids(listAfterRemove(deck, list, 'opening')), ['added-a', 'what', 'closing']);
  assert.deepEqual(ids(listAfterRestore(deck, listAfterRemove(deck, list, 'what'), 'what')), ['added-a', 'opening', 'what', 'closing']);
});

test('a brand-new slide can be framed like a named deck slide instead of the open one', () => {
  const list = listAfterAdd(deck, empty, 'what', 'added-a', 'Imported', 'opening');
  assert.deepEqual(ids(list), ['opening', 'what', 'added-a', 'closing']);
  assert.equal(list.added['added-a'].from, 'opening');
  assert.equal(arrangeSlides(deck, list)[2].manualBuild, false);
});

test('a slide is named by the first heading in its saved HTML', () => {
  assert.equal(headingOf('<header><h2 class="source-title">Who  qualifies\n&amp; <em>why</em></h2></header><h2>Second</h2>'), 'Who qualifies & why');
  assert.equal(headingOf('<div><h1 class="source-title" data-source-block="0">REVERSE\nMORTGAGES</h1></div>'), 'REVERSE MORTGAGES');
  assert.equal(headingOf('<p>No heading here</p>'), '');
  assert.equal(headingOf(''), '');
  assert.equal(headingOf(undefined), '');
});

test('a Webinar Studio webinar\'s title is read from its saved details', () => {
  assert.equal(webinarTitle([{ slideId: '_webinar', html: '{"title":"  First-time buyers "}' }]), 'First-time buyers');
  assert.equal(webinarTitle([{ slideId: '_webinar', html: 'nope' }]), '');
  assert.equal(webinarTitle([{ slideId: 'opening', html: '<h1>x</h1>' }]), '');
});

const links = brandLinks('https://msfgmortgage.com/webinars/first-home-without-mystery/index.html', SLIDE_FORMAT.logos);

test('the brand links point at the deck\'s own logo files', () => {
  assert.deepEqual(links, {
    logo: 'https://msfgmortgage.com/webinars/first-home-without-mystery/assets/brand/logo-horizontal.svg',
    logoOnDark: 'https://msfgmortgage.com/webinars/first-home-without-mystery/assets/brand/logo-horizontal-knockout.svg',
    equalHousing: 'https://msfgmortgage.com/webinars/first-home-without-mystery/assets/brand/EQUAL%20HOUSING%20LENDER.png',
  });
  const footer = footerHtml(links);
  assert.ok(footer.includes(links.logo) && footer.includes(links.equalHousing));
  assert.ok(footer.includes('class="slide-footer"') && footer.includes('NMLS# 1314257') && footer.includes('Licensed in'));
});

test('the brand files the format names exist in this deck', () => {
  for (const path of Object.values(SLIDE_FORMAT.logos)) {
    assert.ok(existsSync(new URL(`../${decodeURIComponent(path)}`, import.meta.url)), `missing: ${path}`);
  }
});

test('the one-slide prompt carries the format, the footer and the slide that is open', () => {
  const prompt = buildSlidePrompt({
    deckTitle: 'Your first home, without the mystery.',
    links,
    format: SLIDE_FORMAT,
    slide: { title: 'Three questions', html: '<h2 class="headline">Three questions</h2>', css: '.x { color: red; }', js: '', reference: '.headline {\n  color: var(--text-head-light);\n}' },
  });
  for (const expected of ['three code blocks', '1920 x 1080', '<div class="slide-footer">', '<div class="slide-header">', links.logo, links.logoOnDark,
    links.equalHousing, 'card-grid', 'data-modal', 'variable named slide', 'THE SLIDE I HAVE OPEN NOW ("Three questions")',
    '<h2 class="headline">Three questions</h2>', '.x { color: red; }', 'THE DECK STYLES THIS SLIDE USES NOW', 'color: var(--text-head-light);', 'WHAT I WANT']) {
    assert.ok(prompt.includes(expected), `missing: ${expected}`);
  }
  assert.ok(!buildSlidePrompt({ links, format: SLIDE_FORMAT }).includes('THE SLIDE I HAVE OPEN NOW'));
  /* a deck with no format of its own still gets the general rules and the open slide */
  const plain = buildSlidePrompt({ slide: { title: 'Any', html: '<h2>Any</h2>', css: '', js: '' } });
  assert.ok(plain.includes('1920 x 1080') && plain.includes('<h2>Any</h2>') && !plain.includes('card-grid'));
  assert.deepEqual(brandLinks('https://example.com/deck/index.html'), {});
});

test('the multi-slide prompt asks for one JSON block the editor can read back', () => {
  const prompt = buildProjectPrompt({ deckTitle: 'Your first home, without the mystery.', links, format: SLIDE_FORMAT, example: { html: '<h2 class="headline">Plain</h2>', reference: '' } });
  assert.ok(prompt.includes('A SLIDE FROM THIS DECK TO MODEL YOURS ON') && prompt.includes('<h2 class="headline">Plain</h2>'));
  for (const expected of ['Return raw, valid JSON only', 'Do NOT wrap the response in Markdown code fences', 'Do NOT write ```json',
    'Do NOT include commentary', 'The first character of the response must be {', 'The final character must be }', 'JSON.parse()',
    PROJECT_SHAPE, `At most ${MAX_PROJECT_SLIDES} slides`, links.equalHousing, 'WHAT I WANT']) {
    assert.ok(prompt.includes(expected), `missing: ${expected}`);
  }
  assert.ok(!/^```json$/m.test(prompt), 'the shape must not be shown inside a json code fence');
  assert.ok(!prompt.includes('ONE code block'));
  assert.equal(parseSlideProject(PROJECT_SHAPE).slides.length, 1);
  /* the one-slide prompt keeps its three code blocks */
  assert.ok(!buildSlidePrompt({ links, format: SLIDE_FORMAT }).includes('raw, valid JSON'));
});

test('a pasted multi-slide answer is read with or without its wrapping', () => {
  const slides = [{ title: 'One', html: '<h2>One "quoted"</h2>\n<p>x</p>', css: '', js: '' }, { html: '<h2>Two</h2>', css: 'h2 { color: red; }' }];
  const json = JSON.stringify({ slides });
  const expected = [
    { title: 'One', html: '<h2>One "quoted"</h2>\n<p>x</p>', css: '', js: '' },
    { title: 'Slide 2', html: '<h2>Two</h2>', css: 'h2 { color: red; }', js: '' },
  ];
  const pretty = JSON.stringify({ slides }, null, 2);
  for (const answer of [
    json,
    pretty,
    `  \n\n${pretty}\n\n  `,
    `\`\`\`json\n${pretty}\n\`\`\``,
    `\`\`\`JSON\r\n${pretty}\r\n\`\`\`\r\n`,
    `\`\`\`\n${pretty}\n\`\`\``,
    `Here you go:\n\`\`\`json\n${json}\n\`\`\`\nEnjoy!`,
    `Here you go:\n${pretty}\nEnjoy!`,
    JSON.stringify(slides),
  ]) {
    assert.deepEqual(parseSlideProject(answer).slides, expected, answer.slice(0, 40));
  }
});

test('braces and fences outside the JSON do not throw the reading off', () => {
  const slides = [{ title: 'A', html: '<div class="x-a">{ not json } [1]</div>', css: '& { color: #fff; }', js: 'if (a) { b(); }' }];
  const pretty = JSON.stringify({ slides }, null, 2);
  const read = answer => parseSlideProject(answer).slides;
  /* commentary with braces before and after: first-{ to last-} would have broken this */
  assert.deepEqual(read(`Use {curly} braces like [this].\n${pretty}\nThe CSS uses & { }.`), slides);
  /* another code block before the json one */
  assert.deepEqual(read(`\`\`\`css\n.x { color: red; }\n\`\`\`\n\`\`\`json\n${pretty}\n\`\`\``), slides);
  /* a stray array in the commentary does not stand in for the slides */
  assert.deepEqual(read(`Step [1] first.\n${pretty}`), slides);
  /* fences and brackets inside the slide strings are left alone */
  const tricky = [{ title: 'T', html: '<pre>```json\n{ "a": [1, 2] }\n```</pre>', css: '', js: 'const s = "\\"}";' }];
  assert.deepEqual(read(JSON.stringify({ slides: tricky }, null, 2)), tricky);
  assert.deepEqual(read(`\`\`\`json\n${JSON.stringify({ slides: tricky }, null, 2)}\n\`\`\``), tricky);
});

test('an answer that cannot be used says why', () => {
  assert.match(parseSlideProject('').error, /Paste the whole answer/);
  assert.match(parseSlideProject('{"slides": [').error, /could not be read.*cut off/);
  assert.match(parseSlideProject('{"slides": [{"html": "<p>a</p>"}],}').error, /could not be read as JSON/);
  assert.match(parseSlideProject('Sure! Here are your slides.').error, /Paste the whole answer/);
  assert.match(parseSlideProject('{"slides": []}').error, /No slides/);
  assert.match(parseSlideProject('{"pages": [{}]}').error, /No slides/);
  assert.match(parseSlideProject(JSON.stringify({ slides: [{ html: '<p>a</p>' }, { html: '  ' }] })).error, /Slide 2 has no HTML/);
  const many = { slides: Array.from({ length: MAX_PROJECT_SLIDES + 1 }, () => ({ html: '<p>x</p>' })) };
  assert.match(parseSlideProject(JSON.stringify(many)).error, /the most that can be added/);
});
