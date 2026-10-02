/* ============================================================================
   SLIDE PROMPTS — the text behind "Instructions" in Slide settings.
   Prompts to paste into Claude or ChatGPT so it answers with what the editor
   takes: one slide's HTML, CSS and JS, or a whole set of slides in one block.
   They carry the deck's structure, ready-made classes, brand colors, and the
   footer with the logos.
   ========================================================================= */

const FOOTER_TEXT = 'Mountain State Financial Group, LLC • NMLS #1314257  |  Seth Angell • NMLS #912881  |  (303) 883-8519  |  <a href="https://www.msfg.us/" target="_blank" rel="noopener noreferrer">www.msfg.us</a>';
export const MAX_PROJECT_SLIDES = 60;

/* Links to the deck's own brand files, wherever the deck is being served from. */
export function brandLinks(deckUrl) {
  const at = path => new URL(path, deckUrl).href;
  return {
    logo: at('./assets/brand/logo-horizontal.svg'),
    logoOnDark: at('./assets/brand/logo-horizontal-knockout.svg'),
    equalHousing: at('./assets/brand/EQUAL%20HOUSING%20LENDER.png'),
  };
}

export function footerHtml(links) {
  return [
    '<footer class="source-footer">',
    `  <img src="${links.logo}" alt="Mountain State Financial Group">`,
    `  <p class="source-footer-copy">${FOOTER_TEXT}</p>`,
    '  <span class="source-page">1</span>',
    `  <img class="source-housing" src="${links.equalHousing}" alt="Equal Housing Lender">`,
    '</footer>',
  ].join('\n');
}

const block = (language, code) => `\`\`\`${language}\n${String(code || '').trim()}\n\`\`\``;

/* What every slide must follow, whichever prompt it is part of. */
function slideRules(links) {
  return [
    'HOW A SLIDE WORKS',
    '- A slide is a fixed 1920 x 1080 px canvas (16:9) that is scaled to fit the screen. Size everything in px. Do not use vw, vh, rem or media queries. Nothing may overflow the canvas; there is no scrolling.',
    '- A slide\'s HTML is the INSIDE of the slide. Do not include <html>, <head>, <body>, <section>, <style> or <script> tags.',
    '- The slide is a flex column with padding 58px top, 86px left and right, 24px bottom, and a 20px gap. Unless told otherwise, text is #404041 on a white background.',
    '- Keep this order: header, content, optional disclaimer, footer. The content block grows to fill the space, which keeps the footer at the bottom.',
    '',
    'HTML TO FOLLOW',
    block('html', [
      '<header class="source-header">',
      '  <h2 class="source-title">Slide title</h2>',
      '  <div class="accent-bar"></div>',
      '</header>',
      '<div class="source-content">',
      '  <!-- the body of the slide goes here -->',
      '</div>',
      '<p class="source-disclaimer">Optional small-print line.</p>',
      footerHtml(links),
    ].join('\n')),
    '',
    'THE FOOTER',
    'Every slide ends with the footer exactly as shown above: the MSFG logo, the company line, the page number, and the Equal Housing Lender logo. Do not restyle it. The page number is filled in automatically, so leave the 1.',
    `- MSFG logo (light slides): ${links.logo}`,
    `- MSFG logo (dark slides, white version): ${links.logoOnDark}`,
    `- Equal Housing Lender logo: ${links.equalHousing}`,
    '',
    'READY-MADE CLASSES (already styled by the deck; use these before writing new CSS)',
    '- source-title: the slide title (Montserrat 800, 56px, dark green). accent-bar: the short green rule under it.',
    '- source-content: the body area; a flex column, vertically centered, 26px gap.',
    '- source-lead: one or more intro paragraphs (29px).',
    '- source-bullets: a paragraph of bullets, one per line, each line starting with "• " (30px). Line breaks inside it are kept.',
    '- source-groups with style="--source-cols:3": a row of equal cards. Each card is <article class="source-group"> holding <h3 class="source-label">Label</h3> and <p class="source-copy">Text</p>.',
    '- source-callouts: a row of <aside class="source-callout"> boxes, each with an <h3> and a <p>.',
    '- source-after: closing paragraphs under the cards (29px).',
    '- source-stat: a dark green box for one big number; put source-label and source-copy inside it.',
    '- source-disclaimer: small print above the footer (19px).',
    '',
    'BRAND',
    '- Colors: dark green #0C3335 (var(--forest)), mid green #14494B, sage #4b7b4d (var(--sage)), accent green #8cc63E (var(--green)) used sparingly, body text #404041 (var(--charcoal)), light background #F5F7F4, white #FFFFFF.',
    '- Fonts (already loaded): headings font-family: var(--font-display) (Montserrat, weights 600 to 900); body font-family: var(--font-body) (Open Sans, 400 and 600). Do not load other fonts.',
    '- Style: squared corners, no drop shadows, no emoji, plenty of white space. Body text no smaller than 24px so it reads on a shared screen.',
    '- Images must use full https:// links.',
    '',
    'CSS RULES',
    '- A slide\'s CSS applies to that slide only, so write ordinary selectors, for example .x-card { padding: 30px; }.',
    '- Use & for the slide itself. For a dark slide: & { background: #0C3335; color: #FFFFFF; } and use the white logo in the footer.',
    '- Start your own class names with x- so they cannot clash with the deck\'s classes.',
    '- No @import. Leave the CSS empty if the ready-made classes are enough.',
    '',
    'JS RULES',
    '- Optional. Leave it empty unless the slide needs behavior.',
    '- The code runs every time the slide is shown. A variable named slide is already defined and is the slide\'s element; find things with slide.querySelector(...).',
    '- Because it runs again on every showing, do not add the same element or event listener twice.',
    '- Plain JavaScript only: no imports, no libraries, no document.write.',
    '',
    'STEP-BY-STEP REVEALS',
    'Add class="build" to an element (for example each source-group card) and it appears in turn instead of all at once.',
  ];
}

const forDeck = deckTitle => (deckTitle ? ` called "${deckTitle}"` : '');

/* One slide. `slide` is the slide open in the editor ({ title, html, css, js }),
   included so the assistant can change it instead of starting from nothing. */
export function buildSlidePrompt({ deckTitle, links, slide }) {
  const parts = [
    `I am building one slide for a Mountain State Financial Group (MSFG) webinar deck${forDeck(deckTitle)}. I will paste your answer into a slide editor that has three boxes: HTML, CSS and JS.`,
    '',
    'YOUR ANSWER',
    'Reply with exactly three code blocks, in this order, labelled html, css and js. If a box should stay empty, give an empty code block. Put nothing else inside the code blocks. After them, add one or two sentences on what you changed.',
    '',
    ...slideRules(links),
  ];
  if (slide) {
    parts.push(
      '',
      `THE SLIDE I HAVE OPEN NOW${slide.title ? ` ("${slide.title}")` : ''}`,
      'Start from this when I ask for a change. When I ask for a new slide, replace it but keep the footer.',
      ...(slide.wrapper ? [
        `The deck wraps this slide in ${slide.wrapper}, which you cannot change. data-bg="dark" means a dark green background with light text (use the white logo); "white" or "mist" means a light background. Extra source-... classes on the wrapper bring that layout's own styling.`,
      ] : []),
      block('html', slide.html),
      block('css', slide.css),
      block('js', slide.js),
    );
  }
  parts.push(
    '',
    'WHAT I WANT',
    '[Describe the slide here. For example: "Make a slide titled Three ways to receive proceeds, with three cards: lump sum, monthly payments, line of credit." or "Shorten the bullets on this slide and make the title two lines."]',
  );
  return parts.join('\n');
}

/* Several slides at once. The answer is one JSON block the editor can take in
   whole (see parseSlideProject). */
export function buildProjectPrompt({ deckTitle, links }) {
  return [
    `I am building a set of slides for a Mountain State Financial Group (MSFG) webinar deck${forDeck(deckTitle)}. I will paste your whole answer into a slide editor, which adds every slide in one go.`,
    '',
    'YOUR ANSWER',
    'Reply with ONE code block labelled json and nothing else. It must be valid JSON in exactly this shape:',
    block('json', JSON.stringify({
      slides: [
        { title: 'Short name shown in the slide list', html: 'the slide\'s HTML as one string', css: 'CSS for this slide only, or an empty string', js: 'JS for this slide only, or an empty string' },
      ],
    }, null, 2)),
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
    ...slideRules(links),
    '',
    'WHAT I WANT',
    '[Describe the presentation here: the topic, who it is for, about how many slides, and the points to cover. For example: "A 10-slide webinar for first-time buyers on how down payment assistance works in Colorado: who qualifies, the main programs, common myths, the steps, and next steps."]',
  ].join('\n');
}

/* Read the assistant's answer to the project prompt: JSON, with or without the
   code fence or a sentence around it. Returns { slides } or { error }. */
export function parseSlideProject(answer) {
  const textIn = String(answer || '');
  const start = textIn.search(/[[{]/);
  const end = Math.max(textIn.lastIndexOf('}'), textIn.lastIndexOf(']'));
  if (start < 0 || end <= start) return { error: 'Paste the whole answer first. It should start with { and end with }.' };
  let data;
  try {
    data = JSON.parse(textIn.slice(start, end + 1));
  } catch {
    return { error: 'That could not be read. Copy the whole code block from the answer, from the first { to the last }.' };
  }
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
