/* Mortgage payment calculator: the deck's own calculator on a Studio slide. */

import { initCalculator, setCalculatorVisible, isCalculatorVisible } from '@deck/js/calculator.js';
import { startCalculatorAdapter } from './adapter.js';

export function startCalculator() {
  startCalculatorAdapter({
    actionId: 'mortgage-calculator',
    init: initCalculator,
    setVisible: setCalculatorVisible,
    isVisible: isCalculatorVisible,
  });
}
