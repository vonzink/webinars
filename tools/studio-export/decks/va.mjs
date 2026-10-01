/* Understanding VA Loans */
export default {
  slug: 'va',
  title: 'Understanding VA Loans',
  deckDir: 'va-loans/deck',
  outDir: 'va-loans/migration',
  slidesModule: '/content/slides.js',
  expectedSlides: 17,
  modal: { module: 'js/modal.js', data: 'content/modals.js', dataExport: 'MODALS' },
  calculators: {},
  /* Left in the static deck; listed in the export report. */
  notMigrated: [
    'The mortgage calculator: it is opened only from the presenter view and belongs to no slide.',
  ],
};
