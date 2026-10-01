/* Your first home, without the mystery. */
export default {
  slug: 'first-home-without-mystery',
  title: 'Your first home, without the mystery.',
  deckDir: 'first-home-without-mystery/deck',
  outDir: 'first-home-without-mystery/migration',
  slidesModule: '/content/slides.js',
  expectedSlides: 15,
  modal: { module: 'js/modal.js', data: 'content/modals.js', dataExport: 'MODALS' },
  /* slide `calc` value -> runtime/calculators/<name>.js */
  calculators: { cashToClose: 'cash-to-close' },
  /* Left in the static deck; listed in the export report. */
  notMigrated: [],
};
