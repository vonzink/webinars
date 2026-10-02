/* WEBINAR STUDIO — the slides every new webinar starts with: a title slide, one
   content slide and a closing slide, in the MSFG style. They are placeholders.
   Each webinar's real slides are made in Slide settings (edit these, add more,
   or drop in a whole set) and are stored by the Dashboard API, not here. */
import { activePresenter, COMPANY } from './presenters.js';

const presenter = activePresenter();
const nmls = value => String(value || '').replace('NMLS# ', 'NMLS #');
const phone = presenter.phone ? `(${presenter.phone.slice(0, 3)}) ${presenter.phone.slice(4)}` : '';
const FOOTER = `${COMPANY.name} • ${nmls(COMPANY.nmls)}  |  ${presenter.name} • ${nmls(presenter.nmls)}  |  ${phone}  |  ${COMPANY.site}`;
const base = { layout: 'sourceFaithful', manualBuild: false, footer: false };

export const SLIDES = [
  {
    ...base,
    id: 'opening',
    headline: 'Your webinar title',
    sourceNumber: 1,
    displayNumber: 1,
    sourceBlocks: [
      'Your webinar title',
      'One line on what people will learn',
      'A Mountain State Financial Group webinar',
      'MSFG\nWEBINAR',
      '',
      `Presented by ${presenter.name}`,
      `${presenter.title} • ${nmls(presenter.nmls)}`,
      `${COMPANY.name} • Company ${nmls(COMPANY.nmls)}`,
      `${phone}  •  ${COMPANY.site}`,
    ],
    sourceLayout: { kind: 'cover' },
    notes: 'Welcome everyone, introduce yourself, and say what the session covers and how long it runs.',
    time: 45,
    bg: 'dark',
  },
  {
    ...base,
    id: 'content',
    headline: 'A slide title',
    sourceNumber: 2,
    displayNumber: 2,
    sourceBlocks: [
      'A slide title',
      'One sentence that sets up the slide.',
      '• First point\n• Second point\n• Third point',
      FOOTER,
    ],
    sourceLayout: { lead: [1], bullet: 2, footer: 3 },
    notes: 'Use "Add a slide after this one" in Slide settings to make more slides like this, or Instructions to build a whole set at once.',
    time: 60,
    bg: 'white',
  },
  {
    ...base,
    id: 'questions',
    headline: 'Questions?',
    sourceNumber: 3,
    displayNumber: 3,
    sourceBlocks: [
      'Questions?',
      presenter.name,
      `${presenter.title} | ${nmls(presenter.nmls)}`,
      phone,
      COMPANY.name,
      `Company ${nmls(COMPANY.nmls)}  •  ${COMPANY.site}`,
      'Educational information only. Program availability, terms and eligibility are subject to change and borrower qualification.',
      FOOTER,
    ],
    sourceLayout: { lead: [1, 2, 3, 4, 5], disclaimer: 6, footer: 7 },
    notes: 'Take questions, then tell people how to reach you.',
    time: 120,
    bg: 'white',
  },
];

export const TARGET_RUNTIME_SECONDS = SLIDES.reduce((total, slide) => total + slide.time, 0);
export const SOURCE_APPENDIX = { number: 0, blocks: [] };
