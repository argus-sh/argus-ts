import { describe, it, expect } from 'vitest';
import { createColors } from '../src/ui/colors.js';

describe('Colors UI', () => {
  it('creates all color functions', () => {
    const colors = createColors();
    
    expect(colors.bold).toBeDefined();
    expect(colors.green).toBeDefined();
    expect(colors.red).toBeDefined();
    expect(colors.yellow).toBeDefined();
    expect(colors.blue).toBeDefined();
    expect(colors.magenta).toBeDefined();
    expect(colors.cyan).toBeDefined();
  });

  it('applies bold formatting', () => {
    const colors = createColors();
    const result = colors.bold('test');
    
    expect(result).toContain('\x1b[1m');
    expect(result).toContain('\x1b[0m');
    expect(result).toContain('test');
  });

  it('applies green color', () => {
    const colors = createColors();
    const result = colors.green('test');
    
    expect(result).toContain('\x1b[32m');
    expect(result).toContain('\x1b[0m');
    expect(result).toContain('test');
  });

  it('applies red color', () => {
    const colors = createColors();
    const result = colors.red('test');
    
    expect(result).toContain('\x1b[31m');
    expect(result).toContain('\x1b[0m');
    expect(result).toContain('test');
  });

  it('applies yellow color', () => {
    const colors = createColors();
    const result = colors.yellow('test');
    
    expect(result).toContain('\x1b[33m');
    expect(result).toContain('\x1b[0m');
    expect(result).toContain('test');
  });

  it('applies blue color', () => {
    const colors = createColors();
    const result = colors.blue('test');
    
    expect(result).toContain('\x1b[34m');
    expect(result).toContain('\x1b[0m');
    expect(result).toContain('test');
  });

  it('applies magenta color', () => {
    const colors = createColors();
    const result = colors.magenta('test');
    
    expect(result).toContain('\x1b[35m');
    expect(result).toContain('\x1b[0m');
    expect(result).toContain('test');
  });

  it('applies cyan color', () => {
    const colors = createColors();
    const result = colors.cyan('test');
    
    expect(result).toContain('\x1b[36m');
    expect(result).toContain('\x1b[0m');
    expect(result).toContain('test');
  });

  it('handles empty string input', () => {
    const colors = createColors();
    
    expect(colors.bold('')).toBe('');
    expect(colors.green('')).toBe('');
    expect(colors.red('')).toBe('');
    expect(colors.yellow('')).toBe('');
    expect(colors.blue('')).toBe('');
    expect(colors.magenta('')).toBe('');
    expect(colors.cyan('')).toBe('');
  });

  it('wraps text with proper ANSI codes', () => {
    const colors = createColors();
    const result = colors.bold('hello world');
    
    expect(result).toBe('\x1b[1mhello world\x1b[0m');
  });

  it('creates new color instance each time', () => {
    const colors1 = createColors();
    const colors2 = createColors();
    
    expect(colors1).not.toBe(colors2);
    expect(colors1.bold('test')).toBe(colors2.bold('test'));
  });
});
