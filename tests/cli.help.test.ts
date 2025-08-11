import { describe, it, expect, vi } from 'vitest';
import { cli } from '../src/index.js';

describe('CLI Help', () => {
  it('shows help when --help flag is used', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    try {
      await cli({ name: 'test-app', description: 'A test application' })
        .argument('<file>', 'Input file')
        .option('--verbose', 'Enable verbose mode')
        .action(() => {})
        .parse(['--help']);
    } catch (error) {
      // Help should exit the process, so we expect an error
    }
    
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('test-app'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('A test application'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Usage:'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('<file>'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('--verbose'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('--help'));
    
    logSpy.mockRestore();
  });

  it('shows help with subcommands', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    try {
      const app = cli({ name: 'test-app' })
        .command('build', 'Build the project')
        .action(() => {});
      
      // Call help on the root command, not the subcommand
      await app.parse(['--help']);
    } catch (error) {
      // Help should exit the process
    }
    
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Commands:'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('build'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Build the project'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('<command>'));
    
    logSpy.mockRestore();
  });

  it('shows help with multiple arguments', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    try {
      await cli({ name: 'test-app' })
        .argument('<input>', 'Input file')
        .argument('<output>', 'Output file')
        .action(() => {})
        .parse(['--help']);
    } catch (error) {
      // Help should exit the process
    }
    
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Arguments:'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('<input>'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('<output>'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Input file'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Output file'));
    
    logSpy.mockRestore();
  });

  it('shows help with value options', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    try {
      await cli({ name: 'test-app' })
        .option('--config <file>', 'Configuration file')
        .option('--output <dir>', 'Output directory')
        .action(() => {})
        .parse(['--help']);
    } catch (error) {
      // Help should exit the process
    }
    
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Options:'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('--config <file>'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('--output <dir>'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Configuration file'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Output directory'));
    
    logSpy.mockRestore();
  });

  it('shows help with boolean options', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    try {
      await cli({ name: 'test-app' })
        .option('--verbose', 'Enable verbose mode')
        .option('--quiet', 'Suppress output')
        .action(() => {})
        .parse(['--help']);
    } catch (error) {
      // Help should exit the process
    }
    
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('--verbose'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('--quiet'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Enable verbose mode'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Suppress output'));
    
    logSpy.mockRestore();
  });

  it('shows help with options that have default values', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    try {
      await cli({ name: 'test-app' })
        .option('--port <number>', 'Port number', { defaultValue: '3000' })
        .option('--debug', 'Enable debug mode', { defaultValue: true })
        .action(() => {})
        .parse(['--help']);
    } catch (error) {
      // Help should exit the process
    }
    
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('--port <number>'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('--debug'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('(default: 3000)'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('(default: true)'));
    
    logSpy.mockRestore();
  });

  it('shows help with complex command structure', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    try {
      const app = cli({ name: 'test-app', description: 'A complex test application' })
        .command('build', 'Build the project')
        .action(() => {});
      
      // Call help on the root command
      await app.parse(['--help']);
    } catch (error) {
      // Help should exit the process
    }
    
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('A complex test application'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Commands:'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('build'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Build the project'));
    
    logSpy.mockRestore();
  });

  it('shows help with nested subcommands', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    try {
      const app = cli({ name: 'test-app' })
        .command('project', 'Project management')
        .command('build', 'Build the project')
        .action(() => {});
      
      // Call help on the root command
      await app.parse(['--help']);
    } catch (error) {
      // Help should exit the process
    }
    
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('project'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Project management'));
    
    logSpy.mockRestore();
  });

  it('shows help with no description', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    try {
      await cli({ name: 'test-app' })
        .action(() => {})
        .parse(['--help']);
    } catch (error) {
      // Help should exit the process
    }
    
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('test-app'));
    // Should not show description line if none provided
    
    logSpy.mockRestore();
  });

  it('shows help with no arguments or options', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    try {
      await cli({ name: 'test-app' })
        .action(() => {})
        .parse(['--help']);
    } catch (error) {
      // Help should exit the process
    }
    
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('test-app'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Usage:'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Options:'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('--help'));
    
    logSpy.mockRestore();
  });

  it('shows help with empty subcommands array', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    try {
      await cli({ name: 'test-app' })
        .action(() => {})
        .parse(['--help']);
    } catch (error) {
      // Help should exit the process
    }
    
    // Should not show Commands section if no subcommands
    const output = logSpy.mock.calls.map(call => call[0]).join('\n');
    expect(output).not.toContain('Commands:');
    
    logSpy.mockRestore();
  });

  it('shows help with empty arguments array', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    try {
      await cli({ name: 'test-app' })
        .action(() => {})
        .parse(['--help']);
    } catch (error) {
      // Help should exit the process
    }
    
    // Should not show Arguments section if no arguments
    const output = logSpy.mock.calls.map(call => call[0]).join('\n');
    expect(output).not.toContain('Arguments:');
    
    logSpy.mockRestore();
  });

  it('shows help with empty options array', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    try {
      await cli({ name: 'test-app' })
        .action(() => {})
        .parse(['--help']);
    } catch (error) {
      // Help should exit the process
    }
    
    // Should still show Options section with --help
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Options:'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('--help'));
    
    logSpy.mockRestore();
  });

  it('shows help for subcommands when called with --help', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    try {
      const app = cli({ name: 'test-app' })
        .command('build', 'Build the project')
        .argument('<target>', 'Build target')
        .action(() => {});
      
      // Call help on the build subcommand
      await app.parse(['build', '--help']);
    } catch (error) {
      // Help should exit the process
    }
    
    // Should show help for the build command, not the root command
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('test-app build'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('<target>'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Build target'));
    
    logSpy.mockRestore();
  });

  it('shows help for nested subcommands when called with --help', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    try {
      const app = cli({ name: 'test-app' })
        .command('project', 'Project management')
        .command('build', 'Build the project')
        .argument('<target>', 'Build target')
        .action(() => {});
      
      // Call help on the project build subcommand
      await app.parse(['project', 'build', '--help']);
    } catch (error) {
      // Help should exit the process
    }
    
    // Should show help for the project build command
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('test-app project build'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('<target>'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Build target'));
    
    logSpy.mockRestore();
  });
});
