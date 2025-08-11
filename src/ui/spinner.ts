import type { Chalkish } from './colors.js';

export type Spinner = {
  start: () => Spinner;
  succeed: (text?: string) => void;
  fail: (text?: string) => void;
  stop: () => void;
};

export function createSpinner(text?: string, chalk?: Chalkish): Spinner {
  let interval: NodeJS.Timeout | null = null;
  let frame = 0;
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  const label = text ?? '';

  function render() {
    const raw = frames[frame % frames.length] ?? '⠋';
    const f = chalk ? chalk.cyan(raw) : raw;
    process.stdout.write(`\r${f} ${label}   `);
    frame += 1;
  }

  return {
    start() {
      if (interval) return this;
      render();
      interval = setInterval(render, 80);
      return this;
    },
    succeed(msg?: string) {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      const icon = chalk ? chalk.green('✔') : '✔';
      const message = msg ?? label;
      const boldMsg = chalk ? chalk.bold(message) : message;
      process.stdout.write(`\r${icon} ${boldMsg}\n`);
    },
    fail(msg?: string) {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      const icon = chalk ? chalk.red('✖') : '✖';
      const message = msg ?? label;
      const boldMsg = chalk ? chalk.bold(message) : message;
      process.stdout.write(`\r${icon} ${boldMsg}\n`);
    },
    stop() {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      process.stdout.write('\r   \r');
    },
  };
}


