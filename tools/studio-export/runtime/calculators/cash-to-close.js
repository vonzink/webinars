/* Cash-to-close builder: the deck's own calculator on a Studio slide. */

import {
  initCashToCloseCalculator,
  setCashToCloseVisible,
  isCashToCloseVisible,
} from '@deck/js/cash-to-close-calculator.js';
import { startCalculatorAdapter } from './adapter.js';

export function startCalculator() {
  startCalculatorAdapter({
    actionId: 'cash-to-close',
    init: initCashToCloseCalculator,
    setVisible: setCashToCloseVisible,
    isVisible: isCashToCloseVisible,
  });
}
