/* ============================================================================
   SLIDE PROMPTS — the text behind "Instructions" in Slide settings.
   Prompts to paste into Claude or ChatGPT so it answers with what the editor
   takes: one slide's HTML, CSS and JS, or a whole set of slides as raw JSON.
   The general rules are here; what is particular to a deck (its layout, its
   ready-made classes, its footer and logos) comes from that deck's
   content/slide-format.js.
   ========================================================================= */

export const MAX_PROJECT_SLIDES = 60;
const MAX_REFERENCE_CHARS = 9000;

/* Full links to the deck's brand files, wherever the deck is being served from. */
export function brandLinks(deckUrl, logos = {}) {
  return Object.fromEntries(Object.entries(logos).map(([name, path]) => [name, new URL(path, deckUrl).href]));
}

const block = (language, code) => `\`\`\`${language}\n${String(code || '').trim()}\n\`\`\``;

/* What every slide must follow, whichever prompt it is part of. */
function slideRules(format, links) {
  return [
    'HOW A SLIDE WORKS',
    '- A slide is a fixed 1920 x 1080 px canvas (16:9) that is scaled to fit the screen. Size everything in px. Do not use vw, vh, rem or media queries. Nothing may overflow the canvas; there is no scrolling.',
    '- A slide\'s HTML is the INSIDE of the slide. Do not include <html>, <head>, <body>, <section>, <style> or <script> tags.',
    '',
    ...(format?.notes ? [...format.notes(links), ''] : []),
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

/* The deck's own CSS rules that the open slide uses, so the answer can reuse
   its classes; cut short if the slide uses a great many. */
function referenceLines(reference) {
  const css = String(reference || '').trim();
  if (!css) return [];
  const shown = css.length > MAX_REFERENCE_CHARS ? `${css.slice(0, MAX_REFERENCE_CHARS)}\n/* ...more rules not shown */` : css;
  return ['', 'THE DECK STYLES THIS SLIDE USES NOW (already loaded; reuse these classes, do not repeat the rules)', block('css', shown)];
}

/* One slide. `slide` is the slide open in the editor ({ title, wrapper, html,
   css, js, reference }), included so the assistant can change it instead of
   starting from nothing. */
export function buildSlidePrompt({ deckTitle, links = {}, format, slide }) {
  const parts = [
    `I am building one slide for a Mountain State Financial Group (MSFG) webinar deck${forDeck(deckTitle)}. I will paste your answer into a slide editor that has three boxes: HTML, CSS and JS.`,
    '',
    'YOUR ANSWER',
    'Reply with exactly three code blocks, in this order, labelled html, css and js. If a box should stay empty, give an empty code block. Put nothing else inside the code blocks. After them, add one or two sentences on what you changed.',
    '',
    ...slideRules(format, links),
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
    );
  }
  parts.push(
    '',
    'WHAT I WANT',
    '[Describe the slide here. For example: "Make a slide titled Three ways to receive proceeds, with three cards: lump sum, monthly payments, line of credit." or "Shorten the bullets on this slide and make the title two lines."]',
  );
  return parts.join('\n');
}

export const PROJECT_SHAPE = JSON.stringify({
  slides: [
    { title: 'Short name shown in the slide list', html: 'the slide\'s HTML as one string', css: 'CSS for this slide only, or an empty string', js: 'JS for this slide only, or an empty string' },
  ],
}, null, 2);

/* Several slides at once. The answer is raw JSON the editor can take in whole
   (see parseSlideProject). `example` is a plain slide from this deck
   ({ html, reference }) to model the new slides on. */
export function buildProjectPrompt({ deckTitle, links = {}, format, example }) {
  return [
    `I am building a set of slides for a Mountain State Financial Group (MSFG) webinar deck${forDeck(deckTitle)}. I will paste your whole answer into a slide editor, which adds every slide in one go.`,
    '',
    'YOUR ANSWER',
    'Return raw, valid JSON only, in exactly this shape:',
    '',
    PROJECT_SHAPE,
    '',
    'IMPORTANT:',
    '- Do NOT wrap the response in Markdown code fences.',
    '- Do NOT write ```json.',
    '- Do NOT include commentary before or after the JSON.',
    '- The first character of the response must be {',
    '- The final character must be }',
    '- The complete response must be directly parseable with JSON.parse().',
    '',
    `- One object per slide, in presentation order. At most ${MAX_PROJECT_SLIDES} slides.`,
    '- Each slide stands alone: any CSS or JS a slide needs goes in that slide\'s own css and js, even if another slide uses the same thing.',
    '- Every slide\'s html includes the footer.',
    '- Escape the strings properly for JSON (quotes as \\", line breaks as \\n).',
    '',
    'A GOOD SET OF SLIDES',
    '- Start with a title slide and end with a questions or contact slide.',
    '- One idea per slide. Short headlines, few words, large type. A slide is read from across a room or on a shared screen.',
    '- Vary the layouts (bullets, cards, callouts, one big number) instead of repeating one.',
    '',
    ...slideRules(format, links),
    ...(example ? [
      '',
      'A SLIDE FROM THIS DECK TO MODEL YOURS ON',
      'Each new slide is placed in the same kind of frame as this one. Keep its overall structure (the title area and the footer at the end) and replace the body.',
      block('html', example.html),
      ...referenceLines(example.reference),
    ] : []),
    '',
    'WHAT I WANT',
    '[Describe the presentation here: the topic, who it is for, about how many slides, and the points to cover. For example: "A 10-slide webinar for first-time buyers on how down payment assistance works in Colorado: who qualifies, the main programs, common myths, the steps, and next steps."]',
  ].join('\n');
}

const FENCE = /^[ \t]*```[ \t]*([\w-]*)[ \t]*$/;
const MAX_SCAN_STARTS = 50;

/* The bodies of the Markdown code blocks in `text` labelled json or not
   labelled at all, in order. */
function jsonFences(text) {
  const bodies = [];
  const lines = text.split(/\r?\n/);
  let open = null;
  lines.forEach((line, index) => {
    const fence = line.match(FENCE);
    if (!fence) return;
    if (!open) { open = { language: fence[1].toLowerCase(), at: index }; return; }
    if (open.language === '' || open.language === 'json') bodies.push(lines.slice(open.at + 1, index).join('\n'));
    open = null;
  });
  return bodies;
}

/* Where the JSON object or array opening at `start` closes, skipping brackets
   inside strings; -1 if it never does. */
function closingIndex(text, start) {
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

/* Each complete, bracket-balanced { } or [ ] in `text`, in order. Never looks
   inside one it has found, so a broken answer is not mined for a part of it. */
function* balancedValues(text) {
  let from = 0;
  for (let tries = 0; tries < MAX_SCAN_STARTS; tries += 1) {
    const offset = text.slice(from).search(/[[{]/);
    if (offset < 0) return;
    const start = from + offset;
    const end = closingIndex(text, start);
    if (end > start) yield text.slice(start, end + 1);
    from = end > start ? end + 1 : start + 1;
  }
}

const isSlideList = list => Array.isArray(list) && list.every(item => item && typeof item === 'object' && !Array.isArray(item));
const isProject = data => isSlideList(data) || Array.isArray(data?.slides);

/* The JSON in an answer. Tried in order: the whole answer, then each json
   code block, then each balanced { } or [ ] in the text. The first that
   parses into slides wins; failing that, the first that parses at all. */
function readJson(text) {
  const candidates = function* () {
    yield text;
    yield* jsonFences(text);
    yield* balancedValues(text);
  };
  let fallback;
  for (const candidate of candidates()) {
    let data;
    try {
      data = JSON.parse(candidate.trim());
    } catch {
      continue;
    }
    if (isProject(data)) return { data };
    if (!fallback) fallback = { data };
  }
  return fallback || null;
}

/* Read the assistant's answer to the project prompt. Raw JSON is what the
   prompt asks for; a json code block, or a sentence around the JSON, is
   accepted too. Returns { slides } or { error }. */
export function parseSlideProject(answer) {
  const textIn = String(answer || '').trim();
  if (!/[[{]/.test(textIn)) return { error: 'Paste the whole answer first. It should start with { and end with }.' };
  const read = readJson(textIn);
  if (!read) {
    const cutOff = !/[}\]]\s*(```)?\s*$/.test(textIn);
    return {
      error: cutOff
        ? 'That could not be read: the answer looks cut off, because it does not end with }. Ask for fewer slides at a time, or paste the whole answer.'
        : 'That could not be read as JSON. Paste the whole answer, from the first { to the last }.',
    };
  }
  const data = read.data;
  const list = Array.isArray(data) ? data : data?.slides;
  if (!Array.isArray(list) || !list.length) return { error: 'No slides were found in that answer.' };
  if (list.length > MAX_PROJECT_SLIDES) return { error: `That is ${list.length} slides; the most that can be added at once is ${MAX_PROJECT_SLIDES}.` };
  const str = value => (typeof value === 'string' ? value : '');
  const slides = list.map((slide, index) => ({
    title: str(slide?.title).trim().slice(0, 120) || `Slide ${index + 1}`,
    html: str(slide?.html),
    css: str(slide?.css),
    js: str(slide?.js),
  }));
  const empty = slides.findIndex(slide => !slide.html.trim());
  if (empty >= 0) return { error: `Slide ${empty + 1} has no HTML.` };
  return { slides };
}
