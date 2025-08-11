import { createChalk, Chalkish } from './colors.js';
import { createSpinner, Spinner } from './spinner.js';
import { drawBox } from './box.js';
import { promptInput, promptSelect, SelectChoice } from './prompt.js';

export type Ui = {
  chalk: Chalkish;
  spinner: (text?: string) => Spinner;
  prompt: {
    input: (message: string) => Promise<string>;
    select: (message: string, choices: SelectChoice[], options?: { highlight?: (text: string) => string; indicatorColor?: (text: string) => string }) => Promise<string>;
  };
  box: (text: string, title?: string) => void;
};

export function createUi(): Ui {
  const chalk = createChalk();
  return {
    chalk,
    spinner: (text?: string) => createSpinner(text, chalk),
    prompt: {
      input: (message: string) => promptInput(message),
      select: (message: string, choices: SelectChoice[], options?: { highlight?: (text: string) => string; indicatorColor?: (text: string) => string }) => promptSelect(message, choices, options),
    },
    box: (text: string, title?: string) => drawBox(text, { title, padding: 1 }),
  };
}

export type { SelectChoice } from './prompt.js';


