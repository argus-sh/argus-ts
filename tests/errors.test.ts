import { describe, it, expect, vi } from 'vitest';
import { ArgusError, MissingArgumentError, UnknownOptionError, MissingOptionValueError, InvalidSubcommandError } from '../src/errors/index';

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

describe('Errors', () => {
  it('creates basic ArgusError', () => {
    const error = new ArgusError('TEST_ERROR', 'Test message');
    expect(error.code).toBe('TEST_ERROR');
    expect(error.message).toBe('Test message');
    expect(error.name).toBe('ArgusError');
    expect(error.details).toBeUndefined();
    expect(error.hint).toBeUndefined();
  });

  it('creates ArgusError with details and hint', () => {
    const error = new ArgusError('TEST_ERROR', 'Test message', 'Test details', 'Test hint');
    expect(error.code).toBe('TEST_ERROR');
    expect(error.message).toBe('Test message');
    expect(error.details).toBe('Test details');
    expect(error.hint).toBe('Test hint');
  });

  it('formats error without UI', () => {
    const error = new ArgusError('TEST_ERROR', 'Test message', 'Test details', 'Test hint');
    const formatted = error.format();
    expect(formatted).toContain('TEST_ERROR');
    expect(formatted).toContain('Test message');
    expect(formatted).toContain('Test details');
    expect(formatted).toContain('Hint: Test hint');
  });

  it('formats error with UI colors', () => {
    const error = new ArgusError('TEST_ERROR', 'Test message', 'Test details', 'Test hint');
    const mockUi = {
      colors: {
        red: (s: string) => `RED_${s}`,
        blue: (s: string) => `BLUE_${s}`,
        bold: (s: string) => `BOLD_${s}`,
      },
      box: vi.fn(),
    };
    
    const formatted = error.format(mockUi);
    expect(formatted).toContain('RED_TEST_ERROR');
    expect(formatted).toContain('Test message');
    expect(formatted).toContain('Test details');
    expect(formatted).toContain('BLUE_Hint: Test hint');
  });

  it('prints error to console when no UI provided', () => {
    const error = new ArgusError('TEST_ERROR', 'Test message');
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    error.print();
    
    expect(errorSpy).toHaveBeenCalledWith('Error:\nTEST_ERROR Test message');
    errorSpy.mockRestore();
  });

  it('prints error using UI box when provided', () => {
    const error = new ArgusError('TEST_ERROR', 'Test message');
    const mockUi = {
      colors: {
        red: (s: string) => `RED_${s}`,
        blue: (s: string) => `BLUE_${s}`,
        bold: (s: string) => `BOLD_${s}`,
      },
      box: vi.fn(),
    };
    
    error.print(mockUi);
    
    expect(mockUi.box).toHaveBeenCalledWith(
      'RED_TEST_ERROR Test message',
      'BOLD_Error'
    );
  });

  it('identifies ArgusError instances', () => {
    const error = new ArgusError('TEST_ERROR', 'Test message');
    expect(ArgusError.isArgusError(error)).toBe(true);
    expect(ArgusError.isArgusError(new Error('regular error'))).toBe(false);
    expect(ArgusError.isArgusError(null)).toBe(false);
    expect(ArgusError.isArgusError(undefined)).toBe(false);
  });

  it('identifies ArgusError-like objects', () => {
    const errorLike = {
      code: 'TEST_ERROR',
      message: 'Test message',
      name: 'Error',
    };
    expect(ArgusError.isArgusError(errorLike)).toBe(true);
  });

  it('creates MissingArgumentError', () => {
    const error = new MissingArgumentError('filename');
    expect(error.code).toBe('E_MISSING_ARGUMENT');
    expect(error.message).toBe('Missing required argument <filename>.');
    expect(error.details).toBe('The positional argument <filename> is required but was not provided.');
    expect(error.hint).toBe('Provide the <filename> value or run with --help to see usage.');
    expect(error.name).toBe('MissingArgumentError');
  });

  it('creates UnknownOptionError', () => {
    const error = new UnknownOptionError('--unknown');
    expect(error.code).toBe('E_UNKNOWN_OPTION');
    expect(error.message).toBe('Unknown option --unknown.');
    expect(error.details).toBe("The option '--unknown' is not recognized for this command.");
    expect(error.hint).toBe('Remove the option or check the valid options with --help.');
    expect(error.name).toBe('UnknownOptionError');
  });

  it('creates MissingOptionValueError', () => {
    const error = new MissingOptionValueError('--config', 'config');
    expect(error.code).toBe('E_MISSING_OPTION_VALUE');
    expect(error.message).toBe('Missing value for option --config.');
    expect(error.details).toBe('Expected a value for \'--config\' in place of <config>.');
    expect(error.hint).toBe('Provide a value after --config, e.g., "--config <config>".');
    expect(error.name).toBe('MissingOptionValueError');
  });

  it('creates InvalidSubcommandError', () => {
    const error = new InvalidSubcommandError('invalid', ['build', 'test']);
    expect(error.code).toBe('E_INVALID_SUBCOMMAND');
    expect(error.message).toBe('Invalid sub-command \'invalid\'.');
    expect(error.details).toBe('Available: build, test');
    expect(error.hint).toBe('Run with --help to list sub-commands.');
    expect(error.name).toBe('InvalidSubcommandError');
  });

  it('creates InvalidSubcommandError with no available commands', () => {
    const error = new InvalidSubcommandError('invalid', []);
    expect(error.code).toBe('E_INVALID_SUBCOMMAND');
    expect(error.message).toBe('Invalid sub-command \'invalid\'.');
    expect(error.details).toBe('No sub-commands available.');
    expect(error.hint).toBe('Run with --help to list sub-commands.');
  });

  it('handles error formatting with undefined UI colors', () => {
    const error = new ArgusError('TEST_ERROR', 'Test message', 'Test details', 'Test hint');
    const mockUi = {
      colors: undefined,
      box: vi.fn(),
    };
    
    const formatted = error.format(mockUi);
    expect(formatted).toContain('TEST_ERROR');
    expect(formatted).toContain('Test message');
    expect(formatted).toContain('Test details');
    expect(formatted).toContain('Hint: Test hint');
  });

  it('handles error printing with undefined UI colors', () => {
    const error = new ArgusError('TEST_ERROR', 'Test message');
    const mockUi = {
      colors: undefined,
      box: vi.fn(),
    };
    
    error.print(mockUi);
    
    expect(mockUi.box).toHaveBeenCalledWith(
      'TEST_ERROR Test message',
      'Error'
    );
  });

  it('handles error with only message and code', () => {
    const error = new ArgusError('SIMPLE_ERROR', 'Simple message');
    const formatted = error.format();
    expect(formatted).toBe('SIMPLE_ERROR Simple message');
  });

  it('handles error with message, code, and details only', () => {
    const error = new ArgusError('DETAILS_ERROR', 'Details message', 'Some details');
    const formatted = error.format();
    expect(formatted).toBe('DETAILS_ERROR Details message\nSome details');
  });

  it('handles error with message, code, and hint only', () => {
    const error = new ArgusError('HINT_ERROR', 'Hint message', undefined, 'Some hint');
    const formatted = error.format();
    expect(formatted).toBe('HINT_ERROR Hint message\nHint: Some hint');
  });
});


