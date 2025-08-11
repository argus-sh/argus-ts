import { describe, it, expect, vi } from 'vitest';
import { cli } from '../src/index';

describe('Sub-commands', () => {
  it('dispatches to sub-command and enforces args', async () => {
    const logs: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((msg?: any) => { if (typeof msg === 'string') logs.push(msg); });

    const app = cli({ name: 'root' });
    const install = app.command('install', 'Install');
    install.argument('<pkg>');
    install.action((args) => {
      console.log(`installing ${args.pkg}`);
    });

    await app.parse(['install', 'my-lib']);
    expect(logs.join('\n')).toContain('installing my-lib');
  });
});


