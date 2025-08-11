import { describe, it, expect, vi } from 'vitest';
import { cli } from '../src/index';

describe('Errors', () => {
  it('unknown option prints ArgusError box', async () => {
    const logs: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((msg?: any) => { if (typeof msg === 'string') logs.push(msg); });
    await cli({ name: 'err' })
      .action(() => {})
      .parse(['--bad']);
    expect(logs.join('\n')).toMatch(/E_UNKNOWN_OPTION/);
  });

  it('missing argument prints error', async () => {
    const logs: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((msg?: any) => { if (typeof msg === 'string') logs.push(msg); });
    await cli({ name: 'err2' })
      .argument('<file>')
      .action(() => {})
      .parse([]);
    expect(logs.join('\n')).toMatch(/E_MISSING_ARGUMENT/);
  });
});


