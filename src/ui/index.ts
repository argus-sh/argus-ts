import { createColors } from './colors.js';
import type { Ui, SelectChoice } from '../types.js';
import { createSpinner } from './spinner.js';
import { drawBox } from './box.js';
import { promptInput, promptSelect } from './prompt.js';

export function createUi(): Ui {
  const colors = createColors();
  return {
    colors,
    spinner: (text?: string) => createSpinner(text, colors),
    prompt: {
      input: (message: string) => promptInput(message),
      select: (message: string, choices: SelectChoice[], options?: { highlight?: (text: string) => string; indicatorColor?: (text: string) => string }) => promptSelect(message, choices, options),
    },
    box: (text: string, title?: string) => drawBox(text, { title, padding: 1 }),
  };
}

// Types are re-exported from ../types


