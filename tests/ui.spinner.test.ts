import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSpinner } from '../src/ui/spinner.js';

describe('Spinner UI', () => {
  let mockStdout: any;
  let mockSetInterval: any;
  let mockClearInterval: any;
  let originalStdout: any;

  beforeEach(() => {
    mockStdout = {
      write: vi.fn(),
    };

    mockSetInterval = vi.fn();
    mockClearInterval = vi.fn();

    // Store original stdout
    originalStdout = process.stdout;

    // Mock process.stdout
    Object.defineProperty(process, 'stdout', {
      value: mockStdout,
      writable: true,
      configurable: true,
    });

    // Mock setInterval and clearInterval
    global.setInterval = mockSetInterval;
    global.clearInterval = mockClearInterval;
  });

  afterEach(() => {
    // Restore process.stdout
    Object.defineProperty(process, 'stdout', {
      value: originalStdout,
      writable: true,
      configurable: true,
    });
    vi.clearAllMocks();
  });

  it('creates spinner with default options', () => {
    const spinner = createSpinner();
    
    expect(spinner).toBeDefined();
    expect(typeof spinner.start).toBe('function');
    expect(typeof spinner.stop).toBe('function');
    expect(typeof spinner.succeed).toBe('function');
    expect(typeof spinner.fail).toBe('function');
  });

  it('creates spinner with text string', () => {
    const spinner = createSpinner('Loading...');
    
    expect(spinner).toBeDefined();
    spinner.start();
    expect(mockStdout.write).toHaveBeenCalledWith(expect.stringContaining('Loading...'));
  });

  it('creates spinner with options object', () => {
    const spinner = createSpinner({ text: 'Processing', intervalMs: 100 });
    
    expect(spinner).toBeDefined();
    spinner.start();
    expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 100);
  });

  it('starts spinner and sets interval', () => {
    const spinner = createSpinner('Test');
    const mockInterval = 123;
    mockSetInterval.mockReturnValue(mockInterval);
    
    spinner.start();
    
    expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 80);
    expect(mockStdout.write).toHaveBeenCalled();
  });

  it('does not start spinner if already running', () => {
    const spinner = createSpinner('Test');
    const mockInterval = 123;
    mockSetInterval.mockReturnValue(mockInterval);
    
    spinner.start();
    spinner.start(); // Second call should not start again
    
    expect(mockSetInterval).toHaveBeenCalledTimes(1);
  });

  it('stops spinner and clears interval', () => {
    const spinner = createSpinner('Test');
    const mockInterval = 123;
    mockSetInterval.mockReturnValue(mockInterval);
    
    spinner.start();
    spinner.stop();
    
    expect(mockClearInterval).toHaveBeenCalledWith(mockInterval);
    expect(mockStdout.write).toHaveBeenCalledWith('\r   \r');
  });

  it('succeeds spinner and clears interval', () => {
    const spinner = createSpinner('Test');
    const mockInterval = 123;
    mockSetInterval.mockReturnValue(mockInterval);
    
    spinner.start();
    spinner.succeed('Success!');
    
    expect(mockClearInterval).toHaveBeenCalledWith(mockInterval);
    expect(mockStdout.write).toHaveBeenCalledWith(expect.stringContaining('✔'));
    expect(mockStdout.write).toHaveBeenCalledWith(expect.stringContaining('Success!'));
  });

  it('succeeds spinner with default text', () => {
    const spinner = createSpinner('Processing');
    const mockInterval = 123;
    mockSetInterval.mockReturnValue(mockInterval);
    
    spinner.start();
    spinner.succeed();
    
    expect(mockStdout.write).toHaveBeenCalledWith(expect.stringContaining('Processing'));
  });

  it('fails spinner and clears interval', () => {
    const spinner = createSpinner('Test');
    const mockInterval = 123;
    mockSetInterval.mockReturnValue(mockInterval);
    
    spinner.start();
    spinner.fail('Error!');
    
    expect(mockClearInterval).toHaveBeenCalledWith(mockInterval);
    expect(mockStdout.write).toHaveBeenCalledWith(expect.stringContaining('✖'));
    expect(mockStdout.write).toHaveBeenCalledWith(expect.stringContaining('Error!'));
  });

  it('fails spinner with default text', () => {
    const spinner = createSpinner('Processing');
    const mockInterval = 123;
    mockSetInterval.mockReturnValue(mockInterval);
    
    spinner.start();
    spinner.fail();
    
    expect(mockStdout.write).toHaveBeenCalledWith(expect.stringContaining('Processing'));
  });

  it('sets text dynamically', () => {
    const spinner = createSpinner('Initial');
    
    spinner.setText('Updated');
    spinner.start();
    
    expect(mockStdout.write).toHaveBeenCalledWith(expect.stringContaining('Updated'));
  });

  it('sets color dynamically', () => {
    const spinner = createSpinner('Test');
    const customColor = (text: string) => `COLORED_${text}`;
    
    spinner.setColor(customColor);
    spinner.start();
    
    expect(mockStdout.write).toHaveBeenCalledWith(expect.stringContaining('COLORED_'));
  });

  it('sets frames dynamically', () => {
    const spinner = createSpinner('Test');
    const customFrames = ['a', 'b', 'c'];
    
    spinner.setFrames(customFrames);
    spinner.start();
    
    expect(mockStdout.write).toHaveBeenCalledWith(expect.stringContaining('a'));
  });

  it('sets interval dynamically', () => {
    const spinner = createSpinner('Test');
    const mockInterval = 123;
    mockSetInterval.mockReturnValue(mockInterval);
    
    spinner.start();
    spinner.setInterval(200);
    
    expect(mockClearInterval).toHaveBeenCalledWith(mockInterval);
    expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 200);
  });

  it('sets prefix dynamically', () => {
    const spinner = createSpinner('Test');
    
    spinner.setPrefix('PREFIX_');
    spinner.start();
    
    expect(mockStdout.write).toHaveBeenCalledWith(expect.stringContaining('PREFIX_'));
  });

  it('sets suffix dynamically', () => {
    const spinner = createSpinner('Test');
    
    spinner.setSuffix('_SUFFIX');
    spinner.start();
    
    expect(mockStdout.write).toHaveBeenCalledWith(expect.stringContaining('_SUFFIX'));
  });

  it('updates multiple options at once', () => {
    const spinner = createSpinner('Test');
    
    spinner.update({ text: 'Updated', intervalMs: 150, prefix: 'PREFIX_' });
    spinner.start();
    
    expect(mockStdout.write).toHaveBeenCalledWith(expect.stringContaining('Updated'));
    expect(mockStdout.write).toHaveBeenCalledWith(expect.stringContaining('PREFIX_'));
  });

  it('uses custom colors when provided', () => {
    const customColors = {
      bold: (text: string) => `BOLD_${text}`,
      green: (text: string) => `GREEN_${text}`,
      red: (text: string) => `RED_${text}`,
      yellow: (text: string) => `YELLOW_${text}`,
      blue: (text: string) => `BLUE_${text}`,
      magenta: (text: string) => `MAGENTA_${text}`,
      cyan: (text: string) => `CYAN_${text}`,
    };
    
    const spinner = createSpinner('Test', customColors);
    
    spinner.start();
    expect(mockStdout.write).toHaveBeenCalledWith(expect.stringContaining('CYAN_'));
    
    spinner.succeed('Success');
    expect(mockStdout.write).toHaveBeenCalledWith(expect.stringContaining('GREEN_'));
    expect(mockStdout.write).toHaveBeenCalledWith(expect.stringContaining('BOLD_'));
    
    spinner.fail('Error');
    expect(mockStdout.write).toHaveBeenCalledWith(expect.stringContaining('RED_'));
    expect(mockStdout.write).toHaveBeenCalledWith(expect.stringContaining('BOLD_'));
  });

  it('handles custom succeed and fail icons', () => {
    const spinner = createSpinner({
      text: 'Test',
      succeedIcon: '✅',
      failIcon: '❌',
    });
    
    spinner.succeed();
    expect(mockStdout.write).toHaveBeenCalledWith(expect.stringContaining('✅'));
    
    spinner.fail();
    expect(mockStdout.write).toHaveBeenCalledWith(expect.stringContaining('❌'));
  });

  it('handles custom succeed and fail colors', () => {
    const customColors = {
      bold: (text: string) => `BOLD_${text}`,
      green: (text: string) => `GREEN_${text}`,
      red: (text: string) => `RED_${text}`,
      yellow: (text: string) => `YELLOW_${text}`,
      blue: (text: string) => `BLUE_${text}`,
      magenta: (text: string) => `MAGENTA_${text}`,
      cyan: (text: string) => `CYAN_${text}`,
    };
    
    const spinner = createSpinner({
      text: 'Test',
      succeedColor: (text: string) => `CUSTOM_SUCCESS_${text}`,
      failColor: (text: string) => `CUSTOM_FAIL_${text}`,
    }, customColors);
    
    spinner.succeed();
    expect(mockStdout.write).toHaveBeenCalledWith(expect.stringContaining('CUSTOM_SUCCESS_'));
    
    spinner.fail();
    expect(mockStdout.write).toHaveBeenCalledWith(expect.stringContaining('CUSTOM_FAIL_'));
  });

  it('handles preset frame names', () => {
    const spinner = createSpinner({ frames: 'dots2' });
    spinner.start();
    expect(mockStdout.write).toHaveBeenCalled();
    
    const spinner2 = createSpinner({ frames: 'line' });
    spinner2.start();
    expect(mockStdout.write).toHaveBeenCalled();
    
    const spinner3 = createSpinner({ frames: 'pipe' });
    spinner3.start();
    expect(mockStdout.write).toHaveBeenCalled();
    
    const spinner4 = createSpinner({ frames: 'arrow' });
    spinner4.start();
    expect(mockStdout.write).toHaveBeenCalled();
    
    const spinner5 = createSpinner({ frames: 'star' });
    spinner5.start();
    expect(mockStdout.write).toHaveBeenCalled();
    
    const spinner6 = createSpinner({ frames: 'earth' });
    spinner6.start();
    expect(mockStdout.write).toHaveBeenCalled();
    
    const spinner7 = createSpinner({ frames: 'clock' });
    spinner7.start();
    expect(mockStdout.write).toHaveBeenCalled();
  });

  it('handles invalid preset frame names gracefully', () => {
    const spinner = createSpinner({ frames: 'invalid' as any });
    spinner.start();
    expect(mockStdout.write).toHaveBeenCalled();
  });

  it('handles empty frames array gracefully', () => {
    const spinner = createSpinner({ frames: [] });
    spinner.start();
    expect(mockStdout.write).toHaveBeenCalled();
  });

  it('handles null/undefined frames gracefully', () => {
    const spinner = createSpinner({ frames: null as any });
    spinner.start();
    expect(mockStdout.write).toHaveBeenCalled();
    
    const spinner2 = createSpinner({ frames: undefined });
    spinner2.start();
    expect(mockStdout.write).toHaveBeenCalled();
  });

  it('handles empty text gracefully', () => {
    const spinner = createSpinner({ text: '' });
    spinner.start();
    expect(mockStdout.write).toHaveBeenCalledWith(expect.stringContaining('   '));
  });

  it('handles null/undefined text gracefully', () => {
    const spinner = createSpinner({ text: null as any });
    spinner.start();
    expect(mockStdout.write).toHaveBeenCalledWith(expect.stringContaining('   '));
    
    const spinner2 = createSpinner({ text: undefined });
    spinner2.start();
    expect(mockStdout.write).toHaveBeenCalledWith(expect.stringContaining('   '));
  });

  it('handles empty prefix and suffix gracefully', () => {
    const spinner = createSpinner({ prefix: '', suffix: '' });
    spinner.start();
    expect(mockStdout.write).toHaveBeenCalledWith(expect.stringContaining('   '));
  });

  it('handles null/undefined prefix and suffix gracefully', () => {
    const spinner = createSpinner({ prefix: null as any, suffix: null as any });
    spinner.start();
    expect(mockStdout.write).toHaveBeenCalledWith(expect.stringContaining('   '));
    
    const spinner2 = createSpinner({ prefix: undefined, suffix: undefined });
    spinner2.start();
    expect(mockStdout.write).toHaveBeenCalledWith(expect.stringContaining('   '));
  });

  it('handles custom color function that returns undefined', () => {
    const spinner = createSpinner({ color: () => undefined as any });
    spinner.start();
    expect(mockStdout.write).toHaveBeenCalled();
  });

  it('handles custom succeed color function that returns undefined', () => {
    const spinner = createSpinner({ succeedColor: () => undefined as any });
    spinner.succeed();
    expect(mockStdout.write).toHaveBeenCalled();
  });

  it('handles custom fail color function that returns undefined', () => {
    const spinner = createSpinner({ failColor: () => undefined as any });
    spinner.fail();
    expect(mockStdout.write).toHaveBeenCalled();
  });

  it('handles colors object with missing methods gracefully', () => {
    const incompleteColors = {
      bold: (text: string) => `BOLD_${text}`,
      // Missing other color methods
    } as any;
    
    const spinner = createSpinner('Test', incompleteColors);
    
    spinner.start();
    expect(mockStdout.write).toHaveBeenCalled();
    
    spinner.succeed();
    expect(mockStdout.write).toHaveBeenCalled();
    
    spinner.fail();
    expect(mockStdout.write).toHaveBeenCalled();
  });

  it('handles setInterval when no interval is currently running', () => {
    const spinner = createSpinner('Test');
    
    spinner.setInterval(200);
    expect(mockSetInterval).not.toHaveBeenCalled();
    
    const mockInterval = 123;
    mockSetInterval.mockReturnValue(mockInterval);
    
    spinner.start();
    
    spinner.setInterval(300);
    expect(mockClearInterval).toHaveBeenCalledWith(mockInterval);
    expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 300);
  });

  it('handles setFrames with preset names', () => {
    const spinner = createSpinner('Test');
    
    spinner.setFrames('dots2');
    spinner.start();
    expect(mockStdout.write).toHaveBeenCalled();
    
    spinner.setFrames('line');
    expect(mockStdout.write).toHaveBeenCalled();
  });

  it('handles setFrames with custom array', () => {
    const spinner = createSpinner('Test');
    const customFrames = ['x', 'y', 'z'];
    
    spinner.setFrames(customFrames);
    spinner.start();
    expect(mockStdout.write).toHaveBeenCalled();
  });

  it('handles setFrames with null/undefined', () => {
    const spinner = createSpinner('Test');
    
    spinner.setFrames(null as any);
    spinner.start();
    expect(mockStdout.write).toHaveBeenCalled();
    
    spinner.setFrames(undefined);
    expect(mockStdout.write).toHaveBeenCalled();
  });

  it('handles setFrames with empty array', () => {
    const spinner = createSpinner('Test');
    
    spinner.setFrames([]);
    spinner.start();
    expect(mockStdout.write).toHaveBeenCalled();
  });

  it('handles setFrames with invalid preset name', () => {
    const spinner = createSpinner('Test');
    
    spinner.setFrames('invalid' as any);
    spinner.start();
    expect(mockStdout.write).toHaveBeenCalled();
  });
});


