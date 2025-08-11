import { createColors, Colors } from './colors.js';
import { createSpinner, Spinner } from './spinner.js';
import { drawBox } from './box.js';
import { promptInput, promptSelect, SelectChoice } from './prompt.js';

export type Ui = {
  colors: Colors;
  spinner: (text?: string) => Spinner;
  prompt: {
    input: (message: string) => Promise<string>;
    select: (message: string, choices: SelectChoice[], options?: { highlight?: (text: string) => string; indicatorColor?: (text: string) => string }) => Promise<string>;
  };
  box: (text: string, title?: string) => void;
};

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

export type { SelectChoice } from './prompt.js';


