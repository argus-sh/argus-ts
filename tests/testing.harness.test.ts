import { describe, it, expect } from 'vitest';
import { cli } from '../src/index.js';
import { createTestHarness } from '../src/testing/index.js';

describe('Test Harness (F.9)', () => {
  it('captures stdout and returns exitCode 0 on success', async () => {
    const program = cli({ name: 'app' })
      .argument('<name>')
      .action((args) => {
        console.log(`Hello, ${args.name}!`);
      });

    const h = createTestHarness(program);
    const result = await h.execute(['World']);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Hello, World!');
    expect(result.stderr).toBe('');
  });

  it('captures error output and sets non-zero exitCode when help is implicit (error path)', async () => {
    const program = cli({ name: 'app' })
      .argument('<name>')
      .action(() => {});

    const h = createTestHarness(program);
    const result = await h.execute([]); // Missing required arg triggers help
    expect(result.exitCode).toBeGreaterThan(0);
    expect(result.stderr).toContain('E_MISSING_ARGUMENT');
  });

  it('keeps exitCode 0 when help is explicitly requested', async () => {
    const program = cli({ name: 'app' })
      .argument('<name>')
      .action(() => {});

    const h = createTestHarness(program);
    const result = await h.execute(['--help']);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Usage:');
  });

  it('captures ArgusError outputs as failure with non-zero exitCode', async () => {
    const program = cli({ name: 'app' })
      .argument('<file>')
      .option('--config', 'Config', { valueName: '<cfg>' })
      .action(() => {});

    const h = createTestHarness(program);
    const result = await h.execute(['input.txt', '--config']); // missing value
    expect(result.exitCode).toBeGreaterThan(0);
    expect(result.stderr).toContain('E_MISSING_OPTION_VALUE');
  });

  it('captures unexpected thrown errors into stderr and non-zero exitCode', async () => {
    const program = cli({ name: 'app' })
      .action(() => {
        throw new Error('unexpected');
      });

    const h = createTestHarness(program);
    const result = await h.execute([]);
    expect(result.exitCode).toBeGreaterThan(0);
    expect(result.stderr).toContain('unexpected');
  });
});


