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

  it('handles value options with defaults', async () => {
    const outputs: string[] = [];
    await withMockedIO(async () => {
      await cli({ name: 'app' })
        .argument('<file>')
        .option('--config', 'config file', { defaultValue: 'default.conf', valueName: '<config>' })
        .action((args, options) => {
          outputs.push(args.file);
          outputs.push(String(options.config));
        })
        .parse(['file.txt']);
    });
    expect(outputs).toEqual(['file.txt', 'default.conf']);
  });

  it('handles value options with custom value names', async () => {
    const outputs: string[] = [];
    await withMockedIO(async () => {
      await cli({ name: 'app' })
        .argument('<file>')
        .option('--config', 'config file', { valueName: '<config>' })
        .action((args, options) => {
          outputs.push(args.file);
          outputs.push(String(options.config));
        })
        .parse(['file.txt', '--config', 'custom.conf']);
    });
    expect(outputs).toEqual(['file.txt', 'custom.conf']);
  });

  it('handles subcommands', async () => {
    const outputs: string[] = [];
    await withMockedIO(async () => {
      const app = cli({ name: 'app' });
      
      app.command('build', 'build command')
        .argument('<target>')
        .option('--prod', 'production build')
        .action((args, options) => {
          outputs.push(`build:${args.target}:${options.prod}`);
        });

      app.command('test', 'test command')
        .argument('<suite>')
        .action((args) => {
          outputs.push(`test:${args.suite}`);
        });

      await app.parse(['build', 'web', '--prod']);
      await app.parse(['test', 'unit']);
    });
    expect(outputs).toEqual(['build:web:true', 'test:unit']);
  });

  it('shows help for subcommands', async () => {
    const logs: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((msg?: any) => { if (typeof msg === 'string') logs.push(msg); });
    
    const app = cli({ name: 'app', description: 'Main app' });
    app.command('build', 'Build the project')
      .argument('<target>')
      .option('--prod', 'Production build')
      .action(() => {});

    await app.parse(['--help']);
    const helpText = logs.join('\n');
    expect(helpText).toContain('Commands:');
    expect(helpText).toContain('build');
    expect(helpText).toContain('Build the project');
  });

  it('shows help when no subcommand selected', async () => {
    const logs: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((msg?: any) => { if (typeof msg === 'string') logs.push(msg); });
    
    const app = cli({ name: 'app' });
    app.command('build', 'Build the project')
      .action(() => {});

    await app.parse([]);
    const helpText = logs.join('\n');
    expect(helpText).toContain('Usage:');
    expect(helpText).toContain('<command>');
  });

  it('handles middleware', async () => {
    const outputs: string[] = [];
    await withMockedIO(async () => {
      const app = cli({ name: 'app' })
        .argument('<file>')
        .use(async (context, next) => {
          outputs.push('middleware1');
          await next();
          outputs.push('after1');
        })
        .use(async (context, next) => {
          outputs.push('middleware2');
          await next();
          outputs.push('after2');
        })
        .action((args) => {
          outputs.push(`action:${args.file}`);
        });

      await app.parse(['test.txt']);
    });
    expect(outputs).toEqual(['middleware1', 'middleware2', 'action:test.txt', 'after2', 'after1']);
  });

  it('handles nested middleware in subcommands', async () => {
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

  it('handles missing required arguments', async () => {
    const outputs: string[] = [];
    await withMockedIO(async () => {
      // Errors are handled internally, not thrown
      await cli({ name: 'app' })
        .argument('<file>')
        .argument('<output>')
        .action(() => {})
        .parse(['input.txt']); // Missing second argument
      
      // The error should be handled internally and not thrown
      outputs.push('no-error-thrown');
    });
    
    expect(outputs).toEqual(['no-error-thrown']);
  });

  it('handles unknown options', async () => {
    const outputs: string[] = [];
    await withMockedIO(async () => {
      // Errors are handled internally, not thrown
      await cli({ name: 'app' })
        .argument('<file>')
        .action(() => {})
        .parse(['input.txt', '--unknown']);
      
      // The error should be handled internally and not thrown
      outputs.push('no-error-thrown');
    });
    
    expect(outputs).toEqual(['no-error-thrown']);
  });

  it('handles missing option values', async () => {
    const outputs: string[] = [];
    await withMockedIO(async () => {
      // Errors are handled internally, not thrown
      await cli({ name: 'app' })
        .argument('<file>')
        .option('--config', 'config file', { valueName: '<config>' })
        .action(() => {})
        .parse(['input.txt', '--config']); // Missing value
      
      // The error should be handled internally and not thrown
      outputs.push('no-error-thrown');
    });
    
    expect(outputs).toEqual(['no-error-thrown']);
  });

  it('handles invalid subcommands', async () => {
    const outputs: string[] = [];
    await withMockedIO(async () => {
      const app = cli({ name: 'app' });
      app.command('build', 'build command').action(() => {});

      // Errors are handled internally, not thrown
      await app.parse(['invalid']);
      
      // The error should be handled internally and not thrown
      outputs.push('no-error-thrown');
    });
    
    expect(outputs).toEqual(['no-error-thrown']);
  });

  it('handles options without defaults', async () => {
    const outputs: string[] = [];
    await withMockedIO(async () => {
      await cli({ name: 'app' })
        .argument('<file>')
        .option('--flag', 'flag description')
        .action((args, options) => {
          outputs.push(args.file);
          outputs.push(String(options.flag));
        })
        .parse(['file.txt']);
    });
    expect(outputs).toEqual(['file.txt', 'false']);
  });

  it('handles multiple boolean options', async () => {
    const outputs: string[] = [];
    await withMockedIO(async () => {
      await cli({ name: 'app' })
        .argument('<file>')
        .option('--verbose', 'verbose output')
        .option('--quiet', 'quiet output')
        .action((args, options) => {
          outputs.push(args.file);
          outputs.push(String(options.verbose));
          outputs.push(String(options.quiet));
        })
        .parse(['file.txt', '--verbose', '--quiet']);
    });
    expect(outputs).toEqual(['file.txt', 'true', 'true']);
  });

  it('handles mixed option types', async () => {
    const outputs: string[] = [];
    await withMockedIO(async () => {
      await cli({ name: 'app' })
        .argument('<file>')
        .option('--verbose', 'verbose output')
        .option('--config', 'config file', { valueName: '<config>' })
        .action((args, options) => {
          outputs.push(args.file);
          outputs.push(String(options.verbose));
          outputs.push(String(options.config));
        })
        .parse(['file.txt', '--verbose', '--config', 'config.json']);
    });
    expect(outputs).toEqual(['file.txt', 'true', 'config.json']);
  });

  it('handles empty argv', async () => {
    const logs: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((msg?: any) => { if (typeof msg === 'string') logs.push(msg); });
    
    const app = cli({ name: 'app' });
    app.command('build', 'build command').action(() => {});

    await app.parse([]);
    const helpText = logs.join('\n');
    expect(helpText).toContain('Usage:');
  });

  it('handles process.argv fallback', async () => {
    const originalArgv = process.argv;
    process.argv = ['node', 'app', 'test.txt'];
    
    const outputs: string[] = [];
    await withMockedIO(async () => {
      await cli({ name: 'app' })
        .argument('<file>')
        .action((args) => {
          outputs.push(args.file);
        })
        .parse(); // No argv provided, should use process.argv
    });
    
    expect(outputs).toEqual(['test.txt']);
    process.argv = originalArgv;
  });

  it('tests builder pattern with chaining', async () => {
    const outputs: string[] = [];
    await withMockedIO(async () => {
      const app = cli({ name: 'app' });
      
      // Test that we can chain multiple method calls
      const result = app
        .argument('<file>')
        .option('--verbose', 'verbose mode')
        .option('--config', 'config file', { valueName: '<config>' })
        .use(async (context, next) => {
          outputs.push('middleware');
          await next();
        })
        .action((args, options) => {
          outputs.push(`action:${args.file}:${options.verbose}:${options.config}`);
        });

      await result.parse(['test.txt', '--verbose', '--config', 'config.json']);
    });
    expect(outputs).toEqual(['middleware', 'action:test.txt:true:config.json']);
  });

  it('tests builder pattern with subcommands', async () => {
    const outputs: string[] = [];
    await withMockedIO(async () => {
      const app = cli({ name: 'app' });
      
      // Test that subcommand builders work correctly
      const buildCmd = app.command('build', 'Build command');
      buildCmd
        .argument('<target>')
        .option('--prod', 'production mode')
        .action((args, options) => {
          outputs.push(`build:${args.target}:${options.prod}`);
        });

      await app.parse(['build', 'web', '--prod']);
    });
    expect(outputs).toEqual(['build:web:true']);
  });

  it('tests builder pattern with multiple subcommands', async () => {
    const outputs: string[] = [];
    await withMockedIO(async () => {
      const app = cli({ name: 'app' });
      
      // Test multiple subcommands with their own builders
      const buildCmd = app.command('build', 'Build command');
      const testCmd = app.command('test', 'Test command');
      
      buildCmd
        .argument('<target>')
        .action((args) => {
          outputs.push(`build:${args.target}`);
        });
      
      testCmd
        .argument('<suite>')
        .action((args) => {
          outputs.push(`test:${args.suite}`);
        });

      await app.parse(['build', 'web']);
      await app.parse(['test', 'unit']);
    });
    expect(outputs).toEqual(['build:web', 'test:unit']);
  });

  it('tests builder pattern with nested subcommands', async () => {
    const outputs: string[] = [];
    await withMockedIO(async () => {
      const app = cli({ name: 'app' });
      
      // Test nested subcommands with their own builders
      const buildCmd = app.command('build', 'Build commands');
      const webCmd = buildCmd.command('web', 'Web build');
      
      webCmd
        .argument('<framework>')
        .option('--prod', 'production mode')
        .action((args, options) => {
          outputs.push(`web:${args.framework}:${options.prod}`);
        });

      await app.parse(['build', 'web', 'react', '--prod']);
    });
    expect(outputs).toEqual(['web:react:true']);
  });

  it('tests builder pattern with middleware chaining', async () => {
    const outputs: string[] = [];
    await withMockedIO(async () => {
      const app = cli({ name: 'app' });
      
      // Test middleware chaining in builder pattern
      const result = app
        .argument('<file>')
        .use(async (context, next) => {
          outputs.push('middleware1');
          await next();
        })
        .use(async (context, next) => {
          outputs.push('middleware2');
          await next();
        })
        .action((args) => {
          outputs.push(`action:${args.file}`);
        });

      await result.parse(['test.txt']);
    });
    expect(outputs).toEqual(['middleware1', 'middleware2', 'action:test.txt']);
  });

  it('tests builder pattern with options and arguments', async () => {
    const outputs: string[] = [];
    await withMockedIO(async () => {
      const app = cli({ name: 'app' });
      
      // Test comprehensive builder pattern
      const result = app
        .argument('<input>')
        .argument('<output>')
        .option('--verbose', 'verbose mode')
        .option('--config', 'config file', { valueName: '<config>' })
        .option('--force', 'force overwrite')
        .action((args, options) => {
          outputs.push(`action:${args.input}:${args.output}:${options.verbose}:${options.config}:${options.force}`);
        });

      await result.parse(['input.txt', 'output.txt', '--verbose', '--config', 'config.json', '--force']);
    });
    expect(outputs).toEqual(['action:input.txt:output.txt:true:config.json:true']);
  });

  it('tests builder pattern with default values', async () => {
    const outputs: string[] = [];
    await withMockedIO(async () => {
      const app = cli({ name: 'app' });
      
      // Test builder pattern with default values
      const result = app
        .argument('<file>')
        .option('--count', 'count option', { defaultValue: '5', valueName: '<count>' })
        .option('--enabled', 'enabled flag', { defaultValue: true })
        .action((args, options) => {
          outputs.push(`action:${args.file}:${options.count}:${options.enabled}`);
        });

      await result.parse(['test.txt']);
    });
    expect(outputs).toEqual(['action:test.txt:5:true']);
  });

  it('tests builder pattern with overridden defaults', async () => {
    const outputs: string[] = [];
    await withMockedIO(async () => {
      const app = cli({ name: 'app' });
      
      // Test builder pattern with overridden defaults
      const result = app
        .argument('<file>')
        .option('--count', 'count option', { defaultValue: '5', valueName: '<count>' })
        .option('--enabled', 'enabled flag', { defaultValue: true })
        .action((args, options) => {
          outputs.push(`action:${args.file}:${options.count}:${options.enabled}`);
        });

      await result.parse(['test.txt', '--count', '10', '--enabled', 'false']);
    });
    expect(outputs).toEqual(['action:test.txt:10:false']);
  });

  it('tests help formatting with colors', async () => {
    const logs: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((msg?: any) => { if (typeof msg === 'string') logs.push(msg); });
    
    const app = cli({ name: 'testapp', description: 'Test application' });
    app.command('build', 'Build command')
      .argument('<target>')
      .option('--prod', 'Production mode')
      .option('--config', 'Config file', { valueName: '<config>' })
      .action(() => {});

    await app.parse(['--help']);
    const helpText = logs.join('\n');
    
    // Check that help includes all expected sections
    expect(helpText).toContain('testapp');
    expect(helpText).toContain('Test application');
    expect(helpText).toContain('Commands:');
    expect(helpText).toContain('build');
    expect(helpText).toContain('Build command');
    expect(helpText).toContain('Usage:');
    // Note: <target> and other argument details are shown in subcommand help, not main help
    expect(helpText).toContain('--help');
  });

  it('tests help formatting without colors', async () => {
    const logs: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((msg?: any) => { if (typeof msg === 'string') logs.push(msg); });
    
    const app = cli({ name: 'testapp', description: 'Test application' });
    app.argument('<file>')
      .option('--verbose', 'Verbose output')
      .action(() => {});

    await app.parse(['--help']);
    const helpText = logs.join('\n');
    
    // Check that help includes all expected sections
    expect(helpText).toContain('testapp');
    expect(helpText).toContain('Test application');
    expect(helpText).toContain('Usage:');
    expect(helpText).toContain('<file>');
    expect(helpText).toContain('--verbose');
    expect(helpText).toContain('--help');
  });

  it('tests help formatting with complex structure', async () => {
    const logs: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((msg?: any) => { if (typeof msg === 'string') logs.push(msg); });
    
    const app = cli({ name: 'testapp', description: 'Test application' });
    
    // Add multiple arguments
    app.argument('<input>')
      .argument('<output>')
      .argument('<format>');
    
    // Add multiple options
    app.option('--verbose', 'Verbose output')
      .option('--config', 'Config file', { valueName: '<config>' })
      .option('--force', 'Force overwrite')
      .option('--dry-run', 'Dry run mode');
    
    // Add subcommands
    app.command('build', 'Build command')
      .argument('<target>')
      .action(() => {});
    
    app.command('test', 'Test command')
      .argument('<suite>')
      .action(() => {});

    await app.parse(['--help']);
    const helpText = logs.join('\n');
    
    // Check that help includes all expected sections
    expect(helpText).toContain('Usage:');
    expect(helpText).toContain('<command>');
    expect(helpText).toContain('<input>');
    expect(helpText).toContain('<output>');
    expect(helpText).toContain('<format>');
    expect(helpText).toContain('--verbose');
    expect(helpText).toContain('--config');
    expect(helpText).toContain('--force');
    expect(helpText).toContain('--dry-run');
    expect(helpText).toContain('Commands:');
    expect(helpText).toContain('build');
    expect(helpText).toContain('test');
  });

  it('tests help formatting with long descriptions', async () => {
    const logs: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((msg?: any) => { if (typeof msg === 'string') logs.push(msg); });
    
    const longDescription = 'This is a very long description that should be handled properly by the help formatting system. It contains multiple sentences and should not cause any issues with the rendering.';
    const longOptionDesc = 'This is a very long option description that should be handled properly by the help formatting system.';
    
    const app = cli({ name: 'testapp', description: longDescription });
    app.argument('<file>', 'Input file to process')
      .option('--config', longOptionDesc, { valueName: '<config>' })
      .action(() => {});

    await app.parse(['--help']);
    const helpText = logs.join('\n');
    
    expect(helpText).toContain(longDescription);
    expect(helpText).toContain(longOptionDesc);
  });

  it('tests help formatting with special characters', async () => {
    const logs: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((msg?: any) => { if (typeof msg === 'string') logs.push(msg); });
    
    const app = cli({ name: 'test-app', description: 'Test application with special chars: !@#$%^&*()' });
    app.argument('<file-name>', 'File name with hyphens')
      .option('--config-file', 'Config file option', { valueName: '<config-name>' })
      .action(() => {});

    await app.parse(['--help']);
    const helpText = logs.join('\n');
    
    expect(helpText).toContain('test-app');
    expect(helpText).toContain('Test application with special chars: !@#$%^&*()');
    expect(helpText).toContain('<file-name>');
    expect(helpText).toContain('File name with hyphens');
    expect(helpText).toContain('--config-file');
    expect(helpText).toContain('<config-name>');
  });

  it('tests flag normalization', async () => {
    const outputs: string[] = [];
    await withMockedIO(async () => {
      const app = cli({ name: 'app' });
      
      // Test that flags are normalized correctly
      const result = app
        .argument('<file>')
        .option('--verbose', 'verbose mode')
        .option('--config', 'config file', { valueName: '<config>' })
        .action((args, options) => {
          // The options object should have normalized keys (without --)
          outputs.push(`verbose:${options.verbose}`);
          outputs.push(`config:${options.config}`);
        });

      await result.parse(['test.txt', '--verbose', '--config', 'config.json']);
    });
    
    // Check that the normalized keys are used
    expect(outputs).toEqual(['verbose:true', 'config:config.json']);
  });

  it('tests flag normalization with different flag formats', async () => {
    const outputs: string[] = [];
    await withMockedIO(async () => {
      const app = cli({ name: 'app' });
      
      // Test different flag formats
      const result = app
        .argument('<file>')
        .option('--flag1', 'flag 1')
        .option('--flag-2', 'flag 2')
        .option('--flag_3', 'flag 3')
        .option('--FLAG4', 'flag 4')
        .action((args, options) => {
          outputs.push(`flag1:${options.flag1}`);
          outputs.push(`flag-2:${options['flag-2']}`);
          outputs.push(`flag_3:${options['flag_3']}`);
          outputs.push(`FLAG4:${options.FLAG4}`);
        });

      await result.parse(['test.txt', '--flag1', '--flag-2', '--flag_3', '--FLAG4']);
    });
    
    expect(outputs).toEqual(['flag1:true', 'flag-2:true', 'flag_3:true', 'FLAG4:true']);
  });

  it('tests argument parsing edge cases', async () => {
    const outputs: string[] = [];
    await withMockedIO(async () => {
      const app = cli({ name: 'app' });
      
      // Test various argument parsing scenarios
      const result = app
        .argument('<file>')
        .argument('<output>')
        .option('--verbose', 'verbose mode')
        .option('--config', 'config file', { valueName: '<config>' })
        .action((args, options) => {
          outputs.push(`file:${args.file}`);
          outputs.push(`output:${args.output}`);
          outputs.push(`verbose:${options.verbose}`);
          outputs.push(`config:${options.config}`);
        });

      // Test with mixed order of options and arguments
      await result.parse(['--verbose', 'input.txt', '--config', 'config.json', 'output.txt']);
    });
    
    expect(outputs).toEqual(['file:input.txt', 'output:output.txt', 'verbose:true', 'config:config.json']);
  });

  it('tests argument parsing with empty strings', async () => {
    const outputs: string[] = [];
    await withMockedIO(async () => {
      const app = cli({ name: 'app' });
      
      const result = app
        .argument('<file>')
        .argument('<name>')
        .action((args) => {
          outputs.push(`file:${args.file}`);
          outputs.push(`name:${args.name}`);
        });

      // Test with empty string arguments
      await result.parse(['', '']);
    });
    
    expect(outputs).toEqual(['file:', 'name:']);
  });

  it('tests argument parsing with special characters', async () => {
    const outputs: string[] = [];
    await withMockedIO(async () => {
      const app = cli({ name: 'app' });
      
      const result = app
        .argument('<file>')
        .argument('<path>')
        .action((args) => {
          outputs.push(`file:${args.file}`);
          outputs.push(`path:${args.path}`);
        });

      // Test with special characters in arguments
      await result.parse(['file with spaces.txt', '/path/with/special/chars/!@#$%^&*()']);
    });
    
    expect(outputs).toEqual(['file:file with spaces.txt', 'path:/path/with/special/chars/!@#$%^&*()']);
  });

  it('tests option parsing with various value types', async () => {
    const outputs: string[] = [];
    await withMockedIO(async () => {
      const app = cli({ name: 'app' });
      
      const result = app
        .argument('<file>')
        .option('--string-opt', 'string option', { valueName: '<string>' })
        .option('--bool-opt', 'boolean option')
        .action((args, options) => {
          outputs.push(`string:${options['string-opt']}`);
          outputs.push(`bool:${options['bool-opt']}`);
        });

      await result.parse(['test.txt', '--string-opt', 'test-value', '--bool-opt']);
    });
    
    expect(outputs).toEqual(['string:test-value', 'bool:true']);
  });

  it('tests option parsing with default values', async () => {
    const outputs: string[] = [];
    await withMockedIO(async () => {
      const app = cli({ name: 'app' });
      
      const result = app
        .argument('<file>')
        .option('--string-opt', 'string option', { defaultValue: 'default-string', valueName: '<string>' })
        .option('--bool-opt', 'boolean option', { defaultValue: true })
        .action((args, options) => {
          outputs.push(`string:${options['string-opt']}`);
          outputs.push(`bool:${options['bool-opt']}`);
        });

      await result.parse(['test.txt']);
    });
    
    expect(outputs).toEqual(['string:default-string', 'bool:true']);
  });

  it('tests option parsing with overridden defaults', async () => {
    const outputs: string[] = [];
    await withMockedIO(async () => {
      const app = cli({ name: 'app' });
      
      const result = app
        .argument('<file>')
        .option('--string-opt', 'string option', { defaultValue: 'default-string', valueName: '<string>' })
        .option('--bool-opt', 'boolean option', { defaultValue: true })
        .action((args, options) => {
          outputs.push(`string:${options['string-opt']}`);
          outputs.push(`bool:${options['bool-opt']}`);
        });

      await result.parse(['test.txt', '--string-opt', 'custom-string', '--bool-opt', 'false']);
    });
    
    expect(outputs).toEqual(['string:custom-string', 'bool:false']);
  });
});


