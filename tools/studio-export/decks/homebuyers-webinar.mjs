/* The Homebuyer's Playbook */
export default {
  slug: 'homebuyers-webinar',
  title: "The Homebuyer's Playbook",
  deckDir: 'first-time-homebuyer/deck',
  outDir: 'first-time-homebuyer/migration',
  slidesModule: '/content/slides.js',
  expectedSlides: 15,
  modal: { module: 'js/modal.js', data: 'content/modals.js', dataExport: 'MODALS' },
  /* Slide graphics: the per-slide graphics menu and the enlargeable worksheet. */
  media: { data: 'content/presenter-media.js', dataExport: 'PRESENTER_MEDIA' },
  /* slide `calc` value -> runtime/calculators/<name>.js */
  calculators: { mortgage: 'mortgage' },
  /* Left in the static deck; listed in the export report. */
  notMigrated: [
    'The 2-1 buydown calculator: it is opened only from the presenter view and belongs to no slide.',
  ],
};
