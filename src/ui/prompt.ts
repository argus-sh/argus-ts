import readline from 'node:readline';

export type SelectChoice = { title: string; value: string };
export type SelectOptions = {
  highlight?: (text: string) => string;
  indicatorColor?: (text: string) => string;
};

export async function promptInput(message: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer: string = await new Promise(resolve => rl.question(`${message} `, resolve));
  rl.close();
  return answer;
}

export async function promptSelect(message: string, choices: SelectChoice[], options?: SelectOptions): Promise<string> {
  if (choices.length === 0) return '';

  // Print header once
  process.stdout.write(`${message}\n`);

  let index = 0;
  let renderedLines = 0;

  function render() {
    // Move cursor up to rewrite previous list render
    if (renderedLines > 0) {
      process.stdout.write(`\u001b[${renderedLines}A`);
    }
    // Render list
    for (let i = 0; i < choices.length; i += 1) {
      process.stdout.write(`\u001b[2K`); // clear line
      const item = choices[i]!;
      const rawPrefix = i === index ? '› ' : '  ';
      const prefix = i === index && options?.indicatorColor ? options.indicatorColor(rawPrefix) : rawPrefix;
      const title = i === index
        ? (options?.highlight ? options.highlight(item.title) : invert(item.title))
        : item.title;
      process.stdout.write(`${prefix}${title}\n`);
    }
    renderedLines = choices.length;
  }

  render();

  return new Promise<string>((resolve) => {
    const stdin = process.stdin;
    const onData = (chunk: Buffer) => {
      const key = chunk.toString();
      if (key === '\u0003') { // Ctrl+C
        cleanup();
        resolve('');
        return;
      }
      if (key === '\r' || key === '\n') { // Enter
        const value = choices[index]?.value ?? '';
        cleanup();
        resolve(value);
        return;
      }
      if (key === '\u001b[A' || key === 'k') { // Up or 'k'
        index = (index - 1 + choices.length) % choices.length;
        render();
        return;
      }
      if (key === '\u001b[B' || key === 'j') { // Down or 'j'
        index = (index + 1) % choices.length;
        render();
        return;
      }
      // number quick select
      if (/^[1-9]$/.test(key)) {
        const n = Number(key);
        if (n >= 1 && n <= choices.length) {
          index = n - 1;
          render();
        }
      }
    };

    function cleanup() {
      stdin.setRawMode?.(false);
      stdin.pause();
      stdin.off('data', onData);
      // Move cursor below the list and clear the last render
      process.stdout.write(`\u001b[0m`);
    }

    stdin.setRawMode?.(true);
    stdin.resume();
    stdin.on('data', onData);
  });
}

function invert(text: string): string {
  return `\u001b[7m${text}\u001b[0m`;
}



