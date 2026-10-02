import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';
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

const links = brandLinks('https://msfgmortgage.com/webinars/homebuyers-webinar/index.html', SLIDE_FORMAT.logos);

test('the brand links point at the deck\'s own logo files, which exist', () => {
  assert.deepEqual(links, {
    logo: 'https://msfgmortgage.com/webinars/homebuyers-webinar/assets/brand/logo-horizontal.svg',
    logoOnDark: 'https://msfgmortgage.com/webinars/homebuyers-webinar/assets/brand/logo-horizontal-knockout.svg',
    equalHousing: 'https://msfgmortgage.com/webinars/homebuyers-webinar/assets/brand/EQUAL%20HOUSING%20LENDER.png',
  });
  for (const path of Object.values(SLIDE_FORMAT.logos)) {
    assert.ok(existsSync(new URL(`../${decodeURIComponent(path)}`, import.meta.url)), `missing brand file: ${path}`);
  }
  const footer = footerHtml(links);
  assert.ok(footer.includes(links.logo) && footer.includes(links.equalHousing));
  assert.ok(footer.includes('class="slide-footer"') && footer.includes('class="footer-lines"') && footer.includes('NMLS# 1314257'));
});

test('the built-in parts that an HTML edit breaks are named for the editor\'s warning', () => {
  assert.equal(SLIDE_FORMAT.interactive, '.slide-graphics, .slide-calc, .web-slot');
});

test('the one-slide prompt carries the format, the footer and the slide that is open', () => {
  const prompt = buildSlidePrompt({
    deckTitle: 'The Homebuyer\'s Playbook',
    links,
    format: SLIDE_FORMAT,
    slide: { title: 'Myths', html: '<h2 class="headline">Myths</h2>', css: '.x { color: red; }', js: '', reference: '.headline {\n  color: var(--text-head-light);\n}' },
  });
  for (const expected of ['three code blocks', '1920 x 1080', 'called "The Homebuyer\'s Playbook"', '<div class="slide-footer">', '<div class="slide-header">',
    links.logo, links.logoOnDark, links.equalHousing, 'card-grid', 'data-modal', 'variable named slide', 'THE SLIDE I HAVE OPEN NOW ("Myths")',
    '<h2 class="headline">Myths</h2>', '.x { color: red; }', 'THE DECK STYLES THIS SLIDE USES NOW', 'color: var(--text-head-light);', 'WHAT I WANT']) {
    assert.ok(prompt.includes(expected), `missing: ${expected}`);
  }
  assert.ok(!buildSlidePrompt({ links, format: SLIDE_FORMAT }).includes('THE SLIDE I HAVE OPEN NOW'));
  /* a deck with no format of its own still gets the general rules and the open slide */
  const plain = buildSlidePrompt({ slide: { title: 'Any', html: '<h2>Any</h2>', css: '', js: '' } });
  assert.ok(plain.includes('1920 x 1080') && plain.includes('<h2>Any</h2>') && !plain.includes('card-grid'));
  assert.deepEqual(brandLinks('https://example.com/deck/index.html'), {});
});

test('the multi-slide prompt asks for one JSON block the editor can read back', () => {
  const prompt = buildProjectPrompt({ deckTitle: 'The Homebuyer\'s Playbook', links, format: SLIDE_FORMAT, example: { html: '<h2 class="headline">Plain</h2>', reference: '' } });
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

test('a pasted multi-slide answer is read raw, with whitespace, or in one json or plain fence', () => {
  const slides = [{ title: 'One', html: '<h2>One "quoted"</h2>\n<p>x</p>', css: '', js: '' }, { html: '<h2>Two</h2>', css: 'h2 { color: red; }' }];
  const json = JSON.stringify({ slides });
  const expected = [
    { title: 'One', html: '<h2>One "quoted"</h2>\n<p>x</p>', css: '', js: '' },
    { title: 'Two', html: '<h2>Two</h2>', css: 'h2 { color: red; }', js: '' },
  ];
  const pretty = JSON.stringify({ slides }, null, 2);
  for (const answer of [
    json,
    pretty,
    `  \n\n${pretty}\n\n  `,
    `\`\`\`json\n${pretty}\n\`\`\``,
    `\`\`\`JSON\r\n${pretty}\r\n\`\`\`\r\n`,
    `\`\`\`\n${pretty}\n\`\`\``,
  ]) {
    assert.deepEqual(parseSlideProject(answer, { headingOf }).slides, expected, answer.slice(0, 40));
  }
  /* fences and brackets inside the slide strings are left alone */
  const tricky = [{ title: 'T', html: '<pre>```json\n{ "a": [1, 2] }\n```</pre>', css: '', js: 'const s = "\\"}";' }];
  assert.deepEqual(parseSlideProject(JSON.stringify({ slides: tricky }, null, 2)).slides, tricky);
  assert.deepEqual(parseSlideProject(`\`\`\`json\n${JSON.stringify({ slides: tricky }, null, 2)}\n\`\`\``).slides, tricky);
});

test('the whole response can be copied and pasted, whatever is written around the JSON', () => {
  const slides = [{ title: 'A', html: '<p>a {curly} [1]</p>', css: '', js: '' }];
  const pretty = JSON.stringify({ slides }, null, 2);
  for (const answer of [
    `Here you go:\n${pretty}`,
    `${pretty}\nEnjoy! Let me know about {changes}.`,
    `Here you go:\n\`\`\`json\n${pretty}\n\`\`\``,
    `Sure!\n\`\`\`json\n${pretty}\n\`\`\`\nHope this helps.`,
    `Here:\n\`\`\`\n${pretty}\n\`\`\`\nDone.`,
    `\`\`\`css\n.x { color: red; }\n\`\`\`\n\`\`\`json\n${pretty}\n\`\`\``,
    `Use braces like {this} and an example {"a": 1}.\n${pretty}`,
    `\`\`\`json\n${pretty}`,
  ]) {
    assert.deepEqual(parseSlideProject(answer).slides, slides, answer.slice(0, 30));
  }
});

test('a response that is still unclear is refused, not guessed at', () => {
  const one = JSON.stringify({ slides: [{ html: '<p>a</p>' }] });
  const two = JSON.stringify({ slides: [{ html: '<p>b</p>' }] });
  for (const [answer, reason] of [
    [`Option 1:\n${one}\nOption 2:\n${two}`, /more than one block of JSON/],
    [`\`\`\`json\n${one}\n\`\`\`\n\`\`\`json\n${two}\n\`\`\``, /more than one block of JSON/],
    [`Here you go:\n{"slides": [{"html": "<p>a</p>"`, /cut off/],
    [JSON.stringify([{ html: '<p>a</p>' }]), /is a list/],
  ]) {
    const read = parseSlideProject(answer);
    assert.equal(read.slides, undefined, answer.slice(0, 30));
    assert.match(read.error, reason);
  }
});

test('an answer that cannot be used says why', () => {
  assert.match(parseSlideProject('').error, /Nothing was pasted/);
  assert.match(parseSlideProject('{"slides": [').error, /cut off/);
  assert.match(parseSlideProject('{"slides": [{"html": "<p>a</p>"}],}').error, /not valid/);
  assert.match(parseSlideProject('Sure! Here are your slides.').error, /No JSON was found/);
  assert.match(parseSlideProject('{"slides": []}').error, /empty/);
  assert.match(parseSlideProject('{"pages": [{}]}').error, /"slides" is missing/);
  assert.match(parseSlideProject(JSON.stringify({ slides: [{ html: '<p>a</p>' }, { html: '  ' }] })).error, /Slide 2 has no "html"/);
  assert.match(parseSlideProject(JSON.stringify({ slides: [{ html: '<p>a</p>', css: 7 }] })).error, /Slide 1: "css" must be text/);
  assert.match(parseSlideProject(JSON.stringify({ slides: ['<p>a</p>'] })).error, /Slide 1 is not a slide object/);
  const many = { slides: Array.from({ length: MAX_PROJECT_SLIDES + 1 }, () => ({ html: '<p>x</p>' })) };
  assert.match(parseSlideProject(JSON.stringify(many)).error, /the most that can be used at once/);
});
