const pages = (prefix, count, sourcePdf) => Array.from({ length: count }, (_, index) => ({
  id: `${prefix}-${index + 1}`,
  number: index + 1,
  pdfPage: index + 2,
  image: `./assets/documents/${prefix}-page-${index + 1}.png`,
  width: 1530,
  height: 1980,
  alt: `${prefix === 'le' ? 'Loan Estimate' : 'Closing Disclosure'} sample, page ${index + 1} of ${count}`,
  sourcePdf,
}));

export const DOCUMENTS = Object.freeze([
  Object.freeze({ id: 'le', shortLabel: 'LE', title: 'Loan Estimate', pages: Object.freeze(pages('le', 3, './references/loan-estimate-H24B.pdf')) }),
  Object.freeze({ id: 'cd', shortLabel: 'CD', title: 'Closing Disclosure', pages: Object.freeze(pages('cd', 5, './references/closing-disclosure-H25B.pdf')) }),
]);
