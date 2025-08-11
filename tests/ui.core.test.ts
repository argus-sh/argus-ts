import { describe, it, expect, vi } from 'vitest';
import { createUi } from '../src/ui/index';

describe('UI Core', () => {
  it('creates UI with colors', () => {
    const ui = createUi();
    expect(ui.colors).toBeDefined();
    expect(ui.colors.red).toBeDefined();
    expect(ui.colors.green).toBeDefined();
    expect(ui.colors.blue).toBeDefined();
    expect(ui.colors.cyan).toBeDefined();
    expect(ui.colors.yellow).toBeDefined();
    expect(ui.colors.bold).toBeDefined();
  });

  it('creates UI with spinner', () => {
    const ui = createUi();
    expect(ui.spinner).toBeDefined();
    expect(typeof ui.spinner).toBe('function');
  });

  it('creates UI with box', () => {
    const ui = createUi();
    expect(ui.box).toBeDefined();
    expect(typeof ui.box).toBe('function');
  });

  it('applies colors to text', () => {
    const ui = createUi();
    const testText = 'test';
    
    expect(ui.colors.red(testText)).toBeDefined();
    expect(ui.colors.green(testText)).toBeDefined();
    expect(ui.colors.blue(testText)).toBeDefined();
    expect(ui.colors.cyan(testText)).toBeDefined();
    expect(ui.colors.yellow(testText)).toBeDefined();
    expect(ui.colors.bold(testText)).toBeDefined();
  });

  it('creates spinner with UI context', () => {
    const ui = createUi();
    const spinner = ui.spinner('Test spinner');
    
    expect(spinner).toBeDefined();
    expect(typeof spinner.start).toBe('function');
    expect(typeof spinner.stop).toBe('function');
    expect(typeof spinner.succeed).toBe('function');
    expect(typeof spinner.fail).toBe('function');
  });

  it('creates box with UI context', () => {
    const ui = createUi();
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    ui.box('Test content', 'Test title');
    
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it('handles box without title', () => {
    const ui = createUi();
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    ui.box('Test content only');
    
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it('handles box with empty content', () => {
    const ui = createUi();
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    ui.box('', 'Empty content');
    
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it('handles box with special characters', () => {
    const ui = createUi();
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    ui.box('Content with special chars: !@#$%^&*()', 'Special Title');
    
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it('handles box with long content', () => {
    const ui = createUi();
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    const longContent = 'This is a very long content that should be handled properly by the box function. It contains multiple sentences and should not cause any issues with the rendering.';
    ui.box(longContent, 'Long Content Test');
    
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it('handles box with multiline content', () => {
    const ui = createUi();
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    const multilineContent = 'Line 1\nLine 2\nLine 3';
    ui.box(multilineContent, 'Multiline Test');
    
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it('handles box with very long title', () => {
    const ui = createUi();
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    const longTitle = 'This is a very long title that should be handled properly by the box function';
    ui.box('Content', longTitle);
    
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it('handles box with unicode characters', () => {
    const ui = createUi();
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    ui.box('Unicode: 🚀 🌟 💻', 'Unicode Test');
    
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it('handles box with ANSI color codes', () => {
    const ui = createUi();
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    const coloredContent = '\u001b[31mRed text\u001b[0m and \u001b[32mGreen text\u001b[0m';
    ui.box(coloredContent, 'ANSI Colors');
    
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it('creates multiple UI instances independently', () => {
    const ui1 = createUi();
    const ui2 = createUi();
    
    expect(ui1).not.toBe(ui2);
    expect(ui1.colors).not.toBe(ui2.colors);
    expect(ui1.spinner).not.toBe(ui2.spinner);
    expect(ui1.box).not.toBe(ui2.box);
  });

  it('handles colors with empty strings', () => {
    const ui = createUi();
    
    expect(ui.colors.red('')).toBe('');
    expect(ui.colors.green('')).toBe('');
    expect(ui.colors.blue('')).toBe('');
    expect(ui.colors.cyan('')).toBe('');
    expect(ui.colors.yellow('')).toBe('');
    expect(ui.colors.bold('')).toBe('');
  });

  it('handles colors with null and undefined', () => {
    const ui = createUi();
    
    // These should not crash
    expect(() => ui.colors.red(null as any)).not.toThrow();
    expect(() => ui.colors.green(undefined as any)).not.toThrow();
  });

  it('handles box with null and undefined content', () => {
    const ui = createUi();
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    // These should not crash
    expect(() => ui.box(null as any)).not.toThrow();
    expect(() => ui.box(undefined as any)).not.toThrow();
    
    log.mockRestore();
  });

  it('handles box with null and undefined title', () => {
    const ui = createUi();
    const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    
    // These should not crash
    expect(() => ui.box('Content', null as any)).not.toThrow();
    expect(() => ui.box('Content', undefined as any)).not.toThrow();
    
    write.mockRestore();
  });

  it('handles spinner with various frame types', () => {
    const ui = createUi();
    
    const frameTypes = ['dots', 'dots2', 'line', 'pipe', 'arrow', 'star', 'earth', 'clock'];
    
    frameTypes.forEach(frameType => {
      const spinner = ui.spinner({ frames: frameType as any });
      expect(spinner).toBeDefined();
      expect(typeof spinner.start).toBe('function');
    });
  });

  it('handles spinner with custom interval', () => {
    const ui = createUi();
    
    const spinner = ui.spinner({ intervalMs: 200 });
    expect(spinner).toBeDefined();
  });

  it('handles spinner with custom prefix and suffix', () => {
    const ui = createUi();
    
    const spinner = ui.spinner({ 
      prefix: '> ', 
      suffix: ' <' 
    });
    expect(spinner).toBeDefined();
  });

  it('handles spinner with custom colors', () => {
    const ui = createUi();
    
    const spinner = ui.spinner({ 
      color: ui.colors.red,
      succeedColor: ui.colors.green,
      failColor: ui.colors.yellow
    });
    expect(spinner).toBeDefined();
  });

  it('handles spinner with custom icons', () => {
    const ui = createUi();
    
    const spinner = ui.spinner({ 
      succeedIcon: '✓',
      failIcon: '✗'
    });
    expect(spinner).toBeDefined();
  });
});
