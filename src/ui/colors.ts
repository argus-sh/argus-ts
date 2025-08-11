export type Chalkish = {
  bold: (text: string) => string;
  green: (text: string) => string;
  red: (text: string) => string;
  yellow: (text: string) => string;
  blue: (text: string) => string;
  magenta: (text: string) => string;
  cyan: (text: string) => string;
};

const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function wrap(code: string, text: string): string {
  return `${code}${text}${ANSI.reset}`;
}

export function createChalk(): Chalkish {
  return {
    bold: (t: string) => wrap(ANSI.bold, t),
    green: (t: string) => wrap(ANSI.green, t),
    red: (t: string) => wrap(ANSI.red, t),
    yellow: (t: string) => wrap(ANSI.yellow, t),
    blue: (t: string) => wrap(ANSI.blue, t),
    magenta: (t: string) => wrap(ANSI.magenta, t),
    cyan: (t: string) => wrap(ANSI.cyan, t),
  };
}


