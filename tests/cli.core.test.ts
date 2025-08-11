import { describe, it, expect, vi } from 'vitest';
import { cli } from '../src/index';

function withMockedIO<T>(fn: () => T) {
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  try {
    return fn();
  } finally {
    log.mockRestore();
    error.mockRestore();
    write.mockRestore();
  }
}

describe('CLI core', () => {
  it('parses positional and boolean options with type safety', async () => {
    const outputs: string[] = [];
    await withMockedIO(async () => {
      await cli({ name: 'app' })
        .argument('<file>')
        .option('--strict', 'enable strict', { defaultValue: false })
        .action((args, options) => {
          outputs.push(args.file);
          outputs.push(String(options.strict));
        })
        .parse(['file.txt', '--strict']);
    });
    expect(outputs).toEqual(['file.txt', 'true']);
  });

  it('shows help with --help', async () => {
    const logs: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((msg?: any) => { if (typeof msg === 'string') logs.push(msg); });
    await cli({ name: 'helpapp', description: 'desc' })
      .argument('<a>')
      .option('--flag', 'flag')
      .action(() => {})
      .parse(['--help']);
    expect(logs.join('\n')).toContain('Usage:');
    expect(logs.join('\n')).toContain('Options:');
  });
});


