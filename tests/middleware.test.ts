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

describe('Middleware', () => {
  it('runs middleware in order', async () => {
    const outputs: string[] = [];
    await withMockedIO(async () => {
      const app = cli({ name: 'app' })
        .argument('<file>')
        .use(async (context, next) => {
          outputs.push('first');
          await next();
          outputs.push('after-first');
        })
        .use(async (context, next) => {
          outputs.push('second');
          await next();
          outputs.push('after-second');
        })
        .action((args) => {
          outputs.push(`action:${args.file}`);
        });

      await app.parse(['test.txt']);
    });
    expect(outputs).toEqual(['first', 'second', 'action:test.txt', 'after-second', 'after-first']);
  });

  it('runs middleware without calling next', async () => {
    const outputs: string[] = [];
    await withMockedIO(async () => {
      const app = cli({ name: 'app' })
        .argument('<file>')
        .use(async (context, next) => {
          outputs.push('middleware-only');
          // Don't call next()
        })
        .action((args) => {
          outputs.push(`action:${args.file}`);
        });

      await app.parse(['test.txt']);
    });
    expect(outputs).toEqual(['middleware-only']);
  });

  it('runs middleware with context data', async () => {
    const outputs: string[] = [];
    await withMockedIO(async () => {
      const app = cli({ name: 'app' })
        .argument('<file>')
        .use(async (context, next) => {
          outputs.push(`args:${Object.keys(context.args).length}`);
          outputs.push(`options:${Object.keys(context.options).length}`);
          outputs.push(`commandPath:${context.commandPath.join('.')}`);
          await next();
        })
        .action((args) => {
          outputs.push(`action:${args.file}`);
        });

      await app.parse(['test.txt']);
    });
    expect(outputs).toEqual(['args:1', 'options:0', 'commandPath:app', 'action:test.txt']);
  });

  it('runs middleware with options', async () => {
    const outputs: string[] = [];
    await withMockedIO(async () => {
      const app = cli({ name: 'app' })
        .argument('<file>')
        .option('--verbose', 'verbose mode')
        .use(async (context, next) => {
          outputs.push(`verbose:${context.options.verbose}`);
          await next();
        })
        .action((args) => {
          outputs.push(`action:${args.file}`);
        });

      await app.parse(['test.txt', '--verbose']);
    });
    expect(outputs).toEqual(['verbose:true', 'action:test.txt']);
  });

  it('runs middleware with multiple arguments', async () => {
    const outputs: string[] = [];
    await withMockedIO(async () => {
      const app = cli({ name: 'app' })
        .argument('<input>')
        .argument('<output>')
        .use(async (context, next) => {
          outputs.push(`input:${context.args.input}`);
          outputs.push(`output:${context.args.output}`);
          await next();
        })
        .action((args) => {
          outputs.push(`action:${args.input}:${args.output}`);
        });

      await app.parse(['input.txt', 'output.txt']);
    });
    expect(outputs).toEqual(['input:input.txt', 'output:output.txt', 'action:input.txt:output.txt']);
  });

  it('runs middleware in subcommands', async () => {
    const outputs: string[] = [];
    await withMockedIO(async () => {
      const app = cli({ name: 'app' })
        .use(async (context, next) => {
          outputs.push('root');
          await next();
        });

      app.command('build', 'build command')
        .use(async (context, next) => {
          outputs.push('build');
          await next();
        })
        .action(() => {
          outputs.push('action');
        });

      await app.parse(['build']);
    });
    expect(outputs).toEqual(['root', 'build', 'action']);
  });

  it('runs middleware in nested subcommands', async () => {
    const outputs: string[] = [];
    await withMockedIO(async () => {
      const app = cli({ name: 'app' })
        .use(async (context, next) => {
          outputs.push('root');
          await next();
        });

      const build = app.command('build', 'build command')
        .use(async (context, next) => {
          outputs.push('build');
          await next();
        });

      build.command('web', 'web build')
        .use(async (context, next) => {
          outputs.push('web');
          await next();
        })
        .action(() => {
          outputs.push('action');
        });

      await app.parse(['build', 'web']);
    });
    expect(outputs).toEqual(['root', 'build', 'web', 'action']);
  });

  it('handles middleware errors', async () => {
    const outputs: string[] = [];
    await withMockedIO(async () => {
      const app = cli({ name: 'app' })
        .argument('<file>')
        .use(async (context, next) => {
          outputs.push('before-error');
          throw new Error('Middleware error');
        })
        .action((args) => {
          outputs.push(`action:${args.file}`);
        });

      try {
        await app.parse(['test.txt']);
      } catch (err) {
        outputs.push('caught-error');
      }
    });
    expect(outputs).toEqual(['before-error', 'caught-error']);
  });

  it('handles middleware errors after next', async () => {
    const outputs: string[] = [];
    await withMockedIO(async () => {
      const app = cli({ name: 'app' })
        .argument('<file>')
        .use(async (context, next) => {
          outputs.push('before-next');
          await next();
          outputs.push('after-next');
          throw new Error('Post-next error');
        })
        .action((args) => {
          outputs.push(`action:${args.file}`);
        });

      try {
        await app.parse(['test.txt']);
      } catch (err) {
        outputs.push('caught-error');
      }
    });
    expect(outputs).toEqual(['before-next', 'action:test.txt', 'after-next', 'caught-error']);
  });

  it('handles async middleware with delays', async () => {
    const outputs: string[] = [];
    await withMockedIO(async () => {
      const app = cli({ name: 'app' })
        .argument('<file>')
        .use(async (context, next) => {
          outputs.push('start-delay');
          await new Promise(resolve => setTimeout(resolve, 10));
          outputs.push('end-delay');
          await next();
        })
        .action((args) => {
          outputs.push(`action:${args.file}`);
        });

      await app.parse(['test.txt']);
    });
    expect(outputs).toEqual(['start-delay', 'end-delay', 'action:test.txt']);
  });

  it('handles middleware with multiple next calls', async () => {
    const outputs: string[] = [];
    await withMockedIO(async () => {
      const app = cli({ name: 'app' })
        .argument('<file>')
        .use(async (context, next) => {
          outputs.push('first');
          await next();
          outputs.push('after-first');
        })
        .use(async (context, next) => {
          outputs.push('second');
          try {
            await next();
            await next(); // Second call should throw
          } catch (err) {
            outputs.push('caught-double-next');
          }
          outputs.push('after-second');
        })
        .action((args) => {
          outputs.push(`action:${args.file}`);
        });

      await app.parse(['test.txt']);
    });
    expect(outputs).toEqual(['first', 'second', 'action:test.txt', 'caught-double-next', 'after-second', 'after-first']);
  });

  it('handles middleware with no next function', async () => {
    const outputs: string[] = [];
    await withMockedIO(async () => {
      const app = cli({ name: 'app' })
        .argument('<file>')
        .use(async (context) => {
          outputs.push('no-next');
          // No next parameter
        })
        .action((args) => {
          outputs.push(`action:${args.file}`);
        });

      await app.parse(['test.txt']);
    });
    expect(outputs).toEqual(['no-next']);
  });

  it('handles empty middleware array', async () => {
    const outputs: string[] = [];
    await withMockedIO(async () => {
      const app = cli({ name: 'app' })
        .argument('<file>')
        .action((args) => {
          outputs.push(`action:${args.file}`);
        });

      await app.parse(['test.txt']);
    });
    expect(outputs).toEqual(['action:test.txt']);
  });

  it('handles middleware with complex context manipulation', async () => {
    const outputs: string[] = [];
    await withMockedIO(async () => {
      const app = cli({ name: 'app' })
        .argument('<file>')
        .option('--count', 'count option', { valueName: '<count>' })
        .use(async (context, next) => {
          // Modify context
          (context as any).customData = 'modified';
          outputs.push(`custom:${(context as any).customData}`);
          await next();
          outputs.push(`final:${(context as any).customData}`);
        })
        .action((args, options) => {
          outputs.push(`action:${args.file}:${options.count || 'none'}`);
        });

      await app.parse(['test.txt', '--count', '5']);
    });
    expect(outputs).toEqual(['custom:modified', 'action:test.txt:5', 'final:modified']);
  });

  it('handles middleware with conditional next calls', async () => {
    const outputs: string[] = [];
    await withMockedIO(async () => {
      const app = cli({ name: 'app' })
        .argument('<file>')
        .option('--skip', 'skip middleware')
        .use(async (context, next) => {
          outputs.push('conditional');
          if (!context.options.skip) {
            await next();
          }
          outputs.push('after-conditional');
        })
        .action((args) => {
          outputs.push(`action:${args.file}`);
        });

      // Without skip
      await app.parse(['test.txt']);
      outputs.push('---');
      
      // With skip
      await app.parse(['test.txt', '--skip']);
    });
    expect(outputs).toEqual(['conditional', 'action:test.txt', 'after-conditional', '---', 'conditional', 'after-conditional']);
  });
});


