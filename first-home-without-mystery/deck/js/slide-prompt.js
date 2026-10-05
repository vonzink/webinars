/* ============================================================================
   SLIDE PROMPTS — the AI workflows behind Slide settings and Webinar Suite.
   Three prompts to paste into Claude or ChatGPT, and the readers for what
   comes back:
   - one slide: three code blocks (HTML, CSS, JS)           buildSlidePrompt / parseSlideAnswer
   - several slides, added or changed: one JSON object     buildProjectPrompt / parseSlideProject
   - a whole new presentation: one JSON object             buildPresentationPrompt / parsePresentation
   The general rules are here; what is particular to a deck (its layout, its
   ready-made classes, its footer and logos) comes from that deck's
   content/slide-format.js. Nothing here runs the JavaScript it reads.
   ========================================================================= */

export const MAX_PROJECT_SLIDES = 60;
const MAX_REFERENCE_CHARS = 9000;
const MAX_MASTER_REFERENCE_CHARS = 6000;
const MAX_MASTER_CLASSES = 80;
const MAX_ERRORS = 8;

/* The Dashboard API's limits on one saved edit (bytes, UTF-8). */
export const LIMITS = Object.freeze({ html: 200 * 1024, css: 100 * 1024, js: 100 * 1024 });

/* Full links to the deck's brand files, wherever the deck is being served from. */
export function brandLinks(deckUrl, logos = {}) {
  return Object.fromEntries(Object.entries(logos).map(([name, path]) => [name, new URL(path, deckUrl).href]));
}

const block = (language, code) => `\`\`\`${language}\n${String(code || '').trim()}\n\`\`\``;
const bytes = value => new TextEncoder().encode(String(value)).length;
const kb = limit => `${Math.round(limit / 1024)} KB`;

/* What every slide must follow, whichever prompt it is part of. */
function slideRules(format, links, presenter) {
  return [
    'HOW A SLIDE WORKS',
    '- A slide is a fixed 1920 x 1080 px canvas (16:9) that is scaled to fit the screen. Size everything in px. Do not use vw, vh, rem or media queries. Nothing may overflow the canvas; there is no scrolling.',
    '- A slide\'s HTML is the INSIDE of the slide. Do not include <html>, <head>, <body>, <section>, <style> or <script> tags.',
    '',
    ...(format?.notes ? [...format.notes(links, presenter), ''] : []),
    'BRAND',
    '- Colors: dark green #0C3335 (var(--forest)), mid green #14494B, sage #4b7b4d (var(--sage)), accent green #8cc63E (var(--green)) used sparingly, body text #404041 (var(--charcoal)), light background #F5F7F4, white #FFFFFF.',
    '- Fonts (already loaded): headings font-family: var(--font-display) (Montserrat, weights 600 to 900); body font-family: var(--font-body) (Open Sans, 400 and 600). Do not load other fonts.',
    '- Style: squared corners, no drop shadows, no emoji, plenty of white space. Body text no smaller than 24px so it reads on a shared screen.',
    '- Images must use full https:// links.',
    '',
    'CSS RULES',
    '- A slide\'s CSS applies to that slide only, so write ordinary selectors, for example .x-card { padding: 30px; }.',
    '- Use & for the slide itself. For a dark slide: & { background: #0C3335; color: #FFFFFF; }.',
    '- Start your own class names with x- so they cannot clash with the deck\'s classes.',
    '- No @import. Leave the CSS empty if the deck\'s own classes are enough.',
    '',
    'JS RULES',
    '- Optional. Leave it empty unless the slide needs behavior.',
    '- The code runs every time the slide is shown. A variable named slide is already defined and is the slide\'s element; find things with slide.querySelector(...).',
    '- Because it runs again on every showing, do not add the same element or event listener twice.',
    '- Plain JavaScript only: no imports, no libraries, no document.write.',
    '',
    'STEP-BY-STEP REVEALS',
    'Add class="build" to an element (for example each card) and it appears in turn instead of all at once.',
  ];
}

const forDeck = deckTitle => (deckTitle ? ` called "${deckTitle}"` : '');
const wanted = (request, example) => ['', 'WHAT I WANT', String(request || '').trim() || example];

/* The rule of a JSON answer, shared by the multi-slide and presentation
   prompts. One code block, because that is what copies cleanly: the chat
   turns plain-text JSON into curly quotes and swallows HTML tags, and the
   block has its own copy button. */
const JSON_BLOCK_RULES = [
  'HOW TO ANSWER:',
  '- Put the whole answer inside ONE Markdown code block that opens with ```json and closes with ```. Nothing before the block and nothing after it: no sentences, no second block.',
  '- Inside the block is one JSON object and nothing else. Its first character is { and its last character is }.',
  '- The object must be directly parseable with JSON.parse(): straight double quotes only, every string escaped properly for JSON (quotes as \\", line breaks as \\n), no comments, no trailing commas.',
  '- If the full answer would be too long to finish, use fewer or simpler slides rather than stopping partway. A cut-off answer cannot be used at all.',
];

/* The deck's own CSS rules that the open slide uses, so the answer can reuse
   its classes; cut short if the slide uses a great many. */
function referenceLines(reference) {
  const css = String(reference || '').trim();
  if (!css) return [];
  const shown = css.length > MAX_REFERENCE_CHARS ? `${css.slice(0, MAX_REFERENCE_CHARS)}\n/* ...more rules not shown */` : css;
  return ['', 'THE DECK STYLES THIS SLIDE USES NOW (already loaded; reuse these classes, do not repeat the rules)', block('css', shown)];
}

/* The Master CSS: the rules that reach this slide, then the names of its other
   classes, so a slide can reuse the presentation's design system without the
   whole stylesheet being pasted in. `master` is { rules, classes }. */
function masterLines(master) {
  const rules = String(master?.rules || '').trim();
  const classes = (master?.classes || []).slice(0, MAX_MASTER_CLASSES);
  if (!rules && !classes.length) return [];
  const lines = ['', 'THE PRESENTATION\'S MASTER CSS (shared by every slide; reuse it, do not repeat or change these rules)'];
  if (rules) {
    lines.push('Rules this slide uses now:', block('css', rules.length > MAX_MASTER_REFERENCE_CHARS
      ? `${rules.slice(0, MAX_MASTER_REFERENCE_CHARS)}\n/* ...more rules not shown */` : rules));
  }
  if (classes.length) lines.push(`Other classes it defines, ready to use: ${classes.map(name => `.${name}`).join(', ')}`);
  return lines;
}

/* One slide. `slide` is the slide open in the editor ({ title, wrapper, html,
   css, js, reference, master }), included so the assistant can change it
   instead of starting from nothing. `request` is what the person typed. */
export function buildSlidePrompt({ deckTitle, links = {}, format, presenter, slide, request }) {
  const parts = [
    `I am building one slide for a Mountain State Financial Group (MSFG) webinar deck${forDeck(deckTitle)}. I will paste your answer into a slide editor that has three boxes: HTML, CSS and JS.`,
    '',
    'YOUR ANSWER',
    'Reply with exactly three code blocks, in this order, labelled html, css and js. If a box should stay empty, give an empty code block. Put nothing else inside the code blocks. After them, add one or two sentences on what you changed.',
    '',
    ...slideRules(format, links, presenter),
  ];
  if (slide) {
    parts.push(
      '',
      `THE SLIDE I HAVE OPEN NOW${slide.title ? ` ("${slide.title}")` : ''}`,
      'Start from this when I ask for a change. When I ask for a new slide, keep its overall structure (the title area and the footer at the end) and replace the body.',
      ...(slide.wrapper ? [
        `The deck wraps this slide in ${slide.wrapper}, which you cannot change. data-bg="dark" means a dark green background with light text; "white" or "mist" means a light background. Other classes on the wrapper bring that layout's own styling.`,
      ] : []),
      block('html', slide.html),
      block('css', slide.css),
      block('js', slide.js),
      ...referenceLines(slide.reference),
      ...masterLines(slide.master),
    );
  }
  parts.push(...wanted(request, '[Describe the slide here. For example: "Make a slide titled Three ways to receive proceeds, with three cards: lump sum, monthly payments, line of credit." or "Shorten the bullets on this slide and make the title two lines."]'));
  return parts.join('\n');
}

export const PROJECT_SHAPE = JSON.stringify({
  slides: [
    { title: 'Short name shown in the slide list', html: 'the slide\'s HTML as one string', css: 'CSS for this slide only, or an empty string', js: 'JS for this slide only, or an empty string' },
  ],
}, null, 2);

export const REPLACE_SHAPE = JSON.stringify({
  slides: [
    { id: 'the id of the slide, exactly as given', title: 'Short name shown in the slide list', html: 'the slide\'s complete new HTML as one string', css: 'CSS for this slide only, or an empty string', js: 'JS for this slide only, or an empty string' },
  ],
}, null, 2);

export const PRESENTATION_SHAPE = JSON.stringify({
  title: 'Presentation title',
  masterCss: 'CSS shared by every slide',
  slides: [
    { title: 'Short title shown in the slide list', html: 'Complete HTML inside the slide', css: 'Slide-specific CSS or an empty string', js: 'Slide-specific JavaScript or an empty string' },
  ],
}, null, 2);

/* Several slides at once, as one JSON object (see parseSlideProject).
   mode 'add':     new slides, placed after `insertAfter`.
   mode 'replace': new versions of the `selected` slides, matched by id.
   `outline` is the deck as it stands ([{ id, title }]); `masterClasses` the
   classes the Master CSS defines; `example` a plain slide from this deck
   ({ html, reference }) to model new slides on. */
export function buildProjectPrompt({
  deckTitle, links = {}, format, presenter, example, request,
  mode = 'add', outline = [], insertAfter = '', selected = [], masterClasses = [],
}) {
  const replace = mode === 'replace';
  const parts = [
    replace
      ? `I am changing some slides of a Mountain State Financial Group (MSFG) webinar deck${forDeck(deckTitle)}. I will paste your whole answer into a slide editor, which updates each slide you return.`
      : `I am adding a set of slides to a Mountain State Financial Group (MSFG) webinar deck${forDeck(deckTitle)}. I will paste your whole answer into a slide editor, which adds every slide in one go.`,
    '',
    'YOUR ANSWER',
    'Return one JSON object in exactly this shape, inside one ```json code block:',
    '',
    replace ? REPLACE_SHAPE : PROJECT_SHAPE,
    '',
    ...JSON_BLOCK_RULES,
    '',
    ...(replace ? [
      '- Return one object for each slide you change. Its "id" must be one of the ids given below, exactly as written. Do not invent ids, and do not return a slide you were not given.',
      '- Each html is the slide\'s complete new HTML, not a list of changes.',
    ] : [
      `- One object per new slide, in presentation order. At most ${MAX_PROJECT_SLIDES} slides.`,
    ]),
    '- Each slide stands alone: any CSS or JS a slide needs goes in that slide\'s own css and js, even if another slide uses the same thing.',
    '- Do not write Master CSS: the presentation\'s shared styles stay as they are.',
    '- Every slide\'s html includes the footer.',
  ];
  if (outline.length) {
    parts.push('', 'THE PRESENTATION NOW (slide number, title)');
    outline.forEach((slide, index) => {
      const marks = [];
      if (!replace && slide.id === insertAfter) marks.push('<- the new slides go right after this one');
      if (replace && selected.some(chosen => chosen.id === slide.id)) marks.push(`<- to change (id "${slide.id}")`);
      parts.push(`${index + 1}. ${slide.title}${marks.length ? `   ${marks.join(' ')}` : ''}`);
    });
  }
  if (masterClasses.length) {
    parts.push('', `DESIGN SYSTEM: the Master CSS already styles every slide and defines these classes, ready to use: ${masterClasses.slice(0, MAX_MASTER_CLASSES).map(name => `.${name}`).join(', ')}`);
  }
  if (!replace) {
    parts.push(
      '',
      'A GOOD SET OF SLIDES',
      '- One idea per slide. Short headlines, few words, large type. A slide is read from across a room or on a shared screen.',
      '- Vary the layouts (bullets, cards, callouts, one big number) instead of repeating one.',
    );
  }
  parts.push('', ...slideRules(format, links, presenter));
  if (replace && selected.length) {
    parts.push('', 'THE SLIDES TO CHANGE');
    selected.forEach(slide => {
      parts.push('', `id "${slide.id}" ("${slide.title}")`, block('html', slide.html), block('css', slide.css), block('js', slide.js));
    });
  } else if (example) {
    parts.push(
      '',
      'A SLIDE FROM THIS DECK TO MODEL YOURS ON',
      'Each new slide is placed in the same kind of frame as this one. Keep its overall structure (the title area and the footer at the end) and replace the body.',
      block('html', example.html),
      ...referenceLines(example.reference),
    );
  }
  parts.push(...wanted(request, replace
    ? '[Describe the change here. For example: "Make these slides shorter and use cards instead of bullets."]'
    : '[Describe the slides here: the topic, about how many slides, and the points to cover. For example: "Three slides on how down payment assistance works in Colorado: who qualifies, the main programs, and the steps."]'));
  return parts.join('\n');
}

/* A presenter as the prompts and the footer need it. Presenters come from the
   deck's content/presenters.js today; the same shape can come from the
   /loan-officers API later. */
export function presenterData(raw = {}) {
  const text = value => (typeof value === 'string' ? value.trim() : '');
  return {
    id: text(raw.id) || text(raw.key),
    name: text(raw.name),
    title: text(raw.title),
    nmls: text(raw.nmls),
    phone: text(raw.phone),
    email: text(raw.email),
  };
}

/* A whole new presentation, as one JSON object (see parsePresentation).
   `format` is the Webinar Suite deck's slide format; `presenter` the person
   presenting, whose details go on the title slide, the closing slide and the
   footer. */
export function buildPresentationPrompt({ links = {}, format, presenter, request, maxSlides = MAX_PROJECT_SLIDES }) {
  const who = presenter ? presenterData(presenter) : null;
  return [
    'I am creating a complete new webinar presentation for Mountain State Financial Group (MSFG), a mortgage company. I will paste your whole answer into our presentation builder, which creates the presentation in one go.',
    '',
    'YOUR ANSWER',
    'Return one JSON object in exactly this shape, inside one ```json code block:',
    '',
    PRESENTATION_SHAPE,
    '',
    ...JSON_BLOCK_RULES,
    '',
    `- "slides" has one object per slide, in presentation order. At most ${maxSlides} slides.`,
    '- Every slide has a non-empty "title" and "html". "css" and "js" are strings (empty if not needed).',
    '- Every slide\'s html ends with the footer.',
    '',
    'MASTER CSS (the presentation\'s design system)',
    '- "masterCss" holds every reusable rule: variables, typography, the common slide structure, headers, cards, callouts, comparisons, tables, statistics, image treatment and other components the slides share.',
    '- Every selector in masterCss must start with .slide, for example .slide .x-card { ... } or .slide h2 { ... }. Declare variables on .slide, for example .slide { --x-accent: #8cc63E; }.',
    '- Never use :root, html, body, * or any selector that does not start with .slide: those would change the editing screens around the slides.',
    '- No @import and no @font-face. @media is not needed (the canvas is fixed). @keyframes is fine.',
    '- Start your own class names with x- so they cannot clash with the deck\'s classes. Do not restyle the footer.',
    `- At most ${kb(LIMITS.css)} of CSS.`,
    '- Put only what one slide needs in that slide\'s "css". Use & for the slide itself, for example a dark slide: & { background: #0C3335; color: #FFFFFF; }.',
    '',
    'A GOOD PRESENTATION',
    '- Start with a title slide and end with a questions or contact slide that shows the presenter\'s details.',
    '- One idea per slide. Short headlines, few words, large type. A slide is read from across a room or on a shared screen.',
    '- Vary the layouts (bullets, cards, callouts, comparisons, one big number) instead of repeating one.',
    '- Educational, calm and accurate: no pressure, no guarantees about rates or approval. Numbers are examples, labelled as such.',
    ...(who?.name ? [
      '',
      'THE PRESENTER',
      `- Name: ${who.name}`,
      ...(who.title ? [`- Title: ${who.title}`] : []),
      ...(who.nmls ? [`- ${who.nmls}`] : []),
      ...(who.phone ? [`- Phone: ${who.phone}`] : []),
      ...(who.email ? [`- Email: ${who.email}`] : []),
      '- Use these details exactly; do not invent others.',
    ] : []),
    '',
    ...slideRules(format, links, who || undefined),
    ...wanted(request, '[Describe the presentation here: the topic, who it is for, about how many slides, and the points to cover. For example: "A 10-slide webinar for first-time buyers on how down payment assistance works in Colorado: who qualifies, the main programs, common myths, the steps, and next steps."]'),
  ].join('\n');
}

/* ---- reading the answers ------------------------------------------------- */

const COPY_ALL = 'Copy the complete response from ChatGPT or Claude and paste it here.';
const CUT_OFF = `The response looks cut off: it stops before the JSON is finished. ${COPY_ALL} If it stopped partway, ask for fewer slides at a time.`;
const MAX_SCAN_STARTS = 200;

/* Where the JSON value opening at `start` closes, skipping brackets inside
   strings; -1 if it never does. */
function closingIndex(text, start = 0) {
  let depth = 0;
  let inString = false;
  for (let i = start; i < text.length; i += 1) {
    const char = text[i];
    if (inString) {
      if (char === '\\') i += 1;
      else if (char === '"') inString = false;
    } else if (char === '"') inString = true;
    else if (char === '{' || char === '[') depth += 1;
    else if (char === '}' || char === ']') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/* { data } for a JSON object, { list: true } for a JSON array, else null. */
function parseObject(text) {
  try {
    const data = JSON.parse(text);
    if (Array.isArray(data)) return { list: true };
    return data && typeof data === 'object' ? { data } : null;
  } catch {
    return null;
  }
}

/* The Markdown code blocks in `text`: { language, body, closed }. A block the
   answer never closes runs to the end. */
function codeBlocks(text) {
  const blocks = [];
  const lines = text.split(/\r?\n/);
  let open = null;
  lines.forEach((line, index) => {
    const fence = /^[ \t]*```[ \t]*([\w-]*)[ \t]*$/.exec(line);
    if (!fence) return;
    if (!open) { open = { language: fence[1].toLowerCase(), at: index }; return; }
    blocks.push({ language: open.language, body: lines.slice(open.at + 1, index).join('\n'), closed: true });
    open = null;
  });
  if (open) blocks.push({ language: open.language, body: lines.slice(open.at + 1).join('\n'), closed: false });
  return blocks;
}

/* Each complete { } in the text (never one inside another), and whether one
   was left unfinished. */
function objectsIn(text) {
  const found = [];
  let from = 0;
  for (let tries = 0; tries < MAX_SCAN_STARTS; tries += 1) {
    const start = text.indexOf('{', from);
    if (start < 0) return { found, unfinished: false };
    const end = closingIndex(text, start);
    if (end < 0) return { found, unfinished: true };
    found.push(text.slice(start, end + 1));
    from = end + 1;
  }
  return { found, unfinished: false };
}

const LIST = 'The response is a list, not the expected object. Ask ChatGPT or Claude to answer in the shape the prompt shows, starting with {.';
const SEVERAL = 'The response has more than one block of JSON, so it is not clear which one to use. Ask ChatGPT or Claude for the whole answer as one JSON block.';
const INVALID = `The JSON in the response is not valid, so it cannot be read. ${COPY_ALL} If it is complete, ask ChatGPT or Claude to put the whole answer inside one \`\`\`json code block, and copy it with that block's copy button.`;

/* The JSON object in an answer, so the whole response can be copied and
   pasted as it is: the JSON alone, the JSON in a code block, or the JSON with
   sentences before or after it. Exactly one JSON object must be found (one
   that has "slides" wins over stray examples). Returns { data } or { error }. */
export function readJsonAnswer(answer) {
  const text = String(answer || '').trim();
  if (!text) return { error: `Nothing was pasted. ${COPY_ALL}` };
  const whole = parseObject(text);
  if (whole?.data) return whole;
  if (whole?.list) return { error: LIST };

  const blocks = codeBlocks(text).filter(block => block.language === '' || block.language === 'json');
  const labelled = blocks.filter(block => block.language === 'json');
  const candidates = labelled.length ? labelled : blocks;
  if (candidates.length === 1) {
    const body = candidates[0].body.trim();
    const read = parseObject(body);
    if (read?.data) return read;
    if (read?.list) return { error: LIST };
    if (!body.startsWith('{') && !candidates[0].closed) return { error: CUT_OFF };
    return { error: body.startsWith('{') && closingIndex(body) < 0 ? CUT_OFF : INVALID };
  }
  if (candidates.length > 1) {
    const read = candidates.map(block => parseObject(block.body.trim())).filter(result => result?.data);
    const withSlides = read.filter(result => Array.isArray(result.data.slides));
    if (withSlides.length === 1) return withSlides[0];
    return { error: SEVERAL };
  }

  const { found, unfinished } = objectsIn(text);
  const objects = found.map(parseObject).filter(result => result?.data);
  const withSlides = objects.filter(result => Array.isArray(result.data.slides));
  if (withSlides.length === 1) return withSlides[0];
  if (objects.length === 1 && !withSlides.length) return objects[0];
  if (objects.length > 1) return { error: SEVERAL };
  if (unfinished) return { error: CUT_OFF };
  if (found.length) return { error: INVALID };
  return { error: `No JSON was found in what was pasted. ${COPY_ALL}` };
}

const failed = errors => ({ error: errors[0], errors: errors.slice(0, MAX_ERRORS) });
const hasImport = css => /@import\b/i.test(String(css));

/* Each slide in a JSON answer, checked field by field. Missing css and js
   are empty; a missing title comes from the slide's first heading. */
function readSlides(list, { requireId = false, allowedIds = null, max = MAX_PROJECT_SLIDES, headingOf = () => '' } = {}) {
  const errors = [];
  if (!Array.isArray(list)) return { errors: ['"slides" is missing or is not a list of slides.'] };
  if (!list.length) return { errors: ['"slides" is empty: there are no slides in the response.'] };
  if (list.length > max) return { errors: [`The response has ${list.length} slides; the most that can be used at once is ${max}.`] };
  const seen = new Set();
  const slides = [];
  list.forEach((item, index) => {
    const at = `Slide ${index + 1}`;
    if (!item || typeof item !== 'object' || Array.isArray(item)) { errors.push(`${at} is not a slide object.`); return; }
    for (const field of ['title', 'html', 'css', 'js', ...(requireId ? ['id'] : [])]) {
      if (item[field] !== undefined && typeof item[field] !== 'string') errors.push(`${at}: "${field}" must be text.`);
    }
    const html = typeof item.html === 'string' ? item.html : '';
    if (!html.trim()) errors.push(`${at} has no "html".`);
    const css = typeof item.css === 'string' ? item.css : '';
    const js = typeof item.js === 'string' ? item.js : '';
    if (hasImport(css)) errors.push(`${at}: its css uses @import, which is not allowed.`);
    for (const [field, value] of [['html', html], ['css', css], ['js', js]]) {
      if (bytes(value) > LIMITS[field]) errors.push(`${at}: its ${field} is larger than ${kb(LIMITS[field])}.`);
    }
    const slide = {
      title: ((typeof item.title === 'string' && item.title.trim()) || headingOf(html) || `Slide ${index + 1}`).slice(0, 120),
      html, css, js,
    };
    if (requireId) {
      const id = typeof item.id === 'string' ? item.id.trim() : '';
      if (!id) errors.push(`${at} has no "id", so it is not clear which slide it changes.`);
      else if (allowedIds && !allowedIds.has(id)) errors.push(`${at} has the id "${id}", which is not one of the slides chosen to change.`);
      else if (seen.has(id)) errors.push(`${at} repeats the id "${id}".`);
      seen.add(id);
      slide.id = id;
    }
    slides.push(slide);
  });
  return errors.length ? { errors } : { slides };
}

/* Read the answer to the multi-slide prompt. mode 'add' gives new slides;
   mode 'replace' gives new versions of chosen slides, each named by its id,
   which must be one of `selectedIds`. Returns { slides, ignored } or
   { error, errors }. A "masterCss" in the answer is never used here. */
export function parseSlideProject(answer, { mode = 'add', selectedIds = [], headingOf } = {}) {
  const read = readJsonAnswer(answer);
  if (read.error) return failed([read.error]);
  const replace = mode === 'replace';
  if (replace && !selectedIds.length) return failed(['Choose the slides to change first.']);
  const result = readSlides(read.data.slides, {
    requireId: replace,
    allowedIds: replace ? new Set(selectedIds) : null,
    headingOf,
  });
  if (result.errors) return failed(result.errors);
  const ignored = Object.keys(read.data).filter(key => key !== 'slides');
  return { slides: replace ? result.slides : result.slides.map(({ id, ...slide }) => slide), ignored };
}

/* ---- the Master CSS of a new presentation --------------------------------- */

const ALLOWED_AT_RULES = new Set(['media', 'supports']);
const SKIPPED_AT_RULES = new Set(['keyframes', '-webkit-keyframes']);

/* Split CSS into its top-level statements, honoring strings and comments:
   [{ prelude, body }] for blocks and [{ prelude }] for statements ending in ;.
   Returns { items } or { error }. */
function cssStatements(css) {
  const items = [];
  let prelude = '';
  let i = 0;
  while (i < css.length) {
    const char = css[i];
    if (char === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      if (end < 0) return { error: 'A comment is never closed.' };
      i = end + 2;
    } else if (char === '"' || char === '\'') {
      let j = i + 1;
      while (j < css.length && css[j] !== char) j += css[j] === '\\' ? 2 : 1;
      prelude += css.slice(i, j + 1);
      i = j + 1;
    } else if (char === '{') {
      let depth = 1;
      let j = i + 1;
      while (j < css.length && depth) {
        const next = css[j];
        if (next === '"' || next === '\'') {
          j += 1;
          while (j < css.length && css[j] !== next) j += css[j] === '\\' ? 2 : 1;
        } else if (next === '/' && css[j + 1] === '*') {
          const end = css.indexOf('*/', j + 2);
          if (end < 0) return { error: 'A comment is never closed.' };
          j = end + 1;
        } else if (next === '{') depth += 1;
        else if (next === '}') depth -= 1;
        j += 1;
      }
      if (depth) return { error: `The rule "${prelude.trim().slice(0, 60)}" is never closed with }.` };
      items.push({ prelude: prelude.trim(), body: css.slice(i + 1, j - 1) });
      prelude = '';
      i = j;
    } else if (char === ';' && prelude.trim()) {
      items.push({ prelude: prelude.trim() });
      prelude = '';
      i += 1;
    } else if (char === '}') {
      return { error: 'There is a } that closes nothing.' };
    } else {
      prelude += char;
      i += 1;
    }
  }
  if (prelude.trim()) return { error: `"${prelude.trim().slice(0, 60)}" is not a complete rule.` };
  return { items };
}

/* Comma-separated selectors, not splitting inside :is(a, b) and the like. */
function selectorsOf(prelude) {
  const out = [];
  let depth = 0;
  let current = '';
  for (const char of prelude) {
    if (char === '(' || char === '[') depth += 1;
    if (char === ')' || char === ']') depth -= 1;
    if (char === ',' && depth === 0) { out.push(current.trim()); current = ''; } else current += char;
  }
  out.push(current.trim());
  return out.filter(Boolean);
}

const SCOPED = /^\.slide(?![\w-])/;

/* The Master CSS of a new presentation applies to the whole page the slides
   sit in, so it is held to the slides: every selector starts with .slide.
   Fails closed: anything not clearly a .slide rule, @media / @supports block
   of them, or @keyframes is refused. Returns a list of problems. */
export function checkMasterCss(css) {
  const text = String(css || '');
  const problems = [];
  if (!text.trim()) return ['"masterCss" is empty. A new presentation needs its shared styles.'];
  if (bytes(text) > LIMITS.css) problems.push(`The Master CSS is larger than ${kb(LIMITS.css)}.`);
  if (hasImport(text)) problems.push('The Master CSS uses @import, which is not allowed.');
  const walk = (source, inside = '') => {
    const parsed = cssStatements(source);
    if (parsed.error) { problems.push(`The Master CSS could not be read${inside}: ${parsed.error}`); return; }
    parsed.items.forEach(({ prelude, body }) => {
      const at = /^@([\w-]+)/.exec(prelude);
      if (at) {
        const name = at[1].toLowerCase();
        if (body !== undefined && ALLOWED_AT_RULES.has(name)) walk(body, ` (inside ${prelude.slice(0, 40)})`);
        else if (body !== undefined && SKIPPED_AT_RULES.has(name)) { /* animation steps, not selectors */ }
        else if (name !== 'import') problems.push(`The Master CSS uses @${name}, which is not allowed there.`);
        return;
      }
      if (body === undefined) { problems.push(`"${prelude.slice(0, 60)}" is not a complete rule.`); return; }
      selectorsOf(prelude).forEach(selector => {
        if (!SCOPED.test(selector)) {
          problems.push(`The Master CSS rule "${selector.slice(0, 60)}" is not limited to the slides. Every selector must start with .slide.`);
        }
      });
    });
  };
  walk(text);
  return problems;
}

/* The class names a stylesheet defines (for the design-system summary). */
export function classNamesIn(css) {
  const names = new Set();
  const parsed = cssStatements(String(css || ''));
  const visit = items => items.forEach(({ prelude, body }) => {
    if (/^@(media|supports)\b/i.test(prelude) && body !== undefined) {
      const inner = cssStatements(body);
      if (inner.items) visit(inner.items);
      return;
    }
    if (prelude.startsWith('@')) return;
    for (const match of prelude.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) if (match[1] !== 'slide') names.add(match[1]);
  });
  if (parsed.items) visit(parsed.items);
  return [...names];
}

/* Read the answer to the new-presentation prompt.
   Returns { presentation: { title, masterCss, slides } } or { error, errors }. */
export function parsePresentation(answer, { maxSlides = MAX_PROJECT_SLIDES, headingOf } = {}) {
  const read = readJsonAnswer(answer);
  if (read.error) return failed([read.error]);
  const data = read.data;
  const errors = [];
  const title = typeof data.title === 'string' ? data.title.replace(/\s+/g, ' ').trim() : '';
  if (data.title !== undefined && typeof data.title !== 'string') errors.push('"title" must be text.');
  else if (!title) errors.push('The response has no "title" for the presentation.');
  if (data.masterCss === undefined) errors.push('The response has no "masterCss" (the styles shared by every slide).');
  else if (typeof data.masterCss !== 'string') errors.push('"masterCss" must be text.');
  else errors.push(...checkMasterCss(data.masterCss));
  if (data.slides === undefined) errors.push('The response has no "slides".');
  else {
    const result = readSlides(data.slides, { max: maxSlides, headingOf });
    if (result.errors) errors.push(...result.errors);
    else if (!errors.length) return { presentation: { title: title.slice(0, 120), masterCss: data.masterCss, slides: result.slides } };
  }
  return failed(errors);
}

/* Read the answer to the one-slide prompt: the code blocks labelled html, css
   and js (unlabelled blocks fill whichever are left, in that order). Text
   around the blocks is fine here. Returns { html, css, js } or { error }. */
export function parseSlideAnswer(answer) {
  const text = String(answer || '');
  const found = {};
  const loose = [];
  for (const match of text.matchAll(/^[ \t]*```[ \t]*([\w-]*)[ \t]*\r?\n([\s\S]*?)\r?\n?[ \t]*```[ \t]*$/gm)) {
    const label = match[1].toLowerCase();
    const body = match[2];
    const field = { html: 'html', css: 'css', js: 'js', javascript: 'js' }[label];
    if (field && found[field] === undefined) found[field] = body;
    else if (!label) loose.push(body);
  }
  ['html', 'css', 'js'].forEach(field => { if (found[field] === undefined && loose.length) found[field] = loose.shift(); });
  if (found.html === undefined) {
    return { error: /```/.test(text)
      ? 'No html code block was found. The response should have three code blocks: html, css and js.'
      : `Nothing to use was found. ${COPY_ALL} It should have three code blocks: html, css and js.` };
  }
  if (!found.html.trim()) return { error: 'The html code block is empty.' };
  if (hasImport(found.css || '')) return { error: 'The css uses @import, which is not allowed.' };
  return { html: found.html.trim(), css: (found.css || '').trim(), js: (found.js || '').trim() };
}

/* ---- the footer ----------------------------------------------------------- */

/* The deck's footer, which is what every imported slide gets, whatever footer
   the assistant wrote: { className, light, dark }. `dark` uses the white logo. */
export function footerSpec(format, links, presenter) {
  if (!format?.footer) return null;
  const light = format.footer.html(links, presenter);
  const dark = links.logo && links.logoOnDark ? light.split(links.logo).join(links.logoOnDark) : light;
  /* The white logo's file name, not its full address: a footer the deck drew
     itself (and an AI kept) links it relatively. */
  const darkMark = decodeURIComponent(String(links.logoOnDark || '').split(/[?#]/)[0].split('/').pop() || '');
  return { className: format.footer.className, light, dark, darkMark };
}

const TAG = /<!--[\s\S]*?-->|<\/?([a-zA-Z][\w-]*)(?:"[^"]*"|'[^']*'|[^>"'])*>/g;

/* Where each element carrying `className` starts and ends in `html`. An
   element that is never closed runs to the end, as a browser would read it. */
function elementsWithClass(html, className) {
  const ranges = [];
  const hasClass = tag => {
    const match = /\sclass\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(tag);
    return Boolean(match) && (match[2] ?? match[3] ?? match[4]).split(/\s+/).includes(className);
  };
  TAG.lastIndex = 0;
  let open = null;
  let match;
  while ((match = TAG.exec(html))) {
    const [token, name] = match;
    if (!name) continue;
    const tag = name.toLowerCase();
    const closing = token.startsWith('</');
    if (!open) {
      if (!closing && hasClass(token)) {
        if (token.endsWith('/>')) ranges.push([match.index, TAG.lastIndex]);
        else open = { tag, start: match.index, depth: 1 };
      }
    } else if (tag === open.tag && !token.endsWith('/>')) {
      open.depth += closing ? -1 : 1;
      if (!open.depth) { ranges.push([open.start, TAG.lastIndex]); open = null; }
    }
  }
  if (open) ranges.push([open.start, html.length]);
  return ranges;
}

/* Make sure a slide carries the deck's own footer exactly once. The first
   footer the slide has is replaced by the deck's (the white-logo one if it
   used the white logo) and any others are removed; nothing else changes.
   With no footer, the deck's is added at the end when `required`.
   Returns { html, action: 'kept' | 'replaced' | 'added' | 'none' }. */
export function normalizeFooter(html, spec, { required = true } = {}) {
  const source = String(html || '');
  if (!spec) return { html: source, action: 'none' };
  const ranges = elementsWithClass(source, spec.className);
  if (!ranges.length) {
    return required ? { html: `${source.replace(/\s+$/, '')}\n${spec.light}`, action: 'added' } : { html: source, action: 'none' };
  }
  const first = source.slice(ranges[0][0], ranges[0][1]);
  const dark = Boolean(spec.darkMark) && ranges.some(([start, end]) => source.slice(start, end).includes(spec.darkMark));
  const footer = dark ? spec.dark : spec.light;
  let out = '';
  let from = 0;
  ranges.forEach(([start, end], index) => {
    out += source.slice(from, start) + (index === 0 ? footer : '');
    from = end;
    if (index > 0) out = out.replace(/[ \t]*\r?\n?[ \t]*$/, '');   // the line the removed footer stood on
  });
  out += source.slice(from);
  const action = ranges.length === 1 && first === footer ? 'kept' : 'replaced';
  return { html: out, action };
}
