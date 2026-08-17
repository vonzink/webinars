/* Dump the deck's verified JS content to content.json in the shapes build_pptx.py
   expects, so the PowerPoint always mirrors the live deck.
   Run from the deck dir:  node scripts/dump-content.mjs                     */
import { writeFileSync } from 'node:fs';
import { SLIDES } from '../content/slides.js';
import { MODALS } from '../content/modals.js';

const firstComp = c => Array.isArray(c) ? (c[0] || null) : (c || null);

const slides = SLIDES.map(s => {
  const o = {
    id: s.id, layout: s.layout, bg: s.bg, footer: !!s.footer,
    eyebrow: s.eyebrow || null, headline: s.headline || null, subhead: s.subhead || null,
    callout: s.callout || null, cols: s.cols || null, dense: !!s.dense,
    quote: s.cardVariant === 'quote', numbers: !!s.hasNumbers,
    compliance: firstComp(s.compliance),
  };
  if (s.cards) o.cards = s.cards.map(c => ({ modal: c.modal, title: c.title, meta: c.meta || null, stat: c.stat || null }));
  if (s.left)  o.left  = { label: s.left.label, items: s.left.items };
  if (s.right) o.right = { label: s.right.label, items: s.right.items };
  if (s.fixed) o.fixed = s.fixed;
  if (s.moves) o.moves = s.moves;
  if (s.canPay) o.canpay = s.canPay;
  if (s.cannotPay) o.cannotpay = s.cannotPay;
  if (s.points) o.points = s.points;
  if (s.steps) o.steps = s.steps.map(st => [st.label, st.note]);
  if (s.layout === 'markers') { o.tone = s.tone; o.items = s.items; }
  if (s.layout === 'questions') o.items = s.items.map(q => [q.q, q.a]);
  return o;
});

const modals = {};
for (const [id, m] of Object.entries(MODALS)) {
  const o = { eyebrow: m.eyebrow || null, title: m.title, compliance: firstComp(m.compliance) };
  if (m.intro) o.intro = m.intro;
  if (m.table) o.table = { columns: m.table.columns, rows: m.table.rows.map(r => [r.label, r.cells]) };
  if (m.sections) o.sections = m.sections.map(s => ({
    head: s.head || null, items: s.items || [], tone: s.tone || null, note: s.note || null,
  }));
  modals[id] = o;
}

writeFileSync(new URL('../content.json', import.meta.url),
  JSON.stringify({ slides, modals }, null, 0));
console.log(`content.json: ${slides.length} slides, ${Object.keys(modals).length} popouts`);
