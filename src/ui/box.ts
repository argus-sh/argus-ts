export type BoxOptions = {
  title?: string;
  padding?: number; // spaces
};

export function drawBox(text: string, options?: BoxOptions) {
  const padding = Math.max(0, options?.padding ?? 1);
  const lines = text.split('\n');
  const maxLen = Math.max(...lines.map(l => l.length));
  const innerWidth = maxLen + padding * 2;
  const top = `╭${'─'.repeat(innerWidth + 2)}╮`;
  const bottom = `╰${'─'.repeat(innerWidth + 2)}╯`;

  let header = '';
  if (options?.title) {
    const title = ` ${options.title} `;
    const left = Math.max(0, Math.floor(((innerWidth + 2) - title.length) / 2));
    const right = Math.max(0, (innerWidth + 2) - title.length - left);
    header = `╭${'─'.repeat(left)}${title}${'─'.repeat(right)}╮`;
  }

  const content = lines
    .map(l => `│ ${' '.repeat(padding)}${l.padEnd(maxLen)}${' '.repeat(padding)} │`)
    .join('\n');

  const box = [header || top, content, bottom].filter(Boolean).join('\n');
  // eslint-disable-next-line no-console
  console.log(box);
}


