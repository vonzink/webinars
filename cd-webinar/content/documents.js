const pages = (prefix, pdfPages, sourcePdf, altName) => pdfPages.map((pdfPage, index) => Object.freeze({
  id: `${prefix}-${index + 1}`,
  number: index + 1,
  pdfPage,
  image: `./assets/documents/${prefix}-page-${index + 1}.png`,
  width: 1530,
  height: 1980,
  alt: `${altName}, page ${index + 1} of ${pdfPages.length}`,
  sourcePdf,
}));

const example = (id, label, pageList) => Object.freeze({ id, label, pages: pageList });

const LE_EXAMPLES = Object.freeze([
  example('le', 'Purchase', pages('le', [2, 3, 4], './references/loan-estimate-H24B.pdf', 'Loan Estimate purchase sample')),
  example('le2', 'Refinance', pages('le2', [2, 3, 4], './references/loan-estimate-refinance-H24D.pdf', 'Loan Estimate refinance sample')),
  example('le3', 'Blank form', pages('le3', [2, 4, 8], './references/loan-estimate-model-H24A.pdf', 'Loan Estimate blank model form')),
]);

const CD_EXAMPLES = Object.freeze([
  example('cd', 'Purchase', pages('cd', [2, 3, 4, 5, 6], './references/closing-disclosure-H25B.pdf', 'Closing Disclosure purchase sample')),
  example('cd2', 'Refinance', pages('cd2', [2, 3, 4, 5, 6], './references/closing-disclosure-refinance-H25E.pdf', 'Closing Disclosure refinance sample')),
  example('cd3', 'Refi, cash due', pages('cd3', [2, 3, 4, 5, 6], './references/closing-disclosure-refinance-cash-H25G.pdf', 'Closing Disclosure refinance sample with cash due from the borrower')),
]);

export const DOCUMENTS = Object.freeze([
  Object.freeze({
    id: 'le',
    shortLabel: 'LE',
    title: 'Loan Estimate',
    examples: LE_EXAMPLES,
    pages: Object.freeze(LE_EXAMPLES.flatMap(item => item.pages)),
  }),
  Object.freeze({
    id: 'cd',
    shortLabel: 'CD',
    title: 'Closing Disclosure',
    examples: CD_EXAMPLES,
    pages: Object.freeze(CD_EXAMPLES.flatMap(item => item.pages)),
  }),
]);
